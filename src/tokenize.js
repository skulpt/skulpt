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

const IS_IDENTIFIER_REGEX = (function() {
    var the_underscore = '_';
    var Lu = '[\\u0041-\\u005a\\u00c0-\\u00d6\\u00d8-\\u00de\\u0100\\u0102\\u0104\\u0106\\u0108\\u010a\\u010c\\u010e\\u0110\\u0112\\u0114\\u0116\\u0118\\u011a\\u011c\\u011e\\u0120\\u0122\\u0124\\u0126\\u0128\\u012a\\u012c\\u012e\\u0130\\u0132\\u0134\\u0136\\u0139\\u013b\\u013d\\u013f\\u0141\\u0143\\u0145\\u0147\\u014a\\u014c\\u014e\\u0150\\u0152\\u0154\\u0156\\u0158\\u015a\\u015c\\u015e\\u0160\\u0162\\u0164\\u0166\\u0168\\u016a\\u016c\\u016e\\u0170\\u0172\\u0174\\u0176\\u0178\\u0179\\u017b\\u017d\\u0181\\u0182\\u0184\\u0186\\u0187\\u0189-\\u018b\\u018e-\\u0191\\u0193\\u0194\\u0196-\\u0198\\u019c\\u019d\\u019f\\u01a0\\u01a2\\u01a4\\u01a6\\u01a7\\u01a9\\u01ac\\u01ae\\u01af\\u01b1-\\u01b3\\u01b5\\u01b7\\u01b8\\u01bc\\u01c4\\u01c7\\u01ca\\u01cd\\u01cf\\u01d1\\u01d3\\u01d5\\u01d7\\u01d9\\u01db\\u01de\\u01e0\\u01e2\\u01e4\\u01e6\\u01e8\\u01ea\\u01ec\\u01ee\\u01f1\\u01f4\\u01f6-\\u01f8\\u01fa\\u01fc\\u01fe\\u0200\\u0202\\u0204\\u0206\\u0208\\u020a\\u020c\\u020e\\u0210\\u0212\\u0214\\u0216\\u0218\\u021a\\u021c\\u021e\\u0220\\u0222\\u0224\\u0226\\u0228\\u022a\\u022c\\u022e\\u0230\\u0232\\u023a\\u023b\\u023d\\u023e\\u0241\\u0243-\\u0246\\u0248\\u024a\\u024c\\u024e\\u0386\\u0388-\\u038a\\u038c\\u038e\\u038f\\u0391-\\u03a1\\u03a3-\\u03ab\\u03d2-\\u03d4\\u03d8\\u03da\\u03dc\\u03de\\u03e0\\u03e2\\u03e4\\u03e6\\u03e8\\u03ea\\u03ec\\u03ee\\u03f4\\u03f7\\u03f9\\u03fa\\u03fd-\\u042f\\u0460\\u0462\\u0464\\u0466\\u0468\\u046a\\u046c\\u046e\\u0470\\u0472\\u0474\\u0476\\u0478\\u047a\\u047c\\u047e\\u0480\\u048a\\u048c\\u048e\\u0490\\u0492\\u0494\\u0496\\u0498\\u049a\\u049c\\u049e\\u04a0\\u04a2\\u04a4\\u04a6\\u04a8\\u04aa\\u04ac\\u04ae\\u04b0\\u04b2\\u04b4\\u04b6\\u04b8\\u04ba\\u04bc\\u04be\\u04c0\\u04c1\\u04c3\\u04c5\\u04c7\\u04c9\\u04cb\\u04cd\\u04d0\\u04d2\\u04d4\\u04d6\\u04d8\\u04da\\u04dc\\u04de\\u04e0\\u04e2\\u04e4\\u04e6\\u04e8\\u04ea\\u04ec\\u04ee\\u04f0\\u04f2\\u04f4\\u04f6\\u04f8\\u04fa\\u04fc\\u04fe\\u0500\\u0502\\u0504\\u0506\\u0508\\u050a\\u050c\\u050e\\u0510\\u0512\\u0531-\\u0556\\u10a0-\\u10c5\\u1e00\\u1e02\\u1e04\\u1e06\\u1e08\\u1e0a\\u1e0c\\u1e0e\\u1e10\\u1e12\\u1e14\\u1e16\\u1e18\\u1e1a\\u1e1c\\u1e1e\\u1e20\\u1e22\\u1e24\\u1e26\\u1e28\\u1e2a\\u1e2c\\u1e2e\\u1e30\\u1e32\\u1e34\\u1e36\\u1e38\\u1e3a\\u1e3c\\u1e3e\\u1e40\\u1e42\\u1e44\\u1e46\\u1e48\\u1e4a\\u1e4c\\u1e4e\\u1e50\\u1e52\\u1e54\\u1e56\\u1e58\\u1e5a\\u1e5c\\u1e5e\\u1e60\\u1e62\\u1e64\\u1e66\\u1e68\\u1e6a\\u1e6c\\u1e6e\\u1e70\\u1e72\\u1e74\\u1e76\\u1e78\\u1e7a\\u1e7c\\u1e7e\\u1e80\\u1e82\\u1e84\\u1e86\\u1e88\\u1e8a\\u1e8c\\u1e8e\\u1e90\\u1e92\\u1e94\\u1ea0\\u1ea2\\u1ea4\\u1ea6\\u1ea8\\u1eaa\\u1eac\\u1eae\\u1eb0\\u1eb2\\u1eb4\\u1eb6\\u1eb8\\u1eba\\u1ebc\\u1ebe\\u1ec0\\u1ec2\\u1ec4\\u1ec6\\u1ec8\\u1eca\\u1ecc\\u1ece\\u1ed0\\u1ed2\\u1ed4\\u1ed6\\u1ed8\\u1eda\\u1edc\\u1ede\\u1ee0\\u1ee2\\u1ee4\\u1ee6\\u1ee8\\u1eea\\u1eec\\u1eee\\u1ef0\\u1ef2\\u1ef4\\u1ef6\\u1ef8\\u1f08-\\u1f0f\\u1f18-\\u1f1d\\u1f28-\\u1f2f\\u1f38-\\u1f3f\\u1f48-\\u1f4d\\u1f59\\u1f5b\\u1f5d\\u1f5f\\u1f68-\\u1f6f\\u1fb8-\\u1fbb\\u1fc8-\\u1fcb\\u1fd8-\\u1fdb\\u1fe8-\\u1fec\\u1ff8-\\u1ffb\\u2102\\u2107\\u210b-\\u210d\\u2110-\\u2112\\u2115\\u2119-\\u211d\\u2124\\u2126\\u2128\\u212a-\\u212d\\u2130-\\u2133\\u213e\\u213f\\u2145\\u2183\\u2c00-\\u2c2e\\u2c60\\u2c62-\\u2c64\\u2c67\\u2c69\\u2c6b\\u2c75\\u2c80\\u2c82\\u2c84\\u2c86\\u2c88\\u2c8a\\u2c8c\\u2c8e\\u2c90\\u2c92\\u2c94\\u2c96\\u2c98\\u2c9a\\u2c9c\\u2c9e\\u2ca0\\u2ca2\\u2ca4\\u2ca6\\u2ca8\\u2caa\\u2cac\\u2cae\\u2cb0\\u2cb2\\u2cb4\\u2cb6\\u2cb8\\u2cba\\u2cbc\\u2cbe\\u2cc0\\u2cc2\\u2cc4\\u2cc6\\u2cc8\\u2cca\\u2ccc\\u2cce\\u2cd0\\u2cd2\\u2cd4\\u2cd6\\u2cd8\\u2cda\\u2cdc\\u2cde\\u2ce0\\u2ce2\\uff21-\\uff3a]';
    var Ll = '[\\u0061-\\u007a\\u00aa\\u00b5\\u00ba\\u00df-\\u00f6\\u00f8-\\u00ff\\u0101\\u0103\\u0105\\u0107\\u0109\\u010b\\u010d\\u010f\\u0111\\u0113\\u0115\\u0117\\u0119\\u011b\\u011d\\u011f\\u0121\\u0123\\u0125\\u0127\\u0129\\u012b\\u012d\\u012f\\u0131\\u0133\\u0135\\u0137\\u0138\\u013a\\u013c\\u013e\\u0140\\u0142\\u0144\\u0146\\u0148\\u0149\\u014b\\u014d\\u014f\\u0151\\u0153\\u0155\\u0157\\u0159\\u015b\\u015d\\u015f\\u0161\\u0163\\u0165\\u0167\\u0169\\u016b\\u016d\\u016f\\u0171\\u0173\\u0175\\u0177\\u017a\\u017c\\u017e-\\u0180\\u0183\\u0185\\u0188\\u018c\\u018d\\u0192\\u0195\\u0199-\\u019b\\u019e\\u01a1\\u01a3\\u01a5\\u01a8\\u01aa\\u01ab\\u01ad\\u01b0\\u01b4\\u01b6\\u01b9\\u01ba\\u01bd-\\u01bf\\u01c6\\u01c9\\u01cc\\u01ce\\u01d0\\u01d2\\u01d4\\u01d6\\u01d8\\u01da\\u01dc\\u01dd\\u01df\\u01e1\\u01e3\\u01e5\\u01e7\\u01e9\\u01eb\\u01ed\\u01ef\\u01f0\\u01f3\\u01f5\\u01f9\\u01fb\\u01fd\\u01ff\\u0201\\u0203\\u0205\\u0207\\u0209\\u020b\\u020d\\u020f\\u0211\\u0213\\u0215\\u0217\\u0219\\u021b\\u021d\\u021f\\u0221\\u0223\\u0225\\u0227\\u0229\\u022b\\u022d\\u022f\\u0231\\u0233-\\u0239\\u023c\\u023f\\u0240\\u0242\\u0247\\u0249\\u024b\\u024d\\u024f-\\u0293\\u0295-\\u02af\\u037b-\\u037d\\u0390\\u03ac-\\u03ce\\u03d0\\u03d1\\u03d5-\\u03d7\\u03d9\\u03db\\u03dd\\u03df\\u03e1\\u03e3\\u03e5\\u03e7\\u03e9\\u03eb\\u03ed\\u03ef-\\u03f3\\u03f5\\u03f8\\u03fb\\u03fc\\u0430-\\u045f\\u0461\\u0463\\u0465\\u0467\\u0469\\u046b\\u046d\\u046f\\u0471\\u0473\\u0475\\u0477\\u0479\\u047b\\u047d\\u047f\\u0481\\u048b\\u048d\\u048f\\u0491\\u0493\\u0495\\u0497\\u0499\\u049b\\u049d\\u049f\\u04a1\\u04a3\\u04a5\\u04a7\\u04a9\\u04ab\\u04ad\\u04af\\u04b1\\u04b3\\u04b5\\u04b7\\u04b9\\u04bb\\u04bd\\u04bf\\u04c2\\u04c4\\u04c6\\u04c8\\u04ca\\u04cc\\u04ce\\u04cf\\u04d1\\u04d3\\u04d5\\u04d7\\u04d9\\u04db\\u04dd\\u04df\\u04e1\\u04e3\\u04e5\\u04e7\\u04e9\\u04eb\\u04ed\\u04ef\\u04f1\\u04f3\\u04f5\\u04f7\\u04f9\\u04fb\\u04fd\\u04ff\\u0501\\u0503\\u0505\\u0507\\u0509\\u050b\\u050d\\u050f\\u0511\\u0513\\u0561-\\u0587\\u1d00-\\u1d2b\\u1d62-\\u1d77\\u1d79-\\u1d9a\\u1e01\\u1e03\\u1e05\\u1e07\\u1e09\\u1e0b\\u1e0d\\u1e0f\\u1e11\\u1e13\\u1e15\\u1e17\\u1e19\\u1e1b\\u1e1d\\u1e1f\\u1e21\\u1e23\\u1e25\\u1e27\\u1e29\\u1e2b\\u1e2d\\u1e2f\\u1e31\\u1e33\\u1e35\\u1e37\\u1e39\\u1e3b\\u1e3d\\u1e3f\\u1e41\\u1e43\\u1e45\\u1e47\\u1e49\\u1e4b\\u1e4d\\u1e4f\\u1e51\\u1e53\\u1e55\\u1e57\\u1e59\\u1e5b\\u1e5d\\u1e5f\\u1e61\\u1e63\\u1e65\\u1e67\\u1e69\\u1e6b\\u1e6d\\u1e6f\\u1e71\\u1e73\\u1e75\\u1e77\\u1e79\\u1e7b\\u1e7d\\u1e7f\\u1e81\\u1e83\\u1e85\\u1e87\\u1e89\\u1e8b\\u1e8d\\u1e8f\\u1e91\\u1e93\\u1e95-\\u1e9b\\u1ea1\\u1ea3\\u1ea5\\u1ea7\\u1ea9\\u1eab\\u1ead\\u1eaf\\u1eb1\\u1eb3\\u1eb5\\u1eb7\\u1eb9\\u1ebb\\u1ebd\\u1ebf\\u1ec1\\u1ec3\\u1ec5\\u1ec7\\u1ec9\\u1ecb\\u1ecd\\u1ecf\\u1ed1\\u1ed3\\u1ed5\\u1ed7\\u1ed9\\u1edb\\u1edd\\u1edf\\u1ee1\\u1ee3\\u1ee5\\u1ee7\\u1ee9\\u1eeb\\u1eed\\u1eef\\u1ef1\\u1ef3\\u1ef5\\u1ef7\\u1ef9\\u1f00-\\u1f07\\u1f10-\\u1f15\\u1f20-\\u1f27\\u1f30-\\u1f37\\u1f40-\\u1f45\\u1f50-\\u1f57\\u1f60-\\u1f67\\u1f70-\\u1f7d\\u1f80-\\u1f87\\u1f90-\\u1f97\\u1fa0-\\u1fa7\\u1fb0-\\u1fb4\\u1fb6\\u1fb7\\u1fbe\\u1fc2-\\u1fc4\\u1fc6\\u1fc7\\u1fd0-\\u1fd3\\u1fd6\\u1fd7\\u1fe0-\\u1fe7\\u1ff2-\\u1ff4\\u1ff6\\u1ff7\\u2071\\u207f\\u210a\\u210e\\u210f\\u2113\\u212f\\u2134\\u2139\\u213c\\u213d\\u2146-\\u2149\\u214e\\u2184\\u2c30-\\u2c5e\\u2c61\\u2c65\\u2c66\\u2c68\\u2c6a\\u2c6c\\u2c74\\u2c76\\u2c77\\u2c81\\u2c83\\u2c85\\u2c87\\u2c89\\u2c8b\\u2c8d\\u2c8f\\u2c91\\u2c93\\u2c95\\u2c97\\u2c99\\u2c9b\\u2c9d\\u2c9f\\u2ca1\\u2ca3\\u2ca5\\u2ca7\\u2ca9\\u2cab\\u2cad\\u2caf\\u2cb1\\u2cb3\\u2cb5\\u2cb7\\u2cb9\\u2cbb\\u2cbd\\u2cbf\\u2cc1\\u2cc3\\u2cc5\\u2cc7\\u2cc9\\u2ccb\\u2ccd\\u2ccf\\u2cd1\\u2cd3\\u2cd5\\u2cd7\\u2cd9\\u2cdb\\u2cdd\\u2cdf\\u2ce1\\u2ce3\\u2ce4\\u2d00-\\u2d25\\ufb00-\\ufb06\\ufb13-\\ufb17\\uff41-\\uff5a]';
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

  const PseudoTokenRegexp = new RegExp(PseudoToken, 'u');

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
                console.log("token:",token, "initial:",initial, start, end);
                debugger;
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
