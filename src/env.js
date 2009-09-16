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
            ret = callback.call(null, new Str$(s.substr(i, 1)));
            if (ret === false) break;
        }
    }
    else
    {
        throw "unhandled type in iter";
    }
}

function sk$typename(o)
{
    if (typeof o === "number") return sk$TypeInt.name;
    if (o.__class__ === undefined) return typeof o; // in case we haven't handled for this type yet
    return o.__class__.__name__;
}

// todo; these all need to dispatch to methods if defined
function sk$add(self, other)
{
    var tmp = Long$.numOpAndPromotion$(self, other, function(a,b) { return a + b; });
    if (typeof tmp === "number") return tmp;
    self = tmp[0];
    other = tmp[1];

    if (self.__add__ !== undefined)
        return self.__add__(other);
    else
    {
        throw new TypeError("cannot concatenate '" + sk$typename(self) + "' and '" + sk$typename(other) + "' objects");
    }
}

function sk$sub(self, other)
{
    var tmp = Long$.numOpAndPromotion$(self, other, function(a,b) { return a - b; });
    if (typeof tmp === "number") return tmp;
    self = tmp[0];
    other = tmp[1];

    if (self.__sub__ !== undefined)
        return self.__sub__(other);
    else
    {
        throw new TypeError("unsupported operand type(s) for -: '" +
                sk$typename(self) + "' and '" + sk$typename(other) + "'");
    }
}
function sk$mul(self, other)
{
    var tmp = Long$.numOpAndPromotion$(self, other, function(a,b) { return a * b; });
    if (typeof tmp === "number") return tmp;
    self = tmp[0];
    other = tmp[1];

    if (self.__mul__ !== undefined)
        return self.__mul__(other);
    else if (other.__mul__ !== undefined) // todo; i think this is wrong; makes 40*"str" work for now
        return other.__mul__(self);
    else
    {
        throw new TypeError("unsupported operand type(s) for *: '" +
                sk$typename(self) + "' and '" + sk$typename(other) + "'");
    }
}
function sk$truediv(self, other)
{
    if (typeof self !== "number" || typeof other !== "number") throw "TypeError";
    return self / other;
}
function sk$mod(self, other)
{
    var tmp = Long$.numOpAndPromotion$(self, other, function(a,b) { return a % b; });
    if (typeof tmp === "number") return tmp;
    self = tmp[0];
    other = tmp[1];

    if (self.__mod__ !== undefined)
        return self.__mod__(other);
    else
    {
        throw new TypeError("unsupported operand type(s) for *: '" +
                sk$typename(self) + "' and '" + sk$typename(other) + "'");
    }
}
function sk$pow(self, other)
{
    var tmp = Long$.numOpAndPromotion$(self, other, Math.pow);
    if (typeof tmp === "number") return tmp;
    self = tmp[0];
    other = tmp[1];

    if (self.__pow__ !== undefined)
        return self.__pow__(other);
    else
    {
        throw new TypeError("unsupported operand type(s) for ** or pow(): '" +
                sk$typename(self) + "' and '" + sk$typename(other) + "'");
    }
}

function sk$neg(self)
{
    if (typeof self === "number")
    {
        return -self;
    }

    if (self.__neg__ !== undefined)
    {
        return self.__neg__();
    }
    else
    {
        throw new TypeError("bad operand type for unary -: '" +
                typeof self + "'");
    }
}

function sk$unpack(lhsnames, rhs, context)
{
    var newRHS = [];
    for (var iter = rhs.__iter__(), i = iter.next(); i !== undefined; i = iter.next())
        newRHS.push(i);
    rhs = newRHS;

    if (lhsnames.length !== rhs.length)
    {
        throw "ValueError: unpack had " + lhsnames.length  + " on the left, but " + rhs.length + " on the right.";
    }
    // todo; what the heck is 'this' here?
    if (context === undefined) context = this;
    for (var j = 0; j < lhsnames.length; ++j)
    {
        context[lhsnames[j]] = rhs[j];
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
        for (var iter = rhs.__iter__(), i = iter.next(); i !== undefined; i = iter.next())
        {
            // todo; this needs to be actual eq
            if (lhs === i)
            {
                ret = true;
                break;
            }
        }
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

function repr(x)
{
    var ret;
    if (typeof x === "number") ret = x.toString();
    else if (x === true) ret = "True";
    else if (x === false) ret = "False";
    else if (x === null) ret = "None";
    else if (x.__repr__ !== undefined)
        return x.__repr__();
    return new Str$(ret);
}

function str(x)
{
    var ret;
    if (x === undefined) throw "error: trying to str undefined (should be at least null)";
    else if (x === true) ret = "True";
    else if (x === false) ret = "False";
    else if (x === null) ret = "None";
    else if (x && x.constructor === Str$) return x;
    else if (typeof x === "number")
        ret = x.toString();
    else if (typeof x === "string")
        ret = x;
    else if (x.__str__ !== undefined)
        ret = x.__str__();
    else
        return repr(x);
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
            return obj.__class__;
    }
    else
    {
        return new Type$(name, bases, dict);
    }
}

function hash(value)
{
    if (value instanceof Object && value.__hash__ !== undefined)
    {
        if (value.__hash) return value.__hash;
        value.__hash = 'custom ' + value.__hash__();
        return value.__hash;
    }

    if (value instanceof Object)
    {
        if (value.__id === undefined)
        {
            hash.current += 1;
            value.__id = 'object ' + hash.current;
        }
        return value.__id;
    }
    return (typeof value) + ' ' + String(value);

    // todo; throw properly for unhashable types
}
hash.current = 0;

function sk$print(x)
{
    var s = str(x);
    sk$output(s.v);
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
function sk$ga(o, attrname)
{
    var v = o[attrname];
    if (v === undefined && o.__getattr__ !== undefined)
        v = o.__getattr__(attrname);
    if (v instanceof Function) return v.bind(o);
    return v;
}

// unfortunately (at least pre-ecmascript 5) there's no way to make objects be
// both callable and have arbitrary prototype chains.
// http://stackoverflow.com/questions/548487/how-do-i-make-a-callable-js-object-with-an-arbitrary-prototype
// todo; look into modifying Function.prototype call/apply.. does that work properly?
// so, in order to support __call__ on objects we have to wrap all
// python-level calls in a call that checks if the target is an object that
// has a __call__ attribute so we can dispatch to it. sucky.
function sk$call(obj)
{
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    try
    {
        return obj.apply(this, args);
    }
    catch (e)
    {
        //print(e.toString());
        if (obj.__call__ !== undefined)
        {
            return obj.__call__.apply(obj, args);
        }
        else
        {
            if (obj.__class__ === undefined)
                throw new AttributeError("trying to call uncallable and non-class?");
            throw new AttributeError(obj.__class__.__name__ + " instance has no __call__ method");
        }
    }
}

var object = function()
{
    this.__dict__ = {};
    return this;
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
    // todo; modules, obviously
    return new Str$("<__main__." + this.__class__.__name__ + " instance>");
};
