var $builtinmodule = function (name) {
    var i;
    var sys = {};

    var args = [];
    var argv = Sk.getSysArgv();
    for (i = 0; i < argv.length; ++i) {
        args.push(new Sk.builtin.str(argv[i]));
    }
    sys.argv = new Sk.builtins["list"](args);

    sys.copyright = Sk.builtin["str"]("Copyright 2009-2010 Scott Graham.\nAll Rights Reserved.\n");

    sys.maxint = new Sk.builtin.int_(Math.pow(2,53)-1);

    /*  The largest positive integer supported by the platform’s Py_ssize_t type,
     *  and thus the maximum size lists, strings, dicts, and many other containers can have.
     *
     *  In skulpt this is the same as maxint, due to the underlying implementation in javascript
     */
    sys.maxsize = new Sk.builtin.int_(Math.pow(2,53)-1);

    sys.modules = Sk.sysmodules;

    sys.path = Sk.realsyspath;

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

    sys.__stdout__ = new Sk.builtin.file(new Sk.builtin.str("/dev/stdout"), "w");
    sys.__stdin__ = new Sk.builtin.file(new Sk.builtin.str("/dev/stdin"), "r");

    sys.stdout = sys.__stdout__;
    sys.stdin = sys.__stdin__;

    return sys;
};
