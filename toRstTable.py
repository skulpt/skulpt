#!/usr/local/bin/python3.2
__author__ = 'bmiller'

import sys

oldTable = sys.stdin.readlines()

numCols = oldTable.count('&')

i = 0
while i < len(oldTable):
    oldTable[i] = oldTable[i].split('&')
    i += 1

numCols = len(oldTable[0])
colMax = [0 for x in range(numCols)]

for col in range(numCols):
    for row in range(len(oldTable)):
        if len(oldTable[row]) == numCols:
            if len(oldTable[row][col].strip()) > colMax[col]:
                colMax[col] = len(oldTable[row][col])

# print header info
for c in colMax:
    print("="*c,end=' ')

print()
col = 0
for h in oldTable[0]:
    print(("%"+str(colMax[col])+"s") % h.strip(),end=' ')
    col += 1
print()


for c in colMax:
    print("="*c,end=' ')
print()

for row in range(1,len(oldTable)):
    col = 0
    for h in oldTable[row]:
        print(("%"+str(colMax[col])+"s") % h.strip(),end=' ')
        col += 1
    print()

for c in colMax:
    print("="*c,end=' ')
print()

