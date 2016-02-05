/**
 * @constructor
 * @param {Sk.builtin.str} name
 * @param {Sk.builtin.str} mode
 * @param {Object} buffering
 */
Sk.builtin.file = function (name, mode, buffering) {
    var i;
    var elem;

    if (!(this instanceof Sk.builtin.file)) {
        return new Sk.builtin.file(name, mode, buffering);
    }

    this.mode = mode;
    this.name = Sk.ffi.remapToJs(name);
    this.closed = false;

    if (this.name === "/dev/stdout") {
        this.data$ = Sk.builtin.none.none$;
        this.fileno = 1;
    } else if (this.name === "/dev/stdin") {
        this.fileno = 0;
    } else if (this.name === "/dev/stderr") {
        this.fileno = 2;
    } else {
        if (Sk.inBrowser) {  // todo:  Maybe provide a replaceable function for non-import files
            this.fileno = 10;
            elem = document.getElementById(name.v);
            if (elem == null) {
                throw new Sk.builtin.IOError("[Errno 2] No such file or directory: '" + name.v + "'");
            } else {
                if (elem.nodeName.toLowerCase() == "textarea") {
                    this.data$ = elem.value;
                } else {
                    this.data$ = elem.textContent;
                }
            }
        } else {
            this.fileno = 11;
            this.data$ = Sk.read(name.v);
        }

        this.lineList = this.data$.split("\n");
        this.lineList = this.lineList.slice(0, -1);

        for (i in this.lineList) {
            this.lineList[i] = this.lineList[i] + "\n";
        }
        this.currentLine = 0;
    }
    this.pos$ = 0;

    this.__class__ = Sk.builtin.file;

    return this;
};

Sk.abstr.setUpInheritance("file", Sk.builtin.file, Sk.builtin.object);

Sk.builtin.file.prototype["$r"] = function () {
    return new Sk.builtin.str("<" +
        (this.closed ? "closed" : "open") +
        "file '" +
        this.name +
        "', mode '" +
        this.mode +
        "'>");
};

Sk.builtin.file.prototype.tp$iter = function () {
    var allLines = this.lineList;

    var ret =
    {
        tp$iter    : function () {
            return ret;
        },
        $obj       : this,
        $index     : 0,
        $lines     : allLines,
        tp$iternext: function () {
            if (ret.$index >= ret.$lines.length) {
                return undefined;
            }
            return new Sk.builtin.str(ret.$lines[ret.$index++]);
        }
    };
    return ret;
};

Sk.builtin.file.prototype["close"] = new Sk.builtin.func(function (self) {
    self.closed = true;
});

Sk.builtin.file.prototype["flush"] = new Sk.builtin.func(function (self) {
});

Sk.builtin.file.prototype["fileno"] = new Sk.builtin.func(function (self) {
    return this.fileno;
}); // > 0, not 1/2/3

Sk.builtin.file.prototype["isatty"] = new Sk.builtin.func(function (self) {
    return false;
});

Sk.builtin.file.prototype["read"] = new Sk.builtin.func(function (self, size) {
    var ret;
    var len;
    if (self.closed) {
        throw new Sk.builtin.ValueError("I/O operation on closed file");
    }
    len = self.data$.length;
    if (size === undefined) {
        size = len;
    }
    ret = new Sk.builtin.str(self.data$.substr(self.pos$, size));
    self.pos$ += size;
    if (self.pos$ >= len) {
        self.pos$ = len;
    }
    return ret;
});

Sk.builtin.file.prototype["readline"] = new Sk.builtin.func(function (self, size) {
    if (self.fileno === 0) {
        var x, resolution, susp;

        var prompt = prompt ? prompt.v : "";
        x = Sk.inputfun(prompt);

        if (x instanceof Promise) {
            susp = new Sk.misceval.Suspension();

            susp.resume = function() {
                return new Sk.builtin.str(resolution);
            };

            susp.data = {
                type: "Sk.promise",
                promise: x.then(function(value) {
                    resolution = value;
                    return value;
                }, function(err) {
                    resolution = "";
                    return err;
                })
            };

            return susp;
        } else {
            return new Sk.builtin.str(x);
        }
    } else {
        var line = "";
        if (self.currentLine < self.lineList.length) {
            line = self.lineList[self.currentLine];
            self.currentLine++;
        }
        return new Sk.builtin.str(line);
    }
});

Sk.builtin.file.prototype["readlines"] = new Sk.builtin.func(function (self, sizehint) {
    if (self.fileno === 0) {
        return new Sk.builtin.NotImplementedError("readlines ins't implemented because the web doesn't support Ctrl+D");
    }

    var i;
    var arr = [];
    for (i = self.currentLine; i < self.lineList.length; i++) {
        arr.push(new Sk.builtin.str(self.lineList[i]));
    }
    return new Sk.builtin.list(arr);
});

Sk.builtin.file.prototype["seek"] = new Sk.builtin.func(function (self, offset, whence) {
    if (whence === undefined) {
        whence = 1;
    }
    if (whence == 1) {
        self.pos$ = offset;
    } else {
        self.pos$ = self.data$ + offset;
    }
});

Sk.builtin.file.prototype["tell"] = new Sk.builtin.func(function (self) {
    return self.pos$;
});


Sk.builtin.file.prototype["truncate"] = new Sk.builtin.func(function (self, size) {
    goog.asserts.fail();
});

Sk.builtin.file.prototype["write"] = new Sk.builtin.func(function (self, str) {
    if (self.fileno === 1) {
        Sk.output(Sk.ffi.remapToJs(str));
    } else {
        goog.asserts.fail();
    }
});


goog.exportSymbol("Sk.builtin.file", Sk.builtin.file);
