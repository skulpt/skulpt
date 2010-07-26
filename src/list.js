(function() {

var $ = Sk.builtin.list = function list(L)
{
    if (L instanceof $) return L;
    if (!(this instanceof $)) return new $(L);

    if (Object.prototype.toString.apply(L) === '[object Array]')
    {
        this.v = L;
    }
    else
    {
        var g = L.__iter__();
        this.v = [];
        for (var i = g.next(); i !== undefined; i = g.next())
        {
            this.v.push(i);
        }
    }

    this.__class__ = this.nativeclass$ = $;
    return this;
};

$.append = function(self, item)
{
    self.v.push(item);
    return null;
};

$.count = function() { throw "todo; list.count"; };

$.extend = function(self, L)
{
    for (var it = L.__iter__(), i = it.next(); i !== undefined; i = it.next())
        self.v.push(i);
    return null;
};

$.index = function(self, item)
{
    var len = self.v.length;
    var obj = self.v;
    for (var i = 0; i < len; ++i)
    {
        // todo; eq
        if (obj[i] === item) return i;
    }
    throw "ValueError: list.index(x): x not in list";
};

$.insert = function(self, i, x)
{
    if (i < 0) i = 0;
    else if (i > self.v.length) i = self.v.length;
    self.v.splice(i, 0, x);
};

$.pop = function(self, i)
{
    if (i === undefined) i = self.v.length - 1;
    var ret = self.v[i];
    self.v.splice(i, 1);
    return ret;
};

$.remove = function() { throw "todo; list.remove"; };

$.reverse = function() { throw "todo; list.reverse"; };

$.sort = function(self)
{
    // todo; cmp, key, rev
    // todo; totally wrong except for numbers
    self.v.sort();
    return null;
};

$.prototype.__setitem__ = function(index, value)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new IndexError("list assignment index out of range");
        this.v[index] = value;
    }
    else if (index instanceof Sk.builtin.slice)
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
$.prototype.__getitem__ = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new IndexError("list index out of range");
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
        throw new TypeError("list indices must be integers, not " + typeof index);
};
$.prototype.__delitem__ = function(index)
{
    if (typeof index === "number")
    {
        this.v.splice(index, 1);
    }
    else if (index instanceof Sk.builtin.slice)
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

$.prototype.__add__ = function(other)
{
    var ret = this.v.slice();
    for (var i = 0; i < other.v.length; ++i)
    {
        ret.push(other.v[i]);
    }
    return new $(ret);
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

$.prototype.__repr__ = function()
{
    var asStrs = [];
    for (var it = this.__iter__(), i = it.next(); i !== undefined; i = it.next())
        asStrs.push(Sk.builtin.repr(i).v);
    return new Sk.builtin.str("[" + asStrs.join(", ") + "]");
};

$.prototype.richcmp$ = function(rhs, op)
{
    if (rhs.constructor !== $) return false;

    // different lengths; early out
    if (this.v.length !== rhs.v.length && (op === '!=' || op === '=='))
    {
        if (op === '!=') return true;
        return false;
    }

    // silly early out for recursive lists
    if (this === rhs)
    {
        switch (op)
        {
            case '<': case '>': case '!=': return false;
            case '<=': case '>=': case '==': return true;
            default: throw "assert";
        }
    }

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
