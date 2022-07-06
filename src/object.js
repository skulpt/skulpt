const hashMap = new WeakMap();
/**
 *
 * @constructor
 *
 * @description
 * Constructor for Python object. All Python classes (builtin and user-defined)
 * should inherit from this class.
 *
 */
Sk.builtin.object = Sk.abstr.buildNativeClass("object", {
    constructor: function object() {
        Sk.asserts.assert(this instanceof Sk.builtin.object, "bad call to object, use 'new'");
    },
    base: null,
    slots: {
        tp$new(args, kwargs) {
            // see cypthon object_new for algorithm details we do two versions one for prototypical and one for not
            if (args.length || (kwargs && kwargs.length)) {
                if (this.tp$new !== Sk.builtin.object.prototype.tp$new) {
                    throw new Sk.builtin.TypeError("object.__new__() takes exactly one argument (the type to instantiate)");
                }
                if (this.tp$init === Sk.builtin.object.prototype.tp$init) {
                    throw new Sk.builtin.TypeError(Sk.abstr.typeName(this) + "() takes no arguments");
                }
            }
            return new this.constructor();
        },
        tp$init(args, kwargs) {
            // see cypthon object_init for algorithm details
            if (args.length || (kwargs && kwargs.length)) {
                if (this.tp$init !== Sk.builtin.object.prototype.tp$init) {
                    throw new Sk.builtin.TypeError("object.__init__() takes exactly one argument (the instance to initialize)");
                }
                if (this.tp$new === Sk.builtin.object.prototype.tp$new) {
                    throw new Sk.builtin.TypeError(Sk.abstr.typeName(this) + ".__init__() takes exactly one argument (the instance to initialize)");
                }
            }
        },
        tp$getattr: Sk.generic.getAttr,
        tp$setattr: Sk.generic.setAttr,
        $r() {
            const mod = Sk.abstr.lookupSpecial(this, Sk.builtin.str.$module);
            let cname = "";
            if (mod && Sk.builtin.checkString(mod)) {
                cname = mod.v + ".";
            }
            return new Sk.builtin.str("<" + cname + Sk.abstr.typeName(this) + " object>");
        },
        tp$str() {
            // if we're calling this function then the object has no __str__ or tp$str defined
            return this.$r();
        },
        tp$hash() {
            let hash = hashMap.get(this);
            if (hash !== undefined) {
                return hash;
            }
            hash = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER - Number.MAX_SAFE_INTEGER / 2);
            hashMap.set(this, hash);
            return hash;
        },
        tp$richcompare(other, op) {
            let res;
            switch (op) {
                case "Eq":
                    res = this === other || Sk.builtin.NotImplemented.NotImplemented$;
                    break;
                case "NotEq":
                    res = this.ob$eq(other, "Eq");
                    if (res !== Sk.builtin.NotImplemented.NotImplemented$) {
                        res = !Sk.misceval.isTrue(res);
                    }
                    break;
                default:
                    res = Sk.builtin.NotImplemented.NotImplemented$;
            }
            return res;
        },
        tp$doc: "The most base type",
    },
    getsets: {
        __class__: {
            $get() {
                return this.ob$type;
            },
            $set(value) {
                if (value === undefined) {
                    throw new Sk.builtin.TypeError("can't delete __class__ attribute");
                } else if (!Sk.builtin.checkClass(value)) {
                    throw new Sk.builtin.TypeError("__class__ must be set to a class, not '" + Sk.abstr.typeName(value) + "' object");
                }
                const oldto = this.ob$type;
                const newto = value;

                if (
                    !(oldto.$isSubType(Sk.builtin.module) && newto.$isSubType(Sk.builtin.module)) &&
                    (oldto.prototype.ht$type === undefined || newto.prototype.ht$type === undefined)
                ) {
                    throw new Sk.builtin.TypeError(" __class__ assignment only supported for heap types or ModuleType subclasses");
                }
                checkCompatibleForAssignment(oldto, newto);
                Object.setPrototypeOf(this, value.prototype);
            },
            $doc: "the object's class",
        },
    },
    methods: {
        __dir__: {
            $meth: function __dir__() {
                let dir = [];
                if (this.$d) {
                    if (this.$d instanceof Sk.builtin.dict) {
                        dir = this.$d.sk$asarray();
                    } else {
                        for (let key in this.$d) {
                            dir.push(new Sk.builtin.str(key));
                        }
                    }
                }
                // here we use the type.__dir__ implementation
                const type_dir = Sk.misceval.callsimArray(Sk.builtin.type.prototype.__dir__, [this.ob$type]);
                // put the dict keys before the prototype keys
                dir.push(...type_dir.v);
                type_dir.v = dir;
                return type_dir;
            },
            $flags: { NoArgs: true },
            $doc: "Default dir() implementation.",
        },
        __format__: {
            $meth(format_spec) {
                if (!Sk.builtin.checkString(format_spec)) {
                    throw new Sk.builtin.TypeError("__format__() argument must be str, not " + Sk.abstr.typeName(format_spec));
                } else if (format_spec !== Sk.builtin.str.$empty) {
                    throw new Sk.builtin.TypeError(`unsupported format string passed to ${Sk.abstr.typeName(this)}.__format__`);
                }
                return this.tp$str();
            },
            $flags: { OneArg: true },
            $doc: "Default object formatter.",
        },
    },
    classmethods: {
        __init_subclass__: {
            $meth(args) {
                return Sk.builtin.none.none$;
            },
            $flags: { FastCall: true, NoKwargs: true },
        },
    },
    proto: /**@lends {Sk.builtin.object.prototype}*/ {
        valueOf: Object.prototype.valueOf,
        toString() {
            return this.tp$str().v;
        },
        hasOwnProperty: Object.prototype.hasOwnProperty,
        ht$type: undefined,
        // private method used for error messages
        sk$attrError() {
            return "'" + this.tp$name + "' object";
        },
    },
});

