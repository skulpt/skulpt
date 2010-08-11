// not a builtin
Sk.generator = function(iter, repr, next)
{
    this.__iter__ = iter;
    this.__repr__ = repr;
    this.next = next;
    return this;
};

Sk.generator.prototype.__class__ = new Sk.builtin.type('generator', [Sk.types.object], {});
