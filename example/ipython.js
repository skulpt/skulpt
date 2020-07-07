(function () {
    var //finds import statements
        importre = new RegExp("\\s*import"),
        //finds defining statements
        defre = new RegExp("def.*|class.*"),
        //test for empty line.
        comment = new RegExp("^#.*"),
        //a regex to check if a line is an assignment
        //this regex checks whether or not a line starts with
        //an identifier followed with some whitspace and then an = and then some more white space.
        //it also checks if the identifier is a tuple.
        assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))([+-/*%&\^\|]?|[/<>*]{2})=/;

    Sk.globals = {
        _ih: new Sk.builtin.list(),
        _oh: new Sk.builtin.dict(),
        _: Sk.builtin.str.$empty,
        __: Sk.builtin.str.$empty,
        ___: Sk.builtin.str.$empty,
        _i: Sk.builtin.str.$empty,
        _ii: Sk.builtin.str.$empty,
        _iii: Sk.builtin.str.$empty,
        __name__: new Sk.builtin.str("__main__"),
    };
    Sk.globals.In = Sk.globals._ih;
    Sk.globals.Out = Sk.globals._oh;

    Sk.stopExecution = false;

    const info = "# Python 3.7(ish) (Skulpt ipython, " + new Date() + ") \n" + "# [" + navigator.userAgent + "] on " + navigator.platform;

    Sk.ipython = function (dom) {
        if (ace === undefined) {
            Sk.asserts.fail("No ace");
        }
        this.editor = dom;
        this.clickGuard = document.getElementById("clickGuard");
        this.clickGuard.addEventListener("click", () => {
            this.inCell.focus();
        });
        const keyboardInterrupt = (e) => {
            if (e.ctrlKey && e.key === "c") {
                // faile safe for keyboard interrupt
                Sk.stopExecution = true;
            }
        };
        this.editor.addEventListener("keydown", keyboardInterrupt);
        this.clickGuard.addEventListener("keydown", keyboardInterrupt);

        const infoElement = document.createElement("DIV");
        infoElement.innerText = info;
        infoElement.style.padding = "5px";
        this.editor.appendChild(infoElement);

        this.inputs = [];
        this.idx = 0;
        this.inCell;
        this.outCell;
        this.printCell;
        this.newCells();
        this.outf = this.outf.bind(this);
        this.lineHeight = this.inCell.renderer.lineHeight || 16;
        this.pad = 15;

        Sk.configure({
            output: this.outf,
            __future__: Sk.python3,
            yieldLimit: 1000,
            execLimit: 30000,
            retainGlobals: true,
            inputfunTakesPrompt: true,
            inputfun: (args) => {
                let res;
                this.outf(args + " ");
                this.outf((res = prompt(args)));
                return res;
            },
        });
    };

    Sk.ipython.prototype.newCells = function () {
        this.idx = this.inputs.length;
        this.inCell = this.newIn();
        this.printCell = this.newPrint();
        this.outCell = this.newOut();
        this.inCell.focus();
        this.inCell.container.scrollIntoView();
    };

    Sk.ipython.prototype.execute = function () {
        Sk.stopExecution = false;
        const code = this.inCell.getValue();
        const codeAsPyStr = new Sk.builtin.str(code);
        Sk.globals["_i" + this.inputs.length] = codeAsPyStr;
        Sk.misceval.callsimArray(Sk.globals.In.append, [Sk.globals.In, codeAsPyStr]);
        this.inputs[this.inputs.length - 1] = code;

        let compile_code = code.trimEnd();

        const lines = compile_code.split("\n");
        let last_line = lines[lines.length - 1];
        if (
            !assignment.test(last_line) &&
            !defre.test(last_line) &&
            !importre.test(last_line) &&
            !comment.test(last_line) &&
            last_line.length > 0 &&
            last_line[0] !== " "
        ) {
            lines[lines.length - 1] = "_" + this.inputs.length + " = " + last_line;
        }
        compile_code = lines.join("\n");
        this.inCell.setReadOnly(true);
        this.inCell.renderer.$cursorLayer.element.style.opacity = 0;
        const executionPromise = Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("ipython", false, compile_code, true), {
            "*": () => {
                if (Sk.stopExecution) {
                    throw "\nKeyboard interrupt";
                }
            },
        });
        executionPromise
            .then((res) => {
                const printContent = this.printCell.getValue();
                if (printContent.substring(printContent.length - 1) === "\n") {
                    this.printCell.setValue(printContent.substring(0, printContent.length - 1), -1);
                }
                this.printCell.container.style.height = this.printCell.session.getLength() * this.lineHeight + this.pad;
                this.printCell.resize();

                const last_input = Sk.globals["_" + this.inputs.length];
                if (Sk.builtin.checkNone(last_input) || last_input === undefined) {
                    delete Sk.globals["_" + this.inputs.length];
                } else {
                    this.outCell.setValue(Sk.ffi.remapToJs(Sk.misceval.objectRepr(last_input)), -1);
                    if (last_input !== Sk.globals.Out) {
                        Sk.abstr.objectSetItem(Sk.globals._oh, Sk.ffi.remapToPy(this.inputs.length), last_input);
                        Sk.globals["___"] = Sk.globals["__"];
                        Sk.globals["__"] = Sk.globals["_"];
                        Sk.globals["_"] = last_input;
                    }
                }
            })
            .catch((e) => {
                this.outf(e.toString());
            })
            .finally(() => {
                Sk.globals["_iii"] = Sk.globals["_ii"];
                Sk.globals["_ii"] = Sk.globals["_i"];
                Sk.globals["_i"] = Sk.globals["_i" + this.inputs.length];
                if (this.printCell.isVisible || this.outCell.isVisible) {
                    this.inCell.container.style.height = this.inCell.session.getLength() * 16;
                    this.inCell.resize();
                }
                this.newCells();
            });
    };

    Sk.ipython.prototype.outf = function (text) {
        const curr_val = this.printCell.getValue();
        this.printCell.setValue(curr_val + text, 1);
    };

    Sk.ipython.prototype.newIn = function () {
        let cell = document.createElement("DIV");
        this.editor.appendChild(cell);
        cell = ace.edit(cell);
        this.inputs.push("");
        cell.setOptions({
            showLineNumbers: true,
            firstLineNumber: this.inputs.length,
            printMargin: false,
            highlightGutterLine: false,
            highlightActiveLine: false,
            showFoldWidgets: false,
            theme: "ace/theme/gruvbox",
            mode: "ace/mode/python",
        });
        cell.session.addGutterDecoration(0, "in-gutter");
        cell.container.style.height = 30;
        cell.resize();
        cell.on("blur", () => {
            cell.selection.setSelectionRange(new ace.Range(0, 0, 0, 0), false);
        });
        cell.on("change", () => {
            cell.container.style.height = cell.session.getLength() * this.lineHeight + this.pad;
            cell.resize();
            cell.container.scrollIntoView();
        });
        cell.renderer.onResize(() => {});

        cell.commands.addCommands([
            {
                name: "upHistory",
                bindKey: {
                    mac: "Up",
                    win: "Up",
                },
                exec: (e, t) => {
                    if (cell.getCursorPosition().row === 0) {
                        if (this.idx > 0) {
                            cell.setValue(this.inputs[--this.idx], 1);
                            cell.container.scrollIntoView();
                        }
                    } else {
                        cell.commands.commands.golineup.exec(e, t);
                    }
                },
            },
            {
                name: "downHistory",
                bindKey: {
                    mac: "Down",
                    win: "Down",
                },
                exec: (e, t) => {
                    if (cell.getCursorPosition().row === cell.session.getLength() - 1) {
                        if (this.idx < this.inputs.length - 1) {
                            cell.setValue(this.inputs[++this.idx], -1);
                            cell.container.scrollIntoView();
                        }
                    } else {
                        cell.commands.commands.golinedown.exec(e, t);
                    }
                },
            },
            {
                name: "execute",
                bindKey: {
                    win: "ctrl-enter",
                    mac: "command-enter",
                },
                exec: (e, t) => {
                    this.execute();
                },
            },
            {
                name: "keyboardInterrupt",
                bindKey: {
                    mac: "ctrl-C",
                    win: "ctrl-C",
                },
                exec: (e, t) => {
                    Sk.stopExecution = true;
                },
                readOnly: true,
            },
        ]);
        return cell;
    };

    Sk.ipython.prototype.newPrint = function () {
        let cell = document.createElement("DIV");
        this.editor.appendChild(cell);
        cell = ace.edit(cell);
        cell.setOptions({
            readOnly: true,
            printMargin: false,
            showGutter: false,
            showLineNumbers: false,
            highlightActiveLine: false,
            highlightGutterLine: false,
            highlightSelectedWord: false,
            theme: "ace/theme/gruvbox",
        });
        cell.renderer.$cursorLayer.element.style.opacity = 0;
        cell.on("blur", () => {
            cell.selection.setSelectionRange(new ace.Range(0, 0, 0, 0), false);
            cell.renderer.$cursorLayer.element.style.opacity = 0;
        });
        cell.on("change", () => {
            if (!cell.isVisible) {
                cell.container.style.display = "block";
                cell.isVisible = true;
            }
            cell.container.style.height = cell.session.getLength() * this.lineHeight + this.pad;
            cell.resize();
            cell.focus();
            cell.renderer.$cursorLayer.element.style.opacity = "";
            cell.container.scrollIntoView();
        });
        cell.container.style.display = "none";
        cell.isVisible = false;
        cell.commands.addCommand({
            name: "keyboardInterrupt",
            bindKey: {
                mac: "ctrl-C",
                win: "ctrl-C",
            },
            exec: (e, t) => {
                Sk.stopExecution = true;
            },
            readOnly: true,
        });
        return cell;
    };

    Sk.ipython.prototype.newOut = function () {
        let cell = document.createElement("DIV");
        this.editor.appendChild(cell);
        cell = ace.edit(cell);
        cell.setOptions({
            showLineNumbers: true,
            firstLineNumber: this.inputs.length,
            highlightActiveLine: false,
            highlightGutterLine: false,
            highlightSelectedWord: false,
            readOnly: true,
            printMargin: false,
            theme: "ace/theme/gruvbox",
        });
        cell.session.addGutterDecoration(0, "out-gutter");
        cell.renderer.$cursorLayer.element.style.opacity = 0;
        cell.on("blur", () => {
            cell.selection.setSelectionRange(new ace.Range(0, 0, 0, 0), false);
        });
        cell.on("change", () => {
            if (!cell.isVisible) {
                cell.container.style.display = "block";
                this.printCell.container.style.height = this.printCell.session.getLength() * this.lineHeight;
                this.printCell.resize();
                cell.isVisible = true;
            }
            cell.container.style.height = cell.session.getLength() * this.lineHeight + this.pad;
            cell.resize();
            cell.container.scrollIntoView();
        });
        cell.container.style.display = "none";
        cell.isVisible = false;
        return cell;
    };

})();
