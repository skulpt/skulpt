/**
 *
 * @constructor
 *
 * @param {*} name name or object to get type of, if only one arg
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
        if (obj === true || obj === false) return Sk.builtin.BoolObj.prototype.ob$type;
        if (obj === null) return Sk.builtin.NoneObj.prototype.ob$type;
        if (typeof obj === "number")
        {
            if (Math.floor(obj) === obj)
                return Sk.builtin.IntObj.prototype.ob$type;
            else
                return Sk.builtin.FloatObj.prototype.ob$type;
        }
        return obj.ob$type;
    }
    else
    {
        // type building version of type
        if (!(this instanceof Sk.builtin.type)) return new Sk.builtin.type(name, bases, dict);

        // dict is the result of running the classes code object
        // (basically the dict of functions). those become the prototype
        // object of the class).

        /**
         * @constructor
         */
        var klass = this.tp$new = (function(){});
        //print("type(nbd):",name,JSON.stringify(dict, null,2));
        for (var v in dict)
            klass.prototype[v] = dict[v];
        klass.prototype.tp$name = name;
        klass.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
        klass.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
        klass.prototype.tp$descr_get = function() { print("in type descr_get"); };
        klass.prototype.tp$repr = function()
        {
            var mod = dict.__module__;
            var cname = "";
            if (mod) cname = mod.v + ".";
            return new Sk.builtin.str("<" + cname + name + " object>");
        };
        klass.prototype.ob$type = Sk.builtin.type.makeTypeObj(name, new klass());
        // todo; bases
        return this;
    }

};

/**
 *
 */
Sk.builtin.type.makeTypeObj = function(name, newedInstanceOfType)
{
    var t = newedInstanceOfType;
    // todo; clarify why these can't go on type.prototype
    t.ob$type = Sk.builtin.type.prototype.ob$type;
    t.tp$name = name;
    t.tp$repr = function()
    {
        var mod = t.__module__;
        var cname = "";
        if (mod) cname = mod.v + ".";
        return new Sk.builtin.str("<class '" + cname + t.tp$name + "'>");
    };
    t.tp$str = undefined;
    return t;
};

//Sk.builtin.type.prototype.tp$descr_get = function() { print("in type descr_get"); };
Sk.builtin.type.prototype.tp$name = "type";

Sk.builtin.type.prototype.tp$call = function(args, kw)
{
    // arguments here are args to __init__

    var obj = new this.tp$new();

    obj.inst$dict = new Sk.builtin.dict([]);

    var init = obj["__init__"];
    if (init !== undefined)
    {
        // return ignored I guess?
        args.unshift(obj);
        Sk.misceval.apply(init, undefined, args);
    }

    return obj;
};


// basically the same as GenericGetAttr except looks in the proto instead
Sk.builtin.type.prototype.tp$getattr = function(name)
{
    var tp = this.tp$new.prototype;
    var descr = tp[name];
    var f;
    //print("type.tpgetattr descr", descr, descr.tp$name, descr.func_code, name.v);
    if (descr !== undefined)
    {
        f = descr.ob$type.tp$descr_get;
        // todo;if (f && descr.tp$descr_set) // is a data descriptor if it has a set
            // return f.call(descr, this, this.ob$type);
    }

    if (this.inst$dict)
    {
        //print("hi");
        var res = this.inst$dict.mp$subscript(new Sk.builtin.str(name));
        //print(res);
        if (res !== undefined)
            return res;
    }

    if (f)
    {
        // non-data descriptor
        return f.call(descr, null, tp);
    }

    if (descr)
    {
        return descr;
    }

    throw new Sk.builtin.AttributeError("type object '" + this.tp$name + "' has no attribute '" + name + "'");
};

Sk.builtin.type.prototype.tp$repr = function()
{
    return new Sk.builtin.str("<type 'type'>");
};


/*Sk.builtin.type.TrueType = Sk.builtin.type.makeTypeObj('True', (function(){}));
Sk.builtin.type.FalseType = Sk.builtin.type.makeTypeObj('False', (function(){}));
Sk.builtin.type.NoneType = Sk.builtin.type.makeTypeObj('None', (function(){}));
Sk.builtin.type.IntType = Sk.builtin.type.makeTypeObj('int', (function(){}));
Sk.builtin.type.FloatType = Sk.builtin.type.makeTypeObj('float', (function(){}));
*/


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
