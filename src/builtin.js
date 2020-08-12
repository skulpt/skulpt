/**
 * builtins are supposed to come from the __builtin__ module, but we don't do
 * that yet.
 * todo; these should all be func objects too, otherwise str() of them won't
 * work, etc.
 */

Sk.builtin.range = function range (start, stop, step) {
    var ret = [];
    var lst;
    var i;

    Sk.builtin.pyCheckArgsLen("range", arguments.length, 1, 3);
    Sk.builtin.pyCheckType("start", "integer", Sk.misceval.isIndex(start));
    start = Sk.misceval.asIndex(start);
    if (stop !== undefined) {
        Sk.builtin.pyCheckType("stop", "integer", Sk.misceval.isIndex(stop));
        stop = Sk.misceval.asIndex(stop);
    }
    if (step !== undefined) {
        Sk.builtin.pyCheckType("step", "integer", Sk.misceval.isIndex(step));
        step = Sk.misceval.asIndex(step);
    }

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

    if ((typeof start === "number")
	&& (typeof stop === "number")
	&& (typeof step === "number")) {
        if (step > 0) {
            for (i = start; i < stop; i += step) {
                ret.push(new Sk.builtin.int_(i));
            }
        } else {
            for (i = start; i > stop; i += step) {
                ret.push(new Sk.builtin.int_(i));
            }
        }
    } else {
        // This is going to be slow, really needs to be a generator!
        var startlng = new Sk.builtin.lng(start);
        var stoplng = new Sk.builtin.lng(stop);
        var steplng = new Sk.builtin.lng(step);

        if (steplng.nb$ispositive()) {
            i = startlng;
            while (Sk.misceval.isTrue(i.ob$lt(stoplng))) {
                ret.push(i);
                i = i.nb$add(steplng);
            }
        } else {
            i = startlng;
            while (Sk.misceval.isTrue(i.ob$gt(stoplng))) {
                ret.push(i);
                i = i.nb$add(steplng);
            }
        }
    }

    lst = new Sk.builtin.list(ret);

    if (Sk.__future__.python3) {
        return new Sk.builtin.range_(start, stop, step, lst);
    }

    return lst;
};

Sk.builtin.asnum$ = function (a) {
    if (a === undefined) {
        return a;
    }
    if (a === null) {
        return a;
    }
    if (a === Sk.builtin.none.none$) {
        return null;
    }
    if (a instanceof Sk.builtin.bool) {
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
    if (a instanceof Sk.builtin.int_) {
        return a.v;
    }
    if (a instanceof Sk.builtin.float_) {
        return a.v;
    }
    if (a instanceof Sk.builtin.lng) {
        if (a.cantBeInt()) {
            return a.str$(10, true);
        }
        return a.toInt$();
    }
    if (a.constructor === Sk.builtin.biginteger) {
        if ((a.trueCompare(new Sk.builtin.biginteger(Sk.builtin.int_.threshold$)) > 0) ||
            (a.trueCompare(new Sk.builtin.biginteger(-Sk.builtin.int_.threshold$)) < 0)) {
            return a.toString();
        }
        return a.intValue();
    }

    return a;
};

Sk.exportSymbol("Sk.builtin.asnum$", Sk.builtin.asnum$);

/**
 * Return a Python number (either float or int) from a Javascript number.
 *
 * Javacsript function, returns Python object.
 *
 * @param  {number} a Javascript number to transform into Python number.
 * @return {(Sk.builtin.int_|Sk.builtin.float_)} A Python number.
 */
Sk.builtin.assk$ = function (a) {
    if (a % 1 === 0) {
        return new Sk.builtin.int_(a);
    } else {
        return new Sk.builtin.float_(a);
    }
};
Sk.exportSymbol("Sk.builtin.assk$", Sk.builtin.assk$);

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
    if (a.constructor === Sk.builtin.int_) {
        a = a.v.toString();
    }
    if (a.constructor === Sk.builtin.float_) {
        a = a.v.toString();
    }
    if (a.constructor === Sk.builtin.lng) {
        a = a.str$(10, true);
    }
    if (a.constructor === Sk.builtin.biginteger) {
        a = a.toString();
    }

    //  Sk.debugout("INITIAL: " + a);

    //  If not a float, great, just return this
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

    //  Simplest case, no decimal
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
            } else {
                return 0;
            }
        }
    }

    //  Negative exponent OR decimal (neg or pos exp)
    if (decimal === 0) {
        mantissa = mantissa.substr(1);
    } else if (decimal < mantissa.length) {
        mantissa = mantissa.substr(0, decimal) + mantissa.substr(decimal + 1);
    } else {
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
Sk.exportSymbol("Sk.builtin.asnum$nofloat", Sk.builtin.asnum$nofloat);

Sk.builtin.round = function round (number, ndigits) {
    var special;
    Sk.builtin.pyCheckArgsLen("round", arguments.length, 1, 2);

    if (!Sk.builtin.checkNumber(number)) {
        if (!Sk.builtin.checkFunction(number)) {
            throw new Sk.builtin.TypeError("a float is required");
        } else {
            if (!Sk.__future__.exceptions) {
                throw new Sk.builtin.AttributeError(Sk.abstr.typeName(number) + " instance has no attribute '__float__'");
            }
        }
    }

    if ((ndigits !== undefined) && !Sk.misceval.isIndex(ndigits)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(ndigits) + "' object cannot be interpreted as an index");
    }

    if (!Sk.__future__.dunder_round && number.round$) {
        return number.round$(number, ndigits);
    }

    // try calling internal magic method
    special = Sk.abstr.lookupSpecial(number, Sk.builtin.str.$round);
    if (special != null) {
        // method on builtin, provide this arg
        if (!Sk.builtin.checkFunction(number)) {
            return Sk.misceval.callsimArray(special, [number, ndigits]);
        } else {
            return Sk.misceval.callsimArray(special, [number]);
        }
    } else {
        throw new Sk.builtin.TypeError("a float is required");
    }
};

