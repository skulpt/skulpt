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
        
        // Next Step
        re_nextstep = new RegExp("next"),
        
        //test for empty line.
        re_emptyline = new RegExp("^\\s*$"),
        
        // test for view locals
        re_viewlocals = /view local(s*)( *)(\w*)/,
        
        // test for view globals
        re_viewglobals = /view global(s*)( *)(\w*)/,
        
        // test for help
        re_help = new RegExp("help"),
        
        // cmd list
        cmd_list = {
            "help": "Display the list of commands available in the debugger",
            "run": "Run / Restart the current program in the editor",
            "next": "Step Over to the next instruction",
            "cont": "Continue execution till next breakpoint is hit or application terminates",
            "view locals": "View all the locals at the current execution point",
            "view globals": "View all the globals at the current execution point",
        };
        
    // Debugger
    repl.sk_debugger = new Sk.Debugger(repl),
        
    // code editor
    repl.sk_code_editor = window.code_editor;
    
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
        Sk.configure({
            output: window.jsoutf,
            debugout: window.jsoutf,
            read: window.builtinRead,
            yieldLimit: null,
            execLimit: null,
            debugging: true,
        });
        Sk.canvas = "mycanvas";
        if (repl.sk_code_editor.getValue().indexOf('turtle') > -1 ) {
            $('#mycanvas').show()
        }
        Sk.pre = "edoutput";
        Sk.pre = "codeoutput";
        
        (Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = 'mycanvas';
        try {
            var susp_handlers = {};
            susp_handlers["*"] = repl.sk_debugger.suspension_handler.bind(this);
            repl.sk_debugger.asyncToPromise(function() {
                return Sk.importMainWithBody("<stdin>",true, repl.sk_code_editor.getValue(),true);
            }, susp_handlers, this.sk_debugger);
            // repl.sk_debugger.eval_callback = repl.debug_callback;
            // repl.sk_debugger.execute(function() {
            //     return Sk.importMainWithBody("<stdin>",true, repl.sk_code_editor.getValue(),true);
            //     }, susp_handlers);
        } catch(e) {
            outf(e.toString() + "\n")
        }
    }
    
    repl.continue = function() {
        this.sk_debugger.resume.call(this.sk_debugger);
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
    
    repl.debug_callback = function(suspension) {
        repl.suspension = suspension;
    }
    
    repl.view_locals = function(variable) {
        var suspension = repl.sk_debugger.get_active_suspension();
        if (!hasOwnProperty(suspension, "filename") && suspension.child instanceof Sk.misceval.Suspension)
            suspension = suspension.child;
            
        var locals = suspension.$loc;
        
        if (variable == "") {
            for (var local in locals) {
                repl.print(local + ": " + locals[local].v);
            }
        } else {
            if (hasOwnProperty(locals, variable)) {
                repl.print(variable + ": " + locals[variable].v);
            } else {
                repl.print("No such local variable: " + variable);
            }
        }
    }
    
    repl.view_globals = function(variable) {
        var suspension = repl.sk_debugger.get_active_suspension();
        if (!hasOwnProperty(suspension, "filename") && suspension.child instanceof Sk.misceval.Suspension)
            suspension = suspension.child;
            
        var globals = suspension.$gbl;
        
        if (variable == "") {
            for (var global in globals) {
                repl.print(global + ": " + globals[global].v);
            }
        } else {
            if (hasOwnProperty(globals, variable)) {
                repl.print(variable + ": " + globals[variable].v);
            } else {
                repl.print("No such local variable: " + variable);
            }
        }
    }
    
    repl.display_help = function() {
        for (var cmd in cmd_list) {
            repl.print(cmd + ": " + cmd_list[cmd]);
        }
    }
    
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
            } else if (re_continue.test(lines[0])) {
                this.continue();
            } else if (re_nextstep.test(lines[0])) {
                this.continue();
            } else if (re_viewlocals.test(lines[0])) {
                // get the matches for this.
                var matches = re_viewlocals.exec(lines[0]);
                var variable = null;
                if (matches.length == 4) {
                    variable = matches[3];
                }
                this.view_locals(variable);
            } else if (re_viewglobals.test(lines[0])) {
                // get the matches for this.
                var matches = re_viewglobals.exec(lines[0]);
                var variable = null;
                if (matches.length == 4) {
                    variable = matches[3];
                }
                this.view_globals(variable);
            } else if (re_help.test(lines[0])) {
                this.display_help();
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
    
        
    (function() {
        repl.print("          Skulpt Debugger");
        repl.print("-----------------------------------");
        repl.print("type 'help' for looking at commands");
        repl.print("-----------------------------------");
    })();
});