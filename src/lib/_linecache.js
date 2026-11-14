// Browser hosts supply decoded source through Sk.read, which may suspend.
var $builtinmodule = function () {
    return {
        read_source: new Sk.builtin.func(function (filename) {
            Sk.abstr.checkArgsLen("read_source", arguments, 1, 1);
            Sk.builtin.pyCheckType("filename", "str", Sk.builtin.checkString(filename));
            return Sk.misceval.tryCatch(
                () =>
                    Sk.misceval.chain(Sk.read(filename.v), (source) =>
                        source === undefined ? Sk.builtin.none.none$ : new Sk.builtin.str(source)
                    ),
                // Source lookup must not hide the exception being formatted.
                () => Sk.builtin.none.none$
            );
        }),
    };
};
