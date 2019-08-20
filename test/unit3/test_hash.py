""" Unit test for hash"""
import unittest

class HashTest(unittest.TestCase):
    def test_integers(self):
        self.assertEqual(hash(int()),hash(int()))
        self.assertEqual(hash(332), hash(332))
        self.assertEqual(hash(-47), hash(-47))

    def test_float(self):
        self.assertEqual(hash(float()), hash(float()))
        self.assertEqual(hash(33.2), hash(33.2))
        self.assertEqual(hash(0.05), hash(0.05))
        self.assertEqual(hash(-11.85), hash(-11.85))

    def test_strings(self):
        self.assertEqual(hash(''), hash(''))
        self.assertEqual(hash('hello'), hash('hello'))

    def test_tuples(self):
        self.assertEqual(hash(()), hash(()))
        self.assertEqual(hash((1,2,3)), hash((1,2,3,)))

    def test_int_and_float(self):
        self.assertEqual(hash(1), hash(1.0))
        self.assertEqual(hash(-5), hash(-5.0))

if __name__ == '__main__':
    unittest.main()
            
