l = [1, 2, 3, 4]
for i in l.__iter__():
    print i

class MyIterable:
    def __init__(self, lst):
        self.x = 3
        self.iter = lst

    def __iter__(self):
        return self.iter.__iter__()

mi = MyIterable([5, 6, 7])

for i in mi.__iter__():
    print i

for i in mi:
    print i

class Counter:
    def __init__(self, low, high):
        self.current = low
        self.high = high

    def __iter__(self):
        return self

    def next(self):
        if self.current > self.high:
            raise StopIteration
        else:
            self.current += 1
            return self.current - 1


for c in Counter(9, 12):
    print c
