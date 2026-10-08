"""Locale support using the host's Intl data.

LC_TIME, LC_NUMERIC and LC_MONETARY are supported. Other categories are
explicitly unsupported. Date formatting uses Gregorian dates and Latin digits.
Number formatting accepts scalars, tuples and dictionaries. Monetary defaults
use CLDR currency-region data; formatting follows the host's conventions.
"""
from _locale import *

# Number-formatting algorithms adapted from CPython Lib/locale.py (PSF license).
# Intl supplies localeconv data; Python preserves normal formatting precision.
_localeconv = localeconv
_override_localeconv = {}


def localeconv():
    result = _localeconv()
    if _override_localeconv:
        result.update(_override_localeconv)
    return result


# Iterate over grouping intervals
def _grouping_intervals(grouping):
    last_interval = None
    for interval in grouping:
        # CHAR_MAX marks the end of grouping.
        if interval == CHAR_MAX:
            return
        # 0: re-use last group ad infinitum
        if interval == 0:
            if last_interval is None:
                raise ValueError("invalid grouping")
            while True:
                yield last_interval
        yield interval
        last_interval = interval

#perform the grouping from right to left
def _group(s, monetary=False):
    conv = localeconv()
    thousands_sep = conv[monetary and 'mon_thousands_sep' or 'thousands_sep']
    grouping = conv[monetary and 'mon_grouping' or 'grouping']
    if not grouping:
        return (s, 0)
    if s[-1] == ' ':
        stripped = s.rstrip()
        right_spaces = s[len(stripped):]
        s = stripped
    else:
        right_spaces = ''
    left_spaces = ''
    groups = []
    for interval in _grouping_intervals(grouping):
        if not s or s[-1] not in "0123456789":
            # only non-digit characters remain (sign, spaces)
            left_spaces = s
            s = ''
            break
        groups.append(s[-interval:])
        s = s[:-interval]
    if s:
        groups.append(s)
    groups.reverse()
    return (
        left_spaces + thousands_sep.join(groups) + right_spaces,
        len(thousands_sep) * (len(groups) - 1)
    )

# Strip a given amount of excess padding from the given string
def _strip_padding(s, amount):
    lpos = 0
    while amount and s[lpos] == ' ':
        lpos += 1
        amount -= 1
    rpos = len(s) - 1
    while amount and s[rpos] == ' ':
        rpos -= 1
        amount -= 1
    return s[lpos:rpos+1]

_percent_re = None

def _format(percent, value, grouping=False, monetary=False, *additional):
    if additional:
        formatted = percent % ((value,) + additional)
    else:
        formatted = percent % value
    if percent[-1] in 'eEfFgGdiu':
        formatted = _localize(formatted, grouping, monetary)
    return formatted

# Transform formatted as locale number according to the locale settings
def _localize(formatted, grouping=False, monetary=False):
    # floats and decimal ints need special action!
    if '.' in formatted:
        seps = 0
        parts = formatted.split('.')
        if grouping:
            parts[0], seps = _group(parts[0], monetary=monetary)
        decimal_point = localeconv()[monetary and 'mon_decimal_point'
                                              or 'decimal_point']
        formatted = decimal_point.join(parts)
        if seps:
            formatted = _strip_padding(formatted, seps)
    else:
        seps = 0
        if grouping:
            formatted, seps = _group(formatted, monetary=monetary)
        if seps:
            formatted = _strip_padding(formatted, seps)
    return formatted

def format_string(f, val, grouping=False, monetary=False):
    """Formats a string in the same way that the % formatting would use,
    but takes the current locale into account.

    Grouping is applied if the third parameter is true.
    Conversion uses monetary thousands separator and grouping strings if
    forth parameter monetary is true."""
    global _percent_re
    if _percent_re is None:
        import re

        _percent_re = re.compile(r'%(?:\((?P<key>.*?)\))?(?P<modifiers'
                                 r'>[-#0-9 +*.hlL]*?)[eEfFgGdiouxXcrs%]')

    percents = list(_percent_re.finditer(f))
    new_f = _percent_re.sub('%s', f)

    if isinstance(val, dict):
        new_val = []
        for perc in percents:
            if perc.group()[-1]=='%':
                new_val.append('%')
            else:
                new_val.append(_format(perc.group(), val, grouping, monetary))
    else:
        if not isinstance(val, tuple):
            val = (val,)
        new_val = []
        i = 0
        for perc in percents:
            if perc.group()[-1]=='%':
                new_val.append('%')
            else:
                starcount = perc.group('modifiers').count('*')
                # val[i] can be a star operand: %*.*f consumes width,
                # precision, then the number. _format preserves this order.
                new_val.append(_format(perc.group(),
                                      val[i],
                                      grouping,
                                      monetary,
                                      *val[i+1:i+1+starcount]))
                i += (1 + starcount)
    val = tuple(new_val)

    return new_f % val

def currency(val, symbol=True, grouping=False, international=False):
    """Formats val according to the currency settings
    in the current locale."""
    conv = localeconv()

    # check for illegal values
    digits = conv[international and 'int_frac_digits' or 'frac_digits']
    if digits == 127:
        raise ValueError("Currency formatting is not possible using "
                         "the 'C' locale.")

    s = _localize(format(abs(val), ".%df" % digits), grouping, monetary=True)
    sign_pos = conv[val < 0 and 'n_sign_posn' or 'p_sign_posn']
    sign = conv[val < 0 and 'negative_sign' or 'positive_sign']

    if symbol:
        smb = conv[international and 'int_curr_symbol' or 'currency_symbol']
        if international:
            smb = smb.rstrip()
        # Apply positions 3/4 to the currency symbol itself. Intl can place
        # the sign between a leading symbol and the amount (e.g. de-CH).
        if sign_pos == 3:
            smb = sign + smb
            sign = ''
        elif sign_pos == 4:
            smb = smb + sign
            sign = ''
        precedes = conv[val < 0 and 'n_cs_precedes' or 'p_cs_precedes']
        separated = international or conv[val < 0 and 'n_sep_by_space' or 'p_sep_by_space']
        gap = ' ' if separated else ''
        s = smb + gap + s if precedes else s + gap + smb

    if sign_pos == 0:
        return '(' + s + ')'
    if sign_pos == 2:
        return s + sign
    return sign + s

def str(val):
    """Convert float to string, taking the locale into account."""
    return _format("%.12g", val)

def delocalize(string):
    "Parses a string as a normalized number according to the locale settings."

    conv = localeconv()

    #First, get rid of the grouping
    ts = conv['thousands_sep']
    if ts:
        string = string.replace(ts, '')

    #next, replace the decimal point with a dot
    dd = conv['decimal_point']
    if dd:
        string = string.replace(dd, '.')
    return string

def localize(string, grouping=False, monetary=False):
    """Parses a string as locale number according to the locale settings."""
    return _localize(string, grouping, monetary)

def atof(string, func=float):
    "Parses a string as a float according to the locale settings."
    return func(delocalize(string))

def atoi(string):
    "Converts a string to an integer according to the locale settings."
    return int(delocalize(string))
