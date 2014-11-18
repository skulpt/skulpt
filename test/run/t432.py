def helper(got,expect):
    if got == expect: print True
    else: print False, expect, got

print "\nstr.capitalize"
helper('hello world'.capitalize(),'Hello world')
helper('HELLO WorlD'.capitalize(),'Hello world')

print "\nstr.center"
helper('12345'.center(7),' 12345 ')
helper('12345'.center(8),' 12345  ')

print "\nstr.count"
helper('abcd abcba '.count('abc'),2)
helper('aaaaaaaaaaa '.count('aa'),5)

print "\nstr.find"
helper('hello world'.find('l'),2)
helper('hello world'.find('X'),-1)
helper('hello world'.find('l',3),3)

print "\nstr.index"
helper('hello world'.index('l'),2)
helper('hello world'.index('l',3),3)

print "\nstr.isdigit"
helper('hello'.isdigit(),False)
helper('1234'.isdigit(),True)
helper(''.isdigit(),False)
helper('123.45'.isdigit(),False)

print "\nstr.isalpha"
helper('ABCabc'.isalpha(),True)
helper('abc123'.isalpha(),False)
helper('ABC abc'.isalpha(),False)
helper(''.isalpha(),False)

print "\nstr.isalnum"
helper('ABCabc'.isalnum(),True)
helper('abc123'.isalnum(),True)
helper('ABC abc'.isalnum(),False)
helper(''.isalnum(),False)

print "\nstr.islower"
helper('abc'.islower(),True)
helper('abc123'.islower(),True)
helper('ABC abc'.islower(),False)
helper(''.islower(),False)

print "\nstr.isupper"
helper('ABC'.isupper(),True)
helper('ABC123'.isupper(),True)
helper('ABC abc'.isupper(),False)
helper(''.isupper(),False)

print "\nstr.isnumeric"
helper('123'.isnumeric(),True)
helper('abc123'.isnumeric(),False)
helper('1 2 3'.isnumeric(),False)
helper('123.4'.isnumeric(),False)
helper(''.isnumeric(),False)

print "\nstr.join"
helper('-'.join('1234'),'1-2-3-4')
helper('-'.join(('1','2','3','4')),'1-2-3-4')
helper('-'.join(['1','2','3','4']),'1-2-3-4')

print "\nstr.ljust"
helper('12345'.ljust(8),'12345   ')
helper('   12345'.ljust(8),'   12345')

print "\nstr.lower"
helper("HELLO".lower(),'hello')
helper("Hello woRLd!".lower(),'hello world!')
helper("hello".lower(),'hello')
helper(''.lower(),'')

print "\nstr.lstrip"
helper('    hello'.lstrip(),'hello')
helper('     '.lstrip(),'')

print "\nstr.partition"
helper('hello'.partition('h'),('','h','ello'))
helper('hello'.partition('l'),('he','l','lo'))
helper('hello'.partition('o'),('hell','o',''))
helper('hello'.partition('x'),('hello','',''))

print "\nstr.replace"
helper('hello'.replace('l','L'),'heLLo')
helper('hello wOrld!'.replace('o',''),'hell wOrld!')
helper(''.replace('','hello'),'hello')
helper('hello'.replace('','!'),'!h!e!l!l!o!')
helper('abcabcaaaabc'.replace('abc','123'),'123123aaa123')

print "\nstr.rfind"
helper('hello world'.rfind('l'),9)
helper('hello world'.rfind('X'),-1)
helper('hello world'.rfind('l',3),9)

print "\nstr.rindex"
helper('hello world'.rindex('l'),9)
helper('hello world'.rindex('l',3),9)

print "\nstr.rjust"
helper('12345'.rjust(8),'   12345')
helper('12345   '.rjust(8),'12345   ')

print "\nstr.rpartition"
helper('hello'.rpartition('h'),('','h','ello'))
helper('hello'.rpartition('l'),('hel','l','o'))
helper('hello'.rpartition('o'),('hell','o',''))
helper('hello'.rpartition('x'),('','','hello'))

print "\nstr.rstrip"
helper('hello    '.rstrip(),'hello')
helper('     '.rstrip(),'')

print "\nstr.split"
helper(''.split(),[])
helper(''.split(None),[])
helper('hello'.split(),['hello'])
helper('hello'.split(None),['hello'])
helper('hello world   ! '.split(),['hello','world','!'])
helper(''.split('a'),[''])
helper(''.split('a',1),[''])
helper('hello'.split('l'),['he','','o'])
helper('hello'.split('l',1),['he','lo'])

print "\nstr.strip"
helper('    hello    '.strip(),'hello')
helper('     '.strip(),'')

print "\nstr.upper"
helper('hello'.upper(),'HELLO')
helper("Hello woRLd!".upper(),'HELLO WORLD!')
helper("HELLO".upper(),'HELLO')
helper(''.upper(),'')
