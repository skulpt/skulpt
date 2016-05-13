$(function () {
    var repl = new CodeMirrorREPL('debugger_cm', {
            mode: "python",
            theme: "solarized light",
        }),

        compilableLines = [],

        // Run code regex
        re_run = /\brun\b/,
        
        // Continue
        re_cont = /\bcont\b/,
        
        // Step instruction
        re_step = /\bstep\b/,
        
        //test for empty line.
        re_emptyline = /^\\s*$/,
        
        // test for view locals
        re_viewlocals = /view local(s*)( *)(\w*)/,
        
        // test for view globals
        re_viewglobals = /view global(s*)( *)(\w*)/,
        
        // test for help
        re_help = /\bhelp\b/,
        
        // test for set breakpoints
        re_break = /\bbreak\b (\d+)/,
        
        // test for temporary breakpoints
        re_tbreak = /\btbreak\b (\d+)/,
        
        // test for where command
        re_where = /\bwhere\b/,
        
        // test for view breakpoints
        re_view_bp = /\bview bp\b/,
        
        // test for clear breakpoints
        re_clear_bp = /\bclear\b( \d+)+/,

        // test for disable breakpoints
        re_disable_bp = /\bdisable\b( \d+)+/,
        
        // test for enable breakpoints
        re_enable_bp = /\benable\b( \d+)+/,
        
        // test for ignore count breakpoint
        re_ignore_count = /\bignore count\b (\d+) (\d+)/,

        // test for current execution line
        re_list = /\blist\b/,
        
        // test for going up the stack
        re_up = /up/,
        
        // test for going down the stack
        re_down = /down/,
        
        // editor filename
        editor_filename = "<stdin>",
        
        // cmd list
        cmd_list = {
            "help": "Display the list of commands available in the debugger",
            "where": "Print the stack trace",
            "down": "Move the current frame one level down in the stack trace (to a newer frame)",
            "up": "Move the current frame one level up in the stack trace (to an older frame)",
            "break <lineno>": "Set the breakpoint at specified line number",
            "tbreak <lineno>": "Temporary breakpoint, which is removed automatically when it is first hit. The arguments are the same as break.",
            "clear bpnumber [bpnumber ...]]": "If space separated breakpoints are specifed then that breakpoint is cleared otherwise all breakpoints are cleared",
            "disable [bpnumber [bpnumber ...]]": "Disables the breakpoints given as a space separated list of breakpoint numbers. Disabling a breakpoint means it cannot cause the program to stop execution",
            "enable [bpnumber [bpnumber ...]]": "Enables the breakpoints specified.",
            "ignore bpnumber [count]": "Sets the ignore count for the given breakpoint number. If count is omitted, the ignore count is set to 0",
            "run": "Run / Restart the current program in the editor",
            "step": "Step Over to the next instruction",
            "cont": "Continue execution till next breakpoint is hit or application terminates",
            "view local(s) <var>": "View all the locals at the current execution point. 'view locals' shows all locals. 'view local <var>' shows just one var",
            "view global(s) <var>": "View all the globals at the current execution point. 'view locals' shows all locals. 'view local <var>' shows just one var",
            "list": "List source code for the current file. Without arguments, list 11 lines around the current line or continue the previous listing."
        };
        
    // Debugger
    repl.sk_debugger = new Sk.Debugger(editor_filename, repl),
        
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
    
    repl.get_source_line = function(lineno) {
        return repl.sk_code_editor.getLine(lineno);
    };
    
    repl.run_code = function(code) {
        Sk.configure({
            output: repl.print,
            debugout: window.jsoutf,
            read: window.builtinRead,
            yieldLimit: null,
            execLimit: null,
            debugging: true,
            breakpoints: repl.sk_debugger.check_breakpoints.bind(repl.sk_debugger),
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

            var promise = repl.sk_debugger.asyncToPromise(function() {
                return Sk.importMainWithBody(editor_filename, true, repl.sk_code_editor.getValue(),true);
            }, susp_handlers, this.sk_debugger);
            promise.then(this.sk_debugger.success.bind(this.sk_debugger), this.sk_debugger.error.bind(this.sk_debugger));
        } catch(e) {
            outf(e.toString() + "\n")
        }
    };
    
    repl.continue = function() {
        Sk.configure({
            output: repl.print,
            debugout: window.jsoutf,
            read: window.builtinRead,
            yieldLimit: null,
            execLimit: null,
            debugging: true,
            breakpoints: repl.sk_debugger.check_breakpoints.bind(repl.sk_debugger),
        });
        this.sk_debugger.disable_step_mode();
        this.sk_debugger.resume.call(this.sk_debugger);
    };
    
    repl.step = function() {
        this.sk_debugger.enable_step_mode();
        this.sk_debugger.resume.call(this.sk_debugger);
    };
    
    repl.set_breakpoint = function(bp, temporary) {
        this.sk_debugger.add_breakpoint(editor_filename + ".py", bp, "0", temporary);
    };
    
    repl.view_breakpoints = function() {
        var bps = this.sk_debugger.get_breakpoints_list();
        repl.print("Filename\t\tLineNo\t\tColNo\t\tEnabled\t\tCode");
        repl.print("--------\t\t------\t\t-----\t\t-------\t\t----");
        
        for (var bp in bps) {
            var bp_obj = bps[bp];
            var bp_str = 
            ("     " + bp_obj.filename).slice(-10) + "\t\t" +
            ("     " + bp_obj.lineno).slice(-5) + "\t\t" +
            ("     " + bp_obj.colno).slice(-5) + "\t\t" +
            ("     " + bp_obj.enabled).slice(-5) + "\t\t" +
            repl.sk_code_editor.getLine(bp_obj.lineno - 1).trim();
            repl.print(bp_str);
        }
    };
    
    repl.clear_breakpoint = function(bp) {
        if (bp == "") {
            this.sk_debugger.clear_all_breakpoints();
        } else {
            var result = this.sk_debugger.clear_breakpoint(editor_filename + ".py", bp, "0");
            if (result != null) {
                repl.print(result);
            }
        }
    };
    
    repl.disable_breakpoint = function(bp) {
        if (bp == "") {
            repl.print("No breakpoints specified to be disabled");
        } else {
            var result = this.sk_debugger.disable_breakpoint(editor_filename + ".py", bp, "0");
            if (result != null) {
                repl.print(result);
            }
        }
    };
    
    repl.enable_breakpoint = function(bp) {
        if (bp == "") {
            repl.print("No breakpoints specified to be disabled");
        } else {
            var result = this.sk_debugger.enable_breakpoint(editor_filename + ".py", bp, "0");
            if (result != null) {
                repl.print(result);
            }
        }
    };
    
    repl.set_ignore_count = function(bp, count) {
        this.sk_debugger.set_ignore_count(editor_filename + ".py", bp, "0", count);
    };
    
    repl.debug_callback = function(suspension) {
        repl.suspension = suspension;
    };
    
    repl.list = function() {
        var suspension = this.sk_debugger.get_active_suspension();
        if (suspension != null) {
            var filename = suspension.filename;
            var lineno = suspension.lineno;
            var colno = suspension.colno;
            var minLineNo = Math.max(0, lineno - 5);
            var maxLineNo = Math.min(lineno + 5, repl.sk_code_editor.lineCount());

            repl.print("Broken at <" + filename + "> at line: " + lineno + " column: " + colno + "\n");
            repl.print("----------------------------------------------------------------------------------\n");

            for (var i = minLineNo; i <= maxLineNo; ++i) {
                var prefix = i + "     ";
                if (i == lineno) {
                    prefix = i + " =>  "
                }
                
                repl.print(prefix + repl.sk_code_editor.getLine(i - 1));
            }
            
            repl.print("----------------------------------------------------------------------------------\n");
        } else {
            repl.print("Program is currently not executing");
        }
    };
    
    repl.view_locals = function(variable) {
        var suspension = repl.sk_debugger.get_active_suspension();

        if (variable == "") {
            for (var local in suspension.$tmps) {
                repl.print(local + ": " + suspension.$tmps[local].v);
            }
            for (var local in suspension.$loc) {
                repl.print(local + ": " + suspension.$loc[local].v);
            }
        } else {
            if (hasOwnProperty(suspension.$loc, variable)) {
                repl.print(variable + ": " + suspension.$loc[variable].v);
            } else if (hasOwnProperty(suspension.$tmps, variable)) {
                repl.print(variable + ": " + suspension.$tmps[variable].v);
            } else {
                repl.print("No such local variable: " + variable);
            }
        }
    };
    
    repl.view_globals = function(variable) {
        var suspension = repl.sk_debugger.get_active_suspension();
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
    };
    
    repl.display_help = function() {
        repl.print("Help: refer to https://docs.python.org/2/library/pdb.html")
        for (var cmd in cmd_list) {
            repl.print(cmd + ": " + cmd_list[cmd]);
        }
    };
    
    repl.where = function() {
        var suspension_stack = repl.sk_debugger.get_suspension_stack();
        var active_suspension = repl.sk_debugger.get_active_suspension();
        var len = suspension_stack.length;
        
        for (var i = len - 1; i >= 0; --i) {
            var susp = suspension_stack[i];
            var code = repl.sk_code_editor.getLine(susp.lineno - 1);

            repl.print("  File \"" + susp.filename + "\", line " + susp.lineno + ", in <module>");
            code = code.trim();
            if (susp === active_suspension) {
                code = "=>  " + code;
            } else {
                code = "    " + code;
            }
            repl.print(code);
        }
    };
    
    repl.down = function() {
        repl.sk_debugger.move_down_the_stack();
        repl.where();
    };
    
    repl.up = function() {
        repl.sk_debugger.move_up_the_stack();
        repl.where();
    };

    //Loop
    repl.eval = function (code) {
        //split lines on linefeed
        var lines = code.split('\n'), index = -1, line = 0;
        var matches = null;
        var variable = null;
        var lineno = 0;
        
        try {
            //Evaluate
            if (!lines || /^\s*$/.test(lines)) {
                return;
            }
            else if (re_run.test(lines[0])) {
                this.run_code();
            } else if (re_cont.test(lines[0])) {
                this.continue();
            } else if (re_viewlocals.test(lines[0])) {
                // get the matches for this.
                matches = re_viewlocals.exec(lines[0]);
                variable = null;
                if (matches.length == 4) {
                    variable = matches[3];
                }
                this.view_locals(variable);
            } else if (re_viewglobals.test(lines[0])) {
                // get the matches for this.
                matches = re_viewglobals.exec(lines[0]);
                variable = null;
                if (matches.length == 4) {
                    variable = matches[3];
                }
                this.view_globals(variable);
            } else if (re_break.test(lines[0])) {
                matches = re_break.exec(lines[0]);
                var lineno = matches[1];
                this.set_breakpoint(lineno, false);
            } else if (re_view_bp.test(lines[0])) {
                this.view_breakpoints();
            } else if (re_clear_bp.test(lines[0])) {
                matches = lines[0].split(" ");
                for (var i = 1; i < matches.length; ++i)
                    this.clear_breakpoint(matches[i]);
            } else if (re_list.test(lines[0])) {
                this.list();
            } else if (re_help.test(lines[0])) {
                this.display_help();
            } else if (re_where.test(lines[0])) {
                this.where();
            } else if (re_step.test(lines[0])) {
                this.step();
            } else if (re_tbreak.test(lines[0])) {
                matches = re_tbreak.exec(lines[0]);
                lineno = matches[1];
                this.set_breakpoint(lineno, true);
            } else if (re_disable_bp.test(lines[0])) {
                matches = lines[0].split(" ");
                for (var i = 1; i < matches.length; ++i)
                    this.disable_breakpoint(matches[i]);
            } else if (re_enable_bp.test(lines[0])) {
                matches = lines[0].split(" ");
                for (var i = 1; i < matches.length; ++i)
                    this.enable_breakpoint(matches[i]);
            } else if (re_ignore_count.test(lines[0])) {
                matches = re_ignore_count.exec(lines[0]);
                var bp = matches[1];
                var count = matches[2];
                this.set_ignore_count(bp, count);
            } else if (re_down.test(lines[0])) {
                this.down();
            } else if (re_up.test(lines[0])) {
                this.up();
            } else {
                repl.print("Invalid Command: " + lines[0]);
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