var $builtinmodule = function (name) {
    var mod = {};

    // Mathematical Constants
    mod.pi = new Sk.builtin.float_(Math.PI);
    mod.e = new Sk.builtin.float_(Math.E);
    mod.tau = new Sk.builtin.float_(2*Math.PI);
    mod.nan = new Sk.builtin.float_(NaN);
    mod.inf = new Sk.builtin.float_(Infinity);

    // Number-theoretic and representation functions
    mod.ceil = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("ceil", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        if (Sk.__future__.ceil_floor_int) {
            return new Sk.builtin.int_(Math.ceil(Sk.builtin.asnum$(x)));
        }

        return new Sk.builtin.float_(Math.ceil(Sk.builtin.asnum$(x)));
    });

    mod.comb = new Sk.builtin.func(function (x,y) {
        throw new Sk.builtin.NotImplementedError("math.comb() is not yet implemented in Skulpt")
        Sk.builtin.pyCheckArgsLen("comb", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        var _x = Sk.ffi.remapToJs(x);
        var _y = Sk.ffi.remapToJs(y);
        var res;

    });
    
    mod.copysign = new Sk.builtin.func(function (x, y) {
        // returns y with the sign of x
        Sk.builtin.pyCheckArgsLen("ceil", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        var _x = Sk.ffi.remapToJs(x);
        var _y = Sk.ffi.remapToJs(y);
        var res;

        var isNeg_x = _x < 0;
        var isNeg_y = _x < 0;

        // special case for floats with negative zero
        if(Sk.builtin.checkFloat(x)) {
            if(_x === 0) {
                isNeg_x = 1/_x === -Infinity ? true : false;
            }
        }

        if(Sk.builtin.checkFloat(y)) {
            if(_y === 0) {
                isNeg_y = 1/_y === -Infinity ? true : false;
            }
        }

        // if both signs are equal, just return _y
        if((isNeg_x && isNeg_y) || (!isNeg_x && !isNeg_y)) {
            res = _y;
        } else if((isNeg_x && !isNeg_y) || (!isNeg_x && isNeg_y)) {
            // if different, invert sign
            if(y === 0) {
                // special case for zero
                res = isNeg_x ? -0.0 : 0.0;
            } else {
                res = _y * -1;
            }
        }

        return new Sk.builtin.float_(res);
    });

    mod.fabs = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("fabs", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.abs(Sk.builtin.asnum$(x)));
    });

    mod.factorial = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.factorial() is not yet implemented in Skulpt")
    });

    mod.floor = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("floor", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        if (Sk.__future__.ceil_floor_int) {
            return new Sk.builtin.int_(Math.floor(Sk.builtin.asnum$(x)));
        }

        return new Sk.builtin.float_(Math.floor(Sk.builtin.asnum$(x)));
    });

    mod.fmod = new Sk.builtin.func(function(x,y){
        Sk.builtin.pyCheckArgsLen("fmod", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x)); 
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        var _x = Sk.ffi.remapToJs(x);
        var _y = Sk.ffi.remapToJs(y);

        if ((_y == Infinity || _y == -Infinity) && isFinite(_x)){
            return new Sk.builtin.float_(_x)
        };
        var r = _x % _y
        if (isNaN(r)){
            if(!isNaN(_x) && !isNaN(_y)){
                throw new Sk.builtin.ValueError("math domain error");
            }
        }
        return Sk.builtin.float_(r)
    });

    mod.frexp = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.frexp() is not yet implemented in Skulpt")
    });

    mod.fsum = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.fsum() is not yet implemented in Skulpt")
    });

    mod.gcd = new Sk.builtin.func(function(a,b){
        Sk.builtin.pyCheckArgsLen("gcd", arguments.length, 2, 2);
        // non ints not allowed in python 3.7.x
        Sk.builtin.pyCheckType("a", "integer", Sk.builtin.checkInt(a)); 
        Sk.builtin.pyCheckType("b", "integer", Sk.builtin.checkInt(b));

        function _gcd(a, b){
            if (b == 0) {
                return a;
                };
            return _gcd(b, a%b);
        };

        var _a = Math.abs(Sk.ffi.remapToJs(a));
        var _b = Math.abs(Sk.ffi.remapToJs(b));
        var max_safe = false;

        if (_a >= Number.MAX_SAFE_INTEGER || _b >= Number.MAX_SAFE_INTEGER){
            _a = BigInt(Sk.ffi.remapToJs(Sk.builtin.str(a)));
            _b = BigInt(Sk.ffi.remapToJs(Sk.builtin.str(b)));
            max_safe = true;
        };

        var res = _gcd(_a, _b)
        if(res < 0){
            res = -res  // python only returns positive gcds
        };
        if (max_safe){
            return new Sk.builtin.lng(res.toString());
        };
        return new Sk.builtin.int_(res);
    });

    var MAX_SAFE_INTEGER_FACTORIAL = 18; // 19! > Number.MAX_SAFE_INTEGER
    mod.factorial = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("factorial", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        if (!Number.isInteger(x)){
            throw new Sk.builtin.ValueError('factorial() only accepts integral values')
        };
        if (x<0){
            throw new Sk.builtin.ValueError('factorial() not defined for negative numbers')
        };

        var r = 1;
        for (var i = 2; i <= x && i <= MAX_SAFE_INTEGER_FACTORIAL; i++) {
            r *= i;
        }
        if(x<=MAX_SAFE_INTEGER_FACTORIAL){
            return new Sk.builtin.int_(r);
        }else{
            // for big numbers (19 and larger) we first calculate 18! above
            // and then use bigintegers to continue the process.

            // This is inefficient as hell, but it produces correct answers.

            // promotes an integer to a biginteger
            function bigup(number){
              var n = Sk.builtin.asnum$nofloat(number);
              return new Sk.builtin.biginteger(number);
            }

            r = bigup(r);
            for (var i = MAX_SAFE_INTEGER_FACTORIAL+1; i <= x; i++) {
                var i_bigup = bigup(i);
                r = r.multiply(i_bigup);
            }
            return new Sk.builtin.lng(r);
        }
    });

    
    _isclose = function(a,b,kwargs){
        Sk.builtin.pyCheckArgsLen("isclose", arguments.length, 2, 3, true);
        return kwargs
        return new Sk.builtin.tuple([a,b,c,d])
    };
    
    _isclose.$defaults = [Sk.builtin.none.none$ ,Sk.builtin.none.none$,5,4]
    _isclose.co_varnames = ['a' ,'b','c','d']
    // _isclose.co_kwonlyargcount = 2;
    _isclose.co_argcount = 2;
    _isclose.co_kwargs = true;
    _isclose.$kwdefs = {'c':5, 'd':3}


    mod.isclose = new Sk.builtin.func(_isclose);

        
        
    //     Sk.builtin.pyCheckArgsLen("isclose", arguments.length, 2, 2, true);
    //     Sk.builtin.pyCheckType("a", "number", Sk.builtin.checkNumber(a)); 
    //     Sk.builtin.pyCheckType("b", "number", Sk.builtin.checkNumber(b));
    //     console.log(kwargs)
    //     var allowed_kwargs = {"rel_tol": 1e-09, "abs_tol": 0.0}  //this was awkward
    //     var kwargs = new Sk.builtins['dict'](kwargs);
    //     var kwargs = kwargs.assign(kwargs, allowed_kwargs)

    //     if (kwargs.length > 2){
    //         throw new Sk.builtin.TypeError("got an unexpected keword argument for isclose()")
    //     };
    //     Sk.builtin.pyCheckType("rel_tol", "number", Sk.builtin.checkNumber(kwargs['rel_tol'])); 
    //     Sk.builtin.pyCheckType("abs_tol", "number", Sk.builtin.checkNumber(kwargs['abs_tol']));

    //     var _a = Sk.ffi.remapToJs(a);
    //     var _b = Sk.ffi.remapToJs(b);
    //     var _rel_tol = Sk.ffi.remapToJs(rel_tol);
    //     var _abs_tol = Sk.ffi.remapToJs(abs_tol);

    //     if (_rel_tol < 0.0 || _abs_tol < 0.0 ) {
    //         throw new Sk.builtin.ValueError("tolerances must be non-negative");
    //     };
    //     if (_a == _b){
    //         return Sk.builtin.bool.true$;
    //     };

    //     if (_a == Infinity || _a == -Infinity || _b == Infinity || _b == -Infinity){
    //         // same sign infinities were caut in previous test
    //         return Sk.builtin.bool.false$;
    //     };
    //     var diff = Math.abs(b - a);
    //     var res =  (((diff <= Math.abs(_rel_tol * _b)) ||
    //                  (diff <= Math.abs(_rel_tol * _a))) ||
    //                  (diff <= _abs_tol));
    //     return new Sk.builtin.bool(res)
    // });

    mod.isfinite = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("isfinite", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        var _x = Sk.builtin.asnum$(x);
        if(isFinite(_x)) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.bool.false$
        }
    });
    
    mod.isinf = new Sk.builtin.func(function(x) {
        /* Return True if x is infinite, and False otherwise. */
        Sk.builtin.pyCheckArgsLen("isinf", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        var _x = Sk.builtin.asnum$(x);
        if(isFinite(_x) && !isNaN(_x)) {
            return Sk.builtin.bool.false$;
        } else {
            return Sk.builtin.bool.true$
        }
    });

    mod.isnan = new Sk.builtin.func(function(x) {
        // Return True if x is a NaN (not a number), and False otherwise.
        Sk.builtin.pyCheckArgsLen("isnan", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "float", Sk.builtin.checkFloat(x));

        var _x = Sk.builtin.asnum$(x);
        if(isNaN(_x)) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.bool.false$;
        }
    });

    mod.isqrt = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.isqrt() is not yet implemented in Skulpt")
    });

    mod.ldexp = new Sk.builtin.func(function (x,i) {
        // return x * (2**i)
        Sk.builtin.pyCheckArgsLen("pow", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("i", "integer", Sk.builtin.checkInt(i));

        _x = Sk.ffi.remapToJs(x)
        _i = Sk.ffi.remapToJs(i)

        if (_x == Infinity || _x==-Infinity){
            return new Sk.builtin.float_(_x)
        }
        else if (_x == 0){
            return new Sk.ffi.remapToPy(_x)
        }
        var res = _x * Math.pow(2,_i)
        return new Sk.ffi.remapToPy(res)
    });

    mod.modf = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("exp", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        var _x = Sk.ffi.remapToJs(x)
        if (!isFinite(_x)){
            if (_x == Infinity){
                return new Sk.builtin.tuple([Sk.builtin.float_(0.0), Sk.builtin.float_(_x)])
            }
            else if (_x == -Infinity){
                return new Sk.builtin.tuple([Sk.builtin.float_(-0.0),Sk.builtin.float_(_x)])
            }
            else if (isNaN(_x)){
                return new Sk.builtin.tuple([Sk.builtin.float_(_x), Sk.builtin.float_(_x)])
            }
        }
        var isNeg = _x < 0.0
        _x = Math.abs(_x)
        var i = Math.floor(_x) //integer part
        var d = _x - Math.floor(_x) //decimal part
        if (isNeg){
            return new Sk.builtin.tuple([Sk.builtin.float_(-d), Sk.builtin.float_(-i)])
        }
        else {
            return new Sk.builtin.tuple([Sk.builtin.float_(d), Sk.builtin.float_(i)])
        }
    });

    mod.perm = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.perm() is not yet implemented in Skulpt")
    });

    mod.prod = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.prod() is not yet implemented in Skulpt")
    });

    mod.remainder = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.remainder() is not yet implemented in Skulpt")
    });

    mod.trunc = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("trunc", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.int_(Sk.builtin.asnum$(x) | 0);
    });

    
    // Power and logarithmic functions
    mod.exp = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("exp", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.exp(Sk.builtin.asnum$(x)));
    });

    mod.expm1 = new Sk.builtin.func(function (x) {
        // as per python docs this implements an algorithm for evaluating exp(x) - 1 
        // for smaller values of x
        Sk.builtin.pyCheckArgsLen("expm1", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        var _x = Sk.ffi.remapToJs(x);

        if (Math.abs(_x) < .7){
            var _u = Math.exp(_x)
            if (_u == 1.0){
                return Sk.builtin.float_(_x)
            }
            else {
                var res = (_u - 1.0) * _x / Math.log(_u);
                return new Sk.builtin.float_(res)
            };
        }
        else {
            var res = Math.exp(_x) - 1.0;
            return new Sk.builtin.float_(res)
        };
    });

    mod.log = new Sk.builtin.func(function (x, base) {
        Sk.builtin.pyCheckArgsLen("log", arguments.length, 1, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        if (base === undefined) {
            return new Sk.builtin.float_(Math.log(Sk.builtin.asnum$(x)));
        } else {
            Sk.builtin.pyCheckType("base", "number", Sk.builtin.checkNumber(base));
            var ret = Math.log(Sk.builtin.asnum$(x)) / Math.log(Sk.builtin.asnum$(base));
            return new Sk.builtin.float_(ret);
        }
    });

    mod.log1p = new Sk.builtin.func(function (x) {
        // as per python docs this is an algorithm for evaluating log 1+x (base e)
        // designed to be more accurate close to 0
        Sk.builtin.pyCheckArgsLen("log1p", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        
        _x = Sk.ffi.remapToJs(x);

        if (_x==0.){
            return new Sk.builtin.float_(_x); // respects log1p(-0.0) return -0.0
        }
        else if (Math.abs(_x)< Number.EPSILON / 2.) { 
            return new Sk.builtin.float_(_x); 
        }
        else if (-0.5 <= _x && _x <= 1.){
            var _y = 1.+ _x;
            var res =  Math.log(_y) - ((_y - 1.) - _x) / _y;
            return new Sk.builtin.float_(res);
        }
        else {
            var res = Math.log(1+Sk.builtin.asnum$(x));
            return new Sk.builtin.float_(res);
        }
    });


    mod.log2 = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("log2", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        // want to check if it's a big int

        var ret = Math.log(Sk.builtin.asnum$(x)) / Math.log(2);
        return new Sk.builtin.float_(ret);
    });

    mod.log10 = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("log10", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        var ret = Math.log2(Sk.builtin.asnum$(x));
        return new Sk.builtin.float_(ret);
    });

    mod.pow = new Sk.builtin.func(function (x, y) {
        Sk.builtin.pyCheckArgsLen("pow", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        return new Sk.builtin.float_(Math.pow(Sk.builtin.asnum$(x), Sk.builtin.asnum$(y)));
    });

    mod.sqrt = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("sqrt", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.sqrt(Sk.builtin.asnum$(x)));
    });

     // Trigonometric functions and Hyperbolic

     mod.asin = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgsLen("asin", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.asin(Sk.builtin.asnum$(rad)));
    });

    mod.acos = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgsLen("acos", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.acos(Sk.builtin.asnum$(rad)));
    });

    mod.atan = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgsLen("atan", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.atan(Sk.builtin.asnum$(rad)));
    });

    mod.atan2 = new Sk.builtin.func(function (y, x) {
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

    mod.cos = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgsLen("cos", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.cos(Sk.builtin.asnum$(rad)));
    });

    mod.tan = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgsLen("tan", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.tan(Sk.builtin.asnum$(rad)));
    });

    mod.dist = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.dist() is not yet implemented in Skulpt")
    });

    mod.hypot = new Sk.builtin.func(function (x, y) {
        Sk.builtin.pyCheckArgsLen("hypot", arguments.length, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        x = Sk.builtin.asnum$(x);
        y = Sk.builtin.asnum$(y);
        return new Sk.builtin.float_(Math.sqrt((x * x) + (y * y)));
    });

    mod.asinh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("asinh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var L = x + Math.sqrt(x * x + 1);

        return new Sk.builtin.float_(Math.log(L));
    });

    mod.acosh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("acosh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var L = x + Math.sqrt(x * x - 1);

        return new Sk.builtin.float_(Math.log(L));
    });

    mod.atanh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("atanh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var L = (1 + x) / (1 - x);

        return new Sk.builtin.float_(Math.log(L) / 2);
    });

    mod.sinh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("sinh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var e = Math.E;
        var p = Math.pow(e, x);
        var n = 1 / p;
        var result = (p - n) / 2;

        return new Sk.builtin.float_(result);
    });

    mod.cosh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("cosh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var e = Math.E;
        var p = Math.pow(e, x);
        var n = 1 / p;
        var result = (p + n) / 2;

        return new Sk.builtin.float_(result);
    });

    mod.tanh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgsLen("tanh", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var e = Math.E;
        var p = Math.pow(e, x);
        var n = 1 / p;
        var result = ((p - n) / 2) / ((p + n) / 2);

        return new Sk.builtin.float_(result);
    });

    // Angular Conversion
    mod.radians = new Sk.builtin.func(function (deg) {
        Sk.builtin.pyCheckArgsLen("radians", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("deg", "number", Sk.builtin.checkNumber(deg));

        var ret = Math.PI / 180.0 * Sk.builtin.asnum$(deg);
        return new Sk.builtin.float_(ret);
    });

    mod.degrees = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgsLen("degrees", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        var ret = 180.0 / Math.PI * Sk.builtin.asnum$(rad);
        return new Sk.builtin.float_(ret);
    });

    // Special Functions
    mod.erf = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.erf() is not yet implemented in Skulpt")
    });

    mod.erfc = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.erfc() is not yet implemented in Skulpt")
    });

    mod.gamma = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.gamma() is not yet implemented in Skulpt")
    });

    mod.lgamma = new Sk.builtin.func(function (x) {
        throw new Sk.builtin.NotImplementedError("math.lgamma() is not yet implemented in Skulpt")
    });

    return mod;
}
