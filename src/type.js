(function() {

var $ = Sk.builtin.type = function type(name, bases, dict, body$)
{
    if (bases === undefined && dict === undefined)
    {
        // type function, rather than type constructor
        var obj = name;
        // todo; less assey
        if (typeof obj === "number")
            return Sk.types.int_;
        else
            return obj.__class__;
    }
    else if (!(this instanceof $))
    {
        return new $(name, bases, dict);
    }
    else
    {
        var __body = body$;
        var ret = function() {
            if (__body)
                return __body.apply(null, arguments);
        };
        ret.__name__ = name;
        if (!(bases instanceof Sk.builtin.list))
            bases = new Sk.builtin.list(bases);
        ret.__bases__ = bases;
        ret.dict = dict;
        return ret;
    }
};

$.prototype.mro = function()
{
    return new Sk.builtin.list(this.__bases__.v);
};

$.prototype.__repr__ = function()
{
    return new Sk.builtin.str("<type '" + this.__name__ + "'>");
};

Sk.types.object = new $('object', [], {});

// TODO
//
// type(n,b,d) should be called when constructing a class
// user and builtin both need to go through here so that .inherits and
// base class lookup work properly
//
// this is why t144 doesn't work right now; trying to find a __setattr__ on a
// class X(object): pass, but it's not found because <type 'object'> isn't
// really Sk.builtin.object
//
// so, i think the 3 parameter version of type needs to return a new
// constructor that all the builtin types use to make themselves.

Sk.types.type = new $('type', [Sk.types.object], {});
Sk.types.int_ = new $('int', [Sk.types.object], {});

Sk.builtin.list.prototype.__class__ = new Sk.builtin.type('list', [Sk.types.object], {});


}());
