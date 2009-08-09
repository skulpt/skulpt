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
var T_ENDMARKER = 0;
var T_NAME = 1;
var T_NUMBER = 2;
var T_STRING = 3;
var T_NEWLINE = 4;
var T_INDENT = 5;
var T_DEDENT = 6;
var T_LPAR = 7;
var T_RPAR = 8;
var T_LSQB = 9;
var T_RSQB = 10;
var T_COLON = 11;
var T_COMMA = 12;
var T_SEMI = 13;
var T_PLUS = 14;
var T_MINUS = 15;
var T_STAR = 16;
var T_SLASH = 17;
var T_VBAR = 18;
var T_AMPER = 19;
var T_LESS = 20;
var T_GREATER = 21;
var T_EQUAL = 22;
var T_DOT = 23;
var T_PERCENT = 24;
var T_BACKQUOTE = 25;
var T_LBRACE = 26;
var T_RBRACE = 27;
var T_EQEQUAL = 28;
var T_NOTEQUAL = 29;
var T_LESSEQUAL = 30;
var T_GREATEREQUAL = 31;
var T_TILDE = 32;
var T_CIRCUMFLEX = 33;
var T_LEFTSHIFT = 34;
var T_RIGHTSHIFT = 35;
var T_DOUBLESTAR = 36;
var T_PLUSEQUAL = 37;
var T_MINEQUAL = 38;
var T_STAREQUAL = 39;
var T_SLASHEQUAL = 40;
var T_PERCENTEQUAL = 41;
var T_AMPEREQUAL = 42;
var T_VBAREQUAL = 43;
var T_CIRCUMFLEXEQUAL = 44;
var T_LEFTSHIFTEQUAL = 45;
var T_RIGHTSHIFTEQUAL = 46;
var T_DOUBLESTAREQUAL = 47;
var T_DOUBLESLASH = 48;
var T_DOUBLESLASHEQUAL = 49;
var T_AT = 50;
var T_OP = 51;
var T_COMMENT = 52;
var T_NL = 53;
var T_RARROW = 54;
var T_ERRORTOKEN = 55;
var T_N_TOKENS = 56;
var T_NT_OFFSET = 256;

function group()
{
    var args = Array.prototype.slice.call(arguments);
    return '(' + args.join('|') + ')'; 
}
function any() { return group.apply(null, arguments) + "*"; }
function maybe() { return group.apply(null, arguments) + "?"; }

/* we have to use string and ctor to be able to build patterns up. + on /.../
 * does something strange. */
var Whitespace = "[ \\f\\t]*";
var Comment = "#[^\\r\\n]*";
var Ident = "[a-zA-Z_]\\w*";

var Binnumber = '0[bB][01]*';
var Hexnumber = '0[xX][\\da-fA-F]*[lL]?';
var Octnumber = '0[oO]?[0-7]*[lL]?';
var Decnumber = '[1-9]\\d*[lL]?';
var Intnumber = group(Binnumber, Hexnumber, Octnumber, Decnumber);

var Exponent = "[eE][-+]?\\d+";
var Pointfloat = group("\\d+\\.\\d*", "\\.\\d+") + maybe(Exponent);
var Expfloat = '\\d+' + Exponent;
var Floatnumber = group(Pointfloat, Expfloat);
var Imagnumber = group("\\d+[jJ]", Floatnumber + "[jJ]");
var Number_ = group(Imagnumber, Floatnumber, Intnumber);

// tail end of ' string
var Single = "[^'\\\\]*(?:\\\\.[^'\\\\]*)*'";
// tail end of " string
var Double_= '[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
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

var Bracket = '[\\][(){}]';
var Special = group('\\r?\\n', '[:;.,`@]');
var Funny  = group(Operator, Bracket, Special);

var ContStr = group("[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*" +
                group("'", '\\\\\\r?\\n'),
                '[uUbB]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*' +
                group('"', '\\\\\\r?\\n'));
var PseudoExtras = group('\\\\\\r?\\n', Comment, Triple);
var PseudoToken = group(PseudoExtras, Number_, Funny, ContStr, Ident);

var pseudoprog = new RegExp(PseudoToken);
var single3prog = new RegExp(Single3, "g");
var double3prog = new RegExp(Double3, "g");
var endprogs = {
    "'": new RegExp(Single, "g"), '"': new RegExp(Double_, "g"),
    "'''": single3prog, '"""': double3prog,
    "r'''": single3prog, 'r"""': double3prog,
    "u'''": single3prog, 'u"""': double3prog,
    "b'''": single3prog, 'b"""': double3prog,
    "ur'''": single3prog, 'ur"""': double3prog,
    "br'''": single3prog, 'br"""': double3prog,
    "R'''": single3prog, 'R"""': double3prog,
    "U'''": single3prog, 'U"""': double3prog,
    "B'''": single3prog, 'B"""': double3prog,
    "uR'''": single3prog, 'uR"""': double3prog,
    "Ur'''": single3prog, 'Ur"""': double3prog,
    "UR'''": single3prog, 'UR"""': double3prog,
    "bR'''": single3prog, 'bR"""': double3prog,
    "Br'''": single3prog, 'Br"""': double3prog,
    "BR'''": single3prog, 'BR"""': double3prog,
    'r': null, 'R': null,
    'u': null, 'U': null,
    'b': null, 'B': null
};

