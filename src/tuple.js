import { iter, setUpInheritance, typeName } from './abstract';
import { pyCheckArgs, func } from './function';
import { TypeError, IndexError, ValueError, StopIteration } from './errors';
import { str } from './str';
import { int_ } from './int';

export class tuple {
    /**
     * @constructor
     * @param {Array.<Object>|Object} L
     */
    constructor(L) {
        var it, i;

        if (L === undefined) {
            L = [];
        }

        if (Object.prototype.toString.apply(L) === "[object Array]") {
            this.v = L;
        } else {
            if (Sk.builtin.checkIterable(L)) {
                this.v = [];
                for (it = iter(L), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    this.v.push(i);
                }
            } else {
                throw new TypeError("expecting Array or iterable");
            }
        }

        this.__class__ = tuple;

        this["v"] = this.v;
        return this;
    }

    $r() {
        var ret;
        var i;
        var bits;
        if (this.v.length === 0) {
            return new str("()");
        }
        bits = [];
        for (i = 0; i < this.v.length; ++i) {
            bits[i] = Sk.misceval.objectRepr(this.v[i]).v;
        }
        ret = bits.join(", ");
        if (this.v.length === 1) {
            ret += ",";
        }
        return new str("(" + ret + ")");
    }

    mp$subscript(index) {
        var ret;
        var i;
        if (Sk.misceval.isIndex(index)) {
            i = Sk.misceval.asIndex(index);
            if (i !== undefined) {
                if (i < 0) {
                    i = this.v.length + i;
                }
                if (i < 0 || i >= this.v.length) {
                    throw new IndexError("tuple index out of range");
                }
                return this.v[i];
            }
        } else if (index instanceof slice) {
            ret = [];
            index.sssiter$(this, function (i, wrt) {
                ret.push(wrt.v[i]);
            });
            return new tuple(ret);
        }

        throw new TypeError("tuple indices must be integers, not " + typeName(index));
    }

    // todo; the numbers and order are taken from python, but the answer's
    // obviously not the same because there's no int wrapping. shouldn't matter,
    // but would be nice to make the hash() values the same if it's not too
    // expensive to simplify tests.
    tp$hash() {
        var y;
        var i;
        var mult = 1000003;
        var x = 0x345678;
        var len = this.v.length;
        for (i = 0; i < len; ++i) {
            y = hash(this.v[i]).v;
            if (y === -1) {
                return new int_(-1);
            }
            x = (x ^ y) * mult;
            mult += 82520 + len + len;
        }
        x += 97531;
        if (x === -1) {
            x = -2;
        }
        return new int_(x | 0);
    }

    sq$repeat(n) {
        var j;
        var i;
        var ret;

        n = Sk.misceval.asIndex(n);
        ret = [];
        for (i = 0; i < n; ++i) {
            for (j = 0; j < this.v.length; ++j) {
                ret.push(this.v[j]);
            }
        }
        return new tuple(ret);
    }

    tp$iter() {
        return new tuple_iter_(this);
    }

    tp$richcompare(w, op) {
        //print("  tup rc", JSON.stringify(this.v), JSON.stringify(w), op);

        // w not a tuple
        var k;
        var i;
        var wl;
        var vl;
        var v;
        if (!w.__class__ ||
            !Sk.misceval.isTrue(Sk.builtin.isinstance(w, Sk.builtin.tuple))) {
            // shortcuts for eq/not
            if (op === "Eq") {
                return false;
            }
            if (op === "NotEq") {
                return true;
            }

            // todo; other types should have an arbitrary order
            return false;
        }

        v = this.v;
        w = w.v;
        vl = v.length;
        wl = w.length;

        for (i = 0; i < vl && i < wl; ++i) {
            k = Sk.misceval.richCompareBool(v[i], w[i], "Eq");
            if (!k) {
                break;
            }
        }

        if (i >= vl || i >= wl) {
            // no more items to compare, compare sizes
            switch (op) {
                case "Lt":
                    return vl < wl;
                case "LtE":
                    return vl <= wl;
                case "Eq":
                    return vl === wl;
                case "NotEq":
                    return vl !== wl;
                case "Gt":
                    return vl > wl;
                case "GtE":
                    return vl >= wl;
                default:
                    goog.asserts.fail();
            }
        }

        // we have an item that's different

        // shortcuts for eq/not
        if (op === "Eq") {
            return false;
        }
        if (op === "NotEq") {
            return true;
        }

        // or, compare the differing element using the proper operator
        //print("  tup rcb end", i, v[i] instanceof Sk.builtin.str, JSON.stringify(v[i]), w[i] instanceof Sk.builtin.str, JSON.stringify(w[i]), op);
        return Sk.misceval.richCompareBool(v[i], w[i], op);
    }

    sq$concat(other) {
        var msg;
        if (other.__class__ != tuple) {
            msg = "can only concatenate tuple (not \"";
            msg += typeName(other) + "\") to tuple";
            throw new TypeError(msg);
        }

        return new tuple(this.v.concat(other.v));
    }

    sq$contains(ob) {
        var it, i;

        for (it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            if (Sk.misceval.richCompareBool(i, ob, "Eq")) {
                return true;
            }
        }

        return false;
    }

    sq$length() {
        return this.v.length;
    }

    nb$multiply = tuple.prototype.sq$repeat;
    nb$inplace_multiply = tuple.prototype.sq$repeat;


    nb$add = tuple.prototype.sq$concat;
    nb$inplace_add = tuple.prototype.sq$concat;

    __iter__ = new func(function (self) {
        pyCheckArgs("__iter__", arguments, 1, 1);
        return new tuple_iter_(self);
    });

    index = new func(function (self, item) {
        var i;
        var len = self.v.length;
        var obj = self.v;
        for (i = 0; i < len; ++i) {
            if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
                return new int_(i);
            }
        }
        throw new ValueError("tuple.index(x): x not in tuple");
    });

    count = new func(function (self, item) {
        var i;
        var len = self.v.length;
        var obj = self.v;
        var count = 0;
        for (i = 0; i < len; ++i) {
            if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
                count += 1;
            }
        }
        return  new int_(count);
    });
}

setUpInheritance("tuple", tuple, seqtype);

export class tuple_iter_ {
    /**
     * @constructor
     * @param {Object} obj
     */
    constructor(obj) {
        this.$index = 0;
        this.$obj = obj.v.slice();
        this.sq$length = this.$obj.length;
        this.tp$iter = this;
        this.tp$iternext = function () {
            if (this.$index >= this.sq$length) {
                return undefined;
            }
            return this.$obj[this.$index++];
        };
        this.$r = function () {
            return new str("tupleiterator");
        };
        return this;
    }

    __class__ = tuple_iter_;

    next$(self) {
        var ret = self.tp$iternext();
        if (ret === undefined) {
            throw new StopIteration();
        }
        return ret;
    }

    __iter__ = new func(function (self) {
        return self;
    })
}

setUpInheritance("tupleiterator", tuple_iter_, object);
