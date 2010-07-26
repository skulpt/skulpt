(function() {

var $ = Sk.builtin['function'] = function() {};

Sk.fget = function fget(self, instance, owner)
{
    var __func = self;
    var __instance = instance;
    var ret = function() {
        //print("bound call", __func, __instance, __instance !== null);
        if (__instance !== null)
        {
            var tmpargs = Array.prototype.slice.call(arguments, 0);
            //print("bound invoke", JSON2.stringify(tmpargs));
            tmpargs.unshift(__instance);
            //print("bound invoke", JSON2.stringify(tmpargs));
            return __func.apply("nothis_bound", tmpargs);
        }
        else // if (arguments[0] instanceof owner.__class__)
        {
            //print("unbound function invoke:", arguments.length, arguments);
            return __func.apply("nothis_unbound", arguments);
        }
        throw new TypeError("Unbound method expects an instance of " + owner + " as first argument");
    };

    // todo; ret should be constructing a function object. maybe. or
    // something. not this anyway.
    ret.__repr__ = function()
    {
        var ret;
        var fname = owner.__name__.v + "." + __func.__name__.v;
        if (__instance !== null)
        {
            var objrepr = Sk.builtin.object.prototype.__repr__.apply(__instance).v;
            ret = "<bound method " + fname + " of " + objrepr + ">";
        }
        else
        {
            ret = "<unbound method " + fname + ">";
        }
        return new Sk.builtin.str(ret);
    };

    if (self.argnames$) // todo; builtins can't be called with kwargs yet
    {
        if (instance === null)
            ret.argnames$ = self.argnames$;
        else
            ret.argnames$ = self.argnames$.slice(1);
    }
    return ret;
};

}());
