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
        Sk.ffi.remapToJs(this.mode) +
        "'>");
};

Sk.builtin.file.prototype["__enter__"] = new Sk.builtin.func(function __enter__(self) {
    return self;
});

Sk.builtin.file.prototype["__exit__"] = new Sk.builtin.func(function __exit__(self) {
    return Sk.misceval.callsim(Sk.builtin.file.prototype["close"], self);
});

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

Sk.builtin.file.prototype["close"] = new Sk.builtin.func(function close(self) {
    self.closed = true;
    return Sk.builtin.none.none$;
});

Sk.builtin.file.prototype["flush"] = new Sk.builtin.func(function flush(self) {
});

Sk.builtin.file.prototype["fileno"] = new Sk.builtin.func(function fileno(self) {
    return this.fileno;
}); // > 0, not 1/2/3

Sk.builtin.file.prototype["isatty"] = new Sk.builtin.func(function isatty(self) {
    return false;
});

Sk.builtin.file.prototype["read"] = new Sk.builtin.func(function read(self, size) {
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

Sk.builtin.file.$readline = function (self, size, prompt) {
    if (self.fileno === 0) {
        var x, susp;

        var lprompt = Sk.ffi.remapToJs(prompt);

        lprompt = lprompt ? lprompt : "";

        x = Sk.inputfun(lprompt);

        if (x instanceof Promise) {
            susp = new Sk.misceval.Suspension();

            susp.resume = function() {
                if (susp.data.error) {
                    throw susp.data.error;
                }

                return new Sk.builtin.str(susp.data.result);
            };

            susp.data = {
                type: "Sk.promise",
                promise: x
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
};

Sk.builtin.file.prototype["readline"] = new Sk.builtin.func(function readline(self, size) { 
    return Sk.builtin.file.$readline(self, size, undefined); 
});

Sk.builtin.file.prototype["readlines"] = new Sk.builtin.func(function readlines(self, sizehint) {
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

Sk.builtin.file.prototype["seek"] = new Sk.builtin.func(function seek(self, offset, whence) {
    if (whence === undefined) {
        whence = 1;
    }
    if (whence == 1) {
        self.pos$ = offset;
    } else {
        self.pos$ = self.data$ + offset;
    }
});

Sk.builtin.file.prototype["tell"] = new Sk.builtin.func(function tell(self) {
    return self.pos$;
});

Sk.builtin.file.prototype["truncate"] = new Sk.builtin.func(function truncate(self, size) {
    goog.asserts.fail();
});

Sk.builtin.file.prototype["write"] = new Sk.builtin.func(function write(self, str) {
    var mode = Sk.ffi.remapToJs(self.mode);
    if (mode === "w" || mode === "wb" || mode === "a" || mode === "ab") {
        if (self.fileno === 1) {
            Sk.output(Sk.ffi.remapToJs(str));
        } else {
            goog.asserts.fail();
        }
    } else {
        goog.asserts.fail();
    }
});


goog.exportSymbol("Sk.builtin.file", Sk.builtin.file);
