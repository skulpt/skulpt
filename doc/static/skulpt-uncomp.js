function ErrorToString()
{
    if (typeof this === "object" && this.hasOwnProperty("isSkError"))
    {
        var ret = "File \"" + this.file + "\", " + "line " + this.lnum + "\n" +
            this.line + "\n";
        for (var i = 0; i < this.col; ++i) ret += " ";
        ret += "^\n";
        ret += this.type + ": " + this.msg + "\n";
        return ret;
    }
    return "INTERNAL ERROR:\n" + this.message + "\n" + this.stack + "\n";
}

function makeStdError(obj, type, rest)
{
    obj.isSkError = true;
    obj.type = type;
    obj.msg = rest[0];
    obj.file = rest[1];
    obj.lnum = rest[2];
    obj.col = rest[3];
    obj.line = rest[4];
    obj.toString = ErrorToString;
    return obj;
}

function TokenError(msg, file, lnum, col, line) { return makeStdError(this, "TokenError", arguments); }
function IndentationError(msg, file, lnum, col, line) { return makeStdError(this, "IndentationError", arguments); }
function SyntaxError(msg, file, lnum, col, line) { return makeStdError(this, "SyntaxError", arguments); }
function ValueError(msg, file, lnum, col, line) { return makeStdError(this, "ValueError", arguments); }
function TypeError(msg, file, lnum, col, line) { return makeStdError(this, "TypeError", arguments); }
function IndexError(msg, file, lnum, col, line) { return makeStdError(this, "IndexError", arguments); }
function ZeroDivisionError(msg, file, lnum, col, line) { return makeStdError(this, "ZeroDivisionError", arguments); }
function AttributeError(msg, file, lnum, col, line) { return makeStdError(this, "AttributeError", arguments); }
function ImportError(msg, file, lnum, col, line) { return makeStdError(this, "AttributeError", arguments); }
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
if (this.console !== undefined && this.console.log !== undefined) sk$output = function (x) {this.console.log(x);};

// replaceable function to load modules with (called via import, etc)
var sk$load = function(x) { throw "sk$load has not implemented"; };
if (this.read !== undefined) sk$load = this.read;
// todo; XHR


var Str$, List$, Tuple$, Dict$, Slice$, Type$, Long$, Module$;
var sk$TypeObject, sk$TypeInt, sk$TypeType;
var sk$sysargv;
var Skulpt;

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
    var names;
    if (x.__dir__ !== undefined)
    {
        names = x.__dir__().v;
    }
    else
    {
        names = [];
        for (var k in x)
        {
            if (!x.hasOwnProperty(k) && k.indexOf("$") === -1)
            {
                names.push(new Str$(k));
            }
        }
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
// When running the unit tests under Safari, this fails to replace .bind.
// Making it unconditional allows the tests to pass.
//if (!Function.prototype.bind)
//{
    Function.prototype.bind = function(object)
    {
        var __method = this;
        var ret = function()
        {
            return __method.apply(object, arguments);
        };
        ret.argnames$ = this.argnames$; // todo; icky
        return ret;
    };
//}
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
    var args = Array.prototype.slice.call(arguments, 2);
    if (kwargs !== undefined)
    {
        for (var i = 0; i < kwargs.length; i += 2)
        {
            var kwargname = kwargs[i];
            var kwargvalue = kwargs[i + 1];
            if (obj.argnames$ === undefined) throw obj + " has no argnames";
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
        if (obj.apply === undefined || eAsStr.indexOf("has no method 'apply'") !== -1)
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

// this tries to implement something like:
// http://docs.python.org/reference/simple_stmts.html#the-import-statement
function sk$import(name)
{
    //
    // find the module. we don't do any of the PEP 302 stuff yet (or hardcode
    // it at least).
    //
    var contents;
    var filename;

    // try system modules first
    if (Module$.builtins$[name] !== undefined)
    {
        contents = Module$.builtins$[name];
    }

    Module$.syspath$ = new List$([new Str$('test/run')]); // todo; this shouldn't be necessary

    if (!contents)
    {
        (function() {
         // then user modules
         for (var iter = Module$.syspath$.__iter__(), i = iter.next(); i !== undefined; i = iter.next())
         {
             try
             {
                 filename = i.v + "/" + name + ".py";
                 contents = sk$load(filename);
                 return;
             } catch (e) {}
         }
         throw new ImportError("no module named " + name);
        }());
    }
    
    // todo; check in sys.modules for previous load/init

    //
    // initialize the module
    //
    var module = new Module$(name, filename);
    Module$.modules$.__setitem__(new Str$(name), module);

    if (filename === undefined) // native
    {
        // if it's native the contents is actually a function that does setup
        contents(module);
    }
    else
    {
        var js = Skulpt.compileStr(filename, contents, module);
        //print("/**** start", filename, "****/");
        //print(js);
        //print("/**** end", filename, "****/");
        eval(js);
    }


    //
    // bind names into the local environment
    // todo; everything other than basic 'import blah'
    //
    this[name] = module;
}

var object = function()
{
    this.__dict__ = new Dict$([]);
    return this;
};
// todo; maybe a string-only dict here that's just an object+methods for efficiency
object.prototype.__setattr__ = function(k,v)
{
    //print("in __setattr__",k,v);
    this.__dict__.__setitem__(new Str$(k), v);
};
object.prototype.__getattr__ = function(k)
{
    return this.__dict__.__getitem__(new Str$(k));
};
object.prototype.__repr__ = function(k)
{
    // todo; should be getattr('module')
    return new Str$("<" + this.__module__ + "." + this.__class__.__name__ + " instance>");
};
Type$ = function(name, bases, dict)
{
    this.__name__ = name;
    this.__bases__ = bases;
    this.dict = dict;
};

Type$.prototype.mro = function()
{
    return new List$(this.__bases__.v);
};

Type$.prototype.__repr__ = function()
{
    return new Str$("<type '" + this.__name__ + "'>");
};

sk$TypeObject = new Type$('object', [], {});
sk$TypeObject.__bases__.push(sk$TypeObject);
sk$TypeType = new Type$('type', [sk$TypeObject], {});
sk$TypeInt = new Type$('int', [sk$TypeObject], {});
Str$ = function(val)
{
    if (val && val.constructor === Str$) return val; // todo; shouldn't be necessary?
    if (val === undefined) val = "";
    if (typeof val !== "string") throw "Str$ constructor expecting js string, got " + typeof val;

    // interning required for strings in py
    if (Str$.prototype.internStrings$.hasOwnProperty(val))
    {
        return Str$.prototype.internStrings$[val];
    }

    this.v = val;
    Str$.prototype.internStrings$[val] = this;
};
Str$.prototype.internStrings$ = {};

Str$.prototype.$_alphanum = {};
(function initAlnum(){
 var i;
 for (i = 'a'; i <= 'z'; ++i) Str$.prototype.$_alphanum[i] = 1;
 for (i = 'A'; i <= 'Z'; ++i) Str$.prototype.$_alphanum[i] = 1;
 for (i = '0'; i <= '9'; ++i) Str$.prototype.$_alphanum[i] = 1;
}());

Str$.prototype.re_escape$ = function(s)
{
    var ret = [];
    for (var i = 0; i < s.length; ++i)
    {
        var c = s.charAt(i);
        if (Str$.prototype.$_alphanum[c])
        {
            ret.push(c);
        }
        else
        {
            if (c === "\\000")
                ret.push("\\000");
            else
                ret.push("\\" + c);
        }
    }
    return ret.join('');
};

Str$.prototype.__getitem__ = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new IndexError("string index out of range");
        return new Str$(this.v.charAt(index));
    }
    else if (index instanceof Slice$)
    {
        var ret = '';
        index.sssiter$(this, function(i, wrt) {
                if (i >= 0 && i < wrt.v.length)
                    ret += wrt.v.charAt(i);
                });
        return new Str$(ret);
    }
    else
        throw new TypeError("string indices must be numbers, not " + typeof index);
};

Str$.prototype.escapable$ = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
Str$.prototype.meta$ = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    "'" : "\\'",
    '\\': '\\\\'
};
Str$.prototype.quote$ = function(string)
{
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    this.escapable$.lastIndex = 0;
    return this.escapable$.test(string) ?
        "'" + string.replace(this.escapable$, function (a) {
            var c = this.meta$[a];
            return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + "'" :
        "'" + string + "'";
};

Str$.prototype.__add__ = function(other)
{
    return new Str$(this.v + other.v);
};

Str$.prototype.__mul__ = Str$.prototype.__rmul__ = function(other)
{
    if (typeof other !== "number") throw "TypeError"; // todo; long, better error
    var ret = "";
    for (var i = 0; i < other; ++i)
    {
        ret += this.v;
    }
    return new Str$(ret);
};

Str$.prototype.__mod__ = function(rhs)
{
    // % format op. rhs can be a value, a tuple, or something with __getitem__ (dict)

    // From http://docs.python.org/library/stdtypes.html#string-formatting the
    // format looks like:
    // 1. The '%' character, which marks the start of the specifier.
    // 2. Mapping key (optional), consisting of a parenthesised sequence of characters (for example, (somename)).
    // 3. Conversion flags (optional), which affect the result of some conversion types.
    // 4. Minimum field width (optional). If specified as an '*' (asterisk), the actual width is read from the next element of the tuple in values, and the object to convert comes after the minimum field width and optional precision.
    // 5. Precision (optional), given as a '.' (dot) followed by the precision. If specified as '*' (an asterisk), the actual width is read from the next element of the tuple in values, and the value to convert comes after the precision.
    // 6. Length modifier (optional).
    // 7. Conversion type.
    //
    // length modifier is ignored

    if (rhs.constructor !== Tuple$ && (rhs.__getitem__ === undefined || rhs.constructor === Str$)) rhs = new Tuple$([rhs]);
    
    // general approach is to use a regex that matches the format above, and
    // do an re.sub with a function as replacement to make the subs.

    //           1 2222222222222222   33333333   444444444   5555555555555  66666  777777777777777777
    var regex = /%(\([a-zA-Z0-9]+\))?([#0 +\-]+)?(\*|[0-9]+)?(\.(\*|[0-9]+))?[hlL]?([diouxXeEfFgGcrs%])/g;
    var index = 0;
    var replFunc = function(substring, mappingKey, conversionFlags, fieldWidth, precision, precbody, conversionType)
    {
        var i;
        if (mappingKey === undefined || mappingKey === "" /* ff passes '' not undef for some reason */) i = index++;

        var zeroPad = false;
        var leftAdjust = false;
        var blankBeforePositive = false;
        var precedeWithSign = false;
        var alternateForm = false;
        if (conversionFlags)
        {
            if (conversionFlags.indexOf("-") !== -1) leftAdjust = true;
            else if (conversionFlags.indexOf("0") !== -1) zeroPad = true;

            if (conversionFlags.indexOf("+") !== -1) precedeWithSign = true;
            else if (conversionFlags.indexOf(" ") !== -1) blankBeforePositive = true;

            alternateForm = conversionFlags.indexOf("#") !== -1;
        }

        if (precision)
        {
            precision = parseInt(precision.substr(1), 10);
        }

        var formatNumber = function(n, base)
        {
            var j;
            var r;
            var neg = false;
            var didSign = false;
            if (typeof n === "number")
            {
                if (n < 0)
                {
                    n = -n;
                    neg = true;
                }
                r = n.toString(base);
            }
            else if (n.constructor === Long$)
            {
                r = n.str$(base, false);
                neg = n.size$ < 0;
            }

            if (r === undefined) throw "unhandled number format";

            var precZeroPadded = false;

            if (precision)
            {
                //print("r.length",r.length,"precision",precision);
                for (j = r.length; j < precision; ++j)
                {
                    r = '0' + r;
                    precZeroPadded = true;
                }
            }

            var prefix = '';

            if (neg) prefix = "-";
            else if (precedeWithSign) prefix = "+" + prefix;
            else if (blankBeforePositive) prefix = " " + prefix;

            if (alternateForm)
            {
                if (base === 16) prefix += '0x';
                else if (base === 8 && !precZeroPadded && r !== "0") prefix += '0';
            }

            return [prefix, r];
        };

        var handleWidth = function(args)
        {
            var prefix = args[0];
            var r = args[1];
            var j;
            if (fieldWidth)
            {
                fieldWidth = parseInt(fieldWidth, 10);
                var totLen = r.length + prefix.length;
                if (zeroPad)
                    for (j = totLen; j < fieldWidth; ++j)
                        r = '0' + r;
                else if (leftAdjust)
                    for (j = totLen; j < fieldWidth; ++j)
                        r = r + ' ';
                else
                    for (j = totLen; j < fieldWidth; ++j)
                        prefix = ' ' + prefix;
            }
            return prefix + r;
        };

        var value;
        //print("Rhs:",rhs, "ctor", rhs.constructor);
        if (rhs.constructor === Tuple$)
        {
            value = rhs.v[i];
        }
        else if (rhs.__getitem__ !== undefined)
        {
            var mk = mappingKey.substring(1, mappingKey.length - 1);
            //print("mk",mk);
            value = rhs.__getitem__(new Str$(mk));
        }
        else throw new AttributeError(rhs.__class__.name + " instance has no attribute '__getitem__'");
        var r;
        var base = 10;
        switch (conversionType)
        {
            case 'd':
            case 'i':
                return handleWidth(formatNumber(value, 10));
            case 'o':
                return handleWidth(formatNumber(value, 8));
            case 'x':
                return handleWidth(formatNumber(value, 16));
            case 'X':
                return handleWidth(formatNumber(value, 16)).toUpperCase();

            case 'e':
            case 'E':
            case 'f':
            case 'F':
            case 'g':
            case 'G':
                var convName = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(conversionType.toLowerCase())];
                var result = (value)[convName](precision);
                if ('EFG'.indexOf(conversionType) !== -1) result = result.toUpperCase();
                // todo; signs etc.
                return handleWidth(['', result]);

            case 'c':
                if (typeof value === "number")
                    return String.fromCharCode(value);
                else if (value.constructor === Long$)
                    return String.fromCharCode(value.digit$[0] & 255);
                else if (value.constructor === Str$)
                    return value.v.substr(0, 1);
                else
                    throw new TypeError("an integer is required");
                break; // stupid lint

            case 'r':
                r = repr(value);
                if (precision) return r.v.substr(0, precision);
                return r.v;
            case 's':
                /*
                print("value",value);
                print("replace:");
                print("  index", index);
                print("  substring", substring);
                print("  mappingKey", mappingKey);
                print("  conversionFlags", conversionFlags);
                print("  fieldWidth", fieldWidth);
                print("  precision", precision);
                print("  conversionType", conversionType);
                */
                r = str(value);
                if (precision) return r.v.substr(0, precision);
                return r.v;
            case '%':
                return '%';
        }
    };
    
    var ret = this.v.replace(regex, replFunc);
    return new Str$(ret);
};

Str$.prototype.__repr__ = function()
{
    return new Str$(this.quote$(this.v));
};

Str$.prototype.__str__ = function()
{
    return this.v;
};

Str$.prototype.richcmp$ = function(rhs, op)
{
    if (rhs.constructor !== Str$) return false;
    if (this === rhs)
    {
        switch (op)
        {
            case '<': case '>': case '!=': return false;
            case '<=': case '>=': case '==': return true;
        }
    }
    else
    {
        // currently, all strings are intern'd
        return false;
    }
};

Str$.prototype.__class__ = new Type$('str', [sk$TypeObject], {});

Str$.prototype.capitalize = function() { throw "todo; capitalize"; };
Str$.prototype.center = function() { throw "todo; center"; };
Str$.prototype.count = function() { throw "todo; count"; };
Str$.prototype.decode = function() { throw "todo; decode"; };
Str$.prototype.encode = function() { throw "todo; encode"; };
Str$.prototype.endswith = function() { throw "todo; endswith"; };
Str$.prototype.expandtabs = function() { throw "todo; expandtabs"; };
Str$.prototype.find = function() { throw "todo; find"; };
Str$.prototype.format = function() { throw "todo; format"; };
Str$.prototype.index = function() { throw "todo; index"; };
Str$.prototype.isalnum = function() { throw "todo; isalnum"; };
Str$.prototype.isalpha = function() { throw "todo; isalpha"; };
Str$.prototype.isdigit = function() { throw "todo; isdigit"; };
Str$.prototype.islower = function() { throw "todo; islower"; };
Str$.prototype.isspace = function() { throw "todo; isspace"; };
Str$.prototype.istitle = function() { throw "todo; istitle"; };
Str$.prototype.isupper = function() { throw "todo; isupper"; };

Str$.prototype.join = function(seq)
{
    var arrOfStrs = [];
    sk$iter(seq, function(v)
            {
                if (v.constructor !== Str$) throw "TypeError: sequence item " + arrOfStrs.length + ": expected string, " + typeof v + " found";
                arrOfStrs.push(v.v);
            });
    return arrOfStrs.join(this.v);
};

Str$.prototype.ljust = function() { throw "todo; ljust"; };
Str$.prototype.lower = function() { return new Str$(this.v.toLowerCase()); };
Str$.prototype.lstrip = function() { throw "todo; lstrip"; };
Str$.prototype.partition = function() { throw "todo; partition"; };

Str$.prototype.replace = function(oldS, newS, count)
{
    if (oldS.constructor !== Str$ || newS.constructor !== Str$)
        throw "TypeError: expecting a string";
    if (count !== undefined)
        throw "todo; replace() with count not implemented";
    var patt = new RegExp(this.re_escape$(oldS.v), "g");
    return new Str$(this.v.replace(patt, newS.v));
};

Str$.prototype.rfind = function() { throw "todo; rfind"; };
Str$.prototype.rindex = function() { throw "todo; rindex"; };
Str$.prototype.rjust = function() { throw "todo; rjust"; };
Str$.prototype.rpartition = function() { throw "todo; rpartition"; };
Str$.prototype.rsplit = function() { throw "todo; rsplit"; };
Str$.prototype.rstrip = function() { throw "todo; rstrip"; };

Str$.prototype.split = function(on, howmany)
{
    var res = this.v.split(new Str$(on).v, howmany);
    var tmp = [];
    for (var i = 0; i < res.length; ++i)
    {
        tmp.push(new Str$(res[i]));
    }
    return new List$(tmp);
};

Str$.prototype.splitlines = function() { throw "todo; splitlines"; };
Str$.prototype.startswith = function() { throw "todo; startswith"; };
Str$.prototype.strip = function() { throw "todo; strip"; };
Str$.prototype.swapcase = function() { throw "todo; swapcase"; };
Str$.prototype.title = function() { throw "todo; title"; };
Str$.prototype.translate = function() { throw "todo; translate"; };
Str$.prototype.upper = function() { return new Str$(this.v.toUpperCase()); };
Str$.prototype.zfill = function() { throw "todo; zfill"; };

Str$.prototype.__iter__ = function()
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
           return new Str$(ret.$obj.v.substr(ret.$index++, 1));
        }
    };
    return ret;
};
List$ = function(L)
{
    if (Object.prototype.toString.apply(L) !== '[object Array]')
        throw "TypeError: list expecting native Array as argument";
    this.v = L;
};

function list(iterable)
{
    var g = iterable.__iter__();
    var ret = new List$([]);
    for (var i = g.next(); i !== undefined; i = g.next())
    {
        ret.v.push(i);
    }
    return ret;
}

List$.prototype.append = function(item)
{
    this.v.push(item);
    return null;
};

List$.prototype.count = function() { throw "todo; list.count"; };

List$.prototype.extend = function(L)
{
    var self = this;
    sk$iter(L, function(v) { self.v.push(v); });
    return null;
};

List$.prototype.index = function(item)
{
    var len = this.v.length;
    var obj = this.v;
    for (var i = 0; i < len; ++i)
    {
        // todo; eq
        if (obj[i] === item) return i;
    }
    throw "ValueError: list.index(x): x not in list";
};

List$.prototype.insert = function(i, x)
{
    if (i < 0) i = 0;
    else if (i >= this.v.length) i = this.v.length - 1;
    this.v.splice(i, 0, x);
};

List$.prototype.pop = function(i)
{
    if (i === undefined) i = this.v.length - 1;
    var ret = this.v[i];
    this.v.splice(i, 1);
    return ret;
};

List$.prototype.remove = function() { throw "todo; list.remove"; };

List$.prototype.reverse = function() { throw "todo; list.reverse"; };

List$.prototype.sort = function()
{
    // todo; cmp, key, rev
    // todo; totally wrong except for numbers
    this.v.sort();
    return null;
};

List$.prototype.__setitem__ = function(index, value)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new IndexError("list assignment index out of range");
        this.v[index] = value;
    }
    else if (index instanceof Slice$)
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
            if (tosub.length !== value.v.length) throw new ValueError("attempt to assign sequence of size " + value.v.length + " to extended slice of size " + tosub.length);
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
List$.prototype.__getitem__ = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new IndexError("list index out of range");
        return this.v[index];
    }
    else if (index instanceof Slice$)
    {
        var ret = [];
        index.sssiter$(this, function(i, wrt)
                {
                    ret.push(wrt.v[i]);
                });
        return new List$(ret);
    }
    else
        throw new TypeError("list indices must be integers, not " + typeof index);
};
List$.prototype.__delitem__ = function(index)
{
    if (typeof index === "number")
    {
        this.v.splice(index, 1);
    }
    else if (index instanceof Slice$)
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

List$.prototype.__add__ = function(other)
{
    var ret = this.v.slice();
    for (var i = 0; i < other.v.length; ++i)
    {
        ret.push(other.v[i]);
    }
    return new List$(ret);
};

List$.prototype.__mul__ = List$.prototype.__rmul__ = function(other)
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
    return new List$(ret);
};

List$.prototype.__repr__ = function()
{
    var asStrs = [];
    sk$iter(this, function(v) { asStrs.push(repr(v).v); });
    return new Str$("[" + asStrs.join(", ") + "]");
};

List$.prototype.richcmp$ = function(rhs, op)
{
    if (rhs.constructor !== List$) return false;

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
        if (!sk$cmp(this.v[i], rhs.v[i], '=='))
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
    return sk$cmp(this.v[i], rhs.v[i], op);
};

List$.prototype.__class__ = new Type$('list', [sk$TypeObject], {});

List$.prototype.__iter__ = function()
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
Tuple$ = function(L)
{
    this.v = L;
};

Tuple$.prototype.iter$ = function(f)
{
    for (var i = 0; i < this.v.length; ++i)
    {
        if (f.call(null, this.v[i]) === false) break;
    }
};

Tuple$.prototype.count = function() { throw "todo; tuple.count"; };
Tuple$.prototype.index = function() { throw "todo; tuple.index"; };

Tuple$.prototype.__getitem__ = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new IndexError("tuple index out of range");
        return this.v[index];
    }
    else if (index instanceof Slice$)
    {
        var ret = [];
        index.sssiter$(this, function(i, wrt)
                {
                    ret.push(wrt.v[i]);
                });
        return new Tuple$(ret);
    }
    else
        throw new TypeError("tuple indices must be integers, not " + typeof index);
};

Tuple$.prototype.__repr__ = function()
{
    var asStrs = [];
    sk$iter(this, function(v) { asStrs.push(repr(v).v); });
    if (asStrs.length === 1)
        return new Str$("(" + asStrs[0] + ",)");
    else
        return new Str$("(" + asStrs.join(", ") + ")");
};

Tuple$.prototype.__mul__ = Tuple$.prototype.__rmul__ = function(other)
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
    return new Tuple$(ret);
};

Tuple$.prototype.richcmp$ = function(rhs, op)
{
    if (rhs.constructor !== Tuple$) return false;

    // find the first item where they're different
    for (var i = 0; i < this.v.length && i < rhs.v.length; ++i)
    {
        if (!sk$cmp(this.v[i], rhs.v[i], '=='))
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
    return sk$cmp(this.v[i], rhs.v[i], op);
};

// todo; the numbers and order are taken from python, but the answer's
// obviously not the same because there's no int wrapping. shouldn't matter,
// but would be nice to make the hash() values the same if it's not too
// expensive to simplify tests.
Tuple$.prototype.__hash__ = function()
{
    var mult = 1000003;
    var x = 0x345678;
    for (var i = 0; i < this.v.length; ++i)
    {
        var y = hash(this.v[i]) === -1;
        if (y === -1) return -1;
        x = (x ^ y) * mult;
        mult += 82520 + len + len;
    }
    x += 97531;
    if (x === -1) x = -1;
    return x;
};

function tuple(L) { return new Tuple$(L.v); }

Tuple$.prototype.__iter__ = function()
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
Dict$ = function(L)
{
    this.size = 0;

    for (var i = 0; i < L.length; i += 2)
    {
        this.__setitem__(L[i], L[i+1]);
    }

    return this;
};

Dict$.prototype.key$ = function(value)
{
    return hash(value);
};

Dict$.prototype.clear = function() { throw "todo; dict.clear"; };
Dict$.prototype.copy = function() { throw "todo; dict.copy"; };
Dict$.prototype.fromkeys = function() { throw "todo; dict.fromkeys"; };
Dict$.prototype.get = function() { throw "todo; dict.get"; };

Dict$.prototype.has_key = function(key)
{
	return this.hasOwnProperty(this.key$(key));
};

Dict$.prototype.items = function() { throw "todo; dict.items"; };
Dict$.prototype.iteritems = function() { throw "todo; dict.iteritems"; };
Dict$.prototype.iterkeys = function() { throw "todo; dict.iterkeys"; };
Dict$.prototype.itervalues = function() { throw "todo; dict.itervalues"; };
Dict$.prototype.keys = function() { throw "todo; dict.keys"; };
Dict$.prototype.pop = function() { throw "todo; dict.pop"; };
Dict$.prototype.popitem = function() { throw "todo; dict.popitem"; };
Dict$.prototype.setdefault = function() { throw "todo; dict.setdefault"; };
Dict$.prototype.update = function() { throw "todo; dict.update"; };
Dict$.prototype.values = function() { throw "todo; dict.values"; };

Dict$.prototype.__getitem__ = function(key)
{
    var entry = this[this.key$(key)];
    return typeof entry === 'undefined' ? undefined : entry.rhs;
};

Dict$.prototype.__setitem__ = function(key, value)
{
    var k = this.key$(key);

    if (this.hasOwnProperty(k))
    {
        this[k].rhs = value;
    }
    else
    {
        var entry = { lhs : key, rhs : value };
        this[k] = entry;

        this.size += 1;
    }

    return this;
};

Dict$.prototype.__delitem__ = function(key)
{
    var k = this.key$(key);

    if (this.hasOwnProperty(k))
    {
        this.size -= 1;
        delete this[k];
    }

    return this;
};

Dict$.prototype.__repr__ = function()
{
    var ret = [];
    for (var iter = this.__iter__(), k = iter.next();
            k !== undefined;
            k = iter.next())
    {
        var v = this.__getitem__(k);
        ret.push(repr(k).v + ": " + repr(v).v);
    }
    return new Str$("{" + ret.join(", ") + "}");
};
Dict$.prototype.__class__ = new Type$('dict', [sk$TypeObject], {});

Dict$.prototype.__iter__ = function()
{
    var allkeys = [];
    for (var k in this)
    {
        if (this.hasOwnProperty(k))
        {
            var i = this[k];
            if (i && i.hasOwnProperty('lhs')) // skip internal stuff. todo; merge pyobj and this
            {
                allkeys.push(k);
            }
        }
    }
    //print(allkeys);

    var ret =
    {
        __iter__: function() { return ret; },
        $obj: this,
        $index: 0,
        $keys: allkeys,
        next: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$keys.length) return undefined;
            return ret.$obj[ret.$keys[ret.$index++]].lhs;
        }
    };
    return ret;
};
// long aka "bigint" implementation
//
// the representation used is similar to python 2.6's:
//
// - each 'digit' of the long is 15 bits, which gives enough space in each to
// perform a multiplication without losing precision in the mantissa of
// javascript's number representation (a double).
//
// - the numbers are stored as the absolute value of the number, with an
// additional size field that's the number of digits in the long. if size < 0,
// the number is negative, and it's 0 if the long is 0.
//
// some of the implementation is also ported from longobject.c in python2.6.
//
// it's better not to think about how many processor-level instructions this
// is causing!


