// Preload in Node to exercise browsers that cannot compile lookbehind assertions.
const NativeRegExp = RegExp;
global.RegExp = new Proxy(NativeRegExp, {
    construct(target, args) {
        if (/\(\?<[=!]/.test(String(args[0]))) {
            throw new SyntaxError("Lookbehind assertions are not supported");
        }
        return Reflect.construct(target, args);
    },
});
