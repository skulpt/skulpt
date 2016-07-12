Sk.builtin.interned = {};

/**
 * @constructor
 * @param {*} x
 * @extends Sk.builtin.object
 */
Sk.builtin.str = function (x) {
    var ret;
    if (x === undefined) {
        x = "";
    }
    if (x instanceof Sk.builtin.str) {
        return x;
    }
    if (!(this instanceof Sk.builtin.str)) {
        return new Sk.builtin.str(x);
    }


    // convert to js string
    if (x === true) {
        ret = "True";
    } else if (x === false) {
        ret = "False";
    } else if ((x === null) || (x instanceof Sk.builtin.none)) {
        ret = "None";
    } else if (x instanceof Sk.builtin.bool) {
        if (x.v) {
            ret = "True";
        } else {
            ret = "False";
        }
    } else if (typeof x === "number") {
        ret = x.toString();
        if (ret === "Infinity") {
            ret = "inf";
        } else if (ret === "-Infinity") {
            ret = "-inf";
        }
    } else if (typeof x === "string") {
        ret = x;
    } else if (x.tp$str !== undefined) {
        ret = x.tp$str();
        if (!(ret instanceof Sk.builtin.str)) {
            throw new Sk.builtin.ValueError("__str__ didn't return a str");
        }
        return ret;
    } else {
        return Sk.misceval.objectRepr(x);
    }

    // interning required for strings in py
    if (Sk.builtin.interned["1" + ret]) {
        return Sk.builtin.interned["1" + ret];
    }

    this.__class__ = Sk.builtin.str;
    this.v = ret;
    this["v"] = this.v;
    Sk.builtin.interned["1" + ret] = this;
    return this;

};
goog.exportSymbol("Sk.builtin.str", Sk.builtin.str);

Sk.abstr.setUpInheritance("str", Sk.builtin.str, Sk.builtin.seqtype);

Sk.builtin.str.prototype.mp$subscript = function (index) {
    var ret;
    if (Sk.misceval.isIndex(index)) {
        index = Sk.misceval.asIndex(index);
        if (index < 0) {
            index = this.v.length + index;
        }
        if (index < 0 || index >= this.v.length) {
            throw new Sk.builtin.IndexError("string index out of range");
        }
        return new Sk.builtin.str(this.v.charAt(index));
    } else if (index instanceof Sk.builtin.slice) {
        ret = "";
        index.sssiter$(this, function (i, wrt) {
            if (i >= 0 && i < wrt.v.length) {
                ret += wrt.v.charAt(i);
            }
        });
        return new Sk.builtin.str(ret);
    } else {
        throw new Sk.builtin.TypeError("string indices must be integers, not " + Sk.abstr.typeName(index));
    }
};

Sk.builtin.str.prototype.sq$length = function () {
    return this.v.length;
};
Sk.builtin.str.prototype.sq$concat = function (other) {
    var otypename;
    if (!other || !Sk.builtin.checkString(other)) {
        otypename = Sk.abstr.typeName(other);
        throw new Sk.builtin.TypeError("cannot concatenate 'str' and '" + otypename + "' objects");
    }
    return new Sk.builtin.str(this.v + other.v);
};
Sk.builtin.str.prototype.nb$add = Sk.builtin.str.prototype.sq$concat;
Sk.builtin.str.prototype.nb$inplace_add = Sk.builtin.str.prototype.sq$concat;
Sk.builtin.str.prototype.sq$repeat = function (n) {
    var i;
    var ret;

    if (!Sk.misceval.isIndex(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }

    n = Sk.misceval.asIndex(n);
    ret = "";
    for (i = 0; i < n; ++i) {
        ret += this.v;
    }
    return new Sk.builtin.str(ret);
};
Sk.builtin.str.prototype.nb$multiply = Sk.builtin.str.prototype.sq$repeat;
Sk.builtin.str.prototype.nb$inplace_multiply = Sk.builtin.str.prototype.sq$repeat;
Sk.builtin.str.prototype.sq$item = function () {
    goog.asserts.fail();
};
Sk.builtin.str.prototype.sq$slice = function (i1, i2) {
    i1 = Sk.builtin.asnum$(i1);
    i2 = Sk.builtin.asnum$(i2);
    if (i1 < 0) {
        i1 = 0;
    }
    return new Sk.builtin.str(this.v.substr(i1, i2 - i1));
};

Sk.builtin.str.prototype.sq$contains = function (ob) {
    if (!(ob instanceof Sk.builtin.str)) {
        throw new Sk.builtin.TypeError("TypeError: 'In <string> requires string as left operand");
    }
    return this.v.indexOf(ob.v) != -1;
};

Sk.builtin.str.prototype.__iter__ = new Sk.builtin.func(function (self) {
    return new Sk.builtin.str_iter_(self);
});

Sk.builtin.str.prototype.tp$iter = function () {
    return new Sk.builtin.str_iter_(this);
};

Sk.builtin.str.prototype.tp$richcompare = function (other, op) {
    if (!(other instanceof Sk.builtin.str)) {
        return undefined;
    }

    switch (op) {
        case "Lt":
            return this.v < other.v;
        case "LtE":
            return this.v <= other.v;
        case "Eq":
            return this.v === other.v;
        case "NotEq":
            return this.v !== other.v;
        case "Gt":
            return this.v > other.v;
        case "GtE":
            return this.v >= other.v;
        default:
            goog.asserts.fail();
    }
};

Sk.builtin.str.prototype["$r"] = function () {
    // single is preferred
    var ashex;
    var c;
    var i;
    var ret;
    var len;
    var quote = "'";
    //jshint ignore:start
    if (this.v.indexOf("'") !== -1 && this.v.indexOf('"') === -1) {
        quote = '"';
    }
    //jshint ignore:end
    len = this.v.length;
    ret = quote;
    for (i = 0; i < len; ++i) {
        c = this.v.charAt(i);
        if (c === quote || c === "\\") {
            ret += "\\" + c;
        } else if (c === "\t") {
            ret += "\\t";
        } else if (c === "\n") {
            ret += "\\n";
        } else if (c === "\r") {
            ret += "\\r";
        } else if (c < " " || c >= 0x7f) {
            ashex = c.charCodeAt(0).toString(16);
            if (ashex.length < 2) {
                ashex = "0" + ashex;
            }
            ret += "\\x" + ashex;
        } else {
            ret += c;
        }
    }
    ret += quote;
    return new Sk.builtin.str(ret);
};


Sk.builtin.str.re_escape_ = function (s) {
    var c;
    var i;
    var ret = [];
    var re = /^[A-Za-z0-9]+$/;
    for (i = 0; i < s.length; ++i) {
        c = s.charAt(i);

        if (re.test(c)) {
            ret.push(c);
        } else {
            if (c === "\\000") {
                ret.push("\\000");
            } else {
                ret.push("\\" + c);
            }
        }
    }
    return ret.join("");
};

Sk.builtin.str.prototype["lower"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("lower", arguments, 1, 1);
    return new Sk.builtin.str(self.v.toLowerCase());
});

