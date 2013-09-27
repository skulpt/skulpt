class A:
    def __getitem__(self, slices):
        return slices

a = A()

print a[1]
print a[0:2]
print a[:2]
print slice(2)
print a[1:]
print a[:]
print a[::]
print a[::-1]
print a[0,1:2]
print a[0:2,2:30:1]

assert(a[1]==1)
assert(a[0:2]==slice(0,2))
assert(a[0,1:2]==(0,slice(1,2)))
assert(a[0:2,2:30:1]==(slice(0,2), slice(2,30,1)))

assert(slice(0,2) == slice(0,2))
assert(slice(0,2) < slice(1,2))
assert(slice(0,2) < slice(1,1))
assert(slice(2) < slice(0,2))
assert(slice(1,2) < slice(1,2,3))
assert(slice(1,2,3) < slice(1,2,4))
assert(slice(1,-1) < slice(1,1))
assert(slice(0,1) < slice(1,-1))

assert(a["foo"] == "foo")
assert(a["foo":(1,2):True].start == "foo")
assert(a["foo":(1,2):True].stop == (1,2))
assert(a["foo":(1,2):True].step == True)
