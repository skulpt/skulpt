/**
 * @constructor
 *
 * @param {Sk.builtin.func} func
 * @param {Sk.builtin.object} self
 *
 */
Sk.builtin.method = Sk.abstr.buildNativeClass("method", {
    constructor: function method(func, self) {
        Sk.asserts.assert(this instanceof Sk.builtin.method, "bad call to method constructor, use 'new'");
        this.im_func = func;
        this.im_self = self;
    },
    slots: {
        $r: function () {
            const def_name = "?";
            let name = this.im_func.tp$getattr(Sk.builtin.str.$qualname) || this.im_func.tp$getattr(Sk.builtin.str.$name);
            name = (name && name.v) || def_name;
            return new Sk.builtin.str("<bound method " + name + " of " + Sk.misceval.objectRepr(this.im_self) + ">");
        },
        tp$hash: function () {
            const selfhash = Sk.abstr.objectHash(this.im_self);
            const funchash = Sk.abstr.objectHash(this.im_func);
            return selfhash + funchash;
        },
        tp$call: function (args, kwargs) {
            if (this.im_func.tp$call === undefined) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this.im_func) + "' is not callable");
            }
            return this.im_func.tp$call([this.im_self, ...args], kwargs);
        },
        tp$new: function (args, kwargs) {
            Sk.abstr.checkNoKwargs("method", kwargs);
            Sk.abstr.checkArgsLen("method", args, 2, 2);
            const func = args[0];
            const self = args[1];
            if (!Sk.builtin.checkCallable(func)) {
                throw new Sk.builtin.TypeError("first argument must be callable");
            }
            if (Sk.builtin.checkNone(self)) {
                throw new Sk.builtin.TypeError("self must not be None");
            }
            return new Sk.builtin.method(func, self);
        },
        tp$richcompare: function (other, op) {
            if ((op != "Eq" && op != "NotEq") || !(other instanceof Sk.builtin.method)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            let eq;
            try {
                eq = Sk.misceval.richCompareBool(this.im_self, other.im_self, "Eq", false) && this.im_func == other.im_func;
            } catch (x) {
                eq = false;
            }
            if (op == "Eq") {
                return eq;
            } else {
                return !eq;
            }
        },
        tp$descr_get: function (obj, obtype) {
            return this;
        },
        tp$getattr: function (pyName, canSuspend) {
            const descr = Sk.abstr.lookupSpecial(this, pyName);
            if (descr !== undefined) {
                return descr;
            }
            return this.im_func.tp$getattr(pyName, canSuspend);
        },
    },
    getsets: {
        __func__: {
            $get: function () {
                return this.im_func;
            },
        },
        __self__: {
            $get: function () {
                return this.im_self;
            },
        },
        __doc__: {
            $get: function () {
                return this.im_func.tp$getattr(Sk.builtin.str.$doc);
            },
        },
    },
    flags: { sk$suitable_as_base_class: false },
});
