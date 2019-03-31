import { none } from './types/object'
import { apply } from './misceval';
import { bool } from './bool';
import { dict } from './types/dict';
import { list } from './types/list';
import { str } from './types/str';
import { assk$ } from './builtin';
import { Suspension } from './misceval';
import { func } from './function';
import { tuple } from './types/tuple'
import { numtype } from './types/numtype';

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

    if (obj instanceof Suspension) {
        return obj;
    }

    if (Object.prototype.toString.call(obj) === "[object Array]") {
        arr = [];
        for (i = 0; i < obj.length; ++i) {
            arr.push(remapToPy(obj[i]));
        }
        return new list(arr);
    } else if (obj === null) {
        return none.none$;
    } else if (typeof obj === "object") {
        kvs = [];
        for (k in obj) {
            kvs.push(remapToPy(k));
            kvs.push(remapToPy(obj[k]));
        }
        return new dict(kvs);
    }

    if (typeof obj === "string") {
        return new str(obj);
    }

    if (typeof obj === "number") {
        return assk$(obj);
    }

    if (typeof obj === "boolean") {
        return new bool(obj);
    } else if (typeof obj === "undefined") {
        return none.none$;
    }

    if (typeof obj === "function") {
        return new func(obj);
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
    if (obj instanceof dict) {
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
    } else if (obj instanceof list || obj instanceof tuple) {
        ret = [];
        for (i = 0; i < obj.v.length; ++i) {
            ret.push(remapToJs(obj.v[i]));
        }
        return ret;
    } else if (obj instanceof bool) {
        return obj.v ? true : false;
} else if (obj instanceof numtype) {
        return obj.tp$toJS();
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
        return apply(fn, undefined, undefined, undefined, Array.prototype.slice.call(arguments, 0));
    };
};

export function stdwrap(type, towrap) {
    var inst = new type();
    inst["v"] = towrap;
    return inst;
};
