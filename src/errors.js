function ErrorToString()
{
    if (typeof this === "object" && this.isSkError === true)
    {
        var ret = "File \"" + this.file + "\", " + "line " + this.lnum + "\n" +
            this.line + "\n";
        for (var i = 0; i < this.col; ++i) ret += " ";
        ret += "^\n";
        ret += this.type + ": " + this.msg + "\n";
        return ret;
    }
    return "INTERNAL ERROR:\n" + this.message + "\n" + this.stack + "\n";
}

function makeStdError(obj, type, rest)
{
    obj.isSkError = true;
    obj.type = type;
    obj.msg = rest[0];
    obj.file = rest[1];
    obj.lnum = rest[2];
    obj.col = rest[3];
    obj.line = rest[4];
    obj.toString = ErrorToString;
    return obj;
}

Sk.builtin.AttributeError = function AttributeError(msg, file, lnum, col, line) { return makeStdError(this, "AttributeError", arguments); };
Sk.builtin.ImportError = function ImportError(msg, file, lnum, col, line) { return makeStdError(this, "ImportError", arguments); };
Sk.builtin.IndentationError = function IndentationError(msg, file, lnum, col, line) { return makeStdError(this, "IndentationError", arguments); };
Sk.builtin.IndexError = function IndexError(msg, file, lnum, col, line) { return makeStdError(this, "IndexError", arguments); };
Sk.builtin.ParseError = function ParseError(msg, file, lnum, col, line) { return makeStdError(this, "ParseError", arguments); };
Sk.builtin.SyntaxError = function SyntaxError(msg, file, lnum, col, line) { return makeStdError(this, "SyntaxError", arguments); };
Sk.builtin.TokenError = function TokenError(msg, file, lnum, col, line) { return makeStdError(this, "TokenError", arguments); };
Sk.builtin.TypeError = function TypeError(msg, file, lnum, col, line) { return makeStdError(this, "TypeError", arguments); };
Sk.builtin.ValueError = function ValueError(msg, file, lnum, col, line) { return makeStdError(this, "ValueError", arguments); };
Sk.builtin.ZeroDivisionError = function ZeroDivisionError(msg, file, lnum, col, line) { return makeStdError(this, "ZeroDivisionError", arguments); };
