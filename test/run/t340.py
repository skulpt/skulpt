import re

m = re.match('([0-9]+)([a-z]+)','345abu')
print m.groups()
print m.group(0)
print m.group(1)
print m.group(2)
