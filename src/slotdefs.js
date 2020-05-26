Sk.generic.wrapperCallNoArgs = function (self, args, kwargs) {
    // this = the wrapped function
    Sk.abstr.checkNoArgs(this.$name, args, kwargs);
    res = this.call(self);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
};

Sk.generic.wrapperFastCall = function (self, args, kwargs) {
    // this = the wrapped function
    res = this.call(self, args, kwargs);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
};

Sk.generic.wrapperCallOneArg = function (self, args, kwargs) {
    // this = the wrapped function
    Sk.abstr.checkOneArg(this.$name, args, kwargs);
    res = this.call(self, args[0]);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
};

Sk.generic.wrapperSetDelete = function (set_name) {
    return function (self, args, kwargs) {
        const $name = this.$name;
        Sk.abstr.checkNoKwargs(this.$name, kwargs);
        if ($name == set_name) {
            Sk.abstr.checkArgsLen($name, args, 2, 2);
        } else {
            Sk.abstr.checkOneArg($name, args, kwargs);
        }
        res = this.call(self, args[0], args[1]);
        return Sk.builtin.none.none$;
    };
};

Sk.generic.wrapperRichCompare = function (self, args, kwargs) {
    const res = Sk.generic.wrapperCallOneArg.call(this, self, args, kwargs);
    if (res === Sk.builtin.NotImplemented.NotImplemented$) {
        return res;
    }
    return new Sk.builtin.bool(res);
};

Sk.generic.slotFuncNoArgs = function () {
    let res;
    const func = Sk.abstr.lookupSpecial(this, dunderName);
    if (func instanceof Sk.builtin.wrapper_descriptor) {
        return func.d$wrapper.call(this);
    } else if (func !== undefined) {
        res = Sk.misceval.callsimArray(func, [this]);
    }
    return res;
};


Sk.generic.slotFuncNoArgsWithCheck = function (dunderName, checkFunc, checkMsg) {
    return function () {
        let res;
        const func = Sk.abstr.lookupSpecial(this, dunderName);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapper.call(this);
        } else if (func !== undefined) {
            res = Sk.misceval.callsimArray(func, [this]);
            if (!(checkFunc(res))) {
                throw new Sk.builtin.TypeError(dunderName + " returned " + checkMsg + " (type " + Sk.abstr.typeName(res) + ")");
            }
        }
        return res;
    };
};

Sk.generic.slotFuncOneArg = function (dunderName) {
    return function (value) {
        const func = Sk.abstr.lookupSpecial(this, dunderName);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapper.call(this, value);
        }
        return Sk.misceval.callsimArray(func, [this, value]);
    };
};

Sk.generic.slotFuncFastCall = function (dunderName) {
    return function (args, kwargs) {
        const func = Sk.abstr.lookupSpecial(this, dunderName);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapper.call(this, args, kwargs);
        }
        return Sk.misceval.callsimOrSuspendArray(func, [this, value]);
    };
};

Sk.generic.slotFuncSetDelete = function (set_name, del_name, error_msg) {
    return function (obj, value, canSuspend) {
        let func, res;
        if (value == null) {
            // then we're deleting
            func = Sk.abstr.lookupSpecial(this, del_name);
        } else {
            func = Sk.abstr.lookupSpecial(this, set_name);
        }
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapper.call(this, value);
        }
        const call_version = canSuspend ? Sk.misceval.callsimOrSuspendArray : Sk.misceval.callsimArray;
        if (func !== undefined) {
            res = value == null ? call_version(func, [this, obj]) : call_version(func, [this, obj, value]);
        } else if (value == null) {
            throw new Sk.builtin.AttributeError(del_name);
        } else if (error_msg) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object " + error_msg);
        } else {
            throw new Sk.builtin.AttributeError(set_name);
        }
        return res;
    };
};

Sk.slots = Object.create(null);
const slots = Sk.slots;

