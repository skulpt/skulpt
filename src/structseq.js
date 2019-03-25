import { iter } from './abstract';
import { func, pyCheckArgs } from './function';
import { TypeError, AttributeError, Exception } from './errors';
import { tuple } from './tuple';
import { str } from './str';
import { dict } from './dict';
import { object } from './object';
import { objectRepr } from './misceval';

const structseq_types = {};

export function make_structseq(module, name, fields, doc) {
    var nm = module + "." + name;
    var flds = [];
    var docs = [];

    for (var key in fields) {
        flds.push(key);
        docs.push(fields[key]);
    }

    class structseq extends tuple {
        constructor(arg) {
            pyCheckArgs(nm, arguments, 1, 1);
            var o;
            var it, i, v;
            if (!(this instanceof structseq_types[nm])) {
                o = Object.create(Sk.builtin.structseq_types[nm].prototype);
                o.constructor.apply(o, arguments);
                return o;
            }

            if (Object.prototype.toString.apply(arg) === "[object Array]") {
                v = arg;
            } else {
                v = [];
                for (it = iter(arg), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    v.push(i);
                }
                if (v.length != flds.length) {
                    throw new TypeError(nm + "() takes a " + flds.length + "-sequence (" + v.length + "-sequence given)");
                }
            }

            tuple.call(this, v);

            this.__class__ = structseq_types[nm];
        }

        __doc__ = doc;

        tp$name = nm;
        ob$type = makeIntoTypeObj(nm, structseq_types[nm]);

        //var mro = Sk.builtin.type.buildMRO(cons.prototype.ob$type);
        //cons.prototype.ob$type["$d"].mp$ass_subscript(Sk.builtin.type.mroStr_, mro);
        //cons.prototype.ob$type.tp$mro = mro;

        __getitem__ = new func(function (self, index) {
            return tuple.prototype.mp$subscript.call(self, index);
        });

        __reduce__ = new func(function (self) {
            throw new Exception("__reduce__ is not implemented");
        });

        $r() {
            var ret;
            var i;
            var bits;
            if (this.v.length === 0) {
                return new str(nm + "()");
            }
            bits = [];
            for (i = 0; i < this.v.length; ++i) {
                bits[i] = flds[i] + "=" + objectRepr(this.v[i]).v;
            }
            ret = bits.join(", ");
            if (this.v.length === 1) {
                ret += ",";
            }
            return new str(nm + "(" + ret + ")");
        }

        tp$setattr(name, value) {
            throw new AttributeError("readonly property");
        }

        tp$getattr(name) {
            var i = flds.indexOf(name);
            if (i >= 0) {
                return this.v[i];
            } else {
                return object.prototype.GenericGetAttr(name);
            }
        }
    }

    structseq.prototype.ob$type["$d"] = new dict([]);
    structseq.prototype.ob$type["$d"].mp$ass_subscript(type.basesStr_, new tuple([tuple]));

    structseq_types[nm] = structseq;

    return cons;
}
