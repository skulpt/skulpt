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

    // Python builtin instances do not maintain an internal Python dictionary
    // (this causes problems when calling the super constructor on a dict
    // instance). Instead, they maintain a Javascript object.
    this["$d"] = {
        "Sk.builtin.object": true   // Indicates this is a builtin object
    };

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
    goog.asserts.assert(typeof name === "string");

    tp = this.ob$type;
    goog.asserts.assert(tp !== undefined, "object has no ob$type!");

    //print("getattr", tp.tp$name, name);

    descr = Sk.builtin.type.typeLookup(tp, name);

    // otherwise, look in the type for a descr
    if (descr !== undefined && descr !== null && descr.ob$type !== undefined) {
        f = descr.ob$type.tp$descr_get;
        // todo;
        //if (f && descr.tp$descr_set) // is a data descriptor if it has a set
        //return f.call(descr, this, this.ob$type);
    }

    // todo; assert? force?
    if (this["$d"]) {
        if (this["$d"].mp$lookup) {
            res = this["$d"].mp$lookup(new Sk.builtin.str(name));
        } else if (this["$d"].mp$subscript) {
            try {
                res = this["$d"].mp$subscript(new Sk.builtin.str(name));
            } catch (x) {
                res = undefined;
            }
        } else if (typeof this["$d"] === "object") {
            // todo; definitely the wrong place for this. other custom tp$getattr won't work on object -- bnm -- implemented custom __getattr__ in abstract.js
            res = this["$d"][name];
        }
        if (res !== undefined) {
            return res;
        }
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
    goog.asserts.assert(typeof name === "string");
    // todo; lots o' stuff

    if (this["$d"].mp$ass_subscript) {
        this["$d"].mp$ass_subscript(new Sk.builtin.str(name), value);
    } else if (typeof this["$d"] === "object") {
        // Cannot add new attributes to a builtin object
        if (this["$d"]["Sk.builtin.object"] && this["$d"][name] === undefined) {
            throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + name + "'");
        }

        this["$d"][name] = value;
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

/** Default implementations of dunder methods found in all Python objects */

/**
 * Python wrapper for \_\_repr\_\_ method.
 * @name  __repr__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__repr__"] = function (self) {
    Sk.builtin.pyCheckArgs("__repr__", arguments, 0, 0, false, true);

    return self["$r"]();
};

/**
 * Python wrapper for \_\_str\_\_ method.
 * @name  __str__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__str__"] = function (self) {
    Sk.builtin.pyCheckArgs("__str__", arguments, 0, 0, false, true);

    return self["$r"]();
};

/**
 * Python wrapper for \_\_hash\_\_ method.
 * @name  __hash__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__hash__"] = function (self) {
    Sk.builtin.pyCheckArgs("__hash__", arguments, 0, 0, false, true);

    return self.tp$hash();
};

/**
 * Python wrapper for \_\_eq\_\_ method.
 * @name  __eq__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__eq__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__eq__", arguments, 1, 1, false, true);

    return self.ob$eq(other);
};

/**
 * Python wrapper for \_\_ne\_\_ method.
 * @name  __ne__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__ne__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__ne__", arguments, 1, 1, false, true);

    return self.ob$ne(other);
};

/**
 * Python wrapper for \_\_lt\_\_ method.
 * @name  __lt__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__lt__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__lt__", arguments, 1, 1, false, true);

    return self.ob$lt(other);
};

/**
 * Python wrapper for \_\_le\_\_ method.
 * @name  __le__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__le__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__le__", arguments, 1, 1, false, true);

    return self.ob$le(other);
};

/**
 * Python wrapper for \_\_gt\_\_ method.
 * @name  __gt__
 * @memberOf Sk.builtin.object.prototype
 * @instance
 */
Sk.builtin.object.prototype["__gt__"] = function (self, other) {
    Sk.builtin.pyCheckArgs("__gt__", arguments, 1, 1, false, true);

    return self.ob$gt(other);
};

/**
 * Python wrapper for \_\_ge\_\_ method.
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
 * Implements \_\_eq\_\_ dunder method.
 *
 * Javascript function, returns Javascript object or Sk.builtin.NotImplemented.
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
 * Implements \_\_ne\_\_ dunder method.
 *
 * Javascript function, returns Javascript object or Sk.builtin.NotImplemented.
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
 * Implements \_\_lt\_\_ dunder method.
 *
 * Javascript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(boolean|Sk.builtin.NotImplemented)} true if this < other, false otherwise
 */
Sk.builtin.object.prototype.ob$lt = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is less than or equal to a Python object (i.e. this <= other).
 *
 * Implements \_\_le\_\_ dunder method.
 *
 * Javascript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(boolean|Sk.builtin.NotImplemented)} true if this <= other, false otherwise
 */
Sk.builtin.object.prototype.ob$le = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is greater than a Python object (i.e. this > other).
 *
 * Implements \_\_gt\_\_ dunder method.
 *
 * Javascript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(boolean|Sk.builtin.NotImplemented)} true if this > other, false otherwise
 */
Sk.builtin.object.prototype.ob$gt = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is greater than or equal to a Python object (i.e. this >= other).
 *
 * Implements \_\_ge\_\_ dunder method.
 *
 * Javascript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @param  {Object} other The Python object to compare.
 * @return {(boolean|Sk.builtin.NotImplemented)} true if this >= other, false otherwise
 */
Sk.builtin.object.prototype.ob$ge = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

// Wrap the following functions in Sk.builtin.func once that class is initialized
/**
 * Array of all the Python functions which are methods of this class.
 * @type {Array}
 */
Sk.builtin.object.prototype.pythonFunctions = ["__repr__", "__str__", "__hash__",
"__eq__", "__ne__", "__lt__", "__le__", "__gt__", "__ge__", "__getattr__", "__setattr__"];

/**
 * @constructor
 * Sk.builtin.none
 *
 * @extends {Sk.builtin.object}
 */
Sk.builtin.none = function () {
    // Initialize this instance's superclass
    Sk.abstr.superConstructor(Sk.builtin.none, this);

    this.v = {value: null, enumerable: false};
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
Sk.builtin.NotImplemented = function() {
    // Initialize this instance's superclass
    Sk.abstr.superConstructor(Sk.builtin.NotImplemented, this);
};
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