Sk.builtin.len = function len (item) {
    var intcheck;
    var special;
    Sk.builtin.pyCheckArgsLen("len", arguments.length, 1, 1);

    var int_ = function(i) { return new Sk.builtin.int_(i); };
    intcheck = function(j) {
        if (Sk.builtin.checkInt(j)) {
            return int_(j);
        } else {
            if (Sk.__future__.exceptions) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(j) + "' object cannot be interpreted as an integer");
            } else {
                throw new Sk.builtin.TypeError("__len__() should return an int");
            }
        }
    };

    if (item.sq$length) {
        return Sk.misceval.chain(item.sq$length(true), intcheck);
    }

    if (item.mp$length) {
        return Sk.misceval.chain(item.mp$length(), int_);
    }

    if (item.tp$length) {
        if (Sk.builtin.checkFunction(item)) {
            special = Sk.abstr.lookupSpecial(item, Sk.builtin.str.$len);
            if (special != null) {
                return Sk.misceval.callsimArray(special, [item]);
            } else {
                if (Sk.__future__.exceptions) {
                    throw new Sk.builtin.TypeError("object of type '" + Sk.abstr.typeName(item) + "' has no len()");
                } else {
                    throw new Sk.builtin.AttributeError(Sk.abstr.typeName(item) + " instance has no attribute '__len__'");
                }
            }
        } else {
            return Sk.misceval.chain(item.tp$length(true), intcheck);
        }
    }

    throw new Sk.builtin.TypeError("object of type '" + Sk.abstr.typeName(item) + "' has no len()");
};

Sk.builtin.min = function min($default, key, args) {
    const nargs = args.sq$length();
    if (!nargs) {
        throw new Sk.builtin.TypeError("min expected 1 argument, got 0");
    }

    // if args is not a single iterable then default should not be included as a kwarg
    if (nargs > 1 && $default !== null) {
        throw new Sk.builtin.TypeError("Cannot specify a default for min() with multiple positional arguments");
    }

    if (nargs == 1) {
        args = args.v[0];
        if (!Sk.builtin.checkIterable(args)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(args) + "' object is not iterable");
        }
    }
    let iter = Sk.abstr.iter(args);

    if (!Sk.builtin.checkNone(key) && !Sk.builtin.checkCallable(key)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(key) + "' object is not callable");
    }

    let lowest;
    return Sk.misceval.chain(
        iter.tp$iternext(true),
        (i) => {
            lowest = i;
            if (lowest === undefined) {
                return;
            }
            if (Sk.builtin.checkNone(key)) {
                return Sk.misceval.iterFor(iter, (i) => {
                    if (Sk.misceval.richCompareBool(i, lowest, "Lt")) {
                        lowest = i;
                    }
                });
            } else {
                return Sk.misceval.chain(Sk.misceval.callsimOrSuspendArray(key, [lowest]), (lowest_compare) =>
                    Sk.misceval.iterFor(iter, (i) =>
                        Sk.misceval.chain(Sk.misceval.callsimOrSuspendArray(key, [i]), (i_compare) => {
                            if (Sk.misceval.richCompareBool(i_compare, lowest_compare, "Lt")) {
                                lowest = i;
                                lowest_compare = i_compare;
                            }
                        })
                    )
                );
            }
        },
        () => {
            if (lowest === undefined) {
                if ($default === null) {
                    throw new Sk.builtin.ValueError("min() arg is an empty sequence");
                } else {
                    lowest = $default;
                }
            }
            return lowest;
        }
    );
};
Sk.builtin.min.co_argcount = 0;
Sk.builtin.min.co_kwonlyargcount = 2;
Sk.builtin.min.$kwdefs = [null, Sk.builtin.none.none$];
Sk.builtin.min.co_varnames = ["default", "key"];
Sk.builtin.min.co_varargs = 1;

