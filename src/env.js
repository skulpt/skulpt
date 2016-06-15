/**
 * Base namespace for Skulpt. This is the only symbol that Skulpt adds to the
 * global namespace. Other user accessible symbols are noted and described
 * below.
 */

var Sk = Sk || {}; //jshint ignore:line

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
 * nonreadopen: Boolean - set to true to allow non-read file operations
 * fileopen: Optional function to call any time a file is opened
 * filewrite: Optional function to call when writing to a file
 *
 * Any variables that aren't set will be left alone.
 */
Sk.configure = function (options) {
    "use strict";
    Sk.output = options["output"] || Sk.output;
    goog.asserts.assert(typeof Sk.output === "function");

    Sk.debugout = options["debugout"] || Sk.debugout;
    goog.asserts.assert(typeof Sk.debugout === "function");

    Sk.uncaughtException = options["uncaughtException"] || Sk.uncaughtException;
    goog.asserts.assert(typeof Sk.uncaughtException === "function");

    Sk.read = options["read"] || Sk.read;
    goog.asserts.assert(typeof Sk.read === "function");

    Sk.nonreadopen = options["nonreadopen"] || false;
    goog.asserts.assert(typeof Sk.nonreadopen === "boolean");

    Sk.fileopen = options["fileopen"] || undefined;
    goog.asserts.assert(typeof Sk.fileopen === "function" || typeof Sk.fileopen === "undefined");

    Sk.filewrite = options["filewrite"] || undefined;
    goog.asserts.assert(typeof Sk.filewrite === "function" || typeof Sk.filewrite === "undefined");

    Sk.timeoutMsg = options["timeoutMsg"] || Sk.timeoutMsg;
    goog.asserts.assert(typeof Sk.timeoutMsg === "function");
    goog.exportSymbol("Sk.timeoutMsg", Sk.timeoutMsg);

    Sk.sysargv = options["sysargv"] || Sk.sysargv;
    goog.asserts.assert(goog.isArrayLike(Sk.sysargv));

    Sk.__future__ = options["__future__"] || {
        print_function: false,
        division: false,
        absolute_import: null,
        unicode_literals: false,
        // skulpt specific
        set_repr: false,
        class_repr: false,
        inherit_from_object: false
    };

    if (Sk.__future__.print_function === undefined || Sk.__future__.print_function === null || typeof Sk.__future__.print_function !== "boolean") {
        throw new Error("must specify Sk.__future__.print_function and it must be a boolean");
    }

    if (Sk.__future__.division === undefined || Sk.__future__.division === null || typeof Sk.__future__.division !== "boolean") {
        throw new Error("must specify Sk.__future__.division and it must be a boolean");
    }

    if (Sk.__future__.unicode_literals === undefined || Sk.__future__.unicode_literals === null || typeof Sk.__future__.unicode_literals !== "boolean") {
        throw new Error("must specify Sk.__future__.unicode_literals and it must be a boolean");
    }

    if (Sk.__future__.set_repr === undefined || Sk.__future__.set_repr === null || typeof Sk.__future__.set_repr !== "boolean") {
        throw new Error("must specify Sk.__future__.set_repr and it must be a boolean");
    }

    if (Sk.__future__.class_repr === undefined || Sk.__future__.class_repr === null || typeof Sk.__future__.class_repr !== "boolean") {
        throw new Error("must specify Sk.__future__.class_repr and it must be a boolean");
    }

    if (Sk.__future__.inherit_from_object === undefined || Sk.__future__.inherit_from_object === null || typeof Sk.__future__.inherit_from_object !== "boolean") {
        throw new Error("must specify Sk.__future__.inherit_from_object and it must be a boolean");
    }

    // in __future__ add checks for absolute_import

    Sk.imageProxy = options["imageProxy"] || "http://localhost:8080/320x";
    goog.asserts.assert(typeof Sk.imageProxy === "string");

    Sk.inputfun = options["inputfun"] || Sk.inputfun;
    goog.asserts.assert(typeof Sk.inputfun === "function");
    
    Sk.retainGlobals = options["retainglobals"] || false;
    goog.asserts.assert(typeof Sk.retainGlobals === "boolean");

    Sk.debugging = options["debugging"] || false;
    goog.asserts.assert(typeof Sk.debugging === "boolean");

    Sk.breakpoints = options["breakpoints"] || function() { return true; };
    goog.asserts.assert(typeof Sk.breakpoints === "function");

    Sk.setTimeout = options["setTimeout"];
    if (Sk.setTimeout === undefined) {
        if (typeof setTimeout === "function") {
            Sk.setTimeout = function(func, delay) { setTimeout(func, delay); };
        } else {
            Sk.setTimeout = function(func, delay) { func(); };
        }
    }
    goog.asserts.assert(typeof Sk.setTimeout === "function");

    if ("execLimit" in options) {
        Sk.execLimit = options["execLimit"];
    }

    if ("yieldLimit" in options) {
        Sk.yieldLimit = options["yieldLimit"];
    }

    if (options["syspath"]) {
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
* Replaceable handler for uncaught exceptions
*/
Sk.uncaughtException = function(err) {
    throw err;
};

/*
 * Replaceable handler for uncaught exceptions
 */
Sk.uncaughtException = function(err) {
    throw err;
};
goog.exportSymbol("Sk.uncaughtException", Sk.uncaughtException);

/*
 *	Replaceable message for message timeouts
 */
Sk.timeoutMsg = function () {
    return "Program exceeded run time limit.";
};
goog.exportSymbol("Sk.timeoutMsg", Sk.timeoutMsg);

/*
 *  Hard execution timeout, throws an error. Set to null to disable
 */
Sk.execLimit = Number.POSITIVE_INFINITY;

/*
 *  Soft execution timeout, returns a Suspension. Set to null to disable
 */
Sk.yieldLimit = Number.POSITIVE_INFINITY;

/*
 * Replacable output redirection (called from print, etc).
 */
Sk.output = function (x) {
};

/*
 * Replacable function to load modules with (called via import, etc.)
 * todo; this should be an async api
 */
Sk.read = function (x) {
    throw "Sk.read has not been implemented";
};

/*
 * Setable to emulate arguments to the script. Should be array of JS strings.
 */
Sk.sysargv = [];

// lame function for sys module
Sk.getSysArgv = function () {
    return Sk.sysargv;
};
goog.exportSymbol("Sk.getSysArgv", Sk.getSysArgv);


/**
 * Setable to emulate PYTHONPATH environment variable (for finding modules).
 * Should be an array of JS strings.
 */
Sk.syspath = [];

Sk.inBrowser = goog.global["document"] !== undefined;

/**
 * Internal function used for debug output.
 * @param {...} args
 */
Sk.debugout = function (args) {
};

(function () {
    // set up some sane defaults based on availability
    if (goog.global["write"] !== undefined) {
        Sk.output = goog.global["write"];
    } else if (goog.global["console"] !== undefined && goog.global["console"]["log"] !== undefined) {
        Sk.output = function (x) {
            goog.global["console"]["log"](x);
        };
    } else if (goog.global["print"] !== undefined) {
        Sk.output = goog.global["print"];
    }
    if (goog.global["print"] !== undefined) {
        Sk.debugout = goog.global["print"];
    }
}());

// override for closure to load stuff from the command line.
if (!Sk.inBrowser) {
    goog.global.CLOSURE_IMPORT_SCRIPT = function (src) {
        goog.global["eval"](goog.global["read"]("support/closure-library/closure/goog/" + src));
        return true;
    };
}

Sk.inputfun = function (args) {
    return window.prompt(args);
};

goog.exportSymbol("Sk.__future__", Sk.__future__);
goog.exportSymbol("Sk.inputfun", Sk.inputfun);
goog.require("goog.asserts");
