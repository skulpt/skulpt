const textEncoding = require("text-encoding");

/**
 * @constructor
 * @param {*} x
 * @extends Sk.builtin.object
 */

Sk.builtin.bytes = function (source, encoding, errors) {
    var i;
    var item;
    var iter;
    var val;
    var view;
    var buffer;
    var string;
    var ret;
    var final;
    var arr;
    if (!(this instanceof Sk.builtin.bytes)) {
        return new Sk.builtin.bytes(...arguments);
    }
    Sk.builtin.pyCheckArgsLen("bytes", arguments.length, 0, 3);

    if (errors === undefined) {
        errors = new Sk.builtin.str("strict");
    } else if (!(errors instanceof Sk.builtin.str)) {
        throw new Sk.builtin.TypeError("bytes() argument 2 must be str, not " + Sk.abstr.typeName(errors));
    }
    if (encoding === undefined) {
        encoding = new Sk.builtin.str("utf-8");
    }
    if (!(errors.v == "strict" || errors.v == "ignore" || errors.v == "replace")) {
        throw new Sk.builtin.NotImplementedError("'" + errors.v + "' error handling not implemented in Skulpt");
    }
    if (encoding === undefined) {
        encoding = new Sk.builtin.str("utf-8");
    }
    if (arguments.length == 0) {
        return new Sk.builtin.bytes(new Sk.builtin.int_(0));
    }
    if (arguments.length == 1) {
        if (source instanceof Sk.builtin.int_) {
            buffer = new ArrayBuffer(source.v);
            view = new DataView(buffer);
        } else if (Sk.builtin.checkIterable(source) && !(source instanceof Sk.builtin.str)) {
            final = [];
            i = 0;
            for (iter = Sk.abstr.iter(source), item = iter.tp$iternext();
                item !== undefined;
                item = iter.tp$iternext()) {
                if (item instanceof Sk.builtin.int_) {
                    if (item.v >= 0 && item.v <= 256) {
                        final.push(item.v);
                        i ++;
                    } else {
                        throw new Sk.builtin.ValueError("bytes must be in range(0, 256)");
                    }
                } else {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(item) + "' " + "object cannot be interpreted as an integer");
                }
            }
            arr = new Uint8Array(final);
            buffer = arr.buffer;
            view = new DataView(buffer);
        } else if (source instanceof Sk.builtin.bytes) {
            return source;
        } else if (source instanceof Sk.builtin.str) {
            throw new Sk.builtin.TypeError("string argument without an encoding");
        } else {
            throw new Sk.builtin.TypeError("cannot convert '" + Sk.abstr.typeName(source) + "' object into bytes");
        }
    } else if (arguments.length > 1) {
        if (encoding instanceof Sk.builtin.str) {
            if (source instanceof Sk.builtin.str) {
                if (encoding.v == "ascii") {
                    string = "";
                    for (i in source.v) {
                        val = source.v[i].charCodeAt(0);

                        if (val < 0 || val > 127) {
                            if (errors.v == "strict") {
                                val = makehexform(val);
                                throw new Sk.builtin.UnicodeEncodeError("'ascii' codec can't encode character '" + val + "' in position " + i + ": ordinal not in range(128)");
                            } else if (errors.v == "replace") {
                                string += "?";
                            }
                        } else {
                            string += source.v[i];
                        }
                    }
                } else if (encoding.v == "utf-8") {
                    string = source.v;
                } else {
                    throw new Sk.builtin.LookupError("unknown encoding: " + encoding.v);
                }
                ret = new textEncoding.TextEncoder(encoding.$jsstr()).encode(string);
                buffer = ret.buffer;
                view = new DataView(buffer);
            } else {
                throw new Sk.builtin.TypeError("encoding without a string argument");
            }
        } else {
            throw new Sk.builtin.TypeError("bytes() argument 2 must be str, not " + Sk.abstr.typeName(encoding));
        }
    }

    this.v = view;
    this.__class__ = Sk.builtin.bytes;

    return this;
};

var makehexform = function (num) {
    var leading;
    if (num <= 265) {
        leading = "\\x";
    } else {
        leading = "\\u";
    }
    num = num.toString(16);
    if (num.length == 3) {
        num = num.slice(1,3);
    }
    if (num.length  == 1) {
        num = leading + "0" + num;
    } else {
        num = leading + num;
    }
    return num;
};

Sk.abstr.setUpInheritance("bytes", Sk.builtin.bytes, Sk.builtin.object);

