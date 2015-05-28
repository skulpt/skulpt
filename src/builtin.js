// builtins are supposed to come from the __builtin__ module, but we don't do
// that yet.
Sk.builtin = {};

// todo; these should all be func objects too, otherwise str() of them won't
// work, etc.

Sk.builtin.range = function range (start, stop, step) {
    var ret = [];
    var i;

    Sk.builtin.pyCheckArgs("range", arguments, 1, 3);
    Sk.builtin.pyCheckType("start", "integer", Sk.builtin.checkInt(start));
    if (stop !== undefined) {
        Sk.builtin.pyCheckType("stop", "integer", Sk.builtin.checkInt(stop));
    }
    if (step !== undefined) {
        Sk.builtin.pyCheckType("step", "integer", Sk.builtin.checkInt(step));
    }

    start = Sk.builtin.asnum$(start);
    stop = Sk.builtin.asnum$(stop);
    step = Sk.builtin.asnum$(step);

    if ((stop === undefined) && (step === undefined)) {
        stop = start;
        start = 0;
        step = 1;
    } else if (step === undefined) {
        step = 1;
    }

    if (step === 0) {
        throw new Sk.builtin.ValueError("range() step argument must not be zero");
    }

    if (step > 0) {
        for (i = start; i < stop; i += step) {
            ret.push(new Sk.builtin.nmber(i, Sk.builtin.nmber.int$));
        }
    } else {
        for (i = start; i > stop; i += step) {
            ret.push(new Sk.builtin.nmber(i, Sk.builtin.nmber.int$));
        }
    }

    return new Sk.builtin.list(ret);
};

Sk.builtin.asnum$ = function (a) {
    if (a === undefined) {
        return a;
    }
    if (a === null) {
        return a;
    }
    if (a.constructor === Sk.builtin.none) {
        return null;
    }
    if (a.constructor === Sk.builtin.bool) {
        if (a.v) {
            return 1;
        }
        return 0;
    }
    if (typeof a === "number") {
        return a;
    }
    if (typeof a === "string") {
        return a;
    }
    if (a.constructor === Sk.builtin.nmber) {
        return a.v;
    }
    if (a.constructor === Sk.builtin.lng) {
        if (a.cantBeInt()) {
            return a.str$(10, true);
        }
        return a.toInt$();
    }
    if (a.constructor === Sk.builtin.biginteger) {
        if ((a.trueCompare(new Sk.builtin.biginteger(Sk.builtin.nmber.threshold$)) > 0) ||
            (a.trueCompare(new Sk.builtin.biginteger(-Sk.builtin.nmber.threshold$)) < 0)) {
            return a.toString();
        }
        return a.intValue();
    }

    return a;
};

goog.exportSymbol("Sk.builtin.asnum$", Sk.builtin.asnum$);

Sk.builtin.assk$ = function (a, b) {
    return new Sk.builtin.nmber(a, b);
};
goog.exportSymbol("Sk.builtin.assk$", Sk.builtin.assk$);

Sk.builtin.asnum$nofloat = function (a) {
    var decimal;
    var mantissa;
    var expon;
    if (a === undefined) {
        return a;
    }
    if (a === null) {
        return a;
    }
    if (a.constructor === Sk.builtin.none) {
        return null;
    }
    if (a.constructor === Sk.builtin.bool) {
        if (a.v) {
            return 1;
        }
        return 0;
    }
    if (typeof a === "number") {
        a = a.toString();
    }
    if (a.constructor === Sk.builtin.nmber) {
        a = a.v.toString();
    }
    if (a.constructor === Sk.builtin.lng) {
        a = a.str$(10, true);
    }
    if (a.constructor === Sk.builtin.biginteger) {
        a = a.toString();
    }

    //	Sk.debugout("INITIAL: " + a);

    //	If not a float, great, just return this
    if (a.indexOf(".") < 0 && a.indexOf("e") < 0 && a.indexOf("E") < 0) {
        return a;
    }

    expon = 0;

    if (a.indexOf("e") >= 0) {
        mantissa = a.substr(0, a.indexOf("e"));
        expon = a.substr(a.indexOf("e") + 1);
    } else if (a.indexOf("E") >= 0) {
        mantissa = a.substr(0, a.indexOf("e"));
        expon = a.substr(a.indexOf("E") + 1);
    } else {
        mantissa = a;
    }

    expon = parseInt(expon, 10);

    decimal = mantissa.indexOf(".");

    //	Simplest case, no decimal
    if (decimal < 0) {
        if (expon >= 0) {
            // Just add more zeroes and we're done
            while (expon-- > 0) {
                mantissa += "0";
            }
            return mantissa;
        } else {
            if (mantissa.length > -expon) {
                return mantissa.substr(0, mantissa.length + expon);
            }
            else {
                return 0;
            }
        }
    }

    //	Negative exponent OR decimal (neg or pos exp)
    if (decimal === 0) {
        mantissa = mantissa.substr(1);
    }
    else if (decimal < mantissa.length) {
        mantissa = mantissa.substr(0, decimal) + mantissa.substr(decimal + 1);
    }
    else {
        mantissa = mantissa.substr(0, decimal);
    }

    decimal = decimal + expon;
    while (decimal > mantissa.length) {
        mantissa += "0";
    }

    if (decimal <= 0) {
        mantissa = 0;
    } else {
        mantissa = mantissa.substr(0, decimal);
    }

    return mantissa;
};
goog.exportSymbol("Sk.builtin.asnum$nofloat", Sk.builtin.asnum$nofloat);

