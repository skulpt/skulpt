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
        var ilow = Sk.misceval.asIndex(v);
        if (ilow === undefined) ilow = 0;
        var ihigh = Sk.misceval.asIndex(w);
        if (ihigh === undefined) ihigh = 1e100;
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
        else
        {
            // depending on the op, try left:op:right, and if not, then
            // right:reversed-top:left
            // yeah, a macro or 3 would be nice...
            if (op === 'Eq')
                if (v.__eq__)
                    return Sk.misceval.call(v.__eq__, undefined, v, w);
                else if (w.__ne__)
                    return Sk.misceval.call(w.__ne__, undefined, w, v);
            else if (op === 'NotEq')
                if (v.__ne__)
                    return Sk.misceval.call(v.__ne__, undefined, v, w);
                else if (w.__eq__)
                    return Sk.misceval.call(w.__eq__, undefined, w, v);
            else if (op === 'Gt')
                if (v.__gt__)
                    return Sk.misceval.call(v.__gt__, undefined, v, w);
                else if (w.__lt__)
                    return Sk.misceval.call(w.__lt__, undefined, w, v);
            else if (op === 'Lt')
                if (v.__lt__)
                    return Sk.misceval.call(v.__lt__, undefined, v, w);
                else if (w.__gt__)
                    return Sk.misceval.call(w.__gt__, undefined, w, v);
            else if (op === 'GtE')
                if (v.__ge__)
                    return Sk.misceval.call(v.__ge__, undefined, v, w);
                else if (w.__le__)
                    return Sk.misceval.call(w.__le__, undefined, w, v);
            else if (op === 'LtE')
                if (v.__le__)
                    return Sk.misceval.call(v.__le__, undefined, v, w);
                else if (w.__ge__)
                    return Sk.misceval.call(w.__ge__, undefined, w, v);

            // if those aren't defined, fallback on the __cmp__ method if it
            // exists
            if (v.__cmp__)
            {
                var ret = Sk.misceval.call(v.__cmp__, undefined, v, w);
                if (op === 'Eq') return ret === 0;
                else if (op === 'NotEq') return ret !== 0;
                else if (op === 'Lt') return ret < 0;
                else if (op === 'Gt') return ret > 0;
                else if (op === 'LtE') return ret <= 0;
                else if (op === 'GtE') return ret >= 0;
            }
            else if (w.__cmp__)
            {
                // note, flipped on return value and call
                var ret = Sk.misceval.call(w.__cmp__, undefined, w, v);
                if (op === 'Eq') return ret === 0;
                else if (op === 'NotEq') return ret !== 0;
                else if (op === 'Lt') return ret > 0;
                else if (op === 'Gt') return ret < 0;
                else if (op === 'LtE') return ret >= 0;
                else if (op === 'GtE') return ret <= 0;
            }

        }
    }

    // todo; some defaults, mostly to handle diff types -> false. are these ok?
    if (op === 'Eq') return v === w;
    if (op === 'NotEq') return v !== w;

    throw new Sk.builtin.ValueError("don't know how to compare '" + v.tp$name + "' and '" + w.tp$name + "'");
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
    // todo; possibly inline apply to avoid extra stack frame creation
    return Sk.misceval.apply(func, kw, args);
};

/**
 * same as Sk.misceval.call except args is an actual array, rather than
 * varargs.
 */
Sk.misceval.apply = function(func, kw, args)
{
    if (typeof func === "function")
    {
        // todo; i believe the only time this happens is the wrapper
        // function around generators (that creates the iterator).
        // should just make that a real function object and get rid
        // of this case.

        goog.asserts.assert(kw === undefined);
        /*
        if (func.$isnative) // a closure function
        {
            // todo; for now, lame attempt to 'marshal' between python and js
            //debugger;
            for (var i = 0; i < args.length; ++i)
            {
                if (args[i].constructor === Sk.builtin.str)
                    args[i] = args[i].v;
                else if (args[i].constructor === Sk.builtin.wrappedObject)
                    args[i] = args[i].inst$dict;
            }
            var ret;

            // closure ctors don't return this, so we have to do magic to have
            // them return the right thing.
            if (func.$isctor)
            { 
                // have i mentioned in the last 15 minutes how non-orthogonal
                // and ugly javascript is? raaaar
                if (args.length === 0)
                    ret = new func();
                else if (args.length === 1)
                    ret = new func(args[0]);
                else if (args.length === 2)
                    ret = new func(args[0], args[1]);
                else if (args.length === 3)
                    ret = new func(args[0], args[1], args[2]);
                else if (args.length === 4)
                    ret = new func(args[0], args[1], args[2], args[3]);
                else if (args.length === 5)
                    ret = new func(args[0], args[1], args[2], args[3], args[4]);
                else if (args.length === 6)
                    ret = new func(args[0], args[1], args[2], args[3], args[4], args[5]);
                else if (args.length === 7)
                    ret = new func(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
                else
                    goog.asserts.assert("no constructor apply");
            }
            else
            {
                ret = func.apply(null, args);
            }
            // if it's native, we want to return something that has a
            // tp$getattr. todo; need to do this for typeof ret === object,
            // but callables need to be functions
            return new Sk.builtin.wrappedObject(ret);
        }
        else
        */
        {
            //debugger;
            return func.apply(null, args);
        }
    }
    else
    {
        var fcall = func.tp$call;
        if (fcall !== undefined)
        {
            return fcall.call(func, args, kw);
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
