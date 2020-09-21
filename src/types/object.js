import {
    pyStr,
    pyInt,
    pyType,
    pyDict,
    pyModule,
    pyExc,
    pyCall,
    checkString,
    checkClass,
    checkNoArgs,
    genericGetAttr,
    genericSetAttr,
    objectLookupSpecial,
    objectIsTrue,
    setUpBuiltinMro,
    setUpInheritance,
    typeName,
} from "../internal";

/**
 *
 * @constructor
 *
 * @description
 * Constructor for Python object. All Python classes (builtin and user-defined)
 * should inherit from this class.
 *
 */
export class pyObject{}; 
// the only place we can really use classes - does nothing but enforce new
// we can't use classes anywhere else since we need to call the class constructor
// we can't use super to do that since we modify the prototypical chains!

Object.defineProperties(
    pyType.prototype,
    /**@lends {pyType.prototype}*/ {
        tp$base: { value: pyObject, writable: true },
    }
);

Object.defineProperties(
    pyObject.prototype,
    /**@lends {pyObject.prototype}*/ {
        ob$type: { value: pyObject, writable: true },
        tp$name: { value: "object", writable: true },
        tp$base: { value: undefined, writable: true },
        sk$object: { value: true },
        sk$attrError: {
            value() {
                return "'" + this.tp$name + "' object";
            },
            writable: true,
        },
        hp$type: { value: undefined, writable: true },
        toString: {
            value() {
                return this.tp$str().v;
            },
            writable: true,
        },
    }
);

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
    Object.setPrototypeOf(pyType.prototype, pyObject.prototype);
    Object.setPrototypeOf(pyType, pyType.prototype);
    Object.setPrototypeOf(pyObject, pyType.prototype);
    setUpBuiltinMro(pyType);
    setUpBuiltinMro(pyObject);
})();

/**
 * worth noting that we don't use the new api for object since descr_objects are not yet initialized
 * object, type, NoneType, NotImplemented,
 * slot_wrapper, methods_descriptor, getsets_desciptor, class_descriptor
 * will be fully initialized in the import.js doOneTimeInitialization
 * @ignore
 */

Object.assign(pyObject.prototype, {
    tp$doc: "The most base type",
    tp$new(args, kwargs) {
        // see cypthon object_new for algorithm details we do two versions one for prototypical and one for not
        if (args.length || (kwargs && kwargs.length)) {
            if (this.tp$new !== pyObject.prototype.tp$new) {
                throw new pyExc.TypeError("object.__new__() takes exactly one argument (the type to instantiate)");
            }
            if (this.tp$init === pyObject.prototype.tp$init) {
                throw new pyExc.TypeError(typeName(this) + "() takes no arguments");
            }
        }
        return new this.constructor();
    },
    tp$init(args, kwargs) {
        // see cypthon object_init for algorithm details
        if (args.length || (kwargs && kwargs.length)) {
            if (this.tp$init !== pyObject.prototype.tp$init) {
                throw new pyExc.TypeError("object.__init__() takes exactly one argument (the instance to initialize)");
            }
            if (this.tp$new === pyObject.prototype.tp$new) {
                throw new pyExc.TypeError(typeName(this) + ".__init__() takes exactly one argument (the instance to initialize)");
            }
        }
        return pyNone;
    },
    tp$getattr: genericGetAttr,
    tp$setattr: genericSetAttr,
    $r() {
        const mod = objectLookupSpecial(this, pyStr.$module);
        let cname = "";
        if (mod && checkString(mod)) {
            cname = mod.toString() + ".";
        }
        return new pyStr("<" + cname + typeName(this) + " object>");
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
        return new pyInt(hash);
    },
    tp$richcompare(other, op) {
        let res;
        switch (op) {
            case "Eq":
                res = this === other || pyNotImplemented;
                break;
            case "NotEq":
                // use tp$richcompare here... because CPython does. ob$eq breaks some tests for NotEq subclasses
                res = this.tp$richcompare(other, "Eq");
                if (res !== pyNotImplemented) {
                    res = !objectIsTrue(res);
                }
                break;
            default:
                res = pyNotImplemented;
        }
        return res;
    }
});