Sk.builtin.round = function round (number, ndigits) {
    var result, multiplier;
    Sk.builtin.pyCheckArgs("round", arguments, 1, 2);

    if (!Sk.builtin.checkNumber(number)) {
        throw new Sk.builtin.TypeError("a float is required");
    }

    if ((ndigits !== undefined) && !Sk.misceval.isIndex(ndigits)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(ndigits) + "' object cannot be interpreted as an index");
    }

    if (ndigits === undefined) {
        ndigits = 0;
    }

    number = Sk.builtin.asnum$(number);
    ndigits = Sk.misceval.asIndex(ndigits);

    multiplier = Math.pow(10, ndigits);
    result = Math.round(number * multiplier) / multiplier;

    return new Sk.builtin.nmber(result, Sk.builtin.nmber.float$);
};

Sk.builtin.len = function len (item) {
    Sk.builtin.pyCheckArgs("len", arguments, 1, 1);

    if (item.sq$length) {
        return new Sk.builtin.nmber(item.sq$length(), Sk.builtin.nmber.int$);
    }

    if (item.mp$length) {
        return new Sk.builtin.nmber(item.mp$length(), Sk.builtin.nmber.int$);
    }

    if (item.tp$length) {
        return new Sk.builtin.nmber(item.tp$length(), Sk.builtin.nmber.int$);
    }

    throw new Sk.builtin.TypeError("object of type '" + Sk.abstr.typeName(item) + "' has no len()");
};

Sk.builtin.min = function min () {
    var i;
    var lowest;
    var args;
    Sk.builtin.pyCheckArgs("min", arguments, 1);

    args = Sk.misceval.arrayFromArguments(arguments);
    lowest = args[0];

    if (lowest === undefined) {
        throw new Sk.builtin.ValueError("min() arg is an empty sequence");
    }

    for (i = 1; i < args.length; ++i) {
        if (Sk.misceval.richCompareBool(args[i], lowest, "Lt")) {
            lowest = args[i];
        }
    }
    return lowest;
};

Sk.builtin.max = function max () {
    var i;
    var highest;
    var args;
    Sk.builtin.pyCheckArgs("max", arguments, 1);

    args = Sk.misceval.arrayFromArguments(arguments);
    highest = args[0];

    if (highest === undefined) {
        throw new Sk.builtin.ValueError("max() arg is an empty sequence");
    }

    for (i = 1; i < args.length; ++i) {
        if (Sk.misceval.richCompareBool(args[i], highest, "Gt")) {
            highest = args[i];
        }
    }
    return highest;
};

Sk.builtin.any = function any (iter) {
    var it, i;

    Sk.builtin.pyCheckArgs("any", arguments, 1);
    if (!Sk.builtin.checkIterable(iter)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter) +
            "' object is not iterable");
    }

    it = iter.tp$iter();
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (Sk.misceval.isTrue(i)) {
            return Sk.builtin.bool.true$;
        }
    }

    return Sk.builtin.bool.false$;
};

Sk.builtin.all = function all (iter) {
    var it, i;

    Sk.builtin.pyCheckArgs("all", arguments, 1);
    if (!Sk.builtin.checkIterable(iter)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter) +
            "' object is not iterable");
    }

    it = iter.tp$iter();
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (!Sk.misceval.isTrue(i)) {
            return Sk.builtin.bool.false$;
        }
    }

    return Sk.builtin.bool.true$;
};

