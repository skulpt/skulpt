import re

def helper(string, pattern):
    match = re.match(string, pattern)
    if match:
        print match.group(0)
    else:
        print False
    search = re.search(string, pattern)
    if search:
        print search.group(0)
    else:
        print False
    find = re.findall(string, pattern)
    print find

helper("a{,2}b", "b")
helper("a{,2}b", "ab")
helper("a[{,}]b", "a{b")
helper("a\{,b", "a{,b")
helper("a{,2}[a-z]", "ab")
helper("a{,2}b{,5}", "")
helper("a[{,[a-z]]b", "a,cb")
