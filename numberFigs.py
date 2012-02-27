#!/usr/local/bin/python3.2

import sys
import re

chapf = open(sys.argv[1],'r')
chap = chapf.read()
chapf.close()

lst_anchors = re.compile(r'\.\. _(lst_.*):')
lst_matches = lst_anchors.findall(chap)
fig_anchors = re.compile(r'\.\. _(fig_.*):')
fig_matches = fig_anchors.findall(chap)
tbl_anchors = re.compile(r'\.\. _(tbl_.*):')
tbl_matches = tbl_anchors.findall(chap)

figNum = 1
for fig in fig_matches:
    ## TODO replace replace with re.sub after a chapter has been numbered once
#    chap = chap.replace('Figure x <%s>'%fig, 'Figure %d <%s>'%(figNum,fig))
    chap = re.sub(r'Figure ([0-9x]+) \<%s\>'%fig, 'Figure %d <%s>'%(figNum,fig), chap )
    figNum += 1

lstNum = 1
for lst in lst_matches:
    print("Numbering: Listing <%s>"%lst)
    ## TODO replace replace with re.sub after a chapter has been numbered once
#    chap = chap.replace('Listing x <%s>'%lst, 'Listing %d <%s>'%(lstNum,lst))
    chap = re.sub(r'Listing ([0-9x]+) <%s>'%lst, 'Listing %d <%s>'%(lstNum,lst), chap )
    lstNum += 1

tblNum = 1
for tbl in tbl_matches:
    ## TODO replace replace with re.sub after a chapter has been numbered once
    #chap = chap.replace('Table x <%s>'%tbl, 'Table %d <%s>'%(tblNum,tbl))
    chap = re.sub(r'Table ([0-9x]+) \<%s\>'%tbl, 'Table %d <%s>'%(tblNum,tbl), chap )
    tblNum += 1

chapf = open(sys.argv[1],'w')
chapf.write(chap)
chapf.close()
