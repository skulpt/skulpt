/*
 implementation of the Python time package.

 notes:
 - struct_time is a structseq but structseq does not implement methods: 'n_fields', 'n_sequence_fields', 'n_unnamed_fields' yet

 ['__doc__', '__file__', '__name__', '__package__', 'accept2dyear', 'altzone', 'asctime', 'clock', 'ctime', 'daylight', 'gmtime', 'localtime', 'mktime', 'sleep', 'strftime', 'strptime', 'struct_time', 'time', 'timezone', 'tzname', 'tzset']
 */

var $builtinmodule = function (name) {
    var mod = {};


    mod.__package__ = new Sk.builtin.str("");

    var struct_time_fields = {
        "tm_year": "year, for example, 1993",
        "tm_mon": "month of year, range [1, 12]",
        "tm_mday": "day of month, range [1, 31]",
        "tm_hour": "hours, range [0, 23]",
        "tm_min": "minutes, range [0, 59]",
        "tm_sec": "seconds, range [0, 61]",
        "tm_wday": "day of week, range [0, 6], Monday is 0",
        "tm_yday": "day of year, range [1, 366]",
        "tm_isdst": "1 if summer time is in effect, 0 if not, and -1 if unknown"
    };

    var struct_time_f = Sk.builtin.make_structseq('time', 'struct_time', struct_time_fields);

    mod.struct_time = struct_time_f;

    function check_struct_time(t) {
        if (!(t instanceof struct_time_f)) {
            throw new Sk.builtin.TypeError("Required argument 'struct_time' must be of type: 'struct_time'");
        }
        var i;
        var len = t.v.length;
        var obj = t.v;
        for (i = 0; i < len; ++i) {
            if (!Sk.builtin.checkInt(obj[i])) {
                throw new Sk.builtin.TypeError("struct_time may only contain integers");
            }
        }
        return true;
    }

    mod.time = new Sk.builtin.func(function () {
        Sk.builtin.pyCheckArgsLen("time", arguments.length, 0, 0);
        var res = Date.now();
        if (this.performance && this.performance.now)
        {
            res = res + performance.now() % 1;
        }
        return Sk.builtin.assk$(res / 1000, undefined);
    });

    // This is an experimental implementation of time.sleep(), using suspensions
    mod.sleep = new Sk.builtin.func(function(delay) {
        Sk.builtin.pyCheckArgsLen("sleep", arguments.length, 1, 1);
        Sk.builtin.pyCheckType("delay", "float", Sk.builtin.checkNumber(delay));

        return new Sk.misceval.promiseToSuspension(new Promise(function(resolve) {
            Sk.setTimeout(function() {
                resolve(Sk.builtin.none.none$);
            }, Sk.ffi.remapToJs(delay)*1000);
        }));
    });

    function padLeft(str, l, c) {
        var _str = str.toString();
        return Array(l - _str.length + 1).join(c || " ") + _str;
    }

    function isLeapYear(year) {
        if((year & 3) != 0) return false;
        return ((year % 100) != 0 || (year % 400) == 0);
    }

    function getDayOfYear(date,utc) {
        utc = utc || false;
        var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var mn = utc ? date.getUTCMonth() : date.getMonth();
        var dn = utc ? date.getUTCDate() : date.getDate();
        var dayOfYear = dayCount[mn] + dn;
        if(mn > 1 && isLeapYear(utc ? date.getUTCFullYear() : date.getFullYear())) dayOfYear++;
        return dayOfYear;
    }

    function stdTimezoneOffset() {
        var jan = new Date(2002, 0, 1);
        var jul = new Date(2002, 6, 1);
        return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    }

    function altTimezoneOffset() {
        var jan = new Date(2002, 0, 1);
        var jul = new Date(2002, 6, 1);
        return Math.min(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    }

    function dst(date) {
        return date.getTimezoneOffset() < stdTimezoneOffset();
    }

    /**
     * ToDo: This is broken since FireFox Version 47 on Windows 10,
     *       FIXED it by checking the result of the exec
     *
     * @param {any} date
     * @returns
     */
    function timeZoneName(date) {
        var result = /\((.*)\)/.exec(date.toString());
        var language;

        if (this.navigator != null) {
            language = this.navigator.userLanguage || this.navigator.language;
        }

        if (result && result.length > 1) {
            return result[1];
        } else {
            if (language === undefined) {
                return null;
            }

            // Try 2nd way, using the locale string, this does not work in Safari (26.07.2016)
            try {
                var localeString = date.toLocaleString(language, { timeZoneName: "short" });
                result = localeString.split(" ");
                return result[result.length - 1];
            } catch (e) {
                return null;
            }
        }
    }

    function timeZoneNames() {
        var jan = new Date(2002, 0, 1);
        var jul = new Date(2002, 6, 1);
        if (dst(jan)) {
            return [new Sk.builtin.str(timeZoneName(jul)), new Sk.builtin.str(timeZoneName(jan))];
        } else {
            return [new Sk.builtin.str(timeZoneName(jan)), new Sk.builtin.str(timeZoneName(jul))];
        }
    }

    function date_to_struct_time(date, utc) {
        utc = utc || false;
        // y, m, d, hh, mm, ss, weekday, jday, dst
        return new struct_time_f(
            [
                Sk.builtin.assk$(utc ? date.getUTCFullYear() : date.getFullYear()),
                Sk.builtin.assk$((utc ? date.getUTCMonth() : date.getMonth()) + 1), // want January == 1
                Sk.builtin.assk$(utc ? date.getUTCDate() : date.getDate()),
                Sk.builtin.assk$(utc ? date.getUTCHours() : date.getHours()),
                Sk.builtin.assk$(utc ? date.getUTCMinutes() : date.getMinutes()),
                Sk.builtin.assk$(utc ? date.getUTCSeconds() : date.getSeconds()),
                Sk.builtin.assk$(((utc ? date.getUTCDay() : date.getDay()) + 6) % 7), // Want Monday == 0
                Sk.builtin.assk$(getDayOfYear(date, utc)), // Want January, 1 == 1
                Sk.builtin.assk$(utc ? 0 : (dst(date) ? 1 : 0)) // 1 for DST /0 for non-DST /-1 for unknown
            ]
        );
    }

    function from_seconds(secs, asUtc) {
        var d = new Date();
        if (secs) {
            Sk.builtin.pyCheckType("secs", "number", Sk.builtin.checkNumber(secs));
            var seconds = Sk.builtin.asnum$(secs);
            d.setTime(seconds * 1000);
        }
        return date_to_struct_time(d, asUtc);
    }

    mod.localtime = new Sk.builtin.func(function(secs) {
        Sk.builtin.pyCheckArgsLen("localtime", arguments.length, 0, 1);
        return from_seconds(secs, false);
    });

    mod.gmtime = new Sk.builtin.func(function(secs) {
        Sk.builtin.pyCheckArgsLen("gmtime", arguments.length, 0, 1);
        return from_seconds(secs, true);
    });

    var monthnames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var daynames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    function asctime_f(time) {
        Sk.builtin.pyCheckArgsLen("asctime", arguments.length, 0, 1);

        if (!time || Sk.builtin.checkNone(time))
        {
            time = from_seconds();
        } else if (!(time instanceof struct_time_f)) {
            time = new struct_time_f(time);
        }
        if (time instanceof Sk.builtin.tuple && time.v.length == 9)
        {
            // todo: test validity??
            var parts = [];
            parts.push(daynames[Sk.builtin.asnum$(time.v[6])]);
            parts.push(monthnames[Sk.builtin.asnum$(time.v[1])-1]);
            parts.push(padLeft(Sk.builtin.asnum$(time.v[2]).toString(), 2, '0'));
            parts.push(
                padLeft(Sk.builtin.asnum$(time.v[3]).toString(), 2, '0') + ":" +
                padLeft(Sk.builtin.asnum$(time.v[4]).toString(), 2, '0') + ":" +
                padLeft(Sk.builtin.asnum$(time.v[5]).toString(), 2, '0')
            );
            parts.push(padLeft(Sk.builtin.asnum$(time.v[0]).toString(), 4, '0'));

            return new Sk.builtin.str(parts.join(" "));
        }
    }

    mod.asctime = new Sk.builtin.func(asctime_f);

    mod.ctime = new Sk.builtin.func(function(secs) {
        Sk.builtin.pyCheckArgsLen("ctime", arguments.length, 0, 1);
        return asctime_f(from_seconds(secs));
    });

    function mktime_f(time) {
        Sk.builtin.pyCheckArgsLen("mktime", arguments.length, 1, 1);

        if (time instanceof Sk.builtin.tuple && time.v.length == 9)
        {
            var d = new Date(Sk.builtin.asnum$(time.v[0]),
                             Sk.builtin.asnum$(time.v[1])-1,
                             Sk.builtin.asnum$(time.v[2]),
                             Sk.builtin.asnum$(time.v[3]),
                             Sk.builtin.asnum$(time.v[4]),
                             Sk.builtin.asnum$(time.v[5]));
            return Sk.builtin.assk$(d.getTime() / 1000, undefined);
        } else {
            throw new Sk.builtin.TypeError("mktime() requires a struct_time or 9-tuple");
        }
    }

    mod.mktime = new Sk.builtin.func(mktime_f);

    /*
    The offset of the local (non-DST) timezone, in seconds west of UTC (negative in most of Western Europe,
    positive in the US, zero in the UK).
    */
    mod.timezone = new Sk.builtin.int_(stdTimezoneOffset() * 60);

    /*
    The offset of the local DST timezone, in seconds west of UTC, if one is defined. This is negative if the
    local DST timezone is east of UTC (as in Western Europe, including the UK). Only use this if daylight is nonzero.
    */
    mod.altzone = new Sk.builtin.int_(altTimezoneOffset() * 60);

    /*
    Nonzero if a DST timezone is defined.
    */
    mod.daylight = new Sk.builtin.int_(dst(new Date()) ? 1 : 0);

    /*
    A tuple of two strings: the first is the name of the local non-DST timezone, the second is the name of the local
    DST timezone. If no DST timezone is defined, the second string should not be used.
    */
    mod.tzname = new Sk.builtin.tuple(timeZoneNames());

    mod.accept2dyear = Sk.builtin.assk$(1);

    mod.clock = new Sk.builtin.func(function() {
        var res = 0.0;
        if (this.performance && this.performance.now)
        {
            res = performance.now() / 1000;
        } else {
            res = new Date().getTime() / 1000;
        }
        return new Sk.builtin.float_(res);
    });

    function strftime_f(format, t) {
        var jsFormat;

        Sk.builtin.pyCheckArgsLen("strftime", arguments.length, 1, 2);
        if (!Sk.builtin.checkString(format)) {
            throw new Sk.builtin.TypeError("format must be a string");
        }
        if (!t)
        {
            t = from_seconds();
        } else if (!(t instanceof struct_time_f)) {
            t = new struct_time_f(t);
        }

        check_struct_time(t);

        jsFormat = Sk.ffi.remapToJs(format);

        return Sk.ffi.remapToPy(strftime(jsFormat, new Date(mktime_f(t).v*1000)));
    }

    mod.strftime = new Sk.builtin.func(strftime_f);

    function tzset_f()
    {
        throw new Sk.builtin.NotImplementedError("time.tzset() is not yet implemented");
        Sk.builtin.pyCheckArgsLen("tzset", arguments.length, 0, 0);
    }

    mod.tzset = new Sk.builtin.func(tzset_f);

    function strptime_f(s, format)
    {
        Sk.builtin.pyCheckArgsLen("strptime", arguments.length, 1, 2);
        Sk.builtin.pyCheckType("string", "string", Sk.builtin.checkString(s));
        if (format !== undefined) {
            Sk.builtin.pyCheckType("format", "string", Sk.builtin.checkString(format));
        } else {
            format = new Sk.builtin.str("%a %b %d %H:%M:%S %Y");
        }

        let t = date_to_struct_time(strptime(Sk.ffi.remapToJs(s), Sk.ffi.remapToJs(format), true));
        // We have no idea whether this was a DST time or not
        t.v[8] = new Sk.builtin.int_(-1);
        return t;
    }

    mod.strptime = new Sk.builtin.func(strptime_f);

    return mod;
};
