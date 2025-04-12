function $builtinmodule() {
    const depndencies = {};
    return Sk.misceval.chain(Sk.importModule("functools", false, true), (functools_mod) => {
        depndencies.wraps = functools_mod.$d.wraps;
        return contextlib_mod(depndencies);
    });
}

function contextlib_mod(dependencies) {
    const { wraps } = dependencies;

    const {
        str: pyStr,
        func: pyFunc,
        bool: pyBool,
        bool: { false$: pyFalse },
        none: { none$: pyNone },
        tuple: pyTuple,
        RuntimeError,
        StopIteration,
        checkNone,
        issubclass,
    } = Sk.builtin;

    const { callsimOrSuspendArray: pyCallOrSuspend, callsimArray: pyCall, chain, tryCatch } = Sk.misceval;

    const {
        setUpModuleMethods,
        buildNativeClass,
        iternext,
        checkOneArg,
        checkNoKwargs,
        copyKeywordsToNamedArgs,
        gattr: objectGetAttr,
    } = Sk.abstr;

    const { remapToPy: toPy } = Sk.ffi;

    const contextlib = {
        __name__: new pyStr("contextlib"),
        __all__: toPy([
            // "asynccontextmanager",
            "contextmanager",
            "closing",
            "nullcontext",
            // "AbstractContextManager",
            // "AbstractAsyncContextManager",
            // "AsyncExitStack",
            // "ContextDecorator",
            // "ExitStack",
            // "redirect_stdout",
            // "redirect_stderr",
            "suppress",
            // "aclosing",
        ]),
    };

    function buildNativeContextManager(name, options) {
        const { __enter__, __exit__, __init__, constructor } = options;
        constructor === Object && (options.constructor = function contextHelper() {});

        options.slots || (options.slots = {});
        __init__ && (options.slots.tp$init = __init__);

        options.methods || (options.methods = {});
        options.methods.__enter__ = {
            $meth: __enter__,
            $flags: { NoArgs: true },
        };
        options.methods.__exit__ = {
            $meth: __exit__,
            $flags: { MinArgs: 3, MaxArgs: 3 },
        };
        return buildNativeClass(name, options);
    }

    // internal only so only called like new _GeneratorContextManager(func, args, kwds)
    _GeneratorContextmanager = buildNativeContextManager("contextlib._GeneratorContextmanager", {
        constructor: function _GeneratorContextmanager(func, args, kwds) {
            this.$func = func;
            this.$args = args;
            this.$kwds = kwds;
            this.$doc = func.tp$getattr(pyStr.$doc) || pyNone;
            this.$gen = pyCall(func, args, kwds); // making it a generator shouldn't suspend
        },
        slots: {
            tp$call(args, kwargs) {
                checkOneArg("_GeneratorContextmanager", args, kwargs);
                const func = args[0];
                const inner = (args, kwds) => {
                    const self = new _GeneratorContextmanager(this.$func, this.$args, this.$kwds);
                    const enter = self.tp$getattr(pyStr.$enter);
                    const exit = self.tp$getattr(pyStr.$exit);
                    let type = pyNone,
                        value = pyNone,
                        tb = pyNone,
                        err = null;
                    return chain(
                        tryCatch(
                            () => chain(pyCallOrSuspend(enter), () => pyCallOrSuspend(func, args, kwds)),
                            (e) => {
                                err = e;
                                type = err.ob$type;
                                value = e;
                            },
                            () => {
                                if (pyCall(exit, [type, value, tb]) === pyFalse && err) {
                                    throw err;
                                }
                            }
                        ),
                        () => pyNone
                    );
                };
                inner.co_fastcall = true;
                return chain(pyCallOrSuspend(wraps, [func]), (wrapper) =>
                    pyCallOrSuspend(wrapper, [new pyFunc(inner)])
                );
            },
        },
        __enter__() {
            this.$func = this.$args = this.$kwds = null;
            return chain(iternext(this.$gen, true), (nxt) => {
                if (nxt === undefined) {
                    throw new RuntimeError("generator didn't yield");
                }
                return nxt;
            });
        },
        __exit__(type, value, traceback) {
            if (checkNone(type)) {
                return chain(iternext(this.$gen, true), (nxt) => {
                    if (nxt !== undefined) {
                        throw new RuntimeError("generator didn't stop");
                    }
                    return pyFalse;
                });
            } else {
                if (checkNone(value)) {
                    value = pyCall(type);
                }
                return tryCatch(
                    () =>
                        chain(
                            pyCallOrSuspend(this.$gen.tp$getattr(new pyStr("throw")), [type, value, traceback]),
                            () => {
                                throw new RuntimeError("generator didn't stop after throw()");
                            }
                        ),
                    (e) => {
                        if (e instanceof StopIteration) {
                            return new pyBool(e !== value);
                        } else if (e instanceof RuntimeError && type === StopIteration) {
                            // should only do this if StopIteration was the cause
                            return pyFalse;
                        }
                        if (e === value) {
                            return pyFalse;
                        }
                        throw e;
                    }
                );
            }
        },
        getsets: {
            __doc__: {
                $get() {
                    return this.$doc || pyNone;
                },
                $set(v) {
                    this.$doc = v;
                },
            },
        },
    });

    contextlib.suppress = buildNativeContextManager("contextlib.suppress", {
        __init__(args, kws) {
            checkNoKwargs("suppress", kws);
            this.$exc = new pyTuple(args.slice(0));
        },
        __enter__() {
            return pyNone;
        },
        __exit__(type, value, tb) {
            return new pyBool(!checkNone(type) && issubclass(type, this.$exc));
        },
    });

    contextlib.nullcontext = buildNativeContextManager("contextlib.nullcontext", {
        __init__(args, kws) {
            const [enter_res] = copyKeywordsToNamedArgs("nullcontext", ["enter_result"], args, kws, [pyNone]);
            this.enter$res = enter_res;
        },
        __enter__() {
            return this.enter$res;
        },
        __exit__(type, value, tb) {
            return pyNone;
        },
    });

    contextlib.closing = buildNativeContextManager("contextlib.closing", {
        __init__(args, kws) {
            checkOneArg("closing", args, kws);
            this.$gen = args[0];
        },
        __enter__() {
            return this.$gen;
        },
        __exit__(type, value, tb) {
            const _close = objectGetAttr(this.$gen, new pyStr("close"));
            return chain(pyCallOrSuspend(_close), () => pyNone);
        },
    });

    setUpModuleMethods("contextlib", contextlib, {
        contextmanager: {
            $meth(func) {
                return chain(pyCallOrSuspend(wraps, [func]), (wrapped) => {
                    function helper(args, kwargs) {
                        return new _GeneratorContextmanager(func, args, kwargs);
                    }
                    helper.co_fastcall = true;
                    return pyCallOrSuspend(wrapped, [new pyFunc(helper)]);
                });
            },
            $flags: { OneArg: true },
            $doc:
                "Typical usage:\n\n    @contextmanager\n    def some_generator(<arguments>):\n" +
                "        <setup>\n        try:\n            yield <value>\n        finally:\n" +
                "            <cleanup>\n\nThis makes this:\n\n    with some_generator(<arguments>) as <variable>:\n" +
                "        <body>\n\nequivalent to this:\n\n    <setup>\n    try:\n        <variable> = <value>\n" +
                "        <body>\n    finally:\n        <cleanup>",
        },
    });

    return contextlib;
}
