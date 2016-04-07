/**
 * Debugger support for skulpt module
 */

var Sk = Sk || {}; //jshint ignore:line

Sk.Debugger = function() {
    this.breakpoints = [];
}

Sk.Debugger.prototype.add_breakpoint = function(breakpoint) {
    this.breakpoints.concat(breakpoint);
}

Sk.Debugger.prototype.inspect_suspension = function(suspension) {
    console.log("Hitting a suspension");
}