Sk.builtin.bytes.prototype["$r"] = function () {
    var ret;
    var i;
    var num;
    ret = "";
    for (i = 0; i < this.v.byteLength; i++) {
        num = this.v.getUint8(i);
        if ((num < 9) || (num > 10 && num < 13) || (num > 13 && num < 32) || (num > 126)) {
            ret += makehexform(num);
        } else if (num == 9 || num == 10 || num == 13 || num == 92) {
            switch (num) {
                case 9:
                    ret += "\\t";
                    break;
                case 10:
                    ret += "\\n";
                    break;
                case 13:
                    ret += "\\r";
                    break;
                case 92:
                    ret += "\\\\";
                    break;
            }
        } else {
            ret += String.fromCharCode(num);
        }
    }
    ret = "b'" + ret + "'";
    return new Sk.builtin.str(ret);
};

Sk.builtin.bytes.prototype.mp$subscript = function (index) {
    var ret;
    var i;
    if (Sk.misceval.isIndex(index)) {
        i = Sk.misceval.asIndex(index);
        if (i !== undefined) {
            if (i < 0) {
                i = this.v.byteLength + i;
            }
            if (i < 0 || i >= this.v.byteLength) {
                throw new Sk.builtin.IndexError("index out of range");
            }
            return new Sk.builtin.int_(this.v.getUint8(i));
        }
    } else if (index instanceof Sk.builtin.slice) {
        ret = [];
        if (index.start.v < 0) {
            index.start.v = 0;
        }
        if (index.stop.v > this.v.byteLength) {
            index.stop.v = this.v.byteLength;
        }
        if (index.stop.v < 0) {
            index.stop.v = this.v.byteLength + index.stop.v;
        }
        index.sssiter$(this, function (i, wrt) {
            ret.push(new Sk.builtin.int_(wrt.v.getUint8(i)));
        });
        return new Sk.builtin.bytes(new Sk.builtin.list(ret));
    }

    throw new Sk.builtin.TypeError("byte indices must be integers, not " + Sk.abstr.typeName(index));
};

Sk.builtin.bytes.prototype.ob$eq = function (other) {
    var i;
    var val1;
    var val2;
    var iter1;
    var iter2;

    if (this === other) {
        return Sk.builtin.bool.true$;
    }

    if (!(other instanceof Sk.builtin.bytes)) {
        return Sk.builtin.bool.false$;
    }
    if (this.sq$length() != other.sq$length()) {
        return Sk.builtin.bool.false$;
    }
    iter1 = this.tp$iter();
    iter2 = other.tp$iter();

    for (i = 0; i < this.sq$length(); i ++) {
        val1 = iter1.tp$iternext();
        val2 = iter2.tp$iternext();
        if (val1 === undefined || val2 === undefined) {
            break;
        }
        if (val1.v != val2.v) {
            return Sk.builtin.bool.false$;
        }
    }

    return Sk.builtin.bool.true$;
};

Sk.builtin.bytes.prototype.ob$ne = function (other) {
    return (!(this.ob$eq(other)));
};

Sk.builtin.bytes.prototype.sq$length = function () {
    return this.v.byteLength;
};

Sk.builtin.bytes.prototype["decode"] = new Sk.builtin.func(function (self, encoding, errors) {
    var i;
    var val;
    var final;
    Sk.builtin.pyCheckArgsLen("decode", arguments.length - 1, 1, 2);

    if (encoding === undefined) {
        encoding = new Sk.builtin.str("utf-8");
    }

    if (!(encoding instanceof Sk.builtin.str)) {
        throw new Sk.builtin.TypeError("decode() argument 1 must be str, not " + Sk.abstr.typeName(encoding));
    }

    if (errors === undefined) {
        errors = new Sk.builtin.str("strict");
    }

    if (!(errors instanceof Sk.builtin.str)) {
        throw new Sk.builtin.TypeError("decode() argument 2 must be str, not " + Sk.abstr.typeName(errors));
    }

    if (!(errors.v == "strict" || errors.v == "ignore" || errors.v == "replace")) {
        throw new Sk.builtin.NotImplementedError("'" + errors.v + "' error handling not implemented in Skulpt");
    }

    if (!(encoding.v == "ascii" || encoding.v == "utf-8")) {
        throw new Sk.builtin.LookupError("unknown encoding: " + encoding.v);
    }

    if (encoding.v == "ascii") {
        var string = new textEncoding.TextDecoder(encoding.$jsstr()).decode(self.v);
        final = "";
        for (i in string) {
            if (string[i].charCodeAt(0) > 127) {
                if (errors.v == "strict") {
                    val = self.v.getUint8(i);
                    val = val.toString(16);
                    throw new Sk.builtin.UnicodeDecodeError("'ascii' codec can't decode byte 0x" + val + " in position " + i.toString() + ": ordinal not in range(128)");
                } else if (errors.v == "replace") {
                    final += String.fromCharCode(65533);
                }
            } else {
                final += string[i];
            }
        }
        string = final;
    } else {
        var string = new textEncoding.TextDecoder(encoding.$jsstr()).decode(self.v);
        if (errors.v == "replace") {
            return new Sk.builtin.str(string);
        }
        final = "";
        for (i in string) {
            if (string[i].charCodeAt(0) == 65533) {
                if (errors.v == "strict") {
                    val = self.v.getUint8(i);
                    val = val.toString(16);
                    throw new Sk.builtin.UnicodeDecodeError("'utf-8' codec can't decode byte 0x" + val + " in position " + i.toString() + ": invalid start byte");
                }
            } else {
                final += string[i];
            }
        }
        string = final;
    }
    return new Sk.builtin.str(string);
});

