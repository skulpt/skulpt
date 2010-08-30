Sk.ffi = Sk.ffi || {};

/**
 * maps from Javascript Object/Array/string to Python dict/list/str.
 *
 * only works on basic objects that are being used as storage, doesn't handle
 * functions, etc.
 */
Sk.ffi.remapToPy = function(obj)
{
    if (Object.prototype.toString.call(obj) === "[object Array]")
    {
        var arr = [];
        for (var i = 0; i < obj.length; ++i)
            arr.push(Sk.ffi.remapToPy(obj[i]));
        return new Sk.builtin.list(arr);
    }
    else if (typeof obj === "object")
    {
        var kvs = [];
        for (var k in obj)
        {
            kvs.push(Sk.ffi.remapToPy(k));
            kvs.push(Sk.ffi.remapToPy(obj[k]));
        }
        return new Sk.builtin.dict(kvs);
    }
    else if (typeof obj === "string")
        return new Sk.builtin.str(obj);
    else if (typeof obj === "number" || typeof obj === "boolean")
        return obj;
    goog.asserts.fail("unhandled remap type");
};

/**
 * maps from Python dict/list/str to Javascript Object/Array/string.
 */
Sk.ffi.remapToJs = function(obj)
{
    if (obj instanceof Sk.builtin.dict)
    {
        var ret = {};
        for (var iter = obj.tp$iter(), k = iter.tp$iternext();
                k !== undefined;
                k = iter.tp$iternext())
        {
            var v = obj.mp$subscript(k);
            if (v === undefined)
                v = null;
            var kAsJs = Sk.ffi.remapToJs(k);
            // todo; assert that this is a reasonble lhs?
            ret[kAsJs] = Sk.ffi.remapToJs(v);
        }
        return ret;
    }
    else if (obj instanceof Sk.builtin.list)
    {
        var ret = [];
        for (var i = 0; i < obj.v.length; ++i)
            ret.push(Sk.ffi.remapToJs(obj.v[i]));
        return ret;
    }
    else if (obj instanceof Sk.builtin.str)
        return obj.v;
    else if (typeof obj === "number" || typeof obj === "boolean")
        return obj;
    goog.asserts.fail("unhandled remap type");
};

Sk.ffi.callback = function(fn)
{
    if (fn === undefined) return fn;
    return function() {
        return Sk.misceval.apply(fn, undefined, Array.prototype.slice.call(arguments, 0));
    };
};

Sk.ffi.stdwrap = function(type, towrap)
{
    var inst = new type.tp$new();
    inst.v = towrap;
    return inst;
};
