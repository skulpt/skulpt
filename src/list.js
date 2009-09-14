List$ = function(L)
{
    if (Object.prototype.toString.apply(L) !== '[object Array]')
        throw "TypeError: list expecting native Array as argument";
    this.v = L;
};

function list(iterable)
{
    var g = iterable.__iter__();
    var ret = new List$([]);
    for (var i = g.next(); i !== undefined; i = g.next())
    {
        ret.v.push(i);
    }
    return ret;
}

List$.prototype.append = function(item)
{
    this.v.push(item);
    return null;
};

List$.prototype.count = function() { throw "todo; list.count"; };

List$.prototype.extend = function(L)
{
    var self = this;
    sk$iter(L, function(v) { self.v.push(v); });
    return null;
};

List$.prototype.index = function(item)
{
    var len = this.v.length;
    var obj = this.v;
    for (var i = 0; i < len; ++i)
    {
        // todo; eq
        if (obj[i] === item) return i;
    }
    throw "ValueError: list.index(x): x not in list";
};

List$.prototype.insert = function() { throw "todo; list.insert"; };

List$.prototype.pop = function() { throw "todo; list.pop"; };

List$.prototype.remove = function() { throw "todo; list.remove"; };

List$.prototype.reverse = function() { throw "todo; list.reverse"; };

List$.prototype.sort = function()
{
    // todo; cmp, key, rev
    // todo; totally wrong except for numbers
    this.v.sort();
    return null;
};

List$.prototype.__setitem__ = function(index, value)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new IndexError("list assignment index out of range");
        this.v[index] = value;
    }
    else if (index instanceof Slice$)
    {
        var sss = index.indices(this);
        if (sss[2] === 1)
        {
            // can do non-same-size replaces here (no fancy steps)
            var args = value.v.slice(0);
            args.unshift(sss[1] - sss[0]);
            args.unshift(sss[0]);
            this.v.splice.apply(this.v, args);
        }
        else
        {
            var tosub = [];
            index.sssiter$(this, function(i, wrt) { tosub.push(i); });
            var j = 0;
            if (tosub.length !== value.v.length) throw new ValueError("attempt to assign sequence of size " + value.v.length + " to extended slice of size " + tosub.length);
            for (var i = 0; i < tosub.length; ++i)
            {
                this.v.splice(tosub[i], 1, value.v[j]);
                j += 1;
            }
        }
    }
    else
        throw new TypeError("list indices must be integers, not " + typeof index);
    return null;
};
List$.prototype.__getitem__ = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new IndexError("list index out of range");
        return this.v[index];
    }
    else if (index instanceof Slice$)
    {
        var ret = [];
        index.sssiter$(this, function(i, wrt)
                {
                    ret.push(wrt.v[i]);
                });
        return new List$(ret);
    }
    else
        throw new TypeError("list indices must be integers, not " + typeof index);
};
List$.prototype.__delitem__ = function(index)
{
    if (typeof index === "number")
    {
        this.v.splice(index, 1);
    }
    else if (index instanceof Slice$)
    {
        // todo; inefficient
        var todel = [];
        index.sssiter$(this, function(i, wrt) { todel.push(i); });
        if (todel.length > 0)
        {
            var i;
            if (todel[todel.length - 1] > todel[0])
                for (i = todel.length - 1; i >= 0; --i) this.v.splice(todel[i], 1);
            else
                for (i = 0; i < todel.length; ++i) this.v.splice(todel[i], 1);
        }
    }
    else
    {
        throw new TypeError("list indices must be integers");
    }
    return this;
};

List$.prototype.__add__ = function(other)
{
    var ret = this.v.slice();
    for (var i = 0; i < other.v.length; ++i)
    {
        ret.push(other.v[i]);
    }
    return new List$(ret);
};

List$.prototype.__mul__ = function(other)
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
    return new List$(ret);
};

List$.prototype.__repr__ = function()
{
    var asStrs = [];
    sk$iter(this, function(v) { asStrs.push(repr(v).v); });
    return new Str$("[" + asStrs.join(", ") + "]");
};

List$.prototype.__class__ = new Type$('list', [sk$TypeObject], {});

List$.prototype.__iter__ = function()
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
