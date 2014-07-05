/*
 * This is a port of tokenize.py by Ka-Ping Yee.
 *
 * each call to readline should return one line of input as a string, or
 * undefined if it's finished.
 *
 * callback is called for each token with 5 args:
 * 1. the token type
 * 2. the token string
 * 3. [ start_row, start_col ]
 * 4. [ end_row, end_col ]
 * 5. logical line where the token was found, including continuation lines
 *
 * callback can return true to abort.
 *
 */

/**
 * @constructor
 */
Sk.Tokenizer = function (filename, interactive, callback) {
    this.filename = filename;
    this.callback = callback;
    this.lnum = 0;
    this.parenlev = 0;
    this.continued = false;
    this.namechars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
    this.numchars = "0123456789";
    this.contstr = "";
    this.needcont = false;
    this.contline = undefined;
    this.indents = [0];
    this.endprog = /.*/;
    this.strstart = [-1, -1];
    this.interactive = interactive;
    this.doneFunc = function () {
        var i;
        for (i = 1; i < this.indents.length; ++i) // pop remaining indent levels
        {
            if (this.callback(Sk.Tokenizer.Tokens.T_DEDENT, "", [this.lnum, 0], [this.lnum, 0], "")) {
                return "done";
            }
        }
        if (this.callback(Sk.Tokenizer.Tokens.T_ENDMARKER, "", [this.lnum, 0], [this.lnum, 0], "")) {
            return "done";
        }

        return "failed";
    };

};

/**
 * @enum {number}
 */
Sk.Tokenizer.Tokens = {
    T_ENDMARKER       : 0,
    T_NAME            : 1,
    T_NUMBER          : 2,
    T_STRING          : 3,
    T_NEWLINE         : 4,
    T_INDENT          : 5,
    T_DEDENT          : 6,
    T_LPAR            : 7,
    T_RPAR            : 8,
    T_LSQB            : 9,
    T_RSQB            : 10,
    T_COLON           : 11,
    T_COMMA           : 12,
    T_SEMI            : 13,
    T_PLUS            : 14,
    T_MINUS           : 15,
    T_STAR            : 16,
    T_SLASH           : 17,
    T_VBAR            : 18,
    T_AMPER           : 19,
    T_LESS            : 20,
    T_GREATER         : 21,
    T_EQUAL           : 22,
    T_DOT             : 23,
    T_PERCENT         : 24,
    T_BACKQUOTE       : 25,
    T_LBRACE          : 26,
    T_RBRACE          : 27,
    T_EQEQUAL         : 28,
    T_NOTEQUAL        : 29,
    T_LESSEQUAL       : 30,
    T_GREATEREQUAL    : 31,
    T_TILDE           : 32,
    T_CIRCUMFLEX      : 33,
    T_LEFTSHIFT       : 34,
    T_RIGHTSHIFT      : 35,
    T_DOUBLESTAR      : 36,
    T_PLUSEQUAL       : 37,
    T_MINEQUAL        : 38,
    T_STAREQUAL       : 39,
    T_SLASHEQUAL      : 40,
    T_PERCENTEQUAL    : 41,
    T_AMPEREQUAL      : 42,
    T_VBAREQUAL       : 43,
    T_CIRCUMFLEXEQUAL : 44,
    T_LEFTSHIFTEQUAL  : 45,
    T_RIGHTSHIFTEQUAL : 46,
    T_DOUBLESTAREQUAL : 47,
    T_DOUBLESLASH     : 48,
    T_DOUBLESLASHEQUAL: 49,
    T_AT              : 50,
    T_OP              : 51,
    T_COMMENT         : 52,
    T_NL              : 53,
    T_RARROW          : 54,
    T_ERRORTOKEN      : 55,
    T_N_TOKENS        : 56,
    T_NT_OFFSET       : 256
};

/** @param {...*} x */
function group (x) {
    var args = Array.prototype.slice.call(arguments);
    return "(" + args.join("|") + ")";
}

/** @param {...*} x */
function any (x) {
    return group.apply(null, arguments) + "*";
}

/** @param {...*} x */
function maybe (x) {
    return group.apply(null, arguments) + "?";
}

