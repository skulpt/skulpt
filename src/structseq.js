Sk.builtin.structseq_types = {};

Sk.builtin.make_structseq = function (module, name, fields, doc) {
    var nm = module + "." + name;
    var flds = [];
    var docs = [];
    var i;
    for (var key in fields) {
        flds.push(key);
        docs.push(fields[key]);
    }

    /**
     * @constructor
     * @extends Sk.builtin.tuple
     * @param {!Array<Object>|Object} arg
     */
    var cons = function structseq_constructor(v) {
        Sk.builtin.tuple.call(this, v);
    };

    Sk.builtin.structseq_types[nm] = cons;

    Sk.abstr.setUpInheritance(nm, cons, Sk.builtin.tuple);

    cons.prototype.tp$new = function (args, kwargs) {
        if (kwargs && kwargs.length) {
            throw new Sk.builtin.TypeError(nm + "() takes no keyword arguments"); 
        } else if (args.length !== 1) {
            throw new Sk.builtin.TypeError(nm + "() takes at most 1 argument (" + args.length + " given)");
        }
        const v = [];
        const arg = args[0];

        for (let it = Sk.abstr.iter(arg), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                v.push(i);
            }
        if (v.length != flds.length) {
            throw new Sk.builtin.TypeError(nm + "() takes a " + flds.length + "-sequence (" + v.length + "-sequence given)");
        }

        return new cons(v);
    };


    if (doc) {
        cons.prototype.__doc__ = doc;
        cons.prototype.tp$doc = doc;
    }
    cons.prototype.tp$bases = new Sk.builtin.tuple([Sk.builtin.tuple]);
    cons.prototype.tp$base = Sk.builtin.tuple;
    cons.prototype.tp$mro = new Sk.builtin.tuple([cons, Sk.builtin.tuple, Sk.builtin.object]);
    cons.prototype.__getitem__ = new Sk.builtin.func(function (self, index) {
        return Sk.builtin.tuple.prototype.mp$subscript.call(self, index);
    });
    cons.prototype.__reduce__ = new Sk.builtin.func(function (self) {
        throw new Sk.builtin.Exception("__reduce__ is not implemented");
    });

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
    
    for (i=0; i<flds.length; i++) {
        const gsd = new Sk.GetSetDef(flds[i], 
                                     function () {
                                         return this.v[i];
                                     },
                                     undefined,
                                     docs[i]
                                    )

        cons.prototype[flds[i]] = new Sk.builtin.getset_descriptor(cons, gsd);
    }
    cons.prototype.num_sequence_fields = new Sk.builtin.int_(flds.length);

    return cons;
};
Sk.exportSymbol("Sk.builtin.make_structseq", Sk.builtin.make_structseq);
