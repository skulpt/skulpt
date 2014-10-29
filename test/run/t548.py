class Foo:
   pass

class Bar(Foo):
   pass

class Baz(Bar):
    pass

class XXX:
    pass
    
class Frob(Baz,XXX):    
    pass
    
print issubclass(Bar,Foo)
print issubclass(Foo,Bar)
print issubclass(Baz,Foo)
print issubclass(Baz,Bar)
print issubclass(Foo,object)
print issubclass(Frob,XXX)

