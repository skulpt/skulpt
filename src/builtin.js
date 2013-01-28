// builtins are supposed to come from the __builtin__ module, but we don't do
// that yet.
Sk.builtin = {};

// todo; these should all be func objects too, otherwise str() of them won't
// work, etc.

Sk.builtin.range = function(start, stop, step)
{
    var ret = [];
    var i;

    Sk.builtin.pyCheckArgs("range", arguments, 1, 3);
    Sk.builtin.pyCheckType("start", "number", Sk.builtin.checkNumber(start));
    if (stop !== undefined) {
        Sk.builtin.pyCheckType("stop", "number", Sk.builtin.checkNumber(stop));
    };
    if (step !== undefined) {
        Sk.builtin.pyCheckType("step", "number", Sk.builtin.checkNumber(step));
    };

    if ((stop === undefined) && (step === undefined)) {
        stop = start;
        start = 0;
        step = 1;
    } else if (step === undefined) {
        step = 1;
    };

    if (step === 0) {
        throw new Sk.builtin.ValueError("range() step argument must not be zero");
    };

    if (step > 0) {
        for (i=start; i<stop; i+=step) {
            ret.push(i);
        };
    } else {
        for (i=start; i>stop; i+=step) {
            ret.push(i);
        };        
    };

    return new Sk.builtin.list(ret);
};

Sk.builtin.round = function(number, ndigits)
{
    var result, multiplier;

    Sk.builtin.pyCheckArgs("round", arguments, 1, 2);
    Sk.builtin.pyCheckType("number", "number", Sk.builtin.checkNumber(number));
    if (ndigits !== undefined) {
        Sk.builtin.pyCheckType("ndigits", "number", Sk.builtin.checkNumber(ndigits));
    };

    if (ndigits === undefined) {
        ndigits = 0;
    };

    multiplier = Math.pow(10, ndigits);
    result = Math.round(number * multiplier) / multiplier;

    return result;
};

Sk.builtin.len = function(item)
{
    Sk.builtin.pyCheckArgs("len", arguments, 1, 1);

    if (item.sq$length)
        return item.sq$length();
    
    if (item.mp$length)
        return item.mp$length();

    throw new Sk.builtin.TypeError("object of type '" + Sk.abstr.typeName(item) + "' has no len()");
};

Sk.builtin.min = function min()
{
    Sk.builtin.pyCheckArgs("min", arguments, 1);

    arguments = Sk.misceval.arrayFromArguments(arguments);
    var lowest = arguments[0];
    for (var i = 1; i < arguments.length; ++i)
    {
        if (Sk.misceval.richCompareBool(arguments[i], lowest, 'Lt'))
            lowest = arguments[i];
    }
    return lowest;
};

Sk.builtin.max = function max()
{
    Sk.builtin.pyCheckArgs("max", arguments, 1);

    arguments = Sk.misceval.arrayFromArguments(arguments);
    var highest = arguments[0];
    for (var i = 1; i < arguments.length; ++i)
    {
        if (Sk.misceval.richCompareBool(arguments[i], highest, 'Gt'))
            highest = arguments[i];
    }
    return highest;
};

Sk.builtin.any = function any(iter)
{
    var it, i;

    Sk.builtin.pyCheckArgs("any", arguments, 1);
    Sk.builtin.pyCheckType("iter", "iterable", Sk.builtin.checkIterable(iter));

    if (!iter.tp$iter) {
        throw "TypeError: object is not iterable";
    }

    it = iter.tp$iter();
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (Sk.builtin.bool(i)) {
            return true;
        }
    }

    return false;
}

Sk.builtin.all = function all(iter)
{
    var it, i;

    Sk.builtin.pyCheckArgs("all", arguments, 1);
    Sk.builtin.pyCheckType("iter", "iterable", Sk.builtin.checkIterable(iter));

    if (!iter.tp$iter) {
        throw "TypeError: object is not iterable";
    }

    it = iter.tp$iter();
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (!Sk.builtin.bool(i)) {
            return false;
        }
    }

    return true;
}

Sk.builtin.sum = function sum(iter,start)
{
    var tot = 0;
    var it, i;

    Sk.builtin.pyCheckArgs("sum", arguments, 1, 2);
    Sk.builtin.pyCheckType("iter", "iterable", Sk.builtin.checkIterable(iter));
    if (start !== undefined) {        
        Sk.builtin.pyCheckType("start", "number", Sk.builtin.checkNumber(start));
    };

    if (start === undefined ) {
        start = 0;
    }

    tot += start;

    if (!iter.tp$iter) {
        throw "TypeError: object is not iterable";
    }

    it = iter.tp$iter();
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (typeof i !== "number") {
            throw "TypeError: a number is required";
        }
        tot += i;
    }

    return tot;
};

Sk.builtin.zip = function zip()
{
    if (arguments.length === 0)
    {
        return new Sk.builtin.list([]);        
    }

    var iters = [];
    for (var i = 0; i < arguments.length; i++)
    {
        if (arguments[i].tp$iter)
        {
            iters.push(arguments[i].tp$iter());
        }
        else
        {
            throw "TypeError: argument " + i + " must support iteration";    
        }
    }
    var res = [];
    var done = false;
    while (!done)
    {
        var tup = [];
        for (i = 0; i < arguments.length; i++)
        {
            var el = iters[i].tp$iternext();
            if (el === undefined)
            {
                done = true;
                break;
            }
            tup.push(el);
        }
        if (!done)
        {
            res.push(new Sk.builtin.tuple(tup));    
        }
    }
    return new Sk.builtin.list(res);
}

