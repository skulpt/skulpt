l = [0]*5
l[1] = 1; print l[1] == 1
l[2:5] = range(2,5); print l[2] == 2 and l[3]==3 and l[4] == 4
del l[2:5]; print len(l)==2
l = [0]*5
l[0:5:2] = range(0,5,2); l[1:4:2] = range(1,4,2)
print l == list(range(5))
del l[0:5:2]; print l == [1,3]
l.append(5); print l == [1,3,5]
l.extend([7,9]); print l == [1,3,5,7,9]
l.extend(l); print l == [1,3,5,7,9,1,3,5,7,9]
print l.count(3) == 2
print l.count(2) == 0
print l.index(3) == 1
print l.index(9) == 4
l.pop(0); print l == [3,5,7,9,1,3,5,7,9]
l.remove(3); print l == [5,7,9,1,3,5,7,9]
l.reverse(); print l == [9,7,5,3,1,9,7,5]
l.sort(); print l == [1,3,5,5,7,7,9,9]
l.sort(lambda x,y: y-x); print l == [9,9,7,7,5,5,3,1]

