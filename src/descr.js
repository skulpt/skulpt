/**
 * @function
 * @param {Sk.builtin.type} type_obj
 * @param {Sk.GetSetDef} gsd
 * 
 * @returns typeobj
 */

Sk.generic.descriptor = function (type_name, repr_name, descr_constructor) {
    const descr = {
        constructor: descr_constructor || function descr(typeobj, d_base) {
            this.d$def = d_base;
            this.d$type = typeobj;
            this.d$name = d_base.$name;
        },
        flags: { sk$acceptable_as_base_class: false },
        // we can't use slots/methods/getsets yet since they're not defined!
        proto: {
            d$repr_name: repr_name || type_name,
            d$check: Sk.generic.descriptor.check,
            d$set_check: Sk.generic.descriptor.setCheck,
            $r: Sk.generic.descriptor.repr,
            tp$getsets: Sk.generic.descriptor.getsets,
        }
    };
    return Sk.abstr.buildNativeClass(type_name, descr);
};

Sk.generic.descriptor.check = function (obj) {
    if (obj == null) {
        return this;
    } else if (!obj.ob$type.$isSubType(this.d$type)) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' requires a '" + this.d$type.prototype.tp$name + "' object but received a '" + Sk.abstr.typeName(obj) + "' object");
    }
    return;
};

Sk.generic.descriptor.setCheck = function (obj) {
    if (!obj.ob$type.$isSubType(this.d$type)) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' requires a '" + this.d$type.prototype.tp$name + "' object but received a '" + Sk.abstr.typeName(obj) + "' object");
    }
};

Sk.generic.descriptor.repr = function () {
    return new Sk.builtin.str("<" + this.d$repr_name + " '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' objects>");
};

Sk.generic.descriptor.getsets = {
    __doc__: {
        $get: function () {
            return this.d$def.$doc ? new Sk.builtin.str(this.d$def.$doc) : Sk.builtin.none.none$;
        }
    },
    __obj_class__: {
        $get: function () { return this.d$type; }
    },
    __name__: {
        $get: function () { return new Sk.builtin.str(this.d$name); }
    },
};

/**
 * @constructor
 * @param {Sk.builtin.type} type_obj
 * @param {Sk.GetSetDef} gsd
 */

Sk.builtin.getset_descriptor = Sk.generic.descriptor("getset_descriptor");

Sk.builtin.getset_descriptor.prototype.tp$descr_get = function (obj, type) {
    let ret;
    if (ret = this.d$check(obj)) {
        return ret;
    }
    if (this.d$def && this.d$def.$get !== undefined) {
        return this.d$def.$get.call(obj);
    }

    throw new Sk.builtin.AttributeError("getset_descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' objects is not readable");
};


Sk.builtin.getset_descriptor.prototype.tp$descr_set = function (obj, value) {
    this.d$set_check(obj);

    if (this.d$def.$set !== undefined) {
        return this.d$def.$set.call(obj, value);
    }
    throw new Sk.builtin.AttributeError("getset_descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' objects is not writeable");
};



/**
 * @constructor
 * @param {Sk.builtin.type} type_obj
 * @param {Sk.MethodDef} method
 */

Sk.builtin.method_descriptor = Sk.generic.descriptor("method_descriptor", "method", function (typeobj, method_def) {

    this.d$def = method_def;
    this.d$type = typeobj;
    this.d$name = method_def.$name;
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
        this.func_code = method_def.$meth;
    }
});