var triple_quoted = {
"'''": true, '"""': true,
"r'''": true, 'r"""': true, "R'''": true, 'R"""': true,
"u'''": true, 'u"""': true, "U'''": true, 'U"""': true,
"b'''": true, 'b"""': true, "B'''": true, 'B"""': true,
"ur'''": true, 'ur"""': true, "Ur'''": true, 'Ur"""': true,
"uR'''": true, 'uR"""': true, "UR'''": true, 'UR"""': true,
"br'''": true, 'br"""': true, "Br'''": true, 'Br"""': true,
"bR'''": true, 'bR"""': true, "BR'''": true, 'BR"""': true
};

var single_quoted = {
"'": true, '"': true,
"r'": true, 'r"': true, "R'": true, 'R"': true,
"u'": true, 'u"': true, "U'": true, 'U"': true,
"b'": true, 'b"': true, "B'": true, 'B"': true,
"ur'": true, 'ur"': true, "Ur'": true, 'Ur"': true,
"uR'": true, 'uR"': true, "UR'": true, 'UR"': true,
"br'": true, 'br"': true, "Br'": true, 'Br"': true,
"bR'": true, 'bR"': true, "BR'": true, 'BR"': true
};

var tabsize = 8;

function contains(a, obj)
{
    var i = a.length;
    while (i--)
    {
        if (a[i] === obj)
        {
            return true;
        }
    }
    return false;
}

function rstrip(input, what)
{
    for (var i = input.length; i > 0; --i)
    {
        if (what.indexOf(input[i - 1]) === -1) break;
    }
    return input.substring(0, i);
}

