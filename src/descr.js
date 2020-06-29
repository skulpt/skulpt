/** @typedef {Sk.builtin.type|Function|Object} */ var typeObject;
/** @constructor @extends {Sk.builtin.object} */ var descr_object = new Function(); // keep closure compiler happy

/**
 * @function
 * @param {string} type_name
 * @param {string|undefined} repr_name
 * @param {Function} descr_constructor
 */
function buildDescriptor(type_name, repr_name, descr_constructor) {
    const descr = Sk.abstr.buildNativeClass(type_name, {
        constructor: descr_constructor,
        flags: { sk$acceptable_as_base_class: false },
        // we can't use slots/methods/getsets yet since they're not defined!
        proto: /**@lends {descr_object.prototype}*/ {
            d$repr_name: repr_name || type_name,
            d$check: descriptorCheck,
            d$set_check: descriptorSetCheck,
            $r: descriptorRepr,
            tp$getsets: descriptorGetsets,
            tp$getattr: Sk.generic.getAttr,
        },
    });
    return descr;
}

function descriptorCheck(obj) {
    if (obj == null) {
        return this;
    } else if (!obj.ob$type.$isSubType(this.d$type)) {
        throw new Sk.builtin.TypeError(
            "descriptor '" +
                this.d$name +
                "' requires a '" +
                this.d$type.prototype.tp$name +
                "' object but received a '" +
                Sk.abstr.typeName(obj) +
                "' object"
        );
    }
    return;
}

function descriptorSetCheck(obj) {
    if (!obj.ob$type.$isSubType(this.d$type)) {
        throw new Sk.builtin.TypeError(
            "descriptor '" +
                this.d$name +
                "' requires a '" +
                this.d$type.prototype.tp$name +
                "' object but received a '" +
                Sk.abstr.typeName(obj) +
                "' object"
        );
    }
}

function descriptorRepr() {
    return new Sk.builtin.str("<" + this.d$repr_name + " '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' objects>");
}

const descriptorGetsets = {
    __doc__: {
        $get: function () {
            return this.d$def.$doc ? new Sk.builtin.str(this.d$def.$doc) : Sk.builtin.none.none$;
        },
    },
    __obj_class__: {
        $get: function () {
            return this.d$type;
        },
    },
    __name__: {
        $get: function () {
            return new Sk.builtin.str(this.d$name);
        },
    },
};

/**
 * @constructor
 * @param {typeObject} type_obj
 * @param {Object} gsd
 * @extends {descr_object}
 */
Sk.builtin.getset_descriptor = buildDescriptor("getset_descriptor", undefined, function getset_descr(typeobj, d_base) {
    this.d$def = d_base;
    this.$get = d_base.$get;
    this.$set = d_base.$set;
    this.d$type = typeobj;
    this.d$name = d_base.$name;
});

Sk.builtin.getset_descriptor.prototype.tp$descr_get = function (obj, type) {
    let ret;
    if ((ret = this.d$check(obj))) {
        return ret;
    }
    if (this.$get !== undefined) {
        return this.$get.call(obj);
    }

    throw new Sk.builtin.AttributeError("getset_descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' objects is not readable");
};

Sk.builtin.getset_descriptor.prototype.tp$descr_set = function (obj, value) {
    this.d$set_check(obj);

    if (this.$set !== undefined) {
        return this.$set.call(obj, value);
    }
    throw new Sk.builtin.AttributeError(
        "getset_descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' objects is not writeable"
    );
};

/**
 * @constructor
 * @param {typeObject} type_obj
 * @param {Object} method
 * @extends {descr_object}
 */

Sk.builtin.method_descriptor = buildDescriptor("method_descriptor", "method", function (typeobj, method_def) {
    this.d$def = method_def;
    this.$meth = method_def.$meth; //useful for internal fast calls
    this.d$type = typeobj;
    this.d$name = method_def.$name || "<native JS>";
    const flags = method_def.$flags || {};
    this.$flags = flags;
    if (flags.FastCall && flags.NoKwargs) {
        this.tp$call = this.$methodFastCallNoKwargs;
    } else if (flags.FastCall) {
        this.tp$call = this.$methodFastCall;
    } else if (flags.NoArgs) {
        this.tp$call = this.$methodCallNoArgs;
    } else if (flags.OneArg) {
        this.tp$call = this.$methodCallOneArg;
    } else if (flags.NamedArgs) {
        this.tp$call = this.$methodCallNamedArgs;
    } else if (flags.MinArgs !== undefined) {
        this.tp$call = this.$methodCallMinArgs;
    } else {
        // for legacy methods that haven't defined flags yet
        this.func_code = method_def.$meth;
        this.tp$call = this.$defaultCall;
        this.$memoiseFlags = Sk.builtin.func.prototype.$memoiseFlags;
        this.$resolveArgs = Sk.builtin.func.prototype.$resolveArgs;
    }
});

