l = [1,2,3,4]
t = (1,2,3,4)
d = {1:2,3:4}
s = "1234"

print zip()
print zip(l), zip(t), zip(d), zip(s)

print zip(l,t), zip(l,d), zip(l,s)
print zip(t,d), zip(t,s)
print zip(d,s)

print zip(l,t,s)
print zip(l,t,s,d)

z = zip(l,t,s)
print zip(*z)

z = zip(l,t,s,d)
print zip(*z)