Long$ = function(size)
{
    this.digit$ = new Array(Math.abs(size));
    this.size$ = size;
    return this;
};

Long$.SHIFT$ = 15;
Long$.BASE$ = 1 << Long$.SHIFT$;
Long$.MASK$ = Long$.BASE$ - 1;
Long$.threshold$ = Math.pow(2, 30);

Long$.fromInt$ = function(ival)
{
    var negative = false;
    if (ival < 0)
    {
        ival = -ival;
        negative = true;
    }

    var t = ival;
    var ndigits = 0;
    while (t)
    {
        ndigits += 1;
        t >>= Long$.SHIFT$;
    }

    var ret = new Long$(ndigits);
    if (negative) ret.size$ = -ret.size$;
    t = ival;
    var i = 0;
    while (t)
    {
        ret.digit$[i] = t & Long$.MASK$;
        t >>= Long$.SHIFT$;
        i += 1;
    }

    return ret;
};


// mul by single digit, ignoring sign
Long$.mulInt$ = function(a, n)
{
    var size_a = Math.abs(a.size$);
    var z = new Long$(size_a + 1);
    var carry = 0;
    var i;

    for (i = 0; i < size_a; ++i)
    {
        carry += a.digit$[i] * n;
        z.digit$[i] = carry & Long$.MASK$;
        carry >>= Long$.SHIFT$;
    }
    z.digit$[i] = carry;
    return Long$.normalize$(z);
};

// js string (not Str$) -> long. used to create longs in transformer, respects
// 0x, 0o, 0b, etc.
Long$.fromJsStr$ = function(s)
{
    //print("initial fromJsStr:",s);
    var base = 10;
    if (s.substr(0, 2) === "0x" || s.substr(0, 2) === "0X")
    {
        s = s.substr(2);
        base = 16;
    }
    else if (s.substr(0, 2) === "0o")
    {
        s = s.substr(2);
        base = 8;
    }
    else if (s.substr(0, 1) === "0")
    {
        s = s.substr(1);
        base = 8;
    }
    else if (s.substr(0, 2) === "0b")
    {
        s = s.substr(2);
        base = 2;
    }
    //print("base:",base, "rest:",s);
    var ret = Long$.fromInt$(0);
    var col = Long$.fromInt$(1);
    var add;
    for (var i = s.length - 1; i >= 0; --i)
    {
        add = Long$.mulInt$(col, parseInt(s.substr(i, 1), 16));
        ret = ret.__add__(add);
        col = Long$.mulInt$(col, base);
        //print("i", i, "ret", ret.digit$, ret.size$, "col", col.digit$, col.size$, ":",s.substr(i, 1), ":",parseInt(s.substr(i, 1), 10));
    }
    return ret;
};

Long$.prototype.clone = function()
{
    var ret = new Long$(this.size$);
    ret.digit$ = this.digit$.slice(0);
    return ret;
};

Long$.prototype.__add__ = function(other)
{
    // todo; upconvert other to long

    var z;
    if (this.size$ < 0)
    {
        if (other.size$ < 0)
        {
            z = Long$.add$(this, other);
            z.size$ = -z.size$;
        }
        else
        {
            z = Long$.sub$(other, this);
        }
    }
    else
    {
        if (other.size$ < 0)
            z = Long$.sub$(this, other);
        else
            z = Long$.add$(this, other);
    }
    return z;
};

Long$.prototype.__sub__ = function(other)
{
    // todo; upconvert other

    var z;
    if (this.size$ < 0)
    {
        if (other.size$ < 0)
            z = Long$.sub$(this, other);
        else
            z = Long$.add$(this, other);
        z.size$ = -z.size$;
    }
    else
    {
        if (other.size < 0)
            z = Long$.add$(this, other);
        else
            z = Long$.sub$(this, other);
    }
    return z;
};

Long$.prototype.__mul__ = function(other)
{
    // todo; upconvert
    var z = Long$.mul$(this, other);
	if (this.size$ * other.size$ < 0)
		z.size$ = -z.size$;
    return z;
};

Long$.prototype.__pow__ = function(n)
{
    // todo; upconvert n

    var ret = Long$.fromInt$(1);
    var x = this.clone();
    while (n.size$ > 0)
    {
        if (n.digit$[0] % 2 !== 0) // odd
        {
            ret = Long$.mul$(ret, x);
            n.digit$[0] &= ~1;
        }
        x = Long$.mul$(x, x);
        n.divremInt$(2);
    }
    if (this.size$ < 0) ret.size$ = -ret.size$;
    return ret;
};

Long$.prototype.__neg__ = function()
{
    var ret = this.clone();
    ret.size$ = -ret.size$;
    return ret;
};

Long$.divrem$ = function(other)
{
    var size_a = Math.abs(this.size$);
    var size_b = Math.abs(other.size$);
    var z;
    var rem;

    if (other.size$ === 0)
        throw new ZeroDivisionError("long division or modulo by zero");

    if (size_a < size_b ||
            this.digit$[size_a - 1] < other.digit$[size_b - 1])
    {
        // |this| < |other|
        return [0, this];
    }
    if (size_b === 1)
    {
        z = this.clone();
        var remi = z.divremInt$(other.digit$[0]);
        rem = new Long$(1);
        rem.digit$[0] = remi;
    }
	else
    {
        var tmp = Long$.divremFull$(this, other);
        z = tmp[0];
        rem = tmp[1];
	}
    // z has sign of this*other, remainder has sign of a so that this=other*z+r
    if ((this.size$ < 0) !== (other.size$ < 0))
        z.size$ = -z.size$;
    if (this.size$ < 0 && rem.size$ !== 0)
        rem.size$ = -rem.size$;
    return [z, rem];
};

Long$.divremFull$ = function(v1, w1)
{
    throw "todo;";
    /*
    var size_v = Math.abs(v1.size$);
    var size_w = Math.abs(w1.size$);
    var d = Long$.BASE$ / (w1.digit[size_w - 1] + 1);
    var v = Long$.mulInt$(v1, d);
    var w = Long$.mulInt$(w1, d);
    */
};

Long$.normalize$ = function(v)
{
    var j = Math.abs(v.size$);
    var i = j;

	while (i > 0 && v.digit$[i - 1] === 0)
		--i;
	if (i !== j)
        v.size$ = v.size$ < 0 ? -i : i;
	return v;
};

// Add the absolute values of two longs
Long$.add$ = function(a, b)
{
    var size_a = Math.abs(a.size$);
    var size_b = Math.abs(b.size$);
    var z;
    var i;
    var carry = 0;

    // ensure a is the larger of the two
    if (size_a < size_b)
    {
        var tmp = a; a = b; b = tmp;
        tmp = size_a; size_a = size_b; size_b = tmp;
    }

    z = new Long$(size_a + 1);
	for (i = 0; i < size_b; ++i)
    {
		carry += a.digit$[i] + b.digit$[i];
		z.digit$[i] = carry & Long$.MASK$;
		carry >>= Long$.SHIFT$;
	}
	for (; i < size_a; ++i)
    {
		carry += a.digit$[i];
		z.digit$[i] = carry & Long$.MASK$;
		carry >>= Long$.SHIFT$;
	}
	z.digit$[i] = carry;
	return Long$.normalize$(z);
};

// Subtract the absolute values of two longs

Long$.sub$ = function(a, b)
{
    var size_a = Math.abs(a.size$);
    var size_b = Math.abs(b.size$);
    var z;
    var i;
    var sign = 1;
    var borrow = 0;
    var tmp;

	// Ensure a is the larger of the two
    if (size_a < size_b)
    {
        sign = -1;
        tmp = a; a = b; b = tmp;
        tmp = size_a; size_a = size_b; size_b = tmp;
    }
	else if (size_a === size_b)
    {
		// Find highest digit where a and b differ
		i = size_a;
		while (--i >= 0 && a.digit$[i] === b.digit$[i])
        {
            // nothing
        }
		if (i < 0) return new Long$(0);
		if (a.digit$[i] < b.digit$[i])
        {
			sign = -1;
            tmp = a; a = b; b = tmp;
		}
		size_a = size_b = i + 1;
	}
    z = new Long$(size_a);
	for (i = 0; i < size_b; ++i)
    {
        // todo; this isn't true in js i don't think
		// The following assumes unsigned arithmetic
	    // works modulo 2**N for some N>SHIFT
		borrow = a.digit$[i] - b.digit$[i] - borrow;
		z.digit$[i] = borrow & Long$.MASK$;
		borrow >>= Long$.SHIFT$;
		borrow &= 1; // Keep only one sign bit
	}
	for (; i < size_a; ++i)
    {
		borrow = a.digit$[i] - borrow;
		z.digit$[i] = borrow & Long$.MASK$;
		borrow >>= Long$.SHIFT$;
		borrow &= 1; // Keep only one sign bit
	}
    if (borrow !== 0) throw "assert";
	if (sign < 0)
		z.size$ = -z.size$;
	return Long$.normalize$(z);
};

// "grade school" multiplication, ignoring the signs.
// returns abs of product.
// todo; karatsuba is O better after a few 100 digits long, but more
// complicated for now.
Long$.mul$ = function(a, b)
{
    var size_a = Math.abs(a.size$);
    var size_b = Math.abs(b.size$);
    var z = new Long$(size_a + size_b);
    var i;
    for (i = 0; i < size_a + size_b; ++i) z.digit$[i] = 0;

    //print("size_a",size_a,"size_b",size_b,"tot", size_a+size_b);
    for (i = 0; i < size_a; ++i)
    {
        var carry = 0;
        var k = i;
        var f = a.digit$[i];
        for (var j = 0; j < size_b; ++j)
        {
            carry += z.digit$[k] + b.digit$[j] * f;
            //print("@",k,j,carry);
            z.digit$[k++] = carry & Long$.MASK$;
            //print("stored:",z.digit$[i]);
            carry >>= Long$.SHIFT$;
            //print("carry shifted to:",carry);
            if (carry > Long$.MASK$) throw "assert";
        }
        if (carry)
            z.digit$[k++] += carry & Long$.MASK$;
    }

    Long$.normalize$(z);
    return z;
};

Long$.prototype.__nonzero__ = function()
{
    return this.size$ !== 0;
};

// divide this by non-zero digit n (inplace). return remainder.
Long$.prototype.divremInt$ = function(n)
{
    var rem;
    var cur = Math.abs(this.size$);
    while (--cur >= 0)
    {
        var hi;
        rem = (rem << Long$.SHIFT$) + this.digit$[cur];
        this.digit$[cur] = hi = Math.floor(rem / n);
        rem -= hi * n;
    }
    Long$.normalize$(this);
    return rem;
};

Long$.prototype.__repr__ = function()
{
    return new Str$(this.str$() + "L");
};

Long$.prototype.__str__ = function()
{
    return new Str$(this.str$());
};

Long$.prototype.str$ = function(base, sign)
{
    if (this.size$ === 0) return "0";

    if (base === undefined) base = 10;
    if (sign === undefined) sign = true;

    var ret = "";

    var tmp = this.clone();
    while (tmp.__nonzero__())
    {
        //print("before d:",tmp.digit$, "s:",tmp.size$);
        var t = tmp.divremInt$(base);
        //print("after d:",tmp.digit$, "s:",tmp.size$);
        //print("t:",t);
        ret = "0123456789abcdef".substring(t, t + 1) + ret;
    }
    return (sign && this.size$ < 0 ? "-" : "") + ret;
};

Long$.prototype.__class__ = new Type$('long', [sk$TypeObject], {});

// handle upconverting a/b from number to long if op causes too big/small a
// result, or if either of the ops are already longs
Long$.numOpAndPromotion$ = function(a, b, op)
{
    if (typeof a === "number" && typeof b === "number")
    {
        var ans = op(a, b);
        if (ans > Long$.threshold$ || ans < -Long$.threshold$)
        {
            // todo; handle float
            a = Long$.fromInt$(a);
            b = Long$.fromInt$(b);
        }
        else
        {
            return ans;
        }
    }
    else if (a.__class__ === Long$.prototype.__class__
            || b.__class__ === Long$.prototype.__class__)
    {
        if (typeof a === "number") a = Long$.fromInt$(a);
        if (typeof b === "number") b = Long$.fromInt$(b);
    }
    return [a, b];
};
Slice$ = function(start, stop, step)
{
    if (stop === undefined && step === undefined)
    {
        stop = start;
        start = null;
    }
    if (!start) start = null;
    if (stop === undefined) stop = null;
    if (step === undefined) step = null;
    this.start = start;
    this.stop = stop;
    this.step = step;
};

Slice$.prototype.__str__ = function()
{
    var a = repr(this.start).v;
    var b = repr(this.stop).v;
    var c = repr(this.step).v;
    return new Str$("slice(" + a + ", " + b + ", " + c + ")");
};

Slice$.prototype.indices = function(length)
{
    // this seems ugly, better way?
    var start = this.start, stop = this.stop, step = this.step, i;
    if (step === null) step = 1;
    if (step > 0)
    {
        if (start === null) start = 0;
        if (stop === null) stop = length;
        if (start < 0) start = length + start;
        if (stop < 0) stop = length + stop;
    }
    else
    {
        if (start === null) start = length - 1;
        else if (start < 0) start = length + start;
        if (stop === null) stop = -1;
        else if (stop < 0) stop = length + stop;
    }
    return [start, stop, step];
};

Slice$.prototype.sssiter$ = function(wrt, f)
{
    var sss = this.indices(typeof wrt === "number" ? wrt : wrt.v.length);
    if (sss[2] > 0)
    {
        var i;
        for (i = sss[0]; i < sss[1]; i += sss[2])
            if (f(i, wrt) === false) return;
    }
    else
    {
        for (i = sss[0]; i > sss[1]; i += sss[2])
            if (f(i, wrt) === false) return;

    }
};
Module$ = function(name, file)
{
    this.__name__ = name;
    if (file) this.__file__ = file;
};

/*jslint newcap: false */
Module$.prototype = new object();
/*jslint newcap: true */

Module$.modules$ = new Dict$([]);
Module$.builtins$ = new Dict$([]);
Module$.syspath$ = new List$([]);

