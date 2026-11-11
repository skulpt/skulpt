/**
 * A Python generator owns a suspended compiled frame. Argument binding happens
 * before construction; the compiler installs the initial frame suspension.
 * name/qualname are Python function names.
 */
Sk.builtin.generator = Sk.abstr.buildIteratorClass("generator", {
    constructor: function generator(name, qualname) {
        if (!(this instanceof Sk.builtin.generator)) {
            throw new TypeError("bad internal call to generator, use 'new'");
        }

        this.$name = name;
        this.$qualname = qualname;
        const susp = new Sk.misceval.Suspension();
        const data = { type: "gen", send: Sk.builtin.none.none$, throw: null };
        susp.resume = () => {
            if (data.throw !== null) {
                const error = data.throw;
                data.throw = null;
                throw error;
            }
            return data.send;
        };
        susp.data = data;
        this.gi$ret = null;
        // The input resumes a yield; the saved frame holds compiled execution state.
        this.gi$input = susp;
        this.gi$data = data;
        this.gi$frame = null; // absent while running or exhausted; installed by the compiler
        this.gi$running = false;
        this.gi$yieldfrom = null;
        this.gi$started = false;
        this.gi$delegationReturn = undefined;
    },
    slots: {
        $r() {
            return new Sk.builtin.str("<generator object " + this.$name + ">");
        },
    },
    iternext(canSuspend, value) {
        return this.gi$run(() => {
            value = value === undefined ? Sk.builtin.none.none$ : value;
            if (!this.gi$started && value !== Sk.builtin.none.none$ && this.gi$frame !== null) {
                throw new Sk.builtin.TypeError("can't send non-None value to a just-started generator");
            }
            this.gi$data.send = value;
            return this.gi$resume();
        }, canSuspend);
    },
    methods: {
        send: {
            $meth(value) {
                return Sk.misceval.chain(this.tp$iternext(true, value), (ret) => {
                    if (ret === undefined) {
                        throw new Sk.builtin.StopIteration(this.gi$ret);
                    }
                    return ret;
                });
            },
            $flags: { OneArg: true },
            $doc: "send(arg) -> send 'arg' into generator,\nreturn next yielded value or raise StopIteration.",
        },
        throw: {
            $meth(type, value, tb) {
                const throwArgs = [type];
                if (value !== undefined) { throwArgs.push(value); }
                if (tb !== undefined) { throwArgs.push(tb); }
                return Sk.misceval.chain(this.gi$throw(throwArgs), (ret) => {
                    if (ret === undefined) {
                        throw new Sk.builtin.StopIteration(this.gi$ret);
                    }
                    return ret;
                });
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $doc: "throw(typ[,val[,tb]]) -> raise an exception at the suspended yield.",
        },
        close: {
            $meth() {
                return Sk.misceval.tryCatch(
                    () => Sk.misceval.chain(this.gi$throw([new Sk.builtin.GeneratorExit()]), (ret) => {
                        if (ret !== undefined) {
                            throw new Sk.builtin.RuntimeError("generator ignored GeneratorExit");
                        }
                        return Sk.builtin.none.none$;
                    }),
                    (error) => {
                        if (error instanceof Sk.builtin.GeneratorExit || error instanceof Sk.builtin.StopIteration) {
                            return Sk.builtin.none.none$;
                        }
                        throw error;
                    }
                );
            },
            $flags: { NoArgs: true },
            $doc: "close() -> raise GeneratorExit inside the generator.",
        },
    },
    getsets: {
        __name__: {
            $get() {
                return new Sk.builtin.str(this.$name);
            },
            $set(v) {
                if (!Sk.builtin.checkString(v)) {
                    throw new Sk.builtin.TypeError("__name__ must be set to a string object");
                }
                this.$name = v.toString();
            },
        },
        __qualname__: {
            $get() {
                return new Sk.builtin.str(this.$qualname);
            },
            $set(v) {
                if (!Sk.builtin.checkString(v)) {
                    throw new Sk.builtin.TypeError("__qualname__ must be set to a string object");
                }
                this.$qualname = v.toString();
            },
        },
        gi_running: {
            $get() {
                return new Sk.builtin.bool(this.gi$running);
            },
        },
        gi_yieldfrom: {
            $get() {
                // The delegate is visible while the frame is suspended at
                // yield from, including during delegated throw/close calls.
                return this.gi$frame && this.gi$yieldfrom || Sk.builtin.none.none$;
            },
        },
    },
    proto: {
        gi$run(action, canSuspend) {
            if (this.gi$running) {
                throw new Sk.builtin.ValueError("generator already executing");
            }
            this.gi$running = true;
            const result = Sk.misceval.tryFinally(action, () => {
                this.gi$running = false;
            });
            return canSuspend ? result : Sk.misceval.retryOptionalSuspensionOrThrow(result);
        },
        gi$resume() {
            if (this.gi$frame === null) {
                this.gi$ret = null;
                return undefined;
            }
            this.gi$started = true;
            const frame = this.gi$frame;
            this.gi$frame = null;
            return Sk.misceval.tryCatch(
                () => Sk.misceval.chain(frame.resume(), (ret) => {
                    // Python yield returns [saved frame, value]; chain handles host suspensions.
                    if (Array.isArray(ret)) {
                        this.gi$frame = ret[0];
                        return ret[1];
                    }
                    // A None return leaves StopIteration.args empty.
                    this.gi$ret = ret === Sk.builtin.none.none$ ? null : ret;
                    this.gi$frame = null;
                    return undefined;
                }),
                (error) => {
                    this.gi$frame = null;
                    this.gi$yieldfrom = null;
                    if (error instanceof Sk.builtin.StopIteration) {
                        if (!Sk.__future__.python3) {
                            this.gi$ret = error.$value;
                            return undefined;
                        }
                        const wrapped = new Sk.builtin.RuntimeError("generator raised StopIteration");
                        wrapped.$cause = error;
                        wrapped.$context = error;
                        wrapped.$suppressContext = true;
                        throw wrapped;
                    }
                    throw error;
                }
            );
        },
        gi$inject(error) {
            return this.gi$run(() => {
                if (this.gi$frame === null) {
                    throw error;
                }
                this.gi$yieldfrom = null;
                this.gi$data.throw = error;
                return this.gi$resume();
            }, true);
        },
        gi$throw(throwArgs) {
            const [type, value, traceback] = throwArgs;
            // CPython delegates the original arguments before normalising them.
            // Constructors run outside this generator's execution guard; failures
            // in construction are injected just like the requested exception.
            const normalizeAndInject = () => {
                const hasTraceback = traceback !== undefined && traceback !== Sk.builtin.none.none$;
                if (hasTraceback && !(traceback instanceof Sk.builtin.traceback)) {
                    throw new Sk.builtin.TypeError("throw() third argument must be a traceback object");
                }
                let exception;
                let normalizationFailed = false;
                if (type instanceof Sk.builtin.BaseException) {
                    if (value !== undefined && value !== Sk.builtin.none.none$) {
                        throw new Sk.builtin.TypeError("instance exception may not have a separate value");
                    }
                    exception = type;
                } else if (Sk.builtin.checkExceptionClass(type)) {
                    const args = value === undefined || value === Sk.builtin.none.none$ ? [] :
                        value instanceof Sk.builtin.tuple ? value.v : [value];
                    exception = Sk.misceval.tryCatch(
                        () => value instanceof type ? value : Sk.misceval.callsimOrSuspendArray(type, args),
                        (error) => {
                            normalizationFailed = true;
                            return error;
                        }
                    );
                } else {
                    throw new Sk.builtin.TypeError("exceptions must be classes or instances deriving from BaseException");
                }
                return Sk.misceval.chain(exception, (error) => {
                    if (!(error instanceof Sk.builtin.BaseException)) {
                        error = new Sk.builtin.TypeError("exception constructor should have returned an instance of BaseException");
                    } else if (hasTraceback && !normalizationFailed) {
                        error.$traceback = traceback;
                    }
                    return this.gi$inject(error);
                });
            };
            const delegate = this.gi$frame && this.gi$yieldfrom;
            if (!delegate) {
                return normalizeAndInject();
            }
            if (type instanceof Sk.builtin.GeneratorExit || type === Sk.builtin.GeneratorExit || type.prototype instanceof Sk.builtin.GeneratorExit) {
                // Close the delegate first, then inject GeneratorExit into the
                // outer frame even when delegate.close() returns normally.
                let closeError;
                return Sk.misceval.chain(Sk.misceval.tryCatch(
                    () => this.gi$run(() => {
                        const close = Sk.abstr.lookupAttr(delegate, new Sk.builtin.str("close"));
                        return close === undefined ? undefined : Sk.misceval.callsimOrSuspendArray(close);
                    }, true),
                    (error) => { closeError = error; }
                ), () => closeError ? this.gi$inject(closeError) : normalizeAndInject());
            }
            // A failed lookup propagates without entering or unwinding the frame.
            const meth = Sk.abstr.lookupAttr(delegate, new Sk.builtin.str("throw"));
            if (meth === undefined) {
                return normalizeAndInject();
            }
            return Sk.misceval.tryCatch(
                () => this.gi$run(() => Sk.misceval.callsimOrSuspendArray(meth, throwArgs), true),
                (exception) => {
                    if (exception instanceof Sk.builtin.StopIteration) {
                        // Resume the saved yield-from loop without calling the exhausted delegate again.
                        this.gi$delegationReturn = exception.$value;
                        return this.gi$run(() => this.gi$resume(), true);
                    }
                    return this.gi$inject(exception);
                }
            );
        },

        gi$startYieldFrom(iterable) {
            this.gi$yieldfrom = Sk.abstr.iter(iterable);
            this.gi$data.send = Sk.builtin.none.none$;
        },
        gi$stepYieldFrom() {
            return Sk.misceval.tryCatch(() => {
                if (this.gi$delegationReturn !== undefined) {
                    return undefined;
                }
                if (this.gi$data.send === Sk.builtin.none.none$ || this.gi$yieldfrom.constructor === Sk.builtin.generator) {
                    return this.gi$yieldfrom.tp$iternext(true, this.gi$data.send);
                }
                return Sk.misceval.tryCatch(
                    () =>
                        Sk.misceval.callsimOrSuspendArray(
                            Sk.abstr.gattr(this.gi$yieldfrom, new Sk.builtin.str("send")),
                            [this.gi$data.send]
                        ),
                    (e) => {
                        if (e instanceof Sk.builtin.StopIteration) {
                            this.gi$yieldfrom.gi$ret = e.$value;
                            return undefined;
                        }
                        throw e;
                    }
                );
            }, (error) => {
                this.gi$yieldfrom = null;
                throw error;
            });
        },
        gi$finishYieldFrom() {
            const yieldfrom = this.gi$yieldfrom;
            const ret = this.gi$delegationReturn !== undefined ? this.gi$delegationReturn : yieldfrom.gi$ret;
            this.gi$delegationReturn = undefined;
            this.gi$yieldfrom = null;
            this.gi$data.send = ret == null ? Sk.builtin.none.none$ : ret;
            return this.gi$data.send;
        },
    },
});
Sk.exportSymbol("Sk.builtin.generator", Sk.builtin.generator);

/**
 * Creates a generator with the specified next function and additional
 * instance data. Useful in Javascript-implemented modules to implement
 * the __iter__ method.
 */
Sk.builtin.makeGenerator = function (next, data) {
    var key;
    var gen = new Sk.builtin.generator(null, null);
    gen.tp$iternext = next;

    for (key in data) {
        if (data.hasOwnProperty(key)) {
            gen[key] = data[key];
        }
    }

    return gen;
};
Sk.exportSymbol("Sk.builtin.makeGenerator", Sk.builtin.makeGenerator);
