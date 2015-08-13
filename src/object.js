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
Sk.builtin.object = function () {
    if (!(this instanceof Sk.builtin.object)) {
        return new Sk.builtin.object();
    }


    return this;
};




/**
 * @return {undefined}
 */
Sk.builtin.object.prototype.GenericGetAttr = function (name) {
    var res;
    var f;
    var descr;
    var tp;
    var dict;
    var pyName = new Sk.builtin.str(name);
    goog.asserts.assert(typeof name === "string");

    tp = this.ob$type;
    goog.asserts.assert(tp !== undefined, "object has no ob$type!");

    dict = this["$d"] || this.constructor["$d"];

    // todo; assert? force?
    if (dict) {
        if (dict.mp$lookup) {
            res = dict.mp$lookup(pyName);
        } else if (dict.mp$subscript) {
            try {
                res = dict.mp$subscript(pyName);
            } catch (x) {
                res = undefined;
            }
        } else if (typeof dict === "object") {
            // todo; definitely the wrong place for this. other custom tp$getattr won't work on object -- bnm -- implemented custom __getattr__ in abstract.js
            res = dict[name];
        }
        if (res !== undefined) {
            return res;
        }
    }

    descr = Sk.builtin.type.typeLookup(tp, name);

    // otherwise, look in the type for a descr
    if (descr !== undefined && descr !== null && descr.ob$type !== undefined) {
        f = descr.ob$type.tp$descr_get;
        // todo;
        //if (f && descr.tp$descr_set) // is a data descriptor if it has a set
        //return f.call(descr, this, this.ob$type);
    }

    if (f) {
        // non-data descriptor
        return f.call(descr, this, this.ob$type);
    }

    if (descr !== undefined) {
        return descr;
    }

    return undefined;
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericGetAttr", Sk.builtin.object.prototype.GenericGetAttr);

Sk.builtin.object.prototype.GenericPythonGetAttr = function(self, name) {
    return Sk.builtin.object.prototype.GenericGetAttr.call(self, name.v);
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericPythonGetAttr", Sk.builtin.object.prototype.GenericPythonGetAttr);

Sk.builtin.object.prototype.GenericSetAttr = function (name, value) {
    var objname = Sk.abstr.typeName(this);
    var pyname;
    var dict;
    goog.asserts.assert(typeof name === "string");
    // todo; lots o' stuff

    dict = this["$d"] || this.constructor["$d"];

    if (dict.mp$ass_subscript) {
        pyname = new Sk.builtin.str(name);

        if (this instanceof Sk.builtin.object && !(this.ob$type.sk$klass) &&
            dict.mp$lookup(pyname) === undefined) {
            // Cannot add new attributes to a builtin object
            throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + name + "'");
        }
        dict.mp$ass_subscript(new Sk.builtin.str(name), value);
    } else if (typeof dict === "object") {
        dict[name] = value;
    }
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericSetAttr", Sk.builtin.object.prototype.GenericSetAttr);

Sk.builtin.object.prototype.GenericPythonSetAttr = function(self, name, value) {
    return Sk.builtin.object.prototype.GenericSetAttr.call(self, name.v, value);
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericPythonSetAttr", Sk.builtin.object.prototype.GenericPythonSetAttr);

Sk.builtin.object.prototype.HashNotImplemented = function () {
    throw new Sk.builtin.TypeError("unhashable type: '" + Sk.abstr.typeName(this) + "'");
};

Sk.builtin.object.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.object.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;

// Although actual attribute-getting happens in pure Javascript via tp$getattr, classes
// overriding __getattr__ etc need to be able to call object.__getattr__ etc from Python
Sk.builtin.object.prototype["__getattr__"] = Sk.builtin.object.prototype.GenericPythonGetAttr;
Sk.builtin.object.prototype["__setattr__"] = Sk.builtin.object.prototype.GenericPythonSetAttr;

/**
 * The name of this class.
 * @type {string}
 */
Sk.builtin.object.prototype.tp$name = "object";

/**
 * The type object of this class.
 * @type {Sk.builtin.type}
 */
Sk.builtin.object.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("object", Sk.builtin.object);
Sk.builtin.object.prototype.ob$type.sk$klass = undefined;   // Nonsense for closure compiler

/** Default implementations of dunder methods found in all Python objects */

/**
 * Python wrapper for `__repr__` method.
 * @name  __repr__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__repr__"] = function (self) {
    Sk.builtin.pyCheckArgs("__repr__", arguments, 0, 0, false, true);

    return self["$r"]();
};

/**
 * Python wrapper for `__str__` method.
 * @name  __str__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__str__"] = function (self) {
    Sk.builtin.pyCheckArgs("__str__", arguments, 0, 0, false, true);

    return self["$r"]();
};

/**
 * Python wrapper for `__hash__` method.
 * @name  __hash__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__hash__"] = function (self) {
    Sk.builtin.pyCheckArgs("__hash__", arguments, 0, 0, false, true);

    return self.tp$hash();
};

/**
 * Python wrapper for `__eq__` method.
 * @name  __eq__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__eq__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__eq__", arguments, 1, 1, false, true);

    return self.ob$eq(other);
};

/**
 * Python wrapper for `__ne__` method.
 * @name  __ne__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__ne__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__ne__", arguments, 1, 1, false, true);

    return self.ob$ne(other);
};

/**
 * Python wrapper for `__lt__` method.
 * @name  __lt__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__lt__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__lt__", arguments, 1, 1, false, true);

    return self.ob$lt(other);
};

/**
 * Python wrapper for `__le__` method.
 * @name  __le__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__le__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__le__", arguments, 1, 1, false, true);

    return self.ob$le(other);
};

/**
 * Python wrapper for `__gt__` method.
 * @name  __gt__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__gt__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__gt__", arguments, 1, 1, false, true);

    return self.ob$gt(other);
};

/**
 * Python wrapper for `__ge__` method.
 * @name  __ge__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__ge__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__ge__", arguments, 1, 1, false, true);

    return self.ob$ge(other);
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
Sk.builtin.object.prototype["$r"] = function () {
    return new Sk.builtin.str("<object>");
};

Sk.builtin.hashCount = 1;

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
Sk.builtin.object.pythonFunctions = ["__repr__", "__str__", "__hash__",
"__eq__", "__ne__", "__lt__", "__le__", "__gt__", "__ge__", "__getattr__", "__setattr__"];

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
Sk.builtin.none.prototype["$r"] = function () { return new Sk.builtin.str("None"); };

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
Sk.builtin.NotImplemented = function() { };
Sk.abstr.setUpInheritance("NotImplementedType", Sk.builtin.NotImplemented, Sk.builtin.object);

/** @override */
Sk.builtin.NotImplemented.prototype["$r"] = function () { return new Sk.builtin.str("NotImplemented"); };

/**
 * Python NotImplemented constant.
 * @type {Sk.builtin.NotImplemented}
 */
Sk.builtin.NotImplemented.NotImplemented$ = new Sk.builtin.NotImplemented();

goog.exportSymbol("Sk.builtin.none", Sk.builtin.none);
goog.exportSymbol("Sk.builtin.NotImplemented", Sk.builtin.NotImplemented);
