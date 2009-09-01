Type$ = function(name, bases, dict)
{
    this.__name__ = name;
    this.__bases__ = bases;
    this.dict = dict;
};

Type$.prototype.mro = function()
{
    return new List$(this.__bases__.v);
};

Type$.prototype.__repr__ = function()
{
    return new Str$("<type '" + this.__name__ + "'>");
};

sk$TypeObject = new Type$('object', [], {});
sk$TypeObject.__bases__.push(sk$TypeObject);
sk$TypeType = new Type$('type', [sk$TypeObject], {});
sk$TypeInt = new Type$('int', [sk$TypeObject], {});