Sk.builtin.str.prototype["upper"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("upper", arguments, 1, 1);
    return new Sk.builtin.str(self.v.toUpperCase());
});

Sk.builtin.str.prototype["capitalize"] = new Sk.builtin.func(function (self) {
    var i;
    var cap;
    var orig;
    Sk.builtin.pyCheckArgs("capitalize", arguments, 1, 1);
    orig = self.v;

    if (orig.length === 0) {
        return new Sk.builtin.str("");
    }
    cap = orig.charAt(0).toUpperCase();

    for (i = 1; i < orig.length; i++) {
        cap += orig.charAt(i).toLowerCase();
    }
    return new Sk.builtin.str(cap);
});

Sk.builtin.str.prototype["join"] = new Sk.builtin.func(function (self, seq) {
    var it, i;
    var arrOfStrs;
    Sk.builtin.pyCheckArgs("join", arguments, 2, 2);
    Sk.builtin.pyCheckType("seq", "iterable", Sk.builtin.checkIterable(seq));
    arrOfStrs = [];
    for (it = seq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (i.constructor !== Sk.builtin.str) {
            throw new Sk.builtin.TypeError("TypeError: sequence item " + arrOfStrs.length + ": expected string, " + typeof i + " found");
        }
        arrOfStrs.push(i.v);
    }
    return new Sk.builtin.str(arrOfStrs.join(self.v));
});

Sk.builtin.str.prototype["split"] = new Sk.builtin.func(function (self, on, howmany) {
    var splits;
    var index;
    var match;
    var result;
    var s;
    var str;
    var regex;
    Sk.builtin.pyCheckArgs("split", arguments, 1, 3);
    if ((on === undefined) || (on instanceof Sk.builtin.none)) {
        on = null;
    }
    if ((on !== null) && !Sk.builtin.checkString(on)) {
        throw new Sk.builtin.TypeError("expected a string");
    }
    if ((on !== null) && on.v === "") {
        throw new Sk.builtin.ValueError("empty separator");
    }
    if ((howmany !== undefined) && !Sk.builtin.checkInt(howmany)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }

    howmany = Sk.builtin.asnum$(howmany);
    regex = /[\s]+/g;
    str = self.v;
    if (on === null) {
        str = goog.string.trimLeft(str);
    } else {
        // Escape special characters in "on" so we can use a regexp
        s = on.v.replace(/([.*+?=|\\\/()\[\]\{\}^$])/g, "\\$1");
        regex = new RegExp(s, "g");
    }

    // This is almost identical to re.split,
    // except how the regexp is constructed

    result = [];
    index = 0;
    splits = 0;
    while ((match = regex.exec(str)) != null) {
        if (match.index === regex.lastIndex) {
            // empty match
            break;
        }
        result.push(new Sk.builtin.str(str.substring(index, match.index)));
        index = regex.lastIndex;
        splits += 1;
        if (howmany && (splits >= howmany)) {
            break;
        }
    }
    str = str.substring(index);
    if (on !== null || (str.length > 0)) {
        result.push(new Sk.builtin.str(str));
    }

    return new Sk.builtin.list(result);
});

