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

function tuple(L) { return new Tuple$(L.v); }
