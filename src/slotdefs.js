function wrapperCallNoArgs(self, args, kwargs) {
    // this = the wrapped function
    Sk.abstr.checkNoArgs(this.$name, args, kwargs);
    const res = this.call(self);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
}

function wrapperFastCall(self, args, kwargs) {
    // this = the wrapped function
    const res = this.call(self, args, kwargs);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
}

function wrapperCallOneArg(self, args, kwargs) {
    // this = the wrapped function
    Sk.abstr.checkOneArg(this.$name, args, kwargs);
    const res = this.call(self, args[0]);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
}

function wrapperCallTernary(self, args, kwargs) {
    // this = the wrapped function
    // only used for __pow__
    Sk.abstr.checkNoKwargs(this.$name, kwargs);
    Sk.abstr.checkArgsLen(this.$name, args, 1, 2);
    const res = this.call(self, ...args);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
}

function wrapperSet(self, args, kwargs) {
    Sk.abstr.checkNoKwargs(this.$name, kwargs);
    Sk.abstr.checkArgsLen(this.$name, args, 2, 2);
    this.call(self, args[0], args[1]);
    return Sk.builtin.none.none$;
}


function wrapperRichCompare(self, args, kwargs) {
    const res = wrapperCallOneArg.call(this, self, args, kwargs);
    if (res === Sk.builtin.NotImplemented.NotImplemented$) {
        return res;
    }
    return new Sk.builtin.bool(res);
}

// taking the approach that if you have this slotFunc wrapper then you have the dunderFunc
// different to python
function slotFuncNoArgs(dunderFunc) {
    return function () {
        return Sk.misceval.callsimArray(dunderFunc, [this]);
    };
}

function slotFuncNoArgsWithCheck(dunderName, checkFunc, checkMsg, f) {
    return function (dunderFunc) {
        return function () {
            let res = Sk.misceval.callsimArray(dunderFunc, [this]);
            if (!checkFunc(res)) {
                throw new Sk.builtin.TypeError(dunderName + " should return " + checkMsg + " (returned " + Sk.abstr.typeName(res) + ")");
            }
            // f is might be a function that changes the result to a js object like for nb$bool which returns a Boolean
            if (f !== undefined) {
                return f(res);
            }
            return res;
        };
    };
}

function slotFuncOneArg(dunderFunc) {
    return function (value) {
        return Sk.misceval.callsimArray(dunderFunc, [this, value]);
    };
}

function slotFuncGetAttribute(pyName, canSuspend) {
    const func = Sk.abstr.lookupSpecial(this, Sk.builtin.str.$getattribute);
    let res;
    if (func instanceof Sk.builtin.wrapper_descriptor) {
        return func.d$wrapped.call(this, pyName, canSuspend);
    } else if (canSuspend) {
        res = Sk.misceval.callsimOrSuspendArray(func, [this, pyName]);
    } else {
        res = Sk.misceval.callsimArray(func, [this, pyName]);
    }
    return res;
}

function slotFuncFastCall(dunderFunc) {
    return function (args, kwargs) {
        return Sk.misceval.callsimOrSuspendArray(dunderFunc, [this, ...args], kwargs);
    };
}

/**
 * this is currently a bit of a hack
 * in attempting to maintain dual slots like mp$ass_subscript for assigning and deleting
 * this function has to do a type lookup... since it doesn't know in advance if it is being asked to set or delete
 */
function slotFuncSetDelete(set_name, del_name, error_msg) {
    return function (dunderFunc) {
        return function (pyName, value, canSuspend) {
            let res, dunderName;
            if (value == null) {
                dunderName = del_name;
                error_msg = null;
            } else {
                dunderName = set_name;
            }
            const func = Sk.abstr.lookupSpecial(this, new Sk.builtin.str(dunderName));
            if (func instanceof Sk.builtin.wrapper_descriptor) {
                return func.d$wrapped.call(this, pyName, value);
            }
            const call_version = canSuspend ? Sk.misceval.callsimOrSuspendArray : Sk.misceval.callsimArray;
            if (func !== undefined) {
                res = value == null ? call_version(func, [this, pyName]) : call_version(func, [this, pyName, value]);
            } else if (error_msg) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object " + error_msg);
            } else {
                throw new Sk.builtin.AttributeError(dunderName);
            }
            return res;
        };
    };
}

Sk.slots = Object.create(null);
const slots = Sk.slots;

