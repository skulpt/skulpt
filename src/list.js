/**
 * @constructor
 * @param {Array.<Object>} L
 */
Sk.builtin.list = function(L)
{
    if (L instanceof Sk.builtin.list) return L;
    if (!(this instanceof Sk.builtin.list)) return new Sk.builtin.list(L);

    if (Object.prototype.toString.apply(L) === '[object Array]')
    {
        this.v = L;
    }
    else
    {
        this.v = [];
        Sk.builtin.list.list_extend_.call(this, L);
    }

    // todo; this should be elsewhere
    this.__dict__ = new Sk.builtin.dict([]);

    this.__class__ = this.nativeclass$ = Sk.builtin.list;
    return this;
};

Sk.builtin.list.list_extend_ = function(b)
{
    for (var it = b.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
        this.v.push(i);
    return null;
};

Sk.builtin.list.list_iter_ = function()
{
    var ret =
    {
        tp$iter: function() { return ret; },
        $obj: this,
        $index: 0,
        tp$iternext: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$obj.v.length) return undefined;
            return ret.$obj.v[ret.$index++];
        }
    };
    return ret;
};

Sk.builtin.list.list_concat_ = function(other)
{
    var ret = this.v.slice();
    for (var i = 0; i < other.v.length; ++i)
    {
        ret.push(other.v[i]);
    }
    return new Sk.builtin.list(ret);
}

Sk.builtin.list.list_ass_item_ = function(i, v)
{
    if (i < 0 || i >= this.v.length)
        throw new Sk.builtin.IndexError("list assignement index out of range");
    if (v === null)
        return Sk.builtin.list.list_ass_slice_.call(this, i, i+1, v);
    this.v[i] = v;
};

Sk.builtin.list.list_ass_slice_ = function(ilow, ihigh, v)
{
    // todo; item rather list/null
    var args = v === null ? [] : v.slice(0);
    args.unshift(ihigh - ilow);
    args.unshift(ilow);
    this.v.splice.apply(this.v, args);
};

Sk.builtin.list.listindex = function(item)
{
    var len = this.v.length;
    var obj = this.v;
    for (var i = 0; i < len; ++i)
    {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq"))
            return i;
    }
    throw new Sk.builtin.ValueError("list.index(x): x not in list");
}

// js types for some args. non-$ always use all python types.
Sk.builtin.list.prototype.tp$name = "list";
Sk.builtin.list.prototype.tp$repr = function()
{
    var ret = [];
    for (var it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
        ret.push(Sk.builtin.object.repr_(i).v);
    return new Sk.builtin.str("[" + ret.join(", ") + "]");
};
Sk.builtin.list.prototype.tp$getattr = Sk.builtin.object.GenericGetAttr;
/*
Sk.builtin.list.prototype.tp$richcompare = list_richcompare;
*/
Sk.builtin.list.prototype.tp$iter = Sk.builtin.list.list_iter_;
/*
Sk.builtin.list.prototype.sq$length = list_length;
*/
Sk.builtin.list.prototype.sq$concat = Sk.builtin.list.list_concat_;
/*
Sk.builtin.list.prototype.sq$repeat = list_repeat;
Sk.builtin.list.prototype.sq$item = list_item;
Sk.builtin.list.prototype.sq$slice = list_slice;
*/
Sk.builtin.list.prototype.sq$ass_item = Sk.builtin.list.list_ass_item_;
Sk.builtin.list.prototype.sq$ass_slice = Sk.builtin.list.list_ass_slice_;
//Sk.builtin.list.prototype.sq$contains // iter version is fine
/*
Sk.builtin.list.prototype.sq$inplace_concat = list_inplace_concat;
Sk.builtin.list.prototype.sq$inplace_repeat = list_inplace_repeat;
*/

Sk.builtin.list.list_subscript_ = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new Sk.builtin.IndexError("list index out of range");
        return this.v[index];
    }
    else if (index instanceof Sk.builtin.slice)
    {
        var ret = [];
        index.sssiter$(this, function(i, wrt)
                {
                    ret.push(wrt.v[i]);
                });
        return new Sk.builtin.list(ret);
    }
    else
        throw new TypeError("list indices must be integers, not " + typeof index);
};

Sk.builtin.list.list_extend_ = function(L)
{
    for (var it = L.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
        this.v.push(i);
    return null;
};

Sk.builtin.list.listsort = function()
{
    // todo; cmp, key, rev
    // todo; totally wrong except for numbers
    this.v.sort();
    return null;
};

Sk.builtin.list.prototype.mp$subscript = Sk.builtin.list.list_subscript_;

// tp$dict is the dict for the type object's attributes. this includes methods
// for builtin types which are found during lookup. we use a js object for
// these as a concession to some speed, though it strictly probably should be a
// dict as well.
Sk.builtin.list.prototype.tp$dict = {
    __getitem__: Sk.builtin.list.list_subscript_,
    /*
    __reversed__: list_reversed,
    append: listappend,
    insert: listinsert,
    */
    extend: Sk.builtin.list.list_extend_,
            /*
    pop: listpop,
    remove: listremove,
    */
    index: Sk.builtin.list.listindex,
    /*
    count: listcount,
    reverse: listreverse,
    */
    sort: Sk.builtin.list.listsort
};


// __dict__ is the instance's actual dict

    /*
$.append = function(self, item)
{
    self.v.push(item);
    return null;
};

$.count = function() { throw "todo; list.count"; };

$.index = function(self, item)
{
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

$.prototype.__setitem__ = function(index, value)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new Sk.builtin.IndexError("list assignment index out of range");
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
            if (tosub.length !== value.v.length) throw new Sk.builtin.ValueError("attempt to assign sequence of size " + value.v.length + " to extended slice of size " + tosub.length);
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
        if (index < 0 || index >= this.v.length) throw new Sk.builtin.IndexError("list index out of range");
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
*/

