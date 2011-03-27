s = set([1,2,3])
copy_s = s.copy()
new_s = set(s)
copy_s.add(42)
new_s.add(13)

print s
print copy_s
print new_s
