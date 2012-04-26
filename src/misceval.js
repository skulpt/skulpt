Sk.misceval = {};

Sk.misceval.isIndex = function(o)
{
    return o === null || typeof o === "number" || o.constructor === Sk.builtin.lng || o.tp$index;
};
goog.exportSymbol("Sk.misceval.isIndex", Sk.misceval.isIndex);

Sk.misceval.asIndex = function(o)
{
    if (!Sk.misceval.isIndex(o)) return undefined;
    if (o === null) return undefined;
    if (typeof o === "number") return o;
    goog.asserts.fail("todo;");
};

/**
 * return u[v:w]
 */
Sk.misceval.applySlice = function(u, v, w)
{
    if (u.sq$slice && Sk.misceval.isIndex(v) && Sk.misceval.isIndex(w))
    {
        var ilow = Sk.misceval.asIndex(v);
        if (ilow === undefined) ilow = 0;
        var ihigh = Sk.misceval.asIndex(w);
        if (ihigh === undefined) ihigh = 1e100;
        return Sk.abstr.sequenceGetSlice(u, ilow, ihigh);
    }
    return Sk.abstr.objectGetItem(u, new Sk.builtin.slice(v, w, null));
};
goog.exportSymbol("Sk.misceval.applySlice", Sk.misceval.applySlice);

/**
 * u[v:w] = x
 */
Sk.misceval.assignSlice = function(u, v, w, x)
{
    if (u.sq$ass_slice && Sk.misceval.isIndex(v) && Sk.misceval.isIndex(w))
    {
        var ilow = Sk.misceval.asIndex(v) || 0;
        var ihigh = Sk.misceval.asIndex(w) || 1e100;
        if (x === null)
            Sk.abstr.sequenceDelSlice(u, ilow, ihigh);
        else
            Sk.abstr.sequenceSetSlice(u, ilow, ihigh, x);
    }
    else
    {
        var slice = new Sk.builtin.slice(v, w);
        if (x === null)
            return Sk.abstr.objectDelItem(u, slice);
        else
            return Sk.abstr.objectSetItem(u, slice, x);
    }
};
goog.exportSymbol("Sk.misceval.assignSlice", Sk.misceval.assignSlice);

/**
 * Used by min() and max() to get an array from arbitrary input.
 * Note that this does no validation, just coercion.
 */
Sk.misceval.arrayFromArguments = function(args)
{
    // If args is not a single thing return as is
    if ( args.length != 1 )
    {
        return args;
    }
    var arg = args[0];
    if ( arg instanceof Sk.builtin.set )
    {
        // this is a Sk.builtin.list
        arg = arg.tp$iter().$obj;
    }
    else if ( arg instanceof Sk.builtin.dict )
    {
        // this is a Sk.builtin.list
        arg = Sk.builtin.dict.prototype['keys'].func_code(arg);
    }
    // shouldn't else if here as the two above output lists to arg.
    if ( arg instanceof Sk.builtin.list || arg instanceof Sk.builtin.tuple )
    {
        return arg.v;
    }
    return args;
};
goog.exportSymbol("Sk.misceval.arrayFromArguments", Sk.misceval.arrayFromArguments);

/**
 * for reversed comparison: Eq -> NotEq, etc.
 */
Sk.misceval.swappedOp_ = {
    'Eq': 'NotEq',
    'NotEq': 'Eq',
    'Lt': 'Gt',
    'LtE': 'GtE',
    'Gt': 'Lt',
    'GtE': 'LtE',
    'Is': 'IsNot',
    'IsNot': 'Is',
    'In_': 'NotIn',
    'NotIn': 'In_'
};


