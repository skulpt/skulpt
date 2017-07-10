var $builtinmodule = function(name){
    var mod = {};
    var inBrowser = (typeof window != "undefined") && (typeof window.navigator != "undefined");

    mod.python_implementation = new Sk.builtin.func(function() {
        Sk.builtin.pyCheckArgs("python_implementation", arguments, 0, 0);
        return new Sk.builtin.str("Skulpt");
    });

    mod.node = new Sk.builtin.func(function() {
        Sk.builtin.pyCheckArgs("node", arguments, 0, 0);
        return new Sk.builtin.str("");
    });

    mod.version = new Sk.builtin.func(function() {
        Sk.builtin.pyCheckArgs("version", arguments, 0, 0);
        return new Sk.builtin.str("");
    });

    mod.python_version = new Sk.builtin.func(function() {
        var vers;
        Sk.builtin.pyCheckArgs("python_version", arguments, 0, 0);
        if (Sk.python3) {
            vers = "3.2.0";
        }
        else {
            vers = "2.7.0";
        }
        return new Sk.builtin.str(vers);
    });

    mod.system = new Sk.builtin.func(function() {
        var sys;
        Sk.builtin.pyCheckArgs("system", arguments, 0, 0);
        if (inBrowser) {
            sys = window.navigator.appCodeName;
        }
        else {
            sys = "";
        }
        return new Sk.builtin.str(sys);
    });

    mod.machine = new Sk.builtin.func(function() {
        var plat;
        Sk.builtin.pyCheckArgs("machine", arguments, 0, 0);
        if (inBrowser) {
            plat = window.navigator.platform;
        }
        else {
            plat = "";
        }
        return new Sk.builtin.str(plat);
    });

    mod.release = new Sk.builtin.func(function() {
        var appVers;
        Sk.builtin.pyCheckArgs("release", arguments, 0, 0);
        if (inBrowser) {
            appVers = window.navigator.appVersion;
        }
        else {
            appVers = "";
        }
        return new Sk.builtin.str(appVers);
    });

    mod.architecture = new Sk.builtin.func(function() {
        Sk.builtin.pyCheckArgs("architecture", arguments, 0, 0);
        return new Sk.builtin.tuple([new Sk.builtin.str("64bit"),
                                     new Sk.builtin.str("")]);
    });

    mod.processor = new Sk.builtin.func(function() {
        Sk.builtin.pyCheckArgs("processor", arguments, 0, 0);
        return new Sk.builtin.str("");
    });

    return mod;
};
