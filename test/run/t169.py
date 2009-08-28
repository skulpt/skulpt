big = 012345670123456701234567012345670L  # 32 octal digits
print "'%o'" % big
print "'%o'" % -big
print "'%5o'" % -big
print "'%33o'" % -big
print "'%34o'" % -big
print "'%-34o'" % -big
print "'%034o'" % -big
print "'%-034o'" % -big
print "'%036o'" % -big
print "'%036o'" % big
print "'%0+36o'" % big
print "'%+36o'" % big
print "'%36o'" % big
print "'%.2o'" % big
print "'%.32o'" % big
print "'%.33o'" % big
print "'%34.33o'" % big
print "'%-34.33o'" % big
print "'%o'" % big
print "'%#o'" % big
print "'%#o'" % -big
print "'%#.34o'" % -big
print "'%#+.34o'" % big
print "'%# .34o'" % big
print "'%#+.34o'" % big
print "'%#-+.34o'" % big
print "'%#-+37.34o'" % big
print "'%#+37.34o'" % big
# next one gets one leading zero from precision
print "'%.33o'" % big
# base marker shouldn't change that
print "'%#.33o'" % big
# but reduce precision
print "'%#.32o'" % big
# one leading zero from precision
print "'%034.33o'" % big
# base marker shouldn't change that
print "'%0#34.33o'" % big

