/** @typedef {Sk.builtin.object} */ var pyObject;
/** @typedef {Sk.builtin.type|Function} */ var typeObject;

/**
 * @description
 * Wrappers and slot functions
 *
 * A wrapper function wrapper a slot defined on the prototype of a builtin type object
 * typically a a slot wrapper will be called with a self argument and args and kwargs
 *
 * self becomes this in when the slot wrapper is called
 * the slot wrapper_descriptor object takes care of checking that self is an instance of the type object
 * @param {*} self
 * @param {Array} args
 * @param {Array=} kwargs
 * @ignore
 */
function wrapperCallNoArgs(self, args, kwargs) {
    // this = the wrapped function
    Sk.abstr.checkNoArgs(this.$name, args, kwargs);
    const res = this.call(self);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
}

function wrapperCallNoArgsSuspend(self, args, kwargs) {
    // this = the wrapped function
    Sk.abstr.checkNoArgs(this.$name, args, kwargs);
    const res = this.call(self, true);
    return Sk.misceval.chain(res, (res) => {
        if (res === undefined) {
            return Sk.builtin.none.none$;
        }
        return res;
    });
}

/**
 * @param {*} self
 * @param {Array} args
 * @param {Array=} kwargs
 * @ignore
 */
function wrapperFastCall(self, args, kwargs) {
    // this = the wrapped function
    const res = this.call(self, args, kwargs);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
}

/**
 * @param {*} self
 * @param {Array} args
 * @param {Array=} kwargs
 * @ignore
 */
function wrapperCallOneArg(self, args, kwargs) {
    // this = the wrapped function
    Sk.abstr.checkOneArg(this.$name, args, kwargs);
    const res = this.call(self, args[0]);
    if (res === undefined) {
        return Sk.builtin.none.none$;
    }
    return res;
}

function wrapperCallOneArgSuspend(self, args, kwargs) {
    // this = the wrapped function
    Sk.abstr.checkOneArg(this.$name, args, kwargs);
    const res = this.call(self, args[0], true);
    return Sk.misceval.chain(res, (res) => {
        if (res === undefined) {
            return Sk.builtin.none.none$;
        }
        return res;
    });
}

/**
 * @param {*} self
 * @param {!Array} args
 * @param {Array=} kwargs
 * @ignore
 */
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
/**
 * @param {*} self
 * @param {Array} args
 * @param {Array=} kwargs
 * @ignore
 */
function wrapperSet(self, args, kwargs) {
    Sk.abstr.checkNoKwargs(this.$name, kwargs);
    Sk.abstr.checkArgsLen(this.$name, args, 2, 2);
    return Sk.misceval.chain(this.call(self, args[0], args[1], true), () => Sk.builtin.none.none$);
}

function wrapperDel(self, args, kwargs) {
    // this = the wrapped function
    Sk.abstr.checkOneArg(this.$name, args, kwargs);
    const res = this.call(self, args[0], undefined, true);
    return Sk.misceval.chain(res, (res) => {
        if (res === undefined) {
            return Sk.builtin.none.none$;
        }
        return res;
    });
}

/**
 * @param {*} self
 * @param {Array} args
 * @param {Array=} kwargs
 * @ignore
 */
function wrapperRichCompare(self, args, kwargs) {
    const res = wrapperCallOneArg.call(this, self, args, kwargs);
    if (res === Sk.builtin.NotImplemented.NotImplemented$) {
        return res;
    }
    return new Sk.builtin.bool(res);
}

function wrapperCallBack(wrapper, callback, canSuspend) {
    return function (self, args, kwargs) {
        const res = wrapper.call(this, self, args, kwargs);
        return canSuspend
            ? Sk.misceval.chain(res, callback)
            : callback(Sk.misceval.retryOptionalSuspensionOrThrow(res));
    };
}

/**
 * @description
 * Slot functions are wrappers around an Sk.builtin.func
 * if skulpt calls tp$init on a type object the slotFunc will call the Sk.builtin.func
 *
 * with most slots we take the approach that we know which dunderFunc will be called
 * However some slots currently double up
 * e.g. mp$ass_subscript is called by both __setitem__ and __delitem__
 * for these dual slots we need to do a typelookup
 *
 * __getattr__ is another complicated case and the algorithm largely follows Cpython's algorithm
 * @ignore
 */
function slotFuncNoArgs(dunderFunc) {
    return function () {
        const func = dunderFunc.tp$descr_get ? dunderFunc.tp$descr_get(this, this.ob$type) : dunderFunc;
        return Sk.misceval.callsimArray(func, []);
    };
}

/**
 * @param {string} dunderName
 * @param {Function} checkFunc
 * @param {string} checkMsg
 * @param {Function=} f
 * @ignore
 */
