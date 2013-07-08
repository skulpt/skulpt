print "EVALUATE TO TRUE:"
# list
print all([True,1,5.0,-33L,'hello',(3,4,5),[-6,7,10.0],{17:'true',-11L:True}])
# str
print all('hello')
print all('false')
print all('')
# tuple
print all((3,4,5))
print all((3,4,))
print all(())
# dict
print all({1:10,-2:'hello',13L:'false',(2,3):True})
print all({})

print "EVALUATE TO FALSE:"
# list
print all([0,False,1,True])
# tuple
print all((1,0))
# dict
print all({0:True,1:False})