const hashMap = new Map();

pyObject.prototype.tp$getsets = {
    __class__: {
        $get() {
            return this.ob$type;
        },
        $set(value) {
            if (value === undefined) {
                throw new pyExc.TypeError("can't delete __class__ attribute");
            } else if (!checkClass(value)) {
                throw new pyExc.TypeError("__class__ must be set to a class, not '" + typeName(value) + "' object");
            }
            const oldto = this.ob$type;
            const newto = value;

            if (!(oldto.$isSubType(pyModule) && newto.$isSubType(pyModule)) && (oldto.sk$klass === undefined || newto.sk$klass === undefined)) {
                throw new pyExc.TypeError(" __class__ assignment only supported for heap types or ModuleType subclasses");
            } else if (value.prototype.sk$builtinBase !== this.sk$builtinBase) {
                throw new pyExc.TypeError(
                    "__class__ assignment: '" + typeName(this) + "' object layout differs from '" + value.prototype.tp$name + "'"
                );
            }
            Object.setPrototypeOf(this, value.prototype);
            return;
        },
        $doc: "the object's class",
    },
};

pyObject.prototype.tp$methods = {
    __dir__: {
        $meth: function __dir__() {
            let dir = [];
            if (this.$d) {
                if (this.$d instanceof pyDict) {
                    dir = this.$d.sk$asarray();
                } else {
                    for (let key in this.$d) {
                        dir.push(new pyStr(key));
                    }
                }
            }
            // here we use the type.__dir__ implementation
            const type_dir = pyCall(pyType.prototype.__dir__, [this.ob$type]);
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
            let formatstr;
            if (!checkString(format_spec)) {
                throw new pyExc.TypeError("format() argument 2 must be str, not " + typeName(format_spec));
            } else {
                formatstr = format_spec.toString();
                if (formatstr !== "") {
                    throw new pyNotImplementedTypeError("format spec is not yet implemented");
                }
            }
            return this.tp$str();
        },
        $flags: { OneArg: true },
        $doc: "Default object formatter.",
    },
};

/**
 * @constructor
 * pyNoneType
 * @extends {pyObject}
 *
 * @description
 * It would be rare to call this as a constructor since it returns {@link pyNone}
 */
export var pyNoneType = function NoneType() {
    return pyNone; // always return the same object
};
setUpInheritance("NoneType", pyNoneType, pyObject);

Object.defineProperties(pyNoneType.prototype, {
    valueOf: { value: () => null },
});

Object.assign(pyNoneType.prototype, {
    tp$new(args, kwargs) {
        checkNoArgs("NoneType", args, kwargs);
        return pyNone;
    },
    $r() {
        return new pyStr("None");
    },
    tp$as_number: true,
    nb$bool() {
        return false;
    },
});

Object.defineProperties(pyNoneType, {
    sk$acceptable_as_base_class: { value: false },
});

/**
 * Python None value.
 * @type {pyNoneType}
 * @member {pyNoneType}
 */
export const pyNone = /** @type {pyNoneType} */ (Object.create(pyNoneType.prototype, {
    v: { value: null, enumerable: true },
}));

/**
 * @constructor
 * pyNotImplementedType
 *
 * @extends {pyObject}
 */
export var pyNotImplementedType = function NotImplementedType() {
    return pyNotImplemented; // always return the same object
};
setUpInheritance("NotImplementedType", pyNotImplementedType, pyObject);

Object.assign(pyNotImplementedType.prototype, {
    tp$new(args, kwargs) {
        checkNoArgs("NotImplementedType", args, kwargs);
        return pyNotImplemented;
    },
    $r() {
        return new pyStr("NotImplemented");
    },
});

Object.defineProperties(pyNotImplementedType, {
    sk$acceptable_as_base_class: { value: false },
});

/**
 * Python NotImplemented constant.
 * @type {pyNotImplementedType}
 * @member {pyNotImplementedType}
 */
export const pyNotImplemented = /** @type {pyNotImplementedType} */ (Object.create(pyNotImplementedType.prototype, {
    v: { value: null, enumerable: true },
}));
