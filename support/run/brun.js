const express = require('express');
const path = require('path');
const fs = require('fs');
const open = require('open');
const program = require('commander');

function brun (python3, debug, fname) {
    var app = express();

    // set the view engine to ejs
    app.set('view engine', 'ejs');

    // Python version
    var pyver;
    if (python3) {
	pyver = "Sk.python3";
    } else {
	pyver = "Sk.python2";
    }

    // Load the program to run
    var prog = fs.readFileSync(fname, 'utf8');

    // Skulpt
    app.use(express.static(path.resolve('dist')));

    // use res.render to load up an ejs view file

    // index page 
    app.get('/', function (req, res) {
	res.render(path.resolve('support', 'run', 'run_template'), {
	    code: prog,
	    debug_mode: debug ? "true" : "false",
	    p3: pyver
	});
    });

    app.listen(8080);
    console.log("Navigate to localhost:8080 if it doesn't open automatically.");
    open('http://localhost:8080');
};

program
    .option('--python3', 'Python 3')
    .option('-d, --debug', 'Debug')
    .option('-p, --program <file>', 'file to run')
    .parse(process.argv);

if (!program.program) {
    console.log("error: option `-p, --program <file>' must specify a program to run");
    process.exit();
}

brun(program.python3, program.debug, program.program);
