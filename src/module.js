Module$ = function(name, file)
{
    this.__name__ = name;
    if (file) this.__file__ = file;
};

Module$.prototype = new object();

Module$.prototype.init$ = function(globdict)
{

};

Module$.prototype.__class__ = new Type$('module', [sk$TypeObject], {});
