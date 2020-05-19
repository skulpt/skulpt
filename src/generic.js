/**
 * Get an attribute
 * @param {Object} pyName Python string name of the attribute
 * @param {boolean=} canSuspend Can we return a suspension?
 * @return {undefined}
 */
Sk.builtin.GenericGetAttr = function __getattr__ (pyName, canSuspend) {
    let f, res;

    Sk.asserts.assert(this.ob$type !== undefined, "object has no ob$type!");

    const descr = this.ob$type.$typeLookup(pyName);

    // look in the type for a descriptor
    if (descr !== undefined && descr !== null) {
        f = descr.tp$descr_get;
        if (f && Sk.builtin.checkDataDescr(descr)){
            return f.call(descr, this, this.ob$type, canSuspend);
        }
    }

    const dict = this.$d;

    if (dict) {
        if (dict.mp$lookup) {
            res = dict.mp$lookup(pyName);
        } else if (dict.mp$subscript) {
            res = Sk.builtin._tryGetSubscript(dict, pyName);
        } else if (typeof dict === "object") {
            res = dict[pyName.$jsstr()];
        }
        if (res !== undefined) {
            return res;
        } 
    }

    if (f) {
        return f.call(descr, this, this.ob$type, canSuspend);
    }

    if (descr !== undefined) {
        return descr;
    }

    return undefined;
};
Sk.exportSymbol("Sk.builtin.GenericGetAttr", Sk.builtin.GenericGetAttr);


/**
 * @param {Object} pyName
 * @param {Object} value
 * @param {boolean=} canSuspend
 * @return {undefined}
 */
Sk.builtin.GenericSetAttr = function __setattr__ (pyName, value, canSuspend) {
    Sk.asserts.assert(this.ob$type !== undefined, "object has no ob$type!");

    const descr = this.ob$type.$typeLookup(pyName);

    // otherwise, look in the type for a descr
    if (descr !== undefined && descr !== null) {
        const f = descr.tp$descr_set;
        // todo; is this the right lookup priority for data descriptors?
        if (f) {
            return f.call(descr, this, value, canSuspend);
        }
    }

    const dict = this.$d;
    if (dict) {
        if (dict.mp$ass_subscript) {
            try {
                dict.mp$ass_subscript(pyName, value);
            } catch (e) {
                if (e instanceof Sk.builtin.AttributeError) {
                    throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(this) + "' object has no attribute '" + Sk.unfixReserved(pyName.$jsstr()) + "'");
                } else {
                    throw e;
                }
            }
        } else if (typeof dict === "object") {
            dict[pyName.$jsstr()] = value;
        }
    } else {
        throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(this) + "' object has no attribute '" + Sk.unfixReserved(pyName.$jsstr()) + "'");
    }
};
Sk.exportSymbol("Sk.builtin.GenericSetAttr", Sk.builtin.GenericSetAttr);


Sk.builtin.GenericNew = function (builtin) {
    const GenericNew = function __new__ (args, kwargs) {
        // this = prototype of an sk$type object.
        if (this === builtin.prototype) {
            return new this.constructor;
        } else {
            const instance = new this.constructor;
            // now we want to apply instance to the builtin
            builtin.call(instance); 
            return instance;
        }
    };
    return GenericNew;
};

Sk.builtin.GenericSelfIter = function __iter__ () {
    return this;
}

Sk.builtin.GenericIterNext = function (checkSizeDuringIteration) {
    if (checkSizeDuringIteration) {
        return function __next__ () {
            if (this.$index >= this.$seq.length) {
                return undefined;
            } else if (this.$seq.length !== this.$orig.sq$length()) {
                const error_name = name.split("_")[0];
                throw new Sk.builtin.RuntimeError(error_name + " changed size during iteration");
            }
            return this.$seq[this.$index++];
        };
    } else {
        return function __next__ () {
            if (this.$index >= this.$seq.length) {
                return undefined;
            }
            return this.$seq[this.$index++];
        };
    }
};

Sk.builtin.GenericIterLengthHint = function __length_hint__(self) {
    Sk.builtin.pyCheckArgs("__length_hint__", arguments, 0, 0, false, true);
    return self.$seq.length - self.$index;
};