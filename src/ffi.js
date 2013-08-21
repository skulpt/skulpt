Sk.ffi = Sk.ffi || {};

Sk.ffi.remapBooleanToPy = function(valueJs)
{
    var t = typeof valueJs;
    if (t === 'boolean')
    {
        return valueJs ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
    }
    else if (t === 'object' && valueJs === null)
    {
        return Sk.builtin.none.none$;
    }
    else
    {
        goog.asserts.fail("Argument has type " + t + ", expecting 'boolean'.");
    }
}
goog.exportSymbol("Sk.ffi.remapBooleanToPy", Sk.ffi.remapBooleanToPy);

Sk.ffi.remapNumberToFloatPy = function(valueJs)
{
    var t = typeof valueJs;
    if (t === 'number')
    {
        return new Sk.builtin.nmber(valueJs, Sk.builtin.nmber.float$);
    }
    else if (t === 'object' && valueJs === null)
    {
        return Sk.builtin.none.none$;
    }
    else
    {
        goog.asserts.fail("Argument has type " + t + ", expecting 'number'.");
    }
}
goog.exportSymbol("Sk.ffi.remapNumberToFloatPy", Sk.ffi.remapNumberToFloatPy);

Sk.ffi.remapNumberToIntPy = function(valueJs)
{
    var t = typeof valueJs;
    if (t === 'number')
    {
        return new Sk.builtin.nmber(valueJs, Sk.builtin.nmber.int$);
    }
    else if (t === 'object' && valueJs === null)
    {
        return Sk.builtin.none.none$;
    }
    else
    {
        goog.asserts.fail("Argument has type " + t + ", expecting 'number'.");
    }
}
goog.exportSymbol("Sk.ffi.remapNumberToIntPy", Sk.ffi.remapNumberToIntPy);

Sk.ffi.remapStringToPy = function(valueJs)
{
    var t = typeof valueJs;
    if (t === 'string')
    {
        return new Sk.builtin.str(valueJs);
    }
    else if (t === 'object' && valueJs === null)
    {
        return Sk.builtin.none.none$;
    }
    else
    {
        goog.asserts.fail("Argument has type " + t + ", expecting 'string'.");
    }
}
goog.exportSymbol("Sk.ffi.remapStringToPy", Sk.ffi.remapStringToPy);

Sk.ffi.remapToPy = function(valueJs, tp$name)
{
    var t = typeof valueJs;
    if (t === 'object') {
        if (Object.prototype.toString.call(valueJs) === "[object Array]")
        {
            var arr = [];
            for (var i = 0; i < valueJs.length; ++i) {
                arr.push(Sk.ffi.remapToPy(valueJs[i], undefined));
            }
            return new Sk.builtin.list(arr);
        }
        else if (typeof tp$name === 'string')
        {
            return {"v": valueJs, "tp$name": tp$name};
        }
        else if (t === 'object' && valueJs === null)
        {
            return Sk.builtin.none.none$;
        }
        else
        {
            var kvs = [];
            for (var k in valueJs)
            {
                kvs.push(Sk.ffi.remapToPy(k, undefined));
                kvs.push(Sk.ffi.remapToPy(valueJs[k], undefined));
            }
            return new Sk.builtin.dict(kvs);
        }
    }
    else if (t === 'string')
    {
        return Sk.ffi.remapStringToPy(valueJs);
    }
    else if (t === 'number')
    {
        return Sk.ffi.remapNumberToFloatPy(valueJs);
    }
    else if (t === 'boolean')
    {
        return Sk.ffi.remapBooleanToPy(valueJs);
    }
    else
    {
        goog.asserts.fail("unhandled remapToPy type " + t);
    }
};
goog.exportSymbol("Sk.ffi.remapToPy", Sk.ffi.remapToPy);

/**
 * Usage:
 *
 * valueJs = Sk.ffi.remapBooleanToJs(valuePy, "foo must be a <type 'bool'>");
 */
Sk.ffi.remapBooleanToJs = function(valuePy, message)
{
    if (valuePy === Sk.builtin.bool.true$)
    {
        return true;
    }
    else if (valuePy === Sk.builtin.bool.false$)
    {
        return false;
    }
    else
    {
        throw new Sk.builtin.AssertionError(message);
    }
}
goog.exportSymbol("Sk.ffi.remapBooleanToPy", Sk.ffi.remapBooleanToPy);

/**
 * Usage:
 *
 * valueJs = Sk.ffi.remapToJs(valuePy);
 */
