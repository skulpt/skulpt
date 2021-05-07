function $builtinmodule() {
    const functools = {
        __name__: new Sk.builtin.str("functools"),
        __doc__: new Sk.builtin.str("Tools for working with functions and callable objects"),
        __all__: new Sk.builtin.list(
            [
                "update_wrapper",
                "wraps",
                "WRAPPER_ASSIGNMENTS",
                "WRAPPER_UPDATES",
                "total_ordering",
                "cmp_to_key",
                "lru_cache" /**@todo lru_cache */,
                "reduce",
                "TopologicalSorter" /**@todo TopologicalSorter */,
                "CycleError" /**@todo CycleError */,
                "partial",
                "partialmethod",
                "singledispatch" /**@todo singledispatch */,
                "singledispatchmethod" /**@todo singledispatchmethod */,
                "cached_property" /**@todo cached_property */,
            ].map((x) => new Sk.builtin.str(x))
        ),
        WRAPPER_ASSIGNMENTS: new Sk.builtin.tuple(
            ["__module__", "__name__", "__qualname__", "__doc__" /*"__annotations__"*/].map((x) => new Sk.builtin.str(x))
        ),
        WRAPPER_UPDATES: new Sk.builtin.tuple([new Sk.builtin.str("__dict__")]),

        /**@todo */
        lru_cache: proxyFail("lru_cache"),
        TopologicalSorter: proxyFail("TopologicalSorter"),
        CycleError: proxyFail("CycleError"),
        singledispatch: proxyFail("singledispatch"),
        singledispatchmethod: proxyFail("singledispatchmethod"),
        cached_property: proxyFail("cached_property"),
    };

    function proxyFail(_name) {
        return new Sk.builtin.func(function () {
            throw new Sk.builtin.NotImplementedError(_name + " is not yet implemented in skulpt");
        });
    }

    /********** Partial *************/

    function partial_adjust_args_kwargs(args, kwargs) {
        args = this.arg_arr.concat(args);
        if (kwargs) {
            kwargs = Sk.abstr.keywordArrayToPyDict(kwargs);
            const kwargs1 = this.kwdict.dict$copy();
            kwargs1.dict$merge(kwargs);
            kwargs = Sk.abstr.keywordArrayFromPyDict(kwargs1);
        } else {
            kwargs = Sk.abstr.keywordArrayFromPyDict(this.kwdict);
        }
        return { args: args, kwargs: kwargs };
    }

    function partial_new(args, kwargs) {
        if (args.length < 1) {
            throw new Sk.builtin.TypeError("type 'partial' takes at least 1 argument");
        }
        let func = args.shift();
        let pargs, pkwdict;
        if (func instanceof this.sk$builtinBase) {
            const part = func;
            func = part.fn;
            pargs = part.arg_arr;
            pkwdict = part.kwdict;
        }
        this.check$func(func);
        if (pargs) {
            args = pargs.concat(args);
        }
        kwargs = kwargs || [];
        let kwdict = Sk.abstr.keywordArrayToPyDict(kwargs);
        if (pkwdict) {
            const copy = pkwdict.dict$copy();
            copy.dict$merge(kwdict);
            kwdict = copy;
        }
        if (this.sk$builtinBase === this.constructor) {
            return new this.constructor(func, args, kwdict);
        } else {
            // for subclassing
            const instance = new this.constructor();
            this.sk$builtinBase.call(instance, func, args, kwdict);
            return instance;
        }
    }

    function partial_repr() {
        if (this.in$repr) {
            return new Sk.builtin.str("...");
        }
        this.in$repr = true;
        const arglist = [Sk.misceval.objectRepr(this.fn)];
        this.arg_arr.forEach((arg) => {
            arglist.push(Sk.misceval.objectRepr(arg));
        });
        this.kwdict.$items().forEach(([key, val]) => {
            arglist.push(key.toString() + "=" + Sk.misceval.objectRepr(val));
        });
        this.in$repr = false;

        /** @todo this.tp$name should actually include functools here since it's a static type */
        return new Sk.builtin.str(this.tp$name + "(" + arglist.join(", ") + ")");
    }

    functools.partial = Sk.abstr.buildNativeClass("functools.partial", {
        constructor: function partial(func, args, kwdict) {
            this.fn = func;
            this.arg_arr = args;
            this.arg_tup = new Sk.builtin.tuple(args);
            this.kwdict = kwdict;
            this.in$repr = false;
            this.$d = new Sk.builtin.dict([]);
        },
        slots: {
            tp$new: partial_new,
            tp$call(args, kwargs) {
                ({ args, kwargs } = this.adj$args_kws(args, kwargs));
                return this.fn.tp$call(args, kwargs);
            },
            tp$doc: "partial(func, *args, **keywords) - new function with partial application\n    of the given arguments and keywords.\n",
            $r: partial_repr,
            tp$getattr: Sk.generic.getAttr,
            tp$setattr: Sk.generic.setAttr,
        },
        getsets: {
            func: {
                $get() {
                    return this.fn;
                },
                $doc: "function object to use in future partial calls",
            },
            args: {
                $get() {
                    return this.arg_tup;
                },
                $doc: "tuple of arguments to future partial calls",
            },
            keywords: {
                $get() {
                    return this.kwdict;
                },
                $doc: "dictionary of keyword arguments to future partial calls",
            },
            __dict__: Sk.generic.getSetDict,
        },
        methods: {
            // __reduce__: {},
            // __setstate__: {}
        },
        proto: {
            adj$args_kws: partial_adjust_args_kwargs,
            check$func(func) {
                if (!Sk.builtin.checkCallable(func)) {
                    throw new Sk.builtin.TypeError("the first argument must be callable");
                }
            },
        },
    });

    /********** Partial Method *************/

    functools.partialmethod = Sk.abstr.buildNativeClass("functools.partialmethod", {
        constructor: function partialmethod(func, args, kwdict) {
            this.fn = func;
            this.arg_arr = args;
            this.arg_tup = new Sk.builtin.tuple(args);
            this.kwdict = kwdict;
        },
        slots: {
            tp$new: partial_new,
            tp$doc:
                "Method descriptor with partial application of the given arguments\n    and keywords.\n\n    Supports wrapping existing descriptors and handles non-descriptor\n    callables as instance methods.\n    ",
            $r: partial_repr,
            tp$descr_get(obj, obtype) {
                let res;
                if (this.fn.tp$descr_get) {
                    const new_func = this.fn.tp$descr_get(obj, obtype);
                    if (new_func !== this.fn) {
                        if (!Sk.builtin.checkCallable(new_func)) {
                            throw new Sk.builtin.TypeError("type 'partial' requires a callable");
                        }
                        res = new functools.partial(new_func, this.arg_arr.slice(0), this.kwdict.dict$copy());
                        const __self__ = Sk.abstr.lookupSpecial(new_func, this.str$self);
                        if (__self__ !== undefined) {
                            res.tp$setattr(this.str$self, __self__);
                        }
                    }
                }
                if (res === undefined) {
                    res = this.make$unbound().tp$descr_get(obj, obtype);
                }
                return res;
            },
        },
        methods: {
            _make_unbound_method: {
                $meth() {
                    return this.make$unbound();
                },
                $flags: { NoArgs: true },
            },
        },
        getsets: {
            func: {
                $get() {
                    return this.fn;
                },
                $doc: "function object to use in future partial calls",
            },
            args: {
                $get() {
                    return this.arg_tup;
                },
                $doc: "tuple of arguments to future partial calls",
            },
            keywords: {
                $get() {
                    return this.kwdict;
                },
                $doc: "dictionary of keyword arguments to future partial calls",
            },
            __dict__: Sk.generic.getSetDict,
        },
        proto: {
            str$self: new Sk.builtin.str("__self__"),
            make$unbound() {
                const self = this;
                function _method(args, kwargs) {
                    const cls_or_self = args.shift();
                    ({ args, kwargs } = self.adj$args_kws(args, kwargs));
                    args.unshift(cls_or_self);
                    return Sk.misceval.callsimOrSuspendArray(self.fn, args, kwargs);
                }
                _method.co_fastcall = true;
                return new Sk.builtin.func(_method);
            },
            adj$args_kws: partial_adjust_args_kwargs,
            check$func(func) {
                if (!Sk.builtin.checkCallable(func) && func.tp$descr_get === undefined) {
                    throw new Sk.builtin.TypeError(Sk.misceval.objectRepr(func) + " is not callable or a descriptor");
                }
            },
        },
    });

    /********** Total Ordering *************/

    const js_opname_to_py = {
        __lt__: Sk.builtin.str.$lt,
        __le__: Sk.builtin.str.$le,
        __gt__: Sk.builtin.str.$gt,
        __ge__: Sk.builtin.str.$ge,
    };

    function from_slot(op_name, get_res) {
        const pyName = js_opname_to_py[op_name];
        function compare_slot(self, other) {
            let op_result = Sk.misceval.callsimArray(self.tp$getattr(pyName), [other]);
            if (op_result === Sk.builtin.NotImplemented.NotImplemented$) {
                return op_result;
            }
            op_result = Sk.misceval.isTrue(op_result);
            return new Sk.builtin.bool(get_res(op_result, self, other));
        }
        compare_slot.co_name = pyName;
        return compare_slot;
    }

    const _gt_from_lt = from_slot("__lt__", (op_result, self, other) => !op_result && Sk.misceval.richCompareBool(self, other, "NotEq"));
    const _le_from_lt = from_slot("__lt__", (op_result, self, other) => op_result || Sk.misceval.richCompareBool(self, other, "Eq"));
    const _ge_from_lt = from_slot("__lt__", (op_result) => !op_result);
    const _ge_from_le = from_slot("__le__", (op_result, self, other) => !op_result || Sk.misceval.richCompareBool(self, other, "Eq"));
    const _lt_from_le = from_slot("__le__", (op_result, self, other) => op_result && Sk.misceval.richCompareBool(self, other, "NotEq"));
    const _gt_from_le = from_slot("__le__", (op_result) => !op_result);
    const _lt_from_gt = from_slot("__gt__", (op_result, self, other) => !op_result && Sk.misceval.richCompareBool(self, other, "NotEq"));
    const _ge_from_gt = from_slot("__gt__", (op_result, self, other) => op_result || Sk.misceval.richCompareBool(self, other, "Eq"));
    const _le_from_gt = from_slot("__gt__", (op_result) => !op_result);
    const _le_from_ge = from_slot("__ge__", (op_result, self, other) => !op_result || Sk.misceval.richCompareBool(self, other, "Eq"));
    const _gt_from_ge = from_slot("__ge__", (op_result, self, other) => op_result && Sk.misceval.richCompareBool(self, other, "NotEq"));
    const _lt_from_ge = from_slot("__ge__", (op_result) => !op_result);

    const pyFunc = Sk.builtin.func;

    const _convert = {
        __lt__: { __gt__: new pyFunc(_gt_from_lt), __le__: new pyFunc(_le_from_lt), __ge__: new pyFunc(_ge_from_lt) },
        __le__: { __ge__: new pyFunc(_ge_from_le), __lt__: new pyFunc(_lt_from_le), __gt__: new pyFunc(_gt_from_le) },
        __gt__: { __lt__: new pyFunc(_lt_from_gt), __ge__: new pyFunc(_ge_from_gt), __le__: new pyFunc(_le_from_gt) },
        __ge__: { __le__: new pyFunc(_le_from_ge), __gt__: new pyFunc(_gt_from_ge), __lt__: new pyFunc(_lt_from_ge) },
    };

    const op_name_short = {
        __lt__: "ob$lt",
        __le__: "ob$le",
        __gt__: "ob$gt",
        __ge__: "ob$ge",
    };

    function total_ordering(cls) {
        const roots = [];
        if (!Sk.builtin.checkClass(cls)) {
            throw new Sk.builtin.TypeError("total ordering only supported for type objects not '" + Sk.abstr.typeName(cls) + "'");
        }
        Object.keys(_convert).forEach((key) => {
            const shortcut = op_name_short[key];
            if (cls.prototype[shortcut] !== Sk.builtin.object.prototype[shortcut]) {
                roots.push(key);
            }
        });
        if (!roots.length) {
            throw new Sk.builtin.ValueError("must define atleast one ordering operation: <, >, <=, >=");
        }
        const root = roots[0];
        Object.entries(_convert[root]).forEach(([opname, opfunc]) => {
            if (!roots.includes(opname)) {
                cls.tp$setattr(js_opname_to_py[opname], opfunc);
            }
        });
        return cls;
    }

    /************* KeyWrapper for cmp_to_key *************/
    const zero = new Sk.builtin.int_(0);

    const KeyWrapper = Sk.abstr.buildNativeClass("functools.KeyWrapper", {
        constructor: function (cmp, obj) {
            this.cmp = cmp;
            this.obj = obj;
        },
        slots: {
            tp$call(args, kwargs) {
                const [obj] = Sk.abstr.copyKeywordsToNamedArgs("K", ["obj"], args, kwargs, []);
                return new KeyWrapper(this.cmp, obj);
            },
            tp$richcompare(other, op) {
                if (!(other instanceof KeyWrapper)) {
                    throw new Sk.builtin.TypeError("other argument must be K instance");
                }
                const x = this.obj;
                const y = other.obj;
                if (!x || !y) {
                    throw new Sk.builtin.AttributeErrror("object");
                }
                const comparison = () => Sk.misceval.callsimOrSuspendArray(this.cmp, [x, y]);
                return Sk.misceval.chain(comparison, (res) => Sk.misceval.richCompareBool(res, zero, op));
            },
            tp$getattr: Sk.generic.getAttr,
            tp$hash: Sk.builtin.none.none$,
        },
        getsets: {
            obj: {
                $get() {
                    return this.obj || Sk.builtin.none.none$;
                },
                $set(value) {
                    this.obj = value;
                },
                $doc: "Value wrapped by a key function.",
            },
        },
    });

    const str_update = new Sk.builtin.str("update");
    const __wrapped__ = new Sk.builtin.str("__wrapped__");

    Sk.abstr.setUpModuleMethods("functools", functools, {
        cmp_to_key: {
            $meth: function cmp_to_key(mycmp) {
                return new KeyWrapper(mycmp);
            },
            $flags: { NamedArgs: ["mycmp"], Defaults: [] },
            $doc: "Convert a cmp= function into a key= function.",
            $textsig: "($module, cmp, /)",
        },
        reduce: {
            $meth: function reduce(fun, seq, initializer) {
                const iter = Sk.abstr.iter(seq);
                let accum_value;
                return Sk.misceval.chain(
                    () => initializer || iter.tp$iternext(true),
                    (initial) => {
                        if (initial === undefined) {
                            throw new Sk.builtin.TypeError("reduce() of empty sequence with no initial value");
                        }
                        accum_value = initial;
                        return Sk.misceval.iterFor(iter, (item) => {
                            return Sk.misceval.chain(() => Sk.misceval.callsimOrSuspendArray(fun, [accum_value, item]), (res) => {
                                accum_value = res;
                            });
                        });
                    },
                    () => {
                        return accum_value;
                    }
                );
            },
            $flags: { MinArgs: 2, MaxArgs: 3 },
            $doc:
                "reduce(function, sequence[, initial]) -> value\n\nApply a function of two arguments cumulatively to the items of a sequence,\nfrom left to right, so as to reduce the sequence to a single value.\nFor example, reduce(lambda x, y: x+y, [1, 2, 3, 4, 5]) calculates\n((((1+2)+3)+4)+5).  If initial is present, it is placed before the items\nof the sequence in the calculation, and serves as a default when the\nsequence is empty.",
            $textsig: "($module, function, sequence[, initial], /)",
        },
        total_ordering: {
            $meth: total_ordering,
            $flags: { OneArg: true },
            $doc: "Class decorator that fills in missing ordering methods",
        },

        update_wrapper: {
            $meth: function update_wrapper(wrapper, wrapped, assigned, updated) {
                let it = Sk.abstr.iter(assigned);
                let value;
                for (let attr = it.tp$iternext(); attr !== undefined; attr = it.tp$iternext()) {
                    if ((value = wrapped.tp$getattr(attr)) !== undefined) {
                        wrapper.tp$setattr(attr, value);
                    }
                }
                it = Sk.abstr.iter(updated);
                for (let attr = it.tp$iternext(); attr !== undefined; attr = it.tp$iternext()) {
                    value = wrapped.tp$getattr(attr) || new Sk.builtin.dict([]);
                    const to_update = Sk.abstr.gattr(wrapper, attr); // throw the appropriate error
                    const update_meth = Sk.abstr.gattr(to_update, str_update);
                    Sk.misceval.callsimArray(update_meth, [value]);
                }

                wrapper.tp$setattr(__wrapped__, wrapped);
                return wrapper;
            },
            $flags: {
                NamedArgs: ["wrapper", "wrapped", "assigned", "updated"],
                Defaults: [functools.WRAPPER_ASSIGNMENTS, functools.WRAPPER_UPDATES],
            },
            $doc:
                "Update a wrapper function to look like the wrapped function\n\n       wrapper is the function to be updated\n       wrapped is the original function\n       assigned is a tuple naming the attributes assigned directly\n       from the wrapped function to the wrapper function (defaults to\n       functools.WRAPPER_ASSIGNMENTS)\n       updated is a tuple naming the attributes of the wrapper that\n       are updated with the corresponding attribute from the wrapped\n       function (defaults to functools.WRAPPER_UPDATES)\n    ",
            $textsig:
                "($module, /, wrapper, wrapped, assigned=('__module__', '__name__', '__qualname__', '__doc__', '__annotations__'), updated=('__dict__',))",
        },
        wraps: {
            $meth: function wraps(wrapped, assigned, updated) {
                const kwarray = ["wrapped", wrapped, "assigned", assigned, "updated", updated];
                return Sk.misceval.callsimArray(functools.partial, [functools.update_wrapper], kwarray);
            },
            $flags: {
                NamedArgs: ["wrapped", "assigned", "updated"],
                Defaults: [functools.WRAPPER_ASSIGNMENTS, functools.WRAPPER_UPDATES],
            },
            $doc:
                "Decorator factory to apply update_wrapper() to a wrapper function\n\n       Returns a decorator that invokes update_wrapper() with the decorated\n       function as the wrapper argument and the arguments to wraps() as the\n       remaining arguments. Default arguments are as for update_wrapper().\n       This is a convenience function to simplify applying partial() to\n       update_wrapper().\n    ",
            $textsig:
                "($module, /, wrapped, assigned=('__module__', '__name__', '__qualname__', '__doc__', '__annotations__'), updated=('__dict__',))",
        },
    });

    return functools;
}
