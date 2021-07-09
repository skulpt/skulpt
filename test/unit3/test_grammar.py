import unittest
import test.ann_module as ann_module
from test import ann_module2
import test

# Note: since several test cases filter out floats by looking for "e" and ".",
# don't add hexadecimal literals that contain "e" or "E".
VALID_UNDERSCORE_LITERALS = [
    '0_0_0',
    '4_2',
    '1_0000_0000',
    '0b1001_0100',
    '0xffff_ffff',
    '0o5_7_7',
    '1_00_00.5',
    '1_00_00.5e5',
    '1_00_00e5_1',
    '1e1_0',
    '.1_4',
    '.1_4e1',
    '0b_0',
    '0x_f',
    '0o_5',
    '1_00_00j',
    '1_00_00.5j',
    '1_00_00e5_1j',
    '.1_4j',
    '(1_2.5+3_3j)',
    '(.5_6j)',
]
INVALID_UNDERSCORE_LITERALS = [
    ## Trailing underscores:
    '0_',
    '42_',
    '1.4j_',
    '0x_',
    '0b1_',
    '0xf_',
    '0o5_',
    '0 if 1_Else 1',
    ## Underscores in the base selector:
    '0_b0',
    '0_xf',
    '0_o5',
    ## Old-style octal
    ## allowed as parameters to `int` and `float`
    ## but still disallowed as literals:
    '0_7',
    '09_99',
    ## Multiple consecutive underscores:
    '4_______2',
    '0.1__4',
    '0.1__4j',
    '0b1001__0100',
    '0xffff__ffff',
    '0x___',
    '0o5__77',
    '1e1__0',
    '1e1__0j',
    ## Underscore right before a dot:
    '1_.4',
    '1_.4j',
    ## Underscore right after a dot:
    '1._4',
    '1._4j',
    '._5',
    '._5j',
    ## Underscore right after a sign:
    '1.0e+_1',
    '1.0e+_1j',
    ## Underscore right before j:
    '1.4_j',
    '1.4e5_j',
    ## Underscore right before e:
    '1_e1',
    '1.4_e1',
    '1.4_e1j',
    ## Underscore right after e:
    '1e_1',
    '1.4e_1',
    '1.4e_1j',
    ## Complex cases with parens:
    '(1+1.5_j_)',
    '(1+1.5_j)',
]

