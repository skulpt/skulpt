const reqskulpt = require("../support/run/require-skulpt").requireSkulpt;
const program = require("commander");
const chalk = require("chalk");

// Import Skulpt
var skulpt = reqskulpt(false);
if (skulpt === null) {
    process.exit(1);
}

var readlineSync = require("readline-sync");
var fs = require("fs");

var readline = function () {
    return readlineSync.question("", { keepWhitespace: true });
};

program.parse(process.argv);

if (program.args.length != 1) {
    console.log(chalk.red("error: must specify python version (py2/py3)"));
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

Sk.configure({
    output: (args) => { process.stdout.write(args); },
    read: (fname) => { return fs.readFileSync(fname, "utf8"); },
    systemexit: true,
    retainGlobals: true,
    inputfun: readline,
    __future__: py3 ? Sk.python3 : Sk.python2,
});

Sk.globals = { __name__: new Sk.builtin.str("__main__")};

var //finds lines starting with "print"
    re = new RegExp("\\s*print"),
    //finds import statements
    importre = new RegExp("\\s*import"),
    //finds defining statements
    defre = new RegExp("def.*|class.*"),
    //test for empty line.
    comment = new RegExp("^#.*"),
    //a regex to check if a line is an assignment
    //this regex checks whether or not a line starts with
    //an identifier followed with some whitspace and then an = and then some more white space.
    //it also checks if the identifier is a tuple.
    assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))([+-/*%&\^\|]?|[/<>*]{2})=/,
    lines = [],
    origLines,
    printevaluationresult;

if (Sk.__future__.python3) {
    console.log("Python 3.7(ish) (skulpt, " + new Date() + ")");
    printevaluationresult = "if not evaluationresult == None: print(repr(evaluationresult))";
} else {
    console.log("Python 2.7(ish) (skulpt, " + new Date() + ")");
    printevaluationresult = "if not evaluationresult == None: print repr(evaluationresult)";
}
console.log("[node: " + process.version + "] on a system");
console.log('Don\'t type "help", "copyright", "credits" or "license" unless you\'ve assigned something to them');

function isBalanced(lines) {
    "use strict";
    var depth = 0,
        mlsopened = false,
        l;

    for (l = 0; l < lines.length; l = l + 1) {
        if (lines[l] !== undefined) {
            if (lines[l].match(/'''|"""/) !== null && lines[l].match(/'''|"""/).length === 1) {
                mlsopened = !mlsopened;
            }
            if (!mlsopened && lines[l].substr(lines[l].length - 1) === ":") {
                depth = depth + 1;
            }
            if (!mlsopened && lines[l] === "" && depth > 0) {
                depth = 0;
            }
        }
    }
    return depth === 0 && !mlsopened;
}

//Loop
while (true) {
    process.stdout.write(isBalanced(lines) ? ">>> " : "... ");

    //Read
    var l = readline();
    if (l === undefined) {
        process.exit();
    }
    lines.push(l);

    //See if it is ready to be evaluated;
    if (!isBalanced(lines)) { continue; }

    origLines = lines.slice();

    //it's a one-liner
    if (lines.length === 1) {
        //if it's a statement that should be printed (not containing an = or def or class or an empty line)
        if (!assignment.test(lines[0]) && !defre.test(lines[0]) && !importre.test(lines[0]) && !comment.test(lines[0]) && lines[0].length > 0) {
            //if it doesn't contain print make sure it doesn't print None
            if (!re.test(lines[0])) {
                //remove the statement
                //evaluate it if nessecary
                lines.push("evaluationresult = " + lines.pop());
                //print the result if not None
                lines.push(printevaluationresult);
            }
        }
    }

    try {
        //Evaluate
        if (!lines || /^\s*$/.test(lines)) {
            continue;
        } else {
            Sk.importMainWithBody("repl", false, lines.join("\n"));
        }
    } catch (err) {
        if (err instanceof Sk.builtin.SystemExit) {
            process.exit();
        }

        console.log(err.toString());

        var index = -1;
        //find the line number
        if ((index = err.toString().indexOf("on line")) !== -1) {
            index = parseInt(err.toString().substr(index + 8), 10);
        }
        var line = 0;
        //print the accumulated code with a ">" before the broken line.
        //Don't add the last statement to the accumulated code
        console.log(origLines.map(function (str) {
            return ++line + (index === line ? ">" : " ") + ": " + str;
        }).join("\n"));
    } finally {
        lines = [];
    }
}
