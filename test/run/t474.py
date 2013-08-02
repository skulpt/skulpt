class A: pass

print isinstance(4, int)
print isinstance(4, (float,int))
print isinstance(A(), A)
print isinstance(4, (int, float, 5))
print isinstance(4, (int, float, A()))
print isinstance(A, A)

print isinstance(4, type(4))
print isinstance(True, type(False))
print isinstance(5.4, type(1.2))
print isinstance(3L, type(8L))
print isinstance([1,2,3], type([5,6]))
print isinstance({1:2}, type({3:4}))
print isinstance((1,2), type((3,4)))
print isinstance(set([1,2]), type(set([3,4])))
print isinstance(A(), type(A()))
print isinstance(None, type(None))

# for error testing -- all of these should throw a TypeError
# print isinstance(4, 4)
# print isinstance(A(), 4)
# print isinstance(A(), True)
# print isinstance(4, A())
# print isinstance(4, (5, 6, 7))
# print isinstance(4, (5, 6, float))
# print isinstance(4, (5, 6, float, int))
# print isinstance(4, (float, 5, 6))
