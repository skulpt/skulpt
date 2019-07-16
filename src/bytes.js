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

    if (errors !== undefined && errors.v !== "strict" && errors.v !== "ignore" && errors.v !== "replace") {
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
                            if (errors === undefined || errors.v == "strict") {
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
            throw new Sk.builtin.TypeError("bytes() argument 2 must be str, not int");
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
                i = this.v.length + i;
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
    var buffer;
    Sk.builtin.pyCheckArgsLen("decode", arguments.length - 1, 1, 2);

    if (errors !== undefined && errors.v !== "strict" && errors.v !== "ignore" && errors.v !== "replace") {
        throw new Sk.builtin.NotImplementedError("'" + errors.v + "' error handling not implemented in Skulpt");
    }

    if (encoding === undefined) {
        encoding = new Sk.builtin.str("utf-8");
    }

    if (errors === undefined) {
        errors = new Sk.builtin.str("strict");
    }
    if (encoding.v != "ascii" && encoding.v !== "utf-8") {
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
    var val1;
    var len;
    if (string instanceof Sk.builtin.bytes) {
        Sk.builtin.pyCheckArgsLen("fromhex", arguments.length, 1, 2);
        string = arguments[1];
    } else {
        Sk.builtin.pyCheckArgsLen("fromhex", arguments.length, 1, 1);
    }
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

    if (string.v.length % 2 != 0) {
        string.v += "g";
    }
    len = (string.v.length) / 2;
    for (i = 0; i < len; i++) {
        if (checkhex(string.v[i*2]) && checkhex(string.v[i*2+1])) {
            val1 = string.v.slice(i*2, i*2 + 2);
            val1 = parseInt(val1, 16);
            final.push(new Sk.builtin.int_(val1));
        } else if (checkhex(string.v[i*2])) {
            throw new Sk.builtin.ValueError("non-hexadecimal number found in fromhex() arg at position " + (2*i + 1).toString());
        } else {
            throw new Sk.builtin.ValueError("non-hexadecimal number found in fromhex() arg at position " + (2*i).toString());
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
        end = end.v;
    }
    if (start === undefined) {
        start = 0;
    } else {
        start = start.v;
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
            if (val.ob$eq(sub).v == 1) {
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

Sk.builtin.bytes.prototype["endswith"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("endswith() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["find"] = new Sk.builtin.func(function (self, sub, start, end) {
    var i;
    var len;
    var val;
    Sk.builtin.pyCheckArgsLen("find", arguments.length - 1, 1, 3);

    if (start === undefined) {
        start = 0;
    } else {
        start = start.v;
    }
    if (end === undefined) {
        end = self.v.byteLength;
    } else {
        end = end.v;
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
        start = start.v;
    }
    if (end === undefined) {
        end = self.v.byteLength;
    } else {
        end = end.v;
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

Sk.builtin.bytes.prototype["join"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("join() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["maketrans"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("maketrans() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["partition"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("partition() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["replace"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("replace() bytes method not implemented in Skulpt");
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

Sk.builtin.bytes.prototype["startswith"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("startswith() bytes method not implemented in Skulpt");
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