Sk.ffi.remapToJs = function(valuePy)
{
    if (typeof valuePy === 'undefined')
    {
        // TODO: Probably should ultimately be an assertion since Python has no concept of undefined.
        return valuePy;
    }
    else if (valuePy instanceof Sk.builtin.dict)
    {
        var ret = {};
        for (var iter = valuePy.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext())
        {
            var v = valuePy.mp$subscript(k);
            if (v === undefined) {
                v = null;
            }
            var kAsJs = Sk.ffi.remapToJs(k);
            ret[kAsJs] = Sk.ffi.remapToJs(v);
        }
        return ret;
    }
    else if (valuePy instanceof Sk.builtin.list)
    {
        var ret = [];
        for (var i = 0; i < valuePy.v.length; ++i)
        {
            ret.push(Sk.ffi.remapToJs(valuePy.v[i]));
        }
        return ret;
    }
    else if (valuePy instanceof Sk.builtin.nmber)
    {
        return Sk.builtin.asnum$(valuePy);
    }
    else if (valuePy instanceof Sk.builtin.lng)
    {
        return Sk.builtin.asnum$(valuePy);
    }
    else if (valuePy === Sk.builtin.bool.true$)
    {
        return true;
    }
    else if (valuePy === Sk.builtin.bool.false$)
    {
        return false;
    }
    else if (typeof valuePy.v !== 'undefined')
    {
        // TODO: This is being exercised, but we should assert the tp$name.
        // I think the pattern here suggests that we have a Sk.builtin.something
        return valuePy.v;
    }
    else
    {
        // The following statement is provided because the proper representation of Python types in Skulpt is 'incorrect'.
        // You might see JavaScript 'boolean' and 'string' values stored in the 'v' property.
        return valuePy.v;
    }
};
goog.exportSymbol("Sk.ffi.remapToJs", Sk.ffi.remapToJs);

// TODO: Deprecate and/or rename to remapFunctionToPy?
Sk.ffi.callback = function(fn)
{
    if (fn === undefined) return fn;
    return function() {
        return Sk.misceval.apply(fn, undefined, undefined, undefined, Array.prototype.slice.call(arguments, 0));
    };
};
goog.exportSymbol("Sk.ffi.callback", Sk.ffi.callback);

Sk.ffi.stdwrap = function(type, towrap, ignoreDeprecation)
{
    if (ignoreDeprecation)
    {
        var inst = new type();
        inst['v'] = towrap;
        return inst;
    }
    else
    {
        goog.asserts.fail("Sk.ffi.stdwrap has been deprecated. Please use Sk.ffi.remapToPy(valueJs, tp$name) instead.");
    }
};
goog.exportSymbol("Sk.ffi.stdwrap", Sk.ffi.stdwrap);

Sk.ffi.basicwrap = function(obj, ignoreDeprecation)
{
    if (ignoreDeprecation)
    {
        if (obj instanceof Sk.builtin.nmber)
            return Sk.builtin.asnum$(obj);
        if (obj instanceof Sk.builtin.lng)
            return Sk.builtin.asnum$(obj);
        if (typeof obj === "number" || typeof obj === "boolean")
            return obj;
        if (typeof obj === "string")
        {
            return new Sk.builtin.str(obj);
        }
        goog.asserts.fail("unexpected type for basicwrap");
    }
    else
    {
        goog.asserts.fail("Sk.ffi.basicwrap has been deprecated. Please use Sk.ffi.remapToPy instead.");
    }
};
goog.exportSymbol("Sk.ffi.basicwrap", Sk.ffi.basicwrap);

Sk.ffi.unwrapo = function(obj, ignoreDeprecation)
{
    if (ignoreDeprecation)
    {
        if (obj === undefined) return undefined;
        return obj['v'];
    }
    else
    {
        goog.asserts.fail("Sk.ffi.unwrapo has been deprecated. Please use Sk.ffi.remapToJs instead.");
    }
};
goog.exportSymbol("Sk.ffi.unwrapo", Sk.ffi.unwrapo);

Sk.ffi.unwrapn = function(obj, ignoreDeprecation)
{
    if (ignoreDeprecation)
    {
        if (obj === null) return null;
        return obj['v'];
    }
    else
    {
        goog.asserts.fail("Sk.ffi.unwrapn has been deprecated. Please use Sk.ffi.remapToJs instead.");
    }
};
goog.exportSymbol("Sk.ffi.unwrapn", Sk.ffi.unwrapn);
