/**
 * Base namespace for Skulpt. This is the only symbol that Skulpt adds to the
 * global namespace. Other user accessible symbols are noted and described
 * below.
 */

var Sk = Sk || {};

/**
 *
 * Set various customizable parts of Skulpt.
 *
 * output: Replacable output redirection (called from print, etc.).
 * read: Replacable function to load modules with (called via import, etc.)
 * sysargv: Setable to emulate arguments to the script. Should be an array of JS
 * strings.
 * syspath: Setable to emulate PYTHONPATH environment variable (for finding
 * modules). Should be an array of JS strings.
 *
 * Any variables that aren't set will be left alone.
 */
Sk.configure = function(options)
{
    Sk.output = options["output"] || Sk.output;
    goog.asserts.assert(typeof Sk.output === "function");

    Sk.debugout = options["debugout"] || Sk.debugout;
    goog.asserts.assert(typeof Sk.debugout === "function");

    Sk.read = options["read"] || Sk.read;
    goog.asserts.assert(typeof Sk.read === "function");

    Sk.timeoutMsg = options["timeoutMsg"] || Sk.timeoutMsg;											// RNL
    goog.asserts.assert(typeof Sk.timeoutMsg === "function");										// RNL
	goog.exportSymbol("Sk.timeoutMsg", Sk.timeoutMsg);

    Sk.sysargv = options["sysargv"] || Sk.sysargv;
    goog.asserts.assert(goog.isArrayLike(Sk.sysargv));

    Sk.python3 = options["python3"] || Sk.python3;
    goog.asserts.assert(typeof Sk.python3 === "boolean");
    
    if (options["syspath"])
    {
        Sk.syspath = options["syspath"];
        goog.asserts.assert(goog.isArrayLike(Sk.syspath));
        // assume that if we're changing syspath we want to force reimports.
        // not sure how valid this is, perhaps a separate api for that.
        Sk.realsyspath = undefined;
        Sk.sysmodules = new Sk.builtin.dict([]);
    }

    Sk.misceval.softspace_ = false;
};
goog.exportSymbol("Sk.configure", Sk.configure);

/*
*	Replaceable message for message timeouts
*/
Sk.timeoutMsg=function() { return "Program exceeded run time limit."; }
goog.exportSymbol("Sk.timeoutMsg", Sk.timeoutMsg);

/*
 * Replacable output redirection (called from print, etc).
 */
Sk.output = function(x) {};

/*
 * Replacable function to load modules with (called via import, etc.)
 * todo; this should be an async api
 */
Sk.read = function(x) { throw "Sk.read has not been implemented"; };

/*
 * Setable to emulate arguments to the script. Should be array of JS strings.
 */
Sk.sysargv = [];

// lame function for sys module
Sk.getSysArgv = function()
{
    return Sk.sysargv;
};
goog.exportSymbol("Sk.getSysArgv", Sk.getSysArgv);


/**
 * Setable to emulate PYTHONPATH environment variable (for finding modules).
 * Should be an array of JS strings.
 */
Sk.syspath = [];

Sk.inBrowser = goog.global['document'] !== undefined;

/**
 * Internal function used for debug output.
 * @param {...} args
 */
Sk.debugout = function(args) {};

(function() {
    // set up some sane defaults based on availability
    if (goog.global['write'] !== undefined) Sk.output = goog.global['write'];
    else if (goog.global['console'] !== undefined && goog.global['console']['log'] !== undefined) Sk.output = function (x) {goog.global['console']['log'](x);};
    else if (goog.global['print'] !== undefined) Sk.output = goog.global['print'];

    if (goog.global['print'] !== undefined) Sk.debugout = goog.global['print'];
}());

// override for closure to load stuff from the command line.
if (!Sk.inBrowser)
{
    goog.global.CLOSURE_IMPORT_SCRIPT = function(src)
    {
        goog.global['eval'](goog.global['read']("support/closure-library/closure/goog/" + src));
        return true;
    };
}


Sk.python3 = false;
goog.exportSymbol("Sk.python3",Sk.python3)

goog.require("goog.asserts");

