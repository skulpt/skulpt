a = [1,2,3,4,5,6]
b = [9,9,9]
a[1:5] = b
print a
mylist = ['a', 'b', 'c', 'd']
d = {'1':1,'2':2}
mylist[0:2] = d
print mylist
mylist[1:3] = 'temp'
print mylist
mylist[:] = ['g','o','o','d']
print mylist