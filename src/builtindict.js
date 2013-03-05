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
'fabs': Sk.builtin.abs,	//	Added by RNL
'round': Sk.builtin.round,
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
'Exception' : Sk.builtin.Exception,
'ZeroDivisionError' : Sk.builtin.ZeroDivisionError,
'AssertionError' : Sk.builtin.AssertionError,
'ImportError' : Sk.builtin.ImportError,
'IndentationError' : Sk.builtin.IndentationError,
'IndexError' : Sk.builtin.IndexError,
'KeyError' : Sk.builtin.KeyError,
'TypeError' : Sk.builtin.TypeError,
'NameError' : Sk.builtin.NameError,
'IOError' : Sk.builtin.IOError,
'NotImplementedError' : Sk.builtin.NotImplementedError,

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
'super': Sk.builtin.superbi,
'tuple': Sk.builtin.tuple,
'type': Sk.builtin.type,
'input': Sk.builtin.input,
'raw_input': Sk.builtin.raw_input,
/*'read': Sk.builtin.read,*/
'all': Sk.builtin.all,
'any': Sk.builtin.any,
'jseval': Sk.builtin.jseval,
'jsmillis': Sk.builtin.jsmillis
/*'long_div_mode': Sk.builtin.lng.longDivideMode	//	No longer used/relevant */
};
goog.exportSymbol("Sk.builtins", Sk.builtins);