Sk.builtin.sum = function sum (iter, start) {
    var tot;
    var it, i;
    var has_float;

    Sk.builtin.pyCheckArgs("sum", arguments, 1, 2);
    Sk.builtin.pyCheckType("iter", "iterable", Sk.builtin.checkIterable(iter));
    if (start !== undefined && Sk.builtin.checkString(start)) {
        throw new Sk.builtin.TypeError("sum() can't sum strings [use ''.join(seq) instead]");
    }
    if (start === undefined) {
        tot = new Sk.builtin.nmber(0, Sk.builtin.nmber.int$);
    }
    else {
        tot = start;
    }

    it = iter.tp$iter();
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (i.skType === Sk.builtin.nmber.float$) {
            has_float = true;
            if (tot.skType !== Sk.builtin.nmber.float$) {
                tot = new Sk.builtin.nmber(Sk.builtin.asnum$(tot),
                    Sk.builtin.nmber.float$);
            }
        } else if (i instanceof Sk.builtin.lng) {
            if (!has_float) {
                if (!(tot instanceof Sk.builtin.lng)) {
                    tot = new Sk.builtin.lng(tot);
                }
            }
        }

        if (tot.nb$add(i) !== undefined) {
            tot = tot.nb$add(i);
        } else {
            throw new Sk.builtin.TypeError("unsupported operand type(s) for +: '" +
                Sk.abstr.typeName(tot) + "' and '" +
                Sk.abstr.typeName(i) + "'");
        }
    }

    return tot;
};

Sk.builtin.zip = function zip () {
    var el;
    var tup;
    var done;
    var res;
    var i;
    var iters;
    if (arguments.length === 0) {
        return new Sk.builtin.list([]);
    }

    iters = [];
    for (i = 0; i < arguments.length; i++) {
        if (arguments[i].tp$iter) {
            iters.push(arguments[i].tp$iter());
        }
        else {
            throw new Sk.builtin.TypeError("argument " + i + " must support iteration");
        }
    }
    res = [];
    done = false;
    while (!done) {
        tup = [];
        for (i = 0; i < arguments.length; i++) {
            el = iters[i].tp$iternext();
            if (el === undefined) {
                done = true;
                break;
            }
            tup.push(el);
        }
        if (!done) {
            res.push(new Sk.builtin.tuple(tup));
        }
    }
    return new Sk.builtin.list(res);
};

Sk.builtin.abs = function abs (x) {
    Sk.builtin.pyCheckArgs("abs", arguments, 1, 1);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

    return new Sk.builtin.nmber(Math.abs(Sk.builtin.asnum$(x)), x.skType);
};

Sk.builtin.ord = function ord (x) {
    Sk.builtin.pyCheckArgs("ord", arguments, 1, 1);

    if (!Sk.builtin.checkString(x)) {
        throw new Sk.builtin.TypeError("ord() expected a string of length 1, but " + Sk.abstr.typeName(x) + " found");
    }
    else if (x.v.length !== 1) {
        throw new Sk.builtin.TypeError("ord() expected a character, but string of length " + x.v.length + " found");
    }
    return new Sk.builtin.nmber((x.v).charCodeAt(0), Sk.builtin.nmber.int$);
};

Sk.builtin.chr = function chr (x) {
    Sk.builtin.pyCheckArgs("chr", arguments, 1, 1);
    if (!Sk.builtin.checkInt(x)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }
    x = Sk.builtin.asnum$(x);


    if ((x < 0) || (x > 255)) {
        throw new Sk.builtin.ValueError("chr() arg not in range(256)");
    }

    return new Sk.builtin.str(String.fromCharCode(x));
};

Sk.builtin.int2str_ = function helper_ (x, radix, prefix) {
    var suffix;
    var str = "";
    if (x instanceof Sk.builtin.lng) {
        suffix = "";
        if (radix !== 2) {
            suffix = "L";
        }

        str = x.str$(radix, false);
        if (x.nb$isnegative()) {
            return new Sk.builtin.str("-" + prefix + str + suffix);
        }
        return new Sk.builtin.str(prefix + str + suffix);
    } else {
        x = Sk.misceval.asIndex(x);
        str = x.toString(radix);
        if (x < 0) {
            return new Sk.builtin.str("-" + prefix + str.slice(1));
        }
        return new Sk.builtin.str(prefix + str);
    }
};

