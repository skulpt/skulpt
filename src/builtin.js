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

Sk.builtin.range = new Sk.builtin.func(function range (start, stop, step) {
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

    start = Sk.internal.asnum$(start);
    stop = Sk.internal.asnum$(stop);
    step = Sk.internal.asnum$(step);

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
            ret.push(new Sk.builtin.int_(i));
        }
    } else {
        for (i = start; i > stop; i += step) {
            ret.push(new Sk.builtin.int_(i));
        }
    }

    return new Sk.builtin.list(ret);
});

Sk.builtin.round = new Sk.builtin.func(function round (number, ndigits) {
    var special;
    Sk.builtin.pyCheckArgs("round", arguments, 1, 2);

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
    special = Sk.abstr.lookupSpecial(number, "__round__");
    if (special != null) {
        // method on builtin, provide this arg
        if (!Sk.builtin.checkFunction(number)) {
            return Sk.misceval.callsim(special, number, ndigits);
        } else {
            return Sk.misceval.callsim(special, number);
        }
    } else {
        throw new Sk.builtin.TypeError("a float is required");
    }
});

Sk.builtin.len = new Sk.builtin.func(function len (item) {
    var intcheck;
    var special;
    Sk.builtin.pyCheckArgs("len", arguments, 1, 1);

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
            special = Sk.abstr.lookupSpecial(item, "__len__");
            if (special != null) {
                return Sk.misceval.callsim(special, item);
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
});

Sk.builtin.min = new Sk.builtin.func(function min () {
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
});

Sk.builtin.max = new Sk.builtin.func(function max () {
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
});

Sk.builtin.any = new Sk.builtin.func(function any (iter) {
    var it, i;

    Sk.builtin.pyCheckArgs("any", arguments, 1, 1);
    if (!Sk.builtin.checkIterable(iter)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter) +
            "' object is not iterable");
    }

    it = Sk.abstr.iter(iter);
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (Sk.misceval.isTrue(i)) {
            return Sk.builtin.bool.true$;
        }
    }

    return Sk.builtin.bool.false$;
});

Sk.builtin.all = new Sk.builtin.func(function all (iter) {
    var it, i;

    Sk.builtin.pyCheckArgs("all", arguments, 1, 1);
    if (!Sk.builtin.checkIterable(iter)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter) +
            "' object is not iterable");
    }

    it = Sk.abstr.iter(iter);
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (!Sk.misceval.isTrue(i)) {
            return Sk.builtin.bool.false$;
        }
    }

    return Sk.builtin.bool.true$;
});

Sk.builtin.sum = new Sk.builtin.func(function sum (iter, start) {
    var tot;
    var intermed;
    var it, i;
    var has_float;

    Sk.builtin.pyCheckArgs("sum", arguments, 1, 2);
    Sk.builtin.pyCheckType("iter", "iterable", Sk.builtin.checkIterable(iter));
    if (start !== undefined && Sk.builtin.checkString(start)) {
        throw new Sk.builtin.TypeError("sum() can't sum strings [use ''.join(seq) instead]");
    }
    if (start === undefined) {
        tot = new Sk.builtin.int_(0);
    } else {
        tot = start;
    }

    it = Sk.abstr.iter(iter);
    for (i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (i instanceof Sk.builtin.float_) {
            has_float = true;
            if (!(tot instanceof Sk.builtin.float_)) {
                tot = new Sk.builtin.float_(Sk.internal.asnum$(tot));
            }
        } else if (i instanceof Sk.builtin.lng) {
            if (!has_float) {
                if (!(tot instanceof Sk.builtin.lng)) {
                    tot = new Sk.builtin.lng(tot);
                }
            }
        }

        if (tot.nb$add !== undefined) {
            intermed = tot.nb$add(i);
            if ((intermed !== undefined) && (intermed !== Sk.builtin.NotImplemented.NotImplemented$)) {
                tot = tot.nb$add(i);
                continue;
            }
        }

        throw new Sk.builtin.TypeError("unsupported operand type(s) for +: '" +
                    Sk.abstr.typeName(tot) + "' and '" +
                    Sk.abstr.typeName(i) + "'");
    }

    return tot;
});

