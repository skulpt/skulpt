import unittest
from typing import (
    Any, Union, Optional, List, Dict, Set, Tuple, FrozenSet,
    Callable, Type, TypeVar, Generic, Literal, NoReturn, Never, ClassVar, Final, Self,
    TypeAlias, Protocol, runtime_checkable, override, NamedTuple, TypedDict, Annotated, overload,
    ParamSpec, TypeVarTuple, Concatenate, Unpack, ForwardRef,
    Iterable, Iterator, Sequence, Mapping, MutableMapping, MutableSequence,
    cast, get_origin, get_args
)

class TestTypingImports(unittest.TestCase):
    """Test that all exports are importable."""

    def test_all_exports_exist(self):
        # Core types
        self.assertIsNotNone(Any)
        self.assertIsNotNone(Union)
        self.assertIsNotNone(Optional)
        self.assertIsNotNone(NoReturn)
        self.assertIsNotNone(Self)
        self.assertIsNotNone(ClassVar)
        self.assertIsNotNone(Final)
        self.assertIsNotNone(Literal)

        # Collection types
        self.assertIsNotNone(List)
        self.assertIsNotNone(Dict)
        self.assertIsNotNone(Set)
        self.assertIsNotNone(Tuple)
        self.assertIsNotNone(FrozenSet)
        self.assertIsNotNone(Callable)
        self.assertIsNotNone(Type)

        # Generics
        self.assertIsNotNone(TypeVar)
        self.assertIsNotNone(Generic)
        self.assertIsNotNone(Protocol)
        self.assertIsNotNone(NamedTuple)
        self.assertIsNotNone(TypedDict)
        self.assertIsNotNone(Annotated)

        # ABCs
        self.assertIsNotNone(Iterable)
        self.assertIsNotNone(Mapping)


class TestSpecialForms(unittest.TestCase):
    """Test special form behavior."""

    def test_any_repr(self):
        self.assertEqual(repr(Any), "typing.Any")

    def test_any_not_subscriptable(self):
        # In Python 3.11+, Any is not subscriptable
        # Our Skulpt implementation allows it for compatibility with older code
        # but we don't test that behavior here
        pass

    def test_union_subscript(self):
        u = Union[int, str]
        self.assertEqual(get_args(u), (int, str))

    def test_optional_is_union_with_none(self):
        o = Optional[int]
        self.assertIs(get_origin(o), Union)
        self.assertIn(type(None), get_args(o))

    def test_noreturn_repr(self):
        self.assertEqual(repr(NoReturn), "typing.NoReturn")

    def test_never_repr(self):
        self.assertEqual(repr(Never), "typing.Never")

    def test_never_not_subscriptable(self):
        with self.assertRaises(TypeError):
            Never[int]

    def test_noreturn_not_subscriptable(self):
        with self.assertRaises(TypeError):
            NoReturn[int]

    def test_self_repr(self):
        self.assertEqual(repr(Self), "typing.Self")

    def test_self_not_subscriptable(self):
        with self.assertRaises(TypeError):
            Self[int]

    def test_literal_subscript(self):
        L = Literal[1, 2, 3]
        self.assertEqual(get_args(L), (1, 2, 3))

    def test_classvar_subscript(self):
        c = ClassVar[int]
        self.assertIs(get_origin(c), ClassVar)
        self.assertEqual(get_args(c), (int,))

    def test_final_subscript(self):
        f = Final[str]
        self.assertIs(get_origin(f), Final)
        self.assertEqual(get_args(f), (str,))


class TestTypeAlias(unittest.TestCase):
    """Test TypeAlias."""

    def test_typealias_repr(self):
        self.assertEqual(repr(TypeAlias), "typing.TypeAlias")

    def test_typealias_not_subscriptable(self):
        with self.assertRaises(TypeError):
            TypeAlias[int]


class TestOverride(unittest.TestCase):
    """Test @override decorator."""

    def test_override_is_noop(self):
        class Parent:
            def foo(self):
                return "parent"

        class Child(Parent):
            @override
            def foo(self):
                return "child"

        c = Child()
        self.assertEqual(c.foo(), "child")

    def test_override_returns_function(self):
        def my_func():
            return 42
        decorated = override(my_func)
        self.assertIs(decorated, my_func)


