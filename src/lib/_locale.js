// SPDX-License-Identifier: MIT AND Unicode-3.0
function $builtinmodule() {
    const { str: pyStr, int_: pyInt, tuple: pyTuple, TypeError, NotImplementedError } = Sk.builtin;
    const pyNone = Sk.builtin.none.none$;
    const mod = {
        __name__: new pyStr("_locale"),
    };
    const Error = (mod.Error = Sk.abstr.buildNativeClass("_locale.Error", {
        base: Sk.builtin.Exception,
        constructor: function Error(message) {
            Sk.builtin.Exception.call(this, message);
        },
    }));

    // These category values are internal to Skulpt, not host libc constants.
    const categories = ["LC_CTYPE", "LC_NUMERIC", "LC_TIME", "LC_COLLATE", "LC_MONETARY", "LC_MESSAGES", "LC_ALL"];
    categories.forEach((name, i) => { mod[name] = new pyInt(i); });
    const LC_NUMERIC = 1, LC_TIME = 2, LC_MONETARY = 4;
    mod.CHAR_MAX = new pyInt(127);
    const baseStrftime = Sk.global.strftime;
    // null keeps _strptime's existing C-format inference. data.formats below
    // instead supplies nl_langinfo; non-C locales give the parser explicit patterns.
    const cLocale = { name: "C", language: null, encoding: null, strftime: baseStrftime, formats: null };
    const locales = new Map([["C", cLocale]]);
    const current = { [LC_NUMERIC]: cLocale, [LC_TIME]: cLocale, [LC_MONETARY]: cLocale };

    function checkCategory(category) {
        const n = Sk.misceval.asIndexOrThrow(category);
        if (n < 0 || n >= categories.length) {
            throw new Error("invalid locale category");
        }
        if (![LC_NUMERIC, LC_TIME, LC_MONETARY].includes(n)) {
            throw new NotImplementedError("locale only supports LC_TIME, LC_NUMERIC and LC_MONETARY in Skulpt");
        }
        return n;
    }

    function localeName(value) {
        if (value instanceof pyTuple) {
            if (value.v.length !== 2) {
                throw new TypeError("locale must be a string or a (language, encoding) pair");
            }
            const [language, encoding] = value.v;
            if ((language !== pyNone && !Sk.builtin.checkString(language)) ||
                (encoding !== pyNone && !Sk.builtin.checkString(encoding))) {
                throw new TypeError("locale pair must contain strings or None");
            }
            return language === pyNone ? "C" : language.toString();
        }
        if (!Sk.builtin.checkString(value)) {
            throw new TypeError("locale must be a string or a (language, encoding) pair");
        }
        return value.toString();
    }

    function createLocale(tag) {
        const options = { timeZone: "UTC", calendar: "gregory", numberingSystem: "latn" };
        const formatter = (fields) => new Intl.DateTimeFormat(tag, Object.assign({}, options, fields));
        const sample = new Date(Date.UTC(1999, 2, 17, 22, 44, 55));
        const names = (field, width, dates) => {
            const fmt = formatter({ [field]: width });
            return dates.map((date) => fmt.formatToParts(date).find((part) => part.type === field).value);
        };
        const months = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2001, i, 1)));
        // January 7, 2001 was a Sunday; strftime's arrays start on Sunday.
        const days = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2001, 0, 7 + i)));
        const ampm = [];
        const periodFormatter = formatter({ hour: "numeric", hour12: true });
        [1, 22].forEach((hour) => {
            const parts = periodFormatter.formatToParts(new Date(Date.UTC(2001, 0, 1, hour)));
            ampm.push(parts.find((part) => part.type === "dayPeriod").value);
        });

        // Store real strftime patterns so formatting and strptime use the same
        // field order and literals. Numeric fields retain strftime's padding.
        const dateFields = { year: "numeric", month: "2-digit", day: "2-digit" };
        const timeFields = { hour: "2-digit", minute: "2-digit", second: "2-digit" };
        function pattern(fields) {
            const fmt = formatter(fields);
            const directives = {
                year: "%Y", month: "%m", day: "%d", minute: "%M", second: "%S", dayPeriod: "%p",
                hour: fmt.resolvedOptions().hour12 ? "%I" : "%H",
            };
            return fmt.formatToParts(sample).map((part) => {
                return part.type === "literal" ? part.value.replace(/%/g, "%%") : directives[part.type];
            }).join("");
        }
        const formats = {
            x: pattern(dateFields),
            X: pattern(timeFields),
            c: pattern(Object.assign({}, dateFields, timeFields)),
            D: "%m/%d/%y", F: "%Y-%m-%d", R: "%H:%M",
            r: pattern(Object.assign({}, timeFields, { hour12: true })), T: "%H:%M:%S", v: "%e-%b-%Y",
        };
        const data = {
            days: names("weekday", "long", days),
            shortDays: names("weekday", "short", days),
            months: names("month", "long", months),
            shortMonths: names("month", "short", months),
            AM: ampm[0], PM: ampm[1], am: ampm[0].toLowerCase(), pm: ampm[1].toLowerCase(), formats,
        };
        const language = tag.replace(/-/g, "_");
        return { name: language + ".UTF-8", tag, language, encoding: "UTF-8", strftime: baseStrftime.localize(data), formats, data };
    }

    // Current tender currencies by territory, derived from Unicode CLDR 48
    // currencyData.json as of 2026-10-08 (first current tender entry).
    // https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-core/supplemental/currencyData.json
    // Copyright © 1991-2026 Unicode, Inc.; full Unicode notice in LICENSE.
    const regionCurrencies = {
        "AC": "SHP", "AD": "EUR", "AE": "AED", "AF": "AFN", "AG": "XCD", "AI": "XCD",
        "AL": "ALL", "AM": "AMD", "AO": "AOA", "AR": "ARS", "AS": "USD", "AT": "EUR",
        "AU": "AUD", "AW": "AWG", "AX": "EUR", "AZ": "AZN", "BA": "BAM", "BB": "BBD",
        "BD": "BDT", "BE": "EUR", "BF": "XOF", "BG": "EUR", "BH": "BHD", "BI": "BIF",
        "BJ": "XOF", "BL": "EUR", "BM": "BMD", "BN": "BND", "BO": "BOB", "BQ": "USD",
        "BR": "BRL", "BS": "BSD", "BT": "BTN", "BV": "NOK", "BW": "BWP", "BY": "BYN",
        "BZ": "BZD", "CA": "CAD", "CC": "AUD", "CD": "CDF", "CF": "XAF", "CG": "XAF",
        "CH": "CHF", "CI": "XOF", "CK": "NZD", "CL": "CLP", "CM": "XAF", "CN": "CNY",
        "CO": "COP", "CR": "CRC", "CU": "CUP", "CV": "CVE", "CW": "XCG", "CX": "AUD",
        "CY": "EUR", "CZ": "CZK", "DE": "EUR", "DG": "USD", "DJ": "DJF", "DK": "DKK",
        "DM": "XCD", "DO": "DOP", "DZ": "DZD", "EA": "EUR", "EC": "USD", "EE": "EUR",
        "EG": "EGP", "EH": "MAD", "ER": "ERN", "ES": "EUR", "ET": "ETB", "EU": "EUR",
        "FI": "EUR", "FJ": "FJD", "FK": "FKP", "FM": "USD", "FO": "DKK", "FR": "EUR",
        "GA": "XAF", "GB": "GBP", "GD": "XCD", "GE": "GEL", "GF": "EUR", "GG": "GBP",
        "GH": "GHS", "GI": "GIP", "GL": "DKK", "GM": "GMD", "GN": "GNF", "GP": "EUR",
        "GQ": "XAF", "GR": "EUR", "GS": "GBP", "GT": "GTQ", "GU": "USD", "GW": "XOF",
        "GY": "GYD", "HK": "HKD", "HM": "AUD", "HN": "HNL", "HR": "EUR", "HT": "HTG",
        "HU": "HUF", "IC": "EUR", "ID": "IDR", "IE": "EUR", "IL": "ILS", "IM": "GBP",
        "IN": "INR", "IO": "USD", "IQ": "IQD", "IR": "IRR", "IS": "ISK", "IT": "EUR",
        "JE": "GBP", "JM": "JMD", "JO": "JOD", "JP": "JPY", "KE": "KES", "KG": "KGS",
        "KH": "KHR", "KI": "AUD", "KM": "KMF", "KN": "XCD", "KP": "KPW", "KR": "KRW",
        "KW": "KWD", "KY": "KYD", "KZ": "KZT", "LA": "LAK", "LB": "LBP", "LC": "XCD",
        "LI": "CHF", "LK": "LKR", "LR": "LRD", "LS": "ZAR", "LT": "EUR", "LU": "EUR",
        "LV": "EUR", "LY": "LYD", "MA": "MAD", "MC": "EUR", "MD": "MDL", "ME": "EUR",
        "MF": "EUR", "MG": "MGA", "MH": "USD", "MK": "MKD", "ML": "XOF", "MM": "MMK",
        "MN": "MNT", "MO": "MOP", "MP": "USD", "MQ": "EUR", "MR": "MRU", "MS": "XCD",
        "MT": "EUR", "MU": "MUR", "MV": "MVR", "MW": "MWK", "MX": "MXN", "MY": "MYR",
        "MZ": "MZN", "NA": "NAD", "NC": "XPF", "NE": "XOF", "NF": "AUD", "NG": "NGN",
        "NI": "NIO", "NL": "EUR", "NO": "NOK", "NP": "NPR", "NR": "AUD", "NU": "NZD",
        "NZ": "NZD", "OM": "OMR", "PA": "PAB", "PE": "PEN", "PF": "XPF", "PG": "PGK",
        "PH": "PHP", "PK": "PKR", "PL": "PLN", "PM": "EUR", "PN": "NZD", "PR": "USD",
        "PS": "ILS", "PT": "EUR", "PW": "USD", "PY": "PYG", "QA": "QAR", "RE": "EUR",
        "RO": "RON", "RS": "RSD", "RU": "RUB", "RW": "RWF", "SA": "SAR", "SB": "SBD",
        "SC": "SCR", "SD": "SDG", "SE": "SEK", "SG": "SGD", "SH": "SHP", "SI": "EUR",
        "SJ": "NOK", "SK": "EUR", "SL": "SLE", "SM": "EUR", "SN": "XOF", "SO": "SOS",
        "SR": "SRD", "SS": "SSP", "ST": "STN", "SV": "USD", "SX": "XCG", "SY": "SYP",
        "SZ": "SZL", "TA": "GBP", "TC": "USD", "TD": "XAF", "TF": "EUR", "TG": "XOF",
        "TH": "THB", "TJ": "TJS", "TK": "NZD", "TL": "USD", "TM": "TMT", "TN": "TND",
        "TO": "TOP", "TR": "TRY", "TT": "TTD", "TV": "AUD", "TW": "TWD", "TZ": "TZS",
        "UA": "UAH", "UG": "UGX", "UM": "USD", "US": "USD", "UY": "UYU", "UZ": "UZS",
        "VA": "EUR", "VC": "XCD", "VE": "VES", "VG": "USD", "VI": "USD", "VN": "VND",
        "VU": "VUV", "WF": "XPF", "WS": "WST", "XK": "EUR", "YE": "YER", "YT": "EUR",
        "ZA": "ZAR", "ZM": "ZMW", "ZW": "ZWG",
    };

    function resolveLocale(value, category = LC_TIME) {
        let name = localeName(value);
        if (name === "C" || name === "POSIX") {
            return cLocale;
        }
        if (name.includes("@")) {
            throw new Error("POSIX locale modifiers are not supported: " + name);
        }
        if (typeof Intl === "undefined" || !Intl.DateTimeFormat ||
            (category !== LC_TIME && !Intl.NumberFormat)) {
            throw new NotImplementedError("locale requires Intl for non-C locales");
        }
        if (name === "") {
            name = new Intl.DateTimeFormat().resolvedOptions().locale;
        }
        // Encodings do not apply to JS strings. POSIX modifiers are unsupported.
        const tag = name.split(".")[0].replace(/_/g, "-");
        let canonical;
        try {
            const Constructor = category === LC_TIME ? Intl.DateTimeFormat : Intl.NumberFormat;
            const supported = Constructor.supportedLocalesOf([tag]);
            if (!supported.length) {
                throw new Error("unsupported locale setting: " + name);
            }
            canonical = supported[0];
        } catch (err) {
            if (err instanceof RangeError) {
                throw new Error("unsupported locale setting: " + name);
            }
            throw err;
        }
        if (!locales.has(canonical)) {
            locales.set(canonical, createLocale(canonical));
        }
        return locales.get(canonical);
    }

    function numberConventions(parts) {
        const partValue = (type) => {
            const part = parts.find((part) => part.type === type);
            return part ? part.value : "";
        };
        // Ignore the leftmost (partial) group. Most locales use 3 repeatedly;
        // Indian grouping uses a final group of 3 and then groups of 2.
        const sizes = parts.filter((part) => part.type === "integer").map((part) => part.value.length).reverse();
        const separator = partValue("group");
        const grouping = separator ? (sizes[0] === sizes[1] ? [sizes[0], 0] : [sizes[0], sizes[1], 0]) : [];
        return { decimal_point: partValue("decimal"), thousands_sep: separator, grouping };
    }

    function numericConventions(selected) {
        if (!selected.numeric) {
            selected.numeric = selected === cLocale ? { decimal_point: ".", thousands_sep: "", grouping: [] } :
                numberConventions(new Intl.NumberFormat(selected.tag, {
                    numberingSystem: "latn", minimumFractionDigits: 1, maximumFractionDigits: 1,
                }).formatToParts(1234567890123.5));
        }
        return selected.numeric;
    }

    function monetaryConventions(selected) {
        if (selected.monetary) {
            return selected.monetary;
        }
        if (selected === cLocale) {
            selected.monetary = {
                int_curr_symbol: "", currency_symbol: "", mon_decimal_point: "", mon_thousands_sep: "", mon_grouping: [],
                positive_sign: "", negative_sign: "", int_frac_digits: 127, frac_digits: 127,
                p_cs_precedes: 127, p_sep_by_space: 127, n_cs_precedes: 127, n_sep_by_space: 127,
                p_sign_posn: 127, n_sign_posn: 127,
            };
            return selected.monetary;
        }
        if (!Intl.Locale) {
            throw new NotImplementedError("LC_MONETARY requires Intl.Locale");
        }
        const region = new Intl.Locale(selected.tag).maximize().region;
        const currency = regionCurrencies[region];
        if (!currency) {
            throw new Error("no default currency is available for locale " + selected.name);
        }
        const fmt = new Intl.NumberFormat(selected.tag, { style: "currency", currency, numberingSystem: "latn" });
        const positive = fmt.formatToParts(1234567890123.5);
        const negative = fmt.formatToParts(-1234567890123.5);
        // Even currencies without fractional units have a decimal separator
        // for format_string(..., monetary=True).
        const conventions = numberConventions(new Intl.NumberFormat(selected.tag, {
            style: "currency", currency, numberingSystem: "latn", minimumFractionDigits: 1, maximumFractionDigits: 1,
        }).formatToParts(1234567890123.5));
        // localeconv encodes sign placement: 1 before everything, 2 after
        // everything, 3 before the currency symbol, 4 after the symbol.
        // Compute the same fields for positive (p) and negative (n) amounts.
        function currencyLayoutConventions(parts, prefix) {
            const currencyIndex = parts.findIndex((part) => part.type === "currency");
            const amountStart = parts.findIndex((part) => part.type === "integer");
            let amountEnd = amountStart;
            parts.forEach((part, i) => {
                if (["integer", "group", "decimal", "fraction"].includes(part.type)) {
                    amountEnd = i;
                }
            });
            const minusIndex = parts.findIndex((part) => part.type === "minusSign");
            let position = 1;
            if (minusIndex > Math.max(currencyIndex, amountEnd)) {
                position = 2;
            } else if (minusIndex > Math.min(currencyIndex, amountStart)) {
                position = minusIndex < currencyIndex ? 3 : 4;
            }
            const gap = currencyIndex < amountStart
                ? parts.slice(currencyIndex + 1, amountStart)
                : parts.slice(amountEnd + 1, currencyIndex);
            return {
                [prefix + "_cs_precedes"]: Number(currencyIndex < amountStart),
                [prefix + "_sep_by_space"]: Number(gap.some((part) => part.type === "literal" && /\s/.test(part.value))),
                [prefix + "_sign_posn"]: position,
            };
        }
        selected.monetary = Object.assign({
            int_curr_symbol: currency + " ",
            currency_symbol: positive.find((part) => part.type === "currency").value,
            mon_decimal_point: conventions.decimal_point,
            mon_thousands_sep: conventions.thousands_sep,
            mon_grouping: conventions.grouping,
            positive_sign: "",
            negative_sign: negative.find((part) => part.type === "minusSign").value,
            int_frac_digits: fmt.resolvedOptions().maximumFractionDigits,
            frac_digits: fmt.resolvedOptions().maximumFractionDigits,
        }, currencyLayoutConventions(positive, "p"), currencyLayoutConventions(negative, "n"));
        return selected.monetary;
    }

    function timeData() {
        const selected = current[LC_TIME];
        if (!selected.data) {
            // Preserve the existing C formatter without depending on Intl.
            const names = (format, count, date) => Array.from({ length: count }, (_, i) => baseStrftime(format, date(i)));
            selected.data = {
                days: names("%A", 7, (i) => new Date(2001, 0, 7 + i)),
                shortDays: names("%a", 7, (i) => new Date(2001, 0, 7 + i)),
                months: names("%B", 12, (i) => new Date(2001, i, 1)),
                shortMonths: names("%b", 12, (i) => new Date(2001, i, 1)),
                AM: baseStrftime("%p", new Date(2001, 0, 1, 1)),
                PM: baseStrftime("%p", new Date(2001, 0, 1, 22)),
                // C %c includes an implicit host zone. Keep it composite so
                // naive datetime.strftime does not suppress an explicit %Z.
                formats: { x: "%m/%d/%y", X: "%I:%M:%S %p", c: "%c", r: "%I:%M:%S %p" },
            };
        }
        return selected.data;
    }

    // Constants are opaque identifiers, as in CPython; host libc values differ.
    const langinfo = new Map();
    function addInfo(name, getter) {
        const id = 100 + langinfo.size;
        mod[name] = new pyInt(id);
        langinfo.set(id, getter);
    }
    for (const [name, format] of [["D_FMT", "x"], ["T_FMT", "X"], ["D_T_FMT", "c"], ["T_FMT_AMPM", "r"]]) {
        addInfo(name, () => timeData().formats[format]);
    }
    addInfo("AM_STR", () => timeData().AM);
    addInfo("PM_STR", () => timeData().PM);
    for (const [prefix, field, count] of [["DAY", "days", 7], ["ABDAY", "shortDays", 7],
        ["MON", "months", 12], ["ABMON", "shortMonths", 12]]) {
        for (let i = 0; i < count; i++) {
            addInfo(prefix + "_" + (i + 1), () => timeData()[field][i]);
        }
    }
    addInfo("RADIXCHAR", () => numericConventions(current[LC_NUMERIC]).decimal_point);
    addInfo("THOUSEP", () => numericConventions(current[LC_NUMERIC]).thousands_sep);

    Sk.abstr.setUpModuleMethods("_locale", mod, {
        setlocale: {
            $meth(category, locale) {
                const n = checkCategory(category);
                if (locale !== pyNone) {
                    const selected = resolveLocale(locale, n);
                    if (n === LC_NUMERIC) {
                        numericConventions(selected);
                    } else if (n === LC_MONETARY) {
                        monetaryConventions(selected);
                    }
                    current[n] = selected;
                }
                return new pyStr(current[n].name);
            },
            $flags: { NamedArgs: ["category", "locale"], Defaults: [pyNone] },
        },
        getlocale: {
            $meth(category) {
                const selected = current[checkCategory(category)];
                return new pyTuple([selected.language === null ? pyNone : new pyStr(selected.language),
                    selected.encoding === null ? pyNone : new pyStr(selected.encoding)]);
            },
            $flags: { NamedArgs: ["category"], Defaults: [mod.LC_CTYPE] },
        },
        localeconv: {
            $meth() {
                // remapToPy makes fresh lists/dicts; callers cannot mutate the cache.
                return Sk.ffi.remapToPy(Object.assign({}, numericConventions(current[LC_NUMERIC]),
                    monetaryConventions(current[LC_MONETARY])));
            },
            $flags: { NoArgs: true },
        },
        nl_langinfo: {
            $meth(item) {
                const getter = langinfo.get(Sk.misceval.asIndexOrThrow(item));
                if (!getter) {
                    throw new Sk.builtin.ValueError("unsupported nl_langinfo constant");
                }
                return new pyStr(getter());
            },
            $flags: { OneArg: true },
        },
    });

    // Internal JS entry points shared by time, calendar and _strptime. Keep
    // them out of the Python module's enumerated namespace.
    Object.defineProperties(mod, {
        $getLocale: { value: () => current[LC_TIME] },
        $strftime: { value: (format, date) => current[LC_TIME].strftime(format, date) },
        $withLocale: { value: (value, fn) => {
            const saved = current[LC_TIME];
            current[LC_TIME] = resolveLocale(value);
            try {
                return fn();
            } finally {
                current[LC_TIME] = saved;
            }
        } },
    });
    return mod;
}
