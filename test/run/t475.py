def helper(got, expect):
    if got == expect:
        print True
    else:
        print False, expect, got

class Squares:

    def __init__(self, max):
        self.max = max
        self.sofar = []

    def __len__(self): return len(self.sofar)

    def __getitem__(self, i):
        if not 0 <= i < self.max: raise IndexError
        n = len(self.sofar)
        while n <= i:
            self.sofar.append(n*n)
            n += 1
        return self.sofar[i]

class Counter:

    class CounterIterator:
        def __init__(self, c):
            self.count = 0
            self.c = c

        def next(self):
            self.count += 1
            if self.count < self.c.stop:
                return self.count
            raise StopIteration

        def __iter__(self):
            return self

    def __init__(self, stop):
        self.count = 0
        self.stop = stop

    def __iter__(self):
        return self.CounterIterator(self)

helper(sum([]), 0)
helper(sum(range(2,8)), 27)
# helper(sum(iter(range(2,8))), 27)  # iter not defined
# helper(sum(Squares(10)), 285) # can't iterate w/o specific __iter__ method
# helper(sum(iter(Squares(10))), 285) # iter not defined
helper(sum([[1], [2], [3]], []), [1, 2, 3])
helper(sum([[1,2],[3,4]],[5,6]), [5, 6, 1, 2, 3, 4])
helper(sum(((1,2,3),(4,5)),(6,7)),(6, 7, 1, 2, 3, 4, 5))
helper(sum(Counter(10), 5), 50)

# error testing -- all of these should throw a TypeError
# print sum(1,2,3,4)
# print sum([1,2,3,'7'])
# print sum([1,2,3],1.7)
# print sum([1,2,3],'8')
# print sum([1,2,3],[2,3])
# print sum([1,2,3],{1:2})
