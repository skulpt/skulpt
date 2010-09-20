/**
 * @constructor
 */
Sk.builtin.object = function()
{
    if (!(this instanceof Sk.builtin.object)) return new Sk.builtin.object();
    this['$d'] = new Sk.builtin.dict([]);
    return this;
};

Sk.builtin.object.prototype.GenericGetAttr = function(name)
{
    goog.asserts.assert(typeof name === "string");

    var tp = this.ob$type;
    goog.asserts.assert(tp !== undefined, "object has no ob$type!");

    //print("getattr", tp.tp$name, name);

    var descr = Sk.builtin.type.typeLookup(tp, name);

    // otherwise, look in the type for a descr
    var f;
    //print("descr", descr);
    if (descr !== undefined && descr.ob$type !== undefined)
    {
        f = descr.ob$type.tp$descr_get;
        // todo;
        //if (f && descr.tp$descr_set) // is a data descriptor if it has a set
            //return f.call(descr, this, this.ob$type);
    }

    // todo; assert? force?
    if (this['$d'])
    {
        var res;
        if (this['$d'].mp$subscript)
            res = this['$d'].mp$subscript(new Sk.builtin.str(name));
        else if (typeof this['$d'] === "object") // todo; definitely the wrong place for this. other custom tp$getattr won't work on object
            res = this['$d'][name];
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

    return undefined;
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericGetAttr", Sk.builtin.object.prototype.GenericGetAttr);

Sk.builtin.object.prototype.GenericSetAttr = function(name, value)
{
    goog.asserts.assert(typeof name === "string");
    // todo; lots o' stuff
    if (this['$d'].mp$ass_subscript)
        this['$d'].mp$ass_subscript(new Sk.builtin.str(name), value);
    else if (typeof this['$d'] === "object")
        this['$d'][name] = value;
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericSetAttr", Sk.builtin.object.prototype.GenericSetAttr);

Sk.builtin.object.prototype.HashNotImplemented = function()
{
    throw new Sk.builtin.TypeError("unhashable type: '" + this.tp$name + "'");
};

Sk.builtin.object.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.object.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
Sk.builtin.type.makeIntoTypeObj('object', Sk.builtin.object);

Sk.builtin.BoolObj = function() {};
Sk.builtin.BoolObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('Bool', new Sk.builtin.BoolObj());

Sk.builtin.IntObj = function() {};
Sk.builtin.IntObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('int', new Sk.builtin.IntObj());

Sk.builtin.FloatObj = function() {};
Sk.builtin.FloatObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('float', new Sk.builtin.FloatObj());

Sk.builtin.NoneObj = function() {};
Sk.builtin.NoneObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('None', new Sk.builtin.NoneObj());