Sk.builtin.str.prototype["strip"] = new Sk.builtin.func(function (self, chars) {
    var regex;
    var pattern;
    Sk.builtin.pyCheckArgs("strip", arguments, 1, 2);
    if ((chars !== undefined) && !Sk.builtin.checkString(chars)) {
        throw new Sk.builtin.TypeError("strip arg must be None or str");
    }
    if (chars === undefined) {
        pattern = /^\s+|\s+$/g;
    } else {
        regex = Sk.builtin.str.re_escape_(chars.v);
        pattern = new RegExp("^[" + regex + "]+|[" + regex + "]+$", "g");
    }
    return new Sk.builtin.str(self.v.replace(pattern, ""));
});

Sk.builtin.str.prototype["lstrip"] = new Sk.builtin.func(function (self, chars) {
    var regex;
    var pattern;
    Sk.builtin.pyCheckArgs("lstrip", arguments, 1, 2);
    if ((chars !== undefined) && !Sk.builtin.checkString(chars)) {
        throw new Sk.builtin.TypeError("lstrip arg must be None or str");
    }
    if (chars === undefined) {
        pattern = /^\s+/g;
    } else {
        regex = Sk.builtin.str.re_escape_(chars.v);
        pattern = new RegExp("^[" + regex + "]+", "g");
    }
    return new Sk.builtin.str(self.v.replace(pattern, ""));
});

Sk.builtin.str.prototype["rstrip"] = new Sk.builtin.func(function (self, chars) {
    var regex;
    var pattern;
    Sk.builtin.pyCheckArgs("rstrip", arguments, 1, 2);
    if ((chars !== undefined) && !Sk.builtin.checkString(chars)) {
        throw new Sk.builtin.TypeError("rstrip arg must be None or str");
    }
    if (chars === undefined) {
        pattern = /\s+$/g;
    } else {
        regex = Sk.builtin.str.re_escape_(chars.v);
        pattern = new RegExp("[" + regex + "]+$", "g");
    }
    return new Sk.builtin.str(self.v.replace(pattern, ""));
});

Sk.builtin.str.prototype["partition"] = new Sk.builtin.func(function (self, sep) {
    var pos;
    var sepStr;
    Sk.builtin.pyCheckArgs("partition", arguments, 2, 2);
    Sk.builtin.pyCheckType("sep", "string", Sk.builtin.checkString(sep));
    sepStr = new Sk.builtin.str(sep);
    pos = self.v.indexOf(sepStr.v);
    if (pos < 0) {
        return new Sk.builtin.tuple([self, Sk.builtin.str.$emptystr, Sk.builtin.str.$emptystr]);
    }

    return new Sk.builtin.tuple([
        new Sk.builtin.str(self.v.substring(0, pos)),
        sepStr,
        new Sk.builtin.str(self.v.substring(pos + sepStr.v.length))]);
});

Sk.builtin.str.prototype["rpartition"] = new Sk.builtin.func(function (self, sep) {
    var pos;
    var sepStr;
    Sk.builtin.pyCheckArgs("rpartition", arguments, 2, 2);
    Sk.builtin.pyCheckType("sep", "string", Sk.builtin.checkString(sep));
    sepStr = new Sk.builtin.str(sep);
    pos = self.v.lastIndexOf(sepStr.v);
    if (pos < 0) {
        return new Sk.builtin.tuple([Sk.builtin.str.$emptystr, Sk.builtin.str.$emptystr, self]);
    }

    return new Sk.builtin.tuple([
        new Sk.builtin.str(self.v.substring(0, pos)),
        sepStr,
        new Sk.builtin.str(self.v.substring(pos + sepStr.v.length))]);
});

Sk.builtin.str.prototype["count"] = new Sk.builtin.func(function (self, pat, start, end) {
    var normaltext;
    var ctl;
    var slice;
    var m;
    Sk.builtin.pyCheckArgs("count", arguments, 2, 4);
    if (!Sk.builtin.checkString(pat)) {
        throw new Sk.builtin.TypeError("expected a character buffer object");
    }
    if ((start !== undefined) && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }
    if ((end !== undefined) && !Sk.builtin.checkInt(end)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }

    if (start === undefined) {
        start = 0;
    } else {
        start = Sk.builtin.asnum$(start);
        start = start >= 0 ? start : self.v.length + start;
    }

    if (end === undefined) {
        end = self.v.length;
    } else {
        end = Sk.builtin.asnum$(end);
        end = end >= 0 ? end : self.v.length + end;
    }

    normaltext = pat.v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    m = new RegExp(normaltext, "g");
    slice = self.v.slice(start, end);
    ctl = slice.match(m);
    if (!ctl) {
        return  new Sk.builtin.int_(0);
    } else {
        return new Sk.builtin.int_(ctl.length);
    }

});

