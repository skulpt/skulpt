/**
 * @constructor
 * Sk.builtin.super_
 */
Sk.builtin.super_ = Sk.abstr.buildNativeClass("super", {
    constructor: function super_(a_type, other_self) {
        // internally we never use this method
        Sk.asserts.assert(this instanceof Sk.builtin.super_, "bad call to super, use 'new'");
        // internal calls can use this method but it 
        this.type = a_type;
        this.obj = other_self;
        if (a_type !== undefined) {
            if (!Sk.builtin.checkClass(a_type)) {
                throw new Sk.builtin.TypeError("must be type, not " + Sk.abstr.typeName(a_type));
            }
        }
        if (this.obj !== undefined) {
            this.obj_type = this.$supercheck(a_type, this.obj);
        } else {
            this.obj_type = null;
        }
    },
    slots: {
        tp$doc:
            "super() -> same as super(__class__, <first argument>)\n" +
            "super(type) -> unbound super object\nsuper(type, obj) -> bound super object; requires isinstance(obj, type)\n"+
            "super(type, type2) -> bound super object; requires issubclass(type2, type)\n"+
            "Typical use to call a cooperative superclass method:\n"+
            "class C(B):\n    def meth(self, arg):\n        super().meth(arg)\nThis works for class methods too:\nclass C(B):\n    @classmethod\n    def cmeth(cls, arg):\n        super().cmeth(arg)\n",
        tp$new: Sk.generic.new,
        tp$init(args, kwargs) {
            Sk.abstr.checkNoKwargs("super", kwargs);
            Sk.abstr.checkArgsLen("super", args, 1, 2);
            const a_type = args[0];
            const other_self = args[1];
            if (!Sk.builtin.checkClass(a_type)) {
                throw new Sk.builtin.TypeError("must be type, not " + Sk.abstr.typeName(a_type));
            }
            this.obj = other_self;
            this.type = a_type;
            if (this.obj != null) {
                this.obj_type = this.$supercheck(a_type, this.obj);
            }
        },
        $r() {
            if (this.obj) {
                return new Sk.builtin.str("<super: <class '" + this.type.prototype.tp$name + "'>, <" + Sk.abstr.typeName(this.obj) + " object>>");
            }
            return new Sk.builtin.str("<super: <class '" + this.type.prototype.tp$name + "'>, NULL>");
        },
        tp$getattr(pyName, canSuspend) {
            let starttype = this.obj_type;
            if (starttype == null) {
                return Sk.generic.getAttr.call(this, pyName, canSuspend);
            }
            const mro = starttype.prototype.tp$mro;
            const n = mro.length;
            /* We want __class__ to return the class of the super object
            (i.e. super, or a subclass), not the class of su->obj. */
            if (pyName === Sk.builtin.str.$class) {
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
            const jsName = pyName.$mangled;

            let tmp, res;
            while (i < n) {
                tmp = mro[i].prototype;
                if (tmp.hasOwnProperty(jsName)) {
                    res = tmp[jsName];
                }

                if (res !== undefined) {
                    const f = res.tp$descr_get;
                    if (f !== undefined) {
                        /* Only pass 'obj' param if this is instance-mode super
                               (See SF ID #743627)  */
                        res = f.call(res, this.obj === starttype ? null : this.obj, starttype);
                    }
                    return res;
                }
                i++;
            }
        },
        tp$descr_get(obj, obtype) {
            if (obj === null || this.obj != null) {
                return this;
            }
            if (this.ob$type !== Sk.builtin.super_) {
                /* If su is an instance of a (strict) subclass of super,
                call its type */
                return Sk.misceval.callsimOrSuspendArray(this.ob$type, [this.type, obj]);
            } else {
                /* Inline the common case */
                const obj_type = this.$supercheck(this.type, obj);
                const newobj = new Sk.builtin.super_();
                newobj.type = this.type;
                newobj.obj = obj;
                newobj.obj_type = obj_type;
                return newobj;
            }
        },
    },
    getsets: {
        __thisclass__: {
            $get() {
                return this.type;
            },
            $doc: "the class invoking super()",
        },
        __self__: {
            $get() {
                return this.obj || Sk.builtin.none.none$;
            },
            $doc: "the instance invoking super(); may be None",
        },
        __self_class__: {
            $get() {
                return this.obj_type || Sk.builtin.none.none$;
            },
            $doc: "the type of the instance invoking super(); may be None",
        },
    },
    proto: {
        $supercheck(type, obj) {
            /* Check that a super() call makes sense.  Return a type object.

            obj can be a class, or an instance of one:

            - If it is a class, it must be a subclass of 'type'.      This case is
                used for class methods; the return value is obj.

            - If it is an instance, it must be an instance of 'type'.  This is
                the normal case; the return value is obj.__class__.

            /* Check for first bullet above (special case) */
            if (Sk.builtin.checkClass(obj) && obj.$isSubType(type)) {
                return obj;
            }
            /* Normal case */
            if (obj.ob$type.$isSubType(type)) {
                return obj.ob$type;
            } else {
                /* Try the slow way */
                const class_attr = obj.tp$getattr(Sk.builtin.str.$class);
                if (class_attr !== undefined && class_attr !== obj.ob$type && Sk.builtin.checkClass(class_attr)) {
                    if (class_attr.$isSubType(type)) {
                        return class_attr;
                    }
                }
            }
            throw new Sk.builtin.TypeError("super(type, obj): obj must be an instance or subtype of type");
        },
    },
});