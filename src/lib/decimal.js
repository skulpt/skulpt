//@ts-check
function $builtinmodule(name) {
    const requiredImports = {};

    const {
        misceval: { chain: chainOrSuspend },
        importModule,
    } = Sk;

    const importOrSuspend = (moduleName) => importModule(moduleName, false, true);

    return chainOrSuspend(
        importOrSuspend("sys"),
        (sys) => {
            requiredImports.sys = sys;
            return importOrSuspend("math");
        },
        (math) => {
            requiredImports.math = math;
            return decimalImpl(requiredImports);
        }
    );
}

function decimalImpl(requiredModules) {
    const {
        builtin: {
            bool: pyBool,
            bool: { true$: pyTrue, false$: pyFalse },
            complex: pyComplex,
            float_: pyFloat,
            func: pyFunc,
            int_: pyInt,
            none: { none$: pyNone },
            str: pyStr,
            tuple: pyTuple,
            ArithmeticError,
            ZeroDivisionError,
            TypeError,
            ValueError,
            OverflowError,
            checkInt,
            checkFloat,
        },
        abstr: { buildNativeClass, objectGetItem: pyGetItem },
        misceval: { buildClass, callsimArray: pyCall, callsimOrSuspendArray: pyCallOrSuspend, isTrue, richCompareBool },
        ffi: { remapToPy: toPy },
    } = Sk;

    const eq = (a, b) => richCompareBool(a, b, "Eq");

    const _0 = new pyInt(0);
    const _1 = new pyInt(1);
    const _10 = new pyInt(10);

    const _1_0 = new pyFloat(1);

    const STR = Object.fromEntries(["as_integer_ratio", "bit_length"].map((x) => [x, new pyStr(x)]));

    const { sys, math } = requiredModules;

    const _math = math.$d;

    const __all__ = [
        // Two major classes
        "Decimal",
        "Context",

        // # Named tuple representation
        "DecimalTuple",

        // # Contexts
        "DefaultContext",
        "BasicContext",
        "ExtendedContext",

        // # Exceptions
        "DecimalException",
        "Clamped",
        "InvalidOperation",
        "DivisionByZero",
        "Inexact",
        "Rounded",
        "Subnormal",
        "Overflow",
        "Underflow",
        "FloatOperation",

        // # Exceptional conditions that trigger InvalidOperation
        "DivisionImpossible",
        "InvalidContext",
        "ConversionSyntax",
        "DivisionUndefined",

        // # Constants for use in setting up contexts
        "ROUND_DOWN",
        "ROUND_HALF_UP",
        "ROUND_HALF_EVEN",
        "ROUND_CEILING",
        "ROUND_FLOOR",
        "ROUND_UP",
        "ROUND_HALF_DOWN",
        "ROUND_05UP",

        // # Functions for manipulating contexts
        "setcontext",
        "getcontext",
        "localcontext",

        // # Limits for the C version for compatibility
        "MAX_PREC",
        "MAX_EMAX",
        "MIN_EMIN",
        "MIN_ETINY",

        // # C version: compile time choice that enables the thread local context (deprecated, now always true)
        "HAVE_THREADS",

        // # C version: compile time choice that enables the coroutine local context
        "HAVE_CONTEXTVAR",
    ];

    const decimalMod = {
        __name__: new pyStr("decimal"),
        __all__: toPy(__all__),
    };

    const ROUND_DOWN = new pyStr("ROUND_DOWN");
    const ROUND_HALF_UP = new pyStr("ROUND_HALF_UP");
    const ROUND_HALF_EVEN = new pyStr("ROUND_HALF_EVEN");
    const ROUND_CEILING = new pyStr("ROUND_CEILING");
    const ROUND_FLOOR = new pyStr("ROUND_FLOOR");
    const ROUND_UP = new pyStr("ROUND_UP");
    const ROUND_HALF_DOWN = new pyStr("ROUND_HALF_DOWN");
    const ROUND_05UP = new pyStr("ROUND_05UP");

    const MAX_PREC = 425000000;
    const MAX_EMAX = 425000000;
    const MIN_EMIN = -425000000;

    const MIN_ETINY = MIN_EMIN - (MAX_PREC - 1);

    function makeDecimalException(name, base, handle_method) {
        if (!Array.isArray(base)) {
            base = [base];
        }

        return buildClass(
            decimalMod,
            (_gbl, loc) => {
                if (typeof handle_method !== "function") {
                    return;
                }
                handle_method.co_name = new pyStr("handle");
                handle_method.co_varnames =
                    handle_method.length === 3 ? ["self", "context"] : ["self", "context", "sign"];
                handle_method.co_varargs = 1;
                loc.handle = new pyFunc(handle_method);
            },
            name,
            base
        );
    }

    const DecimalException = makeDecimalException(
        "DecimalException",
        ArithmeticError,
        function handle(self, context, args) {
            return pyNone;
        }
    );
    const Clamped = makeDecimalException("Clamped", DecimalException);
    const InvalidOperation = makeDecimalException(
        "InvalidOperation",
        DecimalException,
        function handle(self, context, args) {
            // pass
        }
    );
    const ConversionSyntax = makeDecimalException(
        "ConversionSyntax",
        InvalidOperation,
        function handle(self, context, args) {
            return _NAN;
        }
    );
    const DivisionByZero = makeDecimalException(
        "DivisionByZero",
        [DecimalException, ZeroDivisionError],
        function handle(self, context, sign, args) {
            return pyGetItem(_SignedInfinity, sign);
        }
    );
    const DivisionImpossible = makeDecimalException(
        "DivisionImpossible",
        InvalidOperation,
        function handle(self, context, args) {
            return _NAN;
        }
    );
    const DivisionUndefined = makeDecimalException(
        "DivisionUndefined",
        [InvalidOperation, ZeroDivisionError],
        function handle(self, context, args) {
            return _NAN;
        }
    );
    const Inexact = makeDecimalException("Inexact", DecimalException);
    const InvalidContext = makeDecimalException(
        "InvalidContext",
        InvalidOperation,
        function handle(self, context, args) {
            return _NAN;
        }
    );
    const Rounded = makeDecimalException("Rounded", DecimalException);
    const Overflow = makeDecimalException(
        "Overflow",
        [Inexact, Rounded],
        function handle(self, context, sign, args) {}
    );
    const Underflow = makeDecimalException("Underflow", [Inexact, Rounded, Subnormal]);
    const FloatOperation = makeDecimalException("FloatOperation", [DecimalException, TypeError]);

    const _signals = [
        Clamped,
        DivisionByZero,
        Inexact,
        Overflow,
        Rounded,
        Underflow,
        InvalidOperation,
        Subnormal,
        FloatOperation,
    ];

    const _condition_map = new Map([
        [ConversionSyntax, InvalidOperation],
        [DivisionImpossible, InvalidOperation],
        [DivisionUndefined, InvalidOperation],
        [InvalidContext, InvalidOperation],
    ]);

    const _rounding_modes = [
        ROUND_DOWN,
        ROUND_HALF_UP,
        ROUND_HALF_EVEN,
        ROUND_CEILING,
        ROUND_FLOOR,
        ROUND_UP,
        ROUND_HALF_DOWN,
        ROUND_05UP,
    ];

    /** @todo Contexts Management */

    /**** Decimal class ***************************/

    /**
     *
     * @param {number} sign
     * @param {string} coefficient
     * @param {number} exponent
     * @param {boolean} special
     * @returns
     */
    function _decFromTriple(sign, coefficient, exponent, special = false) {
        return new Decimal(coefficient, sign, exponent, special);
    }

    const Decimal = buildNativeClass("decimal.Decimal", {
        constructor: function Decimal(int = "0", sign = 0, exp = 0, is_special = false) {
            this._int = int;
            this._sign = sign;
            this._exp = exp;
            this._is_special = is_special;
        },
        slots: {
            tp$doc: "Floating point class for decimal arithmetic",
            tp$new() {},
            $r() {},
            tp$hash() {},
            tp$str() {},
            tp$getattr() {},
            tp$richcompare(other, op) {},
            tp$as_number: true,
            nb$add() {},
            nb$reflected_add() {},
            nb$subtract() {},
            nb$reflected_subtract() {},
            nb$multiply() {},
            nb$reflected_multiply() {},
            nb$remainder() {},
            nb$reflected_remainder() {},
            nb$divmod() {},
            nb$power() {},
            nb$reflected_power() {},
            nb$negative() {},
            nb$positive() {},
            nb$absolute() {},
            nb$bool() {
                return this._is_special || this._int !== "0";
            },
            nb$int() {
                if (this._is_special) {
                    if (this.$isNan()) {
                        throw new ValueError("Cannot convert NaN to integer");
                    } else if (this.$isInf()) {
                        throw new OverflowError("Cannot convert infinity to integer");
                    }
                }
                const s = new pyInt((-1) ** this._sign);
                if (this._exp >= 0) {
                    return new pyInt(this._int).nb$multiply(_10.nb$power(new pyInt(this._exp))).nb$multiply(s);
                } else {
                    return new pyInt(this._int.slice(0, this._exp) || 0).nb$multiply(s);
                }
            },
            nb$float() {
                let s;
                if (this.$isNan()) {
                    if (this.$isSnan()) {
                        throw new ValueError("Cannot convert signaling NaN to float");
                    }
                    s = Number.NaN;
                } else if (this.$isInf()) {
                    s = this._sign ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
                } else {
                    s = this.tp$str().toString();
                }
                return new pyFloat(s);
            },
            nb$floor_divide() {},
            nb$reflected$floor_divide() {},
            nb$divide() {},
            nb$reflected_divide() {},
        },
        methods: {
            exp: {
                meth() {},
                flags: 0,
                textsig: "($self, /, context=None)",
                doc: "Return the value of the (natural) exponential function e**x at the given\nnumber.  The function always uses the ROUND_HALF_EVEN mode and the result\nis correctly rounded.\n\n",
            },
            ln: {
                meth() {},
                flags: 0,
                textsig: "($self, /, context=None)",
                doc: "Return the natural (base e) logarithm of the operand. The function always\nuses the ROUND_HALF_EVEN mode and the result is correctly rounded.\n\n",
            },
            log10: {
                meth() {},
                flags: 0,
                textsig: "($self, /, context=None)",
                doc: "Return the base ten logarithm of the operand. The function always uses the\nROUND_HALF_EVEN mode and the result is correctly rounded.\n\n",
            },
            next_minus: {
                meth() {},
                flags: 0,
                textsig: "($self, /, context=None)",
                doc: "Return the largest number representable in the given context (or in the\ncurrent default context if no context is given) that is smaller than the\ngiven operand.\n\n",
            },
            next_plus: {
                meth() {},
                flags: 0,
                textsig: "($self, /, context=None)",
                doc: "Return the smallest number representable in the given context (or in the\ncurrent default context if no context is given) that is larger than the\ngiven operand.\n\n",
            },
            normalize: {
                meth() {},
                flags: 0,
                textsig: "($self, /, context=None)",
                doc: "Normalize the number by stripping the rightmost trailing zeros and\nconverting any result equal to Decimal('0') to Decimal('0e0').  Used\nfor producing canonical values for members of an equivalence class.\nFor example, Decimal('32.100') and Decimal('0.321000e+2') both normalize\nto the equivalent value Decimal('32.1').\n\n",
            },
            to_integral: {
                meth() {},
                flags: 0,
                textsig: "($self, /, rounding=None, context=None)",
                doc: "Identical to the to_integral_value() method.  The to_integral() name has been\nkept for compatibility with older versions.\n\n",
            },
            to_integral_exact: {
                meth() {},
                flags: 0,
                textsig: "($self, /, rounding=None, context=None)",
                doc: "Round to the nearest integer, signaling Inexact or Rounded as appropriate if\nrounding occurs.  The rounding mode is determined by the rounding parameter\nif given, else by the given context. If neither parameter is given, then the\nrounding mode of the current default context is used.\n\n",
            },
            to_integral_value: {
                meth() {},
                flags: 0,
                textsig: "($self, /, rounding=None, context=None)",
                doc: "Round to the nearest integer without signaling Inexact or Rounded.  The\nrounding mode is determined by the rounding parameter if given, else by\nthe given context. If neither parameter is given, then the rounding mode\nof the current default context is used.\n\n",
            },
            sqrt: {
                meth() {},
                flags: 0,
                textsig: "($self, /, context=None)",
                doc: "Return the square root of the argument to full precision. The result is\ncorrectly rounded using the ROUND_HALF_EVEN rounding mode.\n\n",
            },
            compare: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Compare self to other.  Return a decimal value:\n\n    a or b is a NaN ==> Decimal('NaN')\n    a < b           ==> Decimal('-1')\n    a == b          ==> Decimal('0')\n    a > b           ==> Decimal('1')\n\n",
            },
            compare_signal: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Identical to compare, except that all NaNs signal.\n\n",
            },
            max: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Maximum of self and other.  If one operand is a quiet NaN and the other is\nnumeric, the numeric operand is returned.\n\n",
            },
            max_mag: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Similar to the max() method, but the comparison is done using the absolute\nvalues of the operands.\n\n",
            },
            min: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Minimum of self and other. If one operand is a quiet NaN and the other is\nnumeric, the numeric operand is returned.\n\n",
            },
            min_mag: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Similar to the min() method, but the comparison is done using the absolute\nvalues of the operands.\n\n",
            },
            next_toward: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "If the two operands are unequal, return the number closest to the first\noperand in the direction of the second operand.  If both operands are\nnumerically equal, return a copy of the first operand with the sign set\nto be the same as the sign of the second operand.\n\n",
            },
            quantize: {
                meth() {},
                flags: 0,
                textsig: "($self, /, exp, rounding=None, context=None)",
                doc: "Return a value equal to the first operand after rounding and having the\nexponent of the second operand.\n\n    >>> Decimal('1.41421356').quantize(Decimal('1.000'))\n    Decimal('1.414')\n\nUnlike other operations, if the length of the coefficient after the quantize\noperation would be greater than precision, then an InvalidOperation is signaled.\nThis guarantees that, unless there is an error condition, the quantized exponent\nis always equal to that of the right-hand operand.\n\nAlso unlike other operations, quantize never signals Underflow, even if the\nresult is subnormal and inexact.\n\nIf the exponent of the second operand is larger than that of the first, then\nrounding may be necessary. In this case, the rounding mode is determined by the\nrounding argument if given, else by the given context argument; if neither\nargument is given, the rounding mode of the current thread's context is used.\n\n",
            },
            remainder_near: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Return the remainder from dividing self by other.  This differs from\nself % other in that the sign of the remainder is chosen so as to minimize\nits absolute value. More precisely, the return value is self - n * other\nwhere n is the integer nearest to the exact value of self / other, and\nif two integers are equally near then the even one is chosen.\n\nIf the result is zero then its sign will be the sign of self.\n\n",
            },
            fma: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, third, context=None)",
                doc: "Fused multiply-add.  Return self*other+third with no rounding of the\nintermediate product self*other.\n\n    >>> Decimal(2).fma(3, 5)\n    Decimal('11')\n\n\n",
            },
            is_canonical: {
                meth() {
                    return pyTrue;
                },
                flags: { NoArgs: true },
                textsig: "($self, /)",
                doc: "Return True if the argument is canonical and False otherwise.  Currently,\na Decimal instance is always canonical, so this operation always returns\nTrue.\n\n",
            },
            is_finite: {
                meth() {
                    return pyBool(!this._is_special);
                },
                flags: { NoArgs: true },
                textsig: "($self, /)",
                doc: "Return True if the argument is a finite number, and False if the argument\nis infinite or a NaN.\n\n",
            },
            is_infinite: {
                meth() {
                    return this._exp === "F";
                },
                flags: { NoArgs: true },
                textsig: "($self, /)",
                doc: "Return True if the argument is either positive or negative infinity and\nFalse otherwise.\n\n",
            },
            is_nan: {
                meth() {
                    return pyBool(this.$isNan());
                },
                flags: { NoArgs: true },
                textsig: "($self, /)",
                doc: "Return True if the argument is a (quiet or signaling) NaN and False\notherwise.\n\n",
            },
            is_qnan: {
                meth() {
                    return pyBool(this.$isNan() && !this.$isSnan());
                },
                flags: { NoArgs: true },
                textsig: "($self, /)",
                doc: "Return True if the argument is a quiet NaN, and False otherwise.\n\n",
            },
            is_snan: {
                meth() {
                    return pyBool(this.$isSnan());
                },
                flags: { NoArgs: true },
                textsig: "($self, /)",
                doc: "Return True if the argument is a signaling NaN and False otherwise.\n\n",
            },
            is_signed: {
                meth() {
                    return pyBool(this._sign === 1);
                },
                flags: { NoArgs: true },
                textsig: "($self, /)",
                doc: "Return True if the argument has a negative sign and False otherwise.\nNote that both zeros and NaNs can carry signs.\n\n",
            },
            is_zero: {
                meth() {
                    return pyBool(!this._is_special && this._int === "0");
                },
                flags: { NoArgs: true },
                textsig: "($self, /)",
                doc: "Return True if the argument is a (positive or negative) zero and False\notherwise.\n\n",
            },
            is_normal: {
                meth(context) {
                    if (this._is_special || !this.nb$bool()) {
                        return pyFalse;
                    }
                    // pass
                },
                flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                textsig: "($self, /, context=None)",
                doc: "Return True if the argument is a normal finite non-zero number with an\nadjusted exponent greater than or equal to Emin. Return False if the\nargument is zero, subnormal, infinite or a NaN.\n\n",
            },
            is_subnormal: {
                meth() {},
                flags: 0,
                textsig: "($self, /, context=None)",
                doc: "Return True if the argument is subnormal, and False otherwise. A number is\nsubnormal if it is non-zero, finite, and has an adjusted exponent less\nthan Emin.\n\n",
            },
            adjusted: {
                meth() {
                    return new pyInt(this.$adjusted());
                },
                flags: 0,
                textsig: "($self, /)",
                doc: "Return the adjusted exponent of the number.  Defined as exp + digits - 1.\n\n",
            },
            canonical: {
                meth() {},
                flags: 0,
                textsig: "($self, /)",
                doc: "Return the canonical encoding of the argument.  Currently, the encoding\nof a Decimal instance is always canonical, so this operation returns its\nargument unchanged.\n\n",
            },
            conjugate: {
                meth() {
                    return this;
                },
                flags: { NoArgs: true },
                textsig: "($self, /)",
                doc: "Return self.\n\n",
            },
            radix: {
                meth() {
                    return new Decimal("10");
                },
                flags: { NoArgs: true },
                textsig: "($self, /)",
                doc: "Return Decimal(10), the radix (base) in which the Decimal class does\nall its arithmetic. Included for compatibility with the specification.\n\n",
            },
            copy_abs: {
                meth() {},
                flags: 0,
                textsig: "($self, /)",
                doc: "Return the absolute value of the argument.  This operation is unaffected by\ncontext and is quiet: no flags are changed and no rounding is performed.\n\n",
            },
            copy_negate: {
                meth() {},
                flags: 0,
                textsig: "($self, /)",
                doc: "Return the negation of the argument.  This operation is unaffected by context\nand is quiet: no flags are changed and no rounding is performed.\n\n",
            },
            logb: {
                meth() {},
                flags: 0,
                textsig: "($self, /, context=None)",
                doc: "For a non-zero number, return the adjusted exponent of the operand as a\nDecimal instance.  If the operand is a zero, then Decimal('-Infinity') is\nreturned and the DivisionByZero condition is raised. If the operand is\nan infinity then Decimal('Infinity') is returned.\n\n",
            },
            logical_invert: {
                meth() {},
                flags: 0,
                textsig: "($self, /, context=None)",
                doc: "Return the digit-wise inversion of the (logical) operand.\n\n",
            },
            number_class: {
                meth(context) {},
                flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                textsig: "($self, /, context=None)",
                doc: "Return a string describing the class of the operand.  The returned value\nis one of the following ten strings:\n\n    * '-Infinity', indicating that the operand is negative infinity.\n    * '-Normal', indicating that the operand is a negative normal number.\n    * '-Subnormal', indicating that the operand is negative and subnormal.\n    * '-Zero', indicating that the operand is a negative zero.\n    * '+Zero', indicating that the operand is a positive zero.\n    * '+Subnormal', indicating that the operand is positive and subnormal.\n    * '+Normal', indicating that the operand is a positive normal number.\n    * '+Infinity', indicating that the operand is positive infinity.\n    * 'NaN', indicating that the operand is a quiet NaN (Not a Number).\n    * 'sNaN', indicating that the operand is a signaling NaN.\n\n\n",
            },
            to_eng_string: {
                meth() {},
                flags: 0,
                textsig: "($self, /, context=None)",
                doc: "Convert to an engineering-type string.  Engineering notation has an exponent\nwhich is a multiple of 3, so there are up to 3 digits left of the decimal\nplace. For example, Decimal('123E+1') is converted to Decimal('1.23E+3').\n\nThe value of context.capitals determines whether the exponent sign is lower\nor upper case. Otherwise, the context does not affect the operation.\n\n",
            },
            compare_total: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Compare two operands using their abstract representation rather than\ntheir numerical value.  Similar to the compare() method, but the result\ngives a total ordering on Decimal instances.  Two Decimal instances with\nthe same numeric value but different representations compare unequal\nin this ordering:\n\n    >>> Decimal('12.0').compare_total(Decimal('12'))\n    Decimal('-1')\n\nQuiet and signaling NaNs are also included in the total ordering. The result\nof this function is Decimal('0') if both operands have the same representation,\nDecimal('-1') if the first operand is lower in the total order than the second,\nand Decimal('1') if the first operand is higher in the total order than the\nsecond operand. See the specification for details of the total order.\n\nThis operation is unaffected by context and is quiet: no flags are changed\nand no rounding is performed. As an exception, the C version may raise\nInvalidOperation if the second operand cannot be converted exactly.\n\n",
            },
            compare_total_mag: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Compare two operands using their abstract representation rather than their\nvalue as in compare_total(), but ignoring the sign of each operand.\n\nx.compare_total_mag(y) is equivalent to x.copy_abs().compare_total(y.copy_abs()).\n\nThis operation is unaffected by context and is quiet: no flags are changed\nand no rounding is performed. As an exception, the C version may raise\nInvalidOperation if the second operand cannot be converted exactly.\n\n",
            },
            copy_sign: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Return a copy of the first operand with the sign set to be the same as the\nsign of the second operand. For example:\n\n    >>> Decimal('2.3').copy_sign(Decimal('-1.5'))\n    Decimal('-2.3')\n\nThis operation is unaffected by context and is quiet: no flags are changed\nand no rounding is performed. As an exception, the C version may raise\nInvalidOperation if the second operand cannot be converted exactly.\n\n",
            },
            same_quantum: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Test whether self and other have the same exponent or whether both are NaN.\n\nThis operation is unaffected by context and is quiet: no flags are changed\nand no rounding is performed. As an exception, the C version may raise\nInvalidOperation if the second operand cannot be converted exactly.\n\n",
            },
            logical_and: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Return the digit-wise 'and' of the two (logical) operands.\n\n",
            },
            logical_or: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Return the digit-wise 'or' of the two (logical) operands.\n\n",
            },
            logical_xor: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Return the digit-wise 'exclusive or' of the two (logical) operands.\n\n",
            },
            rotate: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Return the result of rotating the digits of the first operand by an amount\nspecified by the second operand.  The second operand must be an integer in\nthe range -precision through precision. The absolute value of the second\noperand gives the number of places to rotate. If the second operand is\npositive then rotation is to the left; otherwise rotation is to the right.\nThe coefficient of the first operand is padded on the left with zeros to\nlength precision if necessary. The sign and exponent of the first operand are\nunchanged.\n\n",
            },
            scaleb: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Return the first operand with the exponent adjusted the second.  Equivalently,\nreturn the first operand multiplied by 10**other. The second operand must be\nan integer.\n\n",
            },
            shift: {
                meth() {},
                flags: 0,
                textsig: "($self, /, other, context=None)",
                doc: "Return the result of shifting the digits of the first operand by an amount\nspecified by the second operand.  The second operand must be an integer in\nthe range -precision through precision. The absolute value of the second\noperand gives the number of places to shift. If the second operand is\npositive, then the shift is to the left; otherwise the shift is to the\nright. Digits shifted into the coefficient are zeros. The sign and exponent\nof the first operand are unchanged.\n\n",
            },
            as_tuple: {
                meth() {},
                flags: 0,
                textsig: "($self, /)",
                doc: "Return a tuple representation of the number.\n\n",
            },
            as_integer_ratio: {
                meth() {
                    this.$specialFail("convert", "to integer ratio");
                    if (!this.nb$bool()) {
                        return new pyTuple([_0, _1]);
                    }
                    let n = new pyInt(this._int).valueOf();
                    let d;
                    if (this._exp > 0) {
                        [n, d] = [n * (10 ** this._exp), 1];
                    } else {
                        /** @TODO */
                    }

                },
                flags: 0,
                textsig: "($self, /)",
                doc: "Decimal.as_integer_ratio() -> (int, int)\n\nReturn a pair of integers, whose ratio is exactly equal to the original\nDecimal and with a positive denominator. The ratio is in lowest terms.\nRaise OverflowError on infinities and a ValueError on NaNs.\n\n",
            },
            __copy__: {
                meth() {
                    if (this.ob$type === Decimal) {
                        return this;
                    }
                    return pyCall(this, [this.tp$str()]);
                },
                flags: { NoArgs: true },
                textsig: null,
                doc: null,
            },
            __deepcopy__: {
                meth(_memo) {
                    if (this.ob$type === Decimal) {
                        return this;
                    }
                    return pyCall(this, [this.tp$str()]);
                },
                flags: { OneArg: true },
                textsig: null,
                doc: null,
            },
            __format__: {
                meth() {},
                flags: 0,
                textsig: null,
                doc: null,
            },
            __reduce__: {
                meth() {
                    return new pyTuple([this.ob$type, new pyTuple([this.tp$str()])]);
                },
                flags: 0,
                textsig: null,
                doc: null,
            },
            __round__: {
                meth(n) {},
                flags: { NamedArgs: ["n"], Defaults: [pyNone] },
                textsig: null,
                doc: null,
            },
            __ceil__: {
                meth() {
                    this.$specialFail("round");
                    return new pyInt(this.$rescale(0, ROUND_CEILING));
                },
                flags: 0,
                textsig: null,
                doc: null,
            },
            __floor__: {
                meth() {
                    this.$specialFail("round");
                    return new pyInt(this.$rescale(0, ROUND_FLOOR));
                },
                flags: { NoArgs: true },
                textsig: null,
                doc: null,
            },
            __trunc__: {
                meth() {
                    return this.nb$int();
                },
                flags: { NoArgs: true },
                textsig: null,
                doc: null,
            },
            __complex__: {
                meth() {
                    return pyCall(pyComplex, [this.nb$float()]);
                },
                flags: { NoArgs: true },
                textsig: null,
                doc: null,
            },
            __sizeof__: {
                meth() {},
                flags: 0,
                textsig: null,
                doc: null,
            },
        },
        classmethods: {
            from_float: {
                meth(f) {
                    let sign, k, coeff;
                    if (checkInt(f)) {
                        sign = f.nb$ispositive() ? 0 : 1;
                        k = 0;
                        coeff = f.nb$abs().toString();
                    } else if (checkFloat(f)) {
                        if (isTrue(pyCall(_math.isinf, [f])) || isTrue(pyCall(_math.isnan, [f]))) {
                            return pyCall(this, [f.$r()]);
                        }
                        if (eq(pyCall(_math.copysign, [_1_0, f]), _1_0)) {
                            sign = 0;
                        } else {
                            sign = 1;
                        }
                        const [n, d] = pyCall(f.nb$abs().tp$getattr(STR.as_integer_ratio)).valueOf();
                        k = pyCall(d.tp$getattr(STR.bit_length), []).nb$subtract(_1).valueOf();
                        coeff = n.valueOf() * 5 ** k;
                    } else {
                        throw new TypeError("argument must be int or float.");
                    }

                    const rv = _decFromTriple(sign, coeff, -k);
                    if (this === Decimal) {
                        return rv;
                    }
                    return pyCallOrSuspend(this, [rv]);
                },
                flags: { OneArg: true },
                textsig: "($type, f, /)",
                doc: "Class method that converts a float to a decimal number, exactly.\nSince 0.1 is not exactly representable in binary floating point,\nDecimal.from_float(0.1) is not the same as Decimal('0.1').\n\n    >>> Decimal.from_float(0.1)\n    Decimal('0.1000000000000000055511151231257827021181583404541015625')\n    >>> Decimal.from_float(float('nan'))\n    Decimal('NaN')\n    >>> Decimal.from_float(float('inf'))\n    Decimal('Infinity')\n    >>> Decimal.from_float(float('-inf'))\n    Decimal('-Infinity')\n\n\n",
            },
        },
        getsets: {
            real: {
                get() {
                    return this;
                },
            },
            imag: {
                get() {
                    return new Decimal();
                },
            },
        },
        proto: {
            $specialFail(msgAction, msgSuffix="") {
                msgSuffix && (msgSuffix = " " + msgSuffix);
                if (this._is_special) {
                    if (this.$isNan()) {
                        throw new ValueError(`cannot ${msgAction} NaN${msgSuffix}`);
                    }
                    throw new OverflowError(`cannot ${msgAction} Infinity${msgSuffix}`);
                }
            },
            $adjusted() {
                if (typeof this._exp === "number") {
                    return this._exp + this._int.length - 1;
                }
                return 0;
            },
            $isNan() {
                if (this._is_special) {
                    const exp = this._exp;
                    if (exp === "n") {
                        return 1;
                    } else if (exp === "N") {
                        return 2;
                    }
                }
                return 0;
            },
            $isSnan() {
                return this._exp === "N";
            },
            $isInf() {
                if (this._exp === "F") {
                    if (this._sign) {
                        return -1;
                    }
                    return 1;
                }
                return 0;
            },
            $checkNans(other = null, context = null) {
                // pass
            },
        },
    });

    Object.assign(decimalMod, {
        Decimal,
        Context,

        // # Named tuple representation
        DecimalTuple,

        // # Contexts
        DefaultContext,
        BasicContext,
        ExtendedContext,

        // # Exceptions
        DecimalException,
        Clamped,
        InvalidOperation,
        DivisionByZero,
        Inexact,
        Rounded,
        Subnormal,
        Overflow,
        Underflow,
        FloatOperation,

        // # Exceptional conditions that trigger InvalidOperation
        DivisionImpossible,
        InvalidContext,
        ConversionSyntax,
        DivisionUndefined,

        // # Constants for use in setting up contexts
        ROUND_DOWN,
        ROUND_HALF_UP,
        ROUND_HALF_EVEN,
        ROUND_CEILING,
        ROUND_FLOOR,
        ROUND_UP,
        ROUND_HALF_DOWN,
        ROUND_05UP,

        // # Functions for manipulating contexts
        setcontext,
        getcontext,
        localcontext,

        // # Limits for the C version for compatibility
        MAX_PREC,
        MAX_EMAX,
        MIN_EMIN,
        MIN_ETINY,

        // # C version: compile time choice that enables the thread local context (deprecated, now always true)
        HAVE_THREADS,

        // # C version: compile time choice that enables the coroutine local context
        HAVE_CONTEXTVAR,
    });
}