class TokenTests(unittest.TestCase):
    def test_underscore_literals(self):
        self.assertEqual(0_0_0, 0)
        self.assertEqual(4_2, 42)
        self.assertEqual(1_0000_0000, 100000000)
        self.assertEqual(0b1001_0100, 0b10010100)
        self.assertEqual(0xffff_ffff, 0xffffffff)
        self.assertEqual(0o5_7_7, 0o577)
        self.assertEqual(1_00_00.5, 10000.5)
        self.assertEqual(1_00_00.5e5, 10000.5e5)
        self.assertEqual(1_00_00e5_1, 10000e51)
        self.assertEqual(1e1_0, 1e10)
        self.assertEqual(.1_4, .14)
        self.assertEqual(.1_4e1, .14e1)
        self.assertEqual(0b_0, 0b0)
        self.assertEqual(0x_f, 0xf)
        self.assertEqual(0o_5, 0o5)
        self.assertEqual(1_00_00j, 10000j)
        self.assertEqual(1_00_00.5j, 10000.5j)
        self.assertEqual(1_00_00e5_1j, 10000e51j)
        self.assertEqual(.1_4j, .14j)
        self.assertEqual((1_2.5+3_3j), (12.5+33j))
        self.assertEqual((.5_6j), (.56j))

        eval_alt = "Sk.importMainWithBody('test_literals', false, '{0}')"
        for lit in INVALID_UNDERSCORE_LITERALS:
            self.assertRaises(SyntaxError, jseval, eval_alt.format(lit))
        
        # Sanity check: no literal begins with an underscore
        self.assertRaises(NameError, jseval, eval_alt.format("_0"))

    def test_var_annot_basic_semantics(self):
        # execution order
        with self.assertRaises(ZeroDivisionError):
            no_name[does_not_exist]: no_name_again = 1/0
        with self.assertRaises(NameError):
            no_name[does_not_exist]: 1/0 = 0
        global var_annot_global

        # function semantics
        def f():
            st: str = "Hello"
            a.b: int = (1, 2)
            return st
        # self.assertEqual(f.__annotations__, {})
        def f_OK():
            x: 1/0
        f_OK()
        def fbad():
            x: int
            print(x)
        # throw's name error
        # with self.assertRaises(UnboundLocalError):
            fbad()
        def f2bad():
            (no_such_global): int
            print(no_such_global)
        try:
            f2bad()
        except Exception as e:
            self.assertIs(type(e), NameError)

        # class semantics
        class C:
            __foo: int
            s: str = "attr"
            z = 2
            def __init__(self, x):
                self.x: int = x
        self.assertEqual(C.__annotations__, {'_C__foo': int, 's': str})
        with self.assertRaises(NameError):
            class CBad:
                no_such_name_defined.attr: int = 0
        with self.assertRaises(NameError):
            class Cbad2(C):
                x: int
                x.y: list = []

    def test_var_annot_metaclass_semantics(self):
        class CMeta(type):
            @classmethod
            def __prepare__(metacls, name, bases, **kwds):
                return {'__annotations__': CNS()}
        class CC(metaclass=CMeta):
            XX: 'ANNOT'
        # self.assertEqual(CC.__annotations__['xx'], 'ANNOT')

    def test_var_annot_module_semantics(self):
        with self.assertRaises(AttributeError):
            print(test.__annotations__)
        self.assertEqual(ann_module.__annotations__,
                     {1: 2, 'x': int, 'y': str})#, 'f': typing.Tuple[int, int]})
        self.assertEqual(ann_module.M.__annotations__,
                              {'123': 123, 'o': type})
        self.assertEqual(ann_module2.__annotations__, {})

    def test_funcdef(self):
        # argument annotation tests
        def f(x) -> list: pass
        self.assertEqual(f.__annotations__, {'return': list})
        def f(x: int): pass
        self.assertEqual(f.__annotations__, {'x': int})
        # def f(x: int, /): pass
        # self.assertEqual(f.__annotations__, {'x': int})
        # def f(x: int = 34, /): pass
        # self.assertEqual(f.__annotations__, {'x': int})
        def f(*x: str): pass
        self.assertEqual(f.__annotations__, {'x': str})
        def f(**x: float): pass
        self.assertEqual(f.__annotations__, {'x': float})
        def f(x, y: 1+2): pass
        self.assertEqual(f.__annotations__, {'y': 3})
        # def f(x, y: 1+2, /): pass
        # self.assertEqual(f.__annotations__, {'y': 3})
        def f(a, b: 1, c: 2, d): pass
        self.assertEqual(f.__annotations__, {'b': 1, 'c': 2})
        # def f(a, b: 1, /, c: 2, d): pass
        # self.assertEqual(f.__annotations__, {'b': 1, 'c': 2})
        def f(a, b: 1, c: 2, d, e: 3 = 4, f=5, *g: 6): pass
        self.assertEqual(f.__annotations__,
                         {'b': 1, 'c': 2, 'e': 3, 'g': 6})
        def f(a, b: 1, c: 2, d, e: 3 = 4, f=5, *g: 6, h: 7, i=8, j: 9 = 10,
              **k: 11) -> 12: pass
        self.assertEqual(f.__annotations__,
                         {'b': 1, 'c': 2, 'e': 3, 'g': 6, 'h': 7, 'j': 9,
                          'k': 11, 'return': 12})
        # def f(a, b: 1, c: 2, d, e: 3 = 4, f: int = 5, /, *g: 6, h: 7, i=8, j: 9 = 10,
        #       **k: 11) -> 12: pass
        # self.assertEqual(f.__annotations__,
        #                   {'b': 1, 'c': 2, 'e': 3, 'f': int, 'g': 6, 'h': 7, 'j': 9,
        #                    'k': 11, 'return': 12})
        # Check for issue #20625 -- annotations mangling
        class Spam:
            def f(self, *, __kw: 1):
                pass
        class Ham(Spam): pass
        self.assertEqual(Spam.f.__annotations__, {'_Spam__kw': 1})
        self.assertEqual(Ham.f.__annotations__, {'_Spam__kw': 1})
        # Check for SF Bug #1697248 - mixing decorators and a return annotation
        # Skulpt can't handle null which is the test in cpython
        def _null(x): return x
        @_null
        def f(x) -> list: pass
        self.assertEqual(f.__annotations__, {'return': list})


if __name__ == '__main__':
    unittest.main()
