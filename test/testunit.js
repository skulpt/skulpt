const fs = require('fs');
const path = require('path');
const program = require('commander');
const runUnitModule = require('../support/run/unittest');
const reqskulpt = require('../support/run/require-skulpt').requireSkulpt;

function test (python3, opt, module = undefined, core = undefined) {
    var starttime, endtime, elapsed;

    // Import Skulpt
    var skulpt = core ? require(path.resolve(core)) : reqskulpt(false);
    if (skulpt === null) {
        process.exit(1);
    }

    Sk.js_beautify = require('js-beautify').js;

    // Setup for appropriate Python version
    var dir, pyver;

    if (python3) {
        dir = "test/unit3";
        pyver = Sk.python3;
    } else {
        dir = "test/unit";
        pyver = Sk.python2;
    }

    // Configure Skulpt to run unit tests
    Sk.configure({
        syspath: [dir],
        read: (fname) => { return fs.readFileSync(fname, "utf8"); },
        output: (args) => { Sk.buf += args; },
        __future__: pyver
    });

    // Test each existing unit test file
    var files = fs.readdirSync(dir);
    var modules = [];

    for (var idx = 0; idx < files.length; idx++) {
        let file = dir + "/" + files[idx];
        let stat = fs.statSync(file);
        let basename = path.basename(file, ".py");

        if (stat.isFile() && basename.startsWith("test_") && path.extname(file) == ".py") {
            if (module && !basename.endsWith(module)) {
                continue;
            }

            modules.push([file, basename]);
        } else if (stat.isDirectory() && basename.startsWith("test_")) {
            if (!fs.statSync(file + "/__init__.py").isFile()) {
                continue;
            }
            if (module && !basename.endsWith(module)) {
                continue;
            }
            modules.push([file + ".py", path.basename(file + ".py", ".py")]);
        }
    }

    starttime = Date.now();

    function runtest (tests, collected, started, failedModules) {
        if (tests.length == 0) {
            endtime = Date.now();
            elapsed = (endtime - starttime) / 1000;
            console.log("Summary");
            console.log("Collected: " + collected + " Started: " + started + " Failed modules: " + failedModules.length);
            for (const file of failedModules) {
                console.log("  " + file);
            }
            console.log("Total run time for all unit tests: " + elapsed.toString() + "s");
            if (failedModules.length > 0) {
                process.exit(1);
            }
            return;
        }

        var test = tests.shift();

        // Clear output buffer
        Sk.buf = "";

        // Print test name
        console.log(test[0] + "\n");

        // Run test
        runUnitModule(test[1]).then(function ([moduleCollected, moduleStarted, successful]) {
            console.log(Sk.buf);
            collected += moduleCollected;
            started += moduleStarted;
            if (!successful) {
                failedModules.push(test[0]);
            }
        }).catch(function (err) {
            failedModules.push(test[0]);
            console.log(Sk.buf);
            console.log("UNCAUGHT EXCEPTION: " + err);
            console.log(err.stack);
        }).then(function () {
            runtest(tests, collected, started, failedModules);
        });
    }

    if (modules.length === 0) {
        console.error("No test modules matched");
        process.exitCode = 1;
        return;
    }
    runtest(modules, 0, 0, []);
}

program
    .option('--python3', 'Python 3')
    .option('-o, --opt', 'use optimized skulpt')
    .option('--module <module>', 'test specific module')
    .option('--core <file>', 'test a specific built Skulpt core')
    .parse(process.argv);

test(program.python3, program.opt, program.module, program.core);
