/**
 * @constructor
 * @param {Sk.builtin.type} type_obj
 * @param {Sk.GetSetDef} gsd
 */

Sk.generic.descriptor = function (type_name, repr_name, descr_constructor) {
    descr = {
        constructor: descr_constructor || function (typeobj, d_base) {
            this.d$base = d_base;
            this.d$type = typeobj;
            this.d$name = d_base.$name;
        },
        flags: { sk$acceptable_as_base_class = false },
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

Sk.generic.descriptor.check = function () {
    if (Sk.builtin.checkNone(obj)) {
        return this;
    } else if (!obj.ob$type.$isSubType(this.d$type)) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' for '" + this.d$type.prototype.tp$name + "' object doesn't apply to a '" + Sk.abstr.typeName(obj) + "' object");
    }
    return;
};

Sk.generic.descriptor.setCheck = function (obj) {
    if (!obj.ob$type.$isSubType(this.d$type)) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' for '" + this.d$type.prototype.tp$name + "' object doesn't apply to a '" + Sk.abstr.typeName(obj) + "' object");
    }
};

Sk.generic.description.repr = function () {
    return new Sk.builtin.str("<" + this.d$repr_name + " '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' objects>");
};

Sk.generic.descriptor.getsets = {
    __doc__: new Sk.GetSetDef("__doc__", function () {
        return this.d$base.$doc ? new Sk.builtin.str(this.d$base.$doc) : Sk.builtin.none.none$;
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

Sk.builtin.getset_descriptor = new Sk.generic.descriptor("getset_descriptor");

Sk.builtin.getset_descriptor.prototype.tp$descr_get = function (obj, type) {
    let ret;
    if (ret = this.d$check(obj)) {
        return ret;
    }
    if (this.d$base && this.d$base.$get !== undefined) {
        return this.d$base.$get.call(obj);
    }

    throw new Sk.builtin.AttributeError("getset_descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' objects is not readable");
};


Sk.builtin.getset_descriptor.prototype.tp$descr_set = function (obj, value) {
    this.d$set_check();

    if (this.d$base.$set !== undefined) {
        return this.d$getset.$set.call(obj, value);
    }
    throw new Sk.builtin.AttributeError("getset_descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' objects is not writeable");
};



/**
 * @constructor
 * @param {Sk.builtin.type} type_obj
 * @param {Sk.MethodDef} method
 */

Sk.builtin.method_descriptor = new Sk.generic.descriptor("method_descriptor", "method");
Sk.builtin.method_descriptor.prototype.tp$call = Sk.builtin.VectorCall; //whatever this means

Sk.builtin.method_descriptor.prototype.tp$descr_get = function (obj, type) {
    let ret;
    if (ret = this.d$check(obj)) {
        return ret;
    }
    return new Sk.builtin.functionOrMethod(this.d$method, obj);
};

/**
 * @constructor
 * @param {Sk.builtin.type} type_obj
 * @param {Sk.builtin.SlotDef} wrapper_base
 */

Sk.builtin.wrapper_descriptor = new Sk.generic.descriptor("wrapper_descriptor", "slot wrapper",
    function (type_obj, slot_def, wrapped) {
        this.d$type = type_obj;
        this.d$name = slot_def.$wrapper.name;
        this.d$base = slot_def;
        this.d$wrapped = wrapped;
    }
);

Sk.builtin.wrapper_descriptor.prototype.tp$call = function (args, kwargs) {
    // make sure the first argument is acceptable as self
    if (args.length < 1) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' of '" + this.d$type.prototype.tp$name + "' object needs an argument");
    }
    const self = args.unshift();
    if (!self.ob$type.$isSubType(this.d$type)) {
        throw new Sk.builtin.TypeError("descriptor '" + this.d$name + "' requires a '" + this.d$type.prototype.tp$name + "' object but received a '" + Sk.abstr.typeName(self) + "'");
    }
    return this.raw$call(self, args, kwargs);
};

Sk.builtin.wrapper_descriptor.prototype.raw$call = function (self, args, kwargs) {
    // the base might have some flags I guess...
    return this.d$base.$wrapper.call(this.d$wrapped, self, args, kwargs);
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

Sk.builtin.method_wrapper = new Sk.generic.descriptor("method_wrapper", undefined,
    function (wrapper_descr, self) {
        this.m$descr = wrapper_descr;
        this.m$self = self;
        this.d$base = wrapper_descr.d$base;
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
    constructor: function (fget, fset, fdel, doc) {
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
            if (Sk.builtin.checkNone(obj)) {
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
            const args = value
            if (!func.tp$call) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(func) + "' is not callable")
            }

            if (value === undefined) {
                return func.tp$call([obj]);
            } else {
                return func.tp$call([obj, value]);
            }
        },
    },
    methods: {
        getter: {
            $raw: function (fget) {
                return new Sk.builtin.property(fget, this.prop$set, this.prop$del, this.prop$doc);
            },
            $flags: { OneArg: true }
        },
        setter: {
            $raw: function (fset) {
                return new Sk.builtin.property(this.prop$get, fset, this.prop$del, this.prop$doc);
            },
            $flags: { OneArg: true }
        },
        deletter: {
            $raw: function (fdel) {
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




Sk.builtin.property = function (fget, fset, fdel, doc) {
    // this can be uses as an internal function 
    // typically these properties will be set in the init method
    this.prop$get = fget || Sk.builtin.none.none$;
    this.prop$set = fset || Sk.builtin.none.none$;
    this.prop$del = fdel || Sk.builtin.none.none$;
    if (doc !== undefined) {
        this.prop$doc = doc;
    } else if (fget && fget.f$doc) {
        this.prop$doc = fget.f$doc;
    } else {
        this.prop$doc = Sk.builtin.none.none$;
    }
};

Sk.abstr.setUpInheritance("property", Sk.builtin.property, Sk.builtin.object);
Sk.abstr.setUpBuiltinMro(Sk.builtin.property);

Sk.builtin.property.prototype.tp$new = Sk.generic.new(Sk.builtin.property);

Sk.builtin.property.prototype.tp$init = function (args, kwargs) {
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
    this.prop$doc = Sk.builtin.checkNone(args[3]) ? this.prop$get.$doc : Sk.builtin.none.none$;
    return Sk.builtin.none.none$;
};

Sk.builtin.property.prototype.tp$doc = "Property attribute.\n\n  fget\n    function to be used for getting an attribute value\n  fset\n    function to be used for setting an attribute value\n  fdel\n    function to be used for del\'ing an attribute\n  doc\n    docstring\n\nTypical use is to define a managed attribute x:\n\nclass C(object):\n    def getx(self): return self._x\n    def setx(self, value): self._x = value\n    def delx(self): del self._x\n    x = property(getx, setx, delx, 'I\'m the \'x\' property.')\n\nDecorators make defining new properties or modifying existing ones easy:\n\nclass C(object):\n    @property\n    def x(self):\n        'I am the \'x\' property.'\n        return self._x\n    @x.setter\n    def x(self, value):\n        self._x = value\n    @x.deleter\n    def x(self):\n        del self._x"


Sk.builtin.property.prototype.tp$descr_get = function (obj, type) {
    if (Sk.builtin.checkNone(obj)) {
        return this;
    }

    if (this.prop$get === undefined) {
        throw new Sk.builtin.AttributeError("unreadable attribute")
    }

    if (!this.prop$get.tp$call) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this.prop$get) + "' is not callable")
    }
    return this.prop$get.tp$call([obj]);
};

Sk.builtin.property.prototype.tp$descr_set = function (obj, value) {
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
    }

    if (value === undefined) {
        return func.tp$call([obj]);
    } else {
        return func.tp$call([obj, value]);
    }
};

Sk.builtin.property.prototype.tp$methods = {
    getter: {
        $raw: function (fget) {
            return new Sk.builtin.property(fget, this.prop$set, this.prop$del, this.prop$doc);
        },
        $flags: { OneArg: true }
    },
    setter: {
        $raw: function (fset) {
            return new Sk.builtin.property(this.prop$get, fset, this.prop$del, this.prop$doc);
        },
        $flags: { OneArg: true }
    },
    deletter: {
        $raw: function (fdel) {
            return new Sk.builtin.property(this.prop$get, this.prop$set, fdel, this.prop$doc);
        },
        $flags: { OneArg: true }
    }
}

Sk.builtin.property.prototype.tp$getsets = {
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

Sk.abstr.setUpSlots(Sk.builtin.property);
Sk.abstr.setUpMethods(Sk.builtin.prototype);
Sk.abstr.setUpGetSets(Sk.builtin.prototype);

/**
 * @constructor
 * @param {Sk.builtin.func} callable
 */

Sk.builtin.classmethod = Sk.abstr.buildNativeClass("classmethod", {
    constructor: function (callable) {
        // this can be used as an internal function 
        // typically callable will be set in the init method if being called by python
        this.cm$callable = callable;
        this.$d = new Sk.builtin.dict;
    },
    slots: {
        tp$new: Sk.generic.new(Sk.builtin.classmethod),
        tp$init: function (args, kwargs) {
            Sk.abstr.noKwargs("classmethod", kwargs);
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


Sk.builtin.classmethod = function (callable) {
    // this can be used as an internal function 
    // typically callable will be set in the init method if being called by python
    this.cm$callable = callable;
};

Sk.abstr.setUpInheritance("classmethod", Sk.builtin.classmethod, Sk.builtin.object);

Sk.builtin.classmethod.prototype.tp$new = Sk.generic.new(Sk.builtin.classmethod);


Sk.builtin.classmethod.prototype.tp$init = function (args, kwargs) {
    Sk.abstr.noKwargs("classmethod", kwargs);
    Sk.abstr.checkArgsLen("classmethod", args, 1, 1);
    this.cm$callable = args[0];
    return Sk.builtin.none.none$;
};

Sk.builtin.classmethod.prototype.tp$doc = "classmethod(function) -> method\n\nConvert a function to be a class method.\n\nA class method receives the class as implicit first argument,\njust like an instance method receives the instance.\nTo declare a class method, use this idiom:\n\n  class C:\n      @classmethod\n      def f(cls, arg1, arg2, ...):\n          ...\n\nIt can be called either on the class (e.g. C.f()) or on an instance\n(e.g. C().f()).  The instance is ignored except for its class.\nIf a class method is called for a derived class, the derived class\nobject is passed as the implied first argument.\n\nClass methods are different than C++ or Java static methods.\nIf you want those, see the staticmethod builtin."


Sk.builtin.classmethod.prototype.tp$descr_get = function (obj, type) {
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

};


Sk.builtin.classmethod.prototype.tp$getsets = {
    __func__: {
        $get: function () { return this.cm$callable }
    }
}


/**
 * @constructor
 * @param {Sk.builtin.func} callable
 */

Sk.builtin.staticmethod = function (callable) {
    // this can be used as an internal function 
    // typically callable will be set in the init method if being called by python
    this.sm$callable = callable;
};

Sk.abstr.setUpInheritance("staticmethod", Sk.builtin.staticmethod, Sk.builtin.object);

Sk.builtin.staticmethod.prototype.tp$new = Sk.generic.new(Sk.builtin.staticmethod);

Sk.builtin.staticmethod.prototype.tp$init = function (args, kwargs) {
    Sk.abstr.noKwargs("staticmethod", kwargs);
    Sk.abstr.checkArgsLen("staticmethod", args, 1, 1);
    this.sm$callable = args[0];
    return Sk.builtin.none.none$;
};

Sk.builtin.staticmethod.prototype.tp$doc = "staticmethod(function) -> method\n\nConvert a function to be a static method.\n\nA static method does not receive an implicit first argument.\nTo declare a static method, use this idiom:\n\n     class C:\n         @staticmethod\n         def f(arg1, arg2, ...):\n             ...\n\nIt can be called either on the class (e.g. C.f()) or on an instance\n(e.g. C().f()).  The instance is ignored except for its class.\n\nStatic methods in Python are similar to those found in Java or C++.\nFor a more advanced concept, see the classmethod builtin."


Sk.builtin.staticmethod.prototype.tp$descr_get = function (obj, type) {
    if (this.sm$callable === undefined) {
        throw new Sk.builtin.RuntimeError("uninitialized staticmethod object")
    }

    return this.sm$callable;

};


Sk.builtin.staticmethod.prototype.tp$getsets = [
    new Sk.GetSetDef("__func__", function () { return this.sm$callable }),
];