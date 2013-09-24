/**
 * @constructor
 * @param {Array.<Object>} S
 */
Sk.builtin.set = function(S)
{
    if (!(this instanceof Sk.builtin.set)) return new Sk.builtin.set(S);

    if (typeof(S) === 'undefined')
    {
        S = [];
    }

    this.set_reset_();
    var S_list = new Sk.builtin.list(S);
    // python sorts sets on init, but not thereafter.
    // Skulpt seems to init a new set each time you add/remove something
    //Sk.builtin.list.prototype['sort'].func_code(S);
    for (var it = S_list.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
    {
        Sk.builtin.set.prototype['add'].func_code(this, i);
    }

    this.__class__ = Sk.builtin.set;

    this["v"] = this.v;
    return this;
};


Sk.builtin.set.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('set', Sk.builtin.set);

Sk.builtin.set.prototype.set_iter_ = function()
{
    var ret = Sk.builtin.dict.prototype['keys'].func_code(this['v']);
    return ret.tp$iter();
};

Sk.builtin.set.prototype.set_reset_ = function()
{
    this.v = new Sk.builtin.dict([]);
};

Sk.builtin.set.prototype.tp$name = 'set';
Sk.builtin.set.prototype['$r'] = function()
{
    var ret = [];
    for (var it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
    {
        ret.push(Sk.misceval.objectRepr(i).v);
    }
    return new Sk.builtin.str('set([' + ret.join(', ') + '])');
};
Sk.builtin.set.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
// todo; you can't hash a set() -- what should this be?
Sk.builtin.set.prototype.tp$hash = Sk.builtin.object.prototype.HashNotImplemented;

Sk.builtin.set.prototype.tp$richcompare = function(w, op)
{
    // todo; NotImplemented if either isn't a set

    if (this === w && Sk.misceval.opAllowsEquality(op))
        return true;

    // w not a set
    if (!w.__class__ || w.__class__ != Sk.builtin.set)
    {
        // shortcuts for eq/not
        if (op === 'Eq') return false;
        if (op === 'NotEq') return true;

        // todo; other types should have an arbitrary order
        return false;
    }

    var vl = this.sq$length();
    var wl = w.sq$length();

    // easy short-cut
    if (wl !== vl)
    {
        if (op === 'Eq')
            return false;
        if (op === 'NotEq')
            return true;
    }

    // used quite a lot in comparisons.
    var isSub = false;
    var isSuper = false;

    // gather common info
    switch (op)
    {
        case 'Lt':
        case 'LtE':
        case 'Eq':
        case 'NotEq':
            isSub = Sk.builtin.set.prototype['issubset'].func_code(this, w);
            break;
        case 'Gt':
        case 'GtE':
            isSuper = Sk.builtin.set.prototype['issuperset'].func_code(this, w);
            break;
        default:
            goog.asserts.fail();
    }

    switch (op)
    {
        case 'Lt':
            return vl < wl && isSub;
        case 'LtE':
        case 'Eq':  // we already know that the lengths are equal
            return isSub;
        case 'NotEq':
            return !isSub;
        case 'Gt':
            return vl > wl && isSuper;
        case 'GtE':
            return isSuper;
    }
};

Sk.builtin.set.prototype.tp$iter = Sk.builtin.set.prototype.set_iter_;
Sk.builtin.set.prototype.sq$length = function() { return this['v'].mp$length(); }

Sk.builtin.set.prototype['isdisjoint'] = new Sk.builtin.func(function(self, other)
{
    // requires all items in self to not be in other
    for (var it = self.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        var isIn = Sk.abstr.sequenceContains(other, item);
        if (isIn)
        {
            return Sk.builtin.bool.false$;
        }
    }
    return Sk.builtin.bool.true$;
});

Sk.builtin.set.prototype['issubset'] = new Sk.builtin.func(function(self, other)
{
    var selfLength = self.sq$length();
    var otherLength = other.sq$length();
    if (selfLength > otherLength)
    {
        // every item in this set can't be in other if it's shorter!
        return Sk.builtin.bool.false$;
    }
    for (var it = self.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        var isIn = Sk.abstr.sequenceContains(other, item);
        if (!isIn)
        {
            return Sk.builtin.bool.false$;
        }
    }
    return Sk.builtin.bool.true$;
});

Sk.builtin.set.prototype['issuperset'] = new Sk.builtin.func(function(self, other)
{
    return Sk.builtin.set.prototype['issubset'].func_code(other, self);
});

Sk.builtin.set.prototype['union'] = new Sk.builtin.func(function(self)
{
    var S = new Sk.builtin.set(self);
    for (var i=1; i < arguments.length; i++)
    {
        Sk.builtin.set.prototype['update'].func_code(S, arguments[i]);
    }
    return S;
});

Sk.builtin.set.prototype['intersection'] = new Sk.builtin.func(function(self)
{
    var S = Sk.builtin.set.prototype['copy'].func_code(self);
    arguments[0] = S;
    Sk.builtin.set.prototype['intersection_update'].func_code.apply(null, arguments);
    return S;
});

Sk.builtin.set.prototype['difference'] = new Sk.builtin.func(function(self, other)
{
    var S = Sk.builtin.set.prototype['copy'].func_code(self);
    arguments[0] = S;
    Sk.builtin.set.prototype['difference_update'].func_code.apply(null, arguments);
    return S;
});

Sk.builtin.set.prototype['symmetric_difference'] = new Sk.builtin.func(function(self, other)
{
    var S = Sk.builtin.set.prototype['union'].func_code(self, other);
    for (var it = S.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        if ( Sk.abstr.sequenceContains(self, item) && Sk.abstr.sequenceContains(other, item) )
        {
            Sk.builtin.set.prototype['discard'].func_code(S, item);
        }
    }
    return S;
});

Sk.builtin.set.prototype['copy'] = new Sk.builtin.func(function(self)
{
    return new Sk.builtin.set(self);
});

Sk.builtin.set.prototype['update'] = new Sk.builtin.func(function(self, other)
{
    for (var it = other.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        Sk.builtin.set.prototype['add'].func_code(self, item);
    }
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype['intersection_update'] = new Sk.builtin.func(function(self, other)
{
    for (var it = self.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        for (var i=1; i < arguments.length; i++)
        {
            if (!Sk.abstr.sequenceContains(arguments[i], item))
            {
                Sk.builtin.set.prototype['discard'].func_code(self, item);
                break;
            }
        }
    }
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype['difference_update'] = new Sk.builtin.func(function(self, other)
{
    for (var it = self.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        for (var i=1; i < arguments.length; i++)
        {
            if (Sk.abstr.sequenceContains(arguments[i], item))
            {
                Sk.builtin.set.prototype['discard'].func_code(self, item);
                break;
            }
        }
    }
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype['symmetric_difference_update'] = new Sk.builtin.func(function(self, other)
{
    var sd = Sk.builtin.set.prototype['symmetric_difference'].func_code(self, other);
    self.set_reset_();
    Sk.builtin.set.prototype['update'].func_code(self, sd);
    return Sk.builtin.none.none$;
});


Sk.builtin.set.prototype['add'] = new Sk.builtin.func(function(self, item)
{
    self.v.mp$ass_subscript(item, true);
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype['discard'] = new Sk.builtin.func(function(self, item)
{
    if (self.v.mp$lookup(item) !== undefined)
    {
        var kf = Sk.builtin.hash;
        var k = kf(item);
        if (self.v[k] !== undefined) {
            self.v.size -= 1;
            delete self.v[k];
        }
        //self.v.mp$ass_subscript(item, null);
    }
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype['pop'] = new Sk.builtin.func(function(self)
{
    if (self.sq$length() === 0)
    {
        throw new Sk.builtin.KeyError("pop from an empty set");
    }

    var it = self.tp$iter(), item = it.tp$iternext();
    Sk.builtin.set.prototype['discard'].func_code(self, item);
    return item;
});

Sk.builtin.set.prototype['remove'] = new Sk.builtin.func(function(self, item)
{
    self.v.mp$del_subscript(item);
    return Sk.builtin.none.none$;
});


goog.exportSymbol("Sk.builtin.set", Sk.builtin.set);