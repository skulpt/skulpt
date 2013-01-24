print "----Start 01"
try:
    print "First try"
    try:
        print "Second try - should see Second except next"
        i = int('badint');
        print "Second try - should not see this"
    except:
        print "Second except"
    print "First try - should see First except next"
    i = float('otherbadint')
    print "First try - should not see this"
except:
    print "First except"
print "----End 01"

print "----Start 02"
try:
    print "First try"
    try:
        print "Second try"
    except:
        print "Second except - should not see this"
    print "First try - should see First except next"
    i = float('otherbadint')
    print "First try - should not see this"
except:
    print "First except"
print "----End 02"

print "----Start 03"
try:
    print "First try"
    try:
        print "Second try"
    except:
        print "Second except - should not see this"
    print "First try - after inner try"
except:
    print "First except - should not see this"
print "----End 03"

print "----Start 04"
try:
    print "First try - shuold see First Except next"
    i = int('first');
    print "First try - should not see this"
except:
    print "First except"
    try:
        print "Second try - should see Second except next"
        i = int('badint');
        print "Second try - should not see this"
    except:
        print "Second except"
    print "First except - After inner try/except"
print "----End 04"

print "----Start 05"
try:
    print "First try"
    try:
        print "Second try - should see Second except next"
        i = int('badint');
        print "Second try - should not see this"
    except:
        print "Second except - should see First except next"
        i = float('otherbadint')
        print "Second except - should not see this"
    print "First try - should not see this"
except:
    print "First except"
print "----End 05"

print "----Start 06"
try:
    print "First try"
    if 123 < 12345 :
        if 456 < 4567 :
            print "You should see this"
        else:
            print "You should not see this (inner)"
    else:
        print "You should not see this"
    print "First try - near the end"
except:
    print "First except - should not see this"
print "----End 06"

print "----Start 07"
try:
    print "First try"
    if 123 < 12345 :
        if 456 < 4567 :
            print "Next you should see First except"
            i = int('badint')
        else:
            print "You should not see this (inner)"
    else:
        print "You should not see this"
    print "First try - near the end - you should not see this"
except:
    print "First except - should see this"
print "----End 07"