// tp slots
slots.__init__ = {
    $name: "__init__",
    $slot_func: function tp$init(args, kwargs) {
        const func = Sk.abstr.lookupSpecial(this, "__init__");
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapper.call(this, args, kwargs);
        }
        args.unshift(this);
        let ret = Sk.misceval.callsimOrSuspendArray(func, args, kwargs);
        return Sk.misceval.chain(ret, function (r) {
            if (!Sk.builtin.checkNone(r) && r !== undefined) {
                throw new Sk.builtin.TypeError("__init__() should return None, not " + Sk.abstr.typeName(r));
            } else {
                return r;
            }
        });
    },
    $wrapper: function (self, args, kwargs) {
        // this = the wrapped function
        this.call(self, args, kwargs);
        return Sk.builtin.none.none$;
    },
    $textsig: "($self, /, *args, **kwargs)",
    $flags: { FastCall: true },
    $doc: "Initialize self.  See help(type(self)) for accurate signature.",
};

slots.__new__ = {
    $name: "__new__",
    $slot_func: Sk.generic.slotFuncFastCall("__new__"),
    $wrapper: null,
    $textsig: "($self, /, *args, **kwargs)",
    $flags: { FastCall: true },
    $doc: "Create and return a new object.",
};

slots.__call__ = {
    $name: "__call__",
    $slot_func: Sk.generic.slotFuncFastCall("__call__"),
    $wrapper: Sk.generic.wrapperFastCall,
    $textsig: "($self, /, *args, **kwargs)",
    $flags: { FastCall: true },
    $doc: "Call self as a function.",
};

slots.__repr__ = {
    $name: "__repr__",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__repr__", Sk.builtin.checkString, "non-string"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return repr(self).",
};

slots.__str__ = {
    $name: "__str__",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__str__", Sk.builtin.checkString, "non-string"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return str(self).",
};

slots.__hash__ = {
    $name: "__hash__",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__hash__", Sk.builtin.checkInt, "non-int"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return hash(self).",
};

// getters/setters/deletters
slots.__getattribute__ = {
    $name: "__getattribute__",
    $slot_func: function tp$getattr(pyName, canSuspend) { },
    $wrapper: function () { },
    $textsig: "($self, name, /)",
    $doc: "Return getattr(self, name).",
};

slots.__getattr__ = {
    $name: "__getattr__",
    $slot_func: function tp$getattr(pyName, canSuspend) { },
    $wrapper: function __getattribute__(pyName) { },
    $textsig: "($self, name, /)",
    $doc: "Return getattr(self, name).",
};

slots.__setattr__ = {
    $name: "__setattr__",
    $slot_func: Sk.generic.slotFuncSetDelete("__setattr__", "__delattr__"),
    // not need for an error message setattr is always defined on object
    $wrapper: Sk.generic.wrapperSetDelete("__setattr__"),
    $textsig: "($self, name, value, /)",
    $doc: "Implement setattr(self, name, value).",
};

slots.__delattr__ = {
    $name: "__delattr__",
    $slot_func: slots.__setattr__.$slot_func,
    $wrapper: slots.__setattr__.$wrapper,
    $textsig: "($self, name, /)",
    $doc: "Implement delattr(self, name).",
};

slots.__get__ = {
    $name: "__get__",
    $slot_func: function tp$descr_get(obj, obtype, canSuspend) {
        let res;
        const func = Sk.abstr.lookupSpecial(this, "__get__");
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapper.call(this, value);
        }
        const call_version = canSuspend ? Sk.misceval.callsimOrSuspendArray : Sk.misceval.callsimArray;
        if (func !== undefined) {
            res = call_version(func, [this, obj, obtype]);
        }
        return res;
    },
    $wrapper: function __get__(obj, obtype) { },
    $textsig: "($self, instance, owner, /)",
    $doc: "Return an attribute of instance, which is of type owner.",
};

slots.__set__ = {
    $name: "__set__",
    $slot_func: Sk.generic.slotFuncSetDelete("__set__", "__delete__"),
    $wrapper: Sk.generic.wrapperSetDelete("__set__"),
    $textsig: "($self, instance, value, /)",
    $doc: "Set an attribute of instance to value.",
};

slots.__delete__ = {
    $name: "__delete__",
    $slot_func: slots.__set__.$slot_func,
    $wrapper: slots.__set__.$wrapper,
    $textsig: "($self, instance, /)",
    $doc: "Delete an attribute of instance.",
};

// slots.__del__ = {
// 	$name: "__del__",
// 	$slot_func: function tp$finalize () { },
// 	$wrapper: function __del__ () { },
// 	$textsig: null,
// 	$doc: "",
// };