// tp slots
slots.__init__ = {
    $name: "__init__",
    $slot_name: "tp$init",
    $slot_func: function (dunderFunc) {
        return function tp$init(args, kwargs) {
            let ret = Sk.misceval.callsimOrSuspendArray(dunderFunc, [this, ...args], kwargs);
            return Sk.misceval.chain(ret, function (r) {
                if (!Sk.builtin.checkNone(r) && r !== undefined) {
                    throw new Sk.builtin.TypeError("__init__() should return None, not " + Sk.abstr.typeName(r));
                } else {
                    return r;
                }
            });
        };
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
    $slot_func: function (dunderFunc) {
        const tp$new = function (args, kwargs) {
            return Sk.misceval.callsimOrSuspendArray(dunderFunc, [this.constructor, ...args], kwargs);
        };
        tp$new.sk$static_new = false; // this is a flag used in the __new__ algorithm
        return tp$new;
    },
    $wrapper: null, // handled separately since it's not a slot wrapper but an sk_method
    $textsig: "($self, /, *args, **kwargs)",
    $flags: { FastCall: true },
    $doc: "Create and return a new object.",
};

slots.__call__ = {
    $name: "__call__",
    $slot_name: "tp$call",
    $slot_func: slotFuncFastCall,
    $wrapper: wrapperFastCall,
    $textsig: "($self, /, *args, **kwargs)",
    $flags: { FastCall: true },
    $doc: "Call self as a function.",
};

slots.__repr__ = {
    $name: "__repr__",
    $slot_name: "$r",
    $slot_func: slotFuncNoArgsWithCheck("__repr__", Sk.builtin.checkString, "str"),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return repr(self).",
};

slots.__str__ = {
    $name: "__str__",
    $slot_name: "tp$str",
    $slot_func: slotFuncNoArgsWithCheck("__str__", Sk.builtin.checkString, "str"),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return str(self).",
};

slots.__hash__ = {
    $name: "__hash__",
    $slot_name: "tp$hash",
    $slot_func: slotFuncNoArgsWithCheck("__hash__", Sk.builtin.checkInt, "int"),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return hash(self).",
};

// getters/setters/deletters

slots.__getattribute__ = {
    $name: "__getattribute__",
    $slot_name: "tp$getattr",
    $slot_func: function (dunderFunc) {
        return function tp$getattr(pyName, canSuspend) {
            const getattrFn = Sk.abstr.lookupSpecial(this, Sk.builtin.str.$getattr);
            if (getattrFn === undefined) {
                // we don't support dynamically created __getattr__ but hey...
                this.constructor.prototype.tp$getattr = slotFuncGetAttribute;
                return slotFuncGetAttribute.call(this, pyName, canSuspend);
            }
            const getattributeFn = Sk.abstr.lookupSpecial(this, Sk.builtin.str.$getattribute);
            const self = this;

            let r = Sk.misceval.chain(
                Sk.misceval.tryCatch(
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
                ),
                (val) =>
                    Sk.misceval.tryCatch(
                        () => {
                            if (val !== undefined) {
                                return val;
                            }
                            return Sk.misceval.callsimOrSuspendArray(getattrFn, [self, pyName]);
                        },
                        function (e) {
                            if (e instanceof Sk.builtin.AttributeError) {
                                return undefined;
                            } else {
                                throw e;
                            }
                        }
                    )
            );
            return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
        };
    },
    $wrapper: function (self, args, kwargs) {
        // this = the wrapped function
        Sk.abstr.checkOneArg(this.$name, args, kwargs);
        const pyName = args[0];
        if (!Sk.builtin.checkString(pyName)) {
            throw new Sk.builtin.TypeError("attribute name must be string, not '" + Sk.abstr.typeName(pyName) + "'");
        }
        const res = this.call(self, pyName);
        if (res === undefined) {
            throw new Sk.builtin.AttributeError(Sk.abstr.typeName(self) + " has no attribute " + pyName.$jsstr());
        }
        return res;
    },
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
    $slot_func: slotFuncSetDelete("__setattr__", "__delattr__"),
    // not need for an error message setattr is always defined on object
    $wrapper: wrapperSet,
    $textsig: "($self, name, value, /)",
    $flags: { MinArgs: 2, MaxArgs: 2 },
    $doc: "Implement setattr(self, name, value).",
};

slots.__delattr__ = {
    $name: "__delattr__",
    $slot_name: "tp$setattr",
    $slot_func: slots.__setattr__.$slot_func,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, name, /)",
    $flags: { OneArg: true },
    $doc: "Implement delattr(self, name).",
};

