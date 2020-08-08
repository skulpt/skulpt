require("fastestsmallesttextencoderdecoder");

// Mapping from supported valid encodings to normalized encoding name
const supportedEncodings = {
    "utf": "utf-8",
    "utf8": "utf-8",
    "utf-8": "utf-8",
    "ascii": "ascii"
};

function normalizeEncoding(encoding) {
    const normalized = encoding.replace(/\s+/g, "").toLowerCase();
    const supported = supportedEncodings[normalized];
    if (supported === undefined) {
        return encoding;
    } else {
        return supported;
    }
}

// Stop gap until Uint8Array.from (or new Uint8Array(iterable)) gets wider support
// This only handles the simple case used in this file
function Uint8ArrayFromArray(source) {
    if (Uint8Array.from) {
        return Uint8Array.from(source);
    }

    const uarr = new Uint8Array(source.length);

    for (let idx = 0; idx < source.length; idx++) {
        uarr[idx] = source[idx];
    }

    return uarr;
}

/**
 * @constructor
 * @param {*} source
 * @param {Sk.builtin.str=} encoding
 * @param {Sk.builtin.str=} errors
 * @return {Sk.builtin.bytes}
 */

Sk.builtin.bytes = function (source, encoding, errors) {
    let arr;

    if (!(this instanceof Sk.builtin.bytes)) {
        return new Sk.builtin.bytes(...arguments);
    }
    Sk.builtin.pyCheckArgsLen("bytes", arguments.length, 0, 3);

    if (errors === undefined) {
        errors = "strict";
    } else if (!(errors instanceof Sk.builtin.str)) {
        throw new Sk.builtin.TypeError("bytes() argument 2 must be str, not " + Sk.abstr.typeName(errors));
    } else {
        errors = errors.v;
    }
    if (encoding === undefined) {
        encoding = Sk.builtin.str.$utf8;
    }
    if (!(errors === "strict" || errors === "ignore" || errors === "replace")) {
        throw new Sk.builtin.NotImplementedError("'" + errors + "' error handling not implemented in Skulpt");
    }
    if (arguments.length === 0) {
        return new Sk.builtin.bytes(0);
    }
    if (arguments.length === 1) {
        if (Sk.builtin.checkInt(source)) {
            source = Sk.builtin.asnum$(source);
            arr = new Uint8Array(source);
        } else if (source instanceof Sk.builtin.bytes) {
            return source;
        } else if (Array.isArray(source)) {
            // Internal fast path
            Sk.asserts.assert(source.every((x) => (x >= 0) && (x < 256)),
                              "Bad internal call to bytes with array object");
            arr = Uint8ArrayFromArray(source);
        } else if (source instanceof Uint8Array) {
            // Internal fast path
            arr = source;
        } else if ((Sk.builtin.checkIterable(source) && !(source instanceof Sk.builtin.str))) {
            const final = [];
            for (let iter = Sk.abstr.iter(source), item = iter.tp$iternext();
                item !== undefined;
                item = iter.tp$iternext()) {
                if (Sk.builtin.checkInt(item)) {
                    item = Sk.builtin.asnum$(item);
                    if (item >= 0 && item <= 256) {
                        final.push(item);
                    } else {
                        throw new Sk.builtin.ValueError("bytes must be in range(0, 256)");
                    }
                } else {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(item) + "' " + "object cannot be interpreted as an integer");
                }
            }
            arr = Uint8ArrayFromArray(final);
        } else if ((source instanceof Sk.builtin.str) || (typeof source === "string")) {
            throw new Sk.builtin.TypeError("string argument without an encoding");
        } else {
            throw new Sk.builtin.TypeError("cannot convert '" + Sk.abstr.typeName(source) + "' object into bytes");
        }
    } else if (arguments.length > 1) {
        if (encoding instanceof Sk.builtin.str) {
            if ((source instanceof Sk.builtin.str) || (typeof source === "string")){
                if (source instanceof Sk.builtin.str) {
                    source = source.$jsstr();
                }

                encoding = normalizeEncoding(encoding.$jsstr());
                if (encoding === "ascii") {
                    const data = [];
                    for (let i in source) {
                        const val = source[i].charCodeAt(0);

                        if (val < 0 || val > 127) {
                            if (errors === "strict") {
                                const hexval = makehexform(val);
                                throw new Sk.builtin.UnicodeEncodeError("'ascii' codec can't encode character '" + hexval + "' in position " + i + ": ordinal not in range(128)");
                            } else if (errors === "replace") {
                                data.push(63); // "?"
                            }
                        } else {
                            data.push(val);
                        }
                    }
                    arr = Uint8ArrayFromArray(data);
                } else if (encoding === "utf-8") {
                    arr = new TextEncoder().encode(source);
                } else {
                    throw new Sk.builtin.LookupError("unknown encoding: " + encoding.v);
                }
            } else {
                throw new Sk.builtin.TypeError("encoding without a string argument");
            }
        } else {
            throw new Sk.builtin.TypeError("bytes() argument 2 must be str, not " + Sk.abstr.typeName(encoding));
        }
    }

    this.v = arr;
    this.__class__ = Sk.builtin.bytes;

    return this;
};

