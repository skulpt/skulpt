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
    for (var iter = pyobj.__iter__(), i = iter.next(); i !== undefined; i = iter.next())
    {
        if (callback.call(null, i) === false) break;
    }
}

function sk$typename(o)
{
    if (typeof o === "number") return sk$TypeInt.name;
    if (o.__class__ === undefined) return typeof o; // in case we haven't handled for this type yet
    return o.__class__.__name__;
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

function sk$cmp(lhs, rhs, op)
{
    if (typeof lhs === "number" && typeof rhs === "number")
    {
        switch (op)
        {
            case '<': return lhs < rhs;
            case '<=': return lhs <= rhs;
            case '>': return lhs > rhs;
            case '>=': return lhs >= rhs;
            case '!=': return lhs !== rhs;
            case '==': return lhs === rhs;
            default: throw "assert";
        }
    }
    else
    {
        var ret;
        if (lhs.richcmp$ !== undefined)
            return lhs.richcmp$(rhs, op);
        else if (lhs.__cmp__ !== undefined)
            ret = lhs.__cmp__(rhs);
        else if (rhs.__cmp__ !== undefined)
            ret = -rhs.__cmp__(lhs);
        else
        {
            // todo; dispatch to the specific __eq__, etc.
            throw new AttributeError("no attribute __cmp__");
        }

        switch (op)
        {
            case '<': return ret < 0;
            case '<=': return ret <= 0;
            case '>': return ret > 0;
            case '>=': return ret >= 0;
            case '==': return ret === 0;
            case '!=': return ret !== 0;
            default: throw "assert";
        }
    }
}

function sk$binop(lhs, rhs, op)
{
    var numPromote = sk$binop.numPromote$;
    var numPromoteFunc = numPromote[op];
    if (numPromoteFunc !== undefined)
    {
        var tmp = Long$.numOpAndPromotion$(lhs, rhs, numPromoteFunc);
        if (typeof tmp === "number")
        {
            return tmp;
        }
        lhs = tmp[0];
        rhs = tmp[1];
    }

    var func = sk$binop.funcs$[op];
    var rfunc = sk$binop.rfuncs$[op];
    if (!func || !rfunc) throw "assert";

    if (lhs[func] !== undefined)
        return lhs[func](rhs);
    if (rhs[rfunc] !== undefined)
        return rhs[rfunc](lhs);

    throw new TypeError("unsupported operand type(s) for " + op + ": '" +
            sk$typename(lhs) + "' and '" + sk$typename(rhs) + "'");

}
sk$binop.numPromote$ = {
    "+": function(a, b) { return a + b; },
    "-": function(a, b) { return a - b; },
    "*": function(a, b) { return a * b; },
    "%": function(a, b) { return a % b; },
    "**": Math.pow
};
sk$binop.funcs$ = {
    "+": "__add__",
    "-": "__sub__",
    "*": "__mul__",
    "/": "__truediv__",
    "//": "__floordiv__",
    "%": "__mod__",
    "**": "__pow__",
    "<<": "__lshift__",
    ">>": "__rshift__",
    "&": "__and__",
    "|": "__or__",
    "^": "__xor__"
};
sk$binop.rfuncs$ = {
    "+": "__radd__",
    "-": "__rsub__",
    "*": "__rmul__",
    "/": "__rtruediv__",
    "//": "__rfloordiv__",
    "%": "__rmod__",
    "**": "__rpow__",
    "<<": "__rlshift__",
    ">>": "__rrshift__",
    "&": "__rand__",
    "|": "__ror__",
    "^": "__rxor__"
};

function sk$inplace(lhs, rhs, op)
{
    var numPromote = sk$inplace.numPromote$;
    var numPromoteFunc = numPromote[op];
    if (numPromoteFunc !== undefined)
    {
        var tmp = Long$.numOpAndPromotion$(lhs, rhs, numPromoteFunc);
        if (typeof tmp === "number")
            return tmp;
        lhs = tmp[0];
        rhs = tmp[1];
    }

    var opname = sk$inplace.augfuncs$[op];
    if (lhs[opname] !== undefined)
    {
        return lhs[opname](rhs);
    }
    else
    {
        var opname2 = sk$binop.funcs$[op.substring(0, op.length - 1)];
        if (lhs[opname2] !== undefined)
        {
            return lhs[opname2](rhs);
        }
        else
        {
            throw "AttributeError: " + opname + " or " + opname2 + " not found on " + sk$typename(lhs);
        }
    }
}
sk$inplace.numPromote$ = {
    "+=": function(a, b) { return a + b; },
    "-=": function(a, b) { return a - b; },
    "*=": function(a, b) { return a * b; },
    "/=": function(a, b) { return a / b; },
    "//=": Math.floor,
    "%=": function(a, b) { return a + b; },
    "**=": Math.pow,
    "<<=": function(a, b) { return a << b; },
    ">>=": function(a, b) { return a >> b; },
    "&=": function(a, b) { return a & b; },
    "|=": function(a, b) { return a | b; },
    "^=": function(a, b) { return a ^ b; }
};
sk$inplace.augfuncs$ = {
    "+=": "__iadd__",
    "-=": "__isub__",
    "*=": "__imul__",
    "/=": "__itruediv__",
    "//=": "__ifloordiv__",
    "%=": "__imod__",
    "**=": "__ipow__", // todo; modulo
    "<<=": "__ilshift__",
    ">>=": "__irshift__",
    "&=": "__iand__",
    "|=": "__ior__",
    "^=": "__ixor__"
};

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
    if (x === undefined) throw "error: trying to str() undefined (should be at least null)";
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
        var ret = function()
        {
            return __method.apply(object, arguments);
        };
        ret.method$ = __method;
        return ret;
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
function sk$sa(o, attrname, value)
{
    if (o.__setattr__ !== undefined)
        o.__setattr__(attrname, value);
    else
        o[attrname] = value;
}

// unfortunately (at least pre-ecmascript 5) there's no way to make objects be
// both callable and have arbitrary prototype chains.
// http://stackoverflow.com/questions/548487/how-do-i-make-a-callable-js-object-with-an-arbitrary-prototype
// todo; look into modifying Function.prototype call/apply.. does that work properly?
// so, in order to support __call__ on objects we have to wrap all
// python-level calls in a call that checks if the target is an object that
// has a __call__ attribute so we can dispatch to it. sucky.
// additionally, this handles remapping kwargs to the correct locations.
function sk$call(obj, kwargs)
{
    var kwargs = arguments[1];
    var args = Array.prototype.slice.call(arguments, 2);
    if (kwargs !== undefined)
    {
        for (var i = 0; i < kwargs.length; i += 2)
        {
            var kwargname = kwargs[i];
            var kwargvalue = kwargs[i + 1];
            var index = obj.argnames$.indexOf(kwargname);
            //print(kwargname,"is",kwargvalue.v,"at",index);
            args[index] = kwargvalue;
        }
        //print(JSON2.stringify(args));
    }
    try
    {
        return obj.apply(this, args);
    }
    catch (e)
    {
        var eAsStr = e.toString();
        if (eAsStr.indexOf("has no method 'apply'") !== -1)
        {
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
        else
        {
            throw e;
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
