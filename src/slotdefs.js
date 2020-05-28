Sk.generic.wrapperCallNoArgs = function (self, args, kwargs) {
    // this = the wrapped function
    Sk.abstr.checkNoArgs(this.$name, args, kwargs);
    const res = this.call(self);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
};

Sk.generic.wrapperFastCall = function (self, args, kwargs) {
    // this = the wrapped function
    const res = this.call(self, args, kwargs);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
};

Sk.generic.wrapperCallOneArg = function (self, args, kwargs) {
    // this = the wrapped function
    Sk.abstr.checkOneArg(this.$name, args, kwargs);
    const res = this.call(self, args[0]);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
};

Sk.generic.wrapperCallTernary = function (self, args, kwargs) {
    // this = the wrapped function
    // only used for __pow__
    Sk.abstr.checkNoKwargs(this.$name, kwargs);
    Sk.abstr.checkArgsLen(this.$name, args, 1, 2);
    const res = this.call(self, ...args);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
};

Sk.generic.wrapperSet = function (self, args, kwargs) {
    Sk.abstr.checkNoKwargs(this.$name, kwargs);
    Sk.abstr.checkArgsLen(this.$name, args, 2, 2);
    this.call(self, args[0], args[1]);
    return Sk.builtin.none.none$;
};

// Sk.generic.wrapperSetDelete = function() {};

// Sk.generic.wrapperDelete = function (set_name) {
//     return function (self, args, kwargs) {
//         const $name = this.$name;
//         Sk.abstr.checkNoKwargs(this.$name, kwargs);
//         Sk.abstr.checkOneArg($name, args, kwargs);
//         this.call(self, args[0], args[1]);
//         return Sk.builtin.none.none$;
//     };
// };

Sk.generic.wrapperRichCompare = function (self, args, kwargs) {
    const res = Sk.generic.wrapperCallOneArg.call(this, self, args, kwargs);
    if (res === Sk.builtin.NotImplemented.NotImplemented$) {
        return res;
    }
    return new Sk.builtin.bool(res);
};

Sk.generic.slotFuncNoArgs = function (dunderName) {
    return function () {
        const func = Sk.abstr.lookupSpecial(this, dunderName);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this);
        } else if (func !== undefined) {
            return Sk.misceval.callsimArray(func, [this]);
        }
        return;
    };
};



Sk.generic.slotFuncNoArgsWithCheck = function (dunderName, checkFunc, checkMsg) {
    return function () {
        let res;
        const func = Sk.abstr.lookupSpecial(this, dunderName);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this);
        } else if (func !== undefined) {
            res = Sk.misceval.callsimArray(func, [this]);
            if (!(checkFunc(res))) {
                throw new Sk.builtin.TypeError(dunderName + " should return " + checkMsg + " (returned " + Sk.abstr.typeName(res) + ")");
            }
        }
        return res;
    };
};

Sk.generic.slotFuncOneArg = function (dunderName) {
    return function (value) {
        const func = Sk.abstr.lookupSpecial(this, dunderName);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this, value);
        } else if (func !== undefined) {
            return Sk.misceval.callsimArray(func, [this, value]);
        }
        return;
    };
};

Sk.generic.slotFuncGetAttribute = function (pyName, canSuspend) {
    const func = Sk.abstr.lookupSpecial(this, "__getattribute__");
    if (func instanceof Sk.builtin.wrapper_descriptor) {
        return func.d$wrapped.call(this, pyName);
    } else if (canSuspend) {
        return Sk.misceval.callsimOrSuspendArray(func, [this, pyName]);
    } else {
        return Sk.misceval.callsimArray(func, [this, pyName]);
    }
};


Sk.generic.slotFuncFastCall = function (dunderName) {
    return function (args, kwargs) {
        const func = Sk.abstr.lookupSpecial(this, dunderName);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this, args, kwargs);
        }
        return Sk.misceval.callsimOrSuspendArray(func, [this, ...args], kwargs);
    };
};