Module$.prototype.__class__ = new Type$('module', [sk$TypeObject], {});
Module$.prototype.__dir__ = function()
{
    var names = [];
    print(repr(this.__dict__).v);
    for (var iter = this.__dict__.__iter__(), i = iter.next(); i !== undefined; i = iter.next())
        names.push(i);
    return new List$(names);
};
Module$.prototype.__repr__ = function()
{
    return new Str$("<module '" + this.__name__ + "' "
            + (this.__file__
                ? ("from '" + this.__file__ + "'")
                : "(built-in)")
            + ">");
};
var Skulpt = (function(){
Module$.builtins$.sys = function(self)
{
    self.__setattr__('modules', Module$.modules$);

    var argv = sk$sysargv || [];
    for (var i = 0; i < argv.length; ++i)
        argv[i] = new Str$(argv[i]);
    self.__setattr__('argv', new List$(argv));

    self.__setattr__('path', Module$.syspath$);
};
/*
 * This is a port of tokenize.py by Ka-Ping Yee.
 *
 * each call to readline should return one line of input as a string, or
 * undefined if it's finished.
 *
 * callback is called for each token with 5 args:
 * 1. the token type
 * 2. the token string
 * 3. [ start_row, start_col ]
 * 4. [ end_row, end_col ]
 * 5. logical line where the token was found, including continuation lines
 *
 * callback can return true to abort.
 *
 */
var T_ENDMARKER = 0;
var T_NAME = 1;
var T_NUMBER = 2;
var T_STRING = 3;
var T_NEWLINE = 4;
var T_INDENT = 5;
var T_DEDENT = 6;
var T_LPAR = 7;
var T_RPAR = 8;
var T_LSQB = 9;
var T_RSQB = 10;
var T_COLON = 11;
var T_COMMA = 12;
var T_SEMI = 13;
var T_PLUS = 14;
var T_MINUS = 15;
var T_STAR = 16;
var T_SLASH = 17;
var T_VBAR = 18;
var T_AMPER = 19;
var T_LESS = 20;
var T_GREATER = 21;
var T_EQUAL = 22;
var T_DOT = 23;
var T_PERCENT = 24;
var T_BACKQUOTE = 25;
var T_LBRACE = 26;
var T_RBRACE = 27;
var T_EQEQUAL = 28;
var T_NOTEQUAL = 29;
var T_LESSEQUAL = 30;
var T_GREATEREQUAL = 31;
var T_TILDE = 32;
var T_CIRCUMFLEX = 33;
var T_LEFTSHIFT = 34;
var T_RIGHTSHIFT = 35;
var T_DOUBLESTAR = 36;
var T_PLUSEQUAL = 37;
var T_MINEQUAL = 38;
var T_STAREQUAL = 39;
var T_SLASHEQUAL = 40;
var T_PERCENTEQUAL = 41;
var T_AMPEREQUAL = 42;
var T_VBAREQUAL = 43;
var T_CIRCUMFLEXEQUAL = 44;
var T_LEFTSHIFTEQUAL = 45;
var T_RIGHTSHIFTEQUAL = 46;
var T_DOUBLESTAREQUAL = 47;
var T_DOUBLESLASH = 48;
var T_DOUBLESLASHEQUAL = 49;
var T_AT = 50;
var T_OP = 51;
var T_COMMENT = 52;
var T_NL = 53;
var T_RARROW = 54;
var T_ERRORTOKEN = 55;
var T_N_TOKENS = 56;
var T_NT_OFFSET = 256;

function group()
{
    var args = Array.prototype.slice.call(arguments);
    return '(' + args.join('|') + ')'; 
}
function any() { return group.apply(null, arguments) + "*"; }
function maybe() { return group.apply(null, arguments) + "?"; }

/* we have to use string and ctor to be able to build patterns up. + on /.../
 * does something strange. */
var Whitespace = "[ \\f\\t]*";
var Comment = "#[^\\r\\n]*";
var Ident = "[a-zA-Z_]\\w*";

var Binnumber = '0[bB][01]*';
var Hexnumber = '0[xX][\\da-fA-F]*[lL]?';
var Octnumber = '0[oO]?[0-7]*[lL]?';
var Decnumber = '[1-9]\\d*[lL]?';
var Intnumber = group(Binnumber, Hexnumber, Octnumber, Decnumber);

var Exponent = "[eE][-+]?\\d+";
var Pointfloat = group("\\d+\\.\\d*", "\\.\\d+") + maybe(Exponent);
var Expfloat = '\\d+' + Exponent;
var Floatnumber = group(Pointfloat, Expfloat);
var Imagnumber = group("\\d+[jJ]", Floatnumber + "[jJ]");
var Number_ = group(Imagnumber, Floatnumber, Intnumber);

// tail end of ' string
var Single = "[^'\\\\]*(?:\\\\.[^'\\\\]*)*'";
// tail end of " string
var Double_= '[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
// tail end of ''' string
var Single3 = "[^'\\\\]*(?:(?:\\\\.|'(?!''))[^'\\\\]*)*'''";
// tail end of """ string
var Double3 = '[^"\\\\]*(?:(?:\\\\.|"(?!""))[^"\\\\]*)*"""';
var Triple = group("[ubUB]?[rR]?'''", '[ubUB]?[rR]?"""');
var String_ = group("[uU]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'",
        '[uU]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');

// Because of leftmost-then-longest match semantics, be sure to put the
// longest operators first (e.g., if = came before ==, == would get
// recognized as two instances of =).
var Operator = group("\\*\\*=?", ">>=?", "<<=?", "<>", "!=",
                 "//=?", "->",
                 "[+\\-*/%&|^=<>]=?",
                 "~");

var Bracket = '[\\][(){}]';
var Special = group('\\r?\\n', '[:;.,`@]');
var Funny  = group(Operator, Bracket, Special);

var ContStr = group("[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*" +
                group("'", '\\\\\\r?\\n'),
                '[uUbB]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*' +
                group('"', '\\\\\\r?\\n'));
var PseudoExtras = group('\\\\\\r?\\n', Comment, Triple);
var PseudoToken = group(PseudoExtras, Number_, Funny, ContStr, Ident);

var pseudoprog = new RegExp(PseudoToken);
var single3prog = new RegExp(Single3, "g");
var double3prog = new RegExp(Double3, "g");
var endprogs = {
    "'": new RegExp(Single, "g"), '"': new RegExp(Double_, "g"),
    "'''": single3prog, '"""': double3prog,
    "r'''": single3prog, 'r"""': double3prog,
    "u'''": single3prog, 'u"""': double3prog,
    "b'''": single3prog, 'b"""': double3prog,
    "ur'''": single3prog, 'ur"""': double3prog,
    "br'''": single3prog, 'br"""': double3prog,
    "R'''": single3prog, 'R"""': double3prog,
    "U'''": single3prog, 'U"""': double3prog,
    "B'''": single3prog, 'B"""': double3prog,
    "uR'''": single3prog, 'uR"""': double3prog,
    "Ur'''": single3prog, 'Ur"""': double3prog,
    "UR'''": single3prog, 'UR"""': double3prog,
    "bR'''": single3prog, 'bR"""': double3prog,
    "Br'''": single3prog, 'Br"""': double3prog,
    "BR'''": single3prog, 'BR"""': double3prog,
    'r': null, 'R': null,
    'u': null, 'U': null,
    'b': null, 'B': null
};

var triple_quoted = {
"'''": true, '"""': true,
"r'''": true, 'r"""': true, "R'''": true, 'R"""': true,
"u'''": true, 'u"""': true, "U'''": true, 'U"""': true,
"b'''": true, 'b"""': true, "B'''": true, 'B"""': true,
"ur'''": true, 'ur"""': true, "Ur'''": true, 'Ur"""': true,
"uR'''": true, 'uR"""': true, "UR'''": true, 'UR"""': true,
"br'''": true, 'br"""': true, "Br'''": true, 'Br"""': true,
"bR'''": true, 'bR"""': true, "BR'''": true, 'BR"""': true
};

var single_quoted = {
"'": true, '"': true,
"r'": true, 'r"': true, "R'": true, 'R"': true,
"u'": true, 'u"': true, "U'": true, 'U"': true,
"b'": true, 'b"': true, "B'": true, 'B"': true,
"ur'": true, 'ur"': true, "Ur'": true, 'Ur"': true,
"uR'": true, 'uR"': true, "UR'": true, 'UR"': true,
"br'": true, 'br"': true, "Br'": true, 'Br"': true,
"bR'": true, 'bR"': true, "BR'": true, 'BR"': true
};

var tabsize = 8;

function contains(a, obj)
{
    var i = a.length;
    while (i--)
    {
        if (a[i] === obj)
        {
            return true;
        }
    }
    return false;
}

function rstrip(input, what)
{
    for (var i = input.length; i > 0; --i)
    {
        if (what.indexOf(input.charAt(i - 1)) === -1) break;
    }
    return input.substring(0, i);
}

function Tokenizer(filename, interactive, callback)
{
    this.filename = filename;
    this.callback = callback;
    this.lnum = 0;
    this.parenlev = 0;
    this.continued = false;
    this.namechars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    this.numchars = '0123456789';
    this.contstr = '';
    this.needcont = false;
    this.contline = undefined;
    this.indents = [0];
    this.endprog = undefined;
    this.strstart = undefined;
    this.interactive = interactive;
    this.doneFunc = function()
    {
        for (var i = 1; i < this.indents.length; ++i) // pop remaining indent levels
        {
            if (this.callback(T_DEDENT, '', [this.lnum, 0], [this.lnum, 0], '')) return 'done';
        }
        if (this.callback(T_ENDMARKER, '', [this.lnum, 0], [this.lnum, 0], '')) return 'done';

        return 'failed';
    };
}
Tokenizer.prototype.generateTokens = function(line)
{
    var endmatch, pos, column, end, max;

    if (!line) line = '';
    //print("LINE:'"+line+"'");

    this.lnum += 1;
    pos = 0;
    max = line.length;

    if (this.contstr.length > 0)
    {
        if (!line)
        {
            throw new TokenError("EOF in multi-line string", this.filename, this.strstart[0], this.strstart[1], this.contline);
        }
        endmatch = this.endprog.test(line);
        if (endmatch)
        {
            pos = end = this.endprog.lastIndex;
            if (this.callback(T_STRING, this.contstr + line.substring(0,end),
                        this.strstart, [this.lnum, end], this.contline + line))
                return 'done';
            this.contstr = '';
            this.needcont = false;
            this.contline = undefined;
        }
        else if (this.needcont && line.substring(line.length - 2) !== "\\\n" && line.substring(line.length - 3) !== "\\\r\n")
        {
            if (this.callback(T_ERRORTOKEN, this.contstr + line,
                        this.strstart, [this.lnum, line.length], this.contline))
                return 'done';
            this.contstr = '';
            this.contline = undefined;
            return false;
        }
        else
        {
            this.contstr += line;
            this.contline = this.contline + line;
            return false;
        }
    }
    else if (this.parenlev === 0 && !this.continued)
    {
        if (!line) return this.doneFunc();
        column = 0;
        while (pos < max)
        {
            if (line.charAt(pos) === ' ') column += 1;
            else if (line.charAt(pos) === '\t') column = (column/tabsize + 1)*tabsize;
            else if (line.charAt(pos) === '\f') column = 0;
            else break;
            pos = pos + 1;
        }
        if (pos === max) return this.doneFunc();

        if ("#\r\n".indexOf(line.charAt(pos)) !== -1) // skip comments or blank lines
        {
            if (line.charAt(pos) === '#')
            {
                var comment_token = rstrip(line.substring(pos), '\r\n');
                var nl_pos = pos + comment_token.length;
                if (this.callback(T_COMMENT, comment_token,
                            [this.lnum, pos], [this.lnum, pos + comment_token.length], line))
                    return 'done';
                //print("HERE:1");
                if (this.callback(T_NL, line.substring(nl_pos),
                            [this.lnum, nl_pos], [this.lnum, line.length], line))
                    return 'done';
                return false;
            }
            else
            {
                //print("HERE:2");
                if (this.callback(T_NL, line.substring(pos),
                            [this.lnum, pos], [this.lnum, line.length], line))
                    return 'done';
                if (!this.interactive) return false;
            }
        }

        if (column > this.indents[this.indents.length - 1]) // count indents or dedents
        {
            this.indents.push(column);
            if (this.callback(T_INDENT, line.substring(0, pos), [this.lnum, 0], [this.lnum, pos], line))
                return 'done';
        }
        while (column < this.indents[this.indents.length - 1])
        {
            if (!contains(this.indents, column))
            {
                throw new IndentationError("unindent does not match any outer indentation level",
                        this.filename, this.lnum, pos, line);
            }
            this.indents.splice(this.indents.length - 1, 1);
            //print("dedent here");
            if (this.callback(T_DEDENT, '', [this.lnum, pos], [this.lnum, pos], line))
                return 'done';
        }
    }
    else // continued statement
    {
        if (!line)
        {
            throw new TokenError("EOF in multi-line statement", this.filename, this.lnum, 0, line);
        }
        this.continued = false;
    }

    while (pos < max)
    {
        //print("pos:"+pos+":"+max);
        // js regexes don't return any info about matches, other than the
        // content. we'd like to put a \w+ before pseudomatch, but then we
        // can't get any data
        while (line.charAt(pos) === ' ' || line.charAt(pos) === '\f' || line.charAt(pos) === '\t')
        {
            pos += 1;
        }
        var pseudomatch = pseudoprog.exec(line.substring(pos));
        if (pseudomatch)
        {
            var start = pos;
            end = start + pseudomatch[1].length;
            var spos = [this.lnum, start];
            var epos = [this.lnum, end];
            pos = end;
            var token = line.substring(start, end);
            var initial = line.charAt(start);
            //print("initial:'" +initial +"'");
            if (this.numchars.indexOf(initial) !== -1 || (initial === '.' && token !== '.'))
            {
                if (this.callback(T_NUMBER, token, spos, epos, line)) return 'done';
            }
            else if (initial === '\r' || initial === '\n')
            {
                var newl = T_NEWLINE;
                //print("HERE:3");
                if (this.parenlev > 0) newl = T_NL;
                if (this.callback(newl, token, spos, epos, line)) return 'done';
            }
            else if (initial === '#')
            {
                if (this.callback(T_COMMENT, token, spos, epos, line)) return 'done';
            }
            else if (token in triple_quoted)
            {
                this.endprog = endprogs[token];
                endmatch = this.endprog.test(line.substring(pos));
                if (endmatch)
                {
                    pos = this.endprog.lastIndex + pos;
                    token = line.substring(start, pos);
                    if (this.callback(T_STRING, token, spos, [this.lnum, pos], line)) return 'done';
                }
                else
                {
                    this.strstart = [this.lnum, start];
                    this.contstr = line.substring(start);
                    this.contline = line;
                    return false;
                }
            }
            else if (initial in single_quoted ||
                    token.substring(0, 2) in single_quoted ||
                    token.substring(0, 3) in single_quoted)
            {
                if (token[token.length - 1] === '\n')
                {
                    this.strstart = [this.lnum, start];
                    this.endprog = endprogs[initial] || endprogs[token[1]] || endprogs[token[2]];
                    this.contstr = line.substring(start);
                    this.needcont = true;
                    this.contline = line;
                    return false;
                }
                else
                {
                    if (this.callback(T_STRING, token, spos, epos, line)) return 'done';
                }
            }
            else if (this.namechars.indexOf(initial) !== -1)
            {
                if (this.callback(T_NAME, token, spos, epos, line)) return 'done';
            }
            else if (initial === '\\')
            {
                //print("HERE:4");
                if (this.callback(T_NL, token, spos, [this.lnum, pos], line)) return 'done';
                this.continued = true;
            }
            else
            {
                if ('([{'.indexOf(initial) !== -1) this.parenlev += 1;
                else if (')]}'.indexOf(initial) !== -1) this.parenlev -= 1;
                if (this.callback(T_OP, token, spos, epos, line)) return 'done';
            }
        }
        else
        {
            if (this.callback(T_ERRORTOKEN, line.charAt(pos),
                        [this.lnum, pos], [this.lnum, pos+1], line))
                return 'done';
            pos += 1;
        }
    }

    return false;
};
// generated by pgen/main.py
var SkulptOpMap = {
"(": T_LPAR,
")": T_RPAR,
"[": T_LSQB,
"]": T_RSQB,
":": T_COLON,
",": T_COMMA,
";": T_SEMI,
"+": T_PLUS,
"-": T_MINUS,
"*": T_STAR,
"/": T_SLASH,
"|": T_VBAR,
"&": T_AMPER,
"<": T_LESS,
">": T_GREATER,
"=": T_EQUAL,
".": T_DOT,
"%": T_PERCENT,
"`": T_BACKQUOTE,
"{": T_LBRACE,
"}": T_RBRACE,
"@": T_AT,
"==": T_EQEQUAL,
"!=": T_NOTEQUAL,
"<>": T_NOTEQUAL,
"<=": T_LESSEQUAL,
">=": T_GREATEREQUAL,
"~": T_TILDE,
"^": T_CIRCUMFLEX,
"<<": T_LEFTSHIFT,
">>": T_RIGHTSHIFT,
"**": T_DOUBLESTAR,
"+=": T_PLUSEQUAL,
"-=": T_MINEQUAL,
"*=": T_STAREQUAL,
"/=": T_SLASHEQUAL,
"%=": T_PERCENTEQUAL,
"&=": T_AMPEREQUAL,
"|=": T_VBAREQUAL,
"^=": T_CIRCUMFLEXEQUAL,
"<<=": T_LEFTSHIFTEQUAL,
">>=": T_RIGHTSHIFTEQUAL,
"**=": T_DOUBLESTAREQUAL,
"//": T_DOUBLESLASH,
"//=": T_DOUBLESLASHEQUAL,
"->": T_RARROW
};
var SkulptParseTables = {
symbol2number:
{'and_expr': 257,
 'and_test': 258,
 'arglist': 259,
 'argument': 260,
 'arith_expr': 261,
 'assert_stmt': 262,
 'atom': 263,
 'augassign': 264,
 'break_stmt': 265,
 'classdef': 266,
 'comp_for': 267,
 'comp_if': 268,
 'comp_iter': 269,
 'comp_op': 270,
 'comparison': 271,
 'compound_stmt': 272,
 'continue_stmt': 273,
 'decorated': 274,
 'decorator': 275,
 'decorators': 276,
 'del_stmt': 277,
 'dictsetmaker': 278,
 'dotted_as_name': 279,
 'dotted_as_names': 280,
 'dotted_name': 281,
 'eval_input': 282,
 'except_clause': 283,
 'exec_stmt': 284,
 'expr': 285,
 'expr_stmt': 286,
 'exprlist': 287,
 'factor': 288,
 'file_input': 256,
 'flow_stmt': 289,
 'for_stmt': 290,
 'funcdef': 291,
 'global_stmt': 292,
 'if_stmt': 293,
 'import_as_name': 294,
 'import_as_names': 295,
 'import_from': 296,
 'import_name': 297,
 'import_stmt': 298,
 'lambdef': 299,
 'listmaker': 300,
 'not_test': 301,
 'old_lambdef': 302,
 'old_test': 303,
 'or_test': 304,
 'parameters': 305,
 'pass_stmt': 306,
 'power': 307,
 'print_stmt': 308,
 'raise_stmt': 309,
 'return_stmt': 310,
 'shift_expr': 311,
 'simple_stmt': 312,
 'single_input': 313,
 'sliceop': 314,
 'small_stmt': 315,
 'stmt': 316,
 'subscript': 317,
 'subscriptlist': 318,
 'suite': 319,
 'term': 320,
 'test': 321,
 'testlist': 322,
 'testlist1': 323,
 'testlist_gexp': 324,
 'testlist_safe': 325,
 'trailer': 326,
 'try_stmt': 327,
 'varargslist': 328,
 'vfpdef': 329,
 'vfplist': 330,
 'while_stmt': 331,
 'with_item': 332,
 'with_stmt': 333,
 'with_var': 334,
 'xor_expr': 335,
 'yield_expr': 336,
 'yield_stmt': 337},
number2symbol:
{256: 'file_input',
 257: 'and_expr',
 258: 'and_test',
 259: 'arglist',
 260: 'argument',
 261: 'arith_expr',
 262: 'assert_stmt',
 263: 'atom',
 264: 'augassign',
 265: 'break_stmt',
 266: 'classdef',
 267: 'comp_for',
 268: 'comp_if',
 269: 'comp_iter',
 270: 'comp_op',
 271: 'comparison',
 272: 'compound_stmt',
 273: 'continue_stmt',
 274: 'decorated',
 275: 'decorator',
 276: 'decorators',
 277: 'del_stmt',
 278: 'dictsetmaker',
 279: 'dotted_as_name',
 280: 'dotted_as_names',
 281: 'dotted_name',
 282: 'eval_input',
 283: 'except_clause',
 284: 'exec_stmt',
 285: 'expr',
 286: 'expr_stmt',
 287: 'exprlist',
 288: 'factor',
 289: 'flow_stmt',
 290: 'for_stmt',
 291: 'funcdef',
 292: 'global_stmt',
 293: 'if_stmt',
 294: 'import_as_name',
 295: 'import_as_names',
 296: 'import_from',
 297: 'import_name',
 298: 'import_stmt',
 299: 'lambdef',
 300: 'listmaker',
 301: 'not_test',
 302: 'old_lambdef',
 303: 'old_test',
 304: 'or_test',
 305: 'parameters',
 306: 'pass_stmt',
 307: 'power',
 308: 'print_stmt',
 309: 'raise_stmt',
 310: 'return_stmt',
 311: 'shift_expr',
 312: 'simple_stmt',
 313: 'single_input',
 314: 'sliceop',
 315: 'small_stmt',
 316: 'stmt',
 317: 'subscript',
 318: 'subscriptlist',
 319: 'suite',
 320: 'term',
 321: 'test',
 322: 'testlist',
 323: 'testlist1',
 324: 'testlist_gexp',
 325: 'testlist_safe',
 326: 'trailer',
 327: 'try_stmt',
 328: 'varargslist',
 329: 'vfpdef',
 330: 'vfplist',
 331: 'while_stmt',
 332: 'with_item',
 333: 'with_stmt',
 334: 'with_var',
 335: 'xor_expr',
 336: 'yield_expr',
 337: 'yield_stmt'},
dfas:
{256: [[[[1, 0], [2, 1], [3, 0]], [[0, 1]]],
       {1: 1,
        2: 1,
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        37: 1,
        38: 1}],
 257: [[[[39, 1]], [[40, 0], [0, 1]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 258: [[[[41, 1]], [[42, 0], [0, 1]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 259: [[[[43, 1], [44, 2], [45, 3]],
        [[46, 4]],
        [[47, 5], [0, 2]],
        [[46, 6]],
        [[47, 7], [0, 4]],
        [[43, 1], [44, 2], [45, 3], [0, 5]],
        [[0, 6]],
        [[44, 4], [45, 3]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1,
        43: 1,
        45: 1}],
 260: [[[[46, 1]], [[48, 2], [49, 3], [0, 1]], [[46, 3]], [[0, 3]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 261: [[[[50, 1]], [[31, 0], [38, 0], [0, 1]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 262: [[[[11, 1]], [[46, 2]], [[47, 3], [0, 2]], [[46, 4]], [[0, 4]]],
       {11: 1}],
 263: [[[[19, 1],
         [6, 2],
         [21, 5],
         [13, 4],
         [14, 6],
         [32, 3],
         [8, 7],
         [28, 2]],
        [[19, 1], [0, 1]],
        [[0, 2]],
        [[51, 8], [52, 2]],
        [[53, 2], [54, 9], [55, 9]],
        [[56, 10], [57, 2]],
        [[14, 11]],
        [[58, 12]],
        [[52, 2]],
        [[53, 2]],
        [[57, 2]],
        [[14, 2]],
        [[8, 2]]],
       {6: 1, 8: 1, 13: 1, 14: 1, 19: 1, 21: 1, 28: 1, 32: 1}],
 264: [[[[59, 1],
         [60, 1],
         [61, 1],
         [62, 1],
         [63, 1],
         [64, 1],
         [65, 1],
         [66, 1],
         [67, 1],
         [68, 1],
         [69, 1],
         [70, 1]],
        [[0, 1]]],
       {59: 1,
        60: 1,
        61: 1,
        62: 1,
        63: 1,
        64: 1,
        65: 1,
        66: 1,
        67: 1,
        68: 1,
        69: 1,
        70: 1}],
 265: [[[[15, 1]], [[0, 1]]], {15: 1}],
 266: [[[[22, 1]],
        [[28, 2]],
        [[71, 3], [13, 4]],
        [[72, 5]],
        [[53, 6], [73, 7]],
        [[0, 5]],
        [[71, 3]],
        [[53, 6]]],
       {22: 1}],
 267: [[[[34, 1]],
        [[74, 2]],
        [[75, 3]],
        [[76, 4]],
        [[77, 5], [0, 4]],
        [[0, 5]]],
       {34: 1}],
 268: [[[[36, 1]], [[78, 2]], [[77, 3], [0, 2]], [[0, 3]]], {36: 1}],
 269: [[[[79, 1], [49, 1]], [[0, 1]]], {34: 1, 36: 1}],
 270: [[[[80, 1],
         [81, 1],
         [20, 2],
         [82, 1],
         [80, 1],
         [75, 1],
         [83, 1],
         [84, 3],
         [85, 1],
         [86, 1]],
        [[0, 1]],
        [[75, 1]],
        [[20, 1], [0, 3]]],
       {20: 1, 75: 1, 80: 1, 81: 1, 82: 1, 83: 1, 84: 1, 85: 1, 86: 1}],
 271: [[[[87, 1]], [[88, 0], [0, 1]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 272: [[[[89, 1],
         [90, 1],
         [91, 1],
         [92, 1],
         [93, 1],
         [94, 1],
         [95, 1],
         [96, 1]],
        [[0, 1]]],
       {7: 1, 9: 1, 17: 1, 22: 1, 27: 1, 34: 1, 36: 1, 37: 1}],
 273: [[[[16, 1]], [[0, 1]]], {16: 1}],
 274: [[[[97, 1]], [[95, 2], [92, 2]], [[0, 2]]], {17: 1}],
 275: [[[[17, 1]],
        [[98, 2]],
        [[13, 4], [1, 3]],
        [[0, 3]],
        [[53, 5], [99, 6]],
        [[1, 3]],
        [[53, 5]]],
       {17: 1}],
 276: [[[[100, 1]], [[100, 1], [0, 1]]], {17: 1}],
 277: [[[[29, 1]], [[74, 2]], [[0, 2]]], {29: 1}],
 278: [[[[46, 1]],
        [[71, 2], [49, 3], [47, 4], [0, 1]],
        [[46, 5]],
        [[0, 3]],
        [[46, 6], [0, 4]],
        [[49, 3], [47, 7], [0, 5]],
        [[47, 4], [0, 6]],
        [[46, 8], [0, 7]],
        [[71, 9]],
        [[46, 10]],
        [[47, 7], [0, 10]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 279: [[[[98, 1]], [[101, 2], [0, 1]], [[28, 3]], [[0, 3]]], {28: 1}],
 280: [[[[102, 1]], [[47, 0], [0, 1]]], {28: 1}],
 281: [[[[28, 1]], [[14, 0], [0, 1]]], {28: 1}],
 282: [[[[73, 1]], [[1, 1], [2, 2]], [[0, 2]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 283: [[[[103, 1]],
        [[46, 2], [0, 1]],
        [[101, 3], [47, 3], [0, 2]],
        [[46, 4]],
        [[0, 4]]],
       {103: 1}],
 284: [[[[26, 1]],
        [[87, 2]],
        [[75, 3], [0, 2]],
        [[46, 4]],
        [[47, 5], [0, 4]],
        [[46, 6]],
        [[0, 6]]],
       {26: 1}],
 285: [[[[104, 1]], [[105, 0], [0, 1]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 286: [[[[73, 1]],
        [[106, 2], [48, 3], [0, 1]],
        [[73, 4], [55, 4]],
        [[73, 5], [55, 5]],
        [[0, 4]],
        [[48, 3], [0, 5]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 287: [[[[87, 1]], [[47, 2], [0, 1]], [[87, 1], [0, 2]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 288: [[[[31, 1], [107, 2], [38, 1], [5, 1]], [[108, 2]], [[0, 2]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 289: [[[[109, 1], [110, 1], [111, 1], [112, 1], [113, 1]], [[0, 1]]],
       {10: 1, 12: 1, 15: 1, 16: 1, 18: 1}],
 290: [[[[34, 1]],
        [[74, 2]],
        [[75, 3]],
        [[73, 4]],
        [[71, 5]],
        [[72, 6]],
        [[114, 7], [0, 6]],
        [[71, 8]],
        [[72, 9]],
        [[0, 9]]],
       {34: 1}],
 291: [[[[7, 1]], [[28, 2]], [[115, 3]], [[71, 4]], [[72, 5]], [[0, 5]]],
       {7: 1}],
 292: [[[[33, 1], [25, 1]], [[28, 2]], [[47, 1], [0, 2]]], {25: 1, 33: 1}],
 293: [[[[36, 1]],
        [[46, 2]],
        [[71, 3]],
        [[72, 4]],
        [[114, 5], [116, 1], [0, 4]],
        [[71, 6]],
        [[72, 7]],
        [[0, 7]]],
       {36: 1}],
 294: [[[[28, 1]], [[101, 2], [0, 1]], [[28, 3]], [[0, 3]]], {28: 1}],
 295: [[[[117, 1]], [[47, 2], [0, 1]], [[117, 1], [0, 2]]], {28: 1}],
 296: [[[[35, 1]],
        [[98, 2], [14, 3]],
        [[4, 4]],
        [[98, 2], [4, 4], [14, 3]],
        [[118, 5], [43, 5], [13, 6]],
        [[0, 5]],
        [[118, 7]],
        [[53, 5]]],
       {35: 1}],
 297: [[[[4, 1]], [[119, 2]], [[0, 2]]], {4: 1}],
 298: [[[[120, 1], [121, 1]], [[0, 1]]], {4: 1, 35: 1}],
 299: [[[[23, 1]], [[71, 2], [122, 3]], [[46, 4]], [[71, 2]], [[0, 4]]],
       {23: 1}],
 300: [[[[46, 1]],
        [[49, 2], [47, 3], [0, 1]],
        [[0, 2]],
        [[46, 4], [0, 3]],
        [[47, 3], [0, 4]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 301: [[[[20, 1], [123, 2]], [[41, 2]], [[0, 2]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 302: [[[[23, 1]], [[71, 2], [122, 3]], [[78, 4]], [[71, 2]], [[0, 4]]],
       {23: 1}],
 303: [[[[124, 1], [125, 1]], [[0, 1]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 304: [[[[126, 1]], [[127, 0], [0, 1]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 305: [[[[13, 1]], [[53, 2], [122, 3]], [[0, 2]], [[53, 2]]], {13: 1}],
 306: [[[[30, 1]], [[0, 1]]], {30: 1}],
 307: [[[[128, 1]], [[129, 1], [45, 2], [0, 1]], [[108, 3]], [[0, 3]]],
       {6: 1, 8: 1, 13: 1, 14: 1, 19: 1, 21: 1, 28: 1, 32: 1}],
 308: [[[[24, 1]],
        [[46, 2], [130, 3], [0, 1]],
        [[47, 4], [0, 2]],
        [[46, 5]],
        [[46, 2], [0, 4]],
        [[47, 6], [0, 5]],
        [[46, 7]],
        [[47, 8], [0, 7]],
        [[46, 7], [0, 8]]],
       {24: 1}],
 309: [[[[18, 1]],
        [[46, 2], [0, 1]],
        [[35, 3], [47, 4], [0, 2]],
        [[46, 5]],
        [[46, 6]],
        [[0, 5]],
        [[47, 3], [0, 6]]],
       {18: 1}],
 310: [[[[10, 1]], [[73, 2], [0, 1]], [[0, 2]]], {10: 1}],
 311: [[[[131, 1]], [[132, 0], [130, 0], [0, 1]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 312: [[[[133, 1]], [[1, 2], [134, 3]], [[0, 2]], [[133, 1], [1, 2]]],
       {4: 1,
        5: 1,
        6: 1,
        8: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        35: 1,
        38: 1}],
 313: [[[[135, 1], [1, 1], [136, 2]], [[0, 1]], [[1, 1]]],
       {1: 1,
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        37: 1,
        38: 1}],
 314: [[[[71, 1]], [[46, 2], [0, 1]], [[0, 2]]], {71: 1}],
 315: [[[[137, 1],
         [138, 1],
         [139, 1],
         [140, 1],
         [141, 1],
         [142, 1],
         [143, 1],
         [144, 1],
         [145, 1]],
        [[0, 1]]],
       {4: 1,
        5: 1,
        6: 1,
        8: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        35: 1,
        38: 1}],
 316: [[[[135, 1], [136, 1]], [[0, 1]]],
       {4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        37: 1,
        38: 1}],
 317: [[[[46, 1], [71, 2]],
        [[71, 2], [0, 1]],
        [[46, 3], [146, 4], [0, 2]],
        [[146, 4], [0, 3]],
        [[0, 4]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1,
        71: 1}],
 318: [[[[147, 1]], [[47, 2], [0, 1]], [[147, 1], [0, 2]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1,
        71: 1}],
 319: [[[[135, 1], [1, 2]],
        [[0, 1]],
        [[148, 3]],
        [[3, 4]],
        [[149, 1], [3, 4]]],
       {1: 1,
        4: 1,
        5: 1,
        6: 1,
        8: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        35: 1,
        38: 1}],
 320: [[[[108, 1]], [[150, 0], [43, 0], [151, 0], [152, 0], [0, 1]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 321: [[[[125, 1], [153, 2]],
        [[36, 3], [0, 1]],
        [[0, 2]],
        [[125, 4]],
        [[114, 5]],
        [[46, 2]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 322: [[[[46, 1]], [[47, 2], [0, 1]], [[46, 1], [0, 2]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 323: [[[[46, 1]], [[47, 0], [0, 1]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 324: [[[[46, 1]],
        [[49, 2], [47, 3], [0, 1]],
        [[0, 2]],
        [[46, 4], [0, 3]],
        [[47, 3], [0, 4]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 325: [[[[78, 1]],
        [[47, 2], [0, 1]],
        [[78, 3]],
        [[47, 4], [0, 3]],
        [[78, 3], [0, 4]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 326: [[[[13, 1], [14, 2], [32, 3]],
        [[53, 4], [99, 5]],
        [[28, 4]],
        [[154, 6]],
        [[0, 4]],
        [[53, 4]],
        [[52, 4]]],
       {13: 1, 14: 1, 32: 1}],
 327: [[[[9, 1]],
        [[71, 2]],
        [[72, 3]],
        [[155, 4], [156, 5]],
        [[71, 6]],
        [[71, 7]],
        [[72, 8]],
        [[72, 9]],
        [[155, 4], [114, 10], [156, 5], [0, 8]],
        [[0, 9]],
        [[71, 11]],
        [[72, 12]],
        [[156, 5], [0, 12]]],
       {9: 1}],
 328: [[[[43, 1], [45, 2], [157, 3]],
        [[28, 4], [47, 5], [0, 1]],
        [[28, 6]],
        [[48, 7], [47, 8], [0, 3]],
        [[47, 5], [0, 4]],
        [[28, 9], [45, 2]],
        [[0, 6]],
        [[46, 10]],
        [[43, 1], [45, 2], [157, 3], [0, 8]],
        [[48, 11], [47, 5], [0, 9]],
        [[47, 8], [0, 10]],
        [[46, 4]]],
       {13: 1, 28: 1, 43: 1, 45: 1}],
 329: [[[[13, 1], [28, 2]], [[158, 3]], [[0, 2]], [[53, 2]]], {13: 1, 28: 1}],
 330: [[[[157, 1]], [[47, 2], [0, 1]], [[157, 1], [0, 2]]], {13: 1, 28: 1}],
 331: [[[[27, 1]],
        [[46, 2]],
        [[71, 3]],
        [[72, 4]],
        [[114, 5], [0, 4]],
        [[71, 6]],
        [[72, 7]],
        [[0, 7]]],
       {27: 1}],
 332: [[[[46, 1]], [[101, 2], [0, 1]], [[87, 3]], [[0, 3]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        20: 1,
        21: 1,
        23: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 333: [[[[37, 1]], [[159, 2]], [[71, 3], [47, 1]], [[72, 4]], [[0, 4]]],
       {37: 1}],
 334: [[[[101, 1]], [[87, 2]], [[0, 2]]], {101: 1}],
 335: [[[[160, 1]], [[161, 0], [0, 1]]],
       {5: 1,
        6: 1,
        8: 1,
        13: 1,
        14: 1,
        19: 1,
        21: 1,
        28: 1,
        31: 1,
        32: 1,
        38: 1}],
 336: [[[[12, 1]], [[73, 2], [0, 1]], [[0, 2]]], {12: 1}],
 337: [[[[55, 1]], [[0, 1]]], {12: 1}]},
states:
[[[[1, 0], [2, 1], [3, 0]], [[0, 1]]],
 [[[39, 1]], [[40, 0], [0, 1]]],
 [[[41, 1]], [[42, 0], [0, 1]]],
 [[[43, 1], [44, 2], [45, 3]],
  [[46, 4]],
  [[47, 5], [0, 2]],
  [[46, 6]],
  [[47, 7], [0, 4]],
  [[43, 1], [44, 2], [45, 3], [0, 5]],
  [[0, 6]],
  [[44, 4], [45, 3]]],
 [[[46, 1]], [[48, 2], [49, 3], [0, 1]], [[46, 3]], [[0, 3]]],
 [[[50, 1]], [[31, 0], [38, 0], [0, 1]]],
 [[[11, 1]], [[46, 2]], [[47, 3], [0, 2]], [[46, 4]], [[0, 4]]],
 [[[19, 1], [6, 2], [21, 5], [13, 4], [14, 6], [32, 3], [8, 7], [28, 2]],
  [[19, 1], [0, 1]],
  [[0, 2]],
  [[51, 8], [52, 2]],
  [[53, 2], [54, 9], [55, 9]],
  [[56, 10], [57, 2]],
  [[14, 11]],
  [[58, 12]],
  [[52, 2]],
  [[53, 2]],
  [[57, 2]],
  [[14, 2]],
  [[8, 2]]],
 [[[59, 1],
   [60, 1],
   [61, 1],
   [62, 1],
   [63, 1],
   [64, 1],
   [65, 1],
   [66, 1],
   [67, 1],
   [68, 1],
   [69, 1],
   [70, 1]],
  [[0, 1]]],
 [[[15, 1]], [[0, 1]]],
 [[[22, 1]],
  [[28, 2]],
  [[71, 3], [13, 4]],
  [[72, 5]],
  [[53, 6], [73, 7]],
  [[0, 5]],
  [[71, 3]],
  [[53, 6]]],
 [[[34, 1]], [[74, 2]], [[75, 3]], [[76, 4]], [[77, 5], [0, 4]], [[0, 5]]],
 [[[36, 1]], [[78, 2]], [[77, 3], [0, 2]], [[0, 3]]],
 [[[79, 1], [49, 1]], [[0, 1]]],
 [[[80, 1],
   [81, 1],
   [20, 2],
   [82, 1],
   [80, 1],
   [75, 1],
   [83, 1],
   [84, 3],
   [85, 1],
   [86, 1]],
  [[0, 1]],
  [[75, 1]],
  [[20, 1], [0, 3]]],
 [[[87, 1]], [[88, 0], [0, 1]]],
 [[[89, 1], [90, 1], [91, 1], [92, 1], [93, 1], [94, 1], [95, 1], [96, 1]],
  [[0, 1]]],
 [[[16, 1]], [[0, 1]]],
 [[[97, 1]], [[95, 2], [92, 2]], [[0, 2]]],
 [[[17, 1]],
  [[98, 2]],
  [[13, 4], [1, 3]],
  [[0, 3]],
  [[53, 5], [99, 6]],
  [[1, 3]],
  [[53, 5]]],
 [[[100, 1]], [[100, 1], [0, 1]]],
 [[[29, 1]], [[74, 2]], [[0, 2]]],
 [[[46, 1]],
  [[71, 2], [49, 3], [47, 4], [0, 1]],
  [[46, 5]],
  [[0, 3]],
  [[46, 6], [0, 4]],
  [[49, 3], [47, 7], [0, 5]],
  [[47, 4], [0, 6]],
  [[46, 8], [0, 7]],
  [[71, 9]],
  [[46, 10]],
  [[47, 7], [0, 10]]],
 [[[98, 1]], [[101, 2], [0, 1]], [[28, 3]], [[0, 3]]],
 [[[102, 1]], [[47, 0], [0, 1]]],
 [[[28, 1]], [[14, 0], [0, 1]]],
 [[[73, 1]], [[1, 1], [2, 2]], [[0, 2]]],
 [[[103, 1]],
  [[46, 2], [0, 1]],
  [[101, 3], [47, 3], [0, 2]],
  [[46, 4]],
  [[0, 4]]],
 [[[26, 1]],
  [[87, 2]],
  [[75, 3], [0, 2]],
  [[46, 4]],
  [[47, 5], [0, 4]],
  [[46, 6]],
  [[0, 6]]],
 [[[104, 1]], [[105, 0], [0, 1]]],
 [[[73, 1]],
  [[106, 2], [48, 3], [0, 1]],
  [[73, 4], [55, 4]],
  [[73, 5], [55, 5]],
  [[0, 4]],
  [[48, 3], [0, 5]]],
 [[[87, 1]], [[47, 2], [0, 1]], [[87, 1], [0, 2]]],
 [[[31, 1], [107, 2], [38, 1], [5, 1]], [[108, 2]], [[0, 2]]],
 [[[109, 1], [110, 1], [111, 1], [112, 1], [113, 1]], [[0, 1]]],
 [[[34, 1]],
  [[74, 2]],
  [[75, 3]],
  [[73, 4]],
  [[71, 5]],
  [[72, 6]],
  [[114, 7], [0, 6]],
  [[71, 8]],
  [[72, 9]],
  [[0, 9]]],
 [[[7, 1]], [[28, 2]], [[115, 3]], [[71, 4]], [[72, 5]], [[0, 5]]],
 [[[33, 1], [25, 1]], [[28, 2]], [[47, 1], [0, 2]]],
 [[[36, 1]],
  [[46, 2]],
  [[71, 3]],
  [[72, 4]],
  [[114, 5], [116, 1], [0, 4]],
  [[71, 6]],
  [[72, 7]],
  [[0, 7]]],
 [[[28, 1]], [[101, 2], [0, 1]], [[28, 3]], [[0, 3]]],
 [[[117, 1]], [[47, 2], [0, 1]], [[117, 1], [0, 2]]],
 [[[35, 1]],
  [[98, 2], [14, 3]],
  [[4, 4]],
  [[98, 2], [4, 4], [14, 3]],
  [[118, 5], [43, 5], [13, 6]],
  [[0, 5]],
  [[118, 7]],
  [[53, 5]]],
 [[[4, 1]], [[119, 2]], [[0, 2]]],
 [[[120, 1], [121, 1]], [[0, 1]]],
 [[[23, 1]], [[71, 2], [122, 3]], [[46, 4]], [[71, 2]], [[0, 4]]],
 [[[46, 1]],
  [[49, 2], [47, 3], [0, 1]],
  [[0, 2]],
  [[46, 4], [0, 3]],
  [[47, 3], [0, 4]]],
 [[[20, 1], [123, 2]], [[41, 2]], [[0, 2]]],
 [[[23, 1]], [[71, 2], [122, 3]], [[78, 4]], [[71, 2]], [[0, 4]]],
 [[[124, 1], [125, 1]], [[0, 1]]],
 [[[126, 1]], [[127, 0], [0, 1]]],
 [[[13, 1]], [[53, 2], [122, 3]], [[0, 2]], [[53, 2]]],
 [[[30, 1]], [[0, 1]]],
 [[[128, 1]], [[129, 1], [45, 2], [0, 1]], [[108, 3]], [[0, 3]]],
 [[[24, 1]],
  [[46, 2], [130, 3], [0, 1]],
  [[47, 4], [0, 2]],
  [[46, 5]],
  [[46, 2], [0, 4]],
  [[47, 6], [0, 5]],
  [[46, 7]],
  [[47, 8], [0, 7]],
  [[46, 7], [0, 8]]],
 [[[18, 1]],
  [[46, 2], [0, 1]],
  [[35, 3], [47, 4], [0, 2]],
  [[46, 5]],
  [[46, 6]],
  [[0, 5]],
  [[47, 3], [0, 6]]],
 [[[10, 1]], [[73, 2], [0, 1]], [[0, 2]]],
 [[[131, 1]], [[132, 0], [130, 0], [0, 1]]],
 [[[133, 1]], [[1, 2], [134, 3]], [[0, 2]], [[133, 1], [1, 2]]],
 [[[135, 1], [1, 1], [136, 2]], [[0, 1]], [[1, 1]]],
 [[[71, 1]], [[46, 2], [0, 1]], [[0, 2]]],
 [[[137, 1],
   [138, 1],
   [139, 1],
   [140, 1],
   [141, 1],
   [142, 1],
   [143, 1],
   [144, 1],
   [145, 1]],
  [[0, 1]]],
 [[[135, 1], [136, 1]], [[0, 1]]],
 [[[46, 1], [71, 2]],
  [[71, 2], [0, 1]],
  [[46, 3], [146, 4], [0, 2]],
  [[146, 4], [0, 3]],
  [[0, 4]]],
 [[[147, 1]], [[47, 2], [0, 1]], [[147, 1], [0, 2]]],
 [[[135, 1], [1, 2]], [[0, 1]], [[148, 3]], [[3, 4]], [[149, 1], [3, 4]]],
 [[[108, 1]], [[150, 0], [43, 0], [151, 0], [152, 0], [0, 1]]],
 [[[125, 1], [153, 2]],
  [[36, 3], [0, 1]],
  [[0, 2]],
  [[125, 4]],
  [[114, 5]],
  [[46, 2]]],
 [[[46, 1]], [[47, 2], [0, 1]], [[46, 1], [0, 2]]],
 [[[46, 1]], [[47, 0], [0, 1]]],
 [[[46, 1]],
  [[49, 2], [47, 3], [0, 1]],
  [[0, 2]],
  [[46, 4], [0, 3]],
  [[47, 3], [0, 4]]],
 [[[78, 1]],
  [[47, 2], [0, 1]],
  [[78, 3]],
  [[47, 4], [0, 3]],
  [[78, 3], [0, 4]]],
 [[[13, 1], [14, 2], [32, 3]],
  [[53, 4], [99, 5]],
  [[28, 4]],
  [[154, 6]],
  [[0, 4]],
  [[53, 4]],
  [[52, 4]]],
 [[[9, 1]],
  [[71, 2]],
  [[72, 3]],
  [[155, 4], [156, 5]],
  [[71, 6]],
  [[71, 7]],
  [[72, 8]],
  [[72, 9]],
  [[155, 4], [114, 10], [156, 5], [0, 8]],
  [[0, 9]],
  [[71, 11]],
  [[72, 12]],
  [[156, 5], [0, 12]]],
 [[[43, 1], [45, 2], [157, 3]],
  [[28, 4], [47, 5], [0, 1]],
  [[28, 6]],
  [[48, 7], [47, 8], [0, 3]],
  [[47, 5], [0, 4]],
  [[28, 9], [45, 2]],
  [[0, 6]],
  [[46, 10]],
  [[43, 1], [45, 2], [157, 3], [0, 8]],
  [[48, 11], [47, 5], [0, 9]],
  [[47, 8], [0, 10]],
  [[46, 4]]],
 [[[13, 1], [28, 2]], [[158, 3]], [[0, 2]], [[53, 2]]],
 [[[157, 1]], [[47, 2], [0, 1]], [[157, 1], [0, 2]]],
 [[[27, 1]],
  [[46, 2]],
  [[71, 3]],
  [[72, 4]],
  [[114, 5], [0, 4]],
  [[71, 6]],
  [[72, 7]],
  [[0, 7]]],
 [[[46, 1]], [[101, 2], [0, 1]], [[87, 3]], [[0, 3]]],
 [[[37, 1]], [[159, 2]], [[71, 3], [47, 1]], [[72, 4]], [[0, 4]]],
 [[[101, 1]], [[87, 2]], [[0, 2]]],
 [[[160, 1]], [[161, 0], [0, 1]]],
 [[[12, 1]], [[73, 2], [0, 1]], [[0, 2]]],
 [[[55, 1]], [[0, 1]]]],
labels:
[[0, 'EMPTY'],
 [4, null],
 [0, null],
 [316, null],
 [1, 'import'],
 [32, null],
 [2, null],
 [1, 'def'],
 [25, null],
 [1, 'try'],
 [1, 'return'],
 [1, 'assert'],
 [1, 'yield'],
 [7, null],
 [23, null],
 [1, 'break'],
 [1, 'continue'],
 [50, null],
 [1, 'raise'],
 [3, null],
 [1, 'not'],
 [26, null],
 [1, 'class'],
 [1, 'lambda'],
 [1, 'print'],
 [1, 'nonlocal'],
 [1, 'exec'],
 [1, 'while'],
 [1, null],
 [1, 'del'],
 [1, 'pass'],
 [15, null],
 [9, null],
 [1, 'global'],
 [1, 'for'],
 [1, 'from'],
 [1, 'if'],
 [1, 'with'],
 [14, null],
 [311, null],
 [19, null],
 [301, null],
 [1, 'and'],
 [16, null],
 [260, null],
 [36, null],
 [321, null],
 [12, null],
 [22, null],
 [267, null],
 [320, null],
 [300, null],
 [10, null],
 [8, null],
 [324, null],
 [336, null],
 [278, null],
 [27, null],
 [323, null],
 [46, null],
 [39, null],
 [41, null],
 [47, null],
 [42, null],
 [43, null],
 [37, null],
 [44, null],
 [49, null],
 [45, null],
 [38, null],
 [40, null],
 [11, null],
 [319, null],
 [322, null],
 [287, null],
 [1, 'in'],
 [325, null],
 [269, null],
 [303, null],
 [268, null],
 [29, null],
 [21, null],
 [28, null],
 [30, null],
 [1, 'is'],
 [31, null],
 [20, null],
 [285, null],
 [270, null],
 [327, null],
 [293, null],
 [290, null],
 [266, null],
 [333, null],
 [331, null],
 [291, null],
 [274, null],
 [276, null],
 [281, null],
 [259, null],
 [275, null],
 [1, 'as'],
 [279, null],
 [1, 'except'],
 [335, null],
 [18, null],
 [264, null],
 [307, null],
 [288, null],
 [265, null],
 [273, null],
 [309, null],
 [310, null],
 [337, null],
 [1, 'else'],
 [305, null],
 [1, 'elif'],
 [294, null],
 [295, null],
 [280, null],
 [297, null],
 [296, null],
 [328, null],
 [271, null],
 [302, null],
 [304, null],
 [258, null],
 [1, 'or'],
 [263, null],
 [326, null],
 [35, null],
 [261, null],
 [34, null],
 [315, null],
 [13, null],
 [312, null],
 [272, null],
 [289, null],
 [277, null],
 [286, null],
 [306, null],
 [308, null],
 [262, null],
 [284, null],
 [292, null],
 [298, null],
 [314, null],
 [317, null],
 [5, null],
 [6, null],
 [48, null],
 [17, null],
 [24, null],
 [299, null],
 [318, null],
 [283, null],
 [1, 'finally'],
 [329, null],
 [330, null],
 [332, null],
 [257, null],
 [33, null]],
keywords:
{'and': 42,
 'as': 101,
 'assert': 11,
 'break': 15,
 'class': 22,
 'continue': 16,
 'def': 7,
 'del': 29,
 'elif': 116,
 'else': 114,
 'except': 103,
 'exec': 26,
 'finally': 156,
 'for': 34,
 'from': 35,
 'global': 33,
 'if': 36,
 'import': 4,
 'in': 75,
 'is': 84,
 'lambda': 23,
 'nonlocal': 25,
 'not': 20,
 'or': 127,
 'pass': 30,
 'print': 24,
 'raise': 18,
 'return': 10,
 'try': 9,
 'while': 27,
 'with': 37,
 'yield': 12},
tokens:
{0: 2,
 1: 28,
 2: 6,
 3: 19,
 4: 1,
 5: 148,
 6: 149,
 7: 13,
 8: 53,
 9: 32,
 10: 52,
 11: 71,
 12: 47,
 13: 134,
 14: 38,
 15: 31,
 16: 43,
 17: 151,
 18: 105,
 19: 40,
 20: 86,
 21: 81,
 22: 48,
 23: 14,
 24: 152,
 25: 8,
 26: 21,
 27: 57,
 28: 82,
 29: 80,
 30: 83,
 31: 85,
 32: 5,
 33: 161,
 34: 132,
 35: 130,
 36: 45,
 37: 65,
 38: 69,
 39: 60,
 40: 70,
 41: 61,
 42: 63,
 43: 64,
 44: 66,
 45: 68,
 46: 59,
 47: 62,
 48: 150,
 49: 67,
 50: 17},
start: 256
};
// low level parser to a concrete syntax tree, derived from cpython's lib2to3

function ParseError(msg, type, value, context)
{
    this.msg = msg;
    this.type = type;
    this.value = value;
    this.context = context;
    return this;
}

/*
 * p = new Parser(grammar);
 * p.setup([start]);
 * foreach input token:
 *     if p.addtoken(...):
 *         break
 * root = p.rootnode
 *
 * can throw ParseError
 */
function Parser(grammar, convert)
{
    this.grammar = grammar;
    this.convert = convert || function(grammar, node) { return node; };
    return this;
}

Parser.prototype.setup = function(start)
{
    start = start || this.grammar.start;
    //print("START:"+start);

    var newnode =
    {
        type: start,
        value: null,
        context: null,
        children: []
    };
    var stackentry =
    {
        dfa: this.grammar.dfas[start],
        state: 0,
        node: newnode
    };
    this.stack = [stackentry];
    this.used_names = {};
};

function findInDfa(a, obj)
{
    var i = a.length;
    while (i--)
    {
        if (a[i][0] === obj[0] && a[i][1] === obj[1])
        {
            return true;
        }
    }
    return false;
}


// Add a token; return true if we're done
Parser.prototype.addtoken = function(type, value, context)
{
    var ilabel = this.classify(type, value, context);
    //print("ilabel:"+ilabel);

OUTERWHILE:
    while (true)
    {
        var tp = this.stack[this.stack.length - 1];
        var states = tp.dfa[0];
        var first = tp.dfa[1];
        var arcs = states[tp.state];

        // look for a state with this label
        for (var a = 0; a < arcs.length; ++a)
        {
            var i = arcs[a][0];
            var newstate = arcs[a][1];
            var t = this.grammar.labels[i][0];
            var v = this.grammar.labels[i][1];
            //print("a:"+a+", t:"+t+", i:"+i);
            if (ilabel === i)
            {
                // look it up in the list of labels
                if (t >= 256) throw "assert";
                // shift a token; we're done with it
                this.shift(type, value, newstate, context);
                // pop while we are in an accept-only state
                var state = newstate;
                //print("before:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                while (states[state].length === 1
                        && states[state][0][0] === 0
                        && states[state][0][1] === state) // states[state] == [(0, state)])
                {
                    this.pop();
                    //print("in after pop:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                    if (this.stack.length === 0)
                    {
                        // done!
                        return true;
                    }
                    tp = this.stack[this.stack.length - 1];
                    state = tp.state;
                    states = tp.dfa[0];
                    first = tp.dfa[1];
                    //print(JSON.stringify(states), JSON.stringify(first));
                    //print("bottom:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                }
                // done with this token
                //print("DONE, return false");
                return false;
            }
            else if (t >= 256)
            {
                var itsdfa = this.grammar.dfas[t];
                var itsfirst = itsdfa[1];
                if (ilabel in itsfirst)
                {
                    // push a symbol
                    this.push(t, this.grammar.dfas[t], newstate, context);
                    continue OUTERWHILE;
                }
            }
        }

        //print("findInDfa: " + JSON.stringify(arcs)+" vs. " + tp.state);
        if (findInDfa(arcs, [0, tp.state]))
        {
            // an accepting state, pop it and try somethign else
            //print("WAA");
            this.pop();
            if (this.stack.length === 0)
            {
                throw "ParseError: too much input"; //, type, value, context);
            }
        }
        else
        {
            // no transition
            throw "ParseError: bad input"; //, type, value, context);
        }
    }
};

// turn a token into a label
Parser.prototype.classify = function(type, value, context)
{
    var ilabel;
    if (type === T_NAME)
    {
        this.used_names[value] = true;
        ilabel = this.grammar.keywords[value];
        if (ilabel)
        {
            //print("is keyword");
            return ilabel;
        }
    }
    ilabel = this.grammar.tokens[type];
    if (!ilabel)
        throw new ParseError("bad token", type, value, context);
    return ilabel;
};

// shift a token
Parser.prototype.shift = function(type, value, newstate, context)
{
    var dfa = this.stack[this.stack.length - 1].dfa;
    var state = this.stack[this.stack.length - 1].state;
    var node = this.stack[this.stack.length - 1].node;
    var newnode = {
        type: type, 
        value: value,
        context: context,
        children: null
    };
    newnode = this.convert(this.grammar, newnode);
    if (newnode)
    {
        node.children.push(newnode);
    }
    this.stack[this.stack.length - 1] = {
        dfa: dfa,
        state: newstate,
        node: node
    };
};

// push a nonterminal
Parser.prototype.push = function(type, newdfa, newstate, context)
{
    var dfa = this.stack[this.stack.length - 1].dfa; 
    var node = this.stack[this.stack.length - 1].node; 
    var newnode = {
        type: type,
        value: null,
        context: context,
        children: []
    };
    this.stack[this.stack.length - 1] = {
            dfa: dfa,
            state: newstate,
            node: node
        };
    this.stack.push({
            dfa: newdfa,
            state: 0,
            node: newnode
        });
};

//var ac = 0;
//var bc = 0;

// pop a nonterminal
Parser.prototype.pop = function()
{
    var pop = this.stack.pop();
    var newnode = this.convert(this.grammar, pop.node);
    //print("POP");
    if (newnode)
    {
        //print("A", ac++, newnode.type);
        //print("stacklen:"+this.stack.length);
        if (this.stack.length !== 0)
        {
            //print("B", bc++);
            var node = this.stack[this.stack.length - 1].node;
            node.children.push(newnode);
        }
        else
        {
            //print("C");
            this.rootnode = newnode;
            this.rootnode.used_names = this.used_names;
        }
    }
};

// parser for interactive input. returns a function that should be called with
// lines of input as they are entered. the function will return false
// until the input is complete, when it will return the rootnode of the parse.
function makeParser(filename, style)
{
    if (style === undefined) style = "file_input";
    var p = new Parser(SkulptParseTables);
    p.setup(SkulptParseTables.symbol2number[style]);
    var curIndex = 0;
    var lineno = 1;
    var column = 0;
    var prefix = "";
    var tokenizer = new Tokenizer(filename, style === "single_input", function(type, value, start, end, line)
            {
                //print(JSON.stringify([type, value, start, end, line]));
                var s_lineno = start[0];
                var s_column = start[1];
                /*
                if (s_lineno !== lineno && s_column !== column)
                {
                    // todo; update prefix and line/col
                }
                */
                if (type === T_COMMENT || type === T_NL)
                {
                    prefix += value;
                    lineno = end[0];
                    column = end[1];
                    if (value[value.length - 1] === "\n")
                    {
                        lineno += 1;
                        column = 0;
                    }
                    //print("  not calling addtoken");
                    return undefined;
                }
                if (type === T_OP)
                {
                    type = SkulptOpMap[value];
                }
                if (p.addtoken(type, value, [start, end, line]))
                {
                    return true;
                }
            });
    return function(line)
    {
        var ret = tokenizer.generateTokens(line);
        //print("tok:"+ret);
        if (ret)
        {
            if (ret !== "done")
                throw "ParseError: incomplete input";
            return p.rootnode;
        }
        return false;
    };
}

function parse(filename, input)
{
    var parseFunc = makeParser(filename);
    if (input.substr(input.length - 1, 1) !== "\n") input += "\n";
    //print("input:"+input);
    var lines = input.split("\n");
    var ret;
    for (var i = 0; i < lines.length; ++i)
    {
        ret = parseFunc(lines[i] + ((i === lines.length - 1) ? "" : "\n"));
    }
    return ret;
}
// abstract syntax node definitions
// 
// This file is automatically generated by pgen/astgen.py

var OP_ASSIGN = 'OP_ASSIGN';
var OP_DELETE = 'OP_DELETE';
var OP_APPLY = 'OP_APPLY';

var SC_LOCAL = 1;
var SC_GLOBAL = 2;
var SC_FREE = 3;
var SC_CELL = 4;
var SC_UNKNOWN = 5;

var CO_OPTIMIZED = 0x0001;
var CO_NEWLOCALS = 0x0002;
var CO_VARARGS = 0x0004;
var CO_VARKEYWORDS = 0x0008;
var CO_NESTED = 0x0010;
var CO_GENERATOR = 0x0020;
var CO_GENERATOR_ALLOWED = 0;
var CO_FUTURE_DIVISION = 0x2000;
var CO_FUTURE_ABSIMPORT = 0x4000;
var CO_FUTURE_WITH_STATEMENT = 0x8000;
var CO_FUTURE_PRINT_FUNCTION = 0x10000;

function flatten(seq)
{
    var l = [];
    for (var i = 0; i < seq.length; ++i)
    {
        if (seq[i].length)
        {
            var subf = flatten(seq[i]);
            for (var j = 0; j < subf.length; ++j)
            {
                l.push(subf[j]);
            }
        }
        else
        {
            l.push(seq[i]);
        }
    }
    return l;
}

//"""

// --------------------------------------------------------
function Add(left, right, lineno)
{
    this.nodeName = "Add";
    this.left = left;
    this.right = right;
    this.lineno = lineno;
}

Add.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.left, args);
    if (ret !== undefined) this.left = ret;
    ret = handler.visit(this.right, args);
    if (ret !== undefined) this.right = ret;
};


// --------------------------------------------------------
function And(nodes, lineno)
{
    this.nodeName = "And";
    this.nodes = nodes;
    this.lineno = lineno;
}

And.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function AssAttr(expr, attrname, flags, lineno)
{
    this.nodeName = "AssAttr";
    this.expr = expr;
    this.attrname = attrname;
    this.flags = flags;
    this.lineno = lineno;
}

AssAttr.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
    ret = handler.visit(this.attrname, args);
    if (ret !== undefined) this.attrname = ret;
    ret = handler.visit(this.flags, args);
    if (ret !== undefined) this.flags = ret;
};


// --------------------------------------------------------
function AssList(nodes, lineno)
{
    this.nodeName = "AssList";
    this.nodes = nodes;
    this.lineno = lineno;
}

AssList.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function AssName(name, flags, lineno)
{
    this.nodeName = "AssName";
    this.name = name;
    this.flags = flags;
    this.lineno = lineno;
}

AssName.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.name, args);
    if (ret !== undefined) this.name = ret;
    ret = handler.visit(this.flags, args);
    if (ret !== undefined) this.flags = ret;
};


// --------------------------------------------------------
function AssTuple(nodes, lineno)
{
    this.nodeName = "AssTuple";
    this.nodes = nodes;
    this.lineno = lineno;
}

AssTuple.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function Assert(test, fail, lineno)
{
    this.nodeName = "Assert";
    this.test = test;
    this.fail = fail;
    this.lineno = lineno;
}

Assert.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.test, args);
    if (ret !== undefined) this.test = ret;
    ret = handler.visit(this.fail, args);
    if (ret !== undefined) this.fail = ret;
};


// --------------------------------------------------------
function Assign(nodes, expr, lineno)
{
    this.nodeName = "Assign";
    this.nodes = nodes;
    this.expr = expr;
    this.lineno = lineno;
}

Assign.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
};


// --------------------------------------------------------
function AugAssign(node, op, expr, lineno)
{
    this.nodeName = "AugAssign";
    this.node = node;
    this.op = op;
    this.expr = expr;
    this.lineno = lineno;
}

AugAssign.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.node, args);
    if (ret !== undefined) this.node = ret;
    ret = handler.visit(this.op, args);
    if (ret !== undefined) this.op = ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
};


// --------------------------------------------------------
function AugGetattr(node, lineno)
{
    this.nodeName = "AugGetattr";
    this.node = node;
    this.lineno = lineno;
}

AugGetattr.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.node, args);
    if (ret !== undefined) this.node = ret;
};


// --------------------------------------------------------
function AugName(node, lineno)
{
    this.nodeName = "AugName";
    this.node = node;
    this.lineno = lineno;
}

AugName.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.node, args);
    if (ret !== undefined) this.node = ret;
};


// --------------------------------------------------------
function AugSlice(node, lineno)
{
    this.nodeName = "AugSlice";
    this.node = node;
    this.lineno = lineno;
}

AugSlice.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.node, args);
    if (ret !== undefined) this.node = ret;
};


// --------------------------------------------------------
function AugSubscript(node, lineno)
{
    this.nodeName = "AugSubscript";
    this.node = node;
    this.lineno = lineno;
}

AugSubscript.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.node, args);
    if (ret !== undefined) this.node = ret;
};


// --------------------------------------------------------
function Backquote(expr, lineno)
{
    this.nodeName = "Backquote";
    this.expr = expr;
    this.lineno = lineno;
}

Backquote.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
};


// --------------------------------------------------------
function Bitand(nodes, lineno)
{
    this.nodeName = "Bitand";
    this.nodes = nodes;
    this.lineno = lineno;
}

Bitand.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function Bitor(nodes, lineno)
{
    this.nodeName = "Bitor";
    this.nodes = nodes;
    this.lineno = lineno;
}

Bitor.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function Bitxor(nodes, lineno)
{
    this.nodeName = "Bitxor";
    this.nodes = nodes;
    this.lineno = lineno;
}

Bitxor.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function Break_(lineno)
{
    this.nodeName = "Break_";
    this.lineno = lineno;
}

Break_.prototype.walkChildren = function(handler, args)
{
    return;
};


// --------------------------------------------------------
function CallFunc(node, args, star_args, dstar_args, lineno)
{
    this.nodeName = "CallFunc";
    this.node = node;
    this.args = args;
    this.star_args = star_args;
    this.dstar_args = dstar_args;
    this.lineno = lineno;
}

CallFunc.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.node, args);
    if (ret !== undefined) this.node = ret;
    for (var i_args = 0; i_args < this.args.length; i_args += 1)
    {
        ret = handler.visit(this.args[i_args], args);
        if (ret !== undefined) this.args[i_args] = ret;
    }
    ret = handler.visit(this.star_args, args);
    if (ret !== undefined) this.star_args = ret;
    ret = handler.visit(this.dstar_args, args);
    if (ret !== undefined) this.dstar_args = ret;
};


// --------------------------------------------------------
function Class_(name, bases, doc, code, decorators, lineno)
{
    this.nodeName = "Class_";
    this.name = name;
    this.bases = bases;
    this.doc = doc;
    this.code = code;
    this.decorators = decorators;
    this.lineno = lineno;
}

Class_.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.name, args);
    if (ret !== undefined) this.name = ret;
    for (var i_bases = 0; i_bases < this.bases.length; i_bases += 1)
    {
        ret = handler.visit(this.bases[i_bases], args);
        if (ret !== undefined) this.bases[i_bases] = ret;
    }
    ret = handler.visit(this.doc, args);
    if (ret !== undefined) this.doc = ret;
    ret = handler.visit(this.code, args);
    if (ret !== undefined) this.code = ret;
    ret = handler.visit(this.decorators, args);
    if (ret !== undefined) this.decorators = ret;
};


// --------------------------------------------------------
function Compare(expr, ops, lineno)
{
    this.nodeName = "Compare";
    this.expr = expr;
    this.ops = ops;
    this.lineno = lineno;
}

Compare.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
    for (var i_ops = 0; i_ops < this.ops.length; i_ops += 1)
    {
        ret = handler.visit(this.ops[i_ops], args);
        if (ret !== undefined) this.ops[i_ops] = ret;
    }
};


// --------------------------------------------------------
function Const_(value, lineno)
{
    this.nodeName = "Const_";
    this.value = value;
    this.lineno = lineno;
}

Const_.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.value, args);
    if (ret !== undefined) this.value = ret;
};


// --------------------------------------------------------
function Continue_(lineno)
{
    this.nodeName = "Continue_";
    this.lineno = lineno;
}

Continue_.prototype.walkChildren = function(handler, args)
{
    return;
};


// --------------------------------------------------------
function Decorators(nodes, lineno)
{
    this.nodeName = "Decorators";
    this.nodes = nodes;
    this.lineno = lineno;
}

Decorators.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function Dict(items, lineno)
{
    this.nodeName = "Dict";
    this.items = items;
    this.lineno = lineno;
}

Dict.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_items = 0; i_items < this.items.length; i_items += 1)
    {
        ret = handler.visit(this.items[i_items], args);
        if (ret !== undefined) this.items[i_items] = ret;
    }
};


// --------------------------------------------------------
function Discard(expr, lineno)
{
    this.nodeName = "Discard";
    this.expr = expr;
    this.lineno = lineno;
}

Discard.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
};


// --------------------------------------------------------
function Div(left, right, lineno)
{
    this.nodeName = "Div";
    this.left = left;
    this.right = right;
    this.lineno = lineno;
}

Div.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.left, args);
    if (ret !== undefined) this.left = ret;
    ret = handler.visit(this.right, args);
    if (ret !== undefined) this.right = ret;
};


// --------------------------------------------------------
function Ellipsis(lineno)
{
    this.nodeName = "Ellipsis";
    this.lineno = lineno;
}

Ellipsis.prototype.walkChildren = function(handler, args)
{
    return;
};


// --------------------------------------------------------
function Exec(expr, locals, globals, lineno)
{
    this.nodeName = "Exec";
    this.expr = expr;
    this.locals = locals;
    this.globals = globals;
    this.lineno = lineno;
}

Exec.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
    ret = handler.visit(this.locals, args);
    if (ret !== undefined) this.locals = ret;
    ret = handler.visit(this.globals, args);
    if (ret !== undefined) this.globals = ret;
};


// --------------------------------------------------------
function FloorDiv(left, right, lineno)
{
    this.nodeName = "FloorDiv";
    this.left = left;
    this.right = right;
    this.lineno = lineno;
}

FloorDiv.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.left, args);
    if (ret !== undefined) this.left = ret;
    ret = handler.visit(this.right, args);
    if (ret !== undefined) this.right = ret;
};


// --------------------------------------------------------
function For_(assign, list, body, else_, lineno)
{
    this.nodeName = "For_";
    this.assign = assign;
    this.list = list;
    this.body = body;
    this.else_ = else_;
    this.lineno = lineno;
}

For_.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.assign, args);
    if (ret !== undefined) this.assign = ret;
    ret = handler.visit(this.list, args);
    if (ret !== undefined) this.list = ret;
    ret = handler.visit(this.body, args);
    if (ret !== undefined) this.body = ret;
    ret = handler.visit(this.else_, args);
    if (ret !== undefined) this.else_ = ret;
};


// --------------------------------------------------------
function From(modname, names, level, lineno)
{
    this.nodeName = "From";
    this.modname = modname;
    this.names = names;
    this.level = level;
    this.lineno = lineno;
}

From.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.modname, args);
    if (ret !== undefined) this.modname = ret;
    ret = handler.visit(this.names, args);
    if (ret !== undefined) this.names = ret;
    ret = handler.visit(this.level, args);
    if (ret !== undefined) this.level = ret;
};


// --------------------------------------------------------
function Function_(decorators, name, argnames, defaults, varargs, kwargs, doc, code, lineno)
{
    this.nodeName = "Function_";
    this.decorators = decorators;
    this.name = name;
    this.argnames = argnames;
    this.defaults = defaults;
    this.varargs = varargs;
    this.kwargs = kwargs;
    this.doc = doc;
    this.code = code;
    this.lineno = lineno;
}

Function_.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.decorators, args);
    if (ret !== undefined) this.decorators = ret;
    ret = handler.visit(this.name, args);
    if (ret !== undefined) this.name = ret;
    ret = handler.visit(this.argnames, args);
    if (ret !== undefined) this.argnames = ret;
    for (var i_defaults = 0; i_defaults < this.defaults.length; i_defaults += 1)
    {
        ret = handler.visit(this.defaults[i_defaults], args);
        if (ret !== undefined) this.defaults[i_defaults] = ret;
    }
    ret = handler.visit(this.varargs, args);
    if (ret !== undefined) this.varargs = ret;
    ret = handler.visit(this.kwargs, args);
    if (ret !== undefined) this.kwargs = ret;
    ret = handler.visit(this.doc, args);
    if (ret !== undefined) this.doc = ret;
    ret = handler.visit(this.code, args);
    if (ret !== undefined) this.code = ret;
};


// --------------------------------------------------------
function GenExpr(code, lineno)
{
    this.nodeName = "GenExpr";
    this.code = code;
    this.lineno = lineno;
    this.argnames = ['.0'];
    this.varargs = this.kwargs = null;

}

GenExpr.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.code, args);
    if (ret !== undefined) this.code = ret;
};


// --------------------------------------------------------
function GenExprFor(assign, iter, ifs, lineno)
{
    this.nodeName = "GenExprFor";
    this.assign = assign;
    this.iter = iter;
    this.ifs = ifs;
    this.lineno = lineno;
    this.is_outmost = false;
}

GenExprFor.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.assign, args);
    if (ret !== undefined) this.assign = ret;
    ret = handler.visit(this.iter, args);
    if (ret !== undefined) this.iter = ret;
    for (var i_ifs = 0; i_ifs < this.ifs.length; i_ifs += 1)
    {
        ret = handler.visit(this.ifs[i_ifs], args);
        if (ret !== undefined) this.ifs[i_ifs] = ret;
    }
};


// --------------------------------------------------------
function GenExprIf(test, lineno)
{
    this.nodeName = "GenExprIf";
    this.test = test;
    this.lineno = lineno;
}

GenExprIf.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.test, args);
    if (ret !== undefined) this.test = ret;
};


// --------------------------------------------------------
function GenExprInner(expr, quals, lineno)
{
    this.nodeName = "GenExprInner";
    this.expr = expr;
    this.quals = quals;
    this.lineno = lineno;
}

GenExprInner.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
    for (var i_quals = 0; i_quals < this.quals.length; i_quals += 1)
    {
        ret = handler.visit(this.quals[i_quals], args);
        if (ret !== undefined) this.quals[i_quals] = ret;
    }
};


// --------------------------------------------------------
function GenExprTransformed(node, lineno)
{
    this.nodeName = "GenExprTransformed";
    this.node = node;
    this.lineno = lineno;
}

GenExprTransformed.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.node, args);
    if (ret !== undefined) this.node = ret;
};


// --------------------------------------------------------
function Getattr(expr, attrname, lineno)
{
    this.nodeName = "Getattr";
    this.expr = expr;
    this.attrname = attrname;
    this.lineno = lineno;
}

Getattr.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
    ret = handler.visit(this.attrname, args);
    if (ret !== undefined) this.attrname = ret;
};


// --------------------------------------------------------
function Global(names, lineno)
{
    this.nodeName = "Global";
    this.names = names;
    this.lineno = lineno;
}

Global.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.names, args);
    if (ret !== undefined) this.names = ret;
};


// --------------------------------------------------------
function IfExp(test, then, else_, lineno)
{
    this.nodeName = "IfExp";
    this.test = test;
    this.then = then;
    this.else_ = else_;
    this.lineno = lineno;
}

IfExp.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.test, args);
    if (ret !== undefined) this.test = ret;
    ret = handler.visit(this.then, args);
    if (ret !== undefined) this.then = ret;
    ret = handler.visit(this.else_, args);
    if (ret !== undefined) this.else_ = ret;
};


// --------------------------------------------------------
function If_(tests, else_, lineno)
{
    this.nodeName = "If_";
    this.tests = tests;
    this.else_ = else_;
    this.lineno = lineno;
}

If_.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_tests = 0; i_tests < this.tests.length; i_tests += 1)
    {
        ret = handler.visit(this.tests[i_tests], args);
        if (ret !== undefined) this.tests[i_tests] = ret;
    }
    ret = handler.visit(this.else_, args);
    if (ret !== undefined) this.else_ = ret;
};


// --------------------------------------------------------
function Import_(names, lineno)
{
    this.nodeName = "Import_";
    this.names = names;
    this.lineno = lineno;
}

Import_.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.names, args);
    if (ret !== undefined) this.names = ret;
};


// --------------------------------------------------------
function Interactive(node, lineno)
{
    this.nodeName = "Interactive";
    this.node = node;
    this.lineno = lineno;
}

Interactive.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.node, args);
    if (ret !== undefined) this.node = ret;
};


// --------------------------------------------------------
function Invert(expr, lineno)
{
    this.nodeName = "Invert";
    this.expr = expr;
    this.lineno = lineno;
}

Invert.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
};


// --------------------------------------------------------
function Keyword(name, expr, lineno)
{
    this.nodeName = "Keyword";
    this.name = name;
    this.expr = expr;
    this.lineno = lineno;
}

Keyword.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.name, args);
    if (ret !== undefined) this.name = ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
};


// --------------------------------------------------------
function Lambda(argnames, defaults, varargs, kwargs, code, lineno)
{
    this.nodeName = "Lambda";
    this.argnames = argnames;
    this.defaults = defaults;
    this.varargs = varargs;
    this.kwargs = kwargs;
    this.code = code;
    this.lineno = lineno;
}

Lambda.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.argnames, args);
    if (ret !== undefined) this.argnames = ret;
    for (var i_defaults = 0; i_defaults < this.defaults.length; i_defaults += 1)
    {
        ret = handler.visit(this.defaults[i_defaults], args);
        if (ret !== undefined) this.defaults[i_defaults] = ret;
    }
    ret = handler.visit(this.varargs, args);
    if (ret !== undefined) this.varargs = ret;
    ret = handler.visit(this.kwargs, args);
    if (ret !== undefined) this.kwargs = ret;
    ret = handler.visit(this.code, args);
    if (ret !== undefined) this.code = ret;
};


// --------------------------------------------------------
function LeftShift(left, right, lineno)
{
    this.nodeName = "LeftShift";
    this.left = left;
    this.right = right;
    this.lineno = lineno;
}

LeftShift.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.left, args);
    if (ret !== undefined) this.left = ret;
    ret = handler.visit(this.right, args);
    if (ret !== undefined) this.right = ret;
};


// --------------------------------------------------------
function List(nodes, lineno)
{
    this.nodeName = "List";
    this.nodes = nodes;
    this.lineno = lineno;
}

List.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function ListComp(expr, quals, lineno)
{
    this.nodeName = "ListComp";
    this.expr = expr;
    this.quals = quals;
    this.lineno = lineno;
}

ListComp.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
    for (var i_quals = 0; i_quals < this.quals.length; i_quals += 1)
    {
        ret = handler.visit(this.quals[i_quals], args);
        if (ret !== undefined) this.quals[i_quals] = ret;
    }
};


// --------------------------------------------------------
function ListCompFor(assign, list, ifs, lineno)
{
    this.nodeName = "ListCompFor";
    this.assign = assign;
    this.list = list;
    this.ifs = ifs;
    this.lineno = lineno;
}

ListCompFor.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.assign, args);
    if (ret !== undefined) this.assign = ret;
    ret = handler.visit(this.list, args);
    if (ret !== undefined) this.list = ret;
    for (var i_ifs = 0; i_ifs < this.ifs.length; i_ifs += 1)
    {
        ret = handler.visit(this.ifs[i_ifs], args);
        if (ret !== undefined) this.ifs[i_ifs] = ret;
    }
};


// --------------------------------------------------------
function ListCompIf(test, lineno)
{
    this.nodeName = "ListCompIf";
    this.test = test;
    this.lineno = lineno;
}

ListCompIf.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.test, args);
    if (ret !== undefined) this.test = ret;
};


// --------------------------------------------------------
function Mod(left, right, lineno)
{
    this.nodeName = "Mod";
    this.left = left;
    this.right = right;
    this.lineno = lineno;
}

Mod.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.left, args);
    if (ret !== undefined) this.left = ret;
    ret = handler.visit(this.right, args);
    if (ret !== undefined) this.right = ret;
};


