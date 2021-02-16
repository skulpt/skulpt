/* jshint -W067 */
(function() {
    'use strict';

    /**
 * User: rikishi
 * Date: 07.07.13
 * Time: 19:17
 *
 */

/**
 * @param {string} str
 * @param {string} format
 * @param {Boolean} [local]
 * @returns {Date|Null}
 */
/*jshint -W079 */
var strptime = function(str, format, local) {
    return strptime.parse(str, format, local);
};


    strptime.version = '0.0.1';

    var namespace;

    if (typeof module !== 'undefined') {
        namespace = module.exports = strptime;
    } else {
        namespace = (function() {
            return this || (1, eval)('this');
        }());
    }

    namespace.strptime = strptime;

    (function(strptime) {

    strptime.locale = {
        'a': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        'A': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        'b': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        'B': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        'f': ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'],
        'c': '%Y-%m-%d %H:%M:%S',
        'P': ['am', 'pm'],
        'r': '%I:%M:%S %p',
        'x': '%m/%d/%y',
        'X': '%H:%M:%S',
        'day': ['Yesterday', 'Today', 'Tomorrow'],

        // алиас падежа обязательно указать после обозначения
        'bg': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        'Bg': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        'fg': ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'],

        'Date_dBY_year_in_HM': '%#B %-d, %Y at %-H:%M',
        'Date_dBY_year': '%#B %-d, %Y',
        'Date_dBY': '%#B %-d, %Y',
        'Date_AdBY': '%A, %#B %-d, %Y',
        'Date_dBA': '%#B %-d, %A',
        'Date_df_in_HM': '%#f, %-d at %-H:%M',
        'Date_dfY': '%-d %#f %Y',
        'Date_dB_in_HM': '%#B %-d at %-H:%M',
        'Date_df': '%-d %#f'
    };

}(strptime));


    (function(strptime) {

    var inArray = Array.prototype.indexOf || function(el) {
        var l = this.length;
        var i = 0;
        while (i < l) {
            if (el == this[i]) {
                return i;
            }
            i++;
        }
        return -1;
    };

    var locale = strptime.locale;

    var strRegNum2 = '[\\d\\s]?\\d';
    var strRegStr = '\\S+';

    var specifiers = {
        '%': '\\%',
        // сокращенное название дня недели, в соответствии с настройками локали
        'a': strRegStr,
        // полное название дня недели, в соответствии с настройками локали
        'A': strRegStr,
        // аббревиатура названия месяца, в соответствии с настройками локали
        'b': {
            'reg': strRegStr,
            'make': function(date, data, mod, gen) {
                data = inArray.call(gen ? locale.bg : locale.b, toLetterCaseReverse(data, mod));
                if (data === -1) {
                    return false;
                }

                date.setUTCMonth(data);
                return true;
            }
        },
        // аббревиатура названия месяца, в соответствии с настройками локали (псевдоним %b)
        'h': {
            'reg': strRegStr,
            'make': function(date, data, mod, gen) {
                data = inArray.call(gen ? locale.bg : locale.b, toLetterCaseReverse(data, mod));
                if (data === -1) {
                    return false;
                }

                date.setUTCMonth(data);
                return true;
            }
        },
        // полное название месяца, в соответствии с настройками локали
        'B': {
            'reg': strRegStr,
            'make': function(date, data, mod, gen) {
                data = inArray.call(gen ? locale.Bg : locale.B, toLetterCaseReverse(data, mod));
                if (data === -1) {
                    return false;
                }

                date.setUTCMonth(data);
                return true;
            }
        },
        // аббревиатура названия месяца с точкой, в соответствии с настройками локали
        'f': {
            'reg': strRegStr,
            'make': function(date, data, mod, gen) {
                data = inArray.call(gen ? locale.fg : locale.f, toLetterCaseReverse(data, mod));
                if (data === -1) {
                    return false;
                }

                date.setUTCMonth(data);
                return true;
            }
        },


        // двухзначный номер года в соответствии со стандартом ISO-8601:1988
        'g': {
            'reg': strRegNum2,
            'make': function(date, data) {
                data = parseInt(data, 10);
                if (data < 0 || data > 99) {
                    return false;
                }

                data = data + 100 * parseInt((new Date()).getUTCFullYear() / 100, 10);
                date.setUTCFullYear(data);
                return true;
            }
        },
        // полная четырехзначная версия %g
        'G': {
            'reg': '\\d{4}',
            'make': function(date, data) {
                data = parseInt(data, 10);
                date.setUTCFullYear(data);
                return true;
            }
        },
        // двухзначное представление дня месяца (с ведущими нулями)
        'd': {
            'reg': strRegNum2,
            'make': function(date, data) {
                data = parseInt(data, 10);
                if (data < 1 || data > 31) {
                    return false;
                }
                date.setUTCDate(data);
                return true;
            }
        },
        // день месяца, с ведущим пробелом, если он состоит из одной цифры
        'e': {
            'reg': strRegNum2,
            'make': function(date, data) {
                data = parseInt(data, 10);
                if (data < 1 || data > 31) {
                    return false;
                }
                date.setUTCDate(data);
                return true;
            }
        },

        // двухзначный номер часа в 24-часовом формате
        'H': {
            'reg': strRegNum2,
            'make': function(date, data) {
                data = parseInt(data, 10);
                if (data < 0 || data > 23) {
                    return false;
                }
                date.setUTCHours(data);
                return true;
            }
        },
        // двухзначный номер часа в 12-часовом формате
        'I': {
            'reg': strRegNum2,
            'make': function(date, data) {
                data = parseInt(data, 10);
                if (data < 1 || data > 12) {
                    return false;
                }

                date.setUTCHours(date.getUTCHours() + data);
                return true;
            }
        },
        // двухзначный порядковый номер месяца (с ведущими нулями)
        'm': {
            'reg': strRegNum2,
            'make': function(date, data) {
                data = parseInt(data, 10);
                if (data < 1 || data > 12) {
                    return false;
                }
                date.setUTCMonth(data - 1);
                return true;
            }
        },
        // двухзначный номер минуты (с ведущими нулями)
        'M': {
            'reg': strRegNum2,
            'make': function(date, data) {
                data = parseInt(data, 10);
                if (data < 0 || data > 59) {
                    return false;
                }
                date.setUTCMinutes(data);
                return true;
            }
        },
        'n': '\\n',
        // 'AM' или 'PM' в верхнем регистре, в зависимости от указанного времени
        'p': {
            'reg': strRegStr,
            'make': function(date, data) {
                data = inArray.call(locale.P, data.toLowerCase());
                if (data === -1) {
                    return false;
                }

                if (data === 1) {
                    date.setUTCHours(date.getUTCHours() + 12);
                }

                return true;
            }
        },
        // 'am' или 'pm' в зависимости от указанного времени
        'P': {
            'reg': strRegStr,
            'make': function(date, data) {
                data = inArray.call(locale.P, data.toLowerCase());
                if (data === -1) {
                    return false;
                }

                if (data === 1) {
                    date.setUTCHours(date.getUTCHours() + 12);
                }

                return true;
            }
        },

        // двухзначный номер секунды (с ведущими нулями)
        'S': {
            'reg': strRegNum2,
            'make': function(date, data) {
                data = parseInt(data, 10);
                if (data < 0 || data > 60) {
                    return false;
                }
                date.setUTCSeconds(data);
                return true;
            }
        },
        't': '\\t',
        'u': '\\d',
        'U': strRegNum2,
        'w': '\\d',
        'W': strRegNum2,
        // последние 2 цифры года
        'y': {
            'reg': strRegNum2,
            'make': function(date, data) {
                data = parseInt(data, 10);
                if (data < 0 || data > 99) {
                    return false;
                }

                data = data + 100 * parseInt((new Date()).getUTCFullYear() / 100, 10);
                date.setUTCFullYear(data);
                return true;
            }
        },
        // год
        'Y': {
            'reg': '\\d{4}',
            'make': function(date, data) {
                data = parseInt(data, 10);
                date.setUTCFullYear(data);
                return true;
            }
        },
        'z': {
            'reg': '[+\\-]\\d{4}',
            'make': function(date, data) {
                var m = data.match(/^([+\-])(\d{2})(\d{2})$/);
                if (!m) {
                    return false;
                }

                var offset = (parseInt(m[2], 10) * 60 + parseInt(m[3], 10)) * 60000;
                if (m[1] === '+') {
                    offset = -offset;
                }

                date.setTime(date.getTime() + offset);

                return true;
            }
        },
        'l': {
            'reg': strRegNum2,
            'make': function(date, data) {
                data = parseInt(data, 10);
                if (data < 1 || data > 12) {
                    return false;
                }

                date.setUTCHours(date.getUTCHours() + data);
                return true;
            }
        },
        // метка времени Эпохи Unix
        's': {
            'reg': '\\d+',
            'make': function(date, data) {
                data = parseInt(data, 10);
                date.setTime(data * 1000);
                return true;
            }
        },



        'c': locale.c,
        'r': locale.r,
        'R': '%H:%M',
        'T': '%H:%M:%S',
        'x': locale.x,
        'X': locale.X,
        'D': '%m/%d/%y',
        'F': '%Y-%m-%d',


        'Date_iso': '%Y-%m-%dT%H:%M:%S',
        'Date_dBY_year_in_HM': locale.Date_dBY_year_in_HM,
        'Date_dBY_year': locale.Date_dBY_year,
        'Date_dBY': locale.Date_dBY,
        'Date_dBA': locale.Date_dBA,
        'Date_AdBY': locale.Date_AdBY,
        'Date_df_in_HM': locale.Date_df_in_HM,
        'Date_dfY': locale.Date_dfY,
        'Date_dB_in_HM': locale.Date_dB_in_HM,
        'Date_dmY__dot': '%d.%m.%Y',
        'Date_df': locale.Date_df,
        'Date_FT': '%F %T',
        'Date_dmY__minus': '%d-%m-%Y'
    };

    strptime.parse = function(str, format, local) {
        str = String(str);
        format = String(format);

        var loop = 5;
        while (/%(Date_[a-zA-Z0-9_]+|[cDFrRTxX])/g.test(format) && loop) {
            format = format.replace(/%(Date_[a-zA-Z0-9_]+|[cDFrRTxX])/, formatTransform);
            loop--;
        }

        formatTransform.make = [];
        var reg = format.replace(/%(([#\^!~]{0,2})[aAbBfh]|([0\-_]?)[degHImMSVWyl]|[GnpPtuUwYzZs%])/g, formatTransform);

        var match = str.match(new RegExp(reg));

        if (!match || !formatTransform.make.length) {
            return null;
        }

        var date = new Date(Date.UTC(0, 0));

        for (var i = 0, l = formatTransform.make.length; i < l; i++) {
            var build = formatTransform.make[i];
            if (!build[0](date, match[i + 1], build[1], build[2])) {
                return null;
            }
        }

        if (local) {
            date.setTime(date.getTime() + date.getTimezoneOffset() * 60000);
        }

        return date;
    };

    function formatTransform(_, spec, mod, numPad, pos, str) {
        spec = String(spec);
        mod = String(mod);
        spec = spec.replace(/^[#_0\^\-!~]+/, '');

        var s = specifiers[spec];

        if (!s) {
            return _;
        }

        var genitive = false;
        if (mod.indexOf('!') === -1 && spec.length === 1 && (mod.indexOf('~') > -1 || ('bBf'.indexOf(spec) > -1 && /%[0\-_]?d[\s]+$/.test(str.substr(0, pos))))) {

            genitive = true;
        }

        if ((spec === 'I' || spec === 'l') && !/%[pP]/.test(str)) {
            throw new Error('Undefined AM/PM');
        }

        // TODO добавить проверку повторяющихся форматов

        switch (typeof(s)) {
        case 'function':
            return s();
        case 'string':
            return s;
        case 'object':
            formatTransform.make.push([s.make, mod, genitive]);
            return '(' + s.reg + ')';
        default:
            return _;
        }
    }

    /**
     * @param {string} str
     * @param {string} [mode]
     * @returns {string}
     */
    function toLetterCaseReverse(str, mode) {
        str = String(str);
        mode = String(mode);

        if (mode.indexOf('#') !== -1) {
            return str.substr(0, 1).toUpperCase() + str.substr(1);
        }

        if (mode.indexOf('^') !== -1) {
            return str.substr(0, 1) + str.substr(1).toLowerCase();
        }

        return str;
    }

}(strptime));


}());
