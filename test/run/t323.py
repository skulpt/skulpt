class Foo:

    def __init__(self, arg):
        self.x = None

    def __getitem__(self,key):
        return self.x

x = Foo(5)
print x[1]
