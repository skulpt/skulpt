def mygen(upto):
   for i in range(0, upto):
       print 'i',i
       got = yield i
       print 'got',got

handle = mygen(3)
first = True
for num in handle:
   print 'num',num
   if first:
       print 'signalling'
       foo = handle.send('sig')
       print 'foo', foo
       first = False
