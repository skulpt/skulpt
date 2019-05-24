const fs = require('fs');
const path = require('path');
const program = require('commander');

function run (python3, opt, filename) {
    // Import Skulpt
    var skulptname = 'skulpt.js';
    if (opt) {
	skulptname = 'skulpt.min.js';
    }
    require('../dist/' + skulptname);
    Sk.js_beautify = require('js-beautify').js;

    var pyver, starttime, endtime, elapsed;
    var input = fs.readFileSync(filename, "utf8");

    if (python3) {
	pyver = Sk.python3;
    } else {
	pyver = Sk.python2;
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
	starttime = Date.now();
	return Sk.importMain(path.basename(filename, ".py"), true, true);
    }).then(function () {
	endtime = Date.now();
	console.log("-----");
	elapsed = (endtime - starttime) / 1000;
	console.log("Run time: " + elapsed.toString() + "s");
    }, function(e) {
	console.log("UNCAUGHT EXCEPTION: " + e);
	console.log(e.stack);
    });
}

program
    .option('--python3', 'Python 3')
    .option('-o, --opt', 'use optimized skulpt')
    .option('-p, --program <file>', 'file to run')
    .parse(process.argv);

if (!program.program) {
    console.log("error: option `-p, --program <file>' must specify a program to run");
    process.exit();
}

run(program.python3, program.opt, program.program);
