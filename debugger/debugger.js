/**
 * Debugger support for skulpt module
 */

var Sk = Sk || {}; //jshint ignore:line

function hasOwnProperty(obj, prop) {
    var proto = obj.__proto__ || obj.constructor.prototype;
    return (prop in obj) &&
        (!(prop in proto) || proto[prop] !== obj[prop]);
}

Sk.Debugger = function(output_callback) {
    this.dbg_breakpoints = {};
    this.suspensions = [];
    this.eval_callback = null;
    this.suspension = null;
    this.output_callback = output_callback;
}

Sk.Debugger.prototype.get_active_suspension = function() {
    return this.suspension;
}

Sk.Debugger.prototype.generate_breakpoint_key = function(filename, lineno, colno) {
    var key = filename + "-" + lineno + "-" + colno;
    return key;
}

Sk.Debugger.prototype.check_breakpoints = function(filename, lineno, colno) {
    var key = this.generate_breakpoint_key(filename, lineno, colno);
    if (hasOwnProperty(this.dbg_breakpoints, key)) {
        return true;
    }
    return false;
}

Sk.Debugger.prototype.print_suspension_info = function(suspension) {
    if (!hasOwnProperty(suspension, filename) && suspension.child instanceof Sk.misceval.Suspension)
        suspension = suspension.child;

    var filename = suspension.filename;
    var lineno = suspension.lineno;
    var colno = suspension.colno;
    this.output_callback.print("Broken at <" + filename + "> at line: " + lineno + " column: " + colno + "\n");
    this.output_callback.print("----------------------------------------------------------------------------------\n");
    this.output_callback.print(" --> " + this.output_callback.sk_code_editor.getLine(lineno - 1) + "\n");
    this.output_callback.print("----------------------------------------------------------------------------------\n");
}

Sk.Debugger.prototype.set_suspension = function(suspension) {
    this.print_suspension_info(suspension);
    this.suspension = suspension;
}

Sk.Debugger.prototype.add_breakpoint = function(filename, lineno, colno) {
    var key = this.generate_breakpoint_key(filename, lineno, colno);
    this.breakpoints[key] = true;
}

Sk.Debugger.prototype.suspension_handler = function(susp) {
    console.log("Created the promise");
    return new Promise(function(resolve, reject) {
        try {
            console.log("I am executing resolve in Promise");
            resolve(susp.resume());
        } catch(e) {
            reject(e);
        }
    });
}

Sk.Debugger.prototype.resume = function() {
    if (this.suspension == null) {
        this.output_callback.print("No running program");
    } else {
        var promise = this.suspension_handler(this.suspension);
        promise.then(this.success.bind(this), this.reject.bind(this));
    }
}

Sk.Debugger.prototype.success = function(r) {
    if (r instanceof Sk.misceval.Suspension) {
        this.set_suspension(r);
    } else {
        this.suspension = null;
    }
}

Sk.Debugger.prototype.reject = function() {
    this.output_callback.print("Error running suspension");
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
                        
                        var handler = suspHandlers && (suspHandlers[r.data["type"]] || suspHandlers["*"]);

                        if (handler) {
                            var handlerPromise = handler(r);
                            if (handlerPromise) {
                                handlerPromise.then(handleResponse, reject);
                                return;
                            }
                        }

                        if (r.data["type"] == "Sk.promise") {
                            r.data["promise"].then(resumeWithData, resumeWithError);
                            return;

                        } else if (r.data["type"] == "Sk.yield" && typeof setTimeout === "function") {
                            setTimeout(resume, 0);
                            return;

                        } else if (r.optional) {
                            // Unhandled optional suspensions just get
                            // resumed immediately, and we go around the loop again.
                            r = r.resume();

                        } else {
                            // Unhandled, non-optional suspension.
                            throw new Sk.builtin.SuspensionError("Unhandled non-optional suspension of type '"+r.data["type"]+"'");
                        }
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