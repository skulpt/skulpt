import { lookupSpecial, setUpInheritance } from './abstract';
import { remapToPy } from './ffi';
import { StopIteration, IndexError } from './errors';
import { callsim, tryCatch, callsimOrSuspend, retryOptionalSuspensionOrThrow, richCompareBool } from './misceval';
import { object } from './object';

export class iterator extends object {
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
    constructor(obj, sentinel) {
        var objit;
        if (obj instanceof Sk.builtin.generator) {
            return obj;
        }
        objit = lookupSpecial(obj, "__iter__");
        if (objit) {
            return callsim(objit, obj);
        }
        this.sentinel = sentinel;
        this.flag = false;
        this.idx = 0;
        this.obj = obj;
        if (sentinel === undefined) {
            this.getitem = lookupSpecial(obj, "__getitem__");
            this.$r = function () {
                return new Sk.builtin.str("<iterator object>");
            };
        } else {
            this.call = lookupSpecial(obj, "__call__");
            this.$r = function () {
                return new Sk.builtin.str("<callable-iterator object>");
            };
        }
        return this;
    };


    __class__ = Sk.builtin.iterator;

    __iter__ = new Sk.builtin.func(function (self) {
        return self.tp$iter();
    });

    tp$iter() {
        return this;
    };

    tp$iternext(canSuspend) {
        var r;
        var self = this;

        if (this.flag === true) {
            // Iterator has already completed
            return undefined;
        }

        if (this.getitem) {
            r = tryCatch(function() {
                return callsimOrSuspend(self.getitem, self.obj, remapToPy(self.idx++));
            }, function(e) {
                if (e instanceof StopIteration || e instanceof IndexError) {
                    return undefined;
                } else {
                    throw e;
                }
            });
            return canSuspend ? r : retryOptionalSuspensionOrThrow(r);
        }

        var checkSentinel = function (ret) {
            // Iteration is complete if ret value is the sentinel
            if (richCompareBool(ret, self.sentinel, "Eq")) {
                self.flag = true;
                return undefined;
            }
            return ret;
        };

        if (this.call) {
            r = chain(callsimOrSuspend(this.call, this.obj), checkSentinel);
        } else {
            var obj = /** @type {Object} */ (this.obj);
            r = chain(callsimOrSuspend(obj), checkSentinel);
        }

        return canSuspend ? r : retryOptionalSuspensionOrThrow(r);
    }

    next$(self) {
        var ret = self.tp$iternext();
        if (!ret) {
            throw new Sk.builtin.StopIteration();
        }
        return ret;
    }
}

setUpInheritance("iterator", iterator, object);
