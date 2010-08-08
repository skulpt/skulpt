/**
 * Base namespace for Skulpt. This is the only symbol that Skulpt adds to the
 * global namespace. Other user accessible symbols are noted and described
 * below.
 */

var Sk = Sk || {};
goog.exportSymbol('Sk', Sk);

/**
 * Replacable output redirection (called from print, etc).
 */
Sk.output = function(x) {};
goog.exportProperty(Sk, "Sk.output", Sk.output);

/**
 * Replacable function to load modules with (called via import, etc.)
 */
Sk.load = function(x) { throw "Sk.load has not been implemented"; },
goog.exportProperty(Sk, "Sk.load", Sk.load);

/**
 * Setable to emulate arguments to the script. Should be array of JS strings.
 */
Sk.sysargv = [];
goog.exportProperty(Sk, "Sk.sysargv", Sk.sysargv);


(function() { var $ = Sk;

// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
//
//
// Everything below here is considered 'internal'. Runtime functions called
// by the compiler.
//
//
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------

// where code objects, etc. get stored
Sk.consts = {};

// dictionary of special/builtin type objects
Sk.types = {};

Sk.stdmodules = {};



//
// a wide variety of implementation details. these are generally
// functions called by the compiler to implement details of the language.
//

Sk.neg = function neg(self)
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
};

Sk.not = function not(self)
{
    // todo; this should use __nonzero__/length, etc.
    return !self;
};

Sk.in_ = function in_(lhs, rhs)
{
    if (lhs.constructor === $.builtin.str && rhs.constructor === $.builtin.str)
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
};

Sk.cmp = function cmp(lhs, rhs, op)
{
    if (op === 'is') return lhs === rhs;
    if (op === 'is not') return lhs !== rhs;
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
        // todo; lookup
        /* __cmp__ never defined right now
        else if (lhs.__cmp__ !== undefined)
            ret = lhs.__cmp__(rhs);
        else if (rhs.__cmp__ !== undefined)
            ret = -rhs.__cmp__(lhs);
        else if (lhs.__class__.__cmp__ !== undefined)
            ret = lhs.__class__.__cmp__(lhs, rhs);
        else if (rhs.__class__.__cmp__ !== undefined)
            ret = -rhs.__class__.__cmp__(rhs, lhs);
        */
        else
        {
            // todo; dispatch to the specific __eq__, etc.
            throw new Sk.builtin.AttributeError("no attribute __cmp__");
        }

        /*
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
        */
    }
};

Sk.softspace = false;
Sk.print = function print(x)
{
    if ($.softspace)
    {
        $.output(' ');
        $.softspace = false;
    }
    var s = $.builtin.str(x);
    $.output(s.v);
    var isspace = function(c)
    {
        return c === '\n' || c === '\t' || c === '\r';
    };
    if (s.v.length === 0 || !isspace(s.v[s.v.length - 1]) || s.v[s.v.length - 1] === ' ')
        $.softspace = true;
};

Sk.opFuncs = {
    "Add": "__add__",
    "Sub": "__sub__",
    "Mult": "__mul__",
    "Div": "__truediv__",
    "FloorDiv": "__floordiv__",
    "Mod": "__mod__",
    "Pow": "__pow__",
    "LShift": "__lshift__",
    "RShift": "__rshift__",
    "BitAnd": "__and__",
    "BitOr": "__or__",
    "BitXor": "__xor__"
};

Sk.opRFuncs = {
    "Add": "__radd__",
    "Sub": "__rsub__",
    "Mult": "__rmul__",
    "Div": "__rtruediv__",
    "FloorDiv": "__rfloordiv__",
    "Mod": "__rmod__",
    "Pow": "__rpow__",
    "LShift": "__rlshift__",
    "RShift": "__rrshift__",
    "BitAnd": "__rand__",
    "BitOr": "__ror__",
    "BitXor": "__rxor__"
};

Sk.opIFuncs = {
    "Add": "__iadd__",
    "Sub": "__isub__",
    "Mult": "__imul__",
    "Div": "__itruediv__",
    "FloorDiv": "__ifloordiv__",
    "Mod": "__imod__",
    "Pow": "__ipow__", // todo; modulo
    "LShift": "__ilshift__",
    "RShift": "__irshift__",
    "BitAnd": "__iand__",
    "BitOr": "__ior__",
    "BitXor": "__ixor__"
};


