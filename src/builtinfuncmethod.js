/**
 * @constructor
 * Sk.builtin.builtinFuncOrMethod
 * 
 * @description
 * this function is used by all builtin functions or methods
 * the tp$call method is defined based on the flags
 * 
 * flags: {
 * NoArgs: true, raises exception if there are args or kwargs
 * OneArg: true, raises exception if there is more than one Arg 
 * MinArgs: int (aslo assumes NoKwrags)
 * MaxArgs: int optional 
 * NamedArgs: Array e.g. [null, null, "name1", "name2"]
 *            use null for posonly args 
 *            ensures that the total number of args (including kwargs) equals the named args
 *            checks the kwarg names are valid
 *            applies Defaults (if set) to any named args
 * Defaults: Array (used in conjunction with NamedArgs, can use [undefined] see dict.pop for usecase)
 * FastCall && NoKwargs: true, check NoKewords and pass args the function will handle these
 * FastCall: pass args, kwargs - the function will handle this
 * 
 * default use function.prototype.tp$call
 * 
 */
Sk.builtin.builtinFuncOrMethod = {
    constructor: function (method_obj, self, module) {
        this.$raw = method_obj.$raw;
        this.$flags = method_obj.$flags;
        this.$doc = method_obj.$doc;
        this.$self = self;
        this.$module = module;
        this.$name = method_obj.$raw.name || method_obj.$name || "<native JS>";

        // ovverride the default tp$call method if there is a valid flag
        switch (flags) {
            case flags.FastCall && flags.NoKwargs:
                this.tp$call = this.$FastCallNoKwargs;
                break;
            case flags.FastCall:
                this.tp$call = this.$FastCall;
                break;
            case flags.NoArgs:
                this.tp$call = this.$NoArgs;
                break;
            case flags.OneArg:
                this.tp$call = this.$OneArg;
                break;
            case flags.NamedArgs:
                this.tp$call = this.$NamedArgs;
                break;
            case flags.MinArgs:
                this.tp$call = this.$MinArgs;
                break;
        }
    },
    proto: {
        $fastCallNoKwargs: function (args, kwargs) {
            Sk.abstr.NoKwargs(this.$name, kwargs);
            return this.$raw.call(this.$self, args);
        },
        $fastCall: function (args, kwargs) {
            return this.$raw.call(this.$self, args, kwargs);
        },
        $NoArgs: function (args, kwargs) {
            Sk.abstr.noArgs(this.$name, args, kwargs);
            return this.$raw.call(this.$self);
        },
        $OneArg: function (args, kwargs) {
            Sk.abstr.OneArg(this.$name, args, kwargs);
            return this.$raw.call(this.$self);
        },
        $NamedArgs: function (args, kwargs) {
            args = Sk.abstr.copyKeywordsToNamedArgs(this.$name, this.$flags.NamedArgs, args, kwargs, this.$flags.Defaults);
            return this.$raw.call(this.$self, args);
        },
        $MinArgs: function (args, kwargs) {
            Sk.abstr.NoKwargs(this.$name, kwargs)
            args = Sk.abstr.checkArgsLen(this.$name, args, this.$flags.MinArgs, this.$flags.MaxArgs);
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
        tp$call: Sk.builtin.func.prototype.tp$call,

    },
    getsets: {
        __module__: {
            $get: function () {
                return this.$module ? new Sk.builtin.str(this.$module) : Sk.builtin.none.none$;
            }
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
    }
};

Sk.builtin.builtinFuncOrMethod = new Sk.builtin.type("builtin_function_or_method", Sk.builtin.builtinFuncOrMethod);