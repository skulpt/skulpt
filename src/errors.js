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
 * @param {String|Array} args
 */
Sk.builtin.BaseException = Sk.abstr.buildNativeClass("BaseException", {
    constructor: function (...args) {
        // internally args is either a string
        Sk.asserts.assert(this instanceof Sk.builtin.BaseException);
        // hackage to allow shorter throws
        // let msg = args[0];
        // if (typeof msg === "string" ) {
        //     msg = new Sk.builtin.str(msg);
        // }
        this.args = new Sk.builtin.tuple([new Sk.builtin.str(args[0])]);
        this.traceback = [];

        // For errors occurring during normal execution, the line/col/etc
        // of the error are populated by each stack frame of the runtime code,
        // but we can seed it with the supplied parameters.
        if (args.length >= 3) {

            // if !this.args[1].v, this is an error, and the exception that causes it
            // probably needs to be fixed, but we mark as "<unknown>" for now
            this.traceback.push({
                lineno: args[2],
                filename: args[1] || "<unknown>"
            });
        }
    },
    slots: {
        tp$getattr: Sk.generic.getAttr,
        tp$doc: "Common base class for all exceptions",
        tp$new: function (args, kwargs) {
            if (!this.hp$type) {
                // then we have a builtin constructor so just return it as new this
                return new this.constructor;
            } else {
                const instance = new this.constructor;
                Sk.builtin.BaseException.call(instance);
                return instance;
            }
        },
        tp$init: function (args, kwargs) {
            Sk.abstr.checkNoKwargs(Sk.abstr.typeName(this), kwargs);
            if (this.args.v !== args) {
                // we only initiate the args if they are not identical to the args from tp$new;
                this.args.v = args;
            }
            return Sk.builtin.none.none$;
        },
        $r: function () {
            let ret = "";

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
                for (let i = 0; i < this.args.v[3]; ++i) {
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
        },
        tp$str: function () {
            if (this.args.v.length <= 1) {
                return new Sk.builtin.str(this.args.v[0]);
            }
            return this.args.$r();
        }
    },
    getsets: {
        args: {
            $get: function () { return this.args; }
        }
    },
    proto: {
        toString: function () { return this.$r().v; }
    }
});

Sk.exportSymbol("Sk.builtin.BaseException", Sk.builtin.BaseException);

/**
 * @constructor
 * @extends Sk.builtin.BaseException
 * @param {String|Array} args
 */
Sk.builtin.Exception = function () {
    Sk.builtin.BaseException.apply(this, arguments);
};
Sk.abstr.setUpInheritance("Exception", Sk.builtin.Exception, Sk.builtin.BaseException);
Sk.exportSymbol("Sk.builtin.Exception", Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {String|Array} args
 */
Sk.builtin.StandardError = function () {
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("StandardError", Sk.builtin.StandardError, Sk.builtin.Exception);
// error is not used in py3
Sk.builtin.StandardError.sk$abstract = true;
Sk.exportSymbol("Sk.builtin.StandardError", Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.AssertionError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("AssertionError", Sk.builtin.AssertionError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.AssertionError", Sk.builtin.AssertionError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.AttributeError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("AttributeError", Sk.builtin.AttributeError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.ImportError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ImportError", Sk.builtin.ImportError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.IndentationError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IndentationError", Sk.builtin.IndentationError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.IndexError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IndexError", Sk.builtin.IndexError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.KeyError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("KeyError", Sk.builtin.KeyError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.NameError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NameError", Sk.builtin.NameError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.UnboundLocalError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("UnboundLocalError", Sk.builtin.UnboundLocalError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.OverflowError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("OverflowError", Sk.builtin.OverflowError, Sk.builtin.StandardError);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.SyntaxError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SyntaxError", Sk.builtin.SyntaxError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.RuntimeError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("RuntimeError", Sk.builtin.RuntimeError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.RuntimeError", Sk.builtin.RuntimeError);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.SuspensionError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SuspensionError", Sk.builtin.SuspensionError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.SuspensionError", Sk.builtin.SuspensionError);


/**
 * @constructor
 * @extends Sk.builtin.BaseException
 * @param {String|Array} args
 */
Sk.builtin.SystemExit = function () {
    Sk.builtin.BaseException.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SystemExit", Sk.builtin.SystemExit, Sk.builtin.BaseException);
Sk.exportSymbol("Sk.builtin.SystemExit", Sk.builtin.SystemExit);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.TypeError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("TypeError", Sk.builtin.TypeError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.TypeError", Sk.builtin.TypeError);
/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.ValueError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ValueError", Sk.builtin.ValueError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.ValueError", Sk.builtin.ValueError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.ZeroDivisionError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("ZeroDivisionError", Sk.builtin.ZeroDivisionError, Sk.builtin.StandardError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.TimeLimitError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("TimeLimitError", Sk.builtin.TimeLimitError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.TimeLimitError", Sk.builtin.TimeLimitError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.IOError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("IOError", Sk.builtin.IOError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.IOError", Sk.builtin.IOError);


/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.NotImplementedError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NotImplementedError", Sk.builtin.NotImplementedError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.NotImplementedError", Sk.builtin.NotImplementedError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.NegativePowerError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("NegativePowerError", Sk.builtin.NegativePowerError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.NegativePowerError", Sk.builtin.NegativePowerError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {*} nativeError
 * @param {String|Array} args
 */
Sk.builtin.ExternalError = function (args) {
    this.nativeError = args;
    const msg = args.toString();
    Sk.builtin.StandardError.call(this, msg);
};
Sk.abstr.setUpInheritance("ExternalError", Sk.builtin.ExternalError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.ExternalError", Sk.builtin.ExternalError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.OperationError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("OperationError", Sk.builtin.OperationError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.OperationError", Sk.builtin.OperationError);

/**
 * @constructor
 * @extends Sk.builtin.StandardError
 * @param {String|Array} args
 */
Sk.builtin.SystemError = function () {
    Sk.builtin.StandardError.apply(this, arguments);
};
Sk.abstr.setUpInheritance("SystemError", Sk.builtin.SystemError, Sk.builtin.StandardError);
Sk.exportSymbol("Sk.builtin.SystemError", Sk.builtin.SystemError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {String|Array} args
 */
Sk.builtin.StopIteration = function () {
    Sk.builtin.Exception.apply(this, arguments);
};
Sk.abstr.setUpInheritance("StopIteration", Sk.builtin.StopIteration, Sk.builtin.Exception);
Sk.exportSymbol("Sk.builtin.StopIteration", Sk.builtin.StopIteration);


// TODO: Extract into sys.exc_info(). Work out how the heck
// to find out what exceptions are being processed by parent stack frames...
Sk.builtin.getExcInfo = function (e) {
    var v = [e.ob$type || Sk.builtin.none.none$, e, Sk.builtin.none.none$];

    // TODO create a Traceback object for the third tuple element

    return new Sk.builtin.tuple(v);
};
// NOT exported


// We inherit from StandardError for backward compatibilaty. 
// We don't worry about StandardError in __base__ and __bases__ for py2 so we just override it here for py3
Sk.builtin.TypeError.prototype.tp$base =
    Sk.builtin.ValueError.prototype.tp$base =
    Sk.builtin.AssertionError.prototype.tp$base =
    Sk.builtin.AttributeError.prototype.tp$base =
    Sk.builtin.ImportError.prototype.tp$base =
    Sk.builtin.IndentationError.prototype.tp$base =
    Sk.builtin.IndexError.prototype.tp$base =
    Sk.builtin.KeyError.prototype.tp$base =
    Sk.builtin.NameError.prototype.tp$base =
    Sk.builtin.OverflowError.prototype.tp$base =
    Sk.builtin.RuntimeError.prototype.tp$base =
    Sk.builtin.SyntaxError.prototype.tp$base =
    Sk.builtin.SuspensionError.prototype.tp$base =
    Sk.builtin.TimeLimitError.prototype.tp$base =
    Sk.builtin.IOError.prototype.tp$base =
    Sk.builtin.NotImplementedError.prototype.tp$base =
    Sk.builtin.ExternalError.prototype.tp$base =
    Sk.builtin.OperationError.prototype.tp$base =
    Sk.builtin.SystemError.prototype.tp$base =
    Sk.builtin.ZeroDivisionError.prototype.tp$base =
    Sk.builtin.UnboundLocalError.prototype.tp$base = Sk.builtin.Exception;