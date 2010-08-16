Sk.misceval = {};

Sk.misceval.isIndex = function(o)
{
    return o === null || typeof o === "number" || o.constructor === Sk.builtin.lng || o.tp$index;
};

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
        var ilow = Sk.misceval.asIndex(v) || 0;
        var ihigh = Sk.misceval.asIndex(w) || 1e100;
        return Sk.abstr.sequenceGetSlice(u, ilow, ihigh);
    }
    return Sk.abstr.objectGetItem(u, new Sk.builtin.slice(v, w, null));
};

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

/**
 * for reversed comparison: Eq -> NotEq, etc.
 */
Sk.misceval.swappedOp_ = {
    'Eq': 'NotEq',
    'NotEq': 'Eq',
    'Lt': 'GtE',
    'LtE': 'Gt',
    'Gt': 'LtE',
    'GtE': 'Lt',
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

    if (typeof v === "number" && typeof w === "number")
    {
        switch (op)
        {
            case 'Lt': return v < w;
            case 'LtE': return v <= w;
            case 'Gt': return v > w;
            case 'GtE': return v >= w;
            case 'NotEq': return v !== w;
            case 'Eq': return v === w;
            default: throw "assert";
        }
    }
    else
    {
        if (op === "In") return Sk.abstr.sequenceContains(w, v);
        if (op === "NotIn") return !Sk.abstr.sequenceContains(w, v);

        if (v.tp$richcompare)
            return v.tp$richcompare(w, op);
        else if (w.tp$richcompare)
            return w.tp$richcompare(v, Sk.misceval.swappedOp_[op]);
        // todo; else here?
    }

    // is this true?
    return false;
};

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
    else if (!v.tp$repr)
        return new Sk.builtin.str("<" + v.tp$name + " object>");
    else
        return v.tp$repr();
};


Sk.misceval.isTrue = function(x)
{
    if (x === true) return true;
    if (x === false) return false;
    if (x === null) return false;
    // todo; num, map len, seq len == 0
    return true;
};

Sk.misceval.softspace_ = false;
Sk.misceval.print_ = function print(x)
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

/**
 * @param {string} name
 * @param {Object=} other generally globals
 */
Sk.misceval.loadname = function(name, other)
{
    var v = other[name];
    if (v !== undefined) return v;

    var bi = Sk.builtin[name];
    if (bi !== undefined) return bi;

    throw new Sk.builtin.NameError("name '" + name + "' is not defined");
};

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
 * @param {Object=} kw keyword args or undef
 * @param {...*} args stuff to pass it
 */

Sk.misceval.call = function(func, kw, args)
{
    var args = Array.prototype.slice.call(arguments, 2);
    return Sk.misceval.apply(func, kw, args);
};

/**
 * same as Sk.misceval.call except args is an actual array, rather than
 * varargs.
 */
Sk.misceval.apply = function(func, kw, args)
{
    if (typeof func === "function" && kw === undefined)
    {
        // todo; i believe the only time this happens is the wrapper
        // function around generators (that creates the iterator).
        // should just make that a real function object and get rid
        // of this case.
        return func.apply(null, args);
    }
    else
    {
        var fcall = func.tp$call;
        if (fcall !== undefined)
        {
            // todo; kwargs
            return fcall.apply(func, args);
        }

        // todo; can we push this into a tp$call somewhere so there's
        // not redundant checks everywhere for all of these __x__ ones?
        fcall = func.__call__;
        if (fcall !== undefined)
        {
            // func is actually the object here because we got __call__
            // from it. todo; should probably use descr_get here
            args.unshift(func);
            return Sk.misceval.apply(fcall, kw, args);
        }
        throw new TypeError("'" + func.tp$name + "' object is not callable");
    }
}

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
    var meta = Sk.builtin.type; // todo; base classes

    var locals = {};

    // init the dict for the class
    //print("CALLING", func);
    func(globals, locals);

    // file's __name__ is class's __module__
    locals.__module__ = globals.__name__;

    var klass = Sk.misceval.call(meta, undefined, name, bases, locals);
    //print("class", klass, JSON.stringify(klass.prototype));
    return klass;
};
