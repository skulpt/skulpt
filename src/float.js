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
    if(x.tp$getattr && x.tp$getattr("__float__")) {
        // calling a method which contains im_self and im_func
        // causes skulpt to automatically map the im_self as first argument
        return Sk.misceval.callsim(x.tp$getattr("__float__"));
    } else if(x.__float__) {
        return Sk.misceval.callsim(x.__float__, x);
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

Sk.builtin.float_.prototype.tp$name = "float";
Sk.builtin.float_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("float", Sk.builtin.float_);
