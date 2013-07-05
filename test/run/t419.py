correct = True
for x in range(256):
    if x != ord(chr(x)):
        print x
        correct = False
print "chr and ord are inverses: ",correct

print "ord('a') = ",ord('a')
print ord('a') == 97
