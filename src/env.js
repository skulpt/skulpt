//
// These are functions that are added to the environment. They're not wrapped
// in the global 'Skulpt' object. AFAICT, it's not possible to eval in a
// specific context (?), so we hide all the compiler stuff in the Skulpt
// object, but we have to leave the runtime stuff outside in the global scope,
// where code will be run.
//
// todo; sort out doing enough analysis so we can rename invocations of
// standard python functions (like len, range) to sk$len, sk$range.


// replaceable output redirection (called from print, etc)
var sk$output = function(x){};
if (this.print !== undefined) sk$output = this.print;
if (this.console !== undefined && this.console.log !== undefined) sk$output = this.console.log;


var Str$, List$, Tuple$, Dict$, Slice$, Type$, Long$;
var sk$TypeObject, sk$TypeInt, sk$TypeType;

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
        var ans = self + other;
        if (ans > Long$.threshold$ || ans < -Long$.threshold$)
        {
            self = Long$.fromInt$(self);
            other = Long$.fromInt$(other);
        }
        return ans;
    }
    if (self.__add__ !== undefined)
    {
        return self.__add__(other);
    }
    else
    {
        throw new TypeError("cannot concatenate '" + typeof self + "' and '" + typeof other + "' objects");
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
    if (typeof self === "number" && typeof other === "number")
    {
        var ans = Math.pow(self, other);
        if (ans > Long$.threshold$ || ans < -Long$.threshold$)
        {
            self = Long$.fromInt$(self);
            other = Long$.fromInt$(other);
        }
        else
        {
            return ans;
        }
    }
    else if (self.__class__ === Long$.prototype.__class__
            || other.__class__ === Long$.prototype.__class__)
    {
        if (typeof self === "number") self = Long$.fromInt$(self);
        if (typeof other === "number") other = Long$.fromInt$(other);
    }
    if (self.__pow__ !== undefined)
    {
        return self.__pow__(other);
    }
    else
    {
        throw new TypeError("unsupported operand type(s) for ** or pow(): '" +
                typeof self + "' and '" + typeof other + "'");
    }
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
    var ret = [];
    var s = new Slice$(start, stop, step);
    s.sssiter$(0, function(i) { ret.push(i); });
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
    return new Str$(ret);
}

function repr(x)
{
    var ret;
    if (typeof x === "number")
        ret = x.toString();
    else if (x.__repr__ !== undefined)
        ret = x.__repr__();
    return new Str$(ret);
}

function type(name, bases, dict)
{
    if (bases === undefined && dict === undefined)
    {
        // type function, rather than type constructor
        var obj = name;
        // todo; less assey
        if (typeof obj === "number")
            return sk$TypeInt;
        else
        {
            return obj.__class__;
        }
    }
    else
    {
        return new Type$(name, bases, dict);
    }
}

// stupid language.
if (!Function.prototype.bind)
{
    Function.prototype.bind = function(object)
    {
        var __method = this;
        return function()
        {
            return __method.apply(object, arguments);
        };
    };
}
function ga$(o, attrname)
{
    var v = o[attrname];
    if (v === undefined && o.__getattr__ !== undefined)
        v = o.__getattr__(attrname);
    if (v instanceof Function) return v.bind(o);
    return v;
}

function sk$makeClass()
{
    var ret = function(args, doinit)
    {
        if (!(this instanceof arguments.callee))
        {
            return new arguments.callee(arguments, true);
        }
        if (doinit && this.__init__ !== undefined)
            this.__init__.apply(this, args);
        return this;
    };
    ret.__class__ = sk$TypeType;
    return ret;
}

var object = function()
{
    this.__dict__ = {};
};
object.prototype.__setattr__ = function(k,v)
{
    //print("in __setattr__",k,v);
    this.__dict__[k] = v;
};
object.prototype.__getattr__ = function(k)
{
    return this.__dict__[k];
};
object.prototype.__repr__ = function(k)
{
    return new Str$("<__main__." + this.__name__ + " instance>");
};