function makehexform(num) {
    var leading;
    if (num <= 265) {
        leading = "\\x";
    } else {
        leading = "\\u";
    }
    num = num.toString(16);
    if (num.length === 3) {
        num = num.slice(1, 3);
    }
    if (num.length === 1) {
        num = leading + "0" + num;
    } else {
        num = leading + num;
    }
    return num;
};

Sk.abstr.setUpInheritance("bytes", Sk.builtin.bytes, Sk.builtin.seqtype);

Sk.builtin.bytes.prototype["$r"] = function () {
    var ret;
    var i;
    var num;
    ret = "";
    for (i = 0; i < this.v.byteLength; i++) {
        num = this.v[i];
        if ((num < 9) || (num > 10 && num < 13) || (num > 13 && num < 32) || (num > 126)) {
            ret += makehexform(num);
        } else if (num === 9 || num === 10 || num === 13 || num === 39 || num === 92) {
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
                case 39:
                    ret += "\\'";
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
            return new Sk.builtin.int_(this.v[i]);
        }
    } else if (index instanceof Sk.builtin.slice) {
        ret = [];
        index.sssiter$(this.v.byteLength, (i) => {
            ret.push(this.v[i]);
        });
        return new Sk.builtin.bytes(ret);
    }

    throw new Sk.builtin.TypeError("byte indices must be integers, not " + Sk.abstr.typeName(index));
};

Sk.builtin.bytes.prototype.ob$eq = function (other) {
    if (this === other) {
        return Sk.builtin.bool.true$;
    } else if (!(other instanceof Sk.builtin.bytes)) {
        return Sk.builtin.NotImplemented.NotImplemented$;
    } else if (this.v.byteLength != other.v.byteLength) {
        return Sk.builtin.bool.false$;
    }

    for (let i = 0; i < this.v.byteLength; i++) {
        if (this.v[i] != other.v[i]) {
            return Sk.builtin.bool.false$;
        }
    }

    return Sk.builtin.bool.true$;
};

Sk.builtin.bytes.prototype.ob$ne = function (other) {
    const ret = this.ob$eq(other);
    if (ret === Sk.builtin.NotImplemented.NotImplemented$) {
        return ret;
    }
    return Sk.misceval.isTrue(ret) ? Sk.builtin.bool.false$ : Sk.builtin.bool.true$;
};

Sk.builtin.bytes.prototype.sq$length = function () {
    return this.v.byteLength;
};

Sk.builtin.bytes.prototype.bytes_copy_ = function () {
    var i;
    var final;
    final = [];
    for (i = 0; i < this.v.byteLength; i++) {
        final.push(this.v[i]);
    }
    return new Sk.builtin.bytes(final);
};
Sk.builtin.bytes.prototype.sq$concat = function (other) {
    var i;
    var lis;
    if (!(other instanceof Sk.builtin.bytes)) {
        throw new Sk.builtin.TypeError("can't concat " + Sk.abstr.typeName(other) + " to bytes");
    }
    lis = [];
    for (i = 0; i < this.v.byteLength; i++) {
        lis.push(this.v[i]);
    }
    for (i = 0; i < other.v.byteLength; i++) {
        lis.push(other.v[i]);
    }
    return new Sk.builtin.bytes(lis);
};
Sk.builtin.bytes.prototype.nb$add = Sk.builtin.bytes.prototype.sq$concat;
Sk.builtin.bytes.prototype.nb$inplace_add = Sk.builtin.bytes.prototype.sq$concat;

Sk.builtin.bytes.prototype.sq$repeat = function (n) {
    var i;
    var j;
    var ret;
    if (!(n instanceof Sk.builtin.int_)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }
    ret = [];
    for (j = 0; j < n.v; j++) {
        for (i = 0; i < this.v.byteLength; i++) {
            ret.push(this.v[i]);
        }
    }
    return new Sk.builtin.bytes(ret);
};
Sk.builtin.bytes.prototype.nb$multiply = Sk.builtin.bytes.prototype.sq$repeat;
Sk.builtin.bytes.prototype.nb$inplace_multiply = Sk.builtin.bytes.prototype.sq$repeat;