/* we have to use string and ctor to be able to build patterns up. + on /.../
 * does something strange. */
var Whitespace = "[ \\f\\t]*";
var Comment_ = "#[^\\r\\n]*";
var Ident = "[a-zA-Z_]\\w*";

var Binnumber = "0[bB][01]*";
var Hexnumber = "0[xX][\\da-fA-F]*[lL]?";
var Octnumber = "0[oO]?[0-7]*[lL]?";
var Decnumber = "[1-9]\\d*[lL]?";
var Intnumber = group(Binnumber, Hexnumber, Octnumber, Decnumber);

var Exponent = "[eE][-+]?\\d+";
var Pointfloat = group("\\d+\\.\\d*", "\\.\\d+") + maybe(Exponent);
var Expfloat = "\\d+" + Exponent;
var Floatnumber = group(Pointfloat, Expfloat);
var Imagnumber = group("\\d+[jJ]", Floatnumber + "[jJ]");
var Number_ = group(Imagnumber, Floatnumber, Intnumber);

// tail end of ' string
var Single = "^[^'\\\\]*(?:\\\\.[^'\\\\]*)*'";
// tail end of " string
var Double_ = '^[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
// tail end of ''' string
var Single3 = "[^'\\\\]*(?:(?:\\\\.|'(?!''))[^'\\\\]*)*'''";
// tail end of """ string
var Double3 = '[^"\\\\]*(?:(?:\\\\.|"(?!""))[^"\\\\]*)*"""';
var Triple = group("[ubUB]?[rR]?'''", '[ubUB]?[rR]?"""');
var String_ = group("[uU]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'",
    '[uU]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');

// Because of leftmost-then-longest match semantics, be sure to put the
// longest operators first (e.g., if = came before ==, == would get
// recognized as two instances of =).
var Operator = group("\\*\\*=?", ">>=?", "<<=?", "<>", "!=",
    "//=?", "->",
    "[+\\-*/%&|^=<>]=?",
    "~");

var Bracket = "[\\][(){}]";
var Special = group("\\r?\\n", "[:;.,`@]");
var Funny = group(Operator, Bracket, Special);

var ContStr = group("[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*" +
        group("'", "\\\\\\r?\\n"),
        "[uUbB]?[rR]?\"[^\\n\"\\\\]*(?:\\\\.[^\\n\"\\\\]*)*" +
        group("\"", "\\\\\\r?\\n"));
var PseudoExtras = group("\\\\\\r?\\n", Comment_, Triple);
// Need to prefix with "^" as we only want to match what's next
var PseudoToken = "^" + group(PseudoExtras, Number_, Funny, ContStr, Ident);


var triple_quoted = {
    "'''"  : true, '"""': true,
    "r'''" : true, 'r"""': true, "R'''": true, 'R"""': true,
    "u'''" : true, 'u"""': true, "U'''": true, 'U"""': true,
    "b'''" : true, 'b"""': true, "B'''": true, 'B"""': true,
    "ur'''": true, 'ur"""': true, "Ur'''": true, 'Ur"""': true,
    "uR'''": true, 'uR"""': true, "UR'''": true, 'UR"""': true,
    "br'''": true, 'br"""': true, "Br'''": true, 'Br"""': true,
    "bR'''": true, 'bR"""': true, "BR'''": true, 'BR"""': true
};

var single_quoted = {
    "'"  : true, '"': true,
    "r'" : true, 'r"': true, "R'": true, 'R"': true,
    "u'" : true, 'u"': true, "U'": true, 'U"': true,
    "b'" : true, 'b"': true, "B'": true, 'B"': true,
    "ur'": true, 'ur"': true, "Ur'": true, 'Ur"': true,
    "uR'": true, 'uR"': true, "UR'": true, 'UR"': true,
    "br'": true, 'br"': true, "Br'": true, 'Br"': true,
    "bR'": true, 'bR"': true, "BR'": true, 'BR"': true
};

// hack to make closure keep those objects. not sure what a better way is.
(function () {
    var k;
    for (k in triple_quoted) {
    }
    for (k in single_quoted) {
    }
}());


var tabsize = 8;

