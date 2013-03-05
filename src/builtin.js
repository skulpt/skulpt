// builtins are supposed to come from the __builtin__ module, but we don't do
// that yet.
Sk.builtin = {};

// todo; these should all be func objects too, otherwise str() of them won't
// work, etc.

Sk.builtin.asnum$ = function(a) {
	if (a === undefined) return a;
	if (a === null) return a;
	if (typeof a === "number") return a;
	if (typeof a === "string") return a;
	if (a.constructor === Sk.builtin.nmber) return a.v;
	if (a.constructor === Sk.builtin.lng)   return a.str$(10, true);
	if (a.constructor === Sk.builtin.biginteger) return a.toString();

	return a;
}
goog.exportSymbol("Sk.builtin.asnum$", Sk.builtin.asnum$);

Sk.builtin.assk$ = function(a, b) {
	return new Sk.builtin.nmber(a, b);
}
goog.exportSymbol("Sk.builtin.assk$", Sk.builtin.assk$);

Sk.builtin.asnum$nofloat = function(a) {
	if (a === undefined) return a;
	if (a === null) return a;
	if (typeof a === "number") a = a.toString();
	if (a.constructor === Sk.builtin.nmber) a = a.v.toString();
	if (a.constructor === Sk.builtin.lng)   a = a.str$(10, true);
	if (a.constructor === Sk.builtin.biginteger) a = a.toString();

//	Sk.debugout("INITIAL: " + a);

	//	If not a float, great, just return this
	if (a.indexOf('.') < 0 && a.indexOf('e') < 0 && a.indexOf('E') < 0)
		return a;

	var expon=0;
	var mantissa;

	if (a.indexOf('e') >= 0) {
		mantissa = a.substr(0,a.indexOf('e'));
		expon = a.substr(a.indexOf('e')+1);
	} else if (a.indexOf('E') >= 0) {
		mantissa = a.substr(0,a.indexOf('e'));
		expon = a.substr(a.indexOf('E')+1);
	} else {
		mantissa = a;
	}

//	Sk.debugout("e:" + expon);

	expon = parseInt(expon, 10);

//	Sk.debugout("MANTISSA:" + mantissa);
//	Sk.debugout("EXPONENT:" + expon);

	var decimal = mantissa.indexOf('.');

//	Sk.debugout("DECIMAL: " + decimal);

	//	Simplest case, no decimal
	if (decimal < 0) {
		if (expon >= 0) {
			// Just add more zeroes and we're done
			while (expon-- > 0)
				mantissa += "0";
			return mantissa;	
		} else {
			if (mantissa.length > -expon)
				return mantissa.substr(0,mantissa.length + expon);
			else
				return 0;
		}
	}

	//	Negative exponent OR decimal (neg or pos exp)
	if (decimal == 0)
		mantissa = mantissa.substr(1);
	else if (decimal < mantissa.length)
		mantissa = mantissa.substr(0,decimal) + mantissa.substr(decimal+1);
	else
		mantissa = mantissa.substr(0,decimal);

//	Sk.debugout("NO DECIMAL: " + mantissa);

	decimal = decimal + expon;

//	Sk.debugout("MOVE DECIM: " + decimal);

	while (decimal > mantissa.length)
		mantissa += "0";

//	Sk.debugout("PADDED    : " + mantissa);

	if (decimal <= 0) {
		mantissa = 0;
	} else {
		mantissa = mantissa.substr(0,decimal);
	}

//	Sk.debugout("LENGTH: " + mantissa.length);
//	Sk.debugout("RETURN: " + mantissa);

	return mantissa;
}
goog.exportSymbol("Sk.builtin.asnum$nofloat", Sk.builtin.asnum$nofloat);

Sk.builtin.range = function(start, stop, step)
{
    var ret = [];
    var s = new Sk.builtin.slice(Sk.builtin.asnum$(start), Sk.builtin.asnum$(stop), Sk.builtin.asnum$(step));
    s.sssiter$(0, function(i) { ret.push(new Sk.builtin.nmber(i,undefined)); });
    return new Sk.builtin.list(ret);
};

Sk.builtin.len = function(item)
{
    if (item.sq$length)
        return new Sk.builtin.nmber(item.sq$length(),undefined);
    
    if (item.mp$length)
        return new Sk.builtin.nmber(item.mp$length(),undefined);

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
    } else {
		start = Sk.builtin.asnum$(start);
	}
    for (var i = start; i < iter.length; ++i) {
		var tmp = Sk.builtin.asnum$(iter[i]);
        if (typeof tmp !== "number")
        {
            throw "TypeError: an number is required";
        }
        tot = tot + tmp;
    }
    return new Sk.builtin.nmber(tot,undefined);
};

Sk.builtin.abs = function abs(x)
{
    return new Sk.builtin.nmber(Math.abs(Sk.builtin.asnum$(x)),undefined);
};

// http://stackoverflow.com/questions/11832914/round-up-to-2-decimal-places-in-javascriptSk.builtin.round = function round(x,digits){	
	x = Sk.builtin.asnum$(x);	//	This is the lazy way...the right way implements a round routine based on nmber
	digits = Sk.builtin.asnum$(digits);    if (typeof x != "number" ) {        throw "TypeError: a float is required";    }    if(typeof digits === "undefined") {        return Sk.builtin.assk$(Math.round(x), Sk.builtin.nmber.float$);    } else {        var multiplier = Math.pow(10, digits);        return Sk.builtin.assk$((Math.round(x * multiplier) / multiplier), Sk.builtin.nmber.float$);    }};

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
	x = Sk.builtin.asnum$(x);
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
    if (mode === undefined) mode = new Sk.builtin.str("r");
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

Sk.builtin.raw_input = function(obj, name, default_)
{
    var x = prompt(obj.v);
    return new Sk.builtin.str(x);
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

Sk.builtin.all =  function all()
{
    if (arguments.length == 0) {
        throw new Sk.builtin.TypeError("all() takes exactly one argument (0 given)")
    }
    arguments = Sk.misceval.arrayFromArguments(arguments);
    var lowest = arguments[0];
    for (var i = 0; i < arguments.length; ++i)
    {
        if (! Sk.misceval.isTrue(arguments[i]))
            return false;
    }
    return true;
};

Sk.builtin.any =  function any()
{
    if (arguments.length == 0) {
        throw new Sk.builtin.TypeError("any() takes exactly one argument (0 given)")
    }
    arguments = Sk.misceval.arrayFromArguments(arguments);
    var lowest = arguments[0];
    for (var i = 0; i < arguments.length; ++i)
    {
        if (Sk.misceval.isTrue(arguments[i]))
            return true;
    }
    return false;
};


Sk.builtin.superbi =  function superbi()
{
    throw new Sk.builtin.NotImplementedError("Super is not yet implemented, please report your use case as a github issue.");
}
/*
Sk.builtinFiles = {};
Sk.builtin.read = function read(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
        throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
};
Sk.builtinFiles = undefined;
*/