// tp richcompare
{
    slots.__eq__ = {
        $name: "__eq__",
        $slot_func: Sk.generic.slotFuncOneArg("__eq__"),
        $wrapper: Sk.generic.wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self==value.",
    };

    slots.__ge__ = {
        $name: "__ge__",
        $slot_func: Sk.generic.slotFuncOneArg("__ge__"),
        $wrapper: Sk.generic.wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self>=value.",
    };

    slots.__gt__ = {
        $name: "__gt__",
        $slot_func: Sk.generic.slotFuncOneArg("__gt__"),
        $wrapper: Sk.generic.wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self>value.",
    };

    slots.__le__ = {
        $name: "__le__",
        $slot_func: Sk.generic.slotFuncOneArg("__le__"),
        $wrapper: Sk.generic.wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self<=value.",
    };

    slots.__lt__ = {
        $name: "__lt__",
        $slot_func: Sk.generic.slotFuncOneArg("__lt__"),
        $wrapper: Sk.generic.wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self<value.",
    };

    slots.__ne__ = {
        $name: "__ne__",
        $slot_func: Sk.generic.slotFuncOneArg("__ne__"),
        $wrapper: Sk.generic.wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self!=value.",
    };
}
// iters

slots.__iter__ = {
    $name: "__iter__",
    $slot_func: Sk.generic.slotFuncNoArgs("__iter__"),
    $wrapper: function __iter__() { },
    $textsig: "($self, /)",
    $doc: "Implement iter(self).",
};

slots.__next__ = {
    $name: "__next__",
    $slot_func: function tp$iternext(canSuspend) {
        const self = this;
        const func = Sk.abstr.lookupSpecial(this, Sk.builtin.str.$next);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapper.call(this);
        } else if (func !== undefined) {
            if (canSuspend) {
                return Sk.misceval.tryCatch(function () {
                    return Sk.misceval.callsimOrSuspendArray(func, [self]);
                }, function (e) {
                    if (e instanceof Sk.builtin.StopIteration) {
                        return undefined;
                    } else {
                        throw e;
                    }
                });
            } else {
                try {
                    res = Sk.misceval.callsimArray(func, [this]);
                } catch (e) {
                    if (e instanceof Sk.builtin.StopIteration) {
                        return undefined;
                    } else {
                        throw e;
                    }
                }
            }
        }
        return res;
    },
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $doc: "Implement next(self).",
};

// sequence and mapping
slots.__len__ = {
    $name: "__len__",
    $slot_func: function sq$length(canSuspend) {
        let res;
        const func = Sk.abstr.lookupSpecial(this, dunderName);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapper.call(this);
        } else if (func !== undefined) {
            if (canSuspend) {
                res = Sk.misceval.callsimOrSuspendArray(func, [this]);
                return Sk.misceval.chain(res, function (r) {
                    if (!Sk.builtin.checkInt(r)) {
                        throw new Sk.builtin.TypeError(Sk.abstr.typeName(res) + " object cannot be interpreted as an integer");
                    }
                    return r;
                });
            } else {
                res = Sk.misceval.callsimArray(func, [this]);
                if (!Sk.builtin.checkInt(res)) {
                    throw new Sk.builtin.TypeError(Sk.abstr.typeName(res) + " object cannot be interpreted as an integer");
                }
            }
        }
        return res;
    },
    $wrapper: function __len__(self, args, kwargs) {
        Sk.abstr.checkNoArgs("__len__", args, kwargs);
        return Sk.builtin.int_(self.sq$length());
    },
    $flags: { NoArgs: true },
    $textsig: "($self, /)",
    $doc: "Return len(self).",
};

slots.__contains__ = {
    $name: "__contains__",
    $slot_func: function sq$contains(key) {
        return Sk.misceval.isTrue(Sk.generic.slotFuncOneArg("__contiains__").call(this, key));
    },
    $wrapper: function __contains__(self, args, kwargs) {
        Sk.abstr.checkOneArg("__contains__", args, kwargs);
        return new Sk.builtin.bool(this.call(self, args[0]));
    },
    $textsig: "($self, key, /)",
    $doc: "Return key in self.",
};

slots.__getitem__ = {
    $name: "__getitem__",
    $slot_func: function mp$subscript(key) { },
    $wrapper: function __getitem__(key) { },
    $textsig: "($self, key, /)",
    $doc: "Return self[key].",
};

