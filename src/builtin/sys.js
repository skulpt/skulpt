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

    sys.maxint = Sk.builtin.assk$(Math.pow(2,53)-1, Sk.builtin.nmber.int$);

    sys.modules = Sk.sysmodules;

    sys.path = Sk.realsyspath;

    sys.getExecutionLimit = new Sk.builtin.func(function () {
        if (Sk.execLimit === null) {
            return Sk.buildin.none.none$;
        }
        return Sk.builtin.assk$(Sk.execLimit, Sk.builtin.nmber.int$);
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
            return Sk.buildin.none.none$;
        }
        return Sk.builtin.assk$(Sk.yieldLimit, Sk.builtin.nmber.int$);
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
        debugger;
    });

    // make sys.version_info a sublcass of tuple
    //version_info_f = 
    sys.version_info = new Sk.builtin.tuple([new Sk.builtin.int_(3), new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.str("beta"), new Sk.builtin.int_(0)]);

    return sys;
};
