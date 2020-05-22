Sk.builtin.type_is_subtype_base_chain = function type_is_subtype_base_chain(a, b) {
    do {
        if (a == b) {
            return true;
        }
        a = a.prototype.tp$base;
    } while (a !== undefined);

    return (b == Sk.builtin.object);
};

Sk.builtin.PyType_IsSubtype = function PyType_IsSubtype(a, b) {
    var mro = a.prototype.tp$mro;
    if (mro) {
        /* Deal with multiple inheritance without recursion
           by walking the MRO tuple */
        Sk.asserts.assert(mro instanceof Sk.builtin.tuple);
        for (var i = 0; i < mro.length; i++) {
            if (mro[i] == b) {
                return true;
            }
        }
        return false;
    } else {
        /* a is not completely initilized yet; follow tp_base */
        return Sk.builtin.type_is_subtype_base_chain(a, b);
    }
};

/**
 * @constructor
 * Sk.builtin.super_
 */
Sk.builtin.super_ = function super_ (a_type, self) {
    Sk.builtin.pyCheckArgsLen("super", arguments.length, 1);

    if (!(this instanceof Sk.builtin.super_)) {
        return new Sk.builtin.super_(a_type, self);
    }

    Sk.misceval.callsimArray(Sk.builtin.super_.__init__, [this, a_type, self]);

    return this;
};

Sk.builtin.super_.__init__ = new Sk.builtin.func(function(self, a_type, other_self) {
    self.obj = other_self;
    self.type = a_type;

    if (!Sk.builtin.isinstance(a_type, Sk.builtin.type)) {
        throw new Sk.builtin.TypeError("must be type, not " + Sk.abstr.typeName(a_type));
    }

    self.obj_type = a_type.prototype.tp$mro[1];

    if (!other_self) {
        throw new Sk.builtin.NotImplementedError("unbound super not supported because " +
                "skulpts implementation of type descriptors aren't brilliant yet, see this " +
                "question for more information https://stackoverflow.com/a/30190341/117242");
    }

    if (!Sk.builtin.PyType_IsSubtype(self.obj.ob$type, self.type)) {
        throw new Sk.builtin.TypeError("super(type, obj): obj must be an instance of subtype of type");
    }

    return Sk.builtin.none.none$;
});

Sk.abstr.setUpInheritance("super", Sk.builtin.super_, Sk.builtin.object);

/**
 * Get an attribute
 * @param {Object} pyName Python name of the attribute
 * @param {boolean=} canSuspend Can we return a suspension?
 * @return {undefined}
 */
Sk.builtin.super_.prototype.tp$getattr = function (pyName, canSuspend) {
    var res;
    var f;
    var descr;
    var tp;
    var dict;
    var jsName = pyName.$jsstr();

    tp = this.obj_type;
    Sk.asserts.assert(tp !== undefined, "object has no ob$type!");

    dict = this.obj["$d"];

    if (dict) {
        if (dict.mp$lookup) {
            res = dict.mp$lookup(pyName);
        } else if (dict.mp$subscript) {
            try {
                res = dict.mp$subscript(pyName);
            } catch { }
        } else if (typeof dict === "object") {
            // todo; definitely the wrong place for this. other custom tp$getattr won't work on object -- bnm -- implemented custom __getattr__ in abstract.js
            res = dict[jsName];
        }
        if (res !== undefined) {
            return res;
        }
    }

    descr = tp.$typeLookup(pyName);

    // otherwise, look in the type for a descr
    if (descr !== undefined && descr !== null) {
        f = descr.tp$descr_get;
        // todo - data descriptors (ie those with tp$descr_set too) get a different lookup priority

        if (f) {
            // non-data descriptor
            return f.call(descr, this.obj, this.obj_type, canSuspend);
        }
    }

    if (descr !== undefined) {
        return descr;
    }

    return undefined;
};

Sk.builtin.super_.prototype["$r"] = function super_repr(self) {
    if (this.obj) {
        return new Sk.builtin.str("<super: <class '" + (this.type ? this.type.prototype.tp$name : "NULL") + "'>, <" + this.obj.prototype.tp$name + " object>>");
    }

    return new Sk.builtin.str("<super: <class '" + (this.type ? this.type.prototype.tp$name : "NULL") + "'>, NULL>");
};

Sk.builtin.super_.__doc__ = new Sk.builtin.str(
    "super(type, obj) -> bound super object; requires isinstance(obj, type)\n" +
    "super(type) -> unbound super object\n" +
    "super(type, type2) -> bound super object; requires issubclass(type2, type)\n" +
    "Typical use to call a cooperative superclass method:\n" +
    "class C(B):\n" +
    "    def meth(self, arg):\n" +
    "        super(C, self).meth(arg)");