slots.__setitem__ = {
    $name: "__setitem__",
    $slot_func: Sk.generic.slotFuncSetDelete("__setitem__", "__delitem__", "does not support item assignment"),
    $wrapper: Sk.generic.wrapperSetDelete("__setitem__"),
    $textsig: "($self, key, value, /)",
    $doc: "Set self[key] to value.",
};

slots.__delitem__ = {
    $name: "__delitem__",
    $slot_func: slots.__setitem__.$slot_func,
    $wrapper: slots.__setitem__.$wrapper,
    $textsig: "($self, key, /)",
    $doc: "Delete self[key].",
};


// number
slots.__add__ = {
    $name: "__add__",
    $slot_func: Sk.generic.slotFuncOneArg,
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $doc: "Return self+value.",
};
slots.__radd__ = {
    $name: "__radd__",
    $slot_func: Sk.generic.slotFuncOneArg,
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $doc: "Return value+self.",
};
slots.__sub__ = {
    $name: "__sub__",
    $slot_func: Sk.generic.slotFuncOneArg,
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $doc: "Return self-value.",
};
slots.__rsub__ = {
    $name: "__rsub__",
    $slot_func: Sk.generic.slotFuncOneArg,
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $doc: "Return value-self.",
};
slots.__mul__ = {
    $name: "__mul__",
    $slot_func: Sk.generic.slotFuncOneArg,
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $doc: "Return self*value.",
};
slots.__rmul__ = {
    $name: "__rmul__",
    $slot_func: Sk.generic.slotFuncOneArg,
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $doc: "Return value*self.",
};
slots.__mod__ = {
    $name: "__mod__",
    $slot_func: function () { },
    $wrapper: function __mod__() { },
    $textsig: "($self, value, /)",
    $doc: "Return self%value.",
};
slots.__rmod__ = {
    $name: "__rmod__",
    $slot_func: function () { },
    $wrapper: function __rmod__() { },
    $textsig: "($self, value, /)",
    $doc: "Return value%self.",
};
slots.__divmod__ = {
    $name: "__divmod__",
    $slot_func: function () { },
    $wrapper: function __divmod__() { },
    $textsig: "($self, value, /)",
    $doc: "Return divmod(self, value).",
};
slots.__rdivmod__ = {
    $name: "__rdivmod__",
    $slot_func: function () { },
    $wrapper: function __rdivmod__() { },
    $textsig: "($self, value, /)",
    $doc: "Return divmod(value, self).",
};
slots.__pow__ = {
    $name: "__pow__",
    $slot_func: function () { },
    $wrapper: function __pow__() { },
    $textsig: "($self, value, mod=None, /)",
    $doc: "Return pow(self, value, mod).",
};
slots.__rpow__ = {
    $name: "__rpow__",
    $slot_func: function () { },
    $wrapper: function __rpow__() { },
    $textsig: "($self, value, mod=None, /)",
    $doc: "Return pow(value, self, mod).",
};
slots.__neg__ = {
    $name: "__neg__",
    $slot_func: function () { },
    $wrapper: function __neg__() { },
    $textsig: "($self, /)",
    $doc: "-self",
};
slots.__pos__ = {
    $name: "__pos__",
    $slot_func: function () { },
    $wrapper: function __pos__() { },
    $textsig: "($self, /)",
    $doc: "+self",
};
slots.__abs__ = {
    $name: "__abs__",
    $slot_func: function () { },
    $wrapper: function __abs__() { },
    $textsig: "($self, /)",
    $doc: "abs(self)",
};
slots.__bool__ = {
    $name: "__bool__",
    $slot_func: function () { },
    $wrapper: function __bool__() { },
    $textsig: "($self, /)",
    $doc: "self != 0",
};
slots.__invert__ = {
    $name: "__invert__",
    $slot_func: function () { },
    $wrapper: function __invert__() { },
    $textsig: "($self, /)",
    $doc: "~self",
};
slots.__lshift__ = {
    $name: "__lshift__",
    $slot_func: function () { },
    $wrapper: function __lshift__() { },
    $textsig: "($self, value, /)",
    $doc: "Return self<<value.",
};
slots.__rlshift__ = {
    $name: "__rlshift__",
    $slot_func: function () { },
    $wrapper: function __rlshift__() { },
    $textsig: "($self, value, /)",
    $doc: "Return value<<self.",
};
slots.__rshift__ = {
    $name: "__rshift__",
    $slot_func: function () { },
    $wrapper: function __rshift__() { },
    $textsig: "($self, value, /)",
    $doc: "Return self>>value.",
};
slots.__rrshift__ = {
    $name: "__rrshift__",
    $slot_func: function () { },
    $wrapper: function __rrshift__() { },
    $textsig: "($self, value, /)",
    $doc: "Return value>>self.",
};
slots.__and__ = {
    $name: "__and__",
    $slot_func: function () { },
    $wrapper: function __and__() { },
    $textsig: "($self, value, /)",
    $doc: "Return self&value.",
};
slots.__rand__ = {
    $name: "__rand__",
    $slot_func: function () { },
    $wrapper: function __rand__() { },
    $textsig: "($self, value, /)",
    $doc: "Return value&self.",
};
slots.__xor__ = {
    $name: "__xor__",
    $slot_func: function () { },
    $wrapper: function __xor__() { },
    $textsig: "($self, value, /)",
    $doc: "Return self^value.",
};
slots.__rxor__ = {
    $name: "__rxor__",
    $slot_func: function () { },
    $wrapper: function __rxor__() { },
    $textsig: "($self, value, /)",
    $doc: "Return value^self.",
};
slots.__or__ = {
    $name: "__or__",
    $slot_func: function () { },
    $wrapper: function __or__() { },
    $textsig: "($self, value, /)",
    $doc: "Return self|value.",
};
slots.__ror__ = {
    $name: "__ror__",
    $slot_func: function () { },
    $wrapper: function __ror__() { },
    $textsig: "($self, value, /)",
    $doc: "Return value|self.",
};
slots.__int__ = {
    $name: "__int__",
    $slot_func: function () { },
    $wrapper: function __int__() { },
    $textsig: "($self, /)",
    $doc: "int(self)",
};
slots.__float__ = {
    $name: "__float__",
    $slot_func: function () { },
    $wrapper: function __float__() { },
    $textsig: "($self, /)",
    $doc: "float(self)",
};
slots.__floordiv__ = {
    $name: "__floordiv__",
    $slot_func: function () { },
    $wrapper: function __floordiv__() { },
    $textsig: "($self, value, /)",
    $doc: "Return self//value.",
};
slots.__rfloordiv__ = {
    $name: "__rfloordiv__",
    $slot_func: function () { },
    $wrapper: function __rfloordiv__() { },
    $textsig: "($self, value, /)",
    $doc: "Return value//self.",
};
slots.__truediv__ = {
    $name: "__truediv__",
    $slot_func: function () { },
    $wrapper: function __truediv__() { },
    $textsig: "($self, value, /)",
    $doc: "Return self/value.",
};
slots.__rtruediv__ = {
    $name: "__rtruediv__",
    $slot_func: function () { },
    $wrapper: function __rtruediv__() { },
    $textsig: "($self, value, /)",
    $doc: "Return value/self.",
};
slots.__index__ = {
    $name: "__index__",
    $slot_func: function () { },
    $wrapper: function __index__() { },
    $textsig: "($self, /)",
    $doc: "Return self converted to an integer, if self is suitable for use as an index into a list.",
};
slots.__iadd__ = {
    $name: "__iadd__",
    $slot_func: Sk.generic.slotFuncOneArg,
    $wrapped: Sk.generic.wrapperCallOneArg,
    $flags: { OneArg: true },
    $textsig: "($self, value, /)",
    $doc: "Implement self+=value.",
};
slots.__imul__ = {
    $name: "__imul__",
    $slot_func: Sk.generic.slotFuncOneArg,
    $wrapped: Sk.generic.wrapperCallOneArg,
    $flags: { OneArg: true },
    $textsig: "($self, value, /)",
    $doc: "Implement self*=value.",
};


