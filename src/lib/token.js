/* Implementation of the Python token module */

var $builtinmodule = function (name) {
    var mod = {};

    mod.__file__ = "/src/lib/token.py";

    const tok_name_values = [];
    for (token in Sk.token.tok_name) {
        const token_name = Sk.token.tok_name[token].slice(2);
        const token_num = parseInt(token, 10);

        tok_name_values.push(Sk.ffi.remapToPy(token_num));
        tok_name_values.push(Sk.ffi.remapToPy(token_name));

        mod[token_name] = Sk.ffi.remapToPy(token_num);
    }
    mod.tok_name = new Sk.builtin.dict(tok_name_values);

    mod.ISTERMINAL = new Sk.builtin.func(function (token) {
        Sk.builtin.pyCheckArgsLen("ISTERMINAL", arguments.length, 1, 1);
        return Sk.token.ISTERMINAL(Sk.ffi.remapToJs(token));
    });

    mod.ISNONTERMINAL = new Sk.builtin.func(function (token) {
        Sk.builtin.pyCheckArgsLen("ISNONTERMINAL", arguments.length, 1, 1);
        return Sk.token.ISNONTERMINAL(Sk.ffi.remapToJs(token));
    });

    mod.ISEOF = new Sk.builtin.func(function (token) {
        Sk.builtin.pyCheckArgsLen("ISEOF", arguments.length, 1, 1);
        return Sk.token.ISEOF(Sk.ffi.remapToJs(token));
    });

    return mod;
};
