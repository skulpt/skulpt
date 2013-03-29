print "Big number test"

v=[1,1.0,1L,-1,-1.0,-1L,2,2.0,2L,-2,-2.0,-2L,1e9,-1e9,1e-9,-1e-9,123456789L,12345678901234567890123456789L]
#v=[2,2.0,2L,-2,-2.0,-2L,123456789L,12345678901234567890123456789L]
o=['+','-','*','/','**','%','<','=','>','<=','!=','>=']

def oper(v1, v2, op):
    if (op == '+'):
        print "              ",v1,op,v2,"=",v1+v2,type(v1+v2)
    elif (op == '-'):
        print "              ",v1,op,v2,"=",v1-v2,type(v1-v2)
    elif (op == '*'):
        print "              ",v1,op,v2,"=",v1*v2,type(v1*v2)
    elif (op == '/'):
        print "              ",v1,op,v2,"=",v1/v2,type(v1/v2)
    elif (op == '**'):
        if v2 >  100000000:
            print 'skipping pow of really big number'
            return
        print "              ",v1,op,v2,"=",v1**v2,type(v1**v2)
    elif (op == '%'):
        print "              ",v1,op,v2,"=",v1%v2,type(v1%v2)
    elif (op == '<'):
        print "              ",v1,op,v2,"=",v1<v2,type(v1<v2)
    elif (op == '='):
        print "              ",v1,op,v2,"=",v1==v2,type(v1==v2)
    elif (op == '>'):
        print "              ",v1,op,v2,"=",v1>v2,type(v1>v2)
    elif (op == '<='):
        print "              ",v1,op,v2,"=",v1<=v2,type(v1<=v2)
    elif (op == '!='):
        print "              ",v1,op,v2,"=",v1!=v2,type(v1!=v2)
    elif (op == '>='):
        print "              ",v1,op,v2,"=",v1>=v2,type(v1>=v2)

for x in v:
    print "Op 1 ::: ",type(x),x

    for y in v:
        print "     Op 2 ::: ",type(y),y
        for z in o:
            try:
                oper(x, y, z)
            except:
                print "Can't ",type(x),z,type(y)