function contains (a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

function rstrip (input, what) {
    var i;
    for (i = input.length; i > 0; --i) {
        if (what.indexOf(input.charAt(i - 1)) === -1) {
            break;
        }
    }
    return input.substring(0, i);
}

Sk.Tokenizer.prototype.generateTokens = function (line) {
    var nl_pos;
    var newl;
    var initial;
    var token;
    var epos;
    var spos;
    var start;
    var pseudomatch;
    var capos;
    var comment_token;
    var endmatch, pos, column, end, max;


    // bnm - Move these definitions in this function otherwise test state is preserved between
    // calls on single3prog and double3prog causing weird errors with having multiple instances
    // of triple quoted strings in the same program.

    var pseudoprog = new RegExp(PseudoToken);
    var single3prog = new RegExp(Single3, "g");
    var double3prog = new RegExp(Double3, "g");

    var endprogs = {     "'": new RegExp(Single, "g"), "\"": new RegExp(Double_, "g"),
        "'''"               : single3prog, '"""': double3prog,
        "r'''"              : single3prog, 'r"""': double3prog,
        "u'''"              : single3prog, 'u"""': double3prog,
        "b'''"              : single3prog, 'b"""': double3prog,
        "ur'''"             : single3prog, 'ur"""': double3prog,
        "br'''"             : single3prog, 'br"""': double3prog,
        "R'''"              : single3prog, 'R"""': double3prog,
        "U'''"              : single3prog, 'U"""': double3prog,
        "B'''"              : single3prog, 'B"""': double3prog,
        "uR'''"             : single3prog, 'uR"""': double3prog,
        "Ur'''"             : single3prog, 'Ur"""': double3prog,
        "UR'''"             : single3prog, 'UR"""': double3prog,
        "bR'''"             : single3prog, 'bR"""': double3prog,
        "Br'''"             : single3prog, 'Br"""': double3prog,
        "BR'''"             : single3prog, 'BR"""': double3prog,
        'r'                 : null, 'R': null,
        'u'                 : null, 'U': null,
        'b'                 : null, 'B': null
    };


    if (!line) {
        line = '';
    }
    //print("LINE:'"+line+"'");

    this.lnum += 1;
    pos = 0;
    max = line.length;

    if (this.contstr.length > 0) {
        if (!line) {
            throw new Sk.builtin.TokenError("EOF in multi-line string", this.filename, this.strstart[0], this.strstart[1], this.contline);
        }
        this.endprog.lastIndex = 0;
        endmatch = this.endprog.test(line);
        if (endmatch) {
            pos = end = this.endprog.lastIndex;
            if (this.callback(Sk.Tokenizer.Tokens.T_STRING, this.contstr + line.substring(0, end),
                this.strstart, [this.lnum, end], this.contline + line)) {
                return 'done';
            }
            this.contstr = '';
            this.needcont = false;
            this.contline = undefined;
        }
        else if (this.needcont && line.substring(line.length - 2) !== "\\\n" && line.substring(line.length - 3) !== "\\\r\n") {
            if (this.callback(Sk.Tokenizer.Tokens.T_ERRORTOKEN, this.contstr + line,
                this.strstart, [this.lnum, line.length], this.contline)) {
                return 'done';
            }
            this.contstr = '';
            this.contline = undefined;
            return false;
        }
        else {
            this.contstr += line;
            this.contline = this.contline + line;
            return false;
        }
    }
    else if (this.parenlev === 0 && !this.continued) {
        if (!line) {
            return this.doneFunc();
        }
        column = 0;
        while (pos < max) {
            if (line.charAt(pos) === ' ') {
                column += 1;
            }
            else if (line.charAt(pos) === '\t') {
                column = (column / tabsize + 1) * tabsize;
            }
            else if (line.charAt(pos) === '\f') {
                column = 0;
            }
            else {
                break;
            }
            pos = pos + 1;
        }
        if (pos === max) {
            return this.doneFunc();
        }

        if ("#\r\n".indexOf(line.charAt(pos)) !== -1) // skip comments or blank lines
        {
            if (line.charAt(pos) === '#') {
                comment_token = rstrip(line.substring(pos), '\r\n');
                nl_pos = pos + comment_token.length;
                if (this.callback(Sk.Tokenizer.Tokens.T_COMMENT, comment_token,
                    [this.lnum, pos], [this.lnum, pos + comment_token.length], line)) {
                    return 'done';
                }
                //print("HERE:1");
                if (this.callback(Sk.Tokenizer.Tokens.T_NL, line.substring(nl_pos),
                    [this.lnum, nl_pos], [this.lnum, line.length], line)) {
                    return 'done';
                }
                return false;
            }
            else {
                //print("HERE:2");
                if (this.callback(Sk.Tokenizer.Tokens.T_NL, line.substring(pos),
                    [this.lnum, pos], [this.lnum, line.length], line)) {
                    return 'done';
                }
                if (!this.interactive) {
                    return false;
                }
            }
        }

        if (column > this.indents[this.indents.length - 1]) // count indents or dedents
        {
            this.indents.push(column);
            if (this.callback(Sk.Tokenizer.Tokens.T_INDENT, line.substring(0, pos), [this.lnum, 0], [this.lnum, pos], line)) {
                return 'done';
            }
        }
        while (column < this.indents[this.indents.length - 1]) {
            if (!contains(this.indents, column)) {
                throw new Sk.builtin.IndentationError("unindent does not match any outer indentation level",
                    this.filename, this.lnum, pos, line);
            }
            this.indents.splice(this.indents.length - 1, 1);
            //print("dedent here");
            if (this.callback(Sk.Tokenizer.Tokens.T_DEDENT, '', [this.lnum, pos], [this.lnum, pos], line)) {
                return 'done';
            }
        }
    }
    else // continued statement
    {
        if (!line) {
            throw new Sk.builtin.TokenError("EOF in multi-line statement", this.filename, this.lnum, 0, line);
        }
        this.continued = false;
    }

    while (pos < max) {
        //print("pos:"+pos+":"+max);
        // js regexes don't return any info about matches, other than the
        // content. we'd like to put a \w+ before pseudomatch, but then we
        // can't get any data
        capos = line.charAt(pos);
        while (capos === ' ' || capos === '\f' || capos === '\t') {
            pos += 1;
            capos = line.charAt(pos);
        }
        pseudoprog.lastIndex = 0;
        pseudomatch = pseudoprog.exec(line.substring(pos));
        if (pseudomatch) {
            start = pos;
            end = start + pseudomatch[1].length;
            spos = [this.lnum, start];
            epos = [this.lnum, end];
            pos = end;
            token = line.substring(start, end);
            initial = line.charAt(start);
            //Sk.debugout("token:",token, "initial:",initial, start, end);
            if (this.numchars.indexOf(initial) !== -1 || (initial === '.' && token !== '.')) {
                if (this.callback(Sk.Tokenizer.Tokens.T_NUMBER, token, spos, epos, line)) {
                    return 'done';
                }
            }
            else if (initial === '\r' || initial === '\n') {
                newl = Sk.Tokenizer.Tokens.T_NEWLINE;
                //print("HERE:3");
                if (this.parenlev > 0) {
                    newl = Sk.Tokenizer.Tokens.T_NL;
                }
                if (this.callback(newl, token, spos, epos, line)) {
                    return 'done';
                }
            }
            else if (initial === '#') {
                if (this.callback(Sk.Tokenizer.Tokens.T_COMMENT, token, spos, epos, line)) {
                    return 'done';
                }
            }
            else if (triple_quoted.hasOwnProperty(token)) {
                this.endprog = endprogs[token];
                this.endprog.lastIndex = 0;
                endmatch = this.endprog.test(line.substring(pos));
                if (endmatch) {
                    pos = this.endprog.lastIndex + pos;
                    token = line.substring(start, pos);
                    if (this.callback(Sk.Tokenizer.Tokens.T_STRING, token, spos, [this.lnum, pos], line)) {
                        return 'done';
                    }
                }
                else {
                    this.strstart = [this.lnum, start];
                    this.contstr = line.substring(start);
                    this.contline = line;
                    return false;
                }
            }
            else if (single_quoted.hasOwnProperty(initial) ||
                single_quoted.hasOwnProperty(token.substring(0, 2)) ||
                single_quoted.hasOwnProperty(token.substring(0, 3))) {
                if (token[token.length - 1] === '\n') {
                    this.strstart = [this.lnum, start];
                    this.endprog = endprogs[initial] || endprogs[token[1]] || endprogs[token[2]];
                    this.contstr = line.substring(start);
                    this.needcont = true;
                    this.contline = line;
                    //print("i, t1, t2", initial, token[1], token[2]);
                    //print("ep, cs", this.endprog, this.contstr);
                    return false;
                }
                else {
                    if (this.callback(Sk.Tokenizer.Tokens.T_STRING, token, spos, epos, line)) {
                        return 'done';
                    }
                }
            }
            else if (this.namechars.indexOf(initial) !== -1) {
                if (this.callback(Sk.Tokenizer.Tokens.T_NAME, token, spos, epos, line)) {
                    return 'done';
                }
            }
            else if (initial === '\\') {
                //print("HERE:4");
                if (this.callback(Sk.Tokenizer.Tokens.T_NL, token, spos, [this.lnum, pos], line)) {
                    return 'done';
                }
                this.continued = true;
            }
            else {
                if ('([{'.indexOf(initial) !== -1) {
                    this.parenlev += 1;
                }
                else if (')]}'.indexOf(initial) !== -1) {
                    this.parenlev -= 1;
                }
                if (this.callback(Sk.Tokenizer.Tokens.T_OP, token, spos, epos, line)) {
                    return 'done';
                }
            }
        }
        else {
            if (this.callback(Sk.Tokenizer.Tokens.T_ERRORTOKEN, line.charAt(pos),
                [this.lnum, pos], [this.lnum, pos + 1], line)) {
                return 'done';
            }
            pos += 1;
        }
    }

    return false;
};

Sk.Tokenizer.tokenNames = {
    0  : 'T_ENDMARKER', 1: 'T_NAME', 2: 'T_NUMBER', 3: 'T_STRING', 4: 'T_NEWLINE',
    5  : 'T_INDENT', 6: 'T_DEDENT', 7: 'T_LPAR', 8: 'T_RPAR', 9: 'T_LSQB',
    10 : 'T_RSQB', 11: 'T_COLON', 12: 'T_COMMA', 13: 'T_SEMI', 14: 'T_PLUS',
    15 : 'T_MINUS', 16: 'T_STAR', 17: 'T_SLASH', 18: 'T_VBAR', 19: 'T_AMPER',
    20 : 'T_LESS', 21: 'T_GREATER', 22: 'T_EQUAL', 23: 'T_DOT', 24: 'T_PERCENT',
    25 : 'T_BACKQUOTE', 26: 'T_LBRACE', 27: 'T_RBRACE', 28: 'T_EQEQUAL', 29: 'T_NOTEQUAL',
    30 : 'T_LESSEQUAL', 31: 'T_GREATEREQUAL', 32: 'T_TILDE', 33: 'T_CIRCUMFLEX', 34: 'T_LEFTSHIFT',
    35 : 'T_RIGHTSHIFT', 36: 'T_DOUBLESTAR', 37: 'T_PLUSEQUAL', 38: 'T_MINEQUAL', 39: 'T_STAREQUAL',
    40 : 'T_SLASHEQUAL', 41: 'T_PERCENTEQUAL', 42: 'T_AMPEREQUAL', 43: 'T_VBAREQUAL', 44: 'T_CIRCUMFLEXEQUAL',
    45 : 'T_LEFTSHIFTEQUAL', 46: 'T_RIGHTSHIFTEQUAL', 47: 'T_DOUBLESTAREQUAL', 48: 'T_DOUBLESLASH', 49: 'T_DOUBLESLASHEQUAL',
    50 : 'T_AT', 51: 'T_OP', 52: 'T_COMMENT', 53: 'T_NL', 54: 'T_RARROW',
    55 : 'T_ERRORTOKEN', 56: 'T_N_TOKENS',
    256: 'T_NT_OFFSET'
};

goog.exportSymbol("Sk.Tokenizer", Sk.Tokenizer);
goog.exportSymbol("Sk.Tokenizer.prototype.generateTokens", Sk.Tokenizer.prototype.generateTokens);
goog.exportSymbol("Sk.Tokenizer.tokenNames", Sk.Tokenizer.tokenNames);
