(function() {

// not a builtin
var $ = Sk.generator = function(iter, repr, next)
{
    this.__iter__ = iter;
    this.__repr__ = repr;
    this.next = next;
    return this;
};

$.prototype.__class__ = new Sk.builtin.type('generator', [Sk.types.object], {});

}());
