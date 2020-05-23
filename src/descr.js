/**
 * @function
 * @param {Sk.builtin.type} type_obj
 * @param {Sk.GetSetDef} gsd
 * 
 * @returns typeobj
 */

Sk.generic.descriptor = function (type_name, repr_name, descr_constructor) {
    descr = {
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
    }
    return Sk.abstr.buildNativeClass(type_name, descr);
};

Sk.generic.descriptor.check = function (obj) {
    if (obj === null) {
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
    __doc__: new Sk.GetSetDef("__doc__", function () {
        return this.d$def.$doc ? new Sk.builtin.str(this.d$def.$doc) : Sk.builtin.none.none$;
    }),
    __obj_class__: new Sk.GetSetDef(function () {
        return this.d$type;
    }),
    __name__: new Sk.GetSetDef(function () {
        return new Sk.builtin.str(this.d$name);
    }),
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
    this.d$set_check();

    if (this.d$def.$set !== undefined) {
        return this.d$getset.$set.call(obj, value);
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
    if (flags.fastCall && flags.noKwargs) {
        this.tp$call = this.$methodFastCallNoKwargs;
    } else if (flags.fastCall) {
        this.tp$call = this.$methodFastCall;
    } else if (flags.NoArgs) {
        this.tp$call = this.$methodCallNoArgs;
    } else if (flags.OneArg) {
        this.tp$call = this.$methodCallOneArg;
    } else if (flags.NamedArgs) {
        this.tp$call = this.$methodCallNamedArgs;
    } else if (flags.MinArgs) {
        this.tp$call = this.$methodCallMinArgs;
    } else {
        this.func_code = method_def.$meth;
        this.tp$call = Sk.builtin.func.tp$call;
    }
});

Sk.builtin.method_descriptor.prototype.tp$call = undefined;
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
}


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

Sk.builtin.wrapper_descriptor = Sk.generic.descriptor("wrapper_descriptor", "slot wrapper",
    function wrapper_descriptor(typeobj, slot_def, wrapped) {
        this.d$def = slot_def;
        this.d$type = typeobj;
        this.d$name = slot_def.$name;
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
}

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

Sk.builtin.method_wrapper = Sk.generic.descriptor("method_wrapper", undefined,
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

Sk.builtin.method_wrapper.prototype.tp$getsets.__self__ = new Sk.GetSetDef(function () {
    return this.m$self;
});



/**
 * @constructor
 * @param {Sk.builtin.func} fget
 * @param {Sk.builtin.func} fset
 * @param {Sk.builtin.func} fdel
 * @param {Sk.builtin.str || undefine} doc
 */
Sk.builtin.property = Sk.abstr.buildNativeClass("property", {
    constructor: function property(fget, fset, fdel, doc) {
        // this can be uses as an internal function 
        // typically these properties will be set in the init method
        this.prop$get = fget || Sk.builtin.none.none$;
        this.prop$set = fset || Sk.builtin.none.none$;
        this.prop$del = fdel || Sk.builtin.none.none$;
        this.prop$doc = doc || (fget && fget.$doc) || Sk.builtin.none.none$;
    },
    slots: {
        tp$new: Sk.generic.new(Sk.builtin.property),
        tp$init: function (args, kwargs) {
            args = Sk.abstr.copyKeywordsToNamedArgs(
                "property",
                ["fget", "fset", "fdel", "doc"],
                args,
                kwargs,
                new Array(4).fill(Sk.builtin.none.none$)
            );

            this.prop$get = args[0];
            this.prop$set = args[1];
            this.prop$del = args[2];
            if (Sk.builtin.checkNone(args[3])) {
                if (!Sk.builtin.checkNone(args[0])) {
                    this.prop$doc = args[0].$doc || args[3];
                }
            }
            return Sk.builtin.none.none$;
        },
        tp$doc: "Property attribute.\n\n  fget\n    function to be used for getting an attribute value\n  fset\n    function to be used for setting an attribute value\n  fdel\n    function to be used for del\'ing an attribute\n  doc\n    docstring\n\nTypical use is to define a managed attribute x:\n\nclass C(object):\n    def getx(self): return self._x\n    def setx(self, value): self._x = value\n    def delx(self): del self._x\n    x = property(getx, setx, delx, 'I\'m the \'x\' property.')\n\nDecorators make defining new properties or modifying existing ones easy:\n\nclass C(object):\n    @property\n    def x(self):\n        'I am the \'x\' property.'\n        return self._x\n    @x.setter\n    def x(self, value):\n        self._x = value\n    @x.deleter\n    def x(self):\n        del self._x",
        tp$descr_get: function (obj, type) {
            if (obj === null) {
                return this;
            }
            if (this.prop$get === undefined) {
                throw new Sk.builtin.AttributeError("unreadable attribute")
            }
            return Sk.misceval.callsimArray(this.prop$get, [obj]);
        },
        tp$descr_set: function (obj, value) {
            if (value === undefined) {
                func = this.prop$del;
            } else {
                func = this.prop$set;
            }
            if (Sk.builtin.checkNone(func)) {
                const msg = value === undefined ? "delete" : "set";
                throw new Sk.builtin.AttributeError("can't " + msg + " attribute");
            }
            if (!func.tp$call) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(func) + "' is not callable")
            };

            if (value === undefined) {
                return func.tp$call([obj]);
            } else {
                return func.tp$call([obj, value]);
            }
        },
    },
    methods: {
        getter: {
            $meth: function (fget) {
                return new Sk.builtin.property(fget, this.prop$set, this.prop$del, this.prop$doc);
            },
            $flags: { OneArg: true }
        },
        setter: {
            $meth: function (fset) {
                return new Sk.builtin.property(this.prop$get, fset, this.prop$del, this.prop$doc);
            },
            $flags: { OneArg: true }
        },
        deletter: {
            $meth: function (fdel) {
                return new Sk.builtin.property(this.prop$get, this.prop$set, fdel, this.prop$doc);
            },
            $flags: { OneArg: true }
        }
    },
    getsets: {
        fget: {
            $get: function () { return this.prop$get }
        },
        fset: {
            $get: function () { return this.prop$set }
        },
        fdel: {
            $get: function () { return this.prop$del }
        },
        __doc__: {
            $get: function () { return this.prop$doc }
        },
    }
});

