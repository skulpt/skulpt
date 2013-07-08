print "EVALUATE TO TRUE:"
# list
print any([True,1,5.0,-33L,'hello',(3,4,5),[-6,7,10.0],{17:'true',-11L:True},False])
# str
print any('hello')
print any('false')
# tuple
print any((3,4,5))
print any((3,4,))
print any((1,0))
# dict
print any({1:10,-2:'hello',0L:False,(2,3):True})

print "EVALUATE TO FALSE:"
# list
print any([None,False,0,0L,0.0,'',(),[],{}])
print any([])
# string
print any("")
print any('')
# tuple
print any((0,0.0,0L))
print any(())
# dict
print any({0:False,0.0:None})
print any({})
