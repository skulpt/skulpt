import { iter, setUpInheritance, typeName, markUnhashable } from './abstract';
import { hash } from './builtin';
import { func, pyCheckArgs, checkString, checkIterable } from './function';
import { remapToJs } from './ffi';
import { object, none, NotImplementedError, NotImplemented } from './object';
import { TypeError, KeyError, AttributeError, ValueError, StopIteration } from './errors';
import { str } from './str';
import { bool } from './bool';
import { tuple } from './tuple';
import { dict } from './dict';
import { true$, false$ } from './constants';
import { richCompareBool, objectRepr, callsim } from './misceval';

export class dict extends object {
    /**
     * @constructor
     * @param {Array.<Object>} L
     */
    constructor (L) {
        var v;
        var it, k;
        var i;
        if (!(this instanceof dict)) {
            return new dict(L);
        }


        if (L === undefined) {
            L = [];
        }

        this.size = 0;
        this.buckets = {};

        if (Object.prototype.toString.apply(L) === "[object Array]") {
            // Handle dictionary literals
            for (i = 0; i < L.length; i += 2) {
                this.mp$ass_subscript(L[i], L[i + 1]);
            }
        } else if (L instanceof dict) {
            // Handle calls of type "dict(mapping)" from Python code
            for (it = iter(L), k = it.tp$iternext();
                 k !== undefined;
                 k = it.tp$iternext()) {
                v = L.mp$subscript(k);
                if (v === undefined) {
                    //print(k, "had undefined v");
                    v = null;
                }
                this.mp$ass_subscript(k, v);
            }
        } else if (checkIterable(L)) {
            // Handle calls of type "dict(iterable)" from Python code
            for (it = iter(L), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                if (i.mp$subscript) {
                    this.mp$ass_subscript(i.mp$subscript(0), i.mp$subscript(1));
                } else {
                    throw new TypeError("element " + this.size + " is not a sequence");
                }
            }
        } else {
            throw new TypeError("object is not iterable");
        }

        this.__class__ = dict;
        this.tp$call = undefined; // Not callable, even though constructor is
    }

    static tp$call(args, kw) {
        var d, i;
        pyCheckArgs("dict", args, 0, 1);
        d = new dict(args[0]);
        if (kw) {
            for (i = 0; i < kw.length; i += 2) {
                d.mp$ass_subscript(new str(kw[i]), kw[i+1]);
            }
        }
        return d;
    }

    key$lookup(bucket, key) {
        var item;
        var eq;
        var i;

        for (i = 0; i < bucket.items.length; i++) {
            item = bucket.items[i];
            eq = richCompareBool(item.lhs, key, "Eq");
            if (eq) {
                return item;
            }
        }

        return null;
    }

    key$pop(bucket, key) {
        var item;
        var eq;
        var i;

        for (i = 0; i < bucket.items.length; i++) {
            item = bucket.items[i];
            eq = richCompareBool(item.lhs, key, "Eq");
            if (eq) {
                bucket.items.splice(i, 1);
                this.size -= 1;
                return item;
            }
        }
        return undefined;
    }

    // Perform dictionary lookup, either return value or undefined if key not in dictionary
    mp$lookup(key) {
        var k = hash(key);
        var bucket = this.buckets[k.v];
        var item;

        // todo; does this need to go through mp$ma_lookup

        if (bucket !== undefined) {
            item = this.key$lookup(bucket, key);
            if (item) {
                return item.rhs;
            }
        }

        // Not found in dictionary
        return undefined;
    }

    mp$subscript(key) {
        pyCheckArgs("[]", arguments, 1, 2, false, false);
        var s;
        var res = this.mp$lookup(key);

        if (res !== undefined) {
            // Found in dictionary
            return res;
        } else {
            // Not found in dictionary
            s = new str(key);
            throw new KeyError(s.v);
        }
    }

    sq$contains(ob) {
        var res = this.mp$lookup(ob);

        return (res !== undefined);
    }

    mp$ass_subscript(key, w) {
        var k = hash(key);
        var bucket = this.buckets[k.v];
        var item;

        if (bucket === undefined) {
            // New bucket
            bucket = {$hash: k, items: [
                {lhs: key, rhs: w}
            ]};
            this.buckets[k.v] = bucket;
            this.size += 1;
            return;
        }

        item = this.key$lookup(bucket, key);
        if (item) {
            item.rhs = w;
            return;
        }

        // Not found in dictionary
        bucket.items.push({lhs: key, rhs: w});
        this.size += 1;
    }

