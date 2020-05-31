Sk.builtin.type_is_subtype_base_chain = function type_is_subtype_base_chain(a, b) {
    do {
        if (a == b) {
            return true;
        }
        a = a.prototype.tp$base;
    } while (a !== undefined);

    return b == Sk.builtin.object;
};

Sk.builtin.PyType_IsSubtype = function PyType_IsSubtype(a, b) {
    var mro = a.prototype.tp$mro;
    if (mro) {
        /* Deal with multiple inheritance without recursion
           by walking the MRO tuple */
        Sk.asserts.assert(Array.isArray(mro));
        for (let i = 0; i < mro.length; i++) {
            if (mro[i] == b) {
                return true;
            }
        }
        return false;
    } else {
        /* a is not completely initilized yet; follow tp_base */
        return Sk.builtin.type_is_subtype_base_chain(a, b);
    }
};

/**
 * @constructor
 * Sk.builtin.super_
 */
Sk.builtin.super_ = Sk.abstr.buildNativeClass("super", {
    constructor: function super_(a_type, self) {
        Sk.asserts.assert(this instanceof Sk.builtin.super_, "bad call to super, use 'new'");
    },
    slots: {
        tp$doc:
            "super(type, obj) -> bound super object; requires isinstance(obj, type)\n" +
            "super(type) -> unbound super object\n" +
            "super(type, type2) -> bound super object; requires issubclass(type2, type)\n" +
            "Typical use to call a cooperative superclass method:\n" +
            "class C(B):\n" +
            "    def meth(self, arg):\n" +
            "        super(C, self).meth(arg)",
        tp$new: Sk.generic.new,
        tp$init: function (args, kwargs) {
            Sk.abstr.checkNoKwargs("super", kwargs);
            Sk.abstr.checkArgsLen("super", args, 0, 2);
            const a_type = args[0];
            const other_self = args[1];
            if (!Sk.builtin.checkType(a_type)) {
                throw new Sk.builtin.TypeError("must be type, not " + Sk.abstr.typeName(a_type));
            }
            this.obj = other_self;
            this.type = a_type;
            if (this.obj != null) {
                this.obj_type = this.$super_check(a_type, obj);
            }

            if (!this.obj) {
                throw new Sk.builtin.NotImplementedError(
                    "unbound super not supported because " +
                        "skulpts implementation of type descriptors aren't brilliant yet, see this " +
                        "question for more information https://stackoverflow.com/a/30190341/117242"
                );
            }

            if (!this.obj.ob$type.$isSubType(this.type)) {
                throw new Sk.builtin.TypeError("super(type, obj): obj must be an instance of subtype of type");
            }

            return Sk.builtin.none.none$;
        },
        $r: function super_repr() {
            if (this.obj) {
                return new Sk.builtin.str("<super: <class '" + this.type.prototype.tp$name + "'>, <" + this.obj.prototype.tp$name + " object>>");
            }
            return new Sk.builtin.str("<super: <class '" + this.type.prototype.tp$name + "'>, NULL>");
        },
        tp$getattr: function (pyName, canSuspend) {
            debugger;
            let starttype = this.obj_type;
            if (starttype == null) {
                return Sk.generic.getAttr.call(this, pyName, canSuspend);
            }
            const mro = starttype.prototype.tp$mro;
            const n = mro.length;
            /* We want __class__ to return the class of the super object
            (i.e. super, or a subclass), not the class of su->obj. */
            if (pyName == Sk.builtin.str.$class) {
                return Sk.generic.getAttr.call(this, pyName, canSuspend);
            }
            /* No need to check the last one: it's gonna be skipped anyway.  */
            let i;
            for (i = 0; i + 1 < n; i++) {
                if (this.type === mro[i]) {
                    break;
                }
            }
            i++;
            if (i >= n) {
                return Sk.generic.getAttr.call(this, pyName, canSuspend);
            }
            const jsName = pyName.$jsstr();

            let tmp, res;
            while (i < n) {
                tmp = mro[i];
                res = tmp.prototype.hasOwnProperty(jsName);

                if (res !== undefined) {
                    const f = res.tp$descr_get;
                    if (f !== undefined) {
                        /* Only pass 'obj' param if this is instance-mode super
                               (See SF ID #743627)  */
                        tmp = f.call(res, this.obj === starttype ? null : this.obj, starttype);
                        res = tmp;
                    }
                    return res;
                }
                i++;
            }
        },
        tp$descr_get: function (obj, obtype) {
            if (obj == null || this.obj != null) {
                return this;
            }
            if (this.ob$type === Sk.builtin.super_) {
                /* If su is an instance of a (strict) subclass of super,
                call its type */
                return Sk.misceval.callsimOrSuspendArray(Sk.builtin.super_, [this.ob$type, obj]);
            } else {
                /* Inline the common case */
                const obj_type = this.$super_check(this.ob$type, obj);
                const newobj = new Sk.builtin.super_();
                newobj.type = this.ob$type;
                newobj.obj = obj;
                newobj.obj_type = obj_type;
                return newobj;
            }
        },
    },
    getsets: {
        __thisclass__: {
            $get: function () {
                return this.type;
            },
            $doc: "the class invoking super()",
        },
        __self__: {
            $get: function () {
                return this.obj || Sk.builtin.none.none$;
            },
            $doc: "the instance invoking super(); may be None",
        },
        __self_class__: {
            $get: function () {
                return this.obj_type || Sk.builtin.none.none$;
            },
            $doc: "the type of the instance invoking super(); may be None",
        },
    },
    proto: {
        $supercheck: function (type, obj) {
            /* Check that a super() call makes sense.  Return a type object.

            obj can be a class, or an instance of one:

            - If it is a class, it must be a subclass of 'type'.      This case is
                used for class methods; the return value is obj.

            - If it is an instance, it must be an instance of 'type'.  This is
                the normal case; the return value is obj.__class__.

            /* Check for first bullet above (special case) */
            if (Sk.builin.checkType(obj) && obj.ob$type.$isSubType(type)) {
                return obj;
            }
            /* Normal case */
            if (obj.ob$type.$isSubType(type)) {
                return obj.ob$type;
            } else {
                /* Try the slow way */
                /* Cpython has a slow way buy i'm not sure we need it */
            }
            throw new Sk.builtin.TypeError("super(type, obj): obj must be an instance or subtype of type");
        },
    },
});
