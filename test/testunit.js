const fs = require('fs');
const path = require('path');

// Import Skulpt
require('../dist/' + process.argv[2]);
Sk.js_beautify = require('js-beautify').js;

// Setup for appropriate Python version
var dir, pyver;

if (process.argv[3] == "python2") {
    dir = "test/unit";
    pyver = Sk.python2;
} else {
    dir = "test/unit3";
    pyver = Sk.python3;
}

var passTot = 0;
var failTot = 0;
var buf, found;

var regexp = /.*Ran.*passed:\s+(\d+)\s+failed:\s+(\d+)/g;

// Configure Skulpt to run unit tests
Sk.configure({
    syspath: [dir],
    read: (fname) => { return fs.readFileSync(fname, "utf8"); },
    output: (args) => { buf += args; },
    __future__: pyver
});

// Test each existing unit test file
var files = fs.readdirSync(dir);
files.forEach((file) => {
    let fullname = dir + "/" + file;
    let stat = fs.statSync(fullname);

    if (stat.isFile() && (path.extname(file) == "\.py")) {
	buf = "";
	console.log(fullname);

	// Run Skulpt
	Sk.misceval.asyncToPromise(function() {
	    return Sk.importMain(path.basename(file, ".py"), false, true);
	}).then(function () {}, function(e) {
	    failTot += 1;
	    console.log("UNCAUGHT EXCEPTION: " + e);
	    console.log(e.stack);
	    process.exit(1);
	});

	// Print results
	console.log(buf);

	// Update results
	while ((found = regexp.exec(buf)) !== null) {
	    passTot += parseInt(found[1]);
	    failTot += parseInt(found[2]);
	}
    }
});

console.log("Summary");
console.log("Passed: " + passTot + " Failed: " + failTot);

