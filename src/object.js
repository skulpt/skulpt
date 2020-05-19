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
Sk.builtin.object = function () { };

// now that object has been created we setup the base inheritances
// between type and object
Sk.abstr.setUpBaseInheritance();

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


Sk.builtin.object.prototype.tp$getattr = Sk.builtin.GenericGetAttr;
Sk.builtin.object.prototype.tp$setattr = Sk.builtin.GenericSetAttr;

Sk.builtin.object.prototype.$r = function () {
    const mod = this.ob$type.$typeLookup("__module__");
    let cname = "";
    if (mod && Sk.builtin.checkString(mod)) {
        cname = mod.v + ".";
    }
    return new Sk.builtin.str("<" + cname + Sk.abstr.typeName(this) + "'>");

};


Sk.builtin.object.prototype.tp$str = function () {
    // if we're calling this function then the object has no __str__ or tp$str defined
    const func = this.ob$type.$typeLookup(Sk.builtin.str.$repr);
    if (func instanceof Sk.builtin.wrapper_descriptor) {
        return func.d$wrapped.call(this);
    } else if (func !== undefined) {
        const res = Sk.misceval.callsimArray(func, [this]);
        if (!(Sk.builtin.checkString(res))) {
            throw new Sk.builtin.TypeError("__str__ returned non-string (type " + Sk.abstr.typeName(res) + ")")
        }
    }
    return res;
};


Sk.builtin.object.prototype.tp$hash = function () {
    if (!this.$savedHash_) {
        this.$savedHash_ = new Sk.builtin.int_(Sk.builtin.hashCount++);
    }
    return this.$savedHash_;
};


Sk.builtin.object.prototype.tp$richcompare = true;


Sk.builtin._tryGetSubscript = function (dict, pyName) {
    try {
        return dict.mp$subscript(pyName);
    } catch (x) {
        return undefined;
    }
};
Sk.exportSymbol("Sk.builtin._tryGetSubscript", Sk.builtin._tryGetSubscript);

Sk.builtin.object.prototype.tp$getsets = [
    new Sk.GetSetDef("__class__",
        function () {
            return this.ob$type;
        },
        function (value) {
            if (!Sk.builtin.checkClass(value)) {
                throw new Sk.builtin.TypeError("__class__ must be set to a class, not '" + Sk.abstr.typeName(value) + "' object");
            }
            if (!this.hp$type || !value.sk$klass) {
                throw new Sk.builtin.TypeError(" __class__ assignment only supported for heap types or ModuleType subclasses");
            }
            Object.setPrototypeOf(this, value.prototype);
            return;
        },
        "the object's class"
    )
];

Sk.builtin.object.prototype.tp$methods = [
    new Sk.MethodDef("__dir__",
    function __dir__ () {
        const dir = [];
        if (this.$d) {
            if (this.$d.ob$type === Sk.builtin.dict) {
                dir.concat(this.$d.$allkeys());
            } else {
                for (let key in this.$d) {
                    dir.push(new Sk.builtin.str(key));
                }
            } 
        }
        // for metattypes that override __dir__ we might need to check it's a list of str
        type_dir = this.ob$type.__dir__();
        type_dir.v.push(...dir);
        type_dir.v.sort((a,b) => a.v.localeCompare(b.v));
        return type_dir
    },
    {NoArgs: true}
    ,
    "Default dir() implementation."
    )
];



Sk.builtin.object.prototype.GenericPythonGetAttr = function (self, pyName) {
    if (!Sk.builtin.checkString(pyName)) {
        throw new Sk.builtin.TypeError("attribute name must be string, not '" + Sk.abstr.typeName(pyName) + "'");
    }
    var r = Sk.builtin.object.prototype.GenericGetAttr.call(self, pyName, true);
    if (r === undefined) {
        throw new Sk.builtin.AttributeError(pyName);
    }
    return r;
};
Sk.exportSymbol("Sk.builtin.object.prototype.GenericPythonGetAttr", Sk.builtin.object.prototype.GenericPythonGetAttr);


