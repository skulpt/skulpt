const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const acorn = require("acorn");
const { spawnSync } = require("child_process");
const checkCompatSyntax = require("./compat-syntax");

const COMPAT_LANGUAGE_OUT = "ECMASCRIPT_2018";
const COMPAT_ECMA_VERSION = 2018;

function run(...args) {
    const result = spawnSync(process.execPath, args, { stdio: "inherit" });
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}

function readBuildInfo(coreFile) {
    const context = { console, TextEncoder, TextDecoder, setTimeout, clearTimeout };
    vm.runInNewContext(fs.readFileSync(coreFile, "utf8"), context);
    return context.Sk.build;
}

function builtCoreHasFallbacks() {
    const coreFile = fs.existsSync("dist/skulpt.min.js") ? "dist/skulpt.min.js" : "dist/skulpt.js";
    return !readBuildInfo(coreFile).nativeOnly;
}

function requireFallbackBuild() {
    if (!builtCoreHasFallbacks()) {
        console.error(
            "The built core omits compatibility fallbacks. Run 'npm run devbuild' or " +
            `'npm run build -- --env.languageOut=${COMPAT_LANGUAGE_OUT}' first.`
        );
        process.exit(1);
    }
}

function checkFallbackBundling(es2020Core, compatCore, devCore, stdlibDir) {
    for (const [file, expectedLanguageOut, includesFallbacks] of [
        [es2020Core, "ECMASCRIPT_2020", false],
        [compatCore, COMPAT_LANGUAGE_OUT, true],
    ]) {
        const core = fs.readFileSync(file, "utf8");
        const build = readBuildInfo(file);
        assert.strictEqual(build.languageOut, expectedLanguageOut, file + ": unexpected Sk.build.languageOut");
        assert.strictEqual(build.nativeOnly, !includesFallbacks, file + ": unexpected Sk.build.nativeOnly");
        if (includesFallbacks) {
            checkCompatSyntax(core, COMPAT_ECMA_VERSION);
        } else {
            acorn.parse(core, { ecmaVersion: 2020 });
        }
        const sources = JSON.parse(fs.readFileSync(file + ".map", "utf8")).sources;
        for (const dependency of [/node_modules\/jsbi\//, /support\/polyfills\/UnicodeData\.js$/]) {
            assert.strictEqual(
                sources.some((source) => dependency.test(source)),
                includesFallbacks,
                file + ": unexpected dependency inclusion: " + dependency
            );
        }
    }

    const devBuild = readBuildInfo(devCore);
    assert.strictEqual(devBuild.languageOut, null, devCore + ": unexpected Sk.build.languageOut");
    assert.strictEqual(devBuild.nativeOnly, false, devCore + ": unexpected Sk.build.nativeOnly");
    console.log("Build targets contain only their intended compatibility dependencies");

    // re detects optional regex features at runtime, including in a packaged stdlib.
    // Parse JS up to ES2020 while requiring ES2015 regex literals.
    const context = { Sk: {} };
    vm.runInNewContext(fs.readFileSync(path.join(stdlibDir, "skulpt-stdlib.js"), "utf8"), context);
    const source = context.Sk.builtinFiles.files["src/lib/re.js"];
    assert.strictEqual(typeof source, "string", "Packaged re source is missing");
    checkCompatSyntax(source, 2020);
    console.log("Packaged re keeps optional regex syntax in runtime constructors");
}

function runJSBITests() {
    console.log("Testing numeric modules with JSBI");
    for (const moduleName of ["test_int", "test_pow", "test_fractions", "test_decimal"]) {
        run(
            "--require",
            "./test/force-jsbi.js",
            "test/testunit.js",
            "--python3",
            "--module",
            moduleName
        );
    }
}

function runUnicodeFallbackTests() {
    console.log("Testing with Unicode property escapes disabled");
    // Each suite starts in a fresh process with the capability disabled before startup.
    for (const moduleName of ["test_re", "skulpt_re", "string_functions"]) {
        run(
            "--require",
            "./test/force-unicode-fallback.js",
            "test/testunit.js",
            "--python3",
            "--module",
            moduleName
        );
    }
}

function runRuntimeTests() {
    if (!fs.existsSync("dist/skulpt-stdlib.js")) {
        console.error("dist/skulpt-stdlib.js is missing. Run 'npm run build' or 'npm run devbuild' first.");
        process.exit(1);
    }

    const webpack = require.resolve("webpack/bin/webpack.js");
    const outputDir = "support/tmp/runtime-test";
    const distProd = fs.existsSync("dist/skulpt.min.js") ? "dist/skulpt.min.js" : null;
    const distBuild = distProd ? readBuildInfo(distProd) : null;

    let es2020Core;
    if (distBuild && distBuild.languageOut === "ECMASCRIPT_2020") {
        es2020Core = distProd;
    } else {
        const es2020Dir = `${outputDir}/es2020`;
        run(webpack, "--mode", "production", "--env.languageOut=ECMASCRIPT_2020", "--output-path", es2020Dir);
        es2020Core = `${es2020Dir}/skulpt.min.js`;
    }

    let compatCore;
    if (distBuild && distBuild.languageOut === COMPAT_LANGUAGE_OUT) {
        compatCore = distProd;
    } else {
        const compatDir = `${outputDir}/compat`;
        run(webpack, "--mode", "production", `--env.languageOut=${COMPAT_LANGUAGE_OUT}`, "--output-path", compatDir);
        compatCore = `${compatDir}/skulpt.min.js`;
    }

    const devDir = `${outputDir}/development`;
    run(webpack, "--mode", "development", "--output-path", devDir);
    const devCore = `${devDir}/skulpt.js`;

    checkFallbackBundling(es2020Core, compatCore, devCore, "dist");
    for (const moduleName of ["test_int", "test_re", "skulpt_re", "string_functions"]) {
        run("test/testunit.js", "--python3", "--core", es2020Core, "--module", moduleName);
    }
    for (const coreFile of [es2020Core, compatCore, devCore]) {
        run("--allow-natives-syntax", "test/v8-properties.js", coreFile);
    }
    for (const coreFile of [es2020Core, compatCore]) {
        run("test/locale-browser.js", coreFile);
    }
}

switch (process.argv[2] || "all") {
    case "all": {
        const hasFallbacks = builtCoreHasFallbacks();
        if (hasFallbacks) {
            runJSBITests();
        } else {
            console.log("Skipping JSBI and Unicode fallback tests (built core omits fallbacks)");
        }
        run("test/generator_suspensions.js");
        run("test/testwrapper.js");
        run("test/testunit.js");
        run("test/testunit.js", "--python3");
        if (hasFallbacks) {
            runUnicodeFallbackTests();
        }
        break;
    }
    case "jsbi":
        requireFallbackBuild();
        runJSBITests();
        break;
    case "unicode-fallback":
        requireFallbackBuild();
        runUnicodeFallbackTests();
        break;
    case "runtime":
        runRuntimeTests();
        break;
    default:
        throw new Error("Unknown test suite: " + process.argv[2]);
}
