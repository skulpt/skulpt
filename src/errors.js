/*
 * The filename, line number, and column number of exceptions are
 * stored within the exception object.  Note that not all exceptions
 * clearly report the column number.  To customize the exception
 * message to use any/all of these fields, you can either modify
 * tp$str below to print the desired message, or use them in the
 * skulpt wrapper (i.e., runit) to present the exception message.
 */


/**
 * @constructor
 * @param {...Object|null} args
 */
Sk.builtin.BaseException = function () {
    if (!(this instanceof Sk.builtin.BaseException)) {
        return new Sk.builtin.BaseException(...arguments);
    }

    const args = Array.prototype.slice.call(arguments);
    // hackage to allow shorter throws
    for (let i = 0; i < args.length; ++i) {
        if (typeof args[i] === "string") {
            args[i] = new Sk.builtin.str(args[i]);
        }
    }
    this.args = new Sk.builtin.tuple(args);
    this.traceback = [];
    // For errors occurring during normal execution, the line/col/etc
    // of the error are populated by each stack frame of the runtime code,
    // but we can seed it with the supplied parameters.
    if (this.args.sq$length() >= 3) {

        // if !this.args[1].v, this is an error, and the exception that causes it
        // probably needs to be fixed, but we mark as "<unknown>" for now
        this.traceback.push({
            lineno: this.args.v[2],
            filename: this.args.v[1].v || "<unknown>"
        });
    }
};
Sk.abstr.setUpInheritance("BaseException", Sk.builtin.BaseException, Sk.builtin.object);

Sk.builtin.BaseException.prototype.tp$doc = "Common base class for all exceptions";
Sk.builtin.BaseException.prototype.tp$new = function (args, kwargs) {
    if (!this.hp$type) {
        // then we have a builtin constructor so just return it as new this
        return new this.constructor(...args);
    } else {
        const instance = new this.constructor;
        Sk.builtin.BaseException.call(instance, ...args);
        return instance;
    }
};

Sk.builtin.BaseException.prototype.tp$init = function (args, kwargs) {
    if (kwargs && kwargs.length) {
        throw new Sk.builtin.TypeError(Sk.abstr.typeName(this) + "() takes no keyword arguments");
    }
    if (this.hasOwnProperty("args")) {
        if (this.args.v !== args) {
            this.args.v = args;
        }
    } else {
        this.args = new Sk.builtin.tuple(args);
    }
    return Sk.builtin.none.none$;
};

Sk.builtin.BaseException.prototype.tp$getsets = [
    new Sk.GetSetDef("args",
                     function () {
                         return this.args;
                     }
                    ),
];

Sk.builtin.BaseException.prototype.tp$str = function () {
    var i;
    var ret = "";

    ret += this.tp$name;
    if (this.args) {
        ret += ": " + (this.args.v.length > 0 ? this.args.v[0].v : "");
    }
    if (this.traceback.length !== 0) {
        ret += " on line " + this.traceback[0].lineno;
    } else {
        ret += " at <unknown>";
    }

    if (this.args.v.length > 4) {
        ret += "\n" + this.args.v[4].v + "\n";
        for (i = 0; i < this.args.v[3]; ++i) {
            ret += " ";
        }
        ret += "^\n";
    }

    /*for (i = 0; i < this.traceback.length; i++) {
        ret += "\n  at " + this.traceback[i].filename + " line " + this.traceback[i].lineno;
        if ("colno" in this.traceback[i]) {
            ret += " column " + this.traceback[i].colno;
        }
    }*/

    return new Sk.builtin.str(ret);
};

Sk.builtin.BaseException.prototype.toString = function () {
    return this.tp$str().v;
};


Sk.exportSymbol("Sk.builtin.BaseException", Sk.builtin.BaseException);

/**
 * @constructor
 * @extends Sk.builtin.BaseException
 * @param {...*} args
 */
