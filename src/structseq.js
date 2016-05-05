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

    var cons = function structseq_constructor(arg) {
        Sk.builtin.pyCheckArgs(nm, arguments, 1, 1);
        var o;
        var it, i, v;
        if (!(this instanceof Sk.builtin.structseq_types[nm])) {
            o = Object.create(Sk.builtin.structseq_types[nm].prototype);
            o.constructor.apply(o, arguments);
            return o;
        }

        if (Object.prototype.toString.apply(arg) === "[object Array]") {
            v = arg;
        } else {
            v = [];
            for (it = Sk.abstr.iter(arg), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                v.push(i);
            }
            if (v.length != flds.length) {
                throw new Sk.builtin.TypeError(nm + "() takes a " + flds.length + "-sequence (" + v.length + "-sequence given)");
            }
        }

        Sk.builtin.tuple.call(this, v);

        this.__class__ = Sk.builtin.structseq_types[nm];
    };
    Sk.builtin.structseq_types[nm] = cons;

    goog.inherits(cons, Sk.builtin.tuple);
    if (doc) {
        cons.prototype.__doc__ = doc;
    }
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
    cons.prototype.tp$setattr = function (name, value) {
        throw new Sk.builtin.AttributeError("readonly property");
    };

    cons.prototype.tp$getattr = function (name) {
        var i = flds.indexOf(name);
        if (i >= 0) {
            return this.v[i];
        } else {
            return  Sk.builtin.object.prototype.GenericGetAttr(name);
        }
    };

    return cons;
};
goog.exportSymbol("Sk.builtin.make_structseq", Sk.builtin.make_structseq);
