import { iter, typeName, setUpInheritance, markUnhashable } from './abstract';
import { pyCheckArgs, func, checkNumber } from './function';
import { object } from './object';
import { seqtype } from './seqtype';
import { bool } from './bool';
import { none } from './object';
import { TypeError, IndexError, ValueError, OperationError } from './errors';

export class list extends object {
    /**
     * @constructor
     * @param {Array.<Object>=} L
     * @param {boolean=} canSuspend (defaults to true in this case, as list() is used directly from Python)
     * @extends Sk.builtin.object
     */
    constructor(L, canSuspend) {
        var v, it, thisList;

        canSuspend = canSuspend || false;

        this.__class__ = list;

        if (L === undefined) {
            v = [];
        } else if (Object.prototype.toString.apply(L) === "[object Array]") {
            v = L;
        } else if (Sk.builtin.checkIterable(L)) {
            v = [];
            it = iter(L);

            thisList = this;

            return (function next(i) {
                while(true) {
                    if (i instanceof Sk.misceval.Suspension) {
                        return new Sk.misceval.Suspension(next, i);
                    } else if (i === undefined) {
                        // done!
                        thisList.v = v;
                        return thisList;
                    } else {
                        v.push(i);
                        i = it.tp$iternext(canSuspend);
                    }
                }
            })(it.tp$iternext(canSuspend));
        } else {
            throw new TypeError("'" + typeName(L)+ "' " +"object is not iterable");
        }

        this["v"] = this.v = v;
    }

    list_concat_(other) {
        // other not a list
        var i;
        var ret;
        if (!other.__class__ || other.__class__ != Sk.builtin.list) {
            throw new TypeError("can only concatenate list to list");
        }

        ret = this.v.slice();
        for (i = 0; i < other.v.length; ++i) {
            ret.push(other.v[i]);
        }
        return new Sk.builtin.list(ret, false);
    }

    list_extend_(other) {
        var it, i;
        var newb;
        if (!Sk.builtin.checkIterable(other)) {
            throw new TypeError("'" + typeName(other) +
                "' object is not iterable");
        }

        if (this == other) {
            // Handle extending list with itself
            newb = [];
            for (it = iter(other), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                newb.push(i);
            }

            // Concatenate
            this.v.push.apply(this.v, newb);
        } else {
            for (it = iter(other), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                this.v.push(i);
            }
        }

        return this;
    }

    list_del_item_(i) {
        i = Sk.builtin.asnum$(i);
        if (i < 0 || i >= this.v.length) {
            throw new IndexError("list assignment index out of range");
        }
        this.list_del_slice_(i, i + 1);
    }

    list_del_slice_(ilow, ihigh) {
        var args;
        ilow = Sk.builtin.asnum$(ilow);
        ihigh = Sk.builtin.asnum$(ihigh);
        args = [];
        args.unshift(ihigh - ilow);
        args.unshift(ilow);
        this.v.splice.apply(this.v, args);
    }

    list_ass_item_(i, v) {
        i = Sk.builtin.asnum$(i);
        if (i < 0 || i >= this.v.length) {
            throw new IndexError("list assignment index out of range");
        }
        this.v[i] = v;
    }

    list_ass_slice_(ilow, ihigh, v) {
        var args;
        ilow = Sk.builtin.asnum$(ilow);
        ihigh = Sk.builtin.asnum$(ihigh);

        if (Sk.builtin.checkIterable(v)) {
            args = new Sk.builtin.list(v, false).v.slice(0);
        } else {
            throw new TypeError("can only assign an iterable");
        }
        args.unshift(ihigh - ilow);
        args.unshift(ilow);
        this.v.splice.apply(this.v, args);
    }

    $r() {
        var it, i;
        var ret = [];
        for (it = iter(this), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            if(i === this) {
                ret.push("[...]");
            } else {
                ret.push(Sk.misceval.objectRepr(i).v);
            }
        }
        return new Sk.builtin.str("[" + ret.join(", ") + "]");
    }

