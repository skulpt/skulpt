function $builtinmodule(name) {
    const requiredImports = {};

    const {
        misceval: { chain: chainOrSuspend },
        importModule,
    } = Sk;

    const importOrSuspend = (moduleName) => importModule(moduleName, false, true);

    return chainOrSuspend(
        importOrSuspend("datetime"),
        (datetime) => {
            requiredImports.datetime = datetime;
            return importOrSuspend("itertools");
        },
        (itertools) => {
            requiredImports.iterRepeat = itertools.$d.repeat;
            requiredImports.iterChain = itertools.$d.chain;
            return calendarModule(requiredImports);
        }
    );
}

function calendarModule(required) {
    const {
        abstr: { setUpModuleMethods, numberBinOp, iter: pyIter, objectGetItem: pyGetItem },
        builtin: {
            bool: pyBool,
            bool: { true$: pyTrue, false$: pyFalse },
            func: pyFunc,
            int_: pyInt,
            list: pyList,
            none: { none$: pyNone },
            str: pyStr,
            slice: pySlice,
            tuple: pyTuple,
            range: pyRange,
            max: pyMax,
            min: pyMin,
            property: pyProperty,
            print: pyPrint,
            enumerate: pyEnumerate,
            ValueError,
        },
        ffi: { remapToPy: toPy },
        misceval: {
            isTrue,
            iterator: pyIterator,
            arrayFromIterable,
            buildClass,
            richCompareBool,
            asIndexOrThrow,
            objectRepr,
            callsimArray: pyCall,
        },
        global: skGlobal,
        global: { strftime: strftimeJs },
    } = Sk;

    const _0 = new pyInt(0);
    const _1 = new pyInt(1);
    const _2 = new pyInt(2);
    const _3 = new pyInt(3);
    const _6 = new pyInt(6);
    const _7 = new pyInt(7);
    const _9 = new pyInt(9);
    const _12 = new pyInt(12);
    const _13 = new pyInt(13);
    const _24 = new pyInt(24);
    const _60 = new pyInt(60);

    const le = (a, b) => richCompareBool(a, b, "LtE");
    const ge = (a, b) => richCompareBool(a, b, "GtE");
    const eq = (a, b) => richCompareBool(a, b, "Eq");
    const mod = (a, b) => numberBinOp(a, b, "Mod");
    const add = (a, b) => numberBinOp(a, b, "Add");
    const sub = (a, b) => numberBinOp(a, b, "Sub");
    const mul = (a, b) => numberBinOp(a, b, "Mult");
    const inc = (a) => add(a, _1);
    const dec = (a) => sub(a, _1);
    const mod7 = (a) => mod(a, _7);

    const getA = (self, attr) => self.tp$getattr(new pyStr(attr));
    const callA = (self, attr, ...args) => pyCall(self.tp$getattr(new pyStr(attr)), args);

    function* iterJs(iterator) {
        const it = pyIter(iterator);
        let nxt;
        while ((nxt = it.tp$iternext())) {
            yield nxt;
        }
    }

    function iterFn(iter, fn) {
        iter = pyIter(iter);
        return new pyIterator(() => {
            const nxt = iter.tp$iternext();
            return nxt && fn(nxt);
        }, true);
    }

    function makePyMethod(clsName, fn, { args, name, doc, defaults }) {
        fn.co_varnames = ["self", ...(args || [])];
        fn.co_docstring = doc ? new pyStr(doc) : pyNone;
        if (defaults) {
            fn.$defaults = defaults;
        }
        fn.co_name = new pyStr(name);
        fn.co_qualname = new pyStr(clsName + "." + name);
        const rv = new pyFunc(fn);
        rv.$module = calMod.__name__;
        return rv;
    }

    const { datetime, iterRepeat, iterChain } = required;
    let { MINYEAR, MAXYEAR, date: pyDate } = datetime.$d;

    const centerMeth = getA(pyStr, "center");
    const pyCenter = (s, i) => pyCall(centerMeth, [s, i]);
    const pyRStrip = (s) => new pyStr(s.toString().trimRight());

    MINYEAR = MINYEAR.valueOf();
    MAXYEAR = MAXYEAR.valueOf();

    const calMod = {
        __name__: new pyStr("calendar"),
        __all__: toPy([
            "IllegalMonthError",
            "IllegalWeekdayError",
            "setfirstweekday",
            "firstweekday",
            "isleap",
            "leapdays",
            "weekday",
            "monthrange",
            "monthcalendar",
            "prmonth",
            "month",
            "prcal",
            "calendar",
            "timegm",
            "month_name",
            "month_abbr",
            "day_name",
            "day_abbr",
            "Calendar",
            "TextCalendar",
            "HTMLCalendar",
            "LocaleTextCalendar",
            "LocaleHTMLCalendar",
            "weekheader",
        ]),
    };

    function makeErr(name, msg) {
        return buildClass(
            calMod,
            (_gbl, loc) => {
                loc.__init__ = new pyFunc(function __init__(self, attr) {
                    self.$attr = attr;
                });
                loc.__str__ = new pyFunc(function __str__(self) {
                    return new pyStr(msg.replace("$", objectRepr(self.$attr)));
                });
            },
            name,
            [ValueError]
        );
    }

    const IllegalMonthError = makeErr("IllegalMonthError", "bad month $; must be 1-12");
    const IllegalWeekdayError = makeErr(
        "IllegalWeekdayError",
        "bad weekday number $; must be 0 (Monday) to 6 (Sunday)"
    );
    const January = 1;
    const February = 2;

    const mdays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    function mkLocalizedCls(fmtList, loc) {
        loc.__init__ = new pyFunc(function __init__(self, format) {
            self.format = format;
        });

        loc.__getitem__ = new pyFunc(function __getitem__(self, i) {
            const funcs = pyGetItem(fmtList, i);
            if (i instanceof pySlice) {
                const rv = [];
                for (const f of funcs.valueOf()) {
                    rv.push(pyCall(f, [self.format]));
                }
                return new pyList(rv);
            }
            return pyCall(funcs, [self.format]);
        });

        const len = new pyInt(fmtList.valueOf().length);
        loc.__len__ = new pyFunc(function __len__(self) {
            return len;
        });
    }

    const _STRFTIME = new pyStr("strftime");

    const _localized_month = buildClass(
        calMod,
        (_gbl, loc) => {
            let _months = [new pyFunc((_x) => pyStr.$empty)];
            for (let i = 0; i < 12; i++) {
                const d = new pyDate(2001, i + 1, 1);
                _months.push(d.tp$getattr(_STRFTIME));
            }
            _months = new pyList(_months);
            loc._months = _months;
            mkLocalizedCls(_months, loc);
        },
        "_localized_month"
    );

    const _localized_day = buildClass(
        calMod,
        (_gbl, loc) => {
            let _days = [];
            for (let i = 0; i < 7; i++) {
                const d = new pyDate(2001, 1, i + 1);
                _days.push(d.tp$getattr(_STRFTIME));
            }
            _days = new pyList(_days);
            loc._days = _days;
            mkLocalizedCls(_days, loc);
        },
        "_localized_day"
    );

    // # Full and abbreviated names of weekdays
    const day_name = pyCall(_localized_day, [new pyStr("%A")]);
    const day_abbr = pyCall(_localized_day, [new pyStr("%a")]);

    // # Full and abbreviated names of months (1-based arrays!!!)
    const month_name = pyCall(_localized_month, [new pyStr("%B")]);
    const month_abbr = pyCall(_localized_month, [new pyStr("%b")]);

    const [MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY] = [0, 1, 2, 3, 4, 5, 6];

    function isleap(year) {
        year = asIndexOrThrow(year);
        return year % 4 == 0 && (year % 100 != 0 || year % 400 === 0);
    }

    function weekday(year, month, day) {
        year = asIndexOrThrow(year);
        if (!(MINYEAR <= year && year <= MAXYEAR)) {
            year = 2000 + (year % 400);
        }
        const date = pyCall(pyDate, [new pyInt(year), month, day]);
        return callA(pyDate, "weekday", date);
    }

    function monthrange(year, month) {
        if (!(le(_1, month) && le(month, _12))) {
            throw pyCall(IllegalMonthError, [month]);
        }
        const day1 = weekday(year, month, _1);
        month = asIndexOrThrow(month);
        const ndays = mdays[month] + Number(month === February && isleap(year));
        return [day1, new pyInt(ndays)];
    }

    function _monthlen(year, month) {
        month = asIndexOrThrow(month);
        return new pyInt(mdays[month] + Number(month === February && isleap(year)));
    }

    function _prevmonth(year, month) {
        if (eq(month, _1)) {
            return [dec(year), _12];
        }
        return [year, dec(month)];
    }

    function _nextmonth(year, month) {
        if (eq(month, _12)) {
            return [inc(year), _1];
        }
        return [year, inc(month)];
    }

    /***** Calendar Methods ******/

    function iterweekdays(self) {
        const iter = pyCall(pyRange, [self.fwd, add(self.fwd, _7)]);
        return iterFn(iter, mod7);
    }

    function itermonthdates(self, year, month) {
        const iter = itermonthdays3(self, year, month);
        return iterFn(iter, (ymdTuple) => pyCall(pyDate, ymdTuple.valueOf()));
    }

    function itermonthdays(self, year, month) {
        const [day1, ndays] = monthrange(year, month);
        const days_before = mod7(sub(day1, self.fwd));
        const iter1 = pyCall(iterRepeat, [_0, days_before]);
        const iter2 = pyCall(pyRange, [_1, inc(ndays)]);
        const days_after = mod7(sub(self.fwd, add(day1, ndays)));
        const iter3 = pyCall(iterRepeat, [_0, days_after]);
        return pyCall(iterChain, [iter1, iter2, iter3]);
    }

    function itermonthdays2(self, year, month) {
        const iter = pyCall(pyEnumerate, [itermonthdays(self, year, month), self.fwd]);
        return iterFn(iter, (nxt) => {
            const [i, d] = nxt.valueOf();
            return new pyTuple([d, mod7(i)]);
        });
    }

    function itermonthdays3(self, year, month) {
        const ymdIter = (y, m, iter) => iterFn(iter, (nxt) => new pyTuple([y, m, nxt]));
        const [day1, ndays] = monthrange(year, month);
        const days_before = mod7(sub(day1, self.fwd));
        const days_after = mod7(sub(self.fwd, add(day1, ndays)));
        const [y1, m1] = _prevmonth(year, month);
        const end = inc(_monthlen(y1, m1));
        const iter1 = pyCall(pyRange, [sub(end, days_before), end]);
        const iter2 = pyCall(pyRange, [_1, inc(ndays)]);
        const [y3, m3] = _nextmonth(year, month);
        const iter3 = pyCall(pyRange, [_1, inc(days_after)]);

        return pyCall(iterChain, [ymdIter(y1, m1, iter1), ymdIter(year, month, iter2), ymdIter(y3, m3, iter3)]);
    }

    function itermonthdays4(self, year, month) {
        const iter = itermonthdays3(self, year, month);
        let i = 0;
        return iterFn(iter, (nxt) => new pyTuple([...nxt.valueOf(), mod7(add(self.fwd, new pyInt(i++)))]));
    }

    function _monthIter(meth, self, year, month) {
        const arr = arrayFromIterable(meth(self, year, month));
        const rv = [];
        for (let i = 0; i < arr.length; i += 7) {
            rv.push(new pyList(arr.slice(i, i + 7)));
        }
        return new pyList(rv);
    }

    function monthdatescalendar(self, year, month) {
        return _monthIter(itermonthdates, self, year, month);
    }

    function monthdays2calendar(self, year, month) {
        return _monthIter(itermonthdays2, self, year, month);
    }

    function monthdayscalendar(self, year, month) {
        return _monthIter(itermonthdays, self, year, month);
    }

    function _yearIter(meth, self, year, width) {
        width = asIndexOrThrow(width);
        const months = [];
        for (let i = January; i < January + 12; i++) {
            months.push(meth(self, year, new pyInt(i)));
        }
        const rv = [];
        for (let i = 0; i < months.length; i += width) {
            rv.push(new pyList(months.slice(i, i + width)));
        }
        return new pyList(rv);
    }

    function yeardatescalendar(self, year, width) {
        return _yearIter(monthdatescalendar, self, year, width);
    }

    function yeardays2calendar(self, year, width) {
        return _yearIter(monthdays2calendar, self, year, width);
    }

    function yeardayscalendar(self, year, width) {
        return _yearIter(monthdayscalendar, self, year, width);
    }

    const Calendar = buildClass(
        calMod,
        (_gbl, loc) => {
            function __init__(self, firstweekday) {
                Object.defineProperty(self, "fwd", {
                    get() {
                        return mod7(this._fwd);
                    },
                    set(val) {
                        this._fwd = val;
                        return true;
                    },
                });
                self.fwd = firstweekday;
                return pyNone;
            }

            function getfirstweekday(self) {
                return self.fwd;
            }

            function setfirstweekday(self, firstweekday) {
                self.fwd = firstweekday;
                return pyNone;
            }

            const CalMeth = makePyMethod.bind(null, "Calendar");
            const FWD = ["firstweekday"];
            const YM = ["year", "month"];
            const YW = ["year", "width"];

            const locals = {
                __init__: CalMeth(__init__, { name: "__init__", args: FWD, defaults: [_0] }),
                getfirstweekday: CalMeth(getfirstweekday, { name: "getfirstweekday" }),
                setfirstweekday: CalMeth(setfirstweekday, { name: "setfirstweekday", args: FWD }),
                iterweekdays: CalMeth(iterweekdays, { name: "iterweekdays" }),
                itermonthdates: CalMeth(itermonthdates, { name: "itermonthdates", args: YM }),
                itermonthdays: CalMeth(itermonthdays, { name: "itermonthdays", args: YM }),
                itermonthdays2: CalMeth(itermonthdays2, { name: "itermonthdays2", args: YM }),
                itermonthdays3: CalMeth(itermonthdays3, { name: "itermonthdays3", args: YM }),
                itermonthdays4: CalMeth(itermonthdays4, { name: "itermonthdays4", args: YM }),
                monthdatescalendar: CalMeth(monthdatescalendar, { name: "monthdatescalendar", args: YM }),
                monthdays2calendar: CalMeth(monthdays2calendar, { name: "monthdays2calendar", args: YM }),
                monthdayscalendar: CalMeth(monthdayscalendar, { name: "monthdayscalendar", args: YM }),
                yeardatescalendar: CalMeth(yeardatescalendar, { name: "yeardatescalendar", args: YW, defaults: [_3] }),
                yeardays2calendar: CalMeth(yeardays2calendar, { name: "yeardays2calendar", args: YW, defaults: [_3] }),
                yeardayscalendar: CalMeth(yeardayscalendar, { name: "yeardayscalendar", args: YW, defaults: [_3] }),
            };

            locals.firstweekday = new pyProperty(locals.getfirstweekday, locals.setfirstweekday);

            Object.assign(loc, locals);
        },
        "Calendar"
    );

    /***** TextCalendar *****/

    function doTextFormatweekday(self, day, width) {
        let names;
        if (ge(width, _9)) {
            names = day_name;
        } else {
            names = day_abbr;
        }
        return pyCenter(pyGetItem(pyGetItem(names, day), new pySlice(pyNone, width)), width);
    }

    function doTextFormatmonthname(self, theyear, themonth, width, withyear = true) {
        let s = pyGetItem(month_name, themonth);
        if (isTrue(withyear)) {
            s = mod(new pyStr("%s %r"), new pyTuple([s, theyear]));
        }
        return pyCenter(s, width);
    }

    const TextCalendar = buildClass(
        calMod,
        (_gbl, loc) => {
            const txtPrint = (x) => pyPrint([x], ["end", pyStr.$empty]);

            function prweek(self, theweek, width) {
                txtPrint(callA(self, "formatweek", theweek, width));
            }

            function formatday(self, day, weekday, width) {
                let s;
                if (eq(day, _0)) {
                    s = pyStr.$empty;
                } else {
                    s = mod(new pyStr("%2i"), day);
                }
                return pyCenter(s, width);
            }

            function formatweek(self, theweek, width) {
                const rv = [];
                for (const dayWeekday of iterJs(theweek)) {
                    const [d, wd] = dayWeekday.valueOf();
                    rv.push(callA(self, "formatday", d, wd, width).toString());
                }
                return new pyStr(rv.join(" "));
            }

            const formatweekday = doTextFormatweekday;

            function formatweekheader(self, width) {
                const rv = [];
                for (const i of iterJs(iterweekdays(self))) {
                    rv.push(callA(self, "formatweekday", i, width).toString());
                }
                return new pyStr(rv.join(" "));
            }

            const formatmonthname = doTextFormatmonthname;

            function prmonth(self, theyear, themonth, w, l) {
                txtPrint(callA(self, "formatmonth", theyear, themonth, w, l));
            }

            function formatmonth(self, theyear, themonth, w, l) {
                const addNewLines = (s) => new pyStr(s + "\n".repeat(l.valueOf()));

                w = pyMax([_2, w]);
                l = pyMax([_1, l]);
                let s = callA(self, "formatmonthname", theyear, themonth, dec(mul(_7, inc(w))), true);
                s = pyRStrip(s);
                s = addNewLines(s);
                s = add(s, pyRStrip(callA(self, "formatweekheader", w)));
                s = addNewLines(s);
                for (const week of iterJs(monthdays2calendar(self, theyear, themonth))) {
                    s = add(s, pyRStrip(callA(self, "formatweek", week, w)));
                    s = addNewLines(s);
                }
                return s;
            }

            function formatyear(self, theyear, w, l, c, m) {
                w = pyMax([_2, w]);
                l = pyMax([_1, l]);
                c = pyMax([_2, c]);
                const colwidth = dec(mul(inc(w), _7));
                let rv = "";
                const a = (s) => (rv += s);
                a(pyRStrip(pyCenter(theyear.$r(), add(mul(colwidth, m), mul(c, dec(m))))));
                a("\n".repeat(l));
                const header = formatweekheader(self, w);
                let i = 0;
                for (const row of iterJs(yeardays2calendar(self, theyear, m))) {
                    const pyI = new pyInt(i);
                    const start = inc(mul(m, pyI));
                    const end = pyMin([inc(mul(m, inc(pyI))), _13]);
                    const months = pyCall(pyRange, [start, end]);
                    a("\n".repeat(l));
                    const names = iterFn(months, (k) => callA(self, "formatmonthname", theyear, k, colwidth, false));
                    a(pyRStrip(formatstring(names, colwidth, c)));
                    a("\n".repeat(l));
                    const headers = iterFn(months, (_k) => header);
                    a(pyRStrip(formatstring(headers, colwidth, c)));
                    a("\n".repeat(l));
                    const height = Math.max(...row.valueOf().map((cal) => cal.valueOf().length));
                    for (let j = 0; j < height; j++) {
                        const weeks = [];
                        for (let cal of row.valueOf()) {
                            cal = cal.valueOf();
                            if (j >= cal.length) {
                                weeks.push(pyStr.$empty);
                            } else {
                                weeks.push(callA(self, "formatweek", cal[j], w));
                            }
                        }
                        a(pyRStrip(formatstring(new pyList(weeks), colwidth, c)));
                        a("\n".repeat(l));
                    }
                    i++;
                }
                return new pyStr(rv);
            }

            function pryear(self, theyear, w, l, c, m) {
                txtPrint(callA(self, "formatyear", theyear, w, l, c, m));
            }

            const TxtCalMethod = makePyMethod.bind(null, "TextCalendar");

            const locals = {
                prweek: TxtCalMethod(prweek, { name: "prweek", args: ["theweek", "width"] }),
                formatday: TxtCalMethod(formatday, { name: "formatday", args: ["day", "weekday", "width"] }),
                formatweek: TxtCalMethod(formatweek, { name: "formatweek", args: ["theweek", "width"] }),
                formatweekday: TxtCalMethod(formatweekday, { name: "formatweekday", args: ["day", "width"] }),
                formatweekheader: TxtCalMethod(formatweekheader, { name: "formatweekheader", args: ["width"] }),
                formatmonthname: TxtCalMethod(formatmonthname, {
                    name: "formatmonthname",
                    args: ["theyear", "themonth", "width", "withyear"],
                    defaults: [pyTrue],
                }),
                prmonth: TxtCalMethod(prmonth, {
                    name: "prmonth",
                    args: ["theyear", "themonth", "w", "l"],
                    defaults: [_0, _0],
                }),
                formatmonth: TxtCalMethod(formatmonth, {
                    name: "formatmonth",
                    args: ["thyear", "themonth", "w", "l"],
                    defaults: [_0, _0],
                }),
                formatyear: TxtCalMethod(formatyear, {
                    name: "formatyear",
                    args: ["theyear", "w", "l", "c", "m"],
                    defaults: [_2, _1, _6, _3],
                }),
                pryear: TxtCalMethod(pryear, {
                    name: "pryear",
                    args: ["theyear", "w", "l", "c", "m"],
                    defaults: [_0, _0, _6, _3],
                }),
            };

            Object.assign(loc, locals);
        },
        "TextCalendar",
        [Calendar]
    );

    /***** HTMLCalendar *****/

    function doHtmlFormatweekday(self, day) {
        return new pyStr(
            `<th class="${pyGetItem(getA(self, "cssclasses_weekday_head"), day)}">${pyGetItem(day_abbr, day)}</th>`
        );
    }

    function doHtmlFormatmonthname(self, theyear, themonth, withyear = true) {
        let s = "" + pyGetItem(month_name, themonth);
        if (isTrue(withyear)) {
            s += " " + theyear;
        }
        return new pyStr(`<tr><th colspan="7" class="${getA(self, "cssclass_month_head")}">${s}</th></tr>`);
    }

    const HTMLCalendar = buildClass(
        calMod,
        (_gbl, loc) => {
            // # CSS classes for the day <td>s
            const cssclasses = toPy(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

            // # CSS classes for the day <th>s
            const cssclasses_weekday_head = cssclasses;

            // # CSS class for the days before and after current month
            const cssclass_noday = new pyStr("noday");

            // # CSS class for the month's head
            const cssclass_month_head = new pyStr("month");

            // # CSS class for the month
            const cssclass_month = cssclass_month_head;

            // # CSS class for the year's table head
            const cssclass_year_head = new pyStr("year");

            // # CSS class for the whole year table
            const cssclass_year = cssclass_year_head;

            const cellOutsideMonth = new pyStr('<td class="%s">&nbsp;</td>');
            const cellInMonth = new pyStr('<td class="%s">%d</td>');

            function formatday(self, day, weekday) {
                if (eq(day, _0)) {
                    return mod(cellOutsideMonth, getA(self, "cssclass_noday"));
                } else {
                    return mod(cellInMonth, new pyTuple([pyGetItem(getA(self, "cssclasses"), weekday), day]));
                }
            }

            function formatweek(self, theweek) {
                let rv = "";
                for (const nxt of iterJs(theweek)) {
                    const [d, wd] = nxt.valueOf();
                    rv += callA(self, "formatday", d, wd);
                }
                return new pyStr(`<tr>${rv}</tr>`);
            }

            const formatweekday = doHtmlFormatweekday;

            function formatweekheader(self) {
                let rv = "";
                for (const i of iterJs(iterweekdays(self))) {
                    rv += callA(self, "formatweekday", i);
                }
                return new pyStr(`<tr>${rv}</tr>`);
            }

            const formatmonthname = doHtmlFormatmonthname;

            function formatmonth(self, theyear, themonth, withyear = true) {
                let rv = "";
                const a = (s) => (rv += s + "\n");
                a(`<table border="0" cellpadding="0" cellspacing="0" class="${getA(self, "cssclass_month")}">`);
                a(callA(self, "formatmonthname", theyear, themonth, withyear));
                a(formatweekheader(self));
                for (const week of iterJs(monthdays2calendar(self, theyear, themonth))) {
                    a(callA(self, "formatweek", week));
                }
                a("</table>");
                return new pyStr(rv);
            }

            function formatyear(self, theyear, width) {
                let rv = "";
                const a = (s) => (rv += s);
                width = pyMax([width, _1]).valueOf();
                a(`<table border="0" cellpadding="0" cellspacing="0" class="${getA(self, "cssclass_year")}">`);
                a("\n");
                a(`<tr><th colspan="${width}" class="${getA(self, "cssclass_year_head")}">${theyear}</th></tr>`);

                for (let i = January; i < January + 12; i += width) {
                    a("<tr>");
                    const end = Math.min(i + width, 13);
                    for (let m = i; m < end; m++) {
                        a("<td>");
                        a(callA(self, "formatmonth", theyear, new pyInt(m), false));
                        a("</td>");
                    }
                    a("</tr>");
                }
                a("</table>");
                return new pyStr(rv);
            }

            function formatyearpage(self, theyear, width = 3, css = "calendar.css", encoding = null) {
                if (encoding === null || encoding === pyNone) {
                    encoding = new pyStr("utf-8");
                }
                let rv = "";
                const a = (s) => (rv += s);
                a(`<?xml version="1.0" encoding="${encoding}"?>\n`);
                a(
                    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n'
                );
                a("<html>\n");
                a("<head>\n");
                a(`<meta http-equiv="Content-Type" content="text/html; charset=${encoding}" />\n`);
                if (css !== pyNone) {
                    a(`<link rel="stylesheet" type="text/css" href="${css}" />\n`);
                }
                a(`<title>Calendar for ${theyear}</title>\n`);
                a("</head>\n");
                a("<body>\n");
                a(callA(self, "formatyear", theyear, width));
                a("</body>\n");
                a("</html>\n");
                return callA(pyStr, "encode", new pyStr(rv), encoding, new pyStr("ignore"));
            }

            const HtmlMeth = makePyMethod.bind(null, "HTMLCalendar");

            const locals = {
                formatday: HtmlMeth(formatday, { name: "formatday", args: ["day", "weekday"] }),
                formatweek: HtmlMeth(formatweek, { name: "formatweek", args: ["theweek"] }),
                formatweekday: HtmlMeth(formatweekday, { name: "formatweekday", args: ["day"] }),
                formatweekheader: HtmlMeth(formatweekheader, { name: "formatweekheader" }),
                formatmonthname: HtmlMeth(formatmonthname, {
                    name: "formatmonthname",
                    args: ["theyear", "themonth", "withyear"],
                    defaults: [pyTrue],
                }),
                formatmonth: HtmlMeth(formatmonth, {
                    name: "formatmonth",
                    args: ["thyear", "themonth", "withyear"],
                    defaults: [pyTrue],
                }),
                formatyear: HtmlMeth(formatyear, { name: "formatyear", args: ["theyear", "width"], defaults: [_3] }),
                formatyearpage: HtmlMeth(formatyearpage, {
                    name: "formatyearpage",
                    args: ["theyear", "width", "css", "encoding"],
                    defaults: [_3, new pyStr("calendar.css"), new pyStr("utf-8")],
                }),
                cssclasses,
                cssclasses_weekday_head,
                cssclass_noday,
                cssclass_month_head,
                cssclass_month,
                cssclass_year_head,
                cssclass_year,
            };

            Object.assign(loc, locals);
        },
        "HTMLCalendar",
        [Calendar]
    );

    /***** LocaleCalendars *****/

    function withLocale(locale, fn) {
        const s = strftimeJs.localizeByIdentifier(locale.toString());
        skGlobal.strftime = s;
        try {
            return fn();
        } finally {
            skGlobal.strftime = strftimeJs;
        }
    }

    function localInit(self, locale) {
        if (!isTrue(locale)) {
            locale = new pyStr("en_US");
        }
        self.locale = locale;
    }

    const LocaleTextCalendar = buildClass(
        calMod,
        (_gbl, loc) => {
            function __init__(self, firstweekday, locale) {
                callA(TextCalendar, "__init__", self, firstweekday);
                localInit(self, locale);
                return pyNone;
            }
            function formatweekday(self, day, width) {
                return withLocale(self.locale, () => doTextFormatweekday(self, day, width));
            }
            function formatmonthname(self, theyear, themonth, width, withyear) {
                return withLocale(self.locale, () => doTextFormatmonthname(self, theyear, themonth, width, withyear));
            }
            const LocaleMeth = makePyMethod.bind(null, "LocaleTextCalendar");

            const locals = {
                __init__: LocaleMeth(__init__, {
                    name: "__init__",
                    args: ["firstweekday", "locale"],
                    defaults: [_0, pyNone],
                }),
                formatweekday: LocaleMeth(formatweekday, { name: "formatweekday", args: ["day", "width"] }),
                formatmonthname: LocaleMeth(formatmonthname, {
                    name: "formatmonthname",
                    args: ["theyear", "themonth", "width", "withyear"],
                    defaults: [pyTrue],
                }),
            };

            Object.assign(loc, locals);
        },
        "LocaleTextCalendar",
        [TextCalendar]
    );

    const LocaleHTMLCalendar = buildClass(
        calMod,
        (_gbl, loc) => {
            function __init__(self, firstweekday, locale) {
                callA(HTMLCalendar, "__init__", self, firstweekday);
                localInit(self, locale);
                return pyNone;
            }
            function formatweekday(self, day) {
                return withLocale(self.locale, () => doHtmlFormatweekday(self, day));
            }
            function formatmonthname(self, theyear, themonth, withyear) {
                return withLocale(self.locale, () => doHtmlFormatmonthname(self, theyear, themonth, withyear));
            }
            const LocaleMeth = makePyMethod.bind(null, "LocaleHTMLCalendar");

            const locals = {
                __init__: LocaleMeth(__init__, {
                    name: "__init__",
                    args: ["firstweekday", "locale"],
                    defaults: [_0, pyNone],
                }),
                formatweekday: LocaleMeth(formatweekday, { name: "formatweekday", args: ["day"] }),
                formatmonthname: LocaleMeth(formatmonthname, {
                    name: "formatmonthname",
                    args: ["theyear", "themonth", "withyear"],
                    defaults: [pyTrue],
                }),
            };

            Object.assign(loc, locals);
        },
        "LocaleHTMLCalendar",
        [HTMLCalendar]
    );

    const c = pyCall(TextCalendar, []);

    Object.assign(calMod, {
        IllegalMonthError,
        IllegalWeekdayError,
        day_name,
        month_name,
        day_abbr,
        month_abbr,
        January: new pyInt(January),
        February: new pyInt(February),
        mdays: toPy(mdays),
        MONDAY: new pyInt(MONDAY),
        TUESDAY: new pyInt(TUESDAY),
        WEDNESDAY: new pyInt(WEDNESDAY),
        THURSDAY: new pyInt(THURSDAY),
        FRIDAY: new pyInt(FRIDAY),
        SATURDAY: new pyInt(SATURDAY),
        SUNDAY: new pyInt(SUNDAY),
        Calendar,
        TextCalendar,
        HTMLCalendar,
        LocaleTextCalendar,
        LocaleHTMLCalendar,
        c,
        firstweekday: getA(c, "getfirstweekday"),
        monthcalendar: getA(c, "monthdayscalendar"),
        prweek: getA(c, "prweek"),
        week: getA(c, "formatweek"),
        weekheader: getA(c, "formatweekheader"),
        prmonth: getA(c, "prmonth"),
        month: getA(c, "formatmonth"),
        calendar: getA(c, "formatyear"),
        prcal: getA(c, "pryear"),
    });

    // # Spacing of month columns for multi-column year calendar
    const _colwidth = new pyInt(7 * 3 - 1); //# Amount printed by prweek()
    const _spacing = _6; //# Number of spaces between columns

    function format(cols, colwidth, spacing) {
        pyPrint([formatstring(cols, colwidth, spacing)]);
        return pyNone;
    }

    function formatstring(cols, colwidth, spacing) {
        colwidth || (colwidth = _colwidth);
        spacing || (spacing = _spacing);
        spacing = mul(spacing, new pyStr(" "));
        const rv = [];
        for (const c of iterJs(cols)) {
            rv.push(pyCenter(c, colwidth).toString());
        }
        return new pyStr(rv.join(spacing.toString()));
    }

    const EPOCH = 1970;
    const toOrd = getA(pyDate, "toordinal");
    const _EPOCH_ORD = pyCall(toOrd, [new pyDate(EPOCH, 1, 1)]);

    setUpModuleMethods("calendar", calMod, {
        isleap: {
            $meth(year) {
                return pyBool(isleap(year));
            },
            $flags: { NamedArgs: ["year"] },
            $doc: "Return True for leap years, False for non-leap years",
        },
        leapdays: {
            $meth(y1, y2) {
                y1 = asIndexOrThrow(y1) - 1;
                y2 = asIndexOrThrow(y2) - 1;
                const _ = Math.floor;
                return new pyInt(_(y2 / 4) - _(y1 / 4) - (_(y2 / 100) - _(y1 / 100)) + (_(y2 / 400) - _(y1 / 400)));
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
        },
        weekday: {
            $meth: weekday,
            $flags: { NamedArgs: ["year", "month", "day"] },
            $doc: "Return weekday (0-6 ~ Mon-Sun) for year, month (1-12), day (1-31).",
        },
        monthrange: {
            $meth(year, month) {
                return new pyTuple(monthrange(year, month));
            },
            $flags: { NamedArgs: ["year", "month"] },
            $doc: "Return weekday (0-6 ~ Mon-Sun) and number of days (28-31) for year, month.",
        },
        setfirstweekday: {
            $meth(firstweekday) {
                const jsweekday = asIndexOrThrow(firstweekday);
                if (!(MONDAY <= jsweekday && jsweekday <= SUNDAY)) {
                    throw pyCall(IllegalWeekdayError, [firstweekday]);
                }
                c.fwd = firstweekday;
            },
            $flags: { NamedArgs: ["firstweekday"] },
        },
        format: {
            $meth: format,
            $flags: { NamedArgs: ["cols", "colwidth", "spacing"], Defaults: [_colwidth, _spacing] },
        },
        formatstring: {
            $meth: formatstring,
            $flags: { NamedArgs: ["cols", "colwidth", "spacing"], Defaults: [_colwidth, _spacing] },
        },
        timegm: {
            $meth(tuple) {
                const [year, month, day, hour, minute, second] = tuple.valueOf();
                const date = pyCall(pyDate, [year, month, _1]);
                const asOrd = pyCall(toOrd, [date]);
                const days = add(sub(asOrd, _EPOCH_ORD), dec(day));
                const hours = add(mul(days, _24), hour);
                const minutes = add(mul(hours, _60), minute);
                const seconds = add(mul(minutes, _60), second);
                return seconds;
            },
            $flags: { OneArg: true },
        },
    });

    return calMod;
}
