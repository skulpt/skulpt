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
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.BaseException = Sk.abstr.buildNativeClass("BaseException", {
    constructor: function Exception(...args) {
        // internally args is either a string
        Sk.asserts.assert(this instanceof Sk.builtin.BaseException, "bad call to exception constructor, use 'new'");

        // for all internal calls only the first argument is included in args
        let arg = args[0];
        if (typeof arg === "string") {
            arg = new Sk.builtin.str(arg);
        }
        this.args = new Sk.builtin.tuple(arg ? [arg] : []);
        this.traceback = [];
        this.$d = new Sk.builtin.dict();

        if (args.length >= 3) {
            // For errors occurring during normal execution, the line/col/etc
            // of the error are populated by each stack frame of the runtime code,
            // but we can seed it with the supplied parameters.
            this.traceback.push({
                lineno: args[2],
                filename: args[1] || "<unknown>",
            });
        }
    },
    slots: /**@lends {Sk.builtin.BaseException}*/ {
        tp$getattr: Sk.generic.getAttr,
        tp$doc: "Common base class for all exceptions",
        tp$new(args, kwargs) {
            let instance;
            if (!this.hp$type) {
                // then we have a builtin constructor so just return it as new this
                instance = new this.constructor();
            } else {
                instance = new this.constructor();
                Sk.builtin.BaseException.call(instance);
            }
            // called from python so do the args here
            instance.args = new Sk.builtin.tuple(args.slice()); // reset args in __init__ method
            return instance;
        },
        tp$init(args, kwargs) {
            Sk.abstr.checkNoKwargs(Sk.abstr.typeName(this), kwargs);
        },
        $r() {
            let ret = this.tp$name;
            ret += "(" + this.args.v.map((x) => Sk.misceval.objectRepr(x)).join(", ") + ")";
            return new Sk.builtin.str(ret);
        },
        tp$str() {
            if (this.args.v.length <= 1) {
                return new Sk.builtin.str(this.args.v[0]);
            }
            return this.args.$r();
        },
    },
    getsets: /**@lends {Sk.builtin.BaseException}*/ {
        args: {
            $get() {
                return this.args;
            },
        },
        __dict__: Sk.generic.getSetDict,
    },
    proto: /**@lends {Sk.builtin.BaseException}*/ {
        toString() {
            let ret = this.tp$name;
            ret += ": " + this.tp$str().v;

            if (this.traceback.length !== 0) {
                ret += " on line " + this.traceback[0].lineno;
            } else {
                ret += " at <unknown>";
            }

            // if (this.args.v.length > 4) {
            //     ret += "\n" + this.args.v[4].v + "\n";
            //     for (let i = 0; i < this.args.v[3]; ++i) {
            //         ret += " ";
            //     }
            //     ret += "^\n";
            // }

            /*for (i = 0; i < this.traceback.length; i++) {
                ret += "\n  at " + this.traceback[i].filename + " line " + this.traceback[i].lineno;
                if ("colno" in this.traceback[i]) {
                    ret += " column " + this.traceback[i].colno;
                }
            }*/

            return ret;
        },
    },
});

Sk.exportSymbol("Sk.builtin.BaseException", Sk.builtin.BaseException);

/**
 * @constructor
 * @extends Sk.builtin.BaseException
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.Exception = Sk.abstr.buildNativeClass("Exception", {
    constructor: function Exception(...args) {
        Sk.builtin.BaseException.apply(this, args);
    },
    base: Sk.builtin.BaseException,
});
Sk.exportSymbol("Sk.builtin.Exception", Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.AssertionError = Sk.abstr.buildNativeClass("AssertionError", {
    constructor: function AssertionError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.AssertionError", Sk.builtin.AssertionError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.AttributeError = Sk.abstr.buildNativeClass("AttributeError", {
    constructor: function AttributeError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.ImportError = Sk.abstr.buildNativeClass("ImportError", {
    constructor: function ImportError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.IndentationError = Sk.abstr.buildNativeClass("IndentationError", {
    constructor: function IndentationError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.IndexError = Sk.abstr.buildNativeClass("IndexError", {
    constructor: function IndexError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.LookupError = Sk.abstr.buildNativeClass("LookupError", {
    constructor: function LookupError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});

/**
 * @constructor
 * @extends Sk.builtin.LookupError
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.KeyError = Sk.abstr.buildNativeClass("KeyError", {
    constructor: function KeyError(...args) {
        Sk.builtin.LookupError.apply(this, args);
    },
    base: Sk.builtin.LookupError,
});

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.NameError = Sk.abstr.buildNativeClass("NameError", {
    constructor: function NameError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.UnboundLocalError = Sk.abstr.buildNativeClass("UnboundLocalError", {
    constructor: function UnboundLocalError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.OverflowError = Sk.abstr.buildNativeClass("OverflowError", {
    constructor: function OverflowError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args
 */
