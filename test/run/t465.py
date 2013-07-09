import re

print "\nSyntax: ."
print re.findall(".","")
print re.findall(".","a")
print re.findall(".a","a")
print re.findall("a","a")
print re.findall("a.","a\n")
print re.findall(".a","ba")

print "\nSyntax: ^"
print re.findall("^","")
print re.findall("a^","")
print re.findall("^a","ba")
print re.findall("^a","ab")
print re.findall("^a","\na")
print re.findall("a^","a")

print "\nSyntax: $"
print re.findall("$","")
print re.findall("$a","a")
print re.findall("a$","a")
print re.findall("a$","ab")
print re.findall("a$","a\nb")
print re.findall("a$","a\n")

print "\nSyntax: *"
print re.findall("a*","")
print re.findall("ab*","a")
print re.findall("ab*","ab")
print re.findall("ab*","abbbbb")
print re.findall("ab*","ba")
print re.findall("ab*","bbbb")

print "\nSyntax: +"
print re.findall("a+","")
print re.findall("ab+","a")
print re.findall("ab+","ab")
print re.findall("ab+","abbbbb")
print re.findall("ab+","ba")
print re.findall("ab+","bbbb")

print "\nSyntax: ?"
print re.findall("a?","")
print re.findall("ab?","a")
print re.findall("ab?","ab")
print re.findall("ab?","abbbbb")
print re.findall("ab?","ba")
print re.findall("ab?","bbbb")

print "\nSyntax: *?"
print re.findall("a*?","a")
print re.findall("ab*?","abbbb")
print re.findall("ab*?","a")
print re.findall("ab*?","")

print "\nSyntax: +?"
print re.findall("a+?","a")
print re.findall("ab+?","abbbb")
print re.findall("ab+?","a")
print re.findall("ab+?","")

print "\nSyntax: ??"
print re.findall("a??","a")
print re.findall("ab??","abbbb")
print re.findall("ab??","a")
print re.findall("ab??","")

print "\nSyntax: {m}"
print re.findall("a{2}","a")
print re.findall("a{2}","aa")
print re.findall("a{2}","aaa")

print "\nSyntax: {m,n}"
print re.findall("a{1,2}b","b")
print re.findall("a{1,2}b","ab")
print re.findall("a{1,2}b","aab")
print re.findall("a{1,2}b","aaab")
print re.findall("a{,2}b","b")
print re.findall("a{,2}b","ab")
print re.findall("a{,2}b","aab")
print re.findall("a{,2}b","aaab")
print re.findall("a{2,}b","b")
print re.findall("a{2,}b","ab")
print re.findall("a{2,}b","aab")
print re.findall("a{2,}b","aaab")
print re.findall("a{3,5}","aaaaaaaaaa")
print re.findall("a{,5}","aaaaaaaaaa")
print re.findall("a{3,}","aaaaaaaaaa")

print "\nSyntax: {m,n}?"
print re.findall("a{1,2}?b","b")
print re.findall("a{1,2}?b","ab")
print re.findall("a{1,2}?b","aab")
print re.findall("a{1,2}?b","aaab")
print re.findall("a{,2}?b","b")
print re.findall("a{,2}?b","ab")
print re.findall("a{,2}?b","aab")
print re.findall("a{,2}?b","aaab")
print re.findall("a{2,}?b","b")
print re.findall("a{2,}?b","ab")
print re.findall("a{2,}?b","aab")
print re.findall("a{2,}?b","aaab")
print re.findall("a{3,5}?","aaaaaaaaaa")
print re.findall("a{,5}?","aaaaaaaaaa")
print re.findall("a{3,}?","aaaaaaaaaa")

print "\nSyntax: []"
print re.findall("[a,b,c]","abc")
print re.findall("[a-z]","bc")
print re.findall("[A-Z,0-9]","abcdefg")
print re.findall("[^A-Z]","ABCDEFGaHIJKL")
print re.findall("[a*bc]","*")

print "\nSyntax: |"
print re.findall("|","")
print re.findall("|a","")
print re.findall("a|b","ba")
print re.findall("h|ello","hello")

print "\nSyntax: (...)"
print re.findall("(b*)","bbbba") 

print "\nSyntax: (?...)"
print re.findall("(?:b*)","bbbba")
print re.findall("a(?=b)","a")
print re.findall("a(?=b)","ab")
print re.findall("a(?!b)","a")
print re.findall("a(?!b)","ab")