Sk.builtin.zip = new Sk.builtin.func(function zip () {
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
});

Sk.builtin.abs = new Sk.builtin.func(function abs (x) {
    Sk.builtin.pyCheckArgs("abs", arguments, 1, 1);

    if (x instanceof Sk.builtin.int_) {
        return new Sk.builtin.int_(Math.abs(x.v));
    }
    if (x instanceof Sk.builtin.float_) {
        return new Sk.builtin.float_(Math.abs(x.v));
    }
    if (Sk.builtin.checkNumber(x)) {
        return Sk.builtin.assk$(Math.abs(Sk.internal.asnum$(x)));
    } else if (Sk.builtin.checkComplex(x)) {
        return Sk.misceval.callsim(x.__abs__, x);
    }

    // call custom __abs__ methods
    if (x.tp$getattr) {
        var f = x.tp$getattr("__abs__");
        return Sk.misceval.callsim(f);
    }

    throw new TypeError("bad operand type for abs(): '" + Sk.abstr.typeName(x) + "'");
});

Sk.builtin.ord = new Sk.builtin.func(function ord (x) {
    Sk.builtin.pyCheckArgs("ord", arguments, 1, 1);

    if (!Sk.builtin.checkString(x)) {
        throw new Sk.builtin.TypeError("ord() expected a string of length 1, but " + Sk.abstr.typeName(x) + " found");
    } else if (x.v.length !== 1) {
        throw new Sk.builtin.TypeError("ord() expected a character, but string of length " + x.v.length + " found");
    }
    return new Sk.builtin.int_((x.v).charCodeAt(0));
});

Sk.builtin.chr = new Sk.builtin.func(function chr (x) {
    Sk.builtin.pyCheckArgs("chr", arguments, 1, 1);
    if (!Sk.builtin.checkInt(x)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }
    x = Sk.internal.asnum$(x);


    if ((x < 0) || (x > 255)) {
        throw new Sk.builtin.ValueError("chr() arg not in range(256)");
    }

    return new Sk.builtin.str(String.fromCharCode(x));
});

Sk.builtin.unichr = new Sk.builtin.func(function unichr (x) {
    Sk.builtin.pyCheckArgs("chr", arguments, 1, 1);
    if (!Sk.builtin.checkInt(x)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }
    x = Sk.internal.asnum$(x);

    try {
        return new Sk.builtin.str(String.fromCodePoint(x));
    }
    catch (err) {
        if (err instanceof RangeError) {
            throw new Sk.builtin.ValueError(err.message);
        }
        throw err;
    }
});


Sk.builtin.hex = new Sk.builtin.func(function hex (x) {
    Sk.builtin.pyCheckArgs("hex", arguments, 1, 1);
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("hex() argument can't be converted to hex");
    }
    return Sk.builtin.int2str_(x, 16, "0x");
});

Sk.builtin.oct = new Sk.builtin.func(function oct (x) {
    Sk.builtin.pyCheckArgs("oct", arguments, 1, 1);
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("oct() argument can't be converted to hex");
    }
    if (Sk.__future__.octal_number_literal) {
        return Sk.builtin.int2str_(x, 8, "0o");
    } else {
        return Sk.builtin.int2str_(x, 8, "0");
    }
});

Sk.builtin.bin = new Sk.builtin.func(function bin (x) {
    Sk.builtin.pyCheckArgs("bin", arguments, 1, 1);
    if (!Sk.misceval.isIndex(x)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(x) + "' object can't be interpreted as an index");
    }
    return Sk.builtin.int2str_(x, 2, "0b");
});

