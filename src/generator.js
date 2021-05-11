/**
 * @constructor
 * @param {Function} code javascript code object for the function
 * @param {Object} globals where this function was defined
 * @param {Object} args arguments to the original call (stored into locals for
 * the generator to reenter)
 * @param {Object=} closure dict of free variables
 * @param {Object=} closure2 another dict of free variables that will be
 * merged into 'closure'. there's 2 to simplify generated code (one is $free,
 * the other is $cell)
 *
 * co_varnames and co_name come from generated code, must access as dict.
 */
Sk.builtin.generator = Sk.abstr.buildIteratorClass("generator", {
    constructor: function generator(scope, name, qualname) {
        if (!(this instanceof Sk.builtin.generator)) {
            throw new TypeError("bad internal call to generator, use 'new'");
        }

        this.gi$scope = scope;
        this.$name = name;
        this.$qualname = qualname;
        this.$value;
        const susp = new Sk.misceval.Suspension();
        const data = {
            type: "gen",
            send: Sk.builtin.none.none$,
            throw: null,
            close: null,
        };
        const close_or_throw = (which, args) => {
            if (this.gi$yieldfrom && this.gi$yieldfrom.gi$data) {
                this.gi$yieldfrom.gi$data[which] = data[which];
                return;
            }
            let meth;
            if (this.gi$yieldfrom) {
                meth = this.gi$yieldfrom.tp$getattr(new Sk.builtin.str(which));
            }
            if (meth !== undefined) {
                Sk.misceval.callsimArray(meth, args || []);
            }
            throw data[which];
        };
        susp.resume = () => {
            if (data.close) {
                close_or_throw("close");
            } else if (data.throw) {
                close_or_throw("throw", [data.throw.ob$type, data.throw]);
            }
            return data.send;
        };
        susp.data = data;
        this.gi$susp = susp;
        this.gi$data = data;
        this.curr$susp = null; // set inside the compile code
        this.gi$running = false;
        this.gi$yieldfrom = null;
        this.gi$closed = false;
    },
    slots: {
        $r() {
            return new Sk.builtin.str("<generator object " + this.$name + ">");
        },
    },
    iternext(canSuspend, yielded) {
        if (this.gi$running) {
            throw new Sk.builtin.ValueError("generator already executing");
        } else if (this.gi$closed) {
            this.$value = undefined;
            return undefined;
        }

        this.gi$running = true;
        yielded || (yielded = Sk.builtin.none.none$);
        this.gi$data.send = yielded;

        const nxt = Sk.misceval.tryCatch(
            () =>
                Sk.misceval.chain(this.curr$susp.resume(), (ret) => {
                    Sk.asserts.assert(ret !== undefined);
                    this.gi$running = false;
                    if (Array.isArray(ret)) {
                        this.curr$susp = ret[0];
                        return ret[1];
                    } else {
                        this.$value = ret;
                        this.gi$closed = true;
                        return undefined;
                    }
                }),
            (e) => {
                this.gi$closed = true;
                this.gi$yieldfrom = null;
                if (e instanceof Sk.builtin.StopIteration) {
                    throw new Sk.builtin.RuntimeError("generator raised StopIteration");
                }
                throw e;
            },
            () => {
                this.gi$running = false;
            }
        );

        return canSuspend ? nxt : Sk.misceval.retryOptionalSuspensionOrThrow(nxt);
    },
    methods: {
        send: {
            $meth(value) {
                return Sk.misceval.chain(this.tp$iternext(true, value), (ret) => {
                    if (ret === undefined) {
                        const v = this.gi$ret;
                        // this is a weird quirk - and only for printing purposes StopIteration(None) vs StopIteration()
                        // .value ends up being None. But the repr prints the args we pass to StopIteration.
                        // See tests in test_yield_from and search for StopIteration()
                        throw v !== undefined && v !== Sk.builtin.none.none$ ? new Sk.builtin.StopIteration(v) : new Sk.builtin.StopIteration();
                    }
                    return ret;
                });
            },
            $flags: { OneArg: true },
            $doc: "send(arg) -> send 'arg' into generator,\nreturn next yielded value or raise StopIteration.",
        },
        throw: {
            $meth(type, value, tb) {
                /** @todo account for tb and adjust value depending on type*/
                value || (value = type);
                if (Sk.builtin.checkClass(value)) {
                    value = Sk.misceval.callsimArray(value);
                }
                let isGenExit = false;
                if (!(value instanceof Sk.builtin.BaseException)) {
                    throw new Sk.builtin.TypeError("exceptions must be classes or instances deriving from BaseException, not str");
                } else if (value instanceof Sk.builtin.GeneratorExit) {
                    isGenExit = true;
                }
                if (this.gi$yieldfrom && isGenExit) {
                    const _close = this.gi$yieldfrom.tp$getattr(new Sk.builtin.str("close"));
                    if (_close !== undefined) {
                        Sk.misceval.callsimArray(_close);
                    }
                    this.gi$yieldfrom = null;
                }
                this.gi$data.throw = value;
                return Sk.misceval.tryCatch(
                    () =>
                        Sk.misceval.chain(this.tp$iternext(true), (ret) => {
                            if (ret === undefined) {
                                throw new Sk.builtin.StopIteration(this.$value);
                            }
                            return ret;
                        }),
                    (e) => {
                        throw e;
                    },
                    () => {
                        this.gi$data.throw = null;
                        this.gi$yieldfrom && this.gi$yieldfrom.gi$data && (this.gi$yieldfrom.gi$data.throw = null);
                    }
                );
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $doc: "throw(typ[,val[,tb]]) -> raise exception in generator,\nreturn next yielded value or raise StopIteration",
        },
        close: {
            $meth() {
                this.gi$data.close = new Sk.builtin.GeneratorExit();
                return Sk.misceval.tryCatch(
                    () =>
                        Sk.misceval.chain(this.tp$iternext(true), (ret) => {
                            if (!this.gi$closed) {
                                throw new Sk.builtin.RuntimeError("generator ignored GeneratorExit");
                            }
                            return Sk.builtin.none.none$;
                        }),
                    (e) => {
                        if (e instanceof Sk.builtin.GeneratorExit) {
                            return Sk.builtin.none.none$;
                        }
                        throw e;
                    },
                    () => {
                        this.gi$data.close = null;
                    }
                );
            },
            $flags: { NoArgs: true },
            $doc: "close() -> raise GeneratorExit inside generator.",
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
