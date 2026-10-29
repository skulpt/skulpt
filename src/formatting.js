// Implement the default "format specification mini-language"
// for numbers and strings
// https://docs.python.org/3.7/library/string.html#formatspec

const FORMAT_SPEC_REGEX = /^(?:(.)?([<\>\=\^]))?([\+\-\s])?(#)?(0)?(\d+)?(,|_)?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/;
const FMT = {
    FILL_CHAR: 1,
    FILL_ALIGN: 2,
    SIGN: 3,
    ALT_FORM: 4,
    ZERO_PAD: 5,
    FIELD_WIDTH: 6,
    COMMA: 7,
    PRECISION: 8,
    CONVERSION_TYPE: 9
};

Sk.formatting = {};

let handleWidth = function (m, r, prefix, isNumber) {
    // print(prefix);
    Sk.asserts.assert(typeof(r) === "string");

    if (m[FMT.FIELD_WIDTH]) {
        let fieldWidth = parseInt(m[FMT.FIELD_WIDTH], 10);
        let fillChar = m[FMT.FILL_CHAR] || (m[FMT.ZERO_PAD] ? "0" : " ");
        let fillAlign = m[FMT.FILL_ALIGN] || (m[FMT.ZERO_PAD] ? "=" : isNumber ? ">" : "<");
        let nFill = fieldWidth - (r.length + (prefix ? prefix.length : 0));

        if (nFill <= 0) {
            return prefix + r;
        }

        let fill = fillChar.repeat(nFill);

        switch (fillAlign) {
            case "=":
                if (m[FMT.CONVERSION_TYPE] === "s") {
                    throw new Sk.builtin.ValueError("'=' alignment not allowed in string format specifier");
                }
                return prefix + fill + r;
            case ">":
                return fill + prefix + r;
            case "<":
                return prefix + r + fill;
            case "^":
                let idx = Math.floor(nFill/2);
                return fill.substring(0, idx) + prefix + r + fill.substring(idx);
        }
    }
    return prefix + r;
};

let signForNeg = function(m, neg) {
    return neg ? "-" :
        (m[FMT.SIGN] === "+") ? "+" :
        (m[FMT.SIGN] === " ") ? " " : "";
};

const thousandSep = /\B(?=(\d{3})+(?!\d))/g;
const otherBaseSep = /\B(?=([A-Za-z0-9]{4})+(?![A-Za-z0-9]))/g;

let handleInteger = function(m, n, base){
    // TODO: Do we need to tolerate float inputs for integer conversions?
    // Python doesn't, but I'm guessing this is something to do with JS's
    // int/float ambiguity
    Sk.asserts.assert(n instanceof Sk.builtin.int_ || n instanceof Sk.builtin.lng);

    if (m[FMT.PRECISION]) {
        throw new Sk.builtin.ValueError("Precision not allowed in integer format");
    }

    let r = n.str$(base, false);
    let neg = n.nb$isnegative();

    let prefix = signForNeg(m, neg);

    if (m[FMT.ALT_FORM]) {
        if (base === 16) {
            prefix += "0x";
        } else if (base === 8) {
            prefix += "0o";
        } else if (base === 2){
            prefix += "0b";
        }
    }

    const conversionType = m[FMT.CONVERSION_TYPE];
    if (conversionType === "X") {
        r = r.toUpperCase(); // floats convert nan to NAN
    }

    if (m[FMT.CONVERSION_TYPE] === "n"){
        r = (+r).toLocaleString();
    } else if (m[FMT.COMMA]){
        const parts = r.split(".");
        const sep = m[FMT.COMMA];
        if (sep === "," && base !== 10) {
            throw new Sk.builtin.ValueError(`Cannot specify ',' with '${conversionType}'`);
        }
        parts[0] = parts[0].replace(base === 10 ? thousandSep : otherBaseSep , sep);
        r = parts.join(".");
    }

    return handleWidth(m, r, prefix, true);
};

// Common implementation of __format__ for Python number objects
let formatNumber = function(num, formatSpec, isFractional) {
    if (!formatSpec) { // empty or undefined
        return num.str$(10, true);
    }
    let m = formatSpec.match(FORMAT_SPEC_REGEX);
    if (!m) {
        throw new Sk.builtin.ValueError("Invalid format specifier");
    }

    let conversionType = m[FMT.CONVERSION_TYPE];
    if (!conversionType) {
        conversionType = (isFractional ? "g" : "d");
    }

    let validConversions = isFractional ? "fFeEgG%" : "bcdoxXnfFeEgG%";
    if (validConversions.indexOf(conversionType) == -1) {
        throw new Sk.builtin.ValueError("Unknown format code '" + m[FMT.CONVERSION_TYPE] + "' for object of type '" + Sk.abstr.typeName(num) +"'");
    }

    switch (conversionType) {
        case "d":
        case "n":
            return handleInteger(m, num, 10);
        case "x":
        case "X":
            return handleInteger(m, num, 16);
        case "o":
            return handleInteger(m, num, 8);
        case "b":
            return handleInteger(m, num, 2);
        case "c": {
            if (m[FMT.SIGN]) {
                throw new Sk.builtin.ValueError("Sign not allowed with integer format specifier 'c'");
            }
            if (m[FMT.ALT_FORM]) {
                throw new Sk.builtin.ValueError("Alternate form not allowed with integer format specifier 'c'");
            }
            if (m[FMT.COMMA]) {
                throw new Sk.builtin.ValueError("Cannot specify ',' with 'c'");
            }
            if (m[FMT.PRECISION]) {
                throw new Sk.builtin.ValueError("Cannot specify ',' with 'c'");
            }
            return handleWidth(m, String.fromCodePoint(Sk.builtin.asnum$(num)), "", true);
        };

        case "f":
        case "F":
        case "e":
        case "E":
        case "g":
        case "G": {
            if (m[FMT.ALT_FORM]){
                throw new Sk.builtin.ValueError("Alternate form (#) not allowed in float format specifier");
            }
            let convValue = Sk.builtin.asnum$(num);
            if (typeof convValue === "string") {
                convValue = Number(convValue);
            }
            if (convValue === Infinity) {
                return handleWidth(m, "inf", "", true);
            }
            if (convValue === -Infinity) {
                return handleWidth(m, "inf", "-", true);
            }
            if (isNaN(convValue)) {
                return handleWidth(m, "nan", "", true);
            }
            let neg = false;
            if (convValue < 0) {
                convValue = -convValue;
                neg = true;
            }
            let convName = ["toExponential", "toFixed", "toPrecision"]["efg".indexOf(conversionType.toLowerCase())];
            let precision = m[FMT.PRECISION] ? parseInt(m[FMT.PRECISION], 10) : 6;
            let result = (convValue)[convName](precision);
            if ("EFG".indexOf(conversionType) !== -1) {
                result = result.toUpperCase();
            }
            // Python's 'g' does not show trailing 0s
            if (conversionType.toLowerCase()==="g" || !m[FMT.CONVERSION_TYPE]) {
                let trailingZeros = result.match(/\.(\d*[1-9])?(0+)$/);
                if (trailingZeros) {
                    let [_, hasMoreDigits, zs] = trailingZeros;
                    // Python's default conversion shows at least one trailing zero
                    result = result.slice(0, hasMoreDigits ? -zs.length : -(zs.length+1));
                }
                if (result.indexOf(".") == -1 && !m[FMT.CONVERSION_TYPE]) {
                    result += ".0";
                }
            }
            if (conversionType.toLowerCase()==="e") {
                result = result.replace(/^([-+]?[0-9]*\.?[0-9]+[eE][-+]?)([0-9])?$/, "$10$2");
            }
            if (m[FMT.COMMA]){
                var parts = result.toString().split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                result = parts.join(".");
            }

            return handleWidth(m, result, signForNeg(m, neg), true);
        };

        case "%": {
            if (m[FMT.ALT_FORM]) {
                throw new Sk.builtin.ValueError("Alternate form (#) not allowed with format specifier '%'");
            }
            let convValue = Sk.builtin.asnum$(num);
            if (typeof convValue === "string") {
                convValue = Number(convValue);
            }
            if (convValue === Infinity) {
                return handleWidth(m, "inf%", "", true);
            }
            if (convValue === -Infinity) {
                return handleWidth(m, "inf%", "-", true);
            }
            if (isNaN(convValue)) {
                return handleWidth(m, "nan%", "", true);
            }
            let neg = false;
            if (convValue < 0) {
                convValue = -convValue;
                neg = true;
            }
            let precision = m[FMT.PRECISION] ? parseInt(m[FMT.PRECISION], 10) : 6;
            let result = (convValue*100.0).toFixed(precision) + "%";
            return handleWidth(m, result, signForNeg(m, neg), true);
        };

        default:
            throw new Sk.builtin.ValueError("Unknown format code '" + m[FMT.CONVERSION_TYPE] + "'");
    }
};

Sk.formatting.mkNumber__format__ = (isFractional) => function (format_spec) {
    if (!Sk.builtin.checkString(format_spec)) {
        throw new Sk.builtin.TypeError("format() argument 2 must be str, not " + Sk.abstr.typeName(format_spec));
    }
    return new Sk.builtin.str(formatNumber(this, format_spec.$jsstr(), isFractional));
};

function formatString(format_spec) {
    if (!Sk.builtin.checkString(format_spec)) {
        throw new Sk.builtin.TypeError("format() argument 2 must be str, not " + Sk.abstr.typeName(format_spec));
    }
    let m = format_spec.$jsstr().match(FORMAT_SPEC_REGEX);
    if (!m) {
        throw new Sk.builtin.ValueError("Invalid format specifier");
    }
    if (m[FMT.CONVERSION_TYPE] && m[FMT.CONVERSION_TYPE] !== "s") {
        throw new Sk.builtin.ValueError("Unknown format code '" + m[FMT.CONVERSION_TYPE] + "' for object of type 'str'");
    }

    if (m[FMT.SIGN]) {
        throw new Sk.builtin.ValueError("Sign not allowed in string format specifier");
    }

    if (m[FMT.ALT_FORM]) {
        throw new Sk.builtin.ValueError("Alternate form (#) not allowed with string format specifier");
    }

    if (m[FMT.COMMA]) {
        throw new Sk.builtin.ValueError("Cannot specify ',' with 's'");
    }

    let value = this.v;

    if (m[FMT.PRECISION]) {
        value = value.substring(0, m[FMT.PRECISION]);
    }

    return new Sk.builtin.str(handleWidth(m, value, "", false));
};

// str.format() implementation
// Parser reference: CPython Objects/stringlib/unicode_format.h.
const isDigit = /^\d+$/;

function format(args, kwargs) {
    // PEP 3101: a replacement field contains a name, optional !conversion,
    // and optional :format_spec. For {o.name!r:>{width}}, these are
    // "o.name", "r", and ">{width}". Resolve and convert the value, expand
    // the nested spec, then delegate to the value's __format__ method.
    kwargs = kwargs || [];
    const arg_dict = {};
    for (let i = 0; i < kwargs.length; i += 2) {
        arg_dict[kwargs[i]] = kwargs[i + 1];
    }
    // Like CPython's AutoNumber, outer fields and nested specs share numbering
    // state for this format call.
    // Named arguments do not advance the automatic index or select a mode.
    let currentMode;
    let index = 0;
    const manual = "manual field specification";
    const auto = "automatic field numbering";
    const checkMode = (newMode) => {
        if (currentMode === undefined) {
            currentMode = newMode;
        } else if (currentMode !== newMode) {
            throw new Sk.builtin.ValueError(`cannot switch from ${currentMode} to ${newMode}`);
        }
    };
    const getArg = (key) => {
        let rv;
        if (key === "") {
            checkMode(auto);
            key = index++;
            rv = args[key];
        } else if (isDigit.test(key)) {
            checkMode(manual);
            rv = args[parseInt(key, 10)];
        } else {
            rv = arg_dict[key];
            if (rv === undefined) {
                throw new Sk.builtin.KeyError(key);
            }
        }
        if (rv === undefined) {
            throw new Sk.builtin.IndexError(`Replacement index ${key} out of range for positional args tuple`);
        }
        return rv;
    };

    function getField(fieldName) {
        // Corresponds to CPython's get_field_object / FieldNameIterator_next.
        // Resolve the argument first, then follow its .attribute and [item] parts.
        let pos = fieldName.search(/[.\[]/);
        if (pos === -1) {
            return getArg(fieldName);
        }
        let value = getArg(fieldName.slice(0, pos));
        while (pos < fieldName.length) {
            const isAttribute = fieldName[pos++] === ".";
            const start = pos;
            if (isAttribute) {
                while (pos < fieldName.length && fieldName[pos] !== "." && fieldName[pos] !== "[") {
                    pos++;
                }
            } else {
                pos = fieldName.indexOf("]", pos);
            }
            if (pos === -1 || pos === start) {
                throw new Sk.builtin.ValueError("Empty attribute or missing ']' in format string");
            }
            const key = fieldName.slice(start, pos);
            if (isAttribute) {
                value = Sk.abstr.gattr(value, new Sk.builtin.str(key));
            } else {
                const item = isDigit.test(key) ? new Sk.builtin.int_(parseInt(key, 10)) : new Sk.builtin.str(key);
                value = Sk.abstr.objectGetItem(value, item, false);
                pos++;
                if (pos < fieldName.length && fieldName[pos] !== "." && fieldName[pos] !== "[") {
                    throw new Sk.builtin.ValueError("Only '.' or '[' may follow ']' in format field specifier");
                }
            }
        }
        return value;
    }

    function buildString(template, depth) {
        // Follows CPython's build_string / do_markup: MarkupIterator_next scans
        // literals and escaped braces; parse_field finds the field boundaries.
        if (depth === 0) {
            throw new Sk.builtin.ValueError("Max string recursion exceeded");
        }
        const output = [];
        let literalStart = 0;
        let pos = 0;
        while (pos < template.length) {
            const c = template[pos++];
            if (c !== "{" && c !== "}") {
                continue;
            }
            output.push(template.slice(literalStart, pos - 1));
            // Escaped braces are literal text and must not consume arguments.
            if (template[pos] === c) {
                output.push(c);
                literalStart = ++pos;
                continue;
            }
            if (c === "}") {
                throw new Sk.builtin.ValueError("Single '}' encountered in format string");
            }
            // parse_field: read the name, optional conversion and balanced spec.
            const fieldStart = pos;
            while (pos < template.length && "!:}".indexOf(template[pos]) === -1) {
                if (template[pos] === "{") {
                    throw new Sk.builtin.ValueError("unexpected '{' in field name");
                }
                if (template[pos] === "[") {
                    // Braces, ':' and '!' inside an item key are not delimiters.
                    pos = template.indexOf("]", pos + 1);
                    if (pos === -1) {
                        throw new Sk.builtin.ValueError("Missing ']' in format string");
                    }
                }
                pos++;
            }
            const fieldName = template.slice(fieldStart, pos);
            let conversion;
            if (template[pos] === "!") {
                conversion = template[++pos];
                pos++;
                if (template[pos] !== ":" && template[pos] !== "}") {
                    throw new Sk.builtin.ValueError("expected ':' after conversion specifier");
                }
            }
            let formatSpec = "";
            let needsExpanding = false;
            if (template[pos] === ":") {
                const specStart = ++pos;
                // Count all braces here, including escaped pairs. The recursive
                // scan interprets escapes after we have found the complete spec.
                let braces = 1;
                for (; pos < template.length; pos++) {
                    if (template[pos] === "{") {
                        needsExpanding = true;
                        braces++;
                    } else if (template[pos] === "}" && --braces === 0) {
                        break;
                    }
                }
                formatSpec = template.slice(specStart, pos);
            }
            if (template[pos] !== "}") {
                throw new Sk.builtin.ValueError("expected '}' before end of string");
            }
            pos++;
            // output_markup resolves and converts before expanding the spec,
            // then delegates to the value's __format__ method.
            let value = getField(fieldName);
            if (conversion === "s") {
                value = new Sk.builtin.str(value);
            } else if (conversion === "r") {
                value = Sk.builtin.repr(value);
            } else if (conversion === "a") {
                value = Sk.builtin.ascii(value);
            } else if (conversion !== undefined) {
                throw new Sk.builtin.ValueError("Unknown conversion specifier " + conversion);
            }
            // Nested specs share argument numbering, but only one level is allowed.
            if (needsExpanding) {
                formatSpec = buildString(formatSpec, depth - 1);
            }
            output.push(Sk.abstr.objectFormat(value, new Sk.builtin.str(formatSpec)).$jsstr());
            literalStart = pos;
        }
        output.push(template.slice(literalStart));
        return output.join("");
    }

    // CPython's do_string_format starts at depth 2: outer fields plus one
    // nested spec. build_string rejects further recursion.
    return new Sk.builtin.str(buildString(this.v, 2));
};

Sk.formatting.format = format;
Sk.formatting.formatString = formatString;
