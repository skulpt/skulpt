Sk.builtin.interned = Object.create(null); // avoid name conflicts with Object.prototype

function getInterned(x) {
    return Sk.builtin.interned[x];
}

function setInterned(x, pyStr) {
    Sk.builtin.interned[x] = pyStr;
}

/**
 * @constructor
 * @param {*=} x
 * @extends {Sk.builtin.object}
 */
Sk.builtin.str = Sk.abstr.buildNativeClass("str", {
    constructor: function (x) {
        // new Sk.builtin.str is an internal function called with a JS value x
        // occasionally called with a python object and returns tp$str();
        Sk.asserts.assert(this instanceof Sk.builtin.str, "bad call to str - use 'new'");

        let ret, interned;
        if (typeof x === "string") {
            // the common case
            ret = x;
        } else if (x === undefined) {
            ret = "";
        } else if (x === null) {
            ret = "None"; // this shouldn't happen
        } else if (x.tp$str !== undefined) {
            // then we're a python object - all objects inherit from object which has tp$str
            return x.tp$str();
        } else {
            throw new Sk.builtin.TypeError("could not convert object of type '" + Sk.abstr.typeName(x) + "' to str");
        }
        interned = getInterned(ret);
        // interning required for strings in py

        if (interned !== undefined) {
            return interned;
        } else {
            setInterned(ret, this);
        }

        this.$mangled = fixReserved(ret);
        // quicker set_dict for strings by preallocating the $savedKeyHash
        this.$savedKeyHash_ = "_" + ret;
        this.v = ret;
        this.codepoints;
    },
    slots: /**@lends {Sk.builtin.str.prototype} */ {
        tp$getattr: Sk.generic.getAttr,
        tp$as_sequence_or_mapping: true,
        tp$doc:
            "str(object='') -> str\nstr(bytes_or_buffer[, encoding[, errors]]) -> str\n\nCreate a new string object from the given object. If encoding or\nerrors is specified, then the object must expose a data buffer\nthat will be decoded using the given encoding and error handler.\nOtherwise, returns the result of object.__str__() (if defined)\nor repr(object).\nencoding defaults to sys.getdefaultencoding().\nerrors defaults to 'strict'.",
        tp$new: function (args, kwargs) {
            if (this !== Sk.builtin.str.prototype) {
                return this.$subtype_new(args, kwargs);
            }
            args = Sk.abstr.copyKeywordsToNamedArgs("str", ["object"], args, kwargs);
            const x = args[0];
            return new Sk.builtin.str(x);
        },
        $r: strBytesRepr,
        tp$str: function () {
            if (this.constructor === Sk.builtin.str) {
                return this;
            } else {
                return new Sk.builtin.str(this.v);
            }
        },
        tp$iter: function () {
            return new Sk.builtin.str_iter_(this);
        },
        tp$richcompare: richCompare,
        mp$subscript: getItem,
        sq$length: seqLength,
        sq$concat: seqConcat,
        sq$repeat: seqRepeat,
        sq$contains: seqContains,

        tp$as_number: true,
        nb$remainder: strBytesRemainder,
    },
    proto: /**@lends {Sk.builtin.str.prototype} */ {
        $subtype_new: function (args, kwargs) {
            const instance = new this.constructor();
            // we call str new method with all the args and kwargs
            const str_instance = Sk.builtin.str.prototype.tp$new(args, kwargs);
            instance.v = str_instance.v;
            return instance;
        },
        $jsstr: function () {
            return this.v;
        },
        $hasAstralCodePoints: function () {
            // If a string has astral code points, we have to work out where they are before
            // we can do things like slicing, computing length, etc. We work this out when we need to.
            if (this.codepoints === null) {
                return false;
            } else if (this.codepoints !== undefined) {
                return true;
            }
            // Does this string contain astral code points? If so, we have to do things the slow way.
            for (let i = 0; i < this.v.length; i++) {
                let cc = this.v.charCodeAt(i);
                if (cc >= 0xd800 && cc < 0xe000) {
                    // Yep, it's a surrogate pair. Mark off the
                    // indices of all the code points for O(1) seeking later
                    this.codepoints = [];
                    for (let j = 0; j < this.v.length; j++) {
                        this.codepoints.push(j);
                        cc = this.v.charCodeAt(j);
                        if (cc >= 0xd800 && cc < 0xdc00) {
                            j++; // High surrogate. Skip next char
                        }
                    }
                    return true;
                }
            }
            this.codepoints = null;
            return false;
        },
    },
});