// py2 ONLY slots
slots.__long__ = {
    $name: "__long__",
    $slot_func: function () { },
    $wrapper: function __long__() { },
    $textsig: "($self, /)",
    $doc: "int(self)",
};

slots.__div__ = {
    $name: "__div__",
    $slot_func: function () { },
    $wrapper: function __div__() { },
    $textsig: "($self, other/)",
    $doc: "x.__div__(y) <==> x/y",
};

slots.__rdiv__ = {
    $name: "__rdiv__",
    $slot_func: function () { },
    $wrapper: function __div__() { },
    $textsig: "($self, other/)",
    $doc: "x.__rdiv__(y) <==> x/y",
};

slots.__nonzero__ = {
    $name: "__nonzero__",
    $slot_func: function () { },
    $wrapper: function __nonzero__() { },
    $textsig: "($self, /)",
    $doc: "x.__nonzero__() <==> x != 0",
};



/**
 * Maps Python dunder names to the Skulpt Javascript function names that
 * implement them.
 *
 * Note: __add__, __mul__, and __rmul__ can be used for either numeric or
 * sequence types. Here, they default to the numeric versions (i.e. nb$add,
 * nb$multiply, and nb$reflected_multiply). This works because Sk.abstr.binary_op_
 * checks for the numeric shortcuts and not the sequence shortcuts when computing
 * a binary operation.
 *
 * Because many of these functions are used in contexts in which Skulpt does not
 * [yet] handle suspensions, the assumption is that they must not suspend. However,
 * some of these built-in functions are acquiring "canSuspend" arguments to signal
 * where this is not the case. These need to be spliced out of the argument list before
 * it is passed to python. Array values in this map contain [dunderName, argumentIdx],
 * where argumentIdx specifies the index of the "canSuspend" boolean argument.
 *
 * @type {Object}
 */
