// Reset imports with the runner, then import the test module by its real name
// for module fixtures. A Python import would restore the runner's Sk.globals;
// the direct import leaves the test module active for globals() and eval().
function runUnitModule(name) {
    const source = [
        "import sys",
        "import unittest",
        "def run(module):",
        "    suite = unittest.defaultTestLoader.loadTestsFromModule(module)",
        "    collected = suite.countTestCases()",
        "    result = unittest.TextTestRunner(stream=sys.stdout).run(suite)",
        "    return [collected, result.testsRun, result.wasSuccessful()]",
    ].join("\n");

    return Sk.misceval.asyncToPromise(() => Sk.misceval.chain(
        Sk.importMainWithBody("unittest_runner", false, source, true),
        (runner) => Sk.misceval.chain(
            Sk.importModule(name, false, true),
            (testModule) => Sk.misceval.callsimOrSuspendArray(runner.$d.run, [testModule])
        )
    )).then((summary) => Sk.ffi.remapToJs(summary));
}

if (typeof module !== "undefined") {
    module.exports = runUnitModule;
}
