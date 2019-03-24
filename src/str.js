import { setUpInheritance, typeName } from './abstract';
import { remapToJs } from './ffi';
import {
    pyCheckArgs,
    func,
    checkString,
    checkInt,
    checkFloat,
    checkBool,
    pyCheckType,
    checkIterable
} from './function';
import { seqtype } from './seqtype';
import { ValueError, IndexError, AttributeError, StopIteration } from './errors';
import { NotImplementedError, none, object } from './object';
import { bool } from './bool';
import { list } from './list';
import { dict } from './dict';
import { tuple } from './tuple';
import { float_ } from './float';
import { int_ } from './int';
import { lng } from './long';
import { $emptystr } from './constants';
import { repr, asnum$ } from './builtin';
import { objectRepr, isIndex, asIndex, callsim } from './misceval';

const mapInterned = typeof Map !== 'undefined';

const interned = mapInterned ? new Map() : {};

const has = mapInterned ? interned.has : e => interned[e];

export class str extends seqtype {
    /**
     * @constructor
     * @param {*} x
     */
    constructor(x) {
        var ret;
        if (x === undefined) {
            x = "";
        }
        if (x instanceof str) {
            return x;
        }
        if (!(this instanceof str)) {
            return new str(x);
        }

        // convert to js string
        if (x === true) {
            ret = "True";
        } else if (x === false) {
            ret = "False";
        } else if ((x === null) || (x instanceof none)) {
            ret = "None";
        } else if (x instanceof bool) {
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
            if (!(ret instanceof str)) {
                throw new ValueError("__str__ didn't return a str");
            }
            return ret;
        } else {
            return objectRepr(x);
        }

        // interning required for strings in py
        if (has("1" + ret)) {
            return interned["1" + ret];
        }

        this.__class__ = str;
        this.v = ret;
        this["v"] = this.v;
        interned["1" + ret] = this;
    }

    mp$subscript(index) {
        var ret;
        if (isIndex(index)) {
            index = asIndex(index);
            if (index < 0) {
                index = this.v.length + index;
            }
            if (index < 0 || index >= this.v.length) {
                throw new IndexError("string index out of range");
            }
            return new str(this.v.charAt(index));
        } else if (index instanceof Sk.builtin.slice) {
            ret = "";
            index.sssiter$(this, function (i, wrt) {
                if (i >= 0 && i < wrt.v.length) {
                    ret += wrt.v.charAt(i);
                }
            });
            return new str(ret);
        } else {
            throw new TypeError("string indices must be integers, not " + typeName(index));
        }
    }

    sq$length() {
        return this.v.length;
    }

    sq$concat(other) {
        var otypename;
        if (!other || !checkString(other)) {
            otypename = typeName(other);
            throw new TypeError("cannot concatenate 'str' and '" + otypename + "' objects");
        }
        return new str(this.v + other.v);
    }

    nb$add = str.prototype.sq$concat;
    nb$inplace_add = str.prototype.sq$concat;

    sq$repeat(n) {
        var i;
        var ret;

        if (!isIndex(n)) {
            throw new TypeError("can't multiply sequence by non-int of type '" + typeName(n) + "'");
        }

        n = asIndex(n);
        ret = "";
        for (i = 0; i < n; ++i) {
            ret += this.v;
        }
        return new str(ret);
    }

    nb$multiply = str.prototype.sq$repeat;
    nb$inplace_multiply = str.prototype.sq$repeat;

    sq$item() {
        goog.asserts.fail();
    }

    sq$slice(i1, i2) {
        i1 = asnum$(i1);
        i2 = asnum$(i2);
        if (i1 < 0) {
            i1 = 0;
        }
        return new str(this.v.substr(i1, i2 - i1));
    }

    sq$contains(ob) {
        if (!(ob instanceof str)) {
            throw new TypeError("TypeError: 'In <string> requires string as left operand");
        }
        return this.v.indexOf(ob.v) != -1;
    }

    tp$iter() {
        return new str_iter_(this);
    }

