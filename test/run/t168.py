big = 0x1234567890abcdef12345L  # 21 hex digits
print "'%x'" % big
print "'%x'" % -big
print "'%5x'" % -big
print "'%22x'" % -big
print "'%23x'" % -big
print "'%-23x'" % -big
print "'%023x'" % -big
print "'%-023x'" % -big
print "'%025x'" % -big
print "'%025x'" % big
print "'%0+25x'" % big
print "'%+25x'" % big
print "'%25x'" % big
print "'%.2x'" % big
print "'%.21x'" % big
print "'%.22x'" % big
print "'%23.22x'" % big
print "'%-23.22x'" % big
print "'%X'" % big
print "'%#X'" % big
print "'%#x'" % big
print "'%#x'" % -big
print "'%#.23x'" % -big
print "'%#+.23x'" % big
print "'%# .23x'" % big
print "'%#+.23X'" % big
print "'%#-+.23X'" % big
print "'%#-+26.23X'" % big
print "'%#-+27.23X'" % big
print "'%#+27.23X'" % big
# next one gets two leading zeroes from precision
# 0 flag and the width
print "'%#+027.23X'" % big
# same
print "'%#+27.23X'" % big
