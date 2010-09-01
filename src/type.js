/**
 *
 * @constructor
 *
 * @param {*} name name or object to get type of, if only one arg
 *
 * @param {Array.<Object>=} bases
 *
 * @param {Object=} dict
 *
 *
 * This type represents the type of `type'. *Calling* an instance of
 * this builtin type named "type" creates class objects. The resulting
 * class objects will have various tp$xyz attributes on them that allow
 * for the various operations on that object.
 *
 * calling the type or calling an instance of the type? or both?
 */

Sk.builtin.type = function(name, bases, dict)
{
    if (bases === undefined && dict === undefined)
    {
        // 1 arg version of type()
        var obj = name;
        if (obj === true || obj === false) return Sk.builtin.BoolObj.prototype.ob$type;
        if (obj === null) return Sk.builtin.NoneObj.prototype.ob$type;
        if (typeof obj === "number")
        {
            if (Math.floor(obj) === obj)
                return Sk.builtin.IntObj.prototype.ob$type;
            else
                return Sk.builtin.FloatObj.prototype.ob$type;
        }
        return obj.ob$type;
    }
    else
    {
        // type building version of type

        // dict is the result of running the classes code object
        // (basically the dict of functions). those become the prototype
        // object of the class).

        /**
         * @constructor
         */
        var klass = (function(args)
                {
                    if (args === Sk.$ctorhack) return this;
                    if (!(this instanceof klass)) return new klass(Array.prototype.slice.call(arguments, 0));

                    args = args || [];
                    if (Sk.builtin.dict)
                        this.inst$dict = new Sk.builtin.dict([]);

                    var init = this["__init__"];
                    if (init !== undefined)
                    {
                        // return ignored I guess?
                        args.unshift(this);
                        Sk.misceval.apply(init, undefined, args);
                    }

                    return this;
                });
        //print("type(nbd):",name,JSON.stringify(dict, null,2));
        for (var v in dict)
            klass.prototype[v] = dict[v];
        klass.prototype.tp$name = name;
        klass.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
        klass.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
        klass.prototype.tp$descr_get = function() { goog.asserts.fail("in type tp$descr_get"); };
        klass.prototype.tp$repr = function()
        {
            // todo; these should probably call tp$getattr directly, and it should return undef if there's none.
            var reprf = Sk.builtin.getattr(this, new Sk.builtin.str("__repr__"), undefined);
            if (reprf !== undefined)
                return Sk.misceval.apply(reprf, undefined, []);
            var mod = dict.__module__;
            var cname = "";
            if (mod) cname = mod.v + ".";
            return new Sk.builtin.str("<" + cname + name + " object>");
        };
        klass.prototype.tp$call = function(args, kw)
        {
            var callf = this.tp$getattr("__call__");
            if (callf)
                return Sk.misceval.apply(callf, kw, args);
            throw new Sk.builtin.TypeError("'" + this.tp$name + "' object is not callable");
        };
        klass.prototype.tp$iter = function()
        {
            var iterf = this.tp$getattr("__iter__");
            if (iterf)
            {
                 var ret = Sk.misceval.call(iterf);
                 if (ret.tp$getattr("next") === undefined)
                    throw new Sk.builtin.TypeError("iter() return non-iterator of type '" + this.tp$name + "'");
                 return ret;
            }
            throw new Sk.builtin.TypeError("'" + this.tp$name + "' object is not iterable");
        };
        klass.prototype.tp$iternext = function()
        {
            var iternextf = this.tp$getattr("next");
            goog.asserts.assert(iternextf !== undefined, "iter() should have caught this");
            return Sk.misceval.call(iternextf);
        };

        if (bases)
        {
            klass.prototype.__bases__ = new Sk.builtin.tuple(bases);
            //print(Sk.builtin.repr(klass.prototype.__bases__).v);
            klass.prototype.__mro__ = Sk.builtin.type.buildMRO(klass);
        }

        // because we're not returning a new type() here, we have to manually
        // add all the methods we want from the type class.
        klass.tp$getattr = Sk.builtin.type.prototype.tp$getattr;
        klass.ob$type = Sk.builtin.type.prototype.ob$type;

        klass.prototype.ob$type = Sk.builtin.type.makeTypeObj(name, new klass(Sk.$ctorhack));
        // the klass that's returned (i.e. the constructor 'A'), and the type
        // the objects that are created by instantiating it, both want the same
        // repr. grab this after the method is created in makeTypeObj.
        klass.tp$repr = klass.prototype.ob$type.tp$repr;

        return klass;
    }

};

/**
 *
 */
Sk.builtin.type.makeTypeObj = function(name, newedInstanceOfType)
{
    var t = newedInstanceOfType;
    // todo; clarify why these can't go on type.prototype. needs to be
    // revisited.
    t.ob$type = Sk.builtin.type.prototype.ob$type;
    t.tp$name = name;
    t.tp$repr = function()
    {
        var mod = t.__module__;
        var cname = "";
        if (mod) cname = mod.v + ".";
        return new Sk.builtin.str("<class '" + cname + t.tp$name + "'>");
    };
    t.tp$str = undefined;
    return t;
};
Sk.builtin.type.prototype.ob$type = {
    tp$name: 'type',
    tp$repr: function() { return new Sk.builtin.str("<type 'type'>"); },
    tp$str: undefined
};
Sk.builtin.type.prototype.ob$type.ob$type = Sk.builtin.type.prototype.ob$type;

