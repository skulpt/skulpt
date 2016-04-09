/**
 * Debugger support for skulpt module
 */

var Sk = Sk || {}; //jshint ignore:line

function hasOwnProperty(obj, prop) {
    var proto = obj.__proto__ || obj.constructor.prototype;
    return (prop in obj) &&
        (!(prop in proto) || proto[prop] !== obj[prop]);
}

Sk.Breakpoint = function(filename, lineno, colno) {
    this.filename = filename;
    this.lineno = lineno;
    this.colno = colno;
}

Sk.Debugger = function(filename, output_callback) {
    this.dbg_breakpoints = {};
    this.tmp_breakpoints = {};
    this.suspension_stack = [];
    this.eval_callback = null;
    this.suspension = null;
    this.output_callback = output_callback;
    this.step_mode = false;
    this.filename = filename;
}

Sk.Debugger.prototype.print = function(txt) {
    if (this.output_callback != null) {
        this.output_callback.print(txt);
    }
}

Sk.Debugger.prototype.get_source_line = function(lineno) {
    if (this.output_callback != null) {
        return this.output_callback.get_source_line(lineno);
    }
    
    return "";
}

Sk.Debugger.prototype.enable_step_mode = function() {
    this.step_mode = true;
}

Sk.Debugger.prototype.disable_step_mode = function() {
    this.step_mode = false;
}

Sk.Debugger.prototype.get_suspension_stack = function() {
    return this.suspension_stack;
}

Sk.Debugger.prototype.get_active_suspension = function() {
    return this.suspension;
}

Sk.Debugger.prototype.generate_breakpoint_key = function(filename, lineno, colno) {
    var key = filename + "-" + lineno;
    return key;
}

Sk.Debugger.prototype.check_breakpoints = function(filename, lineno, colno) {
    // If Step mode is enabled then ignore breakpoints since we will just break
    // at every line.
    if (this.step_mode == true) {
        return true;
    }
    
    var key = this.generate_breakpoint_key(filename, lineno, colno);
    if (hasOwnProperty(this.dbg_breakpoints, key)) {
        if (hasOwnProperty(this.tmp_breakpoints, key)) {
            delete this.dbg_breakpoints[key];
            delete this.tmp_breakpoints[key];
        }
        return true;
    }
    return false;
}

Sk.Debugger.prototype.get_breakpoints_list = function() {
    return this.dbg_breakpoints;
}

Sk.Debugger.prototype.clear_breakpoint = function(filename, lineno, colno) {
    var key = this.generate_breakpoint_key(filename, lineno, colno);
    if (hasOwnProperty(this.dbg_breakpoints, key)) {
        delete this.dbg_breakpoints[key];
        return null;
    } else {
        return "Invalid breakpoint specified: " + filename + " line: " + lineno;
    }
}

Sk.Debugger.prototype.clear_all_breakpoints = function() {
    this.dbg_breakpoints = {}
}

Sk.Debugger.prototype.print_suspension_info = function(suspension) {
    var filename = suspension.filename;
    var lineno = suspension.lineno;
    var colno = suspension.colno;
    this.print("Hit Breakpoint at <" + filename + "> at line: " + lineno + " column: " + colno + "\n");
    this.print("----------------------------------------------------------------------------------\n");
    this.print(" ==> " + this.get_source_line(lineno - 1) + "\n");
    this.print("----------------------------------------------------------------------------------\n");
}

Sk.Debugger.prototype.set_suspension = function(suspension) {
    if (!hasOwnProperty(suspension, "filename") && suspension.child instanceof Sk.misceval.Suspension)
        suspension = suspension.child;
        
    var original_suspension = suspension;
    
    // Unroll the stack to get each suspension.
    var parent = null;
    var nested = 0;
    while (suspension instanceof Sk.misceval.Suspension) {
        parent = suspension;
        suspension = suspension.child;
        nested += 1;
    }

    suspension = parent;
    if (nested >= 2) {
        this.suspension_stack.push(original_suspension);
    }
    
    this.print_suspension_info(suspension);
    this.suspension = suspension;
}

Sk.Debugger.prototype.add_breakpoint = function(filename, lineno, colno, temporary) {
    var key = this.generate_breakpoint_key(filename, lineno, colno);
    this.dbg_breakpoints[key] = new Sk.Breakpoint(filename, lineno, colno);
    if (temporary)
        this.tmp_breakpoints[key] = true;
}

Sk.Debugger.prototype.suspension_handler = function(susp) {
    return new Promise(function(resolve, reject) {
        try {
            resolve(susp.resume());
        } catch(e) {
            reject(e);
        }
    });
}

Sk.Debugger.prototype.resume = function() {
    if (this.suspension == null) {
        this.print("No running program");
    } else {
        var promise = this.suspension_handler(this.suspension);
        promise.then(this.success.bind(this), this.error.bind(this));
    }
}

Sk.Debugger.prototype.success = function(r) {
    if (r instanceof Sk.misceval.Suspension) {
        this.set_suspension(r);
    } else {
        if (this.suspension_stack.length > 0) {
            // Current suspension should be the last one on the list
            var parent_suspension = this.suspension_stack.pop();
            // The child has completed the execution. So override the child's resume
            // so we can continue the execution.
            parent_suspension.child.resume = function() {};

            this.print_suspension_info(parent_suspension);
            // Do not use set_suspension since it will recurse to the child again
            this.suspension = parent_suspension;
        } else {
            this.suspension = null;
            this.print("Program execution complete");
        }
    }
}

Sk.Debugger.prototype.error = function(e) {
    this.print("Traceback (most recent call last):");
    for (var idx = 0; idx < e.traceback.length; ++idx) {
        this.print("  File \"" + e.traceback[idx].filename + "\", line " + e.traceback[idx].lineno + ", in <module>");
        var code = this.get_source_line(e.traceback[idx].lineno - 1);
        code = code.trim();
        code = "    " + code;
        this.print(code);
    }
    
    var err_ty = e.constructor.tp$name;
    for (var idx = 0; idx < e.args.v.length; ++idx) {
        this.print(err_ty + ": " + e.args.v[idx].v);
    }
}

Sk.Debugger.prototype.asyncToPromise = function(suspendablefn, suspHandlers, debugger_obj) {
    return new Promise(function(resolve, reject) {
        try {
            var r = suspendablefn();

            (function handleResponse (r) {
                try {
                    while (r instanceof Sk.misceval.Suspension) {
                        debugger_obj.set_suspension(r);
                        return;
                    }

                    resolve(r);
                } catch(e) {
                    reject(e);
                }
            })(r);

        } catch (e) {
            reject(e);
        }
    });
}

Sk.Debugger.prototype.execute = function(suspendablefn, suspHandlers) {
    var r = suspendablefn();
    
    if (r instanceof Sk.misceval.Suspension) {
        this.suspensions.concat(r);
        this.eval_callback(r);
    }
}

goog.exportSymbol("Sk.Debugger", Sk.Debugger);