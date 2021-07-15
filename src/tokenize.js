import Unicode from "../support/polyfills/Unicode";

var tokens = Sk.token.tokens;

const TokenError = Sk.builtin.SyntaxError;
const IndentationError = Sk.builtin.SyntaxError;

/**
 *
 * @constructor
 * @param {number} type
 * @param {string} string
 * @param {Array<number>} start
 * @param {Array<number>} end
 * @param {string} line
 */
function TokenInfo(type, string, start, end, line) {
    this.type = type;
    this.string = string;
    this.start = start;
    this.end = end;
    this.line = line;
}

TokenInfo.prototype.exact_type = function() {
    if (this.type == tokens.T_OP && this.string in Sk.token.EXACT_TOKEN_TYPES) {
    return Sk.token.EXACT_TOKEN_TYPES[this.string]
    } else {
        return this.type
    }
}

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

var reRegExpChar = /[\\^$.*+?()[\]{}|]/g,
    reHasRegExpChar = RegExp(reRegExpChar.source);

function regexEscape(string) {
    return (string && reHasRegExpChar.test(string))
        ? string.replace(reRegExpChar, '\\$&')
        : string;
}

/**
 * Iterable contains
 * @template T
 * @param {T} a
 * @param {T} obj
 */
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



const { Lu, Ll, Lt, Lm, Lo, Nl, Mn, Mc, Nd, Pc } = Unicode;
const the_underscore = "_";
const Other_ID_Start = "\\u1885-\\u1886\\u2118\\u212E\\u309B-\\u309C";
const Other_ID_Continue = "\\u00B7\\u0387\\u1369-\\u1371\\u19DA";
const id_start = Lu + Ll + Lt + Lm + Lo + Nl + the_underscore + Other_ID_Start;
const id_continue = id_start + Mn + Mc + Nd + Pc + Other_ID_Continue;

const IS_IDENTIFIER_REGEX = new RegExp("^([" + id_start + "])+([" + id_continue + "])*$");


/**
 * test if string is an identifier
 *
 * @param {str} string
 * @returns {boolean}
 */
function isidentifier(str) {
    var normalized = str.normalize('NFKC');
    return IS_IDENTIFIER_REGEX.test(normalized);
}

Sk.token.isIdentifier = isidentifier;

/* we have to use string and ctor to be able to build patterns up. + on /.../
 * does something strange.
 * Note: we use unicode matching for names ("\w") but ascii matching for
 * number literals.
 *
 * I don't know if the comment above is still actually correct */
var Whitespace = "[ \\f\\t]*";
var Comment_ = "#[^\\r\\n]*";
var Ignore = Whitespace + any("\\\\\\r?\\n" + Whitespace) + maybe(Comment_);
var Name = "[" + Unicode.w + "]+";


var Exponent = "[eE][-+]?[0-9](?:_?[0-9])*";
var Pointfloat = group("[0-9](?:_?[0-9])*\\.(?:[0-9](?:_?[0-9])*)?", "\\.[0-9](?:_?[0-9])*") + maybe(Exponent);
var Expfloat = "[0-9](?:_?[0-9])*" + Exponent;
var Floatnumber = group(Pointfloat, Expfloat);
var Imagnumber = group("[0-9](?:_?[0-9])*[jJ]", Floatnumber + "[jJ]");

// Return the empty string, plus all of the valid string prefixes.
function _all_string_prefixes() {
    return [
        '', 'FR', 'RF', 'Br', 'BR', 'Fr', 'r', 'B', 'R', 'b', 'bR',
        'f', 'rb', 'rB', 'F', 'Rf', 'U', 'rF', 'u', 'RB', 'br', 'fR',
        'fr', 'rf', 'Rb'];
}

// Note that since _all_string_prefixes includes the empty string,
//  StringPrefix can be the empty string (making it optional).
var StringPrefix = group.apply(null, _all_string_prefixes())

