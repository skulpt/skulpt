const express = require('express');
const path = require('path');
const fs = require('fs');
const open = require('open');

const filelist = [
    "src/lib/StringIO.py",
    "test/unit/file.txt",
    "skulpt.py"
];


function getFileNames (dir) {
    var filelist = [];
    var files = fs.readdirSync(dir);

    files.forEach((file) => {
	let fullname = path.resolve(dir, file);
	let stat = fs.statSync(fullname);

	if (stat.isFile() && (path.extname(file) == "\.py")) {
	    filelist.push(dir + '/' + file);
	}
    });

    return filelist;
}

function btest () {
    var unit2, unit3;
    
    var app = express();

    // set the view engine to ejs
    app.set('view engine', 'ejs');

    // Test file names
    unit2 = getFileNames('test/unit');
    unit3 = getFileNames('test/unit3');
    
    // Data files
    filecontents = "";
    filelist.forEach(function (file) {
	filecontents += '<textarea id="' + file + '" style="display:none;">\n';
	filecontents += fs.readFileSync(file, 'utf8');
	filecontents += '</textarea>\n';
    });
    
    // Skulpt
    app.use(express.static(path.resolve('dist')));

    // use res.render to load up an ejs view file

    // index page 
    app.get('/', function (req, res) {
	res.render(path.resolve('support', 'test_template'), {
	    test2: JSON.stringify(unit2),
	    test3: JSON.stringify(unit3),
	    files: filecontents,
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
