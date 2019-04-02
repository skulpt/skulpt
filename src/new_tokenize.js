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
 * test if string is an identifier
 * 
 * @param {string} string 
 * @returns {boolean}
 */
function isidentifier(string) {
    var normalized = string.normalize('NFKC');
    var the_underscore = '_';
    var Lu = '[A-Z]';
    var Ll = '[a-z]';
    var Lt = '[\u10B99-\u10B9C\u112A9\u115DC-\u115DD\u034F\u115F-\u1160\u17B4-\u17B5\u2065\u3164\uFFA0\uFFF0-\uFFF8\uE0000\uE0002-\uE001F\uE0080-\uE00FF\uE01F0-\uE0FFF\u112A9\u00D7]';
    var Lm = '[\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u06E5-\u06E6\u07F4-\u07F5\u0971\u1C78-\u1C7D\u1D2C-\u1D6A\u1DFD-\u1DFF\u2E2F\u30FC\uA67F\uA69C-\uA69D\uA717-\uA71F\uA788\uA7F8-\uA7F9\uAB5C-\uAB5F\uFF70\uFF9E-\uFF9F\u16F93-\u16F9F\u02D0-\u02D1\u0640\u07FA\u0E46\u0EC6\u1843\u1AA7\u1C7B\u3005\u3031-\u3035\u309D-\u309E\u30FC-\u30FE\uA015\uA60C\uA9CF\uA9E6\uAA70\uAADD\uAAF3-\uAAF4\uFF70\u16B42-\u16B43\u16FE0-\u16FE1\u02B0-\u02B8\u02C0-\u02C1\u02E0-\u02E4\u037A\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C-\u2C7D\uA69C-\uA69D\uA770\uA7F8-\uA7F9\uAB5C-\uAB5F\uFF9E-\uFF9F\u02B2\u1D62\u1DA4\u1DA8\u2071\u2C7C\u2E18-\u2E19\u2E2F]';
    var Lo = '[\u2135-\u2138\u1EE00-\u1EE03\u1EE05-\u1EE1F\u1EE21-\u1EE22\u1EE24\u1EE27\u1EE29-\u1EE32\u1EE34-\u1EE37\u1EE39\u1EE3B\u1EE42\u1EE47\u1EE49\u1EE4B\u1EE4D-\u1EE4F\u1EE51-\u1EE52\u1EE54\u1EE57\u1EE59\u1EE5B\u1EE5D\u1EE5F\u1EE61-\u1EE62\u1EE64\u1EE67-\u1EE6A\u1EE6C-\u1EE72\u1EE74-\u1EE77\u1EE79-\u1EE7C\u1EE7E\u1EE80-\u1EE89\u1EE8B-\u1EE9B\u1EEA1-\u1EEA3\u1EEA5-\u1EEA9\u1EEAB-\u1EEBB\u3006\u3400-\u4DB5\u4E00-\u9FEF\uF900-\uFA6D\uFA70-\uFAD9\u17000-\u187F1\u18800-\u18AF2\u1B170-\u1B2FB\u20000-\u2A6D6\u2A700-\u2B734\u2B740-\u2B81D\u2B820-\u2CEA1\u2CEB0-\u2EBE0\u2F800-\u2FA1D\uAAC0\uAAC2\uFE20-\uFE2F\u10D22-\u10D23\u1135D\u00AA\u00BA\u3400-\u4DB5\u4E00-\u9FEF\uFA0E-\uFA0F\uFA11\uFA13-\uFA14\uFA1F\uFA21\uFA23-\uFA24\uFA27-\uFA29\u20000-\u2A6D6\u2A700-\u2B734\u2B740-\u2B81D\u2B820-\u2CEA1\u2CEB0-\u2EBE0\u115F-\u1160\u3164\uFFA0\u0673\u17A3-\u17A4\u0E40-\u0E44\u0EC0-\u0EC4\u19B5-\u19B7\u19BA\uAAB5-\uAAB6\uAAB9\uAABB-\uAABC]';
    var Nl = '[\u3007\u3021-\u3029\u3038-\u303A\u2170-\u217F\u2160-\u216F]';
    var Mn = '[\u104A-\u104B\u102B-\u102C\u102D-\u1030\u1031\u1032-\u1036\u1038\u103B-\u103C\u103D-\u103E\u1056-\u1057\u1058-\u1059\u105E-\u1060\u1062\u1067-\u1068\u1071-\u1074\u1082\u1083-\u1084\u1085-\u1086\u109C\u109D\u1037\u1039-\u103A\u1087-\u108C\u108D\u108F\u109A-\u109B\uA9E5\uAA7B\uAA7C\uAA7D\uA9E6\uAA70\u104A-\u104B]';
    var Mc = '[\u0903\u093B\u093E-\u0940\u0949-\u094C\u094E-\u094F\u0982-\u0983\u09BE-\u09C0\u09C7-\u09C8\u09CB-\u09CC\u09D7\u0A03\u0A3E-\u0A40\u0A83\u0ABE-\u0AC0\u0AC9\u0ACB-\u0ACC\u0B02-\u0B03\u0B3E\u0B40\u0B47-\u0B48\u0B4B-\u0B4C\u0B57\u0BBE-\u0BBF\u0BC1-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD7\u0C01-\u0C03\u0C41-\u0C44\u0C82-\u0C83\u0CBE\u0CC0-\u0CC4\u0CC7-\u0CC8\u0CCA-\u0CCB\u0CD5-\u0CD6\u0D02-\u0D03\u0D3E-\u0D40\u0D46-\u0D48\u0D4A-\u0D4C\u0D57\u0D82-\u0D83\u0DCF-\u0DD1\u0DD8-\u0DDF\u0DF2-\u0DF3\u0F7F\u102B-\u102C\u1031\u1038\u103B-\u103C\u1056-\u1057\u1062\u1067-\u1068\u1083-\u1084\u109C\u17B6\u17BE-\u17C5\u17C7-\u17C8\u1923-\u1926\u1929-\u192B\u1930-\u1931\u1933-\u1938\u1A19-\u1A1A\u1A55\u1A57\u1A61\u1A63-\u1A64\u1A6D-\u1A72\u1B04\u1B35\u1B3B\u1B3D-\u1B41\u1B43\u1B82\u1BA1\u1BA6-\u1BA7\u1BE7\u1BEA-\u1BEC\u1BEE\u1C24-\u1C2B\u1C34-\u1C35\u1CF2-\u1CF3\uA823-\uA824\uA827\uA880-\uA881\uA8B4-\uA8C3\uA952\uA983\uA9B4-\uA9B5\uA9BA-\uA9BB\uA9BD-\uA9BF\uAA2F-\uAA30\uAA33-\uAA34\uAA4D\uAAEB\uAAEE-\uAAEF\uAAF5\uABE3-\uABE4\uABE6-\uABE7\uABE9-\uABEA\u11000\u11002\u11082\u110B0-\u110B2\u110B7-\u110B8\u1112C\u11145-\u11146\u11182\u111B3-\u111B5\u111BF\u1122C-\u1122E\u11232-\u11233\u112E0-\u112E2\u11302-\u11303\u1133E-\u1133F\u11341-\u11344\u11347-\u11348\u1134B-\u1134C\u11357\u11362-\u11363\u11435-\u11437\u11440-\u11441\u11445\u114B0-\u114B2\u114B9\u114BB-\u114BE\u114C1\u115AF-\u115B1\u115B8-\u115BB\u115BE\u11630-\u11632\u1163B-\u1163C\u1163E\u116AC\u116AE-\u116AF\u11720-\u11721\u11726\u1182C-\u1182E\u11838\u11A39\u11A57-\u11A58\u11A97\u11C2F\u11C3E\u11CA9\u11CB1\u11CB4\u11D8A-\u11D8E\u11D93-\u11D94\u11D96\u11EF5-\u11EF6\u16F51-\u16F7E\u0F3E-\u0F3F\u1087-\u108C\u108F\u109A-\u109B\u1B44\u1BAA\u1CE1\u1CF7\u302E-\u302F\uA953\uA9C0\uAA7B\uAA7D\uABEC\u111C0\u11235\u1134D\u116B6\u1D16D-\u1D172\u09BE\u09D7\u0B3E\u0B57\u0BBE\u0BD7\u0CC2\u0CD5-\u0CD6\u0D3E\u0D57\u0DCF\u0DDF\u302E-\u302F\u1133E\u11357\u114B0\u114BD\u115AF\u1D165\u1D16E-\u1D172]';
    var Nd = '[\u1D7CE-\u1D7FF\u0030-\u0039\uFF10-\uFF19\u0030-\u0039]';
    var Pc = '\u2040';
    var Other_ID_Start = '[\u1885-\u1886\u2118\u212E\u309B-\u309C]';
    var Other_ID_Continue = '[\u00B7\u0387\u1369-\u1371\u19DA]';
    var id_start = group(Lu, Ll,Lt, Lm, Lo, Nl, the_underscore, Other_ID_Start);
    var id_continue = group(id_start, Mn, Mc, Nd, Pc, Other_ID_Continue);
    var r = new RegExp('^' + id_start + '+' + id_continue + '*$');
    return r.test(normalized);
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
                } else if (contains('\r\n', initial)) {
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
                        single_quoted.has(token.substring(0, 3))) {
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

                } else if (isidentifier(isidentifier)) {              // ordinary name
                    yield new TokenInfo(NAME, token, spos, epos, line)
                } else if (initial == '\\') {                  // continued stmt
                    continued = 1
                } else {
                    if (contains('([{', initial)) {
                        parenlev += 1
                    } else if (contains(')]}', initial)) {
                        parenlev -= 1
                    }
                    yield(new TokenInfo(OP, token, spos, epos, line));
                }
            } else {
                yield(new TokenInfo(ERRORTOKEN, line[pos],
                           [lnum, pos], [lnum, pos+1], line));
                pos += 1
            }
        }
    }

    // Add an implicit NEWLINE if the input doesn't end in one
    if (last_line && !contains('\r\n', last_line[lastline.length - 1])) {
        yield(new TokenInfo(NEWLINE, '', [lnum - 1, last_line.length], [lnum - 1, last_line.length + 1], ''));
    }
    for (var i in indents.slice(1)) {                 // pop remaining indent levels
        yield(new TokenInfo(DEDENT, '', [lnum, 0], [lnum, 0], ''));
    }

    yield(new TokenInfo(ENDMARKER, '', [lnum, 0], [lnum, 0], ''));
}