Sk.boNumPromote = {
    "Add": function(a, b) { return a + b; },
    "Sub": function(a, b) { return a - b; },
    "Mult": function(a, b) { return a * b; },
    "Mod": function(a, b) { return a % b; },
    "Pow": Math.pow,
    "BitAnd": function(a, b) { return a & b; },
    "BitOr": function(a, b) { return a | b; },
    "BitXor": function(a, b) { return a ^ b; }
};
Sk.binop = function binop(lhs, rhs, op)
{
    var numPromote = $.boNumPromote;
    var numPromoteFunc = numPromote[op];
    if (numPromoteFunc !== undefined)
    {
        var tmp = $.numOpAndPromotion(lhs, rhs, numPromoteFunc);
        if (typeof tmp === "number")
        {
            return tmp;
        }
        lhs = tmp[0];
        rhs = tmp[1];
    }

    var func = $.opFuncs[op];
    var rfunc = $.opRFuncs[op];
    if (!func || !rfunc) throw "assert";

    if (lhs[func] !== undefined)
        return lhs[func](rhs);
    if (rhs[rfunc] !== undefined)
        return rhs[rfunc](lhs);

    throw new TypeError("unsupported operand type(s) for " + op + ": '" +
            $.typename(lhs) + "' and '" + $.typename(rhs) + "'");

};

Sk.ipNumPromote = {
    "Add": function(a, b) { return a + b; },
    "Sub": function(a, b) { return a - b; },
    "Mult": function(a, b) { return a * b; },
    "Div": function(a, b) { return a / b; },
    "FloorDiv": Math.floor,
    "Mod": function(a, b) { return a + b; },
    "Pow": Math.pow,
    "LShift": function(a, b) { return a << b; },
    "RShift": function(a, b) { return a >> b; },
    "BitAnd": function(a, b) { return a & b; },
    "BitOr": function(a, b) { return a | b; },
    "BitXor": function(a, b) { return a ^ b; }
};
Sk.inplacebinop = function(lhs, rhs, op)
{
    var numPromote = $.ipNumPromote;
    var numPromoteFunc = numPromote[op];
    if (numPromoteFunc !== undefined)
    {
        var tmp = $.numOpAndPromotion(lhs, rhs, numPromoteFunc);
        if (typeof tmp === "number")
            return tmp;
        lhs = tmp[0];
        rhs = tmp[1];
    }

    var opname = $.opIFuncs[op];
    if (lhs[opname] !== undefined)
    {
        return lhs[opname](rhs);
    }
    else
    {
        var opname2 = $.opFuncs[op.substring(0, op.length - 1)];
        if (lhs[opname2] !== undefined)
        {
            return lhs[opname2](rhs);
        }
        else
        {
            throw "AttributeError: " + opname + " or " + opname2 + " not found on " + $.typename(lhs);
        }
    }
};

Sk.lookupAttrOnClass = function lookupAttrOnClass(o, attrname)
{
    if (o.__class__ === undefined) return undefined;

    // todo; mro, etc.
    var klass = o.__class__;
    var findIn = function(k)
    {
        //print("k-------------:", $.builtin.repr(k).v);
        for (var i in k)
        {
            //print("i", i)
            if (k.hasOwnProperty(i)
                    && i === attrname)
            {
                return k[attrname];
            }
        }
        //print("k.bases:",k.__bases__);
        if (k.__bases__.v.length === 0) return undefined;
        //print($.builtin.repr(k.__bases__).v);
        return findIn(k.__bases__.v[0]); // todo; multiple bases
    };
    return findIn(klass);
};

// descriptors are some crazy crap. see:
//   http://www.python.org/download/releases/2.2/descrintro/
//   http://stackoverflow.com/questions/852308/how-the-method-resolution-and-invocation-works-internally-in-python/870650#870650
// we only implement "non-data descriptors", currently since that's
// what's needed for methods.
Sk.getattr = function getattr(o, attrname, default_)
{
    //print("getattr", o, attrname);
    if (o === undefined)
    {
        throw "trying to lookup " + attrname + " on undefined";
    }
    var classAttrValue = $.lookupAttrOnClass(o, attrname);
    //print("classAttrValue", classAttrValue);
    var instanceAttrValue = o[attrname];
    if (instanceAttrValue !== undefined)
    {
        //print("have instance value", instanceAttrValue, o.__class__);
        if (o.__class__) // probably should be instanceof Type$?
        {
            if (instanceAttrValue instanceof Function) // special case, function should have a __get__
            {
                return Sk.fget(instanceAttrValue, null, o); // == (the_obj (function, etc), unbound, to_what (owner))
            }
            var getdesc1 = $.lookupAttrOnClass(o, '__get__');
            //print("getdesc1 in here", getdesc1);
            if (getdesc1 !== undefined)
                return getdesc1(instanceAttrValue, null, o); // == (the_obj (function, etc), unbound, to_what (owner))
            return instanceAttrValue;
        }
    }

    if (classAttrValue === undefined)
    {
        //print("no class value either", o.__getattr__);
        if (o.__getattr__ !== undefined)
        {
            //print("attrname", attrname);
            var v = o.__getattr__(attrname);
            //print("getattr got", v);
            return v;
        }
        //print("default_", default_);
        if (default_ !== undefined)
        {
            //print("returning default", default_);
            return default_;
        }
        throw new Sk.builtin.AttributeError(attrname + " not found");
    }

    var getdesc2 = undefined; // todo; never set now according to closure //classAttrValue.__get__;
    if (getdesc2 === undefined && classAttrValue instanceof Function && o.nativeclass$)
        getdesc2 = $.fget;
    //print("getdesc2:",getdesc2);
    if (getdesc2 !== undefined)
    {
        //print("had get on o", $.builtin.repr(o).v);
        return getdesc2(classAttrValue, o, o.__class__); // == (the_obj, bound_to, to_what (owner))
    }

    return classAttrValue;
};