slots.__get__ = {
    $name: "__get__",
    $slot_name: "tp$descr_get",
    $slot_func: function (dunderFunc) {
        return function tp$descr_get(obj, obtype, canSuspend) {
            const call_version = canSuspend ? Sk.misceval.callsimOrSuspendArray : Sk.misceval.callsimArray;
            if (obj === null) {
                obj = Sk.builtin.none.none$;
            }
            if (obtype == null) {
                obtype = Sk.builtin.none.none$;
            }
            return call_version(dunderFunc, [this, obj, obtype]);
        };
    },
    $wrapper: function (self, args, kwargs) {
        Sk.abstr.checkNoKwargs(this.$name, kwargs);
        Sk.abstr.checkArgsLen(this.$name, args, 1, 2);
        let obj = args[0];
        let obtype = args[1];
        if (obj === Sk.builtin.none.none$) {
            obj = null;
        }
        if (obtype === Sk.builtin.none.none$) {
            obtype = null;
        }
        if (obtype === null && obj === null) {
            throw new Sk.builtin.TypeError("__get__(None, None) is invalid");
        }
        return this.call(self, obj, obtype);
    },
    $textsig: "($self, instance, owner, /)",
    $flags: { MinArgs: 2, MaxArgs: 2 },
    $doc: "Return an attribute of instance, which is of type owner.",
};

slots.__set__ = {
    $name: "__set__",
    $slot_name: "tp$descr_set",
    $slot_func: slotFuncSetDelete("__set__", "__delete__"),
    $wrapper: wrapperSet,
    $textsig: "($self, instance, value, /)",
    $flags: { MinArgs: 2, MaxArgs: 2 },
    $doc: "Set an attribute of instance to value.",
};

slots.__delete__ = {
    $name: "__delete__",
    $slot_name: "tp$descr_set",
    $slot_func: slots.__set__.$slot_func,
    $wrapper: wrapperCallOneArg,
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
        $slot_func: slotFuncOneArg,
        $wrapper: wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self==value.",
    };

    slots.__ge__ = {
        $name: "__ge__",
        $slot_name: "ob$ge",
        $slot_func: slotFuncOneArg,
        $wrapper: wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self>=value.",
    };

    slots.__gt__ = {
        $name: "__gt__",
        $slot_name: "ob$gt",
        $slot_func: slotFuncOneArg,
        $wrapper: wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self>value.",
    };

    slots.__le__ = {
        $name: "__le__",
        $slot_name: "ob$le",
        $slot_func: slotFuncOneArg,
        $wrapper: wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self<=value.",
    };

    slots.__lt__ = {
        $name: "__lt__",
        $slot_name: "ob$lt",
        $slot_func: slotFuncOneArg,
        $wrapper: wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self<value.",
    };

    slots.__ne__ = {
        $name: "__ne__",
        $slot_name: "ob$ne",
        $slot_func: slotFuncOneArg,
        $wrapper: wrapperRichCompare,
        $textsig: "($self, value, /)",
        $flags: { OneArg: true },
        $doc: "Return self!=value.",
    };
}
// iters

slots.__iter__ = {
    $name: "__iter__",
    $slot_name: "tp$iter",
    $slot_func: slotFuncNoArgs,
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Implement iter(self).",
};

slots.__next__ = {
    $name: "__next__",
    $slot_name: "tp$iternext",
    $slot_func: function (dunderFunc) {
        return function tp$iternext(canSuspend) {
            const self = this;
            if (canSuspend) {
                return Sk.misceval.tryCatch(
                    () => Sk.misceval.callsimOrSuspendArray(dunderFunc, [self]),
                    (e) => {
                        if (e instanceof Sk.builtin.StopIteration) {
                            return undefined;
                        } else {
                            throw e;
                        }
                    }
                );
            }
            try {
                return Sk.misceval.callsimArray(dunderFunc, [this]);
            } catch (e) {
                if (e instanceof Sk.builtin.StopIteration) {
                    return undefined;
                } else {
                    throw e;
                }
            }
        };
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
    $slot_func: function (dunderFunc) {
        return function sq$length(canSuspend) {
            let res;
            if (canSuspend) {
                res = Sk.misceval.callsimOrSuspendArray(dunderFunc, [this]);
                return Sk.misceval.chain(res, (r) => {
                    return Sk.misceval.asIndexOrThrow(r, "'" + Sk.abstr.typeName(r) + "' object cannot be interpreted as an integer");
                });
            } else {
                res = Sk.misceval.callsimArray(dunderFunc, [this]);
                return Sk.misceval.asIndexOrThrow(res, "'" + Sk.abstr.typeName(res) + "' object cannot be interpreted as an integer");
            }
        };
    },
    $wrapper: function __len__(self, args, kwargs) {
        Sk.abstr.checkNoArgs("__len__", args, kwargs);
        return new Sk.builtin.int_(self.sq$length());
    },
    $flags: { NoArgs: true },
    $textsig: "($self, /)",
    $doc: "Return len(self).",
};

slots.__contains__ = {
    $name: "__contains__",
    $slot_name: "sq$contains",
    $slot_func: function (dunderFunc) {
        return function sq$contains(key, canSuspend) {
            let res = Sk.misceval.callsimOrSuspendArray(dunderFunc, [this, key]);
            res = Sk.misceval.chain(res, (r) => Sk.misceval.isTrue(r));
            if (res.$isSuspension) {
                return canSuspend ? res : Sk.misceval.retryOptionalSuspensionOrThrow(res);
            }
            return res;
        };
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
    $slot_func: function (dunderFunc) {
        return function mp$subscript(key, canSuspend) {
            const call_version = canSuspend ? Sk.misceval.callsimOrSuspendArray : Sk.misceval.callsimArray;
            return call_version(dunderFunc, [this, key]);
        };
    },
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, key, /)",
    $flags: { OneArg: true },
    $doc: "Return self[key].",
};

slots.__setitem__ = {
    $name: "__setitem__",
    $slot_name: "mp$ass_subscript",
    $slot_func: slotFuncSetDelete("__setitem__", "__delitem__", "does not support item assignment"),
    $wrapper: wrapperSet,
    $textsig: "($self, key, value, /)",
    $flags: { MinArgs: 2, MaxArgs: 2 },
    $doc: "Set self[key] to value.",
};

slots.__delitem__ = {
    $name: "__delitem__",
    $slot_name: "mp$ass_subscript",
    $slot_func: slots.__setitem__.$slot_func,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, key, /)",
    $flags: { OneArg: true },
    $doc: "Delete self[key].",
};

