"use strict"
const express = require('express');
const path = require('path');
const fs = require('fs');
const open = require('open');
const program = require('commander');
const serveIndex = require('serve-index');

const datafilelist = [
    "src/lib/StringIO.py",
    "test/unit/file.txt",
    "skulpt.py"
];
let skulpt = skulptName();


function skulptName() {
    let files = fs.readdirSync("dist");
    for (let idx = 0; idx < files.length; idx++) {
        console.log(files[idx]);
        if (files[idx].match(/^skulpt\..*js$/)) {
            return files[idx];
        }
    }
    throw new Error("No skulpt distribution file, build skulpt first");
}

function getFileNames(dir) {
    let filelist = [];
    let files = fs.readdirSync(dir);

    files.forEach((file) => {
        let fullname = path.resolve(dir, file);
        let stat = fs.statSync(fullname);
        let basename = path.basename(file, ".py");

        if (stat.isFile() && basename.startsWith("test_") && (path.extname(file) == ".py")) {
            filelist.push(dir + '/' + file);
        }
    });

    return filelist;
}

function getFileNamesAndContent(dir) {
    let filelist = {};
    let files = fs.readdirSync(dir);

    files.forEach((file) => {
        let fullname = path.resolve(dir, file);
        let stat = fs.statSync(fullname);
        let basename = path.basename(file, ".py");

        if (stat.isFile() && basename.startsWith("test_") && (path.extname(file) == ".py")) {
            filelist[dir + '/' + file] = fs.readFileSync(fullname).toString();
        }
    });

    return filelist;
}

function showRunner(filePath, req, res) {
    let prog;
    try {
        prog = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        prog = error.toString();
    }
    res.render(path.resolve('support', 'run', 'run_template'), {
        skulpt: skulpt,
        code: '#test \n' + prog
    });
}

let serveIndexOptions = {
    filter: (filename, _index, _files, dir) => {
        const fullPath = path.join(dir, filename);
        try {
            const stat = fs.statSync(fullPath);
            return stat.isDirectory() || path.extname(filename) === '.py';
        } catch (error) {
            return false;
        }
    },
    icons: true,
    view: 'details'
}

function brun(test, fname) {
    let app = express();

    // set the view engine to ejs
    app.set('view engine', 'ejs');

    app.get('/test/unit2.js', function (req, res) {
        let unit2 = getFileNamesAndContent('test/unit');
        res.setHeader('Content-Type', 'application/javascript');
        res.end('Sk.unit2 = { "files": ' + JSON.stringify(unit2, undefined, '  ') + '};');
    })
    app.get('/test/unit3.js', function (req, res) {
        let unit3 = getFileNamesAndContent('test/unit3');
        res.setHeader('Content-Type', 'application/javascript');
        res.end('Sk.unit3 = { "files": ' + JSON.stringify(unit3, undefined, '  ') + '};');
    })
    app.get('/tests', function (req, res) {
        // Test file names
        let unit2 = getFileNames('test/unit');
        let unit3 = getFileNames('test/unit3');

        // Data files
        let filecontents = "";
        datafilelist.forEach(function (file) {
            filecontents += '<textarea id="' + file + '" style="display:none;">\n';
            filecontents += fs.readFileSync(file, 'utf8');
            filecontents += '</textarea>\n';
        });

        res.render(path.resolve('support', 'run', 'test_template'), {
            skulpt: skulpt,
            test2: JSON.stringify(unit2),
            test3: JSON.stringify(unit3),
            files: filecontents
        });

    });


    app.use((req, res, next) => {
        const filePath = path.join('.', req.path);
        if (path.extname(req.path).toLowerCase() === '.py') {
            let relativePath = req.path.substring(1);
            showRunner(relativePath, req, res);
        } else {
            next(); // Continue with normal handling for non-.py files
        }
    });

    app.use(express.static(path.resolve('.')));

    let serveIndex0 = serveIndex('.', serveIndexOptions)
    // Middleware to add a title to serveIndex
    function modifiedServeIndex(req, res, next) {
        let originalEnd = res.end;
        res.end = function (chunk, encoding, callback) {
            if (chunk) {
                let body = chunk.toString();
                body = body.replace(/(<body [^>]+>)/, `$1<h1>${skulpt}</h1>
                <p>Select a python file to run</p>`);
                chunk = Buffer.from(body, 'utf8');
            }
            res.end = originalEnd;
            res.end(chunk, encoding, callback);
        };
        serveIndex0(req, res, next);
    }
    app.use(modifiedServeIndex);

    app.use(function (req, res) {
        res.status(404).send('Page not found');
    });


    let port = 8080;
    let url = test ? `http://localhost:${port}/tests`
        : `http://localhost:${port}/${fname}`;

    console.log(`Navigate to ${url} if it doesn't open automatically.`);
    app.listen(port);
}

program
    .option('-t, --test', 'Run test suites')
    .option('-p, --program <file>', 'file to run')
    .parse(process.argv);

brun(program.test, program.program);
