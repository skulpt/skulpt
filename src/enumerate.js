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
        if (!Sk.builtin.checkNumber(start)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(start) + "' object cannot be interpreted as an index");
        }
    }

    this.v = iterable;
    this.start = start;

    this.__class__ = Sk.builtin.enumerate;
}

Sk.builtin.enumerate.prototype.tp$name = "enumerate";
Sk.builtin.enumerate.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('enumerate', Sk.builtin.enumerate);

Sk.builtin.enumerate.prototype.tp$iter = function()
{
    var start = 0;
    if (this.start !== undefined) {
        start = this.start;
    }

    var it = this.v.tp$iter();

    var ret =
    {
        tp$iter: function() { return ret; },
        $obj: this,
        $index: start,
        tp$iternext: function()
        {
            // todo; StopIteration
            var n = it.tp$iternext();
            if (n === undefined) return undefined;
            return new Sk.builtin.tuple([ret.$index++, n]);
        }
    };
    return ret;
}