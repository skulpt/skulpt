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
                    if (!(this instanceof klass)) return new klass(Array.prototype.slice.call(arguments, 0));

                    args = args || [];
                    goog.asserts.assert(Sk.builtin.dict !== undefined);
                    this['$d'] = new Sk.builtin.dict([]);

                    var init = Sk.builtin.type.typeLookup(this.ob$type, "__init__");
                    if (init !== undefined)
                    {
                        // return ignored I guess?
                        args.unshift(this);
                        Sk.misceval.apply(init, undefined, undefined, undefined, args);
                    }

                    return this;
                });
        //print("type(nbd):",name,JSON.stringify(dict, null,2));
        for (var v in dict)
        {
            klass.prototype[v] = dict[v];
            klass[v] = dict[v];
        }
        klass['__class__'] = klass;
        klass.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
        klass.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
        klass.prototype.tp$descr_get = function() { goog.asserts.fail("in type tp$descr_get"); };
        klass.prototype['$r'] = function()
        {
            var reprf = this.tp$getattr("__repr__");
            if (reprf !== undefined)
                return Sk.misceval.apply(reprf, undefined, undefined, undefined, []);
            var mod = dict.__module__;
            var cname = "";
            if (mod) cname = mod.v + ".";
            return new Sk.builtin.str("<" + cname + name + " object>");
        };
        klass.prototype.tp$call = function(args, kw)
        {
            var callf = this.tp$getattr("__call__");
            /* todo; vararg kwdict */
            if (callf)
                return Sk.misceval.apply(callf, undefined, undefined, kw, args);
            throw new Sk.builtin.TypeError("'" + this.tp$name + "' object is not callable");
        };
        klass.prototype.tp$iter = function()
        {
            var iterf = this.tp$getattr("__iter__");
            if (iterf)
            {
                 var ret = Sk.misceval.callsim(iterf);
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
            return Sk.misceval.callsim(iternextf);
        };

        klass.tp$name = name;

        if (bases)
        {
            //print("building mro for", name);
            //for (var i = 0; i < bases.length; ++i)
                //print("base[" + i + "]=" + bases[i].tp$name);
            klass['$d'] = new Sk.builtin.dict([]);
            klass['$d'].mp$ass_subscript(Sk.builtin.type.basesStr_, new Sk.builtin.tuple(bases));
            var mro = Sk.builtin.type.buildMRO(klass);
            klass['$d'].mp$ass_subscript(Sk.builtin.type.mroStr_, mro);
            klass.tp$mro = mro;
            //print("mro result", Sk.builtin.repr(mro).v);
        }

        // because we're not returning a new type() here, we have to manually
        // add all the methods we want from the type class.
        klass.tp$getattr = Sk.builtin.type.prototype.tp$getattr;
        klass.ob$type = Sk.builtin.type;

        klass.prototype.ob$type = klass;
        Sk.builtin.type.makeIntoTypeObj(name, klass);

        return klass;
    }

};

/**
 *
 */
Sk.builtin.type.makeTypeObj = function(name, newedInstanceOfType)
{
    var t = newedInstanceOfType;
    Sk.builtin.type.makeIntoTypeObj(name, t);
    return newedInstanceOfType;
};

Sk.builtin.type.makeIntoTypeObj = function(name, t)
{
    goog.asserts.assert(name !== undefined);
    goog.asserts.assert(t !== undefined);
    t.ob$type = Sk.builtin.type;
    t.tp$name = name;
    t['$r'] = function()
    {
        var mod = t.__module__;
        var cname = "";
        if (mod) cname = mod.v + ".";
        return new Sk.builtin.str("<class '" + cname + t.tp$name + "'>");
    };
    t.tp$str = undefined;
    t.tp$getattr = Sk.builtin.type.prototype.tp$getattr;
    t.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
    return t;
};

Sk.builtin.type.ob$type = Sk.builtin.type;
Sk.builtin.type.tp$name = "type";
Sk.builtin.type['$r'] = function() { return new Sk.builtin.str("<type 'type'>"); };

//Sk.builtin.type.prototype.tp$descr_get = function() { print("in type descr_get"); };

//Sk.builtin.type.prototype.tp$name = "type";

// basically the same as GenericGetAttr except looks in the proto instead
Sk.builtin.type.prototype.tp$getattr = function(name)
{
    var tp = this;
    var descr = Sk.builtin.type.typeLookup(tp, name);
    var f;
    //print("type.tpgetattr descr", descr, descr.tp$name, descr.func_code, name);
    if (descr !== undefined && descr.ob$type !== undefined)
    {
        f = descr.ob$type.tp$descr_get;
        // todo;if (f && descr.tp$descr_set) // is a data descriptor if it has a set
            // return f.call(descr, this, this.ob$type);
    }

    if (this['$d'])
    {
        //print("hi");
        var res = this['$d'].mp$subscript(new Sk.builtin.str(name));
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

    return undefined;
};

Sk.builtin.type.typeLookup = function(type, name)
{
    var mro = type.tp$mro;

    // todo; probably should fix this, used for builtin types to get stuff
    // from prototype
    if (!mro)
        return type.prototype[name];

    for (var i = 0; i < mro.v.length; ++i)
    {
        var base = mro.v[i];
        if (base.hasOwnProperty(name))
            return base[name];
        var res = base['$d'].mp$subscript(new Sk.builtin.str(name));
        if (res !== undefined)
            return res;
    }

    return undefined;
};

Sk.builtin.type.mroMerge_ = function(seqs)
{
    /*
    var tmp = [];
    for (var i = 0; i < seqs.length; ++i)
    {
        tmp.push(new Sk.builtin.list(seqs[i]));
    }
    print(Sk.builtin.repr(new Sk.builtin.list(tmp)).v);
    */
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
            //print("XXX", Sk.builtin.repr(new Sk.builtin.list(seq)).v);
            if (seq.length !== 0)
            {
                var cand = seq[0];
                //print("CAND", Sk.builtin.repr(cand).v);
                OUTER:
                for (var j = 0; j < seqs.length; ++j)
                {
                    var sseq = seqs[j];
                    for (var k = 1; k < sseq.length; ++k)
                        if (sseq[k] === cand)
                            break OUTER;
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

Sk.builtin.type.buildMRO_ = function(klass)
{
    // MERGE(klass + mro(bases) + bases)
    var all = [ [klass] ];

    //Sk.debugout("buildMRO for", klass.tp$name);

    var kbases = klass['$d'].mp$subscript(Sk.builtin.type.basesStr_);
    for (var i = 0; i < kbases.v.length; ++i)
        all.push(Sk.builtin.type.buildMRO_(kbases.v[i]));

    var bases = [];
    for (var i = 0; i < kbases.v.length; ++i)
        bases.push(kbases.v[i]);
    all.push(bases);

    return Sk.builtin.type.mroMerge_(all);
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
    return new Sk.builtin.tuple(Sk.builtin.type.buildMRO_(klass));
};