Sk.builtin.bytes.prototype.sq$contains = function (item) {
    if (Sk.builtin.checkInt(item)) {
        const val = Sk.builtin.asnum$(item);
        if (val < 0 || val > 255) {
            throw new Sk.builtin.ValueError("byte must be in range(0, 256)");
        }

        return this.v.indexOf(val) !== -1;
    } else if (!(item instanceof Sk.builtin.bytes)) {
        throw new Sk.builtin.TypeError("a bytes-like object is required, not " + Sk.abstr.typeName(item));
    }

    if (item.v.byteLength === 0) {
        return true;
    } else if (item.v.byteLength === 1) {
        return this.v.indexOf(item.v[0]) !== -1;
    } else {
        // Currently can't test for array/subarray equality with typed arrays
        let start = 0;
        while (start < this.v.byteLength) {
            const idx = this.v.indexOf(item.v[0], start);
            if (idx === -1) {
                break;
            }

            let match = true;
            for (let j = 0; j < item.v.byteLength; j++) {
                if (this.v[idx + j] !== item.v[j]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                return true;
            }
            start = idx + 1;
        }
    }

    return false;
};

Sk.builtin.bytes.prototype.$decode = function (self, encoding, errors) {
    var i;
    var val;
    var final;
    Sk.builtin.pyCheckArgsLen("decode", arguments.length - 1, 1, 2);

    if (encoding === undefined) {
        encoding = "utf-8";
    } else if (!(encoding instanceof Sk.builtin.str)) {
        throw new Sk.builtin.TypeError("decode() argument 1 must be str, not " + Sk.abstr.typeName(encoding));
    } else {
        encoding = encoding.v;
    }
    encoding = normalizeEncoding(encoding);

    if (errors === undefined) {
        errors = "strict";
    } else if (!(errors instanceof Sk.builtin.str)) {
        throw new Sk.builtin.TypeError("decode() argument 2 must be str, not " + Sk.abstr.typeName(errors));
    } else {
        errors = errors.v;
    }

    if (!(errors === "strict" || errors === "ignore" || errors === "replace")) {
        throw new Sk.builtin.NotImplementedError("'" + errors + "' error handling not implemented in Skulpt");
    }

    if (!(encoding === "ascii" || encoding === "utf-8")) {
        throw new Sk.builtin.LookupError("unknown encoding: " + encoding.v);
    }

    if (encoding === "ascii") {
        final = "";
        for (i = 0; i < self.v.byteLength; i++) {
            val = self.v[i];
            if (val > 127) {
                if (errors === "strict") {
                    val = val.toString(16);
                    throw new Sk.builtin.UnicodeDecodeError("'ascii' codec can't decode byte 0x" + val + " in position " + i.toString() + ": ordinal not in range(128)");
                } else if (errors === "replace") {
                    final += String.fromCharCode(65533);
                }
            } else {
                final += String.fromCharCode(val);
            }
        }
    } else {
        const string = new TextDecoder(encoding).decode(self.v.buffer);
        if (errors === "replace") {
            return new Sk.builtin.str(string);
        }
        final = "";
        for (i in string) {
            if (string[i].charCodeAt(0) === 65533) {
                if (errors === "strict") {
                    val = self.v[i];
                    val = val.toString(16);
                    throw new Sk.builtin.UnicodeDecodeError("'utf-8' codec can't decode byte 0x" + val + " in position " + i.toString() + ": invalid start byte");
                }
            } else {
                final += string[i];
            }
        }
    }
    return new Sk.builtin.str(final);
};

Sk.builtin.bytes.prototype["decode"] = new Sk.builtin.func(Sk.builtin.bytes.prototype.$decode);

Sk.builtin.bytes.prototype["fromhex"] = new Sk.builtin.func(function (string) {
    var final;
    var checkhex;
    var val1;
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
        if (code === 9 || code === 10 || code === 11 || code === 12 || code === 13 || code === 32 || code === 133) {
            return true;
        } else {
            return false;
        }
    };
    i = 0;
    while (i < string.v.length) {
        char = string.v.charAt(i);
        if (checkhex(char)) {
            if (i + 1 < string.v.length) {
                if (checkhex(string.v.charAt(i+1))) {
                    val1 = string.v.slice(i, i + 2);
                    val1 = parseInt(val1, 16);
                    final.push(val1);
                    i += 2;
                } else {
                    throw new Sk.builtin.ValueError("non-hexadecimal number found in fromhex() arg at position " + (i+1).toString());
                }
            } else {
                throw new Sk.builtin.ValueError("non-hexadecimal number found in fromhex() arg at position " + (i).toString());
            }
        } else if (checkspace(char)) {
            i++;
        } else {
            throw new Sk.builtin.ValueError("non-hexadecimal number found in fromhex() arg at position " + (i).toString());
        }
    }

    return new Sk.builtin.bytes(final);
});

