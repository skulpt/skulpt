Str$ = function(val)
{
    if (val === undefined) val = "";
    if (val === null) val = "None";
    if (val === false) val = "False";
    if (val === true) val = "True";
    if (val.constructor === Str$)
    {
        return val;
    }
    if (val.__str__ !== undefined)
        val = val.__str__().v;
    else if (val.__repr__ !== undefined)
        val = val.__repr__().v;
    else
        val = val.toString();

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
