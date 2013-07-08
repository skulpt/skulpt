def helper(got,expect):
    if got == expect: print True
    else: print False,expect,got

print "\nstr.split()"
helper(''.split(),[])
helper(''.split(None),[])
helper(''.split(None,1),[])

helper(''.split('a'),[''])
helper(''.split('a',1),[''])

helper('hello'.split(),['hello'])
helper('hello'.split(None),['hello'])
helper('   hello world      '.split(),['hello', 'world'])
helper('   hello world      '.split(None),['hello', 'world'])
helper('   hello world      '.split(None,1),['hello', 'world      '])

helper('hello world   ! '.split(),['hello','world','!'])
helper('hello'.split('l'),['he','','o'])
helper('hello'.split('l',1),['he','lo'])

print "\nSEP AS A REGULAR EXPRESSION"
print "without regex syntax"
helper('aaaba'.split('a'),['','','','b',''])
helper('aaaba'.split('b'),['aaa','a'])
print "\nsyntax: ."
helper('aaaba'.split('a.'),['aaaba'])
helper('aaaba'.split('.a'),['aaaba'])
helper('aaaba'.split('a.',1),['aaaba'])
helper('aaaba'.split('.a',1),['aaaba'])
helper('aaaba'.split('b.'),['aaaba'])
helper('aaaba'.split('.b'),['aaaba'])
print "\nsyntax: ^"
helper('aaaba'.split('^a'),['aaaba'])
helper('aaaba'.split('^b'),['aaaba'])
print "\nsyntax: $"
helper('aaaba'.split('a$'),['aaaba'])
helper('aaaba'.split('b$'),['aaaba'])
print "\nsyntax: *"
helper('aaaba'.split('a*'),['aaaba'])
helper('aaaba'.split('b*'),['aaaba'])
helper('aaaba'.split('ab*'),['aaaba'])
helper('aaaba'.split('ab*',1),['aaaba'])
print "\nsyntax: +"
helper('aaaba'.split('a+'),['aaaba'])
helper('aaaba'.split('b+'),['aaaba'])
helper('aaaba'.split('ab+'),['aaaba'])
print "\nsyntax: ?"
helper('aaaba'.split('a?'),['aaaba'])
helper('aaaba'.split('a?',1),['aaaba'])
helper('aaaba'.split('b?'),['aaaba'])
helper('aaaba'.split('ab?'),['aaaba'])
helper('aaaba'.split('ab?',1),['aaaba'])
print "\nsyntax: *?"
helper('aaaba'.split('a*?'),['aaaba'])
helper('aaaba'.split('b*?'),['aaaba'])
helper('aaaba'.split('ab*?'),['aaaba'])
helper('aaaba'.split('ab*?',1),['aaaba'])
print "\nsyntax: +?"
helper('aaaba'.split('a+?'),['aaaba'])
helper('aaaba'.split('a+?',1),['aaaba'])
helper('aaaba'.split('b+?'),['aaaba'])
helper('aaaba'.split('ab+?'),['aaaba'])
print "\nsyntax: ??"
helper('aaaba'.split('a??'),['aaaba'])
helper('aaaba'.split('b??'),['aaaba'])
helper('aaaba'.split('ab??'),['aaaba'])
helper('aaaba'.split('ab??',1),['aaaba'])
print "\nsyntax: {}"
helper('aaaba'.split('a{2}'),['aaaba'])
helper('aaaba'.split('a{1,2}'),['aaaba'])
helper('aaaba'.split('a{1,2}',1),['aaaba'])
helper('aaaba'.split('a{,2}'),['aaaba'])
helper('aaaba'.split('a{1,}'),['aaaba'])
helper('aaaba'.split('a{1,}',1),['aaaba'])
helper('aaaba'.split('b{1}'),['aaaba'])
helper('aaaba'.split('b{1,2}'),['aaaba'])
helper('aaaba'.split('b{,2}'),['aaaba'])
helper('aaaba'.split('b{1,}'),['aaaba'])
print "\nsyntax: {}?"
helper('aaaba'.split('a{2}?'),['aaaba'])
helper('aaaba'.split('a{1,2}?'),['aaaba'])
helper('aaaba'.split('a{1,2}?',1),['aaaba'])
helper('aaaba'.split('a{,2}?'),['aaaba'])
helper('aaaba'.split('a{1,}?'),['aaaba'])
helper('aaaba'.split('a{1,}?',1),['aaaba'])
helper('aaaba'.split('b{1}?'),['aaaba'])
helper('aaaba'.split('b{1,2}?'),['aaaba'])
helper('aaaba'.split('b{,2}?'),['aaaba'])
helper('aaaba'.split('b{1,}?'),['aaaba'])
print "\nsyntax: []"
helper('aaaba'.split('[a-z]'),['aaaba'])
helper('aaaba'.split('[a-z]',1),['aaaba'])
helper('aaaba'.split('[ab]'),['aaaba'])
helper('aaaba'.split('[ab]',1),['aaaba'])
print "\nsyntax: |"
helper('aaaba'.split('a|b'),['aaaba'])
helper('aaaba'.split('a|b',1),['aaaba'])
print "\nsyntax: (...)"
helper('aaaba'.split('(a)(a)(b)(a)'),['aaaba'])
helper('aaaba'.split('(a)(a)(b)(a)',1),['aaaba']) 
helper('aaaba'.split('(a{2})(.b.)'),['aaaba'])
helper('aaaba'.split('(a{2})(.b.)',1),['aaaba']) 