Sk.builtin.method_descriptor.prototype.tp$call = function (args, kwargs) {
    return this.tp$call(args, kwargs);
};
Sk.builtin.method_descriptor.prototype.$methodFastCall = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    return this.$meth.call(self, args, kwargs);
};
Sk.builtin.method_descriptor.prototype.$methodFastCallNoKwargs = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    Sk.abstr.checkNoKwargs(this.d$name, kwargs);
    return this.$meth.call(self, args);
};
Sk.builtin.method_descriptor.prototype.$methodCallNoArgs = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    Sk.abstr.checkNoArgs(this.d$name, args, kwargs);
    return this.$meth.call(self);
};
Sk.builtin.method_descriptor.prototype.$methodCallOneArg = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    Sk.abstr.checkOneArg(this.d$name, args, kwargs);
    return this.$meth.call(self, args[0]);
};
Sk.builtin.method_descriptor.prototype.$methodCallNamedArgs = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    args = Sk.abstr.copyKeywordsToNamedArgs(this.d$name, this.$flags.NamedArgs, args, kwargs, this.$flags.Defaults);
    return this.$meth.call(self, ...args);
};
Sk.builtin.method_descriptor.prototype.$methodCallMinArgs = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    Sk.abstr.checkNoKwargs(this.d$name, kwargs);
    Sk.abstr.checkArgsLen(this.d$name, args, this.$flags.MinArgs, this.$flags.MaxArgs);
    return this.$meth.call(self, ...args);
};
Sk.builtin.method_descriptor.prototype.$defaultCall = function (args, kwargs) {
    this.m$checkself(args[0]);
    return Sk.builtin.func.prototype.tp$call.call(this, args, kwargs);
};

Sk.builtin.method_descriptor.prototype.m$checkself = function (self) {
    if (self === undefined) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' object needs an argument");
    }
    this.d$check(self);
};

Sk.builtin.method_descriptor.prototype.tp$descr_get = function (obj, type) {
    let ret;
    if ((ret = this.d$check(obj))) {
        return ret;
    }
    return new Sk.builtin.sk_method(this.d$def, obj);
};

Sk.builtin.method_descriptor.prototype.tp$getsets.__text_signature__ = {
    $get: function () {
        return this.d$def.$textsig ? new Sk.builtin.str(this.d$def.$textsig) : Sk.builtin.none.none$;
    },
};

/**
 * @constructor
 * @extends {descr_object}
 *
 * @param {typeObject} type_obj
 * @param {Object} wrapper_base
 * @param {Function} wrapped
 */
Sk.builtin.wrapper_descriptor = buildDescriptor("wrapper_descriptor", "slot wrapper", function wrapper_descriptor(typeobj, slot_def, wrapped) {
    this.d$def = slot_def;
    this.d$type = typeobj;
    this.d$name = wrapped.$name = slot_def.$name;
    this.d$wrapped = wrapped;
});

Sk.builtin.wrapper_descriptor.prototype.tp$call = function (args, kwargs) {
    // make sure the first argument is acceptable as self
    if (args.length < 1) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' object needs an argument");
    }
    const self = args.shift();
    if (!self.ob$type.$isSubType(this.d$type)) {
        throw new Sk.builtin.TypeError(
            "descriptor '" +
                this.d$name +
                "' requires a '" +
                this.d$type.prototype.tp$name +
                "' object but received a '" +
                Sk.abstr.typeName(self) +
                "'"
        );
    }
    return this.raw$call(self, args, kwargs);
};

Sk.builtin.wrapper_descriptor.prototype.raw$call = function (self, args, kwargs) {
    // the base might have some flags I guess...
    return this.d$def.$wrapper.call(this.d$wrapped, self, args, kwargs);
};

