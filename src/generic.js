/**
 * Get an attribute
 * @param {Object} pyName Python string name of the attribute
 * @param {boolean=} canSuspend Can we return a suspension?
 * @return {undefined}
 */
Sk.builtin.GenericGetAttr = function __getattr__ (pyName, canSuspend) {
    var res;
    var f;
    var descr;
    var tp;
    var dict;
    var getf;
    var jsName = pyName.$jsstr();

    tp = this.ob$type;
    Sk.asserts.assert(tp !== undefined, "object has no ob$type!");

    dict = this["$d"];
    //print("getattr", tp.tp$name, name);


    descr = tp.$typeLookup(pyName);

    // look in the type for a getset_descriptor
    if (descr !== undefined && descr !== null) {
        f = descr.tp$descr_get;
        // todo - data descriptors (ie those with tp$descr_set too) get a different lookup priority
        if (f && Sk.builtin.checkDataDescr(descr)){
            return f.call(descr, this, this.ob$type, canSuspend);
        }
    }

    // todo; assert? force?
    if (dict) {
        if (dict.mp$lookup) {
            res = dict.mp$lookup(pyName);
        } else if (dict.mp$subscript) {
            res = Sk.builtin._tryGetSubscript(dict, pyName);
        } else if (typeof dict === "object") {
            res = dict[jsName];
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

    // OK, try __getattr__

    descr = tp.$typeLookup(Sk.builtin.str.$getattr);
    if (descr !== undefined && descr !== null) {
        f = descr.tp$descr_get;
        if (f) {
            getf = f.call(descr, this, this.ob$type);
        } else {
            getf = descr;
        }

        res = Sk.misceval.tryCatch(function() {
            return Sk.misceval.callsimOrSuspendArray(getf, [pyName]);
        }, function(e) {
            if (e instanceof Sk.builtin.AttributeError) {
                return undefined;
            } else {
                throw e;
            }
        });
        return canSuspend ? res : Sk.misceval.retryOptionalSuspensionOrThrow(res);
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
    var objname = Sk.abstr.typeName(this);
    var jsName = pyName.$jsstr();
    var dict;
    var tp = this.ob$type;
    var descr;
    var f;

    Sk.asserts.assert(tp !== undefined, "object has no ob$type!");

    dict = this["$d"];

    descr = tp.$typeLookup(pyName);

    // otherwise, look in the type for a descr
    if (descr !== undefined && descr !== null) {
        f = descr.tp$descr_set;
        // todo; is this the right lookup priority for data descriptors?
        if (f) {
            return f.call(descr, this, value, canSuspend);
        }
    }

    if (dict) {
        if (dict.mp$ass_subscript) {
            try {
                dict.mp$ass_subscript(pyName, value);
            } catch (e) {
                if (e instanceof Sk.builtin.AttributeError) {
                    throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + Sk.unfixReserved(jsName) + "'");
                } else {
                    throw e;
                }
            }
        } else if (typeof dict === "object") {
            dict[jsName] = value;
        }
    } else {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + Sk.unfixReserved(jsName) + "'");
    }
    

};
Sk.exportSymbol("Sk.builtin.GenericSetAttr", Sk.builtin.GenericSetAttr);


Sk.builtin.GenericNew = function (builtin) {
    const GenericNew = function __new__ (args, kwargs) {
        // this is a prototype of an sk$type object.
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