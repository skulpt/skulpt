"""Tests for PEP 604 Union Type Syntax (int | str)."""

import unittest
from typing import Union, get_origin, get_args
from types import UnionType


class TestUnionTypeSyntax(unittest.TestCase):
    """Test PEP 604 union type syntax."""

    def test_basic_union(self):
        """Test basic union type creation."""
        u = int | str
        self.assertIsInstance(u, UnionType)
        self.assertEqual(repr(u), "int | str")

    def test_union_with_none(self):
        """Test union with None (equivalent to Optional)."""
        u = int | None
        self.assertIsInstance(u, UnionType)
        args = get_args(u)
        self.assertEqual(len(args), 2)
        self.assertIn(int, args)
        self.assertIn(type(None), args)

    def test_none_first(self):
        """Test None | type syntax."""
        u = None | int
        self.assertIsInstance(u, UnionType)
        args = get_args(u)
        self.assertEqual(len(args), 2)
        self.assertIn(int, args)
        self.assertIn(type(None), args)

    def test_union_flattening(self):
        """Test that nested unions are flattened."""
        u1 = int | str
        u2 = u1 | bool
        args = get_args(u2)
        self.assertEqual(len(args), 3)
        self.assertIn(int, args)
        self.assertIn(str, args)
        self.assertIn(bool, args)

    def test_union_flattening_both_sides(self):
        """Test flattening with unions on both sides."""
        u1 = int | str
        u2 = bool | float
        u3 = u1 | u2
        args = get_args(u3)
        self.assertEqual(len(args), 4)
        self.assertIn(int, args)
        self.assertIn(str, args)
        self.assertIn(bool, args)
        self.assertIn(float, args)

    def test_union_deduplication(self):
        """Test that duplicate types are reduced to the single type."""
        u = int | int
        # In CPython, int | int returns int itself, not a UnionType
        self.assertIs(u, int)

    def test_union_equality(self):
        """Test union equality."""
        u1 = int | str
        u2 = int | str
        self.assertEqual(u1, u2)

    def test_union_order_independence(self):
        """Test that union comparison is order-independent."""
        u1 = int | str
        u2 = str | int
        self.assertEqual(u1, u2)

    def test_union_inequality(self):
        """Test union inequality."""
        u1 = int | str
        u2 = int | bool
        self.assertNotEqual(u1, u2)

    def test_union_hash(self):
        """Test that equal unions have the same hash."""
        u1 = int | str
        u2 = str | int
        self.assertEqual(hash(u1), hash(u2))

    def test_union_hash_in_set(self):
        """Test that unions can be used in sets."""
        u1 = int | str
        u2 = str | int
        s = {u1}
        self.assertIn(u2, s)

    def test_get_origin(self):
        """Test get_origin returns types.UnionType."""
        u = int | str
        self.assertIs(get_origin(u), UnionType)

    def test_get_args(self):
        """Test get_args returns the constituent types."""
        u = int | str
        args = get_args(u)
        self.assertEqual(len(args), 2)
        self.assertIn(int, args)
        self.assertIn(str, args)

    def test_union_with_union_type(self):
        """Test combining UnionType with other types."""
        u1 = int | str
        u2 = u1 | bool
        args = get_args(u2)
        self.assertEqual(len(args), 3)
        self.assertIn(int, args)
        self.assertIn(str, args)
        self.assertIn(bool, args)

    def test_three_types(self):
        """Test union of three types."""
        u = int | str | bool
        args = get_args(u)
        self.assertEqual(len(args), 3)
        self.assertIn(int, args)
        self.assertIn(str, args)
        self.assertIn(bool, args)

    def test_many_types(self):
        """Test union of many types."""
        u = int | str | bool | float | list | dict
        args = get_args(u)
        self.assertEqual(len(args), 6)

    def test_args_attribute(self):
        """Test __args__ attribute."""
        u = int | str
        self.assertIsInstance(u.__args__, tuple)
        self.assertEqual(len(u.__args__), 2)
        self.assertIn(int, u.__args__)
        self.assertIn(str, u.__args__)

    def test_repr_with_none(self):
        """Test repr with None shows 'None' not 'NoneType'."""
        u = int | None
        r = repr(u)
        self.assertIn("None", r)
        self.assertNotIn("NoneType", r)

    def test_cannot_instantiate(self):
        """Test that UnionType cannot be instantiated directly."""
        with self.assertRaises(TypeError):
            UnionType()

    def test_union_not_equal_to_non_union(self):
        """Test that union is not equal to non-union types."""
        u = int | str
        self.assertNotEqual(u, int)
        self.assertNotEqual(u, str)
        self.assertNotEqual(u, (int, str))
        self.assertNotEqual(u, [int, str])


class TestUnionTypeWithTypes(unittest.TestCase):
    """Test UnionType with types module."""

    def test_import_union_type(self):
        """Test that UnionType can be imported from types."""
        from types import UnionType
        self.assertIsNotNone(UnionType)

    def test_isinstance_check(self):
        """Test isinstance check with UnionType."""
        u = int | str
        self.assertIsInstance(u, UnionType)

    def test_type_of_union(self):
        """Test type() of union."""
        u = int | str
        self.assertIs(type(u), UnionType)


if __name__ == "__main__":
    unittest.main()
