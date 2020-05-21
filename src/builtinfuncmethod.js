/**
 * @constructor
 * Sk.builtin.builtinFuncOrMethod
 * 
 * @description
 * this function is used by all builtin functions or methods
 * the tp$call method is defined based on the flags
 * 
 * flags: {
 * NoArgs: true, raises exception if there are args
 * OneArg: true, raises exception if there are more than one Arg
 * MinArgs: int
 * MaxArgs
 * NamedArgs: Array e.g. [null, null, "name1", "name2"]
 *            use null for posonly args 
 *            ensures that the total number of args equals the named args
 *            applies Defaults if to any named args
 * Defaults: Array (used in conjuntion with defaults)
 * FastCall && NoKwargs: true, check NoKewords and pass args the function will handle these
 * FastCall: pass args, kwargs the function will handle this
 * 
 * VarArgs: 
 * VarArgs || KewWords:
 * }
 */ 
Sk.builtin.builtinFuncOrMethod = {
    constructor: function (jsFunc, flags, doc, self, module) {
        this.$raw = jsFunc;
        this.$flags = flags;
        this.$doc = doc;
        this.$self = self;
        this.$module = module;
        this.$name = jsFunc.name || jsFunc.$name || "<native JS>";

        switch (flags) {
            case flags.FastCall && flags.NoKwargs:
                this.tp$call = function (args, kwargs) {
                    Sk.abstr.NoKwargs(this.$name, kwargs);
                    return this.$raw.call(this.$self, args);
                } 
                break;
            case flags.FastCall:
                this.tp$call = function (args, kwargs) {
                    return this.$raw.call(this.$self, args, kwargs);
                }
                break;
            case flags.NoArgs:
                this.tp$call = function (args, kwargs) {
                    Sk.abstr.noArgs(this.$name, args, kwargs);
                    return this.$raw.call(this.$self);
                }
                break;
            case flags.OneArg:
                this.tp$call = function (args, kwargs) {
                    Sk.abstr.OneArg(this.$name, args, kwargs);
                    return this.$raw.call(this.$self);
                }
                break;
            case flags.NamedArgs:
                this.tp$call = function (args, kwargs) {
                    args = Sk.abstr.copyKeywordsToNamedArgs(this.$name, this.$flags.NamedArgs, args, kwargs, this.$flags.Defaults);
                    return this.$raw.call(this.$self, args);
                }
                break;
            case flags.MinArgs:
                this.tp$call = function (args, kwargs) {
                    Sk.abstr.NoKwargs(this.$name, kwargs)
                    args = Sk.abstr.checkArgsLen(this.$name, args, this.$flags.MinArgs, this.$flags.MaxArgs);
                }
                break;
            default:
                this.tp$call = Sk.builtin.func.prototype.tp$call;
        }
        if (flags.FastCall && flags.NoKwargs) {
            this.tp$call = function (args, kwargs) {
                Sk.abstr.NoKwargs(this.$name, kwargs);
                return this.$raw.call(this.$self, args);
            }
        } else if (flags.FastCall) {
            this.tp$call = function (args, kwargs) {
                return this.$raw.call(this.$self, args, kwargs);
            }
        } else if (flags.NoArgs) {
            this.tp$call = function (args, kwargs) {
                Sk.abstr.noArgs(this.$name, args, kwargs);
                return this.$raw.call(this.$self);
            }
        } else if (flags.OneArg) {
            this.tp$call = function (args, kwargs) {
                Sk.abstr.OneArg(this.$name, args, kwargs);
                return this.$raw.call(this.$self);
            }
        } else if (flags.NamedArgs) {
            this.tp$call = function (args, kwargs) {
                args = Sk.abstr.copyKeywordsToNamedArgs(this.$name, this.$flags.NamedArgs, args, kwargs, this.$flags.Defaults);
                return this.$raw.call(this.$self, args);
            }
        } else if (flags.MinArgs) {
            this.tp$call = function (args, kwargs) {
                Sk.abstr.NoKwargs(this.$name, kwargs)
                args = Sk.abstr.checkArgsLen(this.$name, args, this.$flags.MinArgs, this.$flags.MaxArgs);
            }
        }
}


};

Sk.abstr.setUpInheritance("builtin_function_or_method", Sk.builtin.builtinFuncOrMethod, Sk.builtin.object);
Sk.builtin.builtinFuncOrMethod.sk$acceptable_as_base_class = false;

Sk.builtin.builtinFuncOrMethod.prototype.tp$call = function (args, kwargs) {


};

Sk.builtin.builtinFuncOrMethod.prototype.$r = function () {
    if (this.$self === undefined) {
        return new Sk.builtin.str("<built-in function " + this.$name + ">");
    }
    return new Sk.builtin.str("<built-in method "+ this.$name + " of " + Sk.abstr.typeName(this.$self) + " object>")
};

Sk.builtin.builtinFuncOrMethod.prototype.tp$getsets = [
    new Sk.GetSetDef("__module__",  
    function () {
        return this.$module ? new Sk.builtin.str(this.$module) : Sk.builtin.none.none$;
    }
    ),
    new Sk.GetSetDef("__doc__",  
    function () {
        return this.$doc ? new Sk.builtin.str(this.$doc) : Sk.builtin.none.none$;
    }
    ),
    new Sk.GetSetDef("__name__",
    function () {
        return new Sk.builtin.str(this.$name);
    }
    ),
    new Sk.GetSetDef("__self__", 
    function () {
        return this.$self;
    }
    ),
    new Sk.GetSetDef("__text_signature__")
];


// cfunction_call(PyObject *func, PyObject *args, PyObject *kwargs)
// {
//     assert(kwargs == NULL || PyDict_Check(kwargs));

//     PyThreadState *tstate = _PyThreadState_GET();
//     assert(!_PyErr_Occurred(tstate));

//     int flags = PyCFunction_GET_FLAGS(func);
//     if (!(flags & METH_VARARGS)) {
//         /* If this is not a METH_VARARGS function, delegate to vectorcall */
//         return PyVectorcall_Call(func, args, kwargs);
//     }

//     /* For METH_VARARGS, we cannot use vectorcall as the vectorcall pointer
//      * is NULL. This is intentional, since vectorcall would be slower. */
//     PyCFunction meth = PyCFunction_GET_FUNCTION(func);
//     PyObject *self = PyCFunction_GET_SELF(func);

//     PyObject *result;
//     if (flags & METH_KEYWORDS) {
//         result = (*(PyCFunctionWithKeywords)(void(*)(void))meth)(self, args, kwargs);
//     }
//     else {
//         if (kwargs != NULL && PyDict_GET_SIZE(kwargs) != 0) {
//             _PyErr_Format(tstate, PyExc_TypeError,
//                           "%.200s() takes no keyword arguments",
//                           ((PyCFunctionObject*)func)->m_ml->ml_name);
//             return NULL;
//         }
//         result = meth(self, args);
//     }
//     return _Py_CheckFunctionResult(tstate, func, result, NULL);
// }
