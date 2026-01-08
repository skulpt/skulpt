//@ts-check
function $builtinmodule(name) {
    const {
        misceval: { chain: chainOrSuspend },
        importModule,
    } = Sk;

    return chainOrSuspend(importModule("math", false, true), (math) => {
        return decimalImpl({ math });
    });
}

function decimalImpl({ math }) {
    const {
        builtin: {
            bool: pyBool,
            bool: { true$: pyTrue, false$: pyFalse },
            complex: pyComplex,
            float_: pyFloat,
            func: pyFunc,
            int_: pyInt,
            list: pyList,
            none: { none$: pyNone },
            NotImplemented: { NotImplemented$: pyNotImplemented },
            str: pyStr,
            tuple: pyTuple,
            object: pyObject,
            pow: pyPow,
            dict: pyDict,
            ArithmeticError,
            ZeroDivisionError,
            NotImplementedError,
            TypeError,
            ValueError,
            KeyError,
            OverflowError,
            checkInt,
            checkFloat,
            checkString,
        },
        abstr: { buildNativeClass, objectGetItem: pyGetItem, copyKeywordsToNamedArgs: parseArgs, iter: pyIter },
        misceval: {
            buildClass,
            callsimArray: pyCall,
            callsimOrSuspendArray: pyCallOrSuspend,
            isTrue,
            richCompareBool,
            objectRepr,
        },
        generic: { getAttr: genericGetAttr },
        ffi: { remapToPy: toPy },
    } = Sk;

    const eq = (a, b) => richCompareBool(a, b, "Eq");

    function* iterJs(iter) {
        const it = pyIter(iter);
        let nxt;
        while ((nxt = it.tp$iternext()) !== undefined) {
            yield nxt;
        }
    }

    const _0 = new pyInt(0);
    const _1 = new pyInt(1);
    const _5 = new pyInt(5);
    const _10 = new pyInt(10);

    const _1_0 = new pyFloat(1);

    // Helper for unimplemented methods
    const notImplementedYet = () => {
        throw new NotImplementedError("method not yet implemented in Skulpt");
    };

    const STR = Object.fromEntries(
        ["as_integer_ratio", "bit_length", "from_float", "0", "F"].map((x) => [x, new pyStr(x)])
    );

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
            return _NaN;
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
            return _NaN;
        }
    );
    const DivisionUndefined = makeDecimalException(
        "DivisionUndefined",
        [InvalidOperation, ZeroDivisionError],
        function handle(self, context, args) {
            return _NaN;
        }
    );
    const Inexact = makeDecimalException("Inexact", DecimalException);
    const InvalidContext = makeDecimalException(
        "InvalidContext",
        InvalidOperation,
        function handle(self, context, args) {
            return _NaN;
        }
    );
    const Rounded = makeDecimalException("Rounded", DecimalException);
    const Subnormal = makeDecimalException("Subnormal", DecimalException);
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
     *
     * @param {number} sign
     * @param {string} coefficient
     * @param {number|string} exponent
     * @param {boolean} special
     *
     * @returns
     */
    function _decFromTriple(sign, coefficient, exponent, special = false) {
        return new Decimal(coefficient, sign, exponent, special);
    }

    /**
     * Convert other to Decimal for use in arithmetic operations.
     * Returns pyNotImplemented for unsupported types.
     */
    function convertOther(other, raiseit = false) {
        if (other instanceof Decimal) {
            return other;
        }
        if (other instanceof pyInt) {
            // Convert Python int to Decimal
            const val = other.v;
            if (typeof val === "bigint") {
                const sign = val < 0n ? 1 : 0;
                const absVal = val < 0n ? -val : val;
                return _decFromTriple(sign, absVal.toString(), 0);
            } else {
                const sign = val < 0 ? 1 : 0;
                return _decFromTriple(sign, Math.abs(val).toString(), 0);
            }
        }
        if (raiseit) {
            throw new TypeError("Unable to convert " + objectRepr(other).toString() + " to Decimal");
        }
        return pyNotImplemented;
    }

    // Format specifier regex - matches PEP 3101 format spec
    const _FORMAT_SPEC_REGEX =
        /^(?:(?<fill>.)?(?<align>[<>=^]))?(?<sign>[-+ ])?(?<alt>#)?(?<zeropad>0)?(?<minimumwidth>(?!0)\d+)?(?<thousands_sep>,)?(?:\.(?<precision>0|(?!0)\d+))?(?<type>[eEfFgGn%])?$/;

    function _parseFormatSpec(formatSpec) {
        const m = formatSpec.match(_FORMAT_SPEC_REGEX);
        if (!m) {
            throw new ValueError("Invalid format specifier: " + formatSpec);
        }
        const g = m.groups || {};
        const fill = g.fill || (g.zeropad ? "0" : " ");
        const align = g.align || (g.zeropad ? "=" : ">");
        return {
            fill: fill,
            align: align,
            sign: g.sign || "-",
            alt: !!g.alt,
            zeropad: !!g.zeropad,
            minimumwidth: parseInt(g.minimumwidth || "0", 10),
            thousands_sep: g.thousands_sep || "",
            precision: g.precision !== undefined ? parseInt(g.precision, 10) : null,
            type: g.type || null,
        };
    }

    function _formatSign(isNegative, spec) {
        if (isNegative) {
            return "-";
        } else if (spec.sign === "+" || spec.sign === " ") {
            return spec.sign;
        }
        return "";
    }

    function _formatAlign(sign, body, spec) {
        const minimumwidth = spec.minimumwidth;
        const fill = spec.fill;
        const needed = minimumwidth - sign.length - body.length;
        const padding = needed > 0 ? fill.repeat(needed) : "";
        const align = spec.align;
        if (align === "<") {
            return sign + body + padding;
        } else if (align === ">") {
            return padding + sign + body;
        } else if (align === "=") {
            return sign + padding + body;
        } else if (align === "^") {
            const half = Math.floor(padding.length / 2);
            return padding.slice(0, half) + sign + body + padding.slice(half);
        }
        return sign + body;
    }

    function _insertThousandsSep(digits, sep, minWidth = 1) {
        // Insert separator every 3 digits from the right, padding with zeros if needed.
        // minWidth is the minimum width of the RESULT (including separators).
        // Based on CPython's _insert_thousands_sep.

        if (!sep) {
            // No separator - just pad to minWidth
            if (digits.length < minWidth) {
                return "0".repeat(minWidth - digits.length) + digits;
            }
            return digits;
        }

        // Build groups of 3 digits from right to left, padding as needed
        const groups = [];
        let remaining = digits;
        let widthRemaining = minWidth;

        while (true) {
            // Calculate group length: min(max(digits_remaining, width_remaining, 1), 3)
            // This ensures at least 1 digit and at most 3 digits per group
            const l = Math.min(Math.max(remaining.length, widthRemaining, 1), 3);

            // Build group with leading zeros if needed
            const zerosNeeded = Math.max(0, l - remaining.length);
            const group = "0".repeat(zerosNeeded) + remaining.slice(-l);
            groups.unshift(group);

            // Remove the digits we used
            if (remaining.length > l) {
                remaining = remaining.slice(0, -l);
            } else {
                remaining = "";
            }

            // Update remaining width
            widthRemaining -= l;

            // Check if we're done
            if (remaining.length === 0 && widthRemaining <= 0) {
                break;
            }

            // Account for the separator that will be added
            widthRemaining -= sep.length;
        }

        return groups.join(sep);
    }

    function _roundDigits(digits, numDigits) {
        // Round a string of digits to numDigits significant figures
        // Returns the rounded string (may be one digit longer if rounding up carries)
        if (digits.length <= numDigits) {
            return digits;
        }
        // Look at the digit after the cutoff to decide rounding
        const nextDigit = parseInt(digits[numDigits], 10);
        let result = digits.slice(0, numDigits);
        if (nextDigit >= 5) {
            // Round up - need to propagate carry
            let carry = 1;
            let chars = result.split("");
            for (let i = chars.length - 1; i >= 0 && carry; i--) {
                const d = parseInt(chars[i], 10) + carry;
                if (d >= 10) {
                    chars[i] = "0";
                    carry = 1;
                } else {
                    chars[i] = String(d);
                    carry = 0;
                }
            }
            result = chars.join("");
            if (carry) {
                result = "1" + result;
            }
        }
        return result;
    }

    /**
     * @constructor
     *
     * @param {string} int
     * @param {number} sign
     * @param {number|string} exponent
     * @param {boolean} special
     *
     * @type {any}
     *
     */
    const Decimal = buildNativeClass("decimal.Decimal", {
        constructor: function Decimal(int = "0", sign = 0, exp = 0, is_special = false) {
            this._int = int;
            this._sign = sign;
            this._exp = exp;
            this._is_special = is_special;
        },
        slots: {
            tp$doc: "Floating point class for decimal arithmetic",
            tp$new(args, kws) {
                let [value, context] = parseArgs("__new__", ["value", "context"], args, kws, [STR[0], pyNone]);
                const self = new this.ob$type();
                if (checkString(value)) {
                    const strValue = value.toString().trim().replace(/_/g, "");
                    const m = _parser(strValue);
                    if (m === null) {
                        // Return NaN for invalid literal (matches CPython behavior when traps disabled)
                        // TODO: Proper trap handling - check context.traps[InvalidOperation]
                        self._sign = 0;
                        self._int = "";
                        self._exp = "n";
                        self._is_special = true;
                        return self;
                    }
                    self._sign = m.groups.sign === "-" ? 1 : 0;
                    const intpart = m.groups.int;
                    if (intpart !== undefined) {
                        const fracpart = m.groups.frac || "";
                        const exp = Number(m.groups.exp || "0");
                        self._int = new pyInt(intpart + fracpart).toString();
                        self._exp = exp - fracpart.length;
                        self._is_special = false;
                    } else {
                        const diag = m.groups.diag;
                        if (diag !== undefined) {
                            // NaN
                            self._int = new pyInt(diag || 0).toString().replace(/^0+/, "");
                            if (m.groups.signal) {
                                self._exp = "N";
                            } else {
                                self._exp = "n";
                            }
                        } else {
                            // infinity
                            self._int = "0";
                            self._exp = "F";
                        }
                        self._is_special = true;
                    }
                    return self;
                }

                if (checkInt(value)) {
                    self._int = value.nb$abs().toString();
                    self._sign = value.valueOf() < 0 ? 1 : 0;
                    self._exp = 0;
                    self._is_special = false;
                    return self;
                }

                if (value instanceof Decimal) {
                    self._exp = value._exp;
                    self._sign = value._sign;
                    self._int = value._int;
                    self._is_special = value._is_special;
                    return self;
                }

                if (value instanceof _WorkRep) {
                    self._sign = value.sign;
                    self._int = value.int.toString();
                    self._exp = Number(value.exp);
                    self._is_special = false;
                    return self;
                }

                if (value instanceof pyList || value instanceof pyTuple) {
                    value = value.valueOf();
                    if (value.length !== 3) {
                        throw new ValueError(
                            "Invalid tuple size in creation of Decimal from list or tuple. The list or tuple should have exactly three elements"
                        );
                    }
                    const val0 = value[0];
                    if (!checkInt(val0) || (val0.valueOf() !== 0 && val0.valueOf() !== 1)) {
                        throw new ValueError(
                            "Invalid sign. The first value in the tuple should be an integer; either 0 for a positive number or 1 for a negative number."
                        );
                    }
                    self._sign = val0.valueOf();
                    if (value[2] === STR.F) {
                        // infinity value[1] is ignored
                        self._int = "0";
                        self._exp = "F";
                        self._is_special = true;
                    } else {
                        const digits = [];
                        for (let digit of iterJs(value[1])) {
                            if (checkInt(digit)) {
                                digit = digit.valueOf();
                                if (0 <= digit && digit <= 9) {
                                    // Skip leading zeros (like CPython)
                                    if (digits.length > 0 || digit !== 0) {
                                        digits.push(digit);
                                    }
                                    continue;
                                }
                            }
                            throw new ValueError(
                                "The second value in the tuple must " +
                                    "be composed of integers in the range " +
                                    "0 through 9."
                            );
                        }
                        const val2 = value[2];
                        const exp = val2.valueOf();
                        if (exp === "n" || exp === "N") {
                            // NaN: digits form the diagnostic (can be empty)
                            self._int = digits.join("");
                            self._exp = exp;
                            self._is_special = true;
                        } else if (checkInt(val2)) {
                            // Finite number: ensure at least one digit
                            self._int = digits.length > 0 ? digits.join("") : "0";
                            self._exp = exp;
                            self._is_special = false;
                        } else {
                            throw new ValueError(
                                "The third value in the tuple must " +
                                    "be an integer, or one of the " +
                                    "strings 'F', 'n', 'N'."
                            );
                        }
                    }
                    return self;
                }

                if (checkFloat(value)) {
                    if (context === pyNone) {
                        /** @todo context */
                    }
                    value = fromFloat(value);
                    self._exp = value._exp;
                    self._sign = value._sign;
                    self._int = value._int;
                    self._is_special = value._is_special;
                    return self;
                }

                throw new TypeError(`Cannot convert ${objectRepr(value)} to Decimal`);
            },
            $r() {
                return new pyStr(`Decimal('${this.tp$str()}')`);
            },
            tp$hash() {
                if (this._is_special) {
                    if (this.$isSnan()) {
                        throw new TypeError("Cannot hash a signaling NaN value.");
                    } else if (this.$isNan()) {
                        return _PyHASH_NaN;
                    } else {
                        if (this._sign) {
                            return _PyHASH_INF_NEG;
                        } else {
                            return _PyHASH_INF_POS;
                        }
                    }
                }
                let expHash;
                if (this._exp >= 0) {
                    expHash = pyPow(_10, new pyInt(this._exp), _PyHASH_MODULUS);
                } else {
                    expHash = pyPow(_PyHASH_10INV, new pyInt(-this._exp), _PyHASH_MODULUS);
                }
                let hash_ = new pyInt(this._int).nb$multiply(expHash).nb$remainder(_PyHASH_MODULUS).tp$hash();
                const ans = this._sign ? -hash_ : hash_;
                return ans === -1 ? -2 : ans;
            },
            tp$str(eng = false, context = null) {
                const sign = ["", "-"][this._sign];
                if (this._is_special) {
                    if (this._exp === "F") {
                        return new pyStr(sign + "Infinity");
                    } else if (this._exp === "n") {
                        return new pyStr(sign + "NaN" + this._int);
                    } else {
                        return new pyStr(sign + "sNaN" + this._int);
                    }
                }
                const leftdigits = this._exp + this._int.length;
                let dotplace, intpart, fracpart, exp;

                if (this._exp <= 0 && leftdigits > -6) {
                    dotplace = leftdigits;
                } else if (!eng) {
                    dotplace = 1;
                } else if (this._int === "0") {
                    dotplace = (leftdigits + 1) % 3;
                    dotplace = dotplace < 0 ? 3 - dotplace - 1 : dotplace - 1;
                } else {
                    dotplace = (leftdigits - 1) % 3;
                    dotplace = dotplace < 0 ? 3 - dotplace + 1 : dotplace + 1;
                }

                if (dotplace <= 0) {
                    intpart = "0";
                    fracpart = "." + "0".repeat(-dotplace) + this._int;
                } else if (dotplace >= this._int.length) {
                    intpart = this._int + "0".repeat(dotplace - this._int.length);
                    fracpart = "";
                } else {
                    intpart = this._int.slice(0, dotplace);
                    fracpart = "." + this._int.slice(dotplace);
                }

                if (leftdigits == dotplace) {
                    exp = "";
                } else {
                    if (context === null) {
                        /** @todo context */
                    }
                    // Use capital E (default capitals=1 in Python)
                    // Positive exponents need explicit + sign
                    const expValue = leftdigits - dotplace;
                    exp = expValue >= 0 ? "E+" + expValue.toString() : "E" + expValue.toString();
                }

                return new pyStr(sign + intpart + fracpart + exp);
            },
            tp$getattr: genericGetAttr,
            tp$richcompare(other, op) {
                let self = this;
                [self, other] = this.$convertForCompare(other, op === "Eq" || op === "NotEq");
                if (other === pyNotImplemented) {
                    return other;
                }
                // Handle NaN comparisons specially (use self, not this, as it may be scaled)
                if (self.$isNan() || (other instanceof Decimal && other.$isNan())) {
                    // For equality/inequality: NaN == x is False, NaN != x is True
                    // For ordering comparisons: signal InvalidOperation (set flag) and return False
                    // Note: Rich comparisons don't raise - they just signal
                    if (op === "Eq") {
                        return pyFalse;
                    }
                    if (op === "NotEq") {
                        return pyTrue;
                    }
                    // Ordering comparison with NaN - signal InvalidOperation (set flag)
                    const context = getContext();
                    context.$flags[InvalidOperation] = 1;
                    return pyFalse;
                }
                return self.$cmp(other, op);
            },
            tp$as_number: true,
            nb$add(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                if (context === undefined) {
                    context = getContext();
                }

                // Handle special cases
                if (this._is_special || other._is_special) {
                    const ans = this.$checkNans(other, context);
                    if (ans) {
                        return ans;
                    }
                    if (this.$isInf()) {
                        if (this._sign !== other._sign && other.$isInf()) {
                            throw new InvalidOperation("-INF + INF");
                        }
                        return _decFromTriple(this._sign, "0", "F", true);
                    }
                    if (other.$isInf()) {
                        return _decFromTriple(other._sign, "0", "F", true);
                    }
                }

                // Handle zeros
                if (!this.nb$bool()) {
                    if (!other.nb$bool()) {
                        const sign = Math.min(this._sign, other._sign);
                        return _decFromTriple(sign, "0", Math.min(this._exp, other._exp));
                    }
                    return pyCall(Decimal, [other]);
                }
                if (!other.nb$bool()) {
                    return pyCall(Decimal, [this]);
                }

                // General case - use BigInt arithmetic
                const exp = Math.min(this._exp, other._exp);
                const selfAdj = BigInt(this._int) * 10n ** BigInt(this._exp - exp);
                const otherAdj = BigInt(other._int) * 10n ** BigInt(other._exp - exp);

                let result;
                if (this._sign === other._sign) {
                    result = selfAdj + otherAdj;
                    return _decFromTriple(this._sign, result.toString(), exp);
                } else {
                    const selfVal = this._sign ? -selfAdj : selfAdj;
                    const otherVal = other._sign ? -otherAdj : otherAdj;
                    result = selfVal + otherVal;
                    const sign = result < 0n ? 1 : 0;
                    return _decFromTriple(sign, (result < 0n ? -result : result).toString(), exp);
                }
            },
            nb$reflected_add(other, context) {
                return this.nb$add(other, context);
            },
            nb$subtract(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                // Negate other and add
                const negOther = _decFromTriple(other._sign ? 0 : 1, other._int, other._exp, other._is_special);
                return this.nb$add(negOther, context);
            },
            nb$reflected_subtract(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                const negSelf = _decFromTriple(this._sign ? 0 : 1, this._int, this._exp, this._is_special);
                return other.nb$add(negSelf, context);
            },
            nb$multiply(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                if (context === undefined) {
                    context = getContext();
                }

                const resultSign = this._sign ^ other._sign;

                // Handle special cases
                if (this._is_special || other._is_special) {
                    const ans = this.$checkNans(other, context);
                    if (ans) {
                        return ans;
                    }
                    if (this.$isInf() || other.$isInf()) {
                        if (!this.nb$bool() || !other.nb$bool()) {
                            throw new InvalidOperation("INF * 0");
                        }
                        return _decFromTriple(resultSign, "0", "F", true);
                    }
                }

                // Handle zeros
                if (!this.nb$bool() || !other.nb$bool()) {
                    return _decFromTriple(resultSign, "0", this._exp + other._exp);
                }

                // General case
                const result = BigInt(this._int) * BigInt(other._int);
                return _decFromTriple(resultSign, result.toString(), this._exp + other._exp);
            },
            nb$reflected_multiply(other, context) {
                return this.nb$multiply(other, context);
            },
            nb$divide(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                if (context === undefined) {
                    context = getContext();
                }

                const resultSign = this._sign ^ other._sign;

                // Handle special cases
                if (this._is_special || other._is_special) {
                    const ans = this.$checkNans(other, context);
                    if (ans) {
                        return ans;
                    }
                    if (this.$isInf()) {
                        if (other.$isInf()) {
                            throw new InvalidOperation("INF / INF");
                        }
                        return _decFromTriple(resultSign, "0", "F", true);
                    }
                    if (other.$isInf()) {
                        return _decFromTriple(resultSign, "0", 0);
                    }
                }

                // Handle zeros
                if (!other.nb$bool()) {
                    if (!this.nb$bool()) {
                        throw new DivisionUndefined("0 / 0");
                    }
                    throw new DivisionByZero("Division by zero");
                }
                if (!this.nb$bool()) {
                    return _decFromTriple(resultSign, "0", this._exp - other._exp);
                }

                // General case - scale to get enough precision
                const prec = context.$prec;
                const shift = prec + other._int.length - this._int.length + 1;
                const dividend = BigInt(this._int) * 10n ** BigInt(Math.max(0, shift));
                const divisor = BigInt(other._int);
                const quotient = dividend / divisor;
                const expAdj = this._exp - other._exp - Math.max(0, shift);

                return _decFromTriple(resultSign, quotient.toString(), expAdj);
            },
            nb$reflected_divide(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                return other.nb$divide(this, context);
            },
            nb$remainder(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                // a % b = a - (a // b) * b
                const q = this.nb$floor_divide(other, context);
                if (q === pyNotImplemented) {
                    return q;
                }
                return this.nb$subtract(q.nb$multiply(other, context), context);
            },
            nb$reflected_remainder(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                return other.nb$remainder(this, context);
            },
            nb$divmod(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                const q = this.nb$floor_divide(other, context);
                const r = this.nb$remainder(other, context);
                return new pyTuple([q, r]);
            },
            nb$reflected_divmod(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                return other.nb$divmod(this, context);
            },
            nb$power(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                if (context === undefined) {
                    context = getContext();
                }

                // Handle special cases
                if (this._is_special || other._is_special) {
                    const ans = this.$checkNans(other, context);
                    if (ans) {
                        return ans;
                    }
                }

                // Simple integer power for now
                if (other._exp >= 0 && !other._is_special) {
                    const exp = Number(BigInt(other._int) * 10n ** BigInt(other._exp));
                    if (Number.isInteger(exp) && Math.abs(exp) < 1000) {
                        let result = pyCall(Decimal, [new pyStr("1")]);
                        let base = pyCall(Decimal, [this]);
                        let n = Math.abs(exp);

                        while (n > 0) {
                            if (n % 2 === 1) {
                                result = result.nb$multiply(base, context);
                            }
                            base = base.nb$multiply(base, context);
                            n = Math.floor(n / 2);
                        }

                        if (exp < 0) {
                            result = pyCall(Decimal, [new pyStr("1")]).nb$divide(result, context);
                        }

                        if (other._sign) {
                            result = pyCall(Decimal, [new pyStr("1")]).nb$divide(result, context);
                        }

                        return result;
                    }
                }

                // Fall back to float for complex cases
                const base = Number(this.nb$float().valueOf());
                const power = Number(other.nb$float().valueOf());
                return pyCall(Decimal, [new pyFloat(Math.pow(base, power))]);
            },
            nb$reflected_power(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                return other.nb$power(this, context);
            },
            nb$negative() {
                return _decFromTriple(this._sign ? 0 : 1, this._int, this._exp, this._is_special);
            },
            nb$positive() {
                return _decFromTriple(this._sign, this._int, this._exp, this._is_special);
            },
            nb$abs() {
                return _decFromTriple(0, this._int, this._exp, this._is_special);
            },
            nb$floor_divide(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                if (context === undefined) {
                    context = getContext();
                }

                const resultSign = this._sign ^ other._sign;

                // Handle special cases
                if (this._is_special || other._is_special) {
                    const ans = this.$checkNans(other, context);
                    if (ans) {
                        return ans;
                    }
                    if (this.$isInf()) {
                        if (other.$isInf()) {
                            throw new InvalidOperation("INF // INF");
                        }
                        return _decFromTriple(resultSign, "0", "F", true);
                    }
                    if (other.$isInf()) {
                        return _decFromTriple(resultSign, "0", 0);
                    }
                }

                // Handle zeros
                if (!other.nb$bool()) {
                    if (!this.nb$bool()) {
                        throw new DivisionUndefined("0 // 0");
                    }
                    throw new DivisionByZero("Division by zero");
                }
                if (!this.nb$bool()) {
                    return _decFromTriple(resultSign, "0", 0);
                }

                // General case
                const div = this.nb$divide(other, context);
                const intPart = div.nb$int();
                // Floor toward negative infinity
                if (resultSign && div._exp < 0) {
                    // Check if there's a fractional part
                    const intDecimal = pyCall(Decimal, [intPart]);
                    if (!richCompareBool(div, intDecimal, "Eq")) {
                        return pyCall(Decimal, [intPart.nb$subtract(_1)]);
                    }
                }
                return pyCall(Decimal, [intPart]);
            },
            nb$reflected_floor_divide(other, context) {
                other = convertOther(other);
                if (other === pyNotImplemented) {
                    return other;
                }
                return other.nb$floor_divide(this, context);
            },
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
        },
        methods: {
            exp: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Return the value of the (natural) exponential function e**x at the given\nnumber.  The function always uses the ROUND_HALF_EVEN mode and the result\nis correctly rounded.\n\n",
            },
            ln: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Return the natural (base e) logarithm of the operand. The function always\nuses the ROUND_HALF_EVEN mode and the result is correctly rounded.\n\n",
            },
            log10: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Return the base ten logarithm of the operand. The function always uses the\nROUND_HALF_EVEN mode and the result is correctly rounded.\n\n",
            },
            next_minus: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Return the largest number representable in the given context (or in the\ncurrent default context if no context is given) that is smaller than the\ngiven operand.\n\n",
            },
            next_plus: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Return the smallest number representable in the given context (or in the\ncurrent default context if no context is given) that is larger than the\ngiven operand.\n\n",
            },
            normalize: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Normalize the number by stripping the rightmost trailing zeros and\nconverting any result equal to Decimal('0') to Decimal('0e0').  Used\nfor producing canonical values for members of an equivalence class.\nFor example, Decimal('32.100') and Decimal('0.321000e+2') both normalize\nto the equivalent value Decimal('32.1').\n\n",
            },
            to_integral: {
                $meth(rounding, context) {
                    // Alias for to_integral_value - duplicated implementation
                    let roundingMode = ROUND_HALF_EVEN;
                    if (rounding && rounding !== pyNone) {
                        roundingMode = rounding;
                    } else if (context && context !== pyNone) {
                        const ctxRounding = context.tp$getattr(new pyStr("rounding"));
                        if (ctxRounding && ctxRounding !== pyNone) {
                            roundingMode = ctxRounding;
                        }
                    }
                    if (this._is_special) {
                        if (this.$isNan()) {
                            return _decFromTriple(this._sign, this._int, this._exp, true);
                        }
                        return _decFromTriple(this._sign, this._int, this._exp, true);
                    }
                    if (this._exp >= 0) {
                        return _decFromTriple(this._sign, this._int, this._exp);
                    }
                    return this.$rescale(0, roundingMode);
                },
                $flags: { NamedArgs: ["rounding", "context"], Defaults: [pyNone, pyNone] },
                $textsig: "($self, /, rounding=None, context=None)",
                $doc: "Identical to the to_integral_value() method.  The to_integral() name has been\nkept for compatibility with older versions.\n\n",
            },
            to_integral_exact: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["rounding", "context"], Defaults: [pyNone, pyNone] },
                $textsig: "($self, /, rounding=None, context=None)",
                $doc: "Round to the nearest integer, signaling Inexact or Rounded as appropriate if\nrounding occurs.  The rounding mode is determined by the rounding parameter\nif given, else by the given context. If neither parameter is given, then the\nrounding mode of the current default context is used.\n\n",
            },
            to_integral_value: {
                $meth(rounding, context) {
                    // Determine rounding mode
                    let roundingMode = ROUND_HALF_EVEN;
                    if (rounding && rounding !== pyNone) {
                        roundingMode = rounding;
                    } else if (context && context !== pyNone) {
                        const ctxRounding = context.tp$getattr(new pyStr("rounding"));
                        if (ctxRounding && ctxRounding !== pyNone) {
                            roundingMode = ctxRounding;
                        }
                    }
                    // Handle special values
                    if (this._is_special) {
                        if (this.$isNan()) {
                            return _decFromTriple(this._sign, this._int, this._exp, true);
                        }
                        // Infinity returns itself
                        return _decFromTriple(this._sign, this._int, this._exp, true);
                    }
                    // Already an integer
                    if (this._exp >= 0) {
                        return _decFromTriple(this._sign, this._int, this._exp);
                    }
                    // Round to integer
                    return this.$rescale(0, roundingMode);
                },
                $flags: { NamedArgs: ["rounding", "context"], Defaults: [pyNone, pyNone] },
                $textsig: "($self, /, rounding=None, context=None)",
                $doc: "Round to the nearest integer without signaling Inexact or Rounded.  The\nrounding mode is determined by the rounding parameter if given, else by\nthe given context. If neither parameter is given, then the rounding mode\nof the current default context is used.\n\n",
            },
            sqrt: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Return the square root of the argument to full precision. The result is\ncorrectly rounded using the ROUND_HALF_EVEN rounding mode.\n\n",
            },
            compare: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Compare self to other.  Return a decimal value:\n\n    a or b is a NaN ==> Decimal('NaN')\n    a < b           ==> Decimal('-1')\n    a == b          ==> Decimal('0')\n    a > b           ==> Decimal('1')\n\n",
            },
            compare_signal: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Identical to compare, except that all NaNs signal.\n\n",
            },
            max: {
                $meth(other, context) {
                    if (context === pyNone || context === undefined) {
                        context = getContext();
                    }
                    return pyCall(context.tp$getattr(new pyStr("max")), [this, other]);
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Maximum of self and other.  If one operand is a quiet NaN and the other is\nnumeric, the numeric operand is returned.\n\n",
            },
            max_mag: {
                $meth(other, context) {
                    if (context === pyNone || context === undefined) {
                        context = getContext();
                    }
                    return pyCall(context.tp$getattr(new pyStr("max_mag")), [this, other]);
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Similar to the max() method, but the comparison is done using the absolute\nvalues of the operands.\n\n",
            },
            min: {
                $meth(other, context) {
                    if (context === pyNone || context === undefined) {
                        context = getContext();
                    }
                    return pyCall(context.tp$getattr(new pyStr("min")), [this, other]);
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Minimum of self and other. If one operand is a quiet NaN and the other is\nnumeric, the numeric operand is returned.\n\n",
            },
            min_mag: {
                $meth(other, context) {
                    if (context === pyNone || context === undefined) {
                        context = getContext();
                    }
                    return pyCall(context.tp$getattr(new pyStr("min_mag")), [this, other]);
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Similar to the min() method, but the comparison is done using the absolute\nvalues of the operands.\n\n",
            },
            next_toward: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "If the two operands are unequal, return the number closest to the first\noperand in the direction of the second operand.  If both operands are\nnumerically equal, return a copy of the first operand with the sign set\nto be the same as the sign of the second operand.\n\n",
            },
            quantize: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "rounding", "context"], Defaults: [pyNone, pyNone] },
                $textsig: "($self, /, exp, rounding=None, context=None)",
                $doc: "Return a value equal to the first operand after rounding and having the\nexponent of the second operand.\n\n    >>> Decimal('1.41421356').quantize(Decimal('1.000'))\n    Decimal('1.414')\n\nUnlike other operations, if the length of the coefficient after the quantize\noperation would be greater than precision, then an InvalidOperation is signaled.\nThis guarantees that, unless there is an error condition, the quantized exponent\nis always equal to that of the right-hand operand.\n\nAlso unlike other operations, quantize never signals Underflow, even if the\nresult is subnormal and inexact.\n\nIf the exponent of the second operand is larger than that of the first, then\nrounding may be necessary. In this case, the rounding mode is determined by the\nrounding argument if given, else by the given context argument; if neither\nargument is given, the rounding mode of the current thread's context is used.\n\n",
            },
            remainder_near: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Return the remainder from dividing self by other.  This differs from\nself % other in that the sign of the remainder is chosen so as to minimize\nits absolute value. More precisely, the return value is self - n * other\nwhere n is the integer nearest to the exact value of self / other, and\nif two integers are equally near then the even one is chosen.\n\nIf the result is zero then its sign will be the sign of self.\n\n",
            },
            fma: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, third, context=None)",
                $doc: "Fused multiply-add.  Return self*other+third with no rounding of the\nintermediate product self*other.\n\n    >>> Decimal(2).fma(3, 5)\n    Decimal('11')\n\n\n",
            },
            is_canonical: {
                $meth() {
                    return pyTrue;
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return True if the argument is canonical and False otherwise.  Currently,\na Decimal instance is always canonical, so this operation always returns\nTrue.\n\n",
            },
            is_finite: {
                $meth() {
                    return new pyBool(!this._is_special);
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return True if the argument is a finite number, and False if the argument\nis infinite or a NaN.\n\n",
            },
            is_infinite: {
                $meth() {
                    return new pyBool(this._exp === "F");
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return True if the argument is either positive or negative infinity and\nFalse otherwise.\n\n",
            },
            is_nan: {
                $meth() {
                    return new pyBool(this.$isNan());
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return True if the argument is a (quiet or signaling) NaN and False\notherwise.\n\n",
            },
            is_qnan: {
                $meth() {
                    return new pyBool(this.$isNan() && !this.$isSnan());
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return True if the argument is a quiet NaN, and False otherwise.\n\n",
            },
            is_snan: {
                $meth() {
                    return new pyBool(this.$isSnan());
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return True if the argument is a signaling NaN and False otherwise.\n\n",
            },
            is_signed: {
                $meth() {
                    return new pyBool(this._sign === 1);
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return True if the argument has a negative sign and False otherwise.\nNote that both zeros and NaNs can carry signs.\n\n",
            },
            is_zero: {
                $meth() {
                    return new pyBool(!this._is_special && this._int === "0");
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return True if the argument is a (positive or negative) zero and False\notherwise.\n\n",
            },
            is_normal: {
                $meth(context) {
                    if (this._is_special || !this.nb$bool()) {
                        return pyFalse;
                    }
                    // pass
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Return True if the argument is a normal finite non-zero number with an\nadjusted exponent greater than or equal to Emin. Return False if the\nargument is zero, subnormal, infinite or a NaN.\n\n",
            },
            is_subnormal: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Return True if the argument is subnormal, and False otherwise. A number is\nsubnormal if it is non-zero, finite, and has an adjusted exponent less\nthan Emin.\n\n",
            },
            adjusted: {
                $meth() {
                    return new pyInt(this.$adjusted());
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return the adjusted exponent of the number.  Defined as exp + digits - 1.\n\n",
            },
            canonical: {
                $meth() {
                    // The encoding of a Decimal instance is always canonical, so return unchanged
                    return this;
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return the canonical encoding of the argument.  Currently, the encoding\nof a Decimal instance is always canonical, so this operation returns its\nargument unchanged.\n\n",
            },
            conjugate: {
                $meth() {
                    return this;
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return self.\n\n",
            },
            radix: {
                $meth() {
                    return new Decimal("10");
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return Decimal(10), the radix (base) in which the Decimal class does\nall its arithmetic. Included for compatibility with the specification.\n\n",
            },
            copy_abs: {
                $meth() {
                    // Return absolute value (sign set to 0)
                    return _decFromTriple(0, this._int, this._exp, this._is_special);
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return the absolute value of the argument.  This operation is unaffected by\ncontext and is quiet: no flags are changed and no rounding is performed.\n\n",
            },
            copy_negate: {
                $meth() {
                    // Return negation (flip the sign)
                    return _decFromTriple(this._sign ? 0 : 1, this._int, this._exp, this._is_special);
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return the negation of the argument.  This operation is unaffected by context\nand is quiet: no flags are changed and no rounding is performed.\n\n",
            },
            logb: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "For a non-zero number, return the adjusted exponent of the operand as a\nDecimal instance.  If the operand is a zero, then Decimal('-Infinity') is\nreturned and the DivisionByZero condition is raised. If the operand is\nan infinity then Decimal('Infinity') is returned.\n\n",
            },
            logical_invert: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Return the digit-wise inversion of the (logical) operand.\n\n",
            },
            number_class: {
                $meth(context) {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Return a string describing the class of the operand.  The returned value\nis one of the following ten strings:\n\n    * '-Infinity', indicating that the operand is negative infinity.\n    * '-Normal', indicating that the operand is a negative normal number.\n    * '-Subnormal', indicating that the operand is negative and subnormal.\n    * '-Zero', indicating that the operand is a negative zero.\n    * '+Zero', indicating that the operand is a positive zero.\n    * '+Subnormal', indicating that the operand is positive and subnormal.\n    * '+Normal', indicating that the operand is a positive normal number.\n    * '+Infinity', indicating that the operand is positive infinity.\n    * 'NaN', indicating that the operand is a quiet NaN (Not a Number).\n    * 'sNaN', indicating that the operand is a signaling NaN.\n\n\n",
            },
            to_eng_string: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: ["context"], Defaults: [pyNone] },
                $textsig: "($self, /, context=None)",
                $doc: "Convert to an engineering-type string.  Engineering notation has an exponent\nwhich is a multiple of 3, so there are up to 3 digits left of the decimal\nplace. For example, Decimal('123E+1') is converted to Decimal('1.23E+3').\n\nThe value of context.capitals determines whether the exponent sign is lower\nor upper case. Otherwise, the context does not affect the operation.\n\n",
            },
            compare_total: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Compare two operands using their abstract representation rather than\ntheir numerical value.  Similar to the compare() method, but the result\ngives a total ordering on Decimal instances.  Two Decimal instances with\nthe same numeric value but different representations compare unequal\nin this ordering:\n\n    >>> Decimal('12.0').compare_total(Decimal('12'))\n    Decimal('-1')\n\nQuiet and signaling NaNs are also included in the total ordering. The result\nof this function is Decimal('0') if both operands have the same representation,\nDecimal('-1') if the first operand is lower in the total order than the second,\nand Decimal('1') if the first operand is higher in the total order than the\nsecond operand. See the specification for details of the total order.\n\nThis operation is unaffected by context and is quiet: no flags are changed\nand no rounding is performed. As an exception, the C version may raise\nInvalidOperation if the second operand cannot be converted exactly.\n\n",
            },
            compare_total_mag: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Compare two operands using their abstract representation rather than their\nvalue as in compare_total(), but ignoring the sign of each operand.\n\nx.compare_total_mag(y) is equivalent to x.copy_abs().compare_total(y.copy_abs()).\n\nThis operation is unaffected by context and is quiet: no flags are changed\nand no rounding is performed. As an exception, the C version may raise\nInvalidOperation if the second operand cannot be converted exactly.\n\n",
            },
            copy_sign: {
                $meth(other, context) {
                    other = convertOther(other, true);
                    return _decFromTriple(other._sign, this._int, this._exp, this._is_special);
                },
                $flags: { NamedArgs: ["other", "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Return a copy of the first operand with the sign set to be the same as the\nsign of the second operand. For example:\n\n    >>> Decimal('2.3').copy_sign(Decimal('-1.5'))\n    Decimal('-2.3')\n\nThis operation is unaffected by context and is quiet: no flags are changed\nand no rounding is performed. As an exception, the C version may raise\nInvalidOperation if the second operand cannot be converted exactly.\n\n",
            },
            same_quantum: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Test whether self and other have the same exponent or whether both are NaN.\n\nThis operation is unaffected by context and is quiet: no flags are changed\nand no rounding is performed. As an exception, the C version may raise\nInvalidOperation if the second operand cannot be converted exactly.\n\n",
            },
            logical_and: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Return the digit-wise 'and' of the two (logical) operands.\n\n",
            },
            logical_or: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Return the digit-wise 'or' of the two (logical) operands.\n\n",
            },
            logical_xor: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Return the digit-wise 'exclusive or' of the two (logical) operands.\n\n",
            },
            rotate: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Return the result of rotating the digits of the first operand by an amount\nspecified by the second operand.  The second operand must be an integer in\nthe range -precision through precision. The absolute value of the second\noperand gives the number of places to rotate. If the second operand is\npositive then rotation is to the left; otherwise rotation is to the right.\nThe coefficient of the first operand is padded on the left with zeros to\nlength precision if necessary. The sign and exponent of the first operand are\nunchanged.\n\n",
            },
            scaleb: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Return the first operand with the exponent adjusted the second.  Equivalently,\nreturn the first operand multiplied by 10**other. The second operand must be\nan integer.\n\n",
            },
            shift: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NamedArgs: [null, "context"], Defaults: [pyNone] },
                $textsig: "($self, /, other, context=None)",
                $doc: "Return the result of shifting the digits of the first operand by an amount\nspecified by the second operand.  The second operand must be an integer in\nthe range -precision through precision. The absolute value of the second\noperand gives the number of places to shift. If the second operand is\npositive, then the shift is to the left; otherwise the shift is to the\nright. Digits shifted into the coefficient are zeros. The sign and exponent\nof the first operand are unchanged.\n\n",
            },
            as_tuple: {
                $meth() {
                    // Returns (sign, digit_tuple, exponent)
                    const digits = this._int.split("").map((c) => new pyInt(parseInt(c, 10)));
                    const digitTuple = new pyTuple(digits);
                    // For special values, _exp is a string like 'n' (NaN) or 'F' (Infinity)
                    const exp = typeof this._exp === "string" ? new pyStr(this._exp) : new pyInt(this._exp);
                    return new pyTuple([new pyInt(this._sign), digitTuple, exp]);
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return a tuple representation of the number.\n\n",
            },
            as_integer_ratio: {
                $meth() {
                    this.$specialFail("convert", "to integer ratio");
                    if (!this.nb$bool()) {
                        return new pyTuple([_0, _1]);
                    }
                    // Get the coefficient as JSBI BigInt for precision
                    const BIG_1 = JSBI.BigInt(1);
                    const BIG_10 = JSBI.BigInt(10);
                    const BIG_0 = JSBI.BigInt(0);
                    let n = JSBI.BigInt(this._int);
                    let d;
                    if (this._exp >= 0) {
                        n = JSBI.multiply(n, JSBI.exponentiate(BIG_10, JSBI.BigInt(this._exp)));
                        d = BIG_1;
                    } else {
                        d = JSBI.exponentiate(BIG_10, JSBI.BigInt(-this._exp));
                        // Reduce to lowest terms using GCD
                        const gcd = (a, b) => {
                            a = JSBI.lessThan(a, BIG_0) ? JSBI.unaryMinus(a) : a;
                            b = JSBI.lessThan(b, BIG_0) ? JSBI.unaryMinus(b) : b;
                            while (!JSBI.equal(b, BIG_0)) {
                                const temp = b;
                                b = JSBI.remainder(a, b);
                                a = temp;
                            }
                            return a;
                        };
                        const g = gcd(n, d);
                        n = JSBI.divide(n, g);
                        d = JSBI.divide(d, g);
                    }
                    // Apply sign
                    if (this._sign) {
                        n = JSBI.unaryMinus(n);
                    }
                    return new pyTuple([new pyInt(n), new pyInt(d)]);
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Decimal.as_integer_ratio() -> (int, int)\n\nReturn a pair of integers, whose ratio is exactly equal to the original\nDecimal and with a positive denominator. The ratio is in lowest terms.\nRaise OverflowError on infinities and a ValueError on NaNs.\n\n",
            },
            __copy__: {
                $meth() {
                    if (this.ob$type === Decimal) {
                        return this;
                    }
                    return pyCall(this.ob$type, [this.tp$str()]);
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
            __deepcopy__: {
                $meth(_memo) {
                    if (this.ob$type === Decimal) {
                        return this;
                    }
                    return pyCall(this.ob$type, [this.tp$str()]);
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: null,
            },
            __format__: {
                $meth(formatSpec) {
                    if (formatSpec instanceof pyStr) {
                        formatSpec = formatSpec.toString();
                    }
                    if (typeof formatSpec !== "string") {
                        throw new TypeError("__format__ requires str");
                    }

                    // Handle empty format spec - same as str()
                    if (formatSpec === "") {
                        return this.tp$str();
                    }

                    const spec = _parseFormatSpec(formatSpec);
                    const context = getContext();

                    // Handle special values (NaN, Inf)
                    if (this._is_special) {
                        const sign = _formatSign(this._sign, spec);
                        let body;
                        if (this._exp === "n") {
                            // Quiet NaN with optional diagnostic payload
                            body = "NaN" + (this._int || "");
                        } else if (this._exp === "N") {
                            // Signaling NaN with optional diagnostic payload
                            body = "sNaN" + (this._int || "");
                        } else {
                            body = "Infinity";
                        }
                        if (spec.type === "%") {
                            body += "%";
                        }
                        return new pyStr(_formatAlign(sign, body, spec));
                    }

                    // Default type based on context.capitals
                    let type = spec.type;
                    if (type === null) {
                        type = context.$capitals ? "G" : "g";
                    }

                    // Work with a copy for percentage
                    let int = this._int;
                    let exp = this._exp;
                    const isNegative = this._sign;

                    // For '%' type, multiply by 100 (add 2 to exponent)
                    if (type === "%") {
                        exp = exp + 2;
                    }

                    // Determine precision
                    let precision = spec.precision;
                    let defaultPrecision = false;
                    if (precision === null) {
                        defaultPrecision = true;
                        if (type === "g" || type === "G") {
                            // For g/G without precision, use natural significant digits
                            precision = int.length;
                        } else if (type === "e" || type === "E") {
                            // For e/E without precision, use natural digits (no padding)
                            precision = Math.max(0, int.length - 1);
                        } else {
                            // For f/F/%, default precision is 6 (digits after decimal)
                            precision = 6;
                        }
                    }

                    // For g/G format, precision 0 is treated as precision 1 (Python spec)
                    if ((type === "g" || type === "G") && precision === 0) {
                        precision = 1;
                    }

                    // Calculate leftdigits (position of leftmost digit relative to decimal)
                    // leftdigits = exp + len(int) is the adjusted exponent + 1
                    let leftdigits = exp + int.length;

                    // For g/G, the adjusted exponent is leftdigits - 1
                    const adjustedExp = leftdigits - 1;

                    // Determine dotplace based on type
                    let dotplace;
                    let useExponential = false;
                    if (type === "e" || type === "E") {
                        dotplace = 1;
                        useExponential = true;
                    } else if (type === "f" || type === "F" || type === "%") {
                        dotplace = leftdigits;
                    } else {
                        // g/G type: use exponential if exp < -4 or exp >= precision
                        // But here 'exp' means adjusted exponent (leftdigits - 1)
                        if (adjustedExp < -4 || adjustedExp >= precision) {
                            dotplace = 1;
                            useExponential = true;
                        } else {
                            dotplace = leftdigits;
                        }
                    }

                    // Build intpart and fracpart
                    // Check if value is zero (int is all zeros)
                    const isZero = /^0+$/.test(int);

                    let intpart, fracpart;
                    if (dotplace <= 0) {
                        intpart = "0";
                        fracpart = "0".repeat(-dotplace) + int;
                    } else if (dotplace >= int.length) {
                        // For zero values, don't add trailing zeros to intpart
                        intpart = isZero ? "0" : int + "0".repeat(dotplace - int.length);
                        fracpart = "";
                    } else {
                        intpart = int.slice(0, dotplace) || "0";
                        fracpart = int.slice(dotplace);
                    }

                    // Apply precision based on type
                    if (type === "f" || type === "F" || type === "%") {
                        // For f/F/%, precision is digits after decimal
                        if (spec.precision !== null) {
                            if (fracpart.length > spec.precision) {
                                // Need to round - combine intpart and fracpart, round, then split
                                const allDigits = intpart + fracpart;
                                const intLen = intpart.length;
                                const roundPos = intLen + spec.precision;
                                if (allDigits.length > roundPos) {
                                    const rounded = _roundDigits(allDigits, roundPos);
                                    // Handle carry that might extend intpart
                                    if (rounded.length > roundPos) {
                                        // Carry extended the number - need more int digits
                                        const newIntLen = intLen + (rounded.length - roundPos);
                                        intpart = rounded.slice(0, newIntLen);
                                        fracpart = rounded.slice(newIntLen);
                                    } else {
                                        intpart = rounded.slice(0, intLen) || "0";
                                        fracpart = rounded.slice(intLen);
                                    }
                                }
                                // Pad or trim fracpart to exact precision
                                if (fracpart.length > spec.precision) {
                                    fracpart = fracpart.slice(0, spec.precision);
                                } else {
                                    fracpart = fracpart + "0".repeat(spec.precision - fracpart.length);
                                }
                            } else {
                                fracpart = fracpart + "0".repeat(spec.precision - fracpart.length);
                            }
                        }
                    } else if (type === "e" || type === "E") {
                        // For e/E, precision is digits after decimal
                        const totalDigits = precision + 1;
                        const allDigits = (intpart + fracpart).replace(/^0+/, "") || "0";
                        if (allDigits.length > totalDigits) {
                            // Need to round
                            const rounded = _roundDigits(allDigits, totalDigits);
                            intpart = rounded[0] || "0";
                            fracpart = rounded.slice(1);
                        } else if (!defaultPrecision) {
                            // Pad with zeros only if precision was explicitly specified
                            intpart = allDigits[0] || "0";
                            fracpart = allDigits.slice(1) + "0".repeat(totalDigits - allDigits.length);
                        } else {
                            // No padding for default precision
                            intpart = allDigits[0] || "0";
                            fracpart = allDigits.slice(1);
                        }
                    } else {
                        // g/G type: precision is total significant digits
                        const effPrec = Math.max(1, precision);
                        const allDigits = (intpart + fracpart).replace(/^0+/, "") || "0";
                        if (allDigits.length > effPrec) {
                            // Need to round to effPrec significant digits
                            const rounded = _roundDigits(allDigits, effPrec);
                            if (useExponential) {
                                intpart = rounded[0] || "0";
                                fracpart = rounded.slice(1);
                            } else {
                                // Rebuild intpart and fracpart from rounded digits
                                if (dotplace <= 0) {
                                    intpart = "0";
                                    fracpart = "0".repeat(-dotplace) + rounded;
                                } else if (dotplace >= rounded.length) {
                                    intpart = rounded + "0".repeat(dotplace - rounded.length);
                                    fracpart = "";
                                } else {
                                    intpart = rounded.slice(0, dotplace);
                                    fracpart = rounded.slice(dotplace);
                                }
                            }
                        } else {
                            // Pad if needed (but for g/G we normally strip trailing zeros)
                            if (useExponential) {
                                intpart = allDigits[0] || "0";
                                fracpart = allDigits.slice(1);
                            }
                        }
                        // For g/G, strip trailing zeros unless # flag
                        if (!spec.alt) {
                            fracpart = fracpart.replace(/0+$/, "");
                        }
                    }

                    // Calculate exponent for display
                    const displayExp = leftdigits - dotplace;

                    // Build sign
                    const sign = _formatSign(isNegative, spec);

                    // Build suffix (everything after intpart)
                    let suffix = "";
                    if (fracpart || spec.alt) {
                        suffix += "." + fracpart;
                    }
                    if (useExponential) {
                        const echar = type === "E" || type === "G" ? "E" : "e";
                        suffix += echar + (displayExp >= 0 ? "+" : "") + displayExp;
                    }
                    if (type === "%") {
                        suffix += "%";
                    }

                    // Calculate min_width for thousands separator (handles zero-padding)
                    let minWidth = 0;
                    if (spec.zeropad) {
                        minWidth = spec.minimumwidth - sign.length - suffix.length;
                    }

                    // Apply thousands separator to intpart (with zero-padding if needed)
                    intpart = _insertThousandsSep(intpart, spec.thousands_sep, minWidth);

                    // Build body
                    const body = intpart + suffix;

                    return new pyStr(_formatAlign(sign, body, spec));
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: "Decimal.__format__() -> str\n\nConvert to a string according to format_spec.",
            },
            __reduce__: {
                $meth() {
                    return new pyTuple([this.ob$type, new pyTuple([this.tp$str()])]);
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
            __round__: {
                $meth(n) {
                    if (n === pyNone) {
                        // One-argument form: round to nearest integer
                        if (this._is_special) {
                            if (this.$isNan()) {
                                throw new ValueError("cannot round a NaN");
                            } else {
                                throw new OverflowError("cannot round an infinity");
                            }
                        }
                        return new pyInt(this.$rescale(0, ROUND_HALF_EVEN));
                    }
                    // Two-argument form: round to n decimal places
                    const nVal = Sk.builtin.asnum$(n);
                    if (!Number.isInteger(nVal)) {
                        throw new TypeError("Second argument to round should be integral");
                    }
                    return this.$rescale(-nVal, ROUND_HALF_EVEN);
                },
                $flags: { NamedArgs: ["n"], Defaults: [pyNone] },
                $textsig: null,
                $doc: null,
            },
            __ceil__: {
                $meth() {
                    this.$specialFail("round");
                    return new pyInt(this.$rescale(0, ROUND_CEILING));
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
            __floor__: {
                $meth() {
                    this.$specialFail("round");
                    return new pyInt(this.$rescale(0, ROUND_FLOOR));
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
            __trunc__: {
                $meth() {
                    return this.nb$int();
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
            __complex__: {
                $meth() {
                    return pyCall(pyComplex, [this.nb$float()]);
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
            __sizeof__: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
        },
        classmethods: {
            from_float: {
                $meth(f) {
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
                        const as_int_ratio = f.nb$abs().tp$getattr(STR.as_integer_ratio);
                        const [n, d] = pyCall(as_int_ratio).valueOf();
                        k = pyCall(d.tp$getattr(STR.bit_length), []).nb$subtract(_1);
                        coeff = n.nb$multiply(_5.nb$power(k)).toString();
                        k = k.valueOf();
                    } else {
                        throw new TypeError("argument must be int or float.");
                    }

                    const rv = _decFromTriple(sign, coeff, -k);
                    if (this === Decimal) {
                        return rv;
                    }
                    return pyCallOrSuspend(this, [rv]);
                },
                $flags: { OneArg: true },
                $textsig: "($type, f, /)",
                $doc: "Class method that converts a float to a decimal number, exactly.\nSince 0.1 is not exactly representable in binary floating point,\nDecimal.from_float(0.1) is not the same as Decimal('0.1').\n\n    >>> Decimal.from_float(0.1)\n    Decimal('0.1000000000000000055511151231257827021181583404541015625')\n    >>> Decimal.from_float(float('nan'))\n    Decimal('NaN')\n    >>> Decimal.from_float(float('inf'))\n    Decimal('Infinity')\n    >>> Decimal.from_float(float('-inf'))\n    Decimal('-Infinity')\n\n\n",
            },
        },
        getsets: {
            real: {
                $get() {
                    return this;
                },
            },
            imag: {
                $get() {
                    return new Decimal();
                },
            },
        },
        proto: {
            $convertForCompare(other, equalityOp) {
                if (other instanceof Decimal) {
                    return [this, other];
                }
                let self = this;
                if (checkInt(other)) {
                    if (!this._is_special) {
                        // self = _decFromTriple(this._sign, new pyInt(this._int).nb$multiply(other).toString(), this._exp);
                    }
                    return [self, pyCall(Decimal, [other])];
                }

                // Handle Rational-like objects (Fraction, etc.) - they have numerator and denominator
                const numerator = other.tp$getattr ? other.tp$getattr(new pyStr("numerator")) : undefined;
                const denominator = other.tp$getattr ? other.tp$getattr(new pyStr("denominator")) : undefined;
                if (
                    numerator !== undefined &&
                    denominator !== undefined &&
                    checkInt(numerator) &&
                    checkInt(denominator)
                ) {
                    // CPython approach: scale self by denominator and compare to numerator
                    // This avoids precision loss from division
                    // Compare: self vs num/den  =>  self * den vs num
                    if (!this._is_special) {
                        const scaledSelf = this.nb$multiply(pyCall(Decimal, [denominator]));
                        const otherNum = pyCall(Decimal, [numerator]);
                        return [scaledSelf, otherNum];
                    }
                    // For special values (inf, nan), convert other to Decimal
                    const numDec = pyCall(Decimal, [numerator]);
                    const denDec = pyCall(Decimal, [denominator]);
                    const otherDec = numDec.nb$divide(denDec);
                    return [this, otherDec];
                }

                if (equalityOp && other instanceof pyComplex && other.imag === 0) {
                    other = new pyFloat(other.real);
                }
                if (checkFloat(other)) {
                    const context = getContext();
                    /** @todo context */
                    return [this, fromFloat(other)];
                }
                return [pyNotImplemented, pyNotImplemented];
            },
            $specialFail(msgAction, msgSuffix = "") {
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
                const selfIsNan = this.$isNan();
                let otherIsNan;
                if (other === null) {
                    otherIsNan = false;
                } else {
                    otherIsNan = other.$isNan();
                }

                if (selfIsNan || otherIsNan) {
                    if (context === null) {
                        context = getContext();
                    }
                    if (selfIsNan === 2) {
                        //return context._raise_error(InvalidOperation, 'sNaN', this);
                    }
                    if (otherIsNan === 2) {
                        // return context._raise_error(InvalidOperation, 'sNaN', other);
                    }

                    if (selfIsNan) {
                        return this.$fixNan(context);
                    }
                    return other.$fixNan(context);
                }
                return 0;
            },
            $fixNan(context) {
                // Return a copy of self with the NaN diagnostic preserved
                return _decFromTriple(this._sign, this._int, this._exp, true);
            },
            $cmp(other, op) {
                // Compare two Decimals
                // Handle special cases
                if (this._is_special || other._is_special) {
                    // Both are infinity with same sign
                    const sn = this.$isInf();
                    const on = other.$isInf();
                    if (sn && on) {
                        const cmp = sn === on ? 0 : sn < on ? -1 : 1;
                        return this.$compareOp(cmp, op);
                    }
                    if (sn) {
                        return this.$compareOp(sn, op);
                    }
                    if (on) {
                        return this.$compareOp(-on, op);
                    }
                }

                // Handle zeros
                const selfIsZero = !this.nb$bool();
                const otherIsZero = !other.nb$bool();

                if (selfIsZero && otherIsZero) {
                    return this.$compareOp(0, op);
                }
                if (selfIsZero) {
                    return this.$compareOp(other._sign ? 1 : -1, op);
                }
                if (otherIsZero) {
                    return this.$compareOp(this._sign ? -1 : 1, op);
                }

                // Different signs
                if (this._sign !== other._sign) {
                    return this.$compareOp(this._sign ? -1 : 1, op);
                }

                // Same sign - compare magnitudes
                const selfAdj = this.$adjusted();
                const otherAdj = other.$adjusted();

                if (selfAdj !== otherAdj) {
                    const cmp = selfAdj < otherAdj ? -1 : 1;
                    return this.$compareOp(this._sign ? -cmp : cmp, op);
                }

                // Same adjusted exponent - compare digit by digit
                const selfInt = new pyInt(this._int);
                const otherInt = new pyInt(other._int);

                // Adjust for different exponents
                let selfPadded, otherPadded;
                if (this._exp > other._exp) {
                    selfPadded = selfInt.nb$multiply(_10.nb$power(new pyInt(this._exp - other._exp)));
                    otherPadded = otherInt;
                } else if (this._exp < other._exp) {
                    selfPadded = selfInt;
                    otherPadded = otherInt.nb$multiply(_10.nb$power(new pyInt(other._exp - this._exp)));
                } else {
                    selfPadded = selfInt;
                    otherPadded = otherInt;
                }

                let cmp;
                if (richCompareBool(selfPadded, otherPadded, "Lt")) {
                    cmp = -1;
                } else if (richCompareBool(selfPadded, otherPadded, "Gt")) {
                    cmp = 1;
                } else {
                    cmp = 0;
                }

                return this.$compareOp(this._sign ? -cmp : cmp, op);
            },
            $compareOp(cmp, op) {
                switch (op) {
                    case "Lt":
                        return cmp < 0 ? pyTrue : pyFalse;
                    case "LtE":
                        return cmp <= 0 ? pyTrue : pyFalse;
                    case "Eq":
                        return cmp === 0 ? pyTrue : pyFalse;
                    case "NotEq":
                        return cmp !== 0 ? pyTrue : pyFalse;
                    case "Gt":
                        return cmp > 0 ? pyTrue : pyFalse;
                    case "GtE":
                        return cmp >= 0 ? pyTrue : pyFalse;
                    default:
                        return pyNotImplemented;
                }
            },
            // Rounding helper methods
            // Return values:
            //   1: round up (add 1 to last digit)
            //   0: truncated digits were all zeros (value unchanged)
            //  -1: truncated nonzero digits
            $_allZeros(prec) {
                // Check if all digits from position prec onwards are zeros
                return /^0*$/.test(this._int.slice(prec));
            },
            $_exactHalf(prec) {
                // Check if digits from position prec onwards form exactly 50*
                return /^50*$/.test(this._int.slice(prec));
            },
            $_roundDown(prec) {
                // Round towards 0 (truncate)
                if (this.$_allZeros(prec)) {
                    return 0;
                }
                return -1;
            },
            $_roundUp(prec) {
                // Round away from 0
                return -this.$_roundDown(prec);
            },
            $_roundHalfUp(prec) {
                // Round 5 up (away from 0)
                if ("56789".includes(this._int[prec])) {
                    return 1;
                }
                if (this.$_allZeros(prec)) {
                    return 0;
                }
                return -1;
            },
            $_roundHalfDown(prec) {
                // Round 5 down
                if (this.$_exactHalf(prec)) {
                    return -1;
                }
                return this.$_roundHalfUp(prec);
            },
            $_roundHalfEven(prec) {
                // Round 5 to even (banker's rounding)
                if (this.$_exactHalf(prec) && (prec === 0 || "02468".includes(this._int[prec - 1]))) {
                    return -1;
                }
                return this.$_roundHalfUp(prec);
            },
            $_roundCeiling(prec) {
                // Round up (towards positive infinity)
                if (this._sign) {
                    return this.$_roundDown(prec);
                }
                return -this.$_roundDown(prec);
            },
            $_roundFloor(prec) {
                // Round down (towards negative infinity)
                if (!this._sign) {
                    return this.$_roundDown(prec);
                }
                return -this.$_roundDown(prec);
            },
            $_round05Up(prec) {
                // Round down unless digit prec-1 is 0 or 5
                if (prec && !"05".includes(this._int[prec - 1])) {
                    return this.$_roundDown(prec);
                }
                return -this.$_roundDown(prec);
            },
            $pickRoundingFunction(rounding) {
                // Map rounding mode string to rounding function
                const roundingStr = typeof rounding === "string" ? rounding : rounding.toString();
                switch (roundingStr) {
                    case "ROUND_DOWN":
                        return this.$_roundDown.bind(this);
                    case "ROUND_UP":
                        return this.$_roundUp.bind(this);
                    case "ROUND_HALF_UP":
                        return this.$_roundHalfUp.bind(this);
                    case "ROUND_HALF_DOWN":
                        return this.$_roundHalfDown.bind(this);
                    case "ROUND_HALF_EVEN":
                        return this.$_roundHalfEven.bind(this);
                    case "ROUND_CEILING":
                        return this.$_roundCeiling.bind(this);
                    case "ROUND_FLOOR":
                        return this.$_roundFloor.bind(this);
                    case "ROUND_05UP":
                        return this.$_round05Up.bind(this);
                    default:
                        throw new ValueError(`Unknown rounding mode: ${roundingStr}`);
                }
            },
            $rescale(exp, rounding) {
                // Rescale self so that the exponent is exp, using the given rounding mode.
                // Specials are returned without change.
                if (this._is_special) {
                    return _decFromTriple(this._sign, this._int, this._exp, true);
                }
                if (!this.nb$bool()) {
                    // Zero
                    return _decFromTriple(this._sign, "0", exp);
                }

                if (this._exp >= exp) {
                    // Pad with zeros
                    return _decFromTriple(this._sign, this._int + "0".repeat(this._exp - exp), exp);
                }

                // Too many digits; need to round and lose data
                let digits = this._int.length + this._exp - exp;
                let self = this;
                if (digits < 0) {
                    // Replace self with 10^(exp-1) for rounding purposes
                    self = _decFromTriple(this._sign, "1", exp - 1);
                    digits = 0;
                }
                const roundFunc = self.$pickRoundingFunction(rounding);
                const changed = roundFunc(digits);
                let coeff = self._int.slice(0, digits) || "0";
                if (changed === 1) {
                    coeff = (BigInt(coeff) + 1n).toString();
                }
                return _decFromTriple(this._sign, coeff, exp);
            },
        },
    });

    const _from_float = Decimal.tp$getattr(STR.from_float);
    const fromFloat = (x) => pyCall(_from_float, [x]);

    /****** CONTEXT ******/
    const _ContextManager = buildClass(
        decimalMod,
        (_gbl, loc) => {
            loc.__init__ = new pyFunc((self, new_context) => {
                self.new_context = new_context;
                return pyNone;
            });

            loc.__enter__ = new pyFunc((self) => {
                self.saved_context = getContext();
                setContext(self.new_context);
                return self.new_context;
            });

            loc.__exit__ = new pyFunc((self) => {
                setContext(self.saved_context);
                return pyNone;
            });
        },
        "_ContextManager",
        []
    );

    const Context = buildNativeClass("decimal.Context", {
        constructor: function Context(
            prec = 28,
            rounding = ROUND_HALF_EVEN,
            emin = -999999,
            emax = 999999,
            capitals = 1,
            clamp = 0,
            flags = null,
            traps = null
        ) {
            this.$prec = prec;
            this.$rounding = rounding;
            this.$Emin = emin;
            this.$Emax = emax;
            this.$capitals = capitals;
            this.$clamp = clamp;
            // Initialize flags - all signals set to 0
            this.$flags = flags || Object.fromEntries(_signals.map((s) => [s, 0]));
            // Initialize traps - default traps for DivisionByZero, Overflow, InvalidOperation
            this.$traps =
                traps ||
                Object.fromEntries(
                    _signals.map((s) => [s, s === DivisionByZero || s === Overflow || s === InvalidOperation ? 1 : 0])
                );
        },
        slots: {
            tp$new(args, kws) {
                const self = new Context();
                return self;
            },
            $r() {
                const flags = _signals.filter((s) => this.$flags[s]).map((s) => s.prototype.tp$name);
                const traps = _signals.filter((s) => this.$traps[s]).map((s) => s.prototype.tp$name);
                return new pyStr(
                    `Context(prec=${this.$prec}, rounding=${this.$rounding}, Emin=${this.$Emin}, ` +
                        `Emax=${this.$Emax}, capitals=${this.$capitals}, clamp=${this.$clamp}, ` +
                        `flags=[${flags.join(", ")}], traps=[${traps.join(", ")}])`
                );
            },
            tp$getattr: genericGetAttr,
            tp$init(args, kws) {
                const kwList = ["prec", "rounding", "Emin", "Emax", "capitals", "clamp", "flags", "traps"];
                const [prec, rounding, emin, emax, capitals, clamp, flags, traps] = parseArgs(
                    "Context",
                    kwList,
                    args,
                    kws,
                    new Array(8).fill(pyNone)
                );

                // Set defaults from DefaultContext if it exists, otherwise use sensible defaults
                const dc = _currentContext || {
                    $prec: 28,
                    $rounding: ROUND_HALF_EVEN,
                    $Emin: -999999,
                    $Emax: 999999,
                    $capitals: 1,
                    $clamp: 0,
                };

                this.$prec = prec !== pyNone ? (checkInt(prec) ? prec.valueOf() : prec) : dc.$prec;
                this.$rounding = rounding !== pyNone ? rounding : dc.$rounding;
                this.$Emin = emin !== pyNone ? (checkInt(emin) ? emin.valueOf() : emin) : dc.$Emin;
                this.$Emax = emax !== pyNone ? (checkInt(emax) ? emax.valueOf() : emax) : dc.$Emax;
                this.$capitals =
                    capitals !== pyNone ? (checkInt(capitals) ? capitals.valueOf() : capitals) : dc.$capitals;
                this.$clamp = clamp !== pyNone ? (checkInt(clamp) ? clamp.valueOf() : clamp) : dc.$clamp;

                // Initialize flags
                if (flags === pyNone || flags === null) {
                    this.$flags = Object.fromEntries(_signals.map((s) => [s, 0]));
                } else if (flags instanceof pyList || flags instanceof pyTuple) {
                    this.$flags = Object.fromEntries(_signals.map((s) => [s, flags.valueOf().includes(s) ? 1 : 0]));
                } else {
                    // Assume it's a dict-like object
                    this.$flags = Object.fromEntries(_signals.map((s) => [s, 0]));
                    for (const sig of _signals) {
                        if (flags.mp$subscript) {
                            try {
                                this.$flags[sig] = isTrue(flags.mp$subscript(sig)) ? 1 : 0;
                            } catch (e) {
                                // Key not found, leave as 0
                            }
                        }
                    }
                }

                // Initialize traps
                if (traps === pyNone || traps === null) {
                    this.$traps = Object.fromEntries(
                        _signals.map((s) => [
                            s,
                            s === DivisionByZero || s === Overflow || s === InvalidOperation ? 1 : 0,
                        ])
                    );
                } else if (traps instanceof pyList || traps instanceof pyTuple) {
                    this.$traps = Object.fromEntries(_signals.map((s) => [s, traps.valueOf().includes(s) ? 1 : 0]));
                } else {
                    // Assume it's a dict-like object
                    this.$traps = Object.fromEntries(_signals.map((s) => [s, 0]));
                    for (const sig of _signals) {
                        if (traps.mp$subscript) {
                            try {
                                this.$traps[sig] = isTrue(traps.mp$subscript(sig)) ? 1 : 0;
                            } catch (e) {
                                // Key not found, leave as 0
                            }
                        }
                    }
                }
            },
        },
        methods: {
            abs: {
                $meth(x) {
                    x = convertOther(x, true);
                    return _decFromTriple(0, x._int, x._exp, x._is_special);
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return the absolute value of x.\n\n",
            },
            exp: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return e ** x.\n\n",
            },
            ln: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return the natural (base e) logarithm of x.\n\n",
            },
            log10: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return the base 10 logarithm of x.\n\n",
            },
            minus: {
                $meth(x) {
                    x = convertOther(x, true);
                    return _decFromTriple(x._sign ? 0 : 1, x._int, x._exp, x._is_special);
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Minus corresponds to the unary prefix minus operator in Python, but applies\nthe context to the result.\n\n",
            },
            next_minus: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return the largest representable number smaller than x.\n\n",
            },
            next_plus: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return the smallest representable number larger than x.\n\n",
            },
            normalize: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Reduce x to its simplest form. Alias for reduce(x).\n\n",
            },
            plus: {
                $meth(x) {
                    x = convertOther(x, true);
                    return _decFromTriple(x._sign, x._int, x._exp, x._is_special);
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Plus corresponds to the unary prefix plus operator in Python, but applies\nthe context to the result.\n\n",
            },
            to_integral: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Identical to to_integral_value(x).\n\n",
            },
            to_integral_exact: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Round to an integer. Signal if the result is rounded or inexact.\n\n",
            },
            to_integral_value: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Round to an integer.\n\n",
            },
            sqrt: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Square root of a non-negative number to context precision.\n\n",
            },
            add: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    return x.nb$add(y, this);
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return the sum of x and y.\n\n",
            },
            compare: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    // Handle NaN - returns NaN
                    if (x.$isNan() || y.$isNan()) {
                        return _decFromTriple(0, "NaN", 0, true);
                    }
                    // Compare: returns Decimal(-1), Decimal(0), or Decimal(1)
                    if (x.tp$richcompare(y, "Lt") === pyTrue) {
                        return _decFromTriple(1, "1", 0, false); // -1
                    }
                    if (x.tp$richcompare(y, "Eq") === pyTrue) {
                        return _decFromTriple(0, "0", 0, false); // 0
                    }
                    return _decFromTriple(0, "1", 0, false); // 1
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Compare x and y numerically.\n\n",
            },
            compare_signal: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Compare x and y numerically.  All NaNs signal.\n\n",
            },
            divide: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    return x.nb$divide(y, this);
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return x divided by y.\n\n",
            },
            divide_int: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    return x.nb$floor_divide(y, this);
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return x divided by y, truncated to an integer.\n\n",
            },
            divmod: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    return x.nb$divmod(y, this);
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return quotient and remainder of the division x / y.\n\n",
            },
            max: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    // Handle NaN
                    if (x.$isNan() || y.$isNan()) {
                        if (x.$isNan() && y.$isNan()) {
                            return _decFromTriple(0, "NaN", 0, true);
                        }
                        const result = x.$isNan() ? y : x;
                        return _decFromTriple(result._sign, result._int, result._exp, result._is_special);
                    }
                    // Return the larger one (reconstruct to ensure Decimal type, not subclass)
                    const result = x.tp$richcompare(y, "Lt") === pyTrue ? y : x;
                    return _decFromTriple(result._sign, result._int, result._exp, result._is_special);
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Compare the values numerically and return the maximum.\n\n",
            },
            max_mag: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    // Handle NaN
                    if (x.$isNan() || y.$isNan()) {
                        if (x.$isNan() && y.$isNan()) {
                            return _decFromTriple(0, "NaN", 0, true);
                        }
                        const result = x.$isNan() ? y : x;
                        return _decFromTriple(result._sign, result._int, result._exp, result._is_special);
                    }
                    // Compare absolute values
                    const xAbs = _decFromTriple(0, x._int, x._exp, x._is_special);
                    const yAbs = _decFromTriple(0, y._int, y._exp, y._is_special);
                    const result = xAbs.tp$richcompare(yAbs, "Lt") === pyTrue ? y : x;
                    return _decFromTriple(result._sign, result._int, result._exp, result._is_special);
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Compare the values numerically with their sign ignored.\n\n",
            },
            min: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    // Handle NaN
                    if (x.$isNan() || y.$isNan()) {
                        if (x.$isNan() && y.$isNan()) {
                            return _decFromTriple(0, "NaN", 0, true);
                        }
                        const result = x.$isNan() ? y : x;
                        return _decFromTriple(result._sign, result._int, result._exp, result._is_special);
                    }
                    // Return the smaller one (reconstruct to ensure Decimal type, not subclass)
                    const result = x.tp$richcompare(y, "Lt") === pyTrue ? x : y;
                    return _decFromTriple(result._sign, result._int, result._exp, result._is_special);
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Compare the values numerically and return the minimum.\n\n",
            },
            min_mag: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    // Handle NaN
                    if (x.$isNan() || y.$isNan()) {
                        if (x.$isNan() && y.$isNan()) {
                            return _decFromTriple(0, "NaN", 0, true);
                        }
                        const result = x.$isNan() ? y : x;
                        return _decFromTriple(result._sign, result._int, result._exp, result._is_special);
                    }
                    // Compare absolute values, return one with smaller magnitude (reconstruct to ensure Decimal type)
                    const xAbs = _decFromTriple(0, x._int, x._exp, x._is_special);
                    const yAbs = _decFromTriple(0, y._int, y._exp, y._is_special);
                    const result = xAbs.tp$richcompare(yAbs, "Lt") === pyTrue ? x : y;
                    return _decFromTriple(result._sign, result._int, result._exp, result._is_special);
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Compare the values numerically with their sign ignored.\n\n",
            },
            multiply: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    return x.nb$multiply(y, this);
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return the product of x and y.\n\n",
            },
            next_toward: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return the number closest to x, in the direction towards y.\n\n",
            },
            quantize: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return a value equal to x (rounded), having the exponent of y.\n\n",
            },
            remainder: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    return x.nb$remainder(y, this);
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return the remainder from integer division.  The sign of the result,\nif non-zero, is the same as that of the original dividend.\n\n",
            },
            remainder_near: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return x - y * n, where n is the integer nearest the exact value of x / y\n(if the result is 0 then its sign will be the sign of x).\n\n",
            },
            subtract: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    return x.nb$subtract(y, this);
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return the difference between x and y.\n\n",
            },
            power: {
                $meth(a, b, modulo) {
                    a = convertOther(a, true);
                    b = convertOther(b, true);
                    if (modulo !== pyNone) {
                        modulo = convertOther(modulo, true);
                    }
                    return a.nb$power(b, this, modulo);
                },
                $flags: { NamedArgs: ["a", "b", "modulo"], Defaults: [pyNone] },
                $textsig: "($self, /, a, b, modulo=None)",
                $doc: "Compute a**b. If 'a' is negative, then 'b' must be integral. The result\nwill be inexact unless 'a' is integral and the result is finite and can\nbe expressed exactly in 'precision' digits.  In the Python version the\nresult is always correctly rounded, in the C version the result is almost\nalways correctly rounded.\n\nIf modulo is given, compute (a**b) % modulo. The following restrictions\nhold:\n\n    * all three arguments must be integral\n    * 'b' must be nonnegative\n    * at least one of 'a' or 'b' must be nonzero\n    * modulo must be nonzero and less than 10**prec in absolute value\n\n\n",
            },
            fma: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 3, MaxArgs: 3 },
                $textsig: "($self, x, y, z, /)",
                $doc: "Return x multiplied by y, plus z.\n\n",
            },
            Etiny: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return a value equal to Emin - prec + 1, which is the minimum exponent value\nfor subnormal results.  When underflow occurs, the exponent is $set to Etiny.\n\n",
            },
            Etop: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return a value equal to Emax - prec + 1.  This is the maximum exponent\nif the _clamp field of the context is $set to 1 (IEEE clamp mode).  Etop()\nmust not be negative.\n\n",
            },
            radix: {
                $meth() {
                    return new Decimal("10");
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return 10.\n\n",
            },
            is_canonical: {
                $meth(x) {
                    x = convertOther(x, true);
                    return pyTrue; // Decimal instances are always canonical
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return True if x is canonical, False otherwise.\n\n",
            },
            is_finite: {
                $meth(x) {
                    x = convertOther(x, true);
                    return new pyBool(!x._is_special);
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return True if x is finite, False otherwise.\n\n",
            },
            is_infinite: {
                $meth(x) {
                    x = convertOther(x, true);
                    return new pyBool(x._exp === "F");
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return True if x is infinite, False otherwise.\n\n",
            },
            is_nan: {
                $meth(x) {
                    x = convertOther(x, true);
                    return new pyBool(x.$isNan());
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return True if x is a qNaN or sNaN, False otherwise.\n\n",
            },
            is_normal: {
                $meth(x) {
                    x = convertOther(x, true);
                    if (x._is_special || !x.nb$bool()) {
                        return pyFalse;
                    }
                    // For now, return True for non-zero finite numbers
                    // Full implementation would check against Emin
                    return pyTrue;
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return True if x is a normal number, False otherwise.\n\n",
            },
            is_qnan: {
                $meth(x) {
                    x = convertOther(x, true);
                    return new pyBool(x.$isNan() && !x.$isSnan());
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return True if x is a quiet NaN, False otherwise.\n\n",
            },
            is_signed: {
                $meth(x) {
                    x = convertOther(x, true);
                    return new pyBool(x._sign === 1);
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return True if x is negative, False otherwise.\n\n",
            },
            is_snan: {
                $meth(x) {
                    x = convertOther(x, true);
                    return new pyBool(x.$isSnan());
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return True if x is a signaling NaN, False otherwise.\n\n",
            },
            is_subnormal: {
                $meth(x) {
                    x = convertOther(x, true);
                    if (x._is_special || !x.nb$bool()) {
                        return pyFalse;
                    }
                    // Simplified: return False for now (full implementation needs Emin check)
                    return pyFalse;
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return True if x is subnormal, False otherwise.\n\n",
            },
            is_zero: {
                $meth(x) {
                    x = convertOther(x, true);
                    return new pyBool(!x._is_special && x._int === "0");
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return True if x is a zero, False otherwise.\n\n",
            },
            _apply: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: null,
            },
            canonical: {
                $meth(x) {
                    x = convertOther(x, true);
                    return x; // Decimal instances are always canonical
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return a new instance of x.\n\n",
            },
            copy_abs: {
                $meth(x) {
                    x = convertOther(x, true);
                    return _decFromTriple(0, x._int, x._exp, x._is_special);
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return a copy of x with the sign $set to 0.\n\n",
            },
            copy_decimal: {
                $meth(x) {
                    x = convertOther(x, true);
                    return _decFromTriple(x._sign, x._int, x._exp, x._is_special);
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return a copy of Decimal x.\n\n",
            },
            copy_negate: {
                $meth(x) {
                    x = convertOther(x, true);
                    return _decFromTriple(x._sign ? 0 : 1, x._int, x._exp, x._is_special);
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return a copy of x with the sign inverted.\n\n",
            },
            logb: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return the exponent of the magnitude of the operand's MSD.\n\n",
            },
            logical_invert: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Invert all digits of x.\n\n",
            },
            number_class: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Return an indication of the class of x.\n\n",
            },
            to_sci_string: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Convert a number to a string using scientific notation.\n\n",
            },
            to_eng_string: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { OneArg: true },
                $textsig: "($self, x, /)",
                $doc: "Convert a number to a string, using engineering notation.\n\n",
            },
            compare_total: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Compare x and y using their abstract representation.\n\n",
            },
            compare_total_mag: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Compare x and y using their abstract representation, ignoring sign.\n\n",
            },
            copy_sign: {
                $meth(x, y) {
                    x = convertOther(x, true);
                    y = convertOther(y, true);
                    return _decFromTriple(y._sign, x._int, x._exp, x._is_special);
                },
                $flags: { NamedArgs: ["x", "y"] },
                $textsig: "($self, x, y, /)",
                $doc: "Copy the sign from y to x.\n\n",
            },
            logical_and: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Digit-wise and of x and y.\n\n",
            },
            logical_or: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Digit-wise or of x and y.\n\n",
            },
            logical_xor: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Digit-wise xor of x and y.\n\n",
            },
            rotate: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return a copy of x, rotated by y places.\n\n",
            },
            same_quantum: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return True if the two operands have the same exponent.\n\n",
            },
            scaleb: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return the first operand after adding the second value to its exp.\n\n",
            },
            shift: {
                $meth() {
                    notImplementedYet();
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: "($self, x, y, /)",
                $doc: "Return a copy of x, shifted by y places.\n\n",
            },
            clear_flags: {
                $meth() {
                    for (const sig of _signals) {
                        this.$flags[sig] = 0;
                    }
                    return pyNone;
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Reset all flags to False.\n\n",
            },
            clear_traps: {
                $meth() {
                    for (const sig of _signals) {
                        this.$traps[sig] = 0;
                    }
                    return pyNone;
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Set all traps to False.\n\n",
            },
            __copy__: {
                $meth() {
                    return this.$copy();
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
            __reduce__: {
                $meth() {
                    const flags = new pyList(_signals.filter((s) => this.$flags[s]));
                    const traps = new pyList(_signals.filter((s) => this.$traps[s]));
                    return new pyTuple([
                        Context,
                        new pyTuple([
                            new pyInt(this.$prec),
                            this.$rounding,
                            new pyInt(this.$Emin),
                            new pyInt(this.$Emax),
                            new pyInt(this.$capitals),
                            new pyInt(this.$clamp),
                            flags,
                            traps,
                        ]),
                    ]);
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
            copy: {
                $meth() {
                    const nc = this.$copy();
                    nc.$flags = Object.fromEntries(_signals.map((s) => [s, 0]));
                    return nc;
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: "Return a duplicate of the context with all flags cleared.\n\n",
            },
            create_decimal: {
                $meth(num) {
                    if (num === undefined) {
                        num = STR["0"];
                    }
                    // Create a Decimal using this context
                    if (num instanceof Decimal) {
                        return pyCall(Decimal, [num]);
                    }
                    return pyCall(Decimal, [num, this]);
                },
                $flags: { MinArgs: 0, MaxArgs: 1 },
                $textsig: '($self, num="0", /)',
                $doc: "Create a new Decimal instance from num, using self as the context. Unlike the\nDecimal constructor, this function observes the context limits.\n\n",
            },
            create_decimal_from_float: {
                $meth(f) {
                    // Create a Decimal from a float using this context
                    // Use from_float to create the Decimal
                    return fromFloat(f);
                },
                $flags: { OneArg: true },
                $textsig: "($self, f, /)",
                $doc: "Create a new Decimal instance from float f.  Unlike the Decimal.from_float()\nclass $method, this function observes the context limits.\n\n",
            },
        },
        classmethods: {},
        getsets: {
            prec: {
                $get() {
                    return new pyInt(this.$prec);
                },
                $set(value) {
                    if (!checkInt(value)) {
                        throw new TypeError("prec must be an integer");
                    }
                    const v = value.valueOf();
                    if (v < 1) {
                        throw new ValueError("prec must be >= 1");
                    }
                    this.$prec = v;
                },
                $doc: null,
            },
            Emax: {
                $get() {
                    return new pyInt(this.$Emax);
                },
                $set(value) {
                    if (!checkInt(value)) {
                        throw new TypeError("Emax must be an integer");
                    }
                    this.$Emax = value.valueOf();
                },
                $doc: null,
            },
            Emin: {
                $get() {
                    return new pyInt(this.$Emin);
                },
                $set(value) {
                    if (!checkInt(value)) {
                        throw new TypeError("Emin must be an integer");
                    }
                    this.$Emin = value.valueOf();
                },
                $doc: null,
            },
            rounding: {
                $get() {
                    return this.$rounding;
                },
                $set(value) {
                    if (!_rounding_modes.some((m) => eq(m, value))) {
                        throw new TypeError("invalid rounding mode");
                    }
                    this.$rounding = value;
                },
                $doc: null,
            },
            capitals: {
                $get() {
                    return new pyInt(this.$capitals);
                },
                $set(value) {
                    if (!checkInt(value)) {
                        throw new TypeError("capitals must be an integer");
                    }
                    const v = value.valueOf();
                    if (v !== 0 && v !== 1) {
                        throw new ValueError("capitals must be 0 or 1");
                    }
                    this.$capitals = v;
                },
                $doc: null,
            },
            clamp: {
                $get() {
                    return new pyInt(this.$clamp);
                },
                $set(value) {
                    if (!checkInt(value)) {
                        throw new TypeError("clamp must be an integer");
                    }
                    const v = value.valueOf();
                    if (v !== 0 && v !== 1) {
                        throw new ValueError("clamp must be 0 or 1");
                    }
                    this.$clamp = v;
                },
                $doc: null,
            },
            flags: {
                $get() {
                    return new _SignalDict(this, "flags");
                },
                $set(value) {
                    // Accept a dict-like or list-like object
                    if (value instanceof pyList || value instanceof pyTuple) {
                        this.$flags = Object.fromEntries(_signals.map((s) => [s, value.valueOf().includes(s) ? 1 : 0]));
                    } else {
                        for (const sig of _signals) {
                            if (value.mp$subscript) {
                                try {
                                    this.$flags[sig] = isTrue(value.mp$subscript(sig)) ? 1 : 0;
                                } catch (e) {
                                    // Key not found
                                }
                            }
                        }
                    }
                },
                $doc: null,
            },
            traps: {
                $get() {
                    return new _SignalDict(this, "traps");
                },
                $set(value) {
                    // Accept a dict-like or list-like object
                    if (value instanceof pyList || value instanceof pyTuple) {
                        this.$traps = Object.fromEntries(_signals.map((s) => [s, value.valueOf().includes(s) ? 1 : 0]));
                    } else {
                        for (const sig of _signals) {
                            if (value.mp$subscript) {
                                try {
                                    this.$traps[sig] = isTrue(value.mp$subscript(sig)) ? 1 : 0;
                                } catch (e) {
                                    // Key not found
                                }
                            }
                        }
                    }
                },
                $doc: null,
            },
        },
        proto: {
            $copy() {
                const nc = new Context(
                    this.$prec,
                    this.$rounding,
                    this.$Emin,
                    this.$Emax,
                    this.$capitals,
                    this.$clamp,
                    { ...this.$flags },
                    { ...this.$traps }
                );
                return nc;
            },
        },
    });

    // _SignalDict - dict-like object for flags/traps
    const _SignalDict = buildNativeClass("decimal._SignalDict", {
        constructor: function _SignalDict(context, attrName) {
            this.$context = context;
            this.$attrName = attrName; // "flags" or "traps"
        },
        slots: {
            tp$getattr: genericGetAttr,
            $r() {
                const data = this.$attrName === "flags" ? this.$context.$flags : this.$context.$traps;
                const items = _signals.map((s) => `<class 'decimal.${s.prototype.tp$name}'>: ${data[s]}`);
                return new pyStr(`{${items.join(", ")}}`);
            },
            mp$subscript(key) {
                const data = this.$attrName === "flags" ? this.$context.$flags : this.$context.$traps;
                // Find matching signal
                for (const sig of _signals) {
                    if (sig === key || (key.ob$type && key.ob$type === sig)) {
                        return data[sig] ? pyTrue : pyFalse;
                    }
                }
                throw new KeyError(key);
            },
            mp$ass_subscript(key, value) {
                const data = this.$attrName === "flags" ? this.$context.$flags : this.$context.$traps;
                // Find matching signal
                for (const sig of _signals) {
                    if (sig === key || (key.ob$type && key.ob$type === sig)) {
                        data[sig] = isTrue(value) ? 1 : 0;
                        return;
                    }
                }
                throw new KeyError(key);
            },
            sq$contains(key) {
                for (const sig of _signals) {
                    if (sig === key || (key.ob$type && key.ob$type === sig)) {
                        return true;
                    }
                }
                return false;
            },
            tp$iter() {
                return new pyList(_signals).tp$iter();
            },
            sq$length() {
                return _signals.length;
            },
            tp$richcompare(other, op) {
                if (op !== "Eq" && op !== "NotEq") {
                    return pyNotImplemented;
                }
                // Check if other is also a _SignalDict
                if (!(other instanceof _SignalDict)) {
                    // Try to compare with a dict
                    if (other instanceof pyDict) {
                        const myData = this.$attrName === "flags" ? this.$context.$flags : this.$context.$traps;
                        // Check all signals match
                        for (const sig of _signals) {
                            const myVal = myData[sig] ? pyTrue : pyFalse;
                            const otherVal = other.mp$subscript(sig);
                            if (otherVal === undefined) {
                                return op === "Eq" ? pyFalse : pyTrue;
                            }
                            if (!richCompareBool(myVal, otherVal, "Eq")) {
                                return op === "Eq" ? pyFalse : pyTrue;
                            }
                        }
                        // Also check lengths match
                        if (other.sq$length() !== _signals.length) {
                            return op === "Eq" ? pyFalse : pyTrue;
                        }
                        return op === "Eq" ? pyTrue : pyFalse;
                    }
                    return pyNotImplemented;
                }
                // Compare two _SignalDicts
                const myData = this.$attrName === "flags" ? this.$context.$flags : this.$context.$traps;
                const otherData = other.$attrName === "flags" ? other.$context.$flags : other.$context.$traps;
                for (const sig of _signals) {
                    if ((myData[sig] ? 1 : 0) !== (otherData[sig] ? 1 : 0)) {
                        return op === "Eq" ? pyFalse : pyTrue;
                    }
                }
                return op === "Eq" ? pyTrue : pyFalse;
            },
        },
        methods: {
            keys: {
                $meth() {
                    return new pyList(_signals);
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
            values: {
                $meth() {
                    const data = this.$attrName === "flags" ? this.$context.$flags : this.$context.$traps;
                    return new pyList(_signals.map((s) => (data[s] ? pyTrue : pyFalse)));
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
            items: {
                $meth() {
                    const data = this.$attrName === "flags" ? this.$context.$flags : this.$context.$traps;
                    return new pyList(_signals.map((s) => new pyTuple([s, data[s] ? pyTrue : pyFalse])));
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
            copy: {
                $meth() {
                    const data = this.$attrName === "flags" ? this.$context.$flags : this.$context.$traps;
                    const d = new pyDict();
                    for (const sig of _signals) {
                        d.mp$ass_subscript(sig, data[sig] ? pyTrue : pyFalse);
                    }
                    return d;
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: null,
            },
        },
    });

    // Context management - current context storage
    let _currentContext = null;

    // getcontext - returns the current context, creating one if necessary
    function getContext() {
        if (_currentContext === null) {
            _currentContext = new Context();
        }
        return _currentContext;
    }

    // setContext - JS helper to set the current context
    function setContext(context) {
        if (!(context instanceof Context)) {
            throw new TypeError("argument must be a Context");
        }
        _currentContext = context;
    }

    const getcontext = new pyFunc(function getcontext() {
        return getContext();
    });

    // setcontext - sets the current context
    const setcontext = new pyFunc(function setcontext(context) {
        setContext(context);
        return pyNone;
    });

    // localcontext - context manager for temporary context
    const localcontext = new pyFunc(function localcontext(ctx) {
        let new_context;
        if (ctx === undefined || ctx === pyNone) {
            new_context = getContext().$copy();
        } else {
            new_context = ctx.$copy();
        }
        return pyCall(_ContextManager, [new_context]);
    });

    // Create DefaultContext, BasicContext, ExtendedContext
    // These need to be created after Context is defined
    const DefaultContext = new Context(
        28, // prec
        ROUND_HALF_EVEN, // rounding
        -999999, // Emin
        999999, // Emax
        1, // capitals
        0, // clamp
        Object.fromEntries(_signals.map((s) => [s, 0])), // flags - all 0
        Object.fromEntries(
            _signals.map((s) => [s, s === DivisionByZero || s === Overflow || s === InvalidOperation ? 1 : 0])
        ) // traps
    );

    const BasicContext = new Context(
        9, // prec
        ROUND_HALF_UP, // rounding
        -999999, // Emin
        999999, // Emax
        1, // capitals
        0, // clamp
        Object.fromEntries(_signals.map((s) => [s, 0])), // flags - all 0
        Object.fromEntries(
            _signals.map((s) => [
                s,
                s === DivisionByZero || s === Overflow || s === InvalidOperation || s === Clamped || s === Underflow
                    ? 1
                    : 0,
            ])
        ) // traps
    );

    const ExtendedContext = new Context(
        9, // prec
        ROUND_HALF_EVEN, // rounding
        -999999, // Emin
        999999, // Emax
        1, // capitals
        0, // clamp
        Object.fromEntries(_signals.map((s) => [s, 0])), // flags - all 0
        Object.fromEntries(_signals.map((s) => [s, 0])) // traps - all 0
    );

    // Initialize the default context
    _currentContext = DefaultContext.$copy();

    class _WorkRep {
        constructor(value = null) {
            if (value === null) {
                this.sign = null;
                this.int = 0;
                this.exp = null;
            } else if (value instanceof Decimal) {
                this.sign = value._sign;
                this.int = Number(value._int);
                this.exp = value._exp;
            } else {
                this.sign = value[0];
                this.int = value[1];
                this.exp = value[2];
            }
        }
    }

    // ##### crud for parsing strings #############################################
    // #
    // # Regular expression used for parsing numeric strings.  Additional
    // # comments:
    // #
    // # 1. Uncomment the two '\s*' lines to allow leading and/or trailing
    // # whitespace.  But note that the specification disallows whitespace in
    // # a numeric string.
    // #
    // # 2. For finite numbers (not infinities and NaNs) the body of the
    // # number between the optional sign and the optional exponent must have
    // # at least one decimal digit, possibly after the decimal point.  The
    // # lookahead expression '(?=\d|\.\d)' checks this.

    const _PARSE_STR =
        /^\s*(?<sign>[+-])?((?=\d|\.\d)(?<int>\d*)(\.(?<frac>\d*))?(E(?<exp>[-+]?\d+))?|Inf(inity)?|(?<signal>s)?NaN(?<diag>\d*))\s*$/i;
    const _parser = _PARSE_STR.exec.bind(_PARSE_STR);

    // ##### Useful Constants (internal use only) ################################
    const _Infinity = new Decimal("0", 0, "F", true);
    const _NegativeInfinity = new Decimal("0", 1, "F", true);
    const _NaN = Decimal("", 0, "n", true);
    const _Zero = Decimal("0", 0, 0, false);
    const _One = Decimal("1", 0, 0, false);
    const _NegativeOne = Decimal("1", 1, 0, false);

    const _SignedInfinity = new pyTuple([_Infinity, _NegativeInfinity]);

    // these should all be part of sys.hash_info
    const _PyHASH_MODULUS = new pyInt("2305843009213693951");
    // # _PyHASH_10INV is the inverse of 10 modulo the prime _PyHASH_MODULUS
    const _PyHASH_10INV = new pyInt("2075258708292324556");
    const _PyHASH_NaN = new pyFloat(Number.NaN).tp$hash();
    const _PyHASH_INF_NEG = new pyFloat(Number.NEGATIVE_INFINITY).tp$hash();
    const _PyHASH_INF_POS = new pyFloat(Number.POSITIVE_INFINITY).tp$hash();

    Object.assign(decimalMod, {
        Decimal,
        Context,

        // # Named tuple representation
        // DecimalTuple,

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
        MAX_PREC: new pyInt(MAX_PREC),
        MAX_EMAX: new pyInt(MAX_EMAX),
        MIN_EMIN: new pyInt(MIN_EMIN),
        MIN_ETINY: new pyInt(MIN_ETINY),

        // # C version: compile time choice that enables the thread local context (deprecated, now always true)
        HAVE_THREADS: pyTrue,

        // # C version: compile time choice that enables the coroutine local context
        HAVE_CONTEXTVAR: pyTrue,
    });

    return decimalMod;
}
