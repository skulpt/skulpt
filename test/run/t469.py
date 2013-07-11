def helper(got,expect):
    if got == expect: print True
    else: print False, expect, got

print "\nstr.ljust"
helper('12345'.ljust(8),'12345   ')
helper('12345'.ljust(8,'.'),'12345...')

print "\nstr.center"
helper('12345'.center(7),' 12345 ')
helper('12345'.center(8,'.'),'.12345..')

print "\nstr.rjust"
helper('12345'.rjust(8),'   12345')
helper('12345'.rjust(8,'.'),'...12345')

def helper(str,fillchar):
    print
    print str.ljust(10,fillchar)
    print str.center(10,fillchar)
    print str.rjust(10,fillchar)

helper('a','-')
helper('?','!')
helper('-','.')
helper('hello','~')
