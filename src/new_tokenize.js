/**
 *
 * @constructor
 * @param {number} type
 * @param {string} string
 * @param {number[]} start
 * @param {number[]} end
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
    if (this.type == OP && this.string in EXACT_TOKEN_TYPES) {
    return Sk.Token.EXACT_TOKEN_TYPES[this.string]
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

/* we have to use string and ctor to be able to build patterns up. + on /.../
 * does something strange.
 * Note: we use unicode matching for names ("\w") but ascii matching for
 * number literals. */
var Whitespace = "[ \\f\\t]*";
var Comment_ = "#[^\\r\\n]*";
var Ignore = Whitespace + any('\\\\\\r?\\n' + Whitespace) + maybe(Comment)
var Name = "\\w+";

var Hexnumber = '0[xX](?:_?[0-9a-fA-F])+';
var Binnumber = '0[bB](?:_?[01])+';
var Octnumber = '0[oO](?:_?[0-7])+';
var Decnumber = '(?:0(?:_?0)*|[1-9](?:_?[0-9])*)';
var Intnumber = group(Hexnumber, Binnumber, Octnumber, Decnumber);

var Exponent = "[eE][-+]?[0-9](?:_?[0-9])*";
var Pointfloat = group('[0-9](?:_?[0-9])*\.(?:[0-9](?:_?[0-9])*)?',
                       '\\.[0-9](?:_?[0-9])*') + maybe(Exponent)
var Expfloat = "[0-9](?:_?[0-9])*" + Exponent;
var Floatnumber = group(Pointfloat, Expfloat);
var Imagnumber = group("[0-9](?:_?[0-9])*[jJ]", Floatnumber + "[jJ]");
var Number_ = group(Imagnumber, Floatnumber, Intnumber);

// Return the empty string, plus all of the valid string prefixes.
function _all_string_prefixes() {
    return [
        '', 'FR', 'RF', 'Br', 'BR', 'Fr', 'r', 'B', 'R', 'b', 'bR',
        'f', 'rb', 'rB', 'F', 'Rf', 'U', 'rF', 'u', 'RB', 'br', 'fR',
        'fr', 'rf', 'Rb'];
}

// Note that since _all_string_prefixes includes the empty string,
//  StringPrefix can be the empty string (making it optional).
var StringPrefix = group(_all_string_prefixes())

// Tail end of ' string.
var Single = "[^'\\\\]*(?:\\\\.[^'\\\\]*)*'";
// Tail end of " string.
var Double = '[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
// Tail end of ''' string.
var Single3 = "[^'\\\\]*(?:(?:\\\\.|'(?!''))[^'\\\\]*)*'''";
// Tail end of """ string.
var Double3 = '[^"\\\\]*(?:(?:\\\\.|"(?!""))[^"\\\\]*)*"""';
var Triple = group(StringPrefix + "'''", StringPrefix + '"""');
// Single-line ' or " string.
var String_ = group(StringPrefix + "'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'",
                    StringPrefix + '"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');

// Sorting in reverse order puts the long operators before their prefixes.
// Otherwise if = came before ==, == would get recognized as two instances
// of =.
var EXACT_TOKENS_SORTED = Sk.Token.EXACT_TOKEN_TYPES.slice().sort();
var Special = group(EXACT_TOKENS_SORTED.reverse().map(function (t) { return regexEscape(t); }));
var Funny = group('\\r?\\n', Special);

var PlainToken = group(Number_, Funny, String_, Name);
var Token = Ignore + PlainToken;

// First (or only) line of ' or " string.
var ContStr = group(StringPrefix + "'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*" +
                group("'", '\\\\\\r?\\n'),
                StringPrefix + '"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*' +
                group('"', '\\\\\\r?\\n'))
var PseudoExtras = group('\\\\\\r?\\n|\\Z', Comment, Triple);
var PseudoToken = Whitespace + group(PseudoExtras, Number_, Funny, ContStr, Name);

// For a given string prefix plus quotes, endpats maps it to a regex
//  to match the remainder of that string. _prefix can be empty, for
//  a normal single or triple quoted string (with no prefix).
var endpats = {}
var prefixes = _all_string_prefixes();
for (i in prefixes) {
    var _prefix = prefixes[i];
    endpats[_prefix + "'"] = Single
    endpats[_prefix + '"'] = Double
    endpats[_prefix + "'''"] = Single3
    endpats[_prefix + '"""'] = Double3
}

// A set of all of the single and triple quoted string prefixes,
//  including the opening quotes.
single_quoted = new Set()
triple_quoted = new Set()
for (i in prefixes) {
    var t = prefixes[i];
    single_quoted.add(t + '"');
    single_quoted.add(t + "'");
    triple_quoted.add(t + '"""');
    triple_quoted.add(t + "'''");
}

var tabsize = 8

/**
 * Iterable contains
 * @template T
 * @param {Iterable<T>} a
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

/**
 * internal tokenize function
 *
 * @param {function(): string} readline
 * @param {string} encoding
 * @param {function(TokenInfo): void} yield
 */
