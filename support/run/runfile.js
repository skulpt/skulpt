const fs = require('fs');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');
const reqskulpt = require('./require-skulpt').requireSkulpt;

function run (python3, opt, filename) {
    // Import Skulpt
    var skulpt = reqskulpt(opt);
    if (skulpt === null) {
	process.exit(1);
    }

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
    .option('-o, --opt', 'use optimized skulpt')
    .parse(process.argv);

if (program.args.length != 2) {
    console.log(chalk.red("error: must specify python version (py2/py3) and python program to run"));
    process.exit(1);
}

var py3;
if (program.args[0] == "py2") {
    py3 = false;
} else if (program.args[0] == "py3") {
    py3 = true;
} else {
    console.log(chalk.red("error: must specify python version ('py2' or 'py3'), not '" + program.args[0] + "'"));
    process.exit(1);
}

run(py3, program.opt, program.args[1]);
