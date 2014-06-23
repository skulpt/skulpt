class A(object):
    message = 'a'
    def test(self):
        print('a>' + self.__class__.__name__)

class B(object):
    def test(self):
        print('b>' + self.__class__.__name__)

class C(A, B):
    def test(self):
        A.test(self)
        B.test(self)

C().test()













