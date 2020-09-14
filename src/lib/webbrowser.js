var $builtinmodule = function(name){
    var mod = {};
    var inBrowser = (typeof window != "undefined") && (typeof window.navigator != "undefined");

    function open_tab(url) {
        Sk.builtin.pyCheckType("url", "string", Sk.builtin.checkString(url));
        if (!inBrowser) {
            return Sk.builtin.bool.false$;
        }

        url = url.$jsstr();
        window.open(url, "_blank");

        return Sk.builtin.bool.true$;
    }

    mod.__name__ = new Sk.builtin.str("webbrowser");

    mod.open = new Sk.builtin.func(function open(url) {
        Sk.builtin.pyCheckArgsLen("open", arguments.length + 1, 1, 3);
        return open_tab(url);
    });

    mod.open_new = new Sk.builtin.func(function open_new(url) {
        Sk.builtin.pyCheckArgsLen("open_new", arguments.length, 1, 1);
        return open_tab(url);
    });

    mod.open_new_tab = new Sk.builtin.func(function open_new_tab(url) {
        Sk.builtin.pyCheckArgsLen("open_new_tab", arguments.length, 1, 1);
        return open_tab(url);
    });

    function dflbrowser($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function __init__(self) {
            return Sk.builtin.none.none$;
        });

        $loc.open = new Sk.builtin.func(function open(self, url) {
            Sk.builtin.pyCheckArgsLen("open", arguments.length, 2, 4);
            return open_tab(url);
        });

        $loc.open_new = new Sk.builtin.func(function open_new(self, url) {
            Sk.builtin.pyCheckArgsLen("open_new", arguments.length, 2, 2);
            return open_tab(url);
        });

        $loc.open_new_tab = new Sk.builtin.func(function open_new_tab(self, url) {
            Sk.builtin.pyCheckArgsLen("open_new_tab", arguments.length, 2, 2);
            return open_tab(url);
        });
    }

    mod.DefaultBrowser = Sk.misceval.buildClass(mod, dflbrowser, "DefaultBrowser", []);

    mod.get = new Sk.builtin.func(function get() {
        Sk.builtin.pyCheckArgsLen("get", arguments.length, 0, 1);
        return Sk.misceval.callsimArray(mod.DefaultBrowser, []);
    });

    return mod;
};
