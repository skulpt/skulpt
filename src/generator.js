/**
 * A Python generator owns a suspended compiled frame. Argument binding happens
 * before construction; the compiler installs the initial frame suspension.
 * scope is the compiled function, and name/qualname are Python function names.
 */
Sk.builtin.generator = Sk.abstr.buildIteratorClass("generator", {
    constructor: function generator(scope, name, qualname) {
        if (!(this instanceof Sk.builtin.generator)) {
            throw new TypeError("bad internal call to generator, use 'new'");
        }

        this.gi$scope = scope;
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
        this.gi$susp = susp;
        this.gi$data = data;
        this.curr$susp = null; // set inside the compile code
        this.gi$running = false;
        this.gi$yieldfrom = null;
        this.gi$closed = false;
        this.gi$started = false;
        this.gi$delegationDone = false;
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
            if (!this.gi$started && value !== Sk.builtin.none.none$ && !this.gi$closed) {
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
                if (tb !== undefined && tb !== Sk.builtin.none.none$) {
                    throw new Sk.builtin.NotImplementedError("generator.throw() with a traceback is not supported");
                }
                let exception;
                if (type instanceof Sk.builtin.BaseException) {
                    if (value !== undefined && value !== Sk.builtin.none.none$) {
                        throw new Sk.builtin.TypeError("instance exception may not have a separate value");
                    }
                    exception = type;
                } else if (type === Sk.builtin.BaseException || type.prototype instanceof Sk.builtin.BaseException) {
                    const args = value === undefined || value === Sk.builtin.none.none$ ? [] :
                        value instanceof Sk.builtin.tuple ? value.v : [value];
                    exception = value instanceof type ? value : Sk.misceval.callsimOrSuspendArray(type, args);
                } else {
                    throw new Sk.builtin.TypeError("exceptions must be classes or instances deriving from BaseException");
                }
                return Sk.misceval.chain(exception, (error) => {
                    if (!(error instanceof Sk.builtin.BaseException)) {
                        throw new Sk.builtin.TypeError("exception constructor must return a BaseException instance");
                    }
                    return Sk.misceval.chain(this.gi$run(() => this.gi$throw(error, throwArgs), true), (ret) => {
                        if (ret === undefined) {
                            throw new Sk.builtin.StopIteration(this.gi$ret);
                        }
                        return ret;
                    });
                });
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $doc: "throw(typ[,val[,tb]]) -> raise an exception at the suspended yield.",
        },
        close: {
            $meth() {
                return this.gi$run(() => Sk.misceval.tryCatch(
                    () => Sk.misceval.chain(this.gi$throw(new Sk.builtin.GeneratorExit()), (ret) => {
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
                ), true);
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
                return this.gi$yieldfrom || Sk.builtin.none.none$;
            },
        },
    },
    proto: {
        gi$run(action, canSuspend) {
            if (this.gi$running) {
                throw new Sk.builtin.ValueError("generator already executing");
            }
            this.gi$running = true;
            const result = Sk.misceval.tryCatch(action, (error) => { throw error; }, () => {
                this.gi$running = false;
            });
            return canSuspend ? result : Sk.misceval.retryOptionalSuspensionOrThrow(result);
        },
        gi$resume() {
            if (this.gi$closed) {
                this.gi$ret = null;
                return undefined;
            }
            this.gi$started = true;
            return Sk.misceval.tryCatch(
                () => Sk.misceval.chain(this.curr$susp.resume(), (ret) => {
                    if (Array.isArray(ret)) {
                        this.curr$susp = ret[0];
                        return ret[1];
                    }
                    this.gi$ret = ret === Sk.builtin.none.none$ ? null : ret;
                    this.gi$closed = true;
                    this.curr$susp = null;
                    return undefined;
                }),
                (error) => {
                    this.gi$closed = true;
                    this.curr$susp = null;
                    this.gi$yieldfrom = null;
                    if (error instanceof Sk.builtin.StopIteration) {
                        if (!Sk.__future__.python3) {
                            this.gi$ret = error.$value;
                            return undefined;
                        }
                        const wrapped = new Sk.builtin.RuntimeError("generator raised StopIteration");
                        wrapped.$cause = error;
                        throw wrapped;
                    }
                    throw error;
                }
            );
        },
        gi$throw(error, throwArgs) {
            if (this.gi$closed || !this.gi$started) {
                this.gi$closed = true;
                this.curr$susp = null;
                throw error;
            }
            const inject = (exception) => {
                this.gi$yieldfrom = null;
                this.gi$data.throw = exception;
                return this.gi$resume();
            };
            const delegate = this.gi$yieldfrom;
            if (!delegate) {
                return inject(error);
            }
            if (error instanceof Sk.builtin.GeneratorExit) {
                // Close the delegate first, then inject GeneratorExit into the
                // outer frame even when delegate.close() returns normally.
                return Sk.misceval.chain(Sk.misceval.tryCatch(
                    () => {
                        const close = Sk.abstr.lookupAttr(delegate, new Sk.builtin.str("close"));
                        return close === undefined ? undefined : Sk.misceval.callsimOrSuspendArray(close);
                    },
                    (closeError) => { error = closeError; }
                ), () => inject(error));
            }
            return Sk.misceval.chain(Sk.misceval.tryCatch(
                () => {
                    const meth = Sk.abstr.lookupAttr(delegate, new Sk.builtin.str("throw"));
                    if (meth === undefined) {
                        return { error };
                    }
                    return Sk.misceval.chain(Sk.misceval.callsimOrSuspendArray(meth, throwArgs),
                                             (value) => ({ value }));
                },
                (exception) => {
                    if (exception instanceof Sk.builtin.StopIteration) {
                        this.gi$delegationDone = true;
                        this.gi$delegationReturn = exception.$value;
                        return { done: true };
                    }
                    return { error: exception };
                }
            ), (result) => {
                if (result.error) {
                    return inject(result.error);
                }
                return result.done ? this.gi$resume() : result.value;
            });
        },

        gi$makeSuspension(wrapSuspension) {
            return wrapSuspension(this.gi$susp);
        },
        gi$setInitialSuspension(wrapSuspension) {
            this.curr$susp = this.gi$makeSuspension(wrapSuspension);
            return this;
        },
        gi$yield(wrapSuspension, value) {
            return [this.gi$makeSuspension(wrapSuspension), value];
        },
        gi$startYieldFrom(iterable) {
            this.gi$yieldfrom = Sk.abstr.iter(iterable);
            this.gi$data.send = Sk.builtin.none.none$;
        },
        gi$stepYieldFrom() {
            return Sk.misceval.tryCatch(() => {
                if (this.gi$delegationDone) {
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
            const ret = this.gi$delegationDone ? this.gi$delegationReturn : yieldfrom.gi$ret;
            this.gi$delegationDone = false;
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
    var gen = new Sk.builtin.generator(null, null, null);
    gen.tp$iternext = next;

    for (key in data) {
        if (data.hasOwnProperty(key)) {
            gen[key] = data[key];
        }
    }

    return gen;
};
Sk.exportSymbol("Sk.builtin.makeGenerator", Sk.builtin.makeGenerator);