Sk.builtin.bytes.prototype["hex"] = new Sk.builtin.func(function (self) {
    var final;
    var val;
    var i;
    Sk.builtin.pyCheckArgsLen("hex", arguments.length - 1, 0, 0);
    final = "";
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v[i];
        val = val.toString(16);
        if (val.length === 1) {
            val = "0" + val;
        }
        final += val;
    }
    return new Sk.builtin.str(final);
});

function indices(self, start, end) {
    if (start === undefined) {
        start = 0;
    } else if (!Sk.misceval.isIndex(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    } else {
        start = Sk.misceval.asIndex(start);
        if (start + self.v.byteLength < 0) {
            start = 0 - self.v.byteLength;
        }
        if (start < 0) {
            start += self.v.byteLength;
        }
    }
    if (end === undefined) {
        end = self.v.byteLength;
    } else if (!Sk.misceval.isIndex(end)) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None or have an __index__ method");
    } else {
        end = Sk.misceval.asIndex(end);
        if (end > self.v.byteLength) {
            end = self.v.byteLength;
        }
        if (end < 0) {
            end += self.v.byteLength;
        }
    }

    return {
        startidx: start,
        endidx: end
    };
}

Sk.builtin.bytes.prototype["count"] = new Sk.builtin.func(function (self, sub, start, end) {
    var count;
    var i;
    var len;
    var val;
    var val1;
    var index;
    Sk.builtin.pyCheckArgsLen("count", arguments.length - 1, 1, 3);

    let { startidx, endidx } = indices(self, start, end);

    count = 0;
    if (sub instanceof Sk.builtin.int_) {
        for (i = startidx; i < endidx; i++) {
            if (self.v[i] === sub.v) {
                count++;
            }
        }
    } else if (sub instanceof Sk.builtin.bytes) {
        len = sub.v.byteLength;
        while (startidx + len <= endidx) {
            index = new Sk.builtin.slice(startidx, startidx + len);
            val = self.mp$subscript(index);
            if (val.ob$eq(sub) === Sk.builtin.bool.true$) {
                count += 1;
                startidx += len;
            } else {
                startidx += 1;
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
    var negend;
    Sk.builtin.pyCheckArgsLen("endswith", arguments.length - 1, 1, 3);
    if (!(suffix instanceof Sk.builtin.bytes || suffix instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("endswith first arg must be bytes or a tuple of bytes, not " + Sk.abstr.typeName(suffix));
    }

    let { startidx, endidx } = indices(self, start, end);

    negend = function (idx, object, suff) {
        var i;
        var j;
        var val1;
        var val2;
        for (i = idx - suff.v.byteLength, j = 0; j < suff.v.byteLength; i++, j++) {
            if (i < 0) {
                val1 = object.v[i + object.v.byteLength];
            } else {
                val1 = object.v[i];
            }
            val2 = suff.v[j];
            if (val1 != val2) {
                return Sk.builtin.bool.$false;
            }
        }
        return Sk.builtin.bool.$true;
    };

    if (suffix instanceof Sk.builtin.tuple) {
        for (iter = Sk.abstr.iter(suffix), item = iter.tp$iternext();
            item !== undefined;
            item = iter.tp$iternext()) {
            if (!(item instanceof Sk.builtin.bytes)) {
                throw new Sk.builtin.TypeError("a bytes-like object is required, not '" + Sk.abstr.typeName(item) + "'");
            }
            len = item.v.byteLength;
            if ((endidx - startidx) >= len) {
                if (endidx < 0) {
                    if (negend(endidx, self, item) === Sk.builtin.bool.$true) {
                        return Sk.builtin.bool.$true;
                    }
                }
                index = new Sk.builtin.slice(endidx - len, endidx);
                val = self.mp$subscript(index);
                if (val.ob$eq(item) === Sk.builtin.bool.true$) {
                    return Sk.builtin.bool.true$;
                }
            }
        }
        return Sk.builtin.bool.false$;
    } else {
        len = suffix.v.byteLength;
        if ((endidx - startidx) >= len) {
            if (endidx < 0) {
                return (negend(endidx, self, suffix));
            }
            index = new Sk.builtin.slice(endidx - len, endidx);
            val = self.mp$subscript(index);
            if (val.ob$eq(suffix) === Sk.builtin.bool.true$) {
                return Sk.builtin.bool.true$;
            }
        }
        return Sk.builtin.bool.false$;
    }
});

Sk.builtin.bytes.prototype.find_item_ = function (sub, start, end) {
    var i;
    var len;
    var val;

    let { startidx, endidx } = indices(this, start, end);

    if (sub instanceof Sk.builtin.int_) {
        for (i = startidx; i < endidx; i++) {
            if (this.v[i] === sub.v) {
                return new Sk.builtin.int_(i);
            }
        }
        return new Sk.builtin.int_(-1);
    } else if (sub instanceof Sk.builtin.bytes) {
        len = sub.v.byteLength;
        while (startidx + len <= endidx) {
            i = new Sk.builtin.slice(startidx, startidx + len);
            val = this.mp$subscript(i);
            if (val.ob$eq(sub) === Sk.builtin.bool.true$) {
                return new Sk.builtin.int_(startidx);
            }
            startidx++;
        }
        return new Sk.builtin.int_(-1);
    } else {
        throw new Sk.builtin.TypeError("argument should be integer or bytes-like object, not '" + Sk.abstr.typeName(sub) + "'");
    }
};

Sk.builtin.bytes.prototype["find"] = new Sk.builtin.func(function (self, sub, start, end) {
    Sk.builtin.pyCheckArgsLen("find", arguments.length - 1, 1, 3);

    return Sk.builtin.bytes.prototype.find_item_.call(self, sub, start, end);
});

Sk.builtin.bytes.prototype["index"] = new Sk.builtin.func(function (self, sub, start, end) {
    var val;
    Sk.builtin.pyCheckArgsLen("index", arguments.length - 1, 1, 3);

    val = Sk.builtin.bytes.prototype.find_item_.call(self, sub, start, end);

    if (val.v === -1) {
        throw new Sk.builtin.ValueError("subsection not found");
    }
    return val;
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
        sep.push(self.v[i]);
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
            final.push(item.v[i]);
        }
        i++;
    }
    return new Sk.builtin.bytes(final);
});

Sk.builtin.bytes.prototype["maketrans"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("maketrans() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["partition"] = new Sk.builtin.func(function (self, sep) {
    var final1;
    var final2;
    var final3;
    var val;
    var index;
    var len;
    Sk.builtin.pyCheckArgsLen("partition", arguments.length - 1, 1, 1);
    if (!(sep instanceof Sk.builtin.bytes)) {
        throw new Sk.builtin.TypeError("a bytes-like object is required, not '" +  Sk.abstr.typeName(sep) + "'");
    }

    val = Sk.builtin.bytes.prototype.find_item_.call(self, sep);
    val = val.v;
    if (val === -1) {
        final1 = self;
        final2 = new Sk.builtin.bytes(0);
        final3 = new Sk.builtin.bytes(0);
    } else {
        final1 = new Sk.builtin.bytes(self.v.subarray(0, val));
        final2 = new Sk.builtin.bytes(self.v.subarray(val, val + sep.v.byteLength));
        final3 = new Sk.builtin.bytes(self.v.subarray(val + sep.v.byteLength, self.v.byteLength));
    }
    len = sep.v.byteLength;

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
        sep.push(repl.v[i]);
    }
    len = old.v.byteLength;
    i = 0;
    tot = 0;
    while (i + len <= self.v.byteLength) {
        index = new Sk.builtin.slice(i, i + len);
        val = self.mp$subscript(index);
        if ((val.ob$eq(old) === Sk.builtin.bool.true$) && (count === undefined || tot < count.v)) {
            final = final.concat(sep);
            i += len;
            tot++;
        } else {
            final.push(self.v[i]);
            i++;
        }
        if (i > self.v.byteLength - len) {
            for (idx = i; i < self.v.byteLength; i++) {
                final.push(self.v[idx]);
            }
            break;
        }
    }
    return new Sk.builtin.bytes(final);

});

Sk.builtin.bytes.prototype.right_find_ = function (sub, start, end) {
    var i;
    var len;
    var val;
    var final;
    final = -1;

    let { startidx, endidx } = indices(this, start, end);

    if (sub instanceof Sk.builtin.int_) {
        for (i = startidx; i < endidx; i++) {
            if (this.v[i] === sub.v) {
                final = i;
            }
        }
    } else if (sub instanceof Sk.builtin.bytes) {
        len = sub.v.byteLength;
        while (startidx + len <= endidx) {
            i = new Sk.builtin.slice(startidx, startidx + len);
            val = this.mp$subscript(i);
            if (val.ob$eq(sub) === Sk.builtin.bool.true$) {
                final = startidx;
            }
            startidx++;
        }
    } else {
        throw new Sk.builtin.TypeError("argument should be integer or bytes-like object, not '" + Sk.abstr.typeName(sub) + "'");
    }
    return new Sk.builtin.int_(final);
};

Sk.builtin.bytes.prototype["rfind"] = new Sk.builtin.func(function (self, sub, start, end) {
    Sk.builtin.pyCheckArgsLen("rfind", arguments.length - 1, 1, 3);

    return Sk.builtin.bytes.prototype.right_find_.call(self, sub, start, end);
});

Sk.builtin.bytes.prototype["rindex"] = new Sk.builtin.func(function (self, sub, start, end) {
    var val;
    Sk.builtin.pyCheckArgsLen("rindex", arguments.length - 1, 1, 3);

    val = Sk.builtin.bytes.prototype.right_find_.call(self, sub, start, end);
    if (val.v === -1) {
        throw new Sk.builtin.ValueError("subsection not found");
    } else {
        return val;
    }
});

Sk.builtin.bytes.prototype["rpartition"] = new Sk.builtin.func(function (self, sep) {
    var val;
    var final1;
    var final2;
    var final3;
    var index;
    Sk.builtin.pyCheckArgsLen("rpartition", arguments.length - 1, 1, 1);

    if (!(sep instanceof Sk.builtin.bytes)) {
        throw new Sk.builtin.TypeError("a bytes-like object is required, not '" +  Sk.abstr.typeName(sep) + "'");
    }
    val = Sk.builtin.bytes.prototype.right_find_.call(self, sep);
    val = val.v;

    if (val === -1) {
        final1 = new Sk.builtin.bytes(0);
        final2 = new Sk.builtin.bytes(0);
        final3 = new Sk.builtin.bytes(self);
        return new Sk.builtin.tuple([final1, final2, final3]);

    }
    final1 = new Sk.builtin.bytes(self.v.subarray(0, val));
    final2 = new Sk.builtin.bytes(self.v.subarray(val, val + sep.v.byteLength));
    final3 = new Sk.builtin.bytes(self.v.subarray(val + sep.v.byteLength, self.v.byteLength));

    return new Sk.builtin.tuple([final1, final2, final3]);
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

    let { startidx, endidx } = indices(self, start, end);

    negstart = function (idx, object, pref) {
        var i;
        var j;
        var val1;
        var val2;
        for (i = idx, j = 0; j < pref.v.byteLength; i++, j++) {
            if (i < 0) {
                val1 = object.v[i + object.v.byteLength];
            } else {
                val1 = object.v[i];
            }
            val2 = pref.v[j];
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
            if (startidx + len <= endidx) {
                if (startidx < 0) {
                    if (negstart(startidx, self, prefix) === Sk.builtin.bool.true$) {
                        return Sk.builtin.bool.true$;
                    }
                }
                index = new Sk.builtin.slice(startidx, startidx + len);
                val = self.mp$subscript(index);
                if (val.ob$eq(item) === Sk.builtin.bool.true$) {
                    return Sk.builtin.bool.true$;
                }
            }
        }
        return Sk.builtin.bool.false$;
    } else {
        len = prefix.v.byteLength;
        if (startidx + len <= endidx) {
            if (startidx < 0) {
                return negstart(startidx, self, prefix);
            }
            index = new Sk.builtin.slice(startidx, startidx + len);
            val = self.mp$subscript(index);
            if (val.ob$eq(prefix) === Sk.builtin.bool.true$) {
                return Sk.builtin.bool.true$;
            }
        }
        return Sk.builtin.bool.false$;
    }
});

Sk.builtin.bytes.prototype["translate"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("translate() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["center"] = new Sk.builtin.func(function (self, width, fillbyte) {
    var final;
    var i;
    var fill;
    var fill1;
    var fill2;
    Sk.builtin.pyCheckArgsLen("center", arguments.length - 1, 1, 2);

    if (fillbyte === undefined) {
        fillbyte = 32;
    } else if ((!(fillbyte instanceof Sk.builtin.bytes)) || (fillbyte.v.byteLength != 1)) {
        throw new Sk.builtin.TypeError("center() argument 2 must be a byte string of length 1, not " + Sk.abstr.typeName(fillbyte));
    } else {
        fillbyte = fillbyte.v[0];
    }
    if (!(width instanceof Sk.builtin.int_)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(width) + "' object cannot be interpreted as an integer");
    } else {
        width = width.v;
    }
    if (width <= self.v.byteLength) {
        return self;
    }
    final = [];
    fill = width - self.v.byteLength;
    if (fill % 2) {
        fill1 = (fill/2) - .5;
        fill2 = (fill/2) + .5;
    } else {
        fill1 = fill/2;
        fill2 = fill1;
    }
    for (i = 0; i < fill1; i++) {
        final.push(fillbyte);
    }
    for (i = 0; i < self.v.byteLength; i++) {
        final.push(self.v[i]);
    }
    for (i = 0; i < fill2; i++) {
        final.push(fillbyte);
    }

    return new Sk.builtin.bytes(final);
});