Sk.exportSymbol("Sk.builtin.str", Sk.builtin.str);

const strMethodDefs = Sk.builtin.str_methods(Sk.builtin.str);
const strMethods = /**@lends {Sk.builtin.str.prototype} */ {
    encode: {
        $meth: function (encoding, errors) {
            /**@todo errors are currently always "strict" (other modes will require manual UTF-8-bashing) */
            encoding = encoding === undefined ? Sk.builtin.str.$utf8 : encoding;
            // errors = errors === undefined ? new Sk.builtin.str("strict") : errors;
            Sk.builtin.pyCheckType("encoding", "string", Sk.builtin.checkString(encoding));
            encoding = encoding.$jsstr();
            if (!/^utf-?8$/i.test(encoding)) {
                throw new Sk.builtin.ValueError("Only UTF-8 or ASCII encoding and decoding is supported");
            }
            // Sk.builtin.pyCheckType("errors", "string", Sk.builtin.checkString(errors));
            // errors = errors.$jsstr();
            // if (!(errors == "strict" || errors == "ignore" || errors == "replace")) {
            //     throw new Sk.builtin.NotImplementedError("'" + errors + "' error handling not implemented in Skulpt");
            // }
            let v;
            try {
                v = unescape(encodeURIComponent(this.v));
            } catch (e) {
                throw new Sk.builtin.UnicodeEncodeError("UTF-8 encoding failed");
            }
            return Sk.__future__.python3 ? new Sk.builtin.bytes(v) : new Sk.builtin.str(v);
        },
        $flags: { MinArgs: 0, MaxArgs: 2 },
        $textsig: "($self, /, encoding='utf-8', errors='strict')",
        $doc:
            "Encode the string using the codec registered for encoding.\n\n  encoding\n    The encoding in which to encode the string.\n  errors\n    The error handling scheme to use for encoding errors.\n    The default is 'strict' meaning that encoding errors raise a\n    UnicodeEncodeError.  Other possible values are 'ignore', 'replace' and\n    'xmlcharrefreplace' as well as any other name registered with\n    codecs.register_error that can handle UnicodeEncodeErrors.",
    },
    replace: strMethodDefs.replace,
    split: strMethodDefs.split,
    // rsplit: strMethodDefs.rsplit,
    join: strMethodDefs.join,
    capitalize: strMethodDefs.capitalize,
    // casefold: {
    //     $meth: function () {},
    //     $flags:{NoArgs: true},
    //     $textsig: "($self, /)",
    //     $doc: Return a version of the string suitable for caseless comparisons.
    // }
    title: strMethodDefs.title,
    center: strMethodDefs.center,
    count: strMethodDefs.count,
    expandtabs: strMethodDefs.expandtabs,
    find: strMethodDefs.find,
    partition: strMethodDefs.partition,
    index: strMethodDefs.index,
    ljust: strMethodDefs.ljust,
    lower: strMethodDefs.lower,
    lstrip: strMethodDefs.lstrip,
    rfind: strMethodDefs.rfind,
    rindex: strMethodDefs.rindex,
    rjust: strMethodDefs.rjust,
    rstrip: strMethodDefs.rstrip,
    rpartition: strMethodDefs.rpartition,
    splitlines: strMethodDefs.splitlines,
    strip: strMethodDefs.strip,
    swapcase: strMethodDefs.swapcase,
    // translate: strMethodDefs.translate,
    upper: strMethodDefs.upper,
    startswith: strMethodDefs.startswith,
    endswith: strMethodDefs.endswith,
    // isascii: strMethodDefs.isascii,
    islower: strMethodDefs.islower,
    isupper: strMethodDefs.isupper,
    istitle: strMethodDefs.istitle,
    isspace: strMethodDefs.isspace,
    // isdecimal: strMethodDefs.isdecimal,
    isdigit: strMethodDefs.isdigit,
    isnumeric: {
        $meth: function () {
            // does not account for unicode numeric values
            return new Sk.builtin.bool(this.v.length && !/[^0-9]/.test(this.v));
        },
        $flags: { NoArgs: true },
        $textsig: "($self, /)",
        $doc:
            "Return True if the string is a numeric string, False otherwise.\n\nA string is numeric if all characters in the string are numeric and there is at\nleast one character in the string.",
    },
    isalpha: strMethodDefs.isalpha,
    isalnum: strMethodDefs.isalnum,
    // isidentifier:
    //     $meth: Sk.builtin.str.methods.isidentifier,
    //     $flags:{NoArgs: true},
    //     $textsig: "($self, /)",
    //     $doc: 'Return True if the string is a valid Python identifier, False otherwise.\n\nUse keyword.iskeyword() to test for reserved identifiers such as "def" and\n"class"'.
    // },,
    // isprintable: {
    //     $meth: function () {},
    //     $flags:{NoArgs: true},
    //     $textsig: "($self, /)",
    //     $doc: "Return True if the string is printable, False otherwise.\n\nA string is printable if all of its characters are considered printable in\nrepr() or if it is empty." },,
    zfill: strMethodDefs.zfill,
    format: {
        $meth: Sk.formatting.format,
        $flags: { FastCall: true },
        $textsig: null,
        $doc:
            "S.format(*args, **kwargs) -> str\n\nReturn a formatted version of S, using substitutions from args and kwargs.\nThe substitutions are identified by braces ('{' and '}').",
    },
    // format_map: {
    //     $meth: function () {},
    //     $flags:{},
    //     $textsig: null,
    //     $doc: "S.format_map(mapping) -> str\n\nReturn a formatted version of S, using substitutions from mapping.\nThe substitutions are identified by braces ('{' and '}')." },
    __format__: {
        $meth: Sk.formatting.formatString,
        $flags: { OneArg: true },
        $textsig: "($self, format_spec, /)",
        $doc: "Return a formatted version of the string as described by format_spec.",
    },
    __getnewargs__: strMethodDefs.__getnewargs__,
};

