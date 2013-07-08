print "\nSTRINGS"
s = 'hello'
print ('h' in s) == True
print ('H' in s) == False
print ('e' not in s) == False
print ('L' not in s) == True
print ('hello' + ' world') == 'hello world'
print 'a'*3 == 'aaa'
print 2*'hello' == 'hellohello'
s = '01234'
print s[4] == '4'
print s[-1] == '4'
print s[0:3] == s[:3] == s[None:3] == '012'
print s[0:] == s[0:None] == s[:] == '01234'
print s[1:3] == '12'
print s[-1:3] == ''
print s[-3:3] == '2'
print s[-4:-1] == '123'
print s[0:5:1] == s[:5:1] == s[0::1] == s[0:5:] == s[0::] == s[:5:] == s[::1] == s[::] =='01234'
print s[::-1] == '43210'
print s[4:2:-1] == '43'
print s[-1:2:-2] == '4'
print len(s) == 5
print min(s) == '0'
print max(s) == '4'

print "\nLISTS"
l = [0,1,2,3,4]
print (0 in l) == True
print (5 in l) == False
print (4 not in l) == False
print ('hello' not in l) == True
print ([0,1,2] + [3,4]) == l
print [0]*3 == [0,0,0]
print 2*[1,2] == [1,2,1,2]
l2 = [[]]*3
l2[0].append(3)
print l2 == [[3],[3],[3]]
print l[4] == 4
print l[-1] == 4
print l[0:3] == l[:3] == l[None:3] == [0,1,2]
print l[0:] == l[0:None] == l[:] == [0,1,2,3,4]
print l[1:3] == [1,2]
print l[-1:3] == []
print l[-3:3] == [2]
print l[-4:-1] == [1,2,3]
print l[0:5:1] == l[:5:1] == l[0::1] == l[0:5:] == l[0::] == l[:5:] == l[::1] == l[::] == [0,1,2,3,4]
print l[::-1] == [4,3,2,1,0]
print l[4:2:-1] == [4,3]
print l[-1:2:-2] == [4]
print len(l) == 5
print min(l) == 0
print max(l) == 4

print "\nTUPLES"
t = (0,1,2,3,4)
print (0 in t) == True
print (5 in t) == False
print (4 not in t) == False
print ('hello' not in t) == True
print ((0,1,2) + (3,4)) == t
print (0,)*3 == (0,0,0)
print 2*(1,2) == (1,2,1,2)
print t[4] == 4
print t[-1] == 4
print t[0:3] == t[:3] == t[None:3] == (0,1,2)
print t[0:] == t[0:None] == t[:] == (0,1,2,3,4)
print t[1:3] == (1,2)
print t[-1:3] == ()
print t[-3:3] == (2,)
print t[-4:-1] == (1,2,3)
print t[0:5:1] == t[:5:1] == t[0::1] == t[0:5:] == t[0::] == t[:5:] == t[::1] == t[::] == (0,1,2,3,4)
print t[::-1] == (4,3,2,1,0)
print t[4:2:-1] == (4,3)
print t[-1:2:-2] == (4,)
print len(t) == 5
print min(t) == 0
print max(t) == 4