Sk.builtin.hex = function hex (x) {
    Sk.builtin.pyCheckArgs("hex", arguments, 1, 1);
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("hex() argument can't be converted to hex");
    }
    return Sk.builtin.int2str_(x, 16, "0x");
};

Sk.builtin.oct = function oct (x) {
    Sk.builtin.pyCheckArgs("oct", arguments, 1, 1);
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("oct() argument can't be converted to hex");
    }
    return Sk.builtin.int2str_(x, 8, "0");
};

Sk.builtin.bin = function bin (x) {
    Sk.builtin.pyCheckArgs("bin", arguments, 1, 1);
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(x) + "' object can't be interpreted as an index");
    }
    return Sk.builtin.int2str_(x, 2, "0b");
};

Sk.builtin.dir = function dir (x) {
    var last;
    var it;
    var prop;
    var base;
    var mro;
    var i;
    var s;
    var k;
    var names;
    var getName;
    Sk.builtin.pyCheckArgs("dir", arguments, 1, 1);

    getName = function (k) {
        var s = null;
        var internal = ["__bases__", "__mro__", "__class__"];
        if (internal.indexOf(k) !== -1) {
            return null;
        }
        if (k.indexOf("$") !== -1) {
            s = Sk.builtin.dir.slotNameToRichName(k);
        }
        else if (k.charAt(k.length - 1) !== "_") {
            s = k;
        }
        else if (k.charAt(0) === "_") {
            s = k;
        }
        return s;
    };

    names = [];

    // Add all object properties
    for (k in x.constructor.prototype) {
        s = getName(k);
        if (s) {
            names.push(new Sk.builtin.str(s));
        }
    }

    // Add all attributes
    if (x["$d"]) {
        if (x["$d"].tp$iter) {
            // Dictionary
            it = x["$d"].tp$iter();
            for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                s = new Sk.builtin.str(i);
                s = getName(s.v);
                if (s) {
                    names.push(new Sk.builtin.str(s));
                }
            }
        }
        else {
            // Object
            for (s in x["$d"]) {
                names.push(new Sk.builtin.str(s));
            }
        }
    }

    // Add all class attributes
    mro = x.tp$mro;
    if (mro) {
        mro = x.tp$mro;
        for (i = 0; i < mro.v.length; ++i) {
            base = mro.v[i];
            for (prop in base) {
                if (base.hasOwnProperty(prop)) {
                    s = getName(prop);
                    if (s) {
                        names.push(new Sk.builtin.str(s));
                    }
                }
            }
        }
    }

    // Sort results
    names.sort(function (a, b) {
        return (a.v > b.v) - (a.v < b.v);
    });

    // Get rid of duplicates before returning, as duplicates should
    //  only occur when they are shadowed
    last = function (value, index, self) {
        // Returns true iff the value is not the same as the next value
        return value !== self[index + 1];
    };
    return new Sk.builtin.list(names.filter(last));
};

Sk.builtin.dir.slotNameToRichName = function (k) {
    // todo; map tp$xyz to __xyz__ properly
    return undefined;
};

Sk.builtin.repr = function repr (x) {
    Sk.builtin.pyCheckArgs("repr", arguments, 1, 1);

    return Sk.misceval.objectRepr(x);
};

Sk.builtin.open = function open (filename, mode, bufsize) {
    Sk.builtin.pyCheckArgs("open", arguments, 1, 3);
    if (mode === undefined) {
        mode = new Sk.builtin.str("r");
    }
    if (mode.v !== "r" && mode.v !== "rb") {
        throw "todo; haven't implemented non-read opens";
    }
    return new Sk.builtin.file(filename, mode, bufsize);
};

