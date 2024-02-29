require("fastestsmallesttextencoderdecoder");

// Mapping from supported valid encodings to normalized encoding name
const supportedEncodings = {
    utf: "utf-8",
    utf8: "utf-8",
    utf_8: "utf-8",
    latin_1: "latin1", // browser spec
    ascii: "ascii",
    utf16: "utf-16",
    utf_16: "utf-16",
};

var space_reg = /\s+/g;
var underscore_hyphen_reg = /[_-]+/g;
function normalizeEncoding(encoding) {
    const normalized = encoding.replace(space_reg, "").replace(underscore_hyphen_reg, "_").toLowerCase();
    const supported = supportedEncodings[normalized];
    if (supported === undefined) {
        return encoding;
    } else {
        return supported;
    }
}
const UtfEncoder = new TextEncoder();
const UtfDecoder = new TextDecoder();

/**
 * @constructor
 * @param {undefined|Uint8Array|Array|number|string} source Using constructor with new should be a js object
 * @return {Sk.builtin.bytes}
 * @extends {Sk.builtin.object}
 */
Sk.builtin.bytes = Sk.abstr.buildNativeClass("bytes", {
    constructor: function bytes(source) {
        if (!(this instanceof Sk.builtin.bytes)) {
            throw new TypeError("bytes is a constructor use 'new'");
        }
        // deal with internal calls
        if (source === undefined) {
            this.v = new Uint8Array();
        } else if (source instanceof Uint8Array) {
            this.v = source;
        } else if (Array.isArray(source)) {
            Sk.asserts.assert(
                source.every((x) => x >= 0 && x <= 0xff),
                "bad internal call to bytes with array"
            );
            this.v = new Uint8Array(source);
        } else if (typeof source === "string") {
            // fast path must be binary string https://developer.mozilla.org/en-US/docs/Web/API/DOMString/Binary
            // i.e. the reverse of this.$jsstr();
            let cc;
            const uint8 = new Uint8Array(source.length);
            const len = source.length;
            for (let i = 0; i < len; i++) {
                cc = source.charCodeAt(i);
                if (cc > 0xff) {
                    throw new Sk.builtin.UnicodeDecodeError("invalid string at index " + i + " (possibly contains a unicode character)");
                }
                uint8[i] = cc;
            }
            this.v = uint8;
        } else if (typeof source === "number") {
            this.v = new Uint8Array(source);
        } else {
            throw new TypeError(`bad internal argument to bytes constructor (got '${typeof source}': ${source})`);
        }
    },
    slots: /**@lends {Sk.builtin.bytes.prototype} */ {
        tp$getattr: Sk.generic.getAttr,
        tp$doc:
            "bytes(iterable_of_ints) -> bytes\nbytes(string, encoding[, errors]) -> bytes\nbytes(bytes_or_buffer) -> immutable copy of bytes_or_buffer\nbytes(int) -> bytes object of size given by the parameter initialized with null bytes\nbytes() -> empty bytes object\n\nConstruct an immutable array of bytes from:\n  - an iterable yielding integers in range(256)\n  - a text string encoded using the specified encoding\n  - any object implementing the buffer API.\n  - an integer",
        tp$new(args, kwargs) {
            if (this !== Sk.builtin.bytes.prototype) {
                return this.$subtype_new(args, kwargs);
            }
            kwargs = kwargs || [];
            let source, pySource, dunderBytes, encoding, errors;
            if (args.length <= 1 && +kwargs.length === 0) {
                pySource = args[0];
            } else {
                [pySource, encoding, errors] = Sk.abstr.copyKeywordsToNamedArgs(
                    "bytes",
                    [null, "encoding", "errors"],
                    args,
                    kwargs
                );
                ({ encoding, errors } = checkGetEncodingErrors("bytes", encoding, errors));
                if (!Sk.builtin.checkString(pySource)) {
                    throw new Sk.builtin.TypeError("encoding or errors without a string argument");
                }
                return strEncode(pySource, encoding, errors);
            }

            if (pySource === undefined) {
                return new Sk.builtin.bytes();
            } else if ((dunderBytes = Sk.abstr.lookupSpecial(pySource, Sk.builtin.str.$bytes)) !== undefined) {
                const ret = Sk.misceval.callsimOrSuspendArray(dunderBytes, []);
                return Sk.misceval.chain(ret, (bytesSource) => {
                    if (!Sk.builtin.checkBytes(bytesSource)) {
                        throw new Sk.builtin.TypeError("__bytes__ returned non-bytes (type " + Sk.abstr.typeName(bytesSource) + ")");
                    }
                    return bytesSource;
                });
            } else if (Sk.misceval.isIndex(pySource)) {
                source = Sk.misceval.asIndexSized(pySource, Sk.builtin.OverflowError);
                if (source < 0) {
                    throw new Sk.builtin.ValueError("negative count");
                }
                return new Sk.builtin.bytes(source);
            } else if (Sk.builtin.checkBytes(pySource)) {
                return new Sk.builtin.bytes(pySource.v);
            } else if (Sk.builtin.checkString(pySource)) {
                throw new Sk.builtin.TypeError("string argument without an encoding");
            } else if (Sk.builtin.checkIterable(pySource)) {
                let source = [];
                let r = Sk.misceval.iterFor(Sk.abstr.iter(pySource), (byte) => {
                    const n = Sk.misceval.asIndexSized(byte);
                    if (n < 0 || n > 255) {
                        throw new Sk.builtin.ValueError("bytes must be in range(0, 256)");
                    }
                    source.push(n);
                });
                return Sk.misceval.chain(r, () => new Sk.builtin.bytes(source));
            }
            throw new Sk.builtin.TypeError("cannot convert '" + Sk.abstr.typeName(pySource) + "' object into bytes");
        },
        $r() {
            let num;
            let quote = "'";
            const hasdbl = this.v.indexOf(34) !== -1;
            let ret = "";

            for (let i = 0; i < this.v.length; i++) {
                num = this.v[i];
                if (num < 9 || (num > 10 && num < 13) || (num > 13 && num < 32) || num > 126) {
                    ret += makehexform(num);
                } else if (num === 9 || num === 10 || num === 13 || num === 39 || num === 92) {
                    switch (num) {
                        case 9:
                            ret += "\\t";
                            break;
                        case 10:
                            ret += "\\n";
                            break;
                        case 13:
                            ret += "\\r";
                            break;
                        case 39:
                            if (hasdbl) {
                                ret += "\\'";
                            } else {
                                ret += "'";
                                quote = '"';
                            }
                            break;
                        case 92:
                            ret += "\\\\";
                            break;
                    }
                } else {
                    ret += String.fromCharCode(num);
                }
            }
            ret = "b" + quote + ret + quote;
            return new Sk.builtin.str(ret);
        },
        tp$str() {
            return this.$r();
        },
        tp$iter() {
            return new bytes_iter_(this);
        },
        tp$richcompare(other, op) {
            if (this === other && Sk.misceval.opAllowsEquality(op)) {
                return true;
            } else if (!(other instanceof Sk.builtin.bytes)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            const v = this.v;
            const w = other.v;
            if (v.length !== w.length && (op === "Eq" || op === "NotEq")) {
                /* Shortcut: if the lengths differ, the bytes differ */
                return op === "Eq" ? false : true;
            }
            let i;
            const min_len = Math.min(v.length, w.length);
            for (i = 0; i < min_len; i++) {
                if (v[i] !== w[i]) {
                    break; // we've found a different element
                }
            }
            switch (op) {
                case "Lt":
                    return (i === min_len && v.length < w.length) || v[i] < w[i];
                case "LtE":
                    return (i === min_len && v.length <= w.length) || v[i] <= w[i];
                case "Eq":
                    return i === min_len;
                case "NotEq":
                    return i < min_len;
                case "Gt":
                    return (i === min_len && v.length > w.length) || v[i] > w[i];
                case "GtE":
                    return (i === min_len && v.length >= w.length) || v[i] >= w[i];
            }
        },
        tp$hash() {
            return new Sk.builtin.str(this.$jsstr()).tp$hash();
        },
        tp$as_sequence_or_mapping: true,
        mp$subscript(index) {
            if (Sk.misceval.isIndex(index)) {
                let i = Sk.misceval.asIndexSized(index, Sk.builtin.IndexError);
                if (i !== undefined) {
                    if (i < 0) {
                        i = this.v.length + i;
                    }
                    if (i < 0 || i >= this.v.length) {
                        throw new Sk.builtin.IndexError("index out of range");
                    }
                    return new Sk.builtin.int_(this.v[i]);
                }
            } else if (index instanceof Sk.builtin.slice) {
                const ret = [];
                index.sssiter$(this.v.length, (i) => {
                    ret.push(this.v[i]);
                });
                return new Sk.builtin.bytes(new Uint8Array(ret));
            }
            throw new Sk.builtin.TypeError("byte indices must be integers or slices, not " + Sk.abstr.typeName(index));
        },
        sq$length() {
            return this.v.length;
        },
        sq$concat(other) {
            if (!(other instanceof Sk.builtin.bytes)) {
                throw new Sk.builtin.TypeError("can't concat " + Sk.abstr.typeName(other) + " to bytes");
            }
            const ret = new Uint8Array(this.v.length + other.v.length);
            let i;
            for (i = 0; i < this.v.length; i++) {
                ret[i] = this.v[i];
            }
            for (let j = 0; j < other.v.length; j++, i++) {
                ret[i] = other.v[j];
            }
            return new Sk.builtin.bytes(ret);
        },
        sq$repeat(n) {
            if (!Sk.misceval.isIndex(n)) {
                throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
            }
            n = Sk.misceval.asIndexSized(n, Sk.builtin.OverflowError);
            const len = n * this.v.length;
            if (len > Number.MAX_SAFE_INTEGER) {
                throw new Sk.builtin.OverflowError();
            } else if (n <= 0) {
                return new Sk.builtin.bytes();
            }
            const ret = new Uint8Array(len);
            let j = 0;
            while (j < len) {
                for (let i = 0; i < this.v.length; i++) {
                    ret[j++] = this.v[i];
                }
            }
            return new Sk.builtin.bytes(ret);
        },
        sq$contains(tgt) {
            return this.find$left(tgt) !== -1;
        },
        tp$as_number: true,
        nb$remainder: Sk.builtin.str.prototype.nb$remainder,
    },
    proto: {
        $jsstr() {
            // returns binary string - not bidirectional for non ascii characters - use with caution
            // i.e. new Sk.builtin.bytes(x.$jsstr()).v  may be different to x.v;
            let ret = "";
            for (let i = 0; i < this.v.length; i++) {
                ret += String.fromCharCode(this.v[i]);
            }
            return ret;
        },
        get$tgt(tgt) {
            if (tgt instanceof Sk.builtin.bytes) {
                return tgt.v;
            }
            tgt = Sk.misceval.asIndexOrThrow(tgt, "argument should be integer or bytes-like object, not {tp$name}");
            if (tgt < 0 || tgt > 0xff) {
                throw new Sk.builtin.ValueError("bytes must be in range(0, 256)");
            }
            return tgt;
        },
        get$raw(tgt) {
            if (tgt instanceof Sk.builtin.bytes) {
                return tgt.v;
            }
            throw new Sk.builtin.TypeError("a bytes-like object is required, not '" + Sk.abstr.typeName(tgt) + "'");
        },
        get$splitArgs: checkSepMaxSplit,
        find$left: mkFind(false),
        find$right: mkFind(true),
        find$subleft: function findSubLeft(uint8, start, end) {
            end = end - uint8.length + 1;
            let i = start;
            while (i < end) {
                if (uint8.every((val, j) => val === this.v[i + j])) {
                    return i;
                }
                i++;
            }
            return -1;
        },
        find$subright(uint8, start, end) {
            let i = end - uint8.length;
            while (i >= start) {
                if (uint8.every((val, j) => val === this.v[i + j])) {
                    return i;
                }
                i--;
            }
            return -1;
        },
        $subtype_new(args, kwargs) {
            const instance = new this.constructor();
            // we call bytes new method with all the args and kwargs
            const bytes_instance = Sk.builtin.bytes.prototype.tp$new(args, kwargs);
            instance.v = bytes_instance.v;
            return instance;
        },
        sk$asarray() {
            const ret = [];
            this.v.forEach((x) => {ret.push(new Sk.builtin.int_(x));});
            return ret;
        },
        valueOf() {
            return this.v;
        },
    },
    flags: {
        str$encode: strEncode,
        $decode: bytesDecode,
        check$encodeArgs: checkGetEncodingErrors,
    },
    methods: {
        __getnewargs__: {
            $meth() {
                return new Sk.builtin.tuple(new Sk.builtin.bytes(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: null,
        },
        capitalize: {
            $meth() {
                const len = this.v.length;
                if (len === 0) {
                    return new Sk.builtin.bytes(this.v);
                }
                const final = new Uint8Array(len);
                let val = this.v[0];
                final[0] = islower(val) ? val - 32 : val;
                for (let i = 1; i < len; i++) {
                    val = this.v[i];
                    final[i] = isupper(val) ? val + 32 : val;
                }
                return new Sk.builtin.bytes(final);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "B.capitalize() -> copy of B\n\nReturn a copy of B with only its first character capitalized (ASCII)\nand the rest lower-cased.",
        },
        center: {
            $meth: mkJust("center", false, true),
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: null,
            $doc:
                "B.center(width[, fillchar]) -> copy of B\n\nReturn B centered in a string of length width.  Padding is\ndone using the specified fill character (default is a space).",
        },
        count: {
            $meth(tgt, start, end) {
                tgt = this.get$tgt(tgt);
                ({ start, end } = Sk.builtin.slice.startEnd$wrt(this, start, end));
                let count = 0;
                if (typeof tgt === "number") {
                    for (let i = start; i < end; i++) {
                        if (this.v[i] === tgt) {
                            count++;
                        }
                    }
                } else {
                    const upto = end - tgt.length + 1;
                    for (let i = start; i < upto; i++) {
                        if (tgt.every((val, j) => val === this.v[i + j])) {
                            count++;
                            i += tgt.length - 1;
                        }
                    }
                }
                return new Sk.builtin.int_(count);
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "B.count(sub[, start[, end]]) -> int\n\nReturn the number of non-overlapping occurrences of subsection sub in\nbytes B[start:end].  Optional arguments start and end are interpreted\nas in slice notation.",
        },
        decode: {
            $meth: bytesDecode,
            $flags: { NamedArgs: ["encoding", "errors"] },
            $textsig: "($self, /, encoding='utf-8', errors='strict')",
            $doc:
                "Decode the bytes using the codec registered for encoding.\n\n  encoding\n    The encoding with which to decode the bytes.\n  errors\n    The error handling scheme to use for the handling of decoding errors.\n    The default is 'strict' meaning that decoding errors raise a\n    UnicodeDecodeError. Other possible values are 'ignore' and 'replace'\n    as well as any other name registered with codecs.register_error that\n    can handle UnicodeDecodeErrors.",
        },
        endswith: {
            $meth: mkStartsEndsWith("endswith", (subarray, tgt) => {
                const start = subarray.length - tgt.length;
                return start >= 0 && tgt.every((val, i) => val === subarray[start + i]);
            }),
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "B.endswith(suffix[, start[, end]]) -> bool\n\nReturn True if B ends with the specified suffix, False otherwise.\nWith optional start, test B beginning at that position.\nWith optional end, stop comparing B at that position.\nsuffix can also be a tuple of bytes to try.",
        },
        expandtabs: {
            $meth(tabsize) {
                tabsize = Sk.misceval.asIndexSized(tabsize, Sk.builtin.OverflowError, "an integer is required (got type {tp$nam})");
                const final = [];
                let linepos = 0;
                for (let i = 0; i < this.v.length; i++) {
                    const val = this.v[i];
                    if (val === 9) {
                        const inc = tabsize - (linepos % tabsize);
                        final.push(...new Array(inc).fill(32));
                        linepos += inc;
                    } else if (val === 10 || val === 13) {
                        final.push(val);
                        linepos = 0;
                    } else {
                        final.push(val);
                        linepos++;
                    }
                }
                return new Sk.builtin.bytes(new Uint8Array(final));
            },
            $flags: { NamedArgs: ["tabsize"], Defaults: [8] },
            $textsig: null,
            $doc:
                "B.expandtabs(tabsize=8) -> copy of B\n\nReturn a copy of B where all tab characters are expanded using spaces.\nIf tabsize is not given, a tab size of 8 characters is assumed.",
        },
        find: {
            $meth: function find(tgt, start, end) {
                return new Sk.builtin.int_(this.find$left(tgt, start, end));
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "B.find(sub[, start[, end]]) -> int\n\nReturn the lowest index in B where subsection sub is found,\nsuch that sub is contained within B[start,end].  Optional\narguments start and end are interpreted as in slice notation.\n\nReturn -1 on failure.",
        },
        hex: {
            $meth() {
                let final = "";
                for (let i = 0; i < this.v.length; i++) {
                    final += this.v[i].toString(16).padStart(2, "0");
                }
                return new Sk.builtin.str(final);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "B.hex() -> string\n\nCreate a string of hexadecimal numbers from a bytes object.\nExample: b'\\xb9\\x01\\xef'.hex() -> 'b901ef'.",
        },
        index: {
            $meth: function index(tgt, start, end) {
                const val = this.find$left(tgt, start, end);
                if (val === -1) {
                    throw new Sk.builtin.ValueError("subsection not found");
                } else {
                    return new Sk.builtin.int_(val);
                }
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "B.index(sub[, start[, end]]) -> int\n\nReturn the lowest index in B where subsection sub is found,\nsuch that sub is contained within B[start,end].  Optional\narguments start and end are interpreted as in slice notation.\n\nRaises ValueError when the subsection is not found.",
        },
        isalnum: {
            $meth: mkIsAll((val) => isdigit(val) || islower(val) || isupper(val)),
            $flags: { NoArgs: true },
            $textsig: null,
            $doc:
                "B.isalnum() -> bool\n\nReturn True if all characters in B are alphanumeric\nand there is at least one character in B, False otherwise.",
        },
        isalpha: {
            $meth: mkIsAll((val) => (val >= 65 && val <= 90) || (val >= 97 && val <= 122)),
            $flags: { NoArgs: true },
            $textsig: null,
            $doc:
                "B.isalpha() -> bool\n\nReturn True if all characters in B are alphabetic\nand there is at least one character in B, False otherwise.",
        },
        isascii: {
            $meth: mkIsAll((val) => val >= 0 && val <= 0x7f, true),
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "B.isascii() -> bool\n\nReturn True if B is empty or all characters in B are ASCII,\nFalse otherwise.",
        },
        isdigit: {
            $meth: mkIsAll(isdigit),
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "B.isdigit() -> bool\n\nReturn True if all characters in B are digits\nand there is at least one character in B, False otherwise.",
        },
        islower: {
            $meth: makeIsUpperLower(islower, isupper),
            $flags: { NoArgs: true },
            $textsig: null,
            $doc:
                "B.islower() -> bool\n\nReturn True if all cased characters in B are lowercase and there is\nat least one cased character in B, False otherwise.",
        },
        isspace: {
            $meth: mkIsAll(isspace),
            $flags: { NoArgs: true },
            $textsig: null,
            $doc:
                "B.isspace() -> bool\n\nReturn True if all characters in B are whitespace\nand there is at least one character in B, False otherwise.",
        },
        istitle: {
            $meth: function istitle() {
                let inword = false;
                let cased = false;
                for (let i = 0; i < this.v.length; i++) {
                    const val = this.v[i];
                    if (isupper(val)) {
                        if (inword) {
                            return Sk.builtin.bool.false$;
                        }
                        inword = true;
                        cased = true;
                    } else if (islower(val)) {
                        if (!inword) {
                            return Sk.builtin.bool.false$;
                        }
                        cased = true;
                    } else {
                        inword = false;
                    }
                }
                return cased ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc:
                "B.istitle() -> bool\n\nReturn True if B is a titlecased string and there is at least one\ncharacter in B, i.e. uppercase characters may only follow uncased\ncharacters and lowercase characters only cased ones. Return False\notherwise.",
        },
        isupper: {
            $meth: makeIsUpperLower(isupper, islower),
            $flags: { NoArgs: true },
            $textsig: null,
            $doc:
                "B.isupper() -> bool\n\nReturn True if all cased characters in B are uppercase and there is\nat least one cased character in B, False otherwise.",
        },
        join: {
            $meth(iterable) {
                const final = [];
                let i = 0;
                return Sk.misceval.chain(
                    Sk.misceval.iterFor(Sk.abstr.iter(iterable), (item) => {
                        if (!(item instanceof Sk.builtin.bytes)) {
                            throw new Sk.builtin.TypeError(
                                "sequence item " + i + ": expected a bytes-like object, " + Sk.abstr.typeName(item) + " found"
                            );
                        }
                        i++;
                        if (final.length) {
                            final.push(...this.v);
                        }
                        final.push(...item.v);
                    }),
                    () => new Sk.builtin.bytes(new Uint8Array(final))
                );
            },
            $flags: { OneArg: true },
            $textsig: "($self, iterable_of_bytes, /)",
            $doc:
                "Concatenate any number of bytes objects.\n\nThe bytes whose method is called is inserted in between each pair.\n\nThe result is returned as a new bytes object.\n\nExample: b'.'.join([b'ab', b'pq', b'rs']) -> b'ab.pq.rs'.",
        },
        ljust: {
            $meth: mkJust("ljust", false, false),
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: null,
            $doc:
                "B.ljust(width[, fillchar]) -> copy of B\n\nReturn B left justified in a string of length width. Padding is\ndone using the specified fill character (default is a space).",
        },
        lower: {
            $meth: mkCaseSwitch((val) => (isupper(val) ? val + 32 : val)),
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "B.lower() -> copy of B\n\nReturn a copy of B with all ASCII characters converted to lowercase.",
        },
        lstrip: {
            $meth: mkStrip(true, false),
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: "($self, bytes=None, /)",
            $doc: "Strip leading bytes contained in the argument.\n\nIf the argument is omitted or None, strip leading  ASCII whitespace.",
        },
        partition: {
            $meth: mkPartition(false),
            $flags: { OneArg: true },
            $textsig: "($self, sep, /)",
            $doc:
                "Partition the bytes into three parts using the given separator.\n\nThis will search for the separator sep in the bytes. If the separator is found,\nreturns a 3-tuple containing the part before the separator, the separator\nitself, and the part after it.\n\nIf the separator is not found, returns a 3-tuple containing the original bytes\nobject and two empty bytes objects.",
        },
        replace: {
            $meth(oldB, newB, count) {
                oldB = this.get$raw(oldB);
                newB = this.get$raw(newB);
                count = count === undefined ? -1 : Sk.misceval.asIndexSized(count, Sk.builtin.OverflowError);
                count = count < 0 ? Infinity : count;
                const final = [];
                let found = 0,
                    i = 0;
                while (i < this.v.length && found < count) {
                    const next = this.find$subleft(oldB, i, this.v.length);
                    if (next === -1) {
                        break;
                    }
                    for (let j = i; j < next; j++) {
                        final.push(this.v[j]);
                    }
                    final.push(...newB);
                    i = next + oldB.length;
                    found++;
                }
                for (i; i < this.v.length; i++) {
                    final.push(this.v[i]);
                }
                return new Sk.builtin.bytes(new Uint8Array(final));
            },
            $flags: { MinArgs: 2, MaxArgs: 3 },
            $textsig: "($self, old, new, count=-1, /)",
            $doc:
                "Return a copy with all occurrences of substring old replaced by new.\n\n  count\n    Maximum number of occurrences to replace.\n    -1 (the default value) means replace all occurrences.\n\nIf the optional argument count is given, only the first count occurrences are\nreplaced.",
        },
        rfind: {
            $meth(tgt, start, end) {
                return new Sk.builtin.int_(this.find$right(tgt, start, end));
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "B.rfind(sub[, start[, end]]) -> int\n\nReturn the highest index in B where subsection sub is found,\nsuch that sub is contained within B[start,end].  Optional\narguments start and end are interpreted as in slice notation.\n\nReturn -1 on failure.",
        },
        rindex: {
            $meth: function rindex(tgt, start, end) {
                const val = this.find$right(tgt, start, end);
                if (val === -1) {
                    throw new Sk.builtin.ValueError("subsection not found");
                } else {
                    return new Sk.builtin.int_(val);
                }
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "B.rindex(sub[, start[, end]]) -> int\n\nReturn the highest index in B where subsection sub is found,\nsuch that sub is contained within B[start,end].  Optional\narguments start and end are interpreted as in slice notation.\n\nRaise ValueError when the subsection is not found.",
        },
        rjust: {
            $meth: mkJust("rjust", true, false),
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: null,
            $doc:
                "B.rjust(width[, fillchar]) -> copy of B\n\nReturn B right justified in a string of length width. Padding is\ndone using the specified fill character (default is a space)",
        },
        rpartition: {
            $meth: mkPartition(true),
            $flags: { OneArg: true },
            $textsig: "($self, sep, /)",
            $doc:
                "Partition the bytes into three parts using the given separator.\n\nThis will search for the separator sep in the bytes, starting at the end. If\nthe separator is found, returns a 3-tuple containing the part before the\nseparator, the separator itself, and the part after it.\n\nIf the separator is not found, returns a 3-tuple containing two empty bytes\nobjects and the original bytes object.",
        },
        rsplit: {
            $meth: function rSplit(sep, maxsplit) {
                ({ sep, maxsplit } = this.get$splitArgs(sep, maxsplit));

                const result = [];
                let splits = 0,
                    i = this.v.length;

                if (sep !== null) {
                    while (i >= 0 && splits < maxsplit) {
                        const next = this.find$subright(sep, 0, i);
                        if (next === -1) {
                            break;
                        }
                        result.push(new Sk.builtin.bytes(this.v.subarray(next + sep.length, i)));
                        i = next;
                        splits++;
                    }
                    result.push(new Sk.builtin.bytes(this.v.subarray(0, i)));
                } else {
                    i--;
                    while (splits < maxsplit) {
                        while (isspace(this.v[i])) {
                            i--;
                        }
                        if (i < 0) {
                            break;
                        }
                        const index = i + 1;
                        i--;
                        while (i >= 0 && !isspace(this.v[i])) {
                            i--;
                        }
                        result.push(new Sk.builtin.bytes(this.v.subarray(i + 1, index)));
                        splits++;
                    }
                    if (i >= 0) {
                        while (isspace(this.v[i])) {
                            i--;
                        }
                        if (i >= 0) {
                            result.push(new Sk.builtin.bytes(this.v.subarray(0, i + 1)));
                        }
                    }
                }
                return new Sk.builtin.list(result.reverse());
            },
            $flags: { NamedArgs: ["sep", "maxsplit"], Defaults: [Sk.builtin.none.none$, -1] },
            $textsig: "($self, /, sep=None, maxsplit=-1)",
            $doc:
                "Return a list of the sections in the bytes, using sep as the delimiter.\n\n  sep\n    The delimiter according which to split the bytes.\n    None (the default value) means split on ASCII whitespace characters\n    (space, tab, return, newline, formfeed, vertical tab).\n  maxsplit\n    Maximum number of splits to do.\n    -1 (the default value) means no limit.\n\nSplitting is done starting at the end of the bytes and working to the front.",
        },
        rstrip: {
            $meth: mkStrip(false, true),
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: "($self, bytes=None, /)",
            $doc: "Strip trailing bytes contained in the argument.\n\nIf the argument is omitted or None, strip trailing ASCII whitespace.",
        },
        split: {
            $meth: function Split(sep, maxsplit) {
                ({ sep, maxsplit } = this.get$splitArgs(sep, maxsplit));

                const result = [];
                const mylen = this.v.length;
                let splits = 0,
                    i = 0;

                if (sep !== null) {
                    while (i < mylen && splits < maxsplit) {
                        const next = this.find$subleft(sep, i, mylen);
                        if (next === -1) {
                            break;
                        }
                        result.push(new Sk.builtin.bytes(this.v.subarray(i, next)));
                        i = next + sep.length;
                        splits++;
                    }
                    result.push(new Sk.builtin.bytes(this.v.subarray(i, mylen)));
                } else {
                    while (splits < maxsplit) {
                        while (isspace(this.v[i])) {
                            i++;
                        }
                        if (i === mylen) {
                            break;
                        }
                        const index = i;
                        i++;
                        while (i < mylen && !isspace(this.v[i])) {
                            i++;
                        }
                        result.push(new Sk.builtin.bytes(this.v.subarray(index, i)));
                        splits++;
                    }
                    if (i < mylen) {
                        while (isspace(this.v[i])) {
                            i++;
                        }
                        if (i < mylen) {
                            result.push(new Sk.builtin.bytes(this.v.subarray(i, mylen)));
                        }
                    }
                }
                return new Sk.builtin.list(result);
            },
            $flags: { NamedArgs: ["sep", "maxsplit"], Defaults: [Sk.builtin.none.none$, -1] },
            $textsig: "($self, /, sep=None, maxsplit=-1)",
            $doc:
                "Return a list of the sections in the bytes, using sep as the delimiter.\n\n  sep\n    The delimiter according which to split the bytes.\n    None (the default value) means split on ASCII whitespace characters\n    (space, tab, return, newline, formfeed, vertical tab).\n  maxsplit\n    Maximum number of splits to do.\n    -1 (the default value) means no limit.",
        },
        splitlines: {
            $meth(keepends) {
                keepends = Sk.misceval.isTrue(keepends);
                const final = [];
                let sol = 0;
                let eol;
                let i = 0;
                const len = this.v.length;
                while (i < len) {
                    const val = this.v[i];
                    if (val === 13) {
                        // \r
                        const rn = this.v[i + 1] === 10; // \r\n
                        if (keepends) {
                            eol = rn ? i + 2 : i + 1;
                        } else {
                            eol = i;
                        }
                        final.push(new Sk.builtin.bytes(this.v.subarray(sol, eol)));
                        i = sol = rn ? i + 2 : i + 1;
                    } else if (val === 10) {
                        // \n
                        eol = keepends ? i + 1 : i;
                        final.push(new Sk.builtin.bytes(this.v.subarray(sol, eol)));
                        i = sol = i + 1;
                    } else {
                        i++;
                    }
                }
                if (sol < len) {
                    final.push(new Sk.builtin.bytes(this.v.subarray(sol, len)));
                }
                return new Sk.builtin.list(final);
            },
            $flags: { NamedArgs: ["keepends"], Defaults: [false] },
            $textsig: "($self, /, keepends=False)",
            $doc:
                "Return a list of the lines in the bytes, breaking at line boundaries.\n\nLine breaks are not included in the resulting list unless keepends is given and\ntrue.",
        },
        startswith: {
            $meth: mkStartsEndsWith("startswith", (subarray, tgt) => tgt.length <= subarray.length && tgt.every((val, i) => val === subarray[i])),
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "B.startswith(prefix[, start[, end]]) -> bool\n\nReturn True if B starts with the specified prefix, False otherwise.\nWith optional start, test B beginning at that position.\nWith optional end, stop comparing B at that position.\nprefix can also be a tuple of bytes to try.",
        },
        strip: {
            $meth: mkStrip(true, true),
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: "($self, bytes=None, /)",
            $doc:
                "Strip leading and trailing bytes contained in the argument.\n\nIf the argument is omitted or None, strip leading and trailing ASCII whitespace.",
        },
        swapcase: {
            $meth: mkCaseSwitch((val) => (isupper(val) ? val + 32 : islower(val) ? val - 32 : val)),
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "B.swapcase() -> copy of B\n\nReturn a copy of B with uppercase ASCII characters converted\nto lowercase ASCII and vice versa.",
        },
        title: {
            $meth() {
                const len = this.v.length;
                const final = new Uint8Array(len);
                let inword = false;
                for (let i = 0; i < len; i++) {
                    const val = this.v[i];
                    if (isupper(val)) {
                        final[i] = inword ? val + 32 : val;
                        inword = true;
                    } else if (islower(val)) {
                        final[i] = inword ? val : val - 32;
                        inword = true;
                    } else {
                        final[i] = val;
                        inword = false;
                    }
                }
                return new Sk.builtin.bytes(final);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc:
                "B.title() -> copy of B\n\nReturn a titlecased version of B, i.e. ASCII words start with uppercase\ncharacters, all remaining cased characters have lowercase.",
        },
        // translate: {
        //     $meth() {
        //         throw new Sk.builtin.NotImplementedError("translate() bytes method not implemented in Skulpt");
        //     },
        //     $flags: { NoArgs: true },
        //     $textsig: "($self, table, /, delete=b'')",
        //     $doc:
        //         "Return a copy with each character mapped by the given translation table.\n\n  table\n    Translation table, which must be a bytes object of length 256.\n\nAll characters occurring in the optional argument delete are removed.\nThe remaining characters are mapped through the given translation table.",
        // },
        upper: {
            $meth: mkCaseSwitch((val) => (islower(val) ? val - 32 : val)),
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "B.upper() -> copy of B\n\nReturn a copy of B with all ASCII characters converted to uppercase.",
        },
        zfill: {
            $meth(width) {
                width = Sk.misceval.asIndexSized(width, Sk.builtin.IndexError);
                const fill_len = width - this.v.length;
                if (fill_len <= 0) {
                    return new Sk.builtin.bytes(this.v);
                }
                const final = new Uint8Array(width);
                let i = 0,
                    j;
                if (this.v[0] === 43 || this.v[0] === 45) {
                    final[0] = this.v[0];
                    i++;
                }
                final.fill(48, i, i + fill_len);
                for (j = i, i = i + fill_len; i < width; i++, j++) {
                    final[i] = this.v[j];
                }
                return new Sk.builtin.bytes(final);
            },
            $flags: { OneArg: true },
            $textsig: null,
            $doc:
                "B.zfill(width) -> copy of B\n\nPad a numeric string B with zeros on the left, to fill a field\nof the specified width.  B is never truncated.",
        },
    },
    classmethods: {
        fromhex: {
            $meth: function fromhex(string) {
                if (!Sk.builtin.checkString(string)) {
                    throw new Sk.builtin.TypeError("fromhex() argument must be str, not " + Sk.abstr.typeName(string));
                }
                string = string.$jsstr();
                const spaces = /\s+/g;
                const ishex = /^[abcdefABCDEF0123456789]{2}$/;
                const final = [];
                let index = 0;
                function pushOrThrow(upto) {
                    for (let i = index; i < upto; i += 2) {
                        let s = string.substr(i, 2);
                        if (!ishex.test(s)) {
                            throw new Sk.builtin.ValueError("non-hexadecimal number found in fromhex() arg at position " + (i + 1));
                        }
                        final.push(parseInt(s, 16));
                    }
                }
                let match;
                while ((match = spaces.exec(string)) !== null) {
                    pushOrThrow(match.index);
                    index = spaces.lastIndex;
                }
                pushOrThrow(string.length);
                return new this(final);
            },
            $flags: { OneArg: true },
            $textsig: "($type, string, /)",
            $doc:
                "Create a bytes object from a string of hexadecimal numbers.\n\nSpaces between two numbers are accepted.\nExample: bytes.fromhex('B9 01EF') -> b'\\\\xb9\\\\x01\\\\xef'.",
        },
    },
});

function checkGetEncodingErrors(funcname, encoding, errors) {
    // check the types of encoding and errors
    if (encoding === undefined) {
        encoding = "utf-8";
    } else if (!Sk.builtin.checkString(encoding)) {
        throw new Sk.builtin.TypeError(
            funcname + "() argument " + ("bytesstr".includes(funcname) ? 2 : 1) + " must be str not " + Sk.abstr.typeName(encoding)
        );
    } else {
        encoding = encoding.$jsstr();
    }
    if (errors === undefined) {
        errors = "strict";
    } else if (!Sk.builtin.checkString(errors)) {
        throw new Sk.builtin.TypeError(
            funcname + "() argument " + ("bytesstr".includes(funcname) ? 3 : 2) + " must be str not " + Sk.abstr.typeName(errors)
        );
    } else {
        errors = errors.$jsstr();
    }
    return { encoding: encoding, errors: errors };
}

function checkErrorsIsValid(errors) {
    if (!(errors === "strict" || errors === "ignore" || errors === "replace")) {
        throw new Sk.builtin.LookupError(
            "Unsupported or invalid error type '" + errors + "'"
        );
    }
}

function strEncode(pyStr, encoding, errors) {
    const source = pyStr.$jsstr();
    encoding = normalizeEncoding(encoding);
    checkErrorsIsValid(errors);
    let uint8;
    if (encoding === "ascii") {
        uint8 = encodeAscii(source, errors);
    } else if (encoding === "utf-8") {
        uint8 = UtfEncoder.encode(source);
    } else {
        throw new Sk.builtin.LookupError("Unsupported or unknown encoding: '" + encoding + "'");
    }
    return new Sk.builtin.bytes(uint8);
}

function encodeAscii(source, errors) {
    const data = [];
    for (let i in source) {
        const val = source.charCodeAt(i);
        if (val > 0x7f) {
            if (errors === "strict") {
                const hexval = makehexform(val);
                throw new Sk.builtin.UnicodeEncodeError(
                    "'ascii' codec can't encode character '" + hexval + "' in position " + i + ": ordinal not in range(128)"
                );
            } else if (errors === "replace") {
                data.push(63); // "?"
            }
        } else {
            data.push(val);
        }
    }
    return new Uint8Array(data);
}

function makehexform(num) {
    var leading;
    if (num <= 265) {
        leading = "\\x";
    } else {
        leading = "\\u";
    }
    num = num.toString(16);
    if (num.length === 3) {
        num = num.slice(1, 3);
    }
    if (num.length === 1) {
        num = leading + "0" + num;
    } else {
        num = leading + num;
    }
    return num;
}

function decodeAscii(source, errors) {
    let final = "";
    for (let i = 0; i < source.length; i++) {
        const val = source[i];
        if (val > 0x7f) {
            if (errors === "strict") {
                throw new Sk.builtin.UnicodeDecodeError(
                    "'ascii' codec can't decode byte 0x" + val.toString(16) + " in position " + i + ": ordinal not in range(128)"
                );
            } else if (errors === "replace") {
                final += String.fromCharCode(65533);
            }
        } else {
            final += String.fromCharCode(val);
        }
    }
    return final;
}

function decode(decoder, source, errors, encoding) {
    const string = decoder.decode(source);
    if (errors === "replace") {
        return string;
    } else if (errors === "strict") {
        const i = string.indexOf("�");
        if (i === -1) {
            return string;
        }
        throw new Sk.builtin.UnicodeDecodeError(
            `'${encoding}' codec can't decode byte 0x ${source[i].toString(16)} in position ${i}: invalid start byte`
        );
    }
    return string.replace(/�/g, "");
}

function bytesDecode(encoding, errors) {
    ({ encoding, errors } = checkGetEncodingErrors("decode", encoding, errors));
    encoding = normalizeEncoding(encoding);

    checkErrorsIsValid(errors);

    let jsstr;
    if (encoding === "ascii") {
        jsstr = decodeAscii(this.v, errors);
    } else if (encoding === "utf-8") {
        jsstr = decode(UtfDecoder, this.v, errors, encoding);
    } else {
        let decoder;
        try {
            decoder = new TextDecoder(encoding);
        } catch (e) {
            throw new Sk.builtin.LookupError(`Unsupported or unknown encoding: ${encoding}. ${e.message}`);
        }
        jsstr = decode(decoder, this.v, errors, encoding);
    }
    return new Sk.builtin.str(jsstr);
}

function mkStartsEndsWith(funcname, is_match) {
    return function (prefix, start, end) {
        if (!(prefix instanceof Sk.builtin.bytes || prefix instanceof Sk.builtin.tuple)) {
            throw new Sk.builtin.TypeError(funcname + " first arg must be bytes or a tuple of bytes, not " + Sk.abstr.typeName(prefix));
        }
        ({ start, end } = Sk.builtin.slice.startEnd$wrt(this, start, end));
        if (end < start) {
            return Sk.builtin.bool.false$;
        }
        const slice = this.v.subarray(start, end);

        if (prefix instanceof Sk.builtin.tuple) {
            for (let iter = Sk.abstr.iter(prefix), item = iter.tp$iternext(); item !== undefined; item = iter.tp$iternext()) {
                item = this.get$raw(item);
                if (is_match(slice, item)) {
                    return Sk.builtin.bool.true$;
                }
            }
            return Sk.builtin.bool.false$;
        } else {
            return is_match(slice, prefix.v) ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
        }
    };
}

function mkFind(isReversed) {
    return function find(tgt, start, end) {
        tgt = this.get$tgt(tgt);
        ({ start, end } = Sk.builtin.slice.startEnd$wrt(this, start, end));
        if (end < start) {
            return -1;
        }
        let idx;
        if (typeof tgt === "number") {
            idx = isReversed ? this.v.lastIndexOf(tgt, end - 1) : this.v.indexOf(tgt, start);
            return idx >= start && idx < end ? idx : -1;
        }
        if (isReversed) {
            return this.find$subright(tgt, start, end);
        } else {
            return this.find$subleft(tgt, start, end);
        }
    };
}

function mkPartition(isReversed) {
    return function partition(sep) {
        sep = this.get$raw(sep);
        let pos;
        if (isReversed) {
            pos = this.find$subright(sep, 0, this.v.length);
            if (pos < 0) {
                return new Sk.builtin.tuple([new Sk.builtin.bytes(), new Sk.builtin.bytes(), this]);
            }
        } else {
            pos = this.find$subleft(sep, 0, this.v.length);
            if (pos < 0) {
                return new Sk.builtin.tuple([this, new Sk.builtin.bytes(), new Sk.builtin.bytes()]);
            }
        }
        return new Sk.builtin.tuple([
            new Sk.builtin.bytes(this.v.subarray(0, pos)),
            new Sk.builtin.bytes(sep),
            new Sk.builtin.bytes(this.v.subarray(pos + sep.length)),
        ]);
    };
}

function mkStrip(isLeft, isRight) {
    return function stripBytes(chars) {
        let strip_chrs;
        if (chars === undefined || chars === Sk.builtin.none.none$) {
            // default is to remove ASCII whitespace
            strip_chrs = new Uint8Array([9, 10, 11, 12, 13, 32, 133]);
        } else {
            strip_chrs = this.get$raw(chars);
        }
        let start = 0,
            end = this.v.length;
        if (isLeft) {
            while (start < end && strip_chrs.includes(this.v[start])) {
                start++;
            }
        }
        if (isRight) {
            while (end > start && strip_chrs.includes(this.v[end - 1])) {
                end--;
            }
        }
        const final = new Uint8Array(end - start);
        for (let i = 0; i < final.length; i++) {
            final[i] = this.v[i + start];
        }
        return new Sk.builtin.bytes(final);
    };
}

function mkJust(funcname, isRight, isCenter) {
    return function justify(width, fillbyte) {
        if (fillbyte === undefined) {
            fillbyte = 32;
        } else if (!(fillbyte instanceof Sk.builtin.bytes) || fillbyte.v.length != 1) {
            throw new Sk.builtin.TypeError(funcname + "() argument 2 must be a byte string of length 1, not " + Sk.abstr.typeName(fillbyte));
        } else {
            fillbyte = fillbyte.v[0];
        }
        const mylen = this.v.length;
        width = Sk.misceval.asIndexSized(width, Sk.builtin.OverflowError);
        if (width <= mylen) {
            return new Sk.builtin.bytes(this.v);
        }
        const final = new Uint8Array(width);
        let fill1, fill2;
        if (isCenter) {
            fill1 = Math.floor((width - mylen) / 2);
            fill2 = (width - mylen) % 2 ? fill1 + 1 : fill1;
        } else if (isRight) {
            fill1 = width - mylen;
            fill2 = 0;
        } else {
            fill1 = 0;
            fill2 = width - mylen;
        }
        final.fill(fillbyte, 0, fill1);
        for (let i = 0; i < mylen; i++) {
            final[i + fill1] = this.v[i];
        }
        final.fill(fillbyte, width - fill2);
        return new Sk.builtin.bytes(final);
    };
}

function isspace(val) {
    return (val >= 9 && val <= 13) || val === 32;
}
function islower(val) {
    return val >= 97 && val <= 122;
}
function isupper(val) {
    return val >= 65 && val <= 90;
}
function isdigit(val) {
    return val >= 48 && val <= 57;
}

function checkSepMaxSplit(sep, maxsplit) {
    maxsplit = Sk.misceval.asIndexSized(maxsplit, Sk.builtin.OverflowError);
    maxsplit = maxsplit < 0 ? Infinity : maxsplit;

    sep = Sk.builtin.checkNone(sep) ? null : this.get$raw(sep);
    if (sep !== null && !sep.length) {
        throw new Sk.builtin.ValueError("empty separator");
    }
    return { sep: sep, maxsplit: maxsplit };
}

function mkIsAll(passTest, passesZero) {
    return function isAll() {
        if (this.v.length === 0) {
            return passesZero ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
        }
        return this.v.every((val) => passTest(val)) ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
    };
}

function makeIsUpperLower(passTest, failTest) {
    return function () {
        let flag = false;
        for (let i = 0; i < this.v.length; i++) {
            if (failTest(this.v[i])) {
                return Sk.builtin.bool.false$;
            }
            if (!flag && passTest(this.v[i])) {
                flag = true;
            }
        }
        return flag ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
    };
}

function mkCaseSwitch(switchCase) {
    return function lowerUpperSwapCase() {
        const final = new Uint8Array(this.v.length);
        for (let i = 0; i < this.v.length; i++) {
            final[i] = switchCase(this.v[i]);
        }
        return new Sk.builtin.bytes(final);
    };
}

/**
 * @constructor
 * @param {Sk.builtin.bytes} bytes
 */
var bytes_iter_ = Sk.abstr.buildIteratorClass("bytes_iterator", {
    constructor: function bytes_iter_(bytes) {
        this.$index = 0;
        this.$seq = bytes.v;
    },
    iternext() {
        const next = this.$seq[this.$index++];
        if (next === undefined) {
            return undefined;
        }
        return new Sk.builtin.int_(next);
    },
    methods: {
        __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
    },
    flags: { sk$unacceptableBase: true },
});

Sk.exportSymbol("Sk.builtin.bytes", Sk.builtin.bytes);
