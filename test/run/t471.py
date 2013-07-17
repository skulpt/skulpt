def helper(got,expect):
    if got == expect: print True
    else: print False, expect, got

print "\nstr.count"
helper('abcd abcba '.count('abc'),2)
helper('abcd abcba '.count('z'),0)

helper('abcd abcba '.count('abc',1),1)
helper('abcd abcba '.count('abc',-1),0)
helper('abcd abcba '.count('abc',5),1)
helper('abcd abcba '.count('abc',-5),0)

helper('abcd abcba '.count('abc',1,8),1)
helper('abcd abcba '.count('abc',-6,-3),1)
helper('abcd abcba '.count('abc',4,-1),1)
helper('abcd abcba '.count('abc',-6,10),1)

helper('abcd abcda '.count('ad',-6,-3),0)
helper('abcd abcba '.count('a',-6,-6),0)
helper('abcd abcba '.count('a',6,-7),0)
helper('abcd abcba '.count('a',3,1),0)

helper('abcd abcba '.count('a',-100,100),3)
helper('abcd abcba '.count('a',100,-100),0)