// --------------------------------------------------------
function Module(doc, node, lineno)
{
    this.nodeName = "Module";
    this.doc = doc;
    this.node = node;
    this.lineno = lineno;
}

Module.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.doc, args);
    if (ret !== undefined) this.doc = ret;
    ret = handler.visit(this.node, args);
    if (ret !== undefined) this.node = ret;
};


// --------------------------------------------------------
function Mul(left, right, lineno)
{
    this.nodeName = "Mul";
    this.left = left;
    this.right = right;
    this.lineno = lineno;
}

Mul.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.left, args);
    if (ret !== undefined) this.left = ret;
    ret = handler.visit(this.right, args);
    if (ret !== undefined) this.right = ret;
};


// --------------------------------------------------------
function Name(name, lineno)
{
    this.nodeName = "Name";
    this.name = name;
    this.lineno = lineno;
}

Name.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.name, args);
    if (ret !== undefined) this.name = ret;
};


// --------------------------------------------------------
function Not(expr, lineno)
{
    this.nodeName = "Not";
    this.expr = expr;
    this.lineno = lineno;
}

Not.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
};


// --------------------------------------------------------
function Or(nodes, lineno)
{
    this.nodeName = "Or";
    this.nodes = nodes;
    this.lineno = lineno;
}

Or.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function Pass(lineno)
{
    this.nodeName = "Pass";
    this.lineno = lineno;
}

