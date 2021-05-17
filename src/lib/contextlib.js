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
        RuntimeError,
        StopIteration,
        checkNone,
    } = Sk.builtin;

    const { callsimOrSuspendArray: pyCallOrSuspend, callsimArray: pyCall, chain, tryCatch } = Sk.misceval;

    const { setUpModuleMethods, buildNativeClass, iternext } = Sk.abstr;

    const { remapToPy: toPy } = Sk.ffi;

    const contextlib = {
        __name__: new pyStr("contextlib"),
        __all__: toPy([
            // "asynccontextmanager",
            "contextmanager",
            // "closing",
            // "nullcontext",
            // "AbstractContextManager",
            // "AbstractAsyncContextManager",
            // "AsyncExitStack",
            // "ContextDecorator",
            // "ExitStack",
            // "redirect_stdout",
            // "redirect_stderr",
            // "suppress",
            // "aclosing",
        ]),
    };

    _GeneratorContextmanager = buildNativeClass("_GeneratorContextmanager", {
        constructor: function _GeneratorContextmanager(func, args, kwds) {
            this.$func = func;
            this.$args = args;
            this.$kwds = kwds;
            this.$doc = func.tp$getattr(pyStr.$doc) || pyNone;
            this.$gen = pyCall(func); // making it a generator shouldn't suspend
        },
        slots: {
            // tp$init(args, kwargs) {
            //     const [$func, $args, $kwds] = args;
            //     this.$func = $func;
            //     this.$args = $args;
            //     this.$kwds = $kwds;
            //     this.$doc = getattr(func, pyStr.$doc, pyNone);
            //     return chain(pyCallOrSuspend($func, $args, $kwds), () => {});
            // },
            tp$call(args, kwargs) {
                checkOneArg("_GeneratorContextmanager", args, kwargs);
                const func = args[0];
                function _inner(args, kwds) {
                    
                    // with self._recreate_cm(): er?
                    return pyCallOrSuspend(func, args, kwds);
                }
                _inner.co_fastcall = true;
                return chain(pyCallOrSuspend(wraps, [func]), (wrapper) => pyCallOrSuspend(wrapper, [new pyFunc(_inner)]));
            }
        },
        methods: {
            // _recreate_cm: {
            //     $meth() {
            //         return pyCallOrSuspend(this.tp$getattr(pyStr.$class), [this.$func, this.$args, this.$kwds]);
            //     },
            //     $flags: { NoArgs: true },
            // },
            __enter__: {
                $meth() {
                    this.$func = this.$args = this.$kwds = null;
                    return chain(iternext(this.$gen, true), (nxt) => {
                        if (nxt === undefined) {
                            throw new RuntimeError("generator didn't yield");
                        }
                        return nxt;
                    });
                },
                $flags: { NoArgs: true },
            },
            __exit__: {
                $meth(type, value, traceback) {
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
                                chain(pyCallOrSuspend(this.$gen.tp$geattr(new pyStr("throw")), [type, value, traceback]), () => {
                                    throw new RuntimeError("generator didn't stop after throw()");
                                }),
                            (e) => {
                                if (e instanceof StopIteration) {
                                    return new pyBool(e !== value);
                                }
                                if (e === value) {
                                    return pyFalse;
                                }
                                throw e;
                            }
                        );
                    }
                },
                $flags: {MinArgs: 3, MaxArgs: 3},
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
        },
    });

    setUpModuleMethods("contextlib", contextlib, {
        contextmanager: {
            $meth(func) {
                return chain(pyCallOrSuspend(wraps, [func]), (wrapped) => {
                    function _helper(args, kwargs) {
                        return new _GeneratorContextmanager(func, args, kwargs);
                    }
                    _helper.co_fastcall = true;
                    return pyCallOrSuspend(wrapped, [new pyFunc(_helper)]);
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
