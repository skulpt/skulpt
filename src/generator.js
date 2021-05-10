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
    constructor: function generator(func, name, qualname) {
        if (!(this instanceof Sk.builtin.generator)) {
            throw new TypeError("bad internal call to generator, use 'new'");
        }
        this.func_code = func.func_code.bind(this);
        this.func_globals = func.func_globals;
        this.func_closure = func.func_closure;

        const loc = {};
        // const args = func.$resolveArgs();
        // const varnames = func.func_code.co_varnames || [];
        // for (let i = 0; i<varnames.length; i++) {
        //     loc[varnames[i]] = args[i];
        // }
        this.gi$loc = loc;
        debugger;

        this.$name = name;
        this.$qualname = qualname;
        const inner_susp = new Sk.misceval.Suspension();
        const data = {
            type: 'gen',
            result: Sk.builtin.none.none$,
            error: null
        }
        inner_susp.resume = () => {
            if (data.error) {
                throw data.error;
            }
            return data.result;
        }

        inner_susp.data = data;
        this.inner$susp = inner_susp;
        this.$susp = {
            resume: () => {
                if (data.error) {
                    throw data.error;
                }
                return this.func_code(this, this.func_closure);
            },
            data,
        };
        this.gi$running = false;
    },
    slots: {
        $r() {
            return new Sk.builtin.str("<generator object " + this.$name + ">");
        },
    },
    iternext(canSuspend, yielded) {
        let ret;
        const self = this;
        if (this.gi$running) {
            throw new Sk.builtin.ValueError("generator already executing");
        }
        this.gi$running = true;
        yielded || (yielded = Sk.builtin.none.none$);

        this.$susp.data.result = yielded;
        ret = this.$susp.resume();
        
        return (function finishIteration(ret) {
            Sk.asserts.assert(ret !== undefined);
            if (Array.isArray(ret)) {
                debugger;
                self.$susp = ret[0];
                ret = ret[1];
            } else if (!ret.is$Suspenesion) {
                self.$value = ret;
                ret = undefined;
            } else if (canSuspend) {
                return new Sk.misceval.Suspension(finishIteration, ret);
            } else {
                // not quite right 
                ret = Sk.misceval.retryOptionalSuspensionOrThrow(ret);
                return finishIteration(ret);
            }
            //print("ret", JSON.stringify(ret));
            self["gi$running"] = false;
            return ret;
        })(ret);
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
            $meth(value) {
                this.$susp.data.error = new value();
                return Sk.misceval.tryCatch(
                    () =>
                        Sk.misceval.chain(this.tp$iternext(true), (ret) => {
                            this.$susp.data.error = null;
                            if (ret === undefined) {
                                throw StopIteration(this.$value);
                            }
                            return ret;
                        }),
                    (e) => {
                        this.$susp.data.error = null;
                        throw e;
                    }
                );
            },
            $flags: { OneArg: true },
            $doc: "",
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
