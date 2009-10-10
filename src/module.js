Module$ = function(name, file)
{
    this.__name__ = name;
    if (file) this.__file__ = file;
};

/*jslint newcap: false */
Module$.prototype = new object();
/*jslint newcap: true */

Module$.modules$ = new Dict$([]);

Module$.prototype.__class__ = new Type$('module', [sk$TypeObject], {});
