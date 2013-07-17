def helper(got,expected):
    if got == expected:
        print True
    else:
        print False, expected, got

print "\nstr.strip"
helper("hello".strip(),'hello')
helper("hello".strip(''),'hello')
helper("  hello  ".strip(),'hello')
helper("  hello  ".strip(''),'  hello  ')
helper("..hello..".strip(),'..hello..')
helper("..hello..".strip('.'),'hello')
helper("abcz".strip('a-z'),'bc')
helper("z alpha z".strip('a-z'),' alpha ')
helper("hello world".strip("^[a-z]*.\s+.*"),'hello world')
helper("[$]hello-^".strip("^[a-z]$"),'hello')

print "\nstr.lstrip"
helper("hello".lstrip(),'hello')
helper("hello".lstrip(''),'hello')
helper("  hello  ".lstrip(),'hello  ')
helper("  hello  ".lstrip(''),'  hello  ')
helper("..hello..".lstrip(),'..hello..')
helper("..hello..".lstrip('.'),'hello..')
helper("abcz".lstrip('a-z'),'bcz')
helper("z alpha z".lstrip('a-z'),' alpha z')
helper("hello world".lstrip("^[a-z]*.\s+.*"),'hello world')
helper("[$]hello-^".lstrip("^[a-z]$"),'hello-^')

print "\nstr.rstrip"
helper("hello".rstrip(),'hello')
helper("hello".rstrip(''),'hello')
helper("  hello  ".rstrip(),'  hello')
helper("  hello  ".rstrip(''),'  hello  ')
helper("..hello..".rstrip(),'..hello..')
helper("..hello..".rstrip('.'),'..hello')
helper("abcz".rstrip('a-z'),'abc')
helper("z alpha z".rstrip('a-z'),'z alpha ')
helper("hello world".rstrip("^[a-z]*.\s+.*"),'hello world')
helper("[$]hello-^".rstrip("^[a-z]$"),'[$]hello')