Sk.generic.slotFuncSet = function (dunderName, error_msg) {
    return function (obj, value, canSuspend) {
        let res;
        const func = Sk.abstr.lookupSpecial(this, dunderName);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this, value);
        }
        const call_version = canSuspend ? Sk.misceval.callsimOrSuspendArray : Sk.misceval.callsimArray;
        if (func !== undefined) {
            res = call_version(func, [this, obj, value]);
        } else if (error_msg) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object " + error_msg);
        } else {
            throw new Sk.builtin.AttributeError(dunderName);
        }
        return res;
    };
};

Sk.generic.slotFuncDelete = function (dunderName, error_msg) {
    return function (obj, value, canSuspend) {
        //value should be null
        let res;
        const func = Sk.abstr.lookupSpecial(this, dunderName);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this, value);
        }
        const call_version = canSuspend ? Sk.misceval.callsimOrSuspendArray : Sk.misceval.callsimArray;
        if (func !== undefined) {
            res = call_version(func, [this, obj]);
        } else if (error_msg) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object " + error_msg);
        } else {
            throw new Sk.builtin.AttributeError(dunderName);
        }
        return res;
    };
};

// Sk.generic.slotFuncSetDelete = function (set_name, del_name, error_msg) {
//     return function (obj, value, canSuspend) {
//         let func, res;
//         if (value == null) {
//             // then we're deleting
//             func = Sk.abstr.lookupSpecial(this, del_name);
//         } else {
//             func = Sk.abstr.lookupSpecial(this, set_name);
//         }
//         if (func instanceof Sk.builtin.wrapper_descriptor) {
//             return func.d$wrapped.call(this, value);
//         }
//         const call_version = canSuspend ? Sk.misceval.callsimOrSuspendArray : Sk.misceval.callsimArray;
//         if (func !== undefined) {
//             res = value == null ? call_version(func, [this, obj]) : call_version(func, [this, obj, value]);
//         } else if (value == null) {
//             throw new Sk.builtin.AttributeError(del_name);
//         } else if (error_msg) {
//             throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object " + error_msg);
//         } else {
//             throw new Sk.builtin.AttributeError(set_name);
//         }
//         return res;
//     };
// };

Sk.slots = Object.create(null);
const slots = Sk.slots;

// tp slots
slots.__init__ = {
    $name: "__init__",
    $slot_name: "tp$init",
    $slot_func: function tp$init(args, kwargs) {
        const func = Sk.abstr.lookupSpecial(this, "__init__");
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this, args, kwargs);
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
    $slot_name: "tp$new",
    $slot_func: function tp$new(args, kwargs) {
        const func = Sk.abstr.lookupSpecial(this, "__new__");
        const new_args = [this.constructor].concat(args);
        if (func instanceof Sk.builtin.sk_method) {
            debugger;
            return func.tp$call(new_args, kwargs);
        }
        return Sk.misceval.callsimOrSuspendArray(func, new_args, kwargs);
    },
    $wrapper: null,
    $textsig: "($self, /, *args, **kwargs)",
    $flags: { FastCall: true },
    $doc: "Create and return a new object.",
};

slots.__call__ = {
    $name: "__call__",
    $slot_name: "tp$call",
    $slot_func: Sk.generic.slotFuncFastCall("__call__"),
    $wrapper: Sk.generic.wrapperFastCall,
    $textsig: "($self, /, *args, **kwargs)",
    $flags: { FastCall: true },
    $doc: "Call self as a function.",
};

slots.__repr__ = {
    $name: "__repr__",
    $slot_name: "$r",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__repr__", Sk.builtin.checkString, "str"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return repr(self).",
};

slots.__str__ = {
    $name: "__str__",
    $slot_name: "tp$str",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__str__", Sk.builtin.checkString, "str"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return str(self).",
};

