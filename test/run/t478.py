#map 
seq = range(8)
newseq = map(lambda x : x*x, seq);
print newseq

#reduce
rseq = range(16)
rnewseq = reduce(lambda x,y: x + y, rseq)
print rnewseq
rnewseq2 = reduce(lambda x,y: x + y, [], 8)
print rnewseq2

#filter
fseq = range(16)
fnewseq = filter(lambda x: x % 2 == 0, fseq)
print fnewseq

#mapoverstring
def f(x):
    return ord(x)

print map(f, "abcdef")

#filter over string returns string
string = filter(lambda c: c != 'a', "abc")
print type(string)
print string

#filter over tuple returns tuple
tup = filter(lambda t: t % 2 == 0, (1,2,3,4,5,6,7,8,9,10))
print type(tup)
print tup

#filter with default identity func
print filter(None, [0,1,"","hello",False,True])

#map with two iterables
b = range(8)
c = range(10)
def mapy(x, y):
    if (x == None): x = 0
    if (y == None): y = 0
    return x + y

print map(mapy, b, c)

#map with default identity func
print map(None, [0, 1, {}, "", "hello", False, True]);