    mp$del_subscript(key) {
        pyCheckArgs("del", arguments, 1, 1, false, false);
        var k = hash(key);
        var bucket = this.buckets[k.v];
        var item;
        var s;

        // todo; does this need to go through mp$ma_lookup

        if (bucket !== undefined) {
            item = this.key$pop(bucket, key);
            if (item !== undefined) {
                return;
            }
        }

        // Not found in dictionary
        s = new str(key);
        throw new KeyError(s.v);
    }

    mp$del_subscript(key) {
        pyCheckArgs("del", arguments, 1, 1, false, false);
        var k = hash(key);
        var bucket = this.buckets[k.v];
        var item;
        var s;

        // todo; does this need to go through mp$ma_lookup

        if (bucket !== undefined) {
            item = this.key$pop(bucket, key);
            if (item !== undefined) {
                return;
            }
        }

        // Not found in dictionary
        s = new str(key);
        throw new KeyError(s.v);
    }

    $r() {
        var v;
        var iter, k;
        var ret = [];
        for (iter = iter(this), k = iter.tp$iternext();
             k !== undefined;
             k = iter.tp$iternext()) {
            v = this.mp$subscript(k);
            if (v === undefined) {
                //print(k, "had undefined v");
                v = null;
            }

            // we need to check if value is same as object
            // otherwise it would cause an stack overflow
            if(v === this) {
                ret.push(objectRepr(k).v + ": {...}");
            } else {
                ret.push(objectRepr(k).v + ": " + objectRepr(v).v);
            }
        }
        return new str("{" + ret.join(", ") + "}");
    }

    mp$length() {
        return this.size;
    }

    /*
        this function mimics the cpython implementation, which is also the reason for the
        almost similar code, this may be changed in future
    */
    dict_merge(b) {
        var iter;
        var k, v;
        if(b instanceof dict) {
            // fast way
            for (iter = b.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                v = b.mp$subscript(k);
                if (v === undefined) {
                    throw new AttributeError("cannot get item for key: " + k.v);
                }
                this.mp$ass_subscript(k, v);
            }
        } else {
            // generic slower way
            var keys = callsim(b["keys"], b);
            for (iter = iter(keys), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                v = b.tp$getitem(k); // get value
                if (v === undefined) {
                    throw new AttributeError("cannot get item for key: " + k.v);
                }
                this.mp$ass_subscript(k, v);
            }
        }
    }

    ob$ne(other) {
        var isEqual = this.ob$eq(other);

        if (isEqual instanceof NotImplemented) {
            return isEqual;
        } else if (isEqual.v) {
            return false$;
        } else {
            return true$;
        }
    }

    /* python3 recommends implementing simple ops */
    ob$eq(other) {

        var iter, k, v, otherv;

        if (this === other) {
            return true$;
        }

        if (!(other instanceof dict)) {
            return NotImplemented.NotImplemented$;
        }

        if (this.size !== other.size) {
            return false$;
        }

        for (iter = this.tp$iter(), k = iter.tp$iternext();
            k !== undefined;
            k = iter.tp$iternext()) {
            v = this.mp$subscript(k);
            otherv = other.mp$subscript(k);

            if (!richCompareBool(v, otherv, "Eq")) {
                return false$;
            }
        }

        return true$;
    }

    tp$iter() {
        return new dict_iter_(this);
    };

    get = new func(function (self, k, d) {
        pyCheckArgs("get()", arguments, 1, 2, false, true);
        var ret;

        if (d === undefined) {
            d = none.none$;
        }

        ret = self.mp$lookup(k);
        if (ret === undefined) {
            ret = d;
        }

        return ret;
    })

    pop = new func(function (self, key, d) {
        pyCheckArgs("pop()", arguments, 1, 2, false, true);
        var k = hash(key);
        var bucket = self.buckets[k.v];
        var item;
        var s;

        // todo; does this need to go through mp$ma_lookup
        if (bucket !== undefined) {
            item = self.key$pop(bucket, key);
            if (item !== undefined) {
                return item.rhs;
            }
        }

        // Not found in dictionary
        if (d !== undefined) {
            return d;
        }

        s = new str(key);
        throw new KeyError(s.v);
    })

    has_key = new func(function (self, k) {
        pyCheckArgs("has_key()", arguments, 1, 1, false, true);
        return new bool( self.sq$contains(k));
    })

    items = new func(function (self) {
        pyCheckArgs("items()", arguments, 0, 0, false, true);
        var v;
        var iter, k;
        var ret = [];

        for (iter = iter(self), k = iter.tp$iternext();
             k !== undefined;
             k = iter.tp$iternext()) {
            v = self.mp$subscript(k);
            if (v === undefined) {
                //print(k, "had undefined v");
                v = null;
            }
            ret.push(new tuple([k, v]));
        }
        return new list(ret);
    })