Sk.builtin.isinstance = function isinstance (obj, type) {
    var issubclass;
    var i;
    Sk.builtin.pyCheckArgs("isinstance", arguments, 2, 2);
    if (!Sk.builtin.checkClass(type) && !(type instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("isinstance() arg 2 must be a class, type, or tuple of classes and types");
    }

    if (type === Sk.builtin.int_.prototype.ob$type) {
        if ((obj.tp$name === "number") && (obj.skType === Sk.builtin.nmber.int$)) {
            return Sk.builtin.bool.true$;
        }
        else {
            return Sk.builtin.bool.false$;
        }
    }

    if (type === Sk.builtin.float_.prototype.ob$type) {
        if ((obj.tp$name === "number") && (obj.skType === Sk.builtin.nmber.float$)) {
            return Sk.builtin.bool.true$;
        }
        else {
            return Sk.builtin.bool.false$;
        }
    }

    if (type === Sk.builtin.none.prototype.ob$type) {
        if (obj instanceof Sk.builtin.none) {
            return Sk.builtin.bool.true$;
        }
        else {
            return Sk.builtin.bool.false$;
        }
    }

    // Normal case
    if (obj.ob$type === type) {
        return Sk.builtin.bool.true$;
    }

    // Handle tuple type argument
    if (type instanceof Sk.builtin.tuple) {
        for (i = 0; i < type.v.length; ++i) {
            if (Sk.misceval.isTrue(Sk.builtin.isinstance(obj, type.v[i]))) {
                return Sk.builtin.bool.true$;
            }
        }
        return Sk.builtin.bool.false$;
    }

    issubclass = function (klass, base) {
        var i;
        var bases;
        if (klass === base) {
            return Sk.builtin.bool.true$;
        }
        if (klass["$d"] === undefined) {
            return Sk.builtin.bool.false$;
        }
        bases = klass["$d"].mp$subscript(Sk.builtin.type.basesStr_);
        for (i = 0; i < bases.v.length; ++i) {
            if (Sk.misceval.isTrue(issubclass(bases.v[i], base))) {
                return Sk.builtin.bool.true$;
            }
        }
        return Sk.builtin.bool.false$;
    };

    return issubclass(obj.ob$type, type);
};
Sk.builtin.hashCount = 0;
Sk.builtin.hash = function hash (value) {
    var junk;
    Sk.builtin.pyCheckArgs("hash", arguments, 1, 1);

    // Useless object to get compiler to allow check for __hash__ property
    junk = {__hash__: function () {
        return 0;
    }};

    if ((value instanceof Object) && (value.tp$hash !== undefined)) {
        if (value.$savedHash_) {
            return value.$savedHash_;
        }
        value.$savedHash_ = value.tp$hash();
        return value.$savedHash_;
    }
    else if ((value instanceof Object) && (value.__hash__ !== undefined)) {
        return Sk.misceval.callsim(value.__hash__, value);
    }
    else if (value instanceof Sk.builtin.bool) {
        if (value.v) {
            return new Sk.builtin.nmber(1, Sk.builtin.nmber.int$);
        }
        return new Sk.builtin.nmber(0, Sk.builtin.nmber.int$);
    }
    else if (value instanceof Sk.builtin.none) {
        return new Sk.builtin.nmber(0, Sk.builtin.nmber.int$);
    }
    else if (value instanceof Object) {
        if (value.__id === undefined) {
            Sk.builtin.hashCount += 1;
            value.__id = Sk.builtin.hashCount;
        }
        return new Sk.builtin.nmber(value.__id, Sk.builtin.nmber.int$);
    }
    else if (typeof value === "number" || value === null ||
        value === true || value === false) {
        throw new Sk.builtin.TypeError("unsupported Javascript type");
    }

    return new Sk.builtin.str((typeof value) + " " + String(value));
    // todo; throw properly for unhashable types
};

Sk.builtin.getattr = function getattr (obj, name, default_) {
    var ret;
    Sk.builtin.pyCheckArgs("getattr", arguments, 2, 3);
    if (!Sk.builtin.checkString(name)) {
        throw new Sk.builtin.TypeError("attribute name must be string");
    }

    ret = obj.tp$getattr(name.v);
    if (ret === undefined) {
        if (default_ !== undefined) {
            return default_;
        }
        else {
            throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(obj) + "' object has no attribute '" + name.v + "'");
        }
    }
    return ret;
};

Sk.builtin.setattr = function setattr (obj, name, value) {

    Sk.builtin.pyCheckArgs("setattr", arguments, 3, 3);
    if (!Sk.builtin.checkString(name)) {
        throw new Sk.builtin.TypeError("attribute name must be string");
    }
    if (obj.tp$setattr) {
        obj.tp$setattr(Sk.ffi.remapToJs(name), value);
    } else {
        throw new Sk.builtin.AttributeError("object has no attribute " + Sk.ffi.remapToJs(name));
    }

    return Sk.builtin.none.none$;
};

