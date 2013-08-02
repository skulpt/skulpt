class Counter:

    class CounterIter:
        def __init__(self, c):
            self.c = c
            self.idx = 0

        def __iter__(self):
            return self

        def next(self):
            n = self.idx
            self.idx += 1
            if n > self.c.stop:
                raise StopIteration
            return n

    def __init__(self, stop):
        self.count = 0
        self.stop = stop
        self.dict = {}

    def __iter__(self):
        return self.CounterIter(self)

    def __len__(self):
        return self.count

    def __repr__(self):
        return "< Counter Object: ("+str(self.count)+","+str(self.stop)+") >"

    def __str__(self):
        return "("+str(self.count)+","+str(self.stop)+")"

    def __call__(self, x):
        for i in range(x):
            if i % 2 != 0:
                continue
            self.dict[i] = i + 1

    def __getitem__(self, key):
        if key in self.dict:
            return self.dict[key]
        return -1

    def __setitem__(self, key, value):
        self.dict[key] = value

a = Counter(10)

for x in a:
    print x

print len(a)
print a, str(a), repr(a)
a(20)
print a[5], a[8], a[30]
a[30] = 'thirty'
print a[30]

b = Counter(5)
c = Counter(5)

print
print list(b)
print sum(c)

print b.__len__()
print b.__str__()
print b.__repr__()
b.__call__(10)
print b.__getitem__(4)
print b.__getitem__(15)
b.__setitem__(15, 'hello')
print b.__getitem__(15)