Sk.builtin.dir = new Sk.builtin.func(function dir (x) {
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
        var internal = [
            "__bases__", "__mro__", "__class__", "__name__", "GenericGetAttr",
            "GenericSetAttr", "GenericPythonGetAttr", "GenericPythonSetAttr",
            "pythonFunctions", "HashNotImplemented", "constructor", "__dict__"
        ];
        if (internal.indexOf(k) !== -1) {
            return null;
        }
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
    var special = Sk.abstr.lookupSpecial(x, "__dir__");
    if(special != null) {
        // method on builtin, provide this arg
        _seq = Sk.misceval.callsim(special, x);

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
});

Sk.builtin.dir.slotNameToRichName = function (k) {
    // todo; map tp$xyz to __xyz__ properly
    return undefined;
};

Sk.builtin.repr = new Sk.builtin.func(function repr (x) {
    Sk.builtin.pyCheckArgs("repr", arguments, 1, 1);

    return Sk.misceval.objectRepr(x);
});

Sk.builtin.open = new Sk.builtin.func(function open (filename, mode, bufsize) {
    Sk.builtin.pyCheckArgs("open", arguments, 1, 3);
    if (mode === undefined) {
        mode = new Sk.builtin.str("r");
    }

    if (/\+/.test(mode.v)) {
        throw "todo; haven't implemented read/write mode";
    } else if ((mode.v === "w" || mode.v === "wb" || mode.v === "a" || mode.v === "ab") && !Sk.nonreadopen) {
        throw "todo; haven't implemented non-read opens";
    }

    return new Sk.builtin.file(filename, mode, bufsize);
});

Sk.builtin.isinstance = new Sk.builtin.func(Sk.internal.isinstance);

Sk.builtin.hash = new Sk.builtin.func(Sk.internal.hash);

Sk.builtin.getattr = new Sk.builtin.func(function getattr (obj, name, default_) {
    var ret, mangledName;
    Sk.builtin.pyCheckArgs("getattr", arguments, 2, 3);
    if (!Sk.builtin.checkString(name)) {
        throw new Sk.builtin.TypeError("attribute name must be string");
    }

    mangledName = Sk.fixReservedWords(Sk.ffi.remapToJs(name));
    ret = obj.tp$getattr(mangledName);
    if (ret === undefined) {
        if (default_ !== undefined) {
            return default_;
        } else {
            throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(obj) + "' object has no attribute '" + name.v + "'");
        }
    }
    return ret;
});

Sk.builtin.setattr = new Sk.builtin.func(function setattr (obj, name, value) {
    Sk.builtin.pyCheckArgs("setattr", arguments, 3, 3);
    // cannot set or del attr from builtin type
    if (obj === undefined || obj["$r"] === undefined || obj["$r"]().v.slice(1,5) !== "type") {
        if (!Sk.builtin.checkString(name)) {
            throw new Sk.builtin.TypeError("attribute name must be string");
        }
        if (obj.tp$setattr) {
            obj.tp$setattr(Sk.fixReservedWords(Sk.ffi.remapToJs(name)), value);
        } else {
            throw new Sk.builtin.AttributeError("object has no attribute " + Sk.ffi.remapToJs(name));
        }
        return Sk.builtin.none.none$;
    }

    throw new Sk.builtin.TypeError("can't set attributes of built-in/extension type '" + obj.tp$name + "'");
});

Sk.builtin.raw_input = new Sk.builtin.func(function (prompt) {
    var lprompt = prompt ? prompt : "";

    return Sk.misceval.chain(Sk.importModule("sys", false, true), function (sys) {
        if (Sk.inputfunTakesPrompt) {
            return Sk.misceval.callsimOrSuspend(Sk.builtin.file.$readline, sys["$d"]["stdin"], null, lprompt);
        } else {
            return Sk.misceval.chain(undefined, function() {
                return Sk.misceval.callsimOrSuspend(sys["$d"]["stdout"]["write"], sys["$d"]["stdout"], new Sk.builtin.str(lprompt));
            }, function () {
                return Sk.misceval.callsimOrSuspend(sys["$d"]["stdin"]["readline"], sys["$d"]["stdin"]);
            });
        }
    });
});

Sk.builtin.input = Sk.builtin.raw_input;

Sk.builtin.jseval = new Sk.builtin.func(function jseval (evalcode) {
    goog.global["eval"](Sk.ffi.remapToJs(evalcode));
});

