//goog.require('goog.json'); // todo; inside or out?

var $builtinmodule = function(name)
{
    var mod = {};

    mod.parse = new Sk.builtin.func(function(s)
            {
                return Sk.ffi.remapToPy(goog.json.parse(s.v));
            });

    mod.unsafeParse = new Sk.builtin.func(function(s)
            {
                return Sk.ffi.remapToPy(goog.json.unsafeParse(s.v));
            });

    mod.serialize = new Sk.builtin.func(function(object_)
            {
                return new Sk.builtin.str(goog.json.serialize(Sk.ffi.remapToJs(object_)));
            });

    return mod;
};