Pass.prototype.walkChildren = function(handler, args)
{
    return;
};


// --------------------------------------------------------
function Power(left, right, lineno)
{
    this.nodeName = "Power";
    this.left = left;
    this.right = right;
    this.lineno = lineno;
}

Power.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.left, args);
    if (ret !== undefined) this.left = ret;
    ret = handler.visit(this.right, args);
    if (ret !== undefined) this.right = ret;
};


// --------------------------------------------------------
function Print(nodes, dest, nl, lineno)
{
    this.nodeName = "Print";
    this.nodes = nodes;
    this.dest = dest;
    this.nl = nl;
    this.lineno = lineno;
}

Print.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
    ret = handler.visit(this.dest, args);
    if (ret !== undefined) this.dest = ret;
    ret = handler.visit(this.nl, args);
    if (ret !== undefined) this.nl = ret;
};


// --------------------------------------------------------
function Raise(expr1, expr2, expr3, lineno)
{
    this.nodeName = "Raise";
    this.expr1 = expr1;
    this.expr2 = expr2;
    this.expr3 = expr3;
    this.lineno = lineno;
}

Raise.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr1, args);
    if (ret !== undefined) this.expr1 = ret;
    ret = handler.visit(this.expr2, args);
    if (ret !== undefined) this.expr2 = ret;
    ret = handler.visit(this.expr3, args);
    if (ret !== undefined) this.expr3 = ret;
};


// --------------------------------------------------------
function Return_(value, lineno)
{
    this.nodeName = "Return_";
    this.value = value;
    this.lineno = lineno;
}

Return_.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.value, args);
    if (ret !== undefined) this.value = ret;
};


// --------------------------------------------------------
function RightShift(left, right, lineno)
{
    this.nodeName = "RightShift";
    this.left = left;
    this.right = right;
    this.lineno = lineno;
}

RightShift.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.left, args);
    if (ret !== undefined) this.left = ret;
    ret = handler.visit(this.right, args);
    if (ret !== undefined) this.right = ret;
};


// --------------------------------------------------------
function Slice(expr, flags, lower, upper, lineno)
{
    this.nodeName = "Slice";
    this.expr = expr;
    this.flags = flags;
    this.lower = lower;
    this.upper = upper;
    this.lineno = lineno;
}

Slice.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
    ret = handler.visit(this.flags, args);
    if (ret !== undefined) this.flags = ret;
    ret = handler.visit(this.lower, args);
    if (ret !== undefined) this.lower = ret;
    ret = handler.visit(this.upper, args);
    if (ret !== undefined) this.upper = ret;
};


// --------------------------------------------------------
function Sliceobj(nodes, lineno)
{
    this.nodeName = "Sliceobj";
    this.nodes = nodes;
    this.lineno = lineno;
}

Sliceobj.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function Stmt(nodes, lineno)
{
    this.nodeName = "Stmt";
    this.nodes = nodes;
    this.lineno = lineno;
}

Stmt.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function Sub(left, right, lineno)
{
    this.nodeName = "Sub";
    this.left = left;
    this.right = right;
    this.lineno = lineno;
}

Sub.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.left, args);
    if (ret !== undefined) this.left = ret;
    ret = handler.visit(this.right, args);
    if (ret !== undefined) this.right = ret;
};


// --------------------------------------------------------
function Subscript(expr, flags, subs, lineno)
{
    this.nodeName = "Subscript";
    this.expr = expr;
    this.flags = flags;
    this.subs = subs;
    this.lineno = lineno;
}

Subscript.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
    ret = handler.visit(this.flags, args);
    if (ret !== undefined) this.flags = ret;
    for (var i_subs = 0; i_subs < this.subs.length; i_subs += 1)
    {
        ret = handler.visit(this.subs[i_subs], args);
        if (ret !== undefined) this.subs[i_subs] = ret;
    }
};


// --------------------------------------------------------
function TryExcept(body, handlers, else_, lineno)
{
    this.nodeName = "TryExcept";
    this.body = body;
    this.handlers = handlers;
    this.else_ = else_;
    this.lineno = lineno;
}

TryExcept.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.body, args);
    if (ret !== undefined) this.body = ret;
    for (var i_handlers = 0; i_handlers < this.handlers.length; i_handlers += 1)
    {
        ret = handler.visit(this.handlers[i_handlers], args);
        if (ret !== undefined) this.handlers[i_handlers] = ret;
    }
    ret = handler.visit(this.else_, args);
    if (ret !== undefined) this.else_ = ret;
};


// --------------------------------------------------------
function TryFinally(body, final_, lineno)
{
    this.nodeName = "TryFinally";
    this.body = body;
    this.final_ = final_;
    this.lineno = lineno;
}

TryFinally.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.body, args);
    if (ret !== undefined) this.body = ret;
    ret = handler.visit(this.final_, args);
    if (ret !== undefined) this.final_ = ret;
};


// --------------------------------------------------------
function Tuple(nodes, lineno)
{
    this.nodeName = "Tuple";
    this.nodes = nodes;
    this.lineno = lineno;
}

Tuple.prototype.walkChildren = function(handler, args)
{
    var ret;
    for (var i_nodes = 0; i_nodes < this.nodes.length; i_nodes += 1)
    {
        ret = handler.visit(this.nodes[i_nodes], args);
        if (ret !== undefined) this.nodes[i_nodes] = ret;
    }
};


// --------------------------------------------------------
function UnaryAdd(expr, lineno)
{
    this.nodeName = "UnaryAdd";
    this.expr = expr;
    this.lineno = lineno;
}

UnaryAdd.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
};


// --------------------------------------------------------
function UnarySub(expr, lineno)
{
    this.nodeName = "UnarySub";
    this.expr = expr;
    this.lineno = lineno;
}

UnarySub.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
};


// --------------------------------------------------------
function While_(test, body, else_, lineno)
{
    this.nodeName = "While_";
    this.test = test;
    this.body = body;
    this.else_ = else_;
    this.lineno = lineno;
}

While_.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.test, args);
    if (ret !== undefined) this.test = ret;
    ret = handler.visit(this.body, args);
    if (ret !== undefined) this.body = ret;
    ret = handler.visit(this.else_, args);
    if (ret !== undefined) this.else_ = ret;
};


// --------------------------------------------------------
function With_(expr, vars, body, lineno)
{
    this.nodeName = "With_";
    this.expr = expr;
    this.vars = vars;
    this.body = body;
    this.lineno = lineno;
}

With_.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.expr, args);
    if (ret !== undefined) this.expr = ret;
    ret = handler.visit(this.vars, args);
    if (ret !== undefined) this.vars = ret;
    ret = handler.visit(this.body, args);
    if (ret !== undefined) this.body = ret;
};


// --------------------------------------------------------
function Yield_(value, lineno)
{
    this.nodeName = "Yield_";
    this.value = value;
    this.lineno = lineno;
}

Yield_.prototype.walkChildren = function(handler, args)
{
    var ret;
    ret = handler.visit(this.value, args);
    if (ret !== undefined) this.value = ret;
};



// Heavily based on Python-2.6's Lib/compiler/transformer.py, by various
// contributors: Greg Stein, Bill Tutt, Jeremy Hylton, Mark Hammond, Sylvan
// Thenault, and probably others.

// utilty to transform parse trees into ast trees that are more amenable to
// compilation. this is quite verbose, but pretty simple code that takes the
// parse tree that's quite low-level and munges it into something that's a bit
// easier to compile. For the most part it's simply flattening, and wrapping
// in named types (from ast.js).
function Transformer(grammar)
{
    this.grammar = grammar;
    this.sym = grammar.symbol2number;
    this.assign_types = [
        this.sym.test,
        this.sym.or_test,
        this.sym.and_test,
        this.sym.not_test,
        this.sym.comparison,
        this.sym.expr,
        this.sym.xor_expr,
        this.sym.and_expr,
        this.sym.shift_expr,
        this.sym.arith_expr,
        this.sym.term,
        this.sym.factor
    ];
    this.cmp_types = {};
    this.cmp_types[T_LESS] = '<';
    this.cmp_types[T_GREATER] = '>';
    this.cmp_types[T_EQEQUAL] = '==';
    this.cmp_types[T_EQUAL] = '=';
    this.cmp_types[T_LESSEQUAL] = '<=';
    this.cmp_types[T_GREATEREQUAL] = '>=';
    this.cmp_types[T_NOTEQUAL] = '!=';

    return this;
}

function transform(cst)
{
    var t = new Transformer(SkulptParseTables);
    return t.compile_node(cst);
}

