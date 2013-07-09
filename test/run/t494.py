import re

def helper(match,expected):
    if type(expected) == str:
        if match: 
            if match.group(0)==expected: print True
            else: print match.group(0),expected
        else: print "didn't get a match"
    else:
        if match: print True == expected
        else: print False == expected

print "\nSyntax: ."
helper(re.match(".",""),False)
helper(re.match(".","a"),True)
helper(re.match(".a","a"),False)
helper(re.match("a","a"),True)
helper(re.match("a.","a\n"),False)
helper(re.match(".a","ba"),True)

print "\nSyntax: ^"
helper(re.match("^",""),True)
helper(re.match("a^",""),False)
helper(re.match("^a","ba"),False)
helper(re.match("^a","ab"),True)
helper(re.match("^a","\na"),False)
helper(re.match("a^","a"),False)

print "\nSyntax: $"
helper(re.match("$",""),True)
helper(re.match("$a","a"),False)
helper(re.match("a$","a"),True)
helper(re.match("a$","ab"),False)
helper(re.match("a$","a\nb"),False)
helper(re.match("a$","a\n"),True)

print "\nSyntax: *"
helper(re.match("a*",""),"")
helper(re.match("ab*","a"),"a")
helper(re.match("ab*","ab"),"ab")
helper(re.match("ab*","abbbbb"),"abbbbb")
helper(re.match("ab*","ba"),False)
helper(re.match("ab*","bbbb"),False)

print "\nSyntax: +"
helper(re.match("a+",""),False)
helper(re.match("ab+","a"),False)
helper(re.match("ab+","ab"),"ab")
helper(re.match("ab+","abbbbb"),"abbbbb")
helper(re.match("ab+","ba"),False)
helper(re.match("ab+","bbbb"),False)

print "\nSyntax: ?"
helper(re.match("a?",""),"")
helper(re.match("ab?","a"),"a")
helper(re.match("ab?","ab"),"ab")
helper(re.match("ab?","abbbbb"),"ab")
helper(re.match("ab?","ba"),False)
helper(re.match("ab?","bbbb"),False)

print "\nSyntax: *?"
helper(re.match("a*?","a"),"")
helper(re.match("ab*?","abbbb"),"a")
helper(re.match("ab*?","a"),"a")
helper(re.match("ab*?",""),False)

print "\nSyntax: +?"
helper(re.match("a+?","a"),"a")
helper(re.match("ab+?","abbbb"),"ab")
helper(re.match("ab+?","a"),False)
helper(re.match("ab+?",""),False)

print "\nSyntax: ??"
helper(re.match("a??","a"),"")
helper(re.match("ab??","abbbb"),"a")
helper(re.match("ab??","a"),"a")
helper(re.match("ab??",""),False)

print "\nSyntax: {m}"
helper(re.match("a{2}","a"),False)
helper(re.match("a{2}","aa"),"aa")
helper(re.match("a{2}","aaa"),"aa")

print "\nSyntax: {m,n}"
helper(re.match("a{1,2}b","b"),False)
helper(re.match("a{1,2}b","ab"),"ab")
helper(re.match("a{1,2}b","aab"),"aab")
helper(re.match("a{1,2}b","aaab"),False)
helper(re.match("a{,2}b","b"),"b")
helper(re.match("a{,2}b","ab"),"ab")
helper(re.match("a{,2}b","aab"),"aab")
helper(re.match("a{,2}b","aaab"),False)
helper(re.match("a{2,}b","b"),False)
helper(re.match("a{2,}b","ab"),False)
helper(re.match("a{2,}b","aab"),"aab")
helper(re.match("a{2,}b","aaab"),"aaab")
helper(re.match("a{3,5}","aaaaaaaaaa"),"aaaaa")
helper(re.match("a{,5}","aaaaaaaaaa"),"aaaaa")
helper(re.match("a{3,}","aaaaaaaaaa"),"aaaaaaaaaa")

print "\nSyntax: {m,n}?"
helper(re.match("a{1,2}?b","b"),False)
helper(re.match("a{1,2}?b","ab"),"ab")
helper(re.match("a{1,2}?b","aab"),"aab")
helper(re.match("a{1,2}?b","aaab"),False)
helper(re.match("a{,2}?b","b"),"b")
helper(re.match("a{,2}?b","ab"),"ab")
helper(re.match("a{,2}?b","aab"),"aab")
helper(re.match("a{,2}?b","aaab"),False)
helper(re.match("a{2,}?b","b"),False)
helper(re.match("a{2,}?b","ab"),False)
helper(re.match("a{2,}?b","aab"),"aab")
helper(re.match("a{2,}?b","aaab"),"aaab")
helper(re.match("a{3,5}?","aaaaaaaaaa"),"aaa")
helper(re.match("a{,5}?","aaaaaaaaaa"),"")
helper(re.match("a{3,}?","aaaaaaaaaa"),"aaa")

print "\nSyntax: []"
helper(re.match("[a,b,c]","abc"),"a")
helper(re.match("[a-z]","bc"),"b")
helper(re.match("[A-Z,0-9]","abcdefg"),False)
helper(re.match("[^A-Z]","ABCDEFGaHIJKL"),False)
helper(re.match("[a*bc]","*"),"*")

print "\nSyntax: |"
helper(re.match("|",""),"")
helper(re.match("|a",""),"")
helper(re.match("a|b","ba"),"b")
helper(re.match("h|ello","hello"),"h")

print "\nSyntax: (...)"
match = re.match("(b*)","bbbba"); print len(match.groups()) == 1

print "\nSyntax: (?...)"
helper(re.match("(?:b*)","bbbba"),'bbbb')
helper(re.match("a(?=b)","a"),False)
helper(re.match("a(?=b)","ab"),"a")
helper(re.match("a(?!b)","a"),"a")
helper(re.match("a(?!b)","ab"),False)