Sk.builtin.max = function max($default, key, args) {
    const nargs = args.sq$length();
    if (!nargs) {
        throw new Sk.builtin.TypeError("max expected 1 argument, got 0");
    }

    // if args is not a single iterable then default should not be included as a kwarg
    if (nargs > 1 && $default !== null) {
        throw new Sk.builtin.TypeError("Cannot specify a default for max() with multiple positional arguments");
    }

    if (nargs == 1) {
        args = args.v[0];
        if (!Sk.builtin.checkIterable(args)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(args) + "' object is not iterable");
        }
    }
    let iter = Sk.abstr.iter(args);

    if (!Sk.builtin.checkNone(key) && !Sk.builtin.checkCallable(key)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(key) + "' object is not callable");
    }
    let highest;
    return Sk.misceval.chain(
        iter.tp$iternext(true),
        (i) => {
            highest = i;
            if (highest === undefined) {
                return;
            }
            if (Sk.builtin.checkNone(key)) {
                return Sk.misceval.iterFor(iter, (i) => {
                    if (Sk.misceval.richCompareBool(i, highest, "Gt")) {
                        highest = i;
                    }
                });
            } else {
                return Sk.misceval.chain(Sk.misceval.callsimOrSuspendArray(key, [highest]), (highest_compare) =>
                    Sk.misceval.iterFor(iter, (i) =>
                        Sk.misceval.chain(Sk.misceval.callsimOrSuspendArray(key, [i]), (i_compare) => {
                            if (Sk.misceval.richCompareBool(i_compare, highest_compare, "Gt")) {
                                highest = i;
                                highest_compare = i_compare;
                            }
                        })
                    )
                );
            }
        },
        () => {
            if (highest === undefined) {
                if ($default === null) {
                    throw new Sk.builtin.ValueError("min() arg is an empty sequence");
                } else {
                    highest = $default;
                }
            }
            return highest;
        }
    );
};
Sk.builtin.max.co_argcount = 0;
Sk.builtin.max.co_kwonlyargcount = 2;
Sk.builtin.max.$kwdefs = [null, Sk.builtin.none.none$];
Sk.builtin.max.co_varnames = ["default", "key"];
Sk.builtin.max.co_varargs = 1;

Sk.builtin.any = function any(iter) {
    Sk.builtin.pyCheckArgsLen("any", arguments.length, 1, 1);
    return Sk.misceval.chain(
        Sk.misceval.iterFor(Sk.abstr.iter(iter), function (i) {
            if (Sk.misceval.isTrue(i)) {
                return new Sk.misceval.Break(Sk.builtin.bool.true$);
            }
        }),
        (brValue) => brValue || Sk.builtin.bool.false$
    );
};

Sk.builtin.all = function all(iter) {
    Sk.builtin.pyCheckArgsLen("all", arguments.length, 1, 1);
    return Sk.misceval.chain(
        Sk.misceval.iterFor(Sk.abstr.iter(iter), function (i) {
            if (!Sk.misceval.isTrue(i)) {
                return new Sk.misceval.Break(Sk.builtin.bool.false$);
            }
        }),
        (brValue) => brValue || Sk.builtin.bool.true$
    );
};