Transformer.prototype.compile_node = function(node)
{
    var n = node.type;

    if (n === this.sym.single_input)
        return this.single_input(node.children);
    if (n === this.sym.file_input)
        return this.file_input(node.children);

    print("unexpected node type: " + n + ", " + this.grammar.number2symbol[n]);
    throw new SyntaxError("unexpected node type: " + n);
};

Transformer.prototype.dispatch = function(node)
{
    var fn = this[this.grammar.number2symbol[node.type]];
    //print("dispatch: "+this.grammar.number2symbol[node.type]);
    if (!fn) throw ("don't have handler for: " + this.grammar.number2symbol[node.type]);
    var ret;
    if (node.type < 256)
        ret = fn.call(this, node.value);
    else
        ret = fn.call(this, node.children);
    //print(JSON.stringify(node, null, 2));
    //print(JSON.stringify(ret, null, 2));
    if (!ret) throw "assert: handler for '" + this.grammar.number2symbol[node.type] + "' returned undefined";
    return ret;
};

Transformer.prototype.file_input = function(nodelist)
{
    var doc = this.get_docstring(nodelist, this.sym.file_input);
    var stmts = [];
    for (var i = (doc) ? 1 : 0; i < nodelist.length; ++i)
    {
        var node = nodelist[i];
        if (node.type !== T_ENDMARKER && node.type !== T_NEWLINE)
            this.com_append_stmt(stmts, node);
    }
    return new Module(doc, new Stmt(stmts));
};

Transformer.prototype.single_input = function(node)
{
    // NEWLINE | simple_stmt | compound_stmt NEWLINE
    var n = node[0].type;
    if (n !== T_NEWLINE)
    {
        return new Interactive(this.dispatch(node[0]));
    }
    return new Pass();
};

Transformer.prototype.com_append_stmt = function(stmts, node)
{
    var result = this.dispatch(node);
    if (result instanceof Stmt)
    {
        for (var i = 0; i < result.nodes.length; ++i)
            stmts.push(result.nodes[i]);
    }
    else
    {
        stmts.push(result);
    }
};

Transformer.prototype.com_list_constructor = function(nodelist)
{
    // listmaker: test ( list_for | (',' test)* [','] )
    //print("com_list_constructor:"+JSON.stringify(nodelist));
    var values = [];
    for (var i = 0; i < nodelist.children.length; ++i)
    {
        if (nodelist.children[i].type === this.sym.comp_for)
        {
            if (nodelist.children.length - i !== 1) throw "assert";
            return this.com_list_comprehension(values[0], nodelist.children[i]);
        }
        else if (nodelist.children[i].type === T_COMMA)
        {
            continue;
        }
        //print(JSON.stringify(nodelist.children[i]));
        values.push(this.dispatch(nodelist.children[i]));
    }
    return new List(values, values[0].lineno);
};

Transformer.prototype.com_list_comprehension = function(expr, node)
{
    // comp_iter: comp_for | comp_if
    // comp_for: 'for' exprlist 'in' testlist [comp_iter]
    // comp_if: 'if' test [comp_iter]

    // todo; should raise SyntaxError for assignment

    //print("com_list_comprehension.expr:"+JSON.stringify(expr));
    //print("com_list_comprehension.node:"+JSON.stringify(node));
    var lineno = node.children[0].context;
    var fors = [];
    while (node)
    {
        //print(JSON.stringify(node));
        var t = node.children[0].value;
        if (t === "for")
        {
            var assignNode = this.com_assign(node.children[1], OP_ASSIGN);
            var listNode = this.dispatch(node.children[3]);
            var newfor = new ListCompFor(assignNode, listNode, []);
            newfor.lineno = node.children[0].context;
            fors.push(newfor);
            if (node.children.length === 4)
                node = null;
            else
                node = this.com_comp_iter(node.children[4]);
        }
        else if (t === "if")
        {
            var test = this.dispatch(node.children[1]);
            var newif = new ListCompIf(test, node.children[0].context);
            newfor.ifs.push(newif);
            if (node.children.length === 2)
                node = null;
            else
                node = this.com_comp_iter(node.children[2]);
        }
        else
        {
            throw new SyntaxError("unexpected list comprehension element: " + node, lineno + ", " + lineno);
        }
    }
    return new ListComp(expr, fors, lineno);
};

Transformer.prototype.com_comp_iter = function(node)
{
    if (node.type !== this.sym.comp_iter) throw "assert";
    return node.children[0];
};


Transformer.prototype.com_dictmaker = function(nodelist)
{
    // dictmaker: test ':' test (',' test ':' value)* [',']
    var items = [];
    for (var i = 0; i < nodelist.children.length; i += 4)
    {
        items.push(this.dispatch(nodelist.children[i]));
        items.push(this.dispatch(nodelist.children[i+2]));
    }
    return new Dict(items, items[0].lineno);
};

// Compile 'NODE (OP NODE)*' into (type, [ node1, ..., nodeN ]).
Transformer.prototype.com_binary = function(Constructor, nodelist)
{
    var l = nodelist.length;
    if (l === 1)
        return this.dispatch(nodelist[0]);
    var items = [];
    for (var i = 0; i < l; i += 2)
    {
        items.push(this.dispatch(nodelist[i]));
    }
    return new Constructor(items); // todo; lineno=extractLineNo(nodelist))
};

Transformer.prototype.com_apply_trailer = function(primaryNode, nodelist)
{
    //print(JSON.stringify(primaryNode));
    //print(JSON.stringify(nodelist));
    var t = nodelist.children[0].type;
    if (t === T_LPAR)
        return this.com_call_function(primaryNode, nodelist.children[1]);
    if (t === T_DOT)
        return this.com_select_member(primaryNode, nodelist.children[1]);
    if (t === T_LSQB)
        return this.com_subscriptlist(primaryNode, nodelist.children[1], OP_APPLY);

    throw 'unknown node type: ' + t;
};

Transformer.prototype.com_select_member = function(primaryNode, nodelist)
{
    if (nodelist.type !== T_NAME)
        throw new SyntaxError("member must be a name");
    return new Getattr(primaryNode, nodelist.value, nodelist.context);
};


Transformer.prototype.com_arglist = function(nodelist)
{
    //print("com_arglist:"+JSON.stringify(nodelist));
    // varargslist:
    //     (fpdef ['=' test] ',')* ('*' NAME [',' '**' NAME] | '**' NAME)
    //   | fpdef ['=' test] (',' fpdef ['=' test])* [',']
    // fpdef: NAME | '(' fplist ')'
    // fplist: fpdef (',' fpdef)* [',']
    var names = [];
    var defaults = [];
    var haveSomeDefaults = false;
    var varargs = false;
    var varkeywords = false;

    //print("len:"+nodelist.length);
    var i = 0;
    while (i < nodelist.length)
    {
        var node = nodelist[i];
        if (node.type === T_STAR || node.type === T_DOUBLESTAR)
        {
            if (node.type === T_STAR)
            {
                node = nodelist[i + 1];
                if (node.type === T_NAME)
                {
                    names.push(node[1]);
                    varargs = true;
                    i += 3;
                }
            }

            if (i < nodelist.length)
            {
                // should be DOUBLESTAR
                var t = nodelist[i].type;
                if (t === T_DOUBLESTAR)
                {
                    node = nodelist[i+1];
                }
                else
                {
                    throw new ValueError("unxpected token: " + this.grammar.number2symbol[t]);
                }
                names.push(node[1]);
                varkeywords = true;
            }

            break;
        }

        // fpdef: NAME | '(' fplist ')'
        names.push(this.com_fpdef(node));
        //print("names:"+JSON.stringify(names));

        i = i + 1;
        if (i < nodelist.length && nodelist[i].type === T_EQUAL)
        {
            defaults.push(this.dispatch(nodelist[i + 1]));
            i = i + 2;
            haveSomeDefaults = true;
        }
        else
        {
            // we have already seen an argument with default, but here
            // came one without
            if (haveSomeDefaults)
            {
                throw new SyntaxError("non-default argument follows default argument");
            }
            defaults.push(undefined);
        }

        // skip the comma
        i += 1;
    }

    return [names, defaults, varargs, varkeywords];
};

Transformer.prototype.com_fpdef = function(node)
{
    // fpdef: NAME | '(' fplist ')'
    //print("com_fpdef:"+JSON.stringify(node));
    if (node.children[0].type === T_LPAR)
        return this.com_fplist(node.children[1]);
    return node.children[0].value;
};


Transformer.prototype.com_fplist = function(node)
{
    // fplist: fpdef (',' fpdef)* [',']
    //print("com_fplist:"+JSON.stringify(node));
    if (node.length === 2)
        return this.com_fpdef(node[1]);
    var list = [];
    for (var i = 1; i < node.length; i += 2)
    {
        list.push(this.com_fpdef(node[i]));
    }
    return list;
};

Transformer.prototype.com_call_function = function(primaryNode, nodelist)
{
    //print(JSON.stringify(nodelist, null, 2));
    if (nodelist.type === T_RPAR)
    {
        return new CallFunc(primaryNode, [], null, null);//, lineno=extractLineNo(nodelist))
    }
    var args = [];
    var kw = false;
    var star_node = null;
    var dstar_node = null;
    var len_nodelist = nodelist.children.length;
    var i = 0;
    while (i < len_nodelist)
    {
        var node = nodelist.children[i];
        //print("node.type:"+node.type);
        if (node.type === T_STAR)
        {
            if (star_node)
                throw new SyntaxError("already have the varargs identifier");
            star_node = this.dispatch(nodelist.children[i + 1]);
            i += 3;
            continue;
        }
        else if (node.type === T_DOUBLESTAR)
        {
            if (dstar_node)
                throw new SyntaxError("already have the kwargs identifier");
            dstar_node = this.dispatch(nodelist.children[i + 1]);
            i += 3;
            continue;
        }

        // positional or named parameters
        //print("weeEEee", JSON.stringify(node));
        var ret = this.com_argument(node, kw, star_node);
        kw = ret[0];
        var result = ret[1];

        /*
        if (len_nodelist !== 2 && result instanceof GenExpr
                && node.children.length === 2 && node.children[1].type === this.sym.comp_for)
            // allow f(x for x in y), but reject f(x for x in y, 1)
            // should use f((x for x in y), 1) instead of f(x for x in y, 1)
            throw new SyntaxError("generator expression needs parenthesis");
            */

        args.push(result);
        i += 2;
    }

    return new CallFunc(primaryNode, args, star_node, dstar_node);//, lineno=extractLineNo(nodelist))
};

Transformer.prototype.com_argument = function(nodelist, kw, star_node)
{
    //print(nodelist.children.length, "-- \n -- ", JSON.stringify(nodelist));
    if (nodelist.children.length === 2 && nodelist.children[1].type === this.sym.comp_for)
    {
        var test = this.dispatch(nodelist.children[0]);
        return [false, this.com_generator_expression(test, nodelist.children[1])];
    }
    if (nodelist.children.length === 1)
    {
        if (kw)
            throw new SyntaxError("non-keyword arg after keyword arg");
        if (star_node)
            throw new SyntaxError("only named arguments may follow *expression");
        return [false, this.dispatch(nodelist.children[0])];
    }
    var result = this.dispatch(nodelist.children[2]);
    var n = nodelist.children[0];
    //print(JSON2.stringify(n));
    while (n.type !== T_NAME && n.children !== null)
        n = n.children[0];
    if (n.type !== T_NAME)
        throw new SyntaxError("keyword can't be an expression (" + n.type + ")");
    var node = new Keyword(n.value, result, n.context);
    return [true, node];
};

Transformer.prototype.com_assign = function(node, assigning)
{
    // return a node suitable for use as an "lvalue"
    // loop to avoid trivial recursion
    while (true)
    {
        //print(JSON.stringify(node));
        var t = node.type;
        //print("0-----:" + this.grammar.number2symbol[t]);
        if (t === this.sym.exprlist
                || t === this.sym.testlist
                || t === this.sym.testlist_safe
                || t === this.sym.testlist_gexp)
        {
            if (node.children.length > 1)
                return this.com_assign_tuple(node, assigning);
            node = node.children[0];
        }
        else if (contains(this.assign_types, t))
        {
            //print("assign_types:"+JSON.stringify(node));
            if (node.children.length > 1)
                throw new SyntaxError("can't assign to operator");
            node = node.children[0];
        }
        else if (t === this.sym.power)
        {
            if (node.children[0].type !== this.sym.atom)
                throw new SyntaxError("can't assign to operator");
            if (node.children.length > 1)
            {
                var primary = this.dispatch(node.children[0]);
                for (var i = 1; i < node.children.length - 1; ++i)
                {
                    var ch = node.children[i];
                    if (ch.type === T_DOUBLESTAR)
                        throw new SyntaxError("can't assign to operator");
                    primary = this.com_apply_trailer(primary, ch);
                }
                return this.com_assign_trailer(primary, node.children[node.children.length - 1], assigning);

            }
            node = node.children[0];
        }
        else if (t === this.sym.atom)
        {
            t = node.children[0].type;
            if (t === T_LPAR)
            {
                node = node.children[1];
                if (node.type === T_RPAR)
                    throw new SyntaxError("can't assign to ()");
            }
            else if (t === T_LSQB)
            {
                node = node.children[1];
                if (node.type === T_RSQB)
                    throw new SyntaxError("can't assign to []");
                return this.com_assign_list(node, assigning);
            }
            else if (t === T_NAME)
            {
                //print(JSON.stringify(node));
                return new AssName(node.children[0].value, assigning, node.context);
            }
            else
            {
                throw new SyntaxError("can't assign to literal");
            }
        }
        else
        {
            throw new SyntaxError("bad assignment (" + this.grammar.number2symbol[t] + ")");
        }
    }
};

Transformer.prototype.com_assign_trailer = function(primary, node, assigning)
{
    //print("com_assign_trailer:"+JSON.stringify(node));
    var t = node.children[0].type;
    if (t === T_DOT)
        return this.com_assign_attr(primary, node.children[1], assigning);
    if (t === T_LSQB)
        return this.com_subscriptlist(primary, node.children[1], assigning);
    if (t === T_LPAR)
        throw new SyntaxError("can't assign to function call");
    throw new SyntaxError("unknown trailer type: " + this.grammar.number2symbol[t]);
};

Transformer.prototype.com_assign_attr = function(primary, nodelist, assigning)
{
    return new AssAttr(primary, nodelist.value, assigning, nodelist.context);
};

Transformer.prototype.com_subscriptlist = function(primary, nodelist, assigning)
{
    // subscriptlist: subscript (',' subscript)* [',']
    // subscript: test | [test] ':' [test] [sliceop]
    // sliceop: ':' [test]
    var subscripts = [];
    for (var i = 0; i < nodelist.children.length; i += 2)
    {
        subscripts.push(this.com_subscript(nodelist.children[i]));
    }
    return new Subscript(primary, assigning, subscripts); //, lineno=extractLineNo(nodelist))
};

Transformer.prototype.com_subscript = function(node)
{
    // subscript: test | [test] ':' [test] [sliceop]
    // sliceop: ':' [test]
    //print("com_subscript:"+JSON.stringify(node));
    if (node.children.length > 1 || node.children[0].type === T_COLON)
        return this.com_sliceobj(node);
    return this.dispatch(node.children[0]);
};

Transformer.prototype.com_sliceobj = function(node)
{
    var items = [];
    var i;

    //print("----------- com_sliceobj:"+JSON.stringify(node));
    //print("----------- com_sliceobj_length:"+node.children.length);

    // lower
    if (node.children[0].type === T_COLON)
    {
        items.push(null);
        i = 1;
    }
    else
    {
        items.push(this.dispatch(node.children[0]));
        if (node.children[1].type !== T_COLON) throw new SyntaxError("expecting colon");
        i = 2;
    }

    // upper
    if (i < node.children.length && node.children[i].type === this.sym.test)
    {
        items.push(this.dispatch(node.children[i]));
        i += 1;
    }
    else
    {
        items.push(null);
    }

    //print("slice:",i,node.children.length, node.children[i].type);
    // stride
    if (i < node.children.length
            && node.children[i].type === this.sym.sliceop)
    {
        var so = node.children[i];
        if (so.children[0].type !== T_COLON) throw "assert";
        items.push(this.dispatch(so.children[1]));
    }

    return new Sliceobj(items); // todo; , lineno=extractLineNo(node))
};

Transformer.prototype.com_augassign = function(node)
{
    // Names, slices, and attributes are the only allowable nodes.
    var l = this.dispatch(node);
    if (l instanceof Name
            || l instanceof Slice
            || l instanceof Subscript
            || l instanceof Getattr)
    {
        return l;
    }
    throw new SyntaxError("can't assign to " + l.nodeName);
};

Transformer.prototype.com_augassign_op = function(node)
{
    if (node.type !== this.sym.augassign) throw "assert";
    return node.children[0];
};


Transformer.prototype.com_assign_tuple = function(node, assigning)
{
    var assigns = [];
    for (var i = 0; i < node.children.length; i += 2)
        assigns.push(this.com_assign(node.children[i], assigning));
    return new AssTuple(assigns); // todo; , lineno=extractLineNo(node))
};

Transformer.prototype.get_docstring = function(node, n)
{
    // todo;
    return null;
};


//
//
// transformers for all the node types
// nonterms get a list of children, terms get the value
//
//
Transformer.prototype.stmt =
Transformer.prototype.small_stmt =
Transformer.prototype.flow_stmt = 
Transformer.prototype.compound_stmt = function(nodelist)
{
    var result = this.dispatch(nodelist[0]);
    if (result instanceof Stmt) return result;
    return new Stmt([result]);
};

Transformer.prototype.simple_stmt = function(nodelist)
{
    // small_stmt (';' small_stmt)* [';'] NEWLINE
    var stmts = [];
    for (var i = 0; i < nodelist.length; i += 2)
    {
        this.com_append_stmt(stmts, nodelist[i]);
    }
    return new Stmt(stmts);
};

Transformer.prototype.expr_stmt = function(nodelist)
{
    // augassign testlist | testlist ('=' testlist)*
    var en = nodelist[nodelist.length - 1];
    var exprNode = this.dispatch(en);
    if (nodelist.length === 1)
        return new Discard(exprNode, exprNode.lineno);
    if (nodelist[1].type === T_EQUAL)
    {
        var nodesl = [];
        for (var i = 0; i < nodelist.length - 2; i += 2)
        {
            nodesl.push(this.com_assign(nodelist[i], OP_ASSIGN));
        }
        return new Assign(nodesl, exprNode, nodelist[1].context);
    }
    else
    {
        var lval = this.com_augassign(nodelist[0]);
        var op = this.com_augassign_op(nodelist[1]);
        //print("lval:"+JSON.stringify(lval));
        //print("op:"+JSON.stringify(op));
        return new AugAssign(lval, op.value, exprNode, op.context);
    }
};

Transformer.prototype.funcdef = function(nodelist)
{
    //                    -6   -5    -4         -3  -2    -1
    // funcdef: [decorators] 'def' NAME parameters ':' suite
    // parameters: '(' [varargslist] ')'

    var decorators = null;
    if (nodelist.length === 6)
    {
        if (nodelist[0].type !== this.sym.decorators) throw "assert";
        decorators = this.decorators(nodelist[0].children); // ?
    }
    else
    {
        if (nodelist.length !== 5) throw "assert";
    }

    var lineno = nodelist[nodelist.length - 4].context;
    var name = nodelist[nodelist.length - 4].value;
    var args = nodelist[nodelist.length - 3].children[1];
    //print(JSON.stringify(nodelist[nodelist.length - 3].children));
    //print((nodelist[nodelist.length - 3].children.length));

    var names = [];
    var defaults = [];
    var varargs = false;
    var varkeywords = false;
    if (args.type === this.sym.varargslist)
    {
        var ret = this.com_arglist(args.children);
        names = ret[0];
        defaults = ret[1];
        varargs = ret[2];
        varkeywords = ret[3];
    }
    var doc = this.get_docstring(nodelist[nodelist.length - 1]);

    // code for function
    var code = this.dispatch(nodelist[nodelist.length - 1]);

    if (doc)
    {
        if (!code instanceof Stmt) throw "assert";
        if (!code.nodes[0] instanceof Discard) throw "assert";
        code.nodes.shift();
    }
    return new Function_(decorators, name, names, defaults, varargs, varkeywords, doc, code, lineno);
};

Transformer.prototype.lambdef = function(nodelist)
{
    // lambdef: 'lambda' [varargslist] ':' test

    var names = [];
    var defaults = [];
    var flags = 0;
    if (nodelist.children[1].type === this.sym.varargslist)
    {
        var ret = this.com_arglist(nodelist.children[1].children);
        names = ret[0];
        defaults = ret[1];
        flags = ret[2];
    }

    var code = this.dispatch(nodelist.children[nodelist.children.length - 1]);
    return new Lambda(names, defaults, flags, null, code, nodelist.context);
};

Transformer.prototype.com_bases = function(node)
{
    var bases = [];
    for (var i = 0; i < node.children.length; i += 2)
    {
        bases.push(this.dispatch(node.children[i]));
    }
    return bases;
};

Transformer.prototype.classdef = function(nodelist)
{
    // classdef: 'class' NAME ['(' [testlist] ')'] ':' suite
    //print(JSON.stringify(nodelist, null, 2));
    var name = nodelist[1].value;
    var bases;
    if (nodelist[2].type === T_COLON ||
            nodelist[3].type === T_RPAR)
    {
        bases = [];
    }
    else
    {
        bases = this.com_bases(nodelist[3]);
    }

    // code for class
    var code = this.dispatch(nodelist[nodelist.length - 1]);

    return new Class_(name, bases, null, code, /*decorators*/ null);
};


Transformer.prototype.print_stmt = function(nodelist)
{
    // print ([ test (',' test)* [','] ] | '>>' test [ (',' test)+ [','] ])
    var items = [];
    var start, dest;
    if (nodelist.length !== 1 && nodelist[1].type === T_RIGHTSHIFT)
    {
        if (!(nodelist.length === 3 || nodelist[3].type === T_COMMA)) throw "assert";
        dest = this.dispatch(nodelist[2]);
        start = 4;
    }
    else
    {
        start = 1;
        dest = null;
    }
    for (var i = start; i < nodelist.length; i += 2)
    {
        items.push(this.dispatch(nodelist[i]));
    }
    if (nodelist[nodelist.length - 1].type === T_COMMA)
        return new Print(items, dest, false, nodelist[0].context);
    return new Print(items, dest, true, nodelist[0].context);
};

Transformer.prototype.if_stmt = function(nodelist)
{
    // if: test ':' suite ('elif' test ':' suite)* ['else' ':' suite]
    var tests = [];
    for (var i = 0; i < nodelist.length - 3; i += 4)
    {
        var testNode = this.dispatch(nodelist[i + 1]);
        var suiteNode = this.dispatch(nodelist[i + 3]);
        tests.push(testNode);
        tests.push(suiteNode);
    }

    var elseNode = null;
    if (nodelist.length % 4 === 3)
        elseNode = this.dispatch(nodelist[nodelist.length - 1]);
    return new If_(tests, elseNode, nodelist[0].context);
};

Transformer.prototype.while_stmt = function(nodelist)
{
    // 'while' test ':' suite ['else' ':' suite]

    var testNode = this.dispatch(nodelist[1]);
    var bodyNode = this.dispatch(nodelist[3]);

    var elseNode = null;
    if (nodelist.length > 4)
        elseNode = this.dispatch(nodelist[6]);

    return new While_(testNode, bodyNode, elseNode, nodelist[0].context);
};

Transformer.prototype.for_stmt = function(nodelist)
{
    // 'for' exprlist 'in' exprlist ':' suite ['else' ':' suite]

    var assignNode = this.dispatch(nodelist[1], OP_ASSIGN);
    var listNode = this.dispatch(nodelist[3]);
    var bodyNode = this.dispatch(nodelist[5]);

    var elseNode = null;
    if (nodelist.length > 8)
        elseNode = this.dispatch(nodelist[8]);

    return new For_(assignNode, listNode, bodyNode, elseNode, nodelist[0].context);
};

Transformer.prototype.del_stmt = function(nodelist)
{
    return this.com_assign(nodelist[1], OP_DELETE);
};

Transformer.prototype.pass_stmt = function(nodelist)
{
    return new Pass(nodelist[0].context);
};

Transformer.prototype.com_dotted_name = function(node)
{
    var name = "";
    for (var i = 0; i < node.length; ++i)
    {
        if (node[i].type === T_NAME) name += node[i].value + ".";
    }
    return name.substr(0, name.length - 1);
};

Transformer.prototype.com_dotted_as_name = function(node)
{
    //print(JSON2.stringify(node, null, 2));
    if (node.type !== this.sym.dotted_as_name) throw "assert";
    var dot = this.com_dotted_name(node.children[0].children);
    if (node.children.length === 1)
    {
        return [dot, null];
    }
    if (node.children[2].value !== 'as') throw "assert";
    if (node.children[3].type !== T_NAME) throw "assert";
    return [dot, node.children[3].value];
};

Transformer.prototype.com_dotted_as_names = function(node)
{
    if (node.type !== this.sym.dotted_as_names) throw "assert";
    var names = [];
    //print("node.children.length", node.children.length);
    for (var i = 0; i < node.children.length; i += 2)
    {
        names.push(this.com_dotted_as_name(node.children[i]));
    }
    return names;
};

/*
    def com_import_as_name(self, node):
        assert node[0] == symbol.import_as_name
        node = node[1:]
        assert node[0][0] == token.NAME
        if len(node) == 1:
            return node[0][1], None
        assert node[1][1] == 'as', node
        assert node[2][0] == token.NAME
        return node[0][1], node[2][1]

    def com_import_as_names(self, node):
        assert node[0] == symbol.import_as_names
        node = node[1:]
        //names = [self.com_import_as_name(node[0])]
        for i in range(2, len(node), 2):
            names.append(self.com_import_as_name(node[i]))
        return names
*/
Transformer.prototype.import_stmt = function(nodelist)
{
    // import_stmt: import_name | import_from
    if (nodelist.length !== 1) throw "assert";
    return this.dispatch(nodelist[0]);
};

Transformer.prototype.import_name = function(nodelist)
{
    // import_name: 'import' dotted_as_names
    return new Import_(this.com_dotted_as_names(nodelist[1]), nodelist.context);
};