Sk.builtin.object.prototype.GenericPythonSetAttr = function (self, pyName, value) {
    if (!Sk.builtin.checkString(pyName)) {
        throw new Sk.builtin.TypeError("attribute name must be string, not '" + Sk.abstr.typeName(pyName) + "'");
    }
    return Sk.builtin.object.prototype.GenericSetAttr.call(self, pyName, value, true);
};
Sk.exportSymbol("Sk.builtin.object.prototype.GenericPythonSetAttr", Sk.builtin.object.prototype.GenericPythonSetAttr);

Sk.builtin.object.prototype.HashNotImplemented = function () {
    throw new Sk.builtin.TypeError("unhashable type: '" + Sk.abstr.typeName(this) + "'");
};



// Although actual attribute-getting happens in pure Javascript via tp$getattr, classes
// overriding __getattribute__ etc need to be able to call object.__getattribute__ etc from Python
Sk.builtin.object.prototype["__getattribute__"] = Sk.builtin.object.prototype.GenericPythonGetAttr;
Sk.builtin.object.prototype["__setattr__"] = Sk.builtin.object.prototype.GenericPythonSetAttr;




Sk.builtin.object.prototype["__format__"] = function (self, format_spec) {
    var formatstr;
    Sk.builtin.pyCheckArgsLen("__format__", arguments.length, 2, 2);

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

    return new Sk.builtin.str(self);
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
 * Return the hash value of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.int_} The hash value
 */

/**
 * Perform equality check between this instance and a Python object (i.e. this == other).
 *
 * Implements `__eq__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to check for equality.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if equal, false otherwise
 */
Sk.builtin.object.prototype.ob$eq = function (other) {
    if (this === other) {
        return Sk.builtin.bool.true$;
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Perform non-equality check between this instance and a Python object (i.e. this != other).
 *
 * Implements `__ne__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to check for non-equality.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if not equal, false otherwise
 */
Sk.builtin.object.prototype.ob$ne = function (other) {
    if (this === other) {
        return Sk.builtin.bool.false$;
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is less than a Python object (i.e. this < other).
 *
 * Implements `__lt__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if this < other, false otherwise
 */
Sk.builtin.object.prototype.ob$lt = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is less than or equal to a Python object (i.e. this <= other).
 *
 * Implements `__le__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if this <= other, false otherwise
 */
Sk.builtin.object.prototype.ob$le = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is greater than a Python object (i.e. this > other).
 *
 * Implements `__gt__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if this > other, false otherwise
 */
Sk.builtin.object.prototype.ob$gt = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is greater than or equal to a Python object (i.e. this >= other).
 *
 * Implements `__ge__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(Sk.builtin.bool|Sk.builtin.NotImplemented)} true if this >= other, false otherwise
 */
Sk.builtin.object.prototype.ob$ge = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

// Wrap the following functions in Sk.builtin.func once that class is initialized
/**
 * Array of all the Python functions which are methods of this class.
 * @type {Array}
 */
Sk.builtin.object.pythonFunctions = [];

/**
 * @constructor
 * Sk.builtin.none
 *
 * @extends {Sk.builtin.object}
 */
Sk.builtin.none = function () {
    this.v = null;
};
Sk.abstr.setUpInheritance("NoneType", Sk.builtin.none, Sk.builtin.object);

/** @override */
Sk.builtin.none.prototype.$r = function () { return new Sk.builtin.str("None"); };

/** @override */
Sk.builtin.none.prototype.tp$hash = function () {
    return new Sk.builtin.int_(0);
};

/**
 * Python None constant.
 * @type {Sk.builtin.none}
 */
Sk.builtin.none.none$ = new Sk.builtin.none();

/**
 * @constructor
 * Sk.builtin.NotImplemented
 *
 * @extends {Sk.builtin.object}
 */
Sk.builtin.NotImplemented = function () { };
Sk.abstr.setUpInheritance("NotImplementedType", Sk.builtin.NotImplemented, Sk.builtin.object);

/** @override */
Sk.builtin.NotImplemented.prototype.$r = function () { return new Sk.builtin.str("NotImplemented"); };

/**
 * Python NotImplemented constant.
 * @type {Sk.builtin.NotImplemented}
 */
Sk.builtin.NotImplemented.NotImplemented$ = new Sk.builtin.NotImplemented();

Sk.exportSymbol("Sk.builtin.none", Sk.builtin.none);
Sk.exportSymbol("Sk.builtin.NotImplemented", Sk.builtin.NotImplemented);



