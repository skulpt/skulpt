__author__ = 'mchat'

import unittest

class MySimpleInt(int): pass
class MySimpleFloat(float): pass
class MySimpleLong(long): pass

class MyInt(int):
    def __init__(self, value):
        self.value = value

    def __add__(self, other):
        return self.value - other

    def __hash__(self):
        return 11

class MyFloat(float):
    def __sub__(self, other):
        return 0

class MyLong(long):
    def __lt__(self, other):
        return True

class MyList(list):
    def __contains__(self, item):
        if item == 2:
            return True
        else:
            return False
    def __add__(self, item):
        return self
    def __mul__(self, num):
        return self[:1]
    def __rmul__(self, num):
        return self[1:]

class MySet(set):
    def __len__(self):
        return 0

class MyDict(dict):
    def __getitem__(self, key):
        return "hello world"
    def __setitem__(self, key, value):
        return None

class AnotherInt(MyInt):
    def __mul__(self, other):
        return 0

foo_radd = "Foo __radd__"
bar_add = "Bar __add__"
baz_radd = "Baz __radd__"
baz_add = "Baz __add__"

class Foo(int):
    def __radd__(self, other):
        return foo_radd

class Bar(int):
    def __add__(self, other):
        return bar_add

class Baz(Bar):
    def __add__(self, other):
        return baz_add
    def __radd__(self, other):
        return baz_radd

