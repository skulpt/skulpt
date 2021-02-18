var tokens = Sk.token.tokens

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

const IS_IDENTIFIER_REGEX = (function() {
    var the_underscore = '_';
    var Lu = '[A-Z]';
    var Ll = '[a-z]';
    var Lt = '[\\u{10B99}-\\u{10B9C}\\u{112A9}\\u{115DC}-\\u{115DD}\\u034F\\u115F-\\u1160\\u17B4-\\u17B5\\u2065\\u3164\\uFFA0\\uFFF0-\\uFFF8\\u{E0000}\\u{E0002}-\\u{E001F}\\u{E0080}-\\u{E00FF}\\u{E01F0}-\\u{E0FFF}\\u{112A9}\\u00D7]';
    var Lm = '[\\u02B0-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0374\\u037A\\u0559\\u06E5-\\u06E6\\u07F4-\\u07F5\\u0971\\u1C78-\\u1C7D\\u1D2C-\\u1D6A\\u1DFD-\\u1DFF\\u2E2F\\u30FC\\uA67F\\uA69C-\\uA69D\\uA717-\\uA71F\\uA788\\uA7F8-\\uA7F9\\uAB5C-\\uAB5F\\uFF70\\uFF9E-\\uFF9F\\u{16F93}-\\u{16F9F}\\u02D0-\\u02D1\\u0640\\u07FA\\u0E46\\u0EC6\\u1843\\u1AA7\\u1C7B\\u3005\\u3031-\\u3035\\u309D-\\u309E\\u30FC-\\u30FE\\uA015\\uA60C\\uA9CF\\uA9E6\\uAA70\\uAADD\\uAAF3-\\uAAF4\\uFF70\\u{16B42}-\\u{16B43}\\u{16FE0}-\\u{16FE1}\\u02B0-\\u02B8\\u02C0-\\u02C1\\u02E0-\\u02E4\\u037A\\u1D2C-\\u1D6A\\u1D78\\u1D9B-\\u1DBF\\u2071\\u207F\\u2090-\\u209C\\u2C7C-\\u2C7D\\uA69C-\\uA69D\\uA770\\uA7F8-\\uA7F9\\uAB5C-\\uAB5F\\uFF9E-\\uFF9F\\u02B2\\u1D62\\u1DA4\\u1DA8\\u2071\\u2C7C\\u2E18-\\u2E19\\u2E2F]';
    var Lo = '[\\u2135-\\u2138\\u{1EE00}-\\u{1EE03}\\u{1EE05}-\\u{1EE1F}\\u{1EE21}-\\u{1EE22}\\u{1EE24}\\u{1EE27}\\u{1EE29}-\\u{1EE32}\\u{1EE34}-\\u{1EE37}\\u{1EE39}\\u{1EE3B}\\u{1EE42}\\u{1EE47}\\u{1EE49}\\u{1EE4B}\\u{1EE4D}-\\u{1EE4F}\\u{1EE51}-\\u{1EE52}\\u{1EE54}\\u{1EE57}\\u{1EE59}\\u{1EE5B}\\u{1EE5D}\\u{1EE5F}\\u{1EE61}-\\u{1EE62}\\u{1EE64}\\u{1EE67}-\\u{1EE6A}\\u{1EE6C}-\\u{1EE72}\\u{1EE74}-\\u{1EE77}\\u{1EE79}-\\u{1EE7C}\\u{1EE7E}\\u{1EE80}-\\u{1EE89}\\u{1EE8B}-\\u{1EE9B}\\u{1EEA1}-\\u{1EEA3}\\u{1EEA5}-\\u{1EEA9}\\u{1EEAB}-\\u{1EEBB}\\u3006\\u3400-\\u4DB5\\u4E00-\\u9FEF\\uF900-\\uFA6D\\uFA70-\\uFAD9\\u{17000}-\\u{187F1}\\u{18800}-\\u{18AF2}\\u{1B170}-\\u{1B2FB}\\u{20000}-\\u{2A6D6}\\u{2A700}-\\u{2B734}\\u{2B740}-\\u{2B81D}\\u{2B820}-\\u{2CEA1}\\u{2CEB0}-\\u{2EBE0}\\u{2F800}-\\u{2FA1D}\\uAAC0\\uAAC2\\uFE20-\\uFE2F\\u{10D22}-\\u{10D23}\\u{1135D}\\u00AA\\u00BA\\u3400-\\u4DB5\\u4E00-\\u9FEF\\uFA0E-\\uFA0F\\uFA11\\uFA13-\\uFA14\\uFA1F\\uFA21\\uFA23-\\uFA24\\uFA27-\\uFA29\\u{20000}-\\u{2A6D6}\\u{2A700}-\\u{2B734}\\u{2B740}-\\u{2B81D}\\u{2B820}-\\u{2CEA1}\\u{2CEB0}-\\u{2EBE0}\\u115F-\\u1160\\u3164\\uFFA0\\u0673\\u17A3-\\u17A4\\u0E40-\\u0E44\\u0EC0-\\u0EC4\\u19B5-\\u19B7\\u19BA\\uAAB5-\\uAAB6\\uAAB9\\uAABB-\\uAABC]';
    var Nl = '[\\u3007\\u3021-\\u3029\\u3038-\\u303A\\u2170-\\u217F\\u2160-\\u216F]';
    var Mn = '[\\u104A-\\u104B\\u102B-\\u102C\\u102D-\\u1030\\u1031\\u1032-\\u1036\\u1038\\u103B-\\u103C\\u103D-\\u103E\\u1056-\\u1057\\u1058-\\u1059\\u105E-\\u1060\\u1062\\u1067-\\u1068\\u1071-\\u1074\\u1082\\u1083-\\u1084\\u1085-\\u1086\\u109C\\u109D\\u1037\\u1039-\\u103A\\u1087-\\u108C\\u108D\\u108F\\u109A-\\u109B\\uA9E5\\uAA7B\\uAA7C\\uAA7D\\uA9E6\\uAA70\\u104A-\\u104B]';
    var Mc = '[\\u0903\\u093B\\u093E-\\u0940\\u0949-\\u094C\\u094E-\\u094F\\u0982-\\u0983\\u09BE-\\u09C0\\u09C7-\\u09C8\\u09CB-\\u09CC\\u09D7\\u0A03\\u0A3E-\\u0A40\\u0A83\\u0ABE-\\u0AC0\\u0AC9\\u0ACB-\\u0ACC\\u0B02-\\u0B03\\u0B3E\\u0B40\\u0B47-\\u0B48\\u0B4B-\\u0B4C\\u0B57\\u0BBE-\\u0BBF\\u0BC1-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCC\\u0BD7\\u0C01-\\u0C03\\u0C41-\\u0C44\\u0C82-\\u0C83\\u0CBE\\u0CC0-\\u0CC4\\u0CC7-\\u0CC8\\u0CCA-\\u0CCB\\u0CD5-\\u0CD6\\u0D02-\\u0D03\\u0D3E-\\u0D40\\u0D46-\\u0D48\\u0D4A-\\u0D4C\\u0D57\\u0D82-\\u0D83\\u0DCF-\\u0DD1\\u0DD8-\\u0DDF\\u0DF2-\\u0DF3\\u0F7F\\u102B-\\u102C\\u1031\\u1038\\u103B-\\u103C\\u1056-\\u1057\\u1062\\u1067-\\u1068\\u1083-\\u1084\\u109C\\u17B6\\u17BE-\\u17C5\\u17C7-\\u17C8\\u1923-\\u1926\\u1929-\\u192B\\u1930-\\u1931\\u1933-\\u1938\\u1A19-\\u1A1A\\u1A55\\u1A57\\u1A61\\u1A63-\\u1A64\\u1A6D-\\u1A72\\u1B04\\u1B35\\u1B3B\\u1B3D-\\u1B41\\u1B43\\u1B82\\u1BA1\\u1BA6-\\u1BA7\\u1BE7\\u1BEA-\\u1BEC\\u1BEE\\u1C24-\\u1C2B\\u1C34-\\u1C35\\u1CF2-\\u1CF3\\uA823-\\uA824\\uA827\\uA880-\\uA881\\uA8B4-\\uA8C3\\uA952\\uA983\\uA9B4-\\uA9B5\\uA9BA-\\uA9BB\\uA9BD-\\uA9BF\\uAA2F-\\uAA30\\uAA33-\\uAA34\\uAA4D\\uAAEB\\uAAEE-\\uAAEF\\uAAF5\\uABE3-\\uABE4\\uABE6-\\uABE7\\uABE9-\\uABEA\\u{11000}\\u{11002}\\u{11082}\\u{110B0}-\\u{110B2}\\u{110B7}-\\u{110B8}\\u{1112C}\\u{11145}-\\u{11146}\\u{11182}\\u{111B3}-\\u{111B5}\\u{111BF}\\u{1122C}-\\u{1122E}\\u{11232}-\\u{11233}\\u{112E0}-\\u{112E2}\\u{11302}-\\u{11303}\\u{1133E}-\\u{1133F}\\u{11341}-\\u{11344}\\u{11347}-\\u{11348}\\u{1134B}-\\u{1134C}\\u{11357}\\u{11362}-\\u{11363}\\u{11435}-\\u{11437}\\u{11440}-\\u{11441}\\u{11445}\\u{114B0}-\\u{114B2}\\u{114B9}\\u{114BB}-\\u{114BE}\\u{114C1}\\u{115AF}-\\u{115B1}\\u{115B8}-\\u{115BB}\\u{115BE}\\u{11630}-\\u{11632}\\u{1163B}-\\u{1163C}\\u{1163E}\\u{116AC}\\u{116AE}-\\u{116AF}\\u{11720}-\\u{11721}\\u{11726}\\u{1182C}-\\u{1182E}\\u{11838}\\u{11A39}\\u{11A57}-\\u{11A58}\\u{11A97}\\u{11C2F}\\u{11C3E}\\u{11CA9}\\u{11CB1}\\u{11CB4}\\u{11D8A}-\\u{11D8E}\\u{11D93}-\\u{11D94}\\u{11D96}\\u{11EF5}-\\u{11EF6}\\u{16F51}-\\u{16F7E}\\u0F3E-\\u0F3F\\u1087-\\u108C\\u108F\\u109A-\\u109B\\u1B44\\u1BAA\\u1CE1\\u1CF7\\u302E-\\u302F\\uA953\\uA9C0\\uAA7B\\uAA7D\\uABEC\\u{111C0}\\u{11235}\\u{1134D}\\u{116B6}\\u{1D16D}-\\u{1D172}\\u09BE\\u09D7\\u0B3E\\u0B57\\u0BBE\\u0BD7\\u0CC2\\u0CD5-\\u0CD6\\u0D3E\\u0D57\\u0DCF\\u0DDF\\u302E-\\u302F\\u{1133E}\\u{11357}\\u{114B0}\\u{114BD}\\u{115AF}\\u{1D165}\\u{1D16E}-\\u{1D172}]';
    var Nd = '[\\u{1D7CE}-\\u{1D7FF}\\uFF10-\\uFF19]';
    var Pc = '\\u2040';
    var Other_ID_Start = '[\\u1885-\\u1886\\u2118\\u212E\\u309B-\\u309C]';
    var Other_ID_Continue = '[\\u00B7\\u0387\\u1369-\\u1371\\u19DA]';
    var id_start = group(Lu, Ll,Lt, Lm, Lo, Nl, the_underscore, Other_ID_Start);
    var id_continue = group(id_start, Mn, Mc, Nd, Pc, Other_ID_Continue);

    // Fall back if we don't support unicode
    if (RegExp().unicode === false) {
        return new RegExp('^' + id_start + '+' + id_continue + '*$', 'u');
    } else {
        id_start = group(Lu, Ll, the_underscore);
        id_continue = group(id_start, '[0-9]');
        return new RegExp('^' + id_start + '+' + id_continue + '*$');
    }
})();

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

/* we have to use string and ctor to be able to build patterns up. + on /.../
 * does something strange.
 * Note: we use unicode matching for names ("\w") but ascii matching for
 * number literals.
 *
 * I don't know if the comment above is still actually correct */
var Whitespace = "[ \\f\\t]*";
var Comment_ = "#[^\\r\\n]*";
var Ignore = Whitespace + any('\\\\\\r?\\n' + Whitespace) + maybe(Comment_)
var Name = "\\w+";


var Exponent = "[eE][-+]?[0-9](?:_?[0-9])*";
var Pointfloat = group('[0-9](?:_?[0-9])*\\.(?:[0-9](?:_?[0-9])*)?',
                       '\\.[0-9](?:_?[0-9])*') + maybe(Exponent)
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

Sk.exportSymbol("Sk._tokenize", Sk._tokenize);