Sk.builtin.wrapper_descriptor.prototype.tp$descr_get = function (obj, type) {
    let ret;
    if ((ret = this.d$check(obj))) {
        return ret;
    }
    return new Sk.builtin.method_wrapper(this, obj);
};

/**
 * @constructor
 * @extends {descr_object}
 * @param {Sk.builtin.wrapper_descriptor} type_obj
 * @param wrapper_base
 */

Sk.builtin.method_wrapper = buildDescriptor("method_wrapper", undefined, function method_wrapper(wrapper_descr, self) {
    this.m$descr = wrapper_descr;
    this.m$self = self;
    this.d$def = wrapper_descr.d$def;
    this.d$name = wrapper_descr.d$name;
    this.d$type = wrapper_descr.d$type;
});
Sk.builtin.method_wrapper.prototype.tp$call = function (args, kwargs) {
    return this.m$descr.raw$call(this.m$self, args, kwargs);
};

Sk.builtin.method_wrapper.prototype.$r = function () {
    return new Sk.builtin.str("<method-wrapper '" + this.d$name + "' of " + Sk.abstr.typeName(this.m$self) + " object>");
};

Sk.builtin.method_wrapper.prototype.tp$getsets.__self__ = {
    $get: function () {
        return this.m$self;
    },
};

/**
 *
 * @constructor
 * @extends {descr_object}
 * @param {typeObject} typeobj
 * @param {Object} method_def
 *
 * @description
 * This is for classmethods in Native Js Classes, not for "f = classmethod(f)" in Python
 * See dict.fromkeys for a native example
 *
 */
Sk.builtin.classmethod_descriptor = buildDescriptor("classmethod_descriptor", "method", function classmethod_descriptor(typeobj, method_def) {
    this.d$def = method_def;
    this.$meth = method_def.$meth; //useful for internal fast calls
    this.d$type = typeobj;
    this.d$name = method_def.$name || "<native JS>";
});

Sk.builtin.classmethod_descriptor.prototype.tp$getsets.__text_signature__ = Sk.builtin.method_descriptor.prototype.tp$getsets.__text_signature__;

Sk.builtin.classmethod_descriptor.prototype.tp$call = function (args, kwargs) {
    if (args.length < 1) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' object needs an argument");
    }
    const self = args.shift();
    const bound = this.tp$descr_get(null, self);
    return bound.tp$call(args, kwargs);
};

/**
 * @param {*} obj
 * @param {*} type
 * @param {boolean=} canSuspend
 */
Sk.builtin.classmethod_descriptor.prototype.tp$descr_get = function (obj, type, canSuspend) {
    if (type === undefined) {
        if (obj !== null) {
            type = type || obj.ob$type;
        } else {
            throw new Sk.builtin.TypeError(
                "descriptor '" + this.d$name + "' for type '" + this.d$type.prototype.tp$name + "' needs an object or a type"
            );
        }
    }
    if (type.ob$type !== Sk.builtin.type) {
        throw new Sk.builtin.TypeError(
            "descriptor '" +
                this.d$name +
                "' for type '" +
                this.d$type.prototype.tp$name +
                "' needs a type not a '" +
                Sk.abstr.typeName(type) +
                "' as arg 2"
        );
    }

    if (!type.$isSubType(this.d$type)) {
        throw new Sk.builtin.TypeError(
            "descriptor '" +
                this.d$name +
                "' requires a '" +
                this.d$type.prototype.tp$name +
                "' object but received a '" +
                Sk.abstr.typeName(type) +
                "' object"
        );
    }
    return new Sk.builtin.sk_method(this.d$def, obj);
};

// initialize these classes now that they exist do OneTime initialization only takes care of builtinsdict these are in builtins
const _to_initialize = [
    Sk.builtin.method_descriptor,
    Sk.builtin.getset_descriptor,
    Sk.builtin.wrapper_descriptor,
    Sk.builtin.method_wrapper,
    Sk.builtin.classmethod_descriptor,
];

for (let i = 0; i < _to_initialize.length; i++) {
    const cls = _to_initialize[i];
    Sk.abstr.setUpSlots(cls);
    Sk.abstr.setUpMethods(cls);
    Sk.abstr.setUpGetSets(cls);
}
