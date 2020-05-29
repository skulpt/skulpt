/**
 * @constructor
 * Sk.builtin.func
 *
 * @description
 * This function converts a Javascript function into a Python object that is callable.  Or just
 * think of it as a Python function rather than a Javascript function now.  This is an important
 * distinction in skulpt because once you have Python function you cannot just call it.
 * You must now use Sk.misceval.callsim to call the Python function.
 *
 * @param {Function} code the javascript implementation of this function
 * @param {Object=} globals the globals where this function was defined.
 * Can be undefined (which will be stored as null) for builtins. (is
 * that ok?)
 * @param {Object=} closure dict of free variables
 * @param {Object=} closure2 another dict of free variables that will be
 * merged into 'closure'. there's 2 to simplify generated code (one is $free,
 * the other is $cell)
 *
 * closure is the cell variables from the parent scope that we need to close
 * over. closure2 is the free variables in the parent scope that we also might
 * need to access.
 *
 * NOTE: co_varnames and co_name are defined by compiled code only, so we have
 * to access them via dict-style lookup for closure.
 *
 */
Sk.builtin.func = Sk.abstr.buildNativeClass("function", {
    constructor: function func(code, globals, closure, closure2) {
        Sk.asserts.assert(this instanceof Sk.builtin.func, "builtin func should be called as a class with `new`");
        debugger;

        this.func_code = code;
        this.func_globals = globals || null;

        this.$name = code.co_name && code.co_name.v || code.name || "<native JS>";
        this.$d = Sk.builtin.dict ? new Sk.builtin.dict : {};
        this.$doc = code.$doc;
        this.$module = (Sk.globals && Sk.globals["__name__"]) || Sk.builtin.none.none$;
        this.$qualname = code.co_qualname && code.co_qualname.v || this.$name;

        if (closure2 !== undefined) {
            // todo; confirm that modification here can't cause problems
            for (let k in closure2) {
                closure[k] = closure2[k];
            }
        }
        this.func_closure = closure;
    },
    slots: {
        tp$descr_get: function (obj, objtype) {
            if (obj == null) {
                return this;
            }
            return new Sk.builtin.method(this, obj);
        },
        $r: function () {
            return new Sk.builtin.str("<function " + this.func_qualname + ">");
        },
        tp$call: Sk.generic.functionCallMethod,
    },
    getsets: {
        __name__: {
            $get: function () {
                return new Sk.builtin.str(this.$name);
            },
            $set: function (value) {
                if (!Sk.builtin.checkString(value)) {
                    throw new Sk.builtin.TypeError("__name__ must be set to a string object");
                }
                this.$name = value.$jsstr();
            },
        },
        __qualname__: {
            $get: function () {
                return new Sk.builtin.str(this.$qualname);
            },
            $set: function (value) {
                if (!Sk.builtin.checkString(value)) {
                    throw new Sk.builtin.TypeError("__qualname__ must be set to a string object");
                }
                this.$qualname = value.$jsstr();
            },
        },
        __dict__: Sk.generic.getSetDict,
        __defaults__: {
            $get: function () {
                return new Sk.builtin.tuple(this.$defaults);
            }, // technically this is a writable property but we'll leave it as read-only for now
        },
        __doc__: {
            $get: function () {
                return new Sk.builtin.str(this.$doc);
            },
        },
    },
});
