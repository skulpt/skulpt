/**
 * @constructor
 * @param {...*} args
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
};
Sk.builtin.Exception.prototype.tp$name = "Exception";

Sk.builtin.Exception.prototype.tp$str = function()
{
    var ret = "";
    //print(JSON.stringify(this.args));
    if (this.args.v.length > 1)
    {
        var ret = "File \"" + this.args.v[1].v + "\", " + "line " + this.args.v[2] + "\n" +
            this.args.v[4].v + "\n";
        for (var i = 0; i < this.args.v[3]; ++i) ret += " ";
        ret += "^\n";
    }
    ret += this.tp$name;
    if (this.args)
        ret += ": " + this.args.v[0].v;
    return new Sk.builtin.str(ret);
};

Sk.builtin.Exception.prototype.toString = function()
{
    return this.tp$str().v;
}

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
Sk.builtin.ParseError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.ParseError, Sk.builtin.Exception);
Sk.builtin.ParseError.prototype.tp$name = "ParseError";

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

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ZeroDivisionError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.ZeroDivisionError, Sk.builtin.Exception);
Sk.builtin.ZeroDivisionError.prototype.tp$name = "ZeroDivisionError";
