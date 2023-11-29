function $builtinmodule() {
    const functools = {};
    return Sk.misceval.chain(Sk.importModule("collections", false, true), (collections_mod) => {
        functools._namedtuple = collections_mod.$d.namedtuple;
        return functools_mod(functools);
    });
}

function functools_mod(functools) {

    const {
        object: pyObject,
        int_: pyInt,
        str: pyStr,
        list: pyList,
        tuple: pyTuple,
        dict: pyDict,
        none: { none$: pyNone },
        bool: { false$: pyFalse },
        NotImplemented: { NotImplemented$: pyNotImplemented },
        bool: pyBool,
        func: pyFunc,
        method: pyMethod,
        TypeError: pyTypeError,
        RuntimeError,
        ValueError,
        NotImplementedError,
        AttributeError,
        OverflowError,
        checkNone,
        checkBool,
        checkCallable,
        checkClass,
    } = Sk.builtin;

    const {
        callsimArray: pyCall,
        callsimOrSuspendArray: pyCallOrSuspend,
        iterFor,
        chain,
        isIndex,
        asIndexSized,
        isTrue,
        richCompareBool,
        objectRepr,
        retryOptionalSuspeionOrThrow,
        chain: chainOrSuspend,
    } = Sk.misceval;

    const { remapToPy: toPy } = Sk.ffi;
    
    const {
        checkOneArg,
        checkNoKwargs,
        buildNativeClass,
        setUpModuleMethods,
        keywordArrayFromPyDict,
        keywordArrayToPyDict,
        objectHash,
        lookupSpecial,
        copyKeywordsToNamedArgs,
        typeName,
        objectSetItem,
        iter: objectGetIter,
        gattr: objectGetAttr,
    } = Sk.abstr;

    const { getSetDict: genericGetSetDict, getAttr: genericGetAttr, setAttr: genericSetAttr } = Sk.generic;



    Object.assign(functools, {
        __name__: new pyStr("functools"),
        __doc__: new pyStr("Tools for working with functions and callable objects"),
        __all__: new pyList(
            [
                "update_wrapper",
                "wraps",
                "WRAPPER_ASSIGNMENTS",
                "WRAPPER_UPDATES",
                "total_ordering",
                "cmp_to_key",
                "cache",
                "lru_cache",
                "reduce",
                "partial",
                "partialmethod",
                "singledispatch" /**@todo singledispatch */,
                "singledispatchmethod" /**@todo singledispatchmethod */,
                "cached_property",
            ].map((x) => new pyStr(x))
        ),
        WRAPPER_ASSIGNMENTS: new pyTuple(
            ["__module__", "__name__", "__qualname__", "__doc__", "__annotations__"].map(
                (x) => new pyStr(x)
            )
        ),
        WRAPPER_UPDATES: new pyTuple([new pyStr("__dict__")]),

        /**@todo */
        singledispatch: proxyFail("singledispatch"),
        singledispatchmethod: proxyFail("singledispatchmethod"),
    });

    function proxyFail(name) {
        return new pyFunc(() => {
            throw new NotImplementedError(name + " is not yet implemented in skulpt");
        });
    }

    /********** lru_cache *************/
    const str_cached_params = new pyStr("cache_parameters");

    function _lru_cache(maxsize, typed) {
        typed || (typed = pyFalse);
        if (isIndex(maxsize)) {
            maxsize = asIndexSized(maxsize, OverflowError);
            if (maxsize < 0) {
                maxsize = 0;
            }
        } else if (checkCallable(maxsize) && checkBool(typed)) {
            const user_function = maxsize;
            maxsize = 128;
            const wrapper = new _lru_cache_wrapper(user_function, maxsize, typed);
            wrapper.tp$setattr(str_cached_params, new pyFunc(() => toPy({ maxsize, typed })));
            return pyCallOrSuspend(functools.update_wrapper, [wrapper, user_function]);
        } else if (!checkNone(maxsize)) {
            throw new pyTypeError("Expected first argument to be an integer, a callable, or None");
        }

        return new pyFunc((user_function) => {
            const wrapper = new _lru_cache_wrapper(user_function, maxsize, typed);
            wrapper.tp$setattr(str_cached_params, new pyFunc(() => toPy({ maxsize, typed })));
            return pyCallOrSuspend(functools.update_wrapper, [wrapper, user_function]);
        });
    }

    const _CacheInfo = (functools._CacheInfo = pyCall(
        functools._namedtuple,
        ["CacheInfo", ["hits", "misses", "maxsize", "currsize"]].map((x) => toPy(x)),
        ["module", new pyStr("functools")]
    ));

    const _lru_cache_wrapper = buildNativeClass("functools._lru_cache_wrapper", {
        constructor: function _lru_cache_wrapper(func, maxsize, typed, cache_info_type) {
            if (!checkCallable(func)) {
                throw new pyTypeError("the first argument must be callable");
            }
            let wrapper;
            /* select the caching function, and make/inc maxsize_O */
            if (checkNone(maxsize)) {
                wrapper = infinite_lru_cache_wrapper;
                /* use this only to initialize lru_cache_object attribute maxsize */
                maxsize = -1;
            } else if (isIndex(maxsize)) {
                maxsize = asIndexSized(maxsize, OverflowError);
                if (maxsize < 0) {
                    maxsize = 0;
                }
                if (maxsize === 0) {
                    wrapper = uncached_lru_cache_wrapper;
                } else {
                    wrapper = bounded_lru_cache_wrapper;
                }
            } else {
                throw new pyTypeError("maxsize should be integer or None");
            }
            this.root = {};
            this.root.prev = this.root.next = this.root;

            this.wrapper = wrapper;
            this.maxsize = maxsize;
            this.typed = typed;
            this.cache = new pyDict([]);
            this.func = func;
            this.misses = this.hits = 0;
            // this.cache_info_type = cache_info_type;
            this.$d = new pyDict([]);
        },
        slots: {
            tp$new(args, kws) {
                const [func, maxsize, typed, cache_info_type] = copyKeywordsToNamedArgs(
                    "_lru_cache_wrapper",
                    ["user_function", "maxsize", "typed", "cache_info_type"],
                    args,
                    kws
                );
                return new _lru_cache_wrapper(func, maxsize, typed, cache_info_type);
            },
            tp$call(args, kws) {
                // we've already checked it's callable i.e. that it has a tp$call so just call it
                return this.wrapper(args, kws);
            },
            tp$descr_get(obj, type) {
                if (obj === null) {
                    return this;
                }
                return new pyMethod(this, obj);
            },
            tp$doc:
                "Create a cached callable that wraps another function.\n\
\n\
user_function:      the function being cached\n\
\n\
maxsize:  0         for no caching\n\
          None      for unlimited cache size\n\
          n         for a bounded cache\n\
\n\
typed:    False     cache f(3) and f(3.0) as identical calls\n\
          True      cache f(3) and f(3.0) as distinct calls\n\
\n\
cache_info_type:    namedtuple class with the fields:\n\
                        hits misses currsize maxsize\n",
        },
        methods: {
            cache_info: {
                $meth() {
                    return pyCallOrSuspend(
                        _CacheInfo,
                        [
                            this.hits,
                            this.misses,
                            this.maxsize === -1 ? pyNone : this.maxsize,
                            this.cache.get$size(),
                        ].map((x) => toPy(x))
                    );
                },
                $flags: { NoArgs: true },
                $doc: "Report cache statistics",
            },
            cache_clear: {
                $meth() {
                    this.hits = this.misses = 0;
                    this.root = {};
                    this.root.next = this.root.prev = this.root;
                    return pyCallOrSuspend(this.cache.tp$getattr(new pyStr("clear"), true));
                },
                $flags: { NoArgs: true },
                $doc: "Clear the cache and cache statistics",
            },
            // __reduce__: {},
            __deepcopy__: {
                $meth(memo) {
                    return this;
                },
                $flags: { OneArg: true },
            },
            __copy__: {
                $meth() {
                    return this;
                },
                $flags: { NoArgs: true },
            },
        },
        getsets: {
            __dict__: genericGetSetDict,
        },
    });

    /**
     * @this lru_cache_object
     */
    function infinite_lru_cache_wrapper(args, kws) {
        const key = _make_key(args, kws, this.typed);
        const result = this.cache.mp$lookup(key);
        if (result !== undefined) {
            this.hits++;
            return result;
        }
        this.misses++;
        return chain(pyCallOrSuspend(this.func, args, kws), (res) => {
            this.cache.mp$ass_subscript(key, res);
            return res;
        });
    }

    function uncached_lru_cache_wrapper(args, kws) {
        this.misses++;
        return pyCallOrSuspend(this.func, args, kws);
    }

    function bounded_lru_cache_wrapper(args, kws) {
        const key = _make_key(args, kws, this.typed);
        const link = this.cache.mp$lookup(key);
        if (link !== undefined) {
            // # Move the link to the front of the circular queue
            const { result } = link;
            lru_cache_extract_link(link);
            lru_cache_append_link(this, link);
            this.hits++;
            return result;
        }
        this.misses++;

        return chain(pyCallOrSuspend(this.func, args, kws), (result) => {
            const testresult = this.cache.mp$lookup(key);
            if (testresult !== undefined) {
                /* Getting here means that this same key was added to the cache
                during the PyObject_Call().  Since the link update is already
                done, we need only return the computed result. */
                return result;
            }

            /* This is the normal case.  The new key wasn't found before
            user function call and it is still not there.  So we
            proceed normally and update the cache with the new result. */
            if (this.cache.get$size() < this.maxsize || this.root.next === this.root) {
                /* Cache is not full, so put the result in a new link */
                const link = { key, result };
                this.cache.mp$ass_subscript(key, link);
                lru_cache_append_link(this, link);
                return result;
            }
            /* Extract the oldest item. */
            const link = this.root.next;
            lru_cache_extract_link(link);
            /* Remove it from the cache.
            The cache dict holds one reference to the link.
            We created one other reference when the link was created.
            The linked list only has borrowed references. */
            const popresult = this.cache.pop$item(link.key);
            if (popresult === undefined) {
                /* An error arose while trying to remove the oldest key (the one
                being evicted) from the cache.  We restore the link to its
                original position as the oldest link.  Then we allow the
                error propagate upward; treating it the same as an error
                arising in the user function. */
                lru_cache_prepend_link(this, link);
                throw new RuntimeError("cached item removed unexpectedly");
            }
            link.key = key;
            link.result = result;
            this.cache.mp$ass_subscript(key, link);
            lru_cache_append_link(this, link);
            return result;
        });
    }

    function lru_cache_extract_link(link) {
        const {prev: link_prev, next: link_next} = link;
        link_prev.next = link.next;
        link_next.prev = link.prev;
    }

    function lru_cache_append_link(self, link) {
        const root = self.root;
        const last = root.prev;
        last.next = root.prev = link;
        link.prev = last;
        link.next = root;
    }

    function lru_cache_prepend_link(self, link) {
        const root = self.root;
        const first = root.next;
        first.prev = root.next = link;
        link.prev = root;
        link.next = first;
    }


    const _HachedSeq = buildNativeClass("_HachedSeq", {
        base: pyList,
        constructor: function _HachedSeq(key_array) {
            this.$hashval = objectHash(new pyTuple(key_array));
            pyList.call(this, key_array);
        },
        slots: {
            tp$hash() {
                return this.$hashval;
            },
        },
    });

    const kwd_mark = new pyObject();
    const fasttypes = new Set([pyInt, pyStr]);

    function _make_key(args, kws, typed) {
        const key = args.slice(0);
        const kw_vals = [];
        if (kws && kws.length) {
            key.push(kwd_mark);
            for (let i = 0; i < kws.length; i += 2) {
                const val = kws[i + 1];
                kw_vals.push(val);
                key.push(new pyTuple([new pyStr(kws[i]), val]));
            }
        }
        if (isTrue(typed)) {
            key.push(...args.map((v) => v.ob$type), ...kw_vals.map((v) => v.ob$type));
        } else if (key.length === 1 && fasttypes.has(key[0].ob$type)) {
            return key[0];
        }
        return new _HachedSeq(key);
    }


    /********** Partial *************/

    function partial_adjust_args_kwargs(args, kwargs) {
        args = this.arg_arr.concat(args);
        if (kwargs) {
            kwargs = keywordArrayToPyDict(kwargs);
            const kwargs1 = this.kwdict.dict$copy();
            kwargs1.dict$merge(kwargs);
            kwargs = keywordArrayFromPyDict(kwargs1);
        } else {
            kwargs = keywordArrayFromPyDict(this.kwdict);
        }
        return { args: args, kwargs: kwargs };
    }

    function partial_new(args, kwargs) {
        if (args.length < 1) {
            throw new pyTypeError("type 'partial' takes at least 1 argument");
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
        let kwdict = keywordArrayToPyDict(kwargs);
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
            return new pyStr("...");
        }
        this.in$repr = true;
        const arglist = [objectRepr(this.fn)];
        this.arg_arr.forEach((arg) => {
            arglist.push(objectRepr(arg));
        });
        this.kwdict.$items().forEach(([key, val]) => {
            arglist.push(key.toString() + "=" + objectRepr(val));
        });
        this.in$repr = false;

        /** @todo this.tp$name should actually include functools here since it's a static type */
        return new pyStr(this.tp$name + "(" + arglist.join(", ") + ")");
    }

    functools.partial = buildNativeClass("functools.partial", {
        constructor: function partial(func, args, kwdict) {
            this.fn = func;
            this.arg_arr = args;
            this.arg_tup = new pyTuple(args);
            this.kwdict = kwdict;
            this.in$repr = false;
            this.$d = new pyDict([]);
        },
        slots: {
            tp$new: partial_new,
            tp$call(args, kwargs) {
                ({ args, kwargs } = this.adj$args_kws(args, kwargs));
                return this.fn.tp$call(args, kwargs);
            },
            tp$doc: "partial(func, *args, **keywords) - new function with partial application\n    of the given arguments and keywords.\n",
            $r: partial_repr,
            tp$getattr: genericGetAttr,
            tp$setattr: genericSetAttr,
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
            __dict__: genericGetSetDict,
        },
        methods: {
            // __reduce__: {},
            // __setstate__: {}
        },
        classmethods: Sk.generic.classGetItem,
        proto: {
            adj$args_kws: partial_adjust_args_kwargs,
            check$func(func) {
                if (!checkCallable(func)) {
                    throw new pyTypeError("the first argument must be callable");
                }
            },
        },
    });

    /********** Partial Method *************/

    functools.partialmethod = buildNativeClass("functools.partialmethod", {
        constructor: function partialmethod(func, args, kwdict) {
            this.fn = func;
            this.arg_arr = args;
            this.arg_tup = new pyTuple(args);
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
                        if (!checkCallable(new_func)) {
                            throw new pyTypeError("type 'partial' requires a callable");
                        }
                        res = new functools.partial(new_func, this.arg_arr.slice(0), this.kwdict.dict$copy());
                        const __self__ = lookupSpecial(new_func, this.str$self);
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
        classmethods: Sk.generic.classGetItem,
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
            __dict__: genericGetSetDict,
        },
        proto: {
            str$self: new pyStr("__self__"),
            make$unbound() {
                const self = this;
                function _method(args, kwargs) {
                    const cls_or_self = args.shift();
                    ({ args, kwargs } = self.adj$args_kws(args, kwargs));
                    args.unshift(cls_or_self);
                    return pyCallOrSuspend(self.fn, args, kwargs);
                }
                _method.co_fastcall = true;
                return new pyFunc(_method);
            },
            adj$args_kws: partial_adjust_args_kwargs,
            check$func(func) {
                if (!checkCallable(func) && func.tp$descr_get === undefined) {
                    throw new pyTypeError(objectRepr(func) + " is not callable or a descriptor");
                }
            },
        },
    });

    /********** Total Ordering *************/

    const js_opname_to_py = {
        __lt__: pyStr.$lt,
        __le__: pyStr.$le,
        __gt__: pyStr.$gt,
        __ge__: pyStr.$ge,
    };

    function from_slot(op_name, get_res) {
        const pyName = js_opname_to_py[op_name];
        function compare_slot(self, other) {
            let op_result = pyCall(self.tp$getattr(pyName), [other]);
            if (op_result === pyNotImplemented) {
                return op_result;
            }
            op_result = isTrue(op_result);
            return new pyBool(get_res(op_result, self, other));
        }
        compare_slot.co_name = pyName;
        return compare_slot;
    }

    const _gt_from_lt = from_slot("__lt__", (op_result, self, other) => !op_result && richCompareBool(self, other, "NotEq"));
    const _le_from_lt = from_slot("__lt__", (op_result, self, other) => op_result || richCompareBool(self, other, "Eq"));
    const _ge_from_lt = from_slot("__lt__", (op_result) => !op_result);
    const _ge_from_le = from_slot("__le__", (op_result, self, other) => !op_result || richCompareBool(self, other, "Eq"));
    const _lt_from_le = from_slot("__le__", (op_result, self, other) => op_result && richCompareBool(self, other, "NotEq"));
    const _gt_from_le = from_slot("__le__", (op_result) => !op_result);
    const _lt_from_gt = from_slot("__gt__", (op_result, self, other) => !op_result && richCompareBool(self, other, "NotEq"));
    const _ge_from_gt = from_slot("__gt__", (op_result, self, other) => op_result || richCompareBool(self, other, "Eq"));
    const _le_from_gt = from_slot("__gt__", (op_result) => !op_result);
    const _le_from_ge = from_slot("__ge__", (op_result, self, other) => !op_result || richCompareBool(self, other, "Eq"));
    const _gt_from_ge = from_slot("__ge__", (op_result, self, other) => op_result && richCompareBool(self, other, "NotEq"));
    const _lt_from_ge = from_slot("__ge__", (op_result) => !op_result);


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
        if (!checkClass(cls)) {
            throw new pyTypeError(
                "total ordering only supported for type objects not '" + typeName(cls) + "'"
            );
        }
        Object.keys(_convert).forEach((key) => {
            const shortcut = op_name_short[key];
            if (cls.prototype[shortcut] !== pyObject.prototype[shortcut]) {
                roots.push(key);
            }
        });
        if (!roots.length) {
            throw new ValueError("must define atleast one ordering operation: <, >, <=, >=");
        }
        const root = roots[0];
        Object.entries(_convert[root]).forEach(([opname, opfunc]) => {
            if (!roots.includes(opname)) {
                cls.tp$setattr(js_opname_to_py[opname], opfunc);
            }
        });
        return cls;
    }

    /************* cached property *************/

    const s_get = new pyStr("get");
    const NOT_FOUND = new pyObject();

    functools.cached_property = buildNativeClass("functools.cached_property", {
        constructor: function () {},
        slots: {
            tp$init(args, kws) {
                // const [func] = copyKeywordsToNamedArgs("cached_property", ["func"], args, kws);
                checkOneArg("cached_property", args, kws);
                checkNoKwargs("cached_property", kws);
                this._func = args[0];
                this._attr = pyNone;
            },
            tp$descr_get(instance, owner, canSuspend) {
                if (instance == null) {
                    return this;
                }
                if (this._attr === pyNone) {
                    throw new pyTypeError("Cannot use cached_property instance without calling __set_name__ on it.");
                }
                let cache;
                try {
                    cache = objectGetAttr(instance, pyStr.$dict);
                } catch (e) {
                    if (e instanceof AttributeError) {
                        const msg =
                            `No '__dict__' attribute on '${typeName(instance)}' ` +
                            `instance to cache ${objectRepr(this._attr)} property.`;
                        throw new pyTypeError(msg);
                    }
                    throw e;
                }
                const get = objectGetAttr(cache, s_get);
                let rv = pyCall(get, [this._attr, NOT_FOUND]);
                if (rv === NOT_FOUND) {
                    const val = pyCallOrSuspend(this._func, [instance]);
                    rv = chainOrSuspend(val, (v) => {
                        try {
                            objectSetItem(cache, this._attr, val);
                            return v;
                        } catch (e) {
                            if (e instanceof pyTypeError) {
                                const msg =
                                    `The '__dict__' attribute on '${typeName(instance)}' instance ` +
                                    `does not support item assignment for caching ${objectRepr(this._attr)} property.`;
                                throw new pyTypeError(msg);
                            }
                            throw e;
                        }
                    });
                }
                return canSuspend ? rv : retryOptionalSuspeionOrThrow(rv);
            },
        },
        getsets: {
            __doc__: {
                $get() {
                    return this._func.tp$getattr(pyStr.$doc) || pyNone;
                },
            },
        },
        methods: {
            __set_name__: {
                $meth(owner, name) {
                    if (this._attr === pyNone) {
                        this._attr = name;
                    } else if (name.toString() !== this._attr.toString()) {
                        throw new pyTypeError(
                            `Cannot assign the same cached_property to two different names (${objectRepr(
                                this._attr
                            )} and ${objectRepr(name)})`
                        );
                    }
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
            },
        },
        classmethods: Sk.generic.classGetItem,
    });


    /************* KeyWrapper for cmp_to_key *************/
    const zero = new pyInt(0);

    const KeyWrapper = buildNativeClass("functools.KeyWrapper", {
        constructor: function (cmp, obj) {
            this.cmp = cmp;
            this.obj = obj;
        },
        slots: {
            tp$call(args, kwargs) {
                const [obj] = copyKeywordsToNamedArgs("K", ["obj"], args, kwargs, []);
                return new KeyWrapper(this.cmp, obj);
            },
            tp$richcompare(other, op) {
                if (!(other instanceof KeyWrapper)) {
                    throw new pyTypeError("other argument must be K instance");
                }
                const x = this.obj;
                const y = other.obj;
                if (!x || !y) {
                    throw new AttributeError("object");
                }
                const comparison = pyCallOrSuspend(this.cmp, [x, y]);
                return chain(comparison, (res) => richCompareBool(res, zero, op));
            },
            tp$getattr: genericGetAttr,
            tp$hash: pyNone,
        },
        getsets: {
            obj: {
                $get() {
                    return this.obj || pyNone;
                },
                $set(value) {
                    this.obj = value;
                },
                $doc: "Value wrapped by a key function.",
            },
        },
    });

    const str_update = new pyStr("update");
    const __wrapped__ = new pyStr("__wrapped__");

    setUpModuleMethods("functools", functools, {
        cache: {
            $meth: function cache(user_function) {
                return pyCallOrSuspend(_lru_cache(pyNone), [user_function]);
            },
            $flags: { OneArg: true },
            $doc: 'Simple lightweight unbounded cache.  Sometimes called "memoize".',
            $textsig: "($module, user_function, /)",
        },
        lru_cache: {
            $meth: _lru_cache,
            $flags: { NamedArgs: ["maxsize", "typed"], Defaults: [new pyInt(128), pyFalse] },
            $doc: `Least-recently-used cache decorator.

If *maxsize* is set to None, the LRU features are disabled and the cache
can grow without bound.

If *typed* is True, arguments of different types will be cached separately.
For example, f(3.0) and f(3) will be treated as distinct calls with
distinct results.

Arguments to the cached function must be hashable.

View the cache statistics named tuple (hits, misses, maxsize, currsize)
with f.cache_info().  Clear the cache and statistics with f.cache_clear().
Access the underlying function with f.__wrapped__.

See:  http://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)`,
        },
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
                const iter = objectGetIter(seq);
                let accum_value;
                initializer = initializer || iter.tp$iternext(true);
                return chain(
                    initializer,
                    (initial) => {
                        if (initial === undefined) {
                            throw new pyTypeError("reduce() of empty sequence with no initial value");
                        }
                        accum_value = initial;
                        return iterFor(iter, (item) => {
                            return chain(pyCallOrSuspend(fun, [accum_value, item]), (res) => {
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
                let it = objectGetIter(assigned);
                let value;
                for (let attr = it.tp$iternext(); attr !== undefined; attr = it.tp$iternext()) {
                    if ((value = wrapped.tp$getattr(attr)) !== undefined) {
                        wrapper.tp$setattr(attr, value);
                    }
                }
                it = objectGetIter(updated);
                for (let attr = it.tp$iternext(); attr !== undefined; attr = it.tp$iternext()) {
                    value = wrapped.tp$getattr(attr) || new pyDict([]);
                    const to_update = objectGetAttr(wrapper, attr); // throw the appropriate error
                    const update_meth = objectGetAttr(to_update, str_update);
                    pyCall(update_meth, [value]);
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
                return pyCallOrSuspend(functools.partial, [functools.update_wrapper], kwarray);
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
