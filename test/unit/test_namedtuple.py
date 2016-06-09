
import unittest, keyword
from collections import namedtuple

TestNT = namedtuple('TestNT', 'x y z')    # type used for pickle tests


class TestNamedTuple(unittest.TestCase):

    def test_factory(self):
        Point = namedtuple('Point', 'x y')
        # self.assertEqual(Point.__name__, 'Point')
        # self.assertEqual(Point.__slots__, ())
        # self.assertEqual(Point.__module__, __name__)
        # self.assertEqual(Point.__getitem__, tuple.__getitem__)
        # self.assertEqual(Point._fields, ('x', 'y'))

        self.assertRaises(ValueError, namedtuple, 'abc%', 'efg ghi')       # type has non-alpha char
        self.assertRaises(ValueError, namedtuple, 'def', 'efg ghi')      # type has keyword
        self.assertRaises(ValueError, namedtuple, '9abc', 'efg ghi')       # type starts with digit

        self.assertRaises(ValueError, namedtuple, 'abc', 'efg g%hi')       # field with non-alpha char
        self.assertRaises(ValueError, namedtuple, 'abc', 'abc class')      # field has keyword
        self.assertRaises(ValueError, namedtuple, 'abc', '8efg 9ghi')      # field starts with digit
        self.assertRaises(ValueError, namedtuple, 'abc', '_efg ghi')       # field with leading underscore
        self.assertRaises(ValueError, namedtuple, 'abc', 'efg efg ghi')    # duplicate field

        namedtuple('Point0', 'x1 y2')   # Verify that numbers are allowed in names
        namedtuple('_', 'a b c')        # Test leading underscores in a typename

        nt = namedtuple('nt', u'the quick brown fox')                       # check unicode input
        #self.assertNotIn("u'", repr(nt._fields))
        nt = namedtuple('nt', (u'the', u'quick'))                           # check unicode input
        #self.assertNotIn("u'", repr(nt._fields))

        self.assertRaises(TypeError, Point, [11])                     # catch too few args
        self.assertRaises(TypeError, Point, [11, 22, 33])             # catch too many args


    # def test_name_fixer(self):
    #     for spec, renamed in [
    #         [('efg', 'g%hi'),  ('efg', '_1')],                              # field with non-alpha char
    #         [('abc', 'class'), ('abc', '_1')],                              # field has keyword
    #         [('8efg', '9ghi'), ('_0', '_1')],                               # field starts with digit
    #         [('abc', '_efg'), ('abc', '_1')],                               # field with leading underscore
    #         [('abc', 'efg', 'efg', 'ghi'), ('abc', 'efg', '_2', 'ghi')],    # duplicate field
    #         [('abc', '', 'x'), ('abc', '_1', 'x')],                         # fieldname is a space
    #     ]:
    #         self.assertEqual(namedtuple('NT', spec, rename=True)._fields, renamed)

    def test_instance(self):
        Point = namedtuple('Point', 'x y')
        p = Point(11, 22)
        #self.assertEqual(p, Point(x=11, y=22))
        self.assertEqual(p, Point(11, 22))
        #self.assertEqual(p, Point(y=22, x=11))
        self.assertEqual(p, Point(*(11, 22)))
        #self.assertEqual(p, Point(**dict(x=11, y=22)))
        self.assertRaises(TypeError, Point, 1)                              # too few args
        self.assertRaises(TypeError, Point, 1, 2, 3)                        # too many args
        # self.assertRaises(TypeError, eval, 'Point(XXX=1, y=2)', locals())   # wrong keyword argument
        # self.assertRaises(TypeError, eval, 'Point(x=1)', locals())          # missing keyword argument
        self.assertEqual(repr(p), 'Point(x=11, y=22)')
        #self.assertNotIn('__weakref__', dir(p))
        #self.assertEqual(p, Point._make([11, 22]))                          # test _make classmethod
        #self.assertEqual(p._fields, ('x', 'y'))                             # test _fields attribute
        #self.assertEqual(p._replace(x=1), (1, 22))                          # test _replace method
        #self.assertEqual(p._asdict(), dict(x=11, y=22))                     # test _asdict method
        #self.assertEqual(vars(p), p._asdict())                              # verify that vars() works

        # try:
        #     p._replace(x=1, error=2)
        # except ValueError:
        #     pass
        # else:
        #     self._fail('Did not detect an incorrect fieldname')

        # p = Point(x=11, y=22)
        # self.assertEqual(repr(p), 'Point(x=11, y=22)')

        # verify that fieldspec can be a non-string sequence
        Point = namedtuple('Point', ('x', 'y'))
        p = Point(11, 22)
        self.assertEqual(repr(p), 'Point(x=11, y=22)')

    def test_tupleness(self):
        Point = namedtuple('Point', 'x y')
        p = Point(11, 22)

        #self.assertIsInstance(p, tuple)
        self.assertEqual(p, (11, 22))                                       # matches a real tuple
        self.assertEqual(tuple(p), (11, 22))                                # coercable to a real tuple
        self.assertEqual(list(p), [11, 22])                                 # coercable to a list
        self.assertEqual(max(p), 22)                                        # iterable
        self.assertEqual(max(*p), 22)                                       # star-able
        x, y = p
        self.assertEqual(p, (x, y))                                         # unpacks like a tuple
        self.assertEqual((p[0], p[1]), (11, 22))                            # indexable like a tuple
        #self.assertRaises(IndexError, p.__getitem__, 3)

        self.assertEqual(p.x, x)
        self.assertEqual(p.y, y)
        # self.assertRaises(AttributeError, eval, 'p.z', locals())

    def test_odd_sizes(self):
        Zero = namedtuple('Zero', '')
        #self.assertEqual(Zero(), ())
        #self.assertEqual(Zero._make([]), ())
        #self.assertEqual(repr(Zero()), 'Zero()')
        #self.assertEqual(Zero()._asdict(), {})
        #self.assertEqual(Zero()._fields, ())

        Dot = namedtuple('Dot', 'd')
        self.assertEqual(Dot(1), (1,))
        #self.assertEqual(Dot._make([1]), (1,))
        self.assertEqual(Dot(1).d, 1)
        #self.assertEqual(repr(Dot(1)), 'Dot(d=1)')
        #self.assertEqual(Dot(1)._asdict(), {'d':1})
        #self.assertEqual(Dot(1)._replace(d=999), (999,))
        #self.assertEqual(Dot(1)._fields, ('d',))

        n = 5000
        import string, random
        names = list(set(''.join([random.choice(string.ascii_letters)
                                  for j in range(10)]) for i in range(n)))
        n = len(names)
        Big = namedtuple('Big', names)
        b = Big(*range(n))
        self.assertEqual(b, tuple(range(n)))
        #self.assertEqual(Big._make(range(n)), tuple(range(n)))
        for pos, name in enumerate(names):
            self.assertEqual(getattr(b, name), pos)
        repr(b)                                 # make sure repr() doesn't blow-up
        #d = b._asdict()
        #d_expected = dict(zip(names, range(n)))
        #self.assertEqual(d, d_expected)
        #b2 = b._replace(**dict([(names[1], 999),(names[-5], 42)]))
        #b2_expected = range(n)
        #b2_expected[1] = 999
        #b2_expected[-5] = 42
        #self.assertEqual(b2, tuple(b2_expected))
        #self.assertEqual(b._fields, tuple(names))


    def test_name_conflicts(self):
        # Some names like "self", "cls", "tuple", "itemgetter", and "property"
        # failed when used as field names.  Test to make sure these now work.
        T = namedtuple('T', 'itemgetter property self cls tuple')
        t = T(1, 2, 3, 4, 5)
        self.assertEqual(t, (1,2,3,4,5))
        # newt = t._replace(itemgetter=10, property=20, self=30, cls=40, tuple=50)
        # self.assertEqual(newt, (10,20,30,40,50))

        # Broader test of all interesting names in a template
        # with test_support.captured_stdout() as template:
        #     T = namedtuple('T', 'x', verbose=True)
        # words = set(re.findall('[A-Za-z]+', template.getvalue()))
        # words -= set(keyword.kwlist)
        # T = namedtuple('T', words)
        # # test __new__
        # values = tuple(range(len(words)))
        # t = T(*values)
        # self.assertEqual(t, values)
        # t = T(**dict(zip(T._fields, values)))
        # self.assertEqual(t, values)
        # # test _make
        # t = T._make(values)
        # self.assertEqual(t, values)
        # # exercise __repr__
        # repr(t)
        # # test _asdict
        # self.assertEqual(t._asdict(), dict(zip(T._fields, values)))
        # # test _replace
        # t = T._make(values)
        # newvalues = tuple(v*10 for v in values)
        # newt = t._replace(**dict(zip(T._fields, newvalues)))
        # self.assertEqual(newt, newvalues)
        # # test _fields
        # self.assertEqual(T._fields, tuple(words))
        # # test __getnewargs__
        # self.assertEqual(t.__getnewargs__(), values)

if __name__ == "__main__":
    unittest.main(verbosity=2)
