//
// These are functions that are added to the environment. They're not wrapped
// in the global 'Skulpt' object. AFAICT, it's not possible to eval in a
// specific context (?), so we hide all the compiler stuff in the Skulpt
// object, but we have to leave the runtime stuff outside in the global scope,
// where code will be run.
//
// todo; sort out doing enough analysis so we can rename invocations of
// standard python functions (like len, range) to sk$len, sk$range.

function sk$output(x){} // replaceable output redirection (called from print, etc)

var Str$, List$, Tuple$, Dict$, Slice$;

function sk$print(x)
{
    var s = new Str$(x);
    sk$output(s.v);
}

function sk$iter(pyobj, callback)
{
    var i, obj, s, len, ret;

    if (pyobj instanceof Dict$ || pyobj instanceof Tuple$)
    {
        pyobj.iter$(callback);
    }
    else if (pyobj instanceof List$)
    {
        obj = pyobj.v;
        len = obj.length;
        for (i = 0; i < len; ++i)
        {
            ret = callback.call(null, obj[i]);
            if (ret === false) break;
        }
    }
    else if (pyobj instanceof Str$)
    {
        s = pyobj.v;
        len = s.length;
        for (i = 0; i < len; ++i)
        {
            ret = callback.call(null, s.substr(i, 1));
            if (ret === false) break;
        }
    }
    else
    {
        throw "unhandled type in iter";
    }
}

// todo; these all need to dispatch to methods if defined
function sk$add(self, other)
{
    if (typeof self === "number" && typeof other === "number")
    {
        return self + other;
    }
    else if (self.constructor === Str$ && other.constructor === Str$)
    {
        return self.v + other.v;
    }
    else if (self.constructor === List$ && other.constructor === List$)
    {
        var ret = self.v.slice();
        for (var i = 0; i < other.v.length; ++i)
        {
            ret.push(other.v[i]);
        }
        return new List$(ret);
    }
    else
    {
        throw "TypeError: cannot concatenate '" + typeof self + "' and '" + typeof other + "' objects";
    }
}

function sk$sub(self, other)
{
    if (typeof self !== "number" || typeof other !== "number") throw "TypeError";
    return self - other;
}
function sk$mul(self, other)
{
    if (typeof self !== "number" || typeof other !== "number") throw "TypeError";
    return self * other;
}
function sk$truediv(self, other)
{
    if (typeof self !== "number" || typeof other !== "number") throw "TypeError";
    return self / other;
}
function sk$mod(self, other)
{
    if (typeof self !== "number" || typeof other !== "number") throw "TypeError";
    return self % other;
}
function sk$pow(self, other)
{
    if (typeof self !== "number" || typeof other !== "number") throw "TypeError";
    return Math.pow(self, other);
}

function sk$unpack(lhsnames, rhs)
{
    var i;
    var newRHS = [];
    if (rhs.constructor === Str$)
    {
        // explode str
        rhs = rhs.v;
        for (i = 0; i < rhs.length; ++i)
        {
            newRHS.push(new Str$(rhs[i]));
        }
        rhs = newRHS;
    }
    else
    {
        sk$iter(rhs, function(v) { newRHS.push(v); });
        rhs = newRHS;
    }

    if (lhsnames.length !== rhs.length)
    {
        throw "ValueError: unpack had " + lhsnames.length  + " on the left, but " + rhs.length + " on the right.";
    }
    // todo; what the heck is 'this' here?
    for (i = 0; i < lhsnames.length; ++i)
    {
        this[lhsnames[i]] = rhs[i];
    }
}

function sk$in(lhs, rhs)
{
    if (lhs.constructor === Str$ && rhs.constructor === Str$)
    {
        return rhs.v.indexOf(lhs.v) >= 0;
    }
    else
    {
        var ret = false;
        sk$iter(rhs, function(v)
                {
                    //print(JSON.stringify(lhs, null, 2) + " VS " + JSON.stringify(v, null, 2));
                    // todo; this needs to be actual eq
                    if (lhs === v)
                    {
                        ret = true;
                        return false; // iter stop
                    }
                });
        return ret;
    }
}


function range(start, stop, step)
{
    var i;
    if (!stop && !step)
    {
        stop = start;
        start = 0;
    }
    start = start || 0;
    stop = stop || 0;
    step = step || 1;
    // todo; detect (?) 170 and use yield instead
    var ret = [];
    if (stop < start)
    {
        for (i = start; i >= stop; i += step)
        {
            ret.push(i);
        }
    }
    else
    {
        for (i = start; i < stop; i += step)
        {
            ret.push(i);
        }
    }
    return new List$(ret);
}

function len(item)
{
    // todo; dispatch to __len__
    if (item.constructor === Str$ || item.constructor === List$ || item.constructor === Tuple$)
    {
        return item.v.length;
    }
    else if (item.constructor === Dict$)
    {
        return item.size;
    }
    else
    {
        throw "AttributeError: no attribute __len__";
    }
}

function slice(start, stop, step)
{
    return new Slice$(start, stop, step);
}

function min()
{
    // todo; throw if no args
    var lowest = arguments[0];
    for (var i = 1; i < arguments.length; ++i)
    {
        if (arguments[i] < lowest)
            lowest = arguments[i];
    }
    return lowest;
}

function max()
{
    // todo; throw if no args
    var highest = arguments[0];
    for (var i = 1; i < arguments.length; ++i)
    {
        if (arguments[i] > highest)
            highest = arguments[i];
    }
    return highest;
}

function abs(x)
{
    return Math.abs(x);
}

function ord(x)
{
    if (x.constructor !== Str$ || x.v.length !== 1)
    {
        throw "ord() expected string of length 1";
    }
    return (x.v).charCodeAt(0);
}

function chr(x)
{
    if (typeof x !== "number")
    {
        throw "TypeError: an integer is required";
    }
    return new Str$(String.fromCharCode(x));
}

function dir(x)
{
    var names = [];
    for (var k in x)
    {
        if (!x.hasOwnProperty(k) && k.indexOf("$") === -1)
            names.push(new Str$(k));
    }
    names.sort(function(a, b) { return (a.v > b.v) - (a.v < b.v); });
    return new List$(names);
}

function str(x)
{
    var ret;
    if (typeof x === "number")
        ret = x.toString();
    else if (x.__str__ !== undefined)
        ret = x.__str__();
    else if (x.__repr__ !== undefined)
        ret = x.__repr__();
    else
        ret = "<" + x.constructor.name + " instance>";
    return new Str$(ret);
}

function repr(x)
{
    var ret;
    if (typeof x === "number")
        ret = x.toString();
    else if (x.__repr__ !== undefined)
        ret = x.__repr__();
    else
        ret = "<" + x.constructor.name + " instance>";
    return new Str$(ret);
}
