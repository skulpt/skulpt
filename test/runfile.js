const fs = require('fs');
const path = require('path');

// Import Skulpt
require('../dist/' + process.argv[2]);
Sk.js_beautify = require('js-beautify').js;

var pyver;
var filename = process.argv[4];
var input = fs.readFileSync(filename, "utf8");

if (process.argv[3] == "python2") {
    pyver = Sk.python2;
} else {
    pyver = Sk.python3;
}

console.log("-----");
console.log(input);
console.log("-----");

Sk.configure({
    syspath: [path.dirname(filename)],
    read: (fname) => { return fs.readFileSync(fname, "utf8"); },
    output: (args) => { process.stdout.write(args); },
    __future__: pyver
});

Sk.misceval.asyncToPromise(function() {
    return Sk.importMain(path.basename(filename, ".py"), true, true);
}).then(function () {
    console.log("-----");
}, function(e) {
    console.log("UNCAUGHT EXCEPTION: " + e);
    console.log(e.stack);
});
