function $builtinmodule() {
    const dependencies = {};
    return Sk.misceval.chain(Sk.importModule("functools", false, true), (functools_mod) => {
        dependencies.wraps = functools_mod.$d.wraps;
        return contextlib_mod(dependencies);
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
        AttributeError,
        BaseException,
        ExternalError,
        RuntimeError,
        TypeError,
        getExcInfo,
        StopIteration,
        checkNone,
        issubclass,
    } = Sk.builtin;

    const {
        callsimArray: pyCall,
        callsimOrSuspendArray: pyCallOrSuspend,
        chain,
        isTrue,
        iterFor,
        tryCatch,
    } = Sk.misceval;

    const {
        setUpModuleMethods,
        buildNativeClass,
        iternext,
        checkNoArgs,
        checkOneArg,
        checkNoKwargs,
        copyKeywordsToNamedArgs,
        gattr: objectGetAttr,
    } = Sk.abstr;

    const { remapToPy: toPy } = Sk.ffi;

    const contextlib = {
        __name__: new pyStr("contextlib"),
        __all__: toPy([
            "contextmanager",
            "closing",
            "ExitStack",
            "nullcontext",
            "suppress",
        ]),
    };
    const closeStr = new pyStr("close");
    const throwStr = new pyStr("throw");

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

    // Close malformed managers before raising, including their finally blocks.
    // This follows newer CPython cleanup behavior rather than Python 3.7.
    function closeGenerator(gen, onClose) {
        const close = objectGetAttr(gen, closeStr);
        return chain(pyCallOrSuspend(close), onClose);
    }

    // Run the factory before native construction so wrapped factories can suspend.
    const _GeneratorContextManager = buildNativeContextManager("contextlib._GeneratorContextManager", {
        constructor: function _GeneratorContextManager(func, args, kwds, gen) {
            this.$func = func;
            this.$args = args;
            this.$kwds = kwds;
            this.$doc = func.tp$getattr(pyStr.$doc) || pyNone;
            this.$gen = gen;
        },
        slots: {
            tp$call(args, kwargs) {
                checkOneArg("_GeneratorContextManager", args, kwargs);
                const func = args[0];
                const inner = (args, kwds) => chain(createContextManager(this.$func, this.$args, this.$kwds), (manager) => {
                    const enter = manager.tp$getattr(pyStr.$enter);
                    const exit = manager.tp$getattr(pyStr.$exit);
                    // A failed entry has no matching exit. Capture only the
                    // body's outcome so an exit failure cannot call exit twice.
                    return chain(pyCallOrSuspend(enter), () => chain(
                        tryCatch(
                            () => chain(pyCallOrSuspend(func, args, kwds), (value) => ({ value })),
                            (error) => ({ error })
                        ),
                        (outcome) => chain(
                            pyCallOrSuspend(exit, outcome.error ?
                                Sk.builtin.getExcInfo(outcome.error).v : [pyNone, pyNone, pyNone]),
                            (suppressed) => {
                                if (outcome.error) {
                                    if (!Sk.misceval.isTrue(suppressed)) {
                                        throw outcome.error;
                                    }
                                    return pyNone;
                                }
                                return outcome.value;
                            }
                        )
                    ));
                });
                inner.co_fastcall = true;
                return chain(pyCallOrSuspend(wraps, [func]), (wrapper) =>
                    pyCallOrSuspend(wrapper, [new pyFunc(inner)])
                );
            },
        },
        __enter__() {
            // The decorator template retains recreation data; an entered manager is single-use.
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
                        return closeGenerator(this.$gen, () => {
                            throw new RuntimeError("generator didn't stop");
                        });
                    }
                    return pyFalse;
                });
            } else {
                return chain(checkNone(value) ? pyCallOrSuspend(type) : value, (exception) => {
                    // Catch only throw() failures: malformed-manager cleanup may
                    // raise a new exception that must propagate without suppression.
                    // A successful throw() yielded again; null sends it to cleanup below.
                    return chain(tryCatch(
                        () => chain(pyCallOrSuspend(this.$gen.tp$getattr(throwStr), [type, exception, traceback]), () => null),
                        (error) => error
                    ), (e) => {
                        if (e === null) {
                            return closeGenerator(this.$gen, () => {
                                throw new RuntimeError("generator didn't stop after throw()");
                            });
                        }
                        if (e instanceof StopIteration) {
                            // A new StopIteration consumes the throw; the original must propagate.
                            return new pyBool(e !== exception);
                        } else if (
                            e instanceof RuntimeError &&
                            exception instanceof StopIteration &&
                            e.$cause === exception
                        ) {
                            // PEP 479 wraps escaped StopIteration; preserve the body exception.
                            exception.$traceback = traceback;
                            return pyFalse;
                        }
                        if (e === exception) {
                            // Propagation must keep the body traceback without the injected yield.
                            exception.$traceback = traceback;
                            return pyFalse;
                        }
                        throw e;
                    });
                });
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

    function createContextManager(func, args, kwds) {
        return chain(pyCallOrSuspend(func, args, kwds), (gen) =>
            new _GeneratorContextManager(func, args, kwds, gen)
        );
    }

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
            [this.$gen] = copyKeywordsToNamedArgs("closing", ["thing"], args, kws);
        },
        __enter__() {
            return this.$gen;
        },
        __exit__(type, value, tb) {
            return chain(objectGetAttr(this.$gen, closeStr, true), (close) =>
                chain(pyCallOrSuspend(close), () => pyNone));
        },
    });

    function lookupContextMethod(type, name) {
        return tryCatch(
            () => type.tp$getattr(name, true),
            (error) => {
                if (!(error instanceof AttributeError)) {
                    throw error;
                }
            }
        );
    }

    function requireContextMethod(type, name) {
        return chain(lookupContextMethod(type, name), (method) => {
            if (method !== undefined) {
                return method;
            }
            return chain(objectGetAttr(type, pyStr.$module, true), (module) =>
                chain(objectGetAttr(type, pyStr.$qualname, true), (qualname) => {
                    const error = new TypeError(
                        "'" + module.v + "." + qualname.v + "' object does not support the context manager protocol"
                    );
                    error.$suppressContext = true;
                    throw error;
                })
            );
        });
    }

    function registerExit(stack, exit, manager) {
        const callback = manager === undefined ? exit : pyCall(Sk.builtin.method, [exit, manager]);
        stack.$exitCallbacks.push((excDetails) => pyCallOrSuspend(callback, excDetails));
    }

    contextlib.ExitStack = buildNativeContextManager("contextlib.ExitStack", {
        __init__(args, kwargs) {
            checkNoArgs("ExitStack", args, kwargs);
            this.$exitCallbacks = [];
        },
        __enter__() {
            return this;
        },
        __exit__(type, exc, traceback) {
            const receivedException = exc !== pyNone;
            let pendingRaise = false;

            // Read the live stack on each step: callbacks can register more work
            // or transfer the remaining callbacks via pop_all().
            const callbacks = { tp$iternext: () => this.$exitCallbacks.pop() };
            const result = iterFor(callbacks, (callback) => tryCatch(
                () => chain(callback(exc === pyNone ? [pyNone, pyNone, pyNone] : getExcInfo(exc).v), (suppress) => {
                    if (isTrue(suppress)) {
                        exc = pyNone;
                        pendingRaise = false;
                    }
                }),
                (error) => {
                    // Match compiled exception handlers for errors from JavaScript.
                    // Implicit exception chaining requires runtime support.
                    exc = error instanceof BaseException ? error : new ExternalError(error);
                    pendingRaise = true;
                }
            ));

            return chain(result, () => {
                if (pendingRaise) {
                    throw exc;
                }
                return new pyBool(receivedException && exc === pyNone);
            });
        },
        methods: {
            pop_all: {
                $meth() {
                    return chain(pyCallOrSuspend(this.ob$type), (newStack) => {
                        newStack.$exitCallbacks = this.$exitCallbacks;
                        this.$exitCallbacks = [];
                        return newStack;
                    });
                },
                $flags: { NoArgs: true },
            },
            push: {
                $meth(exit) {
                    return chain(lookupContextMethod(exit.ob$type, pyStr.$exit), (method) => {
                        if (method === undefined) {
                            registerExit(this, exit);
                        } else {
                            registerExit(this, method, exit);
                        }
                        return exit;
                    });
                },
                $flags: { NamedArgs: ["exit"] },
            },
            enter_context: {
                $meth(manager) {
                    // CPython takes the methods from the type and passes the
                    // manager explicitly, bypassing instance attributes.
                    const type = manager.ob$type;
                    let enter;
                    return chain(
                        requireContextMethod(type, pyStr.$enter),
                        (method) => {
                            enter = method;
                            return requireContextMethod(type, pyStr.$exit);
                        },
                        (exit) => chain(pyCallOrSuspend(enter, [manager]), (result) => {
                            registerExit(this, exit, manager);
                            return result;
                        })
                    );
                },
                $flags: { NamedArgs: ["cm"] },
            },
            callback: {
                $meth(args, kwargs) {
                    if (args.length === 0) {
                        throw new TypeError("ExitStack.callback() requires a callback");
                    }
                    const callback = args[0];
                    const callbackArgs = args.slice(1);
                    // A callback registered here cannot suppress an exception.
                    this.$exitCallbacks.push(() =>
                        chain(pyCallOrSuspend(callback, callbackArgs, kwargs), () => pyNone)
                    );
                    return callback;
                },
                $flags: { FastCall: true },
            },
            close: {
                $meth() {
                    return chain(
                        objectGetAttr(this, pyStr.$exit, true),
                        (exit) => pyCallOrSuspend(exit, [pyNone, pyNone, pyNone]),
                        () => pyNone
                    );
                },
                $flags: { NoArgs: true },
            },
        },
    });

    setUpModuleMethods("contextlib", contextlib, {
        contextmanager: {
            $meth(func) {
                return chain(pyCallOrSuspend(wraps, [func]), (wrapped) => {
                    function helper(args, kwargs) {
                        return createContextManager(func, args, kwargs);
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
