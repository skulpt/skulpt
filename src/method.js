/**
 * @constructor
 *
 * @param {Sk.builtin.func|Sk.builtin.method} func
 * @param {Object} self
 * @param {Sk.builtin.type|Sk.builtin.none} klass
 * @param {boolean=} builtin
 * 
 * co_varnames and co_name come from generated code, must access as dict.
 */
Sk.builtin.method = function (func, self, klass, builtin) {
    if (!(this instanceof Sk.builtin.method)) {
        Sk.builtin.pyCheckArgsLen("method", arguments.length, 3, 3);
        if (!Sk.builtin.checkCallable(func)) {
            throw new Sk.builtin.TypeError("First argument must be callable");
        }
        if (self.ob$type === undefined) {
            throw new Sk.builtin.TypeError("Second argument must be object of known type");
        }
        return new Sk.builtin.method(func, self, klass);
    }
    this.tp$name = func.tp$name;
    this.im_func = func;
    this.im_self = self || Sk.builtin.none.none$;
    this.im_class = klass || Sk.builtin.none.none$;
    this.im_builtin = builtin;
    this["$d"] = {
        im_func: func,
        im_self: self,
        im_class: klass
    };
};

Sk.exportSymbol("Sk.builtin.method", Sk.builtin.method);
Sk.abstr.setUpInheritance("instancemethod", Sk.builtin.method, Sk.builtin.object);

Sk.builtin.method.prototype.tp$name = "method";

Sk.builtin.method.prototype.ob$eq = function (other) {
    if (((this.im_self == Sk.builtin.none.none$) && (other.im_self != Sk.builtin.none.none$)) ||  ((other.im_self == Sk.builtin.none.none$) && (this.im_self != Sk.builtin.none.none$))) {
        return false;
    }
    try {
        return Sk.misceval.richCompareBool(this.im_self, other.im_self, "Eq", false) && (this.im_func == other.im_func);
    } catch (x) {
        return false;
    }
};

Sk.builtin.method.prototype.ob$ne = function (other) {
    return !(this.ob$eq(other));
};

Sk.builtin.method.prototype.tp$hash = function () {
    var selfhash, funchash;

    if (this.im_self == Sk.builtin.none.none$) {
        selfhash = 0;
    } else {
        selfhash = Sk.builtin.asnum$(Sk.builtin.hash(this.im_self));
    }
    funchash = Sk.builtin.asnum$(Sk.builtin.hash(this.im_func));

    return new Sk.builtin.int_(selfhash + funchash);
};

Sk.builtin.method.prototype.tp$call = function (args, kw) {
    // Sk.asserts.assert(this.im_func instanceof Sk.builtin.func);

    // 'args' and 'kw' get mucked around with heavily in applyOrSuspend();
    // changing it here is OK.
    if (this.im_self !== Sk.builtin.none.none$) {
        args.unshift(this.im_self);
    }

    // if there is no first argument or
    // if the first argument is not a subclass of the class this method belongs to we throw an error
    // unless it's a builtin method, because they shouldn't have been __get__ and left in this unbound
    // state.
    if (this.im_self === Sk.builtin.none.none$) {
        var getMessage = (function (reason) {
            return "unbound method " + this.tp$name + "() must be called with " + Sk.abstr.typeName(this.im_class) + " instance as first argument (got " + reason + " instead)";
        }).bind(this);

        if (args.length > 0) {
            if (this.im_class != Sk.builtin.none.none$ && !Sk.builtin.issubclass(args[0].ob$type, this.im_class) && !this.im_builtin) {
                throw new Sk.builtin.TypeError(getMessage(Sk.abstr.typeName(args[0].ob$type) + " instance"));
            }
        } else {
            throw new Sk.builtin.TypeError(getMessage("nothing"));
        }
    }

    // A method call is just a call to this.im_func with 'self' on the beginning of the args.
    // Do the necessary.
    return this.im_func.tp$call(args, kw);
};

Sk.builtin.method.prototype.tp$descr_get = function (obj, objtype) {
    Sk.asserts.assert(obj !== undefined && objtype !== undefined);
    return new Sk.builtin.method(this, obj, objtype, this.im_builtin);
};

Sk.builtin.method.pythonFunctions = ["__get__"];

Sk.builtin.method.prototype.__get__ = function __get__(self, instance, owner) {
    Sk.builtin.pyCheckArgsLen("__get__", arguments.length, 1, 2, false, true);
    if (instance === Sk.builtin.none.none$ && owner === Sk.builtin.none.none$) {
        throw new Sk.builtin.TypeError("__get__(None, None) is invalid");
    }

    // if the owner is specified it needs to be a a subclass of im_self
    if (owner && owner !== Sk.builtin.none.none$) {
        if (Sk.builtin.issubclass(owner, self.im_class)) {
            return self.tp$descr_get(instance, owner);
        }

        // if it's not we're not bound
        return self;
    }

    // use the original type to get a bound object
    return self.tp$descr_get(instance, Sk.builtin.none.none$);
};

Sk.builtin.method.prototype["$r"] = function () {
    if (this.im_builtin) {
        return new Sk.builtin.str("<built-in method " + this.tp$name + " of type object>");
    }

    if (this.im_self === Sk.builtin.none.none$) {
        return new Sk.builtin.str("<unbound method " + this.im_class.prototype.tp$name + "." + this.tp$name + ">");
    }

    var owner = this.im_class !== Sk.builtin.none.none$ ? this.im_class.prototype.tp$name : "?";
    return new Sk.builtin.str("<bound method " + owner  + "." + this.tp$name + " of " + Sk.ffi.remapToJs(Sk.misceval.objectRepr(this.im_self)) + ">");
};
