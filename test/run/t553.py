from time import sleep

class GeneratorClass:
    test = "hi"
    def __init__(self):
        pass
    def generator(self):
        print self.test
        for i in range(10):
            yield i
    def sleeping_generator(self):
        print self.test
        for i in range(10):
            sleep(0.01)
            yield i

gen = GeneratorClass()

for g in gen.generator():
    print g

for g in gen.sleeping_generator():
    print g


print list(gen.generator())

print list(gen.sleeping_generator())

print [x*2 for x in gen.generator()]

print [x*2 for x in gen.sleeping_generator()]
