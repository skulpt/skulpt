var $builtinmodule = function (name) {
    var i;
    var sys = {};

    var args = [];
    var argv = Sk.getSysArgv();
    for (i = 0; i < argv.length; ++i) {
        args.push(new Sk.builtin.str(argv[i]));
    }
    sys.argv = new Sk.builtins["list"](args);

    sys.copyright = new Sk.builtin["str"]("Copyright 2009-2010 Scott Graham.\nAll Rights Reserved.\n");

    if (Sk.__future__.python3) {
        sys.version = new Sk.builtin.str("3.7(ish) [Skulpt]");
        sys.version_info = new Sk.builtin.tuple([new Sk.builtin.int_(3), new Sk.builtin.int_(7)]);
    } else {
        sys.version = new Sk.builtin.str("2.7(ish) [Skulpt]");
        sys.version_info = new Sk.builtin.tuple([new Sk.builtin.int_(2), new Sk.builtin.int_(7)]);
    }

    sys.maxint = new Sk.builtin.int_(Math.pow(2,53)-1);

    /*  The largest positive integer supported by the platform’s Py_ssize_t type,
     *  and thus the maximum size lists, strings, dicts, and many other containers can have.
     *
     *  In skulpt this is the same as maxint, due to the underlying implementation in javascript
     */
    sys.maxsize = new Sk.builtin.int_(Math.pow(2,53)-1);

    sys.modules = Sk.sysmodules;

    sys.path = Sk.realsyspath;

    sys.getdefaultencoding = new Sk.builtin.func(() => new Sk.builtin.str("utf-8"));

    sys.getExecutionLimit = new Sk.builtin.func(function () {
        if (Sk.execLimit === null) {
            return Sk.builtin.none.none$;
        }
        return new Sk.builtin.int_(Sk.execLimit);
    });

    sys.setExecutionLimit = new Sk.builtin.func(function (t) {
        if (Sk.execLimit === null) {
            throw new Sk.builtin.NotImplementedError("Execution limiting is not enabled");
        }
        if (t !== undefined) {
            Sk.execLimit = Sk.builtin.asnum$(t);
        }
    });

    sys.resetTimeout = new Sk.builtin.func(function () {
        Sk.execStart = new Date();
    });

    sys.getYieldLimit = new Sk.builtin.func(function () {
        if (Sk.yieldLimit === null) {
            return Sk.builtin.none.none$;
        }
        return new Sk.builtin.int_(Sk.yieldLimit);
    });

    sys.setYieldLimit = new Sk.builtin.func(function (t) {
        if (Sk.yieldLimit === null) {
            throw new Sk.builtin.NotImplementedError("Yielding is not enabled");
        }
        if (t !== undefined) {
            Sk.yieldLimit = Sk.builtin.asnum$(t);
        }
    });

    sys.debug = new Sk.builtin.func(function () {
        return Sk.builtin.none.none$;
    });

    const float_info_fields = {
        "max": "DBL_MAX -- maximum representable finite float",
        "max_exp": "DBL_MAX_EXP -- maximum int e such that radix**(e-1) is representable",
        "max_10_exp": "DBL_MAX_10_EXP -- maximum int e such that 10**e is representable",
        "min": "DBL_MIN -- Minimum positive normalized float",
        "min_exp": "DBL_MIN_EXP -- minimum int e such that radix**(e-1) is a normalized float",
        "min_10_exp": "DBL_MIN_10_EXP -- minimum int e such that 10**e is a normalized",
        "dig": "DBL_DIG -- digits",
        "mant_dig": "DBL_MANT_DIG -- mantissa digits",
        "epsilon": "DBL_EPSILON -- Difference between 1 and the next representable float",
        "radix": "FLT_RADIX -- radix of exponent",
        "rounds": "FLT_ROUNDS -- rounding mode"
    };
    
    const float_info_type = Sk.builtin.make_structseq('sys', 'float_info', float_info_fields);
    sys.float_info = new float_info_type([
        Number.MAX_VALUE,
        Math.floor(Math.log2(Number.MAX_VALUE)),
        Math.floor(Math.log10(Number.MAX_VALUE)),
        Number.MIN_VALUE,
        Math.ceil(Math.log2(Number.MIN_VALUE)),
        Math.ceil(Math.log10(Number.MIN_VALUE)),
        15,
        Math.log2(Number.MAX_SAFE_INTEGER),
        Number.EPSILON,
        2,
        1,
    ].map(x => Sk.ffi.remapToPy(x)))

    const int_info_fields = {
        bits_per_digit: "size of a digit in bits",
        sizeof_digit: "size in bytes of the C type used to represent a digit"
    }
    const int_info_type = Sk.builtin.make_structseq('sys', 'int_info', int_info_fields);
    sys.int_info = new int_info_type([30, 4].map((x) => Sk.ffi.remapToPy(x)));

    sys.__stdout__ = new Sk.builtin.file(new Sk.builtin.str("/dev/stdout"), new Sk.builtin.str("w"));
    sys.__stdin__ = new Sk.builtin.file(new Sk.builtin.str("/dev/stdin"), new Sk.builtin.str("r"));

    sys.stdout = sys.__stdout__;
    sys.stdin = sys.__stdin__;

    return sys;
};