Sk.builtin.jsmillis = new Sk.builtin.func(function jsmillis () {
    var now = new Date();
    return now.valueOf();
});

Sk.builtin.eval_ = new Sk.builtin.func(function eval_ () {
    throw new Sk.builtin.NotImplementedError("eval is not yet implemented");
});

Sk.builtin.map = new Sk.builtin.func(function map (fun, seq) {
    var iter;
    var retval = [];
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
            iterables[i] = Sk.abstr.iter(iterables[i]);
        }

        while (true) {
            args = [];
            nones = 0;
            for (i in iterables) {
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

    iter = Sk.abstr.iter(seq);

    return (function loopDeLoop(i) {
        var item = i.tp$iternext();

        if (item === undefined) {
            return new Sk.builtin.list(retval);
        }

        if (fun === Sk.builtin.none.none$) {
            if (item instanceof Array) {
                // With None function and multiple sequences,
                // map should return a list of tuples
                item = new Sk.builtin.tuple(item);
            }
            retval.push(item);
            return loopDeLoop(iter);
        } 
        
        if (!(item instanceof Array)) {
            // If there was only one iterable, convert to Javascript
            // Array for call to apply.
            item = [item];
        }

        return Sk.misceval.chain(Sk.misceval.applyOrSuspend(fun, undefined, undefined, undefined, item), function (result) {
            retval.push(result);
            return loopDeLoop(iter);
        });
    }(iter));
});

Sk.builtin.reduce = new Sk.builtin.func(function reduce (fun, seq, initializer) {
    var item;
    var accum_value;
    var iter;
    Sk.builtin.pyCheckArgs("reduce", arguments, 2, 3);
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
        accum_value = Sk.misceval.callsim(fun, accum_value, item);
    }

    return accum_value;
});

Sk.builtin.filter = new Sk.builtin.func(function filter (fun, iterable) {
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
            result = Sk.misceval.callsim(fun, item);
        }

        if (Sk.misceval.isTrue(result)) {
            retval = add(retval, item);
        }
    }

    return ret(retval);
});

Sk.builtin.hasattr = new Sk.builtin.func(function hasattr (obj, attr) {
    Sk.builtin.pyCheckArgs("hasattr", arguments, 2, 2);
    var special, ret;
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
});


Sk.builtin.pow = new Sk.builtin.func(function pow (a, b, c) {
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

    // add complex type hook here, builtin is messed up anyways
    if (Sk.builtin.checkComplex(a)) {
        return a.nb$power(b, c); // call complex pow function
    }

    a_num = Sk.internal.asnum$(a);
    b_num = Sk.internal.asnum$(b);
    c_num = Sk.internal.asnum$(c);

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
});

Sk.builtin.quit = new Sk.builtin.func(function quit (msg) {
    var s = new Sk.builtin.str(msg).v;
    throw new Sk.builtin.SystemExit(s);
});


Sk.builtin.issubclass = new Sk.builtin.func(Sk.internal.issubclass);

Sk.builtin.globals = new Sk.builtin.func(function globals () {
    var i;
    var ret = new Sk.builtin.dict([]);
    for (i in Sk["globals"]) {
        ret.mp$ass_subscript(new Sk.builtin.str(i), Sk["globals"][i]);
    }

    return ret;

});

Sk.builtin.divmod = new Sk.builtin.func(function divmod (a, b) {
    return Sk.abstr.numberBinOp(a, b, "DivMod");
});

/**
 * Convert a value to a “formatted” representation, as controlled by format_spec. The interpretation of format_spec
 * will depend on the type of the value argument, however there is a standard formatting syntax that is used by most
 * built-in types: Format Specification Mini-Language.
 */
Sk.builtin.format = new Sk.builtin.func(function format (value, format_spec) {
    Sk.builtin.pyCheckArgs("format", arguments, 1, 2);

    if (format_spec === undefined) {
        format_spec = Sk.builtin.str.$emptystr;
    }

    return Sk.abstr.objectFormat(value, format_spec);
});

