var keyhash_regex = /^[0-9!#_]/;
var interned = Object.create(null); // avoid name conflicts with Object.prototype

function getInterned(x) {
    return interned[x];
}

function setInterned(x, pyStr) {
    interned[x] = pyStr;
}

/**
 * @constructor
 * @param {*} x
 * @extends Sk.builtin.object
 */
Sk.builtin.str = Sk.abstr.buildNativeClass("str", {
    constructor: function str(x) {
        // new Sk.builtin.str is an internal function called with a JS value x
        // occasionally called with a python object and returns tp$str() or $r();
        Sk.asserts.assert(this instanceof Sk.builtin.str, "bad call to str - use 'new'");
        let ret;
        if (typeof x === "string") {
            ret = x;
        } else if (x === undefined) {
            ret = "";
        } else if (x === null) { 
            ret = "None";
        } else if (x.tp$str !== undefined) {
            // then we're a python object - all objects inherit from object which has tp$str
            return x.tp$str();
        } else if (typeof x === "number") {
            ret = Number.isFinite(x) ? String(x) : String(x).replace("Infinity", "inf").replace("NaN", "nan");
        } else {
            throw new Sk.builtin.TypeError("could not convert object of type '" + Sk.abstr.typeName(x) + "' to str");
        }

        const interned = getInterned(ret);
        // interning required for strings in py
        if (interned !== undefined) {
            return interned;
        } else {
            setInterned(ret, this);
        }

        this.$mangled = fixReserved(ret);
        // used by dict key hash function $savedKeyHash
        this.$savedKeyHash = ret.replace(keyhash_regex, "!$&");
        this.v = ret;
    },
    slots: /**@lends {Sk.builtin.str.prototype} */ {
        tp$getattr: Sk.generic.getAttr,
        tp$as_sequence_or_mapping: true,
        tp$doc:
            "str(object='') -> str\nstr(bytes_or_buffer[, encoding[, errors]]) -> str\n\nCreate a new string object from the given object. If encoding or\nerrors is specified, then the object must expose a data buffer\nthat will be decoded using the given encoding and error handler.\nOtherwise, returns the result of object.__str__() (if defined)\nor repr(object).\nencoding defaults to sys.getdefaultencoding().\nerrors defaults to 'strict'.",
        tp$new(args, kwargs) {
            kwargs = kwargs || [];
            if (this !== Sk.builtin.str.prototype) {
                return this.$subtype_new(args, kwargs);
            }
            if (args.length <= 1 && !kwargs.length) {
                return new Sk.builtin.str(args[0]);
            } else if (!Sk.__future__.python3) {
                throw new Sk.builtin.TypeError("str takes at most one argument (" + (args.length + kwargs.length) + " given)");
            } else {
                const [x, encoding, errors] = Sk.abstr.copyKeywordsToNamedArgs("str", ["object", "encoding", "errors"], args, kwargs);
                if (x === undefined || (encoding === undefined && errors === undefined)) {
                    return new Sk.builtin.str(x);
                }
                // check the types of encoding and errors
                Sk.builtin.bytes.check$encodeArgs("str", encoding, errors);
                if (!Sk.builtin.checkBytes(x)) {
                    throw new Sk.builtin.TypeError("decoding to str: need a bytes-like object, " + Sk.abstr.typeName(x) + " found");
                }
                return Sk.builtin.bytes.$decode.call(x, encoding, errors);
            }
        },
        $r() {
            // single is preferred
            let quote = "'";
            if (this.v.indexOf("'") !== -1 && this.v.indexOf('"') === -1) {
                quote = '"';
            }
            //jshint ignore:end
            const len = this.v.length;
            let c,
                cc,
                ret = quote;
            for (let i = 0; i < len; i++) {
                c = this.v.charAt(i);
                cc = this.v.charCodeAt(i);
                if (c === quote || c === "\\") {
                    ret += "\\" + c;
                } else if (c === "\t") {
                    ret += "\\t";
                } else if (c === "\n") {
                    ret += "\\n";
                } else if (c === "\r") {
                    ret += "\\r";
                } else if (((cc > 0xff && cc < 0xd800) || cc >= 0xe000) && !Sk.__future__.python3) {
                    // BMP
                    ret += "\\u" + ("000" + cc.toString(16)).slice(-4);
                } else if (cc >= 0xd800 && !Sk.__future__.python3) {
                    // Surrogate pair stuff
                    let val = this.v.codePointAt(i);
                    i++;

                    val = val.toString(16);
                    let s = "0000000" + val.toString(16);
                    if (val.length > 4) {
                        ret += "\\U" + s.slice(-8);
                    } else {
                        ret += "\\u" + s.slice(-4);
                    }
                } else if (cc > 0xff && !Sk.__future__.python3) {
                    // Invalid!
                    ret += "\\ufffd";
                } else if (c < " " || (cc >= 0x7f && !Sk.__future__.python3)) {
                    let ashex = c.charCodeAt(0).toString(16);
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
        },
        tp$str() {
            if (this.constructor === Sk.builtin.str) {
                return this;
            } else {
                return new Sk.builtin.str(this.v);
            }
        },
        tp$iter() {
            return new str_iter_(this);
        },
        tp$richcompare(other, op) {
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
            }
        },
        mp$subscript(index) {
            let len;
            if (Sk.misceval.isIndex(index)) {
                index = Sk.misceval.asIndexSized(index, Sk.builtin.OverflowError);
                len = this.sq$length();
                if (index < 0) {
                    index = index + len;
                }
                if (index < 0 || index >= len) {
                    throw new Sk.builtin.IndexError("string index out of range");
                }
                if (this.codepoints) {
                    return new Sk.builtin.str(this.v.substring(this.codepoints[index], this.codepoints[index + 1]));
                } else {
                    return new Sk.builtin.str(this.v.charAt(index));
                }
            } else if (index instanceof Sk.builtin.slice) {
                let ret = "";
                len = this.sq$length();
                if (this.codepoints) {
                    index.sssiter$(len, (i) => {
                        ret += this.v.substring(this.codepoints[i], this.codepoints[i + 1]);
                    });
                } else {
                    index.sssiter$(len, (i) => {
                        ret += this.v.charAt(i);
                    });
                }
                return new Sk.builtin.str(ret);
            }
            throw new Sk.builtin.TypeError("string indices must be integers, not " + Sk.abstr.typeName(index));
        },
        sq$length() {
            return this.$hasAstralCodePoints() ? this.codepoints.length : this.v.length;
        },
        sq$concat(other) {
            if (!(other instanceof Sk.builtin.str)) {
                throw new Sk.builtin.TypeError("cannot concatenate 'str' and '" + Sk.abstr.typeName(other) + "' objects");
            }
            return new Sk.builtin.str(this.v + other.v);
        },
        sq$repeat(n) {
            if (!Sk.misceval.isIndex(n)) {
                throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
            }
            n = Sk.misceval.asIndexSized(n, Sk.builtin.OverflowError);
            if (n * this.v.length > Number.MAX_SAFE_INTEGER) {
                throw new Sk.builtin.OverflowError();
            }
            let ret = "";
            for (let i = 0; i < n; i++) {
                ret += this.v;
            }
            return new Sk.builtin.str(ret);
        },
        sq$contains(ob) {
            if (!(ob instanceof Sk.builtin.str)) {
                throw new Sk.builtin.TypeError("'in <string>' requires string as left operand not " + Sk.abstr.typeName(ob));
            }
            return this.v.indexOf(ob.v) !== -1;
        },
        tp$as_number: true,
        nb$remainder: strBytesRemainder,
    },
    proto: /**@lends {Sk.builtin.str.prototype} */ {
        toString() {
            return this.v;
        },
        $subtype_new(args, kwargs) {
            const instance = new this.constructor();
            // we call str new method with all the args and kwargs
            const str_instance = Sk.builtin.str.prototype.tp$new(args, kwargs);
            instance.$mangled = str_instance.$mangled;
            instance.$savedKeyHash = str_instance.$savedKeyHash ;
            instance.v = str_instance.v;
            return instance;
        },
        $jsstr() {
            return this.v;
        },
        $hasAstralCodePoints() {
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
        sk$asarray() {
            const ret = [];
            if (this.$hasAstralCodePoints()) {
                const codepoints = this.codepoints;
                for (let i = 0; i < codepoints.length; i++) {
                    ret.push(new Sk.builtin.str(this.v.substring(codepoints[i], codepoints[i + 1])));
                }
            } else {
                for (let i = 0; i < this.v.length; i++) {
                    ret.push(new Sk.builtin.str(this.v[i]));
                }
            }
            return ret;
        },
        find$left: mkFind(false),
        find$right: mkFind(true),
        get$tgt(tgt) {
            if (tgt instanceof Sk.builtin.str) {
                return tgt.v;
            }
            throw new Sk.builtin.TypeError("a str instance is required not '" + Sk.abstr.typeName(tgt) + "'");
        },
    },
    methods: /**@lends {Sk.builtin.str.prototype} */ {
        encode: {
            $meth: function encode(encoding, errors) {
                ({ encoding, errors } = Sk.builtin.bytes.check$encodeArgs("encode", encoding, errors));
                const pyBytes = Sk.builtin.bytes.str$encode(this, encoding, errors);
                return Sk.__future__.python3 ? pyBytes : new Sk.builtin.str(pyBytes.$jsstr());
            },
            $flags: { NamedArgs: ["encoding", "errors"] },
            $textsig: "($self, /, encoding='utf-8', errors='strict')",
            $doc:
                "Encode the string using the codec registered for encoding.\n\n  encoding\n    The encoding in which to encode the string.\n  errors\n    The error handling scheme to use for encoding errors.\n    The default is 'strict' meaning that encoding errors raise a\n    UnicodeEncodeError.  Other possible values are 'ignore', 'replace' and\n    'xmlcharrefreplace' as well as any other name registered with\n    codecs.register_error that can handle UnicodeEncodeErrors.",
        },
        replace: {
            $meth(oldS, newS, count) {
                oldS = this.get$tgt(oldS);
                newS = this.get$tgt(newS);
                count = count === undefined ? -1 : Sk.misceval.asIndexSized(count, Sk.builtin.OverflowError);
                const patt = new RegExp(re_escape_(oldS), "g");
                if (count < 0) {
                    return new Sk.builtin.str(this.v.replace(patt, newS));
                }
                let c = 0;
                const ret = this.v.replace(patt, (match) => (c++ < count ? newS : match));
                return new Sk.builtin.str(ret);
            },
            $flags: { MinArgs: 2, MaxArgs: 3 },
            $textsig: "($self, old, new, count=-1, /)",
            $doc:
                "Return a copy with all occurrences of substring old replaced by new.\n\n  count\n    Maximum number of occurrences to replace.\n    -1 (the default value) means replace all occurrences.\n\nIf the optional argument count is given, only the first count occurrences are\nreplaced.",
        },
        split: {
            $meth: function split(sep, maxsplit) {
                maxsplit = Sk.misceval.asIndexSized(maxsplit, Sk.builtin.OverflowError);
                const codepoints = splitPoints(this, sep, maxsplit);
                const ret = [];
                for (let i = 0; i < codepoints.length; i++) {
                    ret.push(new Sk.builtin.str(this.v.substring(codepoints[i], codepoints[++i])));
                }
                return new Sk.builtin.list(ret);
            },
            $flags: { NamedArgs: ["sep", "maxsplit"], Defaults: [Sk.builtin.none.none$, -1] },
            $textsig: "($self, /, sep=None, maxsplit=-1)",
            $doc:
                "Return a list of the words in the string, using sep as the delimiter string.\n\n  sep\n    The delimiter according which to split the string.\n    None (the default value) means split according to any whitespace,\n    and discard empty strings from the result.\n  maxsplit\n    Maximum number of splits to do.\n    -1 (the default value) means no limit.",
        },
        rsplit: {
            $meth: function rsplit(sep, maxsplit) {
                // do a full split and then slice the string accordingly;
                maxsplit = Sk.misceval.asIndexSized(maxsplit, Sk.builtin.OverflowError);
                const codepoints = splitPoints(this, sep, -1);
                let from = maxsplit < 0 ? 0 : (codepoints.length / 2 - maxsplit) * 2;
                const ret = [];
                if (from <= 0) {
                    from = 0;
                } else {
                    ret.push(new Sk.builtin.str(this.v.slice(0, codepoints[from - 1])));
                }
                for (let i = from; i < codepoints.length; i++) {
                    ret.push(new Sk.builtin.str(this.v.substring(codepoints[i], codepoints[++i])));
                }
                return new Sk.builtin.list(ret);
            },
            $flags: { NamedArgs: ["sep", "maxsplit"], Defaults: [Sk.builtin.none.none$, -1] },
            $textsig: "($self, /, sep=None, maxsplit=-1)",
            $doc:
                "Return a list of the words in the string, using sep as the delimiter string.\n\n  sep\n    The delimiter according which to split the string.\n    None (the default value) means split according to any whitespace,\n    and discard empty strings from the result.\n  maxsplit\n    Maximum number of splits to do.\n    -1 (the default value) means no limit.\n\nSplits are done starting at the end of the string and working to the front.",
        },
        join: {
            $meth(seq) {
                const arrOfStrs = [];
                return Sk.misceval.chain(
                    Sk.misceval.iterFor(Sk.abstr.iter(seq), (i) => {
                        if (!(i instanceof Sk.builtin.str)) {
                            throw new Sk.builtin.TypeError(
                                "sequence item " + arrOfStrs.length + ": expected str, " + Sk.abstr.typeName(i) + " found"
                            );
                        }
                        arrOfStrs.push(i.v);
                    }),
                    () => new Sk.builtin.str(arrOfStrs.join(this.v))
                );
            },
            $flags: { OneArg: true },
            $textsig: "($self, iterable, /)",
            $doc:
                "Concatenate any number of strings.\n\nThe string whose method is called is inserted in between each given string.\nThe result is returned as a new string.\n\nExample: '.'.join(['ab', 'pq', 'rs']) -> 'ab.pq.rs'",
        },
        capitalize: {
            $meth: function capitalize() {
                return new Sk.builtin.str(this.v.charAt(0).toUpperCase() + this.v.slice(1).toLowerCase());
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc:
                "Return a capitalized version of the string.\n\nMore specifically, make the first character have upper case and the rest lower\ncase.",
        },
        // casefold: {
        //     $meth: methods.casefold,
        //     $flags: { NoArgs: true },
        //     $textsig: "($self, /)",
        //     $doc: "Return a version of the string suitable for caseless comparisons.",
        // },
        title: {
            $meth: function title() {
                const ret = this.v.replace(/[a-z][a-z]*/gi, (str) => str[0].toUpperCase() + str.substr(1).toLowerCase());
                return new Sk.builtin.str(ret);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc:
                "Return a version of the string where each word is titlecased.\n\nMore specifically, words start with uppercased characters and all remaining\ncased characters have lower case.",
        },
        center: {
            $meth: mkJust(false, true),
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($self, width, fillchar=' ', /)",
            $doc: "Return a centered string of length width.\n\nPadding is done using the specified fill character (default is a space).",
        },
        count: {
            $meth: function count(pat, start, end) {
                pat = this.get$tgt(pat);
                ({ start, end } = indices(this, start, end));
                if (end < start) {
                    return new Sk.builtin.int_(0);
                }
                const normaltext = pat.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                const m = new RegExp(normaltext, "g");
                const slice = this.v.slice(start, end);
                const ctl = slice.match(m);
                if (!ctl) {
                    return new Sk.builtin.int_(0);
                } else {
                    return new Sk.builtin.int_(ctl.length);
                }
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "S.count(sub[, start[, end]]) -> int\n\nReturn the number of non-overlapping occurrences of substring sub in\nstring S[start:end].  Optional arguments start and end are\ninterpreted as in slice notation.",
        },
        expandtabs: {
            $meth: function expandtabs(tabsize) {
                if (Sk.builtin.checkInt(tabsize)) {
                    tabsize = Sk.builtin.asnum$(tabsize);
                } else {
                    throw new Sk.builtin.TypeError("an integer is required, got type" + Sk.abstr.typeName(tabsize));
                }
                const spaces = new Array(tabsize + 1).join(" ");
                const expanded = this.v.replace(/([^\r\n\t]*)\t/g, (a, b) => b + spaces.slice(b.length % tabsize));
                return new Sk.builtin.str(expanded);
            },
            $flags: { NamedArgs: ["tabsize"], Defaults: [8] },
            $textsig: "($self, /, tabsize=8)",
            $doc:
                "Return a copy where all tab characters are expanded using spaces.\n\nIf tabsize is not given, a tab size of 8 characters is assumed.",
        },
        find: {
            $meth: function find(tgt, start, end) {
                return new Sk.builtin.int_(this.find$left(tgt, start, end));
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "S.find(sub[, start[, end]]) -> int\n\nReturn the lowest index in S where substring sub is found,\nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nReturn -1 on failure.",
        },
        partition: {
            $meth: mkPartition(false),
            $flags: { OneArg: true },
            $textsig: "($self, sep, /)",
            $doc:
                "Partition the string into three parts using the given separator.\n\nThis will search for the separator in the string.  If the separator is found,\nreturns a 3-tuple containing the part before the separator, the separator\nitself, and the part after it.\n\nIf the separator is not found, returns a 3-tuple containing the original string\nand two empty strings.",
        },
        index: {
            $meth: function index(tgt, start, end) {
                const val = this.find$left(tgt, start, end);
                if (val === -1) {
                    throw new Sk.builtin.ValueError("substring not found");
                } else {
                    return new Sk.builtin.int_(val);
                }
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "S.index(sub[, start[, end]]) -> int\n\nReturn the lowest index in S where substring sub is found, \nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nRaises ValueError when the substring is not found.",
        },
        ljust: {
            $meth: mkJust(false, false),
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($self, width, fillchar=' ', /)",
            $doc: "Return a left-justified string of length width.\n\nPadding is done using the specified fill character (default is a space).",
        },
        lower: {
            $meth() {
                return new Sk.builtin.str(this.v.toLowerCase());
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Return a copy of the string converted to lowercase.",
        },
        lstrip: {
            $meth: mkStrip(/^\s+/g, (regex) => "^[" + regex + "]+"),
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: "($self, chars=None, /)",
            $doc:
                "Return a copy of the string with leading whitespace removed.\n\nIf chars is given and not None, remove characters in chars instead.",
        },
        rfind: {
            $meth(tgt, start, end) {
                return new Sk.builtin.int_(this.find$right(tgt, start, end));
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "S.rfind(sub[, start[, end]]) -> int\n\nReturn the highest index in S where substring sub is found,\nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nReturn -1 on failure.",
        },
        rindex: {
            $meth: function rindex(tgt, start, end) {
                const val = this.find$right(tgt, start, end);
                if (val === -1) {
                    throw new Sk.builtin.ValueError("substring not found");
                } else {
                    return new Sk.builtin.int_(val);
                }
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "S.rindex(sub[, start[, end]]) -> int\n\nReturn the highest index in S where substring sub is found,\nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nRaises ValueError when the substring is not found.",
        },
        rjust: {
            $meth: mkJust(true, false),
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($self, width, fillchar=' ', /)",
            $doc: "Return a right-justified string of length width.\n\nPadding is done using the specified fill character (default is a space).",
        },
        rstrip: {
            $meth: mkStrip(/\s+$/g, (regex) => "[" + regex + "]+$"),
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: "($self, chars=None, /)",
            $doc:
                "Return a copy of the string with trailing whitespace removed.\n\nIf chars is given and not None, remove characters in chars instead.",
        },
        rpartition: {
            $meth: mkPartition(true),
            $flags: { OneArg: true },
            $textsig: "($self, sep, /)",
            $doc:
                "Partition the string into three parts using the given separator.\n\nThis will search for the separator in the string, starting at the end. If\nthe separator is found, returns a 3-tuple containing the part before the\nseparator, the separator itself, and the part after it.\n\nIf the separator is not found, returns a 3-tuple containing two empty strings\nand the original string.",
        },
        splitlines: {
            $meth: function splitlines(keepends) {
                keepends = Sk.misceval.isTrue(keepends);
                const data = this.v;
                const final = [];
                const len = data.length;
                let slice,
                    ch,
                    eol,
                    sol = 0;
                for (let i = 0; i < len; i++) {
                    ch = data.charAt(i);
                    if (data.charAt(i + 1) === "\n" && ch === "\r") {
                        eol = i + 2;
                        slice = data.slice(sol, eol);
                        if (!keepends) {
                            slice = slice.replace(/(\r|\n)/g, "");
                        }
                        final.push(new Sk.builtin.str(slice));
                        sol = eol;
                    } else if ((ch === "\n" && data.charAt(i - 1) !== "\r") || ch === "\r") {
                        eol = i + 1;
                        slice = data.slice(sol, eol);
                        if (!keepends) {
                            slice = slice.replace(/(\r|\n)/g, "");
                        }
                        final.push(new Sk.builtin.str(slice));
                        sol = eol;
                    }
                }
                if (sol < len) {
                    eol = len;
                    slice = data.slice(sol, eol);
                    if (!keepends) {
                        slice = slice.replace(/(\r|\n)/g, "");
                    }
                    final.push(new Sk.builtin.str(slice));
                }
                return new Sk.builtin.list(final);
            },
            $flags: { NamedArgs: ["keepends"], Defaults: [false] },
            $textsig: "($self, /, keepends=False)",
            $doc:
                "Return a list of the lines in the string, breaking at line boundaries.\n\nLine breaks are not included in the resulting list unless keepends is given and\ntrue.",
        },
        strip: {
            $meth: mkStrip(/^\s+|\s+$/g, (regex) => "^[" + regex + "]+|[" + regex + "]+$"),
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: "($self, chars=None, /)",
            $doc:
                "Return a copy of the string with leading and trailing whitespace remove.\n\nIf chars is given and not None, remove characters in chars instead.",
        },
        swapcase: {
            $meth() {
                const ret = this.v.replace(/[a-z]/gi, (c) => {
                    const lc = c.toLowerCase();
                    return lc === c ? c.toUpperCase() : lc;
                });
                return new Sk.builtin.str(ret);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Convert uppercase characters to lowercase and lowercase characters to uppercase.",
        },
        // translate: {
        //     $meth: methods.translate,
        //     $flags: {},
        //     $textsig: "($self, table, /)",
        //     $doc:
        //         "Replace each character in the string using the given translation table.\n\n  table\n    Translation table, which must be a mapping of Unicode ordinals to\n    Unicode ordinals, strings, or None.\n\nThe table must implement lookup/indexing via __getitem__, for instance a\ndictionary or list.  If this operation raises LookupError, the character is\nleft untouched.  Characters mapped to None are deleted.",
        // },
        upper: {
            $meth() {
                return new Sk.builtin.str(this.v.toUpperCase());
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Return a copy of the string converted to uppercase.",
        },
        startswith: {
            $meth: mkStartsEndswith("startswith", (substr, i) => substr.indexOf(i) === 0),
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "S.startswith(prefix[, start[, end]]) -> bool\n\nReturn True if S starts with the specified prefix, False otherwise.\nWith optional start, test S beginning at that position.\nWith optional end, stop comparing S at that position.\nprefix can also be a tuple of strings to try.",
        },
        endswith: {
            $meth: mkStartsEndswith("endswith", (substr, i) => substr.indexOf(i, substr.length - i.length) !== -1),
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc:
                "S.endswith(suffix[, start[, end]]) -> bool\n\nReturn True if S ends with the specified suffix, False otherwise.\nWith optional start, test S beginning at that position.\nWith optional end, stop comparing S at that position.\nsuffix can also be a tuple of strings to try.",
        },
        isascii: {
            $meth() {
                return new Sk.builtin.bool(/^[\x00-\x7F]*$/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc:
                "Return True if all characters in the string are ASCII, False otherwise.\n\nASCII characters have code points in the range U+0000-U+007F.\nEmpty string is ASCII too.",
        },
        islower: {
            $meth: function islower() {
                return new Sk.builtin.bool(this.v.length && /[a-z]/.test(this.v) && !/[A-Z]/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc:
                "Return True if the string is a lowercase string, False otherwise.\n\nA string is lowercase if all cased characters in the string are lowercase and\nthere is at least one cased character in the string.",
        },
        isupper: {
            $meth: function islower() {
                return new Sk.builtin.bool(this.v.length && !/[a-z]/.test(this.v) && /[A-Z]/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc:
                "Return True if the string is an uppercase string, False otherwise.\n\nA string is uppercase if all cased characters in the string are uppercase and\nthere is at least one cased character in the string.",
        },
        istitle: {
            $meth: function istitle() {
                // Comparing to str.title() seems the most intuitive thing, but it fails on "",
                // Other empty-ish strings with no change.
                const input = this.v;
                let cased = false;
                let previous_is_cased = false;
                let ch;
                for (let pos = 0; pos < input.length; pos++) {
                    ch = input.charAt(pos);
                    if (!/[a-z]/.test(ch) && /[A-Z]/.test(ch)) {
                        if (previous_is_cased) {
                            return Sk.builtin.bool.false$;
                        }
                        previous_is_cased = true;
                        cased = true;
                    } else if (/[a-z]/.test(ch) && !/[A-Z]/.test(ch)) {
                        if (!previous_is_cased) {
                            return Sk.builtin.bool.false$;
                        }
                        cased = true;
                    } else {
                        previous_is_cased = false;
                    }
                }
                return new Sk.builtin.bool(cased);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc:
                "Return True if the string is a title-cased string, False otherwise.\n\nIn a title-cased string, upper- and title-case characters may only\nfollow uncased characters and lowercase characters only cased ones.",
        },
        isspace: {
            $meth: function isspace() {
                return new Sk.builtin.bool(/^\s+$/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc:
                "Return True if the string is a whitespace string, False otherwise.\n\nA string is whitespace if all characters in the string are whitespace and there\nis at least one character in the string.",
        },
        // isdecimal: {
        //     $meth: methods.isdecimal,
        //     $flags: { NoArgs: true },
        //     $textsig: "($self, /)",
        //     $doc:
        //         "Return True if the string is a decimal string, False otherwise.\n\nA string is a decimal string if all characters in the string are decimal and\nthere is at least one character in the string.",
        // },
        isdigit: {
            $meth: function isdigit() {
                return new Sk.builtin.bool(/^\d+$/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc:
                "Return True if the string is a digit string, False otherwise.\n\nA string is a digit string if all characters in the string are digits and there\nis at least one character in the string.",
        },
        isnumeric: {
            $meth: function isnumeric() {
                return new Sk.builtin.bool(this.v.length && !/[^0-9]/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc:
                "Return True if the string is a numeric string, False otherwise.\n\nA string is numeric if all characters in the string are numeric and there is at\nleast one character in the string.",
        },
        isalpha: {
            $meth: function isalpha() {
                return new Sk.builtin.bool(this.v.length && !/[^a-zA-Z]/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc:
                "Return True if the string is an alphabetic string, False otherwise.\n\nA string is alphabetic if all characters in the string are alphabetic and there\nis at least one character in the string.",
        },
        isalnum: {
            $meth: function isalnum() {
                return new Sk.builtin.bool(this.v.length && !/[^a-zA-Z0-9]/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc:
                "Return True if the string is an alpha-numeric string, False otherwise.\n\nA string is alpha-numeric if all characters in the string are alpha-numeric and\nthere is at least one character in the string.",
        },
        // isidentifier: {
        //     $meth: methods.isidentifier,
        //     $flags: {},
        //     $textsig: "($self, /)",
        //     $doc:
        //         'Return True if the string is a valid Python identifier, False otherwise.\n\nUse keyword.iskeyword() to test for reserved identifiers such as "def" and\n"class".',
        // },
        // isprintable: {
        //     $meth: methods.isprintable,
        //     $flags: {},
        //     $textsig: "($self, /)",
        //     $doc:
        //         "Return True if the string is printable, False otherwise.\n\nA string is printable if all of its characters are considered printable in\nrepr() or if it is empty.",
        // },
        zfill: {
            $meth: function zfill(len) {
                len = Sk.misceval.asIndexSized(len, Sk.builtin.OverflowError);
                let pad = "";
                // figure out how many zeroes are needed to make the proper length
                const zeroes = len - this.v.length; // techinally this should sq$length ?
                // offset by 1 if there is a +/- at the beginning of the string
                const offset = this.v[0] === "+" || this.v[0] === "-" ? 1 : 0;
                for (let i = 0; i < zeroes; i++) {
                    pad += "0";
                }
                // combine the string and the zeroes
                return new Sk.builtin.str(this.v.substr(0, offset) + pad + this.v.substr(offset));
            },
            $flags: { OneArg: true },
            $textsig: "($self, width, /)",
            $doc: "Pad a numeric string with zeros on the left, to fill a field of the given width.\n\nThe string is never truncated.",
        },
        format: {
            $meth: Sk.formatting.format,
            $flags: { FastCall: true },
            $textsig: null,
            $doc:
                "S.format(*args, **kwargs) -> str\n\nReturn a formatted version of S, using substitutions from args and kwargs.\nThe substitutions are identified by braces ('{' and '}').",
        },
        // format_map: {
        //     $meth: methods.format_map,
        //     $flags: {},
        //     $textsig: null,
        //     $doc:
        //         "S.format_map(mapping) -> str\n\nReturn a formatted version of S, using substitutions from mapping.\nThe substitutions are identified by braces ('{' and '}').",
        // },
        __format__: {
            $meth: Sk.formatting.formatString,
            $flags: { OneArg: true },
            $textsig: "($self, format_spec, /)",
            $doc: "Return a formatted version of the string as described by format_spec.",
        },
        // __sizeof__: {
        //     $meth: methods.__sizeof__,
        //     $flags: {},
        //     $textsig: "($self, /)",
        //     $doc: "Return the size of the string in memory, in bytes.",
        // },
        __getnewargs__: {
            $meth() {
                return new Sk.builtin.tuple(new Sk.builtin.str(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: null,
        },
    },
});

Sk.exportSymbol("Sk.builtin.str", Sk.builtin.str);

var re = /^[A-Za-z0-9]+$/;
function re_escape_(s) {
    let c;
    const ret = [];
    for (let i = 0; i < s.length; i++) {
        c = s.charAt(i);
        if (re.test(c)) {
            ret.push(c);
        } else {
            if (c === "\\000") {
                ret.push("\\000");
            } else {
                ret.push("\\" + c);
            }
        }
    }
    return ret.join("");
}

// methods
var special_chars = /([.*+?=|\\\/()\[\]\{\}^$])/g;
var leading_whitespace = /^[\s\xa0]+/;

function splitPoints(self, sep, maxsplit) {
    sep = Sk.builtin.checkNone(sep) ? null : self.get$tgt(sep);
    if (sep !== null && !sep.length) {
        throw new Sk.builtin.ValueError("empty separator");
    }
    let jsstr = self.v;
    let offset = 0;
    let regex;
    if (sep === null) {
        // Remove leading whitespace
        regex = /[\s\xa0]+/g;
        const len = jsstr.length;
        jsstr = jsstr.replace(leading_whitespace, "");
        offset = len - jsstr.length;
    } else {
        // Escape special characters in null so we can use a regexp
        const s = sep.replace(special_chars, "\\$1");
        regex = new RegExp(s, "g");
    }
    // This is almost identical to re.split,
    // except how the regexp is constructed
    const pairs = [];
    let index = 0;
    let splits = 0;
    let match;
    maxsplit = maxsplit < 0 ? Infinity : maxsplit;
    while ((match = regex.exec(jsstr)) != null && splits < maxsplit) {
        if (match.index === regex.lastIndex) {
            // empty match
            break;
        }
        pairs.push(index + offset);
        pairs.push(match.index + offset);
        index = regex.lastIndex;
        splits += 1;
    }
    if (sep !== null || jsstr.length - index) {
        pairs.push(index + offset);
        pairs.push(jsstr.length + offset);
    }
    return pairs;
}

function mkStrip(pat, regf) {
    return function strip(chars) {
        let pattern;
        if (chars === undefined || Sk.builtin.checkNone(chars)) {
            pattern = pat;
        } else if (chars instanceof Sk.builtin.str) {
            const regex = re_escape_(chars.v);
            pattern = new RegExp(regf(regex), "g");
        } else {
            throw new Sk.builtin.TypeError("strip arg must be None or str");
        }
        return new Sk.builtin.str(this.v.replace(pattern, ""));
    };
}

function mkPartition(isReversed) {
    return function partition(sep) {
        const sepStr = this.get$tgt(sep);
        const jsstr = this.v;
        let pos;
        if (isReversed) {
            pos = jsstr.lastIndexOf(sepStr);
            if (pos < 0) {
                return new Sk.builtin.tuple([new Sk.builtin.str(""), new Sk.builtin.str(""), new Sk.builtin.str(jsstr)]);
            }
        } else {
            pos = jsstr.indexOf(sepStr);
            if (pos < 0) {
                return new Sk.builtin.tuple([new Sk.builtin.str(jsstr), new Sk.builtin.str(""), new Sk.builtin.str("")]);
            }
        }

        return new Sk.builtin.tuple([
            new Sk.builtin.str(jsstr.substring(0, pos)),
            new Sk.builtin.str(sepStr),
            new Sk.builtin.str(jsstr.substring(pos + sepStr.length)),
        ]);
    };
}

function mkJust(isRight, isCenter) {
    return function strJustify(len, fillchar) {
        len = Sk.misceval.asIndexSized(len, Sk.builtin.OverflowError);
        if (fillchar === undefined) {
            fillchar = " ";
        } else if (!(fillchar instanceof Sk.builtin.str) || fillchar.sq$length() !== 1) {
            throw new Sk.builtin.TypeError("the fill character must be a str of length 1");
        } else {
            fillchar = fillchar.v;
        }

        const mylen = this.sq$length();
        let newstr;
        if (mylen >= len) {
            return new Sk.builtin.str(this.v);
        } else if (isCenter) {
            newstr = fillchar.repeat(Math.floor((len - mylen) / 2));
            newstr = newstr + this.v + newstr;

            if ((len - mylen) % 2) {
                newstr += fillchar;
            }

            return new Sk.builtin.str(newstr);
        } else {
            newstr = fillchar.repeat(len - mylen);
            return new Sk.builtin.str(isRight ? newstr + this.v : this.v + newstr);
        }
    };
}

function indices(self, start, end) {
    ({ start, end } = Sk.builtin.slice.startEnd$wrt(self, start, end));
    if (self.$hasAstralCodePoints()) {
        const tmp = self.codepoints[start];
        start = tmp === undefined ? start + self.v.length - self.codepoints.length : tmp;
        end = self.codepoints[end];
        end = end === undefined ? self.v.length : end;
    }
    return {
        start: start,
        end: end,
    };
}

function mkFind(isReversed) {
    return function (tgt, start, end) {
        tgt = this.get$tgt(tgt);

        ({ start, end } = indices(this, start, end));
        if (end < start) {
            return -1;
        }
        // ...do the search..
        end -= tgt.length;
        let jsidx = isReversed ? this.v.lastIndexOf(tgt, end) : this.v.indexOf(tgt, start);
        jsidx = jsidx >= start && jsidx <= end ? jsidx : -1;

        let idx;
        if (this.codepoints) {
            // ...and now convert them back
            const len = this.sq$length();
            idx = -1;
            for (let i = 0; i < len; i++) {
                if (jsidx == this.codepoints[i]) {
                    idx = i;
                }
            }
        } else {
            // No astral codepoints, no conversion required
            idx = jsidx;
        }
        return idx;
    };
}

function mkStartsEndswith(funcname, is_match) {
    return function (tgt, start, end) {
        if (!(tgt instanceof Sk.builtin.str) && !(tgt instanceof Sk.builtin.tuple)) {
            throw new Sk.builtin.TypeError(funcname + " first arg must be str or a tuple of str, not " + Sk.abstr.typeName(tgt));
        }

        ({ start, end } = indices(this, start, end));

        if (start > end) {
            return Sk.builtin.bool.false$;
        }

        const substr = this.v.slice(start, end);

        if (tgt instanceof Sk.builtin.tuple) {
            for (let it = Sk.abstr.iter(tgt), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                if (!(i instanceof Sk.builtin.str)) {
                    throw new Sk.builtin.TypeError("tuple for " + funcname + " must only contain str, not " + Sk.abstr.typeName(i));
                }
                if (is_match(substr, i.v)) {
                    return Sk.builtin.bool.true$;
                }
            }
            return Sk.builtin.bool.false$;
        }
        return new Sk.builtin.bool(is_match(substr, tgt.v));
    };
}

Sk.builtin.str.$py2decode = new Sk.builtin.method_descriptor(Sk.builtin.str, {
    $name: "decode",
    $meth(encoding, errors) {
        const pyBytes = new Sk.builtin.bytes(this.v);
        return Sk.builtin.bytes.$decode.call(pyBytes, encoding, errors);
    },
    $flags: { NamedArgs: ["encoding", "errors"] },
});

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
    const strBytesConstructor = this.sk$builtinBase;
    // distinguish between bytes and str

    if (rhs.constructor !== Sk.builtin.tuple && !(rhs instanceof Sk.builtin.dict || rhs instanceof Sk.builtin.mappingproxy)) {
        rhs = new Sk.builtin.tuple([rhs]);
    }
    // general approach is to use a regex that matches the format above, and
    // do an re.sub with a function as replacement to make the subs.

    //           1 2222222222222222   33333333   444444444   5555555555555  66666  777777777777777777
    regex = /%(\([a-zA-Z0-9]+\))?([#0 +\-]+)?(\*|[0-9]+)?(\.(\*|[0-9]+))?[hlL]?([diouxXeEfFgGcrsb%])/g;
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
                    if (Sk.__future__.python3) {
                        r += prefix;
                        prefix = "";
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
            value = rhs.mp$subscript(new strBytesConstructor(mk));
        } else if (rhs.constructor === Sk.builtin.dict || rhs.constructor === Sk.builtin.list) {
            // new case where only one argument is provided
            value = rhs;
        } else {
            throw new Sk.builtin.AttributeError(rhs.tp$name + " instance has no attribute 'mp$subscript'");
        }
        base = 10;
        if (conversionType === "d" || conversionType === "i") {
            let tmpData = formatNumber(value, base);
            if (tmpData[1] === undefined) {
                throw new Sk.builtin.TypeError("%" + conversionType + " format: a number is required, not " + Sk.abstr.typeName(value));
            }
            let r = tmpData[1];
            tmpData[1] = r.indexOf(".") !== -1 ? parseInt(r, 10).toString() : r;
            return handleWidth(tmpData);
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
        } else if (conversionType === "s" && strBytesConstructor === Sk.builtin.str) {
            r = new Sk.builtin.str(value);
            r = r.$jsstr();
            if (precision) {
                return r.substr(0, precision);
            }
            if (fieldWidth) {
                r = handleWidth([" ", r]);
            }
            return r;
        } else if (conversionType === "b" || conversionType === "s") {
            if (strBytesConstructor === Sk.builtin.str) {
                throw new Sk.builtin.ValueError("unsupported format character 'b'");
            }
            let func;
            if (!(value instanceof Sk.builtin.bytes) && (func = Sk.abstr.lookupSpecial(value, Sk.builtin.str.$bytes)) === undefined) {
                throw new Sk.builtin.TypeError("%b requires a bytes-like object, or an object that implements __bytes__, not '" + Sk.abstr.typeName(value) + "'");
            }
            if (func !== undefined) {
                value = new Sk.builtin.bytes(value);
                // raises the appropriate error message if __bytes__ does not return bytes
            }
            r = value.$jsstr();
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
    ret = this.$jsstr().replace(regex, replFunc);
    return new strBytesConstructor(ret);
};

/**
 * @constructor
 * @param {Object} obj
 */
var str_iter_ = Sk.abstr.buildIteratorClass("str_iterator", {
    constructor: function str_iter_(str) {
        this.$index = 0;
        if (str.$hasAstralCodePoints()) {
            this.$seq = str.codepoints;
            this.tp$iternext = () => {
                const i = this.$seq[this.$index];
                if (i === undefined) {
                    return undefined;
                }
                return new Sk.builtin.str(str.v.substring(i, this.$seq[++this.$index]));
            };
        } else {
            this.$seq = str.v;
            this.tp$iternext = () => {
                const ch = this.$seq[this.$index++];
                if (ch === undefined) {
                    return undefined;
                }
                return new Sk.builtin.str(ch);
            };
        }
    },
    iternext() {
        return this.tp$iternext();
    },
    methods: {
        __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});

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

function fixReserved(name) {
    if (reservedWords_[name] === undefined) {
        return name;
    }
    return name + "_$rw$";
}

Sk.builtin.str.reservedWords_ = reservedWords_;
