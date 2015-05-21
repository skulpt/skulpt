/*
 implementation of the Python time package.

 For higher res time we could use following apart from new Date:
 window.performance.now()

 notes:
 - struct_time is a structseq but structseq does not implement methods: 'n_fields', 'n_sequence_fields', 'n_unnamed_fields' yet

 ['__doc__', '__file__', '__name__', '__package__', 'accept2dyear', 'altzone', 'asctime', 'clock', 'ctime', 'daylight', 'gmtime', 'localtime', 'mktime', 'sleep', 'strftime', 'strptime', 'struct_time', 'time', 'timezone', 'tzname', 'tzset']
 */

var $builtinmodule = function (name) {
    var mod = {};

    mod.__file__ = "/src/lib/time/__init__.js";

    mod.__package__ = Sk.builtin.None;

    mod.__doc__ = 
        "This module provides various functions to manipulate time values.\n" +
        "\n" +
        "There are two standard representations of time.  One is the number\n" +
        "of seconds since the Epoch, in UTC (a.k.a. GMT).  It may be an integer\n" +
        "or a floating point number (to represent fractions of seconds).\n" +
        "The Epoch is system-defined; on Unix, it is generally January 1st, 1970.\n" +
        "The actual value can be retrieved by calling gmtime(0).\n" +
        "\n" +
        "The other representation is a tuple of 9 integers giving local time.\n" +
        "The tuple items are:\n" +
        "  year (four digits, e.g. 1998)\n" +
        "  month (1-12)\n" +
        "  day (1-31)\n" +
        "  hours (0-23)\n" +
        "  minutes (0-59)\n" +
        "  seconds (0-59)\n" +
        "  weekday (0-6, Monday is 0)\n" +
        "  Julian day (day in the year, 1-366)\n" +
        "  DST (Daylight Savings Time) flag (-1, 0 or 1)\n" +
        "If the DST flag is 0, the time is given in the regular time zone;\n" +
        "if it is 1, the time is given in the DST time zone;\n" +
        "if it is -1, mktime() should guess based on the date and time.\n" +
        "\n" +
        "Variables:\n" +
        "\n" +
        "timezone -- difference in seconds between UTC and local standard time\n" +
        "altzone -- difference in  seconds between UTC and local DST time\n" +
        "daylight -- whether local time should reflect DST\n" +
        "tzname -- tuple of (standard time zone name, DST time zone name)\n" +
        "\n" +
        "Functions:\n" +
        "\n" +
        "time() -- return current time in seconds since the Epoch as a float\n" +
        "clock() -- return CPU time since process start as a float\n" +
        "sleep() -- delay for a number of seconds given as a float\n" +
        "gmtime() -- convert seconds since Epoch to UTC tuple\n" +
        "localtime() -- convert seconds since Epoch to local time tuple\n" +
        "asctime() -- convert time tuple to string\n" +
        "ctime() -- convert time in seconds to string\n" +
        "mktime() -- convert local time tuple to seconds since Epoch\n" +
        "strftime() -- convert time tuple to string according to format specification\n" +
        "strptime() -- parse string to time tuple according to format specification\n" +
        "tzset() -- change the local timezone";

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
    var struct_time_doc = 
        "The time value as returned by gmtime(), localtime(), and strptime(), and\n" +
        "accepted by asctime(), mktime() and strftime().  May be considered as a\n" +
        "sequence of 9 integers.\n" +
        "\n" +
        "Note that several fields' values are not the same as those defined by\n" +
        "the C language standard for struct tm.  For example, the value of the\n" +
        "field tm_year is the actual year, not year - 1900.  See individual\n" +
        "fields' descriptions for details.";

    var struct_time_f = Sk.builtin.make_structseq('time', 'struct_time', struct_time_fields, struct_time_doc);

    mod.struct_time = struct_time_f;

    function check_struct_time(t) {
        if (!(t instanceof struct_time)) {
            throw new Sk.builtin.TypeError("Required argument 'struct_time' must be of type: 'struct_time'");
        }
        var i;
        var len = self.v.length;
        var obj = self.v;
        for (i = 0; i < len; ++i) {
            if (!Sk.builtin.checkInt(obj[i])) {
                throw new Sk.builtin.TypeError("an integer is required");
            }
        }
        return true;
    }

    mod.time = new Sk.builtin.func(function () {
        Sk.builtin.pyCheckArgs("time", arguments, 0, 0);
        var res = Date.now();
        if (performance && performance.now)
        {
            res = res + performance.now() % 1;
        }
        return Sk.builtin.assk$(res / 1000, undefined);
    });

    mod.time.__doc__ =
        "time() -> floating point number\n" +
        "\n" +
        "Return the current time in seconds since the Epoch.\n" +
        "Fractions of a second may be present if the system clock provides them.";

    // This is an experimental implementation of time.sleep(), using suspensions
    mod.sleep = new Sk.builtin.func(function(delay) {
        Sk.builtin.pyCheckArgs("sleep", arguments, 1, 1);
        Sk.builtin.pyCheckType("delay", "float", Sk.builtin.checkNumber(delay));
        var susp = new Sk.misceval.Suspension();
        susp.resume = function() { return Sk.builtin.none.none$; }
        susp.data = {type: "Sk.promise", promise: new Promise(function(resolve) {
            if (typeof setTimeout === "undefined") {
                // We can't sleep (eg test environment), so resume immediately
                resolve();
            } else {
                setTimeout(resolve, Sk.ffi.remapToJs(delay)*1000);
            }
        })};
        return susp;
    });

    mod.sleep.__doc__ = 
        "sleep(seconds)\n" +
        "\n" +
        "Delay execution for a given number of seconds.  The argument may be\n" +
        "a floating point number for subsecond precision.";

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

    function timeZoneName(date) {
        return /\((.*)\)/.exec(date.toString())[1];
    }

    function timeZoneNames() {
        var jan = new Date(2002, 0, 1);
        var jul = new Date(2002, 6, 1);     
        if (dst(jan)) {
            return [Sk.builtin.str(timeZoneName(jul)), Sk.builtin.str(timeZoneName(jan))];
        } else {
            return [Sk.builtin.str(timeZoneName(jan)), Sk.builtin.str(timeZoneName(jul))];
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

    function localtime_f(secs) {
        Sk.builtin.pyCheckArgs("localtime", arguments, 0, 1);
        var d = new Date();
        if (secs) {
            Sk.builtin.pyCheckType("secs", "number", Sk.builtin.checkNumber(secs));
            var seconds = Sk.builtin.asnum$(secs);
            d.setTime(seconds * 1000);
        }
        return date_to_struct_time(d);
    }

    mod.localtime = new Sk.builtin.func(localtime_f);

    mod.localtime.__doc__ = 
        "localtime([seconds]) -> (tm_year,tm_mon,tm_mday,tm_hour,tm_min,\n" +
        "                  tm_sec,tm_wday,tm_yday,tm_isdst)\n" +
        "\n" +
        "Convert seconds since the Epoch to a time tuple expressing local time.\n" +
        "When 'seconds' is not passed in, convert the current time instead.";

    mod.gmtime = new Sk.builtin.func(function(secs) {
        Sk.builtin.pyCheckArgs("localtime", arguments, 0, 1);
        var d = new Date();
        if (secs) {
            Sk.builtin.pyCheckType("secs", "number", Sk.builtin.checkNumber(secs));
            var seconds = Sk.builtin.asnum$(secs);
            d.setTime(seconds * 1000);
        }
        return date_to_struct_time(d, true);
    });

    mod.gmtime.__doc__ = 
        "gmtime([seconds]) -> (tm_year, tm_mon, tm_mday, tm_hour, tm_min,\n" +
        "               tm_sec, tm_wday, tm_yday, tm_isdst)\n" +
        "\n" +
        "Convert seconds since the Epoch to a time tuple expressing UTC (a.k.a.\n" +
        "GMT).  When 'seconds' is not passed in, convert the current time instead.";

    var monthnames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var daynames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    function pad2(str)
    {
        if (str.length < 2)
        {
            return "0" + str;
        }
        return str;
    }

    function pad4(str)
    {
        while (str.length < 4)
        {
            str = "0" + str;
        }
        return str;
    }

    function asctime_f(time) {
        if (!time || Sk.builtin.checkNone(time))
        {
            time = localtime_f();
        } else if (!(time instanceof struct_time_f)) {
            time = new struct_time_f(time);
        }
        if (time instanceof Sk.builtin.tuple && time.v.length == 9)
        {
            // todo: test validity??
            var parts = [];
            parts.push(daynames[Sk.builtin.asnum$(time.v[6])]);
            parts.push(monthnames[Sk.builtin.asnum$(time.v[1])]);  
            parts.push(pad2(Sk.builtin.asnum$(time.v[2]).toString()));
            parts.push(
                pad2(Sk.builtin.asnum$(time.v[3]).toString()) + ":" +
                pad2(Sk.builtin.asnum$(time.v[4]).toString()) + ":" +
                pad2(Sk.builtin.asnum$(time.v[5]).toString())
            );
            parts.push(pad4(Sk.builtin.asnum$(time.v[0]).toString()));

            return Sk.builtin.str(parts.join(" "));
        }
    }

    mod.asctime = new Sk.builtin.func(asctime_f);

    mod.asctime.__doc__ = 
        "asctime([tuple]) -> string\n" +
        "\n" +
        "Convert a time tuple to a string, e.g. 'Sat Jun 06 16:26:11 1998'.\n" +
        "When the time tuple is not present, current time as returned by localtime()\n" +
        "is used.";

    mod.ctime = new Sk.builtin.func(function(secs) {
        return asctime_f(localtime_f(secs));
    });

    mod.ctime.__doc__ =
        "ctime(seconds) -> string\n" +
        "\n" +
        "Convert a time in seconds since the Epoch to a string in local time.\n" +
        "This is equivalent to asctime(localtime(seconds)). When the time tuple is\n" +
        "not present, current time as returned by localtime() is used.";

    mod.mktime = new Sk.builtin.func(function(time) {
        if (time instanceof Sk.builtin.tuple && time.v.length == 9)
        {
            var d = new Date();
            d.setFullYear(Sk.builtin.asnum$(time.v[0]));
            d.setMonth(Sk.builtin.asnum$(time.v[1])-1);
            d.setDate(Sk.builtin.asnum$(time.v[2]));
            d.setHours(Sk.builtin.asnum$(time.v[3]));
            d.setMinutes(Sk.builtin.asnum$(time.v[4]));
            d.setSeconds(Sk.builtin.asnum$(time.v[5]));
            return Sk.builtin.assk$(d.getTime() / 1000, undefined);
        }
    });
    mod.mktime.__doc__ =
        "mktime(tuple) -> floating point number\n" +
        "\n" +
        "Convert a time tuple in local time to seconds since the Epoch.";

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
    mod.tzname = Sk.builtin.tuple(timeZoneNames());

    mod.accept2dyear = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);

    mod.clock = new Sk.builtin.func(function() {
        var res = 0.0;
        if (performance && performance.now)
        {
            res = performance.now() / 1000;
        } else {
            res = new Date().getTime() / 1000;
        }
        return new Sk.builtin.float_(res);
    });
    mod.clock.__doc__ =
        "clock() -> floating point number\n" +
        "\n" +
        "Return the CPU time or real time since the start of the process or since\n" +
        "the first call to clock().  This has as much precision as the system\n" +
        "records.";

    /*
    %a  Locale’s abbreviated weekday name.   
    %A  Locale’s full weekday name.  
    %b  Locale’s abbreviated month name.     
    %B  Locale’s full month name.    
    %c  Locale’s appropriate date and time representation.   
    %d  Day of the month as a decimal number [01,31].    
    %H  Hour (24-hour clock) as a decimal number [00,23].    
    %I  Hour (12-hour clock) as a decimal number [01,12].    
    %j  Day of the year as a decimal number [001,366].   
    %m  Month as a decimal number [01,12].   
    %M  Minute as a decimal number [00,59].  
    %p  Locale’s equivalent of either AM or PM. (1)
    %S  Second as a decimal number [00,61]. (2)
    %U  Week number of the year (Sunday as the first day of the week) as a decimal number [00,53]. All days in a new year preceding the first Sunday are considered to be in week 0.    (3)
    %w  Weekday as a decimal number [0(Sunday),6].   
    %W  Week number of the year (Monday as the first day of the week) as a decimal number [00,53]. All days in a new year preceding the first Monday are considered to be in week 0.    (3)
    %x  Locale’s appropriate date representation.    
    %X  Locale’s appropriate time representation.    
    %y  Year without century as a decimal number [00,99].    
    %Y  Year with century as a decimal number.   
    %Z  Time zone name (no characters if no time zone exists).   
    %%  A literal '%' character.         
    */

    function strftime_f(format, t) {
        Sk.builtin.pyCheckArgs("strftime", arguments, 1, 2);
        if (!Sk.builtin.checkString(format)) {
            throw new Sk.builtin.TypeError("format must be a string");
        }
        if (!t)
        {
            t = localtime_f();
        } else if (!(t instanceof struct_time_f)) {
            t = new struct_time_f(t);
        } else {
            // check bounds on given struct_time
        }

        // todo rest of implementation

        throw new NotImplementedError("time.strftime() is not yet implemented");
    }

    mod.strftime = new Sk.builtin.func(strftime_f);

    mod.strftime.__doc__ =
        "strftime(format[, tuple]) -> string\n" +
        "\n" +
        "Convert a time tuple to a string according to a format specification.\n" +
        "See the library reference manual for formatting codes. When the time tuple\n" +
        "is not present, current time as returned by localtime() is used.";

    function tzset_f()
    {
        Sk.builtin.pyCheckArgs("tzset", arguments, 0, 0);

        throw new NotImplementedError("time.tzset() is not yet implemented");
    }

    mod.tzset = new Sk.builtin.func(tzset_f);

    mod.tzset.__doc__ =
        "tzset()\n" +
        "\n" +
        "Initialize, or reinitialize, the local timezone to the value stored in\n" +
        "os.environ['TZ']. The TZ environment variable should be specified in\n" +
        "standard Unix timezone format as documented in the tzset man page\n" +
        "(eg. 'US/Eastern', 'Europe/Amsterdam'). Unknown timezones will silently\n" +
        "fall back to UTC. If the TZ environment variable is not set, the local\n" +
        "timezone is set to the systems best guess of wallclock time.\n" +
        "Changing the TZ environment variable without calling tzset *may* change\n" +
        "the local timezone used by methods such as localtime, but this behaviour\n" +
        "should not be relied on.";

    function strptime_f()
    {
        Sk.builtin.pyCheckArgs("strptime", arguments, 1, 2);        
    }

    mod.strptime = new Sk.builtin.func(strptime_f);

    mod.strptime.__doc__ =
        "strptime(string, format) -> struct_time\n" +
        "\n" +
        "Parse a string to a time tuple according to a format specification.\n" +
        "See the library reference manual for formatting codes (same as strftime()).";

    return mod;
};
