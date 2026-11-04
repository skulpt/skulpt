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
        const data = { type: "gen", send: Sk.builtin.none.none$ };
        susp.resume = () => data.send;
        susp.data = data;
        this.gi$ret = null;
        // The input resumes a yield; the saved frame holds compiled execution state.
        this.gi$input = susp;
        this.gi$data = data;
        this.gi$frame = null; // absent while running or exhausted; installed by the compiler
        this.gi$running = false;
        this.gi$yieldfrom = null;
        this.gi$started = false;
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
                // The delegate is visible while the frame is suspended at yield from.
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
                    throw error;
                }
            );
        },
        gi$startYieldFrom(iterable) {
            this.gi$yieldfrom = Sk.abstr.iter(iterable);
            this.gi$data.send = Sk.builtin.none.none$;
        },
        gi$stepYieldFrom() {
            return Sk.misceval.tryCatch(() => {
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
            const ret = yieldfrom.gi$ret;
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