    keys = new func(function (self) {
        pyCheckArgs("keys()", arguments, 0, 0, false, true);
        var iter, k;
        var ret = [];

        for (iter = iter(self), k = iter.tp$iternext();
             k !== undefined;
             k = iter.tp$iternext()) {
            ret.push(k);
        }
        return new list(ret);
    })

    values = new func(function (self) {
        pyCheckArgs("values()", arguments, 0, 0, false, true);
        var v;
        var iter, k;
        var ret = [];

        for (iter = iter(self), k = iter.tp$iternext();
             k !== undefined;
             k = iter.tp$iternext()) {
            v = self.mp$subscript(k);
            if (v === undefined) {
                v = null;
            }
            ret.push(v);
        }
        return new list(ret);
    })

    clear = new func(function (self) {
        pyCheckArgs("clear()", arguments, 0, 0, false, true);
        var k;
        var iter;

        for (iter = iter(self), k = iter.tp$iternext();
             k !== undefined;
             k = iter.tp$iternext()) {
            self.mp$del_subscript(k);
        }
    })

    setdefault = new func(function (self, key, default_) {
        try {
            return self.mp$subscript(key);
        }
        catch (e) {
            if (default_ === undefined) {
                default_ = none.none$;
            }
            self.mp$ass_subscript(key, default_);
            return default_;
        }
    })

    update = new func(update_f);

    __contains__ = new func(function (self, item) {
        pyCheckArgs("__contains__", arguments, 2, 2);
        return new bool(self.sq$contains(item));
    })

    __cmp__ = new func(function (self, other, op) {
        // __cmp__ cannot be supported until dict lt/le/gt/ge operations are supported
        return NotImplemented.NotImplemented$;
    })

    __delitem__ = new func(function (self, item) {
        pyCheckArgs("__delitem__", arguments, 1, 1, false, true);
        return dict.prototype.mp$del_subscript.call(self, item);
    })

    __getitem__ = new func(function (self, item) {
        pyCheckArgs("__getitem__", arguments, 1, 1, false, true);
        return dict.prototype.mp$subscript.call(self, item);
    })

    __setitem__ = new func(function (self, item, value) {
        pyCheckArgs("__setitem__", arguments, 2, 2, false, true);
        return dict.prototype.mp$ass_subscript.call(self, item, value);
    })

    __hash__ = new func(function (self) {
        pyCheckArgs("__hash__", arguments, 0, 0, false, true);
        return dict.prototype.tp$hash.call(self);
    })

    __len__ = new func(function (self) {
        pyCheckArgs("__len__", arguments, 0, 0, false, true);
        return dict.prototype.mp$length.call(self);
    })

    __getattribute__ = new func(function (self, attr) {
        pyCheckArgs("__getattribute__", arguments, 1, 1, false, true);
        if (!checkString(attr)) { throw new TypeError("__getattribute__ requires a string"); }
        return dict.prototype.tp$getattr.call(self, remapToJs(attr));
    })

    __iter__ = new func(function (self) {
        pyCheckArgs("__iter__", arguments, 0, 0, false, true);

        return new dict_iter_(self);
    })

    __repr__ = new func(function (self) {
        pyCheckArgs("__repr__", arguments, 0, 0, false, true);
        return dict.prototype["$r"].call(self);
    });

    copy = new func(function (self) {
        Sk.builtin.pyCheckArgs("copy", arguments, 0, 0, false, true);

        var it; // Iterator
        var k; // Key of dict item
        var v; // Value of dict item
        var newCopy = new Sk.builtin.dict([]);

        for (it = Sk.abstr.iter(self), k = it.tp$iternext();
                k !== undefined;
                k = it.tp$iternext()) {
            v = self.mp$subscript(k);
            if (v === undefined) {
                v = null;
            }
            newCopy.mp$ass_subscript(k, v);
        }

        return newCopy;
    })

    static $fromkeys = function fromkeys(self, seq, value) {
        var k, iter, val, res, iterable;

        if (self instanceof Sk.builtin.dict) {
            // instance call
            Sk.builtin.pyCheckArgs("fromkeys", arguments, 1, 2, false, true);

            res = self;
            iterable = seq;
            val = value === undefined ? Sk.builtin.none.none$ : value;
        } else {
            // static call
            Sk.builtin.pyCheckArgs("fromkeys", arguments, 1, 2, false, false);

            res = new Sk.builtin.dict([]);
            iterable = self;
            val = seq === undefined ? Sk.builtin.none.none$ : seq;
        }

        if (!Sk.builtin.checkIterable(iterable)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
        }

        for (iter = Sk.abstr.iter(iterable), k = iter.tp$iternext();
                k !== undefined;
                k = iter.tp$iternext()) {
            res.mp$ass_subscript(k, val);
        }

        return res;
    };

