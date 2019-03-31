import { lookupSpecial, iter as abstractIter, numberBinOp, objectFormat } from './abstract'
import { remapToJs, remapToPy } from './ffi';
import {
    pyCheckArgs,
    checkInt,
    pyCheckType,
    checkNumber,
    checkFunction,
    checkIterable,
    checkString,
    checkComplex,
    checkClass,
    checkNone,
    checkCallable
} from './function/checks';
import { hashCount, idCount, none } from './types/object';
import { ValueError, TypeError, AttributeError, SystemExit, NotImplementedError } from './errors';
import { $emptystr } from './constants';
import { int_, str, bool, list, float_, lng, tuple, dict } from './types';
import { file } from './file';
import { typeName, type } from './type';
import { iterator } from './iterator';
import {
    isIndex,
    callsim,
    chain,
    arrayFromArguments,
    tryCatch,
    richCompareBool,
    applyOrSuspend,
    isTrue,
    callsimOrSuspend,
    objectRepr
} from './misceval';
import biginteger from 'big-integer';

/**
 * builtins are supposed to come from the __builtin__ module, but we don't do
 * that yet.
 * todo; these should all be func objects too, otherwise str() of them won't
 * work, etc.
 */

export function range (start, stop, step) {
    var ret = [];
    var i;

    pyCheckArgs("range", arguments, 1, 3);
    pyCheckType("start", "integer", checkInt(start));
    if (stop !== undefined) {
        pyCheckType("stop", "integer", checkInt(stop));
    }
    if (step !== undefined) {
        pyCheckType("step", "integer", checkInt(step));
    }

    start = asnum$(start);
    stop = asnum$(stop);
    step = asnum$(step);

    if ((stop === undefined) && (step === undefined)) {
        stop = start;
        start = 0;
        step = 1;
    } else if (step === undefined) {
        step = 1;
    }

    if (step === 0) {
        throw new ValueError("range() step argument must not be zero");
    }

    if (step > 0) {
        for (i = start; i < stop; i += step) {
            ret.push(new int_(i));
        }
    } else {
        for (i = start; i > stop; i += step) {
            ret.push(new int_(i));
        }
    }

    return new list(ret);
};

