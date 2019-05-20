/**
 * Global object no matter where we're running
 */
Sk.global = typeof global !== "undefined" ?
            global : // jshint ignore:line
            typeof self !== "undefined" ?
              self : // jshint ignore:line
              typeof window !== "undefined" ?
              window : // jshint ignore:line
              {};

/**
 * Export "object" to global namespace as "name".
 *
 * @param {string} name name to export the object to
 * @param {*} object object to export
 */
Sk.exportSymbol = function (name, object) {
    var parts = name.split(".");
    var curobj = Sk.global;
    var part, idx;

    for (idx = 0; idx < (parts.length - 1); idx++) {
        part = parts[idx];

        if (curobj.hasOwnProperty(part)) {
            curobj = curobj[part];
        } else {
            curobj = curobj[part] = {};
        }
    }

    if (typeof object !== "undefined") {
        part = parts[idx];
        curobj[part] = object;
    }
};

Sk.isArrayLike = function (object) {
    if ((object instanceof Array) || (object && object.length && (typeof object.length == "number"))) {
        return true;
    }
    return false;
};

Sk.exportSymbol("Sk", Sk);
Sk.exportSymbol("Sk.global", Sk.global);
Sk.exportSymbol("Sk.exportSymbol", Sk.exportSymbol);
Sk.exportSymbol("Sk.isArrayLike", Sk.isArrayLike);
