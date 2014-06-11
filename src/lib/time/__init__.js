/*
	Barebones implementation of the Python time package.

	Implements a few of the internal time methods. However timezones are not working
  currently.
*/

var $builtinmodule = function (name) {
  var mod = {};

  // struct_time class definition
  var CLASS_TIME_STRUCT = "time.struct_time";

  var wday_name = [];
  wday_name[0] = "Sun";
  wday_name[1] = "Mon";
  wday_name[2] = "Tue";
  wday_name[3] = "Wed";
  wday_name[4] = "Thu";
  wday_name[5] = "Fri";
  wday_name[6] = "Sat";

  var mon_name = [];
  mon_name[0] = "Jan";
  mon_name[1] = "Feb";
  mon_name[2] = "Mar";
  mon_name[3] = "Apr";
  mon_name[4] = "May";
  mon_name[5] = "Jun";
  mon_name[6] = "Jul";
  mon_name[7] = "Aug";
  mon_name[8] = "Sep";
  mon_name[9] = "Oct";
  mon_name[10] = "Nov";
  mon_name[11] = "Dec";

  /**
    Pads the given string (str) with given length (l) and character (c) on the left
  **/
  function padleft(str, l, c) {
    var _str = str.toString();
    return Array(l - _str.length + 1).join(c || " ") + _str;
  }

  /**
    Calculates the day light saving
  **/
  function dst(date) {
    var stdoffset = Math.max(new Date(date.getFullYear(), 0, 1).getTimezoneOffset(), new Date(date.getFullYear(), 6, 1).getTimezoneOffset());

    return date.getTimezoneOffset() - stdoffset;
  }

  /**
    Returns an array from given js Date object, use UTC methods when set to true
    Usefull for gmtime...
  **/
  function datetoarray(date, utc) {
    var v = [];
    utc = utc || false;

    v[0] = utc ? date.getUTCFullYear() : date.getFullYear(); // returns years in "yyyy"
    v[1] = (utc ? date.getUTCMonth() : date.getMonth()) + 1; // want January == 1
    v[2] = utc ? date.getUTCDate() : date.getDate();
    v[3] = utc ? date.getUTCHours() : date.getHours();
    v[4] = utc ? date.getUTCMinutes() : date.getMinutes();
    v[5] = utc ? date.getUTCSeconds() : date.getSeconds();
    v[6] = ((utc ? date.getUTCDay() : date.getDay()) + 6) % 7; // Want Monday == 0
    v[7] = Math.ceil((date - new Date(utc ? date.getUTCFullYear() : date.getFullYear(),0,1)) / 86400000); // Want January, 1 == 1
    v[8] = utc ? 0 : dst(date);

    return v;
  }

  /**
    Expects time_struct js repr and returns tuple containing the values
  **/
  function tmtotuple(tm) {
    var v = [];

    v[0] = tm.tm_year + 1900;
    v[1] = tm.tm_mon + 1; // want January == 1
    v[2] = tm.tm_mday;
    v[3] = tm.tm_hour;
    v[4] = tm.tm_min;
    v[5] = tm.tm_sec;
    v[6] = (tm.tm_wday + 6) % 7; // Want Monday == 0
    v[7] = tm.tm_yday + 1; // Want January, 1 == 1
    v[8] = tm.tm_isdst;

    v = v.map(function(x){return Sk.ffi.remapToPy(x);});

    return new Sk.builtin.tuple(v);
  }

  /**
    Expects and sequence/tuple (js type) containing all relevant time data
  **/
  function gettmarg(tm, args) {

    var y = args[0];        // 0 for exampel 1993
    tm.tm_mon = args[1];    // 1 range [1,12]
    tm.tm_mday = args[2];   // 2 range [1,31]
    tm.tm_hour = args[3];   // 3 range [0, 23]
    tm.tm_min = args[4];    // 4 range [0, 59]
    tm.tm_sec = args[5];    // 5 range [0, 61], special case
    tm.tm_wday = args[6];   // 6 range [0, 6]
    tm.tm_yday = args[7];   // 7 range [1, 366]
    tm.tm_isdst = args[8];  // 8 0,1 or -1

    tm.tm_year = y - 1900;
    tm.tm_mon--;
    tm.tm_wday = (tm.tm_wday+1) % 7;
    tm.tm_yday--;
    // not support for TM_ZONE currently
    tm.tm_gmtoff = 0;
  }

  /** Check values of the struct tm fields before it is passed to strftime() and
   *  asctime().  Return 1 if all values are valid, otherwise set an exception
   *  and returns 0.
   **/
  function checktm(struct_time) {
    /* includes checks for strftime() and asctime() */
    if(Sk.abstr.typeName(struct_time) !== CLASS_TIME_STRUCT) {
      throw new Sk.builtin.TypeError("Required argument 'struct_time' must be of type: '" + CLASS_TIME_STRUCT + "'");
    }

    var timeJs = struct_time.v; // all internal data is stored as js types

    if(timeJs.tm_mon === -1) {
      timeJs.tm_mon = 0;
    } else if(timeJs.tm_mon < 0 || timeJs.tm_mon > 11) {
      throw new Sk.builtin.ValueError("month out of range");
    }

    if(timeJs.tm_mday === 0) {
      timeJs.tm_mday = 1;
    } else if(timeJs.tm_mday < 0 || timeJs.tm_mday > 31) {
      throw new Sk.builtin.ValueError("day of month out of range");
    }

    if(timeJs.tm_hour < 0 || timeJs.tm_hour > 23) {
      throw new Sk.builtin.ValueError("hour out of range");
    }

    if(timeJs.tm_min < 0 || timeJs.tm_min > 59) {
      throw new Sk.builtin.ValueError("minute out of range");
    }

    if(timeJs.tm_sec < 0 || timeJs.tm_sec > 61) {
      throw new Sk.builtin.ValueError("seconds out of range");
    }

    /* tm_wday does not need checking of its upper-bound since taking
    ``% 7`` in gettmarg() automatically restricts the range. */
    if(timeJs.tm_wday < 0) {
      throw new Sk.builtin.ValueError("day of week out of range");
    }

    if(timeJs.tm_yday === -1) {
      timeJs.tm_yday = 0;
    } else if(timeJs.tm_yday < 0 || timeJs.tm_yday > 365) {
      throw new Sk.builtin.ValueError("day of year out of range");
    }
  }

  var struct_time_f = function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self, sequence){
      var timeJs = {}; // internal js repr
      if(!sequence) {
        throw new Sk.builtin.TypeError("Required argument 'sequence' (pos 1) not found");
      }

      if(!Sk.builtin.checkSequence(sequence) || !(sequence instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError('constructor requires a sequence');
      }

      var _seq = Sk.ffi.remapToJs(sequence);

      if(_seq.length != 9) {
        throw new Sk.builtin.TypeError("time.struct_time() takes a 9-sequence (" + _seq.length + "-sequence given)");
      }

      gettmarg(timeJs, _seq);

      Sk.abstr.sattr(self, 'tm_year', Sk.ffi.remapToPy(timeJs.tm_year));
      Sk.abstr.sattr(self, 'tm_mon', Sk.ffi.remapToPy(timeJs.tm_mon));
      Sk.abstr.sattr(self, 'tm_mday', Sk.ffi.remapToPy(timeJs.tm_mday));
      Sk.abstr.sattr(self, 'tm_hour', Sk.ffi.remapToPy(timeJs.tm_hour));
      Sk.abstr.sattr(self, 'tm_min', Sk.ffi.remapToPy(timeJs.tm_min));
      Sk.abstr.sattr(self, 'tm_sec', Sk.ffi.remapToPy(timeJs.tm_sec));
      Sk.abstr.sattr(self, 'tm_wday', Sk.ffi.remapToPy(timeJs.tm_wday));
      Sk.abstr.sattr(self, 'tm_yday', Sk.ffi.remapToPy(timeJs.tm_yday));
      Sk.abstr.sattr(self, 'tm_isdst', Sk.ffi.remapToPy(timeJs.tm_isdst));

      self.v = timeJs; // value holding the actual js object and array
      self.tp$name = CLASS_TIME_STRUCT; // set class name
    });

    $loc.__repr__ = new Sk.builtin.func(function (self) {
      var timeJs = Sk.ffi.remapToJs(self);

      var repr = CLASS_TIME_STRUCT;
      repr += "(";
      repr += "tm_year="+ (timeJs.tm_year + 1900) +", ";
      repr += "tm_mon="+ (timeJs.tm_mon + 1) +", ";
      repr += "tm_mday="+ timeJs.tm_mday +", ";
      repr += "tm_hour="+ timeJs.tm_hour +", ";
      repr += "tm_min="+ timeJs.tm_min +", ";
      repr += "tm_sec="+ timeJs.tm_sec +", ";
      repr += "tm_wday="+ ((timeJs.tm_wday + 6) % 7) +", ";
      repr += "tm_yday="+ (timeJs.tm_yday + 1) +", ";
      repr += "tm_isdst="+ timeJs.tm_isdst;
      repr += ")";

      return new Sk.builtin.str(repr);
    });
  };

  mod[CLASS_TIME_STRUCT] = Sk.misceval.buildClass(mod, struct_time_f, CLASS_TIME_STRUCT, []);

  // normal time functions

  mod.time = new Sk.builtin.func(function () {
    return Sk.builtin.assk$(new Date()
      .getTime() / 1000, undefined);
  });

  var ctime_f = function (sec) {
    Sk.builtin.pyCheckArgs("ctime", arguments, 0, 1);
    var _date;
    var _sec;

    if (!sec || Sk.builtin.checkNone(sec)) { // allows none to be passed
      _date = new Date(); // same call as time.time();
    } else {
      if (!Sk.builtin.checkNumber(sec)) {
        throw new Sk.builtin.TypeError('Invalid type provided for argument "sec"');
      } else {
        _sec = Sk.ffi.remapToJs(sec);
        _date = new Date(_sec * 1000); // in ms
      }
    }

    var _tuple = datetoarray(_date).map(function(x){return Sk.ffi.remapToPy(x);});
    _tuple = new Sk.builtin.tuple(_tuple);
    return Sk.misceval.callsim(mod.asctime, _tuple);
  };

  mod.ctime = new Sk.builtin.func(ctime_f);

  var mktime_f = function (t) {
    var flt;
    var _date = new Date();

    if(!t) {
      throw new Sk.builtin.TypeError('mktime() takes exactly one argument ('+ arguments.length +' given)');
    }

    if(t && Sk.abstr.typeName(t) !== CLASS_TIME_STRUCT && !Sk.builtin.checkSequence(t) && !(t instanceof Sk.builtin.tuple)) { // t omitted, create new time()
      throw new Sk.builtin.TypeError('Tuple or struct_time argument required');
    }

    // ToDo: fix correct parsing of tuples
    // seems that month--, date--
    var _v;
    if(Sk.abstr.typeName(t) === CLASS_TIME_STRUCT) {
      // must have four digit years
      _v = Sk.ffi.remapToJs(tmtotuple(t.v));
    } else {
      _v = Sk.ffi.remapToJs(t);

      // years can be 2 digits
      if(Sk.ffi.remapToJs(mod.accept2dyear) != 0) {
        if(_v[0] >= 69 && _v[0] <= 99) {
          _v[0] += 1900;
        } else if (_v[0] >= 0 && _v[0] <= 68) {
          _v[0] += 2000;
        } else if(_v[0] >= 100 && _v[0] <= 1899) {
          throw new Sk.builtin.OverflowError('Illegal value for year, value between 100-1988 not allowed');
        }
      }
    }

    if(_v) {
      // create date
      _date.setYear(_v[0]);
      _date.setMonth(_v[1] - 1); // Date() expects 0-11
      _date.setDate(_v[2]);
      _date.setHours(_v[3]);
      _date.setMinutes(_v[4]);
      _date.setSeconds(_v[5]);
    }

    // return seconds! since epoch
    flt = new Sk.builtin.nmber(Math.floor(_date.getTime() / 1000), Sk.builtin.nmber.float$);
    //flt = new Sk.builtin.float_(_date.getTime());
    return flt;
  };

  mod.mktime = new Sk.builtin.func(mktime_f);

  var asctime_f = function (t) {
    var _tup;
    var _buf = {};

    if(t && (Sk.builtin.checkSequence(t) || (t instanceof Sk.builtin.tuple))) { // t is tuple or seq
      _tup = t;
    }

    if(t && Sk.abstr.typeName(t) === CLASS_TIME_STRUCT) {
      //_tup = Sk.ffi.remapToJs(tmtotuple(t.v)); // manuel unwrap :(
      _buf = t; // avoid double remap and object creation, just pass time_struct to checktm
    } else {

      if(!_tup) { // create time()
        _tup = datetoarray(new Date()).map(function(x){return Sk.ffi.remapToPy(x);});
        _tup = new Sk.builtin.tuple(_tup);
      }

      _buf = Sk.misceval.callsim(mod[CLASS_TIME_STRUCT], _tup); // creates tm
    }

    // check if _buf has valid ranges
    checktm(_buf);

    // format "%s %s%3d %.2d:%.2d:%.2d %d"
    // wday, mon_name, mday, hour, min, sec, year

    var _fmstr = "";
    _fmstr += wday_name[_buf.v.tm_wday];
    _fmstr += " ";
    _fmstr += mon_name[_buf.v.tm_mon];
    _fmstr += " ";
    _fmstr += padleft(_buf.v.tm_mday, 2, "0");
    _fmstr += " ";
    _fmstr += padleft(_buf.v.tm_hour, 2, "0");
    _fmstr += ":";
    _fmstr += padleft(_buf.v.tm_min, 2, "0");
    _fmstr += ":";
    _fmstr += padleft(_buf.v.tm_sec, 2, "0");
    _fmstr += " ";
    _fmstr += (1900 + _buf.v.tm_year);

    return new Sk.builtin.str(_fmstr);
  };

  /**
    Convert a tuple or struct_time representing a time as returned by gmtime() or
    localtime() to a 24-character string of the following form:
    'Sun Jun 20 23:21:05 1993'.
    If t is not provided, the current time as returned by localtime() is used.
    Locale information is not used by asctime().
  **/
  mod.asctime = new Sk.builtin.func(asctime_f);

  // ToDo: time.gmtime(1), should return: time.struct_time(tm_year=1970, tm_mon=1, tm_mday=1, tm_hour=0, tm_min=0, tm_sec=1, tm_wday=3, tm_yday=1, tm_isdst=0)
  var gmtime_f = function(secs) {
    if(secs && !Sk.builtin.checkNumber(secs) && !Sk.builtin.checkNone(secs)) {
      throw new Sk.builtin.TypeError('an integer is required (got type ' + Sk.abstr.typeName(secs) + ')');
    }

    var _date;

    if(Sk.builtin.checkNumber(secs)) {
      _date = new Date(Sk.ffi.remapToJs(secs) * 1000); // Date() requires ms
    } else {
      _date = new Date();
    }

    var _tup = datetoarray(_date, true).map(function(x){return Sk.ffi.remapToPy(x);});
    _tup = new Sk.builtin.tuple(_tup);

    return Sk.misceval.callsim(mod[CLASS_TIME_STRUCT], _tup); // creates tm
  };

  /**
    Convert a time expressed in seconds since the epoch to a struct_time in UTC
    in which the dst flag is always zero. If secs is not provided or None, the
    current time as returned by time() is used. Fractions of a second are
    ignored. See above for a description of the struct_time object.
    See calendar.timegm() for the inverse of this function.

    Changed in version 2.1: Allowed secs to be omitted.

    Changed in version 2.4: If secs is None, the current time is used.
  **/
  mod.gmtime = new Sk.builtin.func(gmtime_f);

  var localtime_f = function(secs) {
    if(secs && !Sk.builtin.checkNumber(secs) && !Sk.builtin.checkNone(secs)) {
      throw new Sk.builtin.TypeError('an integer is required (got type ' + Sk.abstr.typeName(secs) + ')');
    }

    var _date;

    if(Sk.builtin.checkNumber(secs)) {
      _date = new Date(Sk.ffi.remapToJs(secs) * 1000); // Date() requires ms
    } else {
      _date = new Date();
    }

    var _tup = datetoarray(_date, false).map(function(x){return Sk.ffi.remapToPy(x);});
    _tup = new Sk.builtin.tuple(_tup);

    return Sk.misceval.callsim(mod[CLASS_TIME_STRUCT], _tup); // creates tm
  };
  mod.localtime = new Sk.builtin.func(localtime_f);

  mod.sleep = new Sk.builtin.func(function (secs) {
    Sk.builtin.pyCheckArgs("sleep", arguments, 1, 1);
    if (!Sk.builtin.checkNumber(secs)) {
      throw new TypeError('a float is required');
    }

    var _secs = Sk.ffi.remapToJs(secs);

    if(_secs < 0) {
      throw new Sk.builtin.ValueError('sleep length must be non-negative');
    }

    var delay = _secs * 1000;
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);

  });

  mod.accept2dyear = new Sk.builtin.bool(true);


  mod.tzset = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError(
      "tzset is not yet implemented");
  });

  mod.tzname = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError(
      "tzname is not yet implemented");
  });

  mod.timezone = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError(
      "timezone is not yet implemented");
  });

  mod.strptime = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError(
      "strptime is not yet implemented");
  });

  mod.strftime = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError(
      "strftime is not yet implemented");
  });

  mod.clock = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError(
      "clock is not yet implemented");
  });

  mod.daylight = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError(
      "daylight is not yet implemented");
  });

  mod.altzone = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError(
      "altzone is not yet implemented");
  });

  return mod;
};
