/**
 * only in str not in bytes
 * {'__format__',
 * 'casefold',
 * 'encode',
 * 'format',
 * 'format_map',
 * 'isdecimal',
 * 'isidentifier',
 * 'isnumeric',
 * 'isprintable'}
 */

/**not in str {'decode', 'fromhex', 'hex'} only in bytes */

/**
 *
 * @param {Sk.builtin.str | Sk.builtin.bytes} constructor
 */
Sk.builtin.str_methods = function (constructor) {
    const docs = getDocs(constructor);
    let checkType, englishName, englishSingular, getTgt, typeName;
    if (constructor === Sk.builtin.str) {
        checkType = Sk.builtin.checkString;
        getTgt = (x) => {
            if (!Sk.builtin.checkString(x)) {
                throw new Sk.builtin.TypeError("must be str, not " + Sk.abstr.typeName(x));
            }
            return x.v;
        };
        englishName = "string";
        englishSingular = "char";
        typeName = "str";
    } else {
        checkType = Sk.builtin.checkBytes;
        englishName = "bytes";
        englishSingular = "byte";
        getTgt = (x) => {
            if (x instanceof Sk.builtin.bytes) {
                return x.v;
            }
            x = Sk.misceval.asIndexOrThrow(x, "argument should be integer or bytes-like object, not " + Sk.abstr.typeName(x));
            return String.fromCharCode(x);
        };
        typeName = "byetes";
    }

    const methods = {
        replace: {
            $meth: function (oldS, newS, count) {
                Sk.builtin.pyCheckType("old", englishName, checkType(oldS));
                Sk.builtin.pyCheckType("new", englishName, checkType(newS));
                if (count !== undefined && !Sk.builtin.checkInt(count)) {
                    throw new Sk.builtin.TypeError("integer argument expected, got " + Sk.abstr.typeName(count));
                }
                count = Sk.builtin.asnum$(count);
                const patt = new RegExp(re_escape(oldS.v), "g");

                if (count === undefined || count < 0) {
                    return new constructor(this.v.replace(patt, newS.v));
                }

                let c = 0;
                return new constructor(
                    this.v.replace(patt, function replacer(match) {
                        c++;
                        if (c <= count) {
                            return newS.v;
                        }
                        return match;
                    })
                );
            },
            $flags: { MinArgs: 2, MaxArgs: 3 },
            $textsig: "($self, old, new, count=-1, /)",
            $doc: docs.replace,
        },
        split: {
            $meth: function (args, kwargs) {
                let on, howmany;
                [on, howmany] = Sk.abstr.copyKeywordsToNamedArgs("split", ["sep", "maxsplit"], args, kwargs, [
                    Sk.builtin.none.none$,
                    new Sk.builtin.int_(-1),
                ]);
                if (Sk.builtin.checkNone(on)) {
                    on = null;
                } else {
                    Sk.builtin.pyCheckType("", englishName, checkType(on));
                    if (on.v === "") {
                        throw new Sk.builtin.ValueError("empty separator");
                    }
                }
                Sk.builtin.pyCheckType("", "integer", Sk.builtin.checkInt(howmany));
                howmany = Sk.builtin.asnum$(howmany);
                howmany = howmany === -1 ? null : howmany;
                let regex = /[\s\xa0]+/g;
                let str = this.v;
                if (on === null) {
                    // Remove leading whitespace
                    str = str.replace(/^[\s\xa0]+/, "");
                } else {
                    // Escape special characters in null so we can use a regexp
                    const s = on.v.replace(/([.*+?=|\\\/()\[\]\{\}^$])/g, "\\$1");
                    regex = new RegExp(s, "g");
                }

                // This is almost identical to re.split,
                // except how the regexp is constructed
                const result = [];
                let index = 0;
                let splits = 0;
                let match;
                while ((match = regex.exec(str)) != null) {
                    if (match.index === regex.lastIndex) {
                        // empty match
                        break;
                    }
                    result.push(new constructor(str.substring(index, match.index)));
                    index = regex.lastIndex;
                    splits += 1;
                    if (howmany && splits >= howmany) {
                        break;
                    }
                }
                str = str.substring(index);
                if (on !== null || str.length > 0) {
                    result.push(new constructor(str));
                }

                return new Sk.builtin.list(result);
            },
            $flags: { FastCall: true },
            $textsig: "($self, /, sep=None, maxsplit=-1)",
            $doc: docs.split,
        },
        // rsplit: {
        //     $meth: Sk.builtin.str.methods.rsplit,
        //     $flags:{},
        //     $textsig: "($self, /, sep=None, maxsplit=-1)",
        //     $doc: "Return a list of the words in the string, using sep as the delimiter string.\n\n  sep\n    The delimiter according which to split the string.\n    None (the default value) means split according to any whitespace,\n    and discard empty strings from the result.\n  maxsplit\n    Maximum number of splits to do.\n    -1 (the default value) means no limit.\n\nSplits are done starting at the end of the string and working to the front." },
        join: {
            $meth: function (seq) {
                const arrOfStrs = [];
                for (let it = Sk.abstr.iter(seq), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    if (i.constructor !== constructor) {
                        throw new Sk.builtin.TypeError(
                            "TypeError: sequence item " + arrOfStrs.length + ": expected " + englishName + ", " + Sk.abstr.typeName(i) + " found"
                        );
                    }
                    arrOfStrs.push(i.v);
                }
                return new constructor(arrOfStrs.join(this.v));
            },
            $flags: { OneArg: true },
            $textsig: "($self, iterable, /)",
            $doc: docs.join,
        },
        capitalize: {
            $meth: function () {
                const orig = this.v;
                if (orig.length === 0) {
                    return new constructor("");
                }
                let cap = orig.charAt(0).toUpperCase();
                for (let i = 1; i < orig.length; i++) {
                    cap += orig.charAt(i).toLowerCase();
                }
                return new constructor(cap);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.capitalize,
        },
        title: {
            $meth: function () {
                const ret = this.v.replace(/[a-z][a-z]*/gi, function (str) {
                    return str[0].toUpperCase() + str.substr(1).toLowerCase();
                });
                return new constructor(ret);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.title,
        },
        center: { $meth: mkJust(false, true), $flags: { MinArgs: 1, MaxArgs: 2 }, $textsig: "($self, width, fillchar=' ', /)", $doc: docs.center },
        count: {
            $meth: function (pat, start, end) {
                pat = getTgt(pat);
                let len = this.sq$length();
                [start, end] = getStartEndAsJs(start, end, len);
                if (start > len) {
                    return new Sk.builtin.int_(0);
                }
                if (end < start) {
                    return new Sk.builtin.int_(0);
                }

                const normaltext = pat.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                const m = new RegExp(normaltext, "g");
                const slice = this.v.slice(this.codepoints ? this.codepoints[start] : start, this.codepoints ? this.codepoints[end] : end);
                const ctl = slice.match(m);
                if (!ctl) {
                    return new Sk.builtin.int_(0);
                } else {
                    return new Sk.builtin.int_(ctl.length);
                }
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc: docs.count,
        },
        expandtabs: {
            $meth: function (args, kwargs) {
                let [tabsize] = Sk.abstr.copyKeywordsToNamedArgs("expandtabs", ["tabsize"], args, kwargs, [new Sk.builtin.int_(8)]);
                Sk.builtin.pyCheckType("", "integer", Sk.builtin.checkInt(tabsize));
                tabsize = Sk.builtin.asnum$(tabsize);
                const spaces = new Array(tabsize + 1).join(" ");
                const expanded = this.v.replace(/([^\r\n\t]*)\t/g, function (a, b) {
                    return b + spaces.slice(b.length % tabsize);
                });
                return new constructor(expanded);
            },
            $flags: { FastCall: true },
            $textsig: "($self, /, tabsize=8)",
            $doc: docs.expandtabs,
        },
        find: { $meth: mkFind(false), $flags: { MinArgs: 1, MaxArgs: 3 }, $textsig: null, $doc: docs.find },
        partition: {
            $meth: function (sep) {
                Sk.builtin.pyCheckType("sep", englishName, checkType(sep));
                const pos = this.v.indexOf(sep.v);
                if (pos < 0) {
                    return new Sk.builtin.tuple([this, constructor.$empty, constructor.$empty]);
                }
                return new Sk.builtin.tuple([new constructor(this.v.substring(0, pos)), sep, new constructor(this.v.substring(pos + sep.v.length))]);
            },
            $flags: { OneArg: true },
            $textsig: "($self, sep, /)",
            $doc: docs.partition,
        },
        index: {
            $meth: function (tgt, start, end) {
                const idx = methods.find.$meth.call(this, tgt, start, end);
                if (Sk.builtin.asnum$(idx) === -1) {
                    throw new Sk.builtin.ValueError("substring not found");
                }
                return idx;
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc: docs.index,
        },
        ljust: { $meth: mkJust(false, false), $flags: { MinArgs: 1, MaxArgs: 2 }, $textsig: "($self, width, fillchar=' ', /)", $doc: docs.ljust },
        lower: {
            $meth: function () {
                return new constructor(this.v.toLowerCase());
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.lower,
        },
        lstrip: {
            $meth: function (chars) {
                if (chars !== undefined && !Sk.builtin.checkNone(chars) && !checkType(chars)) {
                    throw new Sk.builtin.TypeError("rstrip arg must be None or " + englishName);
                }
                let pattern;
                if (chars === undefined || Sk.builtin.checkNone(chars)) {
                    pattern = /^\s+/g;
                } else {
                    const regex = re_escape(chars.v);
                    pattern = new RegExp("^[" + regex + "]+", "g");
                }
                return new constructor(this.v.replace(pattern, ""));
            },
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: "($self, chars=None, /)",
            $doc: docs.lstrip,
        },
        rfind: { $meth: mkFind(true), $flags: { MinArgs: 1, MaxArgs: 3 }, $textsig: null, $doc: docs.rfind },
        rindex: {
            $meth: function (tgt, start, end) {
                const idx = methods.rfind.$meth.call(this, tgt, start, end);
                if (Sk.builtin.asnum$(idx) === -1) {
                    throw new Sk.builtin.ValueError("substring not found");
                }
                return idx;
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc: docs.rindex,
        },
        rjust: { $meth: mkJust(true, false), $flags: { MinArgs: 1, MaxArgs: 2 }, $textsig: "($self, width, fillchar=' ', /)", $doc: docs.rjust },
        rstrip: {
            $meth: function (chars) {
                if (chars !== undefined && !Sk.builtin.checkNone(chars) && !checkType(chars)) {
                    throw new Sk.builtin.TypeError("rstrip arg must be None or " + englishName);
                }
                let pattern;
                if (chars === undefined || Sk.builtin.checkNone(chars)) {
                    pattern = /\s+$/g;
                } else {
                    const regex = re_escape(chars.v);
                    pattern = new RegExp("[" + regex + "]+$", "g");
                }
                return new constructor(this.v.replace(pattern, ""));
            },
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: "($self, chars=None, /)",
            $doc: docs.rstrip,
        },
        rpartition: {
            $meth: function (sep) {
                Sk.builtin.pyCheckType("sep", englishName, checkType(sep));
                const pos = this.v.lastIndexOf(sep.v);
                if (pos < 0) {
                    return new Sk.builtin.tuple([constructor.$empty, constructor.$empty, this]);
                }

                return new Sk.builtin.tuple([new constructor(this.v.substring(0, pos)), sep, new constructor(this.v.substring(pos + sep.v.length))]);
            },
            $flags: { OneArg: true },
            $textsig: "($self, sep, /)",
            $doc: docs.rpartition,
        },
        splitlines: {
            $meth: function (args, kwargs) {
                let [keepends] = Sk.abstr.copyKeywordsToNamedArgs("splitlines", ["keepends"], args, kwargs, [Sk.builtin.bool.false$]);
                Sk.builtin.pyCheckType("", "integer", Sk.builtin.checkInt(keepends));
                keepends = keepends.v;
                const data = this.v;
                const selflen = data.length;
                const strs_w = [];
                let eol,
                    ch,
                    slice,
                    sol = 0;
                for (let i = 0; i < selflen; i++) {
                    ch = data.charAt(i);
                    if (data.charAt(i + 1) === "\n" && ch === "\r") {
                        eol = i + 2;
                        slice = data.slice(sol, eol);
                        if (!keepends) {
                            slice = slice.replace(/(\r|\n)/g, "");
                        }
                        strs_w.push(new constructor(slice));
                        sol = eol;
                    } else if ((ch === "\n" && data.charAt(i - 1) !== "\r") || ch === "\r") {
                        eol = i + 1;
                        slice = data.slice(sol, eol);
                        if (!keepends) {
                            slice = slice.replace(/(\r|\n)/g, "");
                        }
                        strs_w.push(new constructor(slice));
                        sol = eol;
                    }
                }
                if (sol < selflen) {
                    eol = selflen;
                    slice = data.slice(sol, eol);
                    if (!keepends) {
                        slice = slice.replace(/(\r|\n)/g, "");
                    }
                    strs_w.push(new constructor(slice));
                }
                return new Sk.builtin.list(strs_w);
            },
            $flags: { FastCall: true },
            $textsig: "($self, /, keepends=False)",
            $doc: docs.splitlines,
        },
        strip: {
            $meth: function (chars) {
                let pattern;
                if (chars !== undefined && !Sk.builtin.checkNone(chars) && !checkType(chars)) {
                    throw new Sk.builtin.TypeError("strip arg must be None or " + englishName);
                }
                if (chars === undefined || Sk.builtin.checkNone(chars)) {
                    pattern = /^\s+|\s+$/g;
                } else {
                    const regex = re_escape(chars.v);
                    pattern = new RegExp("^[" + regex + "]+|[" + regex + "]+$", "g");
                }
                return new constructor(this.v.replace(pattern, ""));
            },
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: "($self, chars=None, /)",
            $doc: docs.strip,
        },
        swapcase: {
            $meth: function () {
                const ret = this.v.replace(/[a-z]/gi, function (c) {
                    let lc = c.toLowerCase();
                    return lc === c ? c.toUpperCase() : lc;
                });
                return new constructor(ret);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.swapcase,
        },
        // translate: {        //     $meth: Sk.builtin.str.methods.translate,
        //     $flags: {},
        //     $textsig: "($self, table, /)",
        //     $doc: docs.translate
        //         ,
        //
        // },
        upper: {
            $meth: function () {
                return new constructor(this.v.toUpperCase());
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.upper,
        },
        startswith: {
            $meth: function (prefix, start, end) {
                if (!(prefix instanceof constructor) && prefix.constructor !== Sk.builtin.tuple) {
                    throw new Sk.builtin.TypeError(
                        "startswith first arg must be " + typeName + " or a tuple of " + typeName + ", not " + Sk.abstr.typeName(prefix)
                    );
                }
                len = this.sq$length();
                [start, end] = getStartEndAsJs(start, end, len);
                if (start > len) {
                    return Sk.builtin.bool.false$;
                }

                const slice = this.v.slice(this.codepoints ? this.codepoints[start] : start, this.codepoints ? this.codepoints[end] : end);
                if (prefix.constructor === Sk.builtin.tuple) {
                    let resultBool;
                    for (let it = Sk.abstr.iter(prefix), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                        if (!(i instanceof constructor)) {
                            throw new Sk.builtin.TypeError(
                                "tuple for startswith must only contain " + typeName + ", not " + Sk.abstr.typeName(prefix)
                            );
                        }
                        if (start > end) {
                            resultBool = start <= 0;
                        } else {
                            resultBool = slice.indexOf(i.v) === 0;
                        }
                        if (resultBool) {
                            break;
                        }
                    }
                    return resultBool ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
                }

                if (prefix.v === "" && start > end && end >= 0) {
                    return Sk.builtin.bool.false$;
                }

                return new Sk.builtin.bool(slice.indexOf(prefix.v) === 0);
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc: docs.startswith,
        },
        endswith: {
            $meth: function (suffix, start, end) {
                if (!(suffix instanceof constructor) && suffix.constructor !== Sk.builtin.tuple) {
                    throw new Sk.builtin.TypeError(
                        "startswith first arg must be " + typeName + " or a tuple of " + typeName + ", not " + Sk.abstr.typeName(suffix)
                    );
                }
                len = this.sq$length();
                [start, end] = getStartEndAsJs(start, end, len);
                if (start > len) {
                    return Sk.builtin.bool.false$;
                }

                const slice = this.v.slice(this.codepoints ? this.codepoints[start] : start, this.codepoints ? this.codepoints[end] : end);
                if (suffix.constructor === Sk.builtin.tuple) {
                    let resultBool;
                    for (let it = Sk.abstr.iter(suffix), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                        if (!(i instanceof constructor)) {
                            throw new Sk.builtin.TypeError(
                                "tuple for startswith must only contain " + typeName + ", not " + Sk.abstr.typeName(suffix)
                            );
                        }
                        if (start > end) {
                            resultBool = start <= 0;
                        } else {
                            resultBool = slice.indexOf(i.v, slice.length - i.v.length) !== -1;
                        }
                        if (resultBool) {
                            break;
                        }
                    }
                    return resultBool ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
                }

                if (suffix.v === "" && start > end && end >= 0) {
                    return Sk.builtin.bool.false$;
                }

                return new Sk.builtin.bool(slice.indexOf(suffix.v, slice.length - suffix.v.length) !== -1);
            },
            // // todo start, end
            // // http://stackoverflow.com/questions/280634/endswith-in-javascript
            // Sk.builtin.pyCheckType("suffix", englishName, checkType(suffix));
            // return new Sk.builtin.bool(this.v.indexOf(suffix.v, this.v.length - suffix.v.length) !== -1);
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: null,
            $doc: docs.endswith,
        },
        isascii: {
            $meth: function () {
                const v = this.v;
                for (i = 0; i < v.length; i++) {
                    val = v.charCodeAt(i);
                    if (!(val >= 0 && val < 128)) {
                        return Sk.builtin.bool.false$;
                    }
                }
                return Sk.builtin.bool.true$;
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.isascii,
        },
        islower: {
            $meth: function () {
                return new Sk.builtin.bool(this.v.length && /[a-z]/.test(this.v) && !/[A-Z]/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.islower,
        },
        isupper: {
            $meth: function () {
                return new Sk.builtin.bool(this.v.length && !/[a-z]/.test(this.v) && /[A-Z]/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.isupper,
        },
        istitle: {
            $meth: function () {
                // Comparing to str.title() seems the most intuitive thing, but it fails on "",
                // Other empty-ish strings with no change.
                const input = this.v;
                let cased = false;
                let previous_is_cased = false;
                for (let pos = 0; pos < input.length; pos++) {
                    const ch = input.charAt(pos);
                    if (!/[a-z]/.test(ch) && /[A-Z]/.test(ch)) {
                        if (previous_is_cased) {
                            return new Sk.builtin.bool(false);
                        }
                        previous_is_cased = true;
                        cased = true;
                    } else if (/[a-z]/.test(ch) && !/[A-Z]/.test(ch)) {
                        if (!previous_is_cased) {
                            return new Sk.builtin.bool(false);
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
            $doc: docs.istitle,
        },
        isspace: {
            $meth: function () {
                return new Sk.builtin.bool(/^\s+$/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.isspace,
        },
        isdigit: {
            $meth: function () {
                return new Sk.builtin.bool(/^\d+$/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.isdigit,
        },
        isalpha: {
            $meth: function () {
                return new Sk.builtin.bool(this.v.length && !/[^a-zA-Z]/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.isalpha,
        },
        isalnum: {
            $meth: function () {
                return new Sk.builtin.bool(this.v.length && !/[^a-zA-Z0-9]/.test(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: docs.isalnum,
        },
        zfill: {
            $meth: function (len) {
                len = Sk.misceval.asIndexOrThrow(len);
                const str = this.v;
                let pad = "";
                // figure out how many zeroes are needed to make the proper length
                const zeroes = len - str.length;
                // offset by 1 if there is a +/- at the beginning of the string
                const offset = str[0] === "+" || str[0] === "-" ? 1 : 0;
                for (var i = 0; i < zeroes; i++) {
                    pad += "0";
                }
                // combine the string and the zeroes
                const ret = str.substr(0, offset) + pad + str.substr(offset);
                return new constructor(ret);
            },
            $flags: { OneArg: true },
            $textsig: "($self, width, /)",
            $doc: docs.zfill,
        },
        __getnewargs__: {
            $meth: function () {
                return new Sk.builtin.tuple([this]);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: null,
        },
    };

    function getStartEndAsJs(start, end, len) {
        if (start === undefined || Sk.builtin.checkNone(start)) {
            start = 0;
        } else {
            start = Sk.misceval.asIndexOrThrow(start, "slice indices must be integers or None or have an __index__ method");
            start = start >= 0 ? start : len + start;
            if (start < 0) {
                start = 0;
            }
        }
        if (end === undefined || Sk.builtin.checkNone(end)) {
            end = len;
        } else {
            end = Sk.misceval.asIndexOrThrow(end, "slice indices must be integers or None or have an __index__ method");
            end = end >= 0 ? end : len + end;
        }
        return [start, end];
    }

    function mkFind(isReversed) {
        return function strFind(tgt, start, end) {
            tgt = getTgt(tgt);
            let len = this.sq$length();
            [start, end] = getStartEndAsJs(start, end, len);
            // This guard makes sure we don't, eg, look for self.codepoints[-1]
            if (start > len) {
                return new Sk.builtin.int_(-1);
            }
            if (end < start) {
                return new Sk.builtin.int_(-1);
            }
            let idx;
            if (this.$hasAstralCodePoints()) {
                // Convert start and end to JS coordinates...
                start = this.codepoints[start];
                end = this.codepoints[end];
                if (start === undefined) {
                    start = this.v.length;
                }
                if (end === undefined) {
                    end = this.v.length;
                }

                // ...do the search..
                end -= tgt.length;
                let jsidx = isReversed ? this.v.lastIndexOf(tgt, end) : this.v.indexOf(tgt, start);
                jsidx = jsidx >= start && jsidx <= end ? jsidx : -1;

                // ...and now convert them back
                idx = -1;

                for (let i = 0; i < len; i++) {
                    if (jsidx == this.codepoints[i]) {
                        idx = i;
                    }
                }
            } else {
                // No astral codepoints, no conversion required
                end -= tgt.length;
                idx = isReversed ? this.v.lastIndexOf(tgt, end) : this.v.indexOf(tgt, start);
                idx = idx >= start && idx <= end ? idx : -1;
            }

            return new Sk.builtin.int_(idx);
        };
    }

    function mkJust(isRight, isCenter) {
        return function strJustify(len, fillchar) {
            var newstr;
            Sk.builtin.pyCheckType("", "integer", Sk.builtin.checkInt(len));
            if (fillchar !== undefined && (!checkType(fillchar) || (fillchar.v.length !== 1 && fillchar.sq$length() !== 1))) {
                throw new Sk.builtin.TypeError("the fill charactermust be a" + englishName + " exactly one character long");
            }
            if (fillchar === undefined) {
                fillchar = " ";
            } else {
                fillchar = fillchar.v;
            }
            len = Sk.builtin.asnum$(len);
            let mylen = this.sq$length();
            if (mylen >= len) {
                return this;
            } else if (isCenter) {
                newstr = fillchar.repeat(Math.floor((len - mylen) / 2));

                newstr = newstr + this.v + newstr;

                if ((len - mylen) % 2) {
                    newstr += fillchar;
                }

                return new constructor(newstr);
            } else {
                newstr = fillchar.repeat(len - mylen);
                return new constructor(isRight ? newstr + this.v : this.v + newstr);
            }
        };
    }

    return methods;
};

function getDocs(constructor) {
    const strDocs = {
        encode:
            "Encode the string using the codec registered for encoding.\n\n  encoding\n    The encoding in which to encode the string.\n  errors\n    The error handling scheme to use for encoding errors.\n    The default is 'strict' meaning that encoding errors raise a\n    UnicodeEncodeError.  Other possible values are 'ignore', 'replace' and\n    'xmlcharrefreplace' as well as any other name registered with\n    codecs.register_error that can handle UnicodeEncodeErrors.",
        replace:
            "Return a copy with all occurrences of substring old replaced by new.\n\n  count\n    Maximum number of occurrences to replace.\n    -1 (the default value) means replace all occurrences.\n\nIf the optional argument count is given, only the first count occurrences are\nreplaced.",
        split:
            "Return a list of the words in the string, using sep as the delimiter string.\n\n  sep\n    The delimiter according which to split the string.\n    None (the default value) means split according to any whitespace,\n    and discard empty strings from the result.\n  maxsplit\n    Maximum number of splits to do.\n    -1 (the default value) means no limit.",
        rsplit:
            "Return a list of the words in the string, using sep as the delimiter string.\n\n  sep\n    The delimiter according which to split the string.\n    None (the default value) means split according to any whitespace,\n    and discard empty strings from the result.\n  maxsplit\n    Maximum number of splits to do.\n    -1 (the default value) means no limit.\n\nSplits are done starting at the end of the string and working to the front.",
        join:
            "Concatenate any number of strings.\n\nThe string whose method is called is inserted in between each given string.\nThe result is returned as a new string.\n\nExample: '.'.join(['ab', 'pq', 'rs']) -> 'ab.pq.rs'",
        capitalize:
            "Return a capitalized version of the string.\n\nMore specifically, make the first character have upper case and the rest lower\ncase.",
        casefold: "Return a version of the string suitable for caseless comparisons.",
        title:
            "Return a version of the string where each word is titlecased.\n\nMore specifically, words start with uppercased characters and all remaining\ncased characters have lower case.",
        center: "Return a centered string of length width.\n\nPadding is done using the specified fill character (default is a space).",
        count:
            "S.count(sub[, start[, end]]) -> int\n\nReturn the number of non-overlapping occurrences of substring sub in\nstring S[start:end].  Optional arguments start and end are\ninterpreted as in slice notation.",
        expandtabs:
            "Return a copy where all tab characters are expanded using spaces.\n\nIf tabsize is not given, a tab size of 8 characters is assumed.",
        find:
            "S.find(sub[, start[, end]]) -> int\n\nReturn the lowest index in S where substring sub is found,\nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nReturn -1 on failure.",
        partition:
            "Partition the string into three parts using the given separator.\n\nThis will search for the separator in the string.  If the separator is found,\nreturns a 3-tuple containing the part before the separator, the separator\nitself, and the part after it.\n\nIf the separator is not found, returns a 3-tuple containing the original string\nand two empty strings.",
        index:
            "S.index(sub[, start[, end]]) -> int\n\nReturn the lowest index in S where substring sub is found, \nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nRaises ValueError when the substring is not found.",
        ljust: "Return a left-justified string of length width.\n\nPadding is done using the specified fill character (default is a space).",
        lower: "Return a copy of the string converted to lowercase.",
        lstrip: "Return a copy of the string with leading whitespace removed.\n\nIf chars is given and not None, remove characters in chars instead.",
        rfind:
            "S.rfind(sub[, start[, end]]) -> int\n\nReturn the highest index in S where substring sub is found,\nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nReturn -1 on failure.",
        rindex:
            "S.rindex(sub[, start[, end]]) -> int\n\nReturn the highest index in S where substring sub is found,\nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nRaises ValueError when the substring is not found.",
        rjust: "Return a right-justified string of length width.\n\nPadding is done using the specified fill character (default is a space).",
        rstrip:
            "Return a copy of the string with trailing whitespace removed.\n\nIf chars is given and not None, remove characters in chars instead.",
        rpartition:
            "Partition the string into three parts using the given separator.\n\nThis will search for the separator in the string, starting at the end. If\nthe separator is found, returns a 3-tuple containing the part before the\nseparator, the separator itself, and the part after it.\n\nIf the separator is not found, returns a 3-tuple containing two empty strings\nand the original string.",
        splitlines:
            "Return a list of the lines in the string, breaking at line boundaries.\n\nLine breaks are not included in the resulting list unless keepends is given and\ntrue.",
        strip:
            "Return a copy of the string with leading and trailing whitespace remove.\n\nIf chars is given and not None, remove characters in chars instead.",
        swapcase: "Convert uppercase characters to lowercase and lowercase characters to uppercase.",
        translate:
            "Replace each character in the string using the given translation table.\n\n  table\n    Translation table, which must be a mapping of Unicode ordinals to\n    Unicode ordinals, strings, or None.\n\nThe table must implement lookup/indexing via __getitem__, for instance a\ndictionary or list.  If this operation raises LookupError, the character is\nleft untouched.  Characters mapped to None are deleted.",
        upper: "Return a copy of the string converted to uppercase.",
        startswith:
            "S.startswith(prefix[, start[, end]]) -> bool\n\nReturn True if S starts with the specified prefix, False otherwise.\nWith optional start, test S beginning at that position.\nWith optional end, stop comparing S at that position.\nprefix can also be a tuple of strings to try.",
        endswith:
            "S.endswith(suffix[, start[, end]]) -> bool\n\nReturn True if S ends with the specified suffix, False otherwise.\nWith optional start, test S beginning at that position.\nWith optional end, stop comparing S at that position.\nsuffix can also be a tuple of strings to try.",
        isascii:
            "Return True if all characters in the string are ASCII, False otherwise.\n\nASCII characters have code points in the range U+0000-U+007F.\nEmpty string is ASCII too.",
        islower:
            "Return True if the string is a lowercase string, False otherwise.\n\nA string is lowercase if all cased characters in the string are lowercase and\nthere is at least one cased character in the string.",
        isupper:
            "Return True if the string is an uppercase string, False otherwise.\n\nA string is uppercase if all cased characters in the string are uppercase and\nthere is at least one cased character in the string.",
        istitle:
            "Return True if the string is a title-cased string, False otherwise.\n\nIn a title-cased string, upper- and title-case characters may only\nfollow uncased characters and lowercase characters only cased ones.",
        isspace:
            "Return True if the string is a whitespace string, False otherwise.\n\nA string is whitespace if all characters in the string are whitespace and there\nis at least one character in the string.",
        isdecimal:
            "Return True if the string is a decimal string, False otherwise.\n\nA string is a decimal string if all characters in the string are decimal and\nthere is at least one character in the string.",
        isdigit:
            "Return True if the string is a digit string, False otherwise.\n\nA string is a digit string if all characters in the string are digits and there\nis at least one character in the string.",
        isalpha:
            "Return True if the string is an alphabetic string, False otherwise.\n\nA string is alphabetic if all characters in the string are alphabetic and there\nis at least one character in the string.",
        isalnum:
            "Return True if the string is an alpha-numeric string, False otherwise.\n\nA string is alpha-numeric if all characters in the string are alpha-numeric and\nthere is at least one character in the string.",
        isidentifier:
            'Return True if the string is a valid Python identifier, False otherwise.\n\nUse keyword.iskeyword() to test for reserved identifiers such as "def" and\n"class".',
        isprintable:
            "Return True if the string is printable, False otherwise.\n\nA string is printable if all of its characters are considered printable in\nrepr() or if it is empty.",
        zfill: "Pad a numeric string with zeros on the left, to fill a field of the given width.\n\nThe string is never truncated.",
        format:
            "S.format(*args, **kwargs) -> str\n\nReturn a formatted version of S, using substitutions from args and kwargs.\nThe substitutions are identified by braces ('{' and '}').",
        format_map:
            "S.format_map(mapping) -> str\n\nReturn a formatted version of S, using substitutions from mapping.\nThe substitutions are identified by braces ('{' and '}').",
        __format__: "Return a formatted version of the string as described by format_spec.",
        __sizeof__: "Return the size of the string in memory, in bytes.",
        __getnewargs__: "on",
    };
    const bytesDocs = {
        __getnewargs__: "on",
        capitalize: "B.capitalize() -> copy of B\n\nReturn a copy of B with only its first character capitalized (ASCII)\nand the rest lower-cased.",
        center:
            "B.center(width[, fillchar]) -> copy of B\n\nReturn B centered in a string of length width.  Padding is\ndone using the specified fill character (default is a space).",
        count:
            "B.count(sub[, start[, end]]) -> int\n\nReturn the number of non-overlapping occurrences of subsection sub in\nbytes B[start:end].  Optional arguments start and end are interpreted\nas in slice notation.",
        endswith:
            "B.endswith(suffix[, start[, end]]) -> bool\n\nReturn True if B ends with the specified suffix, False otherwise.\nWith optional start, test B beginning at that position.\nWith optional end, stop comparing B at that position.\nsuffix can also be a tuple of bytes to try.",
        expandtabs:
            "B.expandtabs(tabsize=8) -> copy of B\n\nReturn a copy of B where all tab characters are expanded using spaces.\nIf tabsize is not given, a tab size of 8 characters is assumed.",
        find:
            "B.find(sub[, start[, end]]) -> int\n\nReturn the lowest index in B where subsection sub is found,\nsuch that sub is contained within B[start,end].  Optional\narguments start and end are interpreted as in slice notation.\n\nReturn -1 on failure.",
        hex: "B.hex() -> string\n\nCreate a string of hexadecimal numbers from a bytes object.\nExample: b'\\xb9\\x01\\xef'.hex() -> 'b901ef'.",
        index:
            "B.index(sub[, start[, end]]) -> int\n\nReturn the lowest index in B where subsection sub is found,\nsuch that sub is contained within B[start,end].  Optional\narguments start and end are interpreted as in slice notation.\n\nRaises ValueError when the subsection is not found.",
        isalnum:
            "B.isalnum() -> bool\n\nReturn True if all characters in B are alphanumeric\nand there is at least one character in B, False otherwise.",
        isalpha:
            "B.isalpha() -> bool\n\nReturn True if all characters in B are alphabetic\nand there is at least one character in B, False otherwise.",
        isascii: "B.isascii() -> bool\n\nReturn True if B is empty or all characters in B are ASCII,\nFalse otherwise.",
        isdigit: "B.isdigit() -> bool\n\nReturn True if all characters in B are digits\nand there is at least one character in B, False otherwise.",
        islower:
            "B.islower() -> bool\n\nReturn True if all cased characters in B are lowercase and there is\nat least one cased character in B, False otherwise.",
        isspace:
            "B.isspace() -> bool\n\nReturn True if all characters in B are whitespace\nand there is at least one character in B, False otherwise.",
        istitle:
            "B.istitle() -> bool\n\nReturn True if B is a titlecased string and there is at least one\ncharacter in B, i.e. uppercase characters may only follow uncased\ncharacters and lowercase characters only cased ones. Return False\notherwise.",
        isupper:
            "B.isupper() -> bool\n\nReturn True if all cased characters in B are uppercase and there is\nat least one cased character in B, False otherwise.",
        join:
            "Concatenate any number of bytes objects.\n\nThe bytes whose method is called is inserted in between each pair.\n\nThe result is returned as a new bytes object.\n\nExample: b'.'.join([b'ab', b'pq', b'rs']) -> b'ab.pq.rs'.",
        ljust:
            "B.ljust(width[, fillchar]) -> copy of B\n\nReturn B left justified in a string of length width. Padding is\ndone using the specified fill character (default is a space).",
        lower: "B.lower() -> copy of B\n\nReturn a copy of B with all ASCII characters converted to lowercase.",
        lstrip: "Strip leading bytes contained in the argument.\n\nIf the argument is omitted or None, strip leading  ASCII whitespace.",
        partition:
            "Partition the bytes into three parts using the given separator.\n\nThis will search for the separator sep in the bytes. If the separator is found,\nreturns a 3-tuple containing the part before the separator, the separator\nitself, and the part after it.\n\nIf the separator is not found, returns a 3-tuple containing the original bytes\nobject and two empty bytes objects.",
        replace:
            "Return a copy with all occurrences of substring old replaced by new.\n\n  count\n    Maximum number of occurrences to replace.\n    -1 (the default value) means replace all occurrences.\n\nIf the optional argument count is given, only the first count occurrences are\nreplaced.",
        rfind:
            "B.rfind(sub[, start[, end]]) -> int\n\nReturn the highest index in B where subsection sub is found,\nsuch that sub is contained within B[start,end].  Optional\narguments start and end are interpreted as in slice notation.\n\nReturn -1 on failure.",
        rindex:
            "B.rindex(sub[, start[, end]]) -> int\n\nReturn the highest index in B where subsection sub is found,\nsuch that sub is contained within B[start,end].  Optional\narguments start and end are interpreted as in slice notation.\n\nRaise ValueError when the subsection is not found.",
        rjust:
            "B.rjust(width[, fillchar]) -> copy of B\n\nReturn B right justified in a string of length width. Padding is\ndone using the specified fill character (default is a space)",
        rpartition:
            "Partition the bytes into three parts using the given separator.\n\nThis will search for the separator sep in the bytes, starting at the end. If\nthe separator is found, returns a 3-tuple containing the part before the\nseparator, the separator itself, and the part after it.\n\nIf the separator is not found, returns a 3-tuple containing two empty bytes\nobjects and the original bytes object.",
        rsplit:
            "Return a list of the sections in the bytes, using sep as the delimiter.\n\n  sep\n    The delimiter according which to split the bytes.\n    None (the default value) means split on ASCII whitespace characters\n    (space, tab, return, newline, formfeed, vertical tab).\n  maxsplit\n    Maximum number of splits to do.\n    -1 (the default value) means no limit.\n\nSplitting is done starting at the end of the bytes and working to the front.",
        rstrip: "Strip trailing bytes contained in the argument.\n\nIf the argument is omitted or None, strip trailing ASCII whitespace.",
        split:
            "Return a list of the sections in the bytes, using sep as the delimiter.\n\n  sep\n    The delimiter according which to split the bytes.\n    None (the default value) means split on ASCII whitespace characters\n    (space, tab, return, newline, formfeed, vertical tab).\n  maxsplit\n    Maximum number of splits to do.\n    -1 (the default value) means no limit.",
        splitlines:
            "Return a list of the lines in the bytes, breaking at line boundaries.\n\nLine breaks are not included in the resulting list unless keepends is given and\ntrue.",
        startswith:
            "B.startswith(prefix[, start[, end]]) -> bool\n\nReturn True if B starts with the specified prefix, False otherwise.\nWith optional start, test B beginning at that position.\nWith optional end, stop comparing B at that position.\nprefix can also be a tuple of bytes to try.",
        strip:
            "Strip leading and trailing bytes contained in the argument.\n\nIf the argument is omitted or None, strip leading and trailing ASCII whitespace.",
        swapcase: "B.swapcase() -> copy of B\n\nReturn a copy of B with uppercase ASCII characters converted\nto lowercase ASCII and vice versa.",
        title:
            "B.title() -> copy of B\n\nReturn a titlecased version of B, i.e. ASCII words start with uppercase\ncharacters, all remaining cased characters have lowercase.",
        translate:
            "Return a copy with each character mapped by the given translation table.\n\n  table\n    Translation table, which must be a bytes object of length 256.\n\nAll characters occurring in the optional argument delete are removed.\nThe remaining characters are mapped through the given translation table.",
        upper: "B.upper() -> copy of B\n\nReturn a copy of B with all ASCII characters converted to uppercase.",
        zfill:
            "B.zfill(width) -> copy of B\n\nPad a numeric string B with zeros on the left, to fill a field\nof the specified width.  B is never truncated.",
    };
    if (constructor === Sk.builtin.str) {
        return strDocs;
    } else if (constructor === Sk.builtin.bytes) {
        return bytesDocs;
    }
}

function re_escape(s) {
    let c;
    const ret = [];
    const re = /^[A-Za-z0-9]+$/;
    for (let i = 0; i < s.length; ++i) {
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