Sk.builtin.str.prototype["ljust"] = new Sk.builtin.func(function (self, len, fillchar) {
    var newstr;
    Sk.builtin.pyCheckArgs("ljust", arguments, 2, 3);
    if (!Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepcted, got " + Sk.abstr.typeName(len));
    }
    if ((fillchar !== undefined) && (!Sk.builtin.checkString(fillchar) || fillchar.v.length !== 1)) {
        throw new Sk.builtin.TypeError("must be char, not " + Sk.abstr.typeName(fillchar));
    }
    if (fillchar === undefined) {
        fillchar = " ";
    } else {
        fillchar = fillchar.v;
    }
    len = Sk.builtin.asnum$(len);
    if (self.v.length >= len) {
        return self;
    } else {
        newstr = Array.prototype.join.call({length: Math.floor(len - self.v.length) + 1}, fillchar);
        return new Sk.builtin.str(self.v + newstr);
    }
});

Sk.builtin.str.prototype["rjust"] = new Sk.builtin.func(function (self, len, fillchar) {
    var newstr;
    Sk.builtin.pyCheckArgs("rjust", arguments, 2, 3);
    if (!Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepcted, got " + Sk.abstr.typeName(len));
    }
    if ((fillchar !== undefined) && (!Sk.builtin.checkString(fillchar) || fillchar.v.length !== 1)) {
        throw new Sk.builtin.TypeError("must be char, not " + Sk.abstr.typeName(fillchar));
    }
    if (fillchar === undefined) {
        fillchar = " ";
    } else {
        fillchar = fillchar.v;
    }
    len = Sk.builtin.asnum$(len);
    if (self.v.length >= len) {
        return self;
    } else {
        newstr = Array.prototype.join.call({length: Math.floor(len - self.v.length) + 1}, fillchar);
        return new Sk.builtin.str(newstr + self.v);
    }

});

Sk.builtin.str.prototype["center"] = new Sk.builtin.func(function (self, len, fillchar) {
    var newstr;
    var newstr1;
    Sk.builtin.pyCheckArgs("center", arguments, 2, 3);
    if (!Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepcted, got " + Sk.abstr.typeName(len));
    }
    if ((fillchar !== undefined) && (!Sk.builtin.checkString(fillchar) || fillchar.v.length !== 1)) {
        throw new Sk.builtin.TypeError("must be char, not " + Sk.abstr.typeName(fillchar));
    }
    if (fillchar === undefined) {
        fillchar = " ";
    } else {
        fillchar = fillchar.v;
    }
    len = Sk.builtin.asnum$(len);
    if (self.v.length >= len) {
        return self;
    } else {
        newstr1 = Array.prototype.join.call({length: Math.floor((len - self.v.length) / 2) + 1}, fillchar);
        newstr = newstr1 + self.v + newstr1;
        if (newstr.length < len) {
            newstr = newstr + fillchar;
        }
        return new Sk.builtin.str(newstr);
    }

});

Sk.builtin.str.prototype["find"] = new Sk.builtin.func(function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgs("find", arguments, 2, 4);
    if (!Sk.builtin.checkString(tgt)) {
        throw new Sk.builtin.TypeError("expected a character buffer object");
    }
    if ((start !== undefined) && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }
    if ((end !== undefined) && !Sk.builtin.checkInt(end)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }

    if (start === undefined) {
        start = 0;
    } else {
        start = Sk.builtin.asnum$(start);
        start = start >= 0 ? start : self.v.length + start;
    }

    if (end === undefined) {
        end = self.v.length;
    } else {
        end = Sk.builtin.asnum$(end);
        end = end >= 0 ? end : self.v.length + end;
    }

    idx = self.v.indexOf(tgt.v, start);
    idx = ((idx >= start) && (idx < end)) ? idx : -1;

    return new Sk.builtin.int_(idx);
});

Sk.builtin.str.prototype["index"] = new Sk.builtin.func(function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgs("index", arguments, 2, 4);
    idx = Sk.misceval.callsim(self["find"], self, tgt, start, end);
    if (Sk.builtin.asnum$(idx) === -1) {
        throw new Sk.builtin.ValueError("substring not found");
    }
    return idx;
});

