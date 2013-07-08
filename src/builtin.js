// builtins are supposed to come from the __builtin__ module, but we don't do
// that yet.
Sk.builtin = {};

// todo; these should all be func objects too, otherwise str() of them won't
// work, etc.

Sk.builtin.range = function range(start, stop, step)
{
    var ret = [];
    var i;

    Sk.builtin.pyCheckArgs("range", arguments, 1, 3);
    Sk.builtin.pyCheckType("start", "integer", Sk.builtin.checkInt(start));
    if (stop !== undefined) {
        Sk.builtin.pyCheckType("stop", "integer", Sk.builtin.checkInt(stop));
    };
    if (step !== undefined) {
        Sk.builtin.pyCheckType("step", "integer", Sk.builtin.checkInt(step));
    };

    start = Sk.builtin.asnum$(start);
    stop = Sk.builtin.asnum$(stop);
    step = Sk.builtin.asnum$(step);

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
            ret.push(new Sk.builtin.nmber(i, Sk.builtin.nmber.int$));
        };
    } else {
        for (i=start; i>stop; i+=step) {
            ret.push(new Sk.builtin.nmber(i, Sk.builtin.nmber.int$));
        };        
    };

    return new Sk.builtin.list(ret);
};

Sk.builtin.asnum$ = function(a) {
	if (a === undefined) return a;
	if (a === null) return a;
	if (typeof a === "number") return a;
	if (typeof a === "string") return a;
	if (a.constructor === Sk.builtin.nmber) return a.v;
	if (a.constructor === Sk.builtin.lng) {
	    if (a.cantBeInt())
		return a.str$(10, true);
	    return a.toInt$();
	}
	if (a.constructor === Sk.builtin.biginteger) {
	    if ((a.trueCompare(new Sk.builtin.biginteger(Sk.builtin.lng.threshold$)) > 0)
		|| (a.trueCompare(new Sk.builtin.biginteger(-Sk.builtin.lng.threshold$)) < 0)) {
		return a.toString();
	    }
	    return a.intValue();
	}

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

Sk.builtin.round = function round(number, ndigits)
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

    number = Sk.builtin.asnum$(number);
    ndigits = Sk.builtin.asnum$(ndigits);

    multiplier = Math.pow(10, ndigits);
    result = Math.round(number * multiplier) / multiplier;

    return new Sk.builtin.nmber(result, Sk.builtin.nmber.float$);
};

Sk.builtin.len = function len(item)
{
    Sk.builtin.pyCheckArgs("len", arguments, 1, 1);

    if (item.sq$length)
        return new Sk.builtin.nmber(item.sq$length(), Sk.builtin.nmber.int$);
    
    if (item.mp$length)
        return new Sk.builtin.nmber(item.mp$length(), Sk.builtin.nmber.int$);

    if (item.tp$length)
	return new Sk.builtin.nmber(item.tp$length(), Sk.builtin.nmber.int$);

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
        if (Sk.misceval.isTrue(i)) {
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
        if (!Sk.misceval.isTrue(i)) {
            return false;
        }
    }

    return true;
}

Sk.builtin.sum = function sum(iter,start)
{
    var tot;
    var it, i;
    var has_float;

    Sk.builtin.pyCheckArgs("sum", arguments, 1, 2);
    Sk.builtin.pyCheckType("iter", "iterable", Sk.builtin.checkIterable(iter));
    if (start !== undefined) {        
        Sk.builtin.pyCheckType("start", "number", Sk.builtin.checkNumber(start));
	start = Sk.builtin.asnum$(start);
    };

    if (start === undefined ) {
        start = 0;
    }

    tot = new Sk.builtin.nmber(start, Sk.builtin.nmber.int$);

    it = iter.tp$iter();
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (!Sk.builtin.checkNumber(i)) {
            throw new Sk.builtin.TypeError("a number is required");
        }
	if (i.skType === Sk.builtin.nmber.float$) {
	    has_float = true;
	    if (tot.skType !== Sk.builtin.nmber.float$) {
		tot = new Sk.builtin.nmber(Sk.builtin.asnum$(tot),
					   Sk.builtin.nmber.float$)
	    }
	} else if (i instanceof Sk.builtin.lng) {
	    if (!has_float) {
		if (!(tot instanceof Sk.builtin.lng)) {
		    tot = new Sk.builtin.lng(tot)
		}
	    }
	}

	tot = tot.nb$add(i);
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

    return new Sk.builtin.nmber(Math.abs(Sk.builtin.asnum$(x)),x.skType);
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
    Sk.builtin.pyCheckType("x", "integer", Sk.builtin.checkInt(x));

	x = Sk.builtin.asnum$(x);


    if ((x < 0) || (x > 255))
    {
        throw new Sk.builtin.ValueError("chr() arg not in range(256)");
    }

    return new Sk.builtin.str(String.fromCharCode(x));
};