// number
slots.__add__ = {
    $name: "__add__",
    $slot_name: "nb$add",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self+value.",
};
slots.__radd__ = {
    $name: "__radd__",
    $slot_name: "nb$reflected_add",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value+self.",
};
slots.__iadd__ = {
    $name: "__iadd__",
    $slot_name: "nb$inplace_add",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self+=value.",
};
slots.__sub__ = {
    $name: "__sub__",
    $slot_name: "nb$subtract",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self-value.",
};
slots.__rsub__ = {
    $name: "__rsub__",
    $slot_name: "nb$reflected_subtract",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value-self.",
};
slots.__imul__ = {
    $name: "__imul__",
    $slot_name: "nb$inplace_multiply",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self*=value.",
};
slots.__mul__ = {
    $name: "__mul__",
    $slot_name: "nb$multiply",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self*value.",
};
slots.__rmul__ = {
    $name: "__rmul__",
    $slot_name: "nb$reflected_multiply",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value*self.",
};
slots.__isub__ = {
    $name: "__isub__",
    $slot_name: "nb$inplace_subtract",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self-=value.",
};
slots.__mod__ = {
    $name: "__mod__",
    $slot_name: "nb$remainder",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self%value.",
};
slots.__rmod__ = {
    $name: "__rmod__",
    $slot_name: "nb$reflected_remainder",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value%self.",
};
slots.__imod__ = {
    $name: "__imod__",
    $slot_name: "nb$inplace_remainder",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement value%=self.",
};
slots.__divmod__ = {
    $name: "__divmod__",
    $slot_name: "nb$divmod",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return divmod(self, value).",
};
slots.__rdivmod__ = {
    $name: "__rdivmod__",
    $slot_name: "nb$reflected_divmod",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return divmod(value, self)",
};
slots.__pos__ = {
    $name: "__pos__",
    $slot_name: "nb$positive",
    $slot_func: slotFuncNoArgs,
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "+self",
};
slots.__neg__ = {
    $name: "__neg__",
    $slot_name: "nb$negative",
    $slot_func: slotFuncNoArgs,
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "-self",
};
slots.__abs__ = {
    $name: "__abs__",
    $slot_name: "nb$abs",
    $slot_func: slotFuncNoArgs,
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "abs(self)",
};
slots.__bool__ = {
    $name: "__bool__",
    $slot_name: "nb$bool",
    $slot_func: slotFuncNoArgsWithCheck("__bool__", Sk.builtin.checkBool, "bool", (res) => res.v !== 0),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "self != 0",
};
slots.__invert__ = {
    $name: "__invert__",
    $slot_name: "nb$invert",
    $slot_func: slotFuncNoArgs,
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "~self",
};
slots.__lshift__ = {
    $name: "__lshift__",
    $slot_name: "nb$lshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self<<value.",
};
slots.__rlshift__ = {
    $name: "__rlshift__",
    $slot_name: "nb$reflected_lshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value<<self.",
};
slots.__rshift__ = {
    $name: "__rshift__",
    $slot_name: "nb$rshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self>>value.",
};
slots.__rrshift__ = {
    $name: "__rrshift__",
    $slot_name: "nb$reflected_rshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value>>self.",
};
slots.__ilshift__ = {
    $name: "__ilshift__",
    $slot_name: "nb$inplace_lshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self<<=value.",
};
slots.__irshift__ = {
    $name: "__irshift__",
    $slot_name: "nb$inplace_rshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self=>>value.",
};
slots.__and__ = {
    $name: "__and__",
    $slot_name: "nb$and",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self&value.",
};
slots.__rand__ = {
    $name: "__rand__",
    $slot_name: "nb$refelcted_and",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value&self.",
};
slots.__iand__ = {
    $name: "__iand__",
    $slot_name: "nb$and",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self&=value.",
};
slots.__xor__ = {
    $name: "__xor__",
    $slot_name: "nb$xor",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self^value.",
};
slots.__rxor__ = {
    $name: "__rxor__",
    $slot_name: "nb$reflected_xor",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value^self.",
};
slots.__ixor__ = {
    $name: "__ixor__",
    $slot_name: "nb$inplace_xor",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self^=value.",
};
slots.__or__ = {
    $name: "__or__",
    $slot_name: "nb$or",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self|value.",
};
slots.__ror__ = {
    $name: "__ror__",
    $slot_name: "nb$reflected_or",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value|self.",
};
slots.__ior__ = {
    $name: "__ior__",
    $slot_name: "nb$inplace_or",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self|=value.",
};
slots.__int__ = {
    $name: "__int__",
    $slot_name: "nb$int_",
    $slot_func: slotFuncNoArgsWithCheck("__int__", Sk.builtin.checkInt, "int"),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "int(self)",
};
slots.__float__ = {
    $name: "__float__",
    $slot_name: "nb$float_",
    $slot_func: slotFuncNoArgsWithCheck("__float__", Sk.builtin.checkFloat, "float"),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "float(self)",
};
slots.__floordiv__ = {
    $name: "__floordiv__",
    $slot_name: "nb$floor_divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self//value.",
};
slots.__rfloordiv__ = {
    $name: "__rfloordiv__",
    $slot_name: "nb$reflected_floor_divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value//self.",
};
slots.__ifloordiv__ = {
    $name: "__ifloordiv__",
    $slot_name: "nb$inplace_floor_divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self//=value.",
};
slots.__truediv__ = {
    $name: "__truediv__",
    $slot_name: "nb$divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self/value.",
};
slots.__rtruediv__ = {
    $name: "__rtruediv__",
    $slot_name: "nb$reflected_divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value/self.",
};
slots.__itruediv__ = {
    $name: "__itruediv__",
    $slot_name: "nb$inplace_divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self/=value.",
};

