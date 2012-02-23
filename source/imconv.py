import re

f = open('basic.rst')
immap = {}

impat = re.compile(r'\.\. (\|image\d+\|)\s+image::\s+(.*)$')
for line in f:
    g = impat.match(line)
    if g:
        print g.group(1), g.group(2)
        
f.close()

f = open('basic.rst','r')
g = open('newbasic.rst','w')

iminline = re.compile(r'\s+(\|image\d+\|)\s+\{(.*)?\}\s+\{(.*)\}')
for line in f:
    g = iminline.match(line)
    if g:
        g.write('.. _fig_%s:' % g.group(3))
        g.write('\n')
        