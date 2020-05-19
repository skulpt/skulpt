/**
 * @constructor
 * Sk.builtin.builtinFuncOrMethod
 * 
 * @description
 * this function is used by all builtin functions or methods
 * the tp$call method is defined based on the flags
 *
 */
Sk.builtin.builtinFuncOrMethod = function (jsFunc, flags, doc, self, module) {
    this.m$raw = jsFunc;
    this.m$flags = flags;
    this.m$doc = doc;
    this.m$self = self;
    this.m$module = module;
    this.m$name = jsFunc.name || jsFunc.$name || "<native JS>";
};

Sk.abstr.setUpInheritance("builtin_function_or_method", Sk.builtinFuncOrMethod, Sk.builtin.object);
Sk.builtinFuncOrMethod.sk$acceptable_as_base_class = false;

Sk.builtin.builtinFuncOrMethod.prototype.tp$call = function (args, kwargs) {


};

Sk.builtin.builtinFuncOrMethod.prototype.$r = function () {
    if (this.m$self === undefined) {
        return new Sk.builtin.str("<built-in function " + this.m$name + ">");
    }
    return new Sk.builtin.str("<built-in method "+ this.m$name + " of " + Sk.abstr.typeName(this) + " object>")
};

Sk.builtin.builtinFuncOrMethod.prototype.tp$getsets = [
    new Sk.GetSetDef("__module__",  
    function () {
        return this.m$module ? new Sk.builtin.str(this.m$module) : Sk.builtin.none.none$;
    }
    ),
    new Sk.GetSetDef("__doc__",  
    function () {
        return this.m$doc ? new Sk.builtin.str(this.m$doc) : Sk.builtin.none.none$;
    }
    ),
    new Sk.GetSetDef("__name__",
    function () {
        return new Sk.builtin.str(this.m$name);
    }
    ),
    new Sk.GetSetDef("__self__", 
    function () {
        return this.m$self;
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
