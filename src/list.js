/**
 * @constructor
 * @param {Array.<Object>=} L
 * @extends Sk.builtin.object
 */
Sk.builtin.list = function(L)
{
    if (!(this instanceof Sk.builtin.list)) return new Sk.builtin.list(L);

    if (L === undefined)
    {
            this.v = [];
    }
    else if (Object.prototype.toString.apply(L) === '[object Array]')
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

    this.__class__ = Sk.builtin.list;

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
    // other not a list
    if (!other.__class__ || other.__class__ != Sk.builtin.list)
    {
        throw new Sk.builtin.TypeError("can only concatenate list to list");
    }

    var ret = this.v.slice();
    for (var i = 0; i < other.v.length; ++i)
    {
        ret.push(other.v[i]);
    }
    return new Sk.builtin.list(ret);
}

Sk.builtin.list.prototype.list_del_item_ = function(i)
{
    i = Sk.builtin.asnum$(i);
    if (i < 0 || i >= this.v.length)
        throw new Sk.builtin.IndexError("list assignment index out of range");
    this.list_del_slice_(i, i+1);    
};

Sk.builtin.list.prototype.list_del_slice_ = function(ilow, ihigh)
{
    ilow = Sk.builtin.asnum$(ilow);
    ihigh = Sk.builtin.asnum$(ihigh);
    var args = [];
    args.unshift(ihigh - ilow);
    args.unshift(ilow);
    this.v.splice.apply(this.v, args);
};

Sk.builtin.list.prototype.list_ass_item_ = function(i, v)
{
	i = Sk.builtin.asnum$(i);
    if (i < 0 || i >= this.v.length)
        throw new Sk.builtin.IndexError("list assignment index out of range");
    this.v[i] = v;
};

Sk.builtin.list.prototype.list_ass_slice_ = function(ilow, ihigh, v)
{
	ilow = Sk.builtin.asnum$(ilow);
	ihigh = Sk.builtin.asnum$(ihigh);

    // todo; item rather list/null
    var args = v.v.slice(0);
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
    // todo; can't figure out where cpy handles this silly case (test/run/t96.py)
    // perhaps by trapping a stack overflow? otherwise i'm not sure for more
    // complicated cases. bleh
    //
    // if the comparison allows for equality then short-circuit it here
    if (this === w && Sk.misceval.opAllowsEquality(op))
        return true;

    // w not a list
    if (!w.__class__ || w.__class__ != Sk.builtin.list)
    {
        // shortcuts for eq/not
        if (op === 'Eq') return false;
        if (op === 'NotEq') return true;

        // todo; other types should have an arbitrary order
        return false;
    }

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
Sk.builtin.list.prototype.nb$add = Sk.builtin.list.prototype.list_concat_;
Sk.builtin.list.prototype.nb$inplace_add = Sk.builtin.list.prototype.list_concat_;
Sk.builtin.list.prototype.sq$repeat = function(n)
{
    if (!Sk.builtin.checkInt(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) +"'");
    }

    n = Sk.builtin.asnum$(n);
    var ret = [];
    for (var i = 0; i < n; ++i)
        for (var j = 0; j < this.v.length; ++j)
            ret.push(this.v[j]);
    return new Sk.builtin.list(ret);
};
Sk.builtin.list.prototype.nb$multiply = Sk.builtin.list.prototype.sq$repeat;
Sk.builtin.list.prototype.nb$inplace_multiply = Sk.builtin.list.prototype.sq$repeat;
/*
Sk.builtin.list.prototype.sq$item = list_item;
Sk.builtin.list.prototype.sq$slice = list_slice;
*/
Sk.builtin.list.prototype.sq$ass_item = Sk.builtin.list.prototype.list_ass_item_;
Sk.builtin.list.prototype.sq$del_item = Sk.builtin.list.prototype.list_del_item_;
Sk.builtin.list.prototype.sq$ass_slice = Sk.builtin.list.prototype.list_ass_slice_;
Sk.builtin.list.prototype.sq$del_slice = Sk.builtin.list.prototype.list_del_slice_;
//Sk.builtin.list.prototype.sq$contains // iter version is fine
/*
Sk.builtin.list.prototype.sq$inplace_concat = list_inplace_concat;
Sk.builtin.list.prototype.sq$inplace_repeat = list_inplace_repeat;
*/

