/* Implementation of the python tokenize module */

var $builtinmodule = function(name) {
    var mod = {};

    mod.tokenize = new Sk.builtin.func(function(readline) {
        Sk.builtin.pyCheckArgsLen("tokenize", 1, 1);
        Sk.builtin.checkFunction(readline);

        // We construct a list of all tokens, since we can't yield from
        // within the tokenizer function as it currently exists. This may
        // be inefficient for tokenizing large files
        const tokens = [];
        function receiveToken(token) {
            tokens.push(
                new Sk.builtin.tuple([
                    Sk.ffi.remapToPy(token.type),
                    Sk.ffi.remapToPy(token.string),
                    new Sk.builtin.tuple([Sk.ffi.remapToPy(token.start[0]), Sk.ffi.remapToPy(token.start[1])]),
                    new Sk.builtin.tuple([Sk.ffi.remapToPy(token.end[0]), Sk.ffi.remapToPy(token.end[1])]),
                    Sk.ffi.remapToPy(token.line)
                ])
            );
        }

        function jsReadline() {
            const line = Sk.misceval.callsimArray(readline);
            return Sk.ffi.remapToJs(line);
        }

        Sk._tokenize("<stdin>", jsReadline, "UTF-8", receiveToken);

        return new Sk.builtin.list(tokens);
    });

    return mod;
};