Sk.misceval.richCompareBool = function(v, w, op)
{
    if (op === 'Is')
        return v === w;

    if (op === 'IsNot')
        return v !== w;

    if (v === w)
    {
        if (op === 'Eq')
            return true;
        else if (op === 'NotEq')
            return false;
    }

    if (v instanceof Sk.builtin.str && w instanceof Sk.builtin.str)
    {
        if (op === 'Eq')
            return v === w;
        else if (op === 'NotEq')
            return v !== w;
    }

    if ((typeof v === "number" || typeof v === "boolean") && (typeof w === "number" || typeof w === "boolean"))
    {
        switch (op)
        {
            case 'Lt': return v < w;
            case 'LtE': return v <= w;
            case 'Gt': return v > w;
            case 'GtE': return v >= w;
            case 'NotEq': return v != w;
            case 'Eq': return v == w;
            default: throw "assert";
        }
    }
    else
    {

        if (op === "In") return Sk.abstr.sequenceContains(w, v);
        if (op === "NotIn") return !Sk.abstr.sequenceContains(w, v);


        var res;
        //print("  -- rcb:", JSON.stringify(v), JSON.stringify(w), op);
        if (v && w && v.tp$richcompare && (res = v.tp$richcompare(w, op)) !== undefined)
        {
            return res;
        }
        else if (w && v && w.tp$richcompare && (res = v.tp$richcompare(v, Sk.misceval.swappedOp_[op])) !== undefined)
        {
            return res;
        }
        else
        {
            // depending on the op, try left:op:right, and if not, then
            // right:reversed-top:left
            // yeah, a macro or 3 would be nice...
            if (op === 'Eq') {
                if (v && v['__eq__']) 
                    return Sk.misceval.callsim(v['__eq__'], v, w);
                else if (w && w['__ne__'])
                    return Sk.misceval.callsim(w['__ne__'], w, v);
                }
            else if (op === 'NotEq') {
                if (v && v['__ne__'])
                    return Sk.misceval.callsim(v['__ne__'], v, w);
                else if (w && w['__eq__'])
                    return Sk.misceval.callsim(w['__eq__'], w, v);
                }
            else if (op === 'Gt') {
                if (v && v['__gt__'])
                    return Sk.misceval.callsim(v['__gt__'], v, w);
                else if (w && w['__lt__'])
                    return Sk.misceval.callsim(w['__lt__'], w, v);
                }
            else if (op === 'Lt') {
                if (v && v['__lt__'])
                    return Sk.misceval.callsim(v['__lt__'], v, w);
                else if (w && w['__gt__'])
                    return Sk.misceval.callsim(w['__gt__'], w, v);
                }
            else if (op === 'GtE') {
                if (v && v['__ge__'])
                    return Sk.misceval.callsim(v['__ge__'], v, w);
                else if (w && w['__le__'])
                    return Sk.misceval.callsim(w['__le__'], w, v);
                }
            else if (op === 'LtE') {
                if (v && v['__le__'])
                    return Sk.misceval.callsim(v['__le__'], v, w);
                else if (w && w['__ge__'])
                    return Sk.misceval.callsim(w['__ge__'], w, v);
                }

            // if those aren't defined, fallback on the __cmp__ method if it
            // exists
            if (v && v['__cmp__'])
            {
                var ret = Sk.misceval.callsim(v['__cmp__'], v, w);
                if (op === 'Eq') return ret === 0;
                else if (op === 'NotEq') return ret !== 0;
                else if (op === 'Lt') return ret < 0;
                else if (op === 'Gt') return ret > 0;
                else if (op === 'LtE') return ret <= 0;
                else if (op === 'GtE') return ret >= 0;
            }
            else if (w && w['__cmp__'])
            {
                // note, flipped on return value and call
                var ret = Sk.misceval.callsim(w['__cmp__'], w, v);
                if (op === 'Eq') return ret === 0;
                else if (op === 'NotEq') return ret !== 0;
                else if (op === 'Lt') return ret > 0;
                else if (op === 'Gt') return ret < 0;
                else if (op === 'LtE') return ret >= 0;
                else if (op === 'GtE') return ret <= 0;
            }

        }
        if (typeof v !== typeof w) {
            if (op === 'NotEq') return true;
            else
                return false;
        }

    }

    // todo; some defaults, mostly to handle diff types -> false. are these ok?
    if (op === 'Eq') return v === w;
    if (op === 'NotEq') return v !== w;

    throw new Sk.builtin.ValueError("don't know how to compare '" + v.tp$name + "' and '" + w.tp$name + "'");
};
goog.exportSymbol("Sk.misceval.richCompareBool", Sk.misceval.richCompareBool);

