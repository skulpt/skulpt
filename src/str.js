Sk.builtin.interned = Object.create(null); // avoid name conflicts with Object.prototype

function getInterned(x) {
    return Sk.builtin.interned[x];
}

function setInterned(x, pyStr) {
    Sk.builtin.interned[x] = pyStr;
}

/**
 * @constructor
 * @param {*} x
 * @extends Sk.builtin.object
 */
Sk.builtin.str = function (x) {
    // new Sk.builtin.str is an internal function called with a JS value x
    // occasionally called with a python object and returns tp$str() or $r();
    Sk.asserts.assert(this instanceof Sk.builtin.str, "bad call to str - use 'new'");
    // Temporary
    // Sk.asserts.assert(typeof this === "string" || this === undefined || this.sk$object, "str called with an invalid JS object");

    let ret, interned;
    if (typeof x === "string") {
        // the common case
        ret = x;
    } else if (x === undefined) {
        ret = "";
    } else if (x === null) {
        ret = "None";
    } else if (x.tp$str !== undefined) {
        // then we're a python object - all objects inherit from object which has tp$str
        return x.tp$str();
    } else if (x === true) {
        ret = "True";
    } else if (x === false) {
        ret = "False";
    } else if (typeof x === "number") {
        ret = x.toString();
        if (ret === "Infinity") {
            ret = "inf";
        } else if (ret === "-Infinity") {
            ret = "-inf";
        }
    } else {
        throw new Sk.builtin.TypeError("could not convert object of type '" + Sk.abstr.typeName(x) + "' to str");
    }
    interned = getInterned(ret);
    // interning required for strings in py

    if (interned !== undefined) {
        return interned;
    } else {
        setInterned(ret, this);
    }

    this.$mangled = fixReserved(ret);
    // quicker set_dict for strings by preallocating the $savedKeyHash
    this.$savedKeyHash_ = "_" + ret;
    this.v = ret;
};

Sk.exportSymbol("Sk.builtin.str", Sk.builtin.str);
Sk.abstr.setUpInheritance("str", Sk.builtin.str, Sk.builtin.object);

Sk.builtin.str.prototype.tp$as_sequence_or_mapping = true;
// Sk.builtin.str.prototype.tp$as_number = true; // we currently don't support nb$mod

Sk.builtin.str.prototype.tp$doc =
    "str(object='') -> str\nstr(bytes_or_buffer[, encoding[, errors]]) -> str\n\nCreate a new string object from the given object. If encoding or\nerrors is specified, then the object must expose a data buffer\nthat will be decoded using the given encoding and error handler.\nOtherwise, returns the result of object.__str__() (if defined)\nor repr(object).\nencoding defaults to sys.getdefaultencoding().\nerrors defaults to 'strict'.";

Sk.builtin.str.prototype.tp$new = function (args, kwargs) {
    if (this !== Sk.builtin.str.prototype) {
        return this.$subtype_new(args, kwargs);
    }
    args = Sk.abstr.copyKeywordsToNamedArgs("str", ["object"], args, kwargs);
    const x = args[0];
    return new Sk.builtin.str(x);
};

Sk.builtin.str.prototype.$subtype_new = function (args, kwargs) {
    const instance = new this.constructor();
    // we call str new method with all the args and kwargs
    const str_instance = Sk.builtin.str.prototype.tp$new(args, kwargs);
    instance.v = str_instance.v;
    return instance;
};

Sk.builtin.str.prototype.$jsstr = function () {
    return this.v;
};