Sk.builtin.hex = function hex(x)
{
    Sk.builtin.pyCheckType("x", "integer", Sk.builtin.checkInt(x));
    return new Sk.builtin.str('0x'+x.toString(16));
};

Sk.builtin.oct = function oct(x)
{
    Sk.builtin.pyCheckType("x", "integer", Sk.builtin.checkInt(x));
    return new Sk.builtin.str('0'+x.toString(8));
};

Sk.builtin.bin = function bin(x)
{
    Sk.builtin.pyCheckType("x", "integer", Sk.builtin.checkInt(x));
    return new Sk.builtin.str('0b'+x.toString(2));
};

Sk.builtin.dir = function dir(x)
{
    Sk.builtin.pyCheckArgs("dir", arguments, 1, 1);

    var getName = function (k) {
        var s = null;
        var internal = ["__bases__", "__mro__", "__class__"];
        if (internal.indexOf(k) !== -1)
            return null;
        if (k.indexOf('$') !== -1)
            s = Sk.builtin.dir.slotNameToRichName(k);
        else if (k.charAt(k.length - 1) !== '_')
            s = k;
        else if (k.charAt(0) === '_')
            s = k;
        return s;
    };

    var names = [];
    var k;
    var s;
    var i;
    var mro;
    var base;
    var prop;

    // Add all object properties
    for (k in x.constructor.prototype)
    {
        s = getName(k);
        if (s)
            names.push(new Sk.builtin.str(s));
    }

    // Add all attributes
    if (x['$d']) 
    {
        if (x['$d'].tp$iter)
        {
            // Dictionary
            var it = x['$d'].tp$iter();
            var i;
            for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
            {
                s = new Sk.builtin.str(i);
                s = getName(s.v);
                if (s)
                    names.push(new Sk.builtin.str(s));
            }
        }
        else
        {
            // Object
            for (s in x['$d'])
            {
                names.push(new Sk.builtin.str(s));
            }
        }
    }

    // Add all class attributes
    mro = x.tp$mro;
    if (mro)
    {
        mro = x.tp$mro;
        for (i = 0; i < mro.v.length; ++i)
        {
            base = mro.v[i];
            for (prop in base)
            {
                if (base.hasOwnProperty(prop))
                {
                    s = getName(prop);
                    if (s)
                        names.push(new Sk.builtin.str(s));
                }
            }
        }
    }
        
    // Sort results
    names.sort(function(a, b) { return (a.v > b.v) - (a.v < b.v); });

    // Get rid of duplicates before returning, as duplicates should
    //  only occur when they are shadowed
    var last = function(value, index, self) {
	// Returns true iff the value is not the same as the next value
	return value !== self[index+1];
    };
    return new Sk.builtin.list(names.filter(last));
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
    if (mode === undefined) mode = new Sk.builtin.str("r");
    if (mode.v !== "r" && mode.v !== "rb") throw "todo; haven't implemented non-read opens";
    return new Sk.builtin.file(filename, mode, bufsize);
};

Sk.builtin.isinstance = function isinstance(obj, type)
{
    Sk.builtin.pyCheckArgs("isinstance", arguments, 2, 2);

    if (type === Sk.builtin.int_.prototype.ob$type) {
	return (obj.tp$name === 'number') && (obj.skType === Sk.builtin.nmber.int$);
    }

    if (type === Sk.builtin.float_.prototype.ob$type) {
        return (obj.tp$name === 'number') && (obj.skType === Sk.builtin.nmber.float$); 
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
    else if (value === null)
    {
	return 0;  // what should this be?
    }
    else if (value === true)
    {
	return 1;
    }
    else if (value === false)
    {
	return 0;
    }

    return (typeof value) + ' ' + String(value);
    // todo; throw properly for unhashable types
};

Sk.builtin.getattr = function getattr(obj, name, default_)
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

Sk.builtin.superbi =  function superbi()
{
    throw new Sk.builtin.NotImplementedError("Super is not yet implemented, please report your use case as a github issue.");
}

Sk.builtin.hasattr = function hasattr(obj,attr) {
    if (typeof attr.v !== "string")
        throw new Sk.builtin.TypeError('hasattr() attribute name must be a string')

    if (obj.tp$getattr) {
        if (obj.tp$getattr(attr.v)) {
            return true;
        } else
            return false;
    } else
        throw new Sk.builtin.AttributeError('Object has no tp$getattr method')
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