slots.__hash__ = {
    $name: "__hash__",
    $slot_name: "tp$hash",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__hash__", Sk.builtin.checkInt, "int"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return hash(self).",
};

// getters/setters/deletters

slots.__getattribute__ = {
    $name: "__getattribute__",
    $slot_name: "tp$getattr",
    $slot_func: function tp$getattr(pyName, canSuspend) {
        debugger;
        const getattrFn = Sk.abstr.lookupSpecial(this, "__getattr__");
        if (getattrFn === undefined) {
            // we don't support dynamically created __getattr__ but hey...
            this.constructor.prototype.tp$getattr = Sk.generic.slotFuncGetAttribute;
            return Sk.generic.slotFuncGetAttribute.call(this, pyName, canSuspend);
        }
        const getattributeFn = Sk.abstr.lookupSpecial(this, "__getattribute__");
        const self = this;

        let r = Sk.misceval.chain(Sk.misceval.tryCatch(
            () => {
                if (getattributeFn instanceof Sk.builtin.wrapper_descriptor) {
                    return getattributeFn.d$wrapped.call(self, pyName, canSuspend);
                } else {
                    return Sk.misceval.callsimOrSuspendArray(getattributeFn, [self, pyName]);
                }
            },
            function (e) {
                if (e instanceof Sk.builtin.AttributeError) {
                    return undefined;
                } else {
                    throw e;
                }
            }
        ), (val) => {
            if (val !== undefined) {
                return val;
            }
            return Sk.misceval.callsimOrSuspendArray(getattrFn, [self, pyName]);

        });
        return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
    },
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, name, /)",
    $flags: { OneArg: true },
    $doc: "Return getattr(self, name).",
};

slots.__getattr__ = {
    $name: "__getattr__",
    $slot_name: "tp$getattr",
    $slot_func: slots.__getattribute__.$slot_func,
    $wrapper: null,
    $textsig: "($self, name, /)",
    $flags: { OneArg: true },
    $doc: "Return getattr(self, name).",
};

slots.__setattr__ = {
    $name: "__setattr__",
    $slot_name: "tp$setattr",
    $slot_func: Sk.generic.slotFuncSet("__setattr__"),
    // not need for an error message setattr is always defined on object
    $wrapper: Sk.generic.wrapperSet,
    $textsig: "($self, name, value, /)",
    $flags: { MinArgs: 2, MaxArgs: 2 },
    $doc: "Implement setattr(self, name, value).",
};

slots.__delattr__ = {
    $name: "__delattr__",
    $slot_name: "tp$setattr",
    $slot_func: Sk.generic.slotFuncDelete("__delattr__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, name, /)",
    $flags: { OneArg: true },
    $doc: "Implement delattr(self, name).",
};

slots.__get__ = {
    $name: "__get__",
    $slot_name: "tp$descr_get",
    $slot_func: function tp$descr_get(obj, obtype, canSuspend) {
        let res;
        const func = Sk.abstr.lookupSpecial(this, "__get__");
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this, obj, obtype);
        }
        const call_version = canSuspend ? Sk.misceval.callsimOrSuspendArray : Sk.misceval.callsimArray;
        if (func !== undefined) {
            res = call_version(func, [this, obj, obtype]);
        }
        return res;
    },
    $wrapper: function __get__(obj, obtype) { },
    $textsig: "($self, instance, owner, /)",
    $flags: { MinArgs: 2, MaxArgs: 2 },
    $doc: "Return an attribute of instance, which is of type owner.",
};

slots.__set__ = {
    $name: "__set__",
    $slot_name: "tp$descr_set",
    $slot_func: Sk.generic.slotFuncSet("__set__"),
    $wrapper: Sk.generic.wrapperSet,
    $textsig: "($self, instance, value, /)",
    $flags: { MinArgs: 2, MaxArgs: 2 },
    $doc: "Set an attribute of instance to value.",
};