export function asnum$(a) {
    if (a === undefined) {
        return a;
    }
    if (a === null) {
        return a;
    }
    if (a instanceof none) {
        return null;
    }
    if (a instanceof bool) {
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
    if (a instanceof int_) {
        return a.v;
    }
    if (a instanceof float_) {
        return a.v;
    }
    if (a instanceof lng) {
        if (a.cantBeInt()) {
            return a.str$(10, true);
        }
        return a.toInt$();
    }
    if (a.constructor === biginteger) {
        if ((a.trueCompare(new biginteger(int_.threshold$)) > 0) ||
            (a.trueCompare(new biginteger(-int_.threshold$)) < 0)) {
            return a.toString();
        }
        return a.intValue();
    }

    return a;
};

/**
 * Return a Python number (either float or int) from a Javascript number.
 *
 * Javacsript function, returns Python object.
 *
 * @param  {number} a Javascript number to transform into Python number.
 * @return {(int_|float_)} A Python number.
 */
export function assk$(a) {
    if (a % 1 === 0) {
        return new int_(a);
    } else {
        return new float_(a);
    }
};

export function asnum$nofloat(a) {
    var decimal;
    var mantissa;
    var expon;
    if (a === undefined) {
        return a;
    }
    if (a === null) {
        return a;
    }
    if (a.constructor === none) {
        return null;
    }
    if (a.constructor === bool) {
        if (a.v) {
            return 1;
        }
        return 0;
    }
    if (typeof a === "number") {
        a = a.toString();
    }
    if (a.constructor === int_) {
        a = a.v.toString();
    }
    if (a.constructor === float_) {
        a = a.v.toString();
    }
    if (a.constructor === lng) {
        a = a.str$(10, true);
    }
    if (a.constructor === biginteger) {
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

export function round (number, ndigits) {
    var special;
    pyCheckArgs("round", arguments, 1, 2);

    if (!checkNumber(number)) {
        if (!checkFunction(number)) {
            throw new TypeError("a float is required");
        } else {
            if (!Sk.__future__.exceptions) {
                throw new AttributeError(typeName(number) + " instance has no attribute '__float__'");
            }
        }
    }

    if ((ndigits !== undefined) && !isIndex(ndigits)) {
        throw new TypeError("'" + typeName(ndigits) + "' object cannot be interpreted as an index");
    }

    if (!Sk.__future__.dunder_round && number.round$) {
        return number.round$(number, ndigits);
    }

    // try calling internal magic method
    special = lookupSpecial(number, "__round__");
    if (special != null) {
        // method on builtin, provide this arg
        if (!checkFunction(number)) {
            return callsim(special, number, ndigits);
        } else {
            return callsim(special, number);
        }
    } else {
        throw new TypeError("a float is required");
    }
};

export function len (item) {
    var intcheck;
    var special;
    pyCheckArgs("len", arguments, 1, 1);

    var int_ = function(i) { return new int_(i); };
    intcheck = function(j) {
        if (checkInt(j)) {
            return int_(j);
        } else {
            if (Sk.__future__.exceptions) {
                throw new TypeError("'" + typeName(j) + "' object cannot be interpreted as an integer");
            } else {
                throw new TypeError("__len__() should return an int");
            }
        }
    };

    if (item.sq$length) {
        return chain(item.sq$length(true), intcheck);
    }

    if (item.mp$length) {
        return chain(item.mp$length(), int_);
    }

    if (item.tp$length) {
        if (checkFunction(item)) {
            special = lookupSpecial(item, "__len__");
            if (special != null) {
                return callsim(special, item);
            } else {
                if (Sk.__future__.exceptions) {
                    throw new TypeError("object of type '" + typeName(item) + "' has no len()");
                } else {
                    throw new AttributeError(typeName(item) + " instance has no attribute '__len__'");
                }
            }
        } else {
            return chain(item.tp$length(true), intcheck);
        }
    }

    throw new TypeError("object of type '" + typeName(item) + "' has no len()");
};

export function min () {
    var i;
    var lowest;
    var args;
    pyCheckArgs("min", arguments, 1);

    args = arrayFromArguments(arguments);
    lowest = args[0];

    if (lowest === undefined) {
        throw new ValueError("min() arg is an empty sequence");
    }

    for (i = 1; i < args.length; ++i) {
        if (richCompareBool(args[i], lowest, "Lt")) {
            lowest = args[i];
        }
    }
    return lowest;
};

export function max () {
    var i;
    var highest;
    var args;
    pyCheckArgs("max", arguments, 1);

    args = arrayFromArguments(arguments);
    highest = args[0];

    if (highest === undefined) {
        throw new ValueError("max() arg is an empty sequence");
    }

    for (i = 1; i < args.length; ++i) {
        if (richCompareBool(args[i], highest, "Gt")) {
            highest = args[i];
        }
    }
    return highest;
};

export function any (iter) {
    var it, i;

    pyCheckArgs("any", arguments, 1, 1);
    if (!checkIterable(iter)) {
        throw new TypeError("'" + typeName(iter) +
            "' object is not iterable");
    }

    it = iter(iter);
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (isTrue(i)) {
            return bool.true$;
        }
    }

    return bool.false$;
};

export function all (iter) {
    var it, i;

    pyCheckArgs("all", arguments, 1, 1);
    if (!checkIterable(iter)) {
        throw new TypeError("'" + typeName(iter) +
            "' object is not iterable");
    }

    it = iter(iter);
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (!isTrue(i)) {
            return bool.false$;
        }
    }

    return bool.true$;
};

export function sum (iter, start) {
    var tot;
    var intermed;
    var it, i;
    var has_float;

    pyCheckArgs("sum", arguments, 1, 2);
    pyCheckType("iter", "iterable", checkIterable(iter));
    if (start !== undefined && checkString(start)) {
        throw new TypeError("sum() can't sum strings [use ''.join(seq) instead]");
    }
    if (start === undefined) {
        tot = new int_(0);
    } else {
        tot = start;
    }

    it = iter(iter);
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (i instanceof float_) {
            has_float = true;
            if (!(tot instanceof float_)) {
                tot = new float_(asnum$(tot));
            }
        } else if (i instanceof lng) {
            if (!has_float) {
                if (!(tot instanceof lng)) {
                    tot = new lng(tot);
                }
            }
        }

        if (tot.nb$add !== undefined) {
            intermed = tot.nb$add(i);
            if ((intermed !== undefined) && (intermed !== NotImplemented.NotImplemented$)) {
                tot = tot.nb$add(i);
                continue;
            }
        }

        throw new TypeError("unsupported operand type(s) for +: '" +
                    typeName(tot) + "' and '" +
                    typeName(i) + "'");
    }

    return tot;
};

