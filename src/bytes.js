/**
 * @constructor
 * @param {*} x
 * @extends Sk.builtin.object
 */
Sk.builtin.bytes = function (source, encoding, errors) {
    var i;
    var item;
    var iter;
    var leading;
    var makehexform;
    var val;
    var bytestring;
    var val$;
    var pos;
    if (!(this instanceof Sk.builtin.bytes)) {
        return new Sk.builtin.bytes(...arguments);
    }
    Sk.builtin.pyCheckArgsLen("bytes", arguments.length, 0, 3);

    val$ = [];
    bytestring = "";

    makehexform = function (num) {
        if (num <= 265) {
            leading = "\\x";
        } else {
            leading = "\\u";
        }
        num = num.toString(16);
        if ((num.length % 2) == 1) {
            num = leading + "0" + num;
        } else {
            num = leading + num;
        }
        return num;
    };

    if (arguments.length == 1) {
        if (source instanceof Sk.builtin.int_) {
            for (i = 0; i < source.v; i++) {
                val$.push(0);
                bytestring = bytestring + "\\x00";
            }
        } else if (Sk.builtin.checkIterable(source)) {
            for (iter = Sk.abstr.iter(source), item = iter.tp$iternext();
                item !== undefined;
                item = iter.tp$iternext()) {
                if (item instanceof Sk.builtin.int_) {
                    if (item.v >= 0 && item.v <= 256) {
                        val$.push(item);
                        val = makehexform(item.v);
                        bytestring = bytestring + val;
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
                    bytestring = source.v;
                    for (i in source.v) {
                        val = source.v[i].charCodeAt(0);
                        if (val < 128) {
                            val$.push(new Sk.builtin.int_(val));
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

    this.val$ = val$;
    this.__class__ = Sk.builtin.bytes;
    this.v = "b'" + bytestring + "'";
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
        return this.val$[this.index$];
    };

    return this;
};

Sk.abstr.setUpInheritance("bytes", Sk.builtin.bytes, Sk.builtin.object);

Sk.builtin.bytes.prototype["$r"] = function () {
    return new Sk.builtin.str(this.v);
};

Sk.builtin.bytes.prototype.ob$eq = function (other) {
    var i;
    if (this["__len__"] != other["__len__"]) {
        return Sk.builtin.bool.false$;
    }
    for (i in this.val$.v) {
        if (this.val$.v.v != other.val$.v.v) {
            return Sk.builtin.bool.false$;
        }
    }
    return Sk.builtin.bool.true$;
};

Sk.builtin.bytes.prototype.sq$length = function () {
    return this.val$.length;
};

Sk.builtin.bytes.prototype["decode"] = new Sk.builtin.func(function (self, encoding, errors) {
    var ret;
    var i;
    var hexcode;

    ret = "";

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
    for (i in self.val$) {
        if (self.val$[i].v >= 128) {
            //should be unicodedecodeerror
            hexcode = self.val$[i].v.toString(16);
            throw new Sk.builtin.ValueError("msg: 'ascii' codec can't decode byte 0x" + hexcode + " in position " + i + ": ordinal not in range(128)");
        }
        ret += String.fromCharCode(self.val$[i].v);
    }
    return new Sk.builtin.str(ret);
});

Sk.builtin.bytes.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    return self.tp$iter();
});

Sk.builtin.bytes.prototype.next$ = function (self) {
    return self.tp$iternext();
};

Sk.exportSymbol("Sk.builtin.bytes", Sk.builtin.bytes);
