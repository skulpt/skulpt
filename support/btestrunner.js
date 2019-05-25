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
    
    function showjs (text) {
	var mypre = document.getElementById("runbrowser_jsout");
	mypre.innerHTML = '';
	mypre.appendChild(document.createTextNode(text));
    }

    function myread (f) {
	if (units["files"][f] !== undefined) {
	    return units["files"][f];
	}

	if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][f] === undefined) {
            throw "File not found: '" + f + "'";
	}
 	
	return Sk.builtinFiles["files"][f];
    };

    function starttest (test, module) {
    };

    var passTot = 0;
    var failTot = 0;
    var regexp = /.*Ran.*passed:\s+(\d+)\s+failed:\s+(\d+)/g;

    Sk.buf = "";
    
    Sk.configure({
	syspath: [dir],
        output: function (args) { Sk.buf += args; },
        read: myread,
        inputfunTakesPrompt: true,
        debugout: showjs,
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
    
    function runtest (index) {
	var test = modules[index][0];
	var module = modules[index][1];
	
	// Clear output buffer
	Sk.buf = "";

	// Print test name
	outf(test + "\n");

	// Run test
	Sk.misceval.asyncToPromise(function() {
	    return Sk.importMain(module, false, true);
	}).then(function () {
	    var found;
	    
	    // Print results
	    outf(Sk.buf);
	    
	    // Update results
	    while ((found = regexp.exec(Sk.buf)) !== null) {
		passTot += parseInt(found[1]);
		failTot += parseInt(found[2]);
	    }	    
	    
	    // Let the browser update the DOM
	    return new Promise(function (resolve) { setTimeout(resolve, 0); });
	}).catch(function (e) {
	    failTot += 1;
	    outf("UNCAUGHT EXCEPTION: " + e);
	    outf(e.stack);
	}).then(function () {
	    index += 1;
	    if (index < modules.length) {
		runtest(index);
	    } else {
		outf("Summary");
		outf("Passed: " + passTot + " Failed: " + failTot);
	    }
	});
    }

    runtest(0);    
}