Sk.builtin.Exception = function () {
    var o;
    if (!(this instanceof Sk.builtin.Exception)) {
        return new Sk.builtin.Exception(...arguments);
    }
    Sk.builtin.BaseException.apply(this, arguments);
};
Sk.abstr.setUpInheritance("Exception", Sk.builtin.Exception, Sk.builtin.BaseException);
Sk.exportSymbol("Sk.builtin.Exception", Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.StandardError = function () {
    if (!(this instanceof Sk.builtin.StandardError)) {
        return new Sk.builtin.StandardError(...arguments);
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("StandardError", Sk.builtin.StandardError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.StandardError", Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.AssertionError = function () {
    if (!(this instanceof Sk.builtin.AssertionError)) {
        return new Sk.builtin.AssertionError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("AssertionError", Sk.builtin.AssertionError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.AssertionError", Sk.builtin.AssertionError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.AttributeError = function () {
    if (!(this instanceof Sk.builtin.AttributeError)) {
        return Sk.builtin.AttributeError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("AttributeError", Sk.builtin.AttributeError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.ImportError = function () {
    if (!(this instanceof Sk.builtin.ImportError)) {
        return new Sk.builtin.ImportError(...arguments); 
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ImportError", Sk.builtin.ImportError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.IndentationError = function () {
    if (!(this instanceof Sk.builtin.IndentationError)) {
        return new Sk.builtin.IndentationError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IndentationError", Sk.builtin.IndentationError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.IndexError = function () {
    if (!(this instanceof Sk.builtin.IndexError)) {
        return new Sk.builtin.IndexError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IndexError", Sk.builtin.IndexError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.KeyError = function () {
    if (!(this instanceof Sk.builtin.KeyError)) {
        return new Sk.builtin.KeyError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("KeyError", Sk.builtin.KeyError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.NameError = function () {
    if (!(this instanceof Sk.builtin.NameError)) {
        return new Sk.builtin.NameError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NameError", Sk.builtin.NameError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.UnboundLocalError = function () {
    if (!(this instanceof Sk.builtin.UnboundLocalError)) {
        return new Sk.builtin.UnboundLocalError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("UnboundLocalError", Sk.builtin.UnboundLocalError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.OverflowError = function () {
    if (!(this instanceof Sk.builtin.OverflowError)) {
        return new Sk.builtin.OverflowError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("OverflowError", Sk.builtin.OverflowError, Sk.builtin.StandardError);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.SyntaxError = function () {
    if (!(this instanceof Sk.builtin.SyntaxError)) {
        return new Sk.builtin.SyntaxError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SyntaxError", Sk.builtin.SyntaxError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.RuntimeError = function () {
    if (!(this instanceof Sk.builtin.RuntimeError)) {
        return new Sk.builtin.RuntimeError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("RuntimeError", Sk.builtin.RuntimeError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.RuntimeError", Sk.builtin.RuntimeError);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.SuspensionError = function () {
    if (!(this instanceof Sk.builtin.SuspensionError)) {
        return new Sk.builtin.SuspensionError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SuspensionError", Sk.builtin.SuspensionError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.SuspensionError", Sk.builtin.SuspensionError);


/**
 * @constructor
 * @extends Sk.builtin.BaseException
 * @param {...*} args
 */
Sk.builtin.SystemExit = function () {
    if (!(this instanceof Sk.builtin.SystemExit)) {
        return new Sk.builtin.SystemExit(...arguments);
    }
    Sk.builtin.BaseException.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SystemExit", Sk.builtin.SystemExit, Sk.builtin.BaseException);
Sk.exportSymbol("Sk.builtin.SystemExit", Sk.builtin.SystemExit);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.TypeError = function () {
    if (!(this instanceof Sk.builtin.TypeError)) {
        return new Sk.builtin.TypeError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("TypeError", Sk.builtin.TypeError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.TypeError", Sk.builtin.TypeError);
/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.ValueError = function () {
    if (!(this instanceof Sk.builtin.ValueError)) {
        return new Sk.builtin.ValueError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ValueError", Sk.builtin.ValueError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.ValueError", Sk.builtin.ValueError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.ZeroDivisionError = function () {
    if (!(this instanceof Sk.builtin.ZeroDivisionError)) {
        return new Sk.builtin.ZeroDivisionError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ZeroDivisionError", Sk.builtin.ZeroDivisionError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.TimeLimitError = function () {
    if (!(this instanceof Sk.builtin.TimeLimitError)) {
        return new Sk.builtin.TimeLimitError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("TimeLimitError", Sk.builtin.TimeLimitError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.TimeLimitError", Sk.builtin.TimeLimitError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.IOError = function () {
    if (!(this instanceof Sk.builtin.IOError)) {
        return new Sk.builtin.IOError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IOError", Sk.builtin.IOError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.IOError", Sk.builtin.IOError);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.NotImplementedError = function () {
    if (!(this instanceof Sk.builtin.NotImplementedError)) {
        return new Sk.builtin.NotImplementedError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NotImplementedError", Sk.builtin.NotImplementedError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.NotImplementedError", Sk.builtin.NotImplementedError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.NegativePowerError = function () {
    if (!(this instanceof Sk.builtin.NegativePowerError)) {
        return new Sk.builtin.NegativePowerError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NegativePowerError", Sk.builtin.NegativePowerError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.NegativePowerError", Sk.builtin.NegativePowerError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {*} nativeError
 * @param {...*} args
 */
Sk.builtin.ExternalError = function (nativeError, args) {
    if (!(this instanceof Sk.builtin.ExternalError)) {
        return new Sk.builtin.ExternalError(nativeError, arg);
    }
    // Make the first argument a string, so it can be printed in Python without errors,
    // but save a reference to the real thing for Javascript consumption
    args = Array.prototype.slice.call(arguments);
    this.nativeError = args[0];
    if (!(args[0] instanceof Sk.builtin.str)) {
        args[0] = ""+args[0];
    }
    Sk.builtin.StandardError.apply(this, args);
};
Sk.abstr.setUpInheritance("ExternalError", Sk.builtin.ExternalError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.ExternalError", Sk.builtin.ExternalError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.OperationError = function () {
    if (!(this instanceof Sk.builtin.OperationError)) {
        return new Sk.builtin.OperationError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("OperationError", Sk.builtin.OperationError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.OperationError", Sk.builtin.OperationError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {...*} args
 */
Sk.builtin.SystemError = function () {
    var o;
    if (!(this instanceof Sk.builtin.SystemError)) {
        return new Sk.builtin.SystemError(...arguments);
    }
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SystemError", Sk.builtin.SystemError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.SystemError", Sk.builtin.SystemError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.StopIteration = function () {
    if (!(this instanceof Sk.builtin.StopIteration)) {
        return new Sk.builtin.StopIteration(...arguments);
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("StopIteration", Sk.builtin.StopIteration, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.StopIteration", Sk.builtin.StopIteration);


// TODO: Extract into sys.exc_info(). Work out how the heck
// to find out what exceptions are being processed by parent stack frames...
Sk.builtin.getExcInfo = function(e) {
    var v = [e.ob$type || Sk.builtin.none.none$, e, Sk.builtin.none.none$];

    // TODO create a Traceback object for the third tuple element

    return new Sk.builtin.tuple(v);
};
// NOT exported

