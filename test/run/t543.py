class MyClass:
    def my_method(self, mandatory_arg, x=0, y=0, **more_args):
        print "Hello! x = " + str(x)

    def my_method2(self):
        self.my_method("hi", y=2)

k = MyClass()
k.my_method('test', x=5, bla='seven')
k.my_method2()
