Tuple$ = function(L)
{
    this.v = L;
};

Tuple$.prototype.iter$ = function(f)
{
    for (var i = 0; i < this.v.length; ++i)
    {
        if (f.call(null, this.v[i]) === false) break;
    }
};

Tuple$.prototype.count = function() { throw "todo; tuple.count"; };
Tuple$.prototype.index = function() { throw "todo; tuple.index"; };

Tuple$.prototype.__getitem__ = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new IndexError("tuple index out of range");
        return this.v[index];
    }
    else if (index instanceof Slice$)
    {
        var ret = [];
        index.sssiter$(this, function(i, wrt)
                {
                    ret.push(wrt.v[i]);
                });
        return new Tuple$(ret);
    }
    else
        throw new TypeError("tuple indices must be integers, not " + typeof index);
};

Tuple$.prototype.__repr__ = function()
{
    var asStrs = [];
    sk$iter(this, function(v) { asStrs.push(repr(v).v); });
    if (asStrs.length === 1)
        return new Str$("(" + asStrs[0] + ",)");
    else
        return new Str$("(" + asStrs.join(", ") + ")");
};

Tuple$.prototype.__mul__ = function(other)
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
    return new Tuple$(ret);
};

// todo; the numbers and order are taken from python, but the answer's
// obviously not the same because there's no int wrapping. shouldn't matter,
// but would be nice to make the hash() values the same if it's not too
// expensive to simplify tests.
Tuple$.prototype.__hash__ = function()
{
    var mult = 1000003;
    var x = 0x345678;
    for (var i = 0; i < this.v.length; ++i)
    {
        var y = hash(this.v[i]) === -1;
        if (y === -1) return -1;
        x = (x ^ y) * mult;
        mult += 82520 + len + len;
    }
    x += 97531;
    if (x === -1) x = -1;
    return x;
};

function tuple(L) { return new Tuple$(L.v); }

Tuple$.prototype.__iter__ = function()
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