Sk.setattr = function setattr(object, name, value)
{
    // todo; __set__ i guess
    var setter = $.lookupAttrOnClass(object, '__setattr__');
    if (setter)
    {
        setter.apply(object, name, value);
    }
    throw new Sk.builtin.AttributeError("no __setattr__"); // todo; this might be wrong
};

// load a name, searching in various locations, and always ending in globals and builtins
Sk.loadname = function(name /*, locations*/)
{
    for (var i = 1; i < arguments.length; ++i)
    {
        var v = arguments[i][name];
        if (v !== undefined) return v;
    }

    var bi = $.builtin[name];
    if (bi !== undefined) return bi;

    print("HI!");

    // todo; should be NameError
    throw new ReferenceError("name '" + name + "' is not defined");
};

goog.exportSymbol("Sk.loadname", Sk.loadname);

Sk.storename = function storename(name, value, globals /*, locations*/)
{
    for (var i = 3; i < arguments.length; ++i)
    {
        var v = arguments[i][name];
        if (v !== undefined)
        {
            arguments[i][name] = value;
            return;
        }
    }
    globals[name] = value;
};

Sk.delname = function delname(name, loc)
{
    // todo; throw if not there
    delete loc[name];
};

Sk.inherits = function inherits(ctor, bases)
{
    if (bases.v.length === 0)
    {
        ctor.prototype = new $.builtin.object();
        ctor.__bases__ = new Sk.builtin.list([Sk.types.object]);
    }
    else if (bases.v.length === 1)
    {
        ctor.prototype = new bases.v[0]();
        ctor.__bases__ = new Sk.builtin.list(bases.v);
    }
    else
        throw new Sk.builtin.SyntaxError("multiple bases not implemented yet");

};

// unfortunately (at least pre-ecmascript 5) there's no way to make objects be
// both callable and have arbitrary prototype chains.
// http://stackoverflow.com/questions/548487/how-do-i-make-a-callable-js-object-with-an-arbitrary-prototype
// todo; look into modifying Function.prototype call/apply.. does that work properly?
// so, in order to support __call__ on objects we have to wrap all
// python-level calls in a call that checks if the target is an object that
// has a __call__ attribute so we can dispatch to it. sucky.
// additionally, this handles remapping kwargs to the correct locations.
Sk.call = function call(obj, kwargs)
{
    var args = Array.prototype.slice.call(arguments, 2);
    if (kwargs !== undefined)
    {
        for (var i = 0; i < kwargs.length; i += 2)
        {
            var kwargname = kwargs[i];
            var kwargvalue = kwargs[i + 1];
            if (obj.argnames$ === undefined) throw obj + " has no argnames";
            //print(obj.argnames$);
            var index = obj.argnames$.indexOf(kwargname);
            //print(kwargname,"is",kwargvalue.v,"at",index);
            args[index] = kwargvalue;
        }
        //print(JSON2.stringify(args));
    }
    //try
    //{
        return obj.apply("UNK", args);
    /*}
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
    */
};

