/**
 * @constructor
 */
Sk.builtin.float_ = function (x) {
    var tmp;
    if (x === undefined) {
        return new Sk.builtin.nmber(0.0, Sk.builtin.nmber.float$);
    }

    if (x instanceof Sk.builtin.str) {

        if (x.v.match(/^-inf$/i)) {
            tmp = -Infinity;
        }
        else if (x.v.match(/^[+]?inf$/i)) {
            tmp = Infinity;
        }
        else if (x.v.match(/^[-+]?nan$/i)) {
            tmp = NaN;
        }

        else if (!isNaN(x.v)) {
            tmp = parseFloat(x.v);
        }
        else {
            throw new Sk.builtin.ValueError("float: Argument: " + x.v + " is not number");
        }
        return new Sk.builtin.nmber(tmp, Sk.builtin.nmber.float$);
    }

    // Floats are just numbers
    if (typeof x === "number" || x instanceof Sk.builtin.nmber ||
        x instanceof Sk.builtin.lng) {
        x = Sk.builtin.asnum$(x);
        return new Sk.builtin.nmber(x, Sk.builtin.nmber.float$);
    }

    // Convert booleans
    if (x instanceof Sk.builtin.bool) {
        x = Sk.builtin.asnum$(x);
        return new Sk.builtin.nmber(x, Sk.builtin.nmber.float$);
    }

    // this is a special internal case
    if(typeof x === "boolean") {
        x = x ? 1.0 : 0.0;
        return new Sk.builtin.nmber(x, Sk.builtin.nmber.float$);
    }

    // try calling __float__
    var special = Sk.builtin.object.PyObject_LookupSpecial_(x.ob$type, "__float__");
    if (special != null) {
        // method on builtin, provide this arg
        return Sk.misceval.callsim(special, x);
    }

    throw new Sk.builtin.TypeError("float() argument must be a string or a number");
};

Sk.builtin.float_.prototype.__int__ = new Sk.builtin.func(function(self) {
    // get value
    var v = Sk.ffi.remapToJs(self);

    if (v < 0) {
        v = Math.ceil(v);
    } else {
        v = Math.floor(v);
    }

    // this should take care of int/long fitting
    return new Sk.builtin.nmber(v, Sk.builtin.nmber.int$);
});

Sk.builtin.float_.prototype.__float__ = new Sk.builtin.func(function(self) {
    return self;
});

/*
 * This checks also for float subtypes, though skulpt does not allow to
 * extend them for now.
 */
Sk.builtin.float_.PyFloat_Check = function (op) {
    if (op === undefined) {
        return false;
    }

    // this is a little bit hacky
    // ToDo: subclassable builtins do not require this
    if (Sk.builtin.checkNumber(op)) {
        return true;
    }

    if (Sk.builtin.checkFloat(op)) {
        return true;
    }

    if (Sk.builtin.issubclass(op.ob$type, Sk.builtin.float_)) {
        return true;
    }

    return false;
};

/*
 * This method is just a wrapper, but uses the correct cpython API name
 */
Sk.builtin.float_.PyFloat_Check_Exact = function (op) {
    return Sk.builtin.checkFloat(op);
};

Sk.builtin.float_.PyFloat_AsDouble = function (op) {
    var f; // nb_float;
    var fo; // PyFloatObject *fo;
    var val;

    // it is a subclass or direct float
    if (op && Sk.builtin.float_.PyFloat_Check(op)) {
        return Sk.ffi.remapToJs(op);
    }

    if (op == null) {
        throw new Error("bad argument for internal PyFloat_AsDouble function");
    }

    // check if special method exists (nb_float is not implemented in skulpt, hence we use __float__)
    f = Sk.builtin.type.typeLookup(op.ob$type, "__float__");
    if (f == null) {
        throw new Sk.builtin.TypeError("a float is required");
    }

    // call internal float method
    fo = Sk.misceval.callsim(f, op);

    // return value of __float__ must be a python float
    if (!Sk.builtin.float_.PyFloat_Check(fo)) {
        throw new Sk.builtin.TypeError("nb_float should return float object");
    }

    val = Sk.ffi.remapToJs(fo);

    return val;
};

Sk.builtin.float_.prototype.tp$name = "float";
Sk.builtin.float_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("float", Sk.builtin.float_);
