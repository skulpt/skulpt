import { sequenceContains, markUnhashable, iter } from '../abstract';
import { func } from '../function';
import { pyCheckArgs, checkIterable } from '../function/checks';
import { TypeError, KeyError, StopIteration } from '../errors';
import { object, none } from './object';
import { dict } from './dict';
import { str } from './str';
import { list } from './list';
import { true$, false$ } from '../constants';
import { objectRepr } from '../misceval';
import { setUpInheritance, typeName } from '../type';

export class set {
    /**
     * @constructor
     * @param {Array.<Object>} S
     */
    constructor(S) {
        var it, i;
        var S_list;

        if (typeof(S) === "undefined") {
            S = [];
        }

        this.set_reset_();
        S_list = new list(S);
        // python sorts sets on init, but not thereafter.
        // Skulpt seems to init a new set each time you add/remove something
        //Sk.builtin.list.prototype['sort'].func_code(S);
        for (it = iter(S_list), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            this.add.func_code(this, i);
        }

        this.__class__ = set;

        this["v"] = this.v;
        return this;
    }

    set_reset_() {
        this.v = new dict([]);
    };

    $r() {
        var it, i;
        var ret = [];
        for (it = iter(this), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            ret.push(objectRepr(i).v);
        }
        if(Sk.__future__.set_repr) {
            return new str("{" + ret.join(", ") + "}");
        } else {
            return new str("set([" + ret.join(", ") + "])");
        }
    };

    ob$eq(other) {

        if (this === other) {
            return true$;
        }

        if (!(other instanceof set)) {
            return false$;
        }

        if (this.sq$length() !== other.sq$length()) {
            return false$;
        }

        return this.issubset.func_code(this, other);
    };

    ob$ne(other) {

        if (this === other) {
            return false$;
        }

        if (!(other instanceof set)) {
            return true$;
        }

        if (this.sq$length() !==
            other.sq$length()) {
            return true$;
        }

        if (this["issubset"].func_code(this, other).v) {
            return false$;
        } else {
            return true$;
        }
    };

    ob$lt(other) {

        if (this === other) {
            return false$;
        }

        if (this.sq$length() >=
            other.sq$length()) {
            return false$;
        }

        return this["issubset"].func_code(this, other);
    };

    ob$le(other) {

        if (this === other) {
            return true$;
        }

        if (this.sq$length() >
            other.sq$length()) {
            return false$;
        }

        return this["issubset"].func_code(this, other);
    };

    ob$gt(other) {

        if (this === other) {
            return false$;
        }

        if (this.sq$length() <=
            other.sq$length()) {
            return false$;
        }

        return this["issuperset"].func_code(this, other);
    };

    ob$ge(other) {

        if (this === other) {
            return true$;
        }

        if (this.sq$length() <
            other.sq$length()) {
            return false$;
        }

        return this["issuperset"].func_code(this, other);
    };

    nb$and(other){
        return this["intersection"].func_code(this, other);
    };

    nb$or(other){
        return this["union"].func_code(this, other);
    };

    nb$xor(other){
        return this["symmetric_difference"].func_code(this, other);
    };

    nb$subtract(other){
        return this["difference"].func_code(this, other);
    };

    __iter__ = new func(function (self) {
        pyCheckArgs("__iter__", arguments, 0, 0, false, true);
        return new set_iter_(self);
    });

    tp$iter() {
        return new set_iter_(this);
    };

    sq$length() {
        return this["v"].mp$length();
    };

    sq$contains(ob) {
        return this["v"].sq$contains(ob);
    };

    isdisjoint = new func(function (self, other) {
        // requires all items in self to not be in other
        var isIn;
        var it, item;

        pyCheckArgs("isdisjoint", arguments, 2, 2);
        if (!checkIterable(other)) {
            throw new TypeError("'" + typeName(other) + "' object is not iterable");
        }

        for (it = iter(self), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
            isIn = sequenceContains(other, item);
            if (isIn) {
                return false$;
            }
        }
        return true$;
    });

    issubset = new func(function (self, other) {
        var isIn;
        var it, item;
        var selfLength, otherLength;

        pyCheckArgs("issubset", arguments, 2, 2);
        if (!checkIterable(other)) {
            throw new TypeError("'" + typeName(other) + "' object is not iterable");
        }

        selfLength = self.sq$length();
        otherLength = other.sq$length();

        if (selfLength > otherLength) {
            // every item in this set can't be in other if it's shorter!
            return false$;
        }
        for (it = iter(self), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
            isIn = sequenceContains(other, item);
            if (!isIn) {
                return false$;
            }
        }
        return true$;
    });

    issuperset = new func(function (self, other) {
        pyCheckArgs("issuperset", arguments, 2, 2);
        return set.prototype["issubset"].func_code(other, self);
    });

    union = new func(function (self) {
        var S, i, new_args;

        pyCheckArgs("union", arguments, 1);

        S = set.prototype["copy"].func_code(self);
        new_args = [S];
        for (i = 1; i < arguments.length; i++) {
            new_args.push(arguments[i]);
        }

        update.func_code.apply(null, new_args);
        return S;
    });