Transformer.prototype.import_from = function(nodelist)
{
    throw "todo;";
/*
    def import_from(self, nodelist):
        # import_from: 'from' ('.'* dotted_name | '.') 'import' ('*' |
        #    '(' import_as_names ')' | import_as_names)
        assert nodelist[0][1] == 'from'
        idx = 1
        while nodelist[idx][1] == '.':
            idx += 1
        level = idx - 1
        if nodelist[idx][0] == symbol.dotted_name:
            fromname = self.com_dotted_name(nodelist[idx])
            idx += 1
        else:
            fromname = ""
        assert nodelist[idx][1] == 'import'
        if nodelist[idx + 1][0] == token.STAR:
            return From(fromname, [('*', None)], level,
                        lineno=nodelist[0][2])
        else:
            node = nodelist[idx + 1 + (nodelist[idx + 1][0] == token.LPAR)]
            return From(fromname, self.com_import_as_names(node), level,
                        lineno=nodelist[0][2])
*/
};


Transformer.prototype.global_stmt = function(nodelist)
{
    // global: NAME (',' NAME)*
    var names = [];
    for (var i = 1; i < nodelist.length; i += 2)
    {
        names.push(nodelist[i].value);
    }
    return new Global(names, nodelist[0].context);
};

Transformer.prototype.break_stmt = function(nodelist)
{
    return new Break_(nodelist[0].context);
};

Transformer.prototype.continue_stmt = function(nodelist)
{
    return new Continue_(nodelist[0].context);
};

Transformer.prototype.assert_stmt = function(nodelist)
{
    return new Assert(this.dispatch(nodelist[1]), nodelist[0].context);
};

Transformer.prototype.return_stmt = function(nodelist)
{
    // return: [testlist]
    if (nodelist.length < 2)
        return new Return_(null, nodelist[0].context);
    return new Return_(this.dispatch(nodelist[1]), nodelist[0].context);
};

Transformer.prototype.yield_stmt = function(nodelist)
{
    var expr = this.dispatch(nodelist[0]);
    return new Discard(expr, expr.context);
};

Transformer.prototype.yield_expr = function(nodelist)
{
    var value;
    //print("yield_expr:"+JSON.stringify(nodelist));
    if (nodelist.length > 1)
        value = this.dispatch(nodelist[1]);
    else
        value = new Const_(null);
    return new Yield_(value, nodelist.context);
};

/*
    def try_stmt(self, nodelist):
        return self.com_try_except_finally(nodelist)

    def with_stmt(self, nodelist):
        return self.com_with(nodelist)

    def with_var(self, nodelist):
        return self.com_with_var(nodelist)
*/

Transformer.prototype.suite = function(nodelist)
{
    // simple_stmt | NEWLINE INDENT NEWLINE* (stmt NEWLINE*)+ DEDENT
    if (nodelist.length === 1)
        return this.dispatch(nodelist[0]);

    var stmts = [];
    for (var i = 0; i < nodelist.length; ++i)
    {
        var node = nodelist[i];
        if (node.type === this.sym.stmt)
            this.com_append_stmt(stmts, node);
    }
    return new Stmt(stmts);
};

Transformer.prototype.testlist_gexp = function(nodelist)
{
    //print("testlist_gexp:"+JSON.stringify(nodelist));
    //print("nodelist.length", nodelist.length);
    //print("nodelist[1].type", nodelist[1].type);
    if (nodelist.length === 2 && nodelist[1].type === this.sym.comp_for)
    {
        var test = this.dispatch(nodelist[0]);
        return this.com_generator_expression(test, nodelist[1]);
    }
    return this.testlist(nodelist);
};

Transformer.prototype.test = function(nodelist)
{
    // or_test ['if' or_test 'else' test] | lambdef
    if (nodelist.length === 1 && nodelist[0].type === this.sym.lambdef)
        return this.lambdef(nodelist[0]);
    var then = this.dispatch(nodelist[0]);
    if (nodelist.length > 1)
    {
        if (nodelist.length !== 5) throw "assert";
        if (nodelist[1].value !== "if") throw "assert";
        if (nodelist[3].value !== "if") throw "else";
        var test = this.dispatch(nodelist[2]);
        var else_ = this.dispatch(nodelist[4]);
        return new IfExp(test, then, else_, nodelist[1].context);
    }
    return then;
};

Transformer.prototype.com_generator_expression = function(expr, node)
{
    // comp_iter: comp_for | comp_if
    // comp_for: 'for' exprlist 'in' testlist_safe [comp_iter]
    // comp_if: 'if' old_test [comp_iter]
    var fors = [];
    //print("com_generator_expression:"+JSON.stringify(node));
    var lineno = node.context;
    while (node)
    {
        var t = node.children[0].value;
        if (t === "for")
        {
            var assignNode = this.com_assign(node.children[1], OP_ASSIGN);
            var genNode = this.dispatch(node.children[3]);
            var newfor = new GenExprFor(assignNode, genNode, [], lineno);
            fors.push(newfor);
            if (node.children.length === 4)
                node = null;
            else
                node = this.com_gen_iter(node.children[4]);
            //print(JSON2.stringify(node))
        }
        else if (t === "if")
        {
            var test = this.dispatch(node.children[1]);
            var newif = new GenExprIf(test, lineno);
            newfor.ifs.push(newif);
            if (node.children.length === 2)
                node = null;
            else
                node = this.com_gen_iter(node.chidlren[2]);
        }
        else
        {
            throw new SyntaxError("unexpected generator expression element");
        }
    }
    fors[0].is_outmost = true;
    return new GenExpr(new GenExprInner(expr, fors), lineno);
};

Transformer.prototype.com_gen_iter = function(node)
{
    if (node.type !== this.sym.comp_iter) throw "assert";
    return node.children[0];
};

Transformer.prototype.or_test =
Transformer.prototype.old_test = function(nodelist)
{
    // and_test ('or' and_test)* | lambdef
    if (nodelist.length === 1 && nodelist[0].type === this.sym.lambdef)
        return this.lambdef(nodelist[0]);
    return this.com_binary(Or, nodelist);
};


Transformer.prototype.and_test = function(nodelist)
{
    // not_test ('and' not_test)*
    return this.com_binary(And, nodelist);
};

Transformer.prototype.not_test = function(nodelist)
{
    // 'not' not_test | comparison
    var result = this.dispatch(nodelist[nodelist.length - 1]);
    if (nodelist.length === 2)
    {
        return new Not(result, nodelist.context);
    }
    return result;
};

Transformer.prototype.comparison = function(nodelist)
{
    // comparison: expr (comp_op expr)*
    var node = this.dispatch(nodelist[0]);
    if (nodelist.length === 1) return node;

    var results = [];
    for (var i = 2; i < nodelist.length; i += 2)
    {
        var nl = nodelist[i - 1];

        // comp_op: '<' | '>' | '=' | '>=' | '<=' | '<>' | '!=' | '=='
        //          | 'in' | 'not' 'in' | 'is' | 'is' 'not'
        var n = nl.children[0];
        var type;
        //print(JSON.stringify(nl));
        if (n.type === T_NAME)
        {
            type = n.value;
            if (nl.children.length === 2)
            {
                if (type === "not") type = "not in";
                else type = "is not";
            }
        }
        else
        {
            type = this.cmp_types[n.type];
        }

        var lineno = nl.children[0].context;
        results.push(type);
        results.push(this.dispatch(nodelist[i]));
    }

    // we need a special "compare" node so that we can distinguish
    //   3 < x < 5   from    (3 < x) < 5
    // the two have very different semantics and results (note that the
    // latter form is always true)

    //print(JSON.stringify(results));
    return new Compare(node, results, lineno);
};

Transformer.prototype.expr = function(nodelist)
{
    // xor_expr ('|' xor_expr)*
    return this.com_binary(Bitor, nodelist);
};

Transformer.prototype.xor_expr = function(nodelist)
{
    // xor_expr ('^' xor_expr)*
    return this.com_binary(Bitxor, nodelist);
};

Transformer.prototype.and_expr = function(nodelist)
{
    // xor_expr ('&' xor_expr)*
    return this.com_binary(Bitand, nodelist);
};

Transformer.prototype.shift_expr = function(nodelist)
{
    // shift_expr ('<<'|'>>' shift_expr)*
    var node = this.dispatch(nodelist[0]);
    for (var i = 2; i < nodelist.length; i += 2)
    {
        var right = this.dispatch(nodelist[i]);
        if (nodelist[i - 1].type === T_LEFTSHIFT)
            node = new LeftShift(node, right, nodelist[1].context);
        else if (nodelist[i - 1].type === T_RIGHTSHIFT)
            node = new RightShift(node, right, nodelist[1].context);
        else
            throw new SyntaxError("unexpected token: " + this.grammar.number2symbol[nodelist[i-1].type]);
    }
    return node;
};

Transformer.prototype.arith_expr = function(nodelist)
{
    var node = this.dispatch(nodelist[0]);
    for (var i = 2; i < nodelist.length; i += 2)
    {
        var right = this.dispatch(nodelist[i]);
        if (nodelist[i-1].type === T_PLUS)
            node = new Add(node, right, nodelist[1].context);
        else if (nodelist[i-1].type === T_MINUS)
            node = new Sub(node, right, nodelist[1].context);
        else
            throw new SyntaxError("unexpected token: " + this.grammar.number2symbol[nodelist[i-1].type]);
    }
    return node;
};

Transformer.prototype.term = function(nodelist)
{
    var node = this.dispatch(nodelist[0]);
    for (var i = 2; i < nodelist.length; i += 2)
    {
        var right = this.dispatch(nodelist[i]);
        var t = nodelist[i - 1].type;
        if (t === T_STAR) node = new Mul(node, right);
        else if (t === T_SLASH) node = new Div(node, right);
        else if (t === T_PERCENT) node = new Mod(node, right);
        else if (t === T_DOUBLESLASH) node = new FloorDiv(node, right);
        else throw new SyntaxError("unexpected token: " + this.grammar.number2symbol[t]);
        node.lineno = nodelist[1].context;
    }
    return node;
};

Transformer.prototype.factor = function(nodelist)
{
    //print("factor");
    var elt = nodelist[0];
    var t = elt.type;
    var node = this.dispatch(nodelist[nodelist.length - 1]);
    // need to handle (unary op)constant here...
    if (t === T_PLUS)
        node = new UnaryAdd(node, elt.context);
    else if (t === T_MINUS)
        node = new UnarySub(node, elt.context);
    else if (t === T_TILDE)
        node = new Invert(node, elt.context);
    return node;
};

Transformer.prototype.power = function(nodelist)
{
    // power: atom trailer* ('**' factor)*
    var node = this.dispatch(nodelist[0]);
    for (var i = 1; i < nodelist.length; ++i)
    {
        var elt = nodelist[i];
        if (elt.type === T_DOUBLESTAR)
        {
            return new Power(node, this.dispatch(nodelist[i+1]), elt.context);
        }
        node = this.com_apply_trailer(node, elt);
    }

    return node;
};

Transformer.prototype.testlist =
Transformer.prototype.testlist_safe =
Transformer.prototype.testlist1 =
Transformer.prototype.exprlist =
function(nodelist)
{
    // testlist: expr (',' expr)* [',']
    // testlist_safe: test [(',' test)+ [',']]
    // exprlist: expr (',' expr)* [',']
    return this.com_binary(Tuple, nodelist);
};

Transformer.prototype.atom = function(nodelist)
{
    var t = nodelist[0].type;
    return this[t].call(this, nodelist);
};

Transformer.prototype[T_LPAR] = function(nodelist)
{
    if (nodelist[1].type === T_RPAR)
        return new Tuple([], nodelist[0].context);
    return this.dispatch(nodelist[1]);
};

Transformer.prototype[T_LSQB] = function(nodelist)
{
    if (nodelist[1].type === T_RSQB)
        return new List([], nodelist[0].context);
    return this.com_list_constructor(nodelist[1]);
};

Transformer.prototype[T_LBRACE] = function(nodelist)
{
    if (nodelist[1].type === T_RBRACE)
        return new Dict([], nodelist[0].context);
    return this.com_dictmaker(nodelist[1]);
};

Transformer.prototype[T_BACKQUOTE] = function(nodelist)
{
    return new Backquote(this.com_node(nodelist[1]));
};

Transformer.prototype[T_NUMBER] = function(nodelist)
{
    var v = nodelist[0].value;
    var k;
    if (v.charAt(v.length - 1) === "l" || v.charAt(v.length - 1) === "L")
    {
        k = Long$.fromJsStr$(v.substring(0, v.length - 1));
    }
    else
    {
        k = eval(nodelist[0].value);
        if ((k > Long$.threshold$ || k < -Long$.threshold$)
                && Math.floor(k) === k) // todo; what to do with floats?
        {
            k = Long$.fromJsStr$(nodelist[0].value);
        }
    }
    return new Const_(k, nodelist[0].context);
};

Transformer.prototype[T_STRING] = function(nodelist)
{
    return new Const_(nodelist[0].value, nodelist[0].context);
};

Transformer.prototype[T_NAME] = function(nodelist)
{
    return new Name(nodelist[0].value, nodelist[0].context);
};


//
// Helpers for walkers
//
function genericVisit(ast, args)
{
    if (!ast) return undefined;
    if (args === undefined) throw "no args";
    //if (args.o === undefined) throw "no output buffer";
    //print("name:"+ ast.nodeName);
    if (ast.nodeName in this)
    {
        return this[ast.nodeName].call(this, ast, args);
    }
    else if (ast.walkChildren)
    {
        ast.walkChildren(this, args);
    }

}

var gensymCounter = 0;
function gensym()
{
    gensymCounter += 1;
    return "G$" + gensymCounter + "$";
}

//
//
//
// Walkers that perform various actions on the AST (including spitting out JS)
//
//
//

//
// determines if the body of a function contains any 'yield's and so it should
// be compiled as a generator rather than a function. tags all generator
// functions for later passes.
//
var hMarkGeneratorFunctions = {
visit: genericVisit,
Function_: function(ast, a)
           {
               ast.code.walkChildren(this, { func: ast });
           },
Yield_: function(ast, a)
{
    a.func.isGenerator = true;
}
};

//
// convert generator expressions to functions.
// http://docs.python.org/reference/executionmodel.html mentions that this is
// how generator expressions are implemented.
//
var hConvertGeneratorExpressionsToFunctions = {
visit: genericVisit,
GenExpr: function(ast, a)
{
    //print(JSON2.stringify(ast, null, 2));
    var lineno = ast.lineno;
    var cur;
    var root;
    for (var i = 0; i < ast.code.quals.length; ++i)
    {
        var qual = ast.code.quals[i];
        var next = new For_(new Name(qual.assign.name, lineno), qual.iter, new Stmt(new Pass(), lineno), null, lineno);
        if (cur !== undefined) cur.body.nodes = [next];
        cur = next;
        if (root === undefined) root = cur;
    }
    cur.body = new Stmt([ new Yield_(ast.code.expr, lineno) ], lineno);
    // todo; argnames of .0?
    var ret = new GenExprTransformed(new Function_(null, "<genexpr>", [], [], ast.varargs, ast.kwargs, null, new Stmt([root], lineno), lineno));
    //print(JSON2.stringify(ret, null, 2));
    return ret;
}
};

//
// modify all functions that fall off the end to explicitly return None (to
// handle null vs undefined in js).
//
var hMakeNoReturnANull = {
visit: genericVisit,
Function_: function(ast, a)
           {
               if (ast.code.nodes.length === 0 ||
                       !(ast.code.nodes[ast.code.nodes.length - 1] instanceof Return_))
               {
                   ast.code.nodes.push(new Return_(null));
               }
               // handle nested functions
               this.visit(ast.code, a);
           }
};


//
// walks a lhs that's a tuple unpack and verifies and returns all the names in
// the nested binops
//
var hGetTupleNames = {
visit: genericVisit,
AssName: function(ast, a)
         {
             a.names.push(ast.name);
         }
};

//
// walks a function body and notes all names that are declared global
//
var hFindGlobals = {
visit: genericVisit,
Global: function(ast, names)
        {
            for (var i = 0; i < ast.names.length; ++i)
                names.push(ast.names[i]);
        }
};

function appearsIn(name, namelist)
{
    for (var j = 0; j < namelist.length; ++j)
    {
        if (namelist[j] === name)
            return true;
    }
    return false;
}

//
// annotates blocks with the names that are bound within the block
// propagation of scope into functions is not done here (so functions need to
// look at functions they were declared in to find name bindings
//
//
// from http://docs.python.org/dev/reference/executionmodel.html
// a block is: a module, a class body, or a function body
// the following bind names:
// - function arguments
// - import
// - class and def
// - targets of assignment if identifiers
// - for loop header
// - the variable of except
// - variable in as and with
// when a name is bound, it becomes a local in that block. it doesn't matter
// when the name is bound, it's a local for the whole block. this means that a
// scan of the body of the block can determine at compile time whether it's a
// local or a global.
//
// the global statement causes references to that name to be global.
//
// i interpret http://docs.python.org/dev/reference/executionmodel.html#interaction-with-dynamic-features
// to mean that you can't muck with the static-icity; it's either clearly a
// local because its assigned to in the body, or it's always global.
//
var BIND_LOCAL = 'BIND_LOCAL';
var BIND_ARG = 'BIND_ARG'; // ARG is the same as LOCAL, just tagged for later info
var BIND_GLOBAL = 'BIND_GLOBAL';
var hAnnotateBlocksWithBindings = {
visit: genericVisit,
AssName: function(ast, a)
         {
             this.bindName(a, ast.name, BIND_LOCAL);
         },
// Subscript and AssAttr aren't necessary, AssTuple is handled by AssName
Global: function(ast, a)
        {
            for (var i = 0; i < ast.names.length; ++i)
                this.bindName(a, ast.names[i], BIND_GLOBAL);
        },
Module: function(ast, a)
        {
            //print("WEEE", astDump(ast));
            this.newBlockAndWalkChildren(ast, a);
        },
Interactive: function(ast, a)
             {
                 this.newBlockAndWalkChildren(ast, a);
             },
For_: function(ast, a)
      {
          if (ast.assign.nodeName === "Name")
          {
              this.bindName(a, ast.assign.name, BIND_LOCAL);
          }
          else
          {
              throw "unhandled case in For_";
          }
          ast.walkChildren(this, a);
      },
Class_: function(ast, a)
        {
            this.bindName(a, ast.name, BIND_LOCAL);

            this.newBlockAndWalkChildren(ast, a);
        },
Function_: function(ast, a)
           {
               this.bindName(a, ast.name, BIND_LOCAL);
               this.newBlockAndWalkChildren(ast, a);

               a.currentBlocks.push(ast);
               for (var i = 0; i < ast.argnames.length; ++i)
                   this.bindName(a, ast.argnames[i], BIND_ARG);
               a.currentBlocks.pop();
           },

// todo; except, as, with, import

newBlockAndWalkChildren: function(ast, a)
                         {
                             ast.nameBindings = {};
                             a.currentBlocks.push(ast);
                             //print(a.currentBlocks, a.currentBlocks.length);
                             ast.walkChildren(this, a);
                             a.currentBlocks.pop();
                         },
bindName: function(a, name, level)
          {
              var end = a.currentBlocks.length - 1;
              var prev = a.currentBlocks[end].nameBindings[name];
              // allow global to override local, but not the other way around
              if (level === BIND_GLOBAL || prev === undefined)
              {
                  a.currentBlocks[end].nameBindings[name] = level;
              }
          }
};

//
// for the body of methods, renames all accesses to the 0th parameter
// (typically 'self') to be 'this' instead.
//
var hRenameAccessesToSelf = {
visit: genericVisit,
AssAttr: function(ast, a)
         {
             var origname = a.origname;
             if (ast.expr.nodeName === "Name")
             {
                 if (ast.expr.name === origname)
                     ast.expr.name = "this";
             }
             else
             {
                 print(JSON.stringify(ast.expr));
                 throw "todo;";
             }
         },
Getattr: function(ast, a)
         {
             var origname = a.origname;
             if (ast.expr.nodeName === "Name")
             {
                 if (ast.expr.name === origname)
                     ast.expr.name = "this";
             }
             else
             {
                 print(JSON.stringify(ast.expr));
                 throw "todo;";
             }
         },
Name: function(ast, a)
      {
          // todo; might be too aggressive?
          if (ast.name === a.origname) ast.name = "this";
      }
};

function shallowcopy(obj)
{
    var ret = new obj.constructor(); 
    for (var key in obj)
    {
        if (obj.hasOwnProperty(key))
        {
            ret[key] = obj[key];
        }
    }
    return ret;
}