Sk.builtin.abs = function abs(x)
{
    Sk.builtin.pyCheckArgs("abs", arguments, 1, 1);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

    return Math.abs(x);
};

Sk.builtin.ord = function ord(x)
{
    Sk.builtin.pyCheckArgs("ord", arguments, 1, 1);

    if (x.constructor !== Sk.builtin.str || x.v.length !== 1)
    {
        throw "ord() expected string of length 1";
    }
    return (x.v).charCodeAt(0);
};

Sk.builtin.chr = function chr(x)
{
    Sk.builtin.pyCheckArgs("chr", arguments, 1, 1);

    if (typeof x !== "number")
    {
        throw new Sk.builtin.TypeError("an integer is required");
    }

    if ((x < 0) || (x > 255))
    {
        throw new Sk.builtin.ValueError("chr() arg not in range(256)");
    }

    return new Sk.builtin.str(String.fromCharCode(x));
};

Sk.builtin.dir = function dir(x)
{
    Sk.builtin.pyCheckArgs("dir", arguments, 1, 1);

    var names = [];
    for (var k in x.constructor.prototype)
    {
        var s;
        if (k.indexOf('$') !== -1)
            s = Sk.builtin.dir.slotNameToRichName(k);
        else if (k.charAt(k.length - 1) !== '_')
            s = k;
        if (s)
            names.push(new Sk.builtin.str(s));
    }
    names.sort(function(a, b) { return (a.v > b.v) - (a.v < b.v); });
    return new Sk.builtin.list(names);
};

Sk.builtin.dir.slotNameToRichName = function(k)
{
    // todo; map tp$xyz to __xyz__ properly
    return undefined;
};

Sk.builtin.repr = function repr(x)
{
    Sk.builtin.pyCheckArgs("repr", arguments, 1, 1);

    return Sk.misceval.objectRepr(x);
};

Sk.builtin.open = function open(filename, mode, bufsize)
{
    if (mode === undefined) mode = "r";
    if (mode.v !== "r" && mode.v !== "rb") throw "todo; haven't implemented non-read opens";
    return new Sk.builtin.file(filename, mode, bufsize);
};

Sk.builtin.isinstance = function(obj, type)
{
    Sk.builtin.pyCheckArgs("isinstance", arguments, 2, 2);

    // Handle types that are represented as native javascript objects
    if (type === Sk.builtin.int_) {
        if (typeof obj === "number") {
            return (Math.floor(obj) === obj);
        }
    }

    if (type === Sk.builtin.float_) {
        return (typeof obj === "number");        
    }

    if (type === Sk.builtin.NoneObj.prototype.ob$type) {
        return obj === null;
    }

    if (type === Sk.builtin.bool.prototype.ob$type) {
        return (obj === true) || (obj === false);
    }

    // Normal case
    if (obj.ob$type === type) return true;

    // Handle tuple type argument
    if (type instanceof Sk.builtin.tuple)
    {
        for (var i = 0; i < type.v.length; ++i)
        {
            if (Sk.builtin.isinstance(obj, type.v[i]))
                return true;
        }
        return false;
    }

    var issubclass = function(klass, base)
    {
        if (klass === base) return true;
        if (klass['$d'] === undefined) return false;
        var bases = klass['$d'].mp$subscript(Sk.builtin.type.basesStr_);
        for (var i = 0; i < bases.v.length; ++i)
        {
            if (issubclass(bases.v[i], base))
                return true;
        }
        return false;
    };

    return issubclass(obj.ob$type, type);
};

Sk.builtin.hashCount = 0;
Sk.builtin.hash = function hash(value)
{
    Sk.builtin.pyCheckArgs("hash", arguments, 1, 1);

    // Useless object to get compiler to allow check for __hash__ property
    var junk = {__hash__: function() {return 0;}}

    if ((value instanceof Object) && (value.tp$hash !== undefined))
    {
        if (value.$savedHash_) return value.$savedHash_;
        value.$savedHash_ = value.tp$hash();
        return value.$savedHash_;
    }
    else if ((value instanceof Object) && (value.__hash__ !== undefined))
    {
        return Sk.misceval.callsim(value.__hash__, value);
    }
    else if (value instanceof Object)
    {
        if (value.__id === undefined)
        {
            Sk.builtin.hashCount += 1;
            value.__id = Sk.builtin.hashCount;
        }
        return value.__id;
    }
    else if (typeof value === "number")
    {
        return value;
    }

    return (typeof value) + ' ' + String(value);
    // todo; throw properly for unhashable types
};

Sk.builtin.getattr = function(obj, name, default_)
{
    Sk.builtin.pyCheckArgs("getattr", arguments, 2, 3);
    Sk.builtin.pyCheckType("name", "string", Sk.builtin.checkString(name));

    var ret = obj.tp$getattr(name.v);
    if (ret === undefined)
    {
        if (default_ !== undefined)
            return default_;
        else
            throw new Sk.builtin.AttributeError();
    }
    return ret;
};

Sk.builtin.input = function(obj, name, default_)
{
    var x = prompt(obj.v);
    return new Sk.builtin.str(x);
};

Sk.builtin.jseval = function jseval(evalcode)
{
    goog.global.eval(evalcode);
};

Sk.builtin.jsmillis = function jsmillis()
{
	var now = new Date()
	return now.valueOf();
};

/*
Sk.builtinFiles = {};
Sk.builtin.read = function read(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
        throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
};
Sk.builtinFiles = undefined;
*/