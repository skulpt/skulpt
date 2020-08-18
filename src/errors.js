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
Sk.builtin.BaseException = function (...args) {
    var o;
    if (!(this instanceof Sk.builtin.BaseException)) {
        o = Object.create(Sk.builtin.BaseException.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }

    this.traceback = [];

    // If args[0] is a string then we're an internal call
    if (typeof args[0] === "string") {
        this.args = new Sk.builtin.tuple([new Sk.builtin.str(args[0])]);
        if (args.length >= 3) {
            // For errors occurring during normal execution, the line/col/etc
            // of the error are populated by each stack frame of the runtime code,
            // but we can seed it with the supplied parameters.
            this.traceback.push({
                lineno: args[2],
                // if !this.args[1], this is an error, and the exception that causes it
                // probably needs to be fixed, but we mark as "<unknown>" for now
                filename: args[1] || "<unknown>",
            });
        }
    } else {
        this.args = new Sk.builtin.tuple(args);
    }
};
Sk.abstr.setUpInheritance("BaseException", Sk.builtin.BaseException, Sk.builtin.object);


Sk.builtin.BaseException.prototype.$r = function () {
    let ret = this.tp$name;
    ret += "(" + this.args.v.map((x) => Sk.misceval.objectRepr(x).v).join(", ") + ")";
    return new Sk.builtin.str(ret);
};

Sk.builtin.BaseException.prototype.tp$str = function () {
    if (this.args.v.length <= 1) {
        return new Sk.builtin.str(this.args.v[0]);
    }
    return this.args.$r();
};

Sk.builtin.BaseException.prototype.toString = function () {
    let ret = this.tp$name;
    ret += ": " + this.tp$str().v;

    if (this.traceback.length !== 0) {
        ret += " on line " + this.traceback[0].lineno;
    } else {
        ret += " at <unknown>";
    }


    return ret;
};

// Create a descriptor to return the 'args' of an exception.
// This is a hack to get around a weird mismatch between builtin
// objects and proper types
Sk.builtin.BaseException.prototype.args = {
    tp$descr_get: function(self, clstype) {
        return self.args;
    }
};

Sk.exportSymbol("Sk.builtin.BaseException", Sk.builtin.BaseException);

/**
 * @constructor
 * @extends Sk.builtin.BaseException
 * @param {...*} args
 */
Sk.builtin.Exception = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.Exception)) {
        o = Object.create(Sk.builtin.Exception.prototype);
        o.constructor.apply(o, arguments);
        return o;
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
Sk.builtin.AssertionError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.AssertionError)) {
        o = Object.create(Sk.builtin.AssertionError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("AssertionError", Sk.builtin.AssertionError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.AssertionError", Sk.builtin.AssertionError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.AttributeError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.AttributeError)) {
        o = Object.create(Sk.builtin.AttributeError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("AttributeError", Sk.builtin.AttributeError, Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ImportError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.ImportError)) {
        o = Object.create(Sk.builtin.ImportError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ImportError", Sk.builtin.ImportError, Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.IndentationError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.IndentationError)) {
        o = Object.create(Sk.builtin.IndentationError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IndentationError", Sk.builtin.IndentationError, Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.IndexError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.IndexError)) {
        o = Object.create(Sk.builtin.IndexError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IndexError", Sk.builtin.IndexError, Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.LookupError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.LookupError)) {
        o = Object.create(Sk.builtin.LookupError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("LookupError", Sk.builtin.LookupError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.LookupError", Sk.builtin.LookupError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.KeyError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.KeyError)) {
        o = Object.create(Sk.builtin.KeyError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.LookupError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("KeyError", Sk.builtin.KeyError, Sk.builtin.LookupError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.NameError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.NameError)) {
        o = Object.create(Sk.builtin.NameError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NameError", Sk.builtin.NameError, Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.UnboundLocalError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.UnboundLocalError)) {
        o = Object.create(Sk.builtin.UnboundLocalError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("UnboundLocalError", Sk.builtin.UnboundLocalError, Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.OverflowError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.OverflowError)) {
        o = Object.create(Sk.builtin.OverflowError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("OverflowError", Sk.builtin.OverflowError, Sk.builtin.Exception);


/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.SyntaxError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.SyntaxError)) {
        o = Object.create(Sk.builtin.SyntaxError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SyntaxError", Sk.builtin.SyntaxError, Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.RuntimeError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.RuntimeError)) {
        o = Object.create(Sk.builtin.RuntimeError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("RuntimeError", Sk.builtin.RuntimeError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.RuntimeError", Sk.builtin.RuntimeError);


/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.SuspensionError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.SuspensionError)) {
        o = Object.create(Sk.builtin.SuspensionError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SuspensionError", Sk.builtin.SuspensionError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.SuspensionError", Sk.builtin.SuspensionError);


/**
 * @constructor
 * @extends Sk.builtin.BaseException
 * @param {...*} args
 */
Sk.builtin.SystemExit = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.SystemExit)) {
        o = Object.create(Sk.builtin.SystemExit.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.BaseException.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SystemExit", Sk.builtin.SystemExit, Sk.builtin.BaseException);
Sk.exportSymbol("Sk.builtin.SystemExit", Sk.builtin.SystemExit);


/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.TypeError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.TypeError)) {
        o = Object.create(Sk.builtin.TypeError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("TypeError", Sk.builtin.TypeError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.TypeError", Sk.builtin.TypeError);
/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ValueError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.ValueError)) {
        o = Object.create(Sk.builtin.ValueError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ValueError", Sk.builtin.ValueError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.ValueError", Sk.builtin.ValueError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ZeroDivisionError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.ZeroDivisionError)) {
        o = Object.create(Sk.builtin.ZeroDivisionError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ZeroDivisionError", Sk.builtin.ZeroDivisionError, Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.TimeLimitError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.TimeLimitError)) {
        o = Object.create(Sk.builtin.TimeLimitError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("TimeLimitError", Sk.builtin.TimeLimitError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.TimeLimitError", Sk.builtin.TimeLimitError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.IOError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.IOError)) {
        o = Object.create(Sk.builtin.IOError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IOError", Sk.builtin.IOError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.IOError", Sk.builtin.IOError);


/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.NotImplementedError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.NotImplementedError)) {
        o = Object.create(Sk.builtin.NotImplementedError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NotImplementedError", Sk.builtin.NotImplementedError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.NotImplementedError", Sk.builtin.NotImplementedError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.NegativePowerError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.NegativePowerError)) {
        o = Object.create(Sk.builtin.NegativePowerError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NegativePowerError", Sk.builtin.NegativePowerError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.NegativePowerError", Sk.builtin.NegativePowerError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {*} nativeError
 * @param {...*} args
 */
Sk.builtin.ExternalError = function (nativeError, args) {
    var o;
    if (!(this instanceof Sk.builtin.ExternalError)) {
        o = Object.create(Sk.builtin.ExternalError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    // Make the first argument a string, so it can be printed in Python without errors,
    // but save a reference to the real thing for Javascript consumption
    args = Array.prototype.slice.call(arguments);
    this.nativeError = args[0];
    if (!(args[0] instanceof Sk.builtin.str)) {
        args[0] = ""+args[0];
    }
    Sk.builtin.Exception.apply(this, args);
};
Sk.abstr.setUpInheritance("ExternalError", Sk.builtin.ExternalError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.ExternalError", Sk.builtin.ExternalError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.OperationError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.OperationError)) {
        o = Object.create(Sk.builtin.OperationError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("OperationError", Sk.builtin.OperationError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.OperationError", Sk.builtin.OperationError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.SystemError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.SystemError)) {
        o = Object.create(Sk.builtin.SystemError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SystemError", Sk.builtin.SystemError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.SystemError", Sk.builtin.SystemError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.UnicodeDecodeError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.UnicodeDecodeError)) {
        o = Object.create(Sk.builtin.UnicodeDecodeError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("UnicodeDecodeError", Sk.builtin.UnicodeDecodeError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.UnicodeDecodeError", Sk.builtin.UnicodeDecodeError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.UnicodeEncodeError = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.UnicodeEncodeError)) {
        o = Object.create(Sk.builtin.UnicodeEncodeError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("UnicodeEncodeError", Sk.builtin.UnicodeEncodeError, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.UnicodeEncodeError", Sk.builtin.UnicodeEncodeError);


/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.StopIteration = function (args) {
    var o;
    if (!(this instanceof Sk.builtin.StopIteration)) {
        o = Object.create(Sk.builtin.StopIteration.prototype);
        o.constructor.apply(o, arguments);
        return o;
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
