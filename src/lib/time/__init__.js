/*
 Barebones implementation of the Python time package.

 For now, only the time() function is implemented.
 */

var $builtinmodule = function (name) {
    var mod = {};

    mod.time = new Sk.builtin.func(function () {
        return Sk.builtin.assk$(new Date().getTime() / 1000, undefined);
    });

    // This is an experimental implementation of time.sleep(), using suspensions
    mod.sleep = new Sk.builtin.func(function(delay) {
        var susp = new Sk.misceval.Suspension();
        susp.resume = function() { return Sk.builtin.none.none$; }
        susp.data = {type: "timer", delay: Sk.ffi.remapToJs(delay)};
        return susp;
    });

    return mod;
};
