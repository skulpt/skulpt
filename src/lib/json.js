function $builtinmodule() {
    const {
        builtin: {
            str: pyStr,
            float_: pyFloat,
            list: pyList,
            tuple: pyTuple,
            dict: pyDict,
            func: pyFunc,
            TypeError,
            ValueError,
            NotImplementedError,
            sorted,
            none: { none$: pyNone },
            bool: { true$: pyTrue, false$: pyFalse },
            checkString,
            checkBytes,
        },
        ffi: { toPy, toJs, toPyFloat, toPyInt, isTrue },
        abstr: { typeName, buildNativeClass, checkOneArg, setUpModuleMethods, copyKeywordsToNamedArgs },
        misceval: { objectRepr, callsimArray: pyCall },
    } = Sk;

    const json = {
        __name__: new pyStr("json"),
        __all__: toPy(["dump", "dumps", "load", "loads", "JSONDecoder", "JSONDecodeError", "JSONEncoder"]),
        dump: proxyFail("dump"),
        load: proxyFail("load"),
        JSONDecoder: proxyFail("JSONDecoder"),
        JSONEncoder: proxyFail("JSONEncoder"),
    };

    function proxyFail(name) {
        return new pyFunc(() => {
            throw new NotImplementedError(name + " is not yet implemented in skulpt");
        });
    }

    const attrs = ["msg", "doc", "pos", "lineno", "colno"];
    const JSONDecodeError = (json.JSONDecodeError = buildNativeClass("json.JSONDecodeError", {
        base: ValueError,
        constructor: function JSONDecodeError(msg, doc, pos) {
            const relevant = doc.slice(0, pos);
            const lineno = relevant.split("\n").length;
            const colno = pos - relevant.lastIndexOf("\n");
            const errmsg = `${msg}: line ${lineno} column ${colno} (char ${pos})`;
            ValueError.call(this, errmsg);
            this.$msg = msg;
            this.$doc = doc;
            this.$pos = pos;
            this.$lineno = lineno;
            this.$colno = colno;
        },
        getsets: Object.fromEntries(
            attrs.map((attr) => [
                attr,
                {
                    $get() {
                        return toPy(this["$" + attr]);
                    },
                },
            ])
        ),
    }));

    /********* ENCODING *********/

    class JSONEncoder {
        constructor(skipkeys, ensure_ascii, check_circular, allow_nan, indent, separators, _default, sort_keys) {
            this.skipkeys = skipkeys;
            this.ensure_ascii = ensure_ascii;
            this.check_circular = check_circular;
            this.allow_nan = allow_nan;
            this.indent = indent;
            this.separators = separators;
            this.sort_keys = sort_keys;
            this.item_separator = ", ";
            this.key_separator = ": ";
            if (this.separators !== null) {
                [this.item_separator, this.key_separator] = this.separators;
            } else if (this.indent !== null) {
                this.item_separator = ",";
            }
            if (_default !== null) {
                this.default = _default;
            }
            this.encoder = this.make_encoder();
        }
        default(o) {
            throw new TypeError(`Object of type ${typeName(o)} is not JSON serializable`);
        }
        encode(o) {
            return new pyStr(this.encoder(o));
        }
        make_encoder() {
            let markers, _encoder;
            if (this.check_circular) {
                markers = new Set();
            } else {
                markers = null;
            }
            /** @todo - at the moment we just ignore this */
            if (this.ensure_ascii) {
                _encoder = JSON.stringify;
            } else {
                _encoder = JSON.stringify;
            }
            const floatstr = (o, allow_nan = this.allow_nan) => {
                const v = o.valueOf();
                let text;
                if (!Number.isFinite(v)) {
                    text = v.toString();
                } else {
                    return objectRepr(o);
                }
                if (!allow_nan) {
                    throw new ValueError("Out of range float values are not JSON compliant: " + objectRepr(o));
                }
                return text;
            };
            return _make_iterencode(
                markers,
                this.default,
                _encoder,
                this.indent,
                floatstr,
                this.key_separator,
                this.item_separator,
                this.sort_keys,
                this.skipkeys
            );
        }
    }

    const items_str = new pyStr("items");

    function _make_iterencode(
        markers,
        _default,
        _encoder,
        _indent,
        _floatstr,
        _key_separator,
        _item_separator,
        _sort_keys,
        _skipkeys
    ) {
        if (_indent !== null && typeof _indent !== "string") {
            _indent = " ".repeat(_indent);
        }

        let /** @type {() => {}} */ _check_markers, /**@type {() => {}} */ _remove_from_markers;
        if (markers !== null) {
            _check_markers = (o) => {
                if (markers.has(o)) {
                    throw new ValueError("Circular reference detected");
                }
                markers.add(o);
            };
            _remove_from_markers = (o) => markers.delete(o);
        } else {
            _check_markers = (o) => {};
            _remove_from_markers = (o) => {};
        }

        let /** @type {() => {}} */ _initialize_buffer, /** @type {() => {}} */ _finalize_buffer;
        if (_indent !== null) {
            _initialize_buffer = (buf, _current_indent_level) => {
                _current_indent_level += 1;
                const newline_indent = "\n" + _indent.repeat(_current_indent_level);
                const separator = _item_separator + newline_indent;
                buf += newline_indent;

                return [buf, _current_indent_level, separator];
            };
            _finalize_buffer = (buf, ending, _current_indent_level) => {
                _current_indent_level -= 1;
                buf += "\n" + _indent.repeat(_current_indent_level) + ending;
                return buf;
            };
        } else {
            _initialize_buffer = (buf, _current_indent_level) => [buf, _current_indent_level, _item_separator];
            _finalize_buffer = (buf, ending, _current_indent_level) => buf + ending;
        }

        const _unhandled = (o, _current_indent_level) => {
            _check_markers(o);
            const ret = _iterencode(_default(o), _current_indent_level);
            _remove_from_markers(o);
            return ret;
        };

        const _iterencode_list = (arr, _current_indent_level) => {
            if (!arr.length) {
                return "[]";
            }
            _check_markers(arr);
            let buf, separator;
            [buf, _current_indent_level, separator] = _initialize_buffer("[", _current_indent_level);
            let first = true;
            for (let val of arr) {
                if (first) {
                    first = false;
                } else {
                    buf += separator;
                }
                buf += _iterencode(val, _current_indent_level);
            }
            _remove_from_markers(arr);
            return _finalize_buffer(buf, "]", _current_indent_level);
        };

        const _iterencode_dict = (dict, _current_indent_level) => {
            if (!dict.sq$length()) {
                return "{}";
            }
            _check_markers(dict);
            let buf, separator;
            [buf, _current_indent_level, separator] = _initialize_buffer("{", _current_indent_level);
            let first = true;
            if (_sort_keys) {
                const pyItems = pyCall(dict.tp$getattr(items_str));
                const sortedItems = sorted(pyItems);
                dict = pyCall(pyDict, [sortedItems]);
            }
            for (let [key, val] of dict.$items()) {
                const k = key.valueOf();
                const type = typeof k;
                if (type === "string") {
                    key = k;
                } else if (type === "number") {
                    key = _floatstr(key);
                } else if (type === "boolean" || k === null) {
                    key = String(k);
                } else if (JSBI.__isBigInt(k)) {
                    key = k.toString();
                } else if (_skipkeys) {
                    continue;
                } else {
                    throw new TypeError("keys must be str, int, float, bool or None, not " + typeName(key));
                }
                if (first) {
                    first = false;
                } else {
                    buf += separator;
                }
                buf += _encoder(key);
                buf += _key_separator;
                buf += _iterencode(val, _current_indent_level);
            }
            _remove_from_markers(dict);
            return _finalize_buffer(buf, "}", _current_indent_level);
        };

        const _iterencode = (o, _current_indent_level = 0) => {
            return String(
                toJs(o, {
                    stringHook: (val) => _encoder(val),
                    numberHook: (val, obj) => _floatstr(obj),
                    bigintHook: (val) => val.toString(),
                    dictHook: (dict) => _iterencode_dict(dict, _current_indent_level),
                    arrayHook: (arr) => _iterencode_list(arr, _current_indent_level),
                    setHook: (o) => _unhandled(o, _current_indent_level),
                    funcHook: (val, obj) => _unhandled(obj, _current_indent_level),
                    objecthook: (val, obj) => _unhandled(obj, _current_indent_level),
                    unhandledHook: (obj) => _unhandled(obj, _current_indent_level),
                })
            );
        };

        return _iterencode;
    }

    const defaultEncoderArgs = [false, true, true, true, null, null, null, false];
    const defaultEncoder = new JSONEncoder(...defaultEncoderArgs);

    /********* DECODER *********/

    const NUMBER_RE = /(-?(?:0|[1-9]\d*))(\.\d+)?([eE][-+]?\d+)?/;

    function make_scanner(context) {
        const {
            parse_object,
            parse_array,
            parse_string,
            parse_float,
            parse_int,
            parse_constant,
            object_hook,
            object_pairs_hook,
            memo,
        } = context;
        /**
         * @param {string} string
         * @param {number} idx
         */

        const _scan_once = (string, idx) => {
            const nextchar = string[idx];
            if (nextchar === undefined) {
                return [nextchar, idx];
            }

            if (nextchar === '"') {
                return parse_string(string, idx + 1);
            } else if (nextchar === "{") {
                return parse_object(string, idx + 1, _scan_once, object_hook, object_pairs_hook, memo);
            } else if (nextchar === "[") {
                return parse_array(string, idx + 1, _scan_once);
            } else if (nextchar === "n" && string.substring(idx, idx + 4) === "null") {
                return [pyNone, idx + 4];
            } else if (nextchar === "t" && string.substring(idx, idx + 4) === "true") {
                return [pyTrue, idx + 4];
            } else if (nextchar === "f" && string.substring(idx, idx + 5) === "false") {
                return [pyFalse, idx + 5];
            }
            const m = string.substring(idx).match(NUMBER_RE);

            if (m !== null) {
                let res;
                const [match, integer, frac, exp] = m;
                if (frac || exp) {
                    res = parse_float(integer + (frac || "") + (exp || ""));
                } else {
                    res = parse_int(integer);
                }
                return [res, idx + match.length];
            } else if (nextchar === "N" && string.substring(idx, idx + 3) === "NaN") {
                return [parse_constant("NaN"), idx + 3];
            } else if (nextchar == "I" && string.substring(idx, idx + 8) === "Infinity") {
                return [parse_constant("Infinity"), idx + 8];
            } else if (nextchar == "-" && string.substring(idx, idx + 9) === "-Infinity") {
                return [parse_constant("-Infinity"), idx + 9];
            } else {
                return [undefined, idx];
            }
        };

        function scan_once(string, idx) {
            try {
                return _scan_once(string, idx);
            } finally {
                for (const key in memo) {
                    delete memo[key];
                }
            }
        }

        return scan_once;
    }

    // this is taken from tokenize.py - single line string regex
    // adjusted to allow multiline strings - but this will get thrown by JSON.parse
    const STRING_CHUNK = /"[^"\\]*(?:\\.[^"\\]*)*"/m;

    function scanstring(s, end) {
        // get the end of the string literal;
        const chunk = s.substring(end - 1).match(STRING_CHUNK);
        if (chunk === null) {
            throw new JSONDecodeError("Unterminated string starting at", s, end - 1);
        }
        try {
            // just let javascript deal with the string and re throw the error
            const string = new pyStr(JSON.parse(chunk[0]));
            return [string, end + chunk[0].length - 1];
        } catch (e) {
            let pos = e.message.match(/(?:column|position) (\d+)/);
            pos = pos && Number(pos[1]);
            const offset = e.columnNumber === undefined ? 1 : 2; // firefox reports column, v8 reports postition
            end = end + (pos || 0) - offset;
            // account for message formatting in v8 and firefox.
            const msg = e.message
                .replace("JSON.parse: ", "")
                .replace(/ at line \d+ column \d+ of the JSON data/, "")
                .replace(/ in JSON at position \d+$/, "");
            throw new JSONDecodeError(msg, s, end);
        }
    }

    const WHITESPACE = /[ \t\n\r]*/;

    function JSONArray(s, end, scan_once) {
        const values = [];
        let nextchar = s[end];
        const adjust_white_space = () => {
            if (nextchar === " " || nextchar === "\t" || nextchar === "\n" || nextchar === "\r") {
                const m = s.substring(end).match(WHITESPACE);
                end = end + m[0].length;
                nextchar = s[end];
            }
        };
        adjust_white_space();
        if (nextchar === "]") {
            return [new pyList([]), end + 1];
        }
        while (true) {
            let value;
            [value, end] = scan_once(s, end);
            if (value === undefined) {
                throw new JSONDecodeError("Expecting value", s, end);
            }
            values.push(value);
            nextchar = s[end];
            adjust_white_space();
            end++;
            if (nextchar === "]") {
                break;
            } else if (nextchar !== ",") {
                throw new JSONDecodeError("Expecting ',' delimiter", s, end - 1);
            }
            nextchar = s[end];
            adjust_white_space();
        }
        return [new pyList(values), end];
    }

    function JSONObject(s, end, scan_once, object_hook, object_pairs_hook, memo = {}) {
        let pairs = [];
        let nextchar = s[end];
        const memo_get = function (key) {
            const jsKey = key.toString();
            if (jsKey in memo) {
                return memo[jsKey];
            } else {
                memo[jsKey] = key;
                return key;
            }
        };

        const adjust_white_space = () => {
            if (nextchar === " " || nextchar === "\t" || nextchar === "\n" || nextchar === "\r") {
                const m = s.substring(end).match(WHITESPACE);
                end = end + m[0].length;
                nextchar = s[end];
            }
        };
        if (nextchar !== '"') {
            // normally we expect '"'
            adjust_white_space();
            if (nextchar === "}") {
                if (object_pairs_hook !== null) {
                    const res = object_pairs_hook(new pyList([]));
                    return [res, end + 1];
                }
                pairs = new pyDict([]);
                if (object_hook !== null) {
                    pairs = object_hook(pairs);
                }
                return [pairs, end + 1];
            } else if (nextchar !== '"') {
                throw new JSONDecodeError("Expecting property name enclosed in double quotes", s, end);
            }
        }
        end += 1;
        let key, value;
        while (true) {
            [key, end] = scanstring(s, end);
            key = memo_get(key);
            if ((nextchar = s[end]) !== ":") {
                adjust_white_space();
                if (s[end] !== ":") {
                    throw new JSONDecodeError("Expecting ':' delimiter", s, end);
                }
            }
            nextchar = s[++end];
            adjust_white_space();
            [value, end] = scan_once(s, end);
            if (value === undefined) {
                throw new JSONDecodeError("Expecting value", s, end);
            }
            nextchar = s[end];
            pairs.push([key, value]);
            adjust_white_space();
            end++;
            if (nextchar === "}") {
                break;
            } else if (nextchar !== ",") {
                throw new JSONDecodeError("Expecting ',' delimiter", s, end - 1);
            }
            nextchar = s[end];
            adjust_white_space();
            end++;
            if (nextchar !== '"') {
                throw new JSONDecodeError("Expecting property name enclosed in double quotes", s, end - 1);
            }
        }
        if (object_pairs_hook !== null) {
            const res = object_pairs_hook(new pyList(pairs.map((pair) => new pyTuple(pair))));
            return [res, end];
        }
        pairs = new pyDict(pairs.flat());
        if (object_hook !== null) {
            pairs = object_hook(pairs);
        }
        return [pairs, end];
    }

    const _CONSTANTS = {
        NaN: new pyFloat(NaN),
        Infinity: new pyFloat(Infinity),
        "-Infinity": new pyFloat(-Infinity),
    };

    class JSONDecoder {
        constructor(object_hook, parse_float, parse_int, parse_constant, object_pairs_hook) {
            this.object_hook = object_hook;
            this.parse_float = parse_float || toPyFloat;
            this.parse_int = parse_int || toPyInt;
            this.parse_constant = parse_constant || ((x) => _CONSTANTS[x]);
            this.object_pairs_hook = object_pairs_hook;
            this.parse_object = JSONObject;
            this.parse_array = JSONArray;
            this.parse_string = scanstring;
            this.memo = {};
            this.scan_once = make_scanner(this);
            // we don't use a memo and don't support strict=False
        }
        white(s, idx) {
            const m = (idx === 0 ? s : s.substring(idx)).match(WHITESPACE);
            if (m !== null) {
                idx += m[0].length;
            }
            return idx;
        }
        decode(s) {
            s = s.toString();
            let [obj, end] = this.scan_once(s, this.white(s, 0));
            if (obj === undefined) {
                throw new JSONDecodeError("Expecting value", s, end);
            }
            end = this.white(s, end);
            if (end !== s.length) {
                throw new JSONDecodeError("Extra data", s, end);
            }
            return obj;
        }
    }

    const defaultDecoderArgs = Array(5).fill(null);
    const defaultDecoder = new JSONDecoder(...defaultDecoderArgs);

    function convertToNullOrFunc(maybeFunc) {
        if (maybeFunc === null || maybeFunc === pyNone) {
            return null;
        } else {
            return (o) => pyCall(maybeFunc, [toPy(o)]);
        }
    }

    setUpModuleMethods("json", json, {
        loads: {
            $meth(args, kws) {
                checkOneArg("dumps", args);
                let s = args[0];
                if (checkString(s)) {
                    // pass
                } else if (checkBytes(s)) {
                    s = new TextDecoder().decode(s.valueOf());
                } else {
                    throw new TypeError(`the JSON object must be str or bytes, not ${typeName(s)}`);
                }
                // we ignore cls and don't support **kws
                const optionsArray = copyKeywordsToNamedArgs(
                    "dumps",
                    ["object_hook", "parse_float", "parse_int", "parse_constant", "object_pairs_hook"],
                    [],
                    kws,
                    defaultDecoderArgs
                ).map(convertToNullOrFunc);

                if (optionsArray.every((arg) => arg === null)) {
                    return defaultDecoder.decode(s);
                }
                return new JSONDecoder(...optionsArray).decode(s);
            },
            $doc: "Deserialize ``s`` (a ``str`` or ``bytes`` instance containing a JSON document) to a Python object.",
            $flags: { FastCall: true },
        },
        dumps: {
            $meth(args, kws) {
                checkOneArg("dumps", args);
                const obj = args[0];
                let [skipkeys, ensure_ascii, check_circular, allow_nan, indent, separators, _default, sort_keys] =
                    copyKeywordsToNamedArgs(
                        "loads",
                        [
                            "skipkeys",
                            "ensure_ascii",
                            "check_circular",
                            "allow_nan",
                            "indent",
                            "separators",
                            "default",
                            "sort_keys",
                        ],
                        [],
                        kws,
                        defaultEncoderArgs
                    );
                skipkeys = isTrue(skipkeys);
                ensure_ascii = isTrue(ensure_ascii);
                check_circular = isTrue(check_circular);
                allow_nan = isTrue(allow_nan);
                indent = toJs(indent);
                separators = toJs(separators);
                _default = convertToNullOrFunc(_default);
                sort_keys = isTrue(sort_keys);

                if (
                    !skipkeys &&
                    ensure_ascii &&
                    check_circular &&
                    allow_nan &&
                    indent === null &&
                    separators === null &&
                    _default === null &&
                    !sort_keys
                ) {
                    return defaultEncoder.encode(obj);
                }

                if (separators === null) {
                } else if (
                    !Array.isArray(separators) ||
                    separators.length !== 2 ||
                    typeof separators[0] !== "string" ||
                    typeof separators[1] !== "string"
                ) {
                    throw new TypeError("separators shuld be a list or tuple of strings of length 2");
                }

                return new JSONEncoder(
                    skipkeys,
                    ensure_ascii,
                    check_circular,
                    allow_nan,
                    indent,
                    separators,
                    _default,
                    sort_keys
                ).encode(obj);
            },
            $doc: "Serialize ``obj`` to a JSON formatted ``str``",
            $flags: { FastCall: true },
        },
    });

    return json;
}