/**
 * @constructor
 * @param {Sk.builtin.func} callable
 */

Sk.builtin.classmethod = Sk.abstr.buildNativeClass("classmethod", {
    constructor: function classmethod(callable) {
        // this can be used as an internal function 
        // typically callable will be set in the init method if being called by python
        this.cm$callable = callable;
        this.$d = new Sk.builtin.dict;
    },
    slots: {
        tp$new: Sk.generic.new(Sk.builtin.classmethod),
        tp$init: function (args, kwargs) {
            Sk.abstr.checkNoKwargs("classmethod", kwargs);
            Sk.abstr.checkArgsLen("classmethod", args, 1, 1);
            this.cm$callable = args[0];
            return Sk.builtin.none.none$;
        },
        tp$doc: "classmethod(function) -> method\n\nConvert a function to be a class method.\n\nA class method receives the class as implicit first argument,\njust like an instance method receives the instance.\nTo declare a class method, use this idiom:\n\n  class C:\n      @classmethod\n      def f(cls, arg1, arg2, ...):\n          ...\n\nIt can be called either on the class (e.g. C.f()) or on an instance\n(e.g. C().f()).  The instance is ignored except for its class.\nIf a class method is called for a derived class, the derived class\nobject is passed as the implied first argument.\n\nClass methods are different than C++ or Java static methods.\nIf you want those, see the staticmethod builtin.",
        tp$descr_get: function (obj, type) {
            if (this.cm$callable === undefined) {
                throw new Sk.builtin.RuntimeError("uninitialized classmethod object")
            }
            if (type === undefined) {
                type = obj.ob$type;
            }
            const f = this.cm$callable.tp$descr_get;
            if (f) {
                return f.call(this.cm$callable, type);
            }
            return new Sk.builtin.method(this.cm$callable, type);
        },
    },
    getsets: {
        __func__: {
            $get: function () { return this.cm$callable }
        },
        __dict__: Sk.generic.getSetDict,
    }

});

/**
 * @constructor
 * @param {Sk.builtin.func} callable
 */

Sk.builtin.staticmethod = Sk.abstr.buildNativeClass("staticmethod", {
    constructor: function staticmethod(callable) {
        // this can be used as an internal function 
        // typically callable will be set in the init method if being called by python
        this.sm$callable = callable
    },
    slots: {
        tp$new: Sk.generic.new(Sk.builtin.staticmethod),
        tp$init: function (args, kwargs) {
            Sk.abstr.checkNoKwargs("staticmethod", kwargs);
            Sk.abstr.checkArgsLen("staticmethod", args, 1, 1);
            this.sm$callable = args[0];
            return Sk.builtin.none.none$;
        },
        tp$doc: "staticmethod(function) -> method\n\nConvert a function to be a static method.\n\nA static method does not receive an implicit first argument.\nTo declare a static method, use this idiom:\n\n     class C:\n         @staticmethod\n         def f(arg1, arg2, ...):\n             ...\n\nIt can be called either on the class (e.g. C.f()) or on an instance\n(e.g. C().f()).  The instance is ignored except for its class.\n\nStatic methods in Python are similar to those found in Java or C++.\nFor a more advanced concept, see the classmethod builtin.",
        tp$descr_get: function (obj, type) {
            if (this.sm$callable === undefined) {
                throw new Sk.builtin.RuntimeError("uninitialized staticmethod object")
            }
            return this.sm$callable;
        }
    },
    getsets: {
        __func__: {
            $get: function () { return this.sm$callable }
        }
    }
});