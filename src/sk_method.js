/**
 * @constructor
 * Sk.builtin.sk_method
 * 
 * @description
 * this constructor is used by all builtin functions or methods
 * the tp$call method is defined based on the flags
 * 
 * A good way to determine the flags is to look at the textsignature of a function
 * or find the equivalent function in CPython and map the flags to skulpt flags
 * flags: {
 * NoArgs: true, raises exception if there are args or kwargs (METH_NOARGS)
 * OneArg: true, raises exception if there is more than one Arg (METH_O)
 * 
 * MinArgs: int (also assumes noKwargs)
 * MaxArgs: int optional (used in conjuntiontion with MinArgs)
 * 
 * NamedArgs: Array e.g. [null, null, "name1", "name2"]
 *            use null for posonly args 
 *            ensures that the total number of args (including kwargs) equals the named args
 *            the call sig will check the kwarg names are valid
 *            the call sig applies Defaults (if set) to any named args
 * Defaults: Array (used in conjunction with NamedArgs, can use [undefined] see dict.pop for use case)
 * 
 * FastCall && NoKwargs: true, check NoKewords and pass args the function will handle these (METH_FASTCALL)
 * FastCall: pass args, kwargs - the function will handle this (METH_FASTCALL || KEYWORDS)
 * 
 * if no flags are set then the tp$call = function.prototype.tp$call
 * 
 */
Sk.builtin.sk_method = Sk.abstr.buildNativeClass("builtin_function_or_method", {
    constructor: function (method_def, self, module) {

        // here we set this.$meth binding it's call signature to self
        this.$meth = method_def.$meth.bind(self);
        this.$doc = method_def.$doc;
        this.$self = self;
        this.$module = module ? new Sk.builtin.str(module) : Sk.builtin.none.none$;
        this.$name = method_def.$name || method_def.$meth.name || "<native JS>";

        // useful to set the $textsig to determine the correct flags
        this.$textsig = method_def.$textsig;

        // override the default tp$call method if there is a valid flag
        const flags = method_def.$flags || {};
        this.$flags = flags;

        if (flags.FastCall && flags.NoKwargs) {
            this.tp$call = this.$fastCallNoKwargs;
        } else if (flags.FastCall) {
            this.tp$call = this.$meth;
        } else if (flags.NoArgs) {
            this.tp$call = this.$callNoArgs;
        } else if (flags.OneArg) {
            this.tp$call = this.$callOneArg;
        } else if (flags.NamedArgs) {
            this.tp$call = this.$callNamedArgs;
        } else if (flags.MinArgs !== undefined) {
            this.tp$call = this.$callMinArgs;
        } else {
            this.func_code = method_def.$meth;
        }
    },
    proto: {
        $fastCallNoKwargs: function (args, kwargs) {
            Sk.abstr.checkNoKwargs(this.$name, kwargs);
            return this.$meth(args);
        },
        $callNoArgs: function (args, kwargs) {
            Sk.abstr.checkNoArgs(this.$name, args, kwargs);
            return this.$meth()
        },
        $callOneArg: function (args, kwargs) {
            Sk.abstr.checkOneArg(this.$name, args, kwargs);
            return this.$meth(args[0]);
        },
        $callNamedArgs: function (args, kwargs) {
            args = Sk.abstr.copyKeywordsToNamedArgs(this.$name, this.$flags.NamedArgs, args, kwargs, this.$flags.Defaults);
            return this.$meth(...args);
        },
        $callMinArgs: function (args, kwargs) {
            Sk.abstr.checkNoKwargs(this.$name, kwargs)
            Sk.abstr.checkArgsLen(this.$name, args, this.$flags.MinArgs, this.$flags.MaxArgs);
            return this.$meth(...args);
        },
    },
    flags: { sk$acceptable_as_base_class: false },
    slots: {
        $r: function () {
            if (this.$self === undefined) {
                return new Sk.builtin.str("<built-in function " + this.$name + ">");
            }
            return new Sk.builtin.str("<built-in method " + this.$name + " of " + Sk.abstr.typeName(this.$self) + " object>")
        },
        tp$call: function (args, kwargs) {
            // default implementation for all currently created functions that have yet to be be converted 
            // and don't utilise flagged calls
            args.unshift(this.$self);
            return Sk.builtin.func.prototype.tp$call.call(this, args, kwargs)
        }
    },
    getsets: {
        __module__: {
            $get: function () { return this.$module },
            $set: function (value) { this.$module = value }
        },
        __doc__: {
            $get: function () {
                return this.$doc ? new Sk.builtin.str(this.$doc) : Sk.builtin.none.none$;
            }
        },
        __name__: {
            $get: function () {
                return new Sk.builtin.str(this.$name);
            }
        },
        __text_signature__: {
            $get: function () {
                return new Sk.builtin.str(this.$textsig);
            }
        }
    }
});