Sk.builtin.bytes.prototype["ljust"] = new Sk.builtin.func(function (self, width, fillbyte) {
    var final;
    var i;
    Sk.builtin.pyCheckArgsLen("ljust", arguments.length - 1, 1, 2);

    if (fillbyte === undefined) {
        fillbyte = 32;
    } else if ((!(fillbyte instanceof Sk.builtin.bytes)) || (fillbyte.v.byteLength != 1)) {
        throw new Sk.builtin.TypeError("ljust() argument 2 must be a byte string of length 1, not " + Sk.abstr.typeName(fillbyte));
    } else {
        fillbyte = fillbyte.v[0];
    }
    if (!(width instanceof Sk.builtin.int_)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(width) + "' object cannot be interpreted as an integer");
    } else {
        width = width.v;
    }
    if (width <= self.v.byteLength) {
        return self;
    }
    final = [];
    for (i = 0; i < self.v.byteLength; i++) {
        final.push(self.v[i]);
    }
    for (i = 0; i < width - self.v.byteLength; i++) {
        final.push(fillbyte);
    }

    return new Sk.builtin.bytes(final);

});

Sk.builtin.bytes.prototype.left_strip_ = function (chars) {
    var leading;
    var i;
    var j;
    var final;

    if (chars === undefined || chars === Sk.builtin.none.none$) {
        // default is to remove ASCII whitespace
        leading = [9, 10, 11, 12, 13, 32, 133];
    } else if (!(chars instanceof Sk.builtin.bytes)) {
        throw new Sk.builtin.TypeError("a bytes-like object is required, not '" + Sk.abstr.typeName(chars) + "'");
    } else {
        leading = [];
        for (i = 0; i < chars.v.byteLength; i++) {
            leading.push(chars.v[i]);
        }
    }
    final = [];
    i = 0;
    while (i < this.v.byteLength) {
        if (!(leading.includes(this.v[i]))) {
            break;
        } else {
            i++;
        }
    }
    for (j = i; j < this.v.byteLength; j++) {
        final.push(this.v[j]);
    }

    return new Sk.builtin.bytes(final);
};

