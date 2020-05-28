/**
 * @constructor
 * Sk.builtin.object
 *
 * @description
 * Constructor for Python object. All Python classes (builtin and user-defined)
 * should inherit from this class.
 *
 * @return {Sk.builtin.object} Python object
 */
Sk.builtin.object = function object() {
    Sk.asserts.assert(this instanceof Sk.builtin.object);
};

// now that object has been created we setup the base inheritances
// between type and object
Sk.abstr.setUpBaseInheritance();

/**
 * worth noting that don't use the new api for object since descr_objects are not yet initialized
 * slot_wrappers, methods and getsets will be created in the import one time initialization
 */

Sk.builtin.object.prototype.tp$doc = "The most base type";

Sk.builtin.object.prototype.tp$new = function (args, kwargs) {
    // see cypthon object_new for algorithm details
    const type_obj = this.ob$type;
    if ((args && args.length) || (kwargs && kwargs.length)) {
        if (type_obj.prototype.tp$new !== Sk.builtin.object.prototype.tp$new) {
            throw new Sk.builtin.TypeError("object.__new__() takes exactly one argument (the type to instantiate)");
        }
        if (type_obj.prototype.tp$init === Sk.builtin.object.prototype.tp$init) {
            throw new Sk.builtin.TypeError(Sk.abstr.typeName(this) + "() takes no arguments");
        }
    }
    return new this.constructor;
};

Sk.builtin.object.prototype.tp$init = function (args, kwargs) {
    // see cypthon object_init for algorithm details
    const type_obj = this.ob$type;
    if ((args && args.length) || (kwargs && kwargs.length)) {
        if (type_obj.prototype.tp$init !== Sk.builtin.object.prototype.tp$init) {
            throw new Sk.builtin.TypeError("object.__init__() takes exactly one argument (the instance to initialize)");
        }
        if (type_obj.prototype.tp$new === Sk.builtin.object.prototype.tp$new) {
            throw new Sk.builtin.TypeError(Sk.abstr.typeName(this) + ".__init__() takes exactly one argument (the instance to initialize)");
        }
    }
    return Sk.builtin.none.none$;
};


Sk.builtin.object.prototype.tp$getattr = Sk.generic.getAttr;
Sk.builtin.object.prototype.tp$setattr = Sk.generic.setAttr;

Sk.builtin.object.prototype.$r = function () {
    const mod = this.ob$type.$typeLookup("__module__");
    let cname = "";
    if (mod && Sk.builtin.checkString(mod)) {
        cname = mod.v + ".";
    }
    return new Sk.builtin.str("<" + cname + Sk.abstr.typeName(this) + " object>");

};


Sk.builtin.object.prototype.tp$str = function () {
    // if we're calling this function then the object has no __str__ or tp$str defined
    return this.$r();
};

/**
 * Return the hash value of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.int_} The hash value
 */

Sk.builtin.object.prototype.tp$hash = function () {
    if (!this.$savedHash_) {
        this.$savedHash_ = new Sk.builtin.int_(Sk.builtin.hashCount++);
    }
    return this.$savedHash_;
};

Sk.builtin.object.prototype.tp$richcompare = function (other, op) {
    let res;
    switch (op) {
        case "Eq":
            res = this === other || Sk.builtin.NotImplemented.NotImplemented$;
            break;
        case "NotEq":
            // us ob$eq rather than tp$richcompare
            res = this.ob$eq(other);
            if (res && res !== Sk.builtin.NotImplemented.NotImplemented$) {
                res = Sk.misceval.isTrue(res);
            }
            break;
        default:
            res = Sk.builtin.NotImplemented.NotImplemented$;
    }
    return res;
};


Sk.builtin.object.prototype.tp$getsets = {
    __class__: {
        $get: function () {
            return this.ob$type;
        },
        $set: function (value) {
            if (!Sk.builtin.checkClass(value)) {
                throw new Sk.builtin.TypeError("__class__ must be set to a class, not '" + Sk.abstr.typeName(value) + "' object");
            }
            if (!this.hp$type || !value.sk$klass) {
                throw new Sk.builtin.TypeError(" __class__ assignment only supported for heap types or ModuleType subclasses");
            }
            Object.setPrototypeOf(this, value.prototype);
            return;
        },
        $doc: "the object's class"
    }
};

