def enumerate_helper(iterable,start=0):
    x = []
    for i in enumerate(iterable,start):
        x.append(i)
    print x

# list
enumerate_helper([1,2,3,4])
enumerate_helper([1,2,3,4],10)

# string 
enumerate_helper("hello")
enumerate_helper("WORLD",2)

# tuple
enumerate_helper((1,2,3,))
enumerate_helper((1,2,3,),-1)

# dict
enumerate_helper({1:'a',2:'b',3:'c'})
enumerate_helper({1:'a',2:'b',3:'c'},5)
