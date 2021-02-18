function $builtinmodule() {
    var documentMod = {
        __name__: new Sk.builtin.str("document"),
    };
    var jsDocument = Sk.global.document;
    var documentProxyObject = Sk.ffi.toPy(jsDocument);

    Sk.abstr.setUpModuleMethods("document", documentMod, {
        __getattr__: {
            $meth(pyName) {
                var ret = documentProxyObject.tp$getattr(pyName);
                if (ret === undefined) {
                    throw new Sk.builtin.AttributeError(pyName.toString());
                }
                return ret;
            },
            $flags: { OneArg: true },
        },
        __dir__: {
            $meth() {
                // may want to include more than this
                return Sk.ffi.toPy(Object.keys(document));
            },
            $flags: { NoArgs: true },
        },
    });
    return documentMod;
}
