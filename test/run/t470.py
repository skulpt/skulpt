def helper(got,expect):
    if got == expect: print True
    else: print False, expect, got

print "\nstr.find"
helper('hello world'.find('l',-2),9)
helper('hello world'.find('l',4,6),-1)
helper('hello world'.find('o',2,5),4)
helper('hello world'.find('o',2,-5),4)
helper('hello world'.find('o',-8,-5),4)
helper('hello world'.find('o',-3,-1),-1)

print "\nstr.index"
helper('hello world'.index('l',-2),9)
helper('hello world'.index('o',2,5),4)
helper('hello world'.index('o',2,-5),4)
helper('hello world'.index('o',-8,-5),4)

print "\nstr.rfind"
helper('hello world'.rfind('h',-2),-1)
helper('hello world'.rfind('l',2,4),3)
helper('hello world'.rfind('l',2,8),3)
helper('hello world'.rfind('l',-1,10),-1)
helper('hello world'.rfind('l',1,-3),3)
helper('hello world'.rfind('l',-9,-2),3)

print "\nstr.rindex"
helper('hello world'.rindex('l',-2),9)
helper('hello world'.rindex('l',0,-3),3)
helper('hello world'.rindex('o',2,7),4)
helper('hello world'.rindex('o',2,-2),7)
helper('hello world'.rindex('o',-5,-2),7)