Sk.builtin.bytes.prototype["fromhex"] = new Sk.builtin.func(function (string) {
    var final;
    var checkhex;
    var i;
    var char;
    var checkspace;
    Sk.builtin.pyCheckArgsLen("fromhex", arguments.length, 1, 1);

    if (!(string instanceof Sk.builtin.str)) {
        throw new Sk.builtin.TypeError("fromhex() argument must be str, not " + Sk.abstr.typeName(string));
    }

    final = [];
    checkhex = function (val) {
        if ("0123456789abcdefABCDEF".includes(val)) {
            return true;
        }
        return false;
    };

    checkspace = function (val) {
        var code;
        code = val.charCodeAt(0);
        if (val == 9 || val == 10 || val == 12 || val == 13 || val == 32) {
            return true;
        } else {
            return false;
        }
    };

    while (i < string.v.length) {
        char = string.v.charAt(i);
        if (checkhex(char)) {
            if (i + 1 < string.v.length) {
                if (checkhex(string.v.charAt(i+1))) {
                    val1 = string.v.slice(i, i + 1);
                    val1 = parseInt(val1, 16);
                    final.push(new Sk.builtin.int_(val1));
                    i += 2;
                } else {
                    throw new Sk.builtin.ValueError("non-hexadecimal number found in fromhex() arg at position " + (i+1).toString());
                }
            } else {
                throw new Sk.builtin.ValueError("non-hexadecimal number found in fromhex() arg at position " + (i).toString());
            }
        } else if (checkspace(char)) {
            i ++;
        } else {
            throw new Sk.builtin.ValueError("non-hexadecimal number found in fromhex() arg at position " + (i).toString());
        }
    }

    final = new Sk.builtin.list(final);
    return new Sk.builtin.bytes(final);
});

Sk.builtin.bytes.prototype["hex"] = new Sk.builtin.func(function (self) {
    var final;
    var val;
    var i;
    Sk.builtin.pyCheckArgsLen("hex", arguments.length - 1, 0, 0);
    final = "";
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        val = val.toString(16);
        if (val.length == 1) {
            val = "0" + val;
        }
        final += val;
    }
    return new Sk.builtin.str(final);
});

Sk.builtin.bytes.prototype["count"] = new Sk.builtin.func(function (self, sub, start, end) {
    var count;
    var i;
    var len;
    var val;
    var val1;
    var index;
    Sk.builtin.pyCheckArgsLen("count", arguments.length - 1, 1, 3);
    if (end === undefined) {
        end = self.v.byteLength;
    } else {
        if (!(end instanceof Sk.builtin.int_)) {
            throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
        }
        end = end.v;
        if (end > self.v.byteLength) {
            end = self.v.byteLength;
        }
    }
    if (start === undefined) {
        start = 0;
    } else {
        if (!(start instanceof Sk.builtin.int_)) {
            throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
        }
        start = start.v;
        if (start < 0) {
            start = 0;
        }
    }
    count = 0;
    if (sub instanceof Sk.builtin.int_) {
        for (i = start; i < end; i++) {
            if (self.v.getUint8(i) == sub.v) {
                count++;
            }
        }
    } else if (sub instanceof Sk.builtin.bytes) {
        len = sub.v.byteLength;
        while (start + len <= end) {
            index = new Sk.builtin.slice(start, start + len);
            val = self.mp$subscript(index);
            if (val.ob$eq(sub) == Sk.builtin.bool.true$) {
                count += 1;
                start += len;
            } else {
                start += 1;
            }
        }
    } else {
        throw new Sk.builtin.TypeError("argument should be integer or bytes-like object, not '" + Sk.abstr.typeName(sub) + "'");
    }
    return new Sk.builtin.int_(count);
});

