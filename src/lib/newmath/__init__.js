var $builtinmodule = function(name)
{
    var mod = {};
    var funcMap = {}
    var props = Object.getOwnPropertyNames(Math)

    for (i in props) {
        if (typeof Math[props[i]] === "number" ) {
            mod[props[i]] = Math[props[i]];
        }
        if (typeof Math[props[i]] == "function") {
            mod[props[i]] = new Sk.builtin.func(Math[props[i]],undefined,undefined,undefined,true);

        }
    }

    return mod;
}