Sk.builtin.SyntaxError = Sk.abstr.buildNativeClass("SyntaxError", {
    constructor: function SyntaxError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.RuntimeError = Sk.abstr.buildNativeClass("RuntimeError", {
    constructor: function RuntimeError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.RuntimeError", Sk.builtin.RuntimeError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.SuspensionError = Sk.abstr.buildNativeClass("SuspensionError", {
    constructor: function SuspensionError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.SuspensionError", Sk.builtin.SuspensionError);

/**
 * @constructor
 * @extends Sk.builtin.BaseException
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.SystemExit = Sk.abstr.buildNativeClass("SystemExit", {
    constructor: function SystemExit(...args) {
        Sk.builtin.BaseException.apply(this, args);
    },
    base: Sk.builtin.BaseException,
});
Sk.exportSymbol("Sk.builtin.SystemExit", Sk.builtin.SystemExit);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.TypeError = Sk.abstr.buildNativeClass("TypeError", {
    constructor: function TypeError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.TypeError", Sk.builtin.TypeError);
/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.ValueError = Sk.abstr.buildNativeClass("ValueError", {
    constructor: function ValueError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.ValueError", Sk.builtin.ValueError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.ZeroDivisionError = Sk.abstr.buildNativeClass("ZeroDivisionError", {
    constructor: function ZeroDivisionError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.TimeLimitError = Sk.abstr.buildNativeClass("TimeLimitError", {
    constructor: function TimeLimitError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.TimeLimitError", Sk.builtin.TimeLimitError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.IOError = Sk.abstr.buildNativeClass("IOError", {
    constructor: function IOError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.IOError", Sk.builtin.IOError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.NotImplementedError = Sk.abstr.buildNativeClass("NotImplementedError", {
    constructor: function NotImplementedError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.NotImplementedError", Sk.builtin.NotImplementedError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.NegativePowerError = Sk.abstr.buildNativeClass("NegativePowerError", {
    constructor: function NegativePowerError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.NegativePowerError", Sk.builtin.NegativePowerError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args
 */
Sk.builtin.ExternalError = Sk.abstr.buildNativeClass("ExternalError", {
    constructor: function ExternalError(...args) {
        this.nativeError = args[0];
        if (!Sk.builtin.checkString(this.nativeError)) {
            args[0] = this.nativeError.toString();
            if (args[0].startsWith("RangeError: Maximum call")) {
                args[0] = "Maximum call stack size exceeded";
                return new Sk.builtin.RecursionError(...args);
            }
        }
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.ExternalError", Sk.builtin.ExternalError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.RecursionError = Sk.abstr.buildNativeClass("RecursionError", {
    constructor: function RecursionError(...args) {
        Sk.builtin.RuntimeError.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.RecursionError", Sk.builtin.RecursionError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.OperationError = Sk.abstr.buildNativeClass("OperationError", {
    constructor: function OperationError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.OperationError", Sk.builtin.OperationError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.SystemError = Sk.abstr.buildNativeClass("SystemError", {
    constructor: function SystemError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.SystemError", Sk.builtin.SystemError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.UnicodeDecodeError = Sk.abstr.buildNativeClass("UnicodeDecodeError", {
    constructor: function UnicodeDecodeError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.UnicodeDecodeError", Sk.builtin.UnicodeDecodeError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args
 */
Sk.builtin.UnicodeEncodeError = Sk.abstr.buildNativeClass("UnicodeEncodeError", {
    constructor: function UnicodeEncodeError(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.UnicodeEncodeError", Sk.builtin.UnicodeEncodeError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...} args Typically called with a single string argument
 */
Sk.builtin.StopIteration = Sk.abstr.buildNativeClass("StopIteration", {
    constructor: function StopIteration(...args) {
        Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
});
Sk.exportSymbol("Sk.builtin.StopIteration", Sk.builtin.StopIteration);

// TODO: Extract into sys.exc_info(). Work out how the heck
// to find out what exceptions are being processed by parent stack frames...
Sk.builtin.getExcInfo = function (e) {
    var v = [e.ob$type || Sk.builtin.none.none$, e, Sk.builtin.none.none$];

    // TODO create a Traceback object for the third tuple element

    return new Sk.builtin.tuple(v);
};
// NOT exported
