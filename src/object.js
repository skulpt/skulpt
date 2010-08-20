/**
 * @constructor
 */
Sk.builtin.object = function()
{
};

Sk.builtin.object.prototype.GenericGetAttr = function(name)
{
    goog.asserts.assert(typeof name === "string");

    var tp = this.ob$type;
    goog.asserts.assert(tp !== undefined, "object has no ob$type!");

    // todo; mro

    // otherwise, look in the type for a descr
    var descr = tp[name];
    var f;
    //print("descr", descr);
    if (descr !== undefined)
    {
        f = descr.ob$type.tp$descr_get;
        // todo;
        //if (f && descr.tp$descr_set) // is a data descriptor if it has a set
            //return f.call(descr, this, this.ob$type);
    }

    // todo; assert? force?
    //print("getattr", name, this.inst$dict.tp$repr().v);
    if (this.inst$dict)
    {
        var res;
        if (this.inst$dict.mp$subscript)
            res = this.inst$dict.mp$subscript(new Sk.builtin.str(name));
        else if (typeof this.inst$dict === "object") // todo; definitely the wrong place for this. other custom tp$getattr won't work on object
            res = this.inst$dict[name];
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

    throw new Sk.builtin.AttributeError("'" + this.tp$name + "' object has no attribute '" + name + "'");
};

Sk.builtin.object.prototype.GenericSetAttr = function(name, value)
{
    goog.asserts.assert(typeof name === "string");
    // todo; lots o' stuff
    if (this.inst$dict.mp$ass_subscript)
        this.inst$dict.mp$ass_subscript(new Sk.builtin.str(name), value);
    else if (typeof this.inst$dict === "object")
        this.inst$dict[name] = value;
};

Sk.builtin.object.prototype.HashNotImplemented = function()
{
    throw new Sk.builtin.TypeError("unhashable type: '" + this.tp$name + "'");
};

Sk.builtin.object.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.object.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;

Sk.builtin.baseobject = new Sk.builtin.type('object', null, {});
Sk.builtin.type.prototype.ob$type = new Sk.builtin.type('type', null, {});

Sk.builtin.BoolObj = function() {};
Sk.builtin.BoolObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('Bool', new Sk.builtin.BoolObj());

Sk.builtin.IntObj = function() {};
Sk.builtin.IntObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('int', new Sk.builtin.IntObj());

Sk.builtin.FloatObj = function() {};
Sk.builtin.FloatObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('float', new Sk.builtin.FloatObj());

Sk.builtin.NoneObj = function() {};
Sk.builtin.NoneObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('None', new Sk.builtin.NoneObj());


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