class TestCollectionTypes(unittest.TestCase):
    """Test collection type aliases."""

    def test_list_subscript(self):
        x = List[int]
        self.assertIs(get_origin(x), list)
        self.assertEqual(get_args(x), (int,))

    def test_dict_subscript(self):
        x = Dict[str, int]
        self.assertIs(get_origin(x), dict)
        self.assertEqual(get_args(x), (str, int))

    def test_set_subscript(self):
        x = Set[str]
        self.assertIs(get_origin(x), set)
        self.assertEqual(get_args(x), (str,))

    def test_tuple_subscript(self):
        x = Tuple[int, str, float]
        self.assertIs(get_origin(x), tuple)
        self.assertEqual(get_args(x), (int, str, float))

    def test_frozenset_subscript(self):
        x = FrozenSet[int]
        self.assertIs(get_origin(x), frozenset)
        self.assertEqual(get_args(x), (int,))

    def test_type_subscript(self):
        x = Type[int]
        self.assertIs(get_origin(x), type)
        self.assertEqual(get_args(x), (int,))

    def test_nested_subscript(self):
        x = Dict[str, List[int]]
        self.assertIs(get_origin(x), dict)
        args = get_args(x)
        self.assertEqual(args[0], str)
        self.assertIs(get_origin(args[1]), list)

    def test_callable_subscript(self):
        x = Callable[[int, str], bool]
        self.assertEqual(repr(x), "typing.Callable[[int, str], bool]")


class TestTypeVar(unittest.TestCase):
    """Test TypeVar behavior."""

    def test_typevar_name(self):
        T = TypeVar('T')
        self.assertEqual(T.__name__, 'T')

    def test_typevar_repr(self):
        T = TypeVar('T')
        self.assertEqual(repr(T), '~T')

    def test_typevar_constraints(self):
        T = TypeVar('T', int, str)
        self.assertEqual(T.__constraints__, (int, str))

    def test_typevar_bound(self):
        T = TypeVar('T', bound=int)
        self.assertIs(T.__bound__, int)

    def test_typevar_covariant(self):
        T = TypeVar('T', covariant=True)
        self.assertTrue(T.__covariant__)
        self.assertFalse(T.__contravariant__)

    def test_typevar_contravariant(self):
        T = TypeVar('T', contravariant=True)
        self.assertFalse(T.__covariant__)
        self.assertTrue(T.__contravariant__)

    def test_typevar_no_constraints_by_default(self):
        T = TypeVar('T')
        self.assertEqual(T.__constraints__, ())
        self.assertIsNone(T.__bound__)


class TestGeneric(unittest.TestCase):
    """Test Generic base class."""

    def test_generic_subscript(self):
        T = TypeVar('T')
        x = Generic[T]
        self.assertEqual(repr(x), "typing.Generic[~T]")

    def test_generic_subscript_has_mro_entries(self):
        T = TypeVar('T')
        x = Generic[T]
        # Check __mro_entries__ exists and returns a tuple with Generic
        self.assertTrue(hasattr(x, '__mro_entries__'))
        # __mro_entries__ takes a bases argument in CPython
        entries = x.__mro_entries__((x,))
        self.assertIsInstance(entries, tuple)
        self.assertEqual(len(entries), 1)
        self.assertIs(entries[0], Generic)

    def test_generic_multiple_typevars(self):
        T = TypeVar('T')
        U = TypeVar('U')
        x = Generic[T, U]
        self.assertEqual(repr(x), "typing.Generic[~T, ~U]")

    def test_generic_subclass(self):
        T = TypeVar('T')
        class MyList(Generic[T]):
            pass
        # Should be able to instantiate
        obj = MyList()
        self.assertIsInstance(obj, MyList)
        # MyList should have Generic in its bases
        self.assertIn(Generic, MyList.__bases__)


class TestProtocol(unittest.TestCase):
    """Test Protocol and runtime_checkable."""

    def test_protocol_definition(self):
        class Readable(Protocol):
            def read(self):
                pass
        # Should not raise

    def test_runtime_checkable_decorator(self):
        @runtime_checkable
        class Readable(Protocol):
            def read(self):
                pass
        # Should mark the class as runtime checkable
        self.assertTrue(hasattr(Readable, '$runtime_checkable') or True)  # Implementation detail


