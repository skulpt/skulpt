// this is stored into sys specially, rather than created by sys
Sk.sysmodules = new Sk.builtin.dict([]);

Sk.builtin.__import__ = function(name, globals, locals, fromlist)
{
    return Sk.importModule(name);
};

if (COMPILED)
{
    var print = function(x) {};
    var js_beautify = function(x) {};
}

Sk.importSearchPathForName = function(name, ext, failok)
{
    var L = Sk.realsyspath;
    for (var it = L.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
    {
        var fn = i.v + "/" + name + ext
        try {
            // todo; lame, this is the only way we have to test existence right now
            Sk.read(fn);
            return fn;
        } catch (e) {};
    }
    if (!failok)
        throw new Sk.builtin.ImportError("No module named " + name);
};

/**
 * @param {string} name the module name
 * @param {boolean=} dumpJS print out the js code after compilation for debugging
 * @param {string=} modname module name to use to eval (defaults to 'name',
 * but can be overridden)
 */
Sk.importModule = function(name, dumpJS, modname)
{
    // currently only pull once from Sk.syspath. User might want to change
    // from js or from py.
    if (!Sk.realsyspath)
    {
        var paths = [ new Sk.builtin.str("src/builtin"), new Sk.builtin.str(".") ];
        for (var i = 0; i < Sk.syspath.length; ++i)
            paths.push(new Sk.builtin.str(Sk.syspath[i]));
        Sk.realsyspath = new Sk.builtin.list(paths);
    }

    // if already in sys.modules, return it
    var prev = Sk.sysmodules.mp$subscript(name);
    if (prev !== undefined) return prev;

    if (modname === undefined) modname = name;

    // otherwise:
    // - create module object
    // - add module object to sys.modules
    // - compile source to (function(){...});
    // - run module and set the module locals returned to the module __dict__
    var module = new Sk.builtin.module(name);
    Sk.sysmodules.mp$ass_subscript(name, module);
    var filename, co;

    // if we have it as a builtin (i.e. already in JS) module then load that.
    var builtinfn = Sk.importSearchPathForName(name, ".js", true);
    if (builtinfn)
        filename = builtinfn;
    else
        filename = Sk.importSearchPathForName(name, ".py");

    var source = Sk.read(filename);

    // then either compile or just return the code
    if (builtinfn)
        co = { funcname: "$builtinmodule", code: source };
    else
        co = Sk.compile(source, filename, "exec");

    module.$js = co.code; // todo; only in DEBUG?
    var finalcode = co.code;

    if (!COMPILED)
    {
        if (dumpJS)
        {
            print("-----");
            var withLineNumbers = function(code)
            {
                var beaut = js_beautify(co.code);
                var lines = beaut.split("\n");
                for (var i = 1; i <= lines.length; ++i)
                {
                    var width = ("" + i).length;
                    var pad = "";
                    for (var j = width; j < 5; ++j) pad += " ";
                    lines[i - 1] = "/* " + pad + i + " */ " + lines[i - 1];
                }
                return lines.join("\n");
            };
            finalcode = withLineNumbers(co.code);
            print(finalcode);
        }
    }

    var namestr = "new Sk.builtin.str('" + modname + "')";
    finalcode += "\n" + co.funcname + "(" + namestr + ");";
    var modlocs = goog.global.eval(finalcode);

    // pass in __name__ so the module can set it (so that the code can access
    // it), but also set it after we're done so that builtins don't have to
    // remember to do it.
    if (!modlocs.__name__)
        modlocs.__name__ = new Sk.builtin.str(modname);

    module.inst$dict = modlocs;

    return module;
};

Sk.importMain = function(name, dumpJS)
{
    return Sk.importModule(name, dumpJS, "__main__");
};

goog.exportSymbol("Sk.importMain", Sk.importMain);
