const express = require('express');
const path = require('path');
const fs = require('fs');
const open = require('open');

function getFileNames (dir) {
    var filelist = [];
    var files = fs.readdirSync(dir);

    files.forEach((file) => {
	let fullname = path.resolve(dir, file);
	let stat = fs.statSync(fullname);

	if (stat.isFile() && (path.extname(file) == "\.py")) {
	    filelist.push(fullname);
	}
    });

    return filelist;
}

function getFiles (names) {
    var files = {};
    var contents;
    
    names.forEach((name) => {
	contents = fs.readFileSync(name, "utf8");
	files[path.basename(name, ".py")] = contents;
    });

    return files;
}

function btest () {
    var dir2, dir3, unit2, unit3, unit2files, unit3files;
    
    var app = express();

    // set the view engine to ejs
    app.set('view engine', 'ejs');

    // Test file names
    dir2 = path.resolve('test', 'unit');
    unit2 = getFileNames(dir2);
    dir3 = path.resolve('test', 'unit3');
    unit3 = getFileNames(dir3);

    // Test files
    unit2files = getFiles(unit2);
    unit3files = getFiles(unit3);
    
    // Skulpt
    app.use(express.static(path.resolve('dist')));

    // use res.render to load up an ejs view file

    // index page 
    app.get('/', function (req, res) {
	res.render(path.resolve('support', 'test_template'), {
	    debug_mode: "false"
	});
    });

    app.get('/test/unit2.js', function (req, res) {
	var contents = fs.readFileSync(path.resolve('support', 'tmp', 'unit2.js'), 'utf8');
	res.send(contents);
    });
    
    app.get('/test/unit3.js', function (req, res) {
	var contents = fs.readFileSync(path.resolve('support', 'tmp', 'unit3.js'), 'utf8');
	res.send(contents);
    });
    
    app.get('/test/runner.js', function (req, res) {
	var contents = fs.readFileSync(path.resolve('support', 'btestrunner.js'), 'utf8');
	res.send(contents);
    });
    
    app.listen(8080);
    console.log("Navigate to localhost:8080 if it doesn't open automatically.");
    open('http://localhost:8080');
};

btest();
