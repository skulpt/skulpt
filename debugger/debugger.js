/**
 * Debugger support for skulpt module
 */

var Sk = Sk || {}; //jshint ignore:line

Sk.Debugger = function(output_callback) {
    this.breakpoints = [];
    this.suspensions = [];
    this.eval_callback = null;
    this.suspension = null;
    this.output_callback = output_callback;
}

Sk.Debugger.prototype.add_breakpoint = function(breakpoint) {
    this.breakpoints.concat(breakpoint);
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
        promise.then(this.success, this.reject);
    }
}

Sk.Debugger.prototype.success = function() {
    this.output_callback.print("Success running suspension");
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
                        debugger_obj.suspension = r;
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