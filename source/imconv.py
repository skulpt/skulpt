#!/usr/bin/python

import re
import sys

f = open(sys.argv[1],'r')
immap = {}

impat = re.compile(r'\.\. (\|image\d+\|)\s+image::\s+(.*)$')
for line in f:
    g = impat.match(line)
    if g:
        print g.group(1), g.group(2)
        immap[g.group(1)] = g.group(2)
        
f.close()

f = open(sys.argv[1],'r')
nf = open(sys.argv[2],'w')

#re.search("\\s+(\\|image\\d+\\|)\\s+\\{(.*)?\\}\\s+\\{(.*)\\}", searchText)
#iminline = re.compile("\\s+(\\|image\\d+\\|)\\s+\\{(.*)?\\}\\s+\\{(.*)\\}")

iminline = re.compile(r'\s+(\|image\d+\|)\s+\{(.*)\}\s+\{(.*)\}')
figrep = re.compile(r'Figure\s\{(fig_.*?)\}')
for line in f:
    g = iminline.match(line)
    if g:
        nf.write('.. _%s:\n' % g.group(3))
        nf.write('\n')
        nf.write('.. figure:: %s\n' % immap[g.group(1)])
        nf.write('   :align: center\n\n')
        nf.write('   %s\n\n' % g.group(2))
    else:
        line = figrep.sub(r':ref:`Figure x <\1>`',line)
        nf.write(line)
        
nf.close()