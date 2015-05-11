__author__ = "gerbal"

import unittest

class string_format(unittest.TestCase):
    def test_simple_position(self):
        self.assertEqual('a, b, c', '{0}, {1}, {2}'.format('a', 'b', 'c'))
        self.assertEqual('a, b, c', '{}, {}, {}'.format('a', 'b', 'c'))
        self.assertEqual('c, b, a',  '{2}, {1}, {0}'.format('a', 'b', 'c'))
        self.assertEqual('c, b, a', '{2}, {1}, {0}'.format(*'abc'))
        self.assertEqual('abracadabra', '{0}{1}{0}'.format('abra', 'cad'))

    #Kwargs don't work
    def test_arg_names(self):
        self.assertEqual('Coordinates: 37.24N, -115.81W', 'Coordinates: {latitude}, {longitude}'.format(latitude='37.24N', longitude='-115.81W'))
        ## **kwargs does not work properly in Skulpt
        # coord = {'latitude': '37.24N', 'longitude': '-115.81W'}
        # self.assertEqual('Coordinates: 37.24N, -115.81W', 'Coordinates: {latitude}, {longitude}'.format(**coord))
    
    ## Complex Numbers Currently unsupported
    
    # def test_arg_attr(self):
    #     c = 3-5j
    #     self.assertEqual('The complex number (3-5j) is formed from the real part 3.0 and the imaginary part -5.0.', ('The complex number {0} is formed from the real part {0.real} and the imaginary part {0.imag}.').format(c))
    #     class Point(object):
    #         def __init__(self, x, y):
    #             self.x, self.y = x, y
    #         def __str__(self):
    #             return 'Point({self.x}, {self.y})'.format(self=self)
    #     self.assertEqual('Point(4, 2)', str(Point(4, 2)))

    def test_arg_items(self):
        coord = (3, 5)
        self.assertEqual('X: 3;  Y: 5','X: {0[0]};  Y: {0[1]}'.format(coord))
#        self.assertEqual('My name is Fred',"My name is {0[name]}".format({'name':'Fred'}))

# TODO:  make these pass
#    def test_width(self):
#        self.assertEqual('         2,2',"{0:10},{0}".format(2))
#        self.assertEqual('foo bar baz ',"{0:4}{1:4}{2:4}".format("foo","bar","baz")) 
        

    def test_conversion(self):
        self.assertEqual("repr() shows quotes: 'test1'; str() doesn't: test2", "repr() shows quotes: {!r}; str() doesn't: {!s}".format('test1', 'test2'))

    def test_expansion(self):
        self.assertEqual('left aligned                  ', '{:<30}'.format('left aligned'))
        self.assertEqual('                 right aligned', '{:>30}'.format('right aligned'))
        self.assertEqual('           centered           ', '{:^30}'.format('centered'))
        self.assertEqual('***********centered***********', '{:*^30}'.format('centered'))

    def test_fixed_point(self):
        self.assertEqual('+3.140000; -3.140000', '{:+f}; {:+f}'.format(3.14, -3.14))
        self.assertEqual(' 3.140000; -3.140000', '{: f}; {: f}'.format(3.14, -3.14))
        self.assertEqual('3.140000; -3.140000',  '{:-f}; {:-f}'.format(3.14, -3.14))

    def test_hex_oct(self):
        self.assertEqual('int: 42;  hex: 2a;  oct: 52;  bin: 101010', "int: {0:d};  hex: {0:x};  oct: {0:o};  bin: {0:b}".format(42))
        self.assertEqual('int: 42;  hex: 0x2a;  oct: 0o52;  bin: 0b101010', "int: {0:d};  hex: {0:#x};  oct: {0:#o};  bin: {0:#b}".format(42))

    def test_comma_sep(self):
        self.assertEqual('1,234,567,890',  '{:,}'.format(1234567890))

    def test_percentage(self):
        points = 19.5
        total = 22
        self.assertEqual('Correct answers: 88.64%', 'Correct answers: {:.2%}'.format(points/total))

    ## Datetime requires more work.
    
    # def test_datetome(self):
    #     import datetime
    #     d = datetime.datetime(2010, 7, 4, 12, 15, 58)
    #     self.assertEqual('2010-07-04 12:15:58', '{:%Y-%m-%d %H:%M:%S}'.format(d))

if __name__ == '__main__':
    unittest.main()
