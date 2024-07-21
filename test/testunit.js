const fs = require('fs');
const path = require('path');
const program = require('commander');
const reqskulpt = require('../support/run/require-skulpt').requireSkulpt;

function test (python3, opt, module = undefined) {
    var startime, endtime, elapsed;

    // Import Skulpt
    var skulpt = reqskulpt(false);
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

    const regexp = /.*Ran.*passed:\s+(\d+)\s+failed:\s+(\d+)/g;

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

    function runtest (tests, passed, failed) {
        if (tests.length == 0) {
            endtime = Date.now();
            elapsed = (endtime - starttime) / 1000;
            console.log("Summary");
            console.log("Passed: " + passed + " Failed: " + failed);
            console.log("Total run time for all unit tests: " + elapsed.toString() + "s");
            if (failed > 0) {
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
        Sk.misceval.asyncToPromise(function() {
            return Sk.importMain(test[1], false, true);
        }).then(function () {
            var found;

            // Print results
            console.log(Sk.buf);

            // Check for internal errors
            if (Sk.buf.indexOf("Uncaught Error in") != -1) {
                console.log("Internal uncaught errors, failed: 1\n");
                failed += 1;
            }

            // Update results
            while ((found = regexp.exec(Sk.buf)) !== null) {
                passed += parseInt(found[1]);
                failed += parseInt(found[2]);
            }
        }).catch(function (err) {
            failed += 1;
            console.log("UNCAUGHT EXCEPTION: " + err);
            console.log(err.stack);
        }).then(function () {
            runtest(tests, passed, failed)
        });
    }

    runtest(modules, 0, 0);
}

program
    .option('--python3', 'Python 3')
    .option('-o, --opt', 'use optimized skulpt')
    .option('--module <module>', 'test specific module')
    .parse(process.argv);

test(program.python3, program.opt, program.module);
