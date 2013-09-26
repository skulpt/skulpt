$(function () {
    var repl = new CodeMirrorREPL('interactive', {
        mode: "python",
        theme: "solarized dark",
    });

    var compilableLines = [];
    //finds lines starting with "print"

    var re = new RegExp("\s*print");
    var importre = new RegExp("\s*import");
    var mls = new RegExp("'''");
    var defre = new RegExp("def.*|class.*");

    repl.print("Python 2.6(ish) (skulpt, " + new Date() + ")");
    repl.print("[" + navigator.userAgent + "] on " + navigator.platform);
    repl.print('Don\'t type "help", "copyright", "credits" or "license" unless you\'ve assigned something to them');

    repl.isBalanced = function (code) {
        var lines = code.split('\n');
        var depth = 0;
        var mlsopened = false
        for (var l in lines){
            if (lines[l].match(/'''/) !== null && lines[l].match(/'''/).length == 1) {
                mlsopened = !mlsopened;
            }
            if (!mlsopened && lines[l].substr(lines[l].length -1) == ":") {
                depth++;
            }
            if (!mlsopened && lines[l] == "" && depth > 0){
                depth--;
            }
        }
        return depth == 0 && !mlsopened;
    }

    //Loop
    repl.eval = function (code) {

        Sk.configure({ 
            output: function(str) {
                if (str.replace(/\n/g, "") != ""){
                    repl.print(str);
                }
            }, 
            read: function (x) {
                if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
                    throw "File not found: '" + x + "'";
                return Sk.builtinFiles["files"][x];
            }
        });

        var lines = code.split('\n');

        var linesToCompile = compilableLines.concat(lines);

        if (lines.length == 1) {
            if (lines[0].indexOf('=') == -1 && !defre.test(lines[0]) && !importre.test(lines[0]) && lines[0].length > 0) {
                //Print
                if (!re.test(lines[0])) {
                    linesToCompile.pop();
                    linesToCompile.push("evaluationresult = " + lines[0]);
                    linesToCompile.push("if not evaluationresult == None: print evaluationresult");
                }
                lines.pop();
            }
        }        

        try {
            //Evaluate
            Sk.importMainWithBody("repl", false, linesToCompile.join('\n'));
            //remove print statements when a block is created that doesn't define anything
            var removePrints = false;
            compilableLines = compilableLines.concat(lines.map(function (str) {
                //non defining block statement
                if (str.substr(str.length -1) == ":" && !defre.test(str)) {
                    removePrints = true;
                    return str;
                }
            
                //end of non defining block statement
                if(str == "" && removePrints){
                    removePrints = false;
                    return str;
                }
                
                if (re.test(str) && removePrints) {
                    //strip prints from non defining block statements.
                    return str.replace(/print.*/g, "pass");
                } else {
                    return str;
                }
            }));
        } catch (err) {
            repl.print(err);

            var index = -1;
            //find the line number
            if ((index = err.toString().indexOf("on line")) != -1) {
                index = parseInt(err.toString().substr(index + 8), 10);
            }
            var line = 0;
            //print the accumulated code with a ">" before the broken line.
            //Don't add the last statement to the accumulated code
            repl.print(linesToCompile.map(function (str) {
                return ++line + (index == line ? ">" : " ") + ": " + str;
            }).join('\n'));
        }
    }
});