Sk.builtin.raw_input = function (prompt) {
    var x, resolution, susp;

    prompt = prompt ? prompt.v : "";
    x = Sk.inputfun(prompt);

    if (x instanceof Promise) {
        susp = new Sk.misceval.Suspension();

        susp.resume = function() {
            return new Sk.builtin.str(resolution);
        };

        susp.data = {
            type: "Sk.promise",
            promise: x.then(function(value) {
                resolution = value;
                return value;
            }, function(err) {
                resolution = "";
                return err;
            })
        };

        return susp;
    }
    else {
        return new Sk.builtin.str(x);
    }
};

Sk.builtin.input = Sk.builtin.raw_input;

Sk.builtin.jseval = function jseval (evalcode) {
    goog.global["eval"](evalcode);
};

Sk.builtin.jsmillis = function jsmillis () {
    var now = new Date();
    return now.valueOf();
};

Sk.builtin.superbi = function superbi () {
    throw new Sk.builtin.NotImplementedError("super is not yet implemented, please report your use case as a github issue.");
};

Sk.builtin.eval_ = function eval_ () {
    throw new Sk.builtin.NotImplementedError("eval is not yet implemented");
};

Sk.builtin.map = function map (fun, seq) {
    var iter, item;
    var retval;
    var next;
    var nones;
    var args;
    var argnum;
    var i;
    var iterables;
    var combined;
    Sk.builtin.pyCheckArgs("map", arguments, 2);

    if (arguments.length > 2) {
        // Pack sequences into one list of Javascript Arrays

        combined = [];
        iterables = Array.prototype.slice.apply(arguments).slice(1);
        for (i in iterables) {
            if (!Sk.builtin.checkIterable(iterables[i])) {
                argnum = parseInt(i, 10) + 2;
                throw new Sk.builtin.TypeError("argument " + argnum + " to map() must support iteration");
            }
            iterables[i] = iterables[i].tp$iter();
        }

        while (true) {
            args = [];
            nones = 0;
            for (i in iterables) {
                next = iterables[i].tp$iternext();
                if (next === undefined) {
                    args.push(Sk.builtin.none.none$);
                    nones++;
                }
                else {
                    args.push(next);
                }
            }
            if (nones !== iterables.length) {
                combined.push(args);
            }
            else {
                // All iterables are done
                break;
            }
        }
        seq = new Sk.builtin.list(combined);
    }
    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    retval = [];

    for (iter = seq.tp$iter(), item = iter.tp$iternext();
         item !== undefined;
         item = iter.tp$iternext()) {
        if (fun === Sk.builtin.none.none$) {
            if (item instanceof Array) {
                // With None function and multiple sequences,
                // map should return a list of tuples
                item = new Sk.builtin.tuple(item);
            }
            retval.push(item);
        }
        else {
            if (!(item instanceof Array)) {
                // If there was only one iterable, convert to Javascript
                // Array for call to apply.
                item = [item];
            }
            retval.push(Sk.misceval.apply(fun, undefined, undefined, undefined, item));
        }
    }

    return new Sk.builtin.list(retval);
};

Sk.builtin.reduce = function reduce (fun, seq, initializer) {
    var item;
    var accum_value;
    var iter;
    Sk.builtin.pyCheckArgs("reduce", arguments, 2, 3);
    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    iter = seq.tp$iter();
    if (initializer === undefined) {
        initializer = iter.tp$iternext();
        if (initializer === undefined) {
            throw new Sk.builtin.TypeError("reduce() of empty sequence with no initial value");
        }
    }
    accum_value = initializer;
    for (item = iter.tp$iternext();
         item !== undefined;
         item = iter.tp$iternext()) {
        accum_value = Sk.misceval.callsim(fun, accum_value, item);
    }

    return accum_value;
};

Sk.builtin.filter = function filter (fun, iterable) {
    var result;
    var iter, item;
    var retval;
    var ret;
    var add;
    var ctor;
    Sk.builtin.pyCheckArgs("filter", arguments, 2, 2);

    if (!Sk.builtin.checkIterable(iterable)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
    }

    ctor = function () {
        return [];
    };
    add = function (iter, item) {
        iter.push(item);
        return iter;
    };
    ret = function (iter) {
        return new Sk.builtin.list(iter);
    };

    if (iterable.__class__ === Sk.builtin.str) {
        ctor = function () {
            return new Sk.builtin.str("");
        };
        add = function (iter, item) {
            return iter.sq$concat(item);
        };
        ret = function (iter) {
            return iter;
        };
    }
    else if (iterable.__class__ === Sk.builtin.tuple) {
        ret = function (iter) {
            return new Sk.builtin.tuple(iter);
        };
    }

    retval = ctor();

    for (iter = iterable.tp$iter(), item = iter.tp$iternext();
         item !== undefined;
         item = iter.tp$iternext()) {
        if (fun === Sk.builtin.none.none$) {
            result = Sk.builtin.bool(item);
        }
        else {
            result = Sk.misceval.callsim(fun, item);
        }

        if (Sk.misceval.isTrue(result)) {
            retval = add(retval, item);
        }
    }

    return ret(retval);
};