slots.__index__ = {
    $name: "__index__",
    $slot_name: "nb$index",
    $slot_func: slotFuncNoArgsWithCheck("__index__", Sk.builtin.checkInt, "int"),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return self converted to an integer, if self is suitable for use as an index into a list.",
};
slots.__pow__ = {
    $name: "__pow__",
    $slot_name: "nb$power",
    $slot_func: function (dunderFunc) {
        return function (value, mod) {
            if (mod == undefined) {
                return Sk.misceval.callsimArray(dunderFunc, [this, value]);
            } else {
                return Sk.misceval.callsimArray(dunderFunc, [this, value, mod]);
            }
        };
    },
    $wrapper: wrapperCallTernary,
    $textsig: "($self, value, mod=None, /)",
    $flags: { MinArgs: 1, MaxArgs: 2 },
    $doc: "Return pow(self, value, mod).",
};
slots.__rpow__ = {
    $name: "__rpow__",
    $slot_name: "nb$reflected_power",
    $slot_func: slots.__pow__.$slot_func,
    $wrapper: wrapperCallTernary,
    $textsig: "($self, value, mod=None, /)",
    $flags: { MinArgs: 1, MaxArgs: 2 },
    $doc: "Return pow(value, self, mod).",
};
slots.__ipow__ = {
    $name: "__ipow__",
    $slot_name: "nb$inplace_power",
    $slot_func: slots.__pow__.$slot_func,
    $wrapper: wrapperCallTernary,
    $textsig: "($self, value, mod=None, /)",
    $flags: { MinArgs: 1, MaxArgs: 2 },
    $doc: "Implement **=",
};

slots.__matmul__ = {
    $name: "__matmul__",
    $slot_name: "nb$matrix_multiply",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self@value.",
};
slots.__rmatmul__ = {
    $name: "__rmatmul__",
    $slot_name: "nb$reflected_matrix_multiply",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value@self.",
};
slots.__imatmul__ = {
    $name: "__imatmul__",
    $slot_name: "nb$inplace_matrix_multiply",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self@=value.",
};

// py2 ONLY slots
slots.__long__ = {
    $name: "__long__",
    $slot_name: "nb$lng",
    $slot_func: slotFuncNoArgsWithCheck("__long__", Sk.builtin.checkInt, "int"),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "int(self)",
};