slots.__delete__ = {
    $name: "__delete__",
    $slot_name: "tp$descr_set",
    $slot_func: Sk.generic.slotFuncDelete("__delete__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, instance, /)",
    $flags: { OneArg: true },
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
        $slot_name: "ob$eq",
        $slot_func: Sk.generic.slotFuncOneArg("__eq__"),
        $wrapper: Sk.generic.wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self==value.",
    };

    slots.__ge__ = {
        $name: "__ge__",
        $slot_name: "ob$ge",
        $slot_func: Sk.generic.slotFuncOneArg("__ge__"),
        $wrapper: Sk.generic.wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self>=value.",
    };

    slots.__gt__ = {
        $name: "__gt__",
        $slot_name: "ob$gt",
        $slot_func: Sk.generic.slotFuncOneArg("__gt__"),
        $wrapper: Sk.generic.wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self>value.",
    };

    slots.__le__ = {
        $name: "__le__",
        $slot_name: "ob$le",
        $slot_func: Sk.generic.slotFuncOneArg("__le__"),
        $wrapper: Sk.generic.wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self<=value.",
    };

    slots.__lt__ = {
        $name: "__lt__",
        $slot_name: "ob$lt",
        $slot_func: Sk.generic.slotFuncOneArg("__lt__"),
        $wrapper: Sk.generic.wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self<value.",
    };

    slots.__ne__ = {
        $name: "__ne__",
        $slot_name: "ob$ne",
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
    $slot_name: "tp$iter",
    $slot_func: Sk.generic.slotFuncNoArgs("__iter__"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Implement iter(self).",
};

slots.__next__ = {
    $name: "__next__",
    $slot_name: "tp$iternext",
    $slot_func: function tp$iternext(canSuspend) {
        let res;
        const func = Sk.abstr.lookupSpecial(this, Sk.builtin.str.$next);
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this);
        } else if (func !== undefined) {
            if (canSuspend) {
                const self = this;
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
    $wrapper: function (self, args, kwargs) {
        // this = the wrapped function
        Sk.abstr.checkNoArgs(this.$name, args, kwargs);
        return Sk.misceval.chain(this.call(self, true), (res) => {
            if (res === undefined) {
                throw new Sk.builtin.StopIteration();
            }
            return res;
        });
    },
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Implement next(self).",
};

// sequence and mapping
slots.__len__ = {
    $name: "__len__",
    $slot_name: "sq$length",
    $slot_func: function sq$length(canSuspend) {
        let res;
        const func = Sk.abstr.lookupSpecial(this, "__len__");
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this);
        } else if (func !== undefined) {
            if (canSuspend) {
                res = Sk.misceval.callsimOrSuspendArray(func, [this]);
                return Sk.misceval.chain(res, function (r) {
                    if (!Sk.builtin.checkInt(r)) {
                        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(res) + "' object cannot be interpreted as an integer");
                    }
                    return Sk.builtin.asnum$(r);
                });
            } else {
                res = Sk.misceval.callsimArray(func, [this]);
                if (!Sk.builtin.checkInt(res)) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(res) + "' object cannot be interpreted as an integer");
                }
                res = Sk.builtin.asnum$(res);
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
    $slot_name: "sq$contains",
    $slot_func: function sq$contains(key) {
        return Sk.misceval.isTrue(Sk.generic.slotFuncOneArg("__contiains__").call(this, key));
    },
    $wrapper: function __contains__(self, args, kwargs) {
        Sk.abstr.checkOneArg("__contains__", args, kwargs);
        return new Sk.builtin.bool(this.call(self, args[0]));
    },
    $textsig: "($self, key, /)",
    $flags: { OneArg: true },
    $doc: "Return key in self.",
};

slots.__getitem__ = {
    $name: "__getitem__",
    $slot_name: "mp$subscript",
    $slot_func: function mp$subscript(key, canSuspend) {
        const func = Sk.abstr.lookupSpecial(this, "__getitem__");
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this, key);
        }
        const call_version = canSuspend ? Sk.misceval.callsimOrSuspendArray : Sk.misceval.callsimArray;
        if (func !== undefined) {
            return call_version(func, [this, key]);
        }
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object is not subscriptable");
    },
    $wrapper: Sk.generic.slotFuncOneArg,
    $textsig: "($self, key, /)",
    $flags: { OneArg: true },
    $doc: "Return self[key].",
};