Sk.builtin.hasattr = function hasattr (obj, attr) {
    Sk.builtin.pyCheckArgs("hasattr", arguments, 2, 2);
    if (!Sk.builtin.checkString(attr)) {
        throw new Sk.builtin.TypeError("hasattr(): attribute name must be string");
    }

    if (obj.tp$getattr) {
        if (obj.tp$getattr(attr.v)) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.bool.false$;
        }
    } else {
        throw new Sk.builtin.AttributeError("Object has no tp$getattr method");
    }
};


Sk.builtin.pow = function pow (a, b, c) {
    var ret;
    var res;
    var right;
    var left;
    var c_num;
    var b_num;
    var a_num;
    Sk.builtin.pyCheckArgs("pow", arguments, 2, 3);

    if (c instanceof Sk.builtin.none) {
        c = undefined;
    }

    a_num = Sk.builtin.asnum$(a);
    b_num = Sk.builtin.asnum$(b);
    c_num = Sk.builtin.asnum$(c);

    if (!Sk.builtin.checkNumber(a) || !Sk.builtin.checkNumber(b)) {
        if (c === undefined) {
            throw new Sk.builtin.TypeError("unsupported operand type(s) for pow(): '" + Sk.abstr.typeName(a) + "' and '" + Sk.abstr.typeName(b) + "'");
        }
        throw new Sk.builtin.TypeError("unsupported operand type(s) for pow(): '" + Sk.abstr.typeName(a) + "', '" + Sk.abstr.typeName(b) + "', '" + Sk.abstr.typeName(c) + "'");
    }
    if (a_num < 0 && b.skType === Sk.builtin.nmber.float$) {
        throw new Sk.builtin.ValueError("negative number cannot be raised to a fractional power");
    }

    if (c === undefined) {
        if ((a.skType === Sk.builtin.nmber.float$ || b.skType === Sk.builtin.nmber.float$) || (b_num < 0)) {
            return new Sk.builtin.nmber(Math.pow(a_num, b_num), Sk.builtin.nmber.float$);
        }

        left = new Sk.builtin.nmber(a_num, Sk.builtin.nmber.int$);
        right = new Sk.builtin.nmber(b_num, Sk.builtin.nmber.int$);
        res = left.nb$power(right);

        if (a instanceof Sk.builtin.lng || b instanceof Sk.builtin.lng) {
            return new Sk.builtin.lng(res);
        }

        return res;
    }
    else {
        if (!Sk.builtin.checkInt(a) || !Sk.builtin.checkInt(b) || !Sk.builtin.checkInt(c)) {
            throw new Sk.builtin.TypeError("pow() 3rd argument not allowed unless all arguments are integers");
        }
        if (b_num < 0) {
            throw new Sk.builtin.TypeError("pow() 2nd argument cannot be negative when 3rd argument specified");
        }

        if ((a instanceof Sk.builtin.lng || b instanceof Sk.builtin.lng || c instanceof Sk.builtin.lng) ||
            (Math.pow(a_num, b_num) === Infinity)) {
            // convert a to a long so that we can use biginteger's modPowInt method
            a = new Sk.builtin.lng(a);
            return a.nb$power(b, c);
        }
        else {
            ret = new Sk.builtin.nmber(Math.pow(a_num, b_num), Sk.builtin.nmber.int$);
            return ret.nb$remainder(c);
        }
    }
};

Sk.builtin.quit = function quit (msg) {
    var s = new Sk.builtin.str(msg).v;
    throw new Sk.builtin.SystemExit(s);
};


