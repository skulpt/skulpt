Sk.modules = new Sk.builtin.dict([]);
//Sk.syspath = new Sk.builtin.list([]);

/**
 * @constructor
 * @param {string} name
 */
Sk.builtin.module = function(name)
{

    this.__dict__ = new Sk.builtin.dict([]);
    this.__dict__.mp$ass_subscript(new Sk.builtin.str("__name__"), name);
    // todo; file
};