Sk.builtin.method_descriptor.prototype.tp$call = Sk.generic.functionCallMethod;
Sk.builtin.method_descriptor.prototype.$methodFastCall = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    this.d$def.$meth.call(self, args);
};
Sk.builtin.method_descriptor.prototype.$methodFastCallNoKwargs = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    Sk.abstr.checkNoKwargs(this.d$name, kwargs);
    return this.d$def.$meth.call(self, args);
};
Sk.builtin.method_descriptor.prototype.$methodCallNoArgs = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    Sk.abstr.checkNoArgs(this.d$name, args, kwargs);
    return this.d$def.$meth.call(self);
};
Sk.builtin.method_descriptor.prototype.$methodCallOneArg = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    Sk.abstr.checkOneArg(this.d$name, args, kwargs);
    return this.d$def.$meth.call(self, args[0]);
};
Sk.builtin.method_descriptor.prototype.$methodCallNamedArgs = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    args = Sk.abstr.copyKeywordsToNamedArgs(this.d$name, this.$flags.NamedArgs, args, kwargs, this.$flags.Defaults);
    return this.d$def.$meth.call(self, ...args);
};
Sk.builtin.method_descriptor.prototype.$methodCallMinArgs = function (args, kwargs) {
    const self = args.shift();
    this.m$checkself(self);
    Sk.abstr.checkNoKwargs(this.d$name, kwargs);
    Sk.abstr.checkArgsLen(this.d$name, args, this.$flags.MinArgs, this.$flags.MaxArgs);
    return this.d$def.$meth.call(self, ...args);
};
Sk.builtin.method_descriptor.prototype.m$checkself = function (self) {
    if (self === undefined) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' object needs an argument");
    };
    this.d$check(self);
};


Sk.builtin.method_descriptor.prototype.tp$descr_get = function (obj, type) {
    let ret;
    if (ret = this.d$check(obj)) {
        return ret;
    }
    return new Sk.builtin.sk_method(this.d$def, obj);
};

/**
 * @constructor
 * @param {Sk.builtin.type} type_obj
 * @param {Sk.builtin.SlotDef} wrapper_base
 */

Sk.builtin.wrapper_descriptor = Sk.generic.descriptor(
    "wrapper_descriptor",
    "slot wrapper",
    function wrapper_descriptor(typeobj, slot_def, wrapped) {
        this.d$def = slot_def;
        this.d$type = typeobj;
        this.d$name = wrapped.$name = slot_def.$name;
        this.d$wrapped = wrapped;
    }
);

Sk.builtin.wrapper_descriptor.prototype.tp$call = function (args, kwargs) {
    // make sure the first argument is acceptable as self
    if (args.length < 1) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' object needs an argument");
    }
    const self = args.shift();
    if (!self.ob$type.$isSubType(this.d$type)) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' requires a '" + this.d$type.prototype.tp$name + "' object but received a '" + Sk.abstr.typeName(self) + "'");
    }
    return this.raw$call(self, args, kwargs);
};

Sk.builtin.wrapper_descriptor.prototype.raw$call = function (self, args, kwargs) {
    // the base might have some flags I guess...
    return this.d$def.$wrapper.call(this.d$wrapped, self, args, kwargs);
};

Sk.builtin.wrapper_descriptor.prototype.tp$descr_get = function (obj, type) {
    let ret;
    if (ret = this.d$check(obj)) {
        return ret;
    }
    return new Sk.builtin.method_wrapper(this, obj);
};


/**
 * @constructor
 * @param {Sk.builtin.type} type_obj
 * @param wrapper_base
 */

Sk.builtin.method_wrapper = Sk.generic.descriptor(
    "method_wrapper",
    undefined,
    function method_wrapper(wrapper_descr, self) {
        this.m$descr = wrapper_descr;
        this.m$self = self;
        this.d$def = wrapper_descr.d$def;
        this.d$name = wrapper_descr.d$name;
        this.d$type = wrapper_descr.d$type;
    }
);
Sk.builtin.method_wrapper.prototype.tp$call = function (args, kwargs) {
    return this.m$descr.raw$call(this.m$self, args, kwargs);
};

Sk.builtin.method_wrapper.prototype.$r = function () {
    return new Sk.builtin.str("<method wrapper '" + this.d$name + "' of '" + Sk.abstr.typeName(this.m$self) + "' object>");
};

Sk.builtin.method_wrapper.prototype.tp$getsets.__self__ = {
    $get: function () { return this.m$self; }
};

