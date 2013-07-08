s = set(range(9))
s1 = set(range(5))
s2 = set(range(4,9))

print "\nlen"
print len(set([])) == 0
print len(s1) == len(s2) == 5

print "\nx in s"
print (4 in s1) == (4 in s2) == True
print (8 in s1) == (1 in s2) == False

print "\nx not in s"
print (1 not in s1) == (8 not in s2) == False
print (8 not in s1) == (1 not in s2) == True

print "\nisdisjoint(other)"
print s1.isdisjoint(s2) == False
print s1.isdisjoint(set(range(5,10))) == True

print "\nissubset(other)"
print s1.issubset(s1) == True
print s1.issubset(s) == True
print s1.issubset(s2) == False

print "\nset <= other"
print (s1 <= s) == True
print (s2 <= s) == True
print (s <= s) == True
print (s1 <= s2) == False

print "\nset < other"
print (s1 < s) == True
print (s2 < s) == True
print (s < s) == False
print (s1 < s2) == False

print "\nissuperset(other)"
print s2.issuperset(s2) == True
print s.issuperset(s1) == True
print s2.issuperset(s1) == False

print "\nset >= other"
print (s >= s1) == True
print (s >= s2) == True
print (s >= s) == True
print (s1 >= s2) == False

print "\nset > other"
print (s > s1) == True
print (s > s2) == True
print (s > s) == False
print (s1 > s2) == False

print "\nunion(other,...)"
print set([]).union(s1) == s1
print s1.union(set([])) == s1
print s1.union(s2) == s
print s1.union(s2,set([4,5,6])) == s

print "\nintersection(other,...)"
print set([]).intersection(s1) == set([])
print s1.intersection(set([])) == set([])
print s1.intersection(s2) == set([4])
print s.intersection(s1,s2) == set([4])

print "\ndifference(other,...)"
print set([]).difference(s1) == set([])
print s1.difference(set([])) == s1
print s1.difference(s2) == set([0,1,2,3])
print s.difference(s1,s2) == set([])

print "\nsymmetric_difference(other)"
print set([]).symmetric_difference(s1) == s1
print s1.symmetric_difference(set([])) == s1
print s1.symmetric_difference(s2) == set([0,1,2,3,5,6,7,8])
print s.symmetric_difference(s1.symmetric_difference(s2)) == set([4])

print "\ncopy()"
print set([]).copy() == set([])
print s1.copy() == s1
s3 = s1.copy()
s1 = set(range(1,5))
print s1 != s3
s3 = s1.copy()
s1.add(0)
print s1 != s3

print "\nupdate(other,...)"
empty = set([])
empty.update(s1); print empty == s1
empty.update(set([])); print empty == s1
empty.update(s2); print empty == s
empty.update(s1,s2,set([4,5,6])); print empty == s

print "\nintersection_update(other,...)"
empty = set([])
empty.intersection_update(s1); print empty == set([])
empty = s1.copy()
empty.intersection_update(set([])); print empty == set([])
empty = s1.copy()
empty.intersection_update(s2); print empty == set([4])
empty = s.copy()
empty.intersection_update(s1,s2); print empty == set([4])

print "\ndifference(other,...)"
empty = set([])
empty.difference_update(s1); print empty == set([])
empty = s1.copy()
empty.difference_update(set([])); print empty == s1
empty.difference_update(s2); print empty == set([0,1,2,3])
empty = s.copy()
empty.difference_update(s1,s2); print empty == set([])

print "\nsymmetric_difference_update(other)"
empty = set([])
empty.symmetric_difference_update(s1); print empty == s1
empty.symmetric_difference_update(set([])); print empty == s1
empty.symmetric_difference_update(s2); print empty == set([0,1,2,3,5,6,7,8])
print s.symmetric_difference(empty) == set([4])

print "\nadd(elem)"
empty = set([])
empty.add(1); print empty == set([1])
s1.add(5); print s1 == set([0,1,2,3,4,5])

print "\nremove(elem)"
empty.remove(1); print empty == set([])
s1.remove(5); print s1 == set([0,1,2,3,4])

print "\ndiscard(elem)"
empty.discard(500); print empty == set([])
s1.discard(4); print s1 == set([0,1,2,3])

print "\npop()"
print s1.pop() in set([0,1,2,3])
print s1.pop() in set([0,1,2,3])
print s1.pop() in set([0,1,2,3])
print s1.pop() in set([0,1,2,3])
print len(s1) == 0
