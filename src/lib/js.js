function $builtinmodule() {
    const mod = { __name__: new Sk.builtin.str("js") };
    mod.window = Sk.ffi.proxy(window);
    Sk.abstr.objectSetItem(Sk.sysmodules, new Sk.builtin.str("js.window"), mod.window);
    return mod;
}
