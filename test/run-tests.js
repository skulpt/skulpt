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
    for (const moduleName of ["test_pow", "test_fractions", "test_decimal"]) {
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

switch (process.argv[2] || "all") {
    case "all":
        runJSBITests();
        run("test/generator_suspensions.js");
        run("test/testwrapper.js");
        run("test/testunit.js");
        run("test/testunit.js", "--python3");
        run("test/locale-browser.js");
        break;
    case "jsbi":
        runJSBITests();
        break;
    default:
        throw new Error("Unknown test suite: " + process.argv[2]);
}
