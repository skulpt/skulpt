// Traceback nodes retain a frame and the location at which an exception crossed it.
// A frame is allocated only when an exception first reaches that invocation.
Sk.builtin.frame = Sk.abstr.buildNativeClass("frame", {
    constructor: function frame(code, filename) {
        this.$code = code;
        this.$filename = filename;
    },
    slots: {
        tp$new() {
            throw new Sk.builtin.TypeError("cannot create 'frame' instances");
        },
    },
    getsets: {
        f_code: {
            $get() {
                return Sk.builtin.code.fromCompiled(this.$code, this.$filename);
            },
        },
    },
    flags: { sk$acceptable_as_base_class: false },
});

Sk.builtin.traceback = Sk.abstr.buildNativeClass("traceback", {
    constructor: function traceback(next, frame, lineno) {
        this.$next = next;
        this.$frame = frame;
        this.$lineno = lineno;
    },
    slots: {
        tp$new() {
            throw new Sk.builtin.NotImplementedError("constructing tracebacks is not supported");
        },
    },
    getsets: {
        tb_next: { $get() { return this.$next; } },
        tb_frame: { $get() { return this.$frame; } },
        tb_lineno: { $get() { return new Sk.builtin.int_(this.$lineno); } },
    },
    flags: { sk$acceptable_as_base_class: false },
});

Sk.builtin.addTraceback = function (error, frame, lineno, colno) {
    // Python traverses the outermost frame first. JS hosts already consume
    // error.traceback in the opposite order, including source columns.
    error.$traceback = new Sk.builtin.traceback(
        error.$traceback || Sk.builtin.none.none$, frame, lineno === undefined ? 0 : lineno
    );
    error.traceback.push({ lineno, colno, filename: frame.$filename });
};

Sk.exportSymbol("Sk.builtin.frame", Sk.builtin.frame);
Sk.exportSymbol("Sk.builtin.addTraceback", Sk.builtin.addTraceback);
