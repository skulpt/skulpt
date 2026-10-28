// Exercise the Python API with capabilities missing from older browsers.
const fs = require("fs");
const vm = require("vm");

async function run(intl, source) {
    const context = vm.createContext({ Intl: intl, Date, console, setTimeout, clearTimeout });
    vm.runInContext(fs.readFileSync("dist/skulpt.min.js", "utf8"), context);
    const Sk = context.Sk;
    Sk.configure({
        __future__: Sk.python3,
        read: (filename) => fs.readFileSync(filename, "utf8"),
        output: () => {},
    });
    await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("locale_browser", false, source, true));
}

const cLocale = `
import locale
from datetime import datetime
for category in (locale.LC_TIME, locale.LC_NUMERIC, locale.LC_MONETARY):
    assert locale.setlocale(category, 'C') == 'C'
assert datetime(2026, 3, 9).strftime('%B %d %Y') == 'March 09 2026'
assert datetime.strptime('March 09 2026', '%B %d %Y') == datetime(2026, 3, 9)
assert locale.format_string('%.2f', 1234.5) == '1234.50'
assert locale.localeconv()['currency_symbol'] == ''
`;
function unavailable(category) {
    const feature = { LC_TIME: "date and time", LC_NUMERIC: "number", LC_MONETARY: "currency" }[category];
    return `
try:
    locale.setlocale(locale.${category}, 'de_DE')
except NotImplementedError as error:
    message = str(error)
    assert '${feature} localisation' in message
    assert 'newer browser' in message
    assert ("'C'" in message) == ${category === 'LC_MONETARY' ? 'False' : 'True'}
    assert 'Intl' not in message
else:
    raise AssertionError('missing browser capability was accepted')
assert locale.setlocale(locale.${category}) == 'C'
`;
}
const germanDate = `
locale.setlocale(locale.LC_TIME, 'de_DE')
assert datetime(2026, 3, 9).strftime('%B') == 'März'
`;
function withoutMethod(Constructor, name, isStatic = false) {
    class Older extends Constructor {}
    Object.defineProperty(isStatic ? Older : Older.prototype, name, { value: undefined });
    return Older;
}
const native = { DateTimeFormat: Intl.DateTimeFormat, NumberFormat: Intl.NumberFormat, Locale: Intl.Locale };

(async () => {
    await run(undefined, cLocale + unavailable('LC_TIME') + unavailable('LC_NUMERIC') + unavailable('LC_MONETARY'));
    await run({ ...native, DateTimeFormat: withoutMethod(Intl.DateTimeFormat, 'formatToParts') },
        cLocale + unavailable('LC_TIME'));
    await run({ ...native, DateTimeFormat: withoutMethod(Intl.DateTimeFormat, 'supportedLocalesOf', true) },
        cLocale + unavailable('LC_TIME'));
    await run({ ...native, NumberFormat: withoutMethod(Intl.NumberFormat, 'formatToParts') },
        cLocale + unavailable('LC_NUMERIC') + unavailable('LC_MONETARY') + germanDate);
    await run({ ...native, Locale: undefined }, cLocale + unavailable('LC_MONETARY') + germanDate);
    await run({ ...native, Locale: withoutMethod(Intl.Locale, 'maximize') },
        cLocale + unavailable('LC_MONETARY') + germanDate);

    class OlderDateTimeFormat extends Intl.DateTimeFormat {
        formatToParts(date) {
            return super.formatToParts(date).map((part) =>
                part.type === 'dayPeriod' ? { type: 'dayperiod', value: part.value } : part);
        }
    }
    await run({ ...native, DateTimeFormat: OlderDateTimeFormat }, cLocale + `
locale.setlocale(locale.LC_TIME, 'en_US')
value = datetime(2026, 3, 9, 15, 45)
assert value.strftime('%p') == 'PM'
assert datetime.strptime(value.strftime('%c'), '%c') == value
`);
    console.log('Locale browser capabilities: 7 scenarios passed');
})().catch((error) => {
    console.error(error.toString());
    process.exitCode = 1;
});
