function $builtinmodule() {
    // set up some constants
    const {
        isTrue,
        richCompareBool,
        asIndexOrThrow,
        asIndexSized,
        objectRepr,
        opAllowsEquality,
        callsimArray: pyCall,
        callsimOrSuspendArray: pyCallOrSuspend,
    } = Sk.misceval;
    const { numberBinOp, typeName, buildNativeClass, checkArgsLen, objectHash, copyKeywordsToNamedArgs } = Sk.abstr;
    const {
        int_: pyInt,
        float_: pyFloat,
        str: pyStr,
        bytes: pyBytes,
        tuple: pyTuple,
        bool: { true$: pyTrue },
        none: { none$: pyNone },
        NotImplemented: { NotImplemented$: pyNotImplemented },
        TypeError,
        ValueError,
        OverflowError,
        ZeroDivisionError,
        NotImplementedError,
        checkNumber,
        checkFloat,
        checkString,
        checkInt,
        asnum$,
        round,
        getattr,
    } = Sk.builtin;
    const { remapToPy: toPy, remapToJs: toJs } = Sk.ffi;
    const intRound = (val) => round(val).nb$int(); // because python 2 returns a float.
    const binOp = numberBinOp;

    const str_auto = new pyStr("auto");
    const str_utcoff = new pyStr("utcoffset");
    const str_tzname = new pyStr("tzname");
    const str_int_ratio = new pyStr("as_integer_ratio");
    const str_dst = new pyStr("dst");
    const str_isoformat = new pyStr("isoformat");
    const str_replace = new pyStr("replace");
    const str_fromtimestamp = new pyStr("fromtimestamp");
    const str_fromord = new pyStr("fromordinal");
    const str_utcfromtimestamp = new pyStr("utcfromtimestamp");
    const str_strftime = new pyStr("strftime");
    const str_fromutc = new pyStr("fromutc");

    const int0 = new pyInt(0);
    const float0 = new pyFloat(0);
    const _7 = new pyInt(7);
    const _60 = new pyInt(60);
    const _3600 = new pyInt(3600);
    const _1000 = new pyInt(1000);
    const _1000000 = new pyInt(1000000);
    const _1e6 = new pyFloat(1e6);
    const secs_in_day = new pyInt(24 * 3600);
    const _243600 = new pyFloat(24 * 3600);

    let _strptime_datetime = null; // see datetime.stprtime

    // some helper functions not part of datetime.py

    function pyDivMod(a, b) {
        return binOp(a, b, "DivMod").v;
    }

    function $divMod(v, w) {
        if (typeof v !== "number" || typeof w !== "number") {
            v = JSBI.BigInt(v);
            w = JSBI.BigInt(w);
            return [JSBI.toNumber(JSBI.divide(v, w)), JSBI.toNumber(JSBI.remainder(v, w))];
        }
        if (w === 0) {
            throw new ZeroDivisionError("integer division or modulo by zero");
        }
        return [Math.floor(v / w), v - Math.floor(v / w) * w];
    }

    function modf(n) {
        n = asnum$(n);
        const sign = n < 0 ? -1 : 1;
        n = Math.abs(n);
        return [new pyFloat(sign * (n - Math.floor(n))), new pyFloat(sign * Math.floor(n))];
    }

    function _d(n, ch = "0", l = 2) {
        return n.toString().padStart(l, ch);
    }

    const is_digit = /^[0-9]+$/;
    function _as_integer(dtstr) {
        if (!is_digit.test(dtstr)) {
            throw new Error();
        }
        return parseInt(dtstr);
    }

    function _as_int_ratio(other) {
        let int_ratio = pyCall(other.tp$getattr(str_int_ratio));
        if (!(int_ratio instanceof pyTuple)) {
            throw new TypeError("unexpected return type from as_integer_ratio(): expected tuple, got '" + typeName(int_ratio) + "'");
        }
        int_ratio = int_ratio.v;
        if (int_ratio.length !== 2) {
            throw new ValueError("as_integer_ratio() must return a 2-tuple");
        }
        return int_ratio;
    }

    return Sk.misceval.chain(Sk.importModule("time", false, true), (time_mod) => {
        const _time = time_mod.$d;

        const mod = {
            __name__: new pyStr("datetime"),
            __all__: new Sk.builtin.list(["date", "datetime", "time", "timedelta", "timezone", "tzinfo", "MINYEAR", "MAXYEAR"].map((x) => new pyStr(x))),
        };

        function _cmp(x, y) {
            for (let i = 0; i < x.length; i++) {
                if (x[i] !== y[i]) {
                    return x[i] > y[i] ? 1 : -1;
                }
            }
            return 0;
        }

        function _do_compare(self, other, op) {
            const cmp = self.$cmp(other, op);
            switch (op) {
                case "Lt":
                    return cmp < 0;
                case "LtE":
                    return cmp <= 0;
                case "Eq":
                    return cmp === 0;
                case "NotEq":
                    return cmp !== 0;
                case "Gt":
                    return cmp > 0;
                case "GtE":
                    return cmp >= 0;
            }
        }

        const MINYEAR = 1;
        const MAXYEAR = 9999;
        mod.MINYEAR = new pyInt(MINYEAR);
        mod.MAXYEAR = new pyInt(MAXYEAR);
        const _MAXORDINAL = 3652059; // date.max.toordinal()

        const _DAYS_IN_MONTH = [-1, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        const _DAYS_BEFORE_MONTH = [-1]; // -1 is a placeholder for indexing purposes.
        let dbm = 0;

        _DAYS_IN_MONTH.slice(1).forEach((dim) => {
            _DAYS_BEFORE_MONTH.push(dbm);
            dbm += dim;
        });

        function _is_leap(year) {
            return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        }

        function _days_before_year(year) {
            const y = year - 1;
            return y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
        }

        function _days_in_month(year, month) {
            if (month === 2 && _is_leap(year)) {
                return 29;
            }
            return _DAYS_IN_MONTH[month];
        }

        function _days_before_month(year, month) {
            return _DAYS_BEFORE_MONTH[month] + (month > 2 && _is_leap(year));
        }

        function _ymd2ord(year, month, day) {
            // const dim = _days_in_month(year, month);
            return _days_before_year(year) + _days_before_month(year, month) + day;
        }

        const _DI400Y = _days_before_year(401); //# number of days in 400 years
        const _DI100Y = _days_before_year(101); //#    "    "   "   " 100   "
        const _DI4Y = _days_before_year(5); //#    "    "   "   "   4   "

        function _ord2ymd(n) {
            n = asIndexOrThrow(n);
            if (n > Number.MAX_SAFE_INTEGER) {
                throw new OverflowError("Python int too large to convert to js number");
            }
            if (n < 1) {
                throw new ValueError("ordinal must be >= 1");
            }
            n -= 1;
            let n400, n100, n4, n1;
            [n400, n] = $divMod(n, _DI400Y);
            let year = n400 * 400 + 1;

            [n100, n] = $divMod(n, _DI100Y);

            [n4, n] = $divMod(n, _DI4Y);

            [n1, n] = $divMod(n, 365);

            year += n100 * 100 + n4 * 4 + n1;
            if (n1 === 4 || n100 === 4) {
                return [year - 1, 12, 31].map((x) => new pyInt(x));
            }

            const leapyear = n1 === 3 && (n4 !== 24 || n100 === 3);
            let month = (n + 50) >> 5;
            let preceding = _DAYS_BEFORE_MONTH[month] + (month > 2 && leapyear);
            if (preceding > n) {
                month -= 1;
                preceding -= _DAYS_IN_MONTH[month] + (month === 2 && leapyear);
            }
            n -= preceding;
            return [year, month, n + 1].map((x) => new pyInt(x));
        }

        // # Month and day names.  For localized versions, see the calendar module.
        const _MONTHNAMES = [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const _DAYNAMES = [null, "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        function _build_struct_time(y, m, d, hh, mm, ss, dstflag) {
            const wday = (_ymd2ord(y, m, d) + 6) % 7;
            const dnum = _days_before_month(y, m) + d;
            return _time.struct_time.tp$call([new pyTuple([y, m, d, hh, mm, ss, wday, dnum, dstflag].map((x) => new pyInt(x)))]);
        }

        const _specs = {
            hours(hh) {
                return _d(hh);
            },
            minutes(hh, mm) {
                return _d(hh) + ":" + _d(mm);
            },
            seconds(hh, mm, ss) {
                return _d(hh) + ":" + _d(mm) + ":" + _d(ss);
            },
            milliseconds(hh, mm, ss, us) {
                return _d(hh) + ":" + _d(mm) + ":" + _d(ss) + "." + _d(us, "0", 3);
            },
            microseconds(hh, mm, ss, us) {
                return _d(hh) + ":" + _d(mm) + ":" + _d(ss) + "." + _d(us, "0", 6);
            },
        };

        function _format_time(hh, mm, ss, us, timespec = "auto") {
            if (!(typeof timespec === "string") && !checkString(timespec)) {
                throw new TypeError("must be str, not " + typeName(timespec));
            }
            timespec = timespec.toString();
            if (timespec === "auto") {
                timespec = us ? "microseconds" : "seconds";
            } else if (timespec === "milliseconds") {
                us = Math.floor(us / 1000);
            }
            let fmt = _specs[timespec];
            if (fmt === undefined) {
                throw new ValueError("Unknown timespec value");
            }
            return fmt(hh, mm, ss, us);
        }

        function _format_offset(off) {
            let s = "";
            let sign;
            if (off !== pyNone) {
                if (off.$days < 0) {
                    sign = "-";
                    off = new timedelta(-off.$days, -off.$secs, -off.$micro);
                } else {
                    sign = "+";
                }
                let hh, mm, ss;
                [hh, mm] = pyDivMod(off, td_hour);
                [mm, ss] = pyDivMod(mm, td_min);
                s += sign + `${_d(hh)}:${_d(mm)}`;
                if (ss.$secs || ss.$micro) {
                    s += ":" + _d(ss.$secs, "0", 2);
                    if (ss.$micro) {
                        s += "." + _d(ss.$micro, "0", 6);
                    }
                }
                return s;
            }
        }

        function _wrap_strftime(object, format, timetuple) {
            let freplace = null,
                zreplace = null,
                Zreplace = null;
            let newformat = [];
            let i = 0;
            const n = format.length;
            while (i < n) {
                let ch = format[i];
                i += 1;
                if (ch === "%") {
                    if (i < n) {
                        ch = format[i];
                        i += 1;
                        if (ch === "f") {
                            if (freplace === null) {
                                freplace = _d(object.$micro || 0, "0", 6);
                            }
                            newformat.push(freplace);
                        } else if (ch === "z") {
                            if (zreplace === null) {
                                zreplace = "";
                                const utcoffset = object.tp$getattr(str_utcoff);
                                if (utcoffset !== undefined) {
                                    let offset = pyCall(utcoffset);
                                    if (offset !== pyNone) {
                                        let sign = "+";
                                        if (offset.$days < 0) {
                                            offset = new timedelta(-offset.$days, -offset.$secs, -offset.$micro);
                                            sign = "-";
                                        }
                                        let h, m, rest;
                                        [h, rest] = pyDivMod(offset, td_hour);
                                        [m, rest] = pyDivMod(rest, td_min);
                                        h = h;
                                        m = m;
                                        const s = rest.$secs;
                                        const u = offset.$micro;
                                        if (u) {
                                            zreplace = sign + _d(h) + _d(m) + _d(s) + "." + _d(u, "0", 6);
                                        } else if (s) {
                                            zreplace = sign + _d(h) + _d(m) + _d(s);
                                        } else {
                                            zreplace = sign + _d(h) + _d(m);
                                        }
                                    }
                                }
                            }
                            newformat.push(zreplace);
                        } else if (ch === "Z") {
                            if (Zreplace === null) {
                                Zreplace = "";
                                const tzname_f = object.tp$getattr(str_tzname);
                                if (tzname_f !== undefined) {
                                    let s = pyCall(tzname_f);
                                    if (s !== pyNone) {
                                        const replace_f = s.tp$getattr(str_replace);
                                        Zreplace = pyCall(replace_f, [new pyStr("%"), new pyStr("%%")]);
                                        if (!checkString(Zreplace)) {
                                            throw new TypeError("tzname.replace() did not return a string");
                                        }
                                    }
                                }
                            }
                            newformat.push(Zreplace);
                        } else {
                            newformat.push("%", ch);
                        }
                    } else {
                        newformat.push("%");
                    }
                } else {
                    newformat.push(ch);
                }
            }
            newformat = newformat.join("");
            return _time.strftime.tp$call([new pyStr(newformat), timetuple]);
        }

        function _parse_isoformat_date(dtstr) {
            const year = _as_integer(dtstr.slice(0, 4));

            if (dtstr[4] !== "-") {
                throw new ValueError("Invalid date separator: " + dtstr[4]);
            }

            const month = _as_integer(dtstr.slice(5, 7));

            if (dtstr[7] !== "-") {
                throw new ValueError("Invalid date separator: " + dtstr[7]);
            }
            const day = _as_integer(dtstr.slice(8, 10));

            return [year, month, day].map((x) => new pyInt(x));
        }

        function _parse_hh_mm_ss_ff(tstr) {
            const len_str = tstr.length;
            const time_comps = [0, 0, 0, 0];
            let pos = 0;
            for (let comp = 0; comp < 3; comp++) {
                if (len_str - pos < 2) {
                    throw new ValueError("Incomplete time component");
                }
                time_comps[comp] = _as_integer(tstr.slice(pos, pos + 2));
                pos += 2;
                const next_char = tstr.substr(pos, 1);
                if (!next_char || comp >= 2) {
                    break;
                }

                if (next_char !== ":") {
                    throw new ValueError("Invalid time separator: " + next_char);
                }

                pos += 1;
            }

            if (pos < len_str) {
                if (tstr[pos] !== ".") {
                    throw new ValueError("Invalid microsecond component");
                } else {
                    pos += 1;
                    const len_remainder = len_str - pos;
                    if (len_remainder !== 3 && len_remainder !== 6) {
                        throw new ValueError("Invalid microsecond component");
                    }
                    time_comps[3] = _as_integer(tstr.slice(pos));
                    if (len_remainder === 3) {
                        time_comps[3] *= 1000;
                    }
                }
            }
            return time_comps;
        }

        function _parse_isoformat_time(tstr) {
            const len_str = tstr.length;
            if (len_str < 2) {
                throw new ValueError("Isoformat time too short");
            }

            const tz_pos = tstr.indexOf("-") + 1 || tstr.indexOf("+") + 1;
            const timestr = tz_pos > 0 ? tstr.slice(0, tz_pos - 1) : tstr;

            let time_comps = _parse_hh_mm_ss_ff(timestr);
            let tzi = pyNone;
            let tzstr;
            if (tz_pos > 0) {
                tzstr = tstr.slice(tz_pos);
                if (![5, 8, 15].includes(tzstr.length)) {
                    throw new ValueError("Malformed time zone string");
                }
                const tz_comps = _parse_hh_mm_ss_ff(tzstr);
                if (tz_comps.every((x) => x === 0)) {
                    tzi = timezone.prototype.utc;
                } else {
                    const tzsign = tstr[tz_pos - 1] === "-" ? -1 : 1;
                    const td = new timedelta(0, tzsign * (tz_comps[0] * 3600 + tz_comps[1] * 60 + tz_comps[2]), tzsign * tz_comps[3]);
                    tzi = new timezone(td);
                }
            }
            time_comps = time_comps.map((x) => new pyInt(x));
            time_comps.push(tzi);
            return time_comps;
        }

        function _check_tzname(name) {
            if (name !== pyNone && !checkString(name)) {
                throw new TypeError("tzinfo.tzname() must return None or string, not '" + typeName(name) + "'");
            }
        }

        function _check_utc_offset(name, offset) {
            if (offset === pyNone) {
                return;
            }
            if (!(offset instanceof timedelta)) {
                throw new TypeError(`tzinfo.${name}() must return None or timedelta, not '${typeName(offset)}'`);
            }
            if (!(richCompareBool(td_neg_day, offset, "Lt") && richCompareBool(offset, td_day, "Lt"))) {
                throw new ValueError(`${name}()=${offset.toString()}, must be strictly between -timedelta(hours=24) and timedelta(hours=24)`);
            }
        }

        function _check_date_fields(year, month = null, day = null) {
            if (month === null || day === null) {
                const arg = day === null ? "day" : "month";
                const pos = day === null ? "3" : "2";
                throw new TypeError(`function missing required argument '${arg}' (pos ${pos})`);
            }
            year = asIndexOrThrow(year);
            month = asIndexOrThrow(month);
            day = asIndexOrThrow(day);
            if (!(MINYEAR <= year && year <= MAXYEAR)) {
                throw new ValueError("year must be in " + MINYEAR + ".." + MAXYEAR, new pyInt(year));
            }
            if (!(1 <= month && month <= 12)) {
                throw new ValueError("month must be in 1..12", new pyInt(month));
            }
            const dim = _days_in_month(year, month);
            if (!(1 <= day && day <= dim)) {
                throw new ValueError("day must be in 1.." + dim, new pyInt(day));
            }
            return [year, month, day];
        }

        function _check_time_fields(hour, minute, second, microsecond, fold) {
            hour = asIndexOrThrow(hour);
            minute = asIndexOrThrow(minute);
            second = asIndexOrThrow(second);
            microsecond = asIndexOrThrow(microsecond);
            fold = asIndexOrThrow(fold);

            if (!(0 <= hour && hour <= 23)) {
                throw new ValueError("hour must be in 0..23", new pyInt(hour));
            }
            if (!(0 <= minute && minute <= 59)) {
                throw new ValueError("minute must be in 0..59", new pyInt(minute));
            }
            if (!(0 <= second && second <= 59)) {
                throw new ValueError("second must be in 0..59", new pyInt(second));
            }
            if (!(0 <= microsecond && microsecond <= 999999)) {
                throw new ValueError("microsecond must be in 0..999999", new pyInt(microsecond));
            }

            if (fold !== 0 && fold !== 1) {
                throw new ValueError("fold must be either 0 or 1", new pyInt(fold));
            }
            return [hour, minute, second, microsecond, fold];
        }

        function _check_tzinfo_arg(tz) {
            if (tz !== pyNone && !(tz instanceof tzinfo)) {
                throw new TypeError("tzinfo argument must be None or of a tzinfo subclass");
            }
        }

        function _divide_and_round(a, b) {
            let [q, r] = $divMod(a, b);
            r *= 2;
            let greater_than_half = b > 0 ? r > b : r < b;
            if (greater_than_half || (r === b && Math.abs(q) % 2 === 1)) {
                q += 1;
            }
            return q;
        }

        const timedelta = (mod.timedelta = buildNativeClass("datetime.timedelta", {
            constructor: function timedelta(days = 0, seconds = 0, microseconds = 0) {
                let s, d;
                [s, microseconds] = $divMod(microseconds, 1000000);
                seconds += s;
                [d, seconds] = $divMod(seconds, 24 * 3600);
                days += d;
                this.$days = days;
                this.$secs = seconds;
                this.$micro = microseconds;
                this.$hashcode = -1;
                if (Math.abs(days) > 999999999) {
                    throw new OverflowError(`days=${days}; must have magnitude <= 999999999`);
                }
            },
            slots: {
                tp$new(args, kws) {
                    let [days, seconds, microseconds, milliseconds, minutes, hours, weeks] = copyKeywordsToNamedArgs(
                        "timedelta",
                        ["days", "seconds", "microseconds", "milliseconds", "minutes", "hours", "weeks"],
                        args,
                        kws,
                        new Array(7).fill(int0)
                    );
                    let d, s, us;
                    d = s = us = int0;

                    // normalize to days, secs, microsecs
                    days = binOp(days, binOp(weeks, _7, "Mult"), "Add");
                    seconds = binOp(seconds, binOp(binOp(minutes, _60, "Mult"), binOp(hours, _3600, "Mult"), "Add"), "Add");

                    microseconds = binOp(microseconds, binOp(milliseconds, _1000, "Mult"), "Add");
                    let dayfrac, daysecondsfrac, daysecondswhole;
                    if (checkFloat(days)) {
                        [dayfrac, days] = modf(days);
                        [daysecondsfrac, daysecondswhole] = modf(binOp(dayfrac, _243600, "Mult"));
                        s = new pyInt(daysecondswhole); // will raise overflow error
                        d = new pyInt(days);
                    } else {
                        daysecondsfrac = float0;
                        d = days;
                    }

                    let secondsfrac;
                    if (checkFloat(seconds)) {
                        [secondsfrac, seconds] = modf(seconds);
                        seconds = new pyInt(seconds);
                        secondsfrac = binOp(secondsfrac, daysecondsfrac, "Add");
                    } else {
                        secondsfrac = daysecondsfrac;
                    }
                    [days, seconds] = pyDivMod(seconds, secs_in_day);
                    d = binOp(d, days, "Add");
                    s = binOp(s, new pyInt(seconds), "Add");

                    const usdouble = binOp(secondsfrac, _1e6, "Mult");

                    if (checkFloat(microseconds)) {
                        microseconds = intRound(binOp(microseconds, usdouble, "Add"));
                        [seconds, microseconds] = pyDivMod(microseconds, _1000000);
                        [days, seconds] = pyDivMod(seconds, secs_in_day);
                        d = binOp(d, days, "Add");
                        s = binOp(s, seconds, "Add");
                    } else {
                        microseconds = new pyInt(microseconds);
                        [seconds, microseconds] = pyDivMod(microseconds, _1000000);
                        [days, seconds] = pyDivMod(seconds, secs_in_day);
                        d = binOp(d, days, "Add");
                        s = binOp(s, seconds, "Add");
                        microseconds = intRound(binOp(microseconds, usdouble, "Add"));
                    }

                    [seconds, us] = pyDivMod(microseconds, _1000000);
                    s = binOp(s, seconds, "Add");
                    [days, s] = pyDivMod(s, secs_in_day);
                    d = binOp(d, days, "Add");

                    d = asIndexOrThrow(d);
                    s = asIndexOrThrow(s);
                    us = asIndexOrThrow(us);

                    if (Math.abs(d) > 999999999) {
                        throw new OverflowError("timedelta # of days is too large: " + days.toString());
                    }

                    if (this === timedelta.prototype) {
                        return new timedelta(d, s, us);
                    } else {
                        const instance = new this.constructor();
                        timedelta.call(instance, d, s, us);
                        return instance;
                    }
                },
                $r() {
                    const args = [];
                    if (this.$days) {
                        args.push(`days=${this.$days}`);
                    }
                    if (this.$secs) {
                        args.push(`seconds=${this.$secs}`);
                    }
                    if (this.$micro) {
                        args.push(`microseconds=${this.$micro}`);
                    }
                    if (!args.length) {
                        args.push("0");
                    }
                    return new pyStr(`${this.tp$name}(${args.join(", ")})`);
                },
                tp$str() {
                    const ss = this.$secs % 60;
                    let mm = Math.floor(this.$secs / 60);
                    const hh = Math.floor(mm / 60);
                    mm %= 60;
                    let s = `${hh}:${_d(mm)}:${_d(ss)}`;
                    if (this.$days) {
                        function plural(n) {
                            return (Math.abs(n) !== 1 && "s") || "";
                        }
                        s = `${this.$days} day${plural(this.$days)}, ` + s;
                    }
                    if (this.$micro) {
                        s = s + `.${_d(this.$micro, "0", 6)}`;
                    }
                    return new pyStr(s);
                },

                tp$as_number: true,
                nb$add(other) {
                    if (other instanceof timedelta) {
                        return new timedelta(this.$days + other.$days, this.$secs + other.$secs, this.$micro + other.$micro);
                    }
                    return pyNotImplemented;
                },
                nb$subtract(other) {
                    if (other instanceof timedelta) {
                        return new timedelta(this.$days - other.$days, this.$secs - other.$secs, this.$micro - other.$micro);
                    }
                    return pyNotImplemented;
                },
                nb$positive() {
                    return this;
                },
                nb$negative() {
                    return new timedelta(-this.$days, -this.$secs, -this.$micro);
                },
                nb$abs() {
                    if (this.$days < 0) {
                        return this.nb$negative();
                    }
                    return this;
                },
                nb$multiply(other) {
                    if (checkInt(other)) {
                        other = asIndexSized(other, OverflowError);
                        return new timedelta(this.$days * other, this.$secs * other, this.$micro * other);
                    } else if (checkFloat(other)) {
                        const usec = this.$toMicrosecs();
                        let [a, b] = _as_int_ratio(other);
                        a = asIndexSized(a, OverflowError);
                        b = asIndexOrThrow(b);

                        return new timedelta(0, 0, _divide_and_round(usec * a, b));
                    }
                    return pyNotImplemented;
                },
                nb$floor_divide(other) {
                    const usec = this.$toMicrosecs();
                    if (other instanceof timedelta) {
                        const ousec = other.$toMicrosecs();
                        if (ousec === 0) {
                            throw new ZeroDivisionError("integer division or modulo by zero");
                        }
                        return new pyInt(Math.floor(usec / ousec));
                    } else if (checkInt(other)) {
                        other = asIndexSized(other, OverflowError);
                        // todo bigint - for now just throw OverflowError
                        if (other === 0) {
                            throw new ZeroDivisionError("integer division or modulo by zero");
                        }
                        return new timedelta(0, 0, Math.floor(usec / other));
                    }
                    return pyNotImplemented;
                },
                nb$divide(other) {
                    const usec = this.$toMicrosecs();
                    if (other instanceof timedelta) {
                        const ousec = other.$toMicrosecs();
                        if (ousec === 0) {
                            throw new ZeroDivisionError("integer division or modulo by zero");
                        }
                        return new pyFloat(usec / other.$toMicrosecs());
                    } else if (checkInt(other)) {
                        other = asIndexOrThrow(other);
                        return new timedelta(0, 0, _divide_and_round(usec, other));
                    } else if (checkFloat(other)) {
                        let [a, b] = _as_int_ratio(other);
                        a = asIndexOrThrow(a);
                        b = asIndexSized(b, OverflowError);
                        return new timedelta(0, 0, _divide_and_round(b * usec, a));
                    }
                    return pyNotImplemented;
                },
                nb$remainder(other) {
                    if (!(other instanceof timedelta)) {
                        return pyNotImplemented;
                    }
                    const v = this.$toMicrosecs(),
                        w = other.$toMicrosecs();
                    if (w === 0) {
                        throw new ZeroDivisionError("integer division or modulo by zero");
                    }
                    const r = v - Math.floor(v / w) * w;
                    return new timedelta(0, 0, r);
                },
                nb$divmod(other) {
                    if (!(other instanceof timedelta)) {
                        return pyNotImplemented;
                    }
                    const v = this.$toMicrosecs(),
                        w = other.$toMicrosecs();
                    const [q, r] = $divMod(v, w);
                    return new pyTuple([new pyInt(q), new timedelta(0, 0, r)]);
                },
                tp$richcompare(other, op) {
                    if (!(other instanceof timedelta)) {
                        return pyNotImplemented;
                    }
                    return _do_compare(this, other, op);
                },
                tp$hash() {
                    if (this.$hashcode === -1) {
                        this.$hashcode = objectHash(new pyTuple(this.$getState().map((x) => new pyInt(x))));
                    }
                    return this.$hashcode;
                },
                nb$bool() {
                    return this.$days !== 0 || this.$secs !== 0 || this.$micro !== 0;
                },
            },
            methods: {
                total_seconds: {
                    $meth() {
                        return new pyFloat(((this.$days * 86400 + this.$secs) * 10 ** 6 + this.$micro) / 10 ** 6);
                    },
                    $flags: { NoArgs: true },
                    $doc: "Total seconds in the duration.",
                },
                __reduce__: {
                    $meth() {
                        return new pyTuple([this.ob$type, new pyTuple(this.$getState().map((x) => toPy(x)))]);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "__reduce__() -> (cls, state)",
                },
            },
            getsets: {
                days: {
                    $get() {
                        return new pyInt(this.$days);
                    },
                    $doc: "Number of days.",
                },
                seconds: {
                    $get() {
                        return new pyInt(this.$secs);
                    },
                    $doc: "Number of seconds (>= 0 and less than 1 day).",
                },
                microseconds: {
                    $get() {
                        return new pyInt(this.$micro);
                    },
                    $doc: "Number of microseconds (>= 0 and less than 1 second).",
                },
            },
            proto: {
                // private methods
                $toMicrosecs() {
                    return (this.$days * (24 * 3600) + this.$secs) * 1000000 + this.$micro;
                },
                $cmp(other) {
                    return _cmp(this.$getState(), other.$getState());
                },
                $getState() {
                    return [this.$days, this.$secs, this.$micro];
                },
            },
        }));

        timedelta.prototype.min = new timedelta(-999999999);
        timedelta.prototype.max = new timedelta(999999999, 23 * 3600 + 59 * 60 + 59, 999999);
        timedelta.prototype.resolution = new timedelta(0, 0, 1);

        // some timdelta constants
        const td_day = new timedelta(1);
        const td_hour = new timedelta(0, 3600);
        const td_min = new timedelta(0, 60);
        const td_sec = new timedelta(0, 1);
        const td_0 = new timedelta(0);
        const td_neg_day = new timedelta(-1);

        const date = (mod.date = buildNativeClass("datetime.date", {
            constructor: function date(year, month, day) {
                this.$year = year;
                this.$month = month;
                this.$day = day;
                this.$hashcode = -1;
            },
            slots: {
                tp$new(args, kws) {
                    let [year, month, day] = copyKeywordsToNamedArgs("date", ["year", "month", "day"], args, kws, [
                        null,
                        null,
                    ]);
                    let asBytes;
                    if (
                        month === null &&
                        year instanceof pyBytes &&
                        (asBytes = year.valueOf()).length === 4 &&
                        1 <= asBytes[2] &&
                        asBytes[2] <= 12
                    ) {
                        const self = new this.constructor();
                        self.$setState(asBytes);
                        return self;
                    }
                    [year, month, day] = _check_date_fields(year, month, day);
                    if (this === date.prototype) {
                        return new date(year, month, day);
                    } else {
                        const instance = new this.constructor();
                        date.call(instance, year, month, day);
                        return instance;
                    }
                },
                $r() {
                    return new pyStr(`${this.tp$name}(${this.$year}, ${this.$month}, ${this.$day})`);
                },
                tp$str() {
                    return this.tp$getattr(str_isoformat).tp$call([]);
                },
                tp$richcompare(other, op) {
                    if (!(other instanceof date)) {
                        return pyNotImplemented;
                    }
                    return _do_compare(this, other, op);
                },
                tp$hash() {
                    if (this.$hashcode === -1) {
                        this.$hashcode = objectHash(this.$getState());
                    }
                    return this.$hashcode;
                },
                tp$as_number: true,
                nb$add(other) {
                    if (other instanceof timedelta) {
                        const o = this.$toOrdinal() + other.$days;
                        if (0 < o && o <= _MAXORDINAL) {
                            return this.ob$type.tp$getattr(str_fromord).tp$call([new pyInt(o)]);
                        }
                        throw new OverflowError("result out of range");
                    }
                    return pyNotImplemented;
                },
                nb$subtract(other) {
                    if (other instanceof timedelta) {
                        return binOp(this, new timedelta(-other.$days), "Add");
                    }
                    if (other instanceof date) {
                        const days1 = this.$toOrdinal();
                        const days2 = other.$toOrdinal();
                        return new timedelta(days1 - days2);
                    }
                    return pyNotImplemented;
                },
                nb$reflected_subtract: null,
            },
            classmethods: {
                fromtimestamp: {
                    $meth: function fromtimestamp(t) {
                        const [y, m, d] = _time.localtime.tp$call([t]).v;
                        return this.tp$call([y, m, d]);
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "timestamp -> local date from a POSIX timestamp (like time.time()).",
                },
                fromordinal: {
                    $meth: function fromordinal(n) {
                        return this.tp$call(_ord2ymd(n));
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "int -> date corresponding to a proleptic Gregorian ordinal.",
                },
                fromisocalendar: {
                    $meth: function fromisocalendar(year, week, day) {
                        year = asIndexOrThrow(year);
                        week = asIndexOrThrow(week);
                        day = asIndexOrThrow(day);
                        if (!(MINYEAR <= year && year <= MAXYEAR)) {
                            throw new ValueError(`Year is out of range: ${year}`);
                        }

                        let out_of_range, first_weekday;
                        if (!(0 < week && week < 53)) {
                            out_of_range = true;
                            if (week === 53) {
                                first_weekday = _ymd2ord(year, 1, 1) % 7;
                                if (first_weekday === 4 || (first_weekday === 3 && _is_leap(year))) {
                                    out_of_range = false;
                                }
                            }
                            if (out_of_range) {
                                throw new ValueError(`Invalid week: ${week}`);
                            }
                        }
                        if (!(0 < day && day < 8)) {
                            throw new ValueError(`Invalid weekday: ${day} (range is [1, 7])`);
                        }
                        const day_offset = (week - 1) * 7 + (day - 1);
                        const day_1 = _isoweek1monday(year);
                        const ord_day = day_1 + day_offset;
                        return this.tp$call(_ord2ymd(ord_day));
                    },
                    $flags: { NamedArgs: ["year", "week", "day"] },
                    $textsig: null,
                    $doc: "int -> date corresponding to a proleptic Gregorian ordinal.",
                },
                fromisoformat: {
                    $meth: function fromisoformat(date_string) {
                        if (!checkString(date_string)) {
                            throw new TypeError("fromisoformat: argument must be str");
                        }
                        date_string = date_string.toString();
                        try {
                            if (date_string.length !== 10) {
                                throw new Error();
                            }
                            return this.tp$call(_parse_isoformat_date(date_string));
                        } catch (e) {
                            throw new ValueError("Invalid isoformat string: '" + date_string + "'");
                        }
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "str -> Construct a date from the output of date.isoformat()",
                },
                today: {
                    $meth: function today() {
                        const t = _time.time.tp$call([]);
                        return this.tp$getattr(str_fromtimestamp).tp$call([t]);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Current date or datetime:  same as self.__class__.fromtimestamp(time.time()).",
                },
            },
            methods: {
                ctime: {
                    $meth: function ctime() {
                        const weekday = this.$toOrdinal() % 7 || 7;
                        const day_name = _DAYNAMES[weekday];
                        const month_name = _MONTHNAMES[this.$month];
                        return new pyStr(`${day_name} ${month_name} ${_d(this.$day, " ", 2)} 00:00:00 ${_d(this.$year, "0", 4)}`);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return ctime() style string.",
                },
                strftime: {
                    $meth: function strftime(fmt) {
                        if (!checkString(fmt)) {
                            throw new TypeError("must be str, not " + typeName(fmt));
                        }
                        fmt = fmt.toString();
                        return _wrap_strftime(this, fmt, this.$timetuple());
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "format -> strftime() style string.",
                },
                __format__: {
                    $meth: function __format__(fmt) {
                        if (!checkString(fmt)) {
                            throw new TypeError("must be str, not " + typeName(fmt));
                        }
                        if (fmt !== pyStr.$empty) {
                            return this.tp$getattr(str_strftime).tp$call([fmt]);
                        }
                        return this.tp$str();
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "Formats self with strftime.",
                },
                timetuple: {
                    $meth: function timetuple() {
                        return this.$timetuple();
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return time tuple, compatible with time.localtime().",
                },
                isocalendar: {
                    $meth: function isocalendar() {
                        let year = this.$year;
                        let week1monday = _isoweek1monday(year);
                        const today = _ymd2ord(this.$year, this.$month, this.$day);
                        let [week, day] = $divMod(today - week1monday, 7);
                        if (week < 0) {
                            year -= 1;
                            week1monday = _isoweek1monday(year);
                            [week, day] = $divMod(today - week1monday, 7);
                        } else if (week >= 52) {
                            if (today >= _isoweek1monday(year + 1)) {
                                year += 1;
                                week = 0;
                            }
                        }
                        return new IsoCalendarDate(new pyInt(year), new pyInt(week + 1), new pyInt(day + 1));
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return a 3-tuple containing ISO year, week number, and weekday.",
                },
                isoformat: {
                    $meth: function isoformat() {
                        return this.$isoformat();
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return string in ISO 8601 format, YYYY-MM-DD.",
                },
                isoweekday: {
                    $meth: function isoweekday() {
                        return new pyInt(this.$toOrdinal() % 7 || 7);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return the day of the week represented by the date.\nMonday == 1 ... Sunday == 7",
                },
                toordinal: {
                    $meth: function toordinal() {
                        return new pyInt(this.$toOrdinal());
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return proleptic Gregorian ordinal.  January 1 of year 1 is day 1.",
                },
                weekday: {
                    $meth: function weekday() {
                        return new pyInt((this.$toOrdinal() + 6) % 7);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return the day of the week represented by the date.\nMonday == 0 ... Sunday == 6",
                },
                replace: {
                    $meth: function replace(year, month, day) {
                        if (year === pyNone) {
                            year = new pyInt(this.$year);
                        }
                        if (month === pyNone) {
                            month = new pyInt(this.$month);
                        }
                        if (day === pyNone) {
                            day = new pyInt(this.$day);
                        }
                        return this.ob$type.tp$call([year, month, day]);
                    },
                    $flags: { NamedArgs: ["year", "month", "day"], Defaults: [pyNone, pyNone, pyNone] },
                    $textsig: null,
                    $doc: "Return date with new specified fields.",
                },
                __reduce__: {
                    $meth() {
                        return new pyTuple([this.ob$type, new pyTuple([this.$getState()])]);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "__reduce__() -> (cls, state)",
                },
            },
            getsets: {
                year: {
                    $get() {
                        return new pyInt(this.$year);
                    },
                    $doc: "year (1-9999)",
                },
                month: {
                    $get() {
                        return new pyInt(this.$month);
                    },
                    $doc: "month (1-12)",
                },
                day: {
                    $get() {
                        return new pyInt(this.$day);
                    },
                    $doc: "day (1-31)",
                },
            },
            proto: {
                $cmp(other) {
                    const this_state = [this.$year, this.$month, this.$day];
                    const other_state = [other.$year, other.$month, other.$day];
                    return _cmp(this_state, other_state);
                },
                $getState() {
                    const [yhi, ylo] = $divMod(this.$year, 256);
                    return new pyBytes([yhi, ylo, this.$month, this.$day]);
                },
                $setState(bytes) {
                    const [yhi, ylo, month, day] = bytes;
                    const year = yhi * 256 + ylo;
                    this.$year = year;
                    this.$month = month;
                    this.$day = day;
                },
                $toOrdinal() {
                    return _ymd2ord(this.$year, this.$month, this.$day);
                },
                $isoformat() {
                    return new pyStr(`${_d(this.$year, "0", 4)}-${_d(this.$month, "0", 2)}-${_d(this.$day, "0", 2)}`);
                },
                $timetuple() {
                    return _build_struct_time(this.$year, this.$month, this.$day, this.$hour || 0, this.$min || 0, this.$sec || 0, -1);
                },
                $strftime(fmt = "") {
                    // convenience method
                    return _wrap_strftime(this, fmt.toString(), this.$timetuple());
                },
            },
        }));

        date.prototype.min = new date(1, 1, 1);
        date.prototype.max = new date(9999, 12, 31);
        date.prototype.resolution = new timedelta(1);

        const tzinfo = (mod.tzinfo = buildNativeClass("datetime.tzinfo", {
            constructor: function tzinfo() {},
            methods: {
                tzname: {
                    $meth: function tzname(dt) {
                        throw new NotImplementedError("tzinfo subclass must override tzname()");
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "datetime -> string name of time zone.",
                },
                utcoffset: {
                    $meth: function utcoffset(dt) {
                        throw new NotImplementedError("tzinfo subclass must override utcoffset()");
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "datetime -> timedelta showing offset from UTC, negative values indicating West of UTC",
                },
                dst: {
                    $meth: function dst(dt) {
                        throw new NotImplementedError("tzinfo subclass must override dst()");
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "datetime -> DST offset as timedelta positive east of UTC.",
                },
                fromutc: {
                    $meth: function fromutc(dt) {
                        if (!(dt instanceof datetime)) {
                            throw new TypeError("fromutc() requires a datetime argument");
                        }
                        if (dt.$tzinfo !== this) {
                            throw new ValueError("dt.tzinfo is not self");
                        }
                        const dtoff = pyCall(dt.tp$getattr(str_utcoff));
                        if (dtoff === pyNone) {
                            throw new ValueError("fromutc() requires a non-None utcoffset() result");
                        }
                        let dtdst = pyCall(dt.tp$getattr(str_dst));
                        if (dtdst === pyNone) {
                            throw new ValueError("fromutc() requires a non-None dst() result");
                        }
                        const delta = binOp(dtoff, dtdst, "Sub");
                        if (isTrue(delta)) {
                            dt = binOp(dt, delta, "Add");
                            dtdst = pyCall(dt.tp$getattr(str_dst));
                            if (dtdst === pyNone) {
                                throw new ValueError("fromutc(): dt.dst gave inconsistent results; cannot convert");
                            }
                        }
                        return binOp(dt, dtdst, "Add");
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "datetime in UTC -> datetime in local time.",
                },
                __reduce__: {
                    $meth() {
                        let args, state;
                        const getinitargs = getattr(this, new pyStr("__getinitargs__"), pyNone);
                        if (getinitargs !== pyNone) {
                            args = pyCall(getinitargs, []);
                        } else {
                            args = new pyTuple();
                        }

                        const getstate = getattr(this, new pyStr("__getstate__"), pyNone);
                        if (getstate !== pyNone) {
                            state = pyCall(getstate, []);
                        } else {
                            state = getattr(this, new pyStr("__dict__"), pyNone);
                            state = isTrue(state) ? state : pyNone;
                        }
                        if (state === pyNone) {
                            return new pyTuple([this.ob$type, args]);
                        } else {
                            return new pyTuple([this.ob$type, args, state]);
                        }
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "-> (cls, state)",
                },
            },
        }));

        const IsoCalendarDate = buildNativeClass("datetime.IsoCalendarDate", {
            base: pyTuple,
            constructor: function IsoCalendarDate(year, week, weekday) {
                this.y = year;
                this.w = week;
                this.wd = weekday;
                pyTuple.call(this, [year, week, weekday]);
            },
            slots: {
                tp$new(args, kws) {
                    const [year, week, weekday] = copyKeywordsToNamedArgs("IsoCalendarDate", ["year", "week", "weekday"], args, kws);
                    return new this.constructor(year, week, weekday);
                },
                $r() {
                    return new pyStr(`${this.tp$name}(year=${this.y}, week=${this.w}, weekday=${this.wd})`);
                },
            },
            getsets: {
                year: {
                    $get() {
                        return this.y;
                    },
                },
                week: {
                    $get() {
                        return this.w;
                    },
                },
                weekday: {
                    $get() {
                        return this.wd;
                    },
                },
            },
        });

        const time = (mod.time = buildNativeClass("datetime.time", {
            constructor: function time(hour = 0, min = 0, sec = 0, micro = 0, tzinfo = null, fold = 0) {
                this.$hour = hour;
                this.$min = min;
                this.$sec = sec;
                this.$micro = micro;
                this.$tzinfo = tzinfo || pyNone;
                this.$fold = fold;
                this.$hashcode = -1;
            },
            slots: {
                tp$new(args, kws) {
                    checkArgsLen("time", args, 0, 5);
                    let [hour, minute, second, microsecond, tzinfo, fold] = copyKeywordsToNamedArgs(
                        "time",
                        ["hour", "minute", "second", "microsecond", "tzinfo", "fold"],
                        args,
                        kws,
                        [int0, int0, int0, int0, pyNone, int0]
                    );
                    let asBytes;
                    if (
                        hour instanceof pyBytes &&
                        (asBytes = hour.valueOf()).length === 6 &&
                        (asBytes[0] & 0x7f) < 24
                    ) {
                        // copy support
                        const self = new this.constructor();
                        self.$setState(asBytes, minute === int0 ? pyNone : minute);
                        return self;
                    }
                    [hour, minute, second, microsecond, fold] = _check_time_fields(hour, minute, second, microsecond, fold);
                    _check_tzinfo_arg(tzinfo);
                    if (this === time.prototype) {
                        return new time(hour, minute, second, microsecond, tzinfo, fold);
                    } else {
                        const instance = new this.constructor();
                        time.call(instance, hour, minute, second, microsecond, tzinfo, fold);
                        return instance;
                    }
                },
                tp$richcompare(other, op) {
                    if (!(other instanceof time)) {
                        return pyNotImplemented;
                    }
                    return _do_compare(this, other, op);
                },
                tp$hash() {
                    if (this.$hashcode === -1) {
                        const t = this.$fold ? pyCall(this.tp$getattr(str_replace), [], ["fold", int0]) : this;
                        const tzoff = pyCall(t.tp$getattr(str_utcoff));
                        if (!isTrue(tzoff)) {
                            this.$hashcode = objectHash(t.$getState()[0]);
                        } else {
                            let [h, m] = pyDivMod(new timedelta(0, this.$hour * 3600 + this.$min * 60).nb$subtract(tzoff), td_hour);
                            m = m.nb$floor_divide(td_min);

                            if (0 <= h && h <= 24) {
                                h = asnum$(h);
                                m = asnum$(m);
                                this.$hashcode = objectHash(new time(h, m, this.$sec, this.$micro));
                            } else {
                                this.$hashcode = objectHash(new pyTuple([h, m, new pyInt(this.$sec), new pyInt(this.$micro)]));
                            }
                        }
                    }
                    return this.$hashcode;
                },
                $r() {
                    let s;
                    if (this.$micro !== 0) {
                        s = `, ${this.$sec}, ${this.$micro}`;
                    } else if (this.$sec !== 0) {
                        s = `, ${this.$sec}`;
                    } else {
                        s = "";
                    }
                    s = `${this.tp$name}(${this.$hour}, ${this.$min}${s})`;
                    if (this.$tzinfo !== pyNone) {
                        s = s.slice(0, -1) + ", tzinfo=" + objectRepr(this.$tzinfo) + ")";
                    }
                    if (this.$fold) {
                        s = s.slice(0, -1) + ", fold=1)";
                    }
                    return new pyStr(s);
                },
                tp$str() {
                    return this.tp$getattr(str_isoformat).tp$call([]);
                },
            },
            methods: {
                isoformat: {
                    $meth: function isoformat(timespec) {
                        let s = _format_time(this.$hour, this.$min, this.$sec, this.$micro, timespec);
                        const tz = this.$tzstr();
                        if (tz) {
                            s += tz;
                        }
                        return new pyStr(s);
                    },
                    $flags: { NamedArgs: ["timespec"], Defaults: [str_auto] },
                    $textsig: null,
                    $doc: "Return string in ISO 8601 format, [HH[:MM[:SS[.mmm[uuu]]]]][+HH:MM].\n\ntimespec specifies what components of the time to include.\n",
                },
                strftime: {
                    $meth: function strftime(fmt) {
                        if (!checkString(fmt)) {
                            throw new TypeError("must be str, not " + typeName(fmt));
                        }
                        fmt = fmt.toString();
                        const timetuple = new pyTuple([1900, 1, 1, this.$hour, this.$min, this.$sec, 0, 1, -1].map((x) => new pyInt(x)));
                        return _wrap_strftime(this, fmt, timetuple);
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "format -> strftime() style string.",
                },
                __format__: {
                    $meth: function __format__(fmt) {
                        if (!checkString(fmt)) {
                            throw new TypeError("must be str, not " + typeName(fmt));
                        }
                        if (fmt !== pyStr.$empty) {
                            return this.tp$getattr(str_strftime).tp$call([fmt]);
                        }
                        return this.tp$str();
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "Formats self with strftime.",
                },
                utcoffset: {
                    $meth: function utcoffset() {
                        if (this.$tzinfo === pyNone) {
                            return pyNone;
                        }
                        const offset_f = this.$tzinfo.tp$getattr(str_utcoff);
                        const offset = pyCall(offset_f, [pyNone]);
                        _check_utc_offset("utcoffset", offset);
                        return offset;
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return self.tzinfo.utcoffset(self).",
                },
                tzname: {
                    $meth: function tzname() {
                        if (this.$tzinfo === pyNone) {
                            return pyNone;
                        }
                        const name_f = this.$tzinfo.tp$getattr(str_tzname);
                        const name = pyCall(name_f, [pyNone]);
                        _check_tzname(name);
                        return name;
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return self.tzinfo.tzname(self).",
                },
                dst: {
                    $meth: function dst() {
                        if (this.$tzinfo === pyNone) {
                            return pyNone;
                        }
                        const dst_f = this.$tzinfo.tp$getattr(str_dst);
                        const offset = pyCall(dst_f, [pyNone]);
                        _check_utc_offset("dst", offset);
                        return offset;
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return self.tzinfo.dst(self).",
                },
                replace: {
                    $meth: function replace(args, kws) {
                        checkArgsLen("replace", args, 0, 5);
                        let [hour, minute, second, microsecond, tzinfo, fold] = copyKeywordsToNamedArgs(
                            "replace",
                            ["hour", "minute", "second", "microsecond", "tzinfo", "fold"],
                            args,
                            kws,
                            [pyNone, pyNone, pyNone, pyNone, pyTrue, pyNone]
                        );
                        if (hour === pyNone) {
                            hour = new pyInt(this.$hour);
                        }
                        if (minute === pyNone) {
                            minute = new pyInt(this.$min);
                        }
                        if (second === pyNone) {
                            second = new pyInt(this.$sec);
                        }
                        if (microsecond === pyNone) {
                            microsecond = new pyInt(this.$micro);
                        }
                        if (tzinfo === pyTrue) {
                            tzinfo = this.$tzinfo;
                        }
                        if (fold === pyNone) {
                            fold = new pyInt(this.$fold);
                        }
                        return this.ob$type.tp$call([hour, minute, second, microsecond, tzinfo], ["fold", fold]);
                    },
                    $flags: { FastCall: true },
                    $textsig: null,
                    $doc: "Return time with new specified fields.",
                },
                __reduce_ex__: {
                    $meth(protocol) {
                        return new pyTuple([this.ob$type, new pyTuple(this.$getState(toJs(protocol)))]);
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "__reduce_ex__(proto) -> (cls, state)",
                },
                __reduce__: {
                    $meth() {
                        return this.tp$getattr(new pyStr("__reduce_ex__")).tp$call([new pyInt(2)]);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "__reduce__() -> (cls, state)",
                },
            },
            classmethods: {
                fromisoformat: {
                    $meth: function fromisoformat(time_string) {
                        if (!checkString(time_string)) {
                            throw new TypeError("fromisoformat: argument must be str");
                        }
                        time_string = time_string.toString();
                        try {
                            return this.tp$call(_parse_isoformat_time(time_string));
                        } catch {
                            throw new ValueError("Invalid isofrmat string: '" + time_string + "'");
                        }
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "string -> time from time.isoformat() output",
                },
            },
            getsets: {
                hour: {
                    $get() {
                        return new pyInt(this.$hour);
                    },
                },
                minute: {
                    $get() {
                        return new pyInt(this.$min);
                    },
                },
                second: {
                    $get() {
                        return new pyInt(this.$sec);
                    },
                },
                microsecond: {
                    $get() {
                        return new pyInt(this.$micro);
                    },
                },
                tzinfo: {
                    $get() {
                        return this.$tzinfo;
                    },
                },
                fold: {
                    $get() {
                        return new pyInt(this.$fold);
                    },
                },
            },
            proto: {
                $cmp(other, op) {
                    const mytz = this.$tzinfo;
                    const ottz = other.$tzinfo;
                    let myoff, otoff;
                    myoff = otoff = pyNone;
                    let base_compare;
                    if (mytz === ottz) {
                        base_compare = true;
                    } else {
                        myoff = pyCall(this.tp$getattr(str_utcoff));
                        otoff = pyCall(other.tp$getattr(str_utcoff));
                        base_compare = richCompareBool(myoff, otoff, "Eq");
                    }
                    if (base_compare) {
                        return _cmp([this.$hour, this.$min, this.$sec, this.$micro], [other.$hour, other.$min, other.$sec, other.$micro]);
                    }
                    if (myoff === pyNone || otoff === pyNone) {
                        if (op === "Eq" || op === "NotEq") {
                            return 2;
                        } else {
                            throw new TypeError("cannot compare naive and aware times");
                        }
                    }
                    const myhhmm = this.$hour * 60 + this.$min - asIndexSized(myoff.nb$floor_divide(td_min));
                    const othhmm = other.$hour * 60 + other.$min - asIndexSized(otoff.nb$floor_divide(td_min));
                    return _cmp([myhhmm, this.$sec, this.$micro], [othhmm, other.$sec, other.$micro]);
                },
                $tzstr() {
                    const off = pyCall(this.tp$getattr(str_utcoff));
                    return _format_offset(off);
                },
                $getState(protocol = 3) {
                    let [_, us3] = $divMod(this.$micro, 256);
                    let [us1, us2] = $divMod(_, 256);
                    let h = this.$hour;
                    if (this.$fold && protocol > 3) {
                        h += 128;
                    }
                    const basestate = new pyBytes([h, this.$min, this.$sec, us1, us2, us3]);
                    if (this.$tzinfo === pyNone) {
                        return [basestate];
                    } else {
                        return [basestate, this.$tzinfo];
                    }
                },
                $setState(bytes, tzinfo) {
                    const [h, min, sec, us1, us2, us3] = bytes;
                    if (h > 127) {
                        this.$fold = 1;
                        this.$hour = h - 128;
                    } else {
                        this.$fold = 0;
                        this.$hour = h;
                    }
                    this.$min = min;
                    this.$sec = sec;
                    this.$micro = (((us1 << 8) | us2) << 8) | us3;
                    this.$tzinfo = tzinfo;
                },
            },
        }));

        time.prototype.min = new time(0, 0, 0);
        time.prototype.max = new time(23, 59, 59, 999999);
        time.prototype.resolution = new timedelta();

        const datetime = (mod.datetime = buildNativeClass("datetime.datetime", {
            base: date,
            constructor: function datetime(year, month, day, hour = 0, minute = 0, second = 0, microsecond = 0, tzinfo = null, fold = 0) {
                this.$year = year;
                this.$month = month;
                this.$day = day;
                this.$hour = hour;
                this.$min = minute;
                this.$sec = second;
                this.$micro = microsecond;
                this.$tzinfo = tzinfo || pyNone;
                this.$fold = fold;
                this.$hashcode = -1;
            },
            slots: {
                tp$new(args, kws) {
                    checkArgsLen("datetime", args, 0, 9);
                    let [year, month, day, hour, minute, second, microsecond, tzinfo, fold] = copyKeywordsToNamedArgs(
                        "time",
                        ["year", "month", "day", "hour", "minute", "second", "microsecond", "tzinfo", "fold"],
                        args,
                        kws,
                        [null, null, int0, int0, int0, int0, pyNone, int0]
                    );
                    let asBytes;
                    if (
                        year instanceof pyBytes &&
                        (asBytes = year.valueOf()).length === 10 &&
                        (asBytes[2] & 0x7f) <= 12
                    ) {
                        // copy support
                        const self = new this.constructor();
                        self.$setState(asBytes, month === null ? pyNone : month);
                        return self;
                    }
                    [year, month, day] = _check_date_fields(year, month, day);
                    [hour, minute, second, microsecond, fold] = _check_time_fields(hour, minute, second, microsecond, fold);
                    _check_tzinfo_arg(tzinfo);
                    if (this === datetime.prototype) {
                        return new datetime(year, month, day, hour, minute, second, microsecond, tzinfo, fold);
                    } else {
                        const instance = new this.constructor();
                        datetime.call(instance, year, month, day, hour, minute, second, microsecond, tzinfo, fold);
                        return instance;
                    }
                },
                $r() {
                    const L = [this.$year, this.$month, this.$day, this.$hour, this.$min, this.$sec, this.$micro];
                    if (L[L.length - 1] === 0) {
                        L.pop();
                    }
                    if (L[L.length - 1] === 0) {
                        L.pop();
                    }
                    let s = `${this.tp$name}(${L.join(", ")})`;
                    if (this.$tzinfo !== pyNone) {
                        s = s.slice(0, -1) + ", tzinfo=" + objectRepr(this.$tzinfo) + ")";
                    }
                    if (this.$fold) {
                        s = s.slice(0, -1) + ", fold=1)";
                    }
                    return new pyStr(s);
                },
                tp$str() {
                    return this.tp$getattr(str_isoformat).tp$call([], ["sep", new pyStr(" ")]);
                },
                tp$richcompare(other, op) {
                    if (other instanceof datetime) {
                        return _do_compare(this, other, op);
                    }
                    if (!(other instanceof date)) {
                        return pyNotImplemented;
                    }
                    if (op === "Eq" || op === "NotEq") {
                        return op === "NotEq";
                    }
                    throw new TypeError(`can't compare '${typeName(this)}' to '${typeName(other)}'`);
                },
                tp$as_number: true,
                nb$add(other) {
                    if (!(other instanceof timedelta)) {
                        return pyNotImplemented;
                    }
                    let delta = new timedelta(this.$toOrdinal(), this.$hour * 3600 + this.$min * 60 + this.$sec, this.$micro);

                    delta = binOp(delta, other, "Add");
                    let [hour, rem] = $divMod(delta.$secs, 3600);
                    let [minute, second] = $divMod(rem, 60);
                    if (0 < delta.$days && delta.$days <= _MAXORDINAL) {
                        return this.ob$type
                            .tp$getattr(new pyStr("combine"))
                            .tp$call([date.tp$call(_ord2ymd(delta.$days)), new time(hour, minute, second, delta.$micro, this.$tzinfo)]);
                    }
                    throw new OverflowError("result out of range");
                },
                nb$subtract(other) {
                    if (!(other instanceof datetime)) {
                        if (other instanceof timedelta) {
                            return this.nb$add(other.nb$negative());
                        }
                        return pyNotImplemented;
                    }
                    const days1 = this.$toOrdinal();
                    const days2 = other.$toOrdinal();
                    const secs1 = this.$sec + this.$min * 60 + this.$hour * 3600;
                    const secs2 = other.$sec + other.$min * 60 + other.$hour * 3600;
                    const base = new timedelta(days1 - days2, secs1 - secs2, this.$micro - other.$micro);
                    if (this.$tzinfo === other.$tzinfo) {
                        return base;
                    }
                    const myoff = pyCall(this.tp$getattr(str_utcoff));
                    const otoff = pyCall(other.tp$getattr(str_utcoff));
                    if (richCompareBool(myoff, otoff, "Eq")) {
                        return base;
                    }
                    if (myoff === pyNone || otoff === pyNone) {
                        throw new TypeError("cannot mix naive and timezone-aware time");
                    }
                    return base.nb$add(otoff).nb$subtract(myoff);
                },
                nb$reflected_subtract: null,
                tp$hash() {
                    if (this.$hashcode === -1) {
                        const t = this.$fold ? pyCall(this.tp$getattr(str_replace), [], ["fold", int0]) : this;
                        const tzoff = pyCall(t.tp$getattr(str_utcoff));
                        if (tzoff === pyNone) {
                            this.$hashcode = objectHash(t.$getState()[0]);
                        } else {
                            const days = _ymd2ord(this.$year, this.$month, this.$day);
                            const seconds = this.$hour * 3600 + this.$min * 60 + this.$sec;
                            this.$hashcode = objectHash(new timedelta(days, seconds, this.$micro).nb$subtract(tzoff));
                        }
                    }
                    return this.$hashcode;
                },
            },
            methods: {
                date: {
                    $meth: function _date() {
                        return new date(this.$year, this.$month, this.$day);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return date object with same year, month and day.",
                },
                time: {
                    $meth: function _time() {
                        return new time(this.$hour, this.$min, this.$sec, this.$micro, pyNone, this.$fold);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return time object with same time but with tzinfo=None.",
                },
                timetz: {
                    $meth: function timetz() {
                        return new time(this.$hour, this.$min, this.$sec, this.$micro, this.$tzinfo, this.$fold);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return time object with same time and tzinfo.",
                },
                ctime: {
                    $meth: function ctime() {
                        const weekday = this.$toOrdinal() % 7 || 7;
                        const day_name = _DAYNAMES[weekday];
                        const month_name = _MONTHNAMES[this.$month];
                        return new pyStr(
                            `${day_name} ${month_name} ${_d(this.$day, " ", 2)} ${_d(this.$hour, "0", 2)}:${_d(this.$min, "0", 2)}:${_d(this.$sec, "0", 2)} ${_d(
                                this.$year,
                                "0",
                                4
                            )}`
                        );
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return ctime() style string.",
                },
                timetuple: {
                    $meth: function timetuple() {
                        let dst = pyCall(this.tp$getattr(str_dst));
                        if (dst === pyNone) {
                            dst = -1;
                        } else if (isTrue(dst)) {
                            dst = 1;
                        } else {
                            dst = 0;
                        }
                        return _build_struct_time(this.$year, this.$month, this.$day, this.$hour, this.$min, this.$sec, dst);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return time tuple, compatible with time.localtime().",
                },
                timestamp: {
                    $meth: function timestamp() {
                        if (this.$tzinfo === pyNone) {
                            let s = this.$mkTime();
                            s = asnum$(s);
                            return new pyFloat(s + this.$micro / 1e6);
                        } else {
                            const diff = binOp(this, _EPOCH, "Sub");
                            return new pyFloat(((diff.$days * 86400 + diff.$secs) * 10 ** 6 + diff.$micro) / 10 ** 6);
                        }
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return POSIX timestamp as float.",
                },
                utctimetuple: {
                    $meth: function utctimetuple() {
                        const offset = pyCall(this.tp$getattr(str_utcoff));
                        let self = this;
                        if (isTrue(offset)) {
                            self = binOp(self, offset, "Sub");
                        }
                        return _build_struct_time(self.$year, self.$month, self.$day, self.$hour, self.$min, self.$sec, 0);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return UTC time tuple, compatible with time.localtime().",
                },
                isoformat: {
                    $meth: function isoformat(sep, timespec) {
                        if (!checkString(sep)) {
                            throw new TypeError("sep must be str, not " + typeName(sep));
                        }
                        let s = `${_d(this.$year, "0", 4)}-${_d(this.$month, "0", 2)}-${_d(this.$day, "0", 2)}` + sep.toString();
                        s += _format_time(this.$hour, this.$min, this.$sec, this.$micro, timespec);
                        const off = pyCall(this.tp$getattr(str_utcoff));
                        const tz = _format_offset(off);
                        if (tz) {
                            s += tz;
                        }
                        return new pyStr(s);
                    },
                    $flags: { NamedArgs: ["sep", "timespec"], Defaults: [new pyStr("T"), str_auto] },
                    $textsig: null,
                    $doc:
                        "[sep] -> string in ISO 8601 format, YYYY-MM-DDT[HH[:MM[:SS[.mmm[uuu]]]]][+HH:MM].\nsep is used to separate the year from the time, and defaults to 'T'.\ntimespec specifies what components of the time to include (allowed values are 'auto', 'hours', 'minutes', 'seconds', 'milliseconds', and 'microseconds').\n",
                },
                utcoffset: {
                    $meth: function utcoffset() {
                        if (this.$tzinfo === pyNone) {
                            return pyNone;
                        }
                        const offset_f = this.$tzinfo.tp$getattr(str_utcoff);
                        const offset = pyCall(offset_f, [this]);
                        _check_utc_offset("utcoffset", offset);
                        return offset;
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return self.tzinfo.utcoffset(self).",
                },
                tzname: {
                    $meth: function tzname() {
                        if (this.$tzinfo === pyNone) {
                            return pyNone;
                        }
                        const name_f = this.$tzinfo.tp$getattr(str_tzname);
                        const name = pyCall(name_f, [this]);
                        _check_tzname(name);
                        return name;
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return self.tzinfo.tzname(self).",
                },
                dst: {
                    $meth: function dst() {
                        if (this.$tzinfo === pyNone) {
                            return pyNone;
                        }
                        const dst_f = this.$tzinfo.tp$getattr(str_dst);
                        const offset = pyCall(dst_f, [this]);
                        _check_utc_offset("dst", offset);
                        return offset;
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return self.tzinfo.dst(self).",
                },
                replace: {
                    $meth: function replace(args, kws) {
                        checkArgsLen("replace", args, 0, 8);
                        let [year, month, day, hour, minute, second, microsecond, tzinfo, fold] = copyKeywordsToNamedArgs(
                            "replace",
                            ["year", "month", "day", "hour", "minute", "second", "microsecond", "tzinfo", "fold"],
                            args,
                            kws,
                            [pyNone, pyNone, pyNone, pyNone, pyNone, pyNone, pyNone, pyTrue, pyNone]
                        );
                        if (year === pyNone) {
                            year = new pyInt(this.$year);
                        }
                        if (month === pyNone) {
                            month = new pyInt(this.$month);
                        }
                        if (day === pyNone) {
                            day = new pyInt(this.$day);
                        }
                        if (hour === pyNone) {
                            hour = new pyInt(this.$hour);
                        }
                        if (minute === pyNone) {
                            minute = new pyInt(this.$min);
                        }
                        if (second === pyNone) {
                            second = new pyInt(this.$sec);
                        }
                        if (microsecond === pyNone) {
                            microsecond = new pyInt(this.$micro);
                        }
                        if (tzinfo === pyTrue) {
                            tzinfo = this.$tzinfo;
                        }
                        if (fold === pyNone) {
                            fold = new pyInt(this.$fold);
                        }
                        return this.ob$type.tp$call([year, month, day, hour, minute, second, microsecond, tzinfo], ["fold", fold]);
                    },
                    $flags: { FastCall: true },
                    $textsig: null,
                    $doc: "Return datetime with new specified fields.",
                },
                astimezone: {
                    $meth: function astimezone(tz) {
                        if (tz === pyNone) {
                            tz = this.$localTimezone();
                        } else if (!(tz instanceof tzinfo)) {
                            throw new TypeError("tz argument must be an instance of tzinfo");
                        }
                        let mytz = this.$tzinfo;
                        let myoffset;
                        if (mytz === pyNone) {
                            mytz = this.$localTimezone();
                            myoffset = pyCall(mytz.tp$getattr(str_utcoff), [this]);
                        } else {
                            myoffset = pyCall(mytz.tp$getattr(str_utcoff), [this]);
                            if (myoffset === pyNone) {
                                mytz = pyCall(this.tp$getattr(str_replace), [], ["tzinfo", pyNone]).$localTimezone();
                                myoffset = pyCall(mytz.tp$getattr(str_utcoff), [this]);
                            }
                        }
                        if (tz === mytz) {
                            return this;
                        }
                        const utc = pyCall(this.nb$subtract(myoffset).tp$getattr(str_replace), [], ["tzinfo", tz]);
                        return tz.tp$getattr(str_fromutc).tp$call([utc]);
                    },
                    $flags: { NamedArgs: ["tz"], Defaults: [pyNone] },
                    $textsig: null,
                    $doc: "tz -> convert to local time in new timezone tz\n",
                },
                __reduce_ex__: {
                    $meth(protocol) {
                        return new pyTuple([this.ob$type, new pyTuple(this.$getState(toJs(protocol)))]);
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "__reduce_ex__(proto) -> (cls, state)",
                },
                __reduce__: {
                    $meth() {
                        return this.tp$getattr(new pyStr("__reduce_ex__")).tp$call([new pyInt(2)]);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "__reduce__() -> (cls, state)",
                },
            },
            classmethods: {
                now: {
                    $meth: function now(tz) {
                        const t = _time.time.tp$call([]);
                        return this.tp$getattr(str_fromtimestamp).tp$call([t, tz]);
                    },
                    $flags: { NamedArgs: ["tz"], Defaults: [pyNone] },
                    $textsig: "($type, /, tz=None)",
                    $doc:
                        "Returns new datetime object representing current time local to tz.\n\n  tz\n    Timezone object.\n\nIf no tz is specified, uses local timezone.",
                },
                utcnow: {
                    $meth: function utcnow() {
                        const t = _time.time.tp$call([]);
                        return this.tp$getattr(str_utcfromtimestamp).tp$call([t]);
                    },
                    $flags: { NoArgs: true },
                    $textsig: null,
                    $doc: "Return a new datetime representing UTC day and time.",
                },
                fromtimestamp: {
                    $meth: function fromtimestamp(t, tz) {
                        _check_tzinfo_arg(tz);
                        return this.prototype.$fromtimestamp.call(this, t, tz !== pyNone, tz);
                    },
                    $flags: { NamedArgs: ["timestamp", "tz"], Defaults: [pyNone] },
                    $textsig: null,
                    $doc: "timestamp[, tz] -> tz's local time from POSIX timestamp.",
                },
                utcfromtimestamp: {
                    $meth: function utcfromtimestamp(t) {
                        return this.prototype.$fromtimestamp.call(this, t, true, pyNone);
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "Construct a naive UTC datetime from a POSIX timestamp.",
                },
                strptime: {
                    $meth: function strptime(date_string, format) {
                        if (_strptime_datetime === null) {
                            return Sk.misceval.chain(Sk.importModule("_strptime", false, true), (s_mod) => {
                                _strptime_datetime = s_mod.tp$getattr(new pyStr("_strptime_datetime"));
                                return _strptime_datetime.tp$call([this, date_string, format]);
                            });
                        }
                        return _strptime_datetime.tp$call([this, date_string, format]);
                    },
                    $flags: { MinArgs: 2, MaxArgs: 2 },
                    $textsig: null,
                    $doc: "string, format -> new datetime parsed from a string (like time.strptime()).",
                },
                combine: {
                    $meth: function combine(d, t, tzinfo) {
                        if (!(d instanceof date)) {
                            throw new TypeError("date argument must be a date instance");
                        }
                        if (!(t instanceof time)) {
                            throw new TypeError("time argument must be a time instance");
                        }
                        if (tzinfo === pyTrue) {
                            tzinfo = t.$tzinfo;
                        }
                        const args = [d.$year, d.$month, d.$day, t.$hour, t.$min, t.$sec, t.$micro].map((x) => new pyInt(x));
                        args.push(tzinfo);
                        return this.tp$call(args, ["fold", new pyInt(t.$fold)]);
                    },
                    $flags: { NamedArgs: ["date", "time", "tzinfo"], Defaults: [pyTrue] },
                    $textsig: null,
                    $doc: "date, time -> datetime with same date and time fields",
                },
                fromisoformat: {
                    $meth: function fromisoformat(date_string) {
                        if (!checkString(date_string)) {
                            throw new TypeError("fromisoformat: argument must be str");
                        }
                        date_string = date_string.toString();
                        const dstr = date_string.slice(0, 10);
                        const tstr = date_string.slice(11);
                        let date_components, time_components;
                        try {
                            date_components = _parse_isoformat_date(dstr);
                        } catch (e) {
                            throw new ValueError("Invalid isoformat string: '" + date_string + "'");
                        }

                        if (tstr) {
                            try {
                                time_components = _parse_isoformat_time(tstr);
                            } catch (e) {
                                throw new ValueError("Invalid isoformat string: '" + date_string + "'");
                            }
                        } else {
                            time_components = [int0, int0, int0, int0, pyNone];
                        }
                        return this.tp$call(date_components.concat(time_components));
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "string -> datetime from datetime.isoformat() output",
                },
            },
            getsets: {
                hour: {
                    $get() {
                        return new pyInt(this.$hour);
                    },
                },
                minute: {
                    $get() {
                        return new pyInt(this.$min);
                    },
                },
                second: {
                    $get() {
                        return new pyInt(this.$sec);
                    },
                },
                microsecond: {
                    $get() {
                        return new pyInt(this.$micro);
                    },
                },
                tzinfo: {
                    $get() {
                        return this.$tzinfo;
                    },
                },
                fold: {
                    $get() {
                        return new pyInt(this.$fold);
                    },
                },
            },
            proto: {
                $cmp(other, op) {
                    const mytz = this.$tzinfo;
                    const ottz = other.$tzinfo;
                    let myoff, otoff;
                    myoff = otoff = pyNone;
                    let base_compare;
                    if (mytz === ottz) {
                        base_compare = true;
                    } else {
                        myoff = pyCall(this.tp$getattr(str_utcoff));
                        otoff = pyCall(other.tp$getattr(str_utcoff));
                        if (op === "Eq" || op === "NotEq") {
                            const my_replace = pyCall(this.tp$getattr(str_replace), [], ["fold", new pyInt(Number(!this.$fold))]);
                            if (richCompareBool(myoff, pyCall(my_replace.tp$getattr(str_utcoff)), "NotEq")) {
                                return 2;
                            }
                            const ot_replace = pyCall(other.tp$getattr(str_replace), [], ["fold", new pyInt(Number(!other.$fold))]);
                            if (richCompareBool(otoff, pyCall(ot_replace.tp$getattr(str_utcoff)), "NotEq")) {
                                return 2;
                            }
                        }
                        base_compare = richCompareBool(myoff, otoff, "Eq");
                    }
                    if (base_compare) {
                        return _cmp(
                            [this.$year, this.$month, this.$day, this.$hour, this.$min, this.$sec, this.$micro],
                            [other.$year, other.$month, other.$day, other.$hour, other.$min, other.$sec, other.$micro]
                        );
                    }
                    if (myoff === pyNone || otoff === pyNone) {
                        if (op === "Eq" || op === "NotEq") {
                            return 2;
                        } else {
                            throw new TypeError("cannot compare naive and aware datetimes");
                        }
                    }
                    const diff = this.nb$subtract(other);
                    if (diff.$days < 0) {
                        return -1;
                    }
                    return (isTrue(diff) && 1) || 0;
                },
                $mkTime() {
                    const epoch = new datetime(1970, 1, 1);
                    const max_fold_seconds = 24 * 3600;
                    const t = this.nb$subtract(epoch).nb$floor_divide(td_sec);
                    function local(u) {
                        const [y, m, d, hh, mm, ss] = _time.localtime.tp$call([u]).v;
                        return datetime.tp$call([y, m, d, hh, mm, ss]).nb$subtract(epoch).nb$floor_divide(td_sec);
                    }
                    let a = local(t).nb$subtract(t);
                    let u1 = t.nb$subtract(a);
                    let t1 = local(u1);
                    let u2, b;
                    if (t1.ob$eq(t)) {
                        u2 = u1.nb$add([new pyInt(-max_fold_seconds), new pyInt(max_fold_seconds)][this.$fold]);
                        b = local(u2).nb$subtract(u2);
                        if (a.ob$eq(b)) {
                            return u1;
                        }
                    } else {
                        b = t1.nb$subtract(u1);
                    }
                    u2 = t.nb$subtract(b);
                    const t2 = local(u2);
                    if (t2.ob$eq(t)) {
                        return u2;
                    }
                    if (t1.ob$eq(t)) {
                        return u1;
                    }
                    const max = u1.ob$ge(u2) ? u1 : u2;
                    const min = u1 === max ? u2 : u1;
                    return [max, min][this.$fold];
                },
                // $isoformat() {

                // },
                $fromtimestamp(t, utc, tz) {
                    let frac;
                    if (!checkNumber(t)) {
                        throw new TypeError("a number is required, (got '" + typeName(t) + "'");
                    }
                    [frac, t] = modf(t); // todo check type
                    let us = intRound(binOp(frac, _1e6, "Mult"));
                    us = us.v;
                    t = t.v;
                    if (us >= 1000000) {
                        t += 1;
                        us -= 1000000;
                    } else if (us < 0) {
                        t -= 1;
                        us += 1000000;
                    }
                    t = new pyInt(t);
                    if (!Number.isInteger(us)) {
                        us = Math.trunc(us);
                    }
                    us = new pyInt(us);
                    const _converter = utc ? _time.gmtime : _time.localtime;
                    function converter(t) {
                        return _converter.tp$call([t]).v; // converter returns a struct_time_seq
                    }
                    let [y, m, d, hh, mm, ss] = converter(t);
                    ss = new pyInt(Math.min(asIndexSized(ss), 59));
                    let result = pyCall(this, [y, m, d, hh, mm, ss, us, tz]);
                    if (tz === pyNone) {
                        const max_fold_seconds = 24 * 3600;
                        [y, m, d, hh, mm, ss] = converter(binOp(t, new pyInt(max_fold_seconds), "Sub"));
                        const probe1 = pyCall(this, [y, m, d, hh, mm, ss, us, tz]);
                        const trans = binOp(binOp(result, probe1, "Sub"), new timedelta(0, max_fold_seconds), "Sub");
                        if (trans.$days < 0) {
                            [y, m, d, hh, mm, ss] = converter(binOp(t, binOp(trans, td_sec, "FloorDiv"), "Add"));
                            const probe2 = pyCall(this, [y, m, d, hh, mm, ss, us, tz]);
                            if (richCompareBool(probe2, result, "Eq")) {
                                result.$fold = 1;
                            }
                        }
                    } else {
                        result = pyCall(tz.tp$getattr(new pyStr("fromutc")), [result]);
                    }
                    return result;
                },
                $localTimezone() {
                    let ts;
                    if (this.$tzinfo === pyNone) {
                        ts = this.$mkTime();
                    } else {
                        ts = this.nb$subtract(_EPOCH).nb$floor_divide(td_sec);
                    }
                    const localtm = _time.localtime.tp$call([ts]);
                    const local = datetime.tp$call(localtm.v.slice(0, 6));
                    const gmtoff = localtm.tp$getattr(new pyStr("tm_gmtoff"));
                    const zone = localtm.tp$getattr(new pyStr("tm_zone"));
                    return new timezone(timedelta.tp$call([int0, gmtoff]), zone);
                },
                $getState(protocol = 3) {
                    let [yhi, ylo] = $divMod(this.$year, 256);
                    let [_, us3] = $divMod(this.$micro, 256);
                    let [us1, us2] = $divMod(_, 256);
                    let m = this.$month;
                    if (this.$fold && protocol > 3) {
                        m += 128;
                    }
                    const basestate = new pyBytes([yhi, ylo, m, this.$day, this.$hour, this.$min, this.$sec, us1, us2, us3]);
                    if (this.$tzinfo === pyNone) {
                        return [basestate];
                    } else {
                        return [basestate, this.$tzinfo];
                    }
                },
                $setState(bytes, tzinfo) {
                    const [yhi, ylo, m, day, hour, min, sec, us1, us2, us3] = bytes;
                    if (m > 127) {
                        this.$fold = 1;
                        this.$month = m - 128;
                    } else {
                        this.$fold = 0;
                        this.$month = m;
                    }
                    this.$year = yhi * 256 + ylo;
                    this.$day = day;
                    this.$hour = hour;
                    this.$min = min;
                    this.$sec = sec;
                    this.$micro = (((us1 << 8) | us2) << 8) | us3;
                    this.$tzinfo = tzinfo;
                },
            },
        }));

        datetime.prototype.min = new datetime(1, 1, 1);
        datetime.prototype.max = new datetime(9999, 12, 31, 23, 59, 59, 999999);
        datetime.prototype.resolution = new timedelta(0, 0, 1);

        function _isoweek1monday(year) {
            const THURSDAY = 3;
            const firstday = _ymd2ord(year, 1, 1);
            const firstweekday = (firstday + 6) % 7;
            let week1monday = firstday - firstweekday;
            if (firstweekday > THURSDAY) {
                week1monday += 7;
            }
            return week1monday;
        }

        const timezone = (mod.timezone = buildNativeClass("datetime.timezone", {
            base: tzinfo,
            constructor: function timezone(offset, name) {
                this.$offset = offset;
                this.$name = name || pyNone;
                if (!(richCompareBool(this.$minoffset, offset, "LtE") && richCompareBool(this.$maxoffset, offset, "GtE"))) {
                    throw new ValueError("offset must be a timedelta strictly between -timedelta(hours=24) and timedelta(hours=24).");
                }
            },
            slots: {
                tp$new(args, kws) {
                    let [offset, name] = copyKeywordsToNamedArgs("timezone", ["offset", "name"], args, kws, [null]);
                    if (!(offset instanceof timedelta)) {
                        throw new TypeError("offset must be a timedelta");
                    }
                    if (name === null) {
                        if (!isTrue(offset)) {
                            return this.utc;
                        }
                        name = pyNone;
                    } else if (!checkString(name)) {
                        throw new TypeError("name must be a string");
                    }
                    if (this === timezone.prototype) {
                        return new timezone(offset, name);
                    } else {
                        const instance = new this.constructor();
                        timezone.call(instance, offset, name);
                        return instance;
                    }
                },
                tp$richcompare(other, op) {
                    if (!(other instanceof timezone)) {
                        return pyNotImplemented;
                    }
                    const res = richCompareBool(this.$offset, other.$offset, "Eq");
                    if (op === "NotEq") {
                        return !res;
                    } else if (op === "Eq") {
                        return res;
                    }
                    return res && opAllowsEquality(op) ? res : pyNotImplemented;
                },
                $r() {
                    if (this === this.utc) {
                        return new pyStr("datetime.timezone.utc");
                    }
                    if (this.$name === pyNone) {
                        return new pyStr(`${this.tp$name}(${objectRepr(this.$offset)})`);
                    }
                    return new pyStr(`${this.tp$name}(${objectRepr(this.$offset)}, ${objectRepr(this.$name)})`);
                },
                tp$str() {
                    return this.tp$getattr(str_tzname).tp$call([pyNone]);
                },
                tp$hash() {
                    return objectHash(this.$offset);
                },
            },
            methods: {
                tzname: {
                    $meth: function tzname(dt) {
                        if (dt instanceof datetime || dt === pyNone) {
                            if (this.$name === pyNone) {
                                return this.$nameFromOff(this.$offset);
                            }
                            return this.$name;
                        }
                        throw new TypeError("tzname() argument must be a datetime instance or None");
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "If name is specified when timezone is created, returns the name.  Otherwise returns offset as 'UTC(+|-)HH:MM'.",
                },
                utcoffset: {
                    $meth: function utcoffset(dt) {
                        if (dt instanceof datetime || dt === pyNone) {
                            return this.$offset;
                        }
                        throw new TypeError("utcoffset() argument must be a datetime instance or None");
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "Return fixed offset.",
                },
                dst: {
                    $meth: function dst(dt) {
                        if (dt instanceof datetime || dt === pyNone) {
                            return pyNone;
                        }
                        throw new TypeError("dst() argument must be a datetime instance or None");
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "Return None.",
                },
                fromutc: {
                    $meth: function fromutc(dt) {
                        if (dt instanceof datetime) {
                            if (dt.$tzinfo !== this) {
                                throw new ValueError("fromutc: dt.tzinfo is not self");
                            }
                            return binOp(dt, this.$offset, "Add");
                        }
                        throw new TypeError("fromutc() argument must be a datetime instance or None");
                    },
                    $flags: { OneArg: true },
                    $textsig: null,
                    $doc: "datetime in UTC -> datetime in local time.",
                },
                __getinitargs__: {
                    $meth() {
                        /** @todo - copy doesn't recognize getinitargs yet */
                        if (this.$name === pyNone) {
                            return new pyTuple([this.$offset]);
                        }
                        return new pyTuple([this.$offset, this.$name]);
                    },
                    $flags: { NoArgs: true },
                }
            },
            proto: {
                $maxoffset: new timedelta(0, 86399, 999999),
                $minoffset: new timedelta(-1, 0, 1),
                $nameFromOff(delta) {
                    if (!isTrue(delta)) {
                        return new pyStr("UTC");
                    }
                    let sign, h, rest, m, s, ms;
                    if (richCompareBool(delta, td_0, "Lt")) {
                        sign = "-";
                        delta = delta.nb$negative();
                    } else {
                        sign = "+";
                    }
                    [h, rest] = pyDivMod(delta, td_hour);
                    [m, rest] = pyDivMod(rest, td_min);
                    s = rest.$secs;
                    ms = rest.$micro;
                    if (ms) {
                        return new pyStr(`UTC${sign}${_d(h)}:${_d(m)}:${_d(s)}.${_d(ms, "0", 6)}`);
                    }
                    if (s) {
                        return new pyStr(`UTC${sign}${_d(h)}:${_d(m)}:${_d(s)}`);
                    }
                    return new pyStr(`UTC${sign}${_d(h)}:${_d(m)}`);
                },
            },
        }));

        timezone.prototype.utc = new timezone(new timedelta(0));
        timezone.prototype.min = new timezone(new timedelta(0, -86340, 0));
        timezone.prototype.max = new timezone(new timedelta(0, 86340, 0));
        const _EPOCH = new datetime(1970, 1, 1, 0, 0, 0, 0, timezone.prototype.utc);

        return mod;
    });
}