Sk.builtin.bytes.prototype["lstrip"] = new Sk.builtin.func(function (self, chars) {
    Sk.builtin.pyCheckArgsLen("lstrip", arguments.length - 1, 0, 1);

    return Sk.builtin.bytes.prototype.left_strip_.call(self, chars);
});

Sk.builtin.bytes.prototype["rjust"] = new Sk.builtin.func(function (self, width, fillbyte) {
    var final;
    var i;
    Sk.builtin.pyCheckArgsLen("rjust", arguments.length - 1, 1, 2);

    if (fillbyte === undefined) {
        fillbyte = 32;
    } else if ((!(fillbyte instanceof Sk.builtin.bytes)) || (fillbyte.v.byteLength != 1)) {
        throw new Sk.builtin.TypeError("rjust() argument 2 must be a byte string of length 1, not " + Sk.abstr.typeName(fillbyte));
    } else {
        fillbyte = fillbyte.v[0];
    }
    if (!(width instanceof Sk.builtin.int_)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(width) + "' object cannot be interpreted as an integer");
    } else {
        width = width.v;
    }
    if (width <= self.v.byteLength) {
        return self;
    }
    final = [];
    for (i = 0; i < width - self.v.byteLength; i++) {
        final.push(fillbyte);
    }
    for (i = 0; i < self.v.byteLength; i++) {
        final.push(self.v[i]);
    }

    return new Sk.builtin.bytes(final);
});