Sk.builtin.issubclass = function issubclass (c1, c2) {
    var i;
    var issubclass_internal;
    Sk.builtin.pyCheckArgs("issubclass", arguments, 2, 2);
    if (!Sk.builtin.checkClass(c2) && !(c2 instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("issubclass() arg 2 must be a classinfo, type, or tuple of classes and types");
    }

    //print("c1 name: " + c1.tp$name);

    if (c2 === Sk.builtin.int_.prototype.ob$type) {
        return true;
    }

    if (c2 === Sk.builtin.float_.prototype.ob$type) {
        return true;
    }

    if (c2 === Sk.builtin.none.prototype.ob$type) {
        return true;
    }

    // Normal case
    if (c1.ob$type === c2) {
        return true;
    }

    issubclass_internal = function (klass, base) {
        var i;
        var bases;
        if (klass === base) {
            return true;
        }
        if (klass["$d"] === undefined) {
            return false;
        }
        if (klass["$d"].mp$subscript) {
            bases = klass["$d"].mp$subscript(Sk.builtin.type.basesStr_);
        } else {
            return false;
        }
        for (i = 0; i < bases.v.length; ++i) {
            if (issubclass_internal(bases.v[i], base)) {
                return true;
            }
        }
        return false;
    };

    // Handle tuple type argument
    if (c2 instanceof Sk.builtin.tuple) {
        for (i = 0; i < c2.v.length; ++i) {
            if (Sk.builtin.issubclass(c1, c2.v[i])) {
                return true;
            }
        }
        return false;
    }

    return issubclass_internal(c1, c2);

};

Sk.builtin.globals = function globals () {
    var i;
    var ret = new Sk.builtin.dict([]);
    for (i in Sk["globals"]) {
        ret.mp$ass_subscript(new Sk.builtin.str(i), Sk["globals"][i]);
    }

    return ret;

};

Sk.builtin.divmod = function divmod (a, b) {
    return Sk.abstr.numberBinOp(a, b, "DivMod");
};


Sk.builtin.bytearray = function bytearray () {
    throw new Sk.builtin.NotImplementedError("bytearray is not yet implemented");
};
Sk.builtin.callable = function callable () {
    throw new Sk.builtin.NotImplementedError("callable is not yet implemented");
};
Sk.builtin.complex = function complex () {
    throw new Sk.builtin.NotImplementedError("complex is not yet implemented");
};
Sk.builtin.delattr = function delattr () {
    throw new Sk.builtin.NotImplementedError("delattr is not yet implemented");
};
Sk.builtin.execfile = function execfile () {
    throw new Sk.builtin.NotImplementedError("execfile is not yet implemented");
};
Sk.builtin.format = function format () {
    throw new Sk.builtin.NotImplementedError("format is not yet implemented");
};
Sk.builtin.frozenset = function frozenset () {
    throw new Sk.builtin.NotImplementedError("frozenset is not yet implemented");
};

Sk.builtin.help = function help () {
    throw new Sk.builtin.NotImplementedError("help is not yet implemented");
};
Sk.builtin.iter = function iter () {
    throw new Sk.builtin.NotImplementedError("iter is not yet implemented");
};
Sk.builtin.locals = function locals () {
    throw new Sk.builtin.NotImplementedError("locals is not yet implemented");
};
Sk.builtin.memoryview = function memoryview () {
    throw new Sk.builtin.NotImplementedError("memoryview is not yet implemented");
};
Sk.builtin.next_ = function next_ () {
    throw new Sk.builtin.NotImplementedError("next is not yet implemented");
};
Sk.builtin.property = function property () {
    throw new Sk.builtin.NotImplementedError("property is not yet implemented");
};
Sk.builtin.reload = function reload () {
    throw new Sk.builtin.NotImplementedError("reload is not yet implemented");
};
Sk.builtin.reversed = function reversed () {
    throw new Sk.builtin.NotImplementedError("reversed is not yet implemented");
};
Sk.builtin.unichr = function unichr () {
    throw new Sk.builtin.NotImplementedError("unichr is not yet implemented");
};
Sk.builtin.vars = function vars () {
    throw new Sk.builtin.NotImplementedError("vars is not yet implemented");
};
Sk.builtin.xrange = Sk.builtin.range;
Sk.builtin.apply_ = function apply_ () {
    throw new Sk.builtin.NotImplementedError("apply is not yet implemented");
};
Sk.builtin.buffer = function buffer () {
    throw new Sk.builtin.NotImplementedError("buffer is not yet implemented");
};
Sk.builtin.coerce = function coerce () {
    throw new Sk.builtin.NotImplementedError("coerce is not yet implemented");
};
Sk.builtin.intern = function intern () {
    throw new Sk.builtin.NotImplementedError("intern is not yet implemented");
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