    fromkeys = new func(dict.$fromkeys);

    iteritems = new func(function (self) {
        throw new NotImplementedError("dict.iteritems is not yet implemented in Skulpt");
    })

    iterkeys = new func(function (self) {
        throw new NotImplementedError("dict.iterkeys is not yet implemented in Skulpt");
    })

    itervalues = new func(function (self) {
        throw new NotImplementedError("dict.itervalues is not yet implemented in Skulpt");
    })

    popitem = new func(function (self) {
        throw new NotImplementedError("dict.popitem is not yet implemented in Skulpt");
    })

    viewitems = new func(function (self) {
        throw new NotImplementedError("dict.viewitems is not yet implemented in Skulpt");
    })

    viewkeys = new func(function (self) {
        throw new NotImplementedError("dict.viewkeys is not yet implemented in Skulpt");
    })

    viewvalues = new func(function (self) {
        throw new NotImplementedError("dict.viewvalues is not yet implemented in Skulpt");
    })
}

setUpInheritance("dict", dict, object);
markUnhashable(dict);


/**
 *   update() accepts either another dictionary object or an iterable of key/value pairs (as tuples or other iterables of length two).
 *   If keyword arguments are specified, the dictionary is then updated with those key/value pairs: d.update(red=1, blue=2).
 *   https://hg.python.org/cpython/file/4ff865976bb9/Objects/dictobject.c
 */
var update_f = function (kwargs, self, other) {
    // case another dict or obj with keys and getitem has been provided
    if(other !== undefined && (other.tp$name === "dict" || other["keys"])) {
        self.dict_merge(other); // we merge with override
    } else if(other !== undefined && checkIterable(other)) {
        // 2nd case, we expect an iterable that contains another iterable of length 2
        var iter;
        var k, v;
        var seq_i = 0; // index of current sequence item
        for (iter = iter(other), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext(), seq_i++) {
            // check if value is iter
            if (!checkIterable(k)) {
                throw new TypeError("cannot convert dictionary update sequence element #" + seq_i + " to a sequence");
            }

            // cpython impl. would transform iterable into sequence
            // we just call iternext twice if k has length of 2
            if(k.sq$length() === 2) {
                var k_iter = iter(k);
                var k_key = k_iter.tp$iternext();
                var k_value = k_iter.tp$iternext();
                self.mp$ass_subscript(k_key, k_value);
            } else {
                // throw exception
                throw new ValueError("dictionary update sequence element #" + seq_i + " has length " + k.sq$length() + "; 2 is required");
            }
        }
    } else if(other !== undefined) {
        // other is not a dict or iterable
        throw new TypeError("'" +typeName(other) + "' object is not iterable");
    }

    // apply all key/value pairs of kwargs
    // create here kwargs_dict, there could be exceptions in other cases before
    var kwargs_dict = new dict(kwargs);
    self.dict_merge(kwargs_dict);

    // returns none, when successful or throws exception
    return  none.none$;
};

update_f.co_kwargs = true;

export class dict_iter_ {
    /**
     * @constructor
     * @param {Object} obj
     */
    constructor(obj) {
        var k, i, bucket, allkeys, buckets;
        if (!(this instanceof dict_iter_)) {
            return new dict_iter_(obj);
        }
        this.$index = 0;
        this.$obj = obj;
        allkeys = [];
        buckets = obj.buckets;
        for (k in buckets) {
            if (buckets.hasOwnProperty(k)) {
                bucket = buckets[k];
                if (bucket && bucket.$hash !== undefined && bucket.items !== undefined) {
                    // skip internal stuff. todo; merge pyobj and this
                    for (i = 0; i < bucket.items.length; i++) {
                        allkeys.push(bucket.items[i].lhs);
                    }
                }
            }
        }
        this.$keys = allkeys;
        this.tp$iter = this;
        this.tp$iternext = function () {
            // todo; StopIteration
            if (this.$index >= this.$keys.length) {
                return undefined;
            }
            return this.$keys[this.$index++];
            // return this.$obj[this.$keys[this.$index++]].lhs;
        };
        this.$r = function () {
            return new str("dictionary-keyiterator");
        };
    }

    __class__ = dict_iter_;

    next$(self) {
        var ret = self.tp$iternext();
        if (ret === undefined) {
            throw new StopIteration();
        }
        return ret;
    }

    __iter__ = new func(function (self) {
        return self;
    });
}

setUpInheritance("dictionary-keyiterator", dict_iter_, object);