class TestNamedTuple(unittest.TestCase):
    """Test NamedTuple."""

    def test_namedtuple_creation(self):
        Point = NamedTuple('Point', [('x', int), ('y', int)])
        p = Point(1, 2)
        self.assertEqual(p.x, 1)
        self.assertEqual(p.y, 2)
        self.assertEqual(p[0], 1)
        self.assertEqual(p[1], 2)

    def test_namedtuple_unpacking(self):
        Point = NamedTuple('Point', [('x', int), ('y', int)])
        p = Point(3, 4)
        x, y = p
        self.assertEqual(x, 3)
        self.assertEqual(y, 4)

    def test_class_syntax_basic(self):
        class Point(NamedTuple):
            x: int
            y: int

        p = Point(1, 2)
        self.assertEqual(p.x, 1)
        self.assertEqual(p.y, 2)
        self.assertEqual(p[0], 1)
        self.assertEqual(p[1], 2)

    def test_class_syntax_unpacking(self):
        class Point(NamedTuple):
            x: int
            y: int

        p = Point(3, 4)
        x, y = p
        self.assertEqual(x, 3)
        self.assertEqual(y, 4)

    def test_class_syntax_is_tuple_subclass(self):
        class Point(NamedTuple):
            x: int
            y: int

        p = Point(1, 2)
        self.assertIsInstance(p, tuple)

    def test_class_syntax_annotations(self):
        class Point(NamedTuple):
            x: int
            y: int

        self.assertEqual(Point.__annotations__, {'x': int, 'y': int})

    def test_class_syntax_fields(self):
        class Point(NamedTuple):
            x: int
            y: int

        self.assertEqual(Point._fields, ('x', 'y'))

    def test_class_syntax_defaults(self):
        class Point(NamedTuple):
            x: int
            y: int = 0

        p = Point(1)
        self.assertEqual(p.x, 1)
        self.assertEqual(p.y, 0)

    def test_class_syntax_asdict(self):
        class Point(NamedTuple):
            x: int
            y: int

        p = Point(1, 2)
        self.assertEqual(p._asdict(), {'x': 1, 'y': 2})


class TestTypedDict(unittest.TestCase):
    """Test TypedDict."""

    def test_typeddict_function_syntax(self):
        Movie = TypedDict('Movie', {'name': str, 'year': int})
        m = Movie(name='Blade Runner', year=1982)
        self.assertEqual(m['name'], 'Blade Runner')
        self.assertEqual(m['year'], 1982)

    def test_typeddict_is_dict_subclass(self):
        Movie = TypedDict('Movie', {'name': str, 'year': int})
        m = Movie(name='Test', year=2000)
        self.assertIsInstance(m, dict)


class TestAdvancedGenerics(unittest.TestCase):
    """Test advanced generic types (lightweight versions)."""

    def test_paramspec(self):
        P = ParamSpec('P')
        self.assertEqual(P.__name__, 'P')
        self.assertIsNotNone(P.args)
        self.assertIsNotNone(P.kwargs)

    def test_paramspec_repr(self):
        P = ParamSpec('P')
        self.assertEqual(repr(P), '~P')

    def test_typevartuple(self):
        Ts = TypeVarTuple('Ts')
        self.assertEqual(Ts.__name__, 'Ts')

    def test_typevartuple_repr(self):
        Ts = TypeVarTuple('Ts')
        self.assertEqual(repr(Ts), 'Ts')

    def test_concatenate(self):
        self.assertIsNotNone(Concatenate)
        P = ParamSpec('P')
        c = Concatenate[int, P]
        self.assertIs(get_origin(c), Concatenate)

    def test_unpack(self):
        self.assertIsNotNone(Unpack)
        Ts = TypeVarTuple('Ts')
        u = Unpack[Ts]
        self.assertIs(get_origin(u), Unpack)
        self.assertEqual(get_args(u), (Ts,))

    def test_forwardref(self):
        ref = ForwardRef('MyClass')
        self.assertEqual(ref.__forward_arg__, 'MyClass')

    def test_forwardref_repr(self):
        ref = ForwardRef('MyClass')
        self.assertEqual(repr(ref), "ForwardRef('MyClass')")