Sk.builtin.bytes.prototype["endswith"] = new Sk.builtin.func(function (self, suffix, start, end) {
    var len;
    var iter;
    var item;
    var index;
    var val;
    Sk.builtin.pyCheckArgsLen("endswith", arguments.length - 1, 1, 3);
    if (!(suffix instanceof Sk.builtin.bytes || suffix instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("endswith first arg must be bytes or a tuple of bytes, not " + Sk.abstr.typeName(suffix));
    }
    if (start === undefined) {
        start = 0;
    } else {
        if (!(start instanceof Sk.builtin.int_)) {
            throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
        }
        start = start.v;
        if (start < 0) {
            start = 0;
        }
    }
    if (end === undefined) {
        end = self.v.byteLength;
    } else {
        if (!(end instanceof Sk.builtin.int_)) {
            throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
        }
        end = end.v;
        if (end > self.v.byteLength) {
            end = self.v.byteLength;
        }
    }
    if (suffix instanceof Sk.builtin.tuple) {
        for (iter = Sk.abstr.iter(suffix), item = iter.tp$iternext();
            item !== undefined;
            item = iter.tp$iternext()) {
            if (!(item instanceof Sk.builtin.bytes)) {
                throw new Sk.builtin.TypeError("a bytes-like object is required, not '" + Sk.abstr.typeName(item) + "'");
            }
            len = item.v.byteLength;
            if ((end - start) >= len) {
                index = new Sk.builtin.slice(end - len, end);
                val = self.mp$subscript(index);
                if (val.ob$eq(item) == Sk.builtin.bool.true$) {
                    return Sk.builtin.bool.true$;
                }
            }
        }
        return Sk.builtin.bool.false$;
    } else {
        len = suffix.v.byteLength;
        if ((end - start) >= len) {
            index = new Sk.builtin.slice(end - len, end);
            val = self.mp$subscript(index);
            if (val.ob$eq(suffix) == Sk.builtin.bool.true$) {
                return Sk.builtin.bool.true$;
            }
        }
        return Sk.builtin.bool.false$;
    }
});

Sk.builtin.bytes.prototype["find"] = new Sk.builtin.func(function (self, sub, start, end) {
    var i;
    var len;
    var val;
    Sk.builtin.pyCheckArgsLen("find", arguments.length - 1, 1, 3);

    if (start === undefined) {
        start = 0;
    } else {
        if (!(start instanceof Sk.builtin.int_)) {
            throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
        }
        start = start.v;
        if (start < 0) {
            start = 0;
        }
    }
    if (end === undefined) {
        end = self.v.byteLength;
    } else {
        if (!(end instanceof Sk.builtin.int_)) {
            throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
        }
        end = end.v;
        if (end > self.v.byteLength) {
            end = self.v.byteLength;
        }
    }
    if (sub instanceof Sk.builtin.int_) {
        for (i = start; i < end; i++) {
            if (self.v.getUint8(i) == sub.v) {
                return new Sk.builtin.int_(i);
            }
        }
        return new Sk.builtin.int_(-1);
    } else if (sub instanceof Sk.builtin.bytes) {
        len = sub.v.byteLength;
        while (start + len <= end) {
            i = new Sk.builtin.slice(start, start + len);
            val = self.mp$subscript(i);
            if (val.ob$eq(sub) == Sk.builtin.bool.true$) {
                return new Sk.builtin.int_(start);
            }
            start++;
        }
        return new Sk.builtin.int_(-1);
    }
    throw new Sk.builtin.TypeError("argument should be integer or bytes-like object, not '" + Sk.abstr.typeName(sub) + "'");
});

Sk.builtin.bytes.prototype["index"] = new Sk.builtin.func(function (self, sub, start, end) {
    var i;
    var len;
    var val;
    Sk.builtin.pyCheckArgsLen("index", arguments.length - 1, 1, 3);

    if (start === undefined) {
        start = 0;
    } else {
        if (!(start instanceof Sk.builtin.int_)) {
            throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
        }
        start = start.v;
        if (start < 0) {
            start = 0;
        }
    }
    if (end === undefined) {
        end = self.v.byteLength;
    } else {
        if (!(end instanceof Sk.builtin.int_)) {
            throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
        }
        end = end.v;
        if (end > self.v.byteLength) {
            end = self.v.byteLength;
        }
    }
    if (sub instanceof Sk.builtin.int_) {
        for (i = start; i < end; i++) {
            if (self.v.getUint8(i) == sub.v) {
                return new Sk.builtin.int_(i);
            }
        }
        throw new Sk.builtin.ValueError("subsection not found");
    } else if (sub instanceof Sk.builtin.bytes) {
        len = sub.v.byteLength;
        while (start + len <= end) {
            i = new Sk.builtin.slice(start, start + len);
            val = self.mp$subscript(i);
            if (val.ob$eq(sub) == Sk.builtin.bool.true$) {
                return new Sk.builtin.int_(start);
            }
            start++;
        }
        throw new Sk.builtin.ValueError("subsection not found");
    }
    throw new Sk.builtin.TypeError("argument should be integer or bytes-like object, not '" + Sk.abstr.typeName(sub) + "'");
    
});

Sk.builtin.bytes.prototype["join"] = new Sk.builtin.func(function (self, iterable) {
    var final;
    var i;
    var sep;
    var iter;
    var item;
    Sk.builtin.pyCheckArgsLen("join", arguments.length - 1, 1, 1);
    if (!(Sk.builtin.checkIterable(iterable))) {
        throw Sk.builtin.TypeError("can only join an iterable");
    }
    final = [];
    sep = [];
    for (i = 0; i < self.v.byteLength; i++) {
        sep.push(new Sk.builtin.int_(self.v.getUint8(i)));
    }
    i = 0;
    for (iter = Sk.abstr.iter(iterable), item = iter.tp$iternext();
        item !== undefined;
        item = iter.tp$iternext()) {
        if (!(item instanceof Sk.builtin.bytes)) {
            throw new Sk.builtin.TypeError("sequence item " + i.toString() + ": expected a bytes-like object, " + Sk.abstr.typeName(item) + " found");
        }
        if (final.length > 0) {
            final = final.concat(sep);
        }
        for (i = 0; i < item.v.byteLength; i++) {
            final.push(new Sk.builtin.int_(item.v.getUint8(i)));
        }
        i++;
    }
    return new Sk.builtin.bytes(new Sk.builtin.list(final));
});

Sk.builtin.bytes.prototype["maketrans"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("maketrans() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["partition"] = new Sk.builtin.func(function (self, sep) {
    var final1;
    var final2;
    var final3;
    var idx;
    var index;
    var val;
    var len;
    var i;
    var zero;
    var empty1;
    var empty2;
    Sk.builtin.pyCheckArgsLen("partition", arguments.length - 1, 1, 1);
    if (!(sep instanceof Sk.builtin.bytes)) {
        throw new Sk.builtin.TypeError("a bytes-like object is required, not '" +  Sk.abstr.typeName(sep) + "'");
    }
    len = sep.v.byteLength;
    final1 = [];
    final2 = [];
    final3 = [];
    i = 0;
    while (i + len <= self.v.byteLength) {
        index = new Sk.builtin.slice(i, i + len);
        val = self.mp$subscript(index);
        if (val.ob$eq(sep) == Sk.builtin.bool.true$) {
            for (idx = 0; idx < sep.v.byteLength; idx++) {
                val = sep.v.getUint8(idx);
                val = new Sk.builtin.int_(val);
                final2.push(val);
            }
            for (idx = i + len; idx < self.v.byteLength; idx++) {
                val = self.v.getUint8(idx);
                val = new Sk.builtin.int_(val);
                final3.push(val);
            }
            break;
        } else if (self.v.byteLength - i == sep.v.byteLength) {
            for (idx = i; idx < self.v.byteLength; idx++) {
                val = self.v.getUint8(idx);
                val = new Sk.builtin.int_(val);
                final1.push(val);
            }
            final1 = new Sk.builtin.bytes(new Sk.builtin.list(final1));
            zero = new Sk.builtin.int_(0);
            empty1 = new Sk.builtin.bytes(zero);
            empty2 = new Sk.builtin.bytes(zero);
            return new Sk.builtin.tuple([final1, empty1, empty2]);
        } else {
            val = self.v.getUint8(i);
            val = new Sk.builtin.int_(val);
            final1.push(val);
            i++;
        } 
    }
    final1 = new Sk.builtin.bytes(new Sk.builtin.list(final1));
    final2 = new Sk.builtin.bytes(new Sk.builtin.list(final2));
    final3 = new Sk.builtin.bytes(new Sk.builtin.list(final3));

    return new Sk.builtin.tuple([final1, final2, final3]);
});

Sk.builtin.bytes.prototype["replace"] = new Sk.builtin.func(function (self, old, repl, count) {
    var final;
    var len;
    var i;
    var sep;
    var tot;
    var idx;
    var index;
    var val;
    Sk.builtin.pyCheckArgsLen("replace", arguments.length - 1, 2, 3);
    if (!(old instanceof Sk.builtin.bytes)) {
        throw new Sk.builtin.TypeError("a bytes-like object is required, not '" + Sk.abstr.typeName(old) + "'");
    }
    if (!(repl instanceof Sk.builtin.bytes)) {
        throw new Sk.builtin.TypeError("a bytes-like object is required, not '" + Sk.abstr.typeName(repl) + "'");
    }
    if (count !== undefined && (!(count instanceof Sk.builtin.int_))) {
        throw new  Sk.builtin.TypeError("'" + Sk.abstr.typeName(count) + "' " + "object cannot be interpreted as an integer");
    }
    final = [];
    sep = [];
    for (i = 0; i < repl.v.byteLength; i++) {
        sep.push(new Sk.builtin.int_(repl.v.getUint8(i)));
    }
    len = old.v.byteLength;
    i = 0;
    tot = 0;
    while (i + len <= self.v.byteLength) {
        index = new Sk.builtin.slice(i, i + len);
        val = self.mp$subscript(index);
        if ((val.ob$eq(old) == Sk.builtin.bool.true$) && (count === undefined || tot < count.v)) {
            final = final.concat(sep);
            i += len;
            tot++;
        } else {
            final.push(new Sk.builtin.int_(self.v.getUint8(i)));
            i++;
        }
        if (i > self.v.byteLength - len) {
            for (idx = i; i < self.v.byteLength; i++) {
                final.push(new Sk.builtin.int_(self.v.getUint8(idx)));
            }
            break;
        }
    }
    final = new Sk.builtin.list(final);
    return new Sk.builtin.bytes(final);

});

Sk.builtin.bytes.prototype["rfind"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("rfind() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["rindex"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("rindex() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["rpartition"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("rpartition() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["startswith"] = new Sk.builtin.func(function (self, prefix, start, end) {
    var len;
    var iter;
    var item;
    var index;
    var val;
    var negstart;
    Sk.builtin.pyCheckArgsLen("startswith", arguments.length - 1, 1, 3);
    if (!(prefix instanceof Sk.builtin.bytes || prefix instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("startswith first arg must be bytes or a tuple of bytes, not " + Sk.abstr.typeName(prefix));
    }
    if (start === undefined) {
        start = 0;
    } else {
        if (!(start instanceof Sk.builtin.int_)) {
            throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
        }
        start = start.v;
        if (start + self.v.byteLength < 0) {
            return Sk.builtin.bool.false$;
        }
    }
    if (end === undefined) {
        end = self.v.byteLength;
    } else {
        if (!(end instanceof Sk.builtin.int_)) {
            throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
        }
        end = end.v;
        if (end > self.v.byteLength) {
            end = self.v.byteLength;
        }
    }
    negstart = function (idx, object, pref) {
        var i;
        var j;
        var val1;
        var val2;
        for (i = idx, j = 0; j < pref.v.byteLength; i++, j++) {
            if (i < 0) {
                val1 = object.v.getUint8(i + object.v.byteLength);
            } else {
                val1 = object.v.getUint8(i);
            }
            val2 = pref.v.getUint8(j);
            if (val1 != val2) {
                return Sk.builtin.bool.false$;
            }
        }
        return Sk.builtin.bool.true$;
    };
    if (prefix instanceof Sk.builtin.tuple) {
        for (iter = Sk.abstr.iter(prefix), item = iter.tp$iternext();
            item !== undefined;
            item = iter.tp$iternext()) {
            if (!(item instanceof Sk.builtin.bytes)) {
                throw new Sk.builtin.TypeError("a bytes-like object is required, not '" + Sk.abstr.typeName(item) + "'");
            }
            len = item.v.byteLength;
            if (start + len <= end) {
                if (start < 0) {
                    if (negstart(start, self, prefix) == Sk.builtin.bool.true$) {
                        return Sk.builtin.bool.true$;
                    }
                }
                index = new Sk.builtin.slice(start, start + len);
                val = self.mp$subscript(index);
                if (val.ob$eq(item) == Sk.builtin.bool.true$) {
                    return Sk.builtin.bool.true$;
                }
            }
        }
        return Sk.builtin.bool.false$;
    } else {
        len = prefix.v.byteLength;
        if (start + len <= end) {
            if (start < 0) {
                return negstart(start, self, prefix);
            }
            index = new Sk.builtin.slice(start, start + len);
            val = self.mp$subscript(index);
            if (val.ob$eq(prefix) == Sk.builtin.bool.true$) {
                return Sk.builtin.bool.true$;
            }
        }
        return Sk.builtin.bool.false$;
    }
});

Sk.builtin.bytes.prototype["translate"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("translate() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["center"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("center() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["ljust"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("ljust() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["lstrip"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("lstrip() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["rjust"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("rjust() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["rsplit"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("rsplit() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["rstrip"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("rstrip() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["split"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("split() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["strip"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("strip() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["strip"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("strip() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["capitalize"] = new Sk.builtin.func(function (self) {
    var final;
    var i;
    var val;
    Sk.builtin.pyCheckArgsLen("capitalize", arguments.length - 1, 0, 0);

    if (self.v.byteLength == 0) {
        return new Sk.builtin.bytes(new Sk.builtin.int_(0));
    }
    final = [];
    if (self.v.getUint8(0) >= 97 && self.v.getUint8(0) <= 122) {
        val = new Sk.builtin.int_(self.v.getUint8(0) - 32);
    } else {
        val = val = new Sk.builtin.int_(self.v.getUint8(0));
    }
    final.push(val);
    for (i = 1; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (val >= 65 && val <= 90) {
            val = new Sk.builtin.int_(val + 32);
            final.push(val);
        } else {
            val = new Sk.builtin.int_(val);
            final.push(val);
        }
    }
    final = new Sk.builtin.list(final);
    return new Sk.builtin.bytes(final);
});

Sk.builtin.bytes.prototype["expandtabs"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("expandtabs() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["isalnum"] = new Sk.builtin.func(function (self) {
    var i;
    var val;
    Sk.builtin.pyCheckArgsLen("isalnum", arguments.length - 1, 0, 0);
    if (self.v.byteLength == 0) {
        return Sk.builtin.bool.false$;
    }
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (!((val >= 48 && val <= 57) || (val >= 65 && val <= 90) || (val >= 97 && val <= 122))) {
            return Sk.builtin.bool.false$;
        }
    }
    return Sk.builtin.bool.true$;

});

Sk.builtin.bytes.prototype["isalpha"] = new Sk.builtin.func(function (self) {
    var i;
    var val;
    Sk.builtin.pyCheckArgsLen("isalpha", arguments.length - 1, 0, 0);
    if (self.v.byteLength == 0) {
        return Sk.builtin.bool.false$;
    }
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (!((val >= 65 && val <= 90) || (val >= 97&& val <= 122))) {
            return Sk.builtin.bool.false$;
        }
    }
    return Sk.builtin.bool.true$;

});

Sk.builtin.bytes.prototype["isascii"] = new Sk.builtin.func(function (self) {
    var i;
    var val;
    Sk.builtin.pyCheckArgsLen("isascii", arguments.length - 1, 0, 0);
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (!(val >= 0 && val < 128)) {
            return Sk.builtin.bool.false$;
        }
    }
    return Sk.builtin.bool.true$;

});

Sk.builtin.bytes.prototype["isdigit"] = new Sk.builtin.func(function (self) {
    var i;
    var val;
    Sk.builtin.pyCheckArgsLen("isdigit", arguments.length - 1, 0, 0);
    if (self.v.byteLength == 0) {
        return Sk.builtin.bool.false$;
    }
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (!(val >= 48 && val < 58)) {
            return Sk.builtin.bool.false$;
        }
    }
    return Sk.builtin.bool.true$;

});

Sk.builtin.bytes.prototype["islower"] = new Sk.builtin.func(function (self) {
    var i;
    var val;
    var flag;
    Sk.builtin.pyCheckArgsLen("islower", arguments.length - 1, 0, 0);
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (val >= 65 && val <= 90) {
            return Sk.builtin.bool.false$;
        }
        if (!(flag) && (val >= 97 && val <= 122)) {
            flag = true;
        }
    }
    if (flag) {
        return Sk.builtin.bool.true$;
    }
    return Sk.builtin.bool.false$;

});

Sk.builtin.bytes.prototype["isspace"] = new Sk.builtin.func(function (self) {
    var i;
    var val;
    var flag;
    Sk.builtin.pyCheckArgsLen("isspace", arguments.length - 1, 0, 0);
    if (self.v.byteLength == 0) {
        return Sk.builtin.bool.false$;
    }
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (!(val == 32 || val == 9 || val == 10 || val == 13 || val == 11 || val == 12)) {
            return Sk.builtin.bool.false$;
        }
    }
    return Sk.builtin.bool.true$;

});

Sk.builtin.bytes.prototype["istitle"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("istitle() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["isupper"] = new Sk.builtin.func(function (self) {
    var i;
    var val;
    var flag;
    Sk.builtin.pyCheckArgsLen("isupper", arguments.length - 1, 0, 0);
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (!(flag) && (val >= 65 && val <= 90)) {
            flag = true;
        }
        if (val >= 97 && val <= 122) {
            return Sk.builtin.bool.false$;
        }
    }
    if (flag) {
        return Sk.builtin.bool.true$;
    }

    return Sk.builtin.bool.false$;
});

Sk.builtin.bytes.prototype["lower"] = new Sk.builtin.func(function (self) {
    var i;
    var val;
    var final;
    Sk.builtin.pyCheckArgsLen("lower", arguments.length - 1, 0, 0);
    final = [];
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (val >= 65 && val <= 90) {
            val = new Sk.builtin.int_(val + 32);
            final.push(val);
        } else {
            val = new Sk.builtin.int_(val);
            final.push(val);
        }
    }
    final = new Sk.builtin.list(final);
    return new Sk.builtin.bytes(final);
});

Sk.builtin.bytes.prototype["splitlines"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("splitlines() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["swapcase"] = new Sk.builtin.func(function (self) {
    var i;
    var val;
    var final;
    Sk.builtin.pyCheckArgsLen("swapcase", arguments.length - 1, 0, 0);
    final = [];
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (val >= 65 && val <= 90) {
            val = new Sk.builtin.int_(val + 32);
            final.push(val);
        } else if (val >= 97 && val <= 122) {
            val = new Sk.builtin.int_(val - 32);
            final.push(val);
        } else {
            val = new Sk.builtin.int_(val);
            final.push(val);
        }
    }
    final = new Sk.builtin.list(final);
    return new Sk.builtin.bytes(final);
});

Sk.builtin.bytes.prototype["title"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("title() bytes method not implemented in Skulpt"); 
});

Sk.builtin.bytes.prototype["upper"] = new Sk.builtin.func(function (self) {
    var i;
    var val;
    var final;
    Sk.builtin.pyCheckArgsLen("upper", arguments.length - 1, 0, 0);
    final = [];
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (val >= 97 && val <= 122) {
            val = new Sk.builtin.int_(val - 32);
            final.push(val);
        } else {
            val = new Sk.builtin.int_(val);
            final.push(val);
        }
    }
    final = new Sk.builtin.list(final);
    return new Sk.builtin.bytes(final);
});

Sk.builtin.bytes.prototype["zfill"] = new Sk.builtin.func(function (self, width) {
    var fill;
    var final;
    var i;
    var val;
    Sk.builtin.pyCheckArgsLen("zfill", arguments.length - 1, 1, 1);
    if (!(width instanceof Sk.builtin.int_)) {
        throw new Sk.builtin.TypeError( "'" + Sk.abstr.typeName(width) + "' object cannot be interpreted as an integer");
    }
    if (width.v <= self.v.byteLength) {
        return self;
    }
    final = [];
    fill = width.v - self.v.byteLength;
    if (self.v.getUint8(0) == 43 || self.v.getUint8(0) == 45) {
        val = new Sk.builtin.int_(self.v.getUint8(0));
        final.push(val);
        for (i = 0; i < fill; i++) {
            final.push(new Sk.builtin.int_(48));
        }
        for (i = 1; i < self.v.byteLength; i++) {
            val = new Sk.builtin.int_(self.v.getUint8(i));
            final.push(val);
        }
    } else {
        for (i = 0; i < fill; i++) {
            final.push(new Sk.builtin.int_(48));
        }
        for (i = 0; i < self.v.byteLength; i++) {
            val = new Sk.builtin.int_(self.v.getUint8(i));
            final.push(val);
        }
    }
    final = new Sk.builtin.list(final);
    return new Sk.builtin.bytes(final);
});

Sk.builtin.bytes.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 0, 0, true, false);
    return new Sk.builtin.bytes_iter_(self);
});

Sk.builtin.bytes.prototype.tp$iter = function () {
    return new Sk.builtin.bytes_iter_(this);
};

/**
 * @constructor
 * @param {Object} bts
 */
Sk.builtin.bytes_iter_ = function (bts) {
    if (!(this instanceof Sk.builtin.bytes_iter_)) {
        return new Sk.builtin.bytes_iter_(bts);
    }
    this.$index = 0;
    this.sq$length = bts.v.byteLength;
    this.tp$iter = this;
    this.tp$iternext = function () {
        if (this.$index >= this.sq$length) {
            return undefined;
        }
        return new Sk.builtin.int_(bts.v.getUint8(this.$index++));
    };
    this.$r = function () {
        return new Sk.builtin.str("bytesiterator");
    };
    return this;
};

Sk.abstr.setUpInheritance("bytesiterator", Sk.builtin.bytes_iter_, Sk.builtin.object);

Sk.builtin.bytes_iter_.prototype.__class__ = Sk.builtin.bytes_iter_;

Sk.builtin.bytes_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    return self;
});

Sk.builtin.bytes_iter_.prototype.next$ = function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
};


Sk.exportSymbol("Sk.builtin.bytes", Sk.builtin.bytes);
