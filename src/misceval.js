Sk.misceval = {};


Sk.misceval.isIndex = function(o)
{
    return o === null || typeof o === "number" || o.constructor === Sk.builtin.long || o.tp$index;
};

Sk.misceval.asIndex = function(o)
{
    if (!Sk.misceval.isIndex(o)) return undefined;
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
        return Sk.abstract.sequenceGetSlice(u, ilow, ihigh);
    }
    return Sk.abstract.objectGetItem(u, new Sk.builtin.slice(v, w, null));
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
            Sk.abstract.sequenceDelSlice(u, ilow, ihigh);
        else
            Sk.abstract.sequenceSetSlice(u, ilow, ihigh, x);
    }
    else
    {
        var slice = Sk.builtin.slice(v, w);
        if (x === null)
            return Sk.abstract.objectSetItem(u, slice, x);
        else
            return Sk.abstract.objectDelItem(u, slice);
    }
};
