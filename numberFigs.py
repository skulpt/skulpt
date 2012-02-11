#!/usr/local/bin/python3.2

import sys
import re

chap = sys.stdin.read()
lst_anchors = re.compile(r'\.\. _(lst_.*):')
lst_matches = lst_anchors.findall(chap)
fig_anchors = re.compile(r'\.\. _(fig_.*):')
fig_matches = fig_anchors.findall(chap)
tbl_anchors = re.compile(r'\.\. _(tbl_.*):')
tbl_matches = tbl_anchors.findall(chap)

figNum = 1
for fig in fig_matches:
    ## TODO replace replace with re.sub after a chapter has been numbered once
    chap = chap.replace('Figure x <%s>'%fig, 'Figure %d <%s>'%(figNum,fig))
    figNum += 1

lstNum = 1
for lst in lst_matches:
    ## TODO replace replace with re.sub after a chapter has been numbered once
    chap = chap.replace('Listing x <%s>'%lst, 'Listing %d <%s>'%(lstNum,lst))
    lstNum += 1

tblNum = 1
for tbl in tbl_matches:
    ## TODO replace replace with re.sub after a chapter has been numbered once
    chap = chap.replace('Table x <%s>'%tbl, 'Table %d <%s>'%(tblNum,tbl))
    tblNum += 1

print(chap)
