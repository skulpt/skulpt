const fs = require('fs');
const path = require('path');

// Import Skulpt
require('../dist/' + process.argv[2]);
Sk.js_beautify = require('js-beautify').js;

var dir, pyver;

if (process.argv[3] == "python2") {
    dir = "test/unit";
    pyver = Sk.python2;
} else {
    dir = "test/unit3";
    pyver = Sk.python3;
}

// Run each unit test
var files = fs.readdirSync(dir);
var passTot = 0;
var failTot = 0;
var input, buf, found;

var regexp = /.*Ran.*passed:\s+(\d+)\s+failed:\s+(\d+)/g;

files.forEach((file) => {
    let fullname = dir + "/" + file;
    let stat = fs.statSync(fullname);

    if (stat.isFile() && (path.extname(file) == "\.py")) {
	input = fs.readFileSync(fullname, "utf8");
	buf = "";
	console.log(fullname);

	Sk.configure({
	    syspath: [dir],
	    read: (fname) => { return fs.readFileSync(fname, "utf8"); },
	    output: (args) => { buf += args; },
	    __future__: pyver
	});

	Sk.misceval.asyncToPromise(function() {
	    return Sk.importMain(path.basename(file, ".py"), false, true);
	}).then(function () {}, function(e) {
	    failTot += 1;
	    console.log("UNCAUGHT EXCEPTION: " + e);
	    console.log(e.stack);
	    process.exit(1);
	});

	console.log(buf);
	
	while ((found = regexp.exec(buf)) !== null) {
	    passTot += parseInt(found[1]);
	    failTot += parseInt(found[2]);
	}
    }
});

console.log("Summary");
console.log("Passed: " + passTot + " Failed: " + failTot);

