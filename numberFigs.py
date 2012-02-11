#!/usr/local/bin/python3.2

import sys
import re

chap = sys.stdin.read()
anchors = re.compile(r'\.\. _(lst_.*):')
matches = anchors.findall(chap)

figNum = 1
for fig in matches:
    ## TODO replace replace with re.sub after a chapter has been numbered once
    chap = chap.replace('Listing x <%s>'%fig, 'Listing %d <%s>'%(figNum,fig))
    figNum += 1
    
print(chap)
