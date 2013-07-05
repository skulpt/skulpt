correct = True
for x in range(256):
    if x != ord(chr(x)):
        print x
        correct = False
print "chr and ord are inverses: ",correct

print chr(97)
print chr(97)=='a'
