/**
 * @constructor
 * @param {Object} iterable
 * @param {number=} start
 * @extends Sk.builtin.object
 */
Sk.builtin.enumerate = function(iterable, start)
{
    if (!(this instanceof Sk.builtin.enumerate)) return new Sk.builtin.enumerate(iterable, start);

    Sk.builtin.pyCheckArgs("enumerate", arguments, 1, 2);
    if (!Sk.builtin.checkIterable(iterable)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
    }
    if (start !== undefined) {
        if (!Sk.misceval.isIndex(start)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(start) + "' object cannot be interpreted as an index");
        } else {
	    start = Sk.misceval.asIndex(start);
	}
    }
    else {
	start = 0;
    }

    var it = iterable.tp$iter();

    this.tp$iter = function() { return this; };
    this.$index = start;
    this.tp$iternext = function () {
        // todo; StopIteration
        var next = it.tp$iternext();
        if (next === undefined) return undefined;
	var idx = Sk.builtin.assk$(this.$index++, Sk.builtin.nmber.int$);
        return new Sk.builtin.tuple([idx, next]);
    };

    this.__class__ = Sk.builtin.enumerate;

    return this;
}

Sk.builtin.enumerate.prototype.tp$name = "enumerate";
Sk.builtin.enumerate.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('enumerate', Sk.builtin.enumerate);

Sk.builtin.enumerate.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

Sk.builtin.enumerate.prototype['__iter__'] = new Sk.builtin.func(function(self)
{
    return self.tp$iter();
});								 

Sk.builtin.enumerate.prototype['next'] = new Sk.builtin.func(function(self)
{
    return self.tp$iternext();
});								 