Sk.dunderToSkulpt = {
    "__repr__": "$r",
    "__init__": "tp$init",
    "__eq__": "ob$eq",
    "__ne__": "ob$ne",
    "__lt__": "ob$lt",
    "__le__": "ob$le",
    "__gt__": "ob$gt",
    "__ge__": "ob$ge",
    "__hash__": "tp$hash",
    "__abs__": "nb$abs",
    "__neg__": "nb$negative",
    "__pos__": "nb$positive",
    "__int__": "nb$int_",
    "__long__": "nb$lng",
    "__float__": "nb$float_",
    "__add__": "nb$add",
    "__radd__": "nb$reflected_add",
    "__sub__": "nb$subtract",
    "__rsub__": "nb$reflected_subtract",
    "__mul__": "nb$multiply",
    "__rmul__": "nb$reflected_multiply",
    "__div__": "nb$divide",
    "__rdiv__": "nb$reflected_divide",
    "__floordiv__": "nb$floor_divide",
    "__rfloordiv__": "nb$reflected_floor_divide",
    "__invert__": "nb$invert",
    "__mod__": "nb$remainder",
    "__rmod__": "nb$reflected_remainder",
    "__divmod__": "nb$divmod",
    "__rdivmod__": "nb$reflected_divmod",
    "__pow__": "nb$power",
    "__rpow__": "nb$reflected_power",
    "__contains__": "sq$contains",
    "__bool__": ["nb$bool", 1],
    "__nonzero__": ["nb$nonzero", 1],
    "__len__": ["sq$length", 1],
    "__get__": ["tp$descr_get", 3],
    "__set__": ["tp$descr_set", 3]
};


Sk.exportSymbol("Sk.setupDunderMethods", Sk.setupDunderMethods);

Sk.setupDunderMethods = function (py3) {
    if (py3) {
        Sk.dunderToSkulpt["__matmul__"] = "tp$matmul";
        Sk.dunderToSkulpt["__rmatmul__"] = "tp$reflected_matmul";
    } else {
        if (Sk.dunderToSkulpt["__matmul__"]) {
            delete Sk.dunderToSkulpt["__matmul__"];
        }
        if (Sk.dunderToSkulpt["__rmatmul__"]) {
            delete Sk.dunderToSkulpt["__rmatmul__"];
        }
    }
};



// // allocate a dunder method to a skulpt slot
// const magic_func = klass.prototype[dunder];
// let skulpt_name = Sk.dunderToSkulpt[dunder];

