class GeneratorClass:
    test = "hi"
    def __init__(self):
        pass
    def generator(self):
	print self.test
        for i in range(10):
            yield i

gen = GeneratorClass()

for g in gen.generator():
    print g