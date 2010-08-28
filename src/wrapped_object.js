/**
 * @constructor
 */
Sk.builtin.wrappedObject = function(dict)
{
    this.inst$dict = dict;
};

Sk.builtin.wrappedObject.prototype.HashNotImplemented = function()
{
    throw new Sk.builtin.TypeError("unhashable type: '" + this.tp$name + "'");
};

Sk.builtin.wrappedObject.prototype.tp$getattr = function(name)
{
    var retVal = Sk.builtin.object.prototype.GenericGetAttr.call(this, name);
    if (typeof retVal === "function")
    {
        return new Sk.builtin.method(retVal, this);
    }
    return retVal;
};

// todo; what should tp$setattr do?

Sk.builtin.wrappedObject.prototype.ob$type = Sk.builtin.type.makeTypeObj('wrappedObject', new Sk.builtin.wrappedObject(undefined));
