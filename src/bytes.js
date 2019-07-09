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
    var errs;
    var string;
    if (!(this instanceof Sk.builtin.bytes)) {
        return new Sk.builtin.bytes(...arguments);
    }
    Sk.builtin.pyCheckArgsLen("bytes", arguments.length, 0, 3);

    if (errors !== undefined && errors.v !== "strict" && errors.v !== "ignore") {
        throw new Sk.builtin.NotImplementedError("'" + errors.v + "' error handling not implemented in Skulpt");
    }
    if (arguments.length == 0) {
        buffer = new ArrayBuffer(0);
        view = new DataView(buffer);
    }
    if (arguments.length == 1) {
        if (source instanceof Sk.builtin.int_) {
            buffer = new ArrayBuffer(source.v);
            view = new DataView(buffer);
        } else if (Sk.builtin.checkIterable(source) && !(source instanceof Sk.builtin.str)) {
            buffer = new ArrayBuffer(source.sq$length());
            view = new DataView(buffer);
            i = 0;
            for (iter = Sk.abstr.iter(source), item = iter.tp$iternext();
                item !== undefined;
                item = iter.tp$iternext()) {
                if (item instanceof Sk.builtin.int_) {
                    if (item.v >= 0 && item.v <= 256) {
                        view.setUint8(i, item.v);
                        i ++;
                    } else {
                        throw new Sk.builtin.ValueError("bytes must be in range(0, 256)");
                    }
                } else {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(item) + "' " + "object cannot be interpreted as an integer");
                }
            }
        } else if (source instanceof Sk.builtin.bytes) {
            return source;
        } else if (source instanceof Sk.builtin.str) {
            throw new Sk.builtin.TypeError("string argument without an encoding");
        } else {
            throw new Sk.builtin.TypeError("cannot convert '" + Sk.abstr.typeName(source) + "' object into bytes");
        }
    } else if (arguments.length >1) {
        if (encoding instanceof Sk.builtin.str) {
            if (source instanceof Sk.builtin.str) {
                if (encoding.v == "ascii") {
                    string = "";
                    errs = 0;
                    for (i in source.v) {
                        val = source.v[i].charCodeAt(0);
                        if (val < 0 || val > 127) {
                            if (errors === undefined || errors.v == "strict") {
                                val = makehexform(val);
                                throw new Sk.builtin.UnicodeEncodeError("'ascii' codec can't encode character '" + val + "' in position " + i + ": ordinal not in range(128)");
                            } else if (errors.v == "ignore") {
                                errs++;
                            }
                        } else {
                            string += source.v[i];
                        }
                    }
                    buffer = new ArrayBuffer(source.sq$length() - errs);
                    view = new DataView(buffer);
                    for (i in string) {
                        val = string[i].charCodeAt(0);
                        view.setUint8(i, val);
                    }
                } else if (encoding.v == "utf-8") {
                    throw new Sk.builtin.NotImplementedError("utf-8 not implemented in Skulpt");
                } else {
                    throw new Sk.builtin.LookupError("unknown encoding: " + encoding.v);
                }
            } else {
                throw new Sk.builtin.TypeError("encoding without a string argument");
            }
        } else {
            throw new Sk.builtin.TypeError("bytes() argument 2 must be str, not int");
        }
    }

    this.v = view;
    this.__class__ = Sk.builtin.bytes;
    this.arraybuffer = buffer;

    this.tp$iter = function () {
        return this;
    };

    this.index$ = -1;
    this.tp$iternext = function () {
        this.index$++;
        if (this.index$ >= view.byteLength) {
            return undefined;
        }
        return new Sk.builtin.int_(view.getUint8(this.index$));
    };
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
        } else {
            ret += String.fromCharCode(num);
        }
    }
    ret = "b'" + ret + "'";
    return new Sk.builtin.str(ret);
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
    Sk.builtin.pyCheckArgsLen("decode", arguments.length, 1, 3);

    if (errors !== undefined && errors.v !== "strict" && errors.v !== "ignore") {
        throw new Sk.builtin.NotImplementedError("'" + errors.v + "' error handling not implemented in Skulpt");
    }

    if (encoding !== undefined) {
        if (encoding.v !== "ascii") {
            if (encoding.v == "utf-8") {
                throw new Sk.builtin.NotImplementedError("utf-8 not implemented in Skulpt");
            }
            throw new Sk.builtin.LookupError("unknown encoding: " + encoding.v);
        }

    }

    for (i = 0; i < self.v.byteLength; i++) {
        val = self.v.getUint8(i);
        if (val  > 127) {
            if (errors === undefined || errors.v == "strict") {
                val = val.toString(16);
                throw new Sk.builtin.UnicodeDecodeError("'ascii' codec can't decode byte '0x" + val + "' in position " + i + ": ordinal not in range(128)");
            }
        }
    }
    var string = new textEncoding.TextDecoder(encoding.$jsstr()).decode(self.arraybuffer);
    return new Sk.builtin.str(string);

});

Sk.builtin.bytes.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    return self.tp$iter();
});

Sk.builtin.bytes.prototype.next$ = function (self) {
    return self.tp$iternext();
};

Sk.exportSymbol("Sk.builtin.bytes", Sk.builtin.bytes);
