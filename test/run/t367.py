x = ((1 << 64) + 1)
print x
x >>= 3
print x

y = 1 << 64
print y
y += 1
print y
y &= 1
print y

print ((1 << 64) + 1) & 1

print (((1 << 64) + 1) & 1) == 0
