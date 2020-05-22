/**
 * @constructor
 * Sk.builtin.funcOrMethod
 * 
 * @description
 * this function is used by all builtin functions or methods
 * the tp$call method is defined based on the flags
 * 
 * A good way to determine the flags is to look at the textsignature of a function
 * or find the equivalent function in CPython and map the flags to skulpt flags
 * flags: {
 * NoArgs: true, raises exception if there are args or kwargs (METH_NOARGS)
 * OneArg: true, raises exception if there is more than one Arg (METH_O)
 * 
 * MinArgs: int (also assumes NoKwargs)
 * MaxArgs: int optional (used in conjuntiontion with MinArgs)
 * 
 * NamedArgs: Array e.g. [null, null, "name1", "name2"]
 *            use null for posonly args 
 *            ensures that the total number of args (including kwargs) equals the named args
 *            the call sig will check the kwarg names are valid
 *            applies Defaults (if set) to any named args
 * Defaults: Array (used in conjunction with NamedArgs, can use [undefined] see dict.pop for use case)
 * 
 * FastCall && NoKwargs: true, check NoKewords and pass args the function will handle these (METH_FASTCALL)
 * FastCall: pass args, kwargs - the function will handle this (METH_FASTCALL || KEYWORDS)
 * 
 * if no flags are set then the tp$call = function.prototype.tp$call
 * 
 */
Sk.builtin.funcOrMethod = Sk.abstr.buildNativeClass("builtin_function_or_method", {
    constructor: function (method_obj, self, module) {

        // here we set this.$raw binding it's call signature to self
        this.$raw = method_obj.$raw.bind(self);

        this.$doc = method_obj.$doc;
        this.$self = self;
        this.$module = module? new Sk.builtin.str(module) : Sk.builtin.none.none$;
        this.$name = method_obj.$raw.name || method_obj.$name || "<native JS>";

        // useful to set the $textsig to determine the correct flags
        this.$textsig = method_obj.$textsig;

        // override the default tp$call method if there is a valid flag
        flags = method_obj.$flags || {};

        switch (flags) {
            case flags.FastCall && flags.NoKwargs:
                this.tp$call = this.$FastCallNoKwargs;
                break;
            case flags.FastCall:
                this.tp$call = this.$raw
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
            default:
                // if we use function tp$call we need the func_code object to be set
                this.func_code = this.method_obj.$raw;
        }
    },
    proto: {
        $fastCallNoKwargs: function (args, kwargs) {
            Sk.abstr.NoKwargs(this.$name, kwargs);
            return this.$raw(args);
        },
        $NoArgs: function (args, kwargs) {
            Sk.abstr.noArgs(this.$name, args, kwargs);
            return this.$raw()
        },
        $OneArg: function (args, kwargs) {
            Sk.abstr.OneArg(this.$name, args, kwargs);
            return this.$raw(args[0]);
        },
        $NamedArgs: function (args, kwargs) {
            args = Sk.abstr.copyKeywordsToNamedArgs(this.$name, this.$flags.NamedArgs, args, kwargs, this.$flags.Defaults);
            return this.$raw(args);
        },
        $MinArgs: function (args, kwargs) {
            Sk.abstr.NoKwargs(this.$name, kwargs)
            args = Sk.abstr.checkArgsLen(this.$name, args, this.$flags.MinArgs, this.$flags.MaxArgs);
            this.$raw(args);
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
        tp$call: Sk.builtin.func.prototype.tp$call, // by default we use the implementation of func.prototype.tp$call

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
        __text_signature: {
            $get: function () {
                return new Sk.builtin.str(this.$textsig);
            }
        }
    }
});