import unittest
from typing import TypedDict

class TestTypedDictClassSyntax(unittest.TestCase):

    def test_basic_class_syntax(self):
        class Point(TypedDict):
            x: int
            y: int

        p = Point(x=1, y=2)
        self.assertEqual(p['x'], 1)
        self.assertEqual(p['y'], 2)

    def test_annotations_captured(self):
        class Movie(TypedDict):
            name: str
            year: int

        self.assertEqual(Movie.__annotations__, {'name': str, 'year': int})

    def test_is_dict_subclass(self):
        class Point(TypedDict):
            x: int
            y: int

        p = Point(x=1, y=2)
        self.assertIsInstance(p, dict)

    def test_dict_operations(self):
        class Point(TypedDict):
            x: int
            y: int

        p = Point(x=1, y=2)
        self.assertEqual(list(p.keys()), ['x', 'y'])
        self.assertEqual(list(p.values()), [1, 2])

    def test_functional_syntax_still_works(self):
        Point = TypedDict('Point', {'x': int, 'y': int})
        p = Point(x=1, y=2)
        self.assertEqual(p['x'], 1)

if __name__ == '__main__':
    unittest.main()
