# Python test set -- built-in functions

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

    def test_subclass_of_subclass(self):

        x = MyInt(5)
        self.assertEqual(x * 5, 25)

        y = AnotherInt(5)
        self.assertEqual(y, 5)              # int.__eq__
        self.assertEqual(y + 2, 3)          # MyInt.__add__
        self.assertEqual(hash(y), 11)       # MyInt.__hash__
        self.assertEqual(y * 5, 0)          # AnotherInt.__mul__

if __name__ == "__main__":
    unittest.main()
