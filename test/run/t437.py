import re

m = re.match('([0-9]+)([a-z]+)([A-Z]*)','345abu')

print "\ngroup"
print m.group() == '345abu'
print m.group(0) == '345abu'
print m.group(1) == '345'
print m.group(2) == 'abu'
print m.group(3) == ''

print "\ngroups"
print m.groups() == ('345','abu','')
print m.groups('default') == ('345','abu','')
