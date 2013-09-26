class A:
    def __getitem__(self, slices):
        return slices

a = A()

print a[1]
print a[0:2]
print a[0,1:2]
print a[0:2,2:30:1]

assert(a[1]==1)
assert(a[0:2]==slice(0,2))
assert(a[0,1:2]==(0,slice(1,2)))
assert(a[0:2,2:30:1]==(slice(0,2), slice(2,30,1)))

# Python makes a distinction, not sure whether we need to: assert(slice(0,2)!=slice(2))
assert(slice(0,2) == slice(0,2))
assert(slice(0,2) < slice(1,2))
assert(slice(0,2) < slice(1,1))
assert(slice(1,2) < slice(1,2,3))
assert(slice(1,2,3) < slice(1,2,4))
assert(slice(1,-1) < slice(1,1))
assert(slice(0,1) < slice(1,-1))