Sk.misceval.objectRepr = function(v)
{
    goog.asserts.assert(v !== undefined, "trying to repr undefined");
    if (v === null)
        return new Sk.builtin.str("None"); // todo; these should be consts
    else if (v === true)
        return new Sk.builtin.str("True");
    else if (v === false)
        return new Sk.builtin.str("False");
    else if (typeof v === "number")
        return new Sk.builtin.str("" + v);
    else if (!v['$r'])
        return new Sk.builtin.str("<" + v.tp$name + " object>");
    else
        return v['$r']();
};
goog.exportSymbol("Sk.misceval.objectRepr", Sk.misceval.objectRepr);

Sk.misceval.opAllowsEquality = function(op)
{
    switch (op)
    {
        case 'LtE':
        case 'Eq':
        case 'GtE':
            return true;
    }
    return false;
};
goog.exportSymbol("Sk.misceval.opAllowsEquality", Sk.misceval.opAllowsEquality);

Sk.misceval.isTrue = function(x)
{
    if (x === true) return true;
    if (x === false) return false;
    if (x === null) return false;
    if (typeof x === "number") return x !== 0;
    if (x.mp$length) return x.mp$length() !== 0;
    if (x.sq$length) return x.sq$length() !== 0;
    return true;
};
goog.exportSymbol("Sk.misceval.isTrue", Sk.misceval.isTrue);

Sk.misceval.softspace_ = false;
Sk.misceval.print_ = function(x)   // this was function print(x)   not sure why...
{
    if (Sk.misceval.softspace_)
    {
        if (x !== "\n") Sk.output(' ');
        Sk.misceval.softspace_ = false;
    }
    var s = new Sk.builtin.str(x);
    Sk.output(s.v);
    var isspace = function(c)
    {
        return c === '\n' || c === '\t' || c === '\r';
    };
    if (s.v.length === 0 || !isspace(s.v[s.v.length - 1]) || s.v[s.v.length - 1] === ' ')
        Sk.misceval.softspace_ = true;
};
goog.exportSymbol("Sk.misceval.print_", Sk.misceval.print_);

/**
 * @param {string} name
 * @param {Object=} other generally globals
 */
Sk.misceval.loadname = function(name, other)
{
    var v = other[name];
    if (v !== undefined) return v;

    var bi = Sk.builtins[name];
    if (bi !== undefined) return bi;

    throw new Sk.builtin.NameError("name '" + name + "' is not defined");
};
goog.exportSymbol("Sk.misceval.loadname", Sk.misceval.loadname);

/**
 *
 * Notes on necessity for 'call()':
 *
 * Classes are callable in python to create an instance of the class. If
 * we're calling "C()" we cannot tell at the call site whether we're
 * calling a standard function, or instantiating a class.
 *
 * JS does not support user-level callables. So, we can't use the normal
 * prototype hierarchy to make the class inherit from a 'class' type
 * where the various tp$getattr, etc. methods would live.
 *
 * Instead, we must copy all the methods from the prototype of our class
 * type onto every instance of the class constructor function object.
 * That way, both "C()" and "C.tp$getattr(...)" can still work. This is
 * of course quite expensive.
 *
 * The alternative would be to indirect all calls (whether classes or
 * regular functions) through something like C.$call(...). In the case
 * of class construction, $call could then call the constructor after
 * munging arguments to pass them on. This would impose a penalty on
 * regular function calls unfortunately, as they would have to do the
 * same thing.
 *
 * Note that the same problem exists for function objects too (a "def"
 * creates a function object that also has properties). It just happens
 * that attributes on classes in python are much more useful and common
 * that the attributes on functions.
 *
 * Also note, that for full python compatibility we have to do the $call
 * method because any python object could have a __call__ method which
 * makes the python object callable too. So, unless we were to make
 * *all* objects simply (function(){...}) and use the dict to create
 * hierarchy, there would be no way to call that python user function. I
 * think I'm prepared to sacrifice __call__ support, or only support it
 * post-ECMA5 or something.
 *
 * Is using (function(){...}) as the only object type too crazy?
 * Probably. Better or worse than having two levels of function
 * invocation for every function call?
 *
 * For a class `C' with instance `inst' we have the following cases:
 *
 * 1. C.attr
 *
 * 2. C.staticmeth()
 *
 * 3. x = C.staticmeth; x()
 *
 * 4. inst = C()
 *
 * 5. inst.attr
 *
 * 6. inst.meth()
 *
 * 7. x = inst.meth; x()
 *
 * 8. inst(), where C defines a __call__
 *
 * Because in general these are accomplished by a helper function
 * (tp$getattr/setattr/slice/ass_slice/etc.) it seems appropriate to add
 * a call that generally just calls through, but sometimes handles the
 * unusual cases. Once ECMA-5 is more broadly supported we can revisit
 * and hopefully optimize.
 *
 * @param {Object} func the thing to call
 * @param {Object=} kwdict **kwargs
 * @param {Object=} varargseq **args
 * @param {Object=} kws keyword args or undef
 * @param {...*} args stuff to pass it
 *
 *
 * TODO I think all the above is out of date.
 */