// if (typeof (skulpt_name) === "string") {
//     // can"t suspend so just use calsimArray
//     klass.prototype[skulpt_name] = function () {
//         let len, args, i;
//         len = arguments.length;
//         args = new Array(len + 1);
//         args[0] = this;
//         for (i = 0; i < len; i++) {
//             args[i + 1] = arguments[i];
//         }
//         return Sk.misceval.callsimArray(magic_func, args);
//     };
// } else {
//     // can suspend
//     let canSuspendIdx = skulpt_name[1];
//     skulpt_name = skulpt_name[0];
//     klass.prototype[skulpt_name] = function () {
//         let len, args, i, j;
//         let canSuspend = false;
//         len = arguments.length;
//         if (canSuspendIdx <= len) {
//             args = new Array(len);
//         } else {
//             args = new Array(len + 1);
//         }
//         args[0] = this;
//         j = 1;
//         for (i = 0; i < len; i++) {
//             if (i === (canSuspendIdx - 1)) {
//                 canSuspend = arguments[i];
//             } else {
//                 args[j] = arguments[i];
//                 j += 1;
//             }
//         }
//         if (canSuspend) {
//             return Sk.misceval.callsimOrSuspendArray(magic_func, args);
//         } else {
//             return Sk.misceval.callsimArray(magic_func, args);
//         }
//     };
// }


// things from other modules that might be usefl

/**
 * 
 * 
 Sk.builtin.func.prototype.__get__ = function __get__(self, instance, owner) {
    Sk.builtin.pyCheckArgsLen("__get__", arguments.length, 1, 2, false, true);
    if (instance === Sk.builtin.none.none$ && owner === Sk.builtin.none.none$) {
        throw new Sk.builtin.TypeError("__get__(None, None) is invalid");
    }

    return self.tp$descr_get(instance, owner);
};
 * 
 * 
 * 
 */


Sk.slotToDunder = {
    // stop constructor causing issues in slotToDunder checks
    constructor: undefined,

    // nb we handle tp$new differently
    // tp_slots
    tp$init: "__init__",
    tp$call: "__call__",
    $r: "__repr__",
    tp$hash: "__hash__",
    tp$str: "__str__",

    // getattribute, setattr, delattr
    tp$getattr: "__getattribute__",
    tp$setattr: ["__setattr__", "__delattr__"],

    // tp$richcompare
    ob$eq: "__eq__",
    ob$ne: "__ne__",
    ob$lt: "__lt__",
    ob$le: "__le__",
    ob$gt: "__gt__",
    ob$ge: "__ge__",

    // getters and setters
    tp$descr_get: "__getitem__",
    tp$descr_set: ["__setitem__", "__delitem__"],

    // getters and setters
    tp$descr_get: "__get__",
    tp$descr_set: ["__set__", "__delete__"],


    // iter
    tp$iter: "__iter__",
    tp$iternext: "__next__",

    // sequence and mapping slots
    sq$length: "__len__",
    sq$containes: "__contains__",
    mp$subscript: "__getitem__",
    mp$ass_subscript: ["__setitem__", "__delitem__"],


    // number slots
    nb$abs: "__abs__",
    nb$negative: "__neg__",
    nb$positive: "__pos__",
    nb$int_: "__int__",
    nb$lng: "__long__",
    nb$float_: "__float__",
    nb$add: "__add__",
    nb$reflected_add: "__radd__",
    nb$subtract: "__sub__",
    nb$reflected_subtract: "__rsub__",
    nb$multiply: "__mul__",
    nb$reflected_multiply: "__rmul__",
    nb$divide: "__div__",
    nb$reflected_divide: "__rdiv__",
    nb$floor_divide: "__floordiv__",
    nb$reflected_floor_divide: "__rfloordiv__",
    nb$invert: "__invert__",
    nb$remainder: "__mod__",
    nb$reflected_remainder: "__rmod__",
    nb$divmod: "__divmod__",
    nb$reflected_divmod: "__rdivmod__",
    nb$power: "__pow__",
    nb$reflected_power: "__rpow__",
    sq$contains: "__contains__",
    nb$bool: "__bool__",
    nb$nonzero: "__nonzero__",

};


Sk.setupDunderMethods = function (py3) {
    if (py3) {
        Sk.dunderToSkulpt["__matmul__"] = "tp$matmul";
        Sk.dunderToSkulpt["__rmatmul__"] = "tp$reflected_matmul";
    } else {
        if (Sk.dunderToSkulpt["__matmul__"]) {
            delete Sk.dunderToSkulpt["__matmul__"];
        }
        if (Sk.dunderToSkulpt["__rmatmul__"]) {
            delete Sk.dunderToSkulpt["__rmatmul__"];
        }
    }
};
