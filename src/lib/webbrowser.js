var $builtinmodule = function(name){
    var mod = {};
    var inBrowser = (typeof window != "undefined") && (typeof window.navigator != "undefined");

    mod.open = new Sk.builtin.func(function open(url) {
        if (!(url instanceof Sk.builtin.str)) {
            throw new Sk.builtin.TypeError("webbrowser.open expects 'str' for 'url'");
        }
        if (!inBrowser) {
            return Sk.builtin.bool.false$;
        }

        url = url.$jsstr();
        window.open(url, "_blank");

        return Sk.builtin.bool.true$;
    });
    return mod;
};
