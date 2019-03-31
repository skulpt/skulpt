import { setUpInheritance } from './type';
import { none, object } from './types/object';
import { str } from './types/str';
import { tuple } from './types/tuple';
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
export class BaseException extends object {
    constructor(args) {
        var i, o;

        args = Array.prototype.slice.call(arguments);
        // hackage to allow shorter throws
        for (i = 0; i < args.length; ++i) {
            if (typeof args[i] === "string") {
                args[i] = new str(args[i]);
            }
        }
        this.args = new tuple(args);
        this.traceback = [];

        // For errors occurring during normal execution, the line/col/etc
        // of the error are populated by each stack frame of the runtime code,
        // but we can seed it with the supplied parameters.
        if (this.args.sq$length() >= 3) {

            // if !this.args[1].v, this is an error, and the exception that causes it
            // probably needs to be fixed, but we mark as "<unknown>" for now
            this.traceback.push({lineno: this.args.v[2],
                                filename: this.args.v[1].v || "<unknown>"});
        }
    }

    tp$str() {
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

        return new str(ret);
    }

    toString() {
        return this.tp$str().v;
    }

    // Create a descriptor to return the 'args' of an exception.
    // This is a hack to get around a weird mismatch between builtin
    // objects and proper types
    args = {
        "tp$descr_get": function(self, clstype) {
            return self.args;
        }
    };
}

setUpInheritance("BaseException", BaseException, object);

/**
 * @constructor
 * @extends BaseException
 * @param {...*} args
 */
export class Exception extends BaseException {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("Exception", Exception, BaseException);


/**
 * @constructor
 * @extends Exception
 * @param {...*} args
 */
export class StandardError extends Exception {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("StandardError", StandardError, Exception);


/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class AssertionError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("AssertionError", AssertionError, StandardError);


/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class AttributeError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("AttributeError", AttributeError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class ImportError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("ImportError", ImportError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class IndentationError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("IndentationError", IndentationError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class IndexError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("IndexError", IndexError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class KeyError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("KeyError", KeyError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class NameError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("NameError", NameError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class UnboundLocalError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("UnboundLocalError", UnboundLocalError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class OverflowError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("OverflowError", OverflowError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class SyntaxError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("SyntaxError", SyntaxError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class RuntimeError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("RuntimeError", RuntimeError, StandardError);
/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class SuspensionError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("SuspensionError", SuspensionError, StandardError);

/**
 * @constructor
 * @extends BaseException
 * @param {...*} args
 */
export class SystemExit extends BaseException {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("SystemExit", SystemExit, BaseException);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class TypeError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("TypeError", TypeError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class ValueError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("ValueError", ValueError, StandardError);


/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class ZeroDivisionError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("ZeroDivisionError", ZeroDivisionError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class TimeLimitError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("TimeLimitError", TimeLimitError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class IOError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("IOError", IOError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class NotImplementedError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("NotImplementedError", NotImplementedError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class NegativePowerError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("NegativePowerError", NegativePowerError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {*} nativeError
 * @param {...*} args
 */
export class ExternalError extends StandardError {
    constructor() {
        // Make the first argument a string, so it can be printed in Python without errors,
        // but save a reference to the real thing for Javascript consumption
        var args = Array.prototype.slice.call(arguments);
        this.nativeError = args[0];
        if (!(args[0] instanceof str)) {
            args[0] = "" + args[0];
        }
        super(args);
    }
}
setUpInheritance("ExternalError", ExternalError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class OperationError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("OperationError", OperationError, StandardError);

/**
 * @constructor
 * @extends StandardError
 * @param {...*} args
 */
export class SystemError extends StandardError {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("SystemError", SystemError, StandardError);

/**
 * @constructor
 * @extends Exception
 * @param {...*} args
 */
export class StopIteration extends Exception {
    constructor() {
        super(arguments);
    }
}
setUpInheritance("StopIteration", StopIteration, Exception);

// TODO: Extract into sys.exc_info(). Work out how the heck
// to find out what exceptions are being processed by parent stack frames...
export function getExcInfo(e) {
    var v = [e.ob$type || none.none$, e, none.none$];

    // TODO create a Traceback object for the third tuple element

    return new tuple(v);
}
