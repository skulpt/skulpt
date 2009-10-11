Module$ = function(name, file)
{
    this.__name__ = name;
    if (file) this.__file__ = file;
};

/*jslint newcap: false */
Module$.prototype = new object();
/*jslint newcap: true */

Module$.modules$ = new Dict$([]);
Module$.builtins$ = new Dict$([]);
Module$.syspath$ = new List$([]);

Module$.prototype.__class__ = new Type$('module', [sk$TypeObject], {});
Module$.prototype.__dir__ = function()
{
    var names = [];
    print(repr(this.__dict__).v);
    for (var iter = this.__dict__.__iter__(), i = iter.next(); i !== undefined; i = iter.next())
        names.push(i);
    return new List$(names);
};
Module$.prototype.__repr__ = function()
{
    return new Str$("<module '" + this.__name__ + "' "
            + (this.__file__
                ? ("from '" + this.__file__ + "'")
                : "(built-in)")
            + ">");
};