Sk.builtin.str.prototype["rfind"] = new Sk.builtin.func(function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgs("rfind", arguments, 2, 4);
    if (!Sk.builtin.checkString(tgt)) {
        throw new Sk.builtin.TypeError("expected a character buffer object");
    }
    if ((start !== undefined) && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }
    if ((end !== undefined) && !Sk.builtin.checkInt(end)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }

    if (start === undefined) {
        start = 0;
    } else {
        start = Sk.builtin.asnum$(start);
        start = start >= 0 ? start : self.v.length + start;
    }

    if (end === undefined) {
        end = self.v.length;
    } else {
        end = Sk.builtin.asnum$(end);
        end = end >= 0 ? end : self.v.length + end;
    }

    idx = self.v.lastIndexOf(tgt.v, end);
    idx = (idx !== end) ? idx : self.v.lastIndexOf(tgt.v, end - 1);
    idx = ((idx >= start) && (idx < end)) ? idx : -1;

    return new Sk.builtin.int_(idx);
});

Sk.builtin.str.prototype["rindex"] = new Sk.builtin.func(function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgs("rindex", arguments, 2, 4);
    idx = Sk.misceval.callsim(self["rfind"], self, tgt, start, end);
    if (Sk.builtin.asnum$(idx) === -1) {
        throw new Sk.builtin.ValueError("substring not found");
    }
    return idx;
});

Sk.builtin.str.prototype["startswith"] = new Sk.builtin.func(function (self, tgt) {
    Sk.builtin.pyCheckArgs("startswith", arguments, 2, 2);
    Sk.builtin.pyCheckType("tgt", "string", Sk.builtin.checkString(tgt));
    return new Sk.builtin.bool( self.v.indexOf(tgt.v) === 0);
});

// http://stackoverflow.com/questions/280634/endswith-in-javascript
Sk.builtin.str.prototype["endswith"] = new Sk.builtin.func(function (self, tgt) {
    Sk.builtin.pyCheckArgs("endswith", arguments, 2, 2);
    Sk.builtin.pyCheckType("tgt", "string", Sk.builtin.checkString(tgt));
    return new Sk.builtin.bool( self.v.indexOf(tgt.v, self.v.length - tgt.v.length) !== -1);
});

Sk.builtin.str.prototype["replace"] = new Sk.builtin.func(function (self, oldS, newS, count) {
    var c;
    var patt;
    Sk.builtin.pyCheckArgs("replace", arguments, 3, 4);
    Sk.builtin.pyCheckType("oldS", "string", Sk.builtin.checkString(oldS));
    Sk.builtin.pyCheckType("newS", "string", Sk.builtin.checkString(newS));
    if ((count !== undefined) && !Sk.builtin.checkInt(count)) {
        throw new Sk.builtin.TypeError("integer argument expected, got " +
            Sk.abstr.typeName(count));
    }
    count = Sk.builtin.asnum$(count);
    patt = new RegExp(Sk.builtin.str.re_escape_(oldS.v), "g");

    if ((count === undefined) || (count < 0)) {
        return new Sk.builtin.str(self.v.replace(patt, newS.v));
    }

    c = 0;

    function replacer (match) {
        c++;
        if (c <= count) {
            return newS.v;
        }
        return match;
    }

    return new Sk.builtin.str(self.v.replace(patt, replacer));
});

Sk.builtin.str.prototype["zfill"] = new Sk.builtin.func(function (self, len) {
    var str = self.v;
    var ret;
    var zeroes;
    var offset;
    var pad = "";

    Sk.builtin.pyCheckArgs("zfill", arguments, 2, 2);
    if (! Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepected, got " + Sk.abstr.typeName(len));
    }

    // figure out how many zeroes are needed to make the proper length
    zeroes = len.v - str.length;
    // offset by 1 if there is a +/- at the beginning of the string
    offset = (str[0] === "+" || str[0] === "-") ? 1 : 0;
    for(var i = 0; i < zeroes; i++){
        pad += "0";
    }
    // combine the string and the zeroes
    ret = str.substr(0, offset) + pad + str.substr(offset);
    return new Sk.builtin.str(ret);


});

Sk.builtin.str.prototype["isdigit"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isdigit", arguments, 1, 1);
    return new Sk.builtin.bool( /^\d+$/.test(self.v));
});

Sk.builtin.str.prototype["isspace"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isspace", arguments, 1, 1);
    return new Sk.builtin.bool( /^\s+$/.test(self.v));
});


Sk.builtin.str.prototype["expandtabs"] = new Sk.builtin.func(function (self, tabsize) {
    // var input = self.v;
    // var expanded = "";
    // var split;
    // var spacestr = "";
    // var spacerem;


    var spaces;
    var expanded;

    Sk.builtin.pyCheckArgs("expandtabs", arguments, 1, 2);


    if ((tabsize !== undefined) && ! Sk.builtin.checkInt(tabsize)) {
        throw new Sk.builtin.TypeError("integer argument exepected, got " + Sk.abstr.typeName(tabsize));
    }
    if (tabsize === undefined) {
        tabsize = 8;
    } else {
        tabsize = Sk.builtin.asnum$(tabsize);
    }

    spaces = (new Array(tabsize + 1)).join(" ");
    expanded = self.v.replace(/([^\r\n\t]*)\t/g, function(a, b) {
        return b + spaces.slice(b.length % tabsize);
    });
    return new Sk.builtin.str(expanded);
});

