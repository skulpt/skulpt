print "\nINTEGERS"   
# binary
print 0b0101 | 0b1010 == 0b1111
print 0b0110 ^ 0b0101 == 0b0011
print 0b1111 & 0b0001 == 0b0001
print 0b0110 << 2 == 0b11000
print 0b0110 >> 2 == 0b0001
print ~0b0011 == -0b0100
# octal
print 0O0505 | 0O1000 == 0O1505
print 0O1200 ^ 0O1034 == 0O0234
print 0O7740 & 0O7400 == 0O7400
print 0O2763 << 2 == 0O13714
print 0O2763 >> 2 == 0O574
print ~0O1234 == -0O1235
# hexadecimal
print 0x0ff0 | 0x0000 == 0x0ff0
print 0x10f0 ^ 0x01f0 == 0x1100
print 0x0ff0 & 0xf00f == 0x0000
print 0x5a01 << 2 == 0x16804
print 0x5a01 >> 2 == 0x1680
print ~0x4a30 == -0x4a31
# decimal
print 124 | 37 == 125
print 3847 ^ 4958 == 7257
print 745 & 348 == 72
print 1834 << 2 == 7336
print 1834 >> 2 == 458
print ~2398 == -2399

print "\nLONG INTEGERS"   
# binary        # skulpt doesn't accept binary longs
'''
print 0b0101L | 0b1010L == 0b1111L
print 0b0110L ^ 0b0101L == 0b0011L
print 0b1111L & 0b0001L == 0b0001L
print 0b0110L << 2L == 0b11000L
print 0b0110L >> 2L == 0b0001L
#print ~0b0011L == -0b0100L #skulpt doesn't accept the ~ operator with longs
'''
# octal
print 0O0505L | 0O1000L == 0O1505L
print 0O1200L ^ 0O1034L == 0O0234L
print 0O7740L & 0O7400L == 0O7400L
print 0O2763L << 2L == 0O13714L
print 0O2763L >> 2L == 0O574L
#print ~0O1234L == -0O1235L #skulpt doesn't accept the ~ operator with longs

# hexadecimal
print 0x0ff0L | 0x0000L == 0x0ff0L
print 0x10f0L ^ 0x01f0L == 0x1100L
print 0x0ff0L & 0xf00fL == 0x0000L
print 0x5a01L << 2L == 0x16804L
print 0x5a01L >> 2L == 0x1680L
#print ~0x4a30L == -0x4a31L #skulpt doesn't accept the ~ operator with longs

# decimal
print 124L | 37L == 125L
print 3847L ^ 4958L == 7257L
print 745L & 348L == 72L
print 1834L << 2L == 7336L
print 1834L >> 2L == 458L
#print ~2398L == -2399L #skulpt doesn't accept the ~ operator with longs

print int('123456789'*10) & int('987654321'*10) == 95579309557357885362290225874030292317027763371981185445626785720401260273886076820525585

print type(int('123456789'*10) & int('987654321'*10))