var py3$slots;
var py2$slots = {
    next: {
        $name: "next",
        $slot_name: "tp$iternext",
        $slot_func: slots.__next__.$slot_func,
        $wrapper: slots.__next__.$wrapper,
        $textsig: slots.__next__.$textsig,
        $flags: slots.__next__.$flags,
    },
    __nonzero__: {
        $name: "__nonzero__",
        $slot_name: "nb$bool",
        $slot_func: slotFuncNoArgsWithCheck("__nonzero__", Sk.builtin.checkInt, "int", (res) => res.v !== 0),
        $wrapper: wrapperCallNoArgs,
        $textsig: "($self, /)",
        $flags: { NoArgs: true },
        $doc: "x.__nonzero__() <==> x != 0",
    },
    __div__: {
        $name: "__div__",
        $slot_name: "nb$divide",
        $slot_func: slotFuncOneArg,
        $wrapper: wrapperCallOneArg,
        $textsig: "($self, other/)",
        $flags: { OneArg: true },
        $doc: "x.__div__(y) <==> x/y",
    },
    __rdiv__: {
        $name: "__rdiv__",
        $slot_name: "nb$reflected_divide",
        $slot_func: slotFuncOneArg,
        $wrapper: wrapperCallOneArg,
        $textsig: "($self, other/)",
        $flags: { OneArg: true },
        $doc: "x.__rdiv__(y) <==> x/y",
    },
    __idiv__: {
        $name: "__idiv__",
        $slot_name: "nb$inplace_divide",
        $slot_func: slotFuncOneArg,
        $wrapper: wrapperCallOneArg,
        $textsig: "($self, other/)",
        $flags: { OneArg: true },
        $doc: "implement self /= other",
    },
};

Sk.subSlots = {
    main_slots: {
        // nb we handle tp$new differently
        // tp_slots
        tp$init: "__init__",
        tp$call: "__call__",
        $r: "__repr__",
        // tp$hash: "__hash__", // do tp$hash separately since it could be None
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
    },

    number_slots: {
        nb$abs: "__abs__",
        nb$negative: "__neg__",
        nb$positive: "__pos__",
        nb$int_: "__int__",
        nb$lng: "__long__",
        nb$float_: "__float__",
        nb$add: "__add__",
        nb$reflected_add: "__radd__",
        nb$inplace_add: "__iadd__",
        nb$subtract: "__sub__",
        nb$reflected_subtract: "__rsub__",
        nb$inplace_subtract: "__isub__",
        nb$multiply: "__mul__",
        nb$reflected_multiply: "__rmul__",
        nb$inplace_multiply: "__imul__",
        nb$floor_divide: "__floordiv__",
        nb$reflected_floor_divide: "__rfloordiv__",
        nb$inplace_floor_divide: "__ifloordiv__",
        nb$invert: "__invert__",
        nb$remainder: "__mod__",
        nb$reflected_remainder: "__rmod__",
        nb$inplace_mod: "__imod__",
        nb$divmod: "__divmod__",
        nb$reflected_divmod: "__rdivmod__",
        nb$power: "__pow__",
        nb$reflected_power: "__rpow__",
        nb$inplace_power: "__ipow__",
        nb$divide: "__truediv__", // TODO: think about py2 vs py3 truediv vs div
        nb$reflected_divide: "__rtruediv__",
        nb$inplace_divide: "__itruediv__",

        nb$bool: "__bool__",

        nb$and: "__and__",
        nb$reflected_and: "__rand__",
        nb$inplace_and: "__iand__",
        nb$or: "__or__",
        nb$reflected_or: "__ror__",
        nb$inplace_or: "__ior__",
        nb$xor: "__xor__",
        nb$reflected_xor: "__rxor__",
        nb$inplace_xor: "__ixor__",

        nb$lshift: "__lshift__",
        nb$reflected_lshift: "__rlshift__",
        nb$rshift: "__rshift__",
        nb$reflected_rshift: "__rrshift__",
        nb$inplace_lshift: "__ilshift__",
        nb$inplace_rshift: "__irshift__",
    },

    sequence_and_mapping_slots: {
        // sequence and mapping slots
        sq$length: "__len__",
        sq$contains: "__contains__",
        mp$subscript: "__getitem__",
        mp$ass_subscript: ["__setitem__", "__delitem__"],
        nb$add: "__add__",
        nb$multiply: "__mul__",
        nb$reflected_multiply: "__rmul__",
        nb$inplace_add: "__iadd__",
        nb$inplace_multiply: "__imul__",
    },
};

