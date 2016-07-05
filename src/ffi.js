/**
 * @namespace Sk.ffi
 *
 */

Sk.ffi = Sk.ffi || {};

/**
 * maps from Javascript Object/Array/string to Python dict/list/str.
 *
 * only works on basic objects that are being used as storage, doesn't handle
 * functions, etc.
 */
Sk.ffi.remapToPy = function (obj) {
    var k;
    var kvs;
    var i;
    var arr;
    if (Object.prototype.toString.call(obj) === "[object Array]") {
        arr = [];
        for (i = 0; i < obj.length; ++i) {
            arr.push(Sk.ffi.remapToPy(obj[i]));
        }
        return new Sk.builtin.list(arr);
    } else if (obj === null) {
        return Sk.builtin.none.none$;
    } else if (typeof obj === "object") {
        kvs = [];
        for (k in obj) {
            kvs.push(Sk.ffi.remapToPy(k));
            kvs.push(Sk.ffi.remapToPy(obj[k]));
        }
        return new Sk.builtin.dict(kvs);
    } else if (typeof obj === "string") {
        return new Sk.builtin.str(obj);
    } else if (typeof obj === "number") {
        return Sk.builtin.assk$(obj);
    } else if (typeof obj === "boolean") {
        return new Sk.builtin.bool(obj);
    }
    goog.asserts.fail("unhandled remap type " + typeof(obj));
};
goog.exportSymbol("Sk.ffi.remapToPy", Sk.ffi.remapToPy);

/**
 * Maps from Python dict/list/str/number to Javascript Object/Array/string/number.
 *
 * If obj is a
 *
 * @param obj {Object}  Any Python object (except a function)
 *
 */
Sk.ffi.remapToJs = function (obj) {
    var i;
    var kAsJs;
    var v;
    var iter, k;
    var ret;
    if (obj instanceof Sk.builtin.dict) {
        ret = {};
        for (iter = obj.tp$iter(), k = iter.tp$iternext();
             k !== undefined;
             k = iter.tp$iternext()) {
            v = obj.mp$subscript(k);
            if (v === undefined) {
                v = null;
            }
            kAsJs = Sk.ffi.remapToJs(k);
            // todo; assert that this is a reasonble lhs?
            ret[kAsJs] = Sk.ffi.remapToJs(v);
        }
        return ret;
    } else if (obj instanceof Sk.builtin.list || obj instanceof Sk.builtin.tuple) {
        ret = [];
        for (i = 0; i < obj.v.length; ++i) {
            ret.push(Sk.ffi.remapToJs(obj.v[i]));
        }
        return ret;
    } else if (obj instanceof Sk.builtin.bool) {
        return obj.v ? true : false;
    } else if (obj instanceof Sk.builtin.int_) {
        return Sk.builtin.asnum$(obj);
    } else if (obj instanceof Sk.builtin.float_) {
        return Sk.builtin.asnum$(obj);
    } else if (obj instanceof Sk.builtin.lng) {
        return Sk.builtin.asnum$(obj);
    } else if (typeof obj === "number" || typeof obj === "boolean") {
        return obj;
    } else {
        return obj.v;
    }
};
goog.exportSymbol("Sk.ffi.remapToJs", Sk.ffi.remapToJs);

Sk.ffi.callback = function (fn) {
    if (fn === undefined) {
        return fn;
    }
    return function () {
        return Sk.misceval.apply(fn, undefined, undefined, undefined, Array.prototype.slice.call(arguments, 0));
    };
};
goog.exportSymbol("Sk.ffi.callback", Sk.ffi.callback);

Sk.ffi.stdwrap = function (type, towrap) {
    var inst = new type();
    inst["v"] = towrap;
    return inst;
};
goog.exportSymbol("Sk.ffi.stdwrap", Sk.ffi.stdwrap);

/**
 * for when the return type might be one of a variety of basic types.
 * number|string, etc.
 */
Sk.ffi.basicwrap = function (obj) {
    if (obj instanceof Sk.builtin.int_) {
        return Sk.builtin.asnum$(obj);
    }
    if (obj instanceof Sk.builtin.float_) {
        return Sk.builtin.asnum$(obj);
    }
    if (obj instanceof Sk.builtin.lng) {
        return Sk.builtin.asnum$(obj);
    }
    if (typeof obj === "number" || typeof obj === "boolean") {
        return obj;
    }
    if (typeof obj === "string") {
        return new Sk.builtin.str(obj);
    }
    goog.asserts.fail("unexpected type for basicwrap");
};
goog.exportSymbol("Sk.ffi.basicwrap", Sk.ffi.basicwrap);

Sk.ffi.unwrapo = function (obj) {
    if (obj === undefined) {
        return undefined;
    }
    return obj["v"];
};
goog.exportSymbol("Sk.ffi.unwrapo", Sk.ffi.unwrapo);

Sk.ffi.unwrapn = function (obj) {
    if (obj === null) {
        return null;
    }
    return obj["v"];
};
goog.exportSymbol("Sk.ffi.unwrapn", Sk.ffi.unwrapn);