export function zip () {
    var el;
    var tup;
    var done;
    var res;
    var i;
    var iters;
    if (arguments.length === 0) {
        return new list([]);
    }

    iters = [];
    for (i = 0; i < arguments.length; i++) {
        if (checkIterable(arguments[i])) {
            iters.push(iter(arguments[i]));
        } else {
            throw new TypeError("argument " + i + " must support iteration");
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
            res.push(new tuple(tup));
        }
    }
    return new list(res);
};

export function abs (x) {
    pyCheckArgs("abs", arguments, 1, 1);

    if (x instanceof int_) {
        return new int_(Math.abs(x.v));
    }
    if (x instanceof float_) {
        return new float_(Math.abs(x.v));
    }
    if (checkNumber(x)) {
        return assk$(Math.abs(asnum$(x)));
    } else if (checkComplex(x)) {
        return callsim(x.__abs__, x);
    }

    // call custom __abs__ methods
    if (x.tp$getattr) {
        var f = x.tp$getattr("__abs__");
        return callsim(f);
    }

    throw new TypeError("bad operand type for abs(): '" + typeName(x) + "'");
};

export function ord (x) {
    pyCheckArgs("ord", arguments, 1, 1);

    if (!checkString(x)) {
        throw new TypeError("ord() expected a string of length 1, but " + typeName(x) + " found");
    } else if (x.v.length !== 1) {
        throw new TypeError("ord() expected a character, but string of length " + x.v.length + " found");
    }
    return new int_((x.v).charCodeAt(0));
};

export function chr (x) {
    pyCheckArgs("chr", arguments, 1, 1);
    if (!checkInt(x)) {
        throw new TypeError("an integer is required");
    }
    x = asnum$(x);


    if ((x < 0) || (x > 255)) {
        throw new ValueError("chr() arg not in range(256)");
    }

    return new str(String.fromCharCode(x));
};

export function unichr (x) {
    pyCheckArgs("chr", arguments, 1, 1);
    if (!checkInt(x)) {
        throw new TypeError("an integer is required");
    }
    x = asnum$(x);

    try {
        return new str(String.fromCodePoint(x));
    }
    catch (err) {
        if (err instanceof RangeError) {
            throw new ValueError(err.message);
        }
        throw err;
    }
};

export function int2str_ (x, radix, prefix) {
    var suffix;
    var str = "";
    if (x instanceof lng) {
        suffix = "";
        if (radix !== 2) {
            suffix = "L";
        }

        str = x.str$(radix, false);
        if (x.nb$isnegative()) {
            return new str("-" + prefix + str + suffix);
        }
        return new str(prefix + str + suffix);
    } else {
        x = asIndex(x);
        str = x.toString(radix);
        if (x < 0) {
            return new str("-" + prefix + str.slice(1));
        }
        return new str(prefix + str);
    }
};

