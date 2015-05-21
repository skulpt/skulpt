Sk.builtin.structseq_types = {};

Sk.builtin.make_structseq = function (module, name, fields, doc) {
    var nm = module + "." + name;
    var flds = [];
    var docs = [];
    for (var key in fields)
    {
        flds.push(key);
        docs.push(fields[key]);
    }

    var cons = function structseq_constructor(args)
    {
        Sk.builtin.pyCheckArgs(nm, arguments, 1, 1);
        var o;
        if (!(this instanceof Sk.builtin.structseq_types[nm])) {
            o = Object.create(Sk.builtin.structseq_types[nm].prototype);
            o.constructor.apply(o, arguments);
            return o;
        }
        var it, i;
        if (Object.prototype.toString.apply(args) === "[object Array]") {
            this.v = args;
        }
        else {
            this.v = [];
            if (args.tp$iter)
            {
                var cnt = 0;
                for (it = args.tp$iter(), i = it.tp$iternext(); i !== undefined && cnt < flds.length; i = it.tp$iternext()) {
                    this.v.push(i);
                    cnt++;
                }
                if (cnt < flds.length) {
                    throw new Sk.builtin.TypeError(nm + "() takes a " + flds.length + "-sequence (" + cnt + "-sequence given)");
                }
            } else if (args.__getitem__) {
                for(var idx=0; idx<=flds.length; idx++) {
                    Sk.misceval.apply(args.__getitem__, undefined, undefined, undefined, [Sk.builtin.asnum$(idx)]);
                }
            }  else {
                throw new Sk.builtin.TypeError("constructor requires a sequence");
            } 
        }       

        Sk.builtin.tuple.apply(this, arguments);

        this.__class__ = Sk.builtin.structseq_types[nm];        
    };
    cons["co_kwargs"] = true;
    Sk.builtin.structseq_types[nm] = cons;

    goog.inherits(cons, Sk.builtin.tuple);
    cons.prototype.__doc__ = doc;
    cons.prototype.tp$name = nm;
    cons.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj(nm, Sk.builtin.structseq_types[nm]);
    cons.prototype.ob$type["$d"] = new Sk.builtin.dict([]);
    cons.prototype.ob$type["$d"].mp$ass_subscript(Sk.builtin.type.basesStr_, new Sk.builtin.tuple([Sk.builtin.tuple]));
    //var mro = Sk.builtin.type.buildMRO(cons.prototype.ob$type);
    //cons.prototype.ob$type["$d"].mp$ass_subscript(Sk.builtin.type.mroStr_, mro);
    //cons.prototype.ob$type.tp$mro = mro;
    cons.prototype.__getitem__ = new Sk.builtin.func(function (self, index) {
        return Sk.builtin.tuple.prototype.mp$subscript.call(self, index);
    });


    function makeGetter(i, doc, tp) {
        var x = i;
        var f = new Sk.builtin.func(function(self) {
            return self.v[x];
        });
        f.__doc__ = doc;
        return f;
    }

    for(var i=0; i<flds.length; i++)
    {
        var getter = makeGetter(i, docs[i], cons);
        cons.prototype[flds[i]] = getter;
        cons.prototype.ob$type["$d"].mp$ass_subscript(flds[i], getter);
    }

    cons.prototype["$r"] = function () {
        var ret;
        var i;
        var bits;
        if (this.v.length === 0) {
            return new Sk.builtin.str(nm + "()");
        }
        bits = [];
        for (i = 0; i < this.v.length; ++i) {
            bits[i] = flds[i] + "=" + Sk.misceval.objectRepr(this.v[i]).v;
        }
        ret = bits.join(", ");
        if (this.v.length === 1) {
            ret += ",";
        }
        return new Sk.builtin.str(nm + "(" + ret + ")");
    };
    cons.prototype.tp$setattr = function (name, value) {
        var i = flds.indexOf(name);
        if (i >= 0)
        {
            this.v[i] = value;
        }
    }; 
    cons.prototype.tp$getattr = function (name) {
        var i = flds.indexOf(name);
        if (i >= 0)
        {
            return this.v[i];
        }
    };      

    return cons;
};
goog.exportSymbol("Sk.builtin.make_structseq", Sk.builtin.make_structseq);