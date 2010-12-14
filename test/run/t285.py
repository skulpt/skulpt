def f(a,b,c=10,d=20,*e,**f):
    sortf = [(x,y) for x,y in f.items()]
    sortf.sort()
    print a,b,c,d,e,sortf

f(1,2)
f(1,2,3)
f(1,2,3,5)
f(1,2,d=3,c=5)
f(1,2,e=['x','y','z'])
f(1,2,d=3,c=5,e=['x','y','z'])
f(1,2,3,5,['x','y','z'])
f(1,2,3,5,['x','y','z'],z=5,y=9)
f(1,2,3,5,['x','y','z'],'blorp','wee',z=5,y=9)
