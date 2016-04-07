$(function () {
    var repl = new CodeMirrorREPL('debugger_cm', {
            mode: "python",
            theme: "solarized light",
        }),
        compilableLines = [],

        // Run code regex
        re_run = new RegExp("run"),
        
        // Continue Execution
        re_continue = new RegExp("cont"),
        
        //test for empty line.
        re_emptyline = new RegExp("^\\s*$");

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
    
    repl.setHeight(28 * 10);
    
    repl.run_code = function(code) {
        console.log("Run Code");
    }
    
    repl.continue = function() {
        console.log("End code");
    }
    
    repl.set_breakpoint = function(bp) {
        console.log("Set breakpoint: " + bp);
    }
    
    repl.clear_all_breakpoints = function() {
        console.log("Clear all breakpoints");
    }
    
    repl.clear_breakpoint = function(bp) {
        console.log("Clear Breakpoint " + bp);
    }
    
    repl.debugger = new Sk.Debugger();
    repl.code_editor = window.code_editor;

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

        try {
            //Evaluate
            if (!lines || /^\s*$/.test(lines)) {
                return;
            }
            else if (re_run.test(lines[0])) {
                this.run_code();
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