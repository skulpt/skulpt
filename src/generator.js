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
        var k;
        var i;
        if (!func) {
            return;
        } // ctor hack

        if (!(this instanceof Sk.builtin.generator)) {
            throw new TypeError("bad internal call to generator, use 'new'");
        }

        this.func_code = func.func_code;
        this.func_globals = func.func_globals;
        this.$name = name;
        this.$qualname = qualname;
        this.$susp = null;
        this.gi$running = false;
        this.func_closure = func.func_closure;
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
        this["gi$running"] = true;
        yielded || (yielded = Sk.builtin.none.none$);

        // note: functions expect 'this' to be globals to avoid having to
        // slice/unshift onto the main args
        if (this.$susp === null) {
            const args = [this];
            if (this.func_closure) {
                args.push(this.func_closure);
            }
            ret = this.func_code.apply(this.func_globals, args);
        } else {
            this.$susp.data.sent = yielded;
            ret = this.$susp.resume();
        }
        
        return (function finishIteration(ret) {
            Sk.asserts.assert(ret !== undefined);
            if (!(ret instanceof Sk.misceval.Suspension)) {
                self.$value = ret;
                ret = undefined;
            } else if (ret.data.type === "Sk.gen") {
                self.$susp = $ret;
                ret = ret.data.yielded;
            } else if (canSuspend) {
                return new Sk.misceval.Suspension(finishIteration, ret);
            } else {
                // not quite right 
                ret = Sk.misceval.retryOptionalSuspensionOrThrow(ret);
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
                if (this.$susp) {
                    this.$susp.data.throw = new value();
                } else {
                    throw new value();
                }
                return Sk.misceval.chain(this.tp$iternext(true), (ret) => {
                    if (ret === undefined) {
                        throw StopIteration(this.$value);
                    }
                    return ret;
                });
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