Sk.builtin.str.prototype["swapcase"] = new Sk.builtin.func(function (self) {
    var ret;
    Sk.builtin.pyCheckArgs("swapcase", arguments, 1, 1);


    ret = self.v.replace(/[a-z]/gi, function(c) {
        var lc = c.toLowerCase();
        return lc === c ? c.toUpperCase() : lc;
    });

    return new Sk.builtin.str(ret);
});

Sk.builtin.str.prototype["splitlines"] = new Sk.builtin.func(function (self, keepends) {
    var data = self.v;
    var i = 0;
    var j = i;
    var selflen = self.v.length;
    var strs_w = [];
    var ch;
    var eol;
    var sol = 0;
    var slice;
    Sk.builtin.pyCheckArgs("splitlines", arguments, 1, 2);
    if ((keepends !== undefined) && ! Sk.builtin.checkBool(keepends)) {
        throw new Sk.builtin.TypeError("boolean argument expected, got " + Sk.abstr.typeName(keepends));
    }
    if (keepends === undefined) {
        keepends = false;
    } else {
        keepends = keepends.v;
    }


    for (i = 0; i < selflen; i ++) {
        ch = data.charAt(i);
        if (data.charAt(i + 1) === "\n" && ch === "\r") {
            eol = i + 2;
            slice = data.slice(sol, eol);
            if (! keepends) {
                slice = slice.replace(/(\r|\n)/g, "");
            }
            strs_w.push(new Sk.builtin.str(slice));
            sol = eol;
        } else if ((ch === "\n" && data.charAt(i - 1) !== "\r") || ch === "\r") {
            eol = i + 1;
            slice = data.slice(sol, eol);
            if (! keepends) {
                slice = slice.replace(/(\r|\n)/g, "");
            }
            strs_w.push(new Sk.builtin.str(slice));
            sol = eol;
        }

    }
    if (sol < selflen) {
        eol = selflen;
        slice = data.slice(sol, eol);
        if (! keepends) {
            slice = slice.replace(/(\r|\n)/g, "");
        }
        strs_w.push(new Sk.builtin.str(slice));
    }
    return new Sk.builtin.list(strs_w);
});

Sk.builtin.str.prototype["title"] = new Sk.builtin.func(function (self) {
    var ret;

    Sk.builtin.pyCheckArgs("title", arguments, 1, 1);

    ret = self.v.replace(/[a-z][a-z]*/gi, function(str) {
        return str[0].toUpperCase() + str.substr(1).toLowerCase();
    });

    return new Sk.builtin.str(ret);
});

Sk.builtin.str.prototype["isalpha"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isalpha", arguments, 1, 1);
    return new Sk.builtin.bool( self.v.length && goog.string.isAlpha(self.v));
});

Sk.builtin.str.prototype["isalnum"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isalnum", arguments, 1, 1);
    return new Sk.builtin.bool( self.v.length && goog.string.isAlphaNumeric(self.v));
});

// does not account for unicode numeric values
Sk.builtin.str.prototype["isnumeric"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isnumeric", arguments, 1, 1);
    return new Sk.builtin.bool( self.v.length && goog.string.isNumeric(self.v));
});

Sk.builtin.str.prototype["islower"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("islower", arguments, 1, 1);
    return new Sk.builtin.bool( self.v.length && /[a-z]/.test(self.v) && !/[A-Z]/.test(self.v));
});

Sk.builtin.str.prototype["isupper"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("isupper", arguments, 1, 1);
    return new Sk.builtin.bool( self.v.length && !/[a-z]/.test(self.v) && /[A-Z]/.test(self.v));
});

Sk.builtin.str.prototype["istitle"] = new Sk.builtin.func(function (self) {
    // Comparing to str.title() seems the most intuitive thing, but it fails on "",
    // Other empty-ish strings with no change.
    var input = self.v;
    var cased = false;
    var previous_is_cased = false;
    var pos;
    var ch;
    Sk.builtin.pyCheckArgs("istitle", arguments, 1, 1);
    for (pos = 0; pos < input.length; pos ++) {
        ch = input.charAt(pos);
        if (! /[a-z]/.test(ch) && /[A-Z]/.test(ch)) {
            if (previous_is_cased) {
                return new Sk.builtin.bool( false);
            }
            previous_is_cased = true;
            cased = true;
        } else if (/[a-z]/.test(ch) && ! /[A-Z]/.test(ch)) {
            if (! previous_is_cased) {
                return new Sk.builtin.bool( false);
            }
            cased = true;
        } else {
            previous_is_cased = false;
        }
    }
    return new Sk.builtin.bool( cased);
});

