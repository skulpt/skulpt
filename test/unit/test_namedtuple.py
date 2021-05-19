
import unittest, keyword
import collections
from collections import namedtuple, OrderedDict

TestNT = namedtuple('TestNT', 'x y z')    # type used for pickle tests


class TestNamedTuple(unittest.TestCase):

    def test_factory(self):
        Point = namedtuple('Point', 'x y')
        self.assertEqual(Point.__name__, 'Point')
        self.assertEqual(Point.__slots__, ())
        self.assertEqual(Point.__module__, __name__)
        self.assertEqual(Point.__getitem__, tuple.__getitem__)
        self.assertEqual(Point._fields, ('x', 'y'))

        self.assertRaises(ValueError, namedtuple, 'abc%', 'efg ghi')       # type has non-alpha char
        self.assertRaises(ValueError, namedtuple, 'class', 'efg ghi')      # type has keyword
        self.assertRaises(ValueError, namedtuple, '9abc', 'efg ghi')       # type starts with digit

        self.assertRaises(ValueError, namedtuple, 'abc', 'efg g%hi')       # field with non-alpha char
        self.assertRaises(ValueError, namedtuple, 'abc', 'abc class')      # field has keyword
        self.assertRaises(ValueError, namedtuple, 'abc', '8efg 9ghi')      # field starts with digit
        self.assertRaises(ValueError, namedtuple, 'abc', '_efg ghi')       # field with leading underscore
        self.assertRaises(ValueError, namedtuple, 'abc', 'efg efg ghi')    # duplicate field

        namedtuple('Point0', 'x1 y2')   # Verify that numbers are allowed in names
        namedtuple('_', 'a b c')        # Test leading underscores in a typename

        nt = namedtuple('nt', 'the quick brown fox')                       # check unicode input
        self.assertNotIn("u'", repr(nt._fields))
        nt = namedtuple('nt', ('the', 'quick'))                           # check unicode input
        self.assertNotIn("u'", repr(nt._fields))

        self.assertRaises(TypeError, Point._make, [11])                     # catch too few args
        self.assertRaises(TypeError, Point._make, [11, 22, 33])             # catch too many args

        self.assertRaises(TypeError, Point, [11])                     # catch too few args
        self.assertRaises(TypeError, Point, [11, 22, 33])             # catch too many args


    def test_defaults(self):
        Point = namedtuple('Point', 'x y', defaults=(10, 20))              # 2 defaults
        self.assertEqual(Point._field_defaults, {'x': 10, 'y': 20})
        self.assertEqual(Point(1, 2), (1, 2))
        self.assertEqual(Point(1), (1, 20))
        self.assertEqual(Point(), (10, 20))

        Point = namedtuple('Point', 'x y', defaults=(20,))                 # 1 default
        self.assertEqual(Point._field_defaults, {'y': 20})
        self.assertEqual(Point(1, 2), (1, 2))
        self.assertEqual(Point(1), (1, 20))

        Point = namedtuple('Point', 'x y', defaults=())                     # 0 defaults
        self.assertEqual(Point._field_defaults, {})
        self.assertEqual(Point(1, 2), (1, 2))
        with self.assertRaises(TypeError):
            Point(1)

        with self.assertRaises(TypeError):                                  # catch too few args
            Point()
        with self.assertRaises(TypeError):                                  # catch too many args
            Point(1, 2, 3)
        with self.assertRaises(TypeError):                                  # too many defaults
            Point = namedtuple('Point', 'x y', defaults=(10, 20, 30))
        with self.assertRaises(TypeError):                                  # non-iterable defaults
            Point = namedtuple('Point', 'x y', defaults=10)
        with self.assertRaises(TypeError):                                  # another non-iterable default
            Point = namedtuple('Point', 'x y', defaults=False)

        Point = namedtuple('Point', 'x y', defaults=None)                   # default is None
        self.assertEqual(Point._field_defaults, {})
        # self.assertIsNone(Point.__new__.__defaults__, None)
        self.assertEqual(Point(10, 20), (10, 20))
        with self.assertRaises(TypeError):                                  # catch too few args
            Point(10)

        Point = namedtuple('Point', 'x y', defaults=[10, 20])               # allow non-tuple iterable
        self.assertEqual(Point._field_defaults, {'x': 10, 'y': 20})
        # self.assertEqual(Point.__new__.__defaults__, (10, 20))
        self.assertEqual(Point(1, 2), (1, 2))
        self.assertEqual(Point(1), (1, 20))
        self.assertEqual(Point(), (10, 20))

        Point = namedtuple('Point', 'x y', defaults=iter([10, 20]))         # allow plain iterator
        self.assertEqual(Point._field_defaults, {'x': 10, 'y': 20})
        # self.assertEqual(Point.__new__.__defaults__, (10, 20))
        self.assertEqual(Point(1, 2), (1, 2))
        self.assertEqual(Point(1), (1, 20))
        self.assertEqual(Point(), (10, 20))


    # @unittest.skipIf(sys.flags.optimize >= 2,
    #                  "Docstrings are omitted with -O2 and above")
    def test_factory_doc_attr(self):
        Point = namedtuple('Point', 'x y')
        self.assertEqual(Point.__doc__, 'Point(x, y)')

    # @unittest.skipIf(sys.flags.optimize >= 2,
    #                  "Docstrings are omitted with -O2 and above")
    # def test_doc_writable(self):
    #     Point = namedtuple('Point', 'x y')
    #     self.assertEqual(Point.x.__doc__, 'Alias for field number 0')
    #     Point.x.__doc__ = 'docstring for Point.x'
    #     self.assertEqual(Point.x.__doc__, 'docstring for Point.x')

    def test_name_fixer(self):
        for spec, renamed in [
            [('efg', 'g%hi'),  ('efg', '_1')],                              # field with non-alpha char
            [('abc', 'class'), ('abc', '_1')],                              # field has keyword
            [('8efg', '9ghi'), ('_0', '_1')],                               # field starts with digit
            [('abc', '_efg'), ('abc', '_1')],                               # field with leading underscore
            [('abc', 'efg', 'efg', 'ghi'), ('abc', 'efg', '_2', 'ghi')],    # duplicate field
            [('abc', '', 'x'), ('abc', '_1', 'x')],                         # fieldname is a space
        ]:
            self.assertEqual(namedtuple('NT', spec, rename=True)._fields, renamed)
    
    
    def test_skulpt_names(self):
        # added test for skulpt names that should work.
        reserved_names = ['apply', 'call', 'eval', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toSource', 'toLocaleString', 'toString', 'unwatch', 'valueOf', 'watch', 'length', 'name']
        NT = namedtuple('NT', reserved_names)
        nt = NT(*(None for _ in reserved_names))

        self.assertEqual(nt.apply,None)
        self.assertEqual(nt.call,None)
        self.assertEqual(nt.eval,None)
        self.assertEqual(nt.hasOwnProperty,None)
        self.assertEqual(nt.isPrototypeOf,None)
        self.assertEqual(nt.propertyIsEnumerable,None)
        self.assertEqual(nt.toSource,None)
        self.assertEqual(nt.toLocaleString,None)
        self.assertEqual(nt.toString,None)
        self.assertEqual(nt.unwatch,None)
        self.assertEqual(nt.valueOf,None)
        self.assertEqual(nt.watch,None)
        self.assertEqual(nt.length,None)
        self.assertEqual(nt.name,None)

    def test_module_parameter(self):
        NT = namedtuple('NT', ['x', 'y'], module=collections)
        self.assertEqual(NT.__module__, collections)

    def test_instance(self):
        Point = namedtuple('Point', 'x y')
        p = Point(11, 22)
        self.assertEqual(p, Point(x=11, y=22))
        self.assertEqual(p, Point(11, y=22))
        self.assertEqual(p, Point(y=22, x=11))
        self.assertEqual(p, Point(*(11, 22)))
        self.assertEqual(p, Point(**dict(x=11, y=22)))
        self.assertRaises(TypeError, Point, 1)                              # too few args
        self.assertRaises(TypeError, Point, 1, 2, 3)                        # too many args
        # self.assertRaises(TypeError, eval, 'Point(XXX=1, y=2)', locals())   # wrong keyword argument
        # self.assertRaises(TypeError, eval, 'Point(x=1)', locals())          # missing keyword argument
        self.assertEqual(repr(p), 'Point(x=11, y=22)')
        #self.assertNotIn('__weakref__', dir(p))
        self.assertEqual(p, Point._make([11, 22]))                          # test _make classmethod
        self.assertEqual(p._fields, ('x', 'y'))                             # test _fields attribute
        self.assertEqual(p._replace(x=1), (1, 22))                          # test _replace method
        self.assertEqual(p._asdict(), dict(x=11, y=22))                     # test _asdict method
        try:
            p._replace(x=1, error=2)
        except ValueError:
            pass
        else:
            self._fail('Did not detect an incorrect fieldname')

        # verify that field string can have commas
        Point = namedtuple('Point', 'x, y')
        p = Point(x=11, y=22)
        self.assertEqual(repr(p), 'Point(x=11, y=22)')

        # verify that fieldspec can be a non-string sequence
        Point = namedtuple('Point', ('x', 'y'))
        p = Point(x=11, y=22)
        self.assertEqual(repr(p), 'Point(x=11, y=22)')

    def test_tupleness(self):
        Point = namedtuple('Point', 'x y')
        p = Point(11, 22)

        self.assertIsInstance(p, tuple)
        self.assertEqual(p, (11, 22))                                       # matches a real tuple
        self.assertEqual(tuple(p), (11, 22))                                # coercable to a real tuple
        self.assertEqual(list(p), [11, 22])                                 # coercable to a list
        self.assertEqual(max(p), 22)                                        # iterable
        self.assertEqual(max(*p), 22)                                       # star-able
        x, y = p
        self.assertEqual(p, (x, y))                                         # unpacks like a tuple
        self.assertEqual((p[0], p[1]), (11, 22))                            # indexable like a tuple
        self.assertRaises(IndexError, p.__getitem__, 3)

        self.assertEqual(p.x, x)
        self.assertEqual(p.y, y)
        # self.assertRaises(AttributeError, eval, 'p.z', locals())

    def test_odd_sizes(self):
        Zero = namedtuple('Zero', '')
        self.assertEqual(Zero(), ())
        self.assertEqual(Zero._make([]), ())
        self.assertEqual(repr(Zero()), 'Zero()')
        self.assertEqual(Zero()._asdict(), {})
        self.assertEqual(Zero()._fields, ())

        Dot = namedtuple('Dot', 'd')
        self.assertEqual(Dot(1), (1,))
        self.assertEqual(Dot._make([1]), (1,))
        self.assertEqual(Dot(1).d, 1)
        self.assertEqual(repr(Dot(1)), 'Dot(d=1)')
        self.assertEqual(Dot(1)._asdict(), {'d':1})
        self.assertEqual(Dot(1)._replace(d=999), (999,))
        self.assertEqual(Dot(1)._fields, ('d',))

        n = 5000
        import string, random
        names = list(set(''.join([random.choice(string.ascii_letters)
                                  for j in range(10)]) for i in range(n)))
        n = len(names)
        Big = namedtuple('Big', names)
        b = Big(*range(n))
        self.assertEqual(b, tuple(range(n)))
        self.assertEqual(Big._make(range(n)), tuple(range(n)))
        for pos, name in enumerate(names):
            self.assertEqual(getattr(b, name), pos)
        repr(b)                                 # make sure repr() doesn't blow-up
        d = b._asdict()
        d_expected = dict(zip(names, range(n)))
        self.assertEqual(d, d_expected)
        b2 = b._replace(**dict([(names[1], 999),(names[-5], 42)]))
        b2_expected = list(range(n))
        b2_expected[1] = 999
        b2_expected[-5] = 42
        self.assertEqual(b2, tuple(b2_expected))
        self.assertEqual(b._fields, tuple(names))

    # def test_pickle(self):
    #     p = TestNT(x=10, y=20, z=30)
    #     for module in (pickle,):
    #         loads = getattr(module, 'loads')
    #         dumps = getattr(module, 'dumps')
    #         for protocol in range(-1, module.HIGHEST_PROTOCOL + 1):
    #             q = loads(dumps(p, protocol))
    #             self.assertEqual(p, q)
    #             self.assertEqual(p._fields, q._fields)
    #             self.assertNotIn(b'OrderedDict', dumps(p, protocol))

    # def test_copy(self):
    #     import copy
    #     p = TestNT(x=10, y=20, z=30)
    #     for copier in copy.copy, copy.deepcopy:
    #         q = copier(p)
    #         self.assertEqual(p, q)
    #         self.assertEqual(p._fields, q._fields)

    def test_name_conflicts(self):
        # Some names like "self", "cls", "tuple", "itemgetter", and "property"
        # failed when used as field names.  Test to make sure these now work.
        T = namedtuple('T', 'itemgetter property self cls tuple')
        t = T(1, 2, 3, 4, 5)
        self.assertEqual(t, (1,2,3,4,5))
        newt = t._replace(itemgetter=10, property=20, self=30, cls=40, tuple=50)
        self.assertEqual(newt, (10,20,30,40,50))

       # Broader test of all interesting names taken from the code, old
       # template, and an example
        words = {'Alias', 'At', 'AttributeError', 'Build', 'Bypass', 'Create',
        'Encountered', 'Expected', 'Field', 'For', 'Got', 'Helper',
        'IronPython', 'Jython', 'KeyError', 'Make', 'Modify', 'Note',
        'OrderedDict', 'Point', 'Return', 'Returns', 'Type', 'TypeError',
        'Used', 'Validate', 'ValueError', 'Variables', 'a', 'accessible', 'add',
        'added', 'all', 'also', 'an', 'arg_list', 'args',
        'automatically', 'be', 'build', 'builtins', 'but', 'by', 'cannot',
        'class_namespace', 'classmethod', 'cls', 'collections', 'convert',
        'copy', 'created', 'creation', 'd', 'debugging', 'defined', 'dict',
        'dictionary', 'doc', 'docstring', 'docstrings', 'duplicate', 'effect',
        'either', 'enumerate', 'environments', 'error', 'example', 'f',
        'f_globals', 'field', 'field_names', 'fields', 'formatted', 'frame',
        'function', 'functions', 'generate', 'get', 'getter', 'got', 'greater',
        'has', 'help', 'identifiers', 'index', 'indexable', 'instance',
        'instantiate', 'interning', 'introspection', 'isidentifier',
        'isinstance', 'itemgetter', 'iterable', 'join', 'keyword', 'keywords',
        'kwds', 'len', 'like', 'list', 'map', 'maps', 'message', 'metadata',
        'method', 'methods', 'module', 'module_name', 'must', 'name', 'named',
        'namedtuple', 'namedtuple_', 'names', 'namespace', 'needs', 'new',
        'nicely', 'num_fields', 'number', 'object', 'of', 'operator', 'option',
        'p', 'particular', 'pickle', 'pickling', 'plain', 'pop', 'positional',
        'property', 'r', 'regular', 'rename', 'replace', 'replacing', 'repr',
        'repr_fmt', 'representation', 'result', 'reuse_itemgetter', 's', 'seen',
        'self', 'sequence', 'set', 'side', 'specified', 'split', 'start',
        'startswith', 'step', 'str', 'string', 'strings', 'subclass', 'sys',
        'targets', 'than', 'the', 'their', 'this', 'to', 'tuple', 'tuple_new',
        'type', 'typename', 'underscore', 'unexpected', 'unpack', 'up', 'use',
        'used', 'user', 'valid', 'values', 'variable', 'verbose', 'where',
        'which', 'work', 'x', 'y', 'z', 'zip'}
        T = namedtuple('T', words)
        # test __new__
        values = tuple(range(len(words)))
        t = T(*values)
        self.assertEqual(t, values)
        t = T(**dict(zip(T._fields, values)))
        self.assertEqual(t, values)
        # test _make
        t = T._make(values)
        self.assertEqual(t, values)
        # exercise __repr__
        repr(t)
        # test _asdict
        self.assertEqual(t._asdict(), dict(zip(T._fields, values)))
        # test _replace
        t = T._make(values)
        newvalues = tuple(v*10 for v in values)
        newt = t._replace(**dict(zip(T._fields, newvalues)))
        self.assertEqual(newt, newvalues)
        # test _fields
        self.assertEqual(T._fields, tuple(words))
        # test __getnewargs__
        self.assertEqual(t.__getnewargs__(), values)

    def test_repr(self):
        A = namedtuple('A', 'x')
        self.assertEqual(repr(A(1)), 'A(x=1)')
        # repr should show the name of the subclass
        class B(A):
            pass
        self.assertEqual(repr(B(1)), 'B(x=1)')

    def test_keyword_only_arguments(self):
    #     # See issue 25628
        with self.assertRaises(TypeError):
            NT = namedtuple('NT', ['x', 'y'], True)

        NT = namedtuple('NT', ['abc', 'def'], rename=True)
        self.assertEqual(NT._fields, ('abc', '_1'))
        with self.assertRaises(TypeError):
            NT = namedtuple('NT', ['abc', 'def'], False, True)

    def test_namedtuple_subclass_issue_24931(self):
        class Point(namedtuple('_Point', ['x', 'y'])):
            pass

        a = Point(3, 4)
        self.assertEqual(a._asdict(), OrderedDict([('x', 3), ('y', 4)]))

        a.w = 5
        self.assertEqual(a.__dict__, {'w': 5})


if __name__ == "__main__":
    unittest.main()
