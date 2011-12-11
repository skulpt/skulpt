// builtins are supposed to come from the __builtin__ module, but we don't do
// that yet.
Sk.builtin = {};

// todo; these should all be func objects too, otherwise str() of them won't
// work, etc.

Sk.builtin.range = function(start, stop, step)
{
    var ret = [];
    var s = new Sk.builtin.slice(start, stop, step);
    s.sssiter$(0, function(i) { ret.push(i); });
    return new Sk.builtin.list(ret);
};

Sk.builtin.len = function(item)
{
    if (item.sq$length)
        return item.sq$length();
    
    if (item.mp$length)
        return item.mp$length();

    throw new Sk.builtin.TypeError("object of type '" + item.tp$name + "' has no len()");
};

Sk.builtin.min = function min()
{
    // todo; throw if no args
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
    // todo; throw if no args
    arguments = Sk.misceval.arrayFromArguments(arguments);
    var highest = arguments[0];
    for (var i = 1; i < arguments.length; ++i)
    {
        if (Sk.misceval.richCompareBool(arguments[i], highest, 'Gt'))
            highest = arguments[i];
    }
    return highest;
};

Sk.builtin.sum = function sum(iter,start)
{
    var tot = 0;
    if (iter instanceof Sk.builtin.list) {
        iter = iter.v;
    } else {
        throw "TypeError: an iterable is required";   
    }
    if (start === undefined ) {
        start = 0;
    }
    for (var i = start; i < iter.length; ++i) {
        if (typeof iter[i] !== "number")
        {
            throw "TypeError: an number is required";
        }
        tot = tot + iter[i];
    }
    return tot;
};

Sk.builtin.abs = function abs(x)
{
    return Math.abs(x);
};

Sk.builtin.ord = function ord(x)
{
    if (x.constructor !== Sk.builtin.str || x.v.length !== 1)
    {
        throw "ord() expected string of length 1";
    }
    return (x.v).charCodeAt(0);
};

Sk.builtin.chr = function chr(x)
{
    if (typeof x !== "number")
    {
        throw "TypeError: an integer is required";
    }
    return new Sk.builtin.str(String.fromCharCode(x));
};

Sk.builtin.dir = function dir(x)
{
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
    if (obj.ob$type === type) return true;

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
    if (value instanceof Object && value.tp$hash !== undefined)
    {
        if (value.$savedHash_) return value.$savedHash_;
        value.$savedHash_ = 'custom ' + value.tp$hash();
        return value.$savedHash_;
    }

    if (value instanceof Object)
    {
        if (value.__id === undefined)
        {
            Sk.builtin.hashCount += 1;
            value.__id = 'object ' + Sk.builtin.hashCount;
        }
        return value.__id;
    }
    return (typeof value) + ' ' + String(value);

    // todo; throw properly for unhashable types
};

Sk.builtin.getattr = function(obj, name, default_)
{
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