// these regexes differ from python because .exec doesn't do the
// same thing as .match in python. It's more like .search.
// .match matches from the start of the string.
// to get the same behaviour we can add a ^ to the start of the
// regex
// Tail end of ' string.
var Single = "^[^'\\\\]*(?:\\\\.[^'\\\\]*)*'";
// Tail end of " string.
var Double = '^[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
// Tail end of ''' string.
var Single3 = "^[^'\\\\]*(?:(?:\\\\.|'(?!''))[^'\\\\]*)*'''";
// Tail end of """ string.
var Double3 = '^[^"\\\\]*(?:(?:\\\\.|"(?!""))[^"\\\\]*)*"""';
var Triple = group(StringPrefix + "'''", StringPrefix + '"""');
// Single-line ' or " string.
var String_ = group(StringPrefix + "'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'",
                    StringPrefix + '"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');

// Sorting in reverse order puts the long operators before their prefixes.
// Otherwise if = came before ==, == would get recognized as two instances
// of =.
var EXACT_TOKENS_SORTED;
var Special;
var Funny;

function setupTokens(py3) {
    // recompute the above two lines
    // <> should be included in py2 mode
    if (py3) {
        delete Sk.token.EXACT_TOKEN_TYPES["<>"];
    } else {
        Sk.token.EXACT_TOKEN_TYPES["<>"] = Sk.token.tokens.T_NOTEQUAL;
    }
    EXACT_TOKENS_SORTED = Object.keys(Sk.token.EXACT_TOKEN_TYPES).sort();
    Special = group.apply(
        this,
        EXACT_TOKENS_SORTED.reverse().map(function (t) {
            return regexEscape(t);
        })
    );
    Funny = group("\\r?\\n", Special);
}
setupTokens(true);

Sk.token.setupTokens = setupTokens;



// these aren't actually used
// var PlainToken = group(Number_, Funny, String_, Name);
// var Token = Ignore + PlainToken;

// First (or only) line of ' or " string.
var ContStr = group(StringPrefix + "'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*" +
                group("'", '\\\\\\r?\\n'),
                StringPrefix + '"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*' +
                group('"', '\\\\\\r?\\n'))
var PseudoExtras = group('\\\\\\r?\\n|$', Comment_, Triple);

// For a given string prefix plus quotes, endpats maps it to a regex
//  to match the remainder of that string. _prefix can be empty, for
//  a normal single or triple quoted string (with no prefix).
var endpats = {}
var prefixes = _all_string_prefixes();
for (let _prefix of prefixes) {
    endpats[_prefix + "'"] = Single
    endpats[_prefix + '"'] = Double
    endpats[_prefix + "'''"] = Single3
    endpats[_prefix + '"""'] = Double3
}

// A set of all of the single and triple quoted string prefixes,
//  including the opening quotes.
let single_quoted = []
let triple_quoted = []
for (let t of prefixes) {
    single_quoted.push(t + '"');
    single_quoted.push(t + "'");
    triple_quoted.push(t + '"""');
    triple_quoted.push(t + "'''");
}

var tabsize = 8

/**
 * internal tokenize function
 *
 * @param {function(): string} readline
 * @param {string} encoding
 * @param {function(TokenInfo): void} yield_
 */
