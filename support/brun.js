const express = require('express');
const path = require('path');
const fs = require('fs');
const open = require('open');

var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

// Python version
var pyver;
if (process.argv[2] == "python2") {
    pyver = "Sk.python2";
} else {
    pyver = "Sk.python3";
}

// Load the program to run
var prog = fs.readFileSync(process.argv[3], 'utf8');

// Skulpt
app.use(express.static(path.resolve('dist')));

// use res.render to load up an ejs view file

// index page 
app.get('/', function (req, res) {
    res.render(path.resolve('support', 'run_template'), {
	code: prog,
	debug_mode: "false",
	p3: pyver
    });
});

app.listen(8080);
console.log("Navigate to localhost:8080 if it doesn't open automatically.");
open('http://localhost:8080');