export function hex (x) {
    pyCheckArgs("hex", arguments, 1, 1);
    if (!isIndex(x)) {
        throw new TypeError("hex() argument can't be converted to hex");
    }
    return int2str_(x, 16, "0x");
};

export function oct (x) {
    pyCheckArgs("oct", arguments, 1, 1);
    if (!isIndex(x)) {
        throw new TypeError("oct() argument can't be converted to hex");
    }
    if (Sk.__future__.octal_number_literal) {
        return int2str_(x, 8, "0o");
    } else {
        return int2str_(x, 8, "0");
    }
};

export function bin (x) {
    pyCheckArgs("bin", arguments, 1, 1);
    if (!isIndex(x)) {
        throw new TypeError("'" + typeName(x) + "' object can't be interpreted as an index");
    }
    return int2str_(x, 2, "0b");
};

export function dir (x) {
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
    pyCheckArgs("dir", arguments, 1, 1);

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
        if (k.indexOf("$") !== -1) {
            s = dir.slotNameToRichName(k);
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
    var special = lookupSpecial(x, "__dir__");
    if(special != null) {
        // method on builtin, provide this arg
        _seq = callsim(special, x);

        if (!checkSequence(_seq)) {
            throw new TypeError("__dir__ must return sequence.");
        }

        // proper unwrapping
        _seq = remapToJs(_seq);

        for (i = 0; i < _seq.length; ++i) {
            names.push(new str(_seq[i]));
        }
    } else {
        // Add all object properties
        for (k in x.constructor.prototype) {
            s = getName(k);
            if (s) {
                names.push(new str(s));
            }
        }

        // Add all attributes
        if (x["$d"]) {
            if (x["$d"].tp$iter) {
                // Dictionary
                it = x["$d"].tp$iter();
                for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    s = new str(i);
                    s = getName(s.v);
                    if (s) {
                        names.push(new str(s));
                    }
                }
            } else {
                // Object
                for (s in x["$d"]) {
                    names.push(new str(s));
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
                            names.push(new str(s));
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
    return new list(names.filter(last));
};

dir.slotNameToRichName = function (k) {
    // todo; map tp$xyz to __xyz__ properly
    return undefined;
};

export function repr (x) {
    pyCheckArgs("repr", arguments, 1, 1);

    return objectRepr(x);
};

export function open (filename, mode, bufsize) {
    pyCheckArgs("open", arguments, 1, 3);
    if (mode === undefined) {
        mode = new str("r");
    }

    if (/\+/.test(mode.v)) {
        throw "todo; haven't implemented read/write mode";
    } else if ((mode.v === "w" || mode.v === "wb" || mode.v === "a" || mode.v === "ab") && !Sk.nonreadopen) {
        throw "todo; haven't implemented non-read opens";
    }

    return new file(filename, mode, bufsize);
};

export function isinstance (obj, type) {
    var issubclass;
    var i;
    pyCheckArgs("isinstance", arguments, 2, 2);
    if (!checkClass(type) && !(type instanceof tuple)) {
        throw new TypeError("isinstance() arg 2 must be a class, type, or tuple of classes and types");
    }

    if (type === none.prototype.ob$type) {
        if (obj instanceof none) {
            return bool.true$;
        } else {
            return bool.false$;
        }
    }

    // Normal case
    if (obj.ob$type === type) {
        return bool.true$;
    }

    // Handle tuple type argument
    if (type instanceof tuple) {
        for (i = 0; i < type.v.length; ++i) {
            if (isTrue(isinstance(obj, type.v[i]))) {
                return bool.true$;
            }
        }
        return bool.false$;
    }

    // Check for Javascript inheritance
    if (obj instanceof type) {
        return bool.true$;
    }


    issubclass = function (klass, base) {
        var i;
        var bases;
        if (klass === base) {
            return bool.true$;
        }
        if (klass["$d"] === undefined) {
            return bool.false$;
        }
        bases = klass["$d"].mp$subscript(type.basesStr_);
        for (i = 0; i < bases.v.length; ++i) {
            if (isTrue(issubclass(bases.v[i], base))) {
                return bool.true$;
            }
        }
        return bool.false$;
    };

    return issubclass(obj.ob$type, type);
};

export function hash (value) {
    var junk;
    pyCheckArgs("hash", arguments, 1, 1);

    // Useless object to get compiler to allow check for __hash__ property
    junk = {__hash__: function () {
        return 0;
    }};

    if (value instanceof Object) {
        if (checkNone(value.tp$hash)) {
            // python sets the hash function to None , so we have to catch this case here
            throw new TypeError(new str("unhashable type: '" + typeName(value) + "'"));
        } else if (value.tp$hash !== undefined) {
            if (value.$savedHash_) {
                return value.$savedHash_;
            }
            value.$savedHash_ = value.tp$hash();
            return value.$savedHash_;
        } else {
            if (value.__hash === undefined) {
                hashCount += 1;
                value.__hash = hashCount;
            }
            return new int_(value.__hash);
        }
    } else if (typeof value === "number" || value === null ||
        value === true || value === false) {
        throw new TypeError("unsupported Javascript type");
    }

    return new str((typeof value) + " " + String(value));
    // todo; throw properly for unhashable types
};

export function getattr (obj, name, default_) {
    var ret, mangledName;
    pyCheckArgs("getattr", arguments, 2, 3);
    if (!checkString(name)) {
        throw new TypeError("attribute name must be string");
    }

    mangledName = Sk.fixReservedWords(remapToJs(name));
    ret = obj.tp$getattr(mangledName);
    if (ret === undefined) {
        if (default_ !== undefined) {
            return default_;
        } else {
            throw new AttributeError("'" + typeName(obj) + "' object has no attribute '" + name.v + "'");
        }
    }
    return ret;
};

export function setattr (obj, name, value) {
    pyCheckArgs("setattr", arguments, 3, 3);
    // cannot set or del attr from builtin type
    if (obj === undefined || obj["$r"] === undefined || obj["$r"]().v.slice(1,5) !== "type") {
        if (!checkString(name)) {
            throw new TypeError("attribute name must be string");
        }
        if (obj.tp$setattr) {
            obj.tp$setattr(Sk.fixReservedWords(remapToJs(name)), value);
        } else {
            throw new AttributeError("object has no attribute " + remapToJs(name));
        }
        return none.none$;
    }

    throw new TypeError("can't set attributes of built-in/extension type '" + obj.tp$name + "'");
};

export function raw_input(prompt) {
    var lprompt = prompt ? prompt : "";

    return chain(Sk.importModule("sys", false, true), function (sys) {
        if (Sk.inputfunTakesPrompt) {
            return callsimOrSuspend(Sk.builtin.file.$readline, sys["$d"]["stdin"], null, lprompt);
        } else {
            return chain(undefined, function() {
                return callsimOrSuspend(sys["$d"]["stdout"]["write"], sys["$d"]["stdout"], new Sk.builtin.str(lprompt));
            }, function () {
                return callsimOrSuspend(sys["$d"]["stdin"]["readline"], sys["$d"]["stdin"]);
            });
        }
    });
};

export const input = raw_input;

export function jseval (evalcode) {
    var result = goog.global["eval"](remapToJs(evalcode));
    try {
        return remapToPy(result);
    } catch (err) {
        if (err.constructor === goog.asserts.AssertionError) {
            return none.none$;
        }

        throw err;
    }
};

export function jsmillis () {
    var now = new Date();
    return now.valueOf();
};

export function superbi () {
    throw new NotImplementedError("super is not yet implemented, please report your use case as a github issue.");
};

export function eval_ () {
    throw new NotImplementedError("eval is not yet implemented");
};

export function map (fun, seq) {
    var retval = [];
    var next;
    var nones;
    var args;
    var argnum;
    var i;
    var iterables;
    var combined;
    pyCheckArgs("map", arguments, 2);

    if (arguments.length > 2) {
        // Pack sequences into one list of Javascript Arrays

        combined = [];
        iterables = Array.prototype.slice.apply(arguments).slice(1);
        for (i in iterables) {
            if (!checkIterable(iterables[i])) {
                argnum = parseInt(i, 10) + 2;
                throw new TypeError("argument " + argnum + " to map() must support iteration");
            }
            iterables[i] = iter(iterables[i]);
        }

        while (true) {
            args = [];
            nones = 0;
            for (i in iterables) {
                next = iterables[i].tp$iternext();
                if (next === undefined) {
                    args.push(none.none$);
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
        seq = new list(combined);
    }
    if (!checkIterable(seq)) {
        throw new TypeError("'" + typeName(seq) + "' object is not iterable");
    }

    retval = [];

    return chain(iterFor(iter(seq), function (item) {

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

            return chain(applyOrSuspend(fun, undefined, undefined, undefined, item), function (result) {
                retval.push(result);
            });
        }
    }), function () {
        return new Sk.builtin.list(retval);
    });
};

export function reduce (fun, seq, initializer) {
    var item;
    var accum_value;
    var iter;
    pyCheckArgs("reduce", arguments, 2, 3);
    if (!checkIterable(seq)) {
        throw new TypeError("'" + typeName(seq) + "' object is not iterable");
    }

    iter = iter(seq);
    if (initializer === undefined) {
        initializer = iter.tp$iternext();
        if (initializer === undefined) {
            throw new TypeError("reduce() of empty sequence with no initial value");
        }
    }
    accum_value = initializer;
    for (item = iter.tp$iternext();
         item !== undefined;
         item = iter.tp$iternext()) {
        accum_value = callsim(fun, accum_value, item);
    }

    return accum_value;
};

export function filter (fun, iterable) {
    var result;
    var iter, item;
    var retval;
    var ret;
    var add;
    var ctor;
    pyCheckArgs("filter", arguments, 2, 2);

    if (!checkIterable(iterable)) {
        throw new TypeError("'" + typeName(iterable) + "' object is not iterable");
    }

    ctor = function () {
        return [];
    };
    add = function (iter, item) {
        iter.push(item);
        return iter;
    };
    ret = function (iter) {
        return new list(iter);
    };

    if (iterable.__class__ === str) {
        ctor = function () {
            return new str("");
        };
        add = function (iter, item) {
            return iter.sq$concat(item);
        };
        ret = function (iter) {
            return iter;
        };
    } else if (iterable.__class__ === tuple) {
        ret = function (iter) {
            return new tuple(iter);
        };
    }

    retval = ctor();

    for (iter = iter(iterable), item = iter.tp$iternext();
         item !== undefined;
         item = iter.tp$iternext()) {
        if (fun === none.none$) {
            result = new bool( item);
        } else {
            result = callsim(fun, item);
        }

        if (isTrue(result)) {
            retval = add(retval, item);
        }
    }

    return ret(retval);
};

export function hasattr (obj, attr) {
    pyCheckArgs("hasattr", arguments, 2, 2);
    var special, ret;
    if (!checkString(attr)) {
        throw new TypeError("hasattr(): attribute name must be string");
    }

    if (obj.tp$getattr) {
        if (obj.tp$getattr(attr.v)) {
            return bool.true$;
        } else {
            return bool.false$;
        }
    } else {
        throw new AttributeError("Object has no tp$getattr method");
    }
};


export function pow (a, b, c) {
    var ret;
    var res;
    var right;
    var left;
    var c_num;
    var b_num;
    var a_num;
    pyCheckArgs("pow", arguments, 2, 3);

    if (c instanceof none) {
        c = undefined;
    }

    // add complex type hook here, builtin is messed up anyways
    if (checkComplex(a)) {
        return a.nb$power(b, c); // call complex pow function
    }

    a_num = asnum$(a);
    b_num = asnum$(b);
    c_num = asnum$(c);

    if (!checkNumber(a) || !checkNumber(b)) {
        if (c === undefined) {
            throw new TypeError("unsupported operand type(s) for pow(): '" + typeName(a) + "' and '" + typeName(b) + "'");
        }
        throw new TypeError("unsupported operand type(s) for pow(): '" + typeName(a) + "', '" + typeName(b) + "', '" + typeName(c) + "'");
    }
    if (a_num < 0 && b instanceof float_) {
        throw new ValueError("negative number cannot be raised to a fractional power");
    }

    if (c === undefined) {
        if ((a instanceof float_ || b instanceof float_) || (b_num < 0)) {
            return new float_(Math.pow(a_num, b_num));
        }

        left = new int_(a_num);
        right = new int_(b_num);
        res = left.nb$power(right);

        if (a instanceof lng || b instanceof lng) {
            return new lng(res);
        }

        return res;
    } else {
        if (!checkInt(a) || !checkInt(b) || !checkInt(c)) {
            throw new TypeError("pow() 3rd argument not allowed unless all arguments are integers");
        }
        if (b_num < 0) {
            if (Sk.__future__.exceptions) {
                throw new ValueError("pow() 2nd argument cannot be negative when 3rd argument specified");
            } else {
                throw new TypeError("pow() 2nd argument cannot be negative when 3rd argument specified");
            }
        }
        if (c_num === 0) {
            throw new ValueError("pow() 3rd argument cannot be 0");
        }
        if ((a instanceof lng || b instanceof lng || c instanceof lng) ||
            (Math.pow(a_num, b_num) === Infinity)) {
            // convert a to a long so that we can use biginteger's modPowInt method
            a = new lng(a);
            return a.nb$power(b, c);
        } else {
            ret = new int_(Math.pow(a_num, b_num));
            return ret.nb$remainder(c);
        }
    }
};

export function quit (msg) {
    var s = new str(msg).v;
    throw new SystemExit(s);
}

export function issubclass (c1, c2) {
    var i;
    var issubclass_internal;
    pyCheckArgs("issubclass", arguments, 2, 2);

    if (!checkClass(c1)) {
        throw new Sk.builtin.TypeError("issubclass() arg 1 must be a class");
    }

    if (!checkClass(c2) && !(c2 instanceof Sk.builtin.tuple)) {
        throw new TypeError("issubclass() arg 2 must be a class or tuple of classes");
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

    if (checkClass(c2)) {
        /* Quick test for an exact match */
        if (c1 === c2) {
            return true;
        }

        return issubclass_internal(c1, c2);
    }

    // Handle tuple type argument
    if (c2 instanceof tuple) {
        for (i = 0; i < c2.v.length; ++i) {
            if (issubclass(c1, c2.v[i])) {
                return true;
            }
        }
        return false;
    }
};

export function globals () {
    var i;
    var ret = new dict([]);
    for (i in Sk["globals"]) {
        ret.mp$ass_subscript(new str(i), Sk["globals"][i]);
    }

    return ret;

};

export function divmod (a, b) {
    return numberBinOp(a, b, "DivMod");
};

/**
 * Convert a value to a “formatted” representation, as controlled by format_spec. The interpretation of format_spec
 * will depend on the type of the value argument, however there is a standard formatting syntax that is used by most
 * built-in types: Format Specification Mini-Language.
 */
export function format (value, format_spec) {
    pyCheckArgs("format", arguments, 1, 2);

    if (format_spec === undefined) {
        format_spec = $emptystr;
    }

    return objectFormat(value, format_spec);
};

export function reversed (seq) {
    pyCheckArgs("reversed", arguments, 1, 1);

    var special = lookupSpecial(seq, "__reversed__");
    if (special != null) {
        return callsim(special, seq);
    } else {
        if (!checkSequence(seq)) {
            throw new TypeError("'" + typeName(seq) + "' object is not a sequence");
        }

        /**
         * Builds an iterator that outputs the items form last to first.
         *
         * @constructor
         */
        var reverseIter = function (obj) {
            this.idx = obj.sq$length() - 1;
            this.myobj = obj;
            this.getitem = lookupSpecial(obj, "__getitem__");
            this.tp$iter = function() {
                return this;
            },
            this.tp$iternext = function () {
                var ret;

                if (this.idx < 0) {
                    return undefined;
                }

                try {
                    ret = callsim(this.getitem, this.myobj, remapToPy(this.idx));
                } catch (e) {
                    if (e instanceof IndexError) {
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

export function id(obj) {
    pyCheckArgs("id", arguments, 1, 1);

    if (obj.__id === undefined) {
        idCount += 1;
        obj.__id = idCount;
    }

    return new int_(obj.__id);
};

export function bytearray () {
    throw new NotImplementedError("bytearray is not yet implemented");
};

export function callable (obj) {
    // check num of args
    pyCheckArgs("callable", arguments, 1, 1);

    if (checkCallable(obj)) {
        return bool.true$;
    }
    return bool.false$;
};

export function delattr (obj, attr) {
    pyCheckArgs("delattr", arguments, 2, 2);
    if (obj["$d"][attr.v] !== undefined) {
        var ret = tryCatch(function() {
            var try1 = setattr(obj, attr, undefined);
            return try1;
        }, function(e) {
            tryCatch(function() {
                var try2 = setattr(obj["$d"], attr, undefined);

                return try2;
            }, function(e) {
                if (e instanceof AttributeError) {
                    throw new AttributeError(typeName(obj) + " instance has no attribute '"+ attr.v+ "'");
                } else {
                    throw e;
                }
            });
        });
        return ret;
    } // cannot set or del attr from builtin type
    if (obj["$r"]().v.slice(1,5) !== "type") {
        if (obj.ob$type === type && obj[attr.v] !== undefined) {
            obj[attr.v] = undefined;
            return none.none$;
        }
        throw new AttributeError(typeName(obj) + " instance has no attribute '"+ attr.v+ "'");
    }
    throw new TypeError("can't set attributes of built-in/extension type '" + obj.tp$name + "'");
};

export function execfile () {
    throw new NotImplementedError("execfile is not yet implemented");
};

export function frozenset () {
    throw new NotImplementedError("frozenset is not yet implemented");
};

export function help () {
    throw new NotImplementedError("help is not yet implemented");
};

export function iter (obj, sentinel) {
    pyCheckArgs("iter", arguments, 1, 2);
    if (arguments.length === 1) {
        if (!checkIterable(obj)) {
            throw new TypeError("'" + typeName(obj) +
                "' object is not iterable");
        } else {
            return new iterator(obj);
        }
    } else {
        if (checkCallable(obj)) {
            return new iterator(obj, sentinel);
        } else {
            throw new TypeError("iter(v, w): v must be callable");
        }
    }
};

export function locals () {
    throw new NotImplementedError("locals is not yet implemented");
};

export function memoryview () {
    throw new NotImplementedError("memoryview is not yet implemented");
};

export function next_ (iter, default_) {
    var nxt;
    pyCheckArgs("next", arguments, 1, 2);
    if (!iter.tp$iternext) {
        throw new TypeError("'" + typeName(iter) +
            "' object is not an iterator");
    }
    nxt = iter.tp$iternext();
    if (nxt === undefined) {
        if (default_) {
            return default_;
        }
        throw new StopIteration();
    }
    return nxt;
};

export function reload () {
    throw new NotImplementedError("reload is not yet implemented");
};

export function vars () {
    throw new NotImplementedError("vars is not yet implemented");
};

export const xrange = range;

export function apply_ () {
    throw new NotImplementedError("apply is not yet implemented");
};

export function buffer () {
    throw new NotImplementedError("buffer is not yet implemented");
};

export function coerce () {
    throw new NotImplementedError("coerce is not yet implemented");
};

export function intern () {
    throw new NotImplementedError("intern is not yet implemented");
};