    tp$richcompare(w, op) {
        // todo; can't figure out where cpy handles this silly case (test/run/t96.py)
        // perhaps by trapping a stack overflow? otherwise i'm not sure for more
        // complicated cases. bleh
        //
        // if the comparison allows for equality then short-circuit it here
        var k;
        var i;
        var wl;
        var vl;
        var v;
        if (this === w && Sk.misceval.opAllowsEquality(op)) {
            return true;
        }

        // w not a list
        if (!w.__class__ || w.__class__ != Sk.builtin.list) {
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
        return Sk.misceval.richCompareBool(v[i], w[i], op);
    }

    __iter__ = new func(function (self) {
        pyCheckArgs("__iter__", arguments, 0, 0, true, false);
        return new list_iter_(self);
    });

    tp$iter() {
        return new Sk.builtin.list_iter_(this);
    }

    sq$length() {
        return this.v.length;
    }

    sq$concat = list.prototype.list_concat_;
    nb$add = list.prototype.list_concat_;
    nb$inplace_add = list.prototype.list_extend_;

    sq$repeat(n) {
        var j;
        var i;
        var ret;
        if (!Sk.misceval.isIndex(n)) {
            throw new TypeError("can't multiply sequence by non-int of type '" + typeName(n) + "'");
        }

        n = Sk.misceval.asIndex(n);
        ret = [];
        for (i = 0; i < n; ++i) {
            for (j = 0; j < this.v.length; ++j) {
                ret.push(this.v[j]);
            }
        }
        return new Sk.builtin.list(ret, false);
    }

    nb$multiply = list.prototype.sq$repeat;

    nb$inplace_multiply(n) {
        var j;
        var i;
        var len;
        if (!Sk.misceval.isIndex(n)) {
            throw new TypeError("can't multiply sequence by non-int of type '" + typeName(n) + "'");
        }

        // works on list itself --> inplace
        n = Sk.misceval.asIndex(n);
        len = this.v.length;
        for (i = 1; i < n; ++i) {
            for (j = 0; j < len; ++j) {
                this.v.push(this.v[j]);
            }
        }

        return this;
    }

    sq$ass_item = list.prototype.list_ass_item_;
    sq$del_item = list.prototype.list_del_item_;
    sq$ass_slice = list.prototype.list_ass_slice_;
    sq$del_slice = list.prototype.list_del_slice_;

    sq$contains(item) {
        var it, i;

        for (it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            if (Sk.misceval.richCompareBool(i, item, "Eq")) {
                return true;
            }
        }
        return false;
    }

    __contains__ = new func(function(self, item) {
        pyCheckArgs("__contains__", arguments, 2, 2);
        return new bool(self.sq$contains(item));
    });

    list_subscript_(index) {
        var ret;
        var i;
        if (Sk.misceval.isIndex(index)) {
            i = Sk.misceval.asIndex(index);
            if (i !== undefined) {
                if (i < 0) {
                    i = this.v.length + i;
                }
                if (i < 0 || i >= this.v.length) {
                    throw new IndexError("list index out of range");
                }
                return this.v[i];
            }
        } else if (index instanceof Sk.builtin.slice) {
            ret = [];
            index.sssiter$(this, function (i, wrt) {
                ret.push(wrt.v[i]);
            });
            return new Sk.builtin.list(ret, false);
        }

        throw new TypeError("list indices must be integers, not " + typeName(index));
    }

    list_ass_subscript_(index, value) {
        var i;
        var j;
        var tosub;
        var indices;
        if (Sk.misceval.isIndex(index)) {
            i = Sk.misceval.asIndex(index);
            if (i !== undefined) {
                if (i < 0) {
                    i = this.v.length + i;
                }
                this.list_ass_item_(i, value);
                return;
            }
        } else if (index instanceof Sk.builtin.slice) {
            indices = index.slice_indices_(this.v.length);
            if (indices[2] === 1) {
                this.list_ass_slice_(indices[0], indices[1], value);
            } else {
                tosub = [];
                index.sssiter$(this, function (i, wrt) {
                    tosub.push(i);
                });
                j = 0;
                if (tosub.length !== value.v.length) {
                    throw new ValueError("attempt to assign sequence of size " + value.v.length + " to extended slice of size " + tosub.length);
                }
                for (i = 0; i < tosub.length; ++i) {
                    this.v.splice(tosub[i], 1, value.v[j]);
                    j += 1;
                }
            }
            return;
        }

        throw new TypeError("list indices must be integers, not " + typeof index);
    }

    list_del_subscript_(index) {
        var offdir;
        var dec;
        var self;
        var indices;
        var i;
        if (Sk.misceval.isIndex(index)) {
            i = Sk.misceval.asIndex(index);
            if (i !== undefined) {
                if (i < 0) {
                    i = this.v.length + i;
                }
                this.list_del_item_(i);
                return;
            }
        } else if (index instanceof Sk.builtin.slice) {
            indices = index.slice_indices_(this.v.length);
            if (indices[2] === 1) {
                this.list_del_slice_(indices[0], indices[1]);
            } else {
                self = this;
                dec = 0; // offset of removal for next index (because we'll have removed, but the iterator is giving orig indices)
                offdir = indices[2] > 0 ? 1 : 0;
                index.sssiter$(this, function (i, wrt) {
                    self.v.splice(i - dec, 1);
                    dec += offdir;
                });
            }
            return;
        }

        throw new $1("list indices must be integers, not " + typeof index);
    }

    mp$subscript = list.prototype.list_subscript_;
    mp$ass_subscript = list.prototype.list_ass_subscript_;
    mp$del_subscript = list.prototype.list_del_subscript_;


    __getitem__ = new func(function (self, index) {
        return list.prototype.list_subscript_.call(self, index);
    });

    __setitem__ = new func(function (self, index, val) {
        return list.prototype.list_ass_subscript_.call(self, index, val);
    });

    __delitem__ = new func(function (self, index) {
        return list.prototype.list_del_subscript_.call(self, index);
    });

    /**
     * @param {?=} self
     * @param {?=} cmp optional
     * @param {?=} key optional
     * @param {?=} reverse optional
     */
    list_sort_(self, cmp, key, reverse) {
        var mucked;
        var j;
        var keyvalue;
        var item;
        var i;
        var zero;
        var timsort;
        var has_key = key !== undefined && key !== null;
        var has_cmp = cmp !== undefined && cmp !== null;
        var rev;

        if (reverse === undefined) {
            rev = false;
        } else if (reverse === Sk.builtin.none.none$) {
            throw new TypeError("an integer is required");
        } else {
            rev = Sk.misceval.isTrue(reverse);
        }

        timsort = new Sk.builtin.timSort(self);

        self.v = [];
        zero = new int_(0);

        if (has_key) {
            if (has_cmp) {
                timsort.lt = function (a, b) {
                    var res = Sk.misceval.callsim(cmp, a[0], b[0]);
                    return Sk.misceval.richCompareBool(res, zero, "Lt");
                };
            } else {
                timsort.lt = function (a, b) {
                    return Sk.misceval.richCompareBool(a[0], b[0], "Lt");
                };
            }
            for (i = 0; i < timsort.listlength; i++) {
                item = timsort.list.v[i];
                keyvalue = Sk.misceval.callsim(key, item);
                timsort.list.v[i] = [keyvalue, item];
            }
        } else if (has_cmp) {
            timsort.lt = function (a, b) {
                var res = Sk.misceval.callsim(cmp, a, b);
                return Sk.misceval.richCompareBool(res, zero, "Lt");
            };
        }

        if (rev) {
            timsort.list.list_reverse_(timsort.list);
        }

        timsort.sort();

        if (rev) {
            timsort.list.list_reverse_(timsort.list);
        }

        if (has_key) {
            for (j = 0; j < timsort.listlength; j++) {
                item = timsort.list.v[j][1];
                timsort.list.v[j] = item;
            }
        }

        mucked = self.sq$length() > 0;

        self.v = timsort.list.v;

        if (mucked) {
            throw new OperationError("list modified during sort");
        }

        return Sk.builtin.none.none$;
    }

    /**
     * @param {list=} self optional
     **/
    list_reverse_(self) {
        var i;
        var newarr;
        var old;
        var len;
        pyCheckArgs("reverse", arguments, 1, 1);

        len = self.v.length;
        old = self.v;
        newarr = [];
        for (i = len - 1; i > -1; --i) {
            newarr.push(old[i]);
        }
        self["v"] = newarr;
        return Sk.builtin.none.none$;
    }

    append = new func(function (self, item) {
        pyCheckArgs("append", arguments, 2, 2);

        self.v.push(item);
        return Sk.builtin.none.none$;
    });

    insert = new func(function (self, i, x) {
        pyCheckArgs("insert", arguments, 3, 3);
        if (!checkNumber(i)) {
            throw new TypeError("an integer is required");
        }

        i = Sk.builtin.asnum$(i);
        if (i < 0) {
            i = i + self.v.length;
        }
        if (i < 0) {
            i = 0;
        } else if (i > self.v.length) {
            i = self.v.length;
        }
        self.v.splice(i, 0, x);
        return none.none$;
    });

    extend = new func(function (self, b) {
        pyCheckArgs("extend", arguments, 2, 2);
        self.list_extend_(b);
        return Sk.builtin.none.none$;
    });


    pop = new func(function (self, i) {
        var ret;
        pyCheckArgs("pop", arguments, 1, 2);
        if (i === undefined) {
            i = self.v.length - 1;
        }

        if (!checkNumber(i)) {
            throw new TypeError("an integer is required");
        }

        i = Sk.builtin.asnum$(i);
        if (i < 0) {
            i = i + self.v.length;
        }
        if ((i < 0) || (i >= self.v.length)) {
            throw new IndexError("pop index out of range");
        }
        ret = self.v[i];
        self.v.splice(i, 1);
        return ret;
    });

    remove = new func(function (self, item) {
        var idx;
        pyCheckArgs("remove", arguments, 2, 2);

        idx = list.prototype.index.func_code(self, item);
        self.v.splice(Sk.builtin.asnum$(idx), 1);
        return none.none$;
    });

    index = new func(function (self, item, start, stop) {
        var i;
        var obj;
        var len;
        pyCheckArgs("index", arguments, 2, 4);
        if (start !== undefined && !Sk.builtin.checkInt(start)) {
            throw new TypeError("slice indices must be integers");
        }
        if (stop !== undefined && !Sk.builtin.checkInt(stop)) {
            throw new TypeError("slice indices must be integers");
        }

        len = self.v.length;
        obj = self.v;

        start = (start === undefined) ? 0 : start.v;
        if (start < 0) {
            start = ((start + len) >= 0) ? start + len : 0;
        }

        stop = (stop === undefined) ? len : stop.v;
        if (stop < 0) {
            stop = ((stop + len) >= 0) ? stop + len : 0;
        }

        for (i = start; i < stop; ++i) {
            if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
                return new int_(i);
            }
        }
        throw new ValueError("list.index(x): x not in list");
    });

