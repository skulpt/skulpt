function $builtinmodule() {
    const {
        ffi: { remapToPy: toPy },
        builtin: { frozenset: pyFrozenSet, str: pyStr },
    } = Sk;

    const __name__ = new pyStr("keyword");
    const __all__ = toPy(["iskeyword", "issoftkeyword", "kwlist", "softkwlist"]);

    const kwlist = toPy([
        "False",
        "None",
        "True",
        "and",
        "as",
        "assert",
        "async",
        "await",
        "break",
        "class",
        "continue",
        "def",
        "del",
        "elif",
        "else",
        "except",
        "finally",
        "for",
        "from",
        "global",
        "if",
        "import",
        "in",
        "is",
        "lambda",
        "nonlocal",
        "not",
        "or",
        "pass",
        "raise",
        "return",
        "try",
        "while",
        "with",
        "yield",
    ]);

    const softkwlist = toPy(["_", "case", "match"]);

    const iskeyword = new pyFrozenSet(kwlist).tp$getattr(pyStr.$contains);
    const issoftkeyword = new pyFrozenSet(softkwlist).tp$getattr(pyStr.$contains);

    return { __name__, __all__, kwlist, softkwlist, iskeyword, issoftkeyword };
}