//Sk.builtin.type.prototype.tp$descr_get = function() { print("in type descr_get"); };
Sk.builtin.type.prototype.tp$name = "type";

/**
 * this is on the proto of things that are created by doing type(n,b,d).
 * 
 * so, this defines a call operator on regular user classes (assuming they have
 * 'type' as their metaclass).
 */
Sk.builtin.type.prototype.tp$call = function(args, kw)
{
    // arguments here are args to __init__

    var obj = new this.tp$new();

    obj.inst$dict = new Sk.builtin.dict([]);

    var init = obj["__init__"];
    if (init !== undefined)
    {
        // return ignored I guess?
        args.unshift(obj);
        Sk.misceval.apply(init, undefined, args);
    }

    return obj;
};

// basically the same as GenericGetAttr except looks in the proto instead
Sk.builtin.type.prototype.tp$getattr = function(name)
{
    var tp = this.prototype;
    var descr = tp[name];
    var f;
    //print("type.tpgetattr descr", descr, descr.tp$name, descr.func_code, name);
    if (descr !== undefined)
    {
        f = descr.ob$type.tp$descr_get;
        // todo;if (f && descr.tp$descr_set) // is a data descriptor if it has a set
            // return f.call(descr, this, this.ob$type);
    }

    if (this.inst$dict)
    {
        //print("hi");
        var res = this.inst$dict.mp$subscript(new Sk.builtin.str(name));
        //print(res);
        if (res !== undefined)
            return res;
    }

    if (f)
    {
        // non-data descriptor
        return f.call(descr, null, tp);
    }

    if (descr)
    {
        return descr;
    }

    throw new Sk.builtin.AttributeError("type object '" + this.tp$name + "' has no attribute '" + name + "'");
};

Sk.builtin.type.mroMerge_ = function(seqs)
{
    print("merge");
    for (var i = 0; i < seqs.length; ++i)
    {
        var seq = seqs[i];
        for (var j = 0; j < seq.length; ++j)
        {
            print(seq[j].tp$name);
        }
    }
    print("--------");
    var res = [];
    for (;;)
    {
        for (var i = 0; i < seqs.length; ++i)
        {
            var seq = seqs[i];
            if (seq.length !== 0)
                break;
        }
        if (i === seqs.length) // all empty
            return res;
        var cands = [];
        for (var i = 0; i < seqs.length; ++i)
        {
            var seq = seqs[i];
            if (seq.length !== 0)
            {
                var cand = seq[0];

                Outer:
                for (var j = 0; j < seqs.length; ++j)
                {
                    var sseq = seqs[i];
                    for (var k = 1; k < sseq.length; ++k)
                        if (sseq[k] === cand)
                            break Outer;
                }

                // cand is not in any sequences' tail -> constraint-free
                if (j === seqs.length)
                    cands.push(cand);
            }
        }

        if (cands.length === 0)
            throw new TypeError("Inconsistent precedences in type hierarchy");

        var next = cands[0];
        // append next to result and remove from sequences
        res.push(next);
        for (var i = 0; i < seqs.length; ++i)
        {
            var seq = seqs[i];
            if (seq.length > 0 && seq[0] === next)
                seq.splice(0, 1);
        }
    }
};

/*
 * C3 MRO (aka CPL) linearization. Figures out which order to search through
 * base classes to determine what should override what. C3 does the "right
 * thing", and it's what Python has used since 2.3.
 *
 * Kind of complicated to explain, but not really that complicated in
 * implementation. Explanations:
 * 
 * http://people.csail.mit.edu/jrb/goo/manual.43/goomanual_55.html
 * http://www.python.org/download/releases/2.3/mro/
 * http://192.220.96.201/dylan/linearization-oopsla96.html
 *
 * This implementation is based on a post by Samuele Pedroni on python-dev
 * (http://mail.python.org/pipermail/python-dev/2002-October/029176.html) when
 * discussing its addition to Python.
 */ 
Sk.builtin.type.buildMRO = function(klass)
{
    // MERGE(klass + mro(bases) + bases)
    var all = [ [klass] ];

    if (klass.prototype.__bases__) // todo; only for 'object' because we don't construct properly yet
    {
        for (var i = 0; i < klass.prototype.__bases__.v.length; ++i)
            all.push(Sk.builtin.type.buildMRO(klass.prototype.__bases__.v[i]));

        var bases = [];
        for (var i = 0; i < klass.prototype.__bases__.v.length; ++i)
            bases.push(klass.prototype.__bases__.v[i]);
        all.push(bases);
    }

    return Sk.builtin.type.mroMerge_(all);
};

