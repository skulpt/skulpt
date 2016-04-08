/**
 * Debugger support for skulpt module
 */

var Sk = Sk || {}; //jshint ignore:line

Sk.Debugger = function(execution_callback) {
    this.breakpoints = [];
    this.callback = execution_callback;
}

Sk.Debugger.prototype.add_breakpoint = function(breakpoint) {
    this.breakpoints.concat(breakpoint);
}

Sk.Debugger.prototype.suspension_handler = function(susp) {
    // Call the callback for the debugger so that we can inspect
    this.callback();
    
    return new Promise(function(resolve, reject) {
        try {
             resolve(susp.resume());
        } catch(e) {
             reject(e);
        }
    });
}

goog.exportSymbol("Sk.Debugger", Sk.Debugger);