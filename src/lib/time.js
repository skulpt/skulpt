/*
 implementation of the Python time package.

 For higher res time we could use following apart from new Date:
 window.performance.now()

 notes:
 - struct_time is a named tuple that has extra methods: 'n_fields', 'n_sequence_fields', 'n_unnamed_fields',
 */

var $builtinmodule = function (name) {
    var mod = {};

    var struct_time_fields = ['tm_year', 'tm_mon', 'tm_mday', 'tm_hour', 'tm_min', 'tm_sec', 'tm_wday', 'tm_yday', 'tm_isdst'];

    var struct_time_f = Sk.builtin.make_structseq('time', 'struct_time', struct_time_fields);
    mod.struct_time = struct_time_f;

    mod.time = new Sk.builtin.func(function () {
        var res = new Date().getTime();
        if (performance && performance.now)
        {
            res = res + performance.now() % 1;
        }
        return Sk.builtin.assk$(res / 1000, undefined);
    });

    // This is an experimental implementation of time.sleep(), using suspensions
    mod.sleep = new Sk.builtin.func(function(delay) {
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

    function isLeapYear(year) {
        if((year & 3) != 0) return false;
        return ((year % 100) != 0 || (year % 400) == 0);
    };

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

    /*
    Convert a tuple or struct_time representing a time as returned by gmtime() or localtime() to a 24-character 
    string of the following form: 'Sun Jun 20 23:21:05 1993'. If t is not provided, the current time as returned 
    by localtime() is used. Locale information is not used by asctime().    
    */
    function asctime(time) {
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

    mod.asctime = new Sk.builtin.func(function(secs) {
        return asctime(secs);
    });

    /*
    Convert a time expressed in seconds since the epoch to a string representing local time. If secs is not
    provided or None, the current time as returned by time() is used. ctime(secs) is equivalent to 
    asctime(localtime(secs)). Locale information is not used by ctime().
    */
    mod.ctime = new Sk.builtin.func(function(secs) {
        return asctime(localtime_f(secs));
    });

    /*
    This is the inverse function of localtime(). Its argument is the struct_time or full 9-tuple (since the 
    dst flag is needed; use -1 as the dst flag if it is unknown) which expresses the time in local time, not UTC.
    It returns a floating point number, for compatibility with time(). If the input value cannot be represented as
    a valid time, either OverflowError or ValueError will be raised (which depends on whether the invalid value is 
    caught by Python or the underlying C libraries). The earliest date for which it can generate a time is 
    platform-dependent.    
    */
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
    // accept2dyear
    mod.accept2year = function accept2year() {
        throw new Sk.builtin.NotImplementedError("accept2year is not implemented")
    };

    // strftime()
    mod.strftime = function strftime() {
        throw new Sk.builtin.NotImplementedError("strftime is not implemented")
    };

    // strptime()
    mod.strptime = function strptime() {
        throw new Sk.builtin.NotImplementedError("strptime is not implemented")
    };

    // tzset()
    mod.tzset = function tzset() {
        throw new Sk.builtin.NotImplementedError("tzset is not implemented")
    };

    return mod;
};