// Although actual attribute-getting happens in pure Javascript via tp$getattr, classes
// overriding __getattribute__ etc need to be able to call object.__getattribute__ etc from Python
Sk.builtin.object.prototype["__getattribute__"] = Sk.generic.pythonGetAttr;
Sk.builtin.object.prototype["__setattr__"] = Sk.generic.pythonSetAttr;


Sk.builtin.object.prototype.tp$methods = {
    __dir__: {
        $meth: function __dir__() {
            const dir = [];
            if (this.$d) {
                if (this.$d instanceof Sk.builtin.dict) {
                    dir.concat(this.$d.sk$asarray());
                } else {
                    for (let key in this.$d) {
                        dir.push(new Sk.builtin.str(key));
                    }
                }
            }
            // here we use the type.__dir__ implementation
            const type_dir = Sk.misceval.callsimArray(Sk.builtin.type.prototype.__dir__, [this.ob$type]);
            type_dir.v.push(...dir);
            type_dir.v.sort((a, b) => a.v.localeCompare(b.v));
            return type_dir;
        },
        $flags: { NoArgs: true },
        $doc: "Default dir() implementation."
    },
    __format__: {
        $meth: function (format_spec) {
            let formatstr;
            if (!Sk.builtin.checkString(format_spec)) {
                if (Sk.__future__.exceptions) {
                    throw new Sk.builtin.TypeError("format() argument 2 must be str, not " + Sk.abstr.typeName(format_spec));
                } else {
                    throw new Sk.builtin.TypeError("format expects arg 2 to be string or unicode, not " + Sk.abstr.typeName(format_spec));
                }
            } else {
                formatstr = Sk.ffi.remapToJs(format_spec);
                if (formatstr !== "") {
                    throw new Sk.builtin.NotImplementedError("format spec is not yet implemented");
                }
            }
            return new Sk.builtin.str(this);
        },
        $flags: { OneArg: true },
        $doc: "Default object formatter."
    }
};

/** Default implementations of Javascript functions used in dunder methods */

/**
 * Return the string representation of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @name  $r
 * @memberOf Sk.builtin.object.prototype
 * @return {Sk.builtin.str} The Python string representation of this instance.
 */

Sk.builtin.hashCount = 1;
Sk.builtin.idCount = 1;

/**
 * @constructor
 * Sk.builtin.none
 * @extends {Sk.builtin.object}
 */
Sk.builtin.none = function () {
    return Sk.builtin.none.none$; // always return the same object
};
Sk.abstr.setUpInheritance("NoneType", Sk.builtin.none, Sk.builtin.object);

/** @override */
Sk.builtin.none.prototype.$r = function () { return new Sk.builtin.str("None"); };

/** @override */
Sk.builtin.none.prototype.tp$hash = function () {
    return new Sk.builtin.int_(0);
};


Sk.builtin.none.prototype.tp$new = function (args, kwargs) {
    Sk.abstr.checkNoArgs("NoneType", args, kwargs);
    return Sk.builtin.none.none$;
};

/**
 * Python None value.
 * @type {Sk.builtin.none}
 */
Sk.builtin.none.none$ = Object.create(Sk.builtin.none.prototype, { v: { value: null, enumerable: true } });

/**
 * @constructor
 * Sk.builtin.NotImplemented
 *
 * @extends {Sk.builtin.object}
 */
Sk.builtin.NotImplemented = function () {
    return Sk.builtin.NotImplemented.NotImplemented$; // always return the same object 
};

Sk.abstr.setUpInheritance("NotImplementedType", Sk.builtin.NotImplemented, Sk.builtin.object);

/** @override */
Sk.builtin.NotImplemented.prototype.$r = function () { return new Sk.builtin.str("NotImplemented"); };

Sk.builtin.NotImplemented.prototype.tp$new = function (args, kwargs) {
    Sk.abstr.checkNoArgs("NotImplementedType", args, kwargs);
    return Sk.builtin.NotImplemented.NotImplemented$;
};
/**
 * Python NotImplemented constant.
 * @type {Sk.builtin.NotImplemented}
 */
Sk.builtin.NotImplemented.NotImplemented$ = Object.create(Sk.builtin.NotImplemented.prototype, { v: { value: null, enumerable: true } });


Sk.exportSymbol("Sk.builtin.none", Sk.builtin.none);
Sk.exportSymbol("Sk.builtin.NotImplemented", Sk.builtin.NotImplemented);
