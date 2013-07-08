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
helper(re.search(".",""),False)
helper(re.search(".","a"),True)
helper(re.search(".a","a"),False)
helper(re.search("a","a"),True)
helper(re.search("a.","a\n"),False)
helper(re.search(".a","ba"),True)

print "\nSyntax: ^"
helper(re.search("^",""),True)
helper(re.search("a^",""),False)
helper(re.search("^a","ba"),False)
helper(re.search("^a","ab"),True)
helper(re.search("^a","\na"),False)
helper(re.search("a^","a"),False)

print "\nSyntax: $"
helper(re.search("$",""),True)
helper(re.search("$a","a"),False)
helper(re.search("a$","a"),True)
helper(re.search("a$","ab"),False)
helper(re.search("a$","a\nb"),False)
helper(re.search("a$","a\n"),True)

print "\nSyntax: *"
helper(re.search("a*",""),"")
helper(re.search("ab*","a"),"a")
helper(re.search("ab*","ab"),"ab")
helper(re.search("ab*","abbbbb"),"abbbbb")
helper(re.search("ab*","ba"),"a")
helper(re.search("ab*","bbbb"),False)

print "\nSyntax: +"
helper(re.search("a+",""),False)
helper(re.search("ab+","a"),False)
helper(re.search("ab+","ab"),"ab")
helper(re.search("ab+","abbbbb"),"abbbbb")
helper(re.search("ab+","ba"),False)
helper(re.search("ab+","bbbb"),False)

print "\nSyntax: ?"
helper(re.search("a?",""),"")
helper(re.search("ab?","a"),"a")
helper(re.search("ab?","ab"),"ab")
helper(re.search("ab?","abbbbb"),"ab")
helper(re.search("ab?","ba"),"a")
helper(re.search("ab?","bbbb"),False)

print "\nSyntax: *?"
helper(re.search("a*?","a"),"")
helper(re.search("ab*?","abbbb"),"a")
helper(re.search("ab*?","a"),"a")
helper(re.search("ab*?",""),False)

print "\nSyntax: +?"
helper(re.search("a+?","a"),"a")
helper(re.search("ab+?","abbbb"),"ab")
helper(re.search("ab+?","a"),False)
helper(re.search("ab+?",""),False)

print "\nSyntax: ??"
helper(re.search("a??","a"),"")
helper(re.search("ab??","abbbb"),"a")
helper(re.search("ab??","a"),"a")
helper(re.search("ab??",""),False)

print "\nSyntax: {m}"
helper(re.search("a{2}","a"),False)
helper(re.search("a{2}","aa"),"aa")
helper(re.search("a{2}","aaa"),"aa")

print "\nSyntax: {m,n}"
helper(re.search("a{1,2}b","b"),False)
helper(re.search("a{1,2}b","ab"),"ab")
helper(re.search("a{1,2}b","aab"),"aab")
helper(re.search("a{1,2}b","aaab"),"aab")
helper(re.search("a{,2}b","b"),"b")
helper(re.search("a{,2}b","ab"),"ab")
helper(re.search("a{,2}b","aab"),"aab")
helper(re.search("a{,2}b","aaab"),"aab")
helper(re.search("a{2,}b","b"),False)
helper(re.search("a{2,}b","ab"),False)
helper(re.search("a{2,}b","aab"),"aab")
helper(re.search("a{2,}b","aaab"),"aaab")
helper(re.search("a{3,5}","aaaaaaaaaa"),"aaaaa")
helper(re.search("a{,5}","aaaaaaaaaa"),"aaaaa")
helper(re.search("a{3,}","aaaaaaaaaa"),"aaaaaaaaaa")

print "\nSyntax: {m,n}?"
helper(re.search("a{1,2}?b","b"),False)
helper(re.search("a{1,2}?b","ab"),"ab")
helper(re.search("a{1,2}?b","aab"),"aab")
helper(re.search("a{1,2}?b","aaab"),"aab")
helper(re.search("a{,2}?b","b"),"b")
helper(re.search("a{,2}?b","ab"),"ab")
helper(re.search("a{,2}?b","aab"),"aab")
helper(re.search("a{,2}?b","aaab"),"aab")
helper(re.search("a{2,}?b","b"),False)
helper(re.search("a{2,}?b","ab"),False)
helper(re.search("a{2,}?b","aab"),"aab")
helper(re.search("a{2,}?b","aaab"),"aaab")
helper(re.search("a{3,5}?","aaaaaaaaaa"),"aaa")
helper(re.search("a{,5}?","aaaaaaaaaa"),"")
helper(re.search("a{3,}?","aaaaaaaaaa"),"aaa")

print "\nSyntax: []"
helper(re.search("[a,b,c]","abc"),"a")
helper(re.search("[a-z]","bc"),"b")
helper(re.search("[A-Z,0-9]","abcdefg"),False)
helper(re.search("[^A-Z]","ABCDEFGaHIJKL"),"a")
helper(re.search("[a*bc]","*"),"*")

print "\nSyntax: |"
helper(re.search("|",""),"")
helper(re.search("|a",""),"")
helper(re.search("a|b","ba"),"b")
helper(re.search("h|ello","hello"),"h")

print "\nSyntax: (...)"
match = re.search("(b*)","bbbba"); print len(match.groups()) == 1

print "\nSyntax: (?...)"
helper(re.search("(?:b*)","bbbba"),'bbbb')
helper(re.search("a(?=b)","a"),False)
helper(re.search("a(?=b)","ab"),"a")
helper(re.search("a(?!b)","a"),"a")
helper(re.search("a(?!b)","ab"),False)
