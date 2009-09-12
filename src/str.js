Str$ = function(val)
{
    if (val && val.constructor === Str$) return val; // todo; shouldn't be necessary?
    if (val === undefined) val = "";
    if (typeof val !== "string") throw "Str$ constructor expecting js string, got " + typeof val;

    // interning required for strings in py
    if (Str$.prototype.internStrings$.hasOwnProperty(val))
    {
        return Str$.prototype.internStrings$[val];
    }

    this.v = val;
    Str$.prototype.internStrings$[val] = this;
};
Str$.prototype.internStrings$ = {};

Str$.prototype.$_alphanum = {};
(function initAlnum(){
 var i;
 for (i = 'a'; i <= 'z'; ++i) Str$.prototype.$_alphanum[i] = 1;
 for (i = 'A'; i <= 'Z'; ++i) Str$.prototype.$_alphanum[i] = 1;
 for (i = '0'; i <= '9'; ++i) Str$.prototype.$_alphanum[i] = 1;
}());

Str$.prototype.re_escape$ = function(s)
{
    var ret = [];
    for (var i = 0; i < s.length; ++i)
    {
        var c = s[i];
        if (Str$.prototype.$_alphanum[c])
        {
            ret.push(c);
        }
        else
        {
            if (c === "\\000")
                ret.push("\\000");
            else
                ret.push("\\" + c);
        }
    }
    return ret.join('');
};

Str$.prototype.__getitem__ = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new IndexError("string index out of range");
        return new Str$(this.v[index]);
    }
    else if (index instanceof Slice$)
    {
        var ret = '';
        index.sssiter$(this, function(i, wrt) {
                if (i >= 0 && i < wrt.v.length)
                    ret += wrt.v[i];
                });
        return new Str$(ret);
    }
    else
        throw new TypeError("string indices must be numbers, not " + typeof index);
};

