// Global Sk object
var Sk = {}; // jshint ignore:line

Sk.build = {
    githash: GITHASH,
    date: BUILDDATE
};

/**
 * Global object no matter where we're running
 */
Sk.global =
    typeof global !== "undefined" ? global : // jshint ignore:line
    typeof self !== "undefined" ? self : // jshint ignore:line
    typeof window !== "undefined" ? window : // jshint ignore:line
    {};

Sk.global["Sk"] = Sk;


Sk.isArrayLike = function (object) {
    if ((object instanceof Array) || (object && object.length && (typeof object.length == "number"))) {
        return true;
    }
    return false;
};

Sk.js_beautify = function (x) {
    return x;
};







