/**
 * Base namespace for Skulpt. This is the only symbol that Skulpt adds to the
 * global namespace. Other user accessible symbols are noted and described
 * below.
 */

var Sk = Sk || {};
//goog.exportSymbol('Sk', Sk);

/**
 * Replacable output redirection (called from print, etc).
 */
Sk.output = function(x) {};
goog.exportSymbol("Sk.output", Sk.output);

/**
 * Replacable function to load modules with (called via import, etc.)
 */
Sk.load = function(x) { throw "Sk.load has not been implemented"; };
goog.exportSymbol("Sk.load", Sk.load);

/**
 * Setable to emulate arguments to the script. Should be array of JS strings.
 */
Sk.sysargv = [];
goog.exportSymbol("Sk.sysargv", Sk.sysargv);


(function() { var $ = Sk;

// where code objects, etc. get stored
Sk.consts = {};

// dictionary of special/builtin type objects
Sk.types = {};

Sk.stdmodules = {};



// this tries to implement something like:
// http://docs.python.org/reference/simple_stmts.html#the-import-statement
Sk.import_ = function import_(name)
{
    /*
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
        var js = Sk.compileStr(filename, contents, module);
        //print(js);
        eval(js);
    }

    return module;
    */
};


// builtins are supposed to come from the __builtin__ module, but we don't do
// that yet.
Sk.builtin = {};

Sk.builtin.range = function range(start, stop, step)
{
    var ret = [];
    var s = new Sk.builtin.slice(start, stop, step);
    s.sssiter$(0, function(i) { ret.push(i); });
    return new Sk.builtin.list(ret);
};

Sk.builtin.len = function len(item)
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

/*
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
*/

Sk.builtin.repr = function repr(x)
{
    return Sk.misceval.objectRepr(x);
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
    if (value instanceof Object && value.tp$hash !== undefined)
    {
        if (value.$savedHash_) return value.$savedHash_;
        value.$savedHash_ = 'custom ' + value.tp$hash();
        return value.$savedHash_;
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

}());