Sk.builtin.reversed = new Sk.builtin.func(function reversed (seq) {
    Sk.builtin.pyCheckArgs("reversed", arguments, 1, 1);

    var special = Sk.abstr.lookupSpecial(seq, "__reversed__");
    if (special != null) {
        return Sk.misceval.callsim(special, seq);
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
            this.getitem = Sk.abstr.lookupSpecial(obj, "__getitem__");
            this.tp$iter = function() {
                return this;
            },
            this.tp$iternext = function () {
                var ret;

                if (this.idx < 0) {
                    return undefined;
                }

                try {
                    ret = Sk.misceval.callsim(this.getitem, this.myobj, Sk.ffi.remapToPy(this.idx));
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
});

Sk.builtin.id = new Sk.builtin.func(function (obj) {
    Sk.builtin.pyCheckArgs("id", arguments, 1, 1);

    if (obj.__id === undefined) {
        Sk.builtin.idCount += 1;
        obj.__id = Sk.builtin.idCount;
    }

    return new Sk.builtin.int_(obj.__id);
});

Sk.builtin.bytearray = new Sk.builtin.func(function bytearray () {
    throw new Sk.builtin.NotImplementedError("bytearray is not yet implemented");
});

Sk.builtin.callable = new Sk.builtin.func(function callable (obj) {
    // check num of args
    Sk.builtin.pyCheckArgs("callable", arguments, 1, 1);

    if (Sk.builtin.checkCallable(obj)) {
        return Sk.builtin.bool.true$;
    }
    return Sk.builtin.bool.false$;
});

Sk.builtin.delattr = new Sk.builtin.func(function delattr (obj, attr) {
    Sk.builtin.pyCheckArgs("delattr", arguments, 2, 2);
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
    throw new Sk.builtin.TypeError("can't set attributes of built-in/extension type '" + obj.tp$name + "'");
});

Sk.builtin.execfile = new Sk.builtin.func(function execfile () {
    throw new Sk.builtin.NotImplementedError("execfile is not yet implemented");
});

Sk.builtin.frozenset = new Sk.builtin.func(function frozenset () {
    throw new Sk.builtin.NotImplementedError("frozenset is not yet implemented");
});

Sk.builtin.help = new Sk.builtin.func(function help () {
    throw new Sk.builtin.NotImplementedError("help is not yet implemented");
});

Sk.builtin.iter = new Sk.builtin.func(function iter (obj, sentinel) {
    Sk.builtin.pyCheckArgs("iter", arguments, 1, 2);
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
});

Sk.builtin.locals = new Sk.builtin.func(function locals () {
    throw new Sk.builtin.NotImplementedError("locals is not yet implemented");
});
Sk.builtin.memoryview = new Sk.builtin.func(function memoryview () {
    throw new Sk.builtin.NotImplementedError("memoryview is not yet implemented");
});

Sk.builtin.next_ = new Sk.builtin.func(function next_ (iter, default_) {
    var nxt;
    Sk.builtin.pyCheckArgs("next", arguments, 1, 2);
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
});

Sk.builtin.reload = new Sk.builtin.func(function reload () {
    throw new Sk.builtin.NotImplementedError("reload is not yet implemented");
});
Sk.builtin.vars = new Sk.builtin.func(function vars () {
    throw new Sk.builtin.NotImplementedError("vars is not yet implemented");
});
Sk.builtin.xrange = Sk.builtin.range;
Sk.builtin.apply_ = new Sk.builtin.func(function apply_ () {
    throw new Sk.builtin.NotImplementedError("apply is not yet implemented");
});
Sk.builtin.buffer = new Sk.builtin.func(function buffer () {
    throw new Sk.builtin.NotImplementedError("buffer is not yet implemented");
});
Sk.builtin.coerce = new Sk.builtin.func(function coerce () {
    throw new Sk.builtin.NotImplementedError("coerce is not yet implemented");
});
Sk.builtin.intern = new Sk.builtin.func(function intern () {
    throw new Sk.builtin.NotImplementedError("intern is not yet implemented");
});
