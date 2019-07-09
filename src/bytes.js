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
    if (!(this instanceof Sk.builtin.bytes)) {
        return new Sk.builtin.bytes(...arguments);
    }
    Sk.builtin.pyCheckArgsLen("bytes", arguments.length, 0, 3);
    if (arguments.length == 0) {
        buffer = new ArrayBuffer(0);
        view = new DataView(buffer);
    }
    if (arguments.length == 1) {
        if (source instanceof Sk.builtin.int_) {
            buffer = new ArrayBuffer(source.v);
            view = new DataView(buffer);
        } else if (Sk.builtin.checkIterable(source)) {
            buffer = new ArrayBuffer(source.sq$length());
            view = new DataView(buffer);
            i = 0;
            for (iter = Sk.abstr.iter(source), item = iter.tp$iternext();
                item !== undefined;
                item = iter.tp$iternext()) {
                if (item instanceof Sk.builtin.int_) {
                    if (item.v >= 0 && item.v <= 256) {
                        view.setInt8(i, item.v);
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
    }

    if (arguments.length == 2) {
        if (encoding instanceof Sk.builtin.str) {
            if (source instanceof Sk.builtin.str) {
                if (encoding.v == "ascii") {
                    buffer = new ArrayBuffer(encoding.sq$length());
                    view = new DataView(buffer);
                    for (i in source.v) {
                        val = source.v[i].charCodeAt(0);
                        if (val < 128) {
                            view.setInt8(i, val);
                        } else {
                            if (val <= 256) {
                                val = makehexform(val);
                            } else {
                                val = makehexform(val);
                            }
                            //made this up
                            throw new Sk.builtin.ValueError("UnicodeEncodeError, msg: 'ascii' codec can't encode character '" + val + "' in position " + i + ": ordinal not in range(128)");
                        }
                    }
                } else if (encoding.v == "utf-8") {
                    //made this up
                    throw new Sk.builtin.NotImplementedError("utf-8 not implemented in Skulpt");
                } else {
                    //Throws lookuperror in real python but I couldn't find that in skulpt
                    throw new Sk.builtin.SyntaxError("unknown encoding: " + encoding.v);
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
    if (errors) {
        //made this up
        throw new Sk.builtin.NotImplementedError("Bytes error handling not implemented in Skulpt");
    }

    this.tp$iter = function () {
        return this;
    };

    this.index$ = -1;
    this.tp$iternext = function () {
        this.index$++;
        if (this.index$ == view.byteLength) {
            return undefined;
        }
        return new Sk.builtin.int_(view.getInt8(this.index$));
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
    console.log(num);
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
    // this doesn't work for values > 127
    ret = "";
    for (i = 0; i < this.v.byteLength; i++) {
        num = this.v.getInt8(i);
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
    /*
    if (this["__len__"] != other["__len__"]) {
        return Sk.builtin.bool.false$;
    }
    for (i in this.val$.v) {
        if (this.val$.v.v != other.val$.v.v) {
            return Sk.builtin.bool.false$;
        }
    }*/
    return Sk.builtin.bool.true$;
};

Sk.builtin.bytes.prototype.sq$length = function () {
    return this.v.byteLength;
};

Sk.builtin.bytes.prototype["decode"] = new Sk.builtin.func(function (self, encoding, errors) {

    Sk.builtin.pyCheckArgsLen("decode", arguments.length, 1, 3);
    
    if (errors) {
        throw new Sk.builtin.NotImplementedError("Bytes error handling not implemented in Skulpt");
    }
    if (encoding !== undefined) {
        // should throw lookup error but can't find in skulpt
        if (encoding.v !== "ascii") {
            if (encoding.v == "utf-8") {
                throw new Sk.builtin.NotImplementedError("utf-8 not implemented in Skulpt");
            }
            throw new Sk.builtin.SyntaxError("unknown encoding: " + encoding.v);
        }

    }
    var string = new textEncoding.TextDecoder(encoding.$jsstr()).decode(self.arraybuffer);
    return new Sk.builtin.str(string);

});

Sk.builtin.bytes.prototype["decode"] = new Sk.builtin.func(function (self, encoding, errors) {

    Sk.builtin.pyCheckArgsLen("decode", arguments.length, 1, 3);
    
    if (errors) {
        throw new Sk.builtin.NotImplementedError("Bytes error handling not implemented in Skulpt");
    }
    if (encoding !== undefined) {
        // should throw lookup error but can't find in skulpt
        if (encoding.v !== "ascii") {
            if (encoding.v == "utf-8") {
                throw new Sk.builtin.NotImplementedError("utf-8 not implemented in Skulpt");
            }
            throw new Sk.builtin.SyntaxError("unknown encoding: " + encoding.v);
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
