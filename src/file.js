import { setUpInheritance } from "./abstract";
import { func } from './function';
import { object, none } from './object';
import { remapToJs, remapToPy } from './ffi';

export class file extends object {
    /**
     * @constructor
     * @param {Sk.builtin.str} name
     * @param {Sk.builtin.str} mode
     * @param {Object} buffering
     */
    constructor(name, mode, buffering) {
        var i;
        var elem;

        if (!(this instanceof file)) {
            return new file(name, mode, buffering);
        }

        this.mode = mode;
        this.name = remapToJs(name);
        this.closed = false;

        if (this.name === "/dev/stdout") {
            this.data$ = none.none$;
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
                    if (mode.v == "w" || mode.v == "a") {
                        this.data$ = "";
                    } else {
                        throw new Sk.builtin.IOError("[Errno 2] No such file or directory: '" + name.v + "'");
                    }
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
    }

    $r() {
        return new Sk.builtin.str("<" +
            (this.closed ? "closed" : "open") +
            "file '" +
            this.name +
            "', mode '" +
            remapToJs(this.mode) +
            "'>");
    }

    tp$iter() {
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
    }

    $readline(self, size, prompt) {
        if (self.fileno === 0) {
            var x, susp;

            var lprompt = remapToJs(prompt);

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
    }

    __enter__ = new func(function __enter__(self) {
        return self;
    })

    __exit__ = new func(function __exit__(self) {
        return Sk.misceval.callsim(Sk.builtin.file.prototype["close"], self);
    })

    close = new func(function close(self) {
        self.closed = true;
        return none.none$;
    })

    flush = new func(function flush(self) {
    })

    fileno = new func(function fileno(self) {
        return this.fileno;
    }); // > 0, not 1/2/3

    isatty = new func(function isatty(self) {
        return false;
    })

    read = new func(function read(self, size) {
        var ret;
        var len = self.data$.length;
        var l_size;
        if (self.closed) {
            throw new Sk.builtin.ValueError("I/O operation on closed file");
        }

        if (size === undefined) {
            l_size = len;
        } else {
            l_size = remapToJs(size);
        }

        ret = new Sk.builtin.str(self.data$.substr(self.pos$, l_size));
        self.pos$ += size;
        if (self.pos$ >= len) {
            self.pos$ = len;
        }

        return ret;
    })

    readline = new func(function readline(self, size) {
        return Sk.builtin.file.$readline(self, size, undefined);
    })

    readlines = new func(function readlines(self, sizehint) {
        if (self.fileno === 0) {
            return new Sk.builtin.NotImplementedError("readlines ins't implemented because the web doesn't support Ctrl+D");
        }

        var i;
        var arr = [];
        for (i = self.currentLine; i < self.lineList.length; i++) {
            arr.push(new Sk.builtin.str(self.lineList[i]));
        }
        return new Sk.builtin.list(arr);
    })

    seek = new func(function seek(self, offset, whence) {
        var l_offset =  remapToJs(offset);

        if (whence === undefined) {
            whence = 0;
        }
        if (whence === 0) {
            self.pos$ = l_offset;
        } else if (whence == 1) {
            self.pos$ = self.data$.length + l_offset;
        } else if (whence == 2) {
            self.pos$ = self.data$.length + l_offset;
        }

        return none.none$;
    })

    tell = new func(function tell(self) {
        return remapToPy(self.pos$);
    })

    write = new func(function write(self, str) {
        var mode = remapToJs(self.mode);
        if (mode === "w" || mode === "wb" || mode === "a" || mode === "ab") {
            if (Sk.filewrite) {
                if (self.closed) {
                    throw new Sk.builtin.ValueError("I/O operation on closed file");
                }

                if (self.fileno === 1) {
                    Sk.output(remapToJs(str));
                } else {
                    Sk.filewrite(self, str);
                }
            } else {
                if (self.fileno === 1) {
                    Sk.output(Sk.ffi.remapToJs(str));
                } else {
                    goog.asserts.fail();
                }
            }
        } else {
            throw new Sk.builtin.IOError("File not open for writing");
        }
    });
}


setUpInheritance("file", file, object);
