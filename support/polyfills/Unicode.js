// Select native Unicode properties once at startup, with BMP tables on older engines.
let identifierPattern;
let isIdentifier;
let tokenFlags;
let nonDecimalRegex;
let nonPrintableRegex;
let regexClasses;

try {
    // Sk.global.RegExp is the native RegExp constructor, accessed indirectly so
    // Closure keeps these calls instead of turning constant patterns into literals.
    // Older engines reject Unicode property literals while parsing the script,
    // before this try/catch runs. Runtime construction lets the compatibility
    // build catch the error and use the Unicode tables.
    // CPython tests XID properties on the original code points, before NFKC.
    identifierPattern = "[_\\p{XID_Start}]\\p{XID_Continue}*";
    const identifierRegex = new Sk.global.RegExp("^" + identifierPattern + "$", "u");
    isIdentifier = (text) => identifierRegex.test(text);
    tokenFlags = "u";
    nonDecimalRegex = new Sk.global.RegExp("\\P{Nd}", "u");
    // CPython rejects Other/Separator categories except for ASCII space.
    nonPrintableRegex = new Sk.global.RegExp("(?! )[\\p{C}\\p{Z}]", "u");
    // Use the engine's Unicode version, as native case folding does.
    regexClasses = {
        d: "\\p{Nd}",
        w: "\\p{L}\\p{N}_",
        s: "\\t\\n\\r\\f\\v\\x1c-\\x1f\\x85\\p{Z}",
    };
} catch (error) {
    if (SKULPT_NATIVE_ONLY) {
        throw error;
    } else {
        const U = require("./UnicodeData").default;
        const otherStart = "\\u1885-\\u1886\\u2118\\u212E\\u309B-\\u309C";
        const otherContinue = "\\u00B7\\u0387\\u1369-\\u1371\\u19DA";
        const start = U.Lu + U.Ll + U.Lt + U.Lm + U.Lo + U.Nl + "_" + otherStart;
        const continuation = start + U.Mn + U.Mc + U.Nd + U.Pc + otherContinue;
        identifierPattern = "[" + start + "]+[" + continuation + "]*";
        const identifierRegex = new RegExp("^" + identifierPattern + "$");
        isIdentifier = (text) => identifierRegex.test(text.normalize("NFKC"));
        tokenFlags = "";
        nonDecimalRegex = new RegExp("[^" + U.Nd + "]", "u");
        const zsNoSpace = U.Zs.replace(" ", "").replace("\\u0020", "");
        nonPrintableRegex = new RegExp("[" + U.C + U.Zl + U.Zp + zsNoSpace + "]", "u");
        regexClasses = {
            d: U.Nd,
            // Regex \w includes letters and numbers, but not identifier combining marks.
            w: U.Lu + U.Ll + U.Lt + U.Lm + U.Lo + U.N + "_",
            s: "\\t\\n\\r\\f\\v\\x1c-\\x1f\\x85" + U.Zs + U.Zl + U.Zp,
        };
    }
}

const Unicode = {
    identifierPattern,
    tokenRegex: (pattern) => new RegExp(pattern, tokenFlags),
    isIdentifier,
    isDecimal: (text) => text.length !== 0 && !nonDecimalRegex.test(text),
    isPrintable: (text) => !nonPrintableRegex.test(text),
    regexClasses,
};

export default Unicode;
