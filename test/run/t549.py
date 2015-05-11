s = { i*i for i in range(100) if i&1 == 1 }
print s
s2 = { 2*y + x + 1 for x in (0,) for y in (1,) }
print s2
