__author__ = 'mchat'

import unittest

object_methods = ["__repr__", "__str__", "__hash__", "__eq__", "__ne__",
    "__lt__", "__le__", "__gt__", "__ge__", "__getattr__", "__setattr__"]

numeric_methods = ["__abs__", "__neg__", "__pos__", "__int__", "__long__",
    "__float__", "__add__", "__radd__", "__sub__", "__rsub__", "__mul__",
    "__rmul__", "__div__", "__rdiv__", "__floordiv__", "__rfloordiv__",
    "__mod__", "__rmod__", "__divmod__", "__rdivmod__", "__pow__", "__rpow__",
    "__coerce__"]

sequence_methods = ["__len__", "__iter__", "__contains__", "__getitem__",
    "__add__", "__mul__", "__rmul__"]

class BuiltinInheritance(unittest.TestCase):

    def check_magic_methods(self, obj, isnum=False, isseq=False):
        def check_methods(methods):
            for method in methods:
                self.assertTrue(hasattr(obj, method),
                                "Expected " + str(type(obj)) + " to have method '" + method + "'")

        self.assertIsInstance(obj, object)

        check_methods(object_methods)

        if (isnum):
            check_methods(numeric_methods)

        if (isseq):
            check_methods(sequence_methods)

    def test_object(self):
        self.check_magic_methods(object())                          # object

    def test_none_notimplemented(self):
        self.check_magic_methods(None)                              # None
        self.check_magic_methods(NotImplemented)                    # NotImplemented

    def test_numeric_types(self):
        self.check_magic_methods(1, isnum=True)                     # int
        self.check_magic_methods(3L, isnum=True)                    # long
        self.check_magic_methods(2.5, isnum=True)                   # float
        self.check_magic_methods(3j, isnum=True)                    # complex
        self.check_magic_methods(True, isnum=True)                  # bool

        self.assertIsInstance(True, int)
        self.assertNotIsInstance(True, long)

    def test_sequence_types(self):
        self.check_magic_methods("hello world", isseq=True)         # str
        self.check_magic_methods([1, 2, 3, 4], isseq=True)          # list
        self.check_magic_methods((1, 2, 3, 4), isseq=True)          # tuple

    def test_other_types(self):
        self.check_magic_methods({1:2, 3:4})                        # dict
        self.check_magic_methods(enumerate([1, 2, 3, 4]))           # enumerate
        self.check_magic_methods(open("skulpt.py"))                 # file
        self.check_magic_methods(set([1, 2, 3, 4]))                 # set
        self.check_magic_methods(slice(1, 2))                       # slice


if __name__ == '__main__':
    unittest.main()
