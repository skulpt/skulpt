(function() {

Sk.modules = new Sk.builtin.dict([]);
//Sk.syspath = new Sk.builtin.list([]);

/**
 * @constructor
 * @param {string} name
 * @param {string} file
 *
 * not a builtin
 */
var $ = Sk.module = function module(name, file)
{
    if (!(this instanceof $)) return new $(name, file);
    this.__name__ = name;
    if (file) this.__file__ = file;
};

$.prototype = new Sk.builtin.object_();

$.prototype.__class__ = new Sk.builtin.type('module', [Sk.types.object_], {});
$.prototype.__dir__ = function()
{
    var names = [];
    //print(Sk.repr(this.__dict__).v);
    for (var iter = this.__dict__.__iter__(), i = iter.next(); i !== undefined; i = iter.next())
        names.push(i);
    return new Sk.builtin.list(names);
};
$.prototype.__repr__ = function()
{
    return new Sk.builtin.str("<module '" + this.__name__ + "' "
            + (this.__file__
                ? ("from '" + this.__file__ + "'")
                : "(built-in)")
            + ">");
};

}());
