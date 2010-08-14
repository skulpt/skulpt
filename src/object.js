/**
 * @constructor
 */
Sk.builtin.object = function()
{
};

Sk.builtin.object.prototype.GenericGetAttr = function(name)
{
    goog.asserts.assert(name instanceof Sk.builtin.str);

    var tp = this.ob$type;
    goog.asserts.assert(tp !== undefined);

    var typeLookup = function(curtype, name)
    {
        // todo; follow mro properly
        while (curtype)
        {
            descr = curtype[name];
            if (descr !== undefined) return descr;
            curtype = curtype.ob$type;
        }
        return undefined;
    };

    // otherwise, look in the type for a descr
    var descr = tp[name.v];
    //print("looking for ", name.v);
    //print(descr, JSON.stringify(descr));
    var f;
    if (descr !== undefined)
    {
        f = descr.ob$type.tp$descr_get;
        if (f && descr.tp$descr_set) // is a data descriptor if it has a set
            return f.call(descr, this, this.ob$type);
    }

    // todo; assert? force?
    //print("getattr", name.v, this.inst$dict.tp$repr().v);
    if (this.inst$dict)
    {
        //print("hi");
        var res = this.inst$dict.mp$subscript(name);
        //print(res);
        if (res !== undefined)
            return res;
    }

    if (f)
    {
        // non-data descriptor
        return f.call(descr, this, this.ob$type);
    }

    if (descr)
    {
        return descr;
    }

    throw new Sk.builtin.AttributeError("'" + this.tp$name + "' object has no attribute '" + name.v + "'");
};

Sk.builtin.object.prototype.GenericSetAttr = function(name, value)
{
    // todo; lots o' stuff
    this.inst$dict.mp$ass_subscript(name, value);
    //print("obj now", this.__dict__.tp$repr().v);
};

Sk.builtin.object.prototype.HashNotImplemented = function()
{
    throw new Sk.builtin.TypeError("unhashable type: '" + this.tp$name + "'");
};

Sk.builtin.object.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.object.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;

Sk.builtin.baseobject = new Sk.builtin.type('object', null, {});

/*
Sk.builtin.object_ = Sk.builtin.type('object', [], {}, function()
{
    this.__dict__ = new Sk.builtin.dict([]);
    return this;
});
*/

/*
// todo; maybe a string-only dict here that's just an object+methods for efficiency
$.__setattr__ = function(k,v)
{
    //print("in __setattr__",k,v);
    this.__dict__.__setitem__(new Sk.builtin.str(k), v);
};
$.__getattr__ = function(k)
{
    return this.__dict__.__getitem__(new Sk.builtin.str(k));
};
$.__repr__ = function()
{
    return new Sk.builtin.str("<" + Sk.getattr(this, '__module__') + "." + this.__class__.__name__.v + " instance>");
};
*/
