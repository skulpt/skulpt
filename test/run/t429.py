def helper(x,y,expect):
    l = [0]*6    
    if expect < 0:  # x < y
        l[0] = (x < y) == True
        l[1] = (x <= y) == True
        l[2] = (x > y) == False
        l[3] = (x >= y) == False
        l[4] = (x == y) == False
        l[5] = (x != y) == True       
        if isinstance(x,(int,float,long,str)) or isinstance(y,(int,float,long,str)):        
            l.append((x is y)==False)
            l.append((x is not y)==True)
    elif expect == 0: # x == y
        l[0] = (x < y) == False
        l[1] = (x <= y) == True
        l[2] = (x > y) == False
        l[3] = (x >= y) == True
        l[4] = (x == y) == True
        l[5] = (x != y) == False
        if isinstance(x,(int,float,long,str)) or isinstance(y,(int,float,long,str)):        
            l.append((x is y)==True)
            l.append((x is not y)==False)
    elif expect > 0:  # x > y
        l[0] = (x < y) == False
        l[1] = (x <= y) == False
        l[2] = (x > y) == True
        l[3] = (x >= y) == True
        l[4] = (x == y) == False
        l[5] = (x != y) == True
        if isinstance(x,(int,float,long,str)) or isinstance(y,(int,float,long,str)):        
            l.append((x is y)==False)
            l.append((x is not y)==True)
    if not isinstance(x,(int,float,long,str)) and not isinstance(y,(int,float,long,str)):
        l.append((x is y)==False)
        l.append((x is not y)==True)
    if all(l):
        print True
    else:
        print False,x,y,l

print "\nINTEGERS"
helper(1,2,-1)
helper(1,1,0)
helper(2,1,1)
helper(-2,-1,-1)
helper(-2,-2,0)
helper(-1,-2,1)
helper(-1,1,-1)
helper(1,-1,1)

print "\nLONG INTEGERS"
helper(1L,2L,-1)
helper(2L,1L,1)
helper(-1L,1L,-1)
helper(1L,-1L,1)

print "\nFLOATING POINT"
helper(1.0,2.0,-1)
helper(1.0,1.0,0)
helper(2.0,1.0,1)
helper(-2.0,-1.0,-1)
helper(-2.0,-2.0,0)
helper(-1.0,-2.0,1)
helper(-1.0,1.0,-1)
helper(1.0,-1.0,1)

print "\nLISTS"
helper([],[1],-1)
helper([1,2],[1,2],0)
helper([1,2,3],[1,2],1)
helper([1,2],[2,1],-1)
helper([1,2,3],[1,2,1,5],1)

print "\nTUPLES"
helper(tuple(),(1,),-1)
helper((1,2),(1,2),0)
helper((1,2,3),(1,2),1)
helper((1,2),(2,1),-1)
helper((1,2,3),(1,2,1,5),1)

print "\nSTRINGS"
helper('','a',-1)
helper('a','a',0)
helper('ab','a',1)
helper('ABCD','abcd',-1)
helper('ABCD','ABCD',0)
helper('aBCD','Abcd',1)

class A:
    def __init__(self,x): self.x = x
    def __cmp__(self,other): return self.x

print "\nUSER-DEFINED OBJECTS"
helper(A(-1),A(1),-1)
helper(A(0),A(0),0)
helper(A(1),A(-1),1)