Sk.abstr.setUpMethods(Sk.builtin.str, strMethods);

// /**
//  * @constructor
//  * @extends {Sk.builtin.object}
//  */
// Sk.builtin.bytes = Sk.abstr.buildNativeClass("bytes", {
//     constructor: function () {},
//     slots: /**@lends {Sk.builtin.bytes.prototype} */ {
//         tp$getattr: Sk.generic.getAttr,
//         tp$as_sequence_or_mapping: true,
//         tp$doc:
//             "bytes(iterable_of_ints) -> bytes\nbytes(string, encoding[, errors]) -> bytes\nbytes(bytes_or_buffer) -> immutable copy of bytes_or_buffer\nbytes(int) -> bytes object of size given by the parameter initialized with null bytes\nbytes() -> empty bytes object\n\nConstruct an immutable array of bytes from:\n  - an iterable yielding integers in range(256)\n  - a text string encoded using the specified encoding\n  - any object implementing the buffer API.\n  - an integer",
//         tp$new: function (args, kwargs) {
//             if (this !== Sk.builtin.bytes.prototype) {
//                 return this.$subtype_new(args, kwargs);
//             }
//             args = Sk.abstr.copyKeywordsToNamedArgs("bytes", ["object"], args, kwargs);
//             const x = args[0];
//             return new Sk.builtin.bytes(x);
//         },
//         $r: strBytesRepr,
//         tp$str: function () {},
//         tp$iter: function () {
//             return new Sk.builtin.bytes_iter_(this);
//         },
//         tp$richcompare: richCompare,
//         mp$subscript: getItem,
//         sq$length: seqLength,
//         sq$concat: seqConcat,
//         sq$repeat: seqRepeat,
//         sq$contains: seqContains,
//         tp$as_number: true,
//         nb$remainser: strBytesRemainder,
//     },
//     methods: /**@lends {Sk.builtin.bytes.prototype} */ {
//         __getnewargs__: bytesMethodDefs.__getnewargs__,
//         capitalize: bytesMethodDefs.capitalize,
//         center: bytesMethodDefs.center,
//         count: bytesMethodDefs.count,
//         decode: {
//             $meth: function () {},
//             $flags:{},
//             $textsig: "($self, /, encoding='utf-8', errors='strict')",
//             $doc: "Decode the bytes using the codec registered for encoding.\n\n  encoding\n    The encoding with which to decode the bytes.\n  errors\n    The error handling scheme to use for the handling of decoding errors.\n    The default is 'strict' meaning that decoding errors raise a\n    UnicodeDecodeError. Other possible values are 'ignore' and 'replace'\n    as well as any other name registered with codecs.register_error that\n    can handle UnicodeDecodeErrors." },
//         endswith: bytesMethodDefs.endswith,
//         expandtabs: bytesMethodDefs.expandtabs,
//         find: bytesMethodDefs.find,
//         hex: {
//             $meth: function (self) {
//                 /** @todo Python 3.8 has added some args here*/
//                 let r = "";
//                 for (let i = 0; i < this.v.length; i++) {
//                     r += ("0" + this.v.charCodeAt(i).toString(16)).substr(-2);
//                 }
//                 return new Sk.builtin.str(r);
//             },
//             $flags: { NoArgs: true },
//             $textsig: null,
//             $doc: "B.hex() -> string\n\nCreate a string of hexadecimal numbers from a bytes object.\nExample: b'\\xb9\\x01\\xef'.hex() -> 'b901ef'.",
//         },
//         index: bytesMethodDefs.index,
//         isalnum: bytesMethodDefs.isalnum,
//         isalpha: bytesMethodDefs.isalpha,
//         // isascii: bytesMethodDefs.isascii,
//         isdigit: bytesMethodDefs.isdigit,
//         islower: bytesMethodDefs.islower,
//         isspace: bytesMethodDefs.isspace,
//         istitle: bytesMethodDefs.istitle,
//         isupper: bytesMethodDefs.isupper,
//         join: bytesMethodDefs.join,
//         ljust: bytesMethodDefs.ljust,
//         lower: bytesMethodDefs.lower,
//         lstrip: bytesMethodDefs.lstrip,
//         partition: bytesMethodDefs.partition,
//         replace: bytesMethodDefs.replace,
//         rfind: bytesMethodDefs.rfind,
//         rindex: bytesMethodDefs.rindex,
//         rjust: bytesMethodDefs.rjust,
//         rpartition: bytesMethodDefs.rpartition,
//         // rsplit: bytesMethodDefs.rsplit,
//         rstrip: bytesMethodDefs.rstrip,
//         split: bytesMethodDefs.split,
//         splitlines: bytesMethodDefs.splitlines,
//         startswith: bytesMethodDefs.startswith,
//         strip: bytesMethodDefs.strip,
//         swapcase: bytesMethodDefs.swapcase,
//         title: bytesMethodDefs.title,
//         // translate: bytesMethodDefs.translate,
//         upper: bytesMethodDefs.upper,
//         zfill: bytesMethodDefs.zfill,
//     },
//     classmethods: {
//         fromhex: {
//             $meth: function (hex) {
//                 Sk.builtin.pyCheckType("hex", "string", Sk.builtin.checkString(hex));
//                 let h = hex.v.replace(/\s*/g, "");
//                 let v = "";
//                 for (let i = 0; i < h.length; i += 2) {
//                     let s = h.substr(i, 2);
//                     let n = parseInt(s, 16);
//                     if (isNaN(n) || s.length != 2 || !/^[abcdefABCDEF0123456789]{2}$/.test(s)) {
//                         throw new Sk.builtin.ValueError("non-hexadecimal number found in fromhex() arg");
//                     }
//                     v += String.fromCharCode(n);
//                 }
//                 return new Sk.builtin.bytes(v);
//             },
//             $flags: { OneArg: true },
//             $textsig: "($type, string, /)",
//             $doc:
//                 "Create a bytes object from a string of hexadecimal numbers.\n\nSpaces between two numbers are accepted.\nExample: bytes.fromhex('B9 01EF') -> b'\\\\xb9\\\\x01\\\\xef'.",
//         },
//     },
//     proto: /**@lends {Sk.builtin.bytes.prototype} */ {
//         $subtype_new: function (args, kwargs) {
//             const instance = new this.constructor();
//             // we call str new method with all the args and kwargs
//             const bytes_instance = Sk.builtin.bytes.prototype.tp$new(args, kwargs);
//             instance.v = bytes_instance.v;
//             return instance;
//         },
//         $jsstr: function () {
//             return this.v;
//         },
//         $hasAstralCodePoints: () => false,
//     },
// });