Sk.builtin.sum = function sum(iter, start) {
    var tot;
    Sk.builtin.pyCheckArgsLen("sum", arguments.length, 1, 2);
    // follows the order of CPython checks
    const it = Sk.abstr.iter(iter);
    if (start === undefined) {
        tot = new Sk.builtin.int_(0);
    } else if (Sk.builtin.checkString(start)) {
        throw new Sk.builtin.TypeError("sum() can't sum strings [use ''.join(seq) instead]");
    } else {
        tot = start;
    }

    function fastSumInt() {
        return Sk.misceval.iterFor(it, (i) => {
            if (i.constructor === Sk.builtin.int_) {
                tot = tot.nb$add(i);
            } else if (i.constructor === Sk.builtin.float_) {
                tot = new Sk.builtin.float_(tot).nb$add(i);
                return new Sk.misceval.Break("float");
            } else {
                tot = Sk.abstr.numberBinOp(tot, i, "Add");
                return new Sk.misceval.Break("slow");
            }
        });
    }

    function fastSumFloat() {
        return Sk.misceval.iterFor(it, (i) => {
            if (i.constructor === Sk.builtin.float_ || i.constructor === Sk.builtin.int_) {
                tot = tot.nb$add(i);
            } else {
                tot = Sk.abstr.numberBinOp(tot, i, "Add");
                return new Sk.misceval.Break("slow");
            }
        });
    }

    function slowSum() {
        return Sk.misceval.iterFor(it, (i) => {
            tot = Sk.abstr.numberBinOp(tot, i, "Add");
        });
    }

    let sumType;
    if (start === undefined || start.constructor === Sk.builtin.int_) {
        sumType = fastSumInt();
    } else if (start.constructor === Sk.builtin.float_) {
        sumType = "float";
    } else {
        sumType = "slow";
    }

    return Sk.misceval.chain(
        sumType,
        (sumType) => {
            if (sumType === "float") {
                return fastSumFloat();
            }
            return sumType;
        },
        (sumType) => {
            if (sumType === "slow") {
                return slowSum();
            }
        },
        () => tot
    );
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
        if (Sk.builtin.checkIterable(arguments[i])) {
            iters.push(Sk.abstr.iter(arguments[i]));
        } else {
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
    Sk.builtin.pyCheckArgsLen("abs", arguments.length, 1, 1);
    if (x.nb$abs) {
        return x.nb$abs();
    }
    throw new TypeError("bad operand type for abs(): '" + Sk.abstr.typeName(x) + "'");
};

// fabs belongs in the math module but has been a Skulpt builtin since 41665a97d (2012).
// Left in for backwards compatibility for now
Sk.builtin.fabs = function fabs(x) {
    return Sk.builtin.abs(x);
};

Sk.builtin.ord = function ord (x) {
    Sk.builtin.pyCheckArgsLen("ord", arguments.length, 1, 1);
    if (Sk.builtin.checkString(x)) {
        if (x.v.length !== 1 && x.sq$length() !== 1) {
            // ^^ avoid the astral check unless necessary ^^
            throw new Sk.builtin.TypeError("ord() expected a character, but string of length " + x.v.length + " found");
        }
        return new Sk.builtin.int_(x.v.codePointAt(0));
    } else if (Sk.builtin.checkBytes(x)) {
        if (x.sq$length() !== 1) {
            throw new Sk.builtin.TypeError("ord() expected a character, but string of length " + x.v.length + " found");
        }
        return new Sk.builtin.int_(x.v[0]);
    }
    throw new Sk.builtin.TypeError("ord() expected a string of length 1, but " + Sk.abstr.typeName(x) + " found");
};

Sk.builtin.chr = function chr (x) {
    Sk.builtin.pyCheckArgsLen("chr", arguments.length, 1, 1);
    if (!Sk.builtin.checkInt(x)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }
    x = Sk.builtin.asnum$(x);


    if (Sk.__future__.python3) {
        if ((x < 0) || (x >= 0x110000)) {
            throw new Sk.builtin.ValueError("chr() arg not in range(0x110000)");
        }
    } else {
        if ((x < 0) || (x >= 256)) {
            throw new Sk.builtin.ValueError("chr() arg not in range(256)");
        }
    }

    return new Sk.builtin.str(String.fromCodePoint(x));
};

Sk.builtin.unichr = function unichr (x) {
    Sk.builtin.pyCheckArgsLen("chr", arguments.length, 1, 1);
    if (!Sk.builtin.checkInt(x)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }
    x = Sk.builtin.asnum$(x);

    try {
        return new Sk.builtin.str(String.fromCodePoint(x));
    } catch (err) {
        if (err instanceof RangeError) {
            throw new Sk.builtin.ValueError(err.message);
        }
        throw err;
    }
};

Sk.builtin.int2str_ = function helper_ (x, radix, prefix) {
    var suffix;
    var str = "";
    if (x instanceof Sk.builtin.lng) {
        suffix = "";
        if (radix !== 2 && (!(Sk.__future__.python3))) {
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
    Sk.builtin.pyCheckArgsLen("hex", arguments.length, 1, 1);
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("hex() argument can't be converted to hex");
    }
    return Sk.builtin.int2str_(x, 16, "0x");
};

Sk.builtin.oct = function oct (x) {
    Sk.builtin.pyCheckArgsLen("oct", arguments.length, 1, 1);
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("oct() argument can't be converted to hex");
    }
    if (Sk.__future__.octal_number_literal) {
        return Sk.builtin.int2str_(x, 8, "0o");
    } else {
        return Sk.builtin.int2str_(x, 8, "0");
    }
};

Sk.builtin.bin = function bin (x) {
    Sk.builtin.pyCheckArgsLen("bin", arguments.length, 1, 1);
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
    Sk.builtin.pyCheckArgsLen("dir", arguments.length, 1, 1);

    getName = function (k) {
        var s = null;
        var internal = [
            "__bases__", "__mro__", "__class__", "__name__", "GenericGetAttr",
            "GenericSetAttr", "GenericPythonGetAttr", "GenericPythonSetAttr",
            "pythonFunctions", "HashNotImplemented", "constructor", "__dict__"
        ];
        if (internal.indexOf(k) !== -1) {
            return null;
        }
        k = Sk.unfixReserved(k);
        if (k.indexOf("$") !== -1) {
            s = Sk.builtin.dir.slotNameToRichName(k);
        } else if (k.charAt(k.length - 1) !== "_") {
            s = k;
        } else if (k.charAt(0) === "_") {
            s = k;
        }
        return s;
    };

    names = [];

    var _seq;

    // try calling magic method
    var special = Sk.abstr.lookupSpecial(x, Sk.builtin.str.$dir);
    if(special != null) {
        // method on builtin, provide this arg
        _seq = Sk.misceval.callsimArray(special, [x]);

        if (!Sk.builtin.checkSequence(_seq)) {
            throw new Sk.builtin.TypeError("__dir__ must return sequence.");
        }

        // proper unwrapping
        _seq = Sk.ffi.remapToJs(_seq);

        for (i = 0; i < _seq.length; ++i) {
            names.push(new Sk.builtin.str(_seq[i]));
        }
    } else {
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
            } else {
                // Object
                for (s in x["$d"]) {
                    names.push(new Sk.builtin.str(s));
                }
            }
        }

        // Add all class attributes
        mro = x.tp$mro;
        if(!mro && x.ob$type) {
            mro = x.ob$type.tp$mro;
        }
        if (mro) {
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
    Sk.builtin.pyCheckArgsLen("repr", arguments.length, 1, 1);

    return Sk.misceval.objectRepr(x);
};

Sk.builtin.ascii = function ascii (x) {
    return Sk.misceval.chain(Sk.misceval.objectRepr(x), (r) => {
        if (!(r instanceof Sk.builtin.str)) {
            throw new Sk.builtin.TypeError("__repr__ returned non-string (type " + Sk.abstr.typeName(r) + ")");
        }
        let ret;
        let i;
        // Fast path
        for (i=0; i < r.v.length; i++) {
            if (r.v.charCodeAt(i) >= 0x7f) {
                ret = r.v.substr(0, i);
                break;
            }
        }
        if (!ret) {
            return r;
        }
        for (; i < r.v.length; i++) {
            let c = r.v.charAt(i);
            let cc = r.v.charCodeAt(i);

            if (cc > 0x7f && cc <= 0xff) {
                let ashex = cc.toString(16);
                if (ashex.length < 2) {
                    ashex = "0" + ashex;
                }
                ret += "\\x" + ashex;
            } else if (cc > 0x7f && cc < 0xd800 || cc >= 0xe000) {
                // BMP
                ret += "\\u" + ("000"+cc.toString(16)).slice(-4);
            } else if (cc >= 0xd800) {
                // Surrogate pair stuff
                let val = r.v.codePointAt(i);
                i++;

                val = val.toString(16);
                let s = ("0000000"+val.toString(16));
                if (val.length > 4) {
                    ret += "\\U" + s.slice(-8);
                } else {
                    ret += "\\u" + s.slice(-4);
                }
            } else {
                ret += c;
            }
        }
        return new Sk.builtin.str(ret);
    });
};

Sk.builtin.open = function open (filename, mode, bufsize) {
    Sk.builtin.pyCheckArgsLen("open", arguments.length, 1, 3);
    if (mode === undefined) {
        mode = new Sk.builtin.str("r");
    }

    if (/\+/.test(mode.v)) {
        throw "todo; haven't implemented read/write mode";
    } else if ((mode.v === "w" || mode.v === "wb" || mode.v === "a" || mode.v === "ab") && !Sk.nonreadopen) {
        throw "todo; haven't implemented non-read opens";
    }

    return new Sk.builtin.file(filename, mode, bufsize);
};

Sk.builtin.isinstance = function isinstance (obj, type) {
    var issubclass;
    var i;
    Sk.builtin.pyCheckArgsLen("isinstance", arguments.length, 2, 2);
    if (!Sk.builtin.checkClass(type) && !(type instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("isinstance() arg 2 must be a class, type, or tuple of classes and types");
    }

    if (type === Sk.builtin.none.prototype.ob$type) {
        if (obj === Sk.builtin.none.none$) {
            return Sk.builtin.bool.true$;
        } else {
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

    // Check for Javascript inheritance
    if (obj instanceof type) {
        return Sk.builtin.bool.true$;
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

Sk.builtin.hash = function hash (value) {
    var junk;
    Sk.builtin.pyCheckArgsLen("hash", arguments.length, 1, 1);

    // Useless object to get compiler to allow check for __hash__ property
    junk = {__hash__: function () {
        return 0;
    }};

    if (value instanceof Object) {
        if (Sk.builtin.checkNone(value.tp$hash)) {
            // python sets the hash function to None , so we have to catch this case here
            throw new Sk.builtin.TypeError(new Sk.builtin.str("unhashable type: '" + Sk.abstr.typeName(value) + "'"));
        } else if (value.tp$hash !== undefined) {
            if (value.$savedHash_) {
                return value.$savedHash_;
            }
            value.$savedHash_ = value.tp$hash();
            return value.$savedHash_;
        } else {
            if (value.__hash === undefined) {
                Sk.builtin.hashCount += 1;
                value.__hash = Sk.builtin.hashCount;
            }
            return new Sk.builtin.int_(value.__hash);
        }
    } else if (typeof value === "number" || value === null ||
        value === true || value === false) {
        throw new Sk.builtin.TypeError("unsupported Javascript type");
    }

    return new Sk.builtin.str((typeof value) + " " + String(value));
    // todo; throw properly for unhashable types
};

Sk.builtin.getattr = function getattr (obj, pyName, default_) {
    var ret;
    Sk.builtin.pyCheckArgsLen("getattr", arguments.length, 2, 3);
    if (!Sk.builtin.checkString(pyName)) {
        throw new Sk.builtin.TypeError("attribute name must be string");
    }

    ret = obj.tp$getattr(pyName);
    if (ret === undefined) {
        if (default_ !== undefined) {
            return default_;
        } else {
            throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(obj) + "' object has no attribute '" + pyName.$jsstr() + "'");
        }
    }
    return ret;
};

Sk.builtin.setattr = function setattr (obj, pyName, value) {
    Sk.builtin.pyCheckArgsLen("setattr", arguments.length, 3, 3);
    // cannot set or del attr from builtin type
    if (!Sk.builtin.checkString(pyName)) {
        throw new Sk.builtin.TypeError("attribute name must be string");
    }
    if (obj.tp$setattr) {
        obj.tp$setattr(pyName, value);
    } else {
        throw new Sk.builtin.AttributeError("object has no attribute " + pyName.$jsstr());
    }
    return Sk.builtin.none.none$;
};

Sk.builtin.raw_input = function (prompt) {
    var lprompt = prompt ? prompt : "";

    return Sk.misceval.chain(Sk.importModule("sys", false, true), function (sys) {
        if (Sk.inputfunTakesPrompt) {
            return Sk.misceval.callsimOrSuspendArray(Sk.builtin.file.$readline, [sys["$d"]["stdin"], null, lprompt]);
        } else {
            return Sk.misceval.chain(undefined, function() {
                return Sk.misceval.callsimOrSuspendArray(sys["$d"]["stdout"]["write"], [sys["$d"]["stdout"], new Sk.builtin.str(lprompt)]);
            }, function () {
                return Sk.misceval.callsimOrSuspendArray(sys["$d"]["stdin"]["readline"], [sys["$d"]["stdin"]]);
            });
        }
    });
};

Sk.builtin.input = Sk.builtin.raw_input;

Sk.builtin.jseval = function jseval (evalcode) {
    const result = Sk.global["eval"](Sk.ffi.remapToJs(evalcode));
    return Sk.ffi.remapToPy(result);
};

Sk.builtin.jsmillis = function jsmillis () {
    var now = new Date();
    return now.valueOf();
};

Sk.builtin.eval_ = function eval_ () {
    throw new Sk.builtin.NotImplementedError("eval is not yet implemented");
};

Sk.builtin.map = function map (fun, seq) {
    var retval = [];
    var next;
    var nones;
    var args;
    var argnum;
    var i;
    var iterables;
    var combined;
    Sk.builtin.pyCheckArgsLen("map", arguments.length, 2);

    if (arguments.length > 2) {
        // Pack sequences into one list of Javascript Arrays

        combined = [];
        iterables = Array.prototype.slice.apply(arguments).slice(1);
        for (i = 0; i < iterables.length; i++) {
            if (!Sk.builtin.checkIterable(iterables[i])) {
                argnum = parseInt(i, 10) + 2;
                throw new Sk.builtin.TypeError("argument " + argnum + " to map() must support iteration");
            }
            iterables[i] = Sk.abstr.iter(iterables[i]);
        }

        while (true) {
            args = [];
            nones = 0;
            for (i = 0; i < iterables.length; i++) {
                next = iterables[i].tp$iternext();
                if (next === undefined) {
                    args.push(Sk.builtin.none.none$);
                    nones++;
                } else {
                    args.push(next);
                }
            }
            if (nones !== iterables.length) {
                combined.push(args);
            } else {
                // All iterables are done
                break;
            }
        }
        seq = new Sk.builtin.list(combined);
    }

    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    return Sk.misceval.chain(Sk.misceval.iterFor(Sk.abstr.iter(seq), function (item) {

        if (fun === Sk.builtin.none.none$) {
            if (item instanceof Array) {
                // With None function and multiple sequences,
                // map should return a list of tuples
                item = new Sk.builtin.tuple(item);
            }
            retval.push(item);
        } else {
            if (!(item instanceof Array)) {
                // If there was only one iterable, convert to Javascript
                // Array for call to apply.
                item = [item];
            }

            return Sk.misceval.chain(Sk.misceval.applyOrSuspend(fun, undefined, undefined, undefined, item), function (result) {
                retval.push(result);
            });
        }
    }), function () {
        return new Sk.builtin.list(retval);
    });
};

Sk.builtin.reduce = function reduce (fun, seq, initializer) {
    var item;
    var accum_value;
    var iter;
    Sk.builtin.pyCheckArgsLen("reduce", arguments.length, 2, 3);
    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    iter = Sk.abstr.iter(seq);
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
        accum_value = Sk.misceval.callsimArray(fun, [accum_value, item]);
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
    Sk.builtin.pyCheckArgsLen("filter", arguments.length, 2, 2);
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
    } else if (iterable.__class__ === Sk.builtin.tuple) {
        ret = function (iter) {
            return new Sk.builtin.tuple(iter);
        };
    }

    retval = ctor();

    for (iter = Sk.abstr.iter(iterable), item = iter.tp$iternext();
        item !== undefined;
        item = iter.tp$iternext()) {
        if (fun === Sk.builtin.none.none$) {
            result = new Sk.builtin.bool( item);
        } else {
            result = Sk.misceval.callsimArray(fun, [item]);
        }

        if (Sk.misceval.isTrue(result)) {
            retval = add(retval, item);
        }
    }

    return ret(retval);
};

Sk.builtin.hasattr = function hasattr (obj, attr) {
    Sk.builtin.pyCheckArgsLen("hasattr", arguments.length, 2, 2);
    if (!Sk.builtin.checkString(attr)) {
        throw new Sk.builtin.TypeError("hasattr(): attribute name must be string");
    }

    if (obj.tp$getattr) {
        if (obj.tp$getattr(attr)) {
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
    Sk.builtin.pyCheckArgsLen("pow", arguments.length, 2, 3);

    if (c === Sk.builtin.none.none$) {
        c = undefined;
    }

    // add complex type hook here, builtin is messed up anyways
    if (Sk.builtin.checkComplex(a)) {
        return a.nb$power(b, c); // call complex pow function
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
    if (a_num < 0 && b instanceof Sk.builtin.float_) {
        throw new Sk.builtin.ValueError("negative number cannot be raised to a fractional power");
    }

    if (c === undefined) {
        if ((a instanceof Sk.builtin.float_ || b instanceof Sk.builtin.float_) || (b_num < 0)) {
            return new Sk.builtin.float_(Math.pow(a_num, b_num));
        }

        left = new Sk.builtin.int_(a_num);
        right = new Sk.builtin.int_(b_num);
        res = left.nb$power(right);

        if (a instanceof Sk.builtin.lng || b instanceof Sk.builtin.lng) {
            return new Sk.builtin.lng(res);
        }

        return res;
    } else {
        if (!Sk.builtin.checkInt(a) || !Sk.builtin.checkInt(b) || !Sk.builtin.checkInt(c)) {
            throw new Sk.builtin.TypeError("pow() 3rd argument not allowed unless all arguments are integers");
        }
        if (b_num < 0) {
            if (Sk.__future__.exceptions) {
                throw new Sk.builtin.ValueError("pow() 2nd argument cannot be negative when 3rd argument specified");
            } else {
                throw new Sk.builtin.TypeError("pow() 2nd argument cannot be negative when 3rd argument specified");
            }
        }
        if (c_num === 0) {
            throw new Sk.builtin.ValueError("pow() 3rd argument cannot be 0");
        }
        if ((a instanceof Sk.builtin.lng || b instanceof Sk.builtin.lng || c instanceof Sk.builtin.lng) ||
            (Math.pow(a_num, b_num) === Infinity)) {
            // convert a to a long so that we can use biginteger's modPowInt method
            a = new Sk.builtin.lng(a);
            return a.nb$power(b, c);
        } else {
            ret = new Sk.builtin.int_(Math.pow(a_num, b_num));
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
    Sk.builtin.pyCheckArgsLen("issubclass", arguments.length, 2, 2);
    if (!Sk.builtin.checkClass(c1)) {
        throw new Sk.builtin.TypeError("issubclass() arg 1 must be a class");
    }

    if (!Sk.builtin.checkClass(c2) && !(c2 instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("issubclass() arg 2 must be a class or tuple of classes");
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
            // old style classes don't have bases
            if (klass["$d"].sq$contains(Sk.builtin.type.basesStr_)) {
                bases = klass["$d"].mp$subscript(Sk.builtin.type.basesStr_);
            } else {
                return false;
            }
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

    if (Sk.builtin.checkClass(c2)) {
        /* Quick test for an exact match */
        if (c1 === c2) {
            return true;
        }

        return issubclass_internal(c1, c2);
    }

    // Handle tuple type argument
    if (c2 instanceof Sk.builtin.tuple) {
        for (i = 0; i < c2.v.length; ++i) {
            if (Sk.builtin.issubclass(c1, c2.v[i])) {
                return true;
            }
        }
        return false;
    }
};

Sk.builtin.globals = function globals () {
    var i, unmangled;
    var ret = new Sk.builtin.dict([]);
    for (i in Sk["globals"]) {
        unmangled = Sk.unfixReserved(i);
        ret.mp$ass_subscript(new Sk.builtin.str(unmangled), Sk["globals"][i]);
    }

    return ret;

};

Sk.builtin.divmod = function divmod (a, b) {
    return Sk.abstr.numberBinOp(a, b, "DivMod");
};

/**
 * Convert a value to a “formatted” representation, as controlled by format_spec. The interpretation of format_spec
 * will depend on the type of the value argument, however there is a standard formatting syntax that is used by most
 * built-in types: Format Specification Mini-Language.
 */
Sk.builtin.format = function format (value, format_spec) {
    Sk.builtin.pyCheckArgsLen("format", arguments.length, 1, 2);

    if (format_spec === undefined) {
        format_spec = Sk.builtin.str.$emptystr;
    }

    return Sk.abstr.objectFormat(value, format_spec);
};

Sk.builtin.reversed = function reversed (seq) {
    Sk.builtin.pyCheckArgsLen("reversed", arguments.length, 1, 1);

    var special = Sk.abstr.lookupSpecial(seq, Sk.builtin.str.$reversed);
    if (special != null) {
        return Sk.misceval.callsimArray(special, [seq]);
    } else {
        if (!Sk.builtin.checkSequence(seq)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not a sequence");
        }

        /**
         * Builds an iterator that outputs the items form last to first.
         *
         * @constructor
         */
        var reverseIter = function (obj) {
            this.idx = obj.sq$length() - 1;
            this.myobj = obj;
            this.getitem = Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$getitem);
            this.tp$iter = function() {
                return this;
            },
            this.tp$iternext = function () {
                var ret;

                if (this.idx < 0) {
                    return undefined;
                }

                try {
                    ret = Sk.misceval.callsimArray(this.getitem, [this.myobj, Sk.ffi.remapToPy(this.idx)]);
                } catch (e) {
                    if (e instanceof Sk.builtin.IndexError) {
                        return undefined;
                    } else {
                        throw e;
                    }
                }
                this.idx--;
                return ret;
            };
        };

        return new reverseIter(seq);
    }
};

Sk.builtin.id = function (obj) {
    Sk.builtin.pyCheckArgsLen("id", arguments.length, 1, 1);

    if (obj.__id === undefined) {
        Sk.builtin.idCount += 1;
        obj.__id = Sk.builtin.idCount;
    }

    return new Sk.builtin.int_(obj.__id);
};

Sk.builtin.bytearray = function bytearray () {
    throw new Sk.builtin.NotImplementedError("bytearray is not yet implemented");
};

Sk.builtin.callable = function callable (obj) {
    // check num of args
    Sk.builtin.pyCheckArgsLen("callable", arguments.length, 1, 1);

    if (Sk.builtin.checkCallable(obj)) {
        return Sk.builtin.bool.true$;
    }
    return Sk.builtin.bool.false$;
};

Sk.builtin.delattr = function delattr (obj, attr) {
    Sk.builtin.pyCheckArgsLen("delattr", arguments.length, 2, 2);
    if (obj["$d"][attr.v] !== undefined) {
        var ret = Sk.misceval.tryCatch(function() {
            var try1 = Sk.builtin.setattr(obj, attr, undefined);
            return try1;
        }, function(e) {
            Sk.misceval.tryCatch(function() {
                var try2 = Sk.builtin.setattr(obj["$d"], attr, undefined);

                return try2;
            }, function(e) {
                if (e instanceof Sk.builtin.AttributeError) {
                    throw new Sk.builtin.AttributeError(Sk.abstr.typeName(obj) + " instance has no attribute '"+ attr.v+ "'");
                } else {
                    throw e;
                }
            });
        });
        return ret;
    } // cannot set or del attr from builtin type
    if (obj["$r"]().v.slice(1,5) !== "type") {
        if (obj.ob$type === Sk.builtin.type && obj[attr.v] !== undefined) {
            obj[attr.v] = undefined;
            return Sk.builtin.none.none$;
        }
        throw new Sk.builtin.AttributeError(Sk.abstr.typeName(obj) + " instance has no attribute '"+ attr.v+ "'");
    }
    // if we're here then we're a builtin type
    throw new Sk.builtin.TypeError("can't set attributes of built-in/extension type '" + obj.prototype.tp$name + "'");
};

Sk.builtin.execfile = function execfile () {
    throw new Sk.builtin.NotImplementedError("execfile is not yet implemented");
};

Sk.builtin.help = function help () {
    throw new Sk.builtin.NotImplementedError("help is not yet implemented");
};

Sk.builtin.iter = function iter (obj, sentinel) {
    Sk.builtin.pyCheckArgsLen("iter", arguments.length, 1, 2);
    if (arguments.length === 1) {
        if (!Sk.builtin.checkIterable(obj)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(obj) +
                "' object is not iterable");
        } else {
            return new Sk.builtin.iterator(obj);
        }
    } else {
        if (Sk.builtin.checkCallable(obj)) {
            return new Sk.builtin.iterator(obj, sentinel);
        } else {
            throw new TypeError("iter(v, w): v must be callable");
        }
    }
};

Sk.builtin.locals = function locals () {
    throw new Sk.builtin.NotImplementedError("locals is not yet implemented");
};
Sk.builtin.memoryview = function memoryview () {
    throw new Sk.builtin.NotImplementedError("memoryview is not yet implemented");
};

Sk.builtin.next_ = function next_ (iter, default_) {
    var nxt;
    Sk.builtin.pyCheckArgsLen("next", arguments.length, 1, 2);
    if (!iter.tp$iternext) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter) +
            "' object is not an iterator");
    }
    nxt = iter.tp$iternext();
    if (nxt === undefined) {
        if (default_) {
            return default_;
        }
        throw new Sk.builtin.StopIteration();
    }
    return nxt;
};

Sk.builtin.reload = function reload () {
    throw new Sk.builtin.NotImplementedError("reload is not yet implemented");
};
Sk.builtin.vars = function vars () {
    throw new Sk.builtin.NotImplementedError("vars is not yet implemented");
};
Sk.builtin.xrange = Sk.builtin.range;
Sk.builtin.apply_ = function apply_ () {
    throw new Sk.builtin.NotImplementedError("apply is not yet implemented");
};
Sk.builtin.buffer = function buffer_ () {
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