function slotFuncNoArgsWithCheck(dunderName, checkFunc, checkMsg, f) {
    return function (dunderFunc) {
        return function () {
            const func = dunderFunc.tp$descr_get ? dunderFunc.tp$descr_get(this, this.ob$type) : dunderFunc;
            let res = Sk.misceval.callsimArray(func, []);
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
        const func = dunderFunc.tp$descr_get ? dunderFunc.tp$descr_get(this, this.ob$type) : dunderFunc;
        return Sk.misceval.callsimArray(func, [value]);
    };
}

function slotFuncGetAttribute(pyName, canSuspend) {
    let getattributeFn = this.ob$type.$typeLookup(Sk.builtin.str.$getattribute);
    if (getattributeFn instanceof Sk.builtin.wrapper_descriptor) {
        // we're assuming here that internal tp$getattr won't raise an exception
        return getattributeFn.d$wrapped.call(this, pyName, canSuspend);
    }
    if (getattributeFn.tp$descr_get) {
        getattributeFn = getattributeFn.tp$descr_get(this, this.ob$type);
    }
    const ret = Sk.misceval.tryCatch(
        () => Sk.misceval.callsimOrSuspendArray(getattributeFn, [pyName]),
        (e) => {
            if (e instanceof Sk.builtin.AttributeError) {
                return undefined;
            } else {
                throw e;
            }
        }
    );
    return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
}

function slotFuncFastCall(dunderFunc) {
    return function (args, kwargs) {
        const func = dunderFunc.tp$descr_get ? dunderFunc.tp$descr_get(this, this.ob$type) : dunderFunc;
        return Sk.misceval.callsimOrSuspendArray(func, args, kwargs);
    };
}

/**
 * this is currently a bit of a hack
 * in attempting to maintain dual slots like mp$ass_subscript for assigning and deleting
 * this function has to do a type lookup... since it doesn't know in advance if it is being asked to set or delete
 * @ignore
 */
function slotFuncSetDelete(set_name, del_name, error_msg) {
    return function (dunderFunc) {
        return function (pyObject, value, canSuspend) {
            let res, dunderName;
            if (value === undefined) {
                dunderName = del_name;
                error_msg = null;
            } else {
                dunderName = set_name;
            }
            // do a type lookup and a wrapped function directly
            let func = this.ob$type.$typeLookup(new Sk.builtin.str(dunderName));
            if (func instanceof Sk.builtin.wrapper_descriptor) {
                return func.d$wrapped.call(this, pyObject, value);
            }
            if (func.tp$descr_get) {
                func = func.tp$descr_get(this, this.ob$type, canSuspend);
            }

            if (func !== undefined) {
                const args = value === undefined ? [pyObject] : [pyObject, value];
                res = Sk.misceval.callsimOrSuspendArray(func, args);
            } else if (error_msg) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object " + error_msg);
            } else {
                throw new Sk.builtin.AttributeError(dunderName);
            }
            return canSuspend ? res : Sk.misceval.retryOptionalSuspensionOrThrow(res);
        };
    };
}

/**
 * @namespace
 *
 * @description
 * If you want to build a skulpt native class you need to understand slots
 * Each dunder method in python is matched to a slot in skulpt {@link Sk.dunderToSkulpt} which is closely aligned to a Cpython slot
 *
 * Plenty examples exist in {@link  Sk.builtin}
 *
 * If a user builds a `nativeClass` using {@link Sk.abstr.buildNativeClass } they define slots as javascript function
 * Dunder Methods will be created as `slot_wrappers`
 *
 * If a user defines a class in Python or using {@link Sk.misceval.buildClass}
 * Dunder Functions should be defined and slot funcs will be added
 *
 * Below is information about each slot function, should you decide to build a native class
 *
 * For mappings of slots to dunders see source code for {@link Sk.dunderToSkulpt} or [Sk.subSlots]{@link Sk.slots.subSlots}
 *
 */
Sk.slots = Object.create(null);
const slots = Sk.slots;

/**
 *
 * @memberof Sk.slots
 * @member tp$doc
 * @implements __doc__
 * @suppress {checkTypes}
 * @type {string}
 */

/**
 * @memberof Sk.slots
 * @method tp$init
 * @implements __init__
 * @suppress {checkTypes}
 * @param {Array} args
 * @param {Array=} kwargs
 * @returns {Sk.builtin.none}
 */
