import math as module

module = list
meth = type(str.count) 
for x in module.__dict__: 
    bltin = getattr(module, x) 
    if isinstance(bltin, meth): 
            print(\
f"{x}: {'{'}\n"
f"\t$meth: methods.{x},\n" 
f"\t$flags:{'{}'},\n"
f"\t$textsig: \"{ bltin.__text_signature__.__repr__()[1:-1] }\",\n"
f"\t$doc: \"{bltin.__doc__.__repr__()[1:-1]}\" {'}' },")


sw = type(property.__repr__)
this = list
other = tuple

for x in this.__dict__.keys() - other.__dict__.keys():
    bltin = getattr(this, x)
    if isinstance(bltin, sw):
       print(\
f"slots.{x} = {'{'}\n"
f"\t$name: \"{x}\",\n" 
f"\t$slot_func: function () {'{ }'},\n" 
f"\t$wrapped: function {x} () {'{ }'},\n"
f"\t$flags: {'{ }'},\n"
f"\t$textsig: \"{ bltin.__text_signature__.__repr__()[1:-1] }\",\n"
f"\t$doc: \"{bltin.__doc__.__repr__()[1:-1]}\",\n" 
f"{'};'}")