class SubclassTest(unittest.TestCase):

    def test_builtin_functions(self):
        builtinToSubclass = {5: MySimpleInt(5), 
                             3L: MySimpleLong(3L), 
                             1.2: MySimpleFloat(1.2)}

        for builtin in builtinToSubclass:
            subclass = builtinToSubclass[builtin]

            self.assertEqual(repr(subclass), repr(builtin))
            self.assertEqual(str(subclass), str(builtin))
            self.assertEqual(abs(subclass), abs(builtin))
            self.assertEqual(hash(subclass), hash(builtin))

    def test_comparions(self):
        less = [MySimpleInt(5), MySimpleLong(5L), MySimpleFloat(5.0), 5, 5L, 5.0]
        greater = [MySimpleInt(10), MySimpleLong(10L), MySimpleFloat(10.0), 10, 10L, 10.0]

        for x in less:
            for y in less:
                self.assertEqual(x, y)

        for l in less:
            for g in greater:
                self.assertLess(l, g)
                self.assertLessEqual(l, g)
                self.assertGreater(g, l)
                self.assertGreaterEqual(g, l)
                self.assertLessEqual(l, l)
                self.assertGreaterEqual(g, g)

    def test_binop(self):
        builtinToSubclass = {5: MySimpleInt(5), 
                             3L: MySimpleLong(3L), 
                             1.2: MySimpleFloat(1.2)}

        for x_builtin in builtinToSubclass:
            x_subclass = builtinToSubclass[x_builtin]
            for y_builtin in builtinToSubclass:
                y_subclass = builtinToSubclass[y_builtin]

                self.assertEqual(x_subclass + y_subclass, x_builtin + y_builtin)
                self.assertEqual(y_subclass + x_subclass, y_builtin + x_builtin)

                self.assertEqual(x_subclass - y_subclass, x_builtin - y_builtin)
                self.assertEqual(y_subclass - x_subclass, y_builtin - x_builtin)

                self.assertEqual(x_subclass * y_subclass, x_builtin * y_builtin)
                self.assertEqual(y_subclass * x_subclass, y_builtin * x_builtin)

                self.assertEqual(x_subclass / y_subclass, x_builtin / y_builtin)
                self.assertEqual(y_subclass / x_subclass, y_builtin / x_builtin)

                self.assertEqual(x_subclass % y_subclass, x_builtin % y_builtin)
                self.assertEqual(y_subclass % x_subclass, y_builtin % x_builtin)

                self.assertEqual(x_subclass // y_subclass, x_builtin // y_builtin)
                self.assertEqual(y_subclass // x_subclass, y_builtin // x_builtin)
                
                self.assertEqual(x_subclass ** y_subclass, x_builtin ** y_builtin)
                self.assertEqual(y_subclass ** x_subclass, y_builtin ** x_builtin)

    
    def test_override_dunder_numbers(self):
        i = MyInt(5)
        l = MyLong(3L)
        f = MyFloat(1.2)

        self.assertEqual(i + f, i - f)      # MyInt.__add__
        self.assertEqual(f - i, 0)          # MyFloat.__sub__

        self.assertLess(l, i)               # MyLong.__lt__
        self.assertLess(l, f)               # MyLong.__lt__

        self.assertEqual(hash(i), 11)       # MyInt.__hash__


    def test_override_dunder_containers(self):
        base_list = [1, 2, 3]
        base_dict = {1: 2}

        li = MyList(base_list)
        self.assertEqual(li, base_list)

        self.assertNotIn(1, li)             # MyList.__contains__
        self.assertIn(2, li)                # MyList.__contains__
        self.assertNotIn(3, li)             # MyList.__contains__
        self.assertNotIn(4, li)             # MyList.__contains__

        self.assertEqual(li + [4], li)      # MyList.__add__
        self.assertEqual(li * 5, li[:1])    # MyList.__mul__
        self.assertEqual(5 * li, li[1:])    # MyList.__rmul__

        s = MySet(base_list)
        self.assertEqual(s, set(base_list))

        self.assertEqual(len(s), 0)         # MySet.__len__

        d = MyDict(base_dict)
        self.assertEqual(d, base_dict)

        self.assertEqual(d[1], "hello world")               # MyDict.__getitem__
        self.assertEqual(d["not a key"], "hello world")     # MyDict.__getitem__

        d[1] = "should not change"
        self.assertEqual(d, base_dict)                      # MyDict.__setitem__

    def test_override_ancestor_operations(self):

        foo = Foo(5)
        bar = Bar(5)
        baz = Baz(5)

        self.assertEqual(foo + 2, 7)            # int.__add__
        self.assertEqual(2 + foo, foo_radd)     # Foo.__radd__

        self.assertEqual(bar + 2, bar_add)      # Bar.__add__
        self.assertEqual(2 + bar, 7)            # int.__radd__ (from Bar)

        self.assertEqual(foo + bar, 10)         # int.__add__ (from Foo)
        self.assertEqual(bar + foo, bar_add)    # Bar.__add__

        self.assertEqual(baz + 2, baz_add)      # Baz.__add__
        self.assertEqual(2 + baz, baz_radd)     # Baz.__radd__

        self.assertEqual(foo + baz, 10)         # int.__add__ (from Foo)
        self.assertEqual(baz + foo, baz_add)    # Baz.__add__

        self.assertEqual(bar + baz, baz_radd)   # Baz.__radd__
        self.assertEqual(baz + bar, baz_add)    # Baz.add

    def test_subclass_of_subclass(self):

        x = MyInt(5)
        self.assertEqual(x * 5, 25)

        y = AnotherInt(5)
        self.assertEqual(y, 5)              # int.__eq__
        self.assertEqual(y + 2, 3)          # MyInt.__add__
        self.assertEqual(hash(y), 11)       # MyInt.__hash__
        self.assertEqual(y * 5, 0)          # AnotherInt.__mul__

    def test_multiple_inheritance(self):
        class Ancestor:
            def __hash__(self):
                return 15
            def __str__(self):
                return "Ancestor"
            def test(self):
                return "Hello world"

        class Foo(Ancestor, int): pass
        class Bar(Ancestor, MyInt): pass
        class Baz(MyInt, Ancestor): pass

        x = Foo(5)
        y = Bar(5)
        z = Baz(5)

        self.assertEqual(str(x), "Ancestor")        # Ancestor.__str__
        self.assertEqual(hash(x), 15)               # Ancestor.__hash__
        self.assertEqual(x.test(), "Hello world")   # Ancestor.test

        self.assertEqual(str(y), "Ancestor")        # Ancestor.__str__
        self.assertEqual(hash(y), 15)               # Ancestor.__str__
        self.assertEqual(y.test(), "Hello world")   # Ancestor.test

        self.assertEqual(str(z), "5")               # int.__str__
        self.assertEqual(hash(z), 11)               # MyInt.__hash__
        self.assertEqual(z.test(), "Hello world")   # Ancestor.test

    def test_bad_multiple_inheritance(self):

        # Note: "with self.assertRaises" syntax is not supported by Skulpt
        # at this time so must pass a function to "self.assertRaises"

        def two_builtins():
            class BadClass(int, float): pass

        def builtin_and_subclass():
            class BadClass(int, MyFloat): pass

        def two_subclasses():
            class BadClass(MyList, AnotherInt): pass

        self.assertRaises(TypeError, two_builtins)
        self.assertRaises(TypeError, builtin_and_subclass)
        self.assertRaises(TypeError, two_subclasses)

        class SameBuiltin(MyInt, int): pass
        self.assertEqual(SameBuiltin(5), 5)

    def test_exceptions(self):

        class TestFailed(Exception):
            """Test failed."""

        def raiseTestFailed():
            raise TestFailed()

        self.assertRaises(TestFailed, raiseTestFailed)

        try:
            raise TestFailed("test")
        except TestFailed as e:
            print e
            self.assertIn("TestFailed: test", str(e))

        class MyTypeError(TypeError): pass

        def raiseMyTypeError():
            raise MyTypeError()

        self.assertRaises(MyTypeError, raiseMyTypeError)
        self.assertRaises(TypeError, raiseMyTypeError)
        self.assertRaises(Exception, raiseMyTypeError)

        class MyStandardError(StandardError):
            def __str__(self):
                return "My Standard Error"

        try:
            raise MyStandardError("test")
        except MyStandardError as e:
            self.assertEqual("My Standard Error", str(e))



if __name__ == "__main__":
    unittest.main()