Sk.slots.__init__ = {
    $name: "__init__",
    $slot_name: "tp$init",
    $slot_func: function (dunderFunc) {
        return function tp$init(args, kwargs) {
            const func = dunderFunc.tp$descr_get ? dunderFunc.tp$descr_get(this, this.ob$type) : dunderFunc;
            let ret = Sk.misceval.callsimOrSuspendArray(func, args, kwargs);
            return Sk.misceval.chain(ret, (r) => {
                if (!Sk.builtin.checkNone(r) && r !== undefined) {
                    throw new Sk.builtin.TypeError("__init__() should return None, not " + Sk.abstr.typeName(r));
                }
                return;
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

/**
 * @memberof Sk.slots
 * @method tp$new
 * @implements __new__
 * @suppress {checkTypes}
 * @returns {pyObject}
 * @param {Array} args
 * @param {Array=} kwargs
 * @description
 * {@link Sk.generic.new} {@link Sk.generic.newMethodDef} are related implementations of `tp$mew` and `__new__`
 * unusually `this = typeobject.prototype` since it is typically called like `typeobj.prototype.tp$new` and must
 * be taken into when writing an implementation of `tp$new`
 */
slots.__new__ = {
    $name: "__new__",
    $slot_name: "tp$new",
    $slot_func: function (dunderFunc) {
        const tp$new = function (args, kwargs) {
            let func = dunderFunc;
            if (dunderFunc.tp$descr_get) {
                func = dunderFunc.tp$descr_get(null, this.constructor);
            } // weird behaviour ignore staticmethods bascically
            return Sk.misceval.callsimOrSuspendArray(func, [this.constructor, ...args], kwargs);
        };
        tp$new.sk$static_new = false; // this is a flag used in the __new__ algorithm
        return tp$new;
    },
    $wrapper: null, // handled separately since it's not a slot wrapper but an sk_method
    $textsig: "($self, /, *args, **kwargs)",
    $flags: { FastCall: true },
    $doc: "Create and return a new object.",
};

/**
 * @memberof Sk.slots
 * @method tp$call
 * @implements __call__
 * @suppress {checkTypes}
 * @param {Array} args
 * @param {Array=} kwargs
 *
 */
slots.__call__ = {
    $name: "__call__",
    $slot_name: "tp$call",
    $slot_func: slotFuncFastCall,
    $wrapper: function __call__(self, args, kwargs) {
        // function fast call objects override the prototype.tp$call
        const res = this.call(self, args, kwargs);
        if (res === undefined) {
            return Sk.builtin.none.none$;
        }
        return res;
    }
    ,
    $textsig: "($self, /, *args, **kwargs)",
    $flags: { FastCall: true },
    $doc: "Call self as a function.",
};

/**
 * @memberof Sk.slots
 * @method $r
 * @implements __repr__
 * @suppress {checkTypes}
 * @returns {Sk.builtin.str}
 */
slots.__repr__ = {
    $name: "__repr__",
    $slot_name: "$r",
    $slot_func: slotFuncNoArgsWithCheck("__repr__", Sk.builtin.checkString, "str"),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return repr(self).",
};

/**
 * @memberof Sk.slots
 * @method tp$str
 * @implements `__str__`
 * @suppress {checkTypes}
 * @returns {Sk.builtin.str}
 */
slots.__str__ = {
    $name: "__str__",
    $slot_name: "tp$str",
    $slot_func: slotFuncNoArgsWithCheck("__str__", Sk.builtin.checkString, "str"),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return str(self).",
};

var hash_slot = slotFuncNoArgsWithCheck("__hash__", Sk.builtin.checkInt, "int", (res) => typeof res.v === "number" ? res.v : res.tp$hash());
/**
 * @memberof Sk.slots
 * @method tp$hash
 * @implements __hash__
 * @suppress {checkTypes}
 * @returns {Sk.builtin.int_}
 * @description
 * To be unhashable set this slot to {@link Sk.builtin.none.none$} or call {@link Sk.abstr.markUnhashable}
 */
slots.__hash__ = {
    $name: "__hash__",
    $slot_name: "tp$hash",
    $slot_func: function (dunder_func) {
        if (dunder_func === Sk.builtin.none.none$) {
            return Sk.builtin.none.none$;
        }
        return hash_slot(dunder_func);
    },
    $wrapper: wrapperCallBack(wrapperCallNoArgs, (res) => new Sk.builtin.int_(res)),
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return hash(self).",
};

// getters/setters/deletters

/**
 * @memberof Sk.slots
 * @method tp$getattr
 * @implements __getattribute__
 * @suppress {checkTypes}
 *
 * @param {Sk.builtin.str} pyName
 * @param {boolean=} canSuspend
 *
 * @returns {pyObject|undefined}
 * @description
 * This slot will also be given to a pyObject which defines `__getattr__`
 */
slots.__getattribute__ = {
    $name: "__getattribute__",
    $slot_name: "tp$getattr",
    $slot_func: function (dunderFunc) {
        return function tp$getattr(pyName, canSuspend) {
            let getattrFn = this.ob$type.$typeLookup(Sk.builtin.str.$getattr);
            if (getattrFn === undefined) {
                return slotFuncGetAttribute.call(this, pyName, canSuspend);
            }
            const ret = Sk.misceval.chain(slotFuncGetAttribute.call(this, pyName, canSuspend), (val) =>
                Sk.misceval.tryCatch(
                    () => {
                        if (val !== undefined) {
                            return val;
                        }
                        if (getattrFn.tp$descr_get) {
                            getattrFn = getattrFn.tp$descr_get(this, this.ob$type);
                        }
                        return Sk.misceval.callsimOrSuspendArray(getattrFn, [pyName]);
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
            return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
        };
    },
    $wrapper: function (self, args, kwargs) {
        // this = the wrapped function
        Sk.abstr.checkOneArg(this.$name, args, kwargs);
        const pyName = args[0];
        if (!Sk.builtin.checkString(pyName)) {
            throw new Sk.builtin.TypeError("attribute name must be string, not '" + Sk.abstr.typeName(pyName) + "'");
        }
        const res = this.call(self, pyName, true);
        return Sk.misceval.chain(res, (res) => {
            if (res === undefined) {
                throw new Sk.builtin.AttributeError(Sk.abstr.typeName(self) + " has no attribute " + pyName.$jsstr());
            }
            return res;
        });
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


/* Helper to check for object.__setattr__ or __delattr__ applied to a type.
   This is called the Carlo Verre hack after its discoverer. */
function hackcheck(obj, func) {
    let type = obj.ob$type;
    while (type && type.sk$klass !== undefined) {
        type = type.prototype.tp$base;
    }
    if (type && type.prototype.tp$setattr !== func) {
        throw new Sk.builtin.TypeError("can't apply this " + func.$name + " to " + Sk.abstr.typeName(obj) + " object");
    }
}

/**
 * @suppress {checkTypes}
 * @memberof Sk.slots
 * @method tp$setattr
 * @implements __setattr__
 * @param {Sk.builtin.str} pyName
 * @param {pyObject|undefined} value undefined indicates the attribute is to be deleted
 * @param {boolean=} canSuspend
 * @description
 * `tp$setattr` is responsible for throwing its own exceptions. It also implements __delattr__
 */
slots.__setattr__ = {
    $name: "__setattr__",
    $slot_name: "tp$setattr",
    $slot_func: slotFuncSetDelete("__setattr__", "__delattr__"),
    // not need for an error message setattr is always defined on object
    $wrapper: function(self, args, kwargs) {
        Sk.abstr.checkNoKwargs(this.$name, kwargs);
        Sk.abstr.checkArgsLen(this.$name, args, 2, 2);
        hackcheck(self, this);
        return Sk.misceval.chain(this.call(self, args[0], args[1], true), () => Sk.builtin.none.none$); 
    },
    $textsig: "($self, name, value, /)",
    $flags: { MinArgs: 2, MaxArgs: 2 },
    $doc: "Implement setattr(self, name, value).",
};

slots.__delattr__ = {
    $name: "__delattr__",
    $slot_name: "tp$setattr",
    $slot_func: slots.__setattr__.$slot_func,
    $wrapper: function(self, args, kwargs) {
        Sk.abstr.checkOneArg(this.$name, args, kwargs);
        hackcheck(self, this);
        this.call(self, args[0]);
        return Sk.builtin.none.none$;
    },
    $textsig: "($self, name, /)",
    $flags: { OneArg: true },
    $doc: "Implement delattr(self, name).",
};

/**
 * @memberof Sk.slots
 * @method tp$descr_get
 * @implements __get__
 * @suppress {checkTypes}
 * @param {pyObject} obj
 * @param {typeObject=} obtype
 * @param {boolean=} canSuspend
 */
slots.__get__ = {
    $name: "__get__",
    $slot_name: "tp$descr_get",
    $slot_func: function (dunderFunc) {
        return function tp$descr_get(obj, obtype, canSuspend) {
            if (obj === null) {
                obj = Sk.builtin.none.none$;
            }
            if (obtype == null) {
                obtype = Sk.builtin.none.none$;
            }
            const func = dunderFunc.tp$descr_get ? dunderFunc.tp$descr_get(this, this.ob$type) :  dunderFunc;
            const ret = Sk.misceval.callsimOrSuspendArray(func, [obj, obtype]);
            return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
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
        return this.call(self, obj, obtype, true);
    },
    $textsig: "($self, instance, owner, /)",
    $flags: { MinArgs: 2, MaxArgs: 2 },
    $doc: "Return an attribute of instance, which is of type owner.",
};
/**
 * @memberof Sk.slots
 * @method tp$descr_set
 * @implements __set__
 * @suppress {checkTypes}
 * @param {pyObject} obj
 * @param {pyObject|undefined} value undefined will signals __delete__
 * @param {boolean=} canSuspend
 * @description
 * Also implements __delete__
 */
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
    $wrapper: wrapperDel,
    $textsig: "($self, instance, /)",
    $flags: { OneArg: true },
    $doc: "Delete an attribute of instance.",
};

/**
 * @memberof Sk.slots
 * @method tp$richcompare
 * @implements __eq__
 * @suppress {checkTypes}
 * @param {pyObject} other
 * @param {string} opname "Eq", "NotEq", "Lt", "LtE", "Gt", "GtE"
 * @returns {boolean}
 * @description
 * __eq__/__ne__/__lt__/__le__/__gt__/__ge__
 * Either define tp$richcompare or any of the `ob$*` slots
 * If `tp$richcompare` is defined then the `nativeClass` will get wrapper functions into each `ob$*` slot
 */

/**
 * @memberof Sk.slots
 * @method ob$eq
 * @implements __eq__
 * @suppress {checkTypes}
 * @returns {boolean}
 */
slots.__eq__ = {
    $name: "__eq__",
    $slot_name: "ob$eq",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperRichCompare,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self==value.",
};

/**
 * @memberof Sk.slots
 * @method ob$ge
 * @implements __ge__
 * @suppress {checkTypes}
 * @returns {boolean}
 */
slots.__ge__ = {
    $name: "__ge__",
    $slot_name: "ob$ge",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperRichCompare,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self>=value.",
};
/**
 * @memberof Sk.slots
 * @method ob$gt
 * @implements __gt__
 * @suppress {checkTypes}
 * @returns {boolean}
 */
slots.__gt__ = {
    $name: "__gt__",
    $slot_name: "ob$gt",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperRichCompare,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self>value.",
};
/**
 * @memberof Sk.slots
 * @method ob$le
 * @implements __le__
 * @suppress {checkTypes}
 * @returns {boolean}
 */
slots.__le__ = {
    $name: "__le__",
    $slot_name: "ob$le",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperRichCompare,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self<=value.",
};
/**
 * @memberof Sk.slots
 * @method ob$lt
 * @implements __lt__
 * @suppress {checkTypes}
 * @returns {boolean}
 */
slots.__lt__ = {
    $name: "__lt__",
    $slot_name: "ob$lt",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperRichCompare,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self<value.",
};
/**
 * @memberof Sk.slots
 * @method ob$ne
 * @implements __ne__
 * @suppress {checkTypes}
 * @returns {boolean}
 */
slots.__ne__ = {
    $name: "__ne__",
    $slot_name: "ob$ne",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperRichCompare,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self!=value.",
};

// iters

/**
 * @memberof Sk.slots
 * @method tp$iter
 * @implements __iter__
 * @suppress {checkTypes}
 * @returns {pyObject} must have a valid `tp$iternext` slot
 * See {@link Sk.abstr.buildIteratorClass} and {@link Sk.misceval.iterator}
 */
slots.__iter__ = {
    $name: "__iter__",
    $slot_name: "tp$iter",
    $slot_func: slotFuncNoArgs,
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Implement iter(self).",
};

/**
 * @memberof Sk.slots
 * @method tp$iternext
 * @param {boolean=} canSuspend
 * @implements __next__
 * @suppress {checkTypes}
 * @returns {pyObject|undefined} Do not raise a StopIteration error instead return undefined
 */
slots.__next__ = {
    $name: "__next__",
    $slot_name: "tp$iternext",
    $slot_func: function (dunderFunc) {
        return function tp$iternext(canSuspend) {
            const func = dunderFunc.tp$descr_get ? dunderFunc.tp$descr_get(this, this.ob$type) :  dunderFunc;
            const ret = Sk.misceval.tryCatch(
                () => Sk.misceval.callsimOrSuspendArray(func, []),
                (e) => {
                    if (e instanceof Sk.builtin.StopIteration) {
                        this.gi$ret = e.$value;
                        return undefined;
                    } else {
                        throw e;
                    }
                }
            );
            return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
        };
    },
    /**
     *
     * @param {*} self
     * @param {Array} args
     * @param {Array|undefined=} kwargs
     */
    $wrapper: function (self, args, kwargs) {
        // this = the wrapped function
        Sk.abstr.checkNoArgs(this.$name, args, kwargs);
        // the first tp$iternext is sometimes different from the prototype.tp$iternext
        // so instead of this.call(self) use self.tp$iternext
        return Sk.misceval.chain(self.tp$iternext(true), (res) => {
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
/**
 * @memberof Sk.slots
 * @member tp$as_sequence_or_mapping
 * @type {boolean}
 * @description
 * set `tp$as_sequence_or_mapping` to `true` in order for for {@link Sk.abstr.buildNativeClass}
 * to acquire appropriate `slot_wrappers` for the slots
 * - [sq$length]{@link Sk.slots.sq$length}
 * - [sq$concat]{@link Sk.slots.sq$concat}
 * - [sq$contains]{@link Sk.slots.sq$contains}
 * - [sq$repeat]{@link Sk.slots.sq$repeat}
 * - [mp$subscript]{@link Sk.slots.mp$subscript}
 * - [mp$ass_subscript]{@link Sk.slots.mp$ass_subscript}
 */

/**
 * @memberof Sk.slots
 * @method sq$concat
 * @implements __add__
 * @suppress {checkTypes}
 * @description defining `sq$concat` along with {@link Sk.slots.tp$as_sequence_or_mapping} will gain the slot
 * `__add__`.
 * note that this slot will be equivalent to the [nb$add]{@link Sk.slots.nb$add} slot
 */

/**
 * @memberof Sk.slots
 * @method sq$repeat
 * @implements __mul__/__rmul__
 * @suppress {checkTypes}
 * @description defining `sq$repeat` along with {@link Sk.slots.tp$as_sequence_or_mapping} will gain the slots
 * `__mul__` and `__rmul__`
 * note that this slot will be equivalent to the [nb$multiply]{@link Sk.slots.nb$multiply} slot
 */

/**
 * @memberof Sk.slots
 * @method sq$length
 * @param {boolean=} canSuspend
 * @implements __len__
 * @suppress {checkTypes}
 * @returns {number}
 */
slots.__len__ = {
    $name: "__len__",
    $slot_name: "sq$length",
    $slot_func: function (dunderFunc) {
        return function sq$length(canSuspend) {
            let res;
            const func = dunderFunc.tp$descr_get ? dunderFunc.tp$descr_get(this, this.ob$type) :  dunderFunc;
            if (canSuspend) {
                res = Sk.misceval.callsimOrSuspendArray(func, []);
                return Sk.misceval.chain(res, (r) => {
                    return Sk.misceval.asIndexOrThrow(r);
                });
            } else {
                res = Sk.misceval.callsimArray(func, []);
                return Sk.misceval.asIndexOrThrow(res);
            }
        };
    },
    $wrapper: wrapperCallBack(wrapperCallNoArgsSuspend, (res) => new Sk.builtin.int_(res), true),
    $flags: { NoArgs: true },
    $textsig: "($self, /)",
    $doc: "Return len(self).",
};

/**
 * @suppress {checkTypes}
 * @memberof Sk.slots
 * @method sq$contains
 *
 * @param {pyObject} key
 * @param {boolean=} canSuspend
 *
 * @implements __contains__
 * @returns {boolean}
 */
slots.__contains__ = {
    $name: "__contains__",
    $slot_name: "sq$contains",
    $slot_func: function (dunderFunc) {
        return function sq$contains(key, canSuspend) {
            const func = dunderFunc.tp$descr_get ? dunderFunc.tp$descr_get(this, this.ob$type) :  dunderFunc;
            let res = Sk.misceval.callsimOrSuspendArray(func, [key]);
            res = Sk.misceval.chain(res, (r) => Sk.misceval.isTrue(r));
            if (res.$isSuspension) {
                return canSuspend ? res : Sk.misceval.retryOptionalSuspensionOrThrow(res);
            }
            return res;
        };
    },
    $wrapper: wrapperCallBack(wrapperCallOneArgSuspend, (res) => new Sk.builtin.bool(res), true),
    $textsig: "($self, key, /)",
    $flags: { OneArg: true },
    $doc: "Return key in self.",
};

/**
 * @memberof Sk.slots
 * @method mp$subscript
 * @param {pyObject} key - might be a pyStr, pyInt or pySlice
 * @param {boolean=} canSuspend
 * @implements __getitem__
 * @suppress {checkTypes}
 * @returns {pyObject}
 * @throws {Sk.builtin.TypeError}
 */
slots.__getitem__ = {
    $name: "__getitem__",
    $slot_name: "mp$subscript",
    $slot_func: function (dunderFunc) {
        return function mp$subscript(key, canSuspend) {
            const func = dunderFunc.tp$descr_get ? dunderFunc.tp$descr_get(this, this.ob$type) :  dunderFunc;
            const ret = Sk.misceval.callsimOrSuspendArray(func, [key]);
            return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
        };
    },
    $wrapper: wrapperCallOneArgSuspend,
    $textsig: "($self, key, /)",
    $flags: { OneArg: true },
    $doc: "Return self[key].",
};

/**
 * @memberof Sk.slots
 * @method mp$ass_subscript
 * @param {pyObject} item - might be a pyStr, pyInt or pySlice
 * @param {pyObject|undefined} value - undefined indicates the item should be deleted
 * @param {boolean=} canSuspend
 * @implements __setitem__
 * @suppress {checkTypes}
 * @returns {pyObject}
 * @throws {Sk.builtin.TypeError}
 * @description
 * Also implements __delitem__
 */
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
    $wrapper: wrapperDel,
    $textsig: "($self, key, /)",
    $flags: { OneArg: true },
    $doc: "Delete self[key].",
};

// number slots
/**
 * @memberof Sk.slots
 * @member tp$as_number
 * @type {boolean}
 * @description
 * set `tp$as_number` to `true` in order for for {@link Sk.abstr.buildNativeClass}
 * to acquire appropriate `slot_wrappers` for number slots
 * You can find an exhaustive list in the source code {@link Sk.slots}
 *
 * Examples:
 * - [nb$add]{@link Sk.slots.nb$add}
 * - [nb$int]{@link Sk.slots.nb$int}
 * - [nb$divide]{@link Sk.slots.nb$divide} - note we do not use `nb$true_divide`
 * - [nb$bool]{@link Sk.slots.nb$bool} - should return a js boolean
 *
 * You need not define `nb$reflected_*` slots unless your implementation is different from the default implementation
 * Similarly `nb$inplace_` need not be defined unless the implementation is different from the usual slot.
 *
 */

/**
 * @memberof Sk.slots
 * @method nb$add
 * @implements __add__
 * @suppress {checkTypes}
 * @description
 * the reflected slot will be defined if not set
 *
 */
slots.__add__ = {
    $name: "__add__",
    $slot_name: "nb$add",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self+value.",
};
/**
 * @memberof Sk.slots
 * @method nb$relfceted_add
 * @implements __radd__
 * @suppress {checkTypes}
 * @description
 * the reflected slot will be defined if not set
 *
 */
slots.__radd__ = {
    $name: "__radd__",
    $slot_name: "nb$reflected_add",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value+self.",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_add
 * @implements __iadd__
 * @suppress {checkTypes}
 * @description
 * Only define this if your implementation is different from `nb$add`
 *
 */
slots.__iadd__ = {
    $name: "__iadd__",
    $slot_name: "nb$inplace_add",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self+=value.",
};
/**
 * @memberof Sk.slots
 * @method nb$subtract
 * @implements __sub__
 * @suppress {checkTypes}
 *
 */
slots.__sub__ = {
    $name: "__sub__",
    $slot_name: "nb$subtract",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self-value.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_subtract
 * @implements __rsub__
 * @suppress {checkTypes}
 */
slots.__rsub__ = {
    $name: "__rsub__",
    $slot_name: "nb$reflected_subtract",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value-self.",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_multiply
 * @implements __imul__
 * @suppress {checkTypes}
 */
slots.__imul__ = {
    $name: "__imul__",
    $slot_name: "nb$inplace_multiply",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self*=value.",
};
/**
 * @memberof Sk.slots
 * @method nb$multiply
 * @implements __mul__
 * @suppress {checkTypes}
 */
slots.__mul__ = {
    $name: "__mul__",
    $slot_name: "nb$multiply",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self*value.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_multiply
 * @implements __rmul__
 * @suppress {checkTypes}
 */
slots.__rmul__ = {
    $name: "__rmul__",
    $slot_name: "nb$reflected_multiply",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value*self.",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_subtract
 * @implements __isub__
 * @suppress {checkTypes}
 */
slots.__isub__ = {
    $name: "__isub__",
    $slot_name: "nb$inplace_subtract",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self-=value.",
};
/**
 * @memberof Sk.slots
 * @method nb$remainder
 * @implements __mod__
 * @suppress {checkTypes}
 */
slots.__mod__ = {
    $name: "__mod__",
    $slot_name: "nb$remainder",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self%value.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_remainder
 * @implements __rmod__
 * @suppress {checkTypes}
 */
slots.__rmod__ = {
    $name: "__rmod__",
    $slot_name: "nb$reflected_remainder",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value%self.",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_remainder
 * @implements __imod__
 * @suppress {checkTypes}
 */
slots.__imod__ = {
    $name: "__imod__",
    $slot_name: "nb$inplace_remainder",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement value%=self.",
};
/**
 * @memberof Sk.slots
 * @method nb$divmod
 * @implements __divmod__
 * @suppress {checkTypes}
 */
slots.__divmod__ = {
    $name: "__divmod__",
    $slot_name: "nb$divmod",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return divmod(self, value).",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_divmod
 * @implements __rdivmod__
 * @suppress {checkTypes}
 */
slots.__rdivmod__ = {
    $name: "__rdivmod__",
    $slot_name: "nb$reflected_divmod",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return divmod(value, self)",
};
/**
 * @memberof Sk.slots
 * @method nb$positive
 * @implements __pos__
 * @suppress {checkTypes}
 */
slots.__pos__ = {
    $name: "__pos__",
    $slot_name: "nb$positive",
    $slot_func: slotFuncNoArgs,
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "+self",
};
/**
 * @memberof Sk.slots
 * @method nb$negative
 * @implements __neg__
 * @suppress {checkTypes}
 */
slots.__neg__ = {
    $name: "__neg__",
    $slot_name: "nb$negative",
    $slot_func: slotFuncNoArgs,
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "-self",
};
/**
 * @memberof Sk.slots
 * @method nb$abs
 * @implements __abs__
 * @suppress {checkTypes}
 */
slots.__abs__ = {
    $name: "__abs__",
    $slot_name: "nb$abs",
    $slot_func: slotFuncNoArgs,
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "abs(self)",
};
/**
 * @memberof Sk.slots
 * @method nb$bool
 * @implements __bool__
 * @suppress {checkTypes}
 * @returns {boolean}
 */
slots.__bool__ = {
    $name: "__bool__",
    $slot_name: "nb$bool",
    $slot_func: slotFuncNoArgsWithCheck("__bool__", Sk.builtin.checkBool, "bool", (res) => res.v !== 0),
    $wrapper: wrapperCallBack(wrapperCallNoArgs, (res) => new Sk.builtin.bool(res)),
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "self != 0",
};
/**
 * @memberof Sk.slots
 * @method nb$invert
 * @implements __invert__
 * @suppress {checkTypes}
 */
slots.__invert__ = {
    $name: "__invert__",
    $slot_name: "nb$invert",
    $slot_func: slotFuncNoArgs,
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "~self",
};
/**
 * @memberof Sk.slots
 * @method nb$lshift
 * @implements __lshift__
 * @suppress {checkTypes}
 */
slots.__lshift__ = {
    $name: "__lshift__",
    $slot_name: "nb$lshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self<<value.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_lshift
 * @implements __rlshift__
 * @suppress {checkTypes}
 */
slots.__rlshift__ = {
    $name: "__rlshift__",
    $slot_name: "nb$reflected_lshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value<<self.",
};
/**
 * @memberof Sk.slots
 * @method nb$rshift
 * @implements __rshift__
 * @suppress {checkTypes}
 */
slots.__rshift__ = {
    $name: "__rshift__",
    $slot_name: "nb$rshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self>>value.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_rshift
 * @implements __rrshift__
 * @suppress {checkTypes}
 */
slots.__rrshift__ = {
    $name: "__rrshift__",
    $slot_name: "nb$reflected_rshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value>>self.",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_lshift
 * @implements __ilshift__
 * @suppress {checkTypes}
 */
slots.__ilshift__ = {
    $name: "__ilshift__",
    $slot_name: "nb$inplace_lshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self<<=value.",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_rshift
 * @implements __irshift__
 * @suppress {checkTypes}
 */
slots.__irshift__ = {
    $name: "__irshift__",
    $slot_name: "nb$inplace_rshift",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self=>>value.",
};
/**
 * @memberof Sk.slots
 * @method nb$and
 * @implements __and__
 * @suppress {checkTypes}
 */
slots.__and__ = {
    $name: "__and__",
    $slot_name: "nb$and",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self&value.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_and
 * @implements __rand__
 * @suppress {checkTypes}
 */
slots.__rand__ = {
    $name: "__rand__",
    $slot_name: "nb$refelcted_and",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value&self.",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_and
 * @implements __iand__
 * @suppress {checkTypes}
 */
slots.__iand__ = {
    $name: "__iand__",
    $slot_name: "nb$and",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self&=value.",
};
/**
 * @memberof Sk.slots
 * @method nb$xor
 * @implements __xor__
 * @suppress {checkTypes}
 */
slots.__xor__ = {
    $name: "__xor__",
    $slot_name: "nb$xor",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self^value.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_xor
 * @implements __rxor__
 * @suppress {checkTypes}
 */
slots.__rxor__ = {
    $name: "__rxor__",
    $slot_name: "nb$reflected_xor",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value^self.",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_xor
 * @implements __ixor__
 * @suppress {checkTypes}
 */
slots.__ixor__ = {
    $name: "__ixor__",
    $slot_name: "nb$inplace_xor",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self^=value.",
};
/**
 * @memberof Sk.slots
 * @method nb$or
 * @implements __or__
 * @suppress {checkTypes}
 */
slots.__or__ = {
    $name: "__or__",
    $slot_name: "nb$or",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self|value.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_or
 * @implements __ror__
 * @suppress {checkTypes}
 */
slots.__ror__ = {
    $name: "__ror__",
    $slot_name: "nb$reflected_or",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value|self.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_ior
 * @implements __ior__
 * @suppress {checkTypes}
 */
slots.__ior__ = {
    $name: "__ior__",
    $slot_name: "nb$inplace_or",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self|=value.",
};
/**
 * @memberof Sk.slots
 * @method nb$int
 * @implements __int__
 * @suppress {checkTypes}
 */
slots.__int__ = {
    $name: "__int__",
    $slot_name: "nb$int",
    $slot_func: slotFuncNoArgsWithCheck("__int__", Sk.builtin.checkInt, "int"),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "int(self)",
};
/**
 * @memberof Sk.slots
 * @method nb$float
 * @implements __float__
 * @suppress {checkTypes}
 */
slots.__float__ = {
    $name: "__float__",
    $slot_name: "nb$float",
    $slot_func: slotFuncNoArgsWithCheck("__float__", Sk.builtin.checkFloat, "float"),
    $wrapper: wrapperCallNoArgs,
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "float(self)",
};
/**
 * @memberof Sk.slots
 * @method nb$floor_divide
 * @implements __floordiv__
 * @suppress {checkTypes}
 */
slots.__floordiv__ = {
    $name: "__floordiv__",
    $slot_name: "nb$floor_divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self//value.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_floor_divide
 * @implements __rfloordiv__
 * @suppress {checkTypes}
 */
slots.__rfloordiv__ = {
    $name: "__rfloordiv__",
    $slot_name: "nb$reflected_floor_divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value//self.",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_floor_divide
 * @implements __ifloordiv__
 * @suppress {checkTypes}
 */
slots.__ifloordiv__ = {
    $name: "__ifloordiv__",
    $slot_name: "nb$inplace_floor_divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self//=value.",
};
/**
 * @memberof Sk.slots
 * @method nb$divide
 * @implements __truediv__
 * @suppress {checkTypes}
 */
slots.__truediv__ = {
    $name: "__truediv__",
    $slot_name: "nb$divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self/value.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_divide
 * @implements __rtruediv__
 * @suppress {checkTypes}
 */
slots.__rtruediv__ = {
    $name: "__rtruediv__",
    $slot_name: "nb$reflected_divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value/self.",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_divide
 * @implements __itruediv__
 * @suppress {checkTypes}
 */
slots.__itruediv__ = {
    $name: "__itruediv__",
    $slot_name: "nb$inplace_divide",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Implement self/=value.",
};
/**
 * @memberof Sk.slots
 * @method nb$index
 * @implements __index__
 * @suppress {checkTypes}
 */
slots.__index__ = {
    $name: "__index__",
    $slot_name: "nb$index",
    $slot_func: slotFuncNoArgsWithCheck("__index__", Sk.builtin.checkInt, "int", (res) => res.v),
    $wrapper: wrapperCallBack(wrapperCallNoArgs, (res) => new Sk.builtin.int_(res)),
    $textsig: "($self, /)",
    $flags: { NoArgs: true },
    $doc: "Return self converted to an integer, if self is suitable for use as an index into a list.",
};
/**
 * @memberof Sk.slots
 * @method nb$power
 * @implements __pow__
 * @suppress {checkTypes}
 */
slots.__pow__ = {
    $name: "__pow__",
    $slot_name: "nb$power",
    $slot_func: function (dunderFunc) {
        return function (value, mod) {
            const func = dunderFunc.tp$descr_get ? dunderFunc.tp$descr_get(this, this.ob$type) :  dunderFunc;
            if (mod == undefined) {
                return Sk.misceval.callsimArray(func, [value]);
            } else {
                return Sk.misceval.callsimArray(func, [value, mod]);
            }
        };
    },
    $wrapper: wrapperCallTernary,
    $textsig: "($self, value, mod=None, /)",
    $flags: { MinArgs: 1, MaxArgs: 2 },
    $doc: "Return pow(self, value, mod).",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_power
 * @implements __rpow__
 * @suppress {checkTypes}
 */
slots.__rpow__ = {
    $name: "__rpow__",
    $slot_name: "nb$reflected_power",
    $slot_func: slots.__pow__.$slot_func,
    $wrapper: wrapperCallTernary,
    $textsig: "($self, value, mod=None, /)",
    $flags: { MinArgs: 1, MaxArgs: 2 },
    $doc: "Return pow(value, self, mod).",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_power
 * @implements __ipow__
 * @suppress {checkTypes}
 */
slots.__ipow__ = {
    $name: "__ipow__",
    $slot_name: "nb$inplace_power",
    $slot_func: slots.__pow__.$slot_func,
    $wrapper: wrapperCallTernary,
    $textsig: "($self, value, mod=None, /)",
    $flags: { MinArgs: 1, MaxArgs: 2 },
    $doc: "Implement **=",
};
/**
 * @memberof Sk.slots
 * @method nb$matrix_multiply
 * @implements __matmul__
 * @suppress {checkTypes}
 */
slots.__matmul__ = {
    $name: "__matmul__",
    $slot_name: "nb$matrix_multiply",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return self@value.",
};
/**
 * @memberof Sk.slots
 * @method nb$reflected_matrix_multiply
 * @implements __rmatmul__
 * @suppress {checkTypes}
 */
slots.__rmatmul__ = {
    $name: "__rmatmul__",
    $slot_name: "nb$reflected_matrix_multiply",
    $slot_func: slotFuncOneArg,
    $wrapper: wrapperCallOneArg,
    $textsig: "($self, value, /)",
    $flags: { OneArg: true },
    $doc: "Return value@self.",
};
/**
 * @memberof Sk.slots
 * @method nb$inplace_matrix_multiply
 * @implements __imatmul__
 * @suppress {checkTypes}
 */
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
    $slot_name: "nb$long",
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
        $wrapper: wrapperCallBack(wrapperCallNoArgs, (res) => new Sk.builtin.bool(res)),
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
/**
 * @memberof Sk.slots
 * @member subSlots
 * @description
 * See the source code for a full list of slots split into apprpriate categories
 */
Sk.subSlots = {
    main_slots: Object.entries({
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
    }),

    number_slots: Object.entries({
        nb$abs: "__abs__",
        nb$negative: "__neg__",
        nb$positive: "__pos__",
        nb$int: "__int__",
        nb$long: "__long__",
        nb$float: "__float__",
        nb$index: "__index__",
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
        nb$inplace_remainder: "__imod__",
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

        nb$matrix_multiply: "__matmul__",
        nb$reflected_matrix_multiply: "__rmatmul__",
        nb$inplace_matrix_multiply: "__imatmul__",
    }),

    sequence_and_mapping_slots: Object.entries({
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
    }),
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
    sq$inplace_repeat: ["nb$inplace_multiply"],
    sq$inplace_concat: ["nb$inplace_add"],
};

/**
 *
 *
 * @member Sk.dunderToSkulpt
 *
 * Maps Python dunder names to the Skulpt Javascript function names that
 * implement them.
 *
 * Note: __add__, __mul__, and __rmul__ can be used for either numeric or
 * sequence types. Here, they default to the numeric versions (i.e. nb$add,
 * nb$multiply, and nb$reflected_multiply). This works because Sk.abstr.numberBinOp
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
 * @description
 * A mapping of dunder names to skulpt slots
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
    __iter__: "tp$iter",
    __next__: "tp$iternext",

    __eq__: "ob$eq",
    __ne__: "ob$ne",
    __lt__: "ob$lt",
    __le__: "ob$le",
    __gt__: "ob$gt",
    __ge__: "ob$ge",

    __abs__: "nb$abs",
    __neg__: "nb$negative",
    __pos__: "nb$positive",
    __int__: "nb$int",
    __float__: "nb$float",
    __index__: "nb$index",

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
    __long__: "nb$long",

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
    const classes_with_next = Sk.abstr.built$iterators;
    const classes_with_bool = [Sk.builtin.int_, Sk.builtin.lng, Sk.builtin.float_, Sk.builtin.complex];
    const classes_with_divide = classes_with_bool;
    const number_slots = Sk.subSlots.number_slots;
    const main_slots = Sk.subSlots.main_slots;
    const indexofnext = main_slots.findIndex((x) => x[0] === "tp$iternext");
    const indexofbool = number_slots.findIndex((x) => x[0] === "nb$bool");
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

        main_slots[indexofnext][1] = "__next__";
        number_slots[indexofbool][1] = "__bool__";
        switch_version(classes_with_next, "next", "__next__");
        switch_version(classes_with_bool, "__bool__", "__nonzero__");
    } else {
        if (py3$slots === undefined) {
            slots.py3$slots = {
                __next__: slots.__next__,
            };
            py3$slots = slots.py3$slots;
        }
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

        main_slots[indexofnext][1] = "next";
        number_slots[indexofbool][1] = "__nonzero__";
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