// this tries to implement something like:
// http://docs.python.org/reference/simple_stmts.html#the-import-statement
Sk.import_ = function import_(name)
{
    //
    // find the module. we don't do any of the PEP 302 stuff yet (or hardcode
    // it at least).
    //
    var contents;
    var filename;

    // try system modules first
    if ($.stdmodules[name] !== undefined)
    {
        contents = $.stdmodules[name];
    }

    $.syspath = new $.builtin.list([new $.builtin.str('test/run')]); // todo; this shouldn't be necessary

    if (!contents)
    {
        (function() {
         // then user modules
         for (var iter = $.syspath.__iter__(), i = iter.next(); i !== undefined; i = iter.next())
         {
             try
             {
                 filename = i.v + "/" + name + ".pyc";
                 contents = $.load(filename);
                 return;
             } catch (e) {}
         }
         throw new Sk.builtin.ImportError("no module named " + name);
        }());
    }
    
    // todo; check in sys.modules for previous load/init

    //
    // initialize the module
    //
    var module = new $.module(name, filename);
    $.modules.__setitem__(new $.builtin.str(name), module);

    if (filename === undefined) // native
    {
        // if it's native the contents is actually a function that does setup
        contents(module);
    }
    else
    {
        /*
        var js = Sk.compileStr(filename, contents, module);
        //print(js);
        eval(js);
        */
    }

    return module;
};

// todo; this function smells wrong
Sk.typename = function(o)
{
    if (typeof o === "number") return $.types.int_.name;
    if (o.__class__ === undefined) return typeof o; // in case we haven't handled for this type yet
    return o.__class__.__name__;
};


// builtins are supposed to come from the __builtin__ module, but we don't do
// that yet.
Sk.builtin = {};

Sk.builtin.range = function range(start, stop, step)
{
    var ret = [];
    var s = new $.builtin.slice(start, stop, step);
    s.sssiter$(0, function(i) { ret.push(i); });
    return new $.builtin.list(ret);
};

Sk.len = function len(item)
{
    // todo; dispatch to __len__
    if (item instanceof $.builtin.str || item instanceof $.builtin.list || item instanceof $.builtin.tuple)
    {
        return item.v.length;
    }
    else if (item instanceof $.builtin.dict)
    {
        return item.size;
    }
    else
    {
        throw "AttributeError: no attribute __len__";
    }
};

Sk.builtin.min = function min()
{
    // todo; throw if no args
    var lowest = arguments[0];
    for (var i = 1; i < arguments.length; ++i)
    {
        if (arguments[i] < lowest)
            lowest = arguments[i];
    }
    return lowest;
};

Sk.builtin.max = function max()
{
    // todo; throw if no args
    var highest = arguments[0];
    for (var i = 1; i < arguments.length; ++i)
    {
        if (arguments[i] > highest)
            highest = arguments[i];
    }
    return highest;
};

Sk.builtin.abs = function abs(x)
{
    return Math.abs(x);
};

Sk.builtin.ord = function ord(x)
{
    if (x.constructor !== $.builtin.str || x.v.length !== 1)
    {
        throw "ord() expected string of length 1";
    }
    return (x.v).charCodeAt(0);
};

Sk.builtin.chr = function chr(x)
{
    if (typeof x !== "number")
    {
        throw "TypeError: an integer is required";
    }
    return new $.builtin.str(String.fromCharCode(x));
};

Sk.builtin.dir = function dir(x)
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
            if (x.hasOwnProperty(k) && k.indexOf("$") === -1)
            {
                names.push(new $.builtin.str(k));
            }
        }
    }
    names.sort(function(a, b) { return (a.v > b.v) - (a.v < b.v); });
    return new $.builtin.list(names);
};

Sk.builtin.repr = function repr(x)
{
    var ret;
    if (typeof x === "number") ret = x.toString();
    else if (x === true) ret = "True";
    else if (x === false) ret = "False";
    else if (x === null) ret = "None";
    else if (x.__repr__ !== undefined)
        return x.__repr__();
    return new $.builtin.str(ret);
};

Sk.builtin.open = function open(filename, mode, bufsize)
{
    if (mode === undefined) mode = "r";
    if (mode !== "r" && mode !== "rb") throw "todo; haven't implemented non-read opens";
    return new Sk.builtin.file(filename, mode, bufsize);
};

Sk.builtin.hashCount = 0;
Sk.builtin.hash = function hash(value)
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
            $.builtin.hashCount += 1;
            value.__id = 'object ' + $.builtin.hashCount;
        }
        return value.__id;
    }
    return (typeof value) + ' ' + String(value);

    // todo; throw properly for unhashable types
};

Sk.builtin.getattr = function getattr(object, name, default_)
{
    return $.getattr(object, name.v, default_);
};

// set up some sane defaults based on availability
if (goog.global.write !== undefined) $.output = goog.global.write;
else if (goog.global.console !== undefined && goog.global.console.log !== undefined) $.output = function (x) {goog.global.console.log(x);};
else if (goog.global.print !== undefined) $.output = goog.global.print;

// todo; this should be an async api
if (goog.global.read !== undefined) $.load = goog.global.read;

return $;

}());
