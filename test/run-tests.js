const { spawnSync } = require("child_process");

function run(...args) {
    const result = spawnSync(process.execPath, args, { stdio: "inherit" });
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
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
    const webpack = require.resolve("webpack/bin/webpack.js");
    const outputDir = "support/tmp/runtime-test";
    for (const mode of ["production", "development"]) {
        run(webpack, "--mode", mode, "--output-path", `${outputDir}/${mode}`);
    }

    const productionCore = `${outputDir}/production/skulpt.min.js`;
    const developmentCore = `${outputDir}/development/skulpt.js`;
    run("test/compat-syntax.js", productionCore);
    for (const coreFile of [productionCore, developmentCore]) {
        run("--allow-natives-syntax", "test/v8-properties.js", coreFile);
    }
    run("test/locale-browser.js", productionCore);
}

function runModernTests() {
    run("test/build-variants.js");
    const productionCore = "dist/modern/skulpt.modern.min.js";
    run("test/testunit.js", "--python3", "--core", productionCore);
    const webpack = require.resolve("webpack/bin/webpack.js");
    const outputDir = "support/tmp/modern-runtime-test";
    run(webpack, "--mode", "development", "--env.nativeOnly", "--output-path", outputDir);
    for (const coreFile of [productionCore, `${outputDir}/skulpt.modern.js`]) {
        run("--allow-natives-syntax", "test/v8-properties.js", coreFile);
    }
}

switch (process.argv[2] || "all") {
    case "all":
        runJSBITests();
        run("test/generator_suspensions.js");
        run("test/testwrapper.js");
        run("test/testunit.js");
        run("test/testunit.js", "--python3");
        runUnicodeFallbackTests();
        runRuntimeTests();
        break;
    case "jsbi":
        runJSBITests();
        break;
    case "unicode-fallback":
        runUnicodeFallbackTests();
        break;
    case "modern":
        runModernTests();
        break;
    case "runtime":
        runRuntimeTests();
        break;
    default:
        throw new Error("Unknown test suite: " + process.argv[2]);
}
