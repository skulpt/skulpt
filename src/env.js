/**
 * Base namespace for Skulpt. This is the only symbol that Skulpt adds to the
 * global namespace. Other user accessible symbols are noted and described
 * below.
 */

var Sk = Sk || {};

/**
 * Replacable output redirection (called from print, etc).
 */
Sk.output = function(x) {};
goog.exportSymbol("Sk.output", Sk.output);

/**
 * Replacable function to load modules with (called via import, etc.)
 */
Sk.read = function(x) { throw "Sk.read has not been implemented"; };
goog.exportSymbol("Sk.read", Sk.read);

/**
 * Setable to emulate arguments to the script. Should be array of JS strings.
 */
Sk.sysargv = [];
goog.exportSymbol("Sk.sysargv", Sk.sysargv);

/**
 * Setable to emulate PYTHONPATH environment variable (for finding modules).
 * Should be an array of JS strings.
 */
Sk.syspath = [];
goog.exportSymbol("Sk.syspath", Sk.syspath);

Sk.inBrowser = goog.global.document !== undefined;

(function() {
    // set up some sane defaults based on availability
    if (goog.global.write !== undefined) Sk.output = goog.global.write;
    else if (goog.global.console !== undefined && goog.global.console.log !== undefined) Sk.output = function (x) {goog.global.console.log(x);};
    else if (goog.global.print !== undefined) Sk.output = goog.global.print;

    // todo; this should be an async api
    if (goog.global.read !== undefined) Sk.read = goog.global.read;
}());

// override for closure to load stuff from the command line.
if (!Sk.inBrowser)
{
    goog.writeScriptTag_ = function(src)
    {
        if (!goog.dependencies_.written[src])
        {
            goog.dependencies_.written[src] = true;
            goog.global.eval(goog.global.read("support/closure-library/closure/goog/" + src));
        }
    };
}

goog.require("goog.asserts");

