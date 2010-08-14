/**
 * @constructor
 */
Sk.builtin.object = function()
{
};

Sk.builtin.object.prototype.GenericGetAttr = function(name)
{
    goog.asserts.assert(name instanceof Sk.builtin.str);

    goog.asserts.assert(this.__dict__ !== undefined);
    var res = this.__dict__.mp$subscript(name);
    if (res !== undefined)
        return res;

    var typeLookup = function(cur, name)
    {
        // todo; follow mro properly
        while (cur !== undefined)
        {
            descr = cur.tp$dict[name];
            if (descr !== undefined) return descr;
            cur = cur.ob$type;
        }
        return undefined;
    };

    // otherwise, look in the type for a descr
    var descr = typeLookup(this, name.v);
    var f;
    if (descr !== undefined)
    {
        f = descr.tp$descr_get;
        if (f && desc.tp$descr_set) // is a data descriptor
            return f(descr, this, this.ob$type);
    }

    // todo; look in instance's __dict__ and return it if there

    if (f)
    {
        // non-data descriptor
        return f(descr, this, this.ob$type);
    }

    if (descr)
    {
        return descr.bind(this); // todo; this bind shouldn't be necessary
    }

    throw new Sk.builtin.AttributeError("'" + this.tp$name + "' object has no attribute '" + name.v + "'");
};

Sk.builtin.object.prototype.GenericSetAttr = function(name, value)
{
    // todo; lots o' stuff
    this.__dict__.mp$ass_subscript(name, value);
    //print("obj now", this.__dict__.tp$repr().v);
};

Sk.builtin.object.prototype.HashNotImplemented = function()
{
    throw new Sk.builtin.TypeError("unhashable type: '" + this.tp$name + "'");
};

Sk.builtin.object.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.object.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;

Sk.builtin.object.prototype.tp$dict = {};

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
