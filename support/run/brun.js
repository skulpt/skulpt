const express = require('express');
const path = require('path');
const fs = require('fs');
const open = require('open');
const program = require('commander');

const datafilelist = [
    "src/lib/StringIO.py",
    "test/unit/file.txt",
    "skulpt.py"
];

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

function brun(test, fname) {
    let app = express();

    // set the view engine to ejs
    app.set('view engine', 'ejs');

    // Skulpt
    app.use(express.static(path.resolve('dist')));
    let skulpt = skulptName();

    // use res.render to load up an ejs view file
    app.get('/', function (req, res) {
        res.render(path.resolve('support', 'run', 'home_page'), {
        });

    })
    app.get('/run', function (req, res) {
        let prog;
        try {
            // This is for the development server only.
            // We allow reading of any file here
            let fname = req.query['file']
            prog = fs.readFileSync(fname, 'utf8');
        } catch (error) {
            prog = error.toString();
        }
        res.render(path.resolve('support', 'run', 'run_template'), {
            skulpt: skulpt,
            code: prog
        });
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

    // support files
    app.get('/test/unit2.js', function (req, res) {
        res.sendFile(path.resolve('support', 'tmp', 'unit2.js'), {}, function (err) {
            if (err) {
                res.sendStatus(404);
            }
        });
    });

    app.get('/test/unit3.js', function (req, res) {
        res.sendFile(path.resolve('support', 'tmp', 'unit3.js'), {}, function (err) {
            if (err) {
                res.sendStatus(404);
            }
        });
    });

    app.get('/test/runner.js', function (req, res) {
        res.sendFile(path.resolve('support', 'run', 'btestrunner.js'), {}, function (err) {
            if (err) {
                res.sendStatus(404);
            }
        });
    });

    app.use(function (req, res) {
        res.status(404).send('Page not found');
    });


    let port = 8080;

    let url = test ? `http://localhost:${port}/tests`
        : `http://localhost:${port}/run?file=${encodeURIComponent(fname)}`;

    console.log(`Navigate to ${url} if it doesn't open automatically.`);
    try {
        app.listen(port);
    } finally {
        open(url);
    }
}

program
    .option('-t, --test', 'Run test suites')
    .option('-p, --program <file>', 'file to run')
    .parse(process.argv);

if (!program.test && !program.program) {
    console.log("error: option `-p, --program <file>' must specify a program to run");
    process.exit();
}

brun(program.test, program.program);