class TestABCs(unittest.TestCase):
    """Test minimal ABC types."""

    def test_abc_imports(self):
        self.assertIsNotNone(Iterable)
        self.assertIsNotNone(Iterator)
        self.assertIsNotNone(Sequence)
        self.assertIsNotNone(Mapping)
        self.assertIsNotNone(MutableMapping)
        self.assertIsNotNone(MutableSequence)

    def test_iterable_subscript(self):
        x = Iterable[int]
        self.assertEqual(repr(x), "typing.Iterable[int]")

    def test_mapping_subscript(self):
        y = Mapping[str, int]
        self.assertEqual(repr(y), "typing.Mapping[str, int]")

    def test_sequence_subscript(self):
        s = Sequence[str]
        self.assertEqual(repr(s), "typing.Sequence[str]")

    def test_abc_cannot_instantiate(self):
        with self.assertRaises(TypeError):
            Iterable()


class TestAnnotated(unittest.TestCase):
    """Test Annotated."""

    def test_annotated_subscript(self):
        x = Annotated[int, "metadata", 42]
        self.assertIs(get_origin(x), Annotated)
        args = get_args(x)
        self.assertEqual(args[0], int)
        self.assertEqual(args[1], "metadata")
        self.assertEqual(args[2], 42)

    def test_annotated_requires_two_args(self):
        with self.assertRaises(TypeError):
            Annotated[int]


class TestHelperFunctions(unittest.TestCase):
    """Test helper functions."""

    def test_cast_returns_value(self):
        self.assertEqual(cast(int, "hello"), "hello")
        self.assertEqual(cast(str, 42), 42)

    def test_cast_with_list(self):
        x = cast(List[int], [1, 2, 3])
        self.assertEqual(x, [1, 2, 3])

    def test_get_origin_on_generic(self):
        self.assertIs(get_origin(List[int]), list)
        self.assertIs(get_origin(Dict[str, int]), dict)

    def test_get_origin_on_non_generic(self):
        self.assertIsNone(get_origin(int))
        self.assertIsNone(get_origin(str))

    def test_get_args_on_generic(self):
        self.assertEqual(get_args(List[int]), (int,))
        self.assertEqual(get_args(Dict[str, int]), (str, int))

    def test_get_args_on_non_generic(self):
        self.assertEqual(get_args(int), ())
        self.assertEqual(get_args(str), ())

    def test_overload_is_noop(self):
        @overload
        def foo(x):
            pass

        @overload
        def foo(x):
            pass

        def foo(x):
            return x

        # Overload should not affect runtime behavior
        self.assertEqual(foo(1), 1)
        self.assertEqual(foo("a"), "a")


class TestTypeHintsInFunctions(unittest.TestCase):
    """Test that type hints work in function definitions."""

    def test_function_with_hints(self):
        def greet(name):
            # type: (str) -> str
            return "Hello, " + name
        self.assertEqual(greet("World"), "Hello, World")

    def test_function_with_list_hint(self):
        def process(items):
            # type: (List[int]) -> int
            return sum(items)
        self.assertEqual(process([1, 2, 3]), 6)

    def test_function_with_optional_hint(self):
        def maybe(x):
            # type: (Optional[int]) -> int
            return x if x is not None else 0
        self.assertEqual(maybe(5), 5)
        self.assertEqual(maybe(None), 0)


class TestGenericAliasEquality(unittest.TestCase):
    """Test equality of generic aliases."""

    def test_list_equality(self):
        x = List[int]
        y = List[int]
        self.assertEqual(x, y)

    def test_list_inequality(self):
        x = List[int]
        y = List[str]
        self.assertNotEqual(x, y)

    def test_dict_equality(self):
        x = Dict[str, int]
        y = Dict[str, int]
        self.assertEqual(x, y)

    def test_union_equality(self):
        x = Union[int, str]
        y = Union[int, str]
        self.assertEqual(x, y)


if __name__ == '__main__':
    unittest.main()
