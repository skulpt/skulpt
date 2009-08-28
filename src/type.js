Type$ = function(name, bases, dict)
{
    this.name = name;
    this.bases = bases;
    this.dict = dict;
};

Type$.prototype.mro = function()
{
    return new List$(this.__bases__.v);
};

Type$.prototype.__repr__ = function()
{
    return new Str$("<type '" + this.name + "'>");
};

sk$TypeObject = new Type$('object', [], {});
sk$TypeObject.bases.push(sk$TypeObject);
sk$TypeType = new Type$('type', [sk$TypeObject], {});
sk$TypeInt = new Type$('int', [sk$TypeObject], {});