    count = new func(function (self, item) {
        var i;
        var count;
        var obj;
        var len;
        pyCheckArgs("count", arguments, 2, 2);

        len = self.v.length;
        obj = self.v;
        count = 0;
        for (i = 0; i < len; ++i) {
            if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
                count += 1;
            }
        }
        return new int_(count);
    });

    reverse = new func(list.prototype.list_reverse_);
    sort = new func(list.prototype.list_sort_);
}

setUpInheritance("list", list, seqtype);
markUnhashable(list);

// Make sure that key/value variations of lst.sort() work
// See issue 45 on github as to possible alternate approaches to this and
// why this was chosen - csev
list.prototype["sort"].func_code["co_varnames"] = ["__self__", "cmp", "key", "reverse"];
Sk.builtin.list.prototype.list_sort_.co_varnames = ["__self__", "cmp", "key", "reverse"];
Sk.builtin.list.prototype.list_sort_.$defaults = [Sk.builtin.none.none$, Sk.builtin.none.none$, false];


export class list_iter extends object {
    /**
     * @constructor
     * @param {Object} lst
     */
    constructor(lst) {
        this.$index = 0;
        this.lst = lst.v.slice();
        this.sq$length = this.lst.length;
        this.tp$iter = this;
        this.tp$iternext = function () {
            if (this.$index >= this.sq$length) {
                return undefined;
            }
            return this.lst[this.$index++];
        };
        this.$r = function () {
            return new str("listiterator");
        };
    }

    __class__ = list_iter_;

    __iter__ = new func(function (self) {
        return self;
    });

    next$(self) {
        var ret = self.tp$iternext();
        if (ret === undefined) {
            throw new Sk.builtin.StopIteration();
        }
        return ret;
    };
}

setUpInheritance("listiterator", list_iter_, object);
