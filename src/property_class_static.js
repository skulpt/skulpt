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
        this.getter$doc = fget && !doc;
        this.prop$doc = doc || (fget && fget.$doc) || Sk.builtin.none.none$;
    },
    slots: {
        tp$getattr: Sk.generic.getAttr,
        tp$new: Sk.generic.new,
        tp$init(args, kwargs) {
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
                this.getter$doc = true;
                if (!Sk.builtin.checkNone(args[0])) {
                    this.prop$doc = args[0].$doc || args[3];
                }
            } else {
                this.prop$doc = args[3];
            }
            if (this.ob$type !== Sk.builtin.property) {
                this.tp$setattr(Sk.builtin.str.$doc, this.prop$doc);
            }
        },
        tp$doc:
            "Property attribute.\n\n  fget\n    function to be used for getting an attribute value\n  fset\n    function to be used for setting an attribute value\n  fdel\n    function to be used for del'ing an attribute\n  doc\n    docstring\n\nTypical use is to define a managed attribute x:\n\nclass C(object):\n    def getx(self): return self._x\n    def setx(self, value): self._x = value\n    def delx(self): del self._x\n    x = property(getx, setx, delx, 'I'm the 'x' property.')\n\nDecorators make defining new properties or modifying existing ones easy:\n\nclass C(object):\n    @property\n    def x(self):\n        'I am the 'x' property.'\n        return self._x\n    @x.setter\n    def x(self, value):\n        self._x = value\n    @x.deleter\n    def x(self):\n        del self._x",
        tp$descr_get(obj, type, canSuspend) {
            if (obj === null) {
                return this;
            }
            if (this.prop$get === undefined) {
                throw new Sk.builtin.AttributeError("unreadable attribute");
            }
            const rv = Sk.misceval.callsimOrSuspendArray(this.prop$get, [obj]);
            return canSuspend ? rv : Sk.misceval.retryOptionalSuspensionOrThrow(rv);
        },
        tp$descr_set(obj, value, canSuspend) {
            let func;
            if (value == null) {
                func = this.prop$del;
            } else {
                func = this.prop$set;
            }
            if (Sk.builtin.checkNone(func)) {
                const msg = value == null ? "delete" : "set";
                throw new Sk.builtin.AttributeError("can't " + msg + " attribute");
            }
            if (!func.tp$call) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(func) + "' is not callable");
            }

            let rv;
            if (value == null) {
                rv = func.tp$call([obj]);
            } else {
                rv = func.tp$call([obj, value]);
            }
            return canSuspend ? rv : Sk.misceval.retryOptionalSuspensionOrThrow(rv);
        },
    },
    methods: {
        getter: {
            $meth(fget) {
                return this.$copy([fget, this.prop$set, this.prop$del]);
            },
            $flags: { OneArg: true },
        },
        setter: {
            $meth(fset) {
                return this.$copy([this.prop$get, fset, this.prop$del]);
            },
            $flags: { OneArg: true },
        },
        deleter: {
            $meth(fdel) {
                return this.$copy([this.prop$get, this.prop$set, fdel]);
            },
            $flags: { OneArg: true },
        },
    },
    getsets: {
        fget: {
            $get() {
                return this.prop$get;
            },
        },
        fset: {
            $get() {
                return this.prop$set;
            },
        },
        fdel: {
            $get() {
                return this.prop$del;
            },
        },
        __doc__: {
            $get() {
                return this.prop$doc;
            },
            $set(value) {
                value = value || Sk.builtin.none.none$;
                this.prop$doc = value;
            }
        },
    },
    proto: {
        $copy(args) {
            const type = this.ob$type;
            if (!this.getter$doc) {
                args.push(this.prop$doc);
            }
            if (type === Sk.builtin.property) {
                return new type(...args);
            } else {
                return type.tp$call(args);
            }
        }
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
        this.$d = new Sk.builtin.dict();
    },
    slots: {
        tp$getattr: Sk.generic.getAttr,
        tp$new: Sk.generic.new,
        tp$init(args, kwargs) {
            Sk.abstr.checkNoKwargs("classmethod", kwargs);
            Sk.abstr.checkArgsLen("classmethod", args, 1, 1);
            this.cm$callable = args[0];
        },
        tp$doc:
            "classmethod(function) -> method\n\nConvert a function to be a class method.\n\nA class method receives the class as implicit first argument,\njust like an instance method receives the instance.\nTo declare a class method, use this idiom:\n\n  class C:\n      @classmethod\n      def f(cls, arg1, arg2, ...):\n          ...\n\nIt can be called either on the class (e.g. C.f()) or on an instance\n(e.g. C().f()).  The instance is ignored except for its class.\nIf a class method is called for a derived class, the derived class\nobject is passed as the implied first argument.\n\nClass methods are different than C++ or Java static methods.\nIf you want those, see the staticmethod builtin.",
        tp$descr_get(obj, type, canSuspend) {
            const callable = this.cm$callable;
            if (callable === undefined) {
                throw new Sk.builtin.RuntimeError("uninitialized classmethod object");
            }
            if (type === undefined) {
                type = obj.ob$type;
            }
            const f = callable.tp$descr_get;
            if (f) {
                return f.call(callable, type, canSuspend);
            }
            return new Sk.builtin.method(callable, type);
        },
    },
    getsets: {
        __func__: {
            $get() {
                return this.cm$callable;
            },
        },
        __dict__: Sk.generic.getSetDict,
    },
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
        this.$d = new Sk.builtin.dict();
    },
    slots: {
        tp$getattr: Sk.generic.getAttr,
        tp$new: Sk.generic.new,
        tp$init(args, kwargs) {
            Sk.abstr.checkNoKwargs("staticmethod", kwargs);
            Sk.abstr.checkArgsLen("staticmethod", args, 1, 1);
            this.sm$callable = args[0];
        },
        tp$doc:
            "staticmethod(function) -> method\n\nConvert a function to be a static method.\n\nA static method does not receive an implicit first argument.\nTo declare a static method, use this idiom:\n\n     class C:\n         @staticmethod\n         def f(arg1, arg2, ...):\n             ...\n\nIt can be called either on the class (e.g. C.f()) or on an instance\n(e.g. C().f()).  The instance is ignored except for its class.\n\nStatic methods in Python are similar to those found in Java or C++.\nFor a more advanced concept, see the classmethod builtin.",
        tp$descr_get(obj, type) {
            if (this.sm$callable === undefined) {
                throw new Sk.builtin.RuntimeError("uninitialized staticmethod object");
            }
            return this.sm$callable;
        },
    },
    getsets: {
        __func__: {
            $get() {
                return this.sm$callable;
            },
        },
        __dict__: Sk.generic.getSetDict,
    },
});