//
// main code generation handler
//
var hMainCompile =
{
visit: genericVisit,

Stmt: function(ast, a)
      {
          for (var i = 0; i < ast.nodes.length; ++i)
          {
              this.visit(ast.nodes[i], a);
              a.o.push(";");
          }
      },
Print: function(ast, a)
       {
           var o = a.o;
           //dotrace("in print:"+ast.toString());
           for (var i = 0; i < ast.nodes.length; ++i)
           {
               o.push("sk$print(");
               this.visit(ast.nodes[i], a);
               o.push(");");
               if (i !== ast.nodes.length - 1) o.push("sk$print(' ');");
           }
           if (ast.nl)
               o.push("sk$print('\\n')");
       },

Assign: function(ast, a)
        {
            var o = a.o;
            var acopy;
            var tmp = gensym();
            o.push("var ");
            o.push(tmp);
            o.push("=");
            this.visit(ast.expr, a);
            o.push(";");
            for (var i = 0; i < ast.nodes.length; ++i)
            {
                var node = ast.nodes[i];
                if (node instanceof AssName ||
                        node instanceof Subscript ||
                        node instanceof AssAttr)
                {
                    acopy = shallowcopy(a);
                    acopy.tmp = tmp;
                    this.visit(ast.nodes[i], acopy);
                }
                // todo; this should probably be in the AssTuple handler
                else if (node instanceof AssTuple)
                {
                    o.push("sk$unpack([");
                    var names = [];
                    acopy = shallowcopy(a);
                    acopy.names = names;
                    ast.nodes[i].walkChildren(hGetTupleNames, acopy);
                    o.push("'" + names.join("','") + "'");
                    o.push("],");
                    o.push(tmp);
                    if (a.asGenerator)
                    {
                        o.push(",");
                        o.push(a.generatorStateName);
                    }
                    o.push(")");
                }
                else
                {
                    throw "todo;" + node.nodeName;
                }
                if (i !== ast.nodes.length - 1) o.push(";");
            }
        },

AssName: function(ast, a)
         {
             var o = a.o;
             var tmp = a.tmp;
             if (ast.flags === OP_ASSIGN)
             {
                 if (!tmp) throw "expecting tmp node to assign from";
                 if (a.asGenerator && a.func.nameBindings[ast.name] === BIND_LOCAL)
                 {
                     o.push(a.generatorStateName);
                     o.push(".");
                 }
                 o.push(ast.name);
                 o.push("=");
                 o.push(tmp);
             }
             else if (ast.flags === OP_DELETE)
             {
                 o.push("delete ");
                 o.push(ast.name);
             }
             else
             {
                 throw "unexpected flags";
             }
         },

Subscript: function(ast, a)
           {
               var j, k, nodes;
               var o = a.o;
               var tmp = a.tmp;

               var pushStateName = function()
               {
                   if (a.asGenerator)
                   {
                       o.push(a.generatorStateName);
                       o.push(".");
                   }
               };

               if (ast.flags === OP_ASSIGN)
               {
                   if (!tmp) throw "expecting tmp node to assign from";
                   pushStateName();
                   this.visit(ast.expr, a);
                   for (j = 0; j < ast.subs.length; ++j)
                   {
                       o.push(".__setitem__(");
                       this.visit(ast.subs[j], a);
                       o.push(",");
                       o.push(tmp);
                       o.push(")");
                   }
               }
               else if (ast.flags === OP_APPLY)
               {
                   for (j = 0; j < ast.subs.length; ++j)
                   {
                       pushStateName();
                       this.visit(ast.expr, a);
                       o.push(".__getitem__(");
                       this.visit(ast.subs[j], a);
                       o.push(")");
                   }
               }
               else if (ast.flags === OP_DELETE)
               {
                   for (j = 0; j < ast.subs.length; ++j)
                   {
                       pushStateName();
                       this.visit(ast.expr, a);
                       o.push(".__delitem__(");
                       this.visit(ast.subs[j], a);
                       o.push(")");
                   }
               }
               else
               {
                   throw "unexpected Subscript flags:" + ast.flags;
               }
           },

AssAttr: function(ast, a)
         {
             var o = a.o;
             var tmp = a.tmp;
             //print(JSON.stringify(ast.nodes, null, 2));
             if (ast.flags === OP_ASSIGN)
             {
                 if (!tmp) throw "expecting tmp node to assign from";
                 if (a.asGenerator)
                 {
                     o.push(a.generatorStateName);
                     o.push(".");
                 }
                 this.visit(ast.expr, a);
                 o.push(".__setattr__('" + ast.attrname + "',");
                 o.push(tmp);
                 o.push(")");
             }
             else
             {
                 throw "unexpected AssAttr flags:" + ast.flags;
             }
         },

Sliceobj: function(ast, a)
          {
              var o = a.o;
              //print(JSON.stringify(ast, null, 2));
              o.push("new Slice$(");
              var si = function(i) {
                  if (ast.nodes.length > i)
                  {
                      if (ast.nodes[i] === null) o.push('null');
                      else this.visit(ast.nodes[i], a);
                      if (ast.nodes.length > i + 1)
                          o.push(",");
                  }
              };
              for (var i = 0; i < 3; ++i) si.call(this, i);
              o.push(")");
          },

Getattr: function(ast, a)
         {
             var o = a.o;
             o.push("sk$ga(");
             this.visit(ast.expr, a);
             o.push(",'");
             o.push(ast.attrname);
             o.push("')");
         },

wrapAug: function(node)
         {
             if (node instanceof Getattr) return new AugGetattr(node);
             if (node instanceof Name) return new AugName(node);
             if (node instanceof Slice) return new AugSlice(node);
             if (node instanceof Subscript) return new AugSubscript(node);
             throw "assert";
         },

AugName: function(ast, a)
         {
             var tmp = a.tmp;
             var o = a.o;
             if (!tmp) throw "expecting tmp";
             if (a.augmode === 'load')
             {
                 o.push("var ");
                 o.push(tmp);
                 o.push("=");
                 this.visit(ast.node, a);
             }
             else if (a.augmode === 'store')
             {
                 this.visit(ast.node, a);
                 o.push("=");
                 o.push(tmp);
             }
             o.push(";");
         },

AugGetattr: function(ast, a)
            {
                var tmp = a.tmp;
                var o = a.o;
                if (!tmp) throw "expecting tmp";
                if (a.augmode === 'load')
                {
                    o.push("var ");
                    o.push(tmp);
                    o.push("=");
                    this.visit(ast.node, a);
                }
                else if (a.augmode === 'store')
                {
                    o.push("sk$sa(");
                    this.visit(ast.node.expr, a);
                    o.push(",'");
                    o.push(ast.node.attrname);
                    o.push("',");
                    o.push(tmp);
                    o.push(")");
                }
                o.push(";");
            },

AugSlice: function(ast, a)
          {
              throw "can't augslice yet";
          },

AugSubscript: function(ast, a)
              {
                  throw "can't augsubscript yet";
              },


AugAssign: function(ast, a)
           {
               var o = a.o;

               // 4 separate sub-cases depending on LHS:
               // Attr, Name, Slice, Subscript
               // first, use the normal compile to get the value into a tmp
               // then modify it inplace if possible
               // then use a modified compile on node to store it again.
               var augnode = this.wrapAug(ast.node);
               var acopy = shallowcopy(a);
               acopy.augmode = 'load';
               acopy.tmp = gensym();
               this.visit(augnode, acopy);

               o.push(acopy.tmp);
               o.push("=sk$inplace(");
               o.push(acopy.tmp);
               o.push(",");
               this.visit(ast.expr, a);
               o.push(",'");
               o.push(ast.op);
               o.push("');");

               acopy.augmode = 'store';
               this.visit(augnode, acopy);
           },

Tuple: function(ast, a)
       {
           var o = a.o;
           o.push("new Tuple$([");
           for (var i = 0; i < ast.nodes.length; ++i)
           {
               this.visit(ast.nodes[i], a);
               if (i !== ast.nodes.length - 1) o.push(",");
           }
           o.push("])");
       },

genSliceAtBlockBoundary: function(a)
                         {
                             if (a.asGenerator)
                             {
                                 var o = a.o;

                                 var inLoopMarker = a.generatorStateName + "." + gensym();

                                 o.push(a.locationMarkers[a.locationMarkers.length - 1]);
                                 o.push("++;}");
                                 o.push("case ");
                                 o.push(a.locationMarkerValues[a.locationMarkerValues.length - 1]++);
                                 o.push(":{");

                                 // tag the loop with a label for break/continue
                                 // save the inLoopMarker so it can be cleared too
                                 var label = gensym();
                                 a.loopLabels.push({ label: label, inLoopMarker: inLoopMarker });
                                 o.push(label);
                                 o.push(":");

                                 return inLoopMarker;
                             }
                         },

genTailOfLoop: function(a, inLoopMarker)
               {
                   if (a.asGenerator)
                   {
                       var o = a.o;
                       o.push(a.locationMarkers[a.locationMarkers.length - 1]);
                       o.push("=0;");
                       o.push(inLoopMarker);
                       o.push("=false;");

                       a.loopLabels.pop();
                   }
               },

       // todo; this doesn't work for generators
       // need to have a genSliceBeforeLoop-ish before
       // and then the body of all blocks should share the stuff that's
       // currently in the function setup
If_: function(ast, a)
     {
         //this.genSliceAtBlockBoundary(a);

         var o = a.o;
         for (var i = 0; i < ast.tests.length; i += 2)
         {
             if (i !== 0) o.push("else ");
             o.push("if(");
             this.visit(ast.tests[i], a);
             o.push("){");
             this.startGeneratorCodeBlock(a);
             this.visit(ast.tests[i + 1], a);
             this.endGeneratorCodeBlock(a);
             o.push("}");
         }
         if (ast.else_)
         {
             o.push("else{");
             this.startGeneratorCodeBlock(a);
             this.visit(ast.else_, a);
             this.endGeneratorCodeBlock(a);
             o.push("}");
         }
     },

While_: function(ast, a)
        {
            var o = a.o;

            var inLoopMarker = this.genSliceAtBlockBoundary(a);
            
            o.push("while(true){");
            //o.push("print('n',n);");
            o.push("if(!(");

            if (a.asGenerator)
            {
                o.push(inLoopMarker);
                o.push("||");
            }

            this.visit(ast.test, a);
            o.push("))break;");

            this.startGeneratorCodeBlock(a);
            if (a.asGenerator)
            {
                o.push(inLoopMarker);
                o.push("=true;");
            }

            this.visit(ast.body, a);

            this.genTailOfLoop(a, inLoopMarker);

            this.endGeneratorCodeBlock(a);

            o.push("}");
        },

For_: function(ast, a)
      {
          var o = a.o;
          var tmp = gensym();
          var tmp2 = gensym();

          if (a.asGenerator)
          {
              o.push(a.generatorStateName);
              o.push(".");
          }
          o.push(tmp);
          o.push("=(");
          this.visit(ast.list, a);
          o.push(").__iter__();");

          var inLoopMarker = this.genSliceAtBlockBoundary(a);

          o.push("while(true){");

          if (a.asGenerator)
          {
              o.push("if(!");
              o.push(inLoopMarker);
              o.push("){");
          }

          o.push("var ");
          o.push(tmp2);
          o.push("=");
          if (a.asGenerator)
          {
              o.push(a.generatorStateName);
              o.push(".");
          }
          o.push(tmp);
          o.push(".next();");

          o.push("if(");
          o.push(tmp2);
          o.push("===undefined)break;");

          this.visit(ast.assign, a);
          o.push("=");
          o.push(tmp2);
          o.push(";");

          if (a.asGenerator)
          {
              o.push("}");
          }

          this.startGeneratorCodeBlock(a);
          if (a.asGenerator)
          {
              o.push(inLoopMarker);
              o.push("=true;");
          }

          this.visit(ast.body, a);

          this.genTailOfLoop(a, inLoopMarker);

          this.endGeneratorCodeBlock(a);

          o.push("}");
      },

simpleRemapOp: {
                    "is": "===",
                    "is not": "!=="
                },
funcCallRemapOp: {
                    "in": "sk$in"
                 },
cmpCallRemapOp: {
                    "==": true,
                    "!=": true,
                    "<=": true,
                    "<": true,
                    ">=": true,
                    ">": true
                },

Compare: function(ast, a)
         {
             var o = a.o;
             if (ast.ops[0] in this.simpleRemapOp)
             {
                 this.visit(ast.expr, a);
                 o.push(this.simpleRemapOp[ast.ops[0]]);
                 this.visit(ast.ops[1], a);
             }
             else if (ast.ops[0] in this.funcCallRemapOp)
             {
                 o.push(this.funcCallRemapOp[ast.ops[0]]);
                 o.push("(");
                 this.visit(ast.expr, a);
                 o.push(",");
                 this.visit(ast.ops[1], a);
                 o.push(")");
             }
             else if (ast.ops[0] in this.cmpCallRemapOp)
             {
                 o.push("sk$cmp(");
                 this.visit(ast.expr, a);
                 o.push(",");
                 this.visit(ast.ops[1], a);
                 o.push(",'");
                 o.push(ast.ops[0]);
                 o.push("')");
             }
             // todo; multiple ops in same compare
         },

UnarySub: function(ast, a)
          {
              var o = a.o;
              o.push("sk$neg(");
              this.visit(ast.expr, a);
              o.push(")");
          },

Not: function(ast, a)
     {
         var o = a.o;
         o.push("!(");
         this.visit(ast.expr, a);
         o.push(")");
     },

Const_: function(ast, a)
        {
            var o = a.o;
            o.push("(");
            if (typeof ast.value === "string")
            {
                o.push("new Str$(");
                var v = ast.value;
                var ss = v.substring(0, 3);
                if (ss === "'''" || ss === '"""')
                {
                    v = v.replace(/\n/g, "\\n");
                    v = v.substring(3, v.length - 3);
                    if (ss === "'''") v = "'" + v.replace(/'/g, "\\'") + "'";
                    else if (ss === '"""') v = '"' + v.replace(/"/g, '\\"') + '"';
                }
                o.push(v);
                o.push(")");
            }
            else if (typeof ast.value === "number")
            {
                o.push(ast.value.toString());
            }
            else if (ast.value === null)
            {
                o.push('null');
            }
            else if (ast.value.constructor === Long$)
            {
                var tmp = gensym();
                Skulpt.consts$[tmp] = ast.value;
                if (!Skulpt.consts$[tmp]) throw "wha?";
                o.push("Skulpt.consts$." + tmp);
            }
            else
            {
                throw "todo;";
            }
            o.push(")");
        },

functionSetup: function(ast, a, inclass, islamb)
               {
                   var o = a.o;
                   var i;
                   var argstart = inclass ? 1 : 0; // todo; staticmethod
                   // lambdas are compiled as "values"
                   var asvalue = islamb || ast.name === "<genexpr>"; // todo; by name is ugly
                   var ret = undefined;

                   if (!asvalue)
                   {
                       if (inclass) o.push(a.klass + ".prototype.");
                       o.push(ast.name);
                       if (!islamb) o.push("="); 
                   }
                   else
                   {
                       ret = gensym(); // make a name that can have the argname stuff added to
                       o.push(ret);
                       o.push("=");
                   }
                   o.push("function(");
                   for (i = argstart; i < ast.argnames.length; ++i)
                   {
                       o.push(ast.argnames[i]);
                       if (i !== ast.argnames.length - 1) o.push(",");
                   }
                   o.push("){");
                   for (i = argstart; i < ast.argnames.length; ++i)
                   {
                       if (!ast.defaults[i]) continue;
                       o.push("if(");
                       o.push(ast.argnames[i]);
                       o.push("===undefined){");
                       o.push(ast.argnames[i]);
                       o.push("=");
                       this.visit(ast.defaults[i], a);
                       o.push(";}");
                   }

                   // todo; varargs, kwargs
                   return ret;
               },

makeFuncBody: function(ast, a)
              {
                  var o = a.o;
                  var inclass = a.klass !== undefined;
                  var islamb = a.islamb !== undefined;

                  var name = this.functionSetup(ast, a, inclass, islamb);
                  if (!name) name = ast.name;

                  //print("bindings", JSON.stringify(ast.nameBindings, null, 2));
                  for (var k in ast.nameBindings)
                  {
                      //print("k",k);
                      if (ast.nameBindings.hasOwnProperty(k))
                      {
                          var v = ast.nameBindings[k];
                          if (v === BIND_LOCAL)
                          {
                              o.push("var ");
                              o.push(k);
                              o.push(";");
                          }
                          else if (v === BIND_GLOBAL)
                          {
                              o.push("/* " + k + " is in func_globals */");
                          }
                      }
                  }

                  if (islamb) o.push("return(");
                  if (inclass)
                  {
                      //print("origname:",ast.argnames[0]);
                      ast.code.walkChildren(hRenameAccessesToSelf, { func: ast, o: o, origname: ast.argnames[0] });
                  }

                  var acopy = shallowcopy(a);
                  acopy.klass = undefined;
                  this.visit(ast.code, acopy);

                  if (islamb) o.push(");");
                  o.push("};");
                  if (inclass && !islamb)
                  {
                      // for direct calls to base, like Base.__init__(self, ...)
                      o.push(a.klass);
                      o.push(".");
                      o.push(name);
                      o.push("=function(){");
                      o.push(a.klass);
                      o.push(".prototype.");
                      o.push(name);
                      o.push(".apply(arguments[0],Array.prototype.slice.call(arguments,1));};");
                  }

                  // attach metadata to the function definition

                  var outputprefix = function() {
                      if (inclass)
                      {
                          o.push(a.klass);
                          o.push(".prototype.");
                      }
                      o.push(name);
                  };

                  // store global environment
                  outputprefix();
                  var tmp = gensym();
                  Skulpt.consts$[tmp] = a.module.__dict__;
                  o.push(".func_globals=Skulpt.consts$.");
                  o.push(tmp);
                  o.push(";");

                  // names of arguments to kwargs can be unpacked to the right location
                  outputprefix();
                  o.push(".argnames$=[");
                  for (var i = inclass ? 1 : 0; i < ast.argnames.length; ++i)
                  {
                      o.push("'");
                      o.push(ast.argnames[i]);
                      o.push("'");
                      if (i !== ast.argnames.length - 1) o.push(",");
                  }
                  o.push("];");
              },

startGeneratorCodeBlock: function(a)
                     {
                         if (a.asGenerator)
                         {
                             var locMarker = gensym();
                             var o = a.o;

                             a.locationMarkers.push(a.generatorStateName + "." + locMarker);
                             a.locationMarkersToBeInitialized.push(locMarker);

                             o.push("switch(");
                             o.push(a.generatorStateName);
                             o.push(".");
                             o.push(locMarker);
                             o.push("){case 0:{");
                             a.locationMarkerValues.push(1);
                         }
                     },

endGeneratorCodeBlock: function(a)
                       {
                           if (a.asGenerator)
                           {
                               var o = a.o;
                               var locMarker = a.locationMarkers.pop();

                               o.push(locMarker);
                               o.push("=0;");

                               o.push("}}");
                               a.locationMarkerValues.pop();
                               return locMarker;
                           }
                       },

compileGenerator: function(ast, a)
                  {
                      var o = a.o;
                      var i;
                      var inclass = a.klass !== undefined;
                      this.functionSetup(ast, a, inclass, false);

                      var tmp = gensym();
                      o.push("var ");
                      o.push(tmp);
                      o.push("={__iter__:function(){return ");
                      o.push(tmp);
                      o.push(";},__repr__:function(){return new Str$('<generator object ");
                      o.push(ast.name);
                      o.push(">');},");
                      o.push("next:function(){");

                      var acopy = shallowcopy(a);
                      acopy.asGenerator = true;
                      acopy.generatorStateName = tmp;
                      acopy.locationMarkers = [];
                      acopy.locationMarkersToBeInitialized = [];
                      acopy.locationMarkerValues = [];
                      acopy.loopLabels = [];
                      acopy.func = ast;

                      // todo; self accesses

                      this.startGeneratorCodeBlock(acopy);

                      this.visit(ast.code, acopy);

                      this.endGeneratorCodeBlock(acopy);

                      o.push("},");
                      for (i = 0; i < acopy.locationMarkersToBeInitialized.length; ++i)
                      {
                          o.push(acopy.locationMarkersToBeInitialized[i]);
                          o.push(":0");
                          if (i !== acopy.locationMarkersToBeInitialized.length - 1) o.push(",");
                      }

                      o.push("};return ");
                      o.push(tmp);
                      o.push(";}");

                      // todo; suffix for class methods
                  },

Function_: function(ast, a)
           {
               if (ast.isGenerator)
                   this.compileGenerator(ast, a);
               else
                   this.makeFuncBody(ast, a);
           },

Lambda: function(ast, a)
        {
            var acopy = shallowcopy(a);
            acopy.islamb = true;
            this.makeFuncBody(ast, acopy);
        },

Return_: function(ast, a)
         {
             var o = a.o;
             if (a.asGenerator)
             {
                 if (ast.value) throw new SyntaxError("'return' with argument inside generator");
                 // todo; StopIteration
                 o.push("return undefined");
             }
             else
             {
                 o.push("return ");
                 if (ast.value) this.visit(ast.value, a);
                 else o.push("null");
             }
         },

Assert: function(ast, a)
        {
            var o = a.o;
            o.push("if(!(");
            this.visit(ast.test, a);
            // todo; exceptions, etc.
            o.push("))sk$output('AssertionFailure:'+");

            // lame way of getting a string repr of the code; it's the
            // compiled version, but for basic stuff it's something at least
            var res = { o: [] };
            hMainCompile.visit(ast.test, res);
            var asStr = res.o.join("");
            asStr = '"' + asStr.replace(/"/g, '\\"') + '"';
            o.push(asStr);
            o.push(")");
        },

Yield_: function(ast, a)
        {
            var o = a.o;
            if (!a.asGenerator) throw "assert";

            // previous case is started before we get here so that the body of
            // other non-yield statements can be compiled

            o.push(a.locationMarkers[a.locationMarkers.length - 1]);
            o.push("++;");
            o.push("return ");
            if (ast.value) this.visit(ast.value, a);
            else o.push("null");
            o.push(";}"); // end of previous case
            o.push("case ");
            o.push(a.locationMarkerValues[a.locationMarkerValues.length - 1]++);
            o.push(":{");
        },

breakOrCont: function(ast, a, boc)
             {
                 var o = a.o;
                 if (a.asGenerator)
                 {
                     o.push(a.loopLabels[a.loopLabels.length - 1].inLoopMarker);
                     o.push("=false;");
                 }
                 o.push(boc);
                 if (a.asGenerator)
                 {
                     o.push(" " + a.loopLabels[a.loopLabels.length - 1].label);
                 }
             },
Break_: function(ast, a)
         {
             this.breakOrCont(ast, a, "break");
         },

Continue_: function(ast, a)
         {
             this.breakOrCont(ast, a, "continue");
         },

Discard: function(ast, a)
         {
             this.visit(ast.expr, a);
             a.o.push(";"); // needed here in case it's just a value
         },

CallFunc: function(ast, a)
          {
              // see comment in env.js about sk$call
              var o = a.o;
              var i;
              var kwargs = [];
              var posargs = [];
              for (i = 0; i < ast.args.length; ++i)
              {
                  if (ast.args[i] instanceof Keyword) kwargs.push(ast.args[i]);
                  else posargs.push(ast.args[i]);
              }
              
              o.push("sk$call(");
              this.visit(ast.node, a);

              // how do we pass kwargs?
              //
              // - we can't tell at call site how many args the function
              // wants, so we can't pad the positional args and have a list in
              // arguments.
              //
              // - we could try stuffing an extra argument into the the
              // sk$call, and have it store that into the function object
              // being called (ick). but that'd break for nested calls to the
              // same function.
              //
              // - so, we have to pass an additional first argument to all
              // functions. it seems unfortunate, but actually, the arg names
              // are part of the function signature for all methods (unrelated
              // to defaults, so it's required anyway). ie:
              //
              //     def f(x, y):
              //         print x,y
              //     f(y=5, x="dog")
              //
              // is fine.
              //
              // this also means all builtin and library functions must match
              // in argument names. seems an unfortunate part of python's
              // design.
              //
              // we do the unpack/rename in sk$call rather than
              // per-method. metadata is added to the function definition to
              // allow order modification based on kwargs being passed. 
              
              if (kwargs.length !== 0) o.push(", [");
              else o.push(", undefined");

              for (i = 0; i < kwargs.length; ++i)
              {
                  o.push("'");
                  o.push(kwargs[i].name);
                  o.push("',");
                  this.visit(kwargs[i].expr, a);
                  if (i !== kwargs.length - 1) o.push(",");
              }
              if (kwargs.length !== 0) o.push("]");

              if (posargs.length !== 0) o.push(", ");
              for (i = 0; i < posargs.length; ++i)
              {
                  this.visit(posargs[i], a);
                  if (i !== posargs.length - 1) o.push(",");
              }
              o.push(")");
          },

Name: function(ast, a)
      {
          var o = a.o;
          if (ast.name === "None") o.push("null");
          else if (ast.name === "True") o.push("true");
          else if (ast.name === "False") o.push("false");
          else
          {
              if (a.asGenerator && a.func.nameBindings[ast.name] === BIND_LOCAL)
              {
                  o.push(a.generatorStateName);
                  o.push(".");
              }
              o.push(ast.name);
          }
      },

Dict: function(ast, a)
      {
          var o = a.o;
          o.push("new Dict$([");
          for (var i = 0; i < ast.items.length; i += 2)
          {
              this.visit(ast.items[i], a);
              o.push(",");
              this.visit(ast.items[i + 1], a);
              if (i < ast.items.length - 2) o.push(",");
          }
          o.push("])");
      },

List: function(ast, a)
      {
          var o = a.o;
          o.push("new List$([");
          for (var i = 0; i < ast.nodes.length; ++i)
          {
              this.visit(ast.nodes[i], a);
              if (i < ast.nodes.length - 1) o.push(",");
          }
          o.push("])");
      },

compileQuals: function(quals, i, expr, tmp, a)
              {
                  var o = a.o;
                  var j;
                  o.push("sk$iter(");
                  this.visit(quals[i].list, a);
                  o.push(",function(");
                  if (!(quals[i].assign instanceof AssName)) throw "todo; non-AssName";
                  o.push(quals[i].assign.name);
                  o.push("){");
                  for (j = 0; j < quals[i].ifs.length; ++j)
                  {
                      this.visit(quals[i].ifs[j], a);
                  }
                  if (i < quals.length - 1)
                  {
                      this.compileQuals(quals, i + 1, expr, tmp, a);
                  }
                  else
                  {
                      o.push(tmp);
                      o.push(".push(");
                      this.visit(expr, a);
                      o.push(");");
                  }
                  for (j = 0; j < quals[i].ifs.length; ++j)
                      o.push("}");
                  o.push("});");
              },

ListCompIf: function(ast, a)
            {
                var o = a.o;
                //print(astDump(ast));
                o.push("if(");
                this.visit(ast.test, a);
                o.push("){");
                // the close happens in compileQuals after the other quals (fors)
            },

ListComp: function(ast, a)
          {
              var o = a.o;
              //print(JSON.stringify(ast.quals, null, 2));
              var tmp = gensym();

              // wrapper to make the whole thing an expression
              o.push("(function(){");

              // accumulator
              o.push("var ");
              o.push(tmp);
              o.push("=[];");

              // there's a list of quals (fors) and ifs on those quals
              // this is kind of complicated because our iteration needs to be
              // turned inside out too for iter: walk down the list of quals
              // so that they're nested.
              this.compileQuals(ast.quals, 0, ast.expr, tmp, a);

              // return accumulator as a pyobj
              o.push("return new List$(");
              o.push(tmp);
              o.push(");");

              // end wrapper to make whole thing an expression
              o.push("})()");
          },

GenExprTransformed: function (ast, a)
                    {
                        var o = a.o;
                        o.push("(");
                        this.visit(ast.node, a);
                        o.push(")()");
                    },

Class_: function(ast, a)
        {
            var o = a.o;
            //print(JSON.stringify(ast, null, 2));
            o.push("var " + ast.name + "=function(args,doinit){if(!(this instanceof ");
            o.push(ast.name);
            o.push(")) return new ");
            o.push(ast.name);
            // doinit is a hack to not call __init__ when we're just setting
            // up prototype chains.
            o.push("(arguments,true);if(doinit&&this.__init__!==undefined)this.__init__.apply(this, args);return this;};");
            if (ast.bases === null || ast.bases.length === 0)
                o.push(ast.name + ".prototype=new object();");
            else
            {
                if (ast.bases.length > 1) throw "todo; multiple bases";
                o.push(ast.name + ".prototype=new ");
                this.visit(ast.bases[0], a);
                o.push("();");
            }
            // todo; __module__ should only be in class I think, and then the
            // instance chains back up to to the class
            o.push(ast.name + ".__class__=sk$TypeType;");
            o.push(ast.name + ".__name__='" + ast.name + "';");
            o.push(ast.name + ".__module__='" + a.module.__name__ + "';");
            o.push(ast.name + ".__repr__=function(){return new Str$(\"<class '__main__." + ast.name + "'>\");};");
            o.push(ast.name + ".prototype.__module__='" + a.module.__name__ + "';");
            o.push(ast.name + ".prototype.__class__=" + ast.name +";");
            for (var i = 0; i < ast.code.nodes.length; ++i)
            {
                var acopy = shallowcopy(a);
                acopy.klass = ast.name;
                this.visit(ast.code.nodes[i], acopy);
            }
            o.push("undefined"); // no return in repl
        },

Import_: function(ast, a)
         {
             var o = a.o;
             var tmp = gensym();
             o.push("var ");
             o.push(tmp);
             o.push("=sk$import('");
             o.push(ast.names[0][0]); // todo; dotted, etc
             o.push("')");
         },

Add: function(ast, a) { this.binopfunc(ast, a, "+"); },
Sub: function(ast, a) { this.binopfunc(ast, a, "-"); },
Mul: function(ast, a) { this.binopfunc(ast, a, "*"); },
Div: function(ast, a) { this.binopfunc(ast, a, "/"); },
FloorDiv: function(ast, a) { this.binopfunc(ast, a, "//"); },
Mod: function(ast, a) { this.binopfunc(ast, a, "%"); },
Power: function(ast, a) { this.binopfunc(ast, a, "**"); },
LeftShift: function(ast, a) { this.binopfunc(ast, a, "<<"); },
RightShift: function(ast, a) { this.binopfunc(ast, a, ">>"); },

binopfunc: function(ast, a, opstr)
       {
           var o = a.o;
           o.push("sk$binop(");
           this.visit(ast.left, a);
           o.push(",");
           this.visit(ast.right, a);
           o.push(",'");
           o.push(opstr);
           o.push("'");
           o.push(")");
       },

// have to be ops to short circuit, todo; need a __nonzero__ or something here
Or: function(ast, a) { this.binopop(ast, a, "||"); },
And: function(ast, a) { this.binopop(ast, a, "&&"); },
Bitor: function(ast, a) { this.binopop(ast, a, "|"); },
Bitxor: function(ast, a) { this.binopop(ast, a, "^"); },
Bitand: function(ast, a) { this.binopop(ast, a, "&"); },

binopop: function(ast, a, opstr)
         {
             for (var i = 0; i < ast.nodes.length; ++i)
             {
                 this.visit(ast.nodes[i], a);
                 if (i !== ast.nodes.length - 1) a.o.push(opstr);
             }
         }
};


function compile(ast, module)
{
    //print(astDump(ast));
    hConvertGeneratorExpressionsToFunctions.visit(ast, {});
    hMarkGeneratorFunctions.visit(ast, {});
    hAnnotateBlocksWithBindings.visit(ast, { currentBlocks: [] });
    hMakeNoReturnANull.visit(ast, {});
    var result = [];
    hMainCompile.visit(ast, { o: result, module: module });
    return result.join(""); 
}

//
//
//
// Main entry points
//
//
//
function compileStr(filename, input, module)
{
    if (!module) module = new Module$("__main__", filename);
    var ast = transform(parse(filename, input));
    return compile(ast, module);
}

function compileUrlAsync(url, oncomplete)
{
    // xmlhttp the url and compileStr it
    throw "todo;";
}
 
function InteractiveContext()
{
    this.p = makeParser("<stdin>", 'single_input');
}
InteractiveContext.prototype.evalLine = function(line)
{
    var ret = this.p(line);
    //print(parseTestDump(ret));
    //print("ret:"+ret);
    if (ret)
    {
        return compile(transform(ret), new Module$("__main__"));
    }
    return false;
};
// NOTE: needs to be in sync with test/footer_test.js

    return {
compileStr: compileStr,
compileUrlAsync: compileUrlAsync,
InteractiveContext: InteractiveContext,

// internal methods, mostly exposed here for unit tests
Tokenizer: Tokenizer,
_parse: parse,
_transform: transform,
_compile: compile,
_parseTables: SkulptParseTables,
consts$: {}
    };
}());
