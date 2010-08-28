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

Sk.ffi.remapToJs = function(obj)
{
};
