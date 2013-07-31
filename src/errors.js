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
Sk.builtin.Exception = function(args)
{
    var args = Array.prototype.slice.call(arguments);
    // hackage to allow shorter throws
    for (var i = 0; i < args.length; ++i)
    {
        if (typeof args[i] === "string")
            args[i] = new Sk.builtin.str(args[i]);
    }
    this.args = new Sk.builtin.tuple(args);

    if (Sk.currFilename)
    {
        this.filename = Sk.currFilename;
    }
    else if (this.args.sq$length() >= 3)
    {
        if (this.args.v[1].v)
        {
            this.filename = this.args.v[1].v;
        }
        else
        {
            // Unknown, this is an error, and the exception that causes it
            // probably needs to be fixed.
            this.filename = "<unknown>";
        }
    }
    else
    {
        // Unknown, this is an error, and the exception that causes it
        // probably needs to be fixed.
        this.filename = "<unknown>";
    }

    if (Sk.currLineNo > 0) 
    {
        this.lineno = Sk.currLineNo;
    }
    else if (this.args.sq$length() >= 3)
    {
        this.lineno = this.args.v[2];
    }
    else
    {
        // Unknown, this is an error, and the exception that causes it
        // probably needs to be fixed.
        this.lineno = "<unknown>";
    }

    if (Sk.currColNo > 0)
    {
        this.colno = Sk.currColNo;
    }
    else
    {
        this.colno = "<unknown>";
    }
};
Sk.builtin.Exception.prototype.tp$name = "Exception";

Sk.builtin.Exception.prototype.tp$str = function()
{
    var ret = "";

    ret += this.tp$name;
    if (this.args)
        ret += ": " + this.args.v[0].v;
    ret += " on line " + this.lineno;

    if (this.args.v.length > 4)
    {
        ret += "\n" + this.args.v[4].v + "\n";
        for (var i = 0; i < this.args.v[3]; ++i) ret += " ";
        ret += "^\n";
    }

    return new Sk.builtin.str(ret);
};

Sk.builtin.Exception.prototype.toString = function()
{
    return this.tp$str().v;
}

goog.exportSymbol("Sk.builtin.Exception", Sk.builtin.Exception);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.AssertionError = function(args) { Sk.builtin.Exception.apply(this, arguments); };
goog.inherits(Sk.builtin.AssertionError, Sk.builtin.Exception);
Sk.builtin.AssertionError.prototype.tp$name = "AssertionError";
goog.exportSymbol("Sk.builtin.AssertionError", Sk.builtin.AssertionError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.AttributeError = function(args) { Sk.builtin.Exception.apply(this, arguments); };
goog.inherits(Sk.builtin.AttributeError, Sk.builtin.Exception);
Sk.builtin.AttributeError.prototype.tp$name = "AttributeError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ImportError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.ImportError, Sk.builtin.Exception);
Sk.builtin.ImportError.prototype.tp$name = "ImportError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.IndentationError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.IndentationError, Sk.builtin.Exception);
Sk.builtin.IndentationError.prototype.tp$name = "IndentationError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.IndexError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.IndexError, Sk.builtin.Exception);
Sk.builtin.IndexError.prototype.tp$name = "IndexError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.KeyError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.KeyError, Sk.builtin.Exception);
Sk.builtin.KeyError.prototype.tp$name = "KeyError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.NameError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.NameError, Sk.builtin.Exception);
Sk.builtin.NameError.prototype.tp$name = "NameError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.OverflowError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.OverflowError, Sk.builtin.Exception);
Sk.builtin.OverflowError.prototype.tp$name = "OverflowError";


/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ParseError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.ParseError, Sk.builtin.Exception);
Sk.builtin.ParseError.prototype.tp$name = "ParseError";


/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.SystemExit = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.SystemExit, Sk.builtin.Exception);
Sk.builtin.SystemExit.prototype.tp$name = "SystemExit";
goog.exportSymbol("Sk.builtin.SystemExit", Sk.builtin.SystemExit);


/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.SyntaxError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.SyntaxError, Sk.builtin.Exception);
Sk.builtin.SyntaxError.prototype.tp$name = "SyntaxError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.TokenError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.TokenError, Sk.builtin.Exception);
Sk.builtin.TokenError.prototype.tp$name = "TokenError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.TypeError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.TypeError, Sk.builtin.Exception);
Sk.builtin.TypeError.prototype.tp$name = "TypeError";
goog.exportSymbol("Sk.builtin.TypeError", Sk.builtin.TypeError);
/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ValueError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.ValueError, Sk.builtin.Exception);
Sk.builtin.ValueError.prototype.tp$name = "ValueError";
goog.exportSymbol("Sk.builtin.ValueError", Sk.builtin.ValueError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ZeroDivisionError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.ZeroDivisionError, Sk.builtin.Exception);
Sk.builtin.ZeroDivisionError.prototype.tp$name = "ZeroDivisionError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.TimeLimitError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.TimeLimitError, Sk.builtin.Exception);
Sk.builtin.TimeLimitError.prototype.tp$name = "TimeLimitError";
goog.exportSymbol("Sk.builtin.TimeLimitError", Sk.builtin.TimeLimitError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.IOError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.IOError, Sk.builtin.Exception);
Sk.builtin.IOError.prototype.tp$name = "IOError";
goog.exportSymbol("Sk.builtin.IOError", Sk.builtin.IOError);


/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.NotImplementedError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.NotImplementedError, Sk.builtin.Exception);
Sk.builtin.NotImplementedError.prototype.tp$name = "NotImplementedError";
goog.exportSymbol("Sk.builtin.NotImplementedError", Sk.builtin.NotImplementedError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.NegativePowerError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.NegativePowerError, Sk.builtin.Exception);
Sk.builtin.NegativePowerError.prototype.tp$name = "NegativePowerError";
goog.exportSymbol("Sk.builtin.NegativePowerError", Sk.builtin.NegativePowerError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.OperationError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.OperationError, Sk.builtin.Exception);
Sk.builtin.OperationError.prototype.tp$name = "OperationError";
goog.exportSymbol("Sk.builtin.OperationError", Sk.builtin.OperationError);

Sk.currLineNo = -1;
Sk.currColNo = -1;
Sk.currFilename = '';

goog.exportSymbol("Sk", Sk);
goog.exportProperty(Sk, "currLineNo", Sk.currLineNo);
goog.exportProperty(Sk, "currColNo", Sk.currColNo);
goog.exportProperty(Sk, "currFilename", Sk.currFilename);
