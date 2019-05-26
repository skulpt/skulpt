function rununits(myDiv, pyver) {
    var mypre = document.getElementById(myDiv+"_pre");

    Sk.inputfun = function(prompt) {
        return new Promise(function (resolve) { resolve(window.prompt(prompt)); });
    };

    mypre.innerHTML = '';

    var dir = (pyver == "python2") ? "test/unit" : "test/unit3";
    var units = (pyver == "python2") ? Sk.unit2 : Sk.unit3;

    function outf (text) {
        mypre.appendChild(document.createTextNode(text));
        window.scrollTo(0, document.body.scrollHeight);
    }

    function readf (f) {
        if (units["files"][f] !== undefined) {
            return units["files"][f];
        }

        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][f] === undefined) {
            throw "File not found: '" + f + "'";
        }

        return Sk.builtinFiles["files"][f];
    };

    const regexp = /.*Ran.*passed:\s+(\d+)\s+failed:\s+(\d+)/g;

    Sk.buf = "";

    Sk.configure({
        syspath: [dir],
        output: function (args) { Sk.buf += args; },
        read: readf,
        debugging: false,
        __future__: pyver == "python2" ? Sk.python2 : Sk.python3
    });

    var modules = [];

    for (var test in units["files"]) {
        if (units["files"].hasOwnProperty(test)) {
            var lastslash = test.lastIndexOf('/');
            var module = test.substring(lastslash + 1, test.length - 3);

            modules.push([test, module]);
        }
    }

    function runtest (tests, passed, failed) {
        if (tests.length == 0) {
            outf("Summary");
            outf("Passed: " + passed + " Failed: " + failed);
            return;
        }

        var test = tests.shift();

        // Clear output buffer
        Sk.buf = "";

        // Print test name
        outf(test[0] + "\n");

        // Run test
        Sk.misceval.asyncToPromise(function() {
            return Sk.importMain(test[1], false, true);
        }).then(function () {
            var found;

            // Print results
            outf(Sk.buf);

            // Update results
            while ((found = regexp.exec(Sk.buf)) !== null) {
                passed += parseInt(found[1]);
                failed += parseInt(found[2]);
            }

            // Let the browser update the DOM
            return new Promise(function (resolve) { setTimeout(resolve, 0); });
        }).catch(function (err) {
            failed += 1;
            outf("UNCAUGHT EXCEPTION: " + err);
            outf(err.stack);
        }).then(function () {
            runtest(tests, passed, failed)
        });
    }

    runtest(modules, 0, 0);
}
