import { none } from './object'
import { asnum$ } from './builtin';

/**
 * @namespace Sk.ffi
 *
 */


/**
 * maps from Javascript Object/Array/string to Python dict/list/str.
 *
 * only works on basic objects that are being used as storage, doesn't handle
 * functions, etc.
 */
export function remapToPy(obj) {
    var k;
    var kvs;
    var i;
    var arr;

    if (obj === null || typeof obj === "undefined") {
        return Sk.builtin.none.none$;
    }

    if (obj.ob$type) {
        return obj;
    }

    if (obj instanceof Sk.misceval.Suspension) {
        return obj;
    }

    if (Object.prototype.toString.call(obj) === "[object Array]") {
        arr = [];
        for (i = 0; i < obj.length; ++i) {
            arr.push(remapToPy(obj[i]));
        }
        return new Sk.builtin.list(arr);
    } else if (obj === null) {
        return none.none$;
    } else if (typeof obj === "object") {
        kvs = [];
        for (k in obj) {
            kvs.push(remapToPy(k));
            kvs.push(remapToPy(obj[k]));
        }
        return new Sk.builtin.dict(kvs);
    }

    if (typeof obj === "string") {
        return new Sk.builtin.str(obj);
    }

    if (typeof obj === "number") {
        return Sk.builtin.assk$(obj);
    }

    if (typeof obj === "boolean") {
        return new Sk.builtin.bool(obj);
    } else if (typeof obj === "undefined") {
        return Sk.builtin.none.none$;
    }

    if (typeof obj === "function") {
        return new Sk.builtin.func(obj);
    }

    goog.asserts.fail("unhandled remap type " + typeof(obj));
};

/**
 * Maps from Python dict/list/str/number to Javascript Object/Array/string/number.
 *
 * If obj is a
 *
 * @param obj {Object}  Any Python object (except a function)
 *
 */
export function remapToJs(obj) {
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
            kAsJs = remapToJs(k);
            // todo; assert that this is a reasonble lhs?
            ret[kAsJs] = remapToJs(v);
        }
        return ret;
    } else if (obj instanceof Sk.builtin.list || obj instanceof Sk.builtin.tuple) {
        ret = [];
        for (i = 0; i < obj.v.length; ++i) {
            ret.push(remapToJs(obj.v[i]));
        }
        return ret;
    } else if (obj instanceof Sk.builtin.bool) {
        return obj.v ? true : false;
    } else if (obj instanceof Sk.builtin.int_) {
        return asnum$(obj);
    } else if (obj instanceof Sk.builtin.float_) {
        return asnum$(obj);
    } else if (obj instanceof Sk.builtin.lng) {
        return asnum$(obj);
    } else if (typeof obj === "number" || typeof obj === "boolean") {
        return obj;
    } else if (obj === undefined) {
        return undefined;
    } else {
        return obj.v;
    }
};

export function callback(fn) {
    if (fn === undefined) {
        return fn;
    }
    return function () {
        return Sk.misceval.apply(fn, undefined, undefined, undefined, Array.prototype.slice.call(arguments, 0));
    };
};

export function stdwrap(type, towrap) {
    var inst = new type();
    inst["v"] = towrap;
    return inst;
};

/**
 * for when the return type might be one of a variety of basic types.
 * number|string, etc.
 */
export function basicwrap(obj) {
    if (obj instanceof Sk.builtin.int_) {
        return asnum$(obj);
    }
    if (obj instanceof Sk.builtin.float_) {
        return asnum$(obj);
    }
    if (obj instanceof Sk.builtin.lng) {
        return asnum$(obj);
    }
    if (typeof obj === "number" || typeof obj === "boolean") {
        return obj;
    }
    if (typeof obj === "string") {
        return new Sk.builtin.str(obj);
    }
    goog.asserts.fail("unexpected type for basicwrap");
};

export function unwrapo(obj) {
    if (obj === undefined) {
        return undefined;
    }
    return obj["v"];
};

export function unwrapn(obj) {
    if (obj === null) {
        return null;
    }
    return obj["v"];
};
