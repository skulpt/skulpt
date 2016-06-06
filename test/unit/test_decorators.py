import unittest

log1 = []
log2 = []

def decofunc(fn):
    log1.append(str(fn))
    return fn

@decofunc
def func(x):
    log1.append(x)

class TestFunctionDecoratorOnFunction(unittest.TestCase):
    def setup(self):
        log1 = []

    def test_function_on_function(self):
        func('help')
        self.assertEqual(log1, ['<function func>', 'help'])

class cdeco:
    cnt = 0
    def __init__(self, fget=None, fset=None, fdel=None,doc=None):
        self.id = cdeco.cnt
        cdeco.cnt = cdeco.cnt + 1
        log2.append("cdeco.__init__" + str(self.id))
        log2.append("  " + str(fget))
        log2.append("  " + str(fset))
        log2.append("  " + str(fdel))
        self.fget = fget
        self.fset = fset
        self.fdel = fdel

    def __get__(self, obj):
        log2.append("cdeco.__get__" + str(self.id))
        return self.fget(obj)

    def __set__(self, obj, value):
        log2.append("cdeco.__set__" + str(self.id))
        if self.fset is None:
            raise AttributeError("can't set attribute")
        self.fset(obj, value)
        
    def __delete__(self, obj):
        log2.append("cdeco.__delete__" + str(self.id))
        if self.fdel is None:
            raise AttributeError("can't delete attribute")
        self.fdel(obj)
        
    def getter(self, fset):
        log2.append("cdeco.getter" + str(self.id))
        return type(self)(fget, self.fset, self.fdel)
    
    def setter(self, fset):
        log2.append("cdeco.setter" + str(self.id))
        return type(self)(self.fget, fset, self.fdel)
    
    def deleter(self, fdel):
        log2.append("cdeco.deleter" + str(self.id))
        return type(self)(self.fget, self.fset, fdel)    
        
class testclass:
    def __init__(self, val):
        self._val = val;

    @cdeco
    def val(self):
        log2.append("testclass.val - getter")
        return self._val
    
    @val.setter
    def val(self, val):
        log2.append("testclass.val - setter")
        self._val = val;
    
    @val.deleter
    def val(self):
        log2.append("testclass.val - deleter")



class Property(object):
    "Emulate PyProperty_Type() in Objects/descrobject.c"

    def __init__(self, fget=None, fset=None, fdel=None, doc=None):
        self.fget = fget
        self.fset = fset
        self.fdel = fdel
        if doc is None and fget is not None:
            doc = fget.__doc__
        self.__doc__ = doc

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        if self.fget is None:
            raise AttributeError("unreadable attribute")
        return self.fget(obj)

    def __set__(self, obj, value):
        if self.fset is None:
            raise AttributeError("can't set attribute")
        self.fset(obj, value)

    def __delete__(self, obj):
        if self.fdel is None:
            raise AttributeError("can't delete attribute")
        self.fdel(obj)

    def getter(self, fget):
        return type(self)(fget, self.fset, self.fdel, self.__doc__)

    def setter(self, fset):
        return type(self)(self.fget, fset, self.fdel, self.__doc__)

    def deleter(self, fdel):
        return type(self)(self.fget, self.fset, fdel, self.__doc__)

class test():
    def __init__(self):
        self._foo = 4
    def h(self):
        return self._foo
    def hset(self,newval):
        self._foo = newval * 10

    h = Property(h, hset, doc='''returns 4''')


class TestDescriptorGetSetOnMethod(unittest.TestCase):
    def setup(self):
        log2 = []

    def test_handmade_descriptor(self):
        y = testclass(123)
        log2.append(y.val)
        y.val = 456
        log2.append(y.val)
        self.assertEqual(log2, [
            'cdeco.__init__0', 
            '  <function val>', 
            '  None', 
            '  None', 
            'cdeco.setter0', 
            'cdeco.__init__1', 
            '  <function val>', 
            '  <function val>', 
            '  None', 
            'cdeco.deleter1', 
            'cdeco.__init__2', 
            '  <function val>', 
            '  <function val>', 
            '  <function val>', 
            'cdeco.__get__2', 
            'testclass.val - getter',
            123, 
            'cdeco.__set__2', 
            'testclass.val - setter', 
            'cdeco.__get__2', 
            'testclass.val - getter', 
            456])
        #del y.val del is not yet implemented


    def test_property(self):
        t1 = test()
        self.assertEqual(t1.h, 4)
        t1.h = 9
        self.assertEqual(t1.h, 90)




if __name__ == "__main__":
    unittest.main()