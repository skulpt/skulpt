var $builtinmodule = function(name){
    var mod = {};
    var inBrowser = (typeof window != "undefined") && (typeof window.navigator != "undefined");

    mod.open = new Sk.builtin.func(function open(url) {
        Sk.builtin.pyCheckType("url", "string", Sk.builtin.checkString(url));
        if (!inBrowser) {
            return Sk.builtin.bool.false$;
        }

        url = url.$jsstr();
        window.open(url, "_blank");

        return Sk.builtin.bool.true$;
    });
    return mod;
};