Sk.builtin.bytes.prototype["rsplit"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("rsplit() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype.right_strip_ = function (chars) {
    var ending;
    var i;
    var j;
    var final;

    if (chars === undefined || chars === Sk.builtin.none.none$) {
        // default is to remove ASCII whitespace
        ending = [9, 10, 11, 12, 13, 32, 133];
    } else if (!(chars instanceof Sk.builtin.bytes)) {
        throw new Sk.builtin.TypeError("a bytes-like object is required, not '" + Sk.abstr.typeName(chars) + "'");
    } else {
        ending = [];
        for (i = 0; i < chars.v.byteLength; i++) {
            ending.push(chars.v[i]);
        }
    }
    final = [];
    i = this.v.byteLength - 1;
    while (i > -1) {
        if (!(ending.includes(this.v[i]))) {
            break;
        } else {
            i--;
        }
    }
    for (j = 0; j <= i; j++) {
        final.push(this.v[j]);
    }

    return new Sk.builtin.bytes(final);
};

Sk.builtin.bytes.prototype["rstrip"] = new Sk.builtin.func(function (self, chars) {
    Sk.builtin.pyCheckArgsLen("rstrip", arguments.length - 1, 0, 1);

    return Sk.builtin.bytes.prototype.right_strip_.call(self, chars);
});

Sk.builtin.bytes.prototype["split"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("split() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["strip"] = new Sk.builtin.func(function (self, chars) {
    var lstripped;
    //double check the description
    Sk.builtin.pyCheckArgsLen("strip", arguments.length - 1, 0, 1);
    lstripped  = Sk.builtin.bytes.prototype.left_strip_.call(self, chars);

    return Sk.builtin.bytes.prototype.right_strip_.call(lstripped, chars);
});

Sk.builtin.bytes.prototype["capitalize"] = new Sk.builtin.func(function (self) {
    var final;
    var i;
    var val;
    Sk.builtin.pyCheckArgsLen("capitalize", arguments.length - 1, 0, 0);

    if (self.v.byteLength === 0) {
        return new Sk.builtin.bytes(0);
    }
    final = [];
    if (self.v[0] >= 97 && self.v[0] <= 122) {
        val = self.v[0] - 32;
    } else {
        val = self.v[0];
    }
    final.push(val);
    for (i = 1; i < self.v.byteLength; i++) {
        val = self.v[i];
        if (val >= 65 && val <= 90) {
            val += 32;
            final.push(val);
        } else {
            final.push(val);
        }
    }
    return new Sk.builtin.bytes(final);
});

Sk.builtin.bytes.prototype["expandtabs"] = new Sk.builtin.func(function () {
    throw new Sk.builtin.NotImplementedError("expandtabs() bytes method not implemented in Skulpt");
});

Sk.builtin.bytes.prototype["isalnum"] = new Sk.builtin.func(function (self) {
    var i;
    var val;
    Sk.builtin.pyCheckArgsLen("isalnum", arguments.length - 1, 0, 0);
    if (self.v.byteLength === 0) {
        return Sk.builtin.bool.false$;
    }
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v[i];
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
    if (self.v.byteLength === 0) {
        return Sk.builtin.bool.false$;
    }
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v[i];
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
        val = self.v[i];
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
    if (self.v.byteLength === 0) {
        return Sk.builtin.bool.false$;
    }
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v[i];
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
        val = self.v[i];
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
    if (self.v.byteLength === 0) {
        return Sk.builtin.bool.false$;
    }
    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v[i];
        if (!(val === 32 || val === 9 || val === 10 || val === 13 || val === 11 || val === 12)) {
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
        val = self.v[i];
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
        val = self.v[i];
        if (val >= 65 && val <= 90) {
            val += 32;
            final.push(val);
        } else {
            final.push(val);
        }
    }
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
        val = self.v[i];
        if (val >= 65 && val <= 90) {
            val += 32;
            final.push(val);
        } else if (val >= 97 && val <= 122) {
            val -= 32;
            final.push(val);
        } else {
            final.push(val);
        }
    }
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
        val = self.v[i];
        if (val >= 97 && val <= 122) {
            val -= 32;
            final.push(val);
        } else {
            final.push(val);
        }
    }
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
    if (self.v[0] === 43 || self.v[0] === 45) {
        val = self.v[0];
        final.push(val);
        for (i = 0; i < fill; i++) {
            final.push(48);
        }
        for (i = 1; i < self.v.byteLength; i++) {
            val = self.v[i];
            final.push(val);
        }
    } else {
        for (i = 0; i < fill; i++) {
            final.push(48);
        }
        for (i = 0; i < self.v.byteLength; i++) {
            val = self.v[i];
            final.push(val);
        }
    }
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
    this.tp$iter = () => this;
    this.tp$iternext = function () {
        if (this.$index >= this.sq$length) {
            return undefined;
        }
        return new Sk.builtin.int_(bts.v[this.$index++]);
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
