import unittest

class ClassOrInstanceMethod(object):
    def __init__(self, wrapped):
        self.wrapped = wrapped
    def __get__(self, instance, owner):
        if instance is None:
            instance = owner
        # print instance, owner
        # print self.wrapped.__get__(instance, owner)
        return self.wrapped.__get__(instance, owner)

class FucntionAndMethodDescriptorTests(unittest.TestCase):

    def test_function_to_method(self):
        def test(self):
            pass

        self.assertTrue(str(test).startswith('<function test'))

        bound_no_type = test.__get__(4)
        self.assertEqual(str(bound_no_type), '<bound method test of 4>')

        unbound = test.__get__(None, int)
        self.assertEqual(str(unbound), '<function test>')

        try:
            test.__get__(None, None)
        except TypeError:
            pass
        else:
            self.fail("should not allow function descriptor to be called with None, None")

        bound = test.__get__(4, int)
        self.assertEqual(str(bound), '<bound method test of 4>')

    def test_function_on_class(self):
        class Test(object):
            def test(self):
                pass

        self.assertEqual(str(Test.test), '<function Test.test>')

        t = Test()

        self.assertTrue(str(t.test).startswith('<bound method Test.test of <__main__.Test object'))

        # when __dict__ is implemented
        # self.assertTrue(str(Test.__dict__['test'].startwith('<function test'))

    # def test_method_descriptor(self):
    #     class Test(object):
    #         def test(self):
    #             pass

    #     class OtherTest(Test):
    #         pass

    #     def test2(self):
    #         pass

    #     unbound = Test.test
    #     self.assertEqual(str(unbound), '<unbound method Test.test>')

    #     bound_no_type = Test.test.__get__(4)
    #     # Type information disappears when __get__ is called without a type
    #     self.assertEqual(str(bound_no_type), '<bound method Test.test of 4>')

    #     # Calling __get__ with a non sensical type results in a no-op
    #     self.assertEqual(unbound.__get__(None, int), unbound)

    #     # Calling __get__ with sensical type results it to change the type
    #     self.assertEqual(str(unbound.__get__(None, OtherTest)), '<unbound method OtherTest.test>')

    #     try:
    #         unbound.__get__(None, None)
    #     except TypeError:
    #         pass
    #     else:
    #         self.fail("should not allow method descriptor to be called with None, None")

    def test_calling_after_bound_method(self):
        def test(self):
            return self

        self.assertEqual(test.__get__(None, int)(1), 1)
        self.assertEqual(test.__get__(1, int)(), 1)
        self.assertEqual(test.__get__(1)(),  1)

        # self.assertRaises(TypeError, lambda: test.__get__(None, int)("str"))

    # def test_builtin_func_and_method(self):
    #     # fails because it's repr is different self.assertEqual(str(complex.conjugate), "<method 'conjugate' of 'complex' objects>")
    #     # only testing this example because I know that dict.fromkeys is correctly annotated
    #     self.assertTrue(str(dict.fromkeys).startswith("<built-in method fromkeys of type object"))

    def test_special_case(self):
        class demo(object):
            @ClassOrInstanceMethod
            def foo(self):
                # self will be the class if this is called on the class
                return self

        d = demo()

        self.assertEqual(demo.foo(), demo)
        self.assertEqual(d.foo(), d)

if __name__ == '__main__':
    unittest.main()