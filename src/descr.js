/**
 * @function
 * @param {string} type_name
 * @param {string|undefined} repr_name
 * @param {Function} descr_constructor
 *
 * @returns {FunctionConstructor}
 */
function buildDescriptor(type_name, repr_name, descr_options) {
    const descr = Sk.abstr.buildNativeClass(type_name, {
        constructor: descr_options.constructor,
        slots: Object.assign({
            tp$getattr: Sk.generic.getAttr,
            $r: descriptorRepr,
        }, descr_options.slots),
        getsets: Object.assign(descr_options.getsets || {}, descriptorGetsets),
        proto: /**@lends {descr_object.prototype}*/ Object.assign(descr_options.proto || {}, {
            d$repr_name: repr_name || type_name,
            d$check: descriptorCheck,
            d$set_check: descriptorSetCheck,
        }),
        flags: { sk$acceptable_as_base_class: false },
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
        $get() {
            return this.d$def.$doc ? new Sk.builtin.str(this.d$def.$doc) : Sk.builtin.none.none$;
        },
    },
    __objclass__: {
        $get() {
            return this.d$type;
        },
    },
    __name__: {
        $get() {
            return new Sk.builtin.str(this.d$name);
        },
    },
};

const descrTextSig = {
    __text_signature__: {
        $get() {
            return this.d$def.$textsig ? new Sk.builtin.str(this.d$def.$textsig) : Sk.builtin.none.none$;
        },
    },
};

/**
 * @constructor
 * @param {typeObject} type_obj
 * @param {Object} gsd
 * @extends {Sk.builtin.object}
 */
Sk.builtin.getset_descriptor = buildDescriptor("getset_descriptor", undefined, {
    constructor: function getset_descr(typeobj, getset_def) {
        this.d$def = getset_def;
        this.$get = getset_def.$get;
        this.$set = getset_def.$set;
        this.d$type = typeobj;
        this.d$name = getset_def.$name;
    },
    slots: {
        tp$descr_get(obj, type) {
            let ret;
            if ((ret = this.d$check(obj))) {
                return ret;
            }
            if (this.$get !== undefined) {
                return this.$get.call(obj);
            }

            throw new Sk.builtin.AttributeError(
                "getset_descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' objects is not readable"
            );
        },
        tp$descr_set(obj, value) {
            this.d$set_check(obj);

            if (this.$set !== undefined) {
                return this.$set.call(obj, value);
            }
            throw new Sk.builtin.AttributeError("attribute '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' objects is readonly");
        },
    },
});

/**
 * @param {typeObject} type_obj
 * @param {Object} method
 * @extends {descr_object}
 */
Sk.builtin.method_descriptor = buildDescriptor("method_descriptor", "method", {
    constructor: function method_descriptor(typeobj, method_def) {
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
    },
    slots: {
        tp$call(args, kwargs) {
            return this.tp$call(args, kwargs);
        },
        tp$descr_get(obj, type) {
            let ret;
            if ((ret = this.d$check(obj))) {
                return ret;
            }
            return new Sk.builtin.sk_method(this.d$def, obj);
        },
    },
    getsets: descrTextSig,
    proto: {
        $methodFastCall(args, kwargs) {
            const self = args.shift();
            this.m$checkself(self);
            return this.$meth.call(self, args, kwargs);
        },
        $methodFastCallNoKwargs(args, kwargs) {
            const self = args.shift();
            this.m$checkself(self);
            Sk.abstr.checkNoKwargs(this.d$name, kwargs);
            return this.$meth.call(self, args);
        },
        $methodCallNoArgs(args, kwargs) {
            const self = args.shift();
            this.m$checkself(self);
            Sk.abstr.checkNoArgs(this.d$name, args, kwargs);
            return this.$meth.call(self);
        },
        $methodCallOneArg(args, kwargs) {
            const self = args.shift();
            this.m$checkself(self);
            Sk.abstr.checkOneArg(this.d$name, args, kwargs);
            return this.$meth.call(self, args[0]);
        },
        $methodCallNamedArgs(args, kwargs) {
            const self = args.shift();
            this.m$checkself(self);
            args = Sk.abstr.copyKeywordsToNamedArgs(this.d$name, this.$flags.NamedArgs, args, kwargs, this.$flags.Defaults);
            return this.$meth.call(self, ...args);
        },
        $methodCallMinArgs(args, kwargs) {
            const self = args.shift();
            this.m$checkself(self);
            Sk.abstr.checkNoKwargs(this.d$name, kwargs);
            Sk.abstr.checkArgsLen(this.d$name, args, this.$flags.MinArgs, this.$flags.MaxArgs);
            return this.$meth.call(self, ...args);
        },
        $defaultCall(args, kwargs) {
            this.m$checkself(args[0]);
            return Sk.builtin.func.prototype.tp$call.call(this, args, kwargs);
        },
        m$checkself(self) {
            if (self === undefined) {
                throw new Sk.builtin.TypeError(
                    "descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' object needs an argument"
                );
            }
            this.d$check(self);
        },
    },
});

/**
 * @constructor
 * @extends {descr_object}
 *
 * @param {typeObject} type_obj
 * @param {Object} wrapper_base
 * @param {Function} wrapped
 */
Sk.builtin.wrapper_descriptor = buildDescriptor("wrapper_descriptor", "slot wrapper", {
    constructor: function wrapper_descriptor(typeobj, slot_def, wrapped) {
        this.d$def = slot_def;
        this.d$type = typeobj;
        this.d$name = wrapped.$name = slot_def.$name;
        this.d$wrapped = wrapped;
    },
    slots: {
        tp$descr_get(obj, type) {
            let ret;
            if ((ret = this.d$check(obj))) {
                return ret;
            }
            return new Sk.builtin.method_wrapper(this, obj);
        },
        tp$call(args, kwargs) {
            // make sure the first argument is acceptable as self
            if (args.length < 1) {
                throw new Sk.builtin.TypeError(
                    "descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' object needs an argument"
                );
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
        },
    },
    proto: {
        raw$call(self, args, kwargs) {
            // the base might have some flags I guess... see cpython version in descr.c
            this.d$wrapped.$name = this.d$name; // hack since some slots use the same function (__setattr__, __delattr__)
            return this.d$def.$wrapper.call(this.d$wrapped, self, args, kwargs);
        },
    },
});

/**
 * @constructor
 * @extends {descr_object}
 * @param {Sk.builtin.wrapper_descriptor} type_obj
 * @param wrapper_base
 */
Sk.builtin.method_wrapper = buildDescriptor("method_wrapper", undefined, {
    constructor: function method_wrapper(wrapper_descr, self) {
        this.m$descr = wrapper_descr;
        this.m$self = self;
        this.d$def = wrapper_descr.d$def;
        this.d$name = wrapper_descr.d$name;
        this.d$type = wrapper_descr.d$type;
    },
    slots: {
        tp$call(args, kwargs) {
            return this.m$descr.raw$call(this.m$self, args, kwargs);
        },
        tp$richcompare(other, op) {
            if ((op !== "Eq" && op !== "NotEq") || !(other instanceof Sk.builtin.method_wrapper)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            let eq = this.m$self === other.m$self && this.m$descr === other.m$descr;
            return op === "Eq" ? eq : !eq;
        },
        $r() {
            return new Sk.builtin.str("<method-wrapper '" + this.d$name + "' of " + Sk.abstr.typeName(this.m$self) + " object>");
        },
    },
    getsets: {
        __self__: {
            $get() {
                return this.m$self;
            },
        },
    },
});

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
Sk.builtin.classmethod_descriptor = buildDescriptor("classmethod_descriptor", "method", {
    constructor: function classmethod_descriptor(typeobj, method_def) {
        this.d$def = method_def;
        this.$meth = method_def.$meth; //useful for internal fast calls
        this.d$type = typeobj;
        this.d$name = method_def.$name || "<native JS>";
    },
    slots: {
        tp$call(args, kwargs) {
            if (args.length < 1) {
                throw new Sk.builtin.TypeError(
                    "descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' object needs an argument"
                );
            }
            const self = args.shift();
            const bound = this.tp$descr_get(null, self);
            return bound.tp$call(args, kwargs);
        },
        tp$descr_get(obj, type, canSuspend) {
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
            return new Sk.builtin.sk_method(this.d$def, type);
        },
    },
    getsets: descrTextSig,
});


[
    Sk.builtin.method_descriptor,
    Sk.builtin.getset_descriptor,
    Sk.builtin.wrapper_descriptor,
    Sk.builtin.method_wrapper,
    Sk.builtin.classmethod_descriptor,
].forEach((cls) => {
    Sk.abstr.setUpSlots(cls);
    Sk.abstr.setUpMethods(cls);
    Sk.abstr.setUpGetSets(cls);
});