function _tokenize(filename, readline, encoding, yield_) {
    // we make these regexes here because they can
    // be changed by the configuration.
    var LSuffix = !Sk.__future__.python3 ? '(?:L?)' : '';
    var Hexnumber = '0[xX](?:_?[0-9a-fA-F])+' + LSuffix;
    var Binnumber = '0[bB](?:_?[01])+' + LSuffix;
    var Octnumber = '0([oO])(?:_?[0-7])+' + LSuffix;
    var SilentOctnumber = '0([oO]?)(?:_?[0-7])+' + LSuffix;
    var Decnumber = '(?:0(?:_?0)*|[1-9](?:_?[0-9])*)' + LSuffix;
    var Intnumber = group(Hexnumber, Binnumber,
                          (Sk.__future__.silent_octal_literal ? SilentOctnumber : Octnumber), Decnumber);
    var Number_ = group(Imagnumber, Floatnumber, Intnumber);
    var PseudoToken = Whitespace + group(PseudoExtras, Number_, Funny, ContStr, Name);

    const PseudoTokenRegexp = new RegExp(PseudoToken);

    var lnum = 0,
        parenlev = 0,
        continued = 0,
        numchars = '0123456789',
        contstr = '',
        needcont = 0,
        contline = null,
        indents = [0],
        capos = null,
        endprog = undefined,
        strstart = undefined,
        end = undefined,
        pseudomatch = undefined;

    if (encoding !== undefined) {
        if (encoding == "utf-8-sig") {
            // BOM will already have been stripped.
            encoding = "utf-8";
        }

        yield_(new TokenInfo(tokens.T_ENCODING, encoding, [0, 0], [0, 0], ''));
    }

    var last_line = '';
    var line = '';
    while (true) {                                // loop over lines in stream
        try {
            // We capture the value of the line variable here because
            // readline uses the empty string '' to signal end of input,
            // hence `line` itself will always be overwritten at the end
            // of this loop.
            last_line = line;
            line = readline();
        } catch (Exception) {
            line = '';
        }

        // lets pretend this doesn't exist for now.
        // if encoding is not None:
        //     line = line.decode(encoding)
        lnum += 1;
        var pos = 0;
        var max = line.length;

        if (contstr) {                       // continued string
            if (!line) {
                throw new TokenError("EOF in multi-line string", filename, strstart[0], strstart[1]);
            }
            endprog.lastIndex = 0;
            var endmatch = endprog.exec(line);
            if (endmatch) {
                pos = end = endmatch[0].length;
                yield_(new TokenInfo(tokens.T_STRING, contstr + line.substring(0, end),
                       strstart, [lnum, end], contline + line));
                contstr = '';
                needcont = 0;
                contline = null;
            } else if (needcont && line.substring(line.length - 2) !== "\\\n" && line.substring(line.length - 3) !== "\\\r\n") {
                yield_(new TokenInfo(tokens.T_ERRORTOKEN, contstr + line,
                           strstart, [lnum, line.length], contline));
                contstr = '';
                contline = null;
                continue;
            } else {
                contstr = contstr + line;
                contline = contline + line;
                continue;
            }
        } else if (parenlev == 0 && !continued) {  // new statement
            if (!line) { break; }
            var column = 0;
            while (pos < max) {              // measure leading whitespace
                if (line[pos] == ' ') {
                    column += 1
                } else if (line[pos] == '\t') {
                    column = Math.floor(column/tabsize + 1) * tabsize;
                } else if (line[pos] == '\f') {
                    column = 0
                } else {
                    break;
                };
                pos += 1
            }

            if (pos == max) {
                break;
            }

            if (contains('#\r\n', line[pos])) {       // skip comments or blank lines
                if (line[pos] == '#') {
                    var comment_token = rstrip(line.substring(pos), '\r\n');
                    yield_(new TokenInfo(tokens.T_COMMENT, comment_token,
                           [lnum, pos], [lnum, pos + comment_token.length], line));
                    pos += comment_token.length;
                }

                yield_(new TokenInfo(tokens.T_NL, line.substring(pos),
                           [lnum, pos], [lnum, line.length], line));
                continue;
            }

            if (column > indents[indents.length - 1]) {           // count indents or dedents
                indents.push(column);
                yield_(new TokenInfo(tokens.T_INDENT, line.substring(pos), [lnum, 0], [lnum, pos], line));
            }

            while (column < indents[indents.length - 1]) {
                if (!contains(indents, column)) {
                    throw new IndentationError(
                        "unindent does not match any outer indentation level",
                        filename, lnum, pos);
                }

                indents = indents.slice(0, -1);

                yield_(new TokenInfo(tokens.T_DEDENT, '', [lnum, pos], [lnum, pos], line));
            }
        } else {                                  // continued statement
            if (!line) {
                throw new TokenError("EOF in multi-line statement", filename, lnum, 0);
            }
            continued = 0;
        }

        while (pos < max) {
            //console.log("pos:"+pos+":"+max);
            // js regexes don't return any info about matches, other than the
            // content. we'd like to put a \w+ before pseudomatch, but then we
            // can't get any data
            capos = line.charAt(pos);
            while (capos === ' ' || capos === '\f' || capos === '\t') {
                pos += 1;
                capos = line.charAt(pos);
            }

            pseudomatch = PseudoTokenRegexp.exec(line.substring(pos))
            if (pseudomatch) {                                // scan for tokens
                var start = pos;
                var end = start + pseudomatch[1].length;
                var spos = [lnum, start];
                var epos = [lnum, end];
                var pos = end;
                if (start == end) {
                    continue;
                }

                var token = line.substring(start, end);
                var initial = line[start];
                //console.log("token:",token, "initial:",initial, start, end);
                if (contains(numchars, initial) ||                 // ordinary number
                    (initial == '.' && token != '.' && token != '...')) {
                    yield_(new TokenInfo(tokens.T_NUMBER, token, spos, epos, line));
                } else if (contains('\r\n', initial)) {
                    if (parenlev > 0) {
                        yield_(new TokenInfo(tokens.T_NL, token, spos, epos, line));
                    } else {
                        yield_(new TokenInfo(tokens.T_NEWLINE, token, spos, epos, line));
                    }
                } else if (initial == '#') {
                    //assert not token.endswith("\n")
                    yield_(new TokenInfo(tokens.T_COMMENT, token, spos, epos, line));
                } else if (contains(triple_quoted, token)) {
                    endprog = RegExp(endpats[token]);
                    endmatch = endprog.exec(line.substring(pos));
                    if (endmatch) {                       // all on one line
                        pos = endmatch[0].length + pos;
                        token = line.substring(start, pos);
                        yield_(new TokenInfo(tokens.T_STRING, token, spos, [lnum, pos], line));
                    } else {
                        strstart = [lnum, start];           // multiple lines
                        contstr = line.substring(start);
                        contline = line;
                        break;
                    }
                // Check up to the first 3 chars of the token to see if
                //  they're in the single_quoted set. If so, they start
                //  a string.
                // We're using the first 3, because we're looking for
                //  "rb'" (for example) at the start of the token. If
                //  we switch to longer prefixes, this needs to be
                //  adjusted.
                // Note that initial == token[:1].
                // Also note that single quote checking must come after
                //  triple quote checking (above).
                } else if (contains(single_quoted, initial) ||
                           contains(single_quoted, token.substring(0, 2)) ||
                           contains(single_quoted, token.substring(0, 3))) {
                    if (token[token.length - 1] == '\n') {                // continued string
                        strstart = [lnum, start];
                        // Again, using the first 3 chars of the
                        //  token. This is looking for the matching end
                        //  regex for the correct type of quote
                        //  character. So it's really looking for
                        //  endpats["'"] or endpats['"'], by trying to
                        //  skip string prefix characters, if any.
                        endprog = RegExp(endpats[initial] ||
                                           endpats[token[1]] ||
                                           endpats[token[2]]);
                        contstr = line.substring(start);
                        needcont = 1;
                        contline = line;
                        break;
                    } else {                                  // ordinary string
                        yield_(new TokenInfo(tokens.T_STRING, token, spos, epos, line));
                    }

                } else if (isidentifier(initial)) {              // ordinary name
                    yield_(new TokenInfo(tokens.T_NAME, token, spos, epos, line));
                } else if (initial == '\\') {                  // continued stmt
                    continued = 1
                } else {
                    if (contains('([{', initial)) {
                        parenlev += 1
                    } else if (contains(')]}', initial)) {
                        parenlev -= 1
                    }
                    yield_(new TokenInfo(tokens.T_OP, token, spos, epos, line));
                }
            } else {
                yield_(new TokenInfo(tokens.T_ERRORTOKEN, line[pos],
                           [lnum, pos], [lnum, pos+1], line));
                pos += 1;
            }
        }
    }

    // Add an implicit NEWLINE if the input doesn't end in one
    if (last_line && !contains('\r\n', last_line[last_line.length - 1])) {
        yield_(new TokenInfo(tokens.T_NEWLINE, '', [lnum - 1, last_line.length], [lnum - 1, last_line.length + 1], ''));
    }
    for (var i in indents.slice(1)) {                 // pop remaining indent levels
        yield_(new TokenInfo(tokens.T_DEDENT, '', [lnum, 0], [lnum, 0], ''));
    }

    yield_(new TokenInfo(tokens.T_ENDMARKER, '', [lnum, 0], [lnum, 0], ''));
}

Sk._tokenize = _tokenize;
// we use this in ast
Sk._tokenize.Floatnumber = Floatnumber;

Sk.exportSymbol("Sk._tokenize", Sk._tokenize);