Sk.builtin.list.prototype.list_subscript_ = function(index)
{
    if (Sk.misceval.isIndex(index))
    {
        var i = Sk.misceval.asIndex(index);
        if (i !== undefined) 
        {
            if (i < 0) i = this.v.length + i;
            if (i < 0 || i >= this.v.length) {
                throw new Sk.builtin.IndexError("list index out of range");
            }
            return this.v[i]
        }
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

    throw new Sk.builtin.TypeError("list indices must be integers, not " + Sk.abstr.typeName(index));
};

Sk.builtin.list.prototype.list_ass_subscript_ = function(index, value)
{
    if (Sk.misceval.isIndex(index))
    {
        var i = Sk.misceval.asIndex(index);
        if (i !== undefined) 
        {
            if (i < 0) i = this.v.length + i;
            this.list_ass_item_(i, value);
            return;
        }
    }
    else if (index instanceof Sk.builtin.slice)
    {
        var indices = index.indices(this.v.length);
        if (indices[2] === 1) 
        {
            this.list_ass_slice_(indices[0], indices[1], value);
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
        return;
    }

    throw new Sk.builtin.TypeError("list indices must be integers, not " + Sk.abstr.typeName(index));
};

Sk.builtin.list.prototype.list_del_subscript_ = function(index)
{
    if (Sk.misceval.isIndex(index))
    {
        var i = Sk.misceval.asIndex(index);
        if (i !== undefined) 
        {
            if (i < 0) i = this.v.length + i;
            this.list_del_item_(i);
            return;
        }
    }
    else if (index instanceof Sk.builtin.slice)
    {
        var indices = index.indices(this.v.length);
        if (indices[2] === 1)
        {
            this.list_del_slice_(indices[0], indices[1]);
        }
        else
        {
            var self = this;
            var dec = 0; // offset of removal for next index (because we'll have removed, but the iterator is giving orig indices)
            var offdir = indices[2] > 0 ? 1 : 0;
            index.sssiter$(this, function(i, wrt)
                           {
                               self.v.splice(i - dec, 1);
                               dec += offdir;
                           });
        }
        return;
    }

    throw new Sk.builtin.TypeError("list indices must be integers, not " + typeof index);
};

Sk.builtin.list.prototype.mp$subscript = Sk.builtin.list.prototype.list_subscript_;
Sk.builtin.list.prototype.mp$ass_subscript = Sk.builtin.list.prototype.list_ass_subscript_;
Sk.builtin.list.prototype.mp$del_subscript = Sk.builtin.list.prototype.list_del_subscript_;

Sk.builtin.list.prototype.__getitem__ = new Sk.builtin.func(function(self, index)
{
    return Sk.builtin.list.prototype.list_subscript_.call(self, index);
});

/**
 * @param {?=} self
 * @param {?=} cmp optional
 * @param {?=} key optional
 * @param {?=} reverse optional
 */
Sk.builtin.list.prototype.list_sort_ = function(self, cmp, key, reverse) {
    var has_key = key !== undefined && key !== null;
    var has_cmp = cmp !== undefined && cmp !== null;
    if (reverse == undefined) { reverse = false; }

    var timsort = new Sk.builtin.timSort(self);

    self.v = [];
    var zero = new Sk.builtin.nmber(0, Sk.builtin.nmber.int$);

    if (has_key){
        if (has_cmp) {
            timsort.lt = function(a, b){
                var res = Sk.misceval.callsim(cmp, a[0], b[0])
                return Sk.misceval.richCompareBool(res, zero, "Lt");
            };
        }
        else{
            timsort.lt = function(a, b) {
                return Sk.misceval.richCompareBool(a[0], b[0], "Lt");
            }
        }
        for (var i =0; i < timsort.listlength; i++){
            var item = timsort.list.v[i];
            var keyvalue = Sk.misceval.callsim(key, item);
            timsort.list.v[i] = [keyvalue, item];
        }
    } else if (has_cmp) {
        timsort.lt = function(a, b){
            var res = Sk.misceval.callsim(cmp, a, b);
            return Sk.misceval.richCompareBool(res, zero, "Lt");
        };
    }

    if (reverse){
        timsort.list.list_reverse_(timsort.list);
    }

    timsort.sort();

    if (reverse){
        timsort.list.list_reverse_(timsort.list);
    }

    if (has_key){
        for (var j = 0; j < timsort.listlength; j++){
            item = timsort.list.v[j][1];
            timsort.list.v[j] = item;
        }
    }

    var mucked = self.sq$length() > 0;

    self.v = timsort.list.v;

    if (mucked) {
        throw new Sk.builtin.OperationError("list modified during sort");
    }

    return Sk.builtin.none.none$;
}

/**
 * @param {Sk.builtin.list=} self optional
 **/
Sk.builtin.list.prototype.list_reverse_ = function(self)
{
    Sk.builtin.pyCheckArgs("reverse", arguments, 1, 1);

    var len = self.v.length;
    var old = self.v;
    var newarr = [];
    for (var i = len -1; i > -1; --i)
    {
        newarr.push(old[i]);
    }
    self.v = newarr;
    return Sk.builtin.none.none$;
}

//Sk.builtin.list.prototype.__reversed__ = todo;
Sk.builtin.list.prototype['__iter__'] = new Sk.builtin.func(function(self)
{
    Sk.builtin.pyCheckArgs("__iter__", arguments, 1, 1);

    return self.list_iter_();
});

Sk.builtin.list.prototype['append'] = new Sk.builtin.func(function(self, item)
{
    Sk.builtin.pyCheckArgs("append", arguments, 2, 2);

    self.v.push(item);
    return Sk.builtin.none.none$;
});

Sk.builtin.list.prototype['insert'] = new Sk.builtin.func(function(self, i, x)
{
    Sk.builtin.pyCheckArgs("insert", arguments, 3, 3);
    if (!Sk.builtin.checkNumber(i)) {
        throw new Sk.builtin.TypeError("an integer is required");
    };

    i = Sk.builtin.asnum$(i);
    if (i < 0) {
	i = i + self.v.length;
    }
    if (i < 0) {
	i = 0;
    }
    else if (i > self.v.length) {
	i = self.v.length;
    }
    self.v.splice(i, 0, x);
    return Sk.builtin.none.none$;
});

Sk.builtin.list.prototype['extend'] = new Sk.builtin.func(function(self, b)
{
    Sk.builtin.pyCheckArgs("extend", arguments, 2, 2);
    if (!Sk.builtin.checkIterable(b)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(b) 
                                        + "' object is not iterable");  
    };
    if (self == b) {
        // Handle extending list with itself
        var newb = [];
        for (var it = b.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
            newb.push(i);

        // Concatenate
        self.v.push.apply(self.v, newb);

        return Sk.builtin.none.none$;
    };
    for (var it = b.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
        self.v.push(i);
    return Sk.builtin.none.none$;
});

Sk.builtin.list.prototype['pop'] = new Sk.builtin.func(function(self, i)
{
    Sk.builtin.pyCheckArgs("pop", arguments, 1, 2);
    if (i === undefined) {
        i = self.v.length - 1;
    };
    if (!Sk.builtin.checkNumber(i)) {
        throw new Sk.builtin.TypeError("an integer is required");
    };

    i = Sk.builtin.asnum$(i);
    if (i < 0) {
	i = i + self.v.length;
    }
    if ((i < 0) || (i >= self.v.length)) {
        throw new Sk.builtin.IndexError("pop index out of range");
    };

    var ret = self.v[i];
    self.v.splice(i, 1);
    return ret;
});

Sk.builtin.list.prototype['remove'] = new Sk.builtin.func(function(self, item)
{
    Sk.builtin.pyCheckArgs("remove", arguments, 2, 2);

    var idx = Sk.builtin.list.prototype['index'].func_code(self, item);
    self.v.splice(Sk.builtin.asnum$(idx), 1);
    return Sk.builtin.none.none$;
});

Sk.builtin.list.prototype['index'] = new Sk.builtin.func(function(self, item, start, stop)
{
    Sk.builtin.pyCheckArgs("index", arguments, 2, 4);
    if (start !== undefined && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers");
    }
    if (stop !== undefined && !Sk.builtin.checkInt(stop)) {
        throw new Sk.builtin.TypeError("slice indices must be integers");
    }

    var len = self.v.length;
    var obj = self.v;

    start = (start === undefined) ? 0 : start.v;
    if (start < 0) {
        start = ((start + len) >= 0) ? start + len : 0;
    }

    stop = (stop === undefined) ? len : stop.v;
    if (stop < 0) {
        stop = ((stop + len) >= 0) ? stop + len : 0;
    }

    for (var i = start; i < stop; ++i)
    {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq"))
            return Sk.builtin.assk$(i, Sk.builtin.nmber.int$);
    }
    throw new Sk.builtin.ValueError("list.index(x): x not in list");
});

Sk.builtin.list.prototype['count'] = new Sk.builtin.func(function(self, item)
{
    Sk.builtin.pyCheckArgs("count", arguments, 2, 2);

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
    return new Sk.builtin.nmber(count, Sk.builtin.nmber.int$);
});

Sk.builtin.list.prototype['reverse'] = new Sk.builtin.func(Sk.builtin.list.prototype.list_reverse_);

Sk.builtin.list.prototype['sort'] = new Sk.builtin.func(Sk.builtin.list.prototype.list_sort_);

// Make sure that key/value variations of lst.sort() work
// See issue 45 on github as to possible alternate approaches to this and
// why this was chosen - csev
Sk.builtin.list.prototype['sort'].func_code['co_varnames']=['__self__','cmp', 'key', 'reverse'];
goog.exportSymbol("Sk.builtin.list", Sk.builtin.list);
