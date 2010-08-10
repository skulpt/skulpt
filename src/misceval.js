Sk.misceval = {};


Sk.misceval.isIndex = function(o)
{
    return o === null || typeof o === "number" || o.constructor === Sk.builtin.lng || o.tp$index;
};

Sk.misceval.asIndex = function(o)
{
    if (!Sk.misceval.isIndex(o)) return undefined;
    if (o === null) return undefined;
    if (typeof o === "number") return o;
    goog.asserts.fail("todo;");
};

/**
 * return u[v:w]
 */
Sk.misceval.applySlice = function(u, v, w)
{
    if (u.sq$slice && Sk.misceval.isIndex(v) && Sk.misceval.isIndex(w))
    {
        var ilow = Sk.misceval.asIndex(v) || 0;
        var ihigh = Sk.misceval.asIndex(w) || 1e100;
        return Sk.abstr.sequenceGetSlice(u, ilow, ihigh);
    }
    return Sk.abstr.objectGetItem(u, new Sk.builtin.slice(v, w, null));
};

/**
 * u[v:w] = x
 */
Sk.misceval.assignSlice = function(u, v, w, x)
{
    if (u.sq$ass_slice && Sk.misceval.isIndex(v) && Sk.misceval.isIndex(w))
    {
        var ilow = Sk.misceval.asIndex(v) || 0;
        var ihigh = Sk.misceval.asIndex(w) || 1e100;
        if (x === null)
            Sk.abstr.sequenceDelSlice(u, ilow, ihigh);
        else
            Sk.abstr.sequenceSetSlice(u, ilow, ihigh, x);
    }
    else
    {
        var slice = Sk.builtin.slice(v, w);
        if (x === null)
            return Sk.abstr.objectSetItem(u, slice, x);
        else
            return Sk.abstr.objectDelItem(u, slice);
    }
};

Sk.misceval.richCompareBool = function(v, w, op)
{
    if (op === 'Is')
        return v === w;

    if (op === 'IsNot')
        return v !== w;

    if (v === w)
    {
        if (op === 'Eq')
            return true;
        else if (op === 'NotEq')
            return false;
    }

    if (v instanceof Sk.builtin.str && w instanceof Sk.builtin.str)
    {
        if (op === 'Eq')
            return v === w;
        else if (op === 'NotEq')
            return v !== w;
    }

    if (typeof v === "number" && typeof w === "number")
    {
        switch (op)
        {
            case 'Lt': return v < w;
            case 'LtE': return v <= w;
            case 'Gt': return v > w;
            case 'GtE': return v >= w;
            case 'NotEq': return v !== w;
            case 'Eq': return v === w;
            default: throw "assert";
        }
    }
    else
    {
        if (op === "In") return Sk.abstr.sequenceContains(w, v);
        if (op === "NotIn") return !Sk.abstr.sequenceContains(w, v);

        if (v.tp$richcompare)
            return v.tp$richcompare(w, op);
        else if (w.tp$richcompare)
            return w.tp$richcompare(v, Sk.misceval.swappedOp_[op]);
        // todo; else here?
    }

    // is this true?
    return false;
};
