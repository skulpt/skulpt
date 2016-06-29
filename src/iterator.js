/**
  * Builds an iterator that outputs the items from the inputted object
  * @constructor
  * @param {*} obj must support iter protocol (has __iter__ and next methods), if sentinel defined:
  * obj must be callable
  * @param {*=} sentinel optional if defined returns an object that makes a call to obj until
  * sentinel is reached
  * @extends Sk.builtin.object
  *
  * @description
  * Constructor for Python iterator.
  *
  */
Sk.builtin.iterator = function (obj, sentinel) {
    var objit;
    if (obj instanceof Sk.builtin.generator) {
        return obj;
    }
    objit = Sk.abstr.lookupSpecial(obj, "__iter__");
    if (objit) {
        return Sk.misceval.callsim(objit, obj);
    }
    this.sentinel = sentinel;
    this.flag = false;
    this.idx = 0;
    this.obj = obj;
    if (sentinel === undefined) {
        this.getitem = Sk.abstr.lookupSpecial(obj, "__getitem__");
        this.$r = function () {
            return new Sk.builtin.str("<iterator object>");
        };
    } else {
        this.call = Sk.abstr.lookupSpecial(obj, "__call__");
        this.$r = function () {
            return new Sk.builtin.str("<callable-iterator object>");
        };
    }
    return this;
};

Sk.abstr.setUpInheritance("iterator", Sk.builtin.iterator, Sk.builtin.object);

Sk.builtin.iterator.prototype.__class__ = Sk.builtin.iterator;

Sk.builtin.iterator.prototype.__iter__ = new Sk.builtin.func(function (self) {
    return self.tp$iter();
});

Sk.builtin.iterator.prototype.tp$iter =  function () {
    return this;
};

Sk.builtin.iterator.prototype.tp$iternext = function (canSuspend) {
    var r;
    var self = this;

    if (this.flag === true) {
        // Iterator has already completed
        return undefined;
    }

    if (this.getitem) {
        r = Sk.misceval.tryCatch(function() {
            return Sk.misceval.callsimOrSuspend(self.getitem, self.obj, Sk.ffi.remapToPy(self.idx++));
        }, function(e) {
            if (e instanceof Sk.builtin.StopIteration || e instanceof Sk.builtin.IndexError) {
                return undefined;
            } else {
                throw e;
            }
        });
        return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
    }

    var checkSentinel = function (ret) {
        // Iteration is complete if ret value is the sentinel
        if (Sk.misceval.richCompareBool(ret, self.sentinel, "Eq")) {
            self.flag = true;
            return undefined;
        }
        return ret;
    };

    if (this.call) {
        r = Sk.misceval.chain(Sk.misceval.callsimOrSuspend(this.call, this.obj), checkSentinel);
    } else {
        var obj = /** @type {Object} */ (this.obj);
        r = Sk.misceval.chain(Sk.misceval.callsimOrSuspend(obj), checkSentinel);
    }

    return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
};

Sk.builtin.iterator.prototype["next"] = new Sk.builtin.func(function (self) {
    var ret = self.tp$iternext();
    if (!ret) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
});

goog.exportSymbol("Sk.builtin.iterator", Sk.builtin.iterator);
