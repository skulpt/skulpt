(function() {

/**
 * @constructor
 * @param {Array.<Object>} L
 */
var $ = Sk.builtin.tuple = function(L)
{
    if (L instanceof $) return;
    if (!(this instanceof $)) return new $(L);
    if (Object.prototype.toString.apply(L) === '[object Array]')
        this.v = L;
    else
        this.v = L.v;
    this.__class__ = this.nativeclass$ = $;
    return this;
};

$.prototype.count = function() { throw "todo; tuple.count"; };
$.prototype.index = function() { throw "todo; tuple.index"; };
$.prototype.__class__ = new Sk.builtin.type('tuple', [Sk.types.object], {});

$.prototype.__getitem__ = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new Sk.builtin.IndexError("tuple index out of range");
        return this.v[index];
    }
    else if (index instanceof Sk.builtin.slice)
    {
        var ret = [];
        index.sssiter$(this, function(i, wrt)
                {
                    ret.push(wrt.v[i]);
                });
        return new $(ret);
    }
    else
        throw new TypeError("tuple indices must be integers, not " + typeof index);
};

$.prototype.__repr__ = function()
{
    var asStrs = [];
    for (var it = this.__iter__(), i = it.next(); i !== undefined; i = it.next())
        asStrs.push(Sk.builtin.repr(i).v);
    if (asStrs.length === 1)
        return new Sk.builtin.str("(" + asStrs[0] + ",)");
    else
        return new Sk.builtin.str("(" + asStrs.join(", ") + ")");
};

$.prototype.__add__ = $.prototype.__radd__ = function(other)
{
    return new $(this.v.concat(other.v));
};

$.prototype.__mul__ = $.prototype.__rmul__ = function(other)
{
    if (typeof other !== "number") throw "TypeError"; // todo; long, better error
    var ret = [];
    for (var i = 0; i < other; ++i)
    {
        for (var j = 0; j < this.v.length; ++ j)
        {
            ret.push(this.v[j]);
        }
    }
    return new $(ret);
};

$.prototype.richcmp$ = function(rhs, op)
{
    if (rhs.constructor !== $) return false;

    // find the first item where they're different
    for (var i = 0; i < this.v.length && i < rhs.v.length; ++i)
    {
        if (!Sk.cmp(this.v[i], rhs.v[i], '=='))
            break;
    }

    // no items to compare (compare func could have modified for ==/!=)
    var ts = this.v.length;
    var rs = rhs.v.length;
    if (i >= ts || i >= rs)
    {
        switch (op)
        {
            case '<': return ts < rs;
            case '<=': return ts <= rs;
            case '>': return ts > rs;
            case '>=': return ts >= rs;
            case '!=': return ts !== rs;
            case '==': return ts === rs;
            default: throw "assert";
        }
    }

    // we have a different item
    if (op === '==') return false;
    if (op === '!=') return true;

    // or compare the final item
    return Sk.cmp(this.v[i], rhs.v[i], op);
};

// todo; the numbers and order are taken from python, but the answer's
// obviously not the same because there's no int wrapping. shouldn't matter,
// but would be nice to make the hash() values the same if it's not too
// expensive to simplify tests.
$.prototype.__hash__ = function()
{
    var mult = 1000003;
    var x = 0x345678;
    var len = this.v.length;
    for (var i = 0; i < len; ++i)
    {
        var y = Sk.builtin.hash(this.v[i]);
        if (y === -1) return -1;
        x = (x ^ y) * mult;
        mult += 82520 + len + len;
    }
    x += 97531;
    if (x === -1) x = -2;
    return x;
};

$.prototype.__iter__ = function()
{
    var ret =
    {
        __iter__: function() { return ret; },
        $obj: this,
        $index: 0,
        next: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$obj.v.length) return undefined;
            return ret.$obj.v[ret.$index++];
        }
    };
    return ret;
};

}());