    intersection = new func(function (self) {
        var S, i, new_args;

        pyCheckArgs("intersection", arguments, 1);

        S = set.prototype["copy"].func_code(self);
        new_args = [S];
        for (i = 1; i < arguments.length; i++) {
            new_args.push(arguments[i]);
        }

        intersection_update.func_code.apply(null, new_args);
        return S;
    });

    difference = new func(function (self, other) {
        var S, i, new_args;

        pyCheckArgs("difference", arguments, 2);

        S = set.prototype["copy"].func_code(self);
        new_args = [S];
        for (i = 1; i < arguments.length; i++) {
            new_args.push(arguments[i]);
        }

        difference_update.func_code.apply(null, new_args);
        return S;
    });

    symmetric_difference = new func(function (self, other) {
        var it, item, S;

        pyCheckArgs("symmetric_difference", arguments, 2, 2);

        S = set.prototype["union"].func_code(self, other);
        for (it = iter(S), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
            if (sequenceContains(self, item) && sequenceContains(other, item)) {
                discard.func_code(S, item);
            }
        }
        return S;
    });

    copy = new func(function (self) {
        pyCheckArgs("copy", arguments, 1, 1);
        return new set(self);
    });

    update = new func(function (self, other) {
        var i, it, item, arg;

        pyCheckArgs("update", arguments, 2);

        for (i = 1; i < arguments.length; i++) {
            arg = arguments[i];
            if (!checkIterable(arg)) {
                throw new TypeError("'" + typeName(arg) + "' object is not iterable");
            }
            for (it = iter(arg), item = it.tp$iternext();
                item !== undefined;
                item = it.tp$iternext()) {
                add.func_code(self, item);
            }
        }

        return none.none$;
    });

    intersection_update = new func(function (self, other) {
        var i, it, item;

        pyCheckArgs("intersection_update", arguments, 2);
        for (i = 1; i < arguments.length; i++) {
            if (!checkIterable(arguments[i])) {
                throw new TypeError("'" + typeName(arguments[i]) +
                                            "' object is not iterable");
            }
        }

        for (it = iter(self), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
            for (i = 1; i < arguments.length; i++) {
                if (!sequenceContains(arguments[i], item)) {
                    discard.func_code(self, item);
                    break;
                }
            }
        }
        return none.none$;
    });

    difference_update = new func(function (self, other) {
        var i, it, item;

        pyCheckArgs("difference_update", arguments, 2);
        for (i = 1; i < arguments.length; i++) {
            if (!checkIterable(arguments[i])) {
                throw new TypeError("'" + typeName(arguments[i]) +
                                            "' object is not iterable");
            }
        }

        for (it = iter(self), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
            for (i = 1; i < arguments.length; i++) {
                if (sequenceContains(arguments[i], item)) {
                    discard.func_code(self, item);
                    break;
                }
            }
        }
        return none.none$;
    });

    symmetric_difference_update = new func(function (self, other) {
        pyCheckArgs("symmetric_difference_update", arguments, 2, 2);

        var sd = set.prototype["symmetric_difference"].func_code(self, other);
        self.set_reset_();
        update.func_code(self, sd);
        return none.none$;
    });


    add = new func(function (self, item) {
        pyCheckArgs("add", arguments, 2, 2);

        self.v.mp$ass_subscript(item, true);
        return none.none$;
    });

    discard = new func(function (self, item) {
        pyCheckArgs("discard", arguments, 2, 2);

        dict.prototype["pop"].func_code(self.v, item,
            none.none$);
        return none.none$;
    });

    pop = new func(function (self) {
        var it, item;

        pyCheckArgs("pop", arguments, 1, 1);

        if (self.sq$length() === 0) {
            throw new KeyError("pop from an empty set");
        }

        it = iter(self);
        item = it.tp$iternext();
        discard.func_code(self, item);
        return item;
    });

    remove = new func(function (self, item) {
        pyCheckArgs("remove", arguments, 2, 2);

        self.v.mp$del_subscript(item);
        return none.none$;
    });
}

setUpInheritance("set", set, object);
markUnhashable(set);

export class set_iter_ {

    /**
     * @constructor
     * @param {Object} obj
     */
    constructor(obj) {
        var allkeys, k, i, bucket, buckets;

        this.$obj = obj;
        this.tp$iter = this;
        allkeys = [];
        buckets = obj.v.buckets;
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
        this.$index = 0;
        this.$keys = allkeys;
        this.tp$iternext = function () {
            if (this.$index >= this.$keys.length) {
                return undefined;
            }
            return this.$keys[this.$index++];
        };
        this.$r = function () {
            return new str("setiterator");
        };
        return this;
    }

    __class__ = set_iter_;

    __iter__ = new func(function (self) {
        pyCheckArgs("__iter__", arguments, 0, 0, true, false);
        return self;
    });

    next$(self) {
        var ret = self.tp$iternext();
        if (ret === undefined) {
            throw new StopIteration();
        }
        return ret;
    }
}

setUpInheritance("setiterator", set_iter_, object);
