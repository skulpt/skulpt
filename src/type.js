/**
 *
 * @constructor
 *
 * @param {string} name
 *
 * @param {Array.<Object>=} bases
 *
 * @param {Object=} dict
 *
 *
 * This type represents the type of `type'. *Calling* an instance of
 * this builtin type named "type" creates class objects. The resulting
 * class objects will have various tp$xyz attributes on them that allow
 * for the various operations on that object.
 *
 * calling the type or calling an instance of the type? or both?
 */

Sk.builtin.type = function(name, bases, dict)
{
    if (bases === undefined && dict === undefined)
    {
        // 1 arg version of type()
        var obj = name;
        return obj.ob$type;
    }
    else
    {
        // type building version of type
        if (!(this instanceof Sk.builtin.type)) return new Sk.builtin.type(name, bases, dict);

        // todo; verify all this
        this.tp$new = (function() {});
        this.tp$new.prototype = new Sk.builtin.object();
        for (var v in dict)
            this.tp$new.prototype[v] = dict[v];
        this.tp$new.prototype.ob$type = this;
        this.tp$name = name.v;
        this.tp$bases = bases;
        this.tp$dict = dict;
        return this;
    }

};

Sk.builtin.type.prototype.tp$name = "type";

Sk.builtin.type.prototype.tp$call = function()
{
    // arguments here are args to __init__

    var obj = new this.tp$new();
    obj.__dict__ = new Sk.builtin.dict([]);

    // todo; __init__
    var init = obj.__init__;
    if (init !== undefined)
    {
        // return ignored I guess?
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift(obj);
        init.apply(null, args);
    }

    return obj;
};

/*
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
*/
