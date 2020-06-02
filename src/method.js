/**
 * @constructor
 *
 * @param {Sk.builtin.func} func
 * @param {Sk.builtin.object} self
 *
 */
Sk.builtin.method = Sk.abstr.buildNativeClass("method", {
    constructor: function (func, self) {
        Sk.asserts.assert(this instanceof Sk.builtin.method, "bad call to method constructor, use 'new'");
        this.im_func = func;
        this.im_self = self;
    },
    slots: {
        $r: function () {
            const def_name = "?";
            const func = this.im_func;
            const self = this.im_self;
            return new Sk.builtin.str("<bound method " + (func.$qualname || def_name) + " of " + Sk.misceval.objectRepr(self).v + ">");
        },
        tp$hash: function () {
            const selfhash = Sk.builtin.asnum$(Sk.builtin.hash(this.im_self));
            const funchash = Sk.builtin.asnum$(Sk.builtin.hash(this.im_func));
            return new Sk.builtin.int_(selfhash + funchash);
        },
        tp$call: function (args, kwargs) {
            args.unshift(this.im_self);
            return this.im_func.tp$call(args, kwargs);
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
                const f = descr.tp$descr_get;
                if (f !== undefined) {
                    return f.call(descr, this, this.ob$type);
                } else {
                    return descr;
                }
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
