function rununits(myDiv, pyver) {
    console.log("Running unit tests");
    var mypre = document.getElementById(myDiv+"_pre");

    Sk.inputfun = function(prompt) {
        return new Promise(function (resolve) { resolve(window.prompt(prompt)); });
    };

    mypre.innerHTML = '';

    var dir, units, testfiles;
    if (pyver == "python2") {
	    dir = "test/unit";
	    units = Sk.unit2;
	    testfiles = Sk.unit2files;
    } else if (pyver == "python3") {
	    dir = "test/unit3";
	    units = Sk.unit3;
	    testfiles = Sk.unit3files;
    } else if (pyver == "unitpyangelo") {
	    dir = "test/pyangelo";
	    units = Sk.unitpyangelo;
	    testfiles = Sk.unitpyangelofiles;
    }

    function outf (text) {
        mypre.appendChild(document.createTextNode(text));
        window.scrollTo(0, document.body.scrollHeight);
    }
    function outf_error (text) {
        const spanElement = document.createElement('span')
        spanElement.appendChild(document.createTextNode(text))
        spanElement.style.color = Sk.PyAngelo.textColour
        spanElement.style.color = "#DC143C"
        mypre.appendChild(spanElement)
        window.scrollTo(0, document.body.scrollHeight);
    }

    function outf_test_result (text) {
        const spanElement = document.createElement('span')
        spanElement.appendChild(document.createTextNode(text))
        spanElement.style.color = Sk.PyAngelo.textColour
        if (text.includes("failed: 0")) {
            spanElement.style.color = "#006400"
        } else {
            spanElement.style.color = "#DC143C"
        }
        mypre.appendChild(spanElement)
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

    var idx, test, lastslash, module;
    var modules = [];

    for (idx = 0; idx < testfiles.length; idx++) {
        test = testfiles[idx];
        lastslash = test.lastIndexOf('/');
        module = test.substring(lastslash + 1, test.length - 3);

        modules.push([test, module]);
    }

    function runtest (tests, passed, failed) {
        if (tests.length == 0) {
            outf("Summary: ");
            outf_test_result("passed: " + passed + " failed: " + failed);
            return;
        }

        var test = tests.shift();

        // Clear output buffer
        Sk.buf = "";

        // Print test name
        outf(test[0] + "\n");

        // Reset PyAngelo Data
        Sk.PyAngelo.reset()

        // Run test
        Sk.misceval.asyncToPromise(function() {
            return Sk.importMain(test[1], false, true);
        }).then(function () {
            var found;

            // Print results
            outf_test_result(Sk.buf);

            // Check for internal errors
            if (Sk.buf.indexOf("Uncaught Error in") != -1) {
                outf("Internal uncaught errors, failed: 1\n\n");
                failed += 1;
            }

            // Update results
            while ((found = regexp.exec(Sk.buf)) !== null) {
                passed += parseInt(found[1]);
                failed += parseInt(found[2]);
            }

            // Let the browser update the DOM
            return new Promise(function (resolve) { setTimeout(resolve, 0); });
        }).catch(function (err) {
            failed += 1;
            outf_error("UNCAUGHT EXCEPTION: " + err);
            outf_error(err.stack);
        }).then(function () {
            runtest(tests, passed, failed)
        });
    }

    runtest(modules, 0, 0);
}
