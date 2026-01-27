"""Functional tests for typing module - real-world usage patterns."""
import unittest
from typing import (
    Any, Union, Optional, List, Dict, Set, Tuple, FrozenSet,
    Callable, Type, TypeVar, TypeVarTuple, Generic, Literal, NoReturn, ClassVar, Final,
    Protocol, runtime_checkable, NamedTuple, TypedDict, Annotated, overload, Unpack,
    Iterable, Mapping, Sequence,
    cast, get_origin, get_args
)

class TestRealWorldUsage(unittest.TestCase):
    """Test patterns commonly used in real Python code."""

    def test_function_with_type_hints(self):
        """Functions with type hints should work normally."""
        def greet(name):
            # type: (str) -> str
            return "Hello, " + name

        self.assertEqual(greet("World"), "Hello, World")

    def test_list_type_hint(self):
        """List type hints for function signatures."""
        def sum_numbers(numbers):
            # type: (List[int]) -> int
            return sum(numbers)

        self.assertEqual(sum_numbers([1, 2, 3, 4, 5]), 15)

    def test_dict_type_hint(self):
        """Dict type hints for function signatures."""
        def get_value(d, key):
            # type: (Dict[str, int], str) -> Optional[int]
            return d.get(key)

        self.assertEqual(get_value({"a": 1}, "a"), 1)
        self.assertIsNone(get_value({"a": 1}, "b"))

    def test_optional_handling(self):
        """Optional type hints."""
        def maybe_double(x):
            # type: (Optional[int]) -> Optional[int]
            return x * 2 if x is not None else None

        self.assertEqual(maybe_double(5), 10)
        self.assertIsNone(maybe_double(None))

    def test_union_type(self):
        """Union type for multiple possible types."""
        def stringify(x):
            # type: (Union[int, str, list]) -> str
            if isinstance(x, list):
                return str(x)
            return str(x)

        self.assertEqual(stringify(42), "42")
        self.assertEqual(stringify("hello"), "hello")

    def test_callable_type(self):
        """Callable type for function parameters."""
        def apply_func(f, x):
            # type: (Callable[[int], int], int) -> int
            return f(x)

        self.assertEqual(apply_func(lambda x: x * 2, 5), 10)

    def test_typevar_usage(self):
        """TypeVar for generic functions."""
        T = TypeVar('T')

        def identity(x):
            # type: (T) -> T
            return x

        self.assertEqual(identity(42), 42)
        self.assertEqual(identity("hello"), "hello")

    def test_namedtuple_creation(self):
        """NamedTuple for structured data."""
        Point = NamedTuple('Point', [('x', int), ('y', int)])

        p = Point(3, 4)
        self.assertEqual(p.x, 3)
        self.assertEqual(p.y, 4)
        self.assertEqual(p[0], 3)
        self.assertEqual(p[1], 4)

        # Unpacking
        x, y = p
        self.assertEqual(x, 3)
        self.assertEqual(y, 4)

    def test_typeddict_creation(self):
        """TypedDict for structured dictionaries."""
        Person = TypedDict('Person', {'name': str, 'age': int})

        alice = Person(name='Alice', age=30)
        self.assertEqual(alice['name'], 'Alice')
        self.assertEqual(alice['age'], 30)

    def test_cast_usage(self):
        """cast() for type narrowing."""
        # cast should return the value unchanged
        x = cast(int, "not really an int")
        self.assertEqual(x, "not really an int")  # cast is no-op at runtime

    def test_get_origin_and_args(self):
        """get_origin and get_args for runtime type inspection."""
        # List[int]
        list_int = List[int]
        self.assertIs(get_origin(list_int), list)
        self.assertEqual(get_args(list_int), (int,))

        # Dict[str, int]
        dict_str_int = Dict[str, int]
        self.assertIs(get_origin(dict_str_int), dict)
        self.assertEqual(get_args(dict_str_int), (str, int))

        # Union[int, str]
        union_type = Union[int, str]
        self.assertIs(get_origin(union_type), Union)
        self.assertEqual(get_args(union_type), (int, str))

    def test_overload_decorator(self):
        """@overload decorator for type checkers."""
        @overload
        def process(x):
            # type: (int) -> int
            pass

        @overload
        def process(x):
            # type: (str) -> str
            pass

        def process(x):
            # type: (Union[int, str]) -> Union[int, str]
            return x

        # Should work at runtime
        self.assertEqual(process(42), 42)
        self.assertEqual(process("hello"), "hello")

    def test_protocol_definition(self):
        """Protocol for structural typing."""
        @runtime_checkable
        class Readable(Protocol):
            def read(self):
                pass

        # Protocol classes can be created
        self.assertIsNotNone(Readable)

    def test_annotated_type(self):
        """Annotated for adding metadata to types."""
        Positive = Annotated[int, "must be positive"]

        # Can get the base type and metadata
        self.assertIs(get_origin(Positive), Annotated)
        args = get_args(Positive)
        self.assertEqual(args[0], int)
        self.assertEqual(args[1], "must be positive")

    def test_literal_type(self):
        """Literal for specific value types."""
        Direction = Literal["north", "south", "east", "west"]

        # Literal maintains the values
        args = get_args(Direction)
        self.assertIn("north", args)
        self.assertIn("south", args)

    def test_nested_types(self):
        """Nested generic types."""
        # Dict[str, List[int]]
        nested = Dict[str, List[int]]
        self.assertIs(get_origin(nested), dict)
        args = get_args(nested)
        self.assertEqual(args[0], str)
        self.assertIs(get_origin(args[1]), list)
        self.assertEqual(get_args(args[1]), (int,))

    def test_tuple_types(self):
        """Tuple type with multiple element types."""
        point_type = Tuple[int, int, str]
        self.assertIs(get_origin(point_type), tuple)
        self.assertEqual(get_args(point_type), (int, int, str))


class TestABCTypes(unittest.TestCase):
    """Test ABC-style typing constructs."""

    def test_iterable_subscript(self):
        x = Iterable[int]
        self.assertEqual(repr(x), "typing.Iterable[int]")

    def test_mapping_subscript(self):
        x = Mapping[str, int]
        self.assertEqual(repr(x), "typing.Mapping[str, int]")

    def test_sequence_subscript(self):
        x = Sequence[str]
        self.assertEqual(repr(x), "typing.Sequence[str]")


if __name__ == '__main__':
    unittest.main()