function strBytesRepr() {
    // single is preferred
    let ashex, c;
    let quote = "'";
    //jshint ignore:start
    if (this.v.indexOf("'") !== -1 && this.v.indexOf('"') === -1) {
        quote = '"';
    }
    //jshint ignore:end
    const len = this.v.length;
    let ret = quote;
    for (let i = 0; i < len; ++i) {
        c = this.v.charAt(i);
        if (c === quote || c === "\\") {
            ret += "\\" + c;
        } else if (c === "\t") {
            ret += "\\t";
        } else if (c === "\n") {
            ret += "\\n";
        } else if (c === "\r") {
            ret += "\\r";
        } else if (c < " " || c >= 0x7f) {
            ashex = c.charCodeAt(0).toString(16);
            if (ashex.length < 2) {
                ashex = "0" + ashex;
            }
            ret += "\\x" + ashex;
        } else {
            ret += c;
        }
    }
    ret += quote;
    return new Sk.builtin.str(ret);
}

function richCompare(other, op) {
    if (!(other instanceof Sk.builtin.str)) {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
    switch (op) {
        case "Lt":
            return this.v < other.v;
        case "LtE":
            return this.v <= other.v;
        case "Eq":
            return this.v === other.v;
        case "NotEq":
            return this.v !== other.v;
        case "Gt":
            return this.v > other.v;
        case "GtE":
            return this.v >= other.v;
        default:
            Sk.asserts.fail();
    }
}

function seqConcat(other) {
    if (!other || !Sk.builtin.checkString(other)) {
        const otypename = Sk.abstr.typeName(other);
        throw new Sk.builtin.TypeError("cannot concatenate 'str' and '" + otypename + "' objects");
    }
    return new Sk.builtin.str(this.v + other.v);
}

function seqRepeat(n) {
    n = Sk.misceval.asIndexOrThrow(n, "can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    let ret = "";
    for (let i = 0; i < n; ++i) {
        ret += this.v;
    }
    return new Sk.builtin.str(ret);
}

function seqContains(ob) {
    if (!(ob instanceof Sk.builtin.str)) {
        throw new Sk.builtin.TypeError("TypeError: 'In <string> requires string as left operand");
    }
    return this.v.indexOf(ob.v) != -1;
}

function getItem(index) {
    if (Sk.misceval.isIndex(index)) {
        index = Sk.misceval.asIndex(index);
        if (index < 0) {
            index = this.v.length + index;
        }
        if (index < 0 || index >= this.v.length) {
            throw new Sk.builtin.IndexError("string index out of range");
        }
        return new Sk.builtin.str(this.v.charAt(index));
    } else if (index instanceof Sk.builtin.slice) {
        let ret = "";
        const str = this.v;
        index.sssiter$(str.length, (i) => {
            ret += str.charAt(i);
        });
        return new Sk.builtin.str(ret);
    } else {
        throw new Sk.builtin.TypeError("string indices must be integers, not " + Sk.abstr.typeName(index));
    }
}

function seqLength() {
    return this.$hasAstralCodePoints() ? this.codepoints.length : this.v.length;
}

function strBytesRemainder(rhs) {
    // % format op. rhs can be a value, a tuple, or something with __getitem__ (dict)

    // From http://docs.python.org/library/stdtypes.html#string-formatting the
    // format looks like:
    // 1. The '%' character, which marks the start of the specifier.
    // 2. Mapping key (optional), consisting of a parenthesised sequence of characters (for example, (somename)).
    // 3. Conversion flags (optional), which affect the result of some conversion types.
    // 4. Minimum field width (optional). If specified as an '*' (asterisk), the actual width is read from the next
    // element of the tuple in values, and the object to convert comes after the minimum field width and optional
    // precision. 5. Precision (optional), given as a '.' (dot) followed by the precision. If specified as '*' (an
    // asterisk), the actual width is read from the next element of the tuple in values, and the value to convert comes
    // after the precision. 6. Length modifier (optional). 7. Conversion type.  length modifier is ignored

    var ret;
    var replFunc;
    var index;
    var regex;
    var val;

    if (rhs.constructor !== Sk.builtin.tuple && (rhs.mp$subscript === undefined || rhs.constructor === Sk.builtin.str)) {
        rhs = new Sk.builtin.tuple([rhs]);
    }
    // general approach is to use a regex that matches the format above, and
    // do an re.sub with a function as replacement to make the subs.

    //           1 2222222222222222   33333333   444444444   5555555555555  66666  777777777777777777
    regex = /%(\([a-zA-Z0-9]+\))?([#0 +\-]+)?(\*|[0-9]+)?(\.(\*|[0-9]+))?[hlL]?([diouxXeEfFgGcrs%])/g;
    index = 0;
    replFunc = function (substring, mappingKey, conversionFlags, fieldWidth, precision, precbody, conversionType) {
        var result;
        var convName;
        var convValue;
        var base;
        var r;
        var mk;
        var value;
        var handleWidth;
        var formatNumber;
        var alternateForm;
        var precedeWithSign;
        var blankBeforePositive;
        var leftAdjust;
        var zeroPad;
        var i;
        fieldWidth = Sk.builtin.asnum$(fieldWidth);
        precision = Sk.builtin.asnum$(precision);

        if ((mappingKey === undefined || mappingKey === "") && conversionType != "%") {
            i = index++;
        } // ff passes '' not undef for some reason

        if (precision === "") {
            // ff passes '' here aswell causing problems with G,g, etc.
            precision = undefined;
        }

        zeroPad = false;
        leftAdjust = false;
        blankBeforePositive = false;
        precedeWithSign = false;
        alternateForm = false;
        if (conversionFlags) {
            if (conversionFlags.indexOf("-") !== -1) {
                leftAdjust = true;
            } else if (conversionFlags.indexOf("0") !== -1) {
                zeroPad = true;
            }

            if (conversionFlags.indexOf("+") !== -1) {
                precedeWithSign = true;
            } else if (conversionFlags.indexOf(" ") !== -1) {
                blankBeforePositive = true;
            }

            alternateForm = conversionFlags.indexOf("#") !== -1;
        }

        if (precision) {
            precision = parseInt(precision.substr(1), 10);
        }

        formatNumber = function (n, base) {
            var precZeroPadded;
            var prefix;
            var didSign;
            var neg;
            var r;
            var j;
            base = Sk.builtin.asnum$(base);
            neg = false;
            didSign = false;
            if (typeof n === "number") {
                if (n < 0) {
                    n = -n;
                    neg = true;
                }
                r = n.toString(base);
            } else if (n instanceof Sk.builtin.float_) {
                r = n.str$(base, false);
                if (r.length > 2 && r.substr(-2) === ".0") {
                    r = r.substr(0, r.length - 2);
                }
                neg = n.nb$isnegative();
            } else if (n instanceof Sk.builtin.int_) {
                r = n.str$(base, false);
                neg = n.nb$isnegative();
            } else if (n instanceof Sk.builtin.lng) {
                r = n.str$(base, false);
                neg = n.nb$isnegative();
            }

            Sk.asserts.assert(r !== undefined, "unhandled number format");

            precZeroPadded = false;

            if (precision) {
                //print("r.length",r.length,"precision",precision);
                for (j = r.length; j < precision; ++j) {
                    r = "0" + r;
                    precZeroPadded = true;
                }
            }

            prefix = "";

            if (neg) {
                prefix = "-";
            } else if (precedeWithSign) {
                prefix = "+" + prefix;
            } else if (blankBeforePositive) {
                prefix = " " + prefix;
            }

            if (alternateForm) {
                if (base === 16) {
                    prefix += "0x";
                } else if (base === 8 && !precZeroPadded && r !== "0") {
                    prefix += "0";
                }
            }

            return [prefix, r];
        };

        handleWidth = function (args) {
            var totLen;
            var prefix = args[0];
            var r = args[1];
            var j;

            if (fieldWidth) {
                fieldWidth = parseInt(fieldWidth, 10);
                totLen = r.length + prefix.length;
                if (zeroPad) {
                    for (j = totLen; j < fieldWidth; ++j) {
                        r = "0" + r;
                    }
                } else if (leftAdjust) {
                    for (j = totLen; j < fieldWidth; ++j) {
                        r = r + " ";
                    }
                } else {
                    for (j = totLen; j < fieldWidth; ++j) {
                        prefix = " " + prefix;
                    }
                }
            }
            return prefix + r;
        };

        //print("Rhs:",rhs, "ctor", rhs.constructor);
        if (rhs.constructor === Sk.builtin.tuple) {
            value = rhs.v[i];
        } else if (rhs.mp$subscript !== undefined && mappingKey !== undefined) {
            mk = mappingKey.substring(1, mappingKey.length - 1);
            //print("mk",mk);
            value = rhs.mp$subscript(new Sk.builtin.str(mk));
        } else if (rhs.constructor === Sk.builtin.dict || rhs.constructor === Sk.builtin.list) {
            // new case where only one argument is provided
            value = rhs;
        } else {
            throw new Sk.builtin.AttributeError(rhs.tp$name + " instance has no attribute 'mp$subscript'");
        }
        base = 10;
        if (conversionType === "d" || conversionType === "i") {
            return handleWidth(formatNumber(value, 10));
        } else if (conversionType === "o") {
            return handleWidth(formatNumber(value, 8));
        } else if (conversionType === "x") {
            return handleWidth(formatNumber(value, 16));
        } else if (conversionType === "X") {
            return handleWidth(formatNumber(value, 16)).toUpperCase();
        } else if (
            conversionType === "f" ||
            conversionType === "F" ||
            conversionType === "e" ||
            conversionType === "E" ||
            conversionType === "g" ||
            conversionType === "G"
        ) {
            convValue = Sk.builtin.asnum$(value);
            if (typeof convValue === "string") {
                convValue = Number(convValue);
            }
            if (convValue === Infinity) {
                return "inf";
            }
            if (convValue === -Infinity) {
                return "-inf";
            }
            if (isNaN(convValue)) {
                return "nan";
            }
            convName = ["toExponential", "toFixed", "toPrecision"]["efg".indexOf(conversionType.toLowerCase())];
            if (precision === undefined || precision === "") {
                if (conversionType === "e" || conversionType === "E") {
                    precision = 6;
                } else if (conversionType === "f" || conversionType === "F") {
                    if (Sk.__future__.python3) {
                        precision = 6;
                    } else {
                        precision = 7;
                    }
                }
            }
            result = convValue[convName](precision); // possible loose of negative zero sign

            // apply sign to negative zeros, floats only!
            if (Sk.builtin.checkFloat(value)) {
                if (convValue === 0 && 1 / convValue === -Infinity) {
                    result = "-" + result; // add sign for zero
                }
            }
            if (Sk.__future__.python3) {
                if (result.length >= 7 && result.slice(0, 6) == "0.0000") {
                    val = parseFloat(result);
                    result = val.toExponential();
                }
                if (result.charAt(result.length - 2) == "-") {
                    result = result.slice(0, result.length - 1) + "0" + result.charAt(result.length - 1);
                }
            }
            if ("EFG".indexOf(conversionType) !== -1) {
                result = result.toUpperCase();
            }
            return handleWidth(["", result]);
        } else if (conversionType === "c") {
            if (typeof value === "number") {
                return String.fromCharCode(value);
            } else if (value instanceof Sk.builtin.int_) {
                return String.fromCharCode(value.v);
            } else if (value instanceof Sk.builtin.float_) {
                return String.fromCharCode(value.v);
            } else if (value instanceof Sk.builtin.lng) {
                return String.fromCharCode(value.str$(10, false)[0]);
            } else if (value.constructor === Sk.builtin.str) {
                return value.v.substr(0, 1);
            } else {
                throw new Sk.builtin.TypeError("an integer is required");
            }
        } else if (conversionType === "r") {
            r = Sk.builtin.repr(value);
            if (precision) {
                return r.v.substr(0, precision);
            }
            return r.v;
        } else if (conversionType === "s") {
            r = new Sk.builtin.str(value);
            r = r.$jsstr();
            if (precision) {
                return r.substr(0, precision);
            }
            if (fieldWidth) {
                r = handleWidth([" ", r]);
            }
            return r;
        } else if (conversionType === "%") {
            return "%";
        }
    };
    ret = this.v.replace(regex, replFunc);
    return new Sk.builtin.str(ret);
}

var reservedWords_ = {
    abstract: true,
    as: true,
    boolean: true,
    break: true,
    byte: true,
    case: true,
    catch: true,
    char: true,
    class: true,
    continue: true,
    const: true,
    debugger: true,
    default: true,
    delete: true,
    do: true,
    double: true,
    else: true,
    enum: true,
    export: true,
    extends: true,
    false: true,
    final: true,
    finally: true,
    float: true,
    for: true,
    function: true,
    goto: true,
    if: true,
    implements: true,
    import: true,
    in: true,
    instanceof: true,
    int: true,
    interface: true,
    is: true,
    long: true,
    namespace: true,
    native: true,
    new: true,
    null: true,
    package: true,
    private: true,
    protected: true,
    public: true,
    return: true,
    short: true,
    static: true,
    super: true,
    switch: true,
    synchronized: true,
    this: true,
    throw: true,
    throws: true,
    transient: true,
    true: true,
    try: true,
    typeof: true,
    use: true,
    var: true,
    void: true,
    volatile: true,
    while: true,
    with: true,
    // reserved Names
    constructor: true,
    __defineGetter__: true,
    __defineSetter__: true,
    apply: true,
    arguments: true,
    call: true,
    caller: true,
    eval: true,
    hasOwnProperty: true,
    isPrototypeOf: true,
    __lookupGetter__: true,
    __lookupSetter__: true,
    __noSuchMethod__: true,
    propertyIsEnumerable: true,
    prototype: true,
    toSource: true,
    toLocaleString: true,
    toString: true,
    unwatch: true,
    valueOf: true,
    watch: true,
    length: true,
    name: true,
};

Sk.builtin.str.reservedWords_ = reservedWords_;

function fixReserved(name) {
    if (reservedWords_[name] === undefined) {
        return name;
    }
    return name + "_$rw$";
}