Sk.reflectedNumberSlots = {
    nb$add: { reflected: "nb$reflected_add" },
    nb$subtract: {
        reflected: "nb$reflected_subtract",
        slot: function (other) {
            if (other instanceof this.constructor) {
                return other.nb$subtract(this);
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
    nb$multiply: { reflected: "nb$reflected_multiply" },
    nb$divide: {
        reflected: "nb$reflected_divide",
        slot: function (other) {
            if (other instanceof this.constructor) {
                return other.nb$divide(this);
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
    nb$floor_divide: {
        reflected: "nb$reflected_floor_divide",
        slot: function (other) {
            if (other instanceof this.constructor) {
                return other.nb$floor_divide(this);
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
    nb$remainder: {
        reflected: "nb$reflected_remainder",
        slot: function (other) {
            if (other instanceof this.constructor) {
                return other.nb$remainder(this);
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
    nb$divmod: {
        reflected: "nb$reflected_divmod",
        slot: function (other) {
            if (other instanceof this.constructor) {
                return other.nb$divmod(this);
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
    nb$power: {
        reflected: "nb$reflected_power",
        slot: function (other, mod) {
            if (other instanceof this.constructor) {
                return other.nb$power(this, mod);
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
    nb$and: { reflected: "nb$reflected_and" },
    nb$or: { reflected: "nb$reflected_or" },
    nb$xor: { reflected: "nb$reflected_xor" },
    nb$lshift: {
        reflected: "nb$reflected_lshift",
        slot: function (other) {
            if (other instanceof this.constructor) {
                return other.nb$lshift(this);
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
    nb$rshift: {
        reflected: "nb$reflected_rshift",
        slot: function (other) {
            if (other instanceof this.constructor) {
                return other.nb$rshift(this);
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
    nb$matrix_multiply: {
        reflected: "nb$reflexted_matrix_multiply",
        slot: function (other) {
            if (other instanceof this.constructor) {
                return other.nb$matrix_multiply(this);
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
};

Sk.sequenceAndMappingSlots = {
    sq$concat: ["nb$add"],
    sq$repeat: ["nb$multiply", "nb$reflected_multiply"],
    mp$length: ["sq$length"],
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
    __repr__: "$r",
    __str__: "tp$str",
    __init__: "tp$init",
    __new__: "tp$new",
    __hash__: "tp$hash",
    __call__: "tp$call",

    __eq__: "ob$eq",
    __ne__: "ob$ne",
    __lt__: "ob$lt",
    __le__: "ob$le",
    __gt__: "ob$gt",
    __ge__: "ob$ge",

    __abs__: "nb$abs",
    __neg__: "nb$negative",
    __pos__: "nb$positive",
    __int__: "nb$int_",
    __float__: "nb$float_",

    __add__: "nb$add",
    __radd__: "nb$reflected_add",
    __iadd__: "nb$inplace_add",
    __sub__: "nb$subtract",
    __rsub__: "nb$reflected_subtract",
    __isub__: "nb$inplace_subtract",
    __mul__: "nb$multiply",
    __rmul__: "nb$reflected_multiply",
    __imul__: "nb$inplace_multiply",
    __truediv__: "nb$divide",
    __rtruediv__: "nb$reflected_divide",
    __itruediv__: "nb$inplace_divide",
    __floordiv__: "nb$floor_divide",
    __rfloordiv__: "nb$reflected_floor_divide",
    __ifloordiv__: "nb$inplace_floor_divide",
    __invert__: "nb$invert",
    __mod__: "nb$remainder",
    __rmod__: "nb$reflected_remainder",
    __imod__: "nb$inplace_remainder",
    __divmod__: "nb$divmod",
    __rdivmod__: "nb$reflected_divmod", //no inplace divmod
    __pow__: "nb$power",
    __rpow__: "nb$reflected_power",
    __ipow__: "nb$inplace_power",

    __bool__: "nb$bool",
    // py2 only
    __long__: "nb$lng",

    __lshift__: "nb$lshift",
    __rlshift__: "nb$reflected_lshift",
    __ilshift__: "nb$inplace_lshift",
    __rshift__: "nb$rshift",
    __rrshift__: "nb$reflected_rshift",
    __irshift__: "nb$inplace_rshift",

    __and__: "nb$and",
    __rand__: "nb$reflected_and",
    __iand__: "nb$inplace_and",
    __or__: "nb$or",
    __ror__: "nb$reflected_or",
    __ior__: "nb$inplace_or",
    __xor__: "nb$xor",
    __rxor__: "nb$reflected_xor",
    __ixor__: "nb$inplace_xor",

    __matmul__: "nb$matrix_multiply",
    __rmatmul__: "nb$reflected_matrix_multiply",
    __imatmul__: "nb$inplace_matrix_multiply",

    __get__: "tp$descr_get",
    __set__: "tp$descr_set",
    __delete__: "tp$descr_set",

    __getattribute__: "tp$getattr",
    __getattr__: "tp$getattr",
    __setattr__: "tp$setattr",
    __delattr__: "tp$setattr",

    __len__: "sq$length",
    __contains__: "sq$contains",
    __getitem__: "mp$subscript",
    __setitem__: "mp$ass_subscript",
    __delitem__: "mp$ass_subscript",
};

Sk.exportSymbol("Sk.setupDunderMethods", Sk.setupDunderMethods);

Sk.setupDunderMethods = function (py3) {
    const slots = Sk.slots;
    if (py3 && py3$slots === undefined) {
        // assume python3 switch version if we have to
        return;
    }
    const classes_with_next = [
        Sk.builtin.list_iter_,
        Sk.builtin.set_iter_,
        Sk.builtin.str_iter_,
        Sk.builtin.tuple_iter_,
        Sk.builtin.generator,
        Sk.builtin.enumerate,
        Sk.builtin.filter_,
        Sk.builtin.zip_,
        Sk.builtin.reversed,
        Sk.builtin.map_,
        Sk.builtin.seq_iter_,
        Sk.builtin.callable_iter_,
        Sk.builtin.reverselist_iter_,
        Sk.builtin.dict_iter_,
        Sk.builtin.dict_itemiter_,
        Sk.builtin.dict_valueiter_,
        Sk.builtin.dict_reverse_iter_,
        Sk.builtin.dict_reverse_itemiter_,
        Sk.builtin.dict_reverse_valueiter_,
        Sk.builtin.range_iter_,
        Sk.builtin.revereserange_iter_,
        Sk.generic.iterator,
    ];
    const classes_with_bool = [Sk.builtin.int_, Sk.builtin.lng, Sk.builtin.float_, Sk.builtin.complex];
    const classes_with_divide = classes_with_bool;
    const number_slots = Sk.subSlots.number_slots;
    const main_slots = Sk.subSlots.main_slots;
    const dunderToSkulpt = Sk.dunderToSkulpt;

    function switch_version(classes_with, old_meth, new_meth) {
        for (let i = 0; i < classes_with.length; i++) {
            const cls_proto = classes_with[i].prototype;
            if (cls_proto.hasOwnProperty(new_meth)) {
                continue;
            }
            cls_proto[new_meth] = cls_proto[old_meth];
            delete cls_proto[old_meth];
        }
    }

    if (py3) {
        Sk.builtin.str.$next = new Sk.builtin.str("__next__");
        dunderToSkulpt.__bool__ = "nb$bool";
        dunderToSkulpt.__next__ = "tp$iternext";

        delete dunderToSkulpt.__nonzero__;
        delete dunderToSkulpt.__div__;
        delete dunderToSkulpt.__rdiv__;
        delete dunderToSkulpt.__idiv__;
        delete dunderToSkulpt.next;

        for (let slot_name in py3$slots) {
            slots[slot_name] = py3$slots[slot_name];
        }
        for (let slot_name in py2$slots) {
            delete slots[slot_name];
        }
        for (let i = 0; i < classes_with_divide.length; i++) {
            const cls_proto = classes_with_divide[i].prototype;
            delete cls_proto.__div__;
            delete cls_proto.__rdiv__;
        }

        main_slots.tp$iternext = "__next__";
        number_slots.nb$bool = "__bool__";
        switch_version(classes_with_next, "next", "__next__");
        switch_version(classes_with_bool, "__bool__", "__nonzero__");
    } else {
        if (py3$slots === undefined) {
            slots.py3$slots = {
                __next__: slots.__next__,
            };
            py3$slots = slots.py3$slots;
        }
        Sk.builtin.str.$next = new Sk.builtin.str("next");
        dunderToSkulpt.next = "tp$iternext";
        dunderToSkulpt.__nonzero__ = "nb$bool";
        dunderToSkulpt.__div__ = "nb$divide";
        dunderToSkulpt.__rdiv__ = "nb$reflected_divide";
        dunderToSkulpt.__idiv__ = "nb$inplace_divide";
        delete dunderToSkulpt.__bool__;
        delete dunderToSkulpt.__next__;

        for (let slot_name in py2$slots) {
            slots[slot_name] = py2$slots[slot_name];
        }
        for (let slot_name in py3$slots) {
            delete slots[slot_name];
        }

        main_slots.tp$iternext = "next";
        number_slots.nb$bool = "__nonzero__";
        switch_version(classes_with_next, "__next__", "next");
        switch_version(classes_with_bool, "__nonzero__", "__bool__");

        for (let i = 0; i < classes_with_divide.length; i++) {
            const cls = classes_with_divide[i];
            const cls_proto = cls.prototype;
            if (cls_proto.hasOwnProperty("__div__")) {
                continue;
            }
            cls_proto.__div__ = new Sk.builtin.wrapper_descriptor(cls, py2$slots.__div__, cls_proto.nb$divide);
            cls_proto.__rdiv__ = new Sk.builtin.wrapper_descriptor(cls, py2$slots.__rdiv__, Sk.reflectedNumberSlots.nb$divide.slot);
        }
    }
};
