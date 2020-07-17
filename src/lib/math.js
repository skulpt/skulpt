var $builtinmodule = function (name) {
    var mod = {};

    // Mathematical Constants
    mod.pi = new Sk.builtin.float_(Math.PI);
    mod.e = new Sk.builtin.float_(Math.E);
    mod.tau = new Sk.builtin.float_(2 * Math.PI);
    mod.nan = new Sk.builtin.float_(NaN);
    mod.inf = new Sk.builtin.float_(Infinity);

    // Number-theoretic and representation functions
    mod.ceil = new Sk.builtin.func(function ceil(x) {
        Sk.builtin.pyCheckArgsLen("ceil", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("", "real number", Sk.builtin.checkNumber(x));
        const _x = Sk.builtin.asnum$(x);
        if (Sk.__future__.ceil_floor_int) {
            return new Sk.builtin.int_(Math.ceil(_x));
        }
        return new Sk.builtin.float_(Math.ceil(_x));
    });

    mod.comb = new Sk.builtin.func(function (x, y) {
        throw new Sk.builtin.NotImplementedError("math.comb() is not yet implemented in Skulpt");
    });

    function get_sign(n) {
        //deals with signed zeros
        // returns -1 or +1 for the sign
        if (n) {
            n = n < 0 ? -1 : 1;
        } else {
            n = 1 / n < 0 ? -1 : 1;
        }
        return n;
    }

    mod.copysign = new Sk.builtin.func(function copysign(x, y) {
        // returns abs of x with sign y
        // does sign x * sign y * x which is equivalent
        Sk.builtin.pyCheckArgsLen("copysign", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        const _y = Sk.builtin.asnum$(y);
        const _x = Sk.builtin.asnum$(x);
        const sign_x = get_sign(_x);
        const sign_y = get_sign(_y);
        const sign = sign_x * sign_y;

        return new Sk.builtin.float_(_x * sign);
    });

    mod.fabs = new Sk.builtin.func(function fabs(x) {
        Sk.builtin.pyCheckArgsLen("fabs", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        let _x = Sk.builtin.asnum$(new Sk.builtin.float_(x)); //should raise OverflowError for large ints to floats
        _x = Math.abs(_x);

        return new Sk.builtin.float_(_x);
    });

    const MAX_SAFE_INTEGER_FACTORIAL = 18; // 19! > Number.MAX_SAFE_INTEGER
    mod.factorial = new Sk.builtin.func(function factorial(x) {
        Sk.builtin.pyCheckArgsLen("factorial", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        let _x = Sk.builtin.asnum$(x);
        x = Math.floor(_x);

        if (x != _x) {
            throw new Sk.builtin.ValueError("factorial() only accepts integral values");
        }
        if (x < 0) {
            throw new Sk.builtin.ValueError("factorial() not defined for negative numbers");
        }

        let r = 1;
        for (let i = 2; i <= x && i <= MAX_SAFE_INTEGER_FACTORIAL; i++) {
            r *= i;
        }
        if (x <= MAX_SAFE_INTEGER_FACTORIAL) {
            return new Sk.builtin.int_(r);
        } else {
            // for big numbers (19 and larger) we first calculate 18! above
            // and then use bigintegers to continue the process.

            // This is inefficient as hell, but it produces correct answers.

            // promotes an integer to a biginteger
            function bigup(number) {
                var n = Sk.builtin.asnum$nofloat(number);
                return new Sk.builtin.biginteger(number);
            }

            r = bigup(r);
            for (var i = MAX_SAFE_INTEGER_FACTORIAL + 1; i <= x; i++) {
                var i_bigup = bigup(i);
                r = r.multiply(i_bigup);
            }
            return new Sk.builtin.lng(r);
        }
    });

    mod.floor = new Sk.builtin.func(function floor(x) {
        Sk.builtin.pyCheckArgsLen("floor", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        if (Sk.__future__.ceil_floor_int) {
            return new Sk.builtin.int_(Math.floor(Sk.builtin.asnum$(x)));
        }

        return new Sk.builtin.float_(Math.floor(Sk.builtin.asnum$(x)));
    });

    mod.fmod = new Sk.builtin.func(function fmod(x, y) {
        Sk.builtin.pyCheckArgsLen("fmod", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        const _x = Sk.builtin.asnum$(new Sk.builtin.float_(x));
        const _y = Sk.builtin.asnum$(new Sk.builtin.float_(y)); //should raise OverFlow for large ints to floats

        if ((_y == Infinity || _y == -Infinity) && isFinite(_x)) {
            return new Sk.builtin.float_(_x);
        }
        const r = _x % _y;
        if (isNaN(r)) {
            if (!isNaN(_x) && !isNaN(_y)) {
                throw new Sk.builtin.ValueError("math domain error");
            }
        }
        return new Sk.builtin.float_(r);
    });

    mod.frexp = new Sk.builtin.func(function frexp(x) {
        //  algorithm taken from https://locutus.io/c/math/frexp/
        Sk.builtin.pyCheckArgsLen("frexp", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        const arg = Sk.builtin.asnum$(x);
        const res = [arg, 0];

        if (arg !== 0 && Number.isFinite(arg)) {
            const absArg = Math.abs(arg);
            let exp = Math.max(-1023, Math.floor(Math.log2(absArg)) + 1);
            let m = absArg * Math.pow(2, -exp);
            // These while loops compensate for rounding errors that sometimes occur because of ECMAScript's Math.log2's undefined precision
            // and also works around the issue of Math.pow(2, -exp) === Infinity when exp <= -1024
            while (m < 0.5) {
                m *= 2;
                exp--;
            }
            while (m >= 1) {
                m *= 0.5;
                exp++;
            }
            if (arg < 0) {
                m = -m;
            }
            res[0] = m;
            res[1] = exp;
        }
        res[0] = new Sk.builtin.float_(res[0]);
        res[1] = new Sk.builtin.int_(res[1]);
        return new Sk.builtin.tuple(res);
    });

    mod.fsum = new Sk.builtin.func(function fsum(iter) {
        // algorithm from https://code.activestate.com/recipes/393090/
        // as well as https://github.com/brython-dev/brython/blob/master/www/src/libs/math.js
        Sk.builtin.pyCheckArgsLen("fsum", arguments.length, 1, 1);
        if (!Sk.builtin.checkIterable(iter)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter) + "' object is not iterable");
        }

        let partials = [];
        iter = Sk.abstr.iter(iter);
        let i, hi, lo;
        for (let x = iter.tp$iternext(); x !== undefined; x = iter.tp$iternext()) {
            Sk.builtin.pyCheckType("", "real number", Sk.builtin.checkNumber(x));
            i = 0;
            x = Sk.builtin.asnum$(new Sk.builtin.float_(x));
            for (let j = 0, len = partials.length; j < len; j++) {
                let y = partials[j];
                if (Math.abs(x) < Math.abs(y)) {
                    let temp = x;
                    x = y;
                    y = temp;
                }
                hi = x + y;
                lo = y - (hi - x);
                if (lo) {
                    partials[i] = lo;
                    i++;
                }
                x = hi;
            }
            partials = partials.slice(0, i).concat([x]);
        }
        const sum = partials.reduce(function (a, b) {
            return a + b;
        }, 0);

        return new Sk.builtin.float_(sum);
    });

    mod.gcd = new Sk.builtin.func(function gcd(a, b) {
        Sk.builtin.pyCheckArgsLen("gcd", arguments.length, 2, 2);
        // non ints not allowed in python 3.7.x
        Sk.builtin.pyCheckType("a", "integer", Sk.builtin.checkInt(a));
        Sk.builtin.pyCheckType("b", "integer", Sk.builtin.checkInt(b));

        function _gcd(a, b) {
            if (b == 0) {
                return a;
            }
            return _gcd(b, a % b);
        }

        function _biggcd(a, b) {
            if (b.trueCompare(Sk.builtin.biginteger.ZERO) === 0) {
                return a;
            }
            return _biggcd(b, a.remainder(b));
        }

        if (a instanceof Sk.builtin.lng || b instanceof Sk.builtin.lng) {
            let _a = Sk.builtin.lng(a).biginteger;
            let _b = Sk.builtin.lng(b).biginteger;
            let res = _biggcd(_a, _b);
            res = res.abs(); // python only returns positive gcds

            return new Sk.builtin.lng(res);
        } else {
            let _a = Math.abs(Sk.builtin.asnum$(a));
            let _b = Math.abs(Sk.builtin.asnum$(b));
            let res = _gcd(_a, _b);
            res = res < 0 ? -res : res; // python only returns positive gcds
            return new Sk.builtin.int_(res);
        }
    });

    function isclose(a, b, rel_tol, abs_tol) {
        Sk.builtin.pyCheckArgsLen("isclose", arguments.length, 2, 4, true);
        Sk.builtin.pyCheckType("a", "number", Sk.builtin.checkNumber(a));
        Sk.builtin.pyCheckType("b", "number", Sk.builtin.checkNumber(b));
        Sk.builtin.pyCheckType("rel_tol", "number", Sk.builtin.checkNumber(rel_tol));
        Sk.builtin.pyCheckType("abs_tol", "number", Sk.builtin.checkNumber(abs_tol));

        const _a = Sk.builtin.asnum$(a);
        const _b = Sk.builtin.asnum$(b);
        const _rel_tol = Sk.builtin.asnum$(rel_tol);
        const _abs_tol = Sk.builtin.asnum$(abs_tol);

        if (_rel_tol < 0.0 || _abs_tol < 0.0) {
            throw new Sk.builtin.ValueError("tolerances must be non-negative");
        }
        if (_a == _b) {
            return Sk.builtin.bool.true$;
        }

        if (_a == Infinity || _a == -Infinity || _b == Infinity || _b == -Infinity) {
            // same sign infinities were caught in previous test
            return Sk.builtin.bool.false$;
        }
        const diff = Math.abs(_b - _a);
        const res = diff <= Math.abs(_rel_tol * _b) || diff <= Math.abs(_rel_tol * _a) || diff <= _abs_tol;
        return new Sk.builtin.bool(res);
    };

    isclose.co_varnames = ["a", "b", "rel_tol", "abs_tol"];
    isclose.co_argcount = 2;
    isclose.co_kwonlyargcount = 2;
    isclose.$kwdefs = [1e-9, 0.0];

    mod.isclose = new Sk.builtin.func(isclose);

    mod.isfinite = new Sk.builtin.func(function isfinite(x) {
        Sk.builtin.pyCheckArgsLen("isfinite", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        const _x = Sk.builtin.asnum$(x);
        if (Sk.builtin.checkInt(x)) {
            return Sk.builtin.bool.true$; //deals with big integers returning False
        } else if (isFinite(_x)) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.bool.false$;
        }
    });

    mod.isinf = new Sk.builtin.func(function isinf(x) {
        /* Return True if x is infinite or nan, and False otherwise. */
        Sk.builtin.pyCheckArgsLen("isinf", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        const _x = Sk.builtin.asnum$(x);
        if (Sk.builtin.checkInt(x)) {
            return Sk.builtin.bool.false$; //deals with big integers returning True
        } else if (isFinite(_x) || isNaN(_x)) {
            return Sk.builtin.bool.false$;
        } else {
            return Sk.builtin.bool.true$;
        }
    });

    mod.isnan = new Sk.builtin.func(function isnan(x) {
        // Return True if x is a NaN (not a number), and False otherwise.
        Sk.builtin.pyCheckArgsLen("isnan", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "float", Sk.builtin.checkFloat(x));

        const _x = Sk.builtin.asnum$(x);
        if (isNaN(_x)) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.bool.false$;
        }
    });

    mod.isqrt = new Sk.builtin.func(function issqrt(x) {
        throw new Sk.builtin.NotImplementedError("math.isqrt() is not yet implemented in Skulpt");
    });

    mod.ldexp = new Sk.builtin.func(function ldexp(x, i) {
        // return x * (2**i)
        Sk.builtin.pyCheckArgsLen("ldexp", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("i", "integer", Sk.builtin.checkInt(i));

        const _x = Sk.builtin.asnum$(new Sk.builtin.float_(x));
        const _i = Sk.builtin.asnum$(i);

        if (_x == Infinity || _x == -Infinity || _x == 0 || isNaN(_x)) {
            return x;
        }
        const res = _x * Math.pow(2, _i);
        if (!isFinite(res)) {
            throw new Sk.builtin.OverflowError("math range error");
        }
        return new Sk.builtin.float_(res);
    });

    mod.modf = new Sk.builtin.func(function modf(x) {
        Sk.builtin.pyCheckArgsLen("modf", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        let _x = Sk.builtin.asnum$(x);
        if (!isFinite(_x)) {
            //special cases
            if (_x == Infinity) {
                return new Sk.builtin.tuple([new Sk.builtin.float_(0.0), new Sk.builtin.float_(_x)]);
            } else if (_x == -Infinity) {
                return new Sk.builtin.tuple([new Sk.builtin.float_(-0.0), new Sk.builtin.float_(_x)]);
            } else if (isNaN(_x)) {
                return new Sk.builtin.tuple([new Sk.builtin.float_(_x), new Sk.builtin.float_(_x)]);
            }
        }
        const sign = get_sign(_x);
        _x = Math.abs(_x);
        const i = sign * Math.floor(_x); //integer part
        const d = sign * (_x - Math.floor(_x)); //decimal part

        return new Sk.builtin.tuple([new Sk.builtin.float_(d), new Sk.builtin.float_(i)]);
    });

    mod.perm = new Sk.builtin.func(function perm(x) {
        throw new Sk.builtin.NotImplementedError("math.perm() is not yet implemented in Skulpt");
    });

    mod.prod = new Sk.builtin.func(function prod(x) {
        throw new Sk.builtin.NotImplementedError("math.prod() is not yet implemented in Skulpt");
    });

    mod.remainder = new Sk.builtin.func(function remainder(x, y) {
        // as per cpython algorithm see cpython for details
        Sk.builtin.pyCheckArgsLen("reamainder", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
        _x = Sk.builtin.asnum$(new Sk.builtin.float_(x));
        _y = Sk.builtin.asnum$(new Sk.builtin.float_(y));

        // deal with most common cases first
        if (isFinite(_x) && isFinite(_y)) {
            let absx, absy, c, m, r;
            if (_y == 0.0) {
                throw new Sk.builtin.ValueError("math domain error");
            }
            absx = Math.abs(_x);
            absy = Math.abs(_y);
            m = absx % absy;
            c = absy - m;
            if (m < c) {
                r = m;
            } else if (m > c) {
                r = -c;
            } else {
                if (m != c) {
                    throw new Sk.builtin.AssertionError();
                }
                r = m - 2.0 * ((0.5 * (absx - m)) % absy);
            }
            return new Sk.builtin.float_(get_sign(_x) * r);
        }
        /* Special values. */
        if (isNaN(_x)) {
            return x;
        }
        if (isNaN(_y)) {
            return y;
        }
        if (_x == Infinity || _x == -Infinity) {
            throw new Sk.builtin.ValueError("math domain error");
        }
        if (!(_y == Infinity || _y == -Infinity)) {
            throw new Sk.builtin.AssertionError();
        }
        return new Sk.builtin.float_(_x);
    });

    mod.trunc = new Sk.builtin.func(function trunc(x) {
        Sk.builtin.pyCheckArgsLen("trunc", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        if (Sk.builtin.checkInt(x)) {
            return x; //deals with large ints being passed
        }
        return new Sk.builtin.int_(Sk.builtin.asnum$(x) | 0);
    });

    // Power and logarithmic functions
    mod.exp = new Sk.builtin.func(function exp(x) {
        Sk.builtin.pyCheckArgsLen("exp", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        const _x = Sk.builtin.asnum$(new Sk.builtin.float_(x));
        if (_x == Infinity || _x == -Infinity || isNaN(_x)) {
            return new Sk.builtin.float_(Math.exp(_x));
        }
        const res = Math.exp(_x);
        if (!isFinite(res)) {
            throw new Sk.builtin.OverflowError("math range error");
        }

        return new Sk.builtin.float_(res);
    });

    mod.expm1 = new Sk.builtin.func(function expm1(x) {
        // as per python docs this implements an algorithm for evaluating exp(x) - 1
        // for smaller values of x
        Sk.builtin.pyCheckArgsLen("expm1", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        const _x = Sk.builtin.asnum$(x);

        if (Math.abs(_x) < 0.7) {
            const _u = Math.exp(_x);
            if (_u == 1.0) {
                return new Sk.builtin.float_(_x);
            } else {
                const res = ((_u - 1.0) * _x) / Math.log(_u);
                return new Sk.builtin.float_(res);
            }
        } else {
            const res = Math.exp(_x) - 1.0;
            return new Sk.builtin.float_(res);
        }
    });

    mod.log = new Sk.builtin.func(function log(x, base) {
        Sk.builtin.pyCheckArgsLen("log", arguments.length, 1, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        let _x = Sk.builtin.asnum$(x);
        let _base, res;
        if (_x <= 0) {
            throw new Sk.builtin.ValueError("math domain error");
        }
        if (base === undefined) {
            _base = Math.E;
        } else {
            Sk.builtin.pyCheckType("base", "number", Sk.builtin.checkNumber(base));
            _base = Sk.builtin.asnum$(base);
        }

        if (_base <= 0) {
            throw new Sk.builtin.ValueError("math domain error");
        } else if (Sk.builtin.checkFloat(x) || _x < Number.MAX_SAFE_INTEGER) {
            res = Math.log(_x) / Math.log(_base);
        } else {
            //int that is larger than max safe integer
            // use idea x = 123456789 = .123456789 * 10**9
            // log(x)  = 9 * log(10) + log(.123456789)
            _x = new Sk.builtin.str(x).$jsstr();
            const digits = _x.length;
            const decimal = parseFloat("0." + _x);
            res = (digits * Math.log(10) + Math.log(decimal)) / Math.log(_base);
        }
        return new Sk.builtin.float_(res);
    });

    mod.log1p = new Sk.builtin.func(function log1p(x) {
        // as per python docs this is an algorithm for evaluating log 1+x (base e)
        // designed to be more accurate close to 0
        Sk.builtin.pyCheckArgsLen("log1p", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        const _x = Sk.builtin.asnum$(new Sk.builtin.float_(x));

        if (_x <= -1.0) {
            throw new Sk.builtin.ValueError("math domain error");
        } else if (_x == 0) {
            return new Sk.builtin.float_(_x); // respects log1p(-0.0) return -0.0
        } else if (Math.abs(_x) < Number.EPSILON / 2) {
            return new Sk.builtin.float_(_x);
        } else if (-0.5 <= _x && _x <= 1) {
            const _y = 1 + _x;
            const res = Math.log(_y) - (_y - 1 - _x) / _y;
            return new Sk.builtin.float_(res);
        } else {
            const res = Math.log(1 + _x);
            return new Sk.builtin.float_(res);
        }
    });

    mod.log2 = new Sk.builtin.func(function log2(x) {
        Sk.builtin.pyCheckArgsLen("log2", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        let _x = Sk.builtin.asnum$(x);
        let res;
        if (_x < 0) {
            throw new Sk.builtin.ValueError("math domain error");
        } else if (Sk.builtin.checkFloat(x) || _x < Number.MAX_SAFE_INTEGER) {
            res = Math.log2(_x);
        } else {
            //int that is larger than max safe integer
            // use idea x = 123456789 = .123456789 * 10**9
            // log2(x)  = 9 * log2(10) + log2(.123456789)
            _x = new Sk.builtin.str(x).$jsstr();
            const digits = _x.length;
            const decimal = parseFloat("0." + _x);
            res = digits * Math.log2(10) + Math.log2(decimal);
        }
        return new Sk.builtin.float_(res);
    });

    mod.log10 = new Sk.builtin.func(function log10(x) {
        Sk.builtin.pyCheckArgsLen("log10", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        let _x = Sk.builtin.asnum$(x);
        let res;
        if (_x < 0) {
            throw new Sk.builtin.ValueError("math domain error");
        } else if (Sk.builtin.checkFloat(x) || _x < Number.MAX_SAFE_INTEGER) {
            res = Math.log10(_x);
        } else {
            //int that is larger than max safe integer
            // use idea x = 123456789 = .123456789 * 10**9
            // log10(x)  = 9 + log10(.123456789)
            _x = new Sk.builtin.str(x).$jsstr();
            const digits = _x.length;
            const decimal = parseFloat("0." + _x);
            res = digits + Math.log10(decimal);
        }
        return new Sk.builtin.float_(res);
    });

    mod.pow = new Sk.builtin.func(function pow(x, y) {
        Sk.builtin.pyCheckArgsLen("pow", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        const _x = Sk.builtin.asnum$(new Sk.builtin.float_(x));
        const _y = Sk.builtin.asnum$(new Sk.builtin.float_(y));

        if (_x == 0 && _y < 0) {
            throw new Sk.builtin.ValueError("math domain error");
        } else if (_x == 1) {
            return new Sk.builtin.float_(1.0);
        } else if (Number.isFinite(_x) && Number.isFinite(_y) && _x < 0 && !Number.isInteger(_y)) {
            throw new Sk.builtin.ValueError("math domain error");
        } else if (_x == -1 && (_y == -Infinity || _y == Infinity)) {
            return new Sk.builtin.float_(1.0);
        }

        const res = Math.pow(_x, _y);
        if (!Number.isFinite(_x) || !Number.isFinite(_y)) {
            return new Sk.builtin.float_(res);
        } else if (res == Infinity || res == -Infinity) {
            throw new Sk.builtin.OverflowError("math range error");
        }
        return new Sk.builtin.float_(res);
    });

    mod.sqrt = new Sk.builtin.func(function sqrt(x) {
        Sk.builtin.pyCheckArgsLen("sqrt", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.sqrt(Sk.builtin.asnum$(x)));
    });

    // Trigonometric functions and Hyperbolic

    mod.asin = new Sk.builtin.func(function asin(rad) {
        Sk.builtin.pyCheckArgsLen("asin", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.asin(Sk.builtin.asnum$(rad)));
    });

    mod.acos = new Sk.builtin.func(function acos(rad) {
        Sk.builtin.pyCheckArgsLen("acos", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.acos(Sk.builtin.asnum$(rad)));
    });

    mod.atan = new Sk.builtin.func(function atan(rad) {
        Sk.builtin.pyCheckArgsLen("atan", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.atan(Sk.builtin.asnum$(rad)));
    });

    mod.atan2 = new Sk.builtin.func(function atan2(y, x) {
        Sk.builtin.pyCheckArgsLen("atan2", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.atan2(Sk.builtin.asnum$(y), Sk.builtin.asnum$(x)));
    });

    mod.sin = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgsLen("sin", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.sin(Sk.builtin.asnum$(rad)));
    });

    mod.cos = new Sk.builtin.func(function cos(rad) {
        Sk.builtin.pyCheckArgsLen("cos", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.cos(Sk.builtin.asnum$(rad)));
    });

    mod.tan = new Sk.builtin.func(function tan(rad) {
        Sk.builtin.pyCheckArgsLen("tan", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.tan(Sk.builtin.asnum$(rad)));
    });

    mod.dist = new Sk.builtin.func(function dist(x) {
        throw new Sk.builtin.NotImplementedError("math.dist() is not yet implemented in Skulpt");
    });

    mod.hypot = new Sk.builtin.func(function hypot(x, y) {
        Sk.builtin.pyCheckArgsLen("hypot", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        x = Sk.builtin.asnum$(x);
        y = Sk.builtin.asnum$(y);
        return new Sk.builtin.float_(Math.sqrt(x * x + y * y));
    });

    mod.asinh = new Sk.builtin.func(function asinh(x) {
        Sk.builtin.pyCheckArgsLen("asinh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        const L = x + Math.sqrt(x * x + 1);

        return new Sk.builtin.float_(Math.log(L));
    });

    mod.acosh = new Sk.builtin.func(function acosh(x) {
        Sk.builtin.pyCheckArgsLen("acosh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        const L = x + Math.sqrt(x * x - 1);

        return new Sk.builtin.float_(Math.log(L));
    });

    mod.atanh = new Sk.builtin.func(function atanh(x) {
        Sk.builtin.pyCheckArgsLen("atanh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        const L = (1 + x) / (1 - x);

        return new Sk.builtin.float_(Math.log(L) / 2);
    });

    mod.sinh = new Sk.builtin.func(function sinh(x) {
        Sk.builtin.pyCheckArgsLen("sinh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        const e = Math.E;
        const p = Math.pow(e, x);
        const n = 1 / p;
        const result = (p - n) / 2;

        return new Sk.builtin.float_(result);
    });

    mod.cosh = new Sk.builtin.func(function cosh(x) {
        Sk.builtin.pyCheckArgsLen("cosh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        const e = Math.E;
        const p = Math.pow(e, x);
        const n = 1 / p;
        const result = (p + n) / 2;

        return new Sk.builtin.float_(result);
    });

    mod.tanh = new Sk.builtin.func(function tanh(x) {
        Sk.builtin.pyCheckArgsLen("tanh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        const _x = Sk.builtin.asnum$(x);

        if (_x === 0) {
            return new Sk.builtin.float_(_x);
        }

        const e = Math.E;
        const p = Math.pow(e, _x);
        const n = 1 / p;
        const result = (p - n) / 2 / ((p + n) / 2);

        return new Sk.builtin.float_(result);
    });

    // Angular Conversion
    mod.radians = new Sk.builtin.func(function radians(deg) {
        Sk.builtin.pyCheckArgsLen("radians", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("deg", "number", Sk.builtin.checkNumber(deg));

        const ret = (Math.PI / 180.0) * Sk.builtin.asnum$(deg);
        return new Sk.builtin.float_(ret);
    });

    mod.degrees = new Sk.builtin.func(function degrees(rad) {
        Sk.builtin.pyCheckArgsLen("degrees", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        const ret = (180.0 / Math.PI) * Sk.builtin.asnum$(rad);
        return new Sk.builtin.float_(ret);
    });

    // Special Functions
    mod.erf = new Sk.builtin.func(function erf(x) {
        throw new Sk.builtin.NotImplementedError("math.erf() is not yet implemented in Skulpt");
    });

    mod.erfc = new Sk.builtin.func(function erfc(x) {
        throw new Sk.builtin.NotImplementedError("math.erfc() is not yet implemented in Skulpt");
    });

    mod.gamma = new Sk.builtin.func(function gamma(x) {
        throw new Sk.builtin.NotImplementedError("math.gamma() is not yet implemented in Skulpt");
    });

    mod.lgamma = new Sk.builtin.func(function lgamma(x) {
        throw new Sk.builtin.NotImplementedError("math.lgamma() is not yet implemented in Skulpt");
    });

    return mod;
};
