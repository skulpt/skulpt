/**
 * @constructor
 */
Sk.builtin.object = function () {
    if (!(this instanceof Sk.builtin.object)) {
        return new Sk.builtin.object();
    }
    this["$d"] = new Sk.builtin.dict([]);
    return this;
};

/**
 * Special method look up. First try getting the method via
 * internal dict and getattr. If getattr is not present (builtins)
 * try if method is defined on the object itself
 *
 * Return null if not found or the function
 */
Sk.builtin.object.PyObject_LookupSpecial_ = function(op, str) {
    var res;

    // if op is null, return null
    if (op == null) {
        return null;
    }
    if (op[str]) {
        print("found it for the object")
        return op[str]
    }
    if (op.ob$type) {
        res = Sk.builtin.type.typeLookup(op.ob$type, str);
        print("checking using type and res  = " + res)
    }
    return res
};

/**
 * @constructor
 */
function seqIter(obj) {
    var ret;
    this.idx = 0;
    this.myobj = obj;
    this.tp$iternext = function () {
        try {
            ret = Sk.misceval.callsim(this.myobj["__getitem__"], this.myobj, Sk.ffi.remapToPy(this.idx));
        } catch (e) {
            if (e instanceof Sk.builtin.IndexError) {
                return undefined;
            } else {
                throw e;
            }
        }
        this.idx++;
        return ret;
    };
}

Sk.builtin.object.getIter_ = function(obj) {
    var iter;
    var getit;
    var ret;
    if (obj.tp$getattr) {
        iter = obj.tp$getattr("__iter__");
        if (iter) {
            return Sk.misceval.callsim(iter);
        }
    }
    if (obj.tp$iter) {
        try {  // catch and ignore not iterable error here.
            ret = obj.tp$iter();
            if (ret.tp$iternext) {
                return ret;
            }
        } catch (e) { }
    }
    getit = obj.tp$getattr("__getitem__");
    if (getit) {
        // create internal iterobject if __getitem__
        return new seqIter(obj);
    }
    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(obj) + "' object is not iterable");
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
    goog.asserts.assert(typeof name === "string");
    // todo; lots o' stuff
    if (this["$d"].mp$ass_subscript) {
        this["$d"].mp$ass_subscript(new Sk.builtin.str(name), value);
    } else if (typeof this["$d"] === "object") {
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

Sk.builtin.object.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("object", Sk.builtin.object);

/**
 * @constructor
 */
Sk.builtin.none = function () {
};
Sk.builtin.none.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("NoneType", Sk.builtin.none);
Sk.builtin.none.prototype.tp$name = "NoneType";
Sk.builtin.none.none$ = Object.create(Sk.builtin.none.prototype, {v: {value: null, enumerable: true}});

Sk.builtin.NotImplemented = function() {};
Sk.builtin.NotImplemented.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("NotImplementedType", Sk.builtin.NotImplemented);
Sk.builtin.NotImplemented.prototype.tp$name = "NotImplementedType";
Sk.builtin.NotImplemented.prototype["$r"] = function () { return new Sk.builtin.str("NotImplemented"); };
Sk.builtin.NotImplemented.NotImplemented$ = Object.create(Sk.builtin.NotImplemented.prototype, {v: {value: null, enumerable: false}});


goog.exportSymbol("Sk.builtin.none", Sk.builtin.none);
goog.exportSymbol("Sk.builtin.NotImplemented", Sk.builtin.NotImplemented);