Str$.prototype.escapable$ = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
Str$.prototype.meta$ = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    "'" : "\\'",
    '\\': '\\\\'
};
Str$.prototype.quote$ = function(string)
{
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    this.escapable$.lastIndex = 0;
    return this.escapable$.test(string) ?
        "'" + string.replace(this.escapable$, function (a) {
            var c = this.meta$[a];
            return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + "'" :
        "'" + string + "'";
};

Str$.prototype.__add__ = function(other)
{
    return new Str$(this.v + other.v);
};

Str$.prototype.__mul__ = function(other)
{
    if (typeof other !== "number") throw "TypeError"; // todo; long, better error
    var ret = "";
    for (var i = 0; i < other; ++i)
    {
        ret += this.v;
    }
    return new Str$(ret);
};

Str$.prototype.__mod__ = function(rhs)
{
    // % format op. rhs can be a value, a tuple, or something with __getitem__ (dict)

    // From http://docs.python.org/library/stdtypes.html#string-formatting the
    // format looks like:
    // 1. The '%' character, which marks the start of the specifier.
    // 2. Mapping key (optional), consisting of a parenthesised sequence of characters (for example, (somename)).
    // 3. Conversion flags (optional), which affect the result of some conversion types.
    // 4. Minimum field width (optional). If specified as an '*' (asterisk), the actual width is read from the next element of the tuple in values, and the object to convert comes after the minimum field width and optional precision.
    // 5. Precision (optional), given as a '.' (dot) followed by the precision. If specified as '*' (an asterisk), the actual width is read from the next element of the tuple in values, and the value to convert comes after the precision.
    // 6. Length modifier (optional).
    // 7. Conversion type.
    //
    // length modifier is ignored

    if (rhs.constructor !== Tuple$ && (rhs.__getitem__ === undefined || rhs.constructor === Str$)) rhs = new Tuple$([rhs]);
    
    // general approach is to use a regex that matches the format above, and
    // do an re.sub with a function as replacement to make the subs.

    //           1 2222222222222222   33333333   444444444   5555555555555  66666  777777777777777777
    var regex = /%(\([a-zA-Z0-9]+\))?([#0 +\-]+)?(\*|[0-9]+)?(\.(\*|[0-9]+))?[hlL]?([diouxXeEfFgGcrs%])/g;
    var index = 0;
    var replFunc = function(substring, mappingKey, conversionFlags, fieldWidth, precision, precbody, conversionType)
    {
        var i;
        if (mappingKey === undefined) i = index++;

        var zeroPad = false;
        var leftAdjust = false;
        var blankBeforePositive = false;
        var precedeWithSign = false;
        var alternateForm = false;
        if (conversionFlags)
        {
            if (conversionFlags.indexOf("-") !== -1) leftAdjust = true;
            else if (conversionFlags.indexOf("0") !== -1) zeroPad = true;

            if (conversionFlags.indexOf("+") !== -1) precedeWithSign = true;
            else if (conversionFlags.indexOf(" ") !== -1) blankBeforePositive = true;

            alternateForm = conversionFlags.indexOf("#") !== -1;
        }

        if (precision)
        {
            precision = parseInt(precision.substr(1), 10);
        }

        var formatNumber = function(n, base)
        {
            var j;
            var r;
            var neg = false;
            var didSign = false;
            if (typeof n === "number")
            {
                if (n < 0)
                {
                    n = -n;
                    neg = true;
                }
                r = n.toString(base);
            }
            else if (n.constructor === Long$)
            {
                r = n.str$(base, false);
                neg = n.size$ < 0;
            }

            if (r === undefined) throw "unhandled number format";

            var precZeroPadded = false;

            if (precision)
            {
                //print("r.length",r.length,"precision",precision);
                for (j = r.length; j < precision; ++j)
                {
                    r = '0' + r;
                    precZeroPadded = true;
                }
            }

            var prefix = '';

            if (neg) prefix = "-";
            else if (precedeWithSign) prefix = "+" + prefix;
            else if (blankBeforePositive) prefix = " " + prefix;

            if (alternateForm)
            {
                if (base === 16) prefix += '0x';
                else if (base === 8 && !precZeroPadded && r !== "0") prefix += '0';
            }

            return [prefix, r];
        };

        var handleWidth = function(args)
        {
            var prefix = args[0];
            var r = args[1];
            var j;
            if (fieldWidth)
            {
                fieldWidth = parseInt(fieldWidth, 10);
                var totLen = r.length + prefix.length;
                if (zeroPad)
                    for (j = totLen; j < fieldWidth; ++j)
                        r = '0' + r;
                else if (leftAdjust)
                    for (j = totLen; j < fieldWidth; ++j)
                        r = r + ' ';
                else
                    for (j = totLen; j < fieldWidth; ++j)
                        prefix = ' ' + prefix;
            }
            return prefix + r;
        };

        var value;
        //print("Rhs:",rhs, "ctor", rhs.constructor);
        if (rhs.constructor === Tuple$) value = rhs.v[i];
        else if (rhs.__getitem__ !== undefined)
        {
            var mk = mappingKey.substring(1, mappingKey.length - 1);
            //print("mk",mk);
            value = rhs.__getitem__(new Str$(mk));
        }
        else throw new AttributeError(rhs.__class__.name + " instance has no attribute '__getitem__'");
        var r;
        var base = 10;
        switch (conversionType)
        {
            case 'd':
            case 'i':
                return handleWidth(formatNumber(value, 10));
            case 'o':
                return handleWidth(formatNumber(value, 8));
            case 'x':
                return handleWidth(formatNumber(value, 16));
            case 'X':
                return handleWidth(formatNumber(value, 16)).toUpperCase();

            case 'e':
            case 'E':
            case 'f':
            case 'F':
            case 'g':
            case 'G':
                var convName = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(conversionType.toLowerCase())];
                var result = (value)[convName](precision);
                if ('EFG'.indexOf(conversionType) !== -1) result = result.toUpperCase();
                // todo; signs etc.
                return handleWidth(['', result]);

            case 'c':
                if (typeof value === "number")
                    return String.fromCharCode(value);
                else if (value.constructor === Long$)
                    return String.fromCharCode(value.digit$[0] & 255);
                else if (value.constructor === Str$)
                    return value.v.substr(0, 1);
                else
                    throw new TypeError("an integer is required");
                break; // stupid lint

            case 'r':
                r = repr(value);
                if (precision) return r.v.substr(0, precision);
                return r.v;
            case 's':
                /*
                print("value",value);
                print("replace:");
                print("  index", index);
                print("  substring", substring);
                print("  mappingKey", mappingKey);
                print("  conversionFlags", conversionFlags);
                print("  fieldWidth", fieldWidth);
                print("  precision", precision);
                print("  conversionType", conversionType);
                */
                r = str(value);
                if (precision) return r.v.substr(0, precision);
                return r.v;
            case '%':
                return '%';
        }
    };
    
    var ret = this.v.replace(regex, replFunc);
    return new Str$(ret);
};

Str$.prototype.__repr__ = function()
{
    return new Str$(this.quote$(this.v));
};

Str$.prototype.__str__ = function()
{
    return this.v;
};

Str$.prototype.__class__ = new Type$('str', [sk$TypeObject], {});

Str$.prototype.capitalize = function() { throw "todo; capitalize"; };
Str$.prototype.center = function() { throw "todo; center"; };
Str$.prototype.count = function() { throw "todo; count"; };
Str$.prototype.decode = function() { throw "todo; decode"; };
Str$.prototype.encode = function() { throw "todo; encode"; };
Str$.prototype.endswith = function() { throw "todo; endswith"; };
Str$.prototype.expandtabs = function() { throw "todo; expandtabs"; };
Str$.prototype.find = function() { throw "todo; find"; };
Str$.prototype.format = function() { throw "todo; format"; };
Str$.prototype.index = function() { throw "todo; index"; };
Str$.prototype.isalnum = function() { throw "todo; isalnum"; };
Str$.prototype.isalpha = function() { throw "todo; isalpha"; };
Str$.prototype.isdigit = function() { throw "todo; isdigit"; };
Str$.prototype.islower = function() { throw "todo; islower"; };
Str$.prototype.isspace = function() { throw "todo; isspace"; };
Str$.prototype.istitle = function() { throw "todo; istitle"; };
Str$.prototype.isupper = function() { throw "todo; isupper"; };

Str$.prototype.join = function(seq)
{
    var arrOfStrs = [];
    sk$iter(seq, function(v)
            {
                if (v.constructor !== Str$) throw "TypeError: sequence item " + arrOfStrs.length + ": expected string, " + typeof v + " found";
                arrOfStrs.push(v.v);
            });
    return arrOfStrs.join(this.v);
};

Str$.prototype.ljust = function() { throw "todo; ljust"; };
Str$.prototype.lower = function() { throw "todo; lower"; };
Str$.prototype.lstrip = function() { throw "todo; lstrip"; };
Str$.prototype.partition = function() { throw "todo; partition"; };

Str$.prototype.replace = function(oldS, newS, count)
{
    if (oldS.constructor !== Str$ || newS.constructor !== Str$)
        throw "TypeError: expecting a string";
    if (count !== undefined)
        throw "todo; replace() with count not implemented";
    var patt = new RegExp(this.re_escape$(oldS.v), "g");
    return new Str$(this.v.replace(patt, newS.v));
};

Str$.prototype.rfind = function() { throw "todo; rfind"; };
Str$.prototype.rindex = function() { throw "todo; rindex"; };
Str$.prototype.rjust = function() { throw "todo; rjust"; };
Str$.prototype.rpartition = function() { throw "todo; rpartition"; };
Str$.prototype.rsplit = function() { throw "todo; rsplit"; };
Str$.prototype.rstrip = function() { throw "todo; rstrip"; };

Str$.prototype.split = function(on, howmany)
{
    var res = this.v.split(new Str$(on).v, howmany);
    var tmp = [];
    for (var i = 0; i < res.length; ++i)
    {
        tmp.push(new Str$(res[i]));
    }
    return new List$(tmp);
};

Str$.prototype.splitlines = function() { throw "todo; splitlines"; };
Str$.prototype.startswith = function() { throw "todo; startswith"; };
Str$.prototype.strip = function() { throw "todo; strip"; };
Str$.prototype.swapcase = function() { throw "todo; swapcase"; };
Str$.prototype.title = function() { throw "todo; title"; };
Str$.prototype.translate = function() { throw "todo; translate"; };
Str$.prototype.upper = function() { throw "todo; upper"; };
Str$.prototype.zfill = function() { throw "todo; zfill"; };

Str$.prototype.__iter__ = function()
{
    var ret =
    {
        __iter__: function() { return ret; },
        $obj: this,
        $index: 0,
        next: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$obj.v.length) return undefined;
           return new Str$(ret.$obj.v.substr(ret.$index++, 1));
        }
    };
    return ret;
};
