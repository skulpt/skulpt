function $builtinmodule(name) {

    const {
        builtin: {
            dict: pyDict,
            str: pyStr,
            list: pyList,
            int_: pyInt,
            type: pyType,
            tuple: pyTuple,
            mappingproxy: pyMappingProxy,
            slice: pySlice,
            none: {none$: pyNone},
            NotImplemented: { NotImplemented$: pyNotImplemented },
            Exception,
            OverflowError,
            IndexError,
            TypeError,
            ValueError,
            checkInt,
            checkString,
            checkCallable,
            hex,
        },
        abstr: { buildNativeClass, typeName, checkOneArg, numberBinOp, copyKeywordToNamedArgs, setUpModuleMethods },
        misceval: { iterator: pyIterator, objectRepr, asIndexSized, isIndex, callsimArray: pyCall },
    } = Sk;



    const re = {
        __name__: new pyStr("re"),
        __all__: new pyList(
            [
                "match",
                "fullmatch",
                "search",
                "sub",
                "subn",
                "split",
                "findall",
                "finditer",
                "compile",
                "purge",
                "template",
                "escape",
                "error",
                "Pattern",
                "Match",
                "A",
                "I",
                "L",
                "M",
                "S",
                "X",
                "U",
                "ASCII",
                "IGNORECASE",
                "LOCALE",
                "MULTILINE",
                "DOTALL",
                "VERBOSE",
                "UNICODE",
            ].map((x) => new pyStr(x))
        ),
    };

    // cached flags
    const _value2member = {};

    const RegexFlagMeta = buildNativeClass("RegexFlagMeta", {
        constructor: function RegexFlagMeta() {},
        base: pyType,
        slots: {
            tp$iter() {
                const members = Object.values(_members)[Symbol.iterator]();
                return new pyIterator(() => members.next().value);
            },
            sq$contains(flag) {
                if (!(flag instanceof this)) {
                    throw new TypeError(
                        "unsupported operand type(s) for 'in': '" + typeName(flag) + "' and '" + typeName(this) + "'"
                    );
                }
                return Object.values(_members).includes(flag);
            },
        },
    });

    re.RegexFlag = buildNativeClass("RegexFlag", {
        meta: RegexFlagMeta,
        base: pyInt,
        constructor: function RegexFlag(value) {
            const member = _value2member[value];
            if (member) {
                return member;
            }
            this.v = value;
            _value2member[value] = this;
        },

        slots: {
            tp$new(args, kwargs) {
                checkOneArg("RegexFlag", args, kwargs);
                const value = args[0].valueOf();
                if (!checkInt(value)) {
                    throw new ValueError(objectRepr(value) + " is not a valid RegexFlag");
                }
                return new re.RegexFlag(value);
            },
            $r() {
                let value = this.valueOf();
                const neg = value < 0;
                value = neg ? ~value : value;
                const members = [];
                Object.entries(_members).forEach(([name, m]) => {
                    // we're not supporting bigints here seems sensible not to
                    const m_value = m.valueOf();
                    if (value & m_value) {
                        value &= ~m_value;
                        members.push("re." + name);
                    }
                });
                if (value) {
                    members.push(hex(value).toString());
                }
                let res = members.join("|");

                if (neg) {
                    res = members.length > 1 ? "~(" + res + ")" : "~" + res;
                }
                return new pyStr(res);
            },
            sq$contains(flag) {
                if (!(flag instanceof re.RegexFlag)) {
                    throw new TypeError("'in' requires a RegexFlag not " + typeName(flag));
                }
                return this.nb$and(flag) === flag;
            },
            nb$and: flagBitSlot((v, w) => v & w, JSBI.bitwiseAnd),
            nb$or: flagBitSlot((v, w) => v | w, JSBI.bitwiseOr),
            nb$xor: flagBitSlot((v, w) => v ^ w, JSBI.bitwiseXor),
            nb$invert: function () {
                const v = this.v;
                if (typeof v === "number") {
                    return new re.RegexFlag(~v);
                }
                return new re.RegexFlag(JSBI.bitwiseNot(v));
            },
        },
        proto: {
            valueOf() {
                return this.v;
            },
        },
        flags: {
            sk$acceptable_as_base_class: false,
        },
    });

    re.TEMPLATE = re.T = new re.RegexFlag(1);
    re.IGNORECASE = re.I = new re.RegexFlag(2);
    re.LOCALE = re.L = new re.RegexFlag(4);
    re.MULTILINE = re.M = new re.RegexFlag(8);
    re.DOTALL = re.S = new re.RegexFlag(16);
    re.UNICODE = re.U = new re.RegexFlag(32);
    re.VERBOSE = re.X = new re.RegexFlag(64);
    re.DEBUG = new re.RegexFlag(128);
    re.ASCII = re.A = new re.RegexFlag(256);

    const _members = {
        ASCII: re.A,
        IGNORECASE: re.I,
        LOCALE: re.L,
        UNICODE: re.U,
        MULTILINE: re.M,
        DOTALL: re.S,
        VERBOSE: re.X,
        TEMPLATE: re.T,
        DEBUG: re.DEBUG,
    };

    function flagBitSlot(number_func, bigint_func) {
        return function (other) {
            if (other instanceof re.RegexFlag || other instanceof pyInt) {
                let v = this.v;
                let w = other.v;
                if (typeof v === "number" && typeof w === "number") {
                    let tmp = number_func(v, w);
                    if (tmp < 0) {
                        tmp = tmp + 4294967296; // convert back to unsigned
                    }
                    return new re.RegexFlag(tmp);
                }
                v = JSBI.BigUp(v);
                w = JSBI.BigUp(w);
                return new re.RegexFlag(JSBI.numberIfSafe(bigint_func(v, w)));
            }
            return pyNotImplemented;
        };
    }

    const jsFlags = {
        i: re.I,
        m: re.M,
        s: re.S,
        u: re.U,
    };
    const jsInlineFlags = {
        i: re.I,
        a: re.A,
        s: re.S,
        L: re.L,
        m: re.M,
        u: re.U,
        x: re.X,
    };

    if (!RegExp.prototype.hasOwnProperty("sticky")) {
        delete jsFlags["s"];
    }
    if (!RegExp.prototype.hasOwnProperty("unicode")) {
        delete jsFlags["u"];
    }

    const flagFails = Object.entries({
        "cannot use LOCALE flag with a str pattern": re.L,
        "ASCII and UNICODE flags are incompatible": new re.RegexFlag(re.A.valueOf() | re.U.valueOf()),
    });

    // These flags can be anywhere in the pattern, (changed in 3.11 so that it has to be at the start)
    const inline_regex = /\(\?([isamux]+)\)/g;

    function adjustFlags(pyPattern, pyFlag) {
        let jsPattern = pyPattern.toString();
        let jsFlag = "g";
        // currently not worrying about bytes;
        // need to check compatibility of auL - also L not valid for str patterns
        let inlineFlags = 0;
        jsPattern = jsPattern.replace(inline_regex, (match, inline) => {
            for (let i of inline) {
                const inlineFlag = jsInlineFlags[i];
                inlineFlags = inlineFlags | inlineFlag.valueOf();
            }
            return "";
        });

        // check if inlineFlags (it throws a different error)
        flagFails.forEach(([msg, flag]) => {
            if ((flag.valueOf() & inlineFlags) === flag.valueOf()) {
                throw new re.error("bad bad inline flags: " + msg);
            }
        });

        pyFlag = numberBinOp(new re.RegexFlag(inlineFlags), pyFlag, "BitOr");

        // check compatibility of flags
        flagFails.forEach(([msg, flag]) => {
            if (numberBinOp(flag, pyFlag, "BitAnd") === flag) {
                throw new ValueError(msg);
            }
        });

        // use unicode?
        if (numberBinOp(re.A, pyFlag, "BitAnd") !== re.A) {
            pyFlag = numberBinOp(re.U, pyFlag, "BitOr");
        }

        Object.entries(jsFlags).forEach(([flag, reFlag]) => {
            if (numberBinOp(reFlag, pyFlag, "BitAnd") === reFlag) {
                jsFlag += flag;
            }
        });
        pyFlag = new re.RegexFlag(pyFlag.valueOf()); // just incase we're an integer

        return [jsPattern, jsFlag, pyFlag];
    }

    let neg_lookbehind_A = "(?<!\\\\n)";
    (function checkLookBehindSupport() {
        try {
            eval("/(?<!foo)/");
        } catch {
            neg_lookbehind_A = "";
        }
    })();

    /*
     * Python docs:
     * To match a literal ']' inside a set, precede it with a backslash, or place it at the beginning of the set.
     * For example, both [()[\]{}] and []()[{}] will match a right bracket, as well as left bracket, braces, and parentheses.
     * 
     * This is not valid in JS so escape this occurrence
     */
    const initialUnescapedBracket = /([^\\])(\[\^?)\](\]|.*[^\\]\])/g;
    // adjustments to {, | \\A | \\Z | $ | (?P=foo) | (?P<name>
    // We also don't want these characters to be inside square brackets
    // (?!(?:\]|[^\[]*[^\\]\])) Negative lookahead checking the next character is not ] (e.g. special case \\Z])
    // And that we don't have an unescaped "]" so long as it's not preceded by a "[".
    const py_to_js_regex = /([^\\])({,|\\A|\\Z|\$|\(\?P=([^\d\W]\w*)\)|\(\?P<([^\d\W]\w*)>)(?!(?:\]|[^\[]*[^\\]\]))/g;
    // unicode mode in js regex treats \\\t incorrectly and should be converted to \\t
    // similarly \" and \' \! \& throw errors
    const py_to_js_unicode_escape = /\\[\t\r\n \v\f#&~"'!:,;`<>]|\\-(?!(?:\]|[^\[]*[^\\]\]))/g;
    const quantifierErrors = /Incomplete quantifier|Lone quantifier/g;

    const _compiled_patterns = Object.create(null);

    function compile_pattern(pyPattern, pyFlag) {
        let jsPattern, jsFlags;
        [jsPattern, jsFlags, pyFlag] = adjustFlags(pyPattern, pyFlag);
        const _cached = _compiled_patterns[pyPattern.toString()];
        if (_cached && _cached.$flags === pyFlag) {
            return _cached;
        }

        const named_groups = {};
        jsPattern = "_" + jsPattern; // prepend so that we can safely not use negative lookbehinds in py_to_js_regex
        jsPattern = jsPattern.replace(initialUnescapedBracket, "$1$2\\]$3");
        jsPattern = jsPattern.replace(py_to_js_regex, (m, p0, p1, p2, p3, offset) => {
            switch (p1) {
                case "\\A":
                    return p0 + neg_lookbehind_A + "^";
                case "\\Z":
                    return p0 + "$(?!\\n)";
                case "{,":
                    return p0 + "{0,";
                case "$":
                    return p0 + "(?:(?=\\n$)|$)";
                default:
                    if (p1.endsWith(">")) {
                        named_groups[p3] = true;
                        return p0 + "(?<" + p3 + ">";
                    }
                    if (!named_groups[p2]) {
                        throw new re.error("unknown group name " + p2 + " at position " + offset + 1, pyPattern, new pyInt(offset + 1));
                    }
                    return p0 + "\\k<" + p2 + ">";
            }
        });
        jsPattern = jsPattern.slice(1);
        let regex;
        let msg;
        let unicodeEscapedPattern = jsPattern;
        if (jsFlags.includes("u")) {
            // then we we need to adjust the escapes for \\\t to be \\t etc because javascript reads escapes differently in unicode mode!
            // '\\-' is different - inside a square bracket it gets compiled but outside it doesn't!
            unicodeEscapedPattern = jsPattern.replace(py_to_js_unicode_escape, (m) => {
                switch (m) {
                    case "\\ ":
                        return " ";
                    case "\\\t":
                        return "\\t";
                    case "\\\n":
                        return "\\n";
                    case "\\\v":
                        return "\\v";
                    case "\\\f":
                        return "\\f";
                    case "\\r":
                        return "\\r";
                    default:
                        return m.slice(1);
                }
            });
        }
        try {
            regex = new RegExp(unicodeEscapedPattern, jsFlags);
        } catch (e) {
            if (quantifierErrors.test(e.message)) {
                try {
                    // try without the unicode flag since unicode mode is stricter
                    regex = new RegExp(jsPattern, jsFlags.replace("u", ""));
                } catch (e) {
                    msg = e.message.substring(e.message.lastIndexOf(":") + 2) + " in pattern: " + pyPattern.toString(); 
                    throw new re.error(msg, pyPattern);
                }
                //// uncomment when debugging
                // Sk.asserts.fail(e.message.substring(e.message.lastIndexOf(":") + 2) + " in pattern: " + jsPattern.toString());
            } else {
                msg = e.message.substring(e.message.lastIndexOf(":") + 2) + " in pattern: " + pyPattern.toString();
                throw new re.error(msg, pyPattern);
            }
        }
        const ret = new re.Pattern(regex, pyPattern, pyFlag);
        _compiled_patterns[pyPattern.toString()] = ret;
        return ret;
    }

    function _compile(pattern, flag) {
        if (pattern instanceof re.Pattern) {
            if (flag !== zero || flag.valueOf()) {
                throw new ValueError("cannot process flags argument with compiled pattern");
            }
            return pattern;
        }
        if (!checkString(pattern)) {
            throw new TypeError("first argument must be string or compiled pattern");
        }
        return compile_pattern(pattern, flag); // compile the pattern to javascript Regex
    }

    re.error = buildNativeClass("re.error", {
        base: Exception,
        constructor: function error(msg, pattern, pos) {
            this.$pattern = pattern;
            this.$msg = msg;
            this.$pos = pos || pyNone;
            Exception.call(this, msg);
        },
        slots: {
            tp$doc:
                "Exception raised for invalid regular expressions.\n\n    Attributes:\n\n        msg: The unformatted error message\n        pattern: The regular expression pattern\n",
            tp$init(args, kwargs) {
                const [msg, pattern, pos] = copyKeywordToNamedArgs("re.error", ["msg", "pattern", "pos"], args, kwargs, [
                    pyNone,
                    pyNone,
                ]);
                this.$pattern = pattern;
                this.$pos = pos;
                this.$msg = msg;
            },
        },
        getsets: {
            msg: {
                $get() {
                    return this.$msg;
                },
            },
            pattern: {
                $get() {
                    return this.$pattern;
                },
            },
            pos: {
                $get() {
                    return this.$pos;
                },
            },
        },
    });

    const zero = new pyInt(0);
    const maxsize = Number.MAX_SAFE_INTEGER;

    re.Pattern = buildNativeClass("re.Pattern", {
        constructor: function (regex, str, flags) {
            this.v = regex;
            this.str = str;
            this.$flags = flags;
            this.$groups = null;
            this.$groupindex = null;
        },
        slots: {
            $r() {
                const patrepr = objectRepr(this.str).slice(0, 200);
                const flagrepr = objectRepr(this.$flags.nb$and(re.U.nb$invert())); // re.U is not included in the repr here
                return new pyStr("re.compile(" + patrepr + (flagrepr ? ", " + flagrepr : "") + ")");
            },
            tp$richcompare(other, op) {
                if ((op !== "Eq" && op !== "NotEq") || !(other instanceof re.Pattern)) {
                    return pyNotImplemented;
                }
                const res = this.str === other.str && this.$flags === other.$flags;
                return op === "Eq" ? res : !res;
            },
            tp$hash() {},
            tp$doc: "Compiled regular expression object.",
        },
        methods: {
            match: {
                $meth: function match(string, pos, endpos) {
                    return this.$match(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc: "Matches zero or more characters at the beginning of the string.",
            },
            fullmatch: {
                $meth: function fullmatch(string, pos, endpos) {
                    return this.full$match(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc: "Matches against all of the string.",
            },
            search: {
                $meth: function search(string, pos, endpos) {
                    return this.$search(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc:
                    "Scan through string looking for a match, and return a corresponding match object instance.\n\nReturn None if no position in the string matches.",
            },
            sub: {
                $meth: function sub(repl, string, count) {
                    return this.$sub(repl, string, count);
                },
                $flags: { NamedArgs: ["repl", "string", "count"], Defaults: [zero] },
                $textsig: "($self, /, repl, string, count=0)",
                $doc:
                    "Return the string obtained by replacing the leftmost non-overlapping occurrences of pattern in string by the replacement repl.",
            },
            subn: {
                $meth: function (repl, string, count) {
                    return this.$subn(repl, string, count);
                },
                $flags: { NamedArgs: ["repl", "string", "count"], Defaults: [zero] },
                $textsig: "($self, /, repl, string, count=0)",
                $doc:
                    "Return the tuple (new_string, number_of_subs_made) found by replacing the leftmost non-overlapping occurrences of pattern with the replacement repl.",
            },
            findall: {
                $meth: function findall(string, pos, endpos) {
                    return this.find$all(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc: "Return a list of all non-overlapping matches of pattern in string.",
            },
            split: {
                $meth: function split(string, maxsplit) {
                    return this.$split(string, maxsplit);
                },
                $flags: { NamedArgs: ["string", "maxsplit"], Defaults: [zero] },
                $textsig: "($self, /, string, maxsplit=0)",
                $doc: "Split string by the occurrences of pattern.",
            },
            finditer: {
                $meth: function finditer(string, pos, endpos) {
                    return this.find$iter(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc:
                    "Return an iterator over all non-overlapping matches for the RE pattern in string.\n\nFor each match, the iterator returns a match object.",
            },
            scanner: {
                $meth: function scanner(string, pos, endpos) {
                    return this.$scanner(string, pos, endpos);
                },
                $flags: { NamedArgs: ["string", "pos", "endpos"], Defaults: [zero, maxsize] },
                $textsig: "($self, /, string, pos=0, endpos=sys.maxsize)",
                $doc: null,
            },
            __copy__: {
                $meth: function copy() {
                    return this;
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: null,
            },
            __deepcopy__: {
                $meth: function () {
                    return this;
                },
                $flags: { OneArg: true },
                $textsig: "($self, memo, /)",
                $doc: null,
            },
        },
        getsets: {
            pattern: {
                $get() {
                    return this.str;
                },
                $doc: "The pattern string from which the RE object was compiled.",
            },
            flags: {
                $get() {
                    return this.$flags;
                },
                $doc: "The regex matching flags.",
            },
            groups: {
                $get() {
                    if (this.$groups === null) {
                        // we know we have a compiled expression so we just need to check matching brackets
                        // bracket characters that are not inside [] not followed by ? but could be followed by ?P<
                        const num_matches = (this.str.v.match(this.group$regex) || []).length;
                        this.$groups = new pyInt(num_matches);
                    }
                    return this.$groups;
                },
                $doc: "The number of capturing groups in the pattern.",
            },
            groupindex: {
                $get() {
                    if (this.$groupindex === null) {
                        const matches = this.str.v.matchAll(this.group$regex);
                        const arr = [];
                        let i = 1;
                        for (const match of matches) {
                            if (match[1]) {
                                arr.push(new pyStr(match[1]));
                                arr.push(new pyInt(i));
                            }
                            i++;
                        }
                        this.$groupindex = new pyMappingProxy(new pyDict(arr));
                    }
                    return this.$groupindex;
                },
                $doc: "A dictionary mapping group names to group numbers.",
            },
        },
        proto: {
            // Any opening bracket not inside [] Not followed by ? but might could be followed by ?P<foo>
            // if it's a group like (?P<foo>) then we need to capture the foo
            group$regex: /\((?!\?(?!P<).*)(?:\?P<([^\d\W]\w*)>)?(?![^\[]*\])/g,
            get$count(count) {
                count = asIndexSized(count, OverflowError);
                return count ? count : Number.POSITIVE_INFINITY;
            },
            get$jsstr(string, pos, endpos) {
                if (!checkString(string)) {
                    throw new TypeError("expected string or bytes-like object");
                }
                if ((pos === zero && endpos === maxsize) || (pos === undefined && endpos === undefined)) {
                    return { jsstr: string.toString(), pos: zero.valueOf(), endpos: string.sq$length() };
                }
                const { start, end } = pySlice.startEnd$wrt(string, pos, endpos);
                return { jsstr: string.toString().slice(start, end), pos: start, endpos: end };
            },
            find$all(string, pos, endpos) {
                let { jsstr } = this.get$jsstr(string, pos, endpos);
                const regex = this.v;
                const matches = jsstr.matchAll(regex);
                const ret = [];
                for (let match of matches) {
                    // do we have groups?
                    ret.push(
                        match.length === 1
                            ? new pyStr(match[0])
                            : match.length === 2
                                ? new pyStr(match[1])
                                : new pyTuple(match.slice(1).map((x) => new pyStr(x)))
                    );
                }
                return new pyList(ret);
            },
            $split(string, maxsplit) {
                maxsplit = asIndexSized(maxsplit);
                maxsplit = maxsplit ? maxsplit : Number.POSITIVE_INFINITY;
                let { jsstr } = this.get$jsstr(string);
                const regex = this.v;
                const split = [];
                let match;
                let num_splits = 0;
                let idx = 0;
                while ((match = regex.exec(jsstr)) !== null && num_splits < maxsplit) {
                    split.push(new pyStr(jsstr.substring(idx, match.index)));
                    if (match.length > 1) {
                        split.push(...match.slice(1).map((x) => (x === undefined ? pyNone : new pyStr(x))));
                    }
                    num_splits++;
                    idx = regex.lastIndex;
                    if (match.index === regex.lastIndex) {
                        if (jsstr) {
                            jsstr = jsstr.slice(match.index);
                            // need to reset the regex.lastIndex;
                            idx = 0;
                            regex.lastIndex = 1;
                        } else {
                            break; // check this;
                        }
                    }
                }
                regex.lastIndex = 0;
                split.push(new pyStr(jsstr.slice(idx)));
                return new pyList(split);
            },
            match$from_repl(args, string, pos, endpos) {
                let match_like;
                const named_groups = args[args.length - 1];
                if (typeof named_groups === "object") {
                    match_like = args.slice(0, args.length - 3);
                    Object.assign(match_like, { groups: named_groups });
                    match_like.index = args[args.length - 3];
                } else {
                    match_like = args.slice(0, args.length - 2);
                    match_like.groups = undefined;
                    match_like.index = args[args.length - 2];
                }
                return new re.Match(match_like, this.str, string, pos, endpos);
            },
            do$sub(repl, string, count) {
                const { jsstr, pos, endpos } = this.get$jsstr(string);
                let matchRepl;
                if (checkCallable(repl)) {
                    matchRepl = (matchObj) => {
                        const rep = pyCall(repl, [matchObj]);
                        if (!checkString(rep)) {
                            throw new TypeError("expected str instance, " + typeName(rep) + " found");
                        }
                        return rep.toString();
                    };
                } else {
                    repl = this.get$jsstr(repl).jsstr;
                    matchRepl = (matchObj) => matchObj.template$repl(repl);
                }
                count = this.get$count(count);
                let num_repl = 0;
                const ret = jsstr.replace(this.v, (...args) => {
                    if (num_repl >= count) {
                        return args[0];
                    }
                    num_repl++;
                    const matchObj = this.match$from_repl(args, string, pos, endpos);
                    return matchRepl(matchObj);
                });
                return [new pyStr(ret), new pyInt(num_repl)];
            },
            $sub(repl, string, count) {
                const [ret] = this.do$sub(repl, string, count);
                return ret;
            },
            $subn(repl, string, count) {
                return new pyTuple(this.do$sub(repl, string, count));
            },
            do$match(regex, string, pos, endpos) {
                let jsstr;
                ({ jsstr, pos, endpos } = this.get$jsstr(string, pos, endpos));
                const match = jsstr.match(regex);
                if (match === null) {
                    return pyNone;
                }
                return new re.Match(match, this, string, pos, endpos);
            },
            $search(string, pos, endpos) {
                var regex = new RegExp(this.v.source, this.v.flags.replace("g", "")); // keep all flags except 'g';
                return this.do$match(regex, string, pos, endpos);
            },
            $match(string, pos, endpos) {
                let source = this.v.source;
                let flags = this.v.flags.replace("g", "").replace("m", "");
                source = "^" + source;
                var regex = new RegExp(source, flags);
                return this.do$match(regex, string, pos, endpos);
            },
            full$match(string, pos, endpos) {
                let source = this.v.source;
                let flags = this.v.flags.replace("g", "").replace("m", "");
                source = "^(?:" + source + ")$";
                var regex = new RegExp(source, flags);
                return this.do$match(regex, string, pos, endpos);
            },
            find$iter(string, pos, endpos) {
                let jsstr;
                ({ jsstr, pos, endpos } = this.get$jsstr(string, pos, endpos));
                const matchIter = jsstr.matchAll(this.v);
                return new pyIterator(() => {
                    const match = matchIter.next().value;
                    if (match === undefined) {
                        return undefined;
                    }
                    return new re.Match(match, this, string, pos, endpos);
                });
                // could adjust this to use exec.
            },
        },
        flags: {
            sk$acceptable_as_base_class: false,
        },
    });

    re.Match = buildNativeClass("re.Match", {
        constructor: function (match, re, str, pos, endpos) {
            this.v = match; // javascript match object;
            this.$match = new pyStr(this.v[0]);
            this.str = str;
            this.$re = re;
            this.$pos = pos;
            this.$endpos = endpos;
            // only calculate these if requested
            this.$groupdict = null;
            this.$groups = null;
            this.$lastindex = null;
            this.$lastgroup = null;
            this.$regs = null;
        },
        slots: {
            tp$doc: "The result of re.match() and re.search().\nMatch objects always have a boolean value of True.",
            $r() {
                //e.g. <re.Match object; span=(4, 21), match='see chapter 1.4.5'>
                let ret = "<re.Match object; ";
                ret += "span=(" + this.v.index + ", " + (this.v.index + this.$match.sq$length()) + "), ";
                ret += "match=" + objectRepr(this.$match) + ">";
                return new pyStr(ret);
            },
            tp$as_squence_or_mapping: true,
            mp$subscript(item) {
                const ret = this.get$group(item);
                return ret === undefined ? pyNone : new pyStr(ret);
            },
        },
        methods: {
            group: {
                $meth: function group(...gs) {
                    let ret;
                    if (gs.length <= 1) {
                        ret = this.get$group(gs[0]);
                        return ret === undefined ? pyNone : new pyStr(ret);
                    }
                    ret = [];
                    gs.forEach((g) => {
                        g = this.get$group(g);
                        ret.push(g === undefined ? pyNone : new pyStr(g));
                    });
                    return new pyTuple(ret);
                },
                $flags: { MinArgs: 0 },
                $textsig: null,
                $doc:
                    "group([group1, ...]) -> str or tuple.\n    Return subgroup(s) of the match by indices or names.\n    For 0 returns the entire match.",
            },
            start: {
                $meth: function start(g) {
                    const group = this.get$group(g);
                    if (group === undefined) {
                        return new pyInt(-1);
                    }
                    return new pyInt(this.str.v.indexOf(group, this.v.index + this.$pos));
                },
                $flags: { MinArgs: 0, MaxArgs: 1 },
                $textsig: "($self, group=0, /)",
                $doc: "Return index of the start of the substring matched by group.",
            },
            end: {
                $meth: function end(g) {
                    const group = this.get$group(g);
                    if (group === undefined) {
                        return new pyInt(-1);
                    }
                    return new pyInt(this.str.v.indexOf(group, this.v.index + this.$pos) + [...group].length);
                },
                $flags: { MinArgs: 0, MaxArgs: 1 },
                $textsig: "($self, group=0, /)",
                $doc: "Return index of the end of the substring matched by group.",
            },
            span: {
                $meth: function span(g) {
                    return this.$span(g);
                },
                $flags: { MinArgs: 0, MaxArgs: 1 },
                $textsig: "($self, group=0, /)",
                $doc: "For match object m, return the 2-tuple (m.start(group), m.end(group)).",
            },
            groups: {
                $meth: function groups(d) {
                    if (this.$groups !== null) {
                        return this.$groups;
                    }
                    this.$groups = Array.from(this.v.slice(1), (x) => (x === undefined ? d : new pyStr(x)));
                    this.$groups = new pyTuple(this.$groups);
                    return this.$groups;
                },
                $flags: { NamedArgs: ["default"], Defaults: [pyNone] },
                $textsig: "($self, /, default=None)",
                $doc:
                    "Return a tuple containing all the subgroups of the match, from 1.\n\n  default\n    Is used for groups that did not participate in the match.",
            },
            groupdict: {
                $meth: function groupdict(d) {
                    if (this.$groupdict !== null) {
                        return this.$groupdict;
                    }
                    if (this.v.groups === undefined) {
                        this.$groupdict = new pyDict();
                    } else {
                        const arr = [];
                        Object.entries(this.v.groups).forEach(([name, val]) => {
                            arr.push(new pyStr(name));
                            arr.push(val === undefined ? d : new pyStr(val));
                        });
                        this.$groupdict = new pyDict(arr);
                    }
                    return this.$groupdict;
                },
                $flags: { NamedArgs: ["default"], Defaults: [pyNone] },
                $textsig: "($self, /, default=None)",
                $doc:
                    "Return a dictionary containing all the named subgroups of the match, keyed by the subgroup name.\n\n  default\n    Is used for groups that did not participate in the match.",
            },
            expand: {
                $meth: function expand(template) {
                    if (!checkString(template)) {
                        throw new TypeError("expected str instance got " + typeName(template));
                    }
                    template = template.toString();
                    template = this.template$repl(template);
                    return new pyStr(template);
                },
                $flags: { OneArg: true },
                $textsig: "($self, /, template)",
                $doc: "Return the string obtained by doing backslash substitution on the string template, as done by the sub() method.",
            },
            __copy__: {
                $meth: function __copy__() {
                    return this;
                },
                $flags: { NoArgs: true },
                $textsig: "($self, /)",
                $doc: null,
            },
            __deepcopy__: {
                $meth: function __deepcopy__() {
                    return this;
                },
                $flags: { OneArg: true },
                $textsig: "($self, memo, /)",
                $doc: null,
            },
        },
        getsets: {
            lastindex: {
                $get() {
                    if (this.$lastindex !== null) {
                        return this.$lastindex;
                    }
                    let li = 0;
                    let lval;
                    this.v.forEach((val, i) => {
                        if (i && val !== undefined && lval !== val) {
                            li = i;
                            lval = val;
                        }
                    });
                    this.$lastindex = li ? new pyInt(li) : pyNone;
                    return this.$lastindex;
                },
                $doc: "The integer index of the last matched capturing group.",
            },
            lastgroup: {
                $get() {
                    if (this.$lastgroup !== null) {
                        return this.$lastgroup;
                    }
                    if (this.v.groups === undefined) {
                        this.$lastgroup = pyNone;
                    } else {
                        let lg;
                        Object.entries(this.v.groups).forEach(([name, val]) => {
                            if (val !== undefined) {
                                lg = name;
                            }
                        });
                        this.$lastgroup = lg === undefined ? pyNone : new pyStr(lg);
                    }
                    return this.$lastgroup;
                },
                $doc: "The name of the last matched capturing group.",
            },
            regs: {
                $get() {
                    if (this.$regs !== null) {
                        return this.$regs;
                    }
                    const arr = [];
                    this.v.forEach((x, i) => {
                        arr.push(this.$span(i));
                    });
                    this.$regs = new pyTuple(arr);
                    return this.$regs;
                },
            },
            string: {
                $get() {
                    return this.str;
                },
                $doc: "The string passed to match() or search().",
            },
            re: {
                $get() {
                    return this.$re;
                },
                $doc: "The regular expression object.",
            },
            pos: {
                $get() {
                    return new pyInt(this.$pos);
                },
                $doc: "The index into the string at which the RE engine started looking for a match.",
            },
            endpos: {
                $get() {
                    return new pyInt(this.$endpos);
                },
                $doc: "The index into the string beyond which the RE engine will not go.",
            },
        },
        proto: {
            get$group(g) {
                if (g === undefined) {
                    return this.v[0];
                } else if (checkString(g)) {
                    g = g.toString();
                    if (this.v.groups && Object.prototype.hasOwnProperty.call(this.v.groups, g)) {
                        return this.v.groups[g];
                    }
                } else if (isIndex(g)) {
                    g = asIndexSized(g);
                    if (g >= 0 && g < this.v.length) {
                        return this.v[g];
                    }
                }
                throw new IndexError("no such group");
            },
            $span(g) {
                const group = this.get$group(g);
                if (group === undefined) {
                    return new pyTuple([new pyInt(-1), new pyInt(-1)]);
                }
                let idx;
                if (group === "" && this.v[0] === "") {
                    idx = new pyInt(this.v.index);
                    return new pyTuple([idx, idx]);
                }
                idx = this.str.v.indexOf(group, this.v.index + this.$pos);
                return new pyTuple([new pyInt(idx), new pyInt(idx + [...group].length)]); // want char length
            },
            hasOwnProperty: Object.prototype.hasOwnProperty,
            template$regex: /\\([1-9][0-9]|[1-9])|\\g<([1-9][0-9]*)>|\\g<([^\d\W]\w*)>|\\g<?.*>?/g,
            template$repl(template) {
                return template.replace(this.template$regex, (match, idx, idxg, name, offset, orig) => {
                    let ret;
                    idx = idx || idxg;
                    if (idx !== undefined) {
                        ret = idx < this.v.length ? this.v[idx] || "" : undefined;
                    } else {
                        if (this.v.groups && this.hasOwnProperty.call(this.v.groups, name)) {
                            ret = this.v.groups[name] || "";
                        }
                    }
                    if (ret === undefined) {
                        if (name) {
                            throw new IndexError("unknown group name '" + name + "'");
                        }
                        throw new re.error("invalid group reference " + (idx || match.slice(2)) + " at position " + (offset + 1));
                    }
                    return ret;
                });
            },
        },
        flags: {
            sk$acceptable_as_base_class: false,
        },
    });

    setUpModuleMethods("re", re, {
        match: {
            $meth: function match(pattern, string, flags) {
                return _compile(pattern, flags).$match(string);
            },
            $flags: { NamedArgs: ["pattern", "string", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, string, flags=0)",
            $doc: "Try to apply the pattern at the start of the string, returning\n    a Match object, or None if no match was found.",
        },
        fullmatch: {
            $meth: function fullmatch(pattern, string, flags) {
                return _compile(pattern, flags).full$match(string);
            },
            $flags: { NamedArgs: ["pattern", "string", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, string, flags=0)",
            $doc: "Try to apply the pattern to all of the string, returning\n    a Match object, or None if no match was found.",
        },
        search: {
            $meth: function search(pattern, string, flags) {
                return _compile(pattern, flags).$search(string);
            },
            $flags: { NamedArgs: ["pattern", "string", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, string, flags=0)",
            $doc: "Scan through string looking for a match to the pattern, returning\n    a Match object, or None if no match was found.",
        },
        sub: {
            $meth: function sub(pattern, repl, string, count, flags) {
                return _compile(pattern, flags).$sub(repl, string, count);
            },
            $flags: { NamedArgs: ["pattern", "repl", "string", "count", "flags"], Defaults: [zero, zero] },
            $textsig: "($module, / , pattern, string, count=0, flags=0)",
            $doc:
                "Return the string obtained by replacing the leftmost\n    non-overlapping occurrences of the pattern in string by the\n    replacement repl.  repl can be either a string or a callable;\n    if a string, backslash escapes in it are processed.  If it is\n    a callable, it's passed the Match object and must return\n    a replacement string to be used.",
        },
        subn: {
            $meth: function subn(pattern, repl, string, count, flags) {
                return _compile(pattern, flags).$subn(repl, string, count);
            },
            $flags: { NamedArgs: ["pattern", "repl", "string", "count", "flags"], Defaults: [zero, zero] },
            $textsig: "($module, / , pattern, string, count=0, flags=0)",
            $doc:
                "Return a 2-tuple containing (new_string, number).\n    new_string is the string obtained by replacing the leftmost\n    non-overlapping occurrences of the pattern in the source\n    string by the replacement repl.  number is the number of\n    substitutions that were made. repl can be either a string or a\n    callable; if a string, backslash escapes in it are processed.\n    If it is a callable, it's passed the Match object and must\n    return a replacement string to be used.",
        },
        split: {
            $meth: function split(pattern, string, maxsplit, flags) {
                return _compile(pattern, flags).$split(string, maxsplit);
            },
            $flags: { NamedArgs: ["pattern", "string", "maxsplit", "flags"], Defaults: [zero, zero] },
            $textsig: "($module, / , pattern, string, maxsplit=0, flags=0)",
            $doc:
                "Split the source string by the occurrences of the pattern,\n    returning a list containing the resulting substrings.  If\n    capturing parentheses are used in pattern, then the text of all\n    groups in the pattern are also returned as part of the resulting\n    list.  If maxsplit is nonzero, at most maxsplit splits occur,\n    and the remainder of the string is returned as the final element\n    of the list.",
        },
        findall: {
            $meth: function findall(pattern, string, flags) {
                return _compile(pattern, flags).find$all(string);
            },
            $flags: { NamedArgs: ["pattern", "string", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, string, flags=0)",
            $doc:
                "Return a list of all non-overlapping matches in the string.\n\n    If one or more capturing groups are present in the pattern, return\n    a list of groups; this will be a list of tuples if the pattern\n    has more than one group.\n\n    Empty matches are included in the result.",
        },
        finditer: {
            $meth: function finditer(pattern, string, flags) {
                return _compile(pattern, flags).find$iter(string);
            },
            $flags: { NamedArgs: ["pattern", "string", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, string, flags=0)",
            $doc:
                "Return an iterator over all non-overlapping matches in the\n    string.  For each match, the iterator returns a Match object.\n\n    Empty matches are included in the result.",
        },
        compile: {
            $meth: function compile(pattern, flags) {
                return _compile(pattern, flags);
            },
            $flags: { NamedArgs: ["pattern", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, flags=0)",
            $doc: "Compile a regular expression pattern, returning a Pattern object.",
        },
        purge: {
            $meth: function purge() {
                Object.keys(_compiled_patterns).forEach((key) => {
                    delete _compiled_patterns[key];
                });
                return pyNone;
            },
            $flags: { NoArgs: true },
            $textsig: "($module, / )",
            $doc: "Clear the regular expression caches",
        },
        template: {
            $meth: function template(pattern, flags) {
                return _compile(pattern, numberBinOp(re.T, flags, "BitOr"));
            },
            $flags: { NamedArgs: ["pattern", "flags"], Defaults: [zero] },
            $textsig: "($module, / , pattern, flags=0)",
            $doc: "Compile a template pattern, returning a Pattern object",
        },
        escape: {
            $meth: function (pattern) {
                if (!checkString(pattern)) {
                    throw new TypeError("expected a str instances, got " + typeName(pattern));
                }
                pattern = pattern.toString();
                pattern = pattern.replace(escape_chrs, "\\$&");
                return new pyStr(pattern);
            },
            $flags: { NamedArgs: ["pattern"], Defaults: [] },
            $textsig: "($module, / , pattern)",
            $doc: "\n    Escape special characters in a string.\n    ",
        },
    });
    const escape_chrs = /[\&\~\#.*+\-?^${}()|[\]\\\t\r\v\f\n ]/g;

    return re;
}