Sk.builtin.str.prototype.nb$remainder = function (rhs) {
    // % format op. rhs can be a value, a tuple, or something with __getitem__ (dict)

    // From http://docs.python.org/library/stdtypes.html#string-formatting the
    // format looks like:
    // 1. The '%' character, which marks the start of the specifier.
    // 2. Mapping key (optional), consisting of a parenthesised sequence of characters (for example, (somename)).
    // 3. Conversion flags (optional), which affect the result of some conversion types.
    // 4. Minimum field width (optional). If specified as an '*' (asterisk), the actual width is read from the next
    // element of the tuple in values, and the object to convert comes after the minimum field width and optional
    // precision. 5. Precision (optional), given as a '.' (dot) followed by the precision. If specified as '*' (an
    // asterisk), the actual width is read from the next element of the tuple in values, and the value to convert comes
    // after the precision. 6. Length modifier (optional). 7. Conversion type.  length modifier is ignored

    var ret;
    var replFunc;
    var index;
    var regex;
    if (rhs.constructor !== Sk.builtin.tuple && (rhs.mp$subscript === undefined || rhs.constructor === Sk.builtin.str)) {
        rhs = new Sk.builtin.tuple([rhs]);
    }

    // general approach is to use a regex that matches the format above, and
    // do an re.sub with a function as replacement to make the subs.

    //           1 2222222222222222   33333333   444444444   5555555555555  66666  777777777777777777
    regex = /%(\([a-zA-Z0-9]+\))?([#0 +\-]+)?(\*|[0-9]+)?(\.(\*|[0-9]+))?[hlL]?([diouxXeEfFgGcrs%])/g;
    index = 0;
    replFunc = function (substring, mappingKey, conversionFlags, fieldWidth, precision, precbody, conversionType) {
        var result;
        var convName;
        var convValue;
        var base;
        var r;
        var mk;
        var value;
        var handleWidth;
        var formatNumber;
        var alternateForm;
        var precedeWithSign;
        var blankBeforePositive;
        var leftAdjust;
        var zeroPad;
        var i;
        fieldWidth = Sk.builtin.asnum$(fieldWidth);
        precision = Sk.builtin.asnum$(precision);

        if (mappingKey === undefined || mappingKey === "") {
            i = index++;
        } // ff passes '' not undef for some reason

        if (precision === "") { // ff passes '' here aswell causing problems with G,g, etc.
            precision = undefined;
        }

        zeroPad = false;
        leftAdjust = false;
        blankBeforePositive = false;
        precedeWithSign = false;
        alternateForm = false;
        if (conversionFlags) {
            if (conversionFlags.indexOf("-") !== -1) {
                leftAdjust = true;
            } else if (conversionFlags.indexOf("0") !== -1) {
                zeroPad = true;
            }

            if (conversionFlags.indexOf("+") !== -1) {
                precedeWithSign = true;
            } else if (conversionFlags.indexOf(" ") !== -1) {
                blankBeforePositive = true;
            }

            alternateForm = conversionFlags.indexOf("#") !== -1;
        }

        if (precision) {
            precision = parseInt(precision.substr(1), 10);
        }

        formatNumber = function (n, base) {
            var precZeroPadded;
            var prefix;
            var didSign;
            var neg;
            var r;
            var j;
            base = Sk.builtin.asnum$(base);
            neg = false;
            didSign = false;
            if (typeof n === "number") {
                if (n < 0) {
                    n = -n;
                    neg = true;
                }
                r = n.toString(base);
            } else if (n instanceof Sk.builtin.float_) {
                r = n.str$(base, false);
                if (r.length > 2 && r.substr(-2) === ".0") {
                    r = r.substr(0, r.length - 2);
                }
                neg = n.nb$isnegative();
            } else if (n instanceof Sk.builtin.int_) {
                r = n.str$(base, false);
                neg = n.nb$isnegative();
            } else if (n instanceof Sk.builtin.lng) {
                r = n.str$(base, false);
                neg = n.nb$isnegative();	//	neg = n.size$ < 0;	RNL long.js change
            }

            goog.asserts.assert(r !== undefined, "unhandled number format");

            precZeroPadded = false;

            if (precision) {
                //print("r.length",r.length,"precision",precision);
                for (j = r.length; j < precision; ++j) {
                    r = "0" + r;
                    precZeroPadded = true;
                }
            }

            prefix = "";

            if (neg) {
                prefix = "-";
            } else if (precedeWithSign) {
                prefix = "+" + prefix;
            } else if (blankBeforePositive) {
                prefix = " " + prefix;
            }

            if (alternateForm) {
                if (base === 16) {
                    prefix += "0x";
                } else if (base === 8 && !precZeroPadded && r !== "0") {
                    prefix += "0";
                }
            }

            return [prefix, r];
        };

        handleWidth = function (args) {
            var totLen;
            var prefix = args[0];
            var r = args[1];
            var j;
            if (fieldWidth) {
                fieldWidth = parseInt(fieldWidth, 10);
                totLen = r.length + prefix.length;
                if (zeroPad) {
                    for (j = totLen; j < fieldWidth; ++j) {
                        r = "0" + r;
                    }
                } else if (leftAdjust) {
                    for (j = totLen; j < fieldWidth; ++j) {
                        r = r + " ";
                    }
                } else {
                    for (j = totLen; j < fieldWidth; ++j) {
                        prefix = " " + prefix;
                    }
                }
            }
            return prefix + r;
        };

        //print("Rhs:",rhs, "ctor", rhs.constructor);
        if (rhs.constructor === Sk.builtin.tuple) {
            value = rhs.v[i];
        } else if (rhs.mp$subscript !== undefined && mappingKey !== undefined) {
            mk = mappingKey.substring(1, mappingKey.length - 1);
            //print("mk",mk);
            value = rhs.mp$subscript(new Sk.builtin.str(mk));
        } else if (rhs.constructor === Sk.builtin.dict || rhs.constructor === Sk.builtin.list) {
            // new case where only one argument is provided
            value = rhs;
        } else {
            throw new Sk.builtin.AttributeError(rhs.tp$name + " instance has no attribute 'mp$subscript'");
        }
        base = 10;
        if (conversionType === "d" || conversionType === "i") {
            return handleWidth(formatNumber(value, 10));
        } else if (conversionType === "o") {
            return handleWidth(formatNumber(value, 8));
        } else if (conversionType === "x") {
            return handleWidth(formatNumber(value, 16));
        } else if (conversionType === "X") {
            return handleWidth(formatNumber(value, 16)).toUpperCase();
        } else if (conversionType === "f" || conversionType === "F" || conversionType === "e" || conversionType === "E" || conversionType === "g" || conversionType === "G") {
            convValue = Sk.builtin.asnum$(value);
            if (typeof convValue === "string") {
                convValue = Number(convValue);
            }
            if (convValue === Infinity) {
                return "inf";
            }
            if (convValue === -Infinity) {
                return "-inf";
            }
            if (isNaN(convValue)) {
                return "nan";
            }
            convName = ["toExponential", "toFixed", "toPrecision"]["efg".indexOf(conversionType.toLowerCase())];
            if (precision === undefined || precision === "") {
                if (conversionType === "e" || conversionType === "E") {
                    precision = 6;
                } else if (conversionType === "f" || conversionType === "F") {
                    precision = 7;
                }
            }
            result = (convValue)[convName](precision); // possible loose of negative zero sign

            // apply sign to negative zeros, floats only!
            if(Sk.builtin.checkFloat(value)) {
                if(convValue === 0 && 1/convValue === -Infinity) {
                    result = "-" + result; // add sign for zero
                }
            }

            if ("EFG".indexOf(conversionType) !== -1) {
                result = result.toUpperCase();
            }
            return handleWidth(["", result]);
        } else if (conversionType === "c") {
            if (typeof value === "number") {
                return String.fromCharCode(value);
            } else if (value instanceof Sk.builtin.int_) {
                return String.fromCharCode(value.v);
            } else if (value instanceof Sk.builtin.float_) {
                return String.fromCharCode(value.v);
            } else if (value instanceof Sk.builtin.lng) {
                return String.fromCharCode(value.str$(10, false)[0]);
            } else if (value.constructor === Sk.builtin.str) {
                return value.v.substr(0, 1);
            } else {
                throw new Sk.builtin.TypeError("an integer is required");
            }
        } else if (conversionType === "r") {
            r = Sk.builtin.repr(value);
            if (precision) {
                return r.v.substr(0, precision);
            }
            return r.v;
        } else if (conversionType === "s") {
            r = new Sk.builtin.str(value);
            if (precision) {
                return r.v.substr(0, precision);
            }
            if(fieldWidth) {
                r.v = handleWidth([" ", r.v]);
            }
            return r.v;
        } else if (conversionType === "%") {
            return "%";
        }
    };

    ret = this.v.replace(regex, replFunc);
    return new Sk.builtin.str(ret);
};

/**
 * @constructor
 * @param {Object} obj
 */
Sk.builtin.str_iter_ = function (obj) {
    if (!(this instanceof Sk.builtin.str_iter_)) {
        return new Sk.builtin.str_iter_(obj);
    }
    this.$index = 0;
    this.$obj = obj.v.slice();
    this.sq$length = this.$obj.length;
    this.tp$iter = this;
    this.tp$iternext = function () {
        if (this.$index >= this.sq$length) {
            return undefined;
        }
        return new Sk.builtin.str(this.$obj.substr(this.$index++, 1));
    };
    this.$r = function () {
        return new Sk.builtin.str("iterator");
    };
    return this;
};

Sk.abstr.setUpInheritance("iterator", Sk.builtin.str_iter_, Sk.builtin.object);

Sk.builtin.str_iter_.prototype.__class__ = Sk.builtin.str_iter_;

Sk.builtin.str_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("__iter__", arguments, 0, 0, true, false);
    return self;
});

Sk.builtin.str_iter_.prototype["next"] = new Sk.builtin.func(function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
});