Sk.builtin.str.prototype.mp$subscript = function (index) {
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
        let ret = "";
        const str = this.v;
        index.sssiter$(str.length, (i) => {
            ret += str.charAt(i);
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
// Sk.builtin.str.prototype.nb$add = Sk.builtin.str.prototype.sq$concat;
// Sk.builtin.str.prototype.nb$inplace_add = Sk.builtin.str.prototype.sq$concat;
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
// Sk.builtin.str.prototype.nb$multiply =
// Sk.builtin.str.prototype.nb$reflected_multiply =
// Sk.builtin.str.prototype.nb$inplace_multiply = Sk.builtin.str.prototype.sq$repeat;
Sk.builtin.str.prototype.sq$item = function () {
    Sk.asserts.fail();
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

Sk.builtin.str.prototype.tp$iter = function () {
    return new Sk.builtin.str_iter_(this);
};

Sk.builtin.str.prototype.tp$richcompare = function (other, op) {
    if (!(other instanceof Sk.builtin.str)) {
        return Sk.builtin.NotImplemented.NotImplemented$;
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
            Sk.asserts.fail();
    }
};

Sk.builtin.str.prototype.$r = function () {
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

Sk.builtin.str.prototype.tp$str = function () {
    if (this.constructor === Sk.builtin.str) {
        return this;
    } else {
        return new Sk.builtin.str(this.v);
    }
};

Sk.builtin.str.$re_escape = function (s) {
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

// methods
Sk.builtin.str.methods = {};

Sk.builtin.str.methods.lower = function (self) {
    Sk.builtin.pyCheckArgsLen("lower", arguments.length, 1, 1);
    return new Sk.builtin.str(self.v.toLowerCase());
};

Sk.builtin.str.methods.upper = function (self) {
    Sk.builtin.pyCheckArgsLen("upper", arguments.length, 1, 1);
    return new Sk.builtin.str(self.v.toUpperCase());
};

Sk.builtin.str.methods.capitalize = function (self) {
    var i;
    var cap;
    var orig;
    Sk.builtin.pyCheckArgsLen("capitalize", arguments.length, 1, 1);
    orig = self.v;

    if (orig.length === 0) {
        return new Sk.builtin.str("");
    }
    cap = orig.charAt(0).toUpperCase();

    for (i = 1; i < orig.length; i++) {
        cap += orig.charAt(i).toLowerCase();
    }
    return new Sk.builtin.str(cap);
};

Sk.builtin.str.methods.join = function (self, seq) {
    var it, i;
    var arrOfStrs;
    Sk.builtin.pyCheckArgsLen("join", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("seq", "iterable", Sk.builtin.checkIterable(seq));
    arrOfStrs = [];
    for (it = seq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (i.constructor !== Sk.builtin.str) {
            throw new Sk.builtin.TypeError("TypeError: sequence item " + arrOfStrs.length + ": expected string, " + typeof i + " found");
        }
        arrOfStrs.push(i.v);
    }
    return new Sk.builtin.str(arrOfStrs.join(self.v));
};

Sk.builtin.str.methods.split = function (self, on, howmany) {
    var splits;
    var index;
    var match;
    var result;
    var s;
    var str;
    var regex;
    Sk.builtin.pyCheckArgsLen("split", arguments.length, 1, 3);
    if (on === undefined || on instanceof Sk.builtin.none) {
        on = null;
    }
    if (on !== null && !Sk.builtin.checkString(on)) {
        throw new Sk.builtin.TypeError("expected a string");
    }
    if (on !== null && on.v === "") {
        throw new Sk.builtin.ValueError("empty separator");
    }
    if (howmany !== undefined && !Sk.builtin.checkInt(howmany)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }

    howmany = Sk.builtin.asnum$(howmany);
    regex = /[\s\xa0]+/g;
    str = self.v;
    if (on === null) {
        // Remove leading whitespace
        str = str.replace(/^[\s\xa0]+/, "");
    } else {
        // Escape special characters in null so we can use a regexp
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
        if (howmany && splits >= howmany) {
            break;
        }
    }
    str = str.substring(index);
    if (on !== null || str.length > 0) {
        result.push(new Sk.builtin.str(str));
    }

    return new Sk.builtin.list(result);
};

Sk.builtin.str.methods.strip = function (self, chars) {
    var regex;
    var pattern;
    Sk.builtin.pyCheckArgsLen("strip", arguments.length, 1, 2);
    if (chars !== undefined && !Sk.builtin.checkString(chars)) {
        throw new Sk.builtin.TypeError("strip arg must be None or str");
    }
    if (chars === undefined) {
        pattern = /^\s+|\s+$/g;
    } else {
        regex = Sk.builtin.str.$re_escape(chars.v);
        pattern = new RegExp("^[" + regex + "]+|[" + regex + "]+$", "g");
    }
    return new Sk.builtin.str(self.v.replace(pattern, ""));
};

Sk.builtin.str.methods.lstrip = function (self, chars) {
    var regex;
    var pattern;
    Sk.builtin.pyCheckArgsLen("lstrip", arguments.length, 1, 2);
    if (chars !== undefined && !Sk.builtin.checkString(chars)) {
        throw new Sk.builtin.TypeError("lstrip arg must be None or str");
    }
    if (chars === undefined) {
        pattern = /^\s+/g;
    } else {
        regex = Sk.builtin.str.$re_escape(chars.v);
        pattern = new RegExp("^[" + regex + "]+", "g");
    }
    return new Sk.builtin.str(self.v.replace(pattern, ""));
};

Sk.builtin.str.methods.rstrip = function (self, chars) {
    var regex;
    var pattern;
    Sk.builtin.pyCheckArgsLen("rstrip", arguments.length, 1, 2);
    if (chars !== undefined && !Sk.builtin.checkString(chars)) {
        throw new Sk.builtin.TypeError("rstrip arg must be None or str");
    }
    if (chars === undefined) {
        pattern = /\s+$/g;
    } else {
        regex = Sk.builtin.str.$re_escape(chars.v);
        pattern = new RegExp("[" + regex + "]+$", "g");
    }
    return new Sk.builtin.str(self.v.replace(pattern, ""));
};

Sk.builtin.str.methods.partition = function (self, sep) {
    var pos;
    var sepStr;
    Sk.builtin.pyCheckArgsLen("partition", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("sep", "string", Sk.builtin.checkString(sep));
    sepStr = new Sk.builtin.str(sep);
    pos = self.v.indexOf(sepStr.v);
    if (pos < 0) {
        return new Sk.builtin.tuple([self, Sk.builtin.str.$emptystr, Sk.builtin.str.$emptystr]);
    }

    return new Sk.builtin.tuple([new Sk.builtin.str(self.v.substring(0, pos)), sepStr, new Sk.builtin.str(self.v.substring(pos + sepStr.v.length))]);
};

Sk.builtin.str.methods.rpartition = function (self, sep) {
    var pos;
    var sepStr;
    Sk.builtin.pyCheckArgsLen("rpartition", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("sep", "string", Sk.builtin.checkString(sep));
    sepStr = new Sk.builtin.str(sep);
    pos = self.v.lastIndexOf(sepStr.v);
    if (pos < 0) {
        return new Sk.builtin.tuple([Sk.builtin.str.$emptystr, Sk.builtin.str.$emptystr, self]);
    }

    return new Sk.builtin.tuple([new Sk.builtin.str(self.v.substring(0, pos)), sepStr, new Sk.builtin.str(self.v.substring(pos + sepStr.v.length))]);
};

Sk.builtin.str.methods.count = function (self, pat, start, end) {
    var normaltext;
    var ctl;
    var slice;
    var m;
    Sk.builtin.pyCheckArgsLen("count", arguments.length, 2, 4);
    if (!Sk.builtin.checkString(pat)) {
        throw new Sk.builtin.TypeError("expected a character buffer object");
    }
    if (start !== undefined && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }
    if (end !== undefined && !Sk.builtin.checkInt(end)) {
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
        return new Sk.builtin.int_(0);
    } else {
        return new Sk.builtin.int_(ctl.length);
    }
};

Sk.builtin.str.methods.ljust = function (self, len, fillchar) {
    var newstr;
    Sk.builtin.pyCheckArgsLen("ljust", arguments.length, 2, 3);
    if (!Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepcted, got " + Sk.abstr.typeName(len));
    }
    if (fillchar !== undefined && (!Sk.builtin.checkString(fillchar) || fillchar.v.length !== 1)) {
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
        newstr = Array.prototype.join.call({ length: Math.floor(len - self.v.length) + 1 }, fillchar);
        return new Sk.builtin.str(self.v + newstr);
    }
};

Sk.builtin.str.methods.rjust = function (self, len, fillchar) {
    var newstr;
    Sk.builtin.pyCheckArgsLen("rjust", arguments.length, 2, 3);
    if (!Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepcted, got " + Sk.abstr.typeName(len));
    }
    if (fillchar !== undefined && (!Sk.builtin.checkString(fillchar) || fillchar.v.length !== 1)) {
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
        newstr = Array.prototype.join.call({ length: Math.floor(len - self.v.length) + 1 }, fillchar);
        return new Sk.builtin.str(newstr + self.v);
    }
};

Sk.builtin.str.methods.center = function (self, len, fillchar) {
    var newstr;
    var newstr1;
    Sk.builtin.pyCheckArgsLen("center", arguments.length, 2, 3);
    if (!Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepcted, got " + Sk.abstr.typeName(len));
    }
    if (fillchar !== undefined && (!Sk.builtin.checkString(fillchar) || fillchar.v.length !== 1)) {
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
        newstr1 = Array.prototype.join.call({ length: Math.floor((len - self.v.length) / 2) + 1 }, fillchar);
        newstr = newstr1 + self.v + newstr1;
        if (newstr.length < len) {
            newstr = newstr + fillchar;
        }
        return new Sk.builtin.str(newstr);
    }
};

Sk.builtin.str.methods.find = function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgsLen("find", arguments.length, 2, 4);
    if (!Sk.builtin.checkString(tgt)) {
        throw new Sk.builtin.TypeError("expected a character buffer object");
    }
    if (start !== undefined && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }
    if (end !== undefined && !Sk.builtin.checkInt(end)) {
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
    idx = idx >= start && idx < end ? idx : -1;

    return new Sk.builtin.int_(idx);
};

Sk.builtin.str.methods.index = function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgsLen("index", arguments.length, 2, 4);
    idx = Sk.misceval.callsimArray(self["find"], [self, tgt, start, end]);
    if (Sk.builtin.asnum$(idx) === -1) {
        throw new Sk.builtin.ValueError("substring not found");
    }
    return idx;
};

Sk.builtin.str.methods.rfind = function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgsLen("rfind", arguments.length, 2, 4);
    if (!Sk.builtin.checkString(tgt)) {
        throw new Sk.builtin.TypeError("expected a character buffer object");
    }
    if (start !== undefined && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    }
    if (end !== undefined && !Sk.builtin.checkInt(end)) {
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
    idx = idx !== end ? idx : self.v.lastIndexOf(tgt.v, end - 1);
    idx = idx >= start && idx < end ? idx : -1;

    return new Sk.builtin.int_(idx);
};

Sk.builtin.str.methods.rindex = function (self, tgt, start, end) {
    var idx;
    Sk.builtin.pyCheckArgsLen("rindex", arguments.length, 2, 4);
    idx = Sk.misceval.callsimArray(self["rfind"], [self, tgt, start, end]);
    if (Sk.builtin.asnum$(idx) === -1) {
        throw new Sk.builtin.ValueError("substring not found");
    }
    return idx;
};

Sk.builtin.str.methods.startswith = function (self, tgt) {
    Sk.builtin.pyCheckArgsLen("startswith", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("tgt", "string", Sk.builtin.checkString(tgt));
    return new Sk.builtin.bool(self.v.indexOf(tgt.v) === 0);
};

// http://stackoverflow.com/questions/280634/endswith-in-javascript
Sk.builtin.str.methods.endswith = function (self, tgt) {
    Sk.builtin.pyCheckArgsLen("endswith", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("tgt", "string", Sk.builtin.checkString(tgt));
    return new Sk.builtin.bool(self.v.indexOf(tgt.v, self.v.length - tgt.v.length) !== -1);
};

Sk.builtin.str.methods.replace = function (self, oldS, newS, count) {
    var c;
    var patt;
    Sk.builtin.pyCheckArgsLen("replace", arguments.length, 3, 4);
    Sk.builtin.pyCheckType("oldS", "string", Sk.builtin.checkString(oldS));
    Sk.builtin.pyCheckType("newS", "string", Sk.builtin.checkString(newS));
    if (count !== undefined && !Sk.builtin.checkInt(count)) {
        throw new Sk.builtin.TypeError("integer argument expected, got " + Sk.abstr.typeName(count));
    }
    count = Sk.builtin.asnum$(count);
    patt = new RegExp(Sk.builtin.str.$re_escape(oldS.v), "g");

    if (count === undefined || count < 0) {
        return new Sk.builtin.str(self.v.replace(patt, newS.v));
    }

    c = 0;

    function replacer(match) {
        c++;
        if (c <= count) {
            return newS.v;
        }
        return match;
    }

    return new Sk.builtin.str(self.v.replace(patt, replacer));
};

Sk.builtin.str.methods.zfill = function (self, len) {
    var str = self.v;
    var ret;
    var zeroes;
    var offset;
    var pad = "";

    Sk.builtin.pyCheckArgsLen("zfill", arguments.length, 2, 2);
    if (!Sk.builtin.checkInt(len)) {
        throw new Sk.builtin.TypeError("integer argument exepected, got " + Sk.abstr.typeName(len));
    }

    // figure out how many zeroes are needed to make the proper length
    zeroes = len.v - str.length;
    // offset by 1 if there is a +/- at the beginning of the string
    offset = str[0] === "+" || str[0] === "-" ? 1 : 0;
    for (var i = 0; i < zeroes; i++) {
        pad += "0";
    }
    // combine the string and the zeroes
    ret = str.substr(0, offset) + pad + str.substr(offset);
    return new Sk.builtin.str(ret);
};

Sk.builtin.str.methods.isdigit = function (self) {
    Sk.builtin.pyCheckArgsLen("isdigit", arguments.length, 1, 1);
    return new Sk.builtin.bool(/^\d+$/.test(self.v));
};

Sk.builtin.str.methods.isspace = function (self) {
    Sk.builtin.pyCheckArgsLen("isspace", arguments.length, 1, 1);
    return new Sk.builtin.bool(/^\s+$/.test(self.v));
};

Sk.builtin.str.methods.expandtabs = function (self, tabsize) {
    // var input = self.v;
    // var expanded = "";
    // var split;
    // var spacestr = "";
    // var spacerem;

    var spaces;
    var expanded;

    Sk.builtin.pyCheckArgsLen("expandtabs", arguments.length, 1, 2);

    if (tabsize !== undefined && !Sk.builtin.checkInt(tabsize)) {
        throw new Sk.builtin.TypeError("integer argument exepected, got " + Sk.abstr.typeName(tabsize));
    }
    if (tabsize === undefined) {
        tabsize = 8;
    } else {
        tabsize = Sk.builtin.asnum$(tabsize);
    }

    spaces = new Array(tabsize + 1).join(" ");
    expanded = self.v.replace(/([^\r\n\t]*)\t/g, function (a, b) {
        return b + spaces.slice(b.length % tabsize);
    });
    return new Sk.builtin.str(expanded);
};

Sk.builtin.str.methods.swapcase = function (self) {
    var ret;
    Sk.builtin.pyCheckArgsLen("swapcase", arguments.length, 1, 1);

    ret = self.v.replace(/[a-z]/gi, function (c) {
        var lc = c.toLowerCase();
        return lc === c ? c.toUpperCase() : lc;
    });

    return new Sk.builtin.str(ret);
};

Sk.builtin.str.methods.splitlines = function (self, keepends) {
    var data = self.v;
    var i = 0;
    var j = i;
    var selflen = self.v.length;
    var strs_w = [];
    var ch;
    var eol;
    var sol = 0;
    var slice;
    Sk.builtin.pyCheckArgsLen("splitlines", arguments.length, 1, 2);
    if (keepends !== undefined && !Sk.builtin.checkBool(keepends)) {
        throw new Sk.builtin.TypeError("boolean argument expected, got " + Sk.abstr.typeName(keepends));
    }
    if (keepends === undefined) {
        keepends = false;
    } else {
        keepends = keepends.v;
    }

    for (i = 0; i < selflen; i++) {
        ch = data.charAt(i);
        if (data.charAt(i + 1) === "\n" && ch === "\r") {
            eol = i + 2;
            slice = data.slice(sol, eol);
            if (!keepends) {
                slice = slice.replace(/(\r|\n)/g, "");
            }
            strs_w.push(new Sk.builtin.str(slice));
            sol = eol;
        } else if ((ch === "\n" && data.charAt(i - 1) !== "\r") || ch === "\r") {
            eol = i + 1;
            slice = data.slice(sol, eol);
            if (!keepends) {
                slice = slice.replace(/(\r|\n)/g, "");
            }
            strs_w.push(new Sk.builtin.str(slice));
            sol = eol;
        }
    }
    if (sol < selflen) {
        eol = selflen;
        slice = data.slice(sol, eol);
        if (!keepends) {
            slice = slice.replace(/(\r|\n)/g, "");
        }
        strs_w.push(new Sk.builtin.str(slice));
    }
    return new Sk.builtin.list(strs_w);
};

Sk.builtin.str.methods.title = function (self) {
    var ret;

    Sk.builtin.pyCheckArgsLen("title", arguments.length, 1, 1);

    ret = self.v.replace(/[a-z][a-z]*/gi, function (str) {
        return str[0].toUpperCase() + str.substr(1).toLowerCase();
    });

    return new Sk.builtin.str(ret);
};

Sk.builtin.str.methods.isalpha = function (self) {
    Sk.builtin.pyCheckArgsLen("isalpha", arguments.length, 1, 1);
    return new Sk.builtin.bool(self.v.length && !/[^a-zA-Z]/.test(self.v));
};

Sk.builtin.str.methods.isalnum = function (self) {
    Sk.builtin.pyCheckArgsLen("isalnum", arguments.length, 1, 1);
    return new Sk.builtin.bool(self.v.length && !/[^a-zA-Z0-9]/.test(self.v));
};

// does not account for unicode numeric values
Sk.builtin.str.methods.isnumeric = function (self) {
    Sk.builtin.pyCheckArgsLen("isnumeric", arguments.length, 1, 1);
    return new Sk.builtin.bool(self.v.length && !/[^0-9]/.test(self.v));
};

Sk.builtin.str.methods.islower = function (self) {
    Sk.builtin.pyCheckArgsLen("islower", arguments.length, 1, 1);
    return new Sk.builtin.bool(self.v.length && /[a-z]/.test(self.v) && !/[A-Z]/.test(self.v));
};

Sk.builtin.str.methods.isupper = function (self) {
    Sk.builtin.pyCheckArgsLen("isupper", arguments.length, 1, 1);
    return new Sk.builtin.bool(self.v.length && !/[a-z]/.test(self.v) && /[A-Z]/.test(self.v));
};

Sk.builtin.str.methods.istitle = function (self) {
    // Comparing to str.title() seems the most intuitive thing, but it fails on "",
    // Other empty-ish strings with no change.
    var input = self.v;
    var cased = false;
    var previous_is_cased = false;
    var pos;
    var ch;
    Sk.builtin.pyCheckArgsLen("istitle", arguments.length, 1, 1);
    for (pos = 0; pos < input.length; pos++) {
        ch = input.charAt(pos);
        if (!/[a-z]/.test(ch) && /[A-Z]/.test(ch)) {
            if (previous_is_cased) {
                return new Sk.builtin.bool(false);
            }
            previous_is_cased = true;
            cased = true;
        } else if (/[a-z]/.test(ch) && !/[A-Z]/.test(ch)) {
            if (!previous_is_cased) {
                return new Sk.builtin.bool(false);
            }
            cased = true;
        } else {
            previous_is_cased = false;
        }
    }
    return new Sk.builtin.bool(cased);
};

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
    var val;

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

        if ((mappingKey === undefined || mappingKey === "") && conversionType != "%") {
            i = index++;
        } // ff passes '' not undef for some reason

        if (precision === "") {
            // ff passes '' here aswell causing problems with G,g, etc.
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
                neg = n.nb$isnegative();
            }

            Sk.asserts.assert(r !== undefined, "unhandled number format");

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
        } else if (
            conversionType === "f" ||
            conversionType === "F" ||
            conversionType === "e" ||
            conversionType === "E" ||
            conversionType === "g" ||
            conversionType === "G"
        ) {
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
                    if (Sk.__future__.python3) {
                        precision = 6;
                    } else {
                        precision = 7;
                    }
                }
            }
            result = convValue[convName](precision); // possible loose of negative zero sign

            // apply sign to negative zeros, floats only!
            if (Sk.builtin.checkFloat(value)) {
                if (convValue === 0 && 1 / convValue === -Infinity) {
                    result = "-" + result; // add sign for zero
                }
            }
            if (Sk.__future__.python3) {
                if (result.length >= 7 && result.slice(0, 6) == "0.0000") {
                    val = parseFloat(result);
                    result = val.toExponential();
                }
                if (result.charAt(result.length - 2) == "-") {
                    result = result.slice(0, result.length - 1) + "0" + result.charAt(result.length - 1);
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
            r = r.$jsstr();
            if (precision) {
                return r.substr(0, precision);
            }
            if (fieldWidth) {
                r = handleWidth([" ", r]);
            }
            return r;
        } else if (conversionType === "%") {
            return "%";
        }
    };
    ret = this.v.replace(regex, replFunc);
    return new Sk.builtin.str(ret);
};

Sk.builtin.str.prototype.tp$methods = {
    // encode: {
    //     $meth: Sk.builtin.str.methods.encode,
    //     $flags:{},
    //     $textsig: "($self, /, encoding='utf-8', errors='strict')",
    //     $doc: "Encode the string using the codec registered for encoding.\n\n  encoding\n    The encoding in which to encode the string.\n  errors\n    The error handling scheme to use for encoding errors.\n    The default is 'strict' meaning that encoding errors raise a\n    UnicodeEncodeError.  Other possible values are 'ignore', 'replace' and\n    'xmlcharrefreplace' as well as any other name registered with\n    codecs.register_error that can handle UnicodeEncodeErrors." },
    replace: {
        $meth: Sk.builtin.str.methods.replace,
        $flags: {},
        $textsig: "($self, old, new, count=-1, /)",
        $doc:
            "Return a copy with all occurrences of substring old replaced by new.\n\n  count\n    Maximum number of occurrences to replace.\n    -1 (the default value) means replace all occurrences.\n\nIf the optional argument count is given, only the first count occurrences are\nreplaced.",
    },
    split: {
        $meth: Sk.builtin.str.methods.split,
        $flags: {},
        $textsig: "($self, /, sep=None, maxsplit=-1)",
        $doc:
            "Return a list of the words in the string, using sep as the delimiter string.\n\n  sep\n    The delimiter according which to split the string.\n    None (the default value) means split according to any whitespace,\n    and discard empty strings from the result.\n  maxsplit\n    Maximum number of splits to do.\n    -1 (the default value) means no limit.",
    },
    // rsplit: {
    //     $meth: Sk.builtin.str.methods.rsplit,
    //     $flags:{},
    //     $textsig: "($self, /, sep=None, maxsplit=-1)",
    //     $doc: "Return a list of the words in the string, using sep as the delimiter string.\n\n  sep\n    The delimiter according which to split the string.\n    None (the default value) means split according to any whitespace,\n    and discard empty strings from the result.\n  maxsplit\n    Maximum number of splits to do.\n    -1 (the default value) means no limit.\n\nSplits are done starting at the end of the string and working to the front." },
    join: {
        $meth: Sk.builtin.str.methods.join,
        $flags: {},
        $textsig: "($self, iterable, /)",
        $doc:
            "Concatenate any number of strings.\n\nThe string whose method is called is inserted in between each given string.\nThe result is returned as a new string.\n\nExample: '.'.join(['ab', 'pq', 'rs']) -> 'ab.pq.rs'",
    },
    capitalize: {
        $meth: Sk.builtin.str.methods.capitalize,
        $flags: {},
        $textsig: "($self, /)",
        $doc: "Return a capitalized version of the string.\n\nMore specifically, make the first character have upper case and the rest lower\ncase.",
    },
    // casefold: {
    //     $meth: Sk.builtin.str.methods.casefold,
    //     $flags:{},
    //     $textsig: "($self, /)",
    //     $doc: "Return a version of the string suitable for caseless comparisons." },
    title: {
        $meth: Sk.builtin.str.methods.title,
        $flags: {},
        $textsig: "($self, /)",
        $doc:
            "Return a version of the string where each word is titlecased.\n\nMore specifically, words start with uppercased characters and all remaining\ncased characters have lower case.",
    },
    center: {
        $meth: Sk.builtin.str.methods.center,
        $flags: {},
        $textsig: "($self, width, fillchar=' ', /)",
        $doc: "Return a centered string of length width.\n\nPadding is done using the specified fill character (default is a space).",
    },
    count: {
        $meth: Sk.builtin.str.methods.count,
        $flags: {},
        $textsig: null,
        $doc:
            "S.count(sub[, start[, end]]) -> int\n\nReturn the number of non-overlapping occurrences of substring sub in\nstring S[start:end].  Optional arguments start and end are\ninterpreted as in slice notation.",
    },
    expandtabs: {
        $meth: Sk.builtin.str.methods.expandtabs,
        $flags: {},
        $textsig: "($self, /, tabsize=8)",
        $doc: "Return a copy where all tab characters are expanded using spaces.\n\nIf tabsize is not given, a tab size of 8 characters is assumed.",
    },
    find: {
        $meth: Sk.builtin.str.methods.find,
        $flags: {},
        $textsig: null,
        $doc:
            "S.find(sub[, start[, end]]) -> int\n\nReturn the lowest index in S where substring sub is found,\nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nReturn -1 on failure.",
    },
    partition: {
        $meth: Sk.builtin.str.methods.partition,
        $flags: {},
        $textsig: "($self, sep, /)",
        $doc:
            "Partition the string into three parts using the given separator.\n\nThis will search for the separator in the string.  If the separator is found,\nreturns a 3-tuple containing the part before the separator, the separator\nitself, and the part after it.\n\nIf the separator is not found, returns a 3-tuple containing the original string\nand two empty strings.",
    },
    index: {
        $meth: Sk.builtin.str.methods.index,
        $flags: {},
        $textsig: null,
        $doc:
            "S.index(sub[, start[, end]]) -> int\n\nReturn the lowest index in S where substring sub is found, \nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nRaises ValueError when the substring is not found.",
    },
    ljust: {
        $meth: Sk.builtin.str.methods.ljust,
        $flags: {},
        $textsig: "($self, width, fillchar=' ', /)",
        $doc: "Return a left-justified string of length width.\n\nPadding is done using the specified fill character (default is a space).",
    },
    lower: {
        $meth: Sk.builtin.str.methods.lower,
        $flags: {},
        $textsig: "($self, /)",
        $doc: "Return a copy of the string converted to lowercase.",
    },
    lstrip: {
        $meth: Sk.builtin.str.methods.lstrip,
        $flags: {},
        $textsig: "($self, chars=None, /)",
        $doc: "Return a copy of the string with leading whitespace removed.\n\nIf chars is given and not None, remove characters in chars instead.",
    },
    rfind: {
        $meth: Sk.builtin.str.methods.rfind,
        $flags: {},
        $textsig: null,
        $doc:
            "S.rfind(sub[, start[, end]]) -> int\n\nReturn the highest index in S where substring sub is found,\nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nReturn -1 on failure.",
    },
    rindex: {
        $meth: Sk.builtin.str.methods.rindex,
        $flags: {},
        $textsig: null,
        $doc:
            "S.rindex(sub[, start[, end]]) -> int\n\nReturn the highest index in S where substring sub is found,\nsuch that sub is contained within S[start:end].  Optional\narguments start and end are interpreted as in slice notation.\n\nRaises ValueError when the substring is not found.",
    },
    rjust: {
        $meth: Sk.builtin.str.methods.rjust,
        $flags: {},
        $textsig: "($self, width, fillchar=' ', /)",
        $doc: "Return a right-justified string of length width.\n\nPadding is done using the specified fill character (default is a space).",
    },
    rstrip: {
        $meth: Sk.builtin.str.methods.rstrip,
        $flags: {},
        $textsig: "($self, chars=None, /)",
        $doc: "Return a copy of the string with trailing whitespace removed.\n\nIf chars is given and not None, remove characters in chars instead.",
    },
    rpartition: {
        $meth: Sk.builtin.str.methods.rpartition,
        $flags: {},
        $textsig: "($self, sep, /)",
        $doc:
            "Partition the string into three parts using the given separator.\n\nThis will search for the separator in the string, starting at the end. If\nthe separator is found, returns a 3-tuple containing the part before the\nseparator, the separator itself, and the part after it.\n\nIf the separator is not found, returns a 3-tuple containing two empty strings\nand the original string.",
    },
    splitlines: {
        $meth: Sk.builtin.str.methods.splitlines,
        $flags: {},
        $textsig: "($self, /, keepends=False)",
        $doc:
            "Return a list of the lines in the string, breaking at line boundaries.\n\nLine breaks are not included in the resulting list unless keepends is given and\ntrue.",
    },
    strip: {
        $meth: Sk.builtin.str.methods.strip,
        $flags: {},
        $textsig: "($self, chars=None, /)",
        $doc:
            "Return a copy of the string with leading and trailing whitespace remove.\n\nIf chars is given and not None, remove characters in chars instead.",
    },
    swapcase: {
        $meth: Sk.builtin.str.methods.swapcase,
        $flags: {},
        $textsig: "($self, /)",
        $doc: "Convert uppercase characters to lowercase and lowercase characters to uppercase.",
    },
    // translate: {
    //     $meth: Sk.builtin.str.methods.translate,
    //     $flags: {},
    //     $textsig: "($self, table, /)",
    //     $doc:
    //         "Replace each character in the string using the given translation table.\n\n  table\n    Translation table, which must be a mapping of Unicode ordinals to\n    Unicode ordinals, strings, or None.\n\nThe table must implement lookup/indexing via __getitem__, for instance a\ndictionary or list.  If this operation raises LookupError, the character is\nleft untouched.  Characters mapped to None are deleted.",
    // },
    upper: {
        $meth: Sk.builtin.str.methods.upper,
        $flags: {},
        $textsig: "($self, /)",
        $doc: "Return a copy of the string converted to uppercase.",
    },
    startswith: {
        $meth: Sk.builtin.str.methods.startswith,
        $flags: {},
        $textsig: null,
        $doc:
            "S.startswith(prefix[, start[, end]]) -> bool\n\nReturn True if S starts with the specified prefix, False otherwise.\nWith optional start, test S beginning at that position.\nWith optional end, stop comparing S at that position.\nprefix can also be a tuple of strings to try.",
    },
    endswith: {
        $meth: Sk.builtin.str.methods.endswith,
        $flags: {},
        $textsig: null,
        $doc:
            "S.endswith(suffix[, start[, end]]) -> bool\n\nReturn True if S ends with the specified suffix, False otherwise.\nWith optional start, test S beginning at that position.\nWith optional end, stop comparing S at that position.\nsuffix can also be a tuple of strings to try.",
    },
    // isascii: {
    //     $meth: Sk.builtin.str.methods.isascii,
    //     $flags:{},
    //     $textsig: "($self, /)",
    //     $doc: "Return True if all characters in the string are ASCII, False otherwise.\n\nASCII characters have code points in the range U+0000-U+007F.\nEmpty string is ASCII too." },
    islower: {
        $meth: Sk.builtin.str.methods.islower,
        $flags: {},
        $textsig: "($self, /)",
        $doc:
            "Return True if the string is a lowercase string, False otherwise.\n\nA string is lowercase if all cased characters in the string are lowercase and\nthere is at least one cased character in the string.",
    },
    isupper: {
        $meth: Sk.builtin.str.methods.isupper,
        $flags: {},
        $textsig: "($self, /)",
        $doc:
            "Return True if the string is an uppercase string, False otherwise.\n\nA string is uppercase if all cased characters in the string are uppercase and\nthere is at least one cased character in the string.",
    },
    istitle: {
        $meth: Sk.builtin.str.methods.istitle,
        $flags: {},
        $textsig: "($self, /)",
        $doc:
            "Return True if the string is a title-cased string, False otherwise.\n\nIn a title-cased string, upper- and title-case characters may only\nfollow uncased characters and lowercase characters only cased ones.",
    },
    isspace: {
        $meth: Sk.builtin.str.methods.isspace,
        $flags: {},
        $textsig: "($self, /)",
        $doc:
            "Return True if the string is a whitespace string, False otherwise.\n\nA string is whitespace if all characters in the string are whitespace and there\nis at least one character in the string.",
    },
    // isdecimal: {
    //     $meth: Sk.builtin.str.methods.isdecimal,
    //     $flags:{},
    //     $textsig: "($self, /)",
    //     $doc: "Return True if the string is a decimal string, False otherwise.\n\nA string is a decimal string if all characters in the string are decimal and\nthere is at least one character in the string." },
    isdigit: {
        $meth: Sk.builtin.str.methods.isdigit,
        $flags: {},
        $textsig: "($self, /)",
        $doc:
            "Return True if the string is a digit string, False otherwise.\n\nA string is a digit string if all characters in the string are digits and there\nis at least one character in the string.",
    },
    isnumeric: {
        $meth: Sk.builtin.str.methods.isnumeric,
        $flags: {},
        $textsig: "($self, /)",
        $doc:
            "Return True if the string is a numeric string, False otherwise.\n\nA string is numeric if all characters in the string are numeric and there is at\nleast one character in the string.",
    },
    isalpha: {
        $meth: Sk.builtin.str.methods.isalpha,
        $flags: {},
        $textsig: "($self, /)",
        $doc:
            "Return True if the string is an alphabetic string, False otherwise.\n\nA string is alphabetic if all characters in the string are alphabetic and there\nis at least one character in the string.",
    },
    isalnum: {
        $meth: Sk.builtin.str.methods.isalnum,
        $flags: {},
        $textsig: "($self, /)",
        $doc:
            "Return True if the string is an alpha-numeric string, False otherwise.\n\nA string is alpha-numeric if all characters in the string are alpha-numeric and\nthere is at least one character in the string.",
    },
    // isidentifier: {
    //     $meth: Sk.builtin.str.methods.isidentifier,
    //     $flags:{},
    //     $textsig: "($self, /)",
    //     $doc: "Return True if the string is a valid Python identifier, False otherwise.\n\nUse keyword.iskeyword() to test for reserved identifiers such as \"def\" and\n\"class\"." },
    // isprintable: {
    //     $meth: Sk.builtin.str.methods.isprintable,
    //     $flags:{},
    //     $textsig: "($self, /)",
    //     $doc: "Return True if the string is printable, False otherwise.\n\nA string is printable if all of its characters are considered printable in\nrepr() or if it is empty." },
    zfill: {
        $meth: Sk.builtin.str.methods.zfill,
        $flags: {},
        $textsig: "($self, width, /)",
        $doc: "Pad a numeric string with zeros on the left, to fill a field of the given width.\n\nThe string is never truncated.",
    },
    format: {
        $meth: Sk.builtin.str.methods.format,
        $flags: {},
        $textsig: null,
        $doc:
            "S.format(*args, **kwargs) -> str\n\nReturn a formatted version of S, using substitutions from args and kwargs.\nThe substitutions are identified by braces ('{' and '}').",
    },
    // format_map: {
    //     $meth: Sk.builtin.str.methods.format_map,
    //     $flags:{},
    //     $textsig: null,
    //     $doc: "S.format_map(mapping) -> str\n\nReturn a formatted version of S, using substitutions from mapping.\nThe substitutions are identified by braces ('{' and '}')." },
    // __format__: {
    //     $meth: Sk.builtin.str.methods.__format__,
    //     $flags:{},
    //     $textsig: "($self, format_spec, /)",
    //     $doc: "Return a formatted version of the string as described by format_spec." },
    // __sizeof__: {
    //     $meth: Sk.builtin.str.methods.__sizeof__,
    //     $flags:{},
    //     $textsig: "($self, /)",
    //     $doc: "Return the size of the string in memory, in bytes." },
    // __getnewargs__: {
    //     $meth: Sk.builtin.str.methods.__getnewargs__,
    //     $flags:{},
    //     $textsig: null,
    //     $doc: null },
};

Sk.abstr.setUpSlots(Sk.builtin.str);
Sk.abstr.setUpMethods(Sk.builtin.str);

delete Sk.builtin.str.methods;

var reservedWords_ = {
    abstract: true,
    as: true,
    boolean: true,
    break: true,
    byte: true,
    case: true,
    catch: true,
    char: true,
    class: true,
    continue: true,
    const: true,
    debugger: true,
    default: true,
    delete: true,
    do: true,
    double: true,
    else: true,
    enum: true,
    export: true,
    extends: true,
    false: true,
    final: true,
    finally: true,
    float: true,
    for: true,
    function: true,
    goto: true,
    if: true,
    implements: true,
    import: true,
    in: true,
    instanceof: true,
    int: true,
    interface: true,
    is: true,
    long: true,
    namespace: true,
    native: true,
    new: true,
    null: true,
    package: true,
    private: true,
    protected: true,
    public: true,
    return: true,
    short: true,
    static: true,
    super: true,
    switch: true,
    synchronized: true,
    this: true,
    throw: true,
    throws: true,
    transient: true,
    true: true,
    try: true,
    typeof: true,
    use: true,
    var: true,
    void: true,
    volatile: true,
    while: true,
    with: true,
    // reserved Names
    constructor: true,
    __defineGetter__: true,
    __defineSetter__: true,
    apply: true,
    arguments: true,
    call: true,
    caller: true,
    eval: true,
    hasOwnProperty: true,
    isPrototypeOf: true,
    __lookupGetter__: true,
    __lookupSetter__: true,
    __noSuchMethod__: true,
    propertyIsEnumerable: true,
    prototype: true,
    toSource: true,
    toLocaleString: true,
    toString: true,
    unwatch: true,
    valueOf: true,
    watch: true,
    length: true,
    name: true,
};

function fixReserved(name) {
    if (reservedWords_[name] === undefined) {
        return name;
    }
    return name + "_$rw$";
}

Sk.builtin.str.reservedWords_ = reservedWords_;
