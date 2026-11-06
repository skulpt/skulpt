// Preload before Skulpt. Keep the capability disabled for the whole test process.
const NativeRegExp = global.RegExp;
function rejectPropertyEscapes(args) {
    if (/u/.test(args[1] || "") && /\\[pP]\{/.test(args[0])) {
        throw new SyntaxError("Unicode property escapes are not supported");
    }
}
global.RegExp = new Proxy(NativeRegExp, {
    construct(target, args) {
        rejectPropertyEscapes(args);
        return Reflect.construct(target, args);
    },
    apply(target, receiver, args) {
        rejectPropertyEscapes(args);
        return Reflect.apply(target, receiver, args);
    },
});
