function $builtinmodule() {
    const pyInt = Sk.builtin.int_;
    const pyNone = Sk.builtin.none.none$;
    const pyStr = Sk.builtin.str;
    const pyTuple = Sk.builtin.tuple;
    const pyCallOrSuspend = Sk.misceval.callsimOrSuspendArray;

    const { isTrue, richCompareBool, chain } = Sk.misceval;
    const { typeName, setUpModuleMethods, buildNativeClass } = Sk.abstr;
    const { TypeError, ValueError, KeyError, IndexError, checkString, asnum$ } = Sk.builtin;
    const { remapToPy, remapToJs } = Sk.ffi;
    const { getAttr, setAttr } = Sk.generic;
    const chainOrSuspend = chain;

    const is_digit = /^[0-9]+$/;
    function _as_integer(dtstr) {
        if (!is_digit.test(dtstr)) {
            throw new ValueError(`invalid literal for int() with base 10: '${dtstr}'`);
        }
        return parseInt(dtstr);
    }

    const _regex_chars = /([\\.^$*+?\(\){}\[\]|])/g;
    const _space_chars = /\s+/g;

    let time_mod = Sk.importModule("time", false, true);
    let dt_mod = Sk.importModule("datetime", false, true);

    const _set_up_dependencies = chainOrSuspend(
        dt_mod,
        (dt) => {
            dt_mod = dt.$d;
            return time_mod;
        },
        (tm) => {
            time_mod = tm.$d;
        }
    );

    return chainOrSuspend(_set_up_dependencies, () => {
        // some helper functions

        function _is_leap(year) {
            return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        }

        function _strftime(date) {
            return (fmt) => date.$strftime(fmt).toString().toLowerCase();
        }

        function _strftime_timetuple(fmt, timetuple) {
            return time_mod.strftime
                .tp$call([new pyStr(fmt), timetuple])
                .toString()
                .toLowerCase();
        }

        const str_fromord = new pyStr("fromordinal");
        function _fromordinal(n) {
            return datetime_date.tp$getattr(str_fromord).tp$call([new pyInt(n)]);
        }

        function _struct_time(arr) {
            return time_mod.struct_time.tp$call([new pyTuple(arr.map((x) => new pyInt(x)))]);
        }

        function _localized_month() {
            const _months = [() => ""];
            for (let i = 0; i < 12; i++) {
                const month = new datetime_date(2001, i + 1, 1);
                _months.push(_strftime(month));
            }
            return _months;
        }

        function _localized_day() {
            const _days = [];
            // January 1, 2001, was a Monday.
            for (let i = 0; i < 7; i++) {
                const day = new datetime_date(2001, 1, i + 1);
                _days.push(_strftime(day));
            }
            return _days;
        }

        function _check_lang_consistency() {
            // todo this will check if the locale lang has changed
            return true;
        }

        // start of the module

        const mod = { __name__: new pyStr("_strptime") };

        const datetime_date = dt_mod.date;
        const datetime_timedelta = dt_mod.timedelta;
        const datetime_timezone = dt_mod.timezone;

        function _getlang() {
            // todo this should check the current locale info but locale not yet implemented
            return [pyNone, pyNone];
        }

        class LocaleTime {
            constructor() {
                this.lang = _getlang();
                this.__calc_weekday();
                this.__calc_month();
                this.__calc_am_pm();
                this.__calc_timezone();
                this.__calc_date_time();
            }
            __calc_weekday() {
                this.a_weekday = _localized_day().map((d) => d("%a"));
                this.f_weekday = _localized_day().map((d) => d("%A"));
            }
            __calc_month() {
                this.a_month = _localized_month().map((m) => m("%b"));
                this.f_month = _localized_month().map((m) => m("%B"));
            }
            __calc_am_pm() {
                const am_pm = [];
                [1, 22].forEach((hour) => {
                    const time_tuple = _struct_time([1999, 3, 17, hour, 44, 55, 2, 76, 0]);
                    const p = _strftime_timetuple("%p", time_tuple);
                    am_pm.push(p);
                });
                this.am_pm = am_pm;
            }
            __calc_date_time() {
                // Use (1999,3,17,22,44,55,2,76,0) for magic date because
                // the amount of overloaded numbers is minimized
                const time_tuple = _struct_time([1999, 3, 17, 22, 44, 55, 2, 76, 0]);
                const date_time = [pyNone, pyNone, pyNone];
                date_time[0] = _strftime_timetuple("%c", time_tuple);
                date_time[1] = _strftime_timetuple("%x", time_tuple);
                date_time[2] = _strftime_timetuple("%X", time_tuple);
                const replacement_pairs = [
                    ["%", "%%"],
                    [this.f_weekday[2], "%A"],
                    [this.f_month[3], "%B"],
                    [this.a_weekday[2], "%a"],
                    [this.a_month[3], "%b"],
                    [this.am_pm[1], "%p"],
                    ["1999", "%Y"],
                    ["99", "%y"],
                    ["22", "%H"],
                    ["44", "%M"],
                    ["55", "%S"],
                    ["76", "%j"],
                    ["17", "%d"],
                    ["03", "%m"],
                    ["3", "%m"],
                    // # '3' needed for when no leading
                    ["2", "%w"],
                    ["10", "%I"],
                ];
                replacement_pairs.push(...this.timezone.flat().map((tz) => [tz, "%Z"]));
                [
                    [0, "%c"],
                    [1, "%x"],
                    [2, "%X"],
                ].forEach(([offset, directive]) => {
                    let current_format = date_time[offset];
                    replacement_pairs.forEach(([_old, _new]) => {
                        if (_old) {
                            current_format = current_format.replace(_old, _new);
                        }
                    });
                    const time_tuple = _struct_time([1999, 1, 3, 1, 1, 1, 6, 3, 0]);
                    let U_W;
                    if (_strftime_timetuple(directive, time_tuple).includes("00")) {
                        U_W = "%W";
                    } else {
                        U_W = "%U";
                    }
                    date_time[offset] = current_format.replace("11", U_W);
                });

                this.LC_date_time = date_time[0];
                this.LC_date = date_time[1];
                this.LC_time = date_time[2];
            }
            __calc_timezone() {
                try {
                    time_mod.tzset.tp$call([]);
                    // currently NotImplementedError
                } catch {}
                this.tzname = time_mod.tzname.v.map((x) => x.toString());
                this.daylight = asnum$(time_mod.daylight);
                const no_saving = [this.tzname[1].toLowerCase(), "utc", "gmt"];
                let has_saving;
                if (this.daylight) {
                    has_saving = [this.tzname[1].toLowerCase()];
                } else {
                    has_saving = [];
                }
                this.timezone = [no_saving, has_saving];
            }
        }

        class TimeRE {
            constructor(locale_time = null) {
                this.locale_time = locale_time || new LocaleTime();
                Object.assign(this, {
                    d: "(?<d>3[0-1]|[1-2]\\d|0[1-9]|[1-9]| [1-9])",
                    f: "(?<f>[0-9]{1,6})",
                    H: "(?<H>2[0-3]|[0-1]\\d|\\d)",
                    I: "(?<I>1[0-2]|0[1-9]|[1-9])",
                    G: "(?<G>\\d\\d\\d\\d)",
                    j: "(?<j>36[0-6]|3[0-5]\\d|[1-2]\\d\\d|0[1-9]\\d|00[1-9]|[1-9]\\d|0[1-9]|[1-9])",
                    m: "(?<m>1[0-2]|0[1-9]|[1-9])",
                    M: "(?<M>[0-5]\\d|\\d)",
                    S: "(?<S>6[0-1]|[0-5]\\d|\\d)",
                    U: "(?<U>5[0-3]|[0-4]\\d|\\d)",
                    w: "(?<w>[0-6])",
                    u: "(?<u>[1-7])",
                    V: "(?<V>5[0-3]|0[1-9]|[1-4]\\d|\\d)",
                    // # W is set below by using 'U'
                    y: "(?<y>\\d\\d)",
                    // #XXX: Does 'Y' need to worry about having less or more than
                    // #     4 digits?
                    Y: "(?<Y>\\d\\d\\d\\d)",
                    z: "(?<z>[+-]\\d\\d:?[0-5]\\d(:?[0-5]\\d(\\.\\d{1,6})?)?|Z)",
                    A: this.__seqToRE(this.locale_time.f_weekday, "A"),
                    a: this.__seqToRE(this.locale_time.a_weekday, "a"),
                    B: this.__seqToRE(this.locale_time.f_month.slice(1), "B"),
                    b: this.__seqToRE(this.locale_time.a_month.slice(1), "b"),
                    p: this.__seqToRE(this.locale_time.am_pm, "p"),
                    Z: this.__seqToRE(this.locale_time.timezone.flat(), "Z"),
                    "%": "%",
                });
                this.W = this.U.replace("U", "W");
                this.x = this.pattern(this.locale_time.LC_date);
                this.X = this.pattern(this.locale_time.LC_time);
                this.c = this.pattern(this.locale_time.LC_date_time);
            }
            __seqToRE(to_convert, directive) {
                to_convert = to_convert.slice(0).sort((a, b) => b.length - a.length);
                if (to_convert.every((value) => value === "")) {
                    return "";
                }
                let regex = to_convert.map((x) => x /*reescape x*/).join("|");
                return `(?<${directive}>${regex})`;
            }
            pattern(format) {
                let processed_format = "";

                format = format.replace(_regex_chars, "\\$1");
                format = format.replace(_space_chars, "\\s+");

                while (format.includes("%")) {
                    const directive_index = format.indexOf("%") + 1;
                    const this_format = this[format[directive_index]];
                    if (this_format === undefined) {
                        throw new KeyError(format[directive_index]);
                    }
                    processed_format = `${processed_format}${format.slice(0, directive_index - 1)}${this_format}`;
                    format = format.slice(directive_index + 1);
                }
                return processed_format + format;
            }
            compile(format) {
                return new RegExp("^" + this.pattern(format), "i");
            }
        }

        let _TimeRE_cache = new TimeRE();
        const _CACHE_MAX_SIZE = 5;
        let _regex_cache = {};

        function _calc_julian_from_U_or_W(year, week_of_year, day_of_week, week_starts_Mon) {
            let first_weekday = (new datetime_date(year, 1, 1).$toOrdinal() + 6) % 7;

            if (!week_starts_Mon) {
                first_weekday = (first_weekday + 1) % 7;
                day_of_week = (day_of_week + 1) % 7;
            }
            const week_0_length = (7 - first_weekday) % 7;
            if (week_of_year === 0) {
                return 1 + day_of_week - first_weekday;
            } else {
                const days_to_week = week_0_length + 7 * (week_of_year - 1);
                return 1 + days_to_week + day_of_week;
            }
        }

        function _calc_julian_from_V(iso_year, iso_week, iso_weekday) {
            const correction = (new datetime_date(iso_year, 1, 4).$toOrdinal() % 7 || 7) + 3;
            let ordinal = iso_week * 7 + iso_weekday - correction;
            if (ordinal < 1) {
                ordinal += new datetime_date(iso_year, 1, 1).$toOrdinal();
                iso_year -= 1;
                ordinal -= new datetime_date(iso_year, 1, 1).$toOrdinal();
            }
            return [iso_year, ordinal];
        }

        function _strptime(data_string, format = "%a %b %d %H:%M:%S %Y") {
            function _checkString(str, i) {
                if (typeof str !== "string" && !checkString(str)) {
                    throw new TypeError(`strptime() argument ${i} must be a str, not '${typeName(str)}'`);
                }
            }
            _checkString(data_string, 0);
            _checkString(format, 1);

            data_string = data_string.toString();
            format = format.toString();
            let locale_time = _TimeRE_cache.locale_time;

            // do something with TimeRE
            let format_regex;
            if (!_check_lang_consistency()) {
                _regex_cache = {};
                _TimeRE_cache = new TimeRE();
                locale_time = _TimeRE_cache.locale_time;
            }
            if (Object.keys(_regex_cache).length > _CACHE_MAX_SIZE) {
                _regex_cache = {};
            }
            format_regex = _regex_cache[format];
            if (format_regex === undefined) {
                try {
                    format_regex = _TimeRE_cache.compile(format);
                } catch (err) {
                    if (err instanceof KeyError) {
                        let bad_directive = err.args.v[0];
                        if (bad_directive == "\\") {
                            bad_directive = "%";
                        }
                        throw new ValueError(`'${bad_directive}' is a bad directive in format '${format}'`);
                    } else if (err instanceof IndexError) {
                        throw new ValueError("stray %% in format '" + format + "'");
                    }
                    throw err;
                }
            }

            const found = data_string.match(format_regex);

            if (found === null) {
                throw new ValueError(`time data '${data_string}' does not match format '${format}'`);
            }

            if (data_string.length !== found[0].length) {
                throw new ValueError(`unconverted data remains: ${data_string.slice(found[0].length)}`);
            }

            let iso_year = pyNone,
                year = pyNone;
            let month = 1,
                day = 1;
            let hour = 0,
                minute = 0,
                second = 0,
                fraction = 0;
            let tz = -1;
            let gmtoff = pyNone;
            let gmtoff_fraction = 0;

            let iso_week = pyNone,
                week_of_year = pyNone;
            let week_of_year_start = pyNone;
            let weekday = pyNone,
                julian = pyNone;
            let found_dict = found.groups || {};
            Object.keys(found_dict).forEach((group_key) => {
                if (found_dict[group_key] === undefined) {
                    return;
                }
                if (group_key === "y") {
                    year = _as_integer(found_dict["y"]);
                    if (year <= 68) {
                        year += 2000;
                    } else {
                        year += 1900;
                    }
                } else if (group_key === "Y") {
                    year = _as_integer(found_dict["Y"]);
                } else if (group_key === "G") {
                    iso_year = _as_integer(found_dict["G"]);
                } else if (group_key === "m") {
                    month = _as_integer(found_dict["m"]);
                } else if (group_key === "B") {
                    month = locale_time.f_month.indexOf(found_dict["B"].toLowerCase());
                } else if (group_key === "b") {
                    month = locale_time.a_month.indexOf(found_dict["b"].toLowerCase());
                } else if (group_key === "d") {
                    day = _as_integer(found_dict["d"]);
                } else if (group_key === "H") {
                    hour = _as_integer(found_dict["H"]);
                } else if (group_key === "H") {
                    hour = _as_integer(found_dict["H"]);
                } else if (group_key === "I") {
                    hour = _as_integer(found_dict["I"]);
                    const ampm = (found_dict["p"] || "").toLowerCase();
                    // # If there was no AM/PM indicator, we'll treat this like AM
                    if (["", locale_time.am_pm[0]].includes(ampm)) {
                        // # We're in AM so the hour is correct unless we're
                        // # looking at 12 midnight.
                        // # 12 midnight === 12 AM === hour 0
                        if (hour === 12) {
                            hour = 0;
                        }
                    } else if (ampm === locale_time.am_pm[1]) {
                        // # We're in PM so we need to add 12 to the hour unless
                        // # we're looking at 12 noon.
                        // # 12 noon === 12 PM === hour 12
                        if (hour !== 12) {
                            hour += 12;
                        }
                    }
                } else if (group_key === "M") {
                    minute = _as_integer(found_dict["M"]);
                } else if (group_key === "S") {
                    second = _as_integer(found_dict["S"]);
                } else if (group_key === "f") {
                    let s = found_dict["f"];
                    // # Pad to always return microseconds.
                    s += "0".repeat(6 - s.length);
                    fraction = _as_integer(s);
                } else if (group_key === "A") {
                    weekday = locale_time.f_weekday.indexOf(found_dict["A"].toLowerCase());
                } else if (group_key === "a") {
                    weekday = locale_time.a_weekday.indexOf(found_dict["a"].toLowerCase());
                } else if (group_key === "w") {
                    weekday = _as_integer(found_dict["w"]);
                    if (weekday === 0) {
                        weekday = 6;
                    } else {
                        weekday -= 1;
                    }
                } else if (group_key === "u") {
                    weekday = _as_integer(found_dict["u"]);
                    weekday -= 1;
                } else if (group_key === "j") {
                    julian = _as_integer(found_dict["j"]);
                } else if (["U", "W"].includes(group_key)) {
                    week_of_year = _as_integer(found_dict[group_key]);
                    if (group_key === "U") {
                        // # U starts week on Sunday.
                        week_of_year_start = 6;
                    } else {
                        // # W starts week on Monday.
                        week_of_year_start = 0;
                    }
                } else if (group_key === "V") {
                    iso_week = _as_integer(found_dict["V"]);
                } else if (group_key === "z") {
                    let z = found_dict["z"];
                    if (z === "Z") {
                        gmtoff = 0;
                    } else {
                        if (z[3] === ":") {
                            z = z.slice(0, 3) + z.slice(4);
                            if (z.length > 5) {
                                if (z[5] !== ":") {
                                    const msg = `Inconsistent use of : in ${found_dict["z"]}`;
                                    throw new ValueError(msg);
                                }
                                z = z.slice(0, 5) + z.slice(6);
                            }
                        }
                        const hours = _as_integer(z.slice(1, 3));
                        const minutes = _as_integer(z.slice(3, 5));
                        const seconds = _as_integer(z.slice(5, 7) || 0);
                        gmtoff = hours * 3600 + minutes * 60 + seconds;
                        const gmtoff_remainder = z.slice(8);
                        // # Pad to always return microseconds.
                        const gmtoff_remainder_padding = "0".repeat(6 - gmtoff_remainder.length);
                        gmtoff_fraction = _as_integer(gmtoff_remainder + gmtoff_remainder_padding);
                        if (z.startsWith("-")) {
                            gmtoff = -gmtoff;
                            gmtoff_fraction = -gmtoff_fraction;
                        }
                    }
                } else if (group_key === "Z") {
                    let found_zone = found_dict["Z"].toLowerCase();
                    let value = 0;
                    for (let tz_values of locale_time.timezone) {
                        if (tz_values.includes(found_zone)) {
                            const tzname = time_mod.tzname.v;
                            if (richCompareBool(tzname[0], tzname[1], "Eq") && isTrue(time_mod.daylight) && !["utc", "gmt"].includes(found_zone)) {
                                break;
                            } else {
                                tz = value;
                            }
                        }
                        value++;
                    }
                }
            });

            if (year === pyNone && iso_year !== pyNone) {
                if (iso_week === pyNone || weekday === pyNone) {
                    throw new ValueError("ISO year directive '%G' must be used with the ISO week directive '%V' and a weekday directive ('%A','%a', '%w', or '%u').");
                }
                if (julian !== pyNone) {
                    throw new ValueError("Day of the year directive '%j' is not compatible with ISO year directive '%G'.Use '%Y' instead.");
                }
            } else if (week_of_year === pyNone && iso_week !== pyNone) {
                if (weekday === pyNone) {
                    throw new ValueError("ISO week directive '%V' must be used with the ISO year directive '%G' and a weekday directive ('%A', '%a', '%w', or '%u').");
                } else {
                    throw new ValueError("ISO week directive '%V' is incompatible with the year directive '%Y'. Use the ISO year '%G' instead.");
                }
            }

            let leap_year_fix = false;
            if (year === pyNone && month === 2 && day === 29) {
                year = 1904;
                leap_year_fix = true;
            } else if (year === pyNone) {
                year = 1900;
            }

            if (julian === pyNone && weekday !== pyNone) {
                if (week_of_year !== pyNone) {
                    const week_starts_Mon = week_of_year_start === 0;
                    julian = _calc_julian_from_U_or_W(year, week_of_year, weekday, week_starts_Mon);
                } else if (iso_year !== pyNone && iso_week !== pyNone) {
                    [year, julian] = _calc_julian_from_V(iso_year, iso_week, weekday + 1);
                }
                if (julian !== pyNone && julian <= 0) {
                    year -= 1;
                    const yday = _is_leap(year) ? 366 : 365;
                    julian += yday;
                }
            }

            if (julian === pyNone) {
                julian = new datetime_date(year, month, day).$toOrdinal() - new datetime_date(year, 1, 1).$toOrdinal() + 1;
            } else {
                const datetime_result = _fromordinal(julian - 1 + new datetime_date(year, 1, 1).$toOrdinal());
                year = datetime_result.$year;
                month = datetime_result.$month;
                day = datetime_result.$day;
            }
            if (weekday === pyNone) {
                weekday = (new datetime_date(year, month, day).$toOrdinal() + 6) % 7;
            }

            const tzname = found_dict["Z"] || pyNone;

            if (leap_year_fix) {
                year = 1900;
            }
            return [[year, month, day, hour, minute, second, weekday, julian, tz, tzname, gmtoff], fraction, gmtoff_fraction];
        }

        function _strptime_time(data_string, format = "%a %b %d %H:%M:%S %Y") {
            let tt = _strptime(data_string, format)[0].slice(0, 11);
            tt = tt.map((x, i) => (i < 9 ? new pyInt(x) : remapToPy(x)));
            return time_mod.struct_time.tp$call([new pyTuple(tt)]);
        }

        function _strptime_datetime(cls, data_string, format = "%a %b %d %H:%M:%S %Y") {
            const [tt, fraction, gmtoff_fraction] = _strptime(data_string, format);
            const [tzname, gmtoff] = tt.slice(-2);
            const args = tt.slice(0, 6);
            args.push(fraction);
            args.map((x) => new pyInt(x));
            let tzdelta, tz;
            if (gmtoff !== pyNone) {
                tzdelta = new datetime_timedelta(0, gmtoff, gmtoff_fraction);
                if (isTrue(tzname)) {
                    tz = new datetime_timezone(tzdelta, new pyStr(tzname));
                } else {
                    tz = new datetime_timezone(tzdelta);
                }
                args.push(tz);
            }
            return pyCallOrSuspend(cls, args);
        }

        setUpModuleMethods("_strptime", mod, {
            _strptime_time: {
                $meth: _strptime_time,
                $flags: { NamedArgs: ["data_string", "format"], Defaults: ["%a %b %d %H:%M:%S %Y"] },
            },
            _strptime_datetime: {
                $meth: _strptime_datetime,
                $flags: { NamedArgs: ["cls", "data_string", "format"], Defaults: ["%a %b %d %H:%M:%S %Y"] },
            },
            _strptime: {
                $meth(data_string, format) {
                    const res = _strptime(data_string, format);
                    res[0] = new pyTuple(res[0].map((x) => (x === pyNone ? x : new pyInt(x))));
                    res[1] = new pyInt(res[1]);
                    res[2] = new pyInt(res[2]);
                    return new pyTuple(res);
                },
                $flags: { NamedArgs: ["data_string", "format"], Defaults: ["%a %b %d %H:%M:%S %Y"] },
            },
            _getlang: {
                $meth() {
                    return remapToPy(_getlang());
                },
                $flags: { NoArgs: true },
            },
        });

        // expose LocaleTime class - only really used for testing
        mod.LocaleTime = buildNativeClass("_strptime.LocaleTime", {
            constructor: function () {
                this.v = new LocaleTime();
            },
            slots: {
                tp$getattr(pyName, canSuspend) {
                    if (this.v.hasOwnProperty(pyName.toString())) {
                        return remapToPy(this.v[pyName.toString()]);
                    }
                    return getAttr.call(this, pyName, canSuspend);
                },
                tp$setattr(pyName, value) {
                    if (this.v.hasOwnProperty(pyName.toString())) {
                        this.v[pyName.toString()] = remapToJs(value);
                    } else {
                        return setAttr.call(this, pyName, value);
                    }
                },
            },
        });

        return mod;
    });
}
