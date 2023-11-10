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
        this.im_call = func.tp$call;
    },
    slots: {
        $r() {
            const def_name = "?";
            let name = this.im_func.tp$getattr(Sk.builtin.str.$qualname) || this.im_func.tp$getattr(Sk.builtin.str.$name);
            name = (name && name.v) || def_name;
            return new Sk.builtin.str("<bound method " + name + " of " + Sk.misceval.objectRepr(this.im_self) + ">");
        },
        tp$hash() {
            const selfhash = Sk.abstr.objectHash(this.im_self);
            const funchash = Sk.abstr.objectHash(this.im_func);
            return selfhash + funchash;
        },
        tp$call(args, kwargs) {
            var im_call = this.im_call;
            if (im_call === undefined) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this.im_func) + "' object is not callable");
            }
            args = [this.im_self, ...args];
            return im_call.call(this.im_func, args, kwargs);
        },
        tp$new(args, kwargs) {
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
        tp$richcompare(other, op) {
            if ((op != "Eq" && op != "NotEq") || !(other instanceof Sk.builtin.method)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            let eq;
            try {
                eq = Sk.misceval.richCompareBool(this.im_self, other.im_self, "Eq", false) && this.im_func === other.im_func;
            } catch (x) {
                eq = false;
            }
            if (op == "Eq") {
                return eq;
            } else {
                return !eq;
            }
        },
        tp$descr_get(obj, obtype) {
            return this;
        },
        tp$getattr(pyName, canSuspend) {
            const descr = Sk.abstr.lookupSpecial(this, pyName);
            if (descr !== undefined) {
                return descr;
            }
            return this.im_func.tp$getattr(pyName, canSuspend);
        },
    },
    getsets: {
        __func__: {
            $get() {
                return this.im_func;
            },
        },
        __self__: {
            $get() {
                return this.im_self;
            },
        },
        __doc__: {
            $get() {
                return this.im_func.tp$getattr(Sk.builtin.str.$doc);
            },
        },
    },
    flags: { sk$unacceptableBase: true },
});
