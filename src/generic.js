Sk.Generic = {};

/**
 * Get an attribute
 * @param {Object} pyName Python string name of the attribute
 * @param {boolean=} canSuspend Can we return a suspension?
 * @return {undefined}
 */
Sk.Generic.GetAttr = function __getattr__ (pyName, canSuspend) {
    let f, res;

    Sk.asserts.assert(this.ob$type !== undefined, "object has no ob$type!");

    const descr = this.ob$type.$typeLookup(pyName);

    // look in the type for a descriptor
    if (descr !== undefined && descr !== null) {
        f = descr.tp$descr_get;
        if (f && Sk.checkDataDescr(descr)){
            return f.call(descr, this, this.ob$type, canSuspend);
        }
    }

    const dict = this.$d;

    if (dict) {
        if (dict.mp$lookup) {
            res = dict.mp$lookup(pyName);
        } else if (dict.mp$subscript) {
            try {
                res = dict.mp$subscript(pyName);
            } catch {}
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
Sk.exportSymbol("Sk.Generic.GetAttr", Sk.Generic.GetAttr);


/**
 * @param {Object} pyName
 * @param {Object} value
 * @param {boolean=} canSuspend
 * @return {undefined}
 */
Sk.Generic.SetAttr = function __setattr__ (pyName, value, canSuspend) {
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
                if (e instanceof Sk.AttributeError) {
                    throw new Sk.AttributeError("'" + Sk.abstr.typeName(this) + "' object has no attribute '" + Sk.unfixReserved(pyName.$jsstr()) + "'");
                } else {
                    throw e;
                }
            }
        } else if (typeof dict === "object") {
            dict[pyName.$jsstr()] = value;
        }
    } else {
        throw new Sk.AttributeError("'" + Sk.abstr.typeName(this) + "' object has no attribute '" + Sk.unfixReserved(pyName.$jsstr()) + "'");
    }
};
Sk.exportSymbol("Sk.Generic.SetAttr", Sk.Generic.SetAttr);




Sk.Generic.PythonGetAttr = function (self, pyName) {
    if (!Sk.builtin.checkString(pyName)) {
        throw new Sk.builtin.TypeError("attribute name must be string, not '" + Sk.abstr.typeName(pyName) + "'");
    }
    var r = Sk.Generic.GetAttr.call(self, pyName, true);
    if (r === undefined) {
        throw new Sk.builtin.AttributeError(pyName);
    }
    return r;
};


Sk.Generic.PythonSetAttr = function (self, pyName, value) {
    if (!Sk.builtin.checkString(pyName)) {
        throw new Sk.builtin.TypeError("attribute name must be string, not '" + Sk.abstr.typeName(pyName) + "'");
    }
    return Sk.Generic.SetAttr.call(self, pyName, value, true);
};




Sk.Generic.New = function (builtin) {
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

Sk.Generic.SlotCallNoArgs = function (self) {
    return this.call(self);
};

/**
 * @constructor
 * @param {String} type_name
 * @param {Function} iterator_constructor
 * @param {Object || undefined} methods
 * @param {Boolean || undefined} acceptable_as_base
 */

Sk.Generic.Iterator = function (type_name, iterator, flags) {
    iterator.slots = iterator.slots || {};
    iterator.slots.tp$iter = Sk.Generic.SelfIter;
    iterator.slots.tp$iternext = iterator.slots.tp$iternext || iterator.iternext;
    iterator = new Sk.type(type_name, iterator);
    return iterator;
};

/**
 * @function
 * @returns {self}
 */
Sk.Generic.SelfIter = function __iter__() {
    return this;
}

/**
 * @function
 * 
 * @description
 * the $seq of the iterator must be an array
 * @param {Boolean} checkSizeDuringIteration
 * @returns {Function}
 */
Sk.Generic.IterNextWithArray = function (checkSizeDuringIteration) {
    if (checkSizeDuringIteration) {
        return function __next__() {
            if (this.$index >= this.$seq.length) {
                return undefined;
            } else if (this.$seq.length !== this.$orig.sq$length()) {
                const error_name = name.split("_")[0];
                throw new Sk.RuntimeError(error_name + " changed size during iteration");
            }
            return this.$seq[this.$index++];
        };
    } else {
        return function __next__() {
            if (this.$index >= this.$seq.length) {
                return undefined;
            }
            return this.$seq[this.$index++];
        };
    }
};

/**
 * @description
 * compares the $seq.length to the $index
 */
Sk.Generic.IterLengthHintWithArray = {
    $raw: function __length_hint__() {
        return this.$seq.length - this.$index;
    },
    $flags: { NoArgs: true }
};


Sk.Generic.GetSetDict = {
    $get: function () {
        return this.$d;
    },
    $set: function (value) {
        if (!(value instanceof Sk.builtin.dict)) {
            throw new Sk.builtin.TypeError("__dict__ must be set to a dictionary, not a '"+Sk.abstr.typeName(value)+"'")
        }
        this.$d = value;
    }
}