    tp$richcompare(other, op) {
        if (!(other instanceof str)) {
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
    }

    $r() {
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
        return new str(ret);
    }

    static re_escape_(s) {
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
    }

    nb$remainder = function (rhs) {
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
        if (rhs.constructor !== tuple && (rhs.mp$subscript === undefined || rhs.constructor === str)) {
            rhs = new tuple([rhs]);
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
            fieldWidth = asnum$(fieldWidth);
            precision = asnum$(precision);

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
                base = asnum$(base);
                neg = false;
                didSign = false;
                if (typeof n === "number") {
                    if (n < 0) {
                        n = -n;
                        neg = true;
                    }
                    r = n.toString(base);
                } else if (n instanceof float_) {
                    r = n.str$(base, false);
                    if (r.length > 2 && r.substr(-2) === ".0") {
                        r = r.substr(0, r.length - 2);
                    }
                    neg = n.nb$isnegative();
                } else if (n instanceof int_) {
                    r = n.str$(base, false);
                    neg = n.nb$isnegative();
                } else if (n instanceof lng) {
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
            if (rhs.constructor === tuple) {
                value = rhs.v[i];
            } else if (rhs.mp$subscript !== undefined && mappingKey !== undefined) {
                mk = mappingKey.substring(1, mappingKey.length - 1);
                //print("mk",mk);
                value = rhs.mp$subscript(new str(mk));
            } else if (rhs.constructor === dict || rhs.constructor === list) {
                // new case where only one argument is provided
                value = rhs;
            } else {
                throw new AttributeError(rhs.tp$name + " instance has no attribute 'mp$subscript'");
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
                convValue = asnum$(value);
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
                if(checkFloat(value)) {
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
                } else if (value instanceof int_) {
                    return String.fromCharCode(value.v);
                } else if (value instanceof float_) {
                    return String.fromCharCode(value.v);
                } else if (value instanceof lng) {
                    return String.fromCharCode(value.str$(10, false)[0]);
                } else if (value.constructor === str) {
                    return value.v.substr(0, 1);
                } else {
                    throw new TypeError("an integer is required");
                }
            } else if (conversionType === "r") {
                r = repr(value);
                if (precision) {
                    return r.v.substr(0, precision);
                }
                return r.v;
            } else if (conversionType === "s") {
                r = new str(value);
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
        return new str(ret);
    }

    __iter__ = new func(function (self) {
        return new str_iter_(self);
    })

    lower = new func(function (self) {
        pyCheckArgs("lower", arguments, 1, 1);
        return new str(self.v.toLowerCase());
    })

    upper = new func(function (self) {
        pyCheckArgs("upper", arguments, 1, 1);
        return new str(self.v.toUpperCase());
    })

    capitalize = new func(function (self) {
        var i;
        var cap;
        var orig;
        pyCheckArgs("capitalize", arguments, 1, 1);
        orig = self.v;

        if (orig.length === 0) {
            return new str("");
        }
        cap = orig.charAt(0).toUpperCase();

        for (i = 1; i < orig.length; i++) {
            cap += orig.charAt(i).toLowerCase();
        }
        return new str(cap);
    })

    join = new func(function (self, seq) {
        var it, i;
        var arrOfStrs;
        pyCheckArgs("join", arguments, 2, 2);
        pyCheckType("seq", "iterable", checkIterable(seq));
        arrOfStrs = [];
        for (it = seq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            if (i.constructor !== str) {
                throw new TypeError("TypeError: sequence item " + arrOfStrs.length + ": expected string, " + typeof i + " found");
            }
            arrOfStrs.push(i.v);
        }
        return new str(arrOfStrs.join(self.v));
    })

    split = new func(function (self, on, howmany) {
        var splits;
        var index;
        var match;
        var result;
        var s;
        var str;
        var regex;
        pyCheckArgs("split", arguments, 1, 3);
        if ((on === undefined) || (on instanceof none)) {
            on = null;
        }
        if ((on !== null) && !checkString(on)) {
            throw new TypeError("expected a string");
        }
        if ((on !== null) && on.v === "") {
            throw new ValueError("empty separator");
        }
        if ((howmany !== undefined) && !checkInt(howmany)) {
            throw new TypeError("an integer is required");
        }

        howmany = asnum$(howmany);
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
            result.push(new str(str.substring(index, match.index)));
            index = regex.lastIndex;
            splits += 1;
            if (howmany && (splits >= howmany)) {
                break;
            }
        }
        str = str.substring(index);
        if (on !== null || (str.length > 0)) {
            result.push(new str(str));
        }

        return new list(result);
    })

    strip = new func(function (self, chars) {
        var regex;
        var pattern;
        pyCheckArgs("strip", arguments, 1, 2);
        if ((chars !== undefined) && !checkString(chars)) {
            throw new TypeError("strip arg must be None or str");
        }
        if (chars === undefined) {
            pattern = /^\s+|\s+$/g;
        } else {
            regex = str.re_escape_(chars.v);
            pattern = new RegExp("^[" + regex + "]+|[" + regex + "]+$", "g");
        }
        return new str(self.v.replace(pattern, ""));
    })

    lstrip = new func(function (self, chars) {
        var regex;
        var pattern;
        pyCheckArgs("lstrip", arguments, 1, 2);
        if ((chars !== undefined) && !checkString(chars)) {
            throw new TypeError("lstrip arg must be None or str");
        }
        if (chars === undefined) {
            pattern = /^\s+/g;
        } else {
            regex = str.re_escape_(chars.v);
            pattern = new RegExp("^[" + regex + "]+", "g");
        }
        return new str(self.v.replace(pattern, ""));
    })

    rstrip = new func(function (self, chars) {
        var regex;
        var pattern;
        pyCheckArgs("rstrip", arguments, 1, 2);
        if ((chars !== undefined) && !checkString(chars)) {
            throw new TypeError("rstrip arg must be None or str");
        }
        if (chars === undefined) {
            pattern = /\s+$/g;
        } else {
            regex = str.re_escape_(chars.v);
            pattern = new RegExp("[" + regex + "]+$", "g");
        }
        return new str(self.v.replace(pattern, ""));
    })

    __format__ = new func(function (self, format_spec) {
        var formatstr;
        pyCheckArgs("__format__", arguments, 2, 2);

        if (!checkString(format_spec)) {
            if (Sk.__future__.exceptions) {
                throw new TypeError("format() argument 2 must be str, not " + typeName(format_spec));
            } else {
                throw new TypeError("format expects arg 2 to be string or unicode, not " + typeName(format_spec));
            }
        } else {
            formatstr = remapToJs(format_spec);
            if (formatstr !== "" && formatstr !== "s") {
                throw new NotImplementedError("format spec is not yet implemented");
            }
        }

        return new str(self);
    })

    partition = new func(function (self, sep) {
        var pos;
        var sepStr;
        pyCheckArgs("partition", arguments, 2, 2);
        pyCheckType("sep", "string", checkString(sep));
        sepStr = new str(sep);
        pos = self.v.indexOf(sepStr.v);
        if (pos < 0) {
            return new tuple([self, $emptystr, $emptystr]);
        }

        return new tuple([
            new str(self.v.substring(0, pos)),
            sepStr,
            new str(self.v.substring(pos + sepStr.v.length))]);
    })

    rpartition = new func(function (self, sep) {
        var pos;
        var sepStr;
        pyCheckArgs("rpartition", arguments, 2, 2);
        pyCheckType("sep", "string", checkString(sep));
        sepStr = new str(sep);
        pos = self.v.lastIndexOf(sepStr.v);
        if (pos < 0) {
            return new tuple([$emptystr, $emptystr, self]);
        }

        return new tuple([
            new str(self.v.substring(0, pos)),
            sepStr,
            new str(self.v.substring(pos + sepStr.v.length))]);
    })

    count = new func(function (self, pat, start, end) {
        var normaltext;
        var ctl;
        var slice;
        var m;
        pyCheckArgs("count", arguments, 2, 4);
        if (!checkString(pat)) {
            throw new TypeError("expected a character buffer object");
        }
        if ((start !== undefined) && !checkInt(start)) {
            throw new TypeError("slice indices must be integers or None or have an __index__ method");
        }
        if ((end !== undefined) && !checkInt(end)) {
            throw new TypeError("slice indices must be integers or None or have an __index__ method");
        }

        if (start === undefined) {
            start = 0;
        } else {
            start = asnum$(start);
            start = start >= 0 ? start : self.v.length + start;
        }

        if (end === undefined) {
            end = self.v.length;
        } else {
            end = asnum$(end);
            end = end >= 0 ? end : self.v.length + end;
        }

        normaltext = pat.v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        m = new RegExp(normaltext, "g");
        slice = self.v.slice(start, end);
        ctl = slice.match(m);
        if (!ctl) {
            return  new int_(0);
        } else {
            return new int_(ctl.length);
        }

    })

    ljust = new func(function (self, len, fillchar) {
        var newstr;
        pyCheckArgs("ljust", arguments, 2, 3);
        if (!checkInt(len)) {
            throw new TypeError("integer argument exepcted, got " + typeName(len));
        }
        if ((fillchar !== undefined) && (!checkString(fillchar) || fillchar.v.length !== 1)) {
            throw new TypeError("must be char, not " + typeName(fillchar));
        }
        if (fillchar === undefined) {
            fillchar = " ";
        } else {
            fillchar = fillchar.v;
        }
        len = asnum$(len);
        if (self.v.length >= len) {
            return self;
        } else {
            newstr = Array.prototype.join.call({length: Math.floor(len - self.v.length) + 1}, fillchar);
            return new str(self.v + newstr);
        }
    })

    rjust = new func(function (self, len, fillchar) {
        var newstr;
        pyCheckArgs("rjust", arguments, 2, 3);
        if (!checkInt(len)) {
            throw new TypeError("integer argument exepcted, got " + typeName(len));
        }
        if ((fillchar !== undefined) && (!checkString(fillchar) || fillchar.v.length !== 1)) {
            throw new TypeError("must be char, not " + typeName(fillchar));
        }
        if (fillchar === undefined) {
            fillchar = " ";
        } else {
            fillchar = fillchar.v;
        }
        len = asnum$(len);
        if (self.v.length >= len) {
            return self;
        } else {
            newstr = Array.prototype.join.call({length: Math.floor(len - self.v.length) + 1}, fillchar);
            return new str(newstr + self.v);
        }

    })

    center = new func(function (self, len, fillchar) {
        var newstr;
        var newstr1;
        pyCheckArgs("center", arguments, 2, 3);
        if (!checkInt(len)) {
            throw new TypeError("integer argument exepcted, got " + typeName(len));
        }
        if ((fillchar !== undefined) && (!checkString(fillchar) || fillchar.v.length !== 1)) {
            throw new TypeError("must be char, not " + typeName(fillchar));
        }
        if (fillchar === undefined) {
            fillchar = " ";
        } else {
            fillchar = fillchar.v;
        }
        len = asnum$(len);
        if (self.v.length >= len) {
            return self;
        } else {
            newstr1 = Array.prototype.join.call({length: Math.floor((len - self.v.length) / 2) + 1}, fillchar);
            newstr = newstr1 + self.v + newstr1;
            if (newstr.length < len) {
                newstr = newstr + fillchar;
            }
            return new str(newstr);
        }

    })

    find = new func(function (self, tgt, start, end) {
        var idx;
        pyCheckArgs("find", arguments, 2, 4);
        if (!checkString(tgt)) {
            throw new TypeError("expected a character buffer object");
        }
        if ((start !== undefined) && !checkInt(start)) {
            throw new TypeError("slice indices must be integers or None or have an __index__ method");
        }
        if ((end !== undefined) && !checkInt(end)) {
            throw new TypeError("slice indices must be integers or None or have an __index__ method");
        }

        if (start === undefined) {
            start = 0;
        } else {
            start = asnum$(start);
            start = start >= 0 ? start : self.v.length + start;
        }

        if (end === undefined) {
            end = self.v.length;
        } else {
            end = asnum$(end);
            end = end >= 0 ? end : self.v.length + end;
        }

        idx = self.v.indexOf(tgt.v, start);
        idx = ((idx >= start) && (idx < end)) ? idx : -1;

        return new int_(idx);
    })

    index = new func(function (self, tgt, start, end) {
        var idx;
        pyCheckArgs("index", arguments, 2, 4);
        idx = callsim(self["find"], self, tgt, start, end);
        if (asnum$(idx) === -1) {
            throw new ValueError("substring not found");
        }
        return idx;
    })

    rfind = new func(function (self, tgt, start, end) {
        var idx;
        pyCheckArgs("rfind", arguments, 2, 4);
        if (!checkString(tgt)) {
            throw new TypeError("expected a character buffer object");
        }
        if ((start !== undefined) && !checkInt(start)) {
            throw new TypeError("slice indices must be integers or None or have an __index__ method");
        }
        if ((end !== undefined) && !checkInt(end)) {
            throw new TypeError("slice indices must be integers or None or have an __index__ method");
        }

        if (start === undefined) {
            start = 0;
        } else {
            start = asnum$(start);
            start = start >= 0 ? start : self.v.length + start;
        }

        if (end === undefined) {
            end = self.v.length;
        } else {
            end = asnum$(end);
            end = end >= 0 ? end : self.v.length + end;
        }

        idx = self.v.lastIndexOf(tgt.v, end);
        idx = (idx !== end) ? idx : self.v.lastIndexOf(tgt.v, end - 1);
        idx = ((idx >= start) && (idx < end)) ? idx : -1;

        return new int_(idx);
    })

    rindex = new func(function (self, tgt, start, end) {
        var idx;
        pyCheckArgs("rindex", arguments, 2, 4);
        idx = callsim(self["rfind"], self, tgt, start, end);
        if (asnum$(idx) === -1) {
            throw new ValueError("substring not found");
        }
        return idx;
    })

    startswith = new func(function (self, tgt) {
        pyCheckArgs("startswith", arguments, 2, 2);
        pyCheckType("tgt", "string", checkString(tgt));
        return new bool( self.v.indexOf(tgt.v) === 0);
    })

    // http://stackoverflow.com/questions/280634/endswith-in-javascript
    endswith = new func(function (self, tgt) {
        pyCheckArgs("endswith", arguments, 2, 2);
        pyCheckType("tgt", "string", checkString(tgt));
        return new bool( self.v.indexOf(tgt.v, self.v.length - tgt.v.length) !== -1);
    })

    replace = new func(function (self, oldS, newS, count) {
        var c;
        var patt;
        pyCheckArgs("replace", arguments, 3, 4);
        pyCheckType("oldS", "string", checkString(oldS));
        pyCheckType("newS", "string", checkString(newS));
        if ((count !== undefined) && !checkInt(count)) {
            throw new TypeError("integer argument expected, got " +
                typeName(count));
        }
        count = asnum$(count);
        patt = new RegExp(str.re_escape_(oldS.v), "g");

        if ((count === undefined) || (count < 0)) {
            return new str(self.v.replace(patt, newS.v));
        }

        c = 0;

        function replacer (match) {
            c++;
            if (c <= count) {
                return newS.v;
            }
            return match;
        }

        return new str(self.v.replace(patt, replacer));
    })

    zfill = new func(function (self, len) {
        var str = self.v;
        var ret;
        var zeroes;
        var offset;
        var pad = "";

        pyCheckArgs("zfill", arguments, 2, 2);
        if (! checkInt(len)) {
            throw new TypeError("integer argument exepected, got " + typeName(len));
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
        return new str(ret);


    })

    isdigit = new func(function (self) {
        pyCheckArgs("isdigit", arguments, 1, 1);
        return new bool( /^\d+$/.test(self.v));
    })

    isspace = new func(function (self) {
        pyCheckArgs("isspace", arguments, 1, 1);
        return new bool( /^\s+$/.test(self.v));
    })


    expandtabs = new func(function (self, tabsize) {
        // var input = self.v;
        // var expanded = "";
        // var split;
        // var spacestr = "";
        // var spacerem;


        var spaces;
        var expanded;

        pyCheckArgs("expandtabs", arguments, 1, 2);


        if ((tabsize !== undefined) && ! .checkInt(tabsize)) {
            throw new TypeError("integer argument exepected, got " + typeName(tabsize));
        }
        if (tabsize === undefined) {
            tabsize = 8;
        } else {
            tabsize = .asnum$(tabsize);
        }

        spaces = (new Array(tabsize + 1)).join(" ");
        expanded = self.v.replace(/([^\r\n\t]*)\t/g, function(a, b) {
            return b + spaces.slice(b.length % tabsize);
        });
        return new str(expanded);
    })

    swapcase = new func(function (self) {
        var ret;
        pyCheckArgs("swapcase", arguments, 1, 1);


        ret = self.v.replace(/[a-z]/gi, function(c) {
            var lc = c.toLowerCase();
            return lc === c ? c.toUpperCase() : lc;
        });

        return new str(ret);
    })

    splitlines = new func(function (self, keepends) {
        var data = self.v;
        var i = 0;
        var j = i;
        var selflen = self.v.length;
        var strs_w = [];
        var ch;
        var eol;
        var sol = 0;
        var slice;
        pyCheckArgs("splitlines", arguments, 1, 2);
        if ((keepends !== undefined) && ! checkBool(keepends)) {
            throw new TypeError("boolean argument expected, got " + typeName(keepends));
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
                strs_w.push(new str(slice));
                sol = eol;
            } else if ((ch === "\n" && data.charAt(i - 1) !== "\r") || ch === "\r") {
                eol = i + 1;
                slice = data.slice(sol, eol);
                if (! keepends) {
                    slice = slice.replace(/(\r|\n)/g, "");
                }
                strs_w.push(new str(slice));
                sol = eol;
            }

        }
        if (sol < selflen) {
            eol = selflen;
            slice = data.slice(sol, eol);
            if (! keepends) {
                slice = slice.replace(/(\r|\n)/g, "");
            }
            strs_w.push(new str(slice));
        }
        return new list(strs_w);
    })

    title = new func(function (self) {
        var ret;

        pyCheckArgs("title", arguments, 1, 1);

        ret = self.v.replace(/[a-z][a-z]*/gi, function(str) {
            return str[0].toUpperCase() + str.substr(1).toLowerCase();
        });

        return new str(ret);
    })

    isalpha = new func(function (self) {
        pyCheckArgs("isalpha", arguments, 1, 1);
        return new bool( self.v.length && goog.string.isAlpha(self.v));
    })

    isalnum = new func(function (self) {
        pyCheckArgs("isalnum", arguments, 1, 1);
        return new bool( self.v.length && goog.string.isAlphaNumeric(self.v));
    })

    // does not account for unicode numeric values
    isnumeric = new func(function (self) {
        pyCheckArgs("isnumeric", arguments, 1, 1);
        return new bool( self.v.length && goog.string.isNumeric(self.v));
    })

    islower = new func(function (self) {
        pyCheckArgs("islower", arguments, 1, 1);
        return new bool( self.v.length && /[a-z]/.test(self.v) && !/[A-Z]/.test(self.v));
    })

    isupper = new func(function (self) {
        pyCheckArgs("isupper", arguments, 1, 1);
        return new bool( self.v.length && !/[a-z]/.test(self.v) && /[A-Z]/.test(self.v));
    })

    istitle = new func(function (self) {
        // Comparing to str.title() seems the most intuitive thing, but it fails on "",
        // Other empty-ish strings with no change.
        var input = self.v;
        var cased = false;
        var previous_is_cased = false;
        var pos;
        var ch;
        pyCheckArgs("istitle", arguments, 1, 1);
        for (pos = 0; pos < input.length; pos ++) {
            ch = input.charAt(pos);
            if (! /[a-z]/.test(ch) && /[A-Z]/.test(ch)) {
                if (previous_is_cased) {
                    return new bool( false);
                }
                previous_is_cased = true;
                cased = true;
            } else if (/[a-z]/.test(ch) && ! /[A-Z]/.test(ch)) {
                if (! previous_is_cased) {
                    return new bool( false);
                }
                cased = true;
            } else {
                previous_is_cased = false;
            }
        }
        return new bool( cased);
    })
}

setUpInheritance("str", str, seqtype);

export class str_iter_ {
    constructor(obj) {
        if (!(this instanceof str_iter_)) {
            return new str_iter_(obj);
        }
        this.$index = 0;
        this.$obj = obj.v.slice();
        this.sq$length = this.$obj.length;
        this.tp$iter = this;
        this.tp$iternext = function () {
            if (this.$index >= this.sq$length) {
                return undefined;
            }
            return new str(this.$obj.substr(this.$index++, 1));
        };
        this.$r = function () {
            return new str("iterator");
        };
    }

    __class__ = str_iter_;

    __iter__ = new func(function (self) {
        pyCheckArgs("__iter__", arguments, 0, 0, true, false);
        return self;
    })

    next$(self) {
        var ret = self.tp$iternext();
        if (ret === undefined) {
            throw new StopIteration();
        }
        return ret;
    };
}

setUpInheritance("iterator", str_iter_, object);

/**
 * @constructor
 * @param {Object} obj
 */
str_iter_ = function (obj) {

    return this;
};

