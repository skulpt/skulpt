// @ts-check
function $builtinmodule(name) {
    const mods = {};

    return Sk.misceval.chain(
        Sk.importModule("math", false, true),
        (mathMod) => {
            mods.math = mathMod;
            return Sk.importModule("sys", false, true);
        },
        (sysMod) => {
            mods.sys = sysMod;
            return fractionsMod(mods);
        }
    );
}

function fractionsMod({math, sys}) {
    const {
        builtin: {
            int_: pyInt,
            bool: { true$: pyTrue },
            none: { none$: pyNone },
            NotImplemented: { NotImplemented$: pyNotImplemented },
            tuple: pyTuple,
            float_: pyFloat,
            complex: pyComplex,
            str: pyStr,
            isinstance: pyIsInstance,
            TypeError: pyTypeError,
            ZeroDivisionError: pyZeroDivisionError,
            ValueError: pyValueError,
            NotImplementedError: pyNotImplementedError,
            abs: pyAbs,
            round: pyRound,
            power: pyPower,
        },
        ffi: { remapToPy: toPy },
        abstr: { buildNativeClass, copyKeywordsToNamedArgs, numberBinOp, typeName, lookupSpecial, checkArgsLen },
        misceval: { isTrue, richCompareBool, callsimArray: pyCall, objectRepr },
    } = Sk;

    const fractionsMod = { __name__: new pyStr("fractions"), __all__: toPy(["Fraction"]) };

    const _RATIONAL_FORMAT =
        /^\s*(?<sign>[-+]?)(?=\d|\.\d)(?<num>\d*)(?:(?:\/(?<denom>\d+))?|(?:\.(?<decimal>\d*))?(?:E(?<exp>[-+]?\d+))?)\s*$/i;
    const _0 = new pyInt(0);
    const _1 = new pyInt(1);
    const _2 = new pyInt(2);
    const _10 = new pyInt(10);
    const _neg_1 = new pyInt(-1);
    const _neg_2 = new pyInt(-2);
    const s_numerator = new pyStr("numerator");
    const s_denominator = new pyStr("denominator");
    const s_int_ratio = new pyStr("as_integer_ratio");
    const s_from_float = new pyStr("from_float");

    const getNumer = (x) => x.tp$getattr(s_numerator);
    const getDenom = (x) => x.tp$getattr(s_denominator);

    const mul = (a, b) => numberBinOp(a, b, "Mult");
    const div = (a, b) => numberBinOp(a, b, "Div");
    const pow = (a, b) => numberBinOp(a, b, "Pow");
    const add = (a, b) => numberBinOp(a, b, "Add");
    const sub = (a, b) => numberBinOp(a, b, "Sub");
    const floorDiv = (a, b) => numberBinOp(a, b, "FloorDiv");
    const divmod = (a, b) => numberBinOp(a, b, "DivMod");
    const mod = (a, b) => numberBinOp(a, b, "Mod");
    const gcd = math.tp$getattr(new pyStr("gcd"));

    const eq = (a, b) => richCompareBool(a, b, "Eq");
    const lt = (a, b) => richCompareBool(a, b, "Lt");
    const ge = (a, b) => richCompareBool(a, b, "GtE");

    const METH_NO_ARGS = { NoArgs: true };
    const METH_ONE_ARG = { OneArg: true };

    const hash_info = sys.tp$getattr(new pyStr("hash_info"));
    const _PyHASH_MODULUS = hash_info.tp$getattr(new pyStr("modulus"));
    const _PyHASH_INF = hash_info.tp$getattr(new pyStr("inf"));

    function _operator_fallbacks(monomorphic, fallback) {
        const forward = function (other) {
            if (isTrue(pyIsInstance(other, _NUMBERS_RATIONAL))) {
                return monomorphic(this, other);
            } else if (other instanceof pyFloat) {
                return fallback(this.nb$float(), other);
            } else if (other instanceof pyComplex) {
                return fallback(pyCall(pyComplex, [this]), other);
            } else {
                return pyNotImplemented;
            }
        };
        const reverse = function (other) {
            if (isTrue(pyIsInstance(other, _NUMBERS_RATIONAL))) {
                return monomorphic(other, this);
            } else if (other instanceof pyFloat) {
                return fallback(other, this.nb$float());
            } else if (other instanceof pyComplex) {
                return fallback(other, pyCall(pyComplex, [this]));
            } else {
                return pyNotImplemented;
            }
        };
        return [forward, reverse];
    }

    const [nb$add, nb$reflected_add] = _operator_fallbacks((a, b) => {
        const da = getDenom(a);
        const db = getDenom(b);
        return pyCall(Fraction, [add(mul(getNumer(a), db), mul(getNumer(b), da)), mul(da, db)]);
    }, add);

    const [nb$subtract, nb$reflected_subtract] = _operator_fallbacks((a, b) => {
        const da = getDenom(a);
        const db = getDenom(b);
        return pyCall(Fraction, [sub(mul(getNumer(a), db), mul(getNumer(b), da)), mul(da, db)]);
    }, sub);

    const [nb$multiply, nb$reflected_multiply] = _operator_fallbacks(
        (a, b) => pyCall(Fraction, [mul(getNumer(a), getNumer(b)), mul(getDenom(a), getDenom(b))]),
        mul
    );

    const [nb$divide, nb$reflected_divide] = _operator_fallbacks(
        (a, b) => pyCall(Fraction, [mul(getNumer(a), getDenom(b)), mul(getDenom(a), getNumer(b))]),
        div
    );

    const [nb$floor_divide, nb$reflected_floor_divide] = _operator_fallbacks(
        (a, b) => floorDiv(mul(getNumer(a), getDenom(b)), mul(getDenom(a), getNumer(b))),
        floorDiv
    );

    const [nb$divmod, nb$reflected_divmod] = _operator_fallbacks((a, b) => {
        const da = getDenom(a);
        const db = getDenom(b);
        const [div, n_mod] = divmod(mul(getNumer(a), db), mul(da, getNumer(b))).valueOf();
        return new pyTuple([div, pyCall(Fraction, [n_mod, mul(da, db)])]);
    }, divmod);

    const [nb$remainder, nb$reflected_remainder] = _operator_fallbacks((a, b) => {
        const da = getDenom(a);
        const db = getDenom(b);
        const num = mod(mul(getNumer(a), db), mul(getNumer(b), da));
        return pyCall(Fraction, [num, mul(da, db)]);
    }, mod);

    const Fraction = (fractionsMod.Fraction = buildNativeClass("fractions.Fraction", {
        constructor: function (numerator, denominator) {
            this.$num = numerator || _0;
            this.$den = denominator || _1;
        },
        slots: {
            tp$new(args, kws) {
                checkArgsLen("Fraction", args, 0, 2);

                let [numerator, denominator, _normalize] = copyKeywordsToNamedArgs(
                    "Fraction",
                    ["numerator", "denominator", "_normalize"],
                    args,
                    kws,
                    [_0, pyNone, pyTrue]
                );

                const self = new this.constructor();

                if (denominator === pyNone) {
                    if (numerator.ob$type === pyInt) {
                        self.$num = numerator;
                        self.$den = _1;
                        return self;
                    } else if (isTrue(pyIsInstance(numerator, _NUMBERS_RATIONAL))) {
                        self.$num = getNumer(numerator);
                        self.$den = getDenom(numerator);
                        return self;
                    } else if (numerator instanceof pyFloat) {
                        // todo decimal.Decimal
                        [self.$num, self.$den] = pyCall(numerator.tp$getattr(s_int_ratio)).valueOf();
                        return self;
                    } else if (numerator instanceof pyStr) {
                        const s = numerator.toString();
                        const m = s.match(_RATIONAL_FORMAT);
                        if (m === null) {
                            throw new pyValueError("Invalid literal for Fraction: " + objectRepr(numerator));
                        }
                        numerator = new pyInt(m.groups.num || "0");
                        const denom = m.groups.denom;
                        if (denom) {
                            denominator = new pyInt(denom);
                        } else {
                            denominator = _1;
                            const decimal = m.groups.decimal;
                            if (decimal) {
                                const scale = new pyInt("" + 10 ** decimal.length);
                                numerator = add(mul(numerator, scale), new pyInt(decimal));
                                denominator = mul(denominator, scale);
                            }
                            let exp = m.groups.exp;
                            if (exp) {
                                exp = new pyInt(exp);
                                if (lt(exp, _0)) {
                                    denominator = mul(denominator, pow(_10, exp.nb$negative()));
                                } else {
                                    numerator = mul(numerator, pow(_10, exp));
                                }
                            }
                        }
                        if (m.groups.sign == "-") {
                            numerator = numerator.nb$negative();
                        }
                    } else {
                        throw new pyTypeError("argument should be a string or a Rational instance");
                    }
                } else if (numerator.ob$type === pyInt && denominator.ob$type === pyInt) {
                    // normal case pass
                } else if (
                    isTrue(pyIsInstance(numerator, _NUMBERS_RATIONAL)) &&
                    isTrue(pyIsInstance(denominator, _NUMBERS_RATIONAL))
                ) {
                    [numerator, denominator] = [
                        mul(getNumer(numerator), getDenom(denominator)),
                        mul(getNumer(denominator), getDenom(numerator)),
                    ];
                } else {
                    throw new pyTypeError("both arguments should be Rational instances");
                }

                if (eq(denominator, _0)) {
                    throw new pyZeroDivisionError(`Fraction(${numerator}, 0)`);
                }
                if (isTrue(_normalize)) {
                    let g = pyCall(gcd, [numerator, denominator]);
                    if (lt(denominator, _0)) {
                        g = g.nb$negative();
                    }
                    numerator = floorDiv(numerator, g);
                    denominator = floorDiv(denominator, g);
                }

                self.$num = numerator;
                self.$den = denominator;
                return self;
            },
            $r() {
                const name = lookupSpecial(this.ob$type, pyStr.$name);
                return new pyStr(`${name}(${this.$num}, ${this.$den})`);
            },
            tp$str() {
                if (eq(this.$den, _1)) {
                    return new pyStr(this.$num);
                }
                return new pyStr(`${this.$num}/${this.$den}`);
            },
            tp$hash() {
                const dinv = pyPower(this.$den, sub(_PyHASH_MODULUS, 2), _PyHASH_MODULUS);
                let hash_;
                if (!isTrue(dinv)) {
                    hash_ = _PyHASH_INF;
                } else {
                    hash_ = mod(mul(pyAbs(this.$num), dinv), _PyHASH_MODULUS);
                }
                const rv = ge(this, _0) ? hash_ : hash_.nb$negative();
                return eq(rv, _neg_1) ? _neg_2 : rv;
            },
            tp$richcompare(other, OP) {
                const op = (a, b) => richCompareBool(a, b, OP);

                if (OP === "Eq" || OP == "NotEq") {
                    if (other.ob$type === pyInt) {
                        const rv = eq(this.$num, other) && eq(this.$den, _1);
                        return OP === "Eq" ? rv : !rv;
                    }
                    if (other instanceof Fraction || other instanceof pyInt) {
                        const rv = eq(this.$num, getNumer(other)) && eq(this.$den, getDenom(other));
                        return OP === "Eq" ? rv : !rv;
                    }
                    if (other instanceof pyComplex) {
                        if (eq(other.tp$getattr(new pyStr("imag")), _0)) {
                            other = other.tp$getattr(new pyStr("real"));
                        }
                    }
                }

                if (isTrue(pyIsInstance(other, _NUMBERS_RATIONAL))) {
                    return op(mul(getNumer(this), getDenom(other)), mul(getDenom(this), getNumer(other)));
                }
                if (other instanceof pyFloat) {
                    if (!Number.isFinite(other.valueOf())) {
                        return op(new pyFloat(0), other);
                    } else {
                        return op(this, pyCall(this.tp$getattr(s_from_float), [other]));
                    }
                }
                return pyNotImplemented;
            },

            tp$as_number: true,
            nb$add,
            nb$reflected_add,
            nb$subtract,
            nb$reflected_subtract,
            nb$multiply,
            nb$reflected_multiply,
            nb$divide,
            nb$reflected_divide,
            nb$floor_divide,
            nb$reflected_floor_divide,
            nb$divmod,
            nb$reflected_divmod,
            nb$remainder,
            nb$reflected_remainder,
            nb$power(other) {
                if (isTrue(pyIsInstance(other, _NUMBERS_RATIONAL))) {
                    if (eq(getDenom(other), _1)) {
                        let power = getNumer(other);
                        if (ge(power, _0)) {
                            return pyCall(Fraction, [pow(this.$num, power), pow(this.$den, power)]);
                        } else if (ge(this.$num, _0)) {
                            power = power.nb$negative();
                            return pyCall(Fraction, [pow(this.$den, power), pow(this.$num, power)]);
                        } else {
                            power = power.nb$negative();
                            return pyCall(Fraction, [
                                pow(this.$den.nb$negative(), power),
                                pow(this.$num.nb$negative(), power),
                            ]);
                        }
                    } else {
                        return pow(this.nb$float(), pyCall(pyFloat, [other]));
                    }
                } else {
                    return pow(this.nb$float(), other);
                }
            },
            nb$reflected_power(other) {
                if (eq(this.$den, _1) && ge(this.$num, _0)) {
                    return pow(other, this.$num);
                }

                if (isTrue(pyIsInstance(other, _NUMBERS_RATIONAL))) {
                    return pow(new Fraction(getNumer(other), getDenom(other)), this);
                }

                if (eq(this.$den, _1)) {
                    return pow(other, this.$num);
                }

                return pow(other, this.nb$float());
            },
            nb$positive() {
                return new Fraction(this.$num, this.$den);
            },
            nb$negative() {
                return new Fraction(this.$num.nb$negative(), this.$den);
            },
            nb$abs() {
                return new Fraction(this.$num.nb$abs(), this.$den);
            },
            nb$bool() {
                return this.$num.nb$bool();
            },
            nb$float() {
                return div(this.$num, this.$den);
            },
        },
        methods: {
            as_integer_ratio: {
                $meth() {
                    return new pyTuple([this.$num, this.$den]);
                },
                $flags: METH_NO_ARGS,
            },
            limit_denominator: {},
            __trunc__: {
                $meth() {
                    if (lt(this.$num, _0)) {
                        return floorDiv(this.$num.nb$negative(), this.$den).nb$negative();
                    } else {
                        return floorDiv(this.$num, this.$den);
                    }
                },
                $flags: METH_NO_ARGS,
            },
            __floor__: {
                $meth() {
                    return floorDiv(this.$num, this.$den);
                },
                $flags: METH_NO_ARGS,
            },
            __ceil__: {
                $meth() {
                    return floorDiv(this.$num.nb$negative(), this.$den).nb$negative();
                },
                $flags: METH_NO_ARGS,
            },
            __round__: {
                $meth(ndigits) {
                    if (ndigits === pyNone) {
                        const [floor, rem] = divmod(this.$num, this.$den).valueOf();
                        const doub = mul(rem, _2);
                        if (lt(doub, this.$den)) {
                            return floor;
                        } else if (lt(this.$den, doub)) {
                            return add(floor, _1);
                        } else if (eq(mod(floor, _2), _0)) {
                            return floor;
                        } else {
                            return add(floor, _1);
                        }
                    }

                    const shift = pow(_10, pyAbs(ndigits));

                    if (lt(_0, ndigits)) {
                        return pyCall(Fraction, [pyRound(mul(this, shift)), shift]);
                    } else {
                        return pyCall(Fraction, [mul(pyRound(div(this, shift)), shift)]);
                    }
                },
                $flags: { NamedArgs: ["ndigits"], Defaults: [pyNone] },
            },
            __reduce__: {
                $meth() {
                    return new pyTuple([this.ob$type, new pyTuple([new pyStr(this)])]);
                },
                $flags: METH_NO_ARGS,
            },
            __copy__: {
                $meth() {
                    if (this.ob$type === Fraction) {
                        return this;
                    }
                    return pyCall(this.ob$type, [this.$num, this.$den]);
                },
                $flags: METH_NO_ARGS,
            },
            __deepcopy__: {
                $meth(_memo) {
                    if (this.ob$type === Fraction) {
                        return this;
                    }
                    return pyCall(this.ob$type, [this.$num, this.$den]);
                },
                $flags: METH_ONE_ARG,
            },
        },
        classmethods: {
            from_float: {
                $meth(f) {
                    if (f instanceof pyInt) {
                        return pyCall(this, [f]);
                    } else if (!(f instanceof pyFloat)) {
                        throw new pyTypeError(
                            `${typeName(this)}.from_float() only takes floats, not ${objectRepr(f)}, (${typeName(f)})`
                        );
                    } else {
                        const [num, den] = pyCall(f.tp$getattr(s_int_ratio)).valueOf();
                        return pyCall(this, [num, den]);
                    }
                },
                $flags: METH_ONE_ARG,
            },
            from_decimal: {
                $meth() {
                    throw pyNotImplementedError("from_decimal not yet implemented in SKulpt");
                },
                $flags: METH_ONE_ARG,
            },
        },
        getsets: {
            numerator: {
                $get() {
                    return this.$num;
                },
            },
            denominator: {
                $get() {
                    return this.$den;
                },
            },
            _numerator: {
                $get() {
                    return this.$num;
                },
                $set(v) {
                    this.$num = v;
                },
            },
            _denominator: {
                $get() {
                    return this.$den;
                },
                $set(v) {
                    this.$den = v;
                },
            },
        },
    }));

    const _NUMBERS_RATIONAL = new pyTuple([pyInt, Fraction]);

    return fractionsMod;
}
