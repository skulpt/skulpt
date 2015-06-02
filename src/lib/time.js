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

    mod.__package__ = Sk.builtin.none.none$;

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

    var monthnames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var daynames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
            parts.push(padLeft(Sk.builtin.asnum$(time.v[2]).toString(), 2, '0'));
            parts.push(
                padLeft(Sk.builtin.asnum$(time.v[3]).toString(), 2, '0') + ":" +
                padLeft(Sk.builtin.asnum$(time.v[4]).toString(), 2, '0') + ":" +
                padLeft(Sk.builtin.asnum$(time.v[5]).toString(), 2, '0')
            );
            parts.push(padLeft(Sk.builtin.asnum$(time.v[0]).toString(), 4, '0'));

            return Sk.builtin.str(parts.join(" "));
        }
    }

    mod.asctime = new Sk.builtin.func(asctime_f);

    mod.ctime = new Sk.builtin.func(function(secs) {
        return asctime_f(localtime_f(secs));
    });

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

    /*
    The offset of the local (non-DST) timezone, in seconds west of UTC (negative in most of Western Europe, 
    positive in the US, zero in the UK).
    */
    mod.timezone = Sk.builtin.assk$(stdTimezoneOffset() * 60, Sk.builtin.nmber.int$);

    /*
    The offset of the local DST timezone, in seconds west of UTC, if one is defined. This is negative if the
    local DST timezone is east of UTC (as in Western Europe, including the UK). Only use this if daylight is nonzero.
    */
    mod.altzone = Sk.builtin.assk$(altTimezoneOffset() * 60, Sk.builtin.nmber.int$);

    /*
    Nonzero if a DST timezone is defined.
    */
    mod.daylight = Sk.builtin.assk$(dst(new Date()) ? 1 : 0, Sk.builtin.nmber.int$);

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
        return Sk.builtin.assk$(res, Sk.builtin.nmber.float$);
    });

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
        throw new NotImplementedError("time.strftime() is not yet implemented");
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
    }

    mod.strftime = new Sk.builtin.func(strftime_f);

    function tzset_f()
    {
        throw new NotImplementedError("time.tzset() is not yet implemented");
        Sk.builtin.pyCheckArgs("tzset", arguments, 0, 0);
    }

    mod.tzset = new Sk.builtin.func(tzset_f);

    function strptime_f()
    {
        throw new NotImplementedError("time.strptime() is not yet implemented");
        Sk.builtin.pyCheckArgs("strptime", arguments, 1, 2);   
    }

    mod.strptime = new Sk.builtin.func(strptime_f);

    return mod;
};