/**
 * @description
 * We aim to match python and javascript inheritance like
 * type   instanceof object => true
 * object instanceof type   => true
 * type   instanceof type   => true
 * object instanceof object => true
 *
 * type   subclassof object => type.prototype   instanceof object => true
 * object subclassof type   => object.prototype instanceof type   => false
 *
 * this algorithm achieves the equivalent with the following prototypical chains
 * using `Object.setPrototypeOf`
 *
 * ```
 * type.__proto__             = type.prototype   (type   instanceof type  )
 * type.__proto__.__proto__   = object.prototype (type   instanceof object)
 * type.prototype.__proto__   = object.prototype (type   subclassof object)
 * object.__proto__           = type.prototype   (object instanceof type  )
 * object.__proto__.__proto__ = object.prototype (object instanceof object)
 * ```
 *
 * while `Object.setPrototypeOf` is not considered [good practice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf)
 * this is a particularly unique use case and creates a lot of prototypical benefits
 * all single inheritance classes (i.e. all builtins) now follow prototypical inheritance
 * similarly it makes metclasses that much easier to implement
 * Object.setPrototypeOf is also a feature built into the javascript language
 *
 * @ignore
 */
(function setUpBaseInheritance() {
    Sk.abstr.setUpInheritance("type", Sk.builtin.type, Sk.builtin.object);
    Sk.abstr.setUpBuiltinMro(Sk.builtin.type);
})();

function compatibleWithTpBase(child) {
    const childProto = child.prototype;
    const parent = childProto.tp$base;
    if (parent == null) {
        return false;
    }
    const parentProto = parent.prototype;
    if (parent.sk$solidSlotBase || child.sk$solidSlotBase) {
        return false;
    } else if (parentProto.sk$hasDict !== childProto.sk$hasDict) {
        return false;
    } else if (parent.sk$solidBase && parent !== Sk.builtin.module) {
        return false;
    }
    return true;
}

function sameSlotsAdded(a, b) {
    const aProto = a.prototype;
    const bProto = b.prototype;
    const aSlots = aProto.ht$slots;
    const bSlots = bProto.ht$slots;
    if (aProto.sk$hasDict !== bProto.sk$hasDict) {
        return false;
    }
    if (aSlots === bSlots) {
        return true;
    } else if (aSlots && bSlots) {
        return aSlots.length === bSlots.length && aSlots.every((s, i) => s === bSlots[i]);
    }
    return (aSlots && (aSlots.length || null)) === (bSlots && (bSlots.length || null));
}

function checkCompatibleForAssignment(newto, oldto) {
    let newbase = newto;
    let oldbase = oldto;

    while (compatibleWithTpBase(newbase)) {
        newbase = newbase.prototype.tp$base;
    }
    while (compatibleWithTpBase(oldbase)) {
        oldbase = oldbase.prototype.tp$base;
    }
    if (
        newbase !== oldbase &&
        (newbase.prototype.tp$base !== oldbase.prototype.tp$base || !sameSlotsAdded(newbase, oldbase))
    ) {
        throw new Sk.builtin.TypeError(
            "__class__ assignment: '" +
                oldto.prototype.tp$name +
                "' object layout differs from '" +
                newto.prototype.tp$name +
                "'"
        );
    }
}