def helper(got,expect):
    if got == expect: print True
    else: print False, expect, got

print "\nstr.replace"
helper('hello'.replace('l','L'),'heLLo')
helper('hello'.replace('l','L',1),'heLlo')
helper('hello'.replace('l','L',5),'heLLo')
helper('hello'.replace('l','L',0),'hello')
helper('hello hello hello'.replace('ll','lll'),'helllo helllo helllo')
helper('hello hello hello'.replace('ll','lll',2),'helllo helllo hello')
helper('hello hello hello'.replace('ll','l'),'helo helo helo')
helper('hello hello hello'.replace('ll','l',2),'helo helo hello')
helper('abcabcaaaabc'.replace('abc','123'),'123123aaa123')
helper('abcabcaaaabc'.replace('abc','123',2),'123123aaaabc')
helper('abcabcaaaabc'.replace('abc','123',-1),'123123aaa123')
