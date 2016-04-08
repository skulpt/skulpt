/**
 * Debugger support for skulpt module
 */

var Sk = Sk || {}; //jshint ignore:line

Sk.Debugger = function() {
    this.breakpoints = [];
    this.cmds = {
        "run": this.run(),
        "cont": this.continue(),
        "blah": this.nop(),
        "blahblah": this.nop(),
    }
    
    this.cmdlist = ["run", "cont", "blah", "blahblah"];
}

Sk.Debugger.prototype.add_breakpoint = function(breakpoint) {
    this.breakpoints.concat(breakpoint);
}

Sk.Debugger.prototype.wait_for_cmd = function() {
    
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

goog.exportSymbol("Sk.Debugger", Sk.Debugger);