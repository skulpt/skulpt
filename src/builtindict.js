// Note: the hacky names on int, long, float have to correspond with the
// uniquization that the compiler does for words that are reserved in
// Javascript. This is a bit hokey.
Sk.builtins = {
'range': Sk.builtin.range,
'len': Sk.builtin.len,
'min': Sk.builtin.min,
'max': Sk.builtin.max,
'sum': Sk.builtin.sum,
'abs': Sk.builtin.abs,
'ord': Sk.builtin.ord,
'chr': Sk.builtin.chr,
'dir': Sk.builtin.dir,
'repr': Sk.builtin.repr,
'open': Sk.builtin.open,
'isinstance': Sk.builtin.isinstance,
'hash': Sk.builtin.hash,
'getattr': Sk.builtin.getattr,
'float_$rw$': Sk.builtin.float_,
'int_$rw$': Sk.builtin.int_,

'AttributeError': Sk.builtin.AttributeError,
'ValueError': Sk.builtin.ValueError,

'dict': Sk.builtin.dict,
'file': Sk.builtin.file,
'function': Sk.builtin.func,
'generator': Sk.builtin.generator,
'list': Sk.builtin.list,
'long_$rw$': Sk.builtin.lng,
'method': Sk.builtin.method,
'object': Sk.builtin.object,
'slice': Sk.builtin.slice,
'str': Sk.builtin.str,
'set': Sk.builtin.set,
'tuple': Sk.builtin.tuple,
'type': Sk.builtin.type,
'input': Sk.builtin.input
};
goog.exportSymbol("Sk.builtins", Sk.builtins);
