var $builtinmodule = function(name){
    var mod = {};
    var inBrowser = (typeof window != "undefined") && (typeof window.navigator != "undefined");

    mod.open = new Sk.builtin.func(function() {
        Sk.builtin.pyCheckArgsLen("open", arguments.length, 1, 3);
        var url = arguments[0];
        if (!(url instanceof Sk.builtin.str))
            throw new Sk.builtin.TypeError("webbrowser.open expects 'str' for 'url'");

        if (!inBrowser)
            return false;

        url = url.$jsstr();
        window.open(url, "_blank");
        return true;
    });
    return mod;
};
