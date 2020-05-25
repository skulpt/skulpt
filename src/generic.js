Sk.generic = {};

/**
 * Get an attribute
 * @param {Object} pyName Python string name of the attribute
 * @param {boolean=} canSuspend Can we return a suspension?
 * @return {undefined}
 */
Sk.generic.getAttr = function __getattribute__(pyName, canSuspend) {
    let f, res;

    Sk.asserts.assert(this.ob$type !== undefined, "object has no ob$type!");

    const descr = this.ob$type.$typeLookup(pyName);

    // look in the type for a descriptor
    if (descr !== undefined && descr !== null) {
        f = descr.tp$descr_get;
        if (f && Sk.builtin.checkDataDescr(descr)) {
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
            } catch { }
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
Sk.exportSymbol("Sk.generic.getAttr", Sk.generic.getAttr);


/**
 * @param {Object} pyName
 * @param {Object} value
 * @param {boolean=} canSuspend
 * @return {undefined}
 */
Sk.generic.setAttr = function __setattr__(pyName, value, canSuspend) {
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
Sk.exportSymbol("Sk.generic.setAttr", Sk.generic.setAttr);




Sk.generic.pythonGetAttr = function (self, pyName) {
    if (!Sk.builtin.checkString(pyName)) {
        throw new Sk.builtin.TypeError("attribute name must be string, not '" + Sk.abstr.typeName(pyName) + "'");
    }
    var r = Sk.generic.getAttr.call(self, pyName, true);
    if (r === undefined) {
        throw new Sk.builtin.AttributeError(pyName);
    }
    return r;
};


Sk.generic.pythonSetAttr = function (self, pyName, value) {
    if (!Sk.builtin.checkString(pyName)) {
        throw new Sk.builtin.TypeError("attribute name must be string, not '" + Sk.abstr.typeName(pyName) + "'");
    }
    return Sk.generic.setAttr.call(self, pyName, value, true);
};




Sk.generic.new = function (builtin) {
    const genericNew = function __new__(args, kwargs) {
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
    return genericNew;
};

Sk.generic.newMethodDef = {
    $meth: function (args, kwargs) {
        // this = a type object
        let this_name, subs_name;

        if (args.length < 1) {
            this_name = this.prototype.tp$name;
            throw new Sk.builtin.TypeError(this_name + ".__new__(): not enough arguments")
        }
        
        const subtype = args.shift();

        if (subtype.sk$type === undefined) {
            this_name = this.prototype.tp$name;
            throw new Sk.builtin.TypeError(this_name + "__new__(X): X is not a type object ("+ Sk.abst.typeName(subtype)+")")
        }

        if (!subtype.$isSubType(this)) {
            this_name = this.prototype.tp$name;
            subs_name = subtype.prototype.tp$name;
            throw new Sk.builtin.TypeError(this_name+ ".__new__("+subs_name+"): "+subs_name+" is not a subtype of "+this_name)
        }
        /* from CPython: Check that the use doesn't do something silly and unsafe like
       object.__new__(dict).  To do this, we check that the
       most derived base that's not a heap type is this type. */
       let staticbase = subtype;
       const slot_new = Sk.slots.__new__.$slot_func;
       while (staticbase && staticbase.prototype.tp$new === slot_new) {
           staticbase = staticbase.prototype.tp$base;
       }
       if (staticbase && staticbase.prototype.tp$new !== this.prototype.tp$new) {
        this_name = this.prototype.tp$name;
        subs_name = staticbase.prototype.tp$name;
         throw new Sk.builtin.TypeError(this_name + ".__new__("+subs_name+") is not safe, use "+subs_name+".__new__()")
       }
       return  this.prototype.tp$new.call(subtype.prototype, args, kwargs);
    },
    $flags: {FastCall: true},
    $textsig: "($type, *args, **kwargs)",
    $name: "__new__",
};

/**
 * @function
 * @param {String} type_name
 * @param {Function} iterator_constructor
 * @param {Object} methods
 * @param {Boolean} acceptable_as_base
 * 
 * @description
 * effectively a wrapper for easily defining an iterator
 * tp$iter slot is added and returns self
 * 
 * define tp$iternext with using iternext in the object literal
 * mostly as a convenience
 * you can also define tp$iternext in the slots
 * 
 * the main benefit of this helper function is to reduce some repetitive code for defining an iter
 * 
 * if your iterator is really a js array there are two helper functions to choose from
 * Sk.generic.iterNextWithArray || Sk.generic.iterNextWithArrayCheckSize
 * 
 * @returns typeobj
 */

Sk.generic.iterator = function (type_name, iterator) {
    iterator.slots = iterator.slots || {};
    iterator.slots.tp$iter = Sk.generic.selfIter;
    iterator.slots.tp$iternext = iterator.slots.tp$iternext || iterator.iternext;
    return Sk.abstr.buildNativeClass(type_name, iterator);
};

/**
 * @function
 * @returns {self}
 */
Sk.generic.selfIter = function __iter__() {
    return this;
}

/**
 * @function
 * 
 * @description
 * the $seq of the iterator must be an array
 * $orig must be provided and must have a valid sq$length
 */
Sk.generic.iterNextWithArrayCheckSize = function __next__() {
    if (this.$index >= this.$seq.length) {
        return undefined;
    } else if (this.$seq.length !== this.$orig.sq$length()) {
        const error_name = this.tp$name.split("_")[0];
        throw new Sk.RuntimeError(error_name + " changed size during iteration");
    }
    return this.$seq[this.$index++];
};

/**
 * @function
 * 
 * 
 * @description
 * the $seq of the iterator must be an array
 */
Sk.generic.iterNextWithArray = function __next__() {
    if (this.$index >= this.$seq.length) {
        return undefined;
    }
    return this.$seq[this.$index++];
};

/**
 * @description
 * compares the $seq.length to the $index
 */
Sk.generic.iterLengthHintWithArrayMethodDef = {
    $meth: function __length_hint__() {
        return this.$seq.length - this.$index;
    },
    $flags: { NoArgs: true }
};


Sk.generic.getSetDict = {
    $get: function () {
        return this.$d;
    },
    $set: function (value) {
        if (!(value instanceof Sk.builtin.dict)) {
            throw new Sk.builtin.TypeError("__dict__ must be set to a dictionary, not a '" + Sk.abstr.typeName(value) + "'")
        }
        this.$d = value;
    },
    $doc: "dictionary for instance variables (if defined)",
    $name: "__dict__",
}