function _tokenize(readline, encoding, yield) {
    var lnum = 0,
        parenlev = 0,
        continued = 0,
        numchars = '0123456789'
        contstr = '',
        needcont = 0
        contline = None
        indents = [0]

    if (encoding !== undefined) {
        if (encoding == "utf-8-sig") {
            // BOM will already have been stripped.
            encoding = "utf-8"
        }

        yield new TokenInfo(ENCODING, encoding, (0, 0), (0, 0), '')
    }

    last_line = ''
    line = ''
    while (true) {                                // loop over lines in stream
        try {
            // We capture the value of the line variable here because
            // readline uses the empty string '' to signal end of input,
            // hence `line` itself will always be overwritten at the end
            // of this loop.
            last_line = line
            line = readline()
        } catch (Exception) {
            line = ''
        }

        // lets pretend this doesn't exist for now.
        // if encoding is not None:
        //     line = line.decode(encoding)
        lnum += 1
        pos = 0
        max = line.length

        if (contstr) {                       // continued string
            if (!line) {
                throw new TokenError("EOF in multi-line string", strstart)
            }
            endprog.lastIndex = 0;
            endmatch = endprog.match(line);
            if (endmatch) {
                pos = end = this.endprog.lastIndex;
                yield(new TokenInfo(STRING, contstr + line.substring(0, end),
                       strstart, [lnum, end], contline + line));
                contstr = '';
                needcont = 0;
                contline = null;
            } else if (needcont && line.substring(line.length - 2) !== "\\\n" && line.substring(line.length - 3) !== "\\\r\n") {
                yield(new TokenInfo(ERRORTOKEN, contstr + line,
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
            column = 0;
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
                    comment_token = rstrip(line.substring(pos), '\r\n');
                    yield new TokenInfo(COMMENT, comment_token,
                           [lnum, pos], [lnum, pos + comment_token.length], line);
                    pos += comment_token.length;
                }

                yield new TokenInfo(NL, line.substring(pos),
                           [lnum, pos], [lnum, line.length], line);
                continue
            }

            if (column > indents[indents.length - 1]) {           // count indents or dedents
                indents.push(column)
                yield(new TokenInfo(INDENT, line.substring(pos), [lnum, 0], [lnum, pos], line))
            }

            while (column < indents[indents.length - 1]) {
                if (!contains(indents, column)) {
                    throw new IndentationError(
                        "unindent does not match any outer indentation level",
                        ["<tokenize>", lnum, pos, line]);
                }

                indents = indents.slice(0, -1);

                yield(new TokenInfo(DEDENT, '', [lnum, pos], [lnum, pos], line));
            }
        } else {                                  // continued statement
            if (!line) {
                throw new TokenError("EOF in multi-line statement", [lnum, 0]);
            }
            continued = 0;
        }

        while (pos < max) {
            pseudomatch = RegExp(PseudoToken).match(line, pos)
            if (pseudomatch) {                                // scan for tokens
                start, end = pseudomatch.span(1)
                spos = [lnum, start];
                epos = [lnum, end];
                pos = end;
                if (start == end) {
                    continue;
                }

                token = line.substring(start, end);
                initial = line[start];

                if (contains(numchars, initial) ||                 // ordinary number
                    (initial == '.' && token != '.' && token != '...')) {
                    yield(new TokenInfo(NUMBER, token, spos, epos, line));
                }
                else if (contains('\r\n', initial)) {
                    if (parenlev > 0) {
                        yield(new TokenInfo(NL, token, spos, epos, line));
                    } else {
                        yield(new TokenInfo(NEWLINE, token, spos, epos, line));
                    }
                } else if (initial == '#') {
                    //assert not token.endswith("\n")
                    yield(new TokenInfo(COMMENT, token, spos, epos, line));
                } else if (contains(triple_quoted, token)) {
                    endprog = Regex(endpats[token])
                    endmatch = endprog.match(line, pos)
                    if (endmatch) {                       // all on one line
                        pos = endprog.lastIndex + pos;
                        token = line.substring(start, pos);
                        yield(new TokenInfo(STRING, token, spos, (lnum, pos), line));
                    } else {
                        strstart = [lnum, start]           // multiple lines
                        contstr = line.substring(start);
                        contline = line;
                        break
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
                } else if (single_quoted.has(initial) ||
                        single_quoted.has(token.substring(0, 2)) ||
                        single_quoted.has(token.substring(0, 3)))
                    if (token[token.length - 1] == '\n') {                // continued string
                        strstart = [lnum, start]
                        // Again, using the first 3 chars of the
                        //  token. This is looking for the matching end
                        //  regex for the correct type of quote
                        //  character. So it's really looking for
                        //  endpats["'"] or endpats['"'], by trying to
                        //  skip string prefix characters, if any.
                        endprog = Regex(endpats[initial] ||
                                           endpats[token[1]] ||
                                           endpats[token[2]]);
                        contstr = line.substring(start);
                        needcont = 1;
                        contline = line;
                        break
                    } else {                                  // ordinary string
                        yield new TokenInfo(STRING, token, spos, epos, line);
                    }

                } else if initial.isidentifier() {              // ordinary name
                    yield new TokenInfo(NAME, token, spos, epos, line)
                } else if initial == '\\' {                  // continued stmt
                    continued = 1
                } else {
                    if initial in '([{':
                        parenlev += 1
                    else if initial in ')]}':
                        parenlev -= 1
                    yield new TokenInfo(OP, token, spos, epos, line)
                }
            } else {
                yield(new TokenInfo(ERRORTOKEN, line[pos],
                           [lnum, pos], [lnum, pos+1], line));
                pos += 1
            }
        }
    }

    // Add an implicit NEWLINE if the input doesn't end in one
    if last_line and last_line[-1] not in '\r\n':
        yield new TokenInfo(NEWLINE, '', (lnum - 1, len(last_line)), (lnum - 1, len(last_line) + 1), '')
    for indent in indents[1:]:                 // pop remaining indent levels
        yield new TokenInfo(DEDENT, '', (lnum, 0), (lnum, 0), '')
    yield new TokenInfo(ENDMARKER, '', (lnum, 0), (lnum, 0), '')
}