slots.__setitem__ = {
    $name: "__setitem__",
    $slot_name: "mp$ass_subscript",
    $slot_func: Sk.generic.slotFuncSet("__setitem__", "does not support item assignment"),
    $wrapper: Sk.generic.wrapperSet,
    $textsig: "($self, key, value, /)",
    $flags: { MinArgs: 2, MaxArgs: 2 },
    $doc: "Set self[key] to value.",
};

slots.__delitem__ = {
    $name: "__delitem__",
    $slot_name: "mp$ass_subscript",
    $slot_func: Sk.generic.slotFuncDelete("__delitem__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, key, /)",
    $flags: { OneArg: true },
    $doc: "Delete self[key].",
};


// number
slots.__add__ = {
    $name: "__add__",
    $slot_name: "nb$add",
    $slot_func: Sk.generic.slotFuncOneArg("__add__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self+value.",
};
slots.__radd__ = {
    $name: "__radd__",
    $slot_name: "nb$reflected_add",
    $slot_func: Sk.generic.slotFuncOneArg("__radd__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value+self.",
};
slots.__sub__ = {
    $name: "__sub__",
    $slot_name: "nb$subtract",
    $slot_func: Sk.generic.slotFuncOneArg("__sub__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self-value.",
};
slots.__rsub__ = {
    $name: "__rsub__",
    $slot_name: "nb$reflected_subtract",
    $slot_func: Sk.generic.slotFuncOneArg("__rsub__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value-self.",
};
slots.__mul__ = {
    $name: "__mul__",
    $slot_name: "nb$multiply",
    $slot_func: Sk.generic.slotFuncOneArg("__mul__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self*value.",
};
slots.__rmul__ = {
    $name: "__rmul__",
    $slot_name: "nb$reflected_multiply",
    $slot_func: Sk.generic.slotFuncOneArg("__rmul__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value*self.",
};
slots.__mod__ = {
    $name: "__mod__",
    $slot_name: "nb$remainder",
    $slot_func: Sk.generic.slotFuncOneArg("__mod__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self%value.",
};
slots.__rmod__ = {
    $name: "__rmod__",
    $slot_name: "nb$reflected_remainder",
    $slot_func: Sk.generic.slotFuncOneArg("__rmod__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value%self.",
};
slots.__divmod__ = {
    $name: "__divmod__",
    $slot_name: "nb$divmod",
    $slot_func: Sk.generic.slotFuncOneArg("__divmod__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return divmod(self, value).",
};
slots.__rdivmod__ = {
    $name: "__rdivmod__",
    $slot_name: "nb$reflected_divmod",
    $slot_func: Sk.generic.slotFuncOneArg("__rdivmod__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return divmod(value, self)",
};
slots.__pos__ = {
    $name: "__pos__",
    $slot_name: "nb$positive",
    $slot_func: Sk.generic.slotFuncNoArgs("__pos__"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "+self",
};
slots.__neg__ = {
    $name: "__neg__",
    $slot_name: "nb$negative",
    $slot_func: Sk.generic.slotFuncNoArgs("__neg__"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "-self",
};
slots.__abs__ = {
    $name: "__abs__",
    $slot_name: "nb$abs",
    $slot_func: Sk.generic.slotFuncNoArgs("__abs__"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "abs(self)",
};
slots.__bool__ = {
    $name: "__bool__",
    $slot_name: "nb$bool",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__bool__", Sk.builtin.checkBool, "bool"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "self != 0",
};
slots.__invert__ = {
    $name: "__invert__",
    $slot_name: "nb$invert",
    $slot_func: Sk.generic.slotFuncNoArgs("__invert__"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "~self",
};
slots.__lshift__ = {
    $name: "__lshift__",
    $slot_name: "nb$lshift",
    $slot_func: Sk.generic.slotFuncOneArg("__lshift__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self<<value.",
};
slots.__rlshift__ = {
    $name: "__rlshift__",
    $slot_name: "nb$lshift",
    $slot_func: Sk.generic.slotFuncOneArg("__rlshift__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value<<self.",
};
slots.__rshift__ = {
    $name: "__rshift__",
    $slot_name: "nb$rshift",
    $slot_func: Sk.generic.slotFuncOneArg("__rshift__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self>>value.",
};
slots.__rrshift__ = {
    $name: "__rrshift__",
    $slot_name: "nb$rshift",
    $slot_func: Sk.generic.slotFuncOneArg("__rrshift__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value>>self.",
};
slots.__and__ = {
    $name: "__and__",
    $slot_name: "nb$and",
    $slot_func: Sk.generic.slotFuncOneArg("__and__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self&value.",
};
slots.__rand__ = {
    $name: "__rand__",
    $slot_name: "nb$refelcted_and",
    $slot_func: Sk.generic.slotFuncOneArg("__rand__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value&self.",
};
slots.__xor__ = {
    $name: "__xor__",
    $slot_name: "nb$xor",
    $slot_func: Sk.generic.slotFuncOneArg("__xor__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self^value.",
};
slots.__rxor__ = {
    $name: "__rxor__",
    $slot_name: "nb$reflected_xor",
    $slot_func: Sk.generic.slotFuncOneArg("__rxor__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value^self.",
};
slots.__or__ = {
    $name: "__or__",
    $slot_name: "nb$or",
    $slot_func: Sk.generic.slotFuncOneArg("__or__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self|value.",
};
slots.__ror__ = {
    $name: "__ror__",
    $slot_name: "nb$reflected_or",
    $slot_func: Sk.generic.slotFuncOneArg("__and__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value|self.",
};
slots.__int__ = {
    $name: "__int__",
    $slot_name: "nb$int_",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__int__", Sk.builtin.checkInt, "int"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "int(self)",
};
slots.__float__ = {
    $name: "__float__",
    $slot_name: "nb$float_",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__float__", Sk.builtin.checkFloat, "float"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "float(self)",
};
slots.__floordiv__ = {
    $name: "__floordiv__",
    $slot_name: "nb$floor_divide",
    $slot_func: Sk.generic.slotFuncOneArg("__floordiv__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self//value.",
};
slots.__rfloordiv__ = {
    $name: "__rfloordiv__",
    $slot_name: "nb$reflected_floor_divide",
    $slot_func: Sk.generic.slotFuncOneArg("__rfloordiv__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value//self.",
};
slots.__truediv__ = {
    $name: "__truediv__",
    $slot_name: "nb$true_divide",
    $slot_func: Sk.generic.slotFuncOneArg("__truediv__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self/value.",
};
slots.__rtruediv__ = {
    $name: "__rtruediv__",
    $slot_name: "nb$reflected_true_divide",
    $slot_func: Sk.generic.slotFuncOneArg("__rtruediv__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value/self.",
};
slots.__index__ = {
    $name: "__index__",
    $slot_name: "nb$index",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__index__", Sk.builtin.checkInt, "int"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return self converted to an integer, if self is suitable for use as an index into a list.",
};
slots.__iadd__ = {
    $name: "__iadd__",
    $slot_name: "nb$inplace_add",
    $slot_func: Sk.generic.slotFuncOneArg("__iadd__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self+=value.",
};
slots.__imul__ = {
    $name: "__imul__",
    $slot_name: "nb$inplace_multiply",
    $slot_func: Sk.generic.slotFuncOneArg("__imul__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self*=value.",
};
slots.__pow__ = {
    $name: "__pow__",
    $slot_name: "nb$power",
    $slot_func: function (value, mod) {
        let res;
        const func = Sk.abstr.lookupSpecial(this, "__pow__");
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this, value, mod);
        }
        if (func !== undefined) {
            if (mod == undefined) {
                res = Sk.misceval.callsimArray(func, [this, value]);
            } else {
                res = Sk.misceval.callsimArray(func, [this, value, mod]);
            }
        }
        return res;
    },
    $wrapper: Sk.generic.wrapperCallTernary,
    $textsig: "__pow__($self, value, mod=None, /)",
    $flags: { MinArgs: 1, MaxArgs: 2 },
    $doc: "Return pow(self, value, mod).",
};
slots.__rpow__ = {
    $name: "__rpow__",
    $slot_name: "nb$reflected_power",
    $slot_func: function (value, mod) {
        let res;
        const func = Sk.abstr.lookupSpecial(this, "__rpow__");
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this, value, mod);
        }
        if (func !== undefined) {
            if (mod == undefined) {
                res = Sk.misceval.callsimArray(func, [this, value]);
            } else {
                res = Sk.misceval.callsimArray(func, [this, value, mod]);
            }
        }
        return res;
    },
    $wrapper: Sk.generic.wrapperCallTernary,
    $textsig: "__rpow__($self, value, mod=None, /)",
    $flags: { MinArgs: 1, MaxArgs: 2 },
    $doc: "Return pow(value, self, mod).",
};


// py2 ONLY slots
slots.__long__ = {
    $name: "__long__",
    $slot_name: "nb$long",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__long__", Sk.builtin.checkInt, "int"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "int(self)",
};

slots.__div__ = {
    $name: "__div__",
    $slot_name: "nb$divide",
    $slot_func: Sk.generic.slotFuncOneArg("__div__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, other/)",
    $flags: { OneArg: true },
    $doc: "x.__div__(y) <==> x/y",
};

slots.__rdiv__ = {
    $name: "__rdiv__",
    $slot_name: "nb$reflected_divide",
    $slot_func: Sk.generic.slotFuncOneArg("__rdiv__"),
    $wrapper: Sk.generic.wrapperCallOneArg,
    $textsig: "($self, other/)",
    $flags: { OneArg: true },
    $doc: "x.__rdiv__(y) <==> x/y",
};

slots.__nonzero__ = {
    $name: "__nonzero__",
    $slot_name: "nb$nonzero",
    $slot_func: Sk.generic.slotFuncNoArgsWithCheck("__nonzero__", Sk.builtin.checkInt, "int"),
    $wrapper: Sk.generic.wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "x.__nonzero__() <==> x != 0",
};


Sk.slotToDunder = {
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
    tp$descr_get: "__get__",
    tp$descr_set: ["__set__", "__delete__"],


    // iter
    tp$iter: "__iter__",
    tp$iternext: "__next__",

    // sequence and mapping slots
    sq$length: "__len__",
    sq$containes: "__contains__",
    tp$mp$subscript: "__getitem__",
    tp$mp$ass_subscript: ["__setitem__", "__delitem__"],


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
    "__str__": "tp$str",
    "__init__": "tp$init",
    "__new__": "tp$new",
    "__hash__": "tp$hash",

    "__eq__": "ob$eq",
    "__ne__": "ob$ne",
    "__lt__": "ob$lt",
    "__le__": "ob$le",
    "__gt__": "ob$gt",
    "__ge__": "ob$ge",

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

    "__bool__": "nb$bool",
    "__nonzero__": "nb$nonzero",

    "__len__": "sq$length",
    "__get__": "tp$descr_get",
    "__set__": "tp$descr_set",
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


