$(function () {
    var repl = new CodeMirrorREPL('interactive', {
            mode: "python",
            theme: "solarized dark"
        }),
        compilableLines = [],
        //finds lines starting with "print" 
        re = new RegExp("\\s*print"),
        //finds import statements
        importre = new RegExp("\\s*import"),
        //finds multuline string constants
        mls = new RegExp("'''"),
        //finds defining statements
        defre = new RegExp("def.*|class.*"),
        //test for empty line.
        emptyline = new RegExp("^\\s*$"),
        //a regex to check if a line is an assignment
        //this regex checks whether or not a line starts with 
        //an identifier followed with some whitspace and then an = and then some more white space.
        //it also checks if the identifier is a tuple.
        assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/;

    repl.print("Python 2.6(ish) (skulpt, " + new Date() + ")");
    repl.print("[" + navigator.userAgent + "] on " + navigator.platform);
    repl.print('Don\'t type "help", "copyright", "credits" or "license" unless you\'ve assigned something to them');

    repl.isBalanced = function (code) {
        var lines = code.split('\n'),
            depth = 0,
            mlsopened = false,
			l;
        
        for (l = 0; l < lines.length; l = l + 1) {
            if (lines[l].match(/'''/) !== null && lines[l].match(/'''/).length === 1) {
                mlsopened = !mlsopened;
            }
            if (!mlsopened && lines[l].substr(lines[l].length - 1) === ":") {
                depth = depth + 1;
            }
            if (!mlsopened && lines[l] === "" && depth > 0) {
                depth = 0   ;
            }
        }
        return depth === 0 && !mlsopened;
    };

    //Loop
    repl.eval = function (code) {
        Sk.configure({ 
            output: function(str) {
                //strip out line-feeds
                if (str.replace(/\n/g, "") !== "") {
                    repl.print(str);
                }
            },
            read: function (x) {
                if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
                    throw "File not found: '" + x + "'";
				}
                return Sk.builtinFiles["files"][x];
            },
			retainglobals: true
        });
            
        //split lines on linefeed
        var lines = code.split('\n'), index = -1, line = 0;

        //it's a onliner
        if (lines.length === 1) {
            //if it's a statement that should be printed (not containing an = or def or class or an empty line)
            if (!assignment.test(lines[0]) && !defre.test(lines[0]) && !importre.test(lines[0]) && lines[0].length > 0) {
                //if it doesn't contain print make sure it doesn't print None
                if (!re.test(lines[0])) {
                    //remove the statement
                    //evaluate it if nessecary
                    lines.push("evaluationresult = " + lines.pop());
                    //print the result if not None
                    lines.push("if not evaluationresult == None: print repr(evaluationresult)");
                }
            }
        }

		try {
            //Evaluate
            if (!lines || /^\s*$/.test(lines)) {
                return;
            }
            else {
                Sk.importMainWithBody("repl", false, lines.join('\n'));            
            }
        } catch (err) {
            repl.print(err);

            //find the line number
            if ((index = err.toString().indexOf("on line")) !== -1) {
                index = parseInt(err.toString().substr(index + 8), 10);
            }
			
            //print the accumulated code with a ">" before the broken line.
            //Don't add the last statement to the accumulated code
            lines.forEach(function (str) {
                repl.print(++line + (index === line ? ">" : " ") + ": " + str);
            });
        }
    };
});