function Tokenizer(filename, callback)
{
    this.filename = filename;
    this.callback = callback;
    this.lnum = 0;
    this.parenlev = 0;
    this.continued = false;
    this.namechars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    this.numchars = '0123456789';
    this.contstr = '';
    this.needcont = false;
    this.contline = undefined;
    this.indents = [0];
    this.endprog = undefined;
    this.strstart = undefined;
    this.doneFunc = function()
    {
        for (var i = 1; i < this.indents.length; ++i) // pop remaining indent levels
        {
            if (this.callback(T_DEDENT, '', [this.lnum, 0], [this.lnum, 0], '')) return 'done';
        }
        if (this.callback(T_ENDMARKER, '', [this.lnum, 0], [this.lnum, 0], '')) return 'done';

        return 'failed';
    };
}
Tokenizer.prototype.generateTokens = function(line)
{
    var endmatch, pos, column, end, max;

    if (!line) line = '';
    //print("LINE:'"+line+"'");

    this.lnum += 1;
    pos = 0;
    max = line.length;

    if (this.contstr.length > 0)
    {
        if (!line)
        {
            throw new TokenError("EOF in multi-line string", this.filename, this.strstart[0], this.strstart[1], this.contline);
        }
        endmatch = this.endprog.test(line);
        if (endmatch)
        {
            pos = end = this.endprog.lastIndex;
            if (this.callback(T_STRING, this.contstr + line.substring(0,end),
                        this.strstart, [this.lnum, end], this.contline + line))
                return 'done';
            this.contstr = '';
            this.needcont = false;
            this.contline = undefined;
        }
        else if (this.needcont && line.substring(line.length - 2) !== "\\\n" && line.substring(line.length - 3) !== "\\\r\n")
        {
            if (this.callback(T_ERRORTOKEN, this.contstr + line,
                        this.strstart, [this.lnum, line.length], this.contline))
                return 'done';
            this.contstr = '';
            this.contline = undefined;
            return false;
        }
        else
        {
            this.contstr += line;
            this.contline = this.contline + line;
            return false;
        }
    }
    else if (this.parenlev === 0 && !this.continued)
    {
        if (!line) return this.doneFunc();
        column = 0;
        while (pos < max)
        {
            if (line[pos] === ' ') column += 1;
            else if (line[pos] === '\t') column = (column/tabsize + 1)*tabsize;
            else if (line[pos] === '\f') column = 0;
            else break;
            pos = pos + 1;
        }
        if (pos === max) return this.doneFunc();

        if ("#\r\n".indexOf(line[pos]) !== -1) // skip comments or blank lines
        {
            if (line[pos] === '#')
            {
                var comment_token = rstrip(line.substring(pos), '\r\n');
                var nl_pos = pos + comment_token.length;
                if (this.callback(T_COMMENT, comment_token,
                            [this.lnum, pos], [this.lnum, pos + comment_token.length], line))
                    return 'done';
                //print("HERE:1");
                if (this.callback(T_NL, line.substring(nl_pos),
                            [this.lnum, nl_pos], [this.lnum, line.length], line))
                    return 'done';
                return false;
            }
            /*
            else
            {
                //print("HERE:2");
                if (this.callback(line[pos] === '#' ? T_COMMENT : T_NL, line.substring(pos),
                            [this.lnum, pos], [this.lnum, line.length], line))
                    return 'done';
            }
            */
        }

        if (column > this.indents[this.indents.length - 1]) // count indents or dedents
        {
            this.indents.push(column);
            if (this.callback(T_INDENT, line.substring(0, pos), [this.lnum, 0], [this.lnum, pos], line))
                return 'done';
        }
        while (column < this.indents[this.indents.length - 1])
        {
            if (!contains(this.indents, column))
            {
                throw new IndentationError("unindent does not match any outer indentation level",
                        this.filename, this.lnum, pos, line);
            }
            this.indents.splice(this.indents.length - 1, 1);
            if (this.callback(T_DEDENT, '', [this.lnum, pos], [this.lnum, pos], line))
                return 'done';
        }
    }
    else // continued statement
    {
        if (!line)
        {
            throw new TokenError("EOF in multi-line statement", this.filename, this.lnum, 0, line);
        }
        this.continued = false;
    }

    while (pos < max)
    {
        //print("pos:"+pos+":"+max);
        // js regexes don't return any info about matches, other than the
        // content. we'd like to put a \w+ before pseudomatch, but then we
        // can't get any data
        while (line[pos] === ' ' || line[pos] === '\f' || line[pos] === '\t')
        {
            pos += 1;
        }
        var pseudomatch = pseudoprog.exec(line.substring(pos));
        if (pseudomatch)
        {
            var start = pos;
            end = start + pseudomatch[1].length;
            var spos = [this.lnum, start];
            var epos = [this.lnum, end];
            pos = end;
            var token = line.substring(start, end);
            var initial = line[start];
            //print("initial:'" +initial +"'");
            if (this.numchars.indexOf(initial) !== -1 || (initial === '.' && token !== '.'))
            {
                if (this.callback(T_NUMBER, token, spos, epos, line)) return 'done';
            }
            else if (initial === '\r' || initial === '\n')
            {
                var newl = T_NEWLINE;
                //print("HERE:3");
                if (this.parenlev > 0) newl = T_NL;
                if (this.callback(newl, token, spos, epos, line)) return 'done';
            }
            else if (initial === '#')
            {
                if (this.callback(T_COMMENT, token, spos, epos, line)) return 'done';
            }
            else if (token in triple_quoted)
            {
                this.endprog = endprogs[token];
                endmatch = this.endprog.test(line.substring(pos));
                if (endmatch)
                {
                    pos = this.endprog.lastIndex + pos;
                    token = line.substring(start, pos);
                    if (this.callback(T_STRING, token, spos, [this.lnum, pos], line)) return 'done';
                }
                else
                {
                    this.strstart = [this.lnum, start];
                    this.contstr = line.substring(start);
                    this.contline = line;
                    return false;
                }
            }
            else if (initial in single_quoted ||
                    token.substring(0, 2) in single_quoted ||
                    token.substring(0, 3) in single_quoted)
            {
                if (token[token.length - 1] === '\n')
                {
                    this.strstart = [this.lnum, start];
                    this.endprog = endprogs[initial] || endprogs[token[1]] || endprogs[token[2]];
                    this.contstr = line.substring(start);
                    this.needcont = true;
                    this.contline = line;
                    return false;
                }
                else
                {
                    if (this.callback(T_STRING, token, spos, epos, line)) return 'done';
                }
            }
            else if (this.namechars.indexOf(initial) !== -1)
            {
                if (this.callback(T_NAME, token, spos, epos, line)) return 'done';
            }
            else if (initial === '\\')
            {
                //print("HERE:4");
                if (this.callback(T_NL, token, spos, [this.lnum, pos], line)) return 'done';
                this.continued = true;
            }
            else
            {
                if ('([{'.indexOf(initial) !== -1) this.parenlev += 1;
                else if (')]}'.indexOf(initial) !== -1) this.parenlev -= 1;
                if (this.callback(T_OP, token, spos, epos, line)) return 'done';
            }
        }
        else
        {
            if (this.callback(T_ERRORTOKEN, line[pos],
                        [this.lnum, pos], [this.lnum, pos+1], line))
                return 'done';
            pos += 1;
        }
    }

    return false;
};
