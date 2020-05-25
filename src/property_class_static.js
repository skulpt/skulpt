/**
 * @constructor
 * @param {Sk.builtin.func} fget
 * @param {Sk.builtin.func} fset
 * @param {Sk.builtin.func} fdel
 * @param {Sk.builtin.str} doc
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
                throw new Sk.builtin.AttributeError("unreadable attribute");
            }
            return Sk.misceval.callsimArray(this.prop$get, [obj]);
        },
        tp$descr_set: function (obj, value) {
            let func;
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
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(func) + "' is not callable");
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
            $get: function () { return this.prop$get; }
        },
        fset: {
            $get: function () { return this.prop$set; }
        },
        fdel: {
            $get: function () { return this.prop$del; }
        },
        __doc__: {
            $get: function () { return this.prop$doc; }
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
                throw new Sk.builtin.RuntimeError("uninitialized classmethod object");
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
            $get: function () { return this.cm$callable; }
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
        this.sm$callable = callable;
        this.$d = new Sk.builtin.dict;
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
                throw new Sk.builtin.RuntimeError("uninitialized staticmethod object");
            }
            return this.sm$callable;
        }
    },
    getsets: {
        __func__: {
            $get: function () { return this.sm$callable; }
        },
        __dict__: Sk.generic.getSetDict,
    }
});