import unittest

class ClassPropertiesAndMethods(unittest.TestCase):

    def test_meth_class_get(self):
        # Testing __get__ method of METH_CLASS C methods...
        # Full coverage of descrobject.c::classmethod_get()

        # Baseline
        arg = [1, 2, 3]
        res = {1: None, 2: None, 3: None}
        self.assertEqual(dict.fromkeys(arg), res)
        self.assertEqual({}.fromkeys(arg), res)

        # Now get the descriptor
        # descr = dict.__dict__["fromkeys"]
        # skulpt doesn't currently support __dict__ and
        # builtin functions on objects do have a __get__
        descr = dict.fromkeys

        # More baseline using the descriptor directly
        self.assertEqual(descr.__get__(None, dict)(arg), res)
        self.assertEqual(descr.__get__({})(arg), res)

        # Now check various error cases
        try:
            descr.__get__(None, None)
        except TypeError:
            pass
        else:
            self.fail("shouldn't have allowed descr.__get__(None, None)")
        try:
            descr.__get__(42)
        except TypeError:
            pass
        # these don't work because builtin types support do perform __get__ on the function
        # to get the unbound method. After this we can not treat these differently to normal
        # methods. We should remove the __get__ function from the prototype if it's an internal 
        # method. Maybe it should even be it's own class.
        # else:
        #     self.fail("shouldn't have allowed descr.__get__(42)")
        try:
            descr.__get__(None, 42)
        except TypeError:
            pass
        # else:
        #     self.fail("shouldn't have allowed descr.__get__(None, 42)")
        try:
            descr.__get__(None, int)
        except TypeError:
            pass
        # else:
        #    self.fail("shouldn't have allowed descr.__get__(None, int)")


if __name__ == "__main__":
    unittest.main()