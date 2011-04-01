/**
 * @constructor
 * @param {Array.<Object>} L
 * @extends Sk.builtin.object
 */
Sk.builtin.list = function(L)
{
    if (!(this instanceof Sk.builtin.list)) return new Sk.builtin.list(L);

    if (Object.prototype.toString.apply(L) === '[object Array]')
    {
        this.v = L;
    }
    else
    {
        if (L.tp$iter)
        {
            this.v = [];
            for (var it = L.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
                this.v.push(i);
        }
        else
            throw new Sk.builtin.ValueError("expecting Array or iterable");
    }

    this["v"] = this.v;
    return this;
};


Sk.builtin.list.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('list', Sk.builtin.list);

Sk.builtin.list.prototype.list_iter_ = function()
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

Sk.builtin.list.prototype.list_concat_ = function(other)
{
    var ret = this.v.slice();
    for (var i = 0; i < other.v.length; ++i)
    {
        ret.push(other.v[i]);
    }
    return new Sk.builtin.list(ret);
}

Sk.builtin.list.prototype.list_ass_item_ = function(i, v)
{
    if (i < 0 || i >= this.v.length)
        throw new Sk.builtin.IndexError("list assignment index out of range");
    if (v === null)
        return Sk.builtin.list.prototype.list_ass_slice_.call(this, i, i+1, v);
    this.v[i] = v;
};

Sk.builtin.list.prototype.list_ass_slice_ = function(ilow, ihigh, v)
{
    // todo; item rather list/null
    var args = v === null ? [] : v.v.slice(0);
    args.unshift(ihigh - ilow);
    args.unshift(ilow);
    this.v.splice.apply(this.v, args);
};

Sk.builtin.list.prototype.tp$name = "list";
Sk.builtin.list.prototype['$r'] = function()
{
    var ret = [];
    for (var it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
        ret.push(Sk.misceval.objectRepr(i).v);
    return new Sk.builtin.str("[" + ret.join(", ") + "]");
};
Sk.builtin.list.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.list.prototype.tp$hash = Sk.builtin.object.prototype.HashNotImplemented;

Sk.builtin.list.prototype.tp$richcompare = function(w, op)
{
    // todo; NotImplemented if either isn't a list

    // todo; can't figure out where cpy handles this silly case (test/run/t96.py)
    // perhaps by trapping a stack overflow? otherwise i'm not sure for more
    // complicated cases. bleh
    //
    // if the comparison allows for equality then short-circuit it here
    if (this === w && Sk.misceval.opAllowsEquality(op))
        return true;

    var v = this.v;
    var w = w.v;
    var vl = v.length;
    var wl = w.length;

    var i;
    for (i = 0; i < vl && i < wl; ++i)
    {
        var k = Sk.misceval.richCompareBool(v[i], w[i], 'Eq');
        if (!k) break;
    }

    if (i >= vl || i >= wl)
    {
        // no more items to compare, compare sizes
        switch (op)
        {
            case 'Lt': return vl < wl;
            case 'LtE': return vl <= wl;
            case 'Eq': return vl === wl;
            case 'NotEq': return vl !== wl;
            case 'Gt': return vl > wl;
            case 'GtE': return vl >= wl;
            default: goog.asserts.fail();
        }
    }

    // we have an item that's different

    // shortcuts for eq/not
    if (op === 'Eq') return false;
    if (op === 'NotEq') return true;

    // or, compare the differing element using the proper operator
    return Sk.misceval.richCompareBool(v[i], w[i], op);
};

Sk.builtin.list.prototype.tp$iter = Sk.builtin.list.prototype.list_iter_;
Sk.builtin.list.prototype.sq$length = function() { return this.v.length; };
Sk.builtin.list.prototype.sq$concat = Sk.builtin.list.prototype.list_concat_;
Sk.builtin.list.prototype.sq$repeat = function(n)
{
    var ret = [];
    for (var i = 0; i < n; ++i)
        for (var j = 0; j < this.v.length; ++j)
            ret.push(this.v[j]);
    return new Sk.builtin.list(ret);
};
/*
Sk.builtin.list.prototype.sq$item = list_item;
Sk.builtin.list.prototype.sq$slice = list_slice;
*/
Sk.builtin.list.prototype.sq$ass_item = Sk.builtin.list.prototype.list_ass_item_;
Sk.builtin.list.prototype.sq$ass_slice = Sk.builtin.list.prototype.list_ass_slice_;
//Sk.builtin.list.prototype.sq$contains // iter version is fine
/*
Sk.builtin.list.prototype.sq$inplace_concat = list_inplace_concat;
Sk.builtin.list.prototype.sq$inplace_repeat = list_inplace_repeat;
*/

Sk.builtin.list.prototype.list_subscript_ = function(index)
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

Sk.builtin.list.prototype.list_ass_item_ = function(i, value)
{
    if (i < 0 || i >= this.v.length) throw new Sk.builtin.IndexError("list index out of range");
    if (value === null)
        this.list_ass_slice_(i, i+1, value);
    else
        this.v[i] = value;
};

Sk.builtin.list.prototype.list_ass_subscript_ = function(index, value)
{
    if (Sk.misceval.isIndex(index))
    {
        var i = Sk.misceval.asIndex(index);
        if (i < 0) i = this.v.length + i;
        this.list_ass_item_(i, value);
    }
    else if (index instanceof Sk.builtin.slice)
    {
        if (index.step === 1)
            this.list_ass_slice_(index.start, index.stop, value);
        else
        {
            if (value === null)
            {
                var self = this;
                var dec = 0; // offset of removal for next index (because we'll have removed, but the iterator is giving orig indices)
                var offdir = index.step > 0 ? 1 : 0;
                index.sssiter$(this, function(i, wrt)
                        {
                            self.v.splice(i - dec, 1);
                            dec += offdir;
                        });
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
    }
    else
        throw new TypeError("list indices must be integers, not " + typeof index);
};

Sk.builtin.list.prototype.mp$subscript = Sk.builtin.list.prototype.list_subscript_;
Sk.builtin.list.prototype.mp$ass_subscript = Sk.builtin.list.prototype.list_ass_subscript_;

Sk.builtin.list.prototype.__getitem__ = new Sk.builtin.func(function(self, index)
        {
            return Sk.builtin.list.prototype.list_subscript_.call(self, index);
        });
//Sk.builtin.list.prototype.__reversed__ = todo;
Sk.builtin.list.prototype['append'] = new Sk.builtin.func(function(self, item)
{
    self.v.push(item);
    return null;
});

Sk.builtin.list.prototype['insert'] = new Sk.builtin.func(function(self, i, x)
{
    if (i < 0) i = 0;
    else if (i > self.v.length) i = self.v.length - 1;
    self.v.splice(i, 0, x);
});

Sk.builtin.list.prototype['extend'] = new Sk.builtin.func(function(self, b)
{
    for (var it = b.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
        self.v.push(i);
    return null;
});

Sk.builtin.list.prototype['pop'] = new Sk.builtin.func(function(self, i)
{
    if (i === undefined) i = self.v.length - 1;
    var ret = self.v[i];
    self.v.splice(i, 1);
    return ret;
});

Sk.builtin.list.prototype['remove'] = new Sk.builtin.func(function(self, item)
{
    var idx = Sk.builtin.list.prototype['index'].func_code(self, item);
    self.v.splice(idx, 1);
    return null;
});

Sk.builtin.list.prototype['index'] = new Sk.builtin.func(function(self, item)
{
    var len = self.v.length;
    var obj = self.v;
    for (var i = 0; i < len; ++i)
    {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq"))
            return i;
    }
    throw new Sk.builtin.ValueError("list.index(x): x not in list");
});

Sk.builtin.list.prototype['count'] = new Sk.builtin.func(function(self, item)
{
    var len = self.v.length;
    var obj = self.v;
    var count = 0;
    for (var i = 0; i < len; ++i)
    {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq"))
        {
            count += 1;
        }
    }
    return count;
});

Sk.builtin.list.prototype['reverse'] = new Sk.builtin.func(function(self)
{
    var len = self.v.length;
    var old = self.v;
    var newarr = [];
    for (var i = len -1; i > -1; --i)
    {
        newarr.push(old[i]);
    }
    self.v = newarr;
    return null;
});

Sk.builtin.list.prototype['sort'] = new Sk.builtin.func(function(self, cmp, key, reverse)
{
    goog.asserts.assert(!key, "todo;");
    goog.asserts.assert(!reverse, "todo;");
    Sk.mergeSort(self.v, cmp);
    return null;
});

goog.exportSymbol("Sk.builtin.list", Sk.builtin.list);