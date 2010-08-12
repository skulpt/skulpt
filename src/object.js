/**
 * @constructor
 */
Sk.builtin.object = function()
{
};

Sk.builtin.object.prototype.GenericGetAttr = function(name)
{
    goog.asserts.assert(name instanceof Sk.builtin.str);

    // todo; data descriptors. we only do non-data descriptors which is what's needed for methods

    goog.asserts.assert(this.__dict__ !== undefined);
    var res = this.__dict__.mp$subscript(name);
    if (res !== undefined)
        return res;

    // otherwise, look in the type for a descr
    // todo; follow mro
    // todo; where does the binding happen (in Sk.getattr before)
    var descr = this.tp$dict[name.v];
    if (descr !== undefined) return descr.bind(this);

    throw new Sk.builtin.AttributeError("'" + this.tp$name + "' object has no attribute '" + name.v + "'");
};

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