Sk.misceval.call = function(func, kwdict, varargseq, kws, args)
{
    var args = Array.prototype.slice.call(arguments, 4);
    // todo; possibly inline apply to avoid extra stack frame creation
    return Sk.misceval.apply(func, kwdict, varargseq, kws, args);
};
goog.exportSymbol("Sk.misceval.call", Sk.misceval.call);

/**
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
Sk.misceval.callsim = function(func, args)
{
    var args = Array.prototype.slice.call(arguments, 1);
    return Sk.misceval.apply(func, undefined, undefined, undefined, args);
};
goog.exportSymbol("Sk.misceval.callsim", Sk.misceval.callsim);

/**
 * same as Sk.misceval.call except args is an actual array, rather than
 * varargs.
 */
Sk.misceval.apply = function(func, kwdict, varargseq, kws, args)
{

    if (typeof func === "function")
    {
        // todo; i believe the only time this happens is the wrapper
        // function around generators (that creates the iterator).
        // should just make that a real function object and get rid
        // of this case.
        // alternatively, put it to more use, and perhaps use
        // descriptors to create builtin.func's in other places.

        goog.asserts.assert(kws === undefined);
        return func.apply(null, args);
    }
    else
    {
        var fcall = func.tp$call;
        if (fcall !== undefined)
        {
            if (varargseq)
            {
                for (var it = varargseq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
                {
                    args.push(i);
                }
            }
            if (kwdict)
            {
                goog.asserts.fail("todo;");
            }
            return fcall.call(func, args, kws, kwdict);
        }

        // todo; can we push this into a tp$call somewhere so there's
        // not redundant checks everywhere for all of these __x__ ones?
        fcall = func.__call__;
        if (fcall !== undefined)
        {
            // func is actually the object here because we got __call__
            // from it. todo; should probably use descr_get here
            args.unshift(func);
            return Sk.misceval.apply(fcall, kws, args, kwdict, varargseq);
        }
        throw new TypeError("'" + func.tp$name + "' object is not callable");
    }
};
goog.exportSymbol("Sk.misceval.apply", Sk.misceval.apply);

/**
 * Constructs a class object given a code object representing the body
 * of the class, the name of the class, and the list of bases.
 *
 * There are no "old-style" classes in Skulpt, so use the user-specified
 * metaclass (todo;) if there is one, the type of the 0th base class if
 * there's bases, or otherwise the 'type' type.
 *
 * The func code object is passed a (js) dict for its locals which it
 * stores everything into.
 *
 * The metaclass is then called as metaclass(name, bases, locals) and
 * should return a newly constructed class object.
 *
 */
Sk.misceval.buildClass = function(globals, func, name, bases)
{
    // todo; metaclass
    var meta = Sk.builtin.type;

    var locals = {};

    // init the dict for the class
    //print("CALLING", func);
    func(globals, locals);

    // file's __name__ is class's __module__
    locals.__module__ = globals['__name__'];

    var klass = Sk.misceval.callsim(meta, name, bases, locals);
    //print("class", klass, JSON.stringify(klass.prototype));
    return klass;
};
goog.exportSymbol("Sk.misceval.buildClass", Sk.misceval.buildClass);
