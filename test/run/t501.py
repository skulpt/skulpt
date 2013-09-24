lst = [1, 2, 3]
check = 1 in lst
print type(check)

d = {1: 2}
check = d.has_key(1)
print type(check)
check = 3 in d
print type(check)

lst2 = [1, 2, 3, 4]
check = lst2.reverse()
print type(check)
check = lst2.append(8)
print type(check)
check = lst2.insert(2, 3)
print type(check)
check = lst2.extend(lst)
print type(check)
check = lst2.remove(4)
print type(check)
check = lst2.index(2)
print type(check)
check = lst2.count(3)
print type(check)
check = lst2.sort()
print type(check)

s = set([1, 2, 3])
check = s.isdisjoint(s)
print type(check)
print s
check = s.issubset(s)
print type(check)
print s
check = s.update(s)
print type(check)
print s
s2 = set([2, 3])
check = s.intersection_update(s2)
print type(check)
print s
check = s.difference_update(s2)
print type(check)
print s
check = s.symmetric_difference_update(s2)
print type(check)
print s
check = s.add(4)
print type(check)
print s
check = s.discard(4)
print type(check)
print s
check = s.remove(3)
print type(check)
print s

t = (1, 2, 3)
check = t.index(2)
print type(check)
check = t.count(3)
print type(check)

s = "abcabcabc"
check = s.count('a')
print type(check)
check = s.find('bc')
print type(check)
check = s.index('cab')
print type(check)
check = s.rfind('bc')
print type(check)
check = s.rindex('cab')
print type(check)
