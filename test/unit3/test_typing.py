"""Skulpt typing regressions; CPython-derived cases are identified below."""
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
        # CPython AnyTests.test_cannot_subscript.
        with self.assertRaises(TypeError):
            Any[int]

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
        # Skulpt deliberately does not implement structural runtime checks.
        class Readable(Protocol):
            def read(self):
                pass
        with self.assertRaises(NotImplementedError):
            runtime_checkable(Readable)


class TestNamedTuple(unittest.TestCase):
    """Test NamedTuple."""

    def test_namedtuple_errors(self):
        # From CPython NamedTupleTests.test_namedtuple_errors.
        with self.assertRaisesRegex(ValueError, "Field names cannot start with an underscore"):
            NamedTuple("Emp", [("_name", str)])

    def test_empty_namedtuple(self):
        # Supported forms from CPython NamedTupleTests.test_empty_namedtuple.
        NT = NamedTuple("NT", [])
        class CNT(NamedTuple):
            pass
        for struct in (NT, CNT):
            self.assertEqual(struct._fields, ())
            self.assertEqual(struct._field_defaults, {})
            self.assertEqual(struct.__annotations__, {})
            self.assertIsInstance(struct(), struct)

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


class TestCPythonTypingRegressions(unittest.TestCase):
    """Selected public contracts from CPython's test_typing suite."""

    def test_generic_alias_construction(self):
        # CPython GenericTests: instantiation and __orig_class__ contracts.
        T = TypeVar("T")
        class Box(Generic[T]):
            pass
        self.assertEqual(Box[int]().__orig_class__, Box[int])
        for alias in (List[int], Dict[str, int], Tuple[int], Set[int], FrozenSet[int], Type[int]):
            with self.assertRaises(TypeError):
                alias()

    def test_forward_reference_arguments(self):
        # CPython TypeVarTests.test_or and ForwardRefTests equality/hash cases.
        T = TypeVar("T")
        ref = ForwardRef("Node")
        self.assertEqual(ref, ForwardRef("Node"))
        self.assertEqual(hash(ref), hash(ForwardRef("Node")))
        self.assertEqual(get_args(List["Node"]), (ref,))
        self.assertEqual(get_args(Optional["Node"]), (ref, type(None)))
        self.assertEqual(get_args(T | "Node"), (T, ref))
        self.assertEqual(get_args("Node" | T), (ref, T))
        self.assertEqual(get_args(List[None]), (type(None),))
        # Literal values and Annotated metadata are values, not forward refs.
        self.assertEqual(get_args(Literal["Node"]), ("Node",))
        self.assertEqual(get_args(Annotated[int, "Node"]), (int, "Node"))

    def test_generic_declaration_order(self):
        # CPython GenericTests.test_generic_errors and _generic_init_subclass's
        # explicit Generic[...] parameter ordering rule.
        T = TypeVar("T")
        S = TypeVar("S")
        class Parent(Generic[T]):
            pass
        class Child(Parent[T], Generic[S, T]):
            pass
        self.assertEqual(Child.__parameters__, (S, T))
        with self.assertRaises(TypeError):
            class Missing(Parent[T], Generic[S]):
                pass
        with self.assertRaises(TypeError):
            class Plain(Generic):
                pass
        with self.assertRaises(TypeError):
            Generic[T][S]

    def test_namedtuple_multiple_inheritance(self):
        # CPython NamedTupleTests.test_multiple_inheritance, invalid bases.
        class A:
            pass
        with self.assertRaises(TypeError):
            class X(NamedTuple, A):
                x: int
        with self.assertRaises(TypeError):
            class X(NamedTuple, tuple):
                x: int
        with self.assertRaises(TypeError):
            class X(NamedTuple, NamedTuple):
                x: int

    def test_literal_equality_and_hash(self):
        # CPython LiteralTests.test_equal/test_hash/test_args/test_flatten.
        self.assertNotEqual(Literal[True], Literal[1])
        self.assertEqual(Literal[1, 2], Literal[2, 1])
        self.assertEqual(hash(Literal[1, 2]), hash(Literal[2, 1]))
        self.assertEqual(Literal[1, 2, 3], Literal[1, 2, 3, 3])
        self.assertEqual(get_args(Literal[1, Literal[2], 2]), (1, 2))
        self.assertEqual(get_args(Union[Literal[True], Literal[1]]), (Literal[True], Literal[1]))

    def test_annotated_flatten(self):
        # CPython AnnotatedTests.test_flatten and _AnnotatedAlias metadata rules.
        T = TypeVar("T")
        annotation = Annotated[Annotated[T, "a"], "b"]
        self.assertEqual(annotation, Annotated[T, "a", "b"])
        self.assertEqual(get_args(annotation), (T, "a", "b"))
        self.assertEqual(annotation.__metadata__, ("a", "b"))
        self.assertIs(annotation.__origin__, T)
        self.assertEqual(annotation.__args__, (T,))
        self.assertEqual(annotation[int], Annotated[int, "a", "b"])
        metadata = Annotated[int, T]
        self.assertEqual(metadata.__parameters__, ())
        with self.assertRaises(TypeError):
            metadata[str]

    def test_typevar_errors(self):
        # CPython TypeVarTests: constrained/bound and variance errors.
        with self.assertRaises(TypeError):
            TypeVar(42)
        with self.assertRaises(TypeError):
            TypeVar("T", int)
        with self.assertRaises(TypeError):
            TypeVar("T", int, str, bound=int)
        with self.assertRaises(ValueError):
            TypeVar("T", covariant=True, contravariant=True)
        with self.assertRaises(TypeError):
            TypeVar("T", invalid=True)
        # CPython TypeVarTests.test_repr.
        self.assertEqual(repr(TypeVar("T_co", covariant=True)), "+T_co")
        self.assertEqual(repr(TypeVar("T_contra", contravariant=True)), "-T_contra")

    def test_unordered(self):
        # UnionTests.test_unordered, including its corresponding hash contract.
        u1 = Union[int, float]
        u2 = Union[float, int]
        self.assertEqual(u1, u2)
        self.assertEqual(hash(u1), hash(u2))
        self.assertEqual(u1, int | float)
        self.assertEqual(hash(u1), hash(int | float))

    def test_callable_eq_hash(self):
        # Selected from CPython BaseCallableTests.test_eq_hash.
        a = Callable[[int, str], float]
        b = Callable[[int, str], float]
        self.assertEqual(a, b)
        self.assertEqual(hash(a), hash(b))
        self.assertNotEqual(a, Callable[[str, int], float])

    def test_callable_var_substitution(self):
        # CPython BaseCallableTests.test_var_substitution, using local TypeVars.
        T = TypeVar("T")
        KT = TypeVar("KT")
        VT = TypeVar("VT")
        C1 = Callable[[int, T], T]
        C2 = Callable[[KT, T], VT]
        C3 = Callable[..., T]
        self.assertEqual(C1[str], Callable[[int, str], str])
        self.assertEqual(C1[None], Callable[[int, type(None)], type(None)])
        self.assertEqual(C2[int, float, str], Callable[[int, float], str])
        self.assertEqual(C3[int], Callable[..., int])
        self.assertEqual(C3[NoReturn], Callable[..., NoReturn])

        C4 = C2[int, VT, str]
        self.assertEqual(repr(C4), "typing.Callable[[int, ~VT], str]")
        self.assertEqual(repr(C4[dict]), "typing.Callable[[int, dict], str]")
        self.assertEqual(C4[dict], Callable[[int, dict], str])

        C5 = Callable[[List[T], tuple[KT, T], VT], int]
        self.assertEqual(C5[int, str, float], Callable[[List[int], tuple[str, int], float], int])
        # CPython GenericTests.test_extended_generic_rules_eq: nested return type.
        self.assertEqual(Callable[..., List[T]][int], Callable[..., List[int]])

    def test_typeddict_basics_functional_syntax(self):
        # Selected from CPython TypedDictTests.test_basics_functional_syntax.
        from typing import is_typeddict
        Emp = TypedDict("Emp", {"name": str, "id": int})
        jim = Emp(name="Jim", id=1)
        self.assertIs(type(jim), dict)
        self.assertEqual(jim, {"name": "Jim", "id": 1})
        self.assertEqual(Emp.__module__, __name__)
        self.assertEqual(Emp.__annotations__, {"name": str, "id": int})
        self.assertIs(Emp.__total__, True)
        self.assertEqual(Emp.__required_keys__, frozenset({"name", "id"}))
        self.assertEqual(Emp.__optional_keys__, frozenset())
        self.assertTrue(is_typeddict(Emp))
        with self.assertRaises(TypeError):
            isinstance({}, Emp)

    def test_typeddict_keys_inheritance(self):
        # Selected from CPython TypedDictTests.test_keys_inheritance.
        class Parent(TypedDict):
            x: int
        class Child(Parent):
            y: str
        self.assertEqual(Child.__annotations__, {"x": int, "y": str})
        self.assertEqual(Child.__required_keys__, frozenset({"x", "y"}))
        self.assertEqual(Child.__optional_keys__, frozenset())
        self.assertIs(type(Child(x=1, y="a")), dict)

    def test_typeddict_total(self):
        # CPython TypedDictTests.test_total/test_total_inherits_non_total.
        D = TypedDict("D", {"x": int}, total=False)
        self.assertIs(D.__total__, False)
        self.assertEqual(D.__required_keys__, frozenset())
        self.assertEqual(D.__optional_keys__, frozenset({"x"}))
        class Parent(TypedDict, total=False):
            x: int
        class Child(Parent):
            y: str
        self.assertIs(Parent.__total__, False)
        self.assertIs(Child.__total__, True)
        self.assertEqual(Child.__required_keys__, frozenset({"y"}))
        self.assertEqual(Child.__optional_keys__, frozenset({"x"}))

    def test_typeddict_required_notrequired(self):
        # CPython TypedDictTests.test_required/test_notrequired.
        from typing import Required, NotRequired
        class Movie(TypedDict):
            title: str
            year: NotRequired[int]
        class PartialMovie(TypedDict, total=False):
            title: Required[str]
            year: int
        for schema in (Movie, PartialMovie):
            self.assertEqual(schema.__required_keys__, frozenset({"title"}))
            self.assertEqual(schema.__optional_keys__, frozenset({"year"}))

    def test_generic_argument_substitution(self):
        # GenericTests.test_extended_generic_rules_eq and
        # GetUtilitiesTestCase.test_get_args, selected common substitutions.
        T = TypeVar("T")
        class Box(Generic[T]):
            pass
        self.assertIs(get_origin(Box[T][str]), Box)
        self.assertEqual(get_args(Box[T][str]), (str,))
        self.assertEqual(get_args(Union[T, int][str]), (str, int))
        self.assertEqual(List[T][int], List[int])
        with self.assertRaises(TypeError):
            Box[int, str]
        with self.assertRaises(TypeError):
            Box[int][str]



    def test_unsubscripted_get_origin(self):
        # CPython GetUtilitiesTestCase.test_get_origin.
        self.assertIs(get_origin(List), list)
        self.assertIs(get_origin(Dict), dict)
        self.assertIs(get_origin(Generic), Generic)

    def test_union_runtime_checks(self):
        # CPython test_types runtime checks and typing.UnionTests base rejection.
        for annotation in (Union[int, str], int | str):
            self.assertIsInstance(1, annotation)
            self.assertIsInstance("a", annotation)
            self.assertNotIsInstance(None, annotation)
            self.assertTrue(issubclass(bool, annotation))
        with self.assertRaises(TypeError):
            class C(Union[int, str]):
                pass


class TestSkulptUnsupportedTyping(unittest.TestCase):
    """Explicit boundaries of Skulpt's annotation-focused subset."""

    def test_namedtuple_invalid_inputs(self):
        # Skulpt boundary regression: never discard malformed fields/options.
        with self.assertRaises(ValueError):
            NamedTuple("Bad", [("x", int, 0)])
        with self.assertRaises(ValueError):
            NamedTuple("Bad", [("x",)])
        with self.assertRaises(TypeError):
            NamedTuple("Bad", [42])
        with self.assertRaises(TypeError):
            NamedTuple("Bad", [("x", int)], unexpected=True)
        with self.assertRaises(TypeError):
            class Bad(NamedTuple, unexpected=True):
                x: int

    def test_type_hints_evaluation(self):
        from typing import get_type_hints
        def f(value: "MissingType"):
            pass
        with self.assertRaises(NotImplementedError):
            get_type_hints(f, {}, {})
        with self.assertRaises(NotImplementedError):
            get_type_hints(f, include_extras=True)

    def test_unsupported_parameter_options(self):
        with self.assertRaises(NotImplementedError):
            TypeVar("T", infer_variance=True)
        for parameter in (ParamSpec, TypeVarTuple):
            with self.assertRaises(NotImplementedError):
                parameter("P", default=int)
            with self.assertRaises(TypeError):
                parameter(42)
        with self.assertRaises(NotImplementedError):
            ForwardRef("T", module="other")
        with self.assertRaises(TypeError):
            ForwardRef(42)


class TestSkulptTypingIntegration(unittest.TestCase):
    """Application patterns spanning the supported typing constructs."""

    def test_nested_schema_with_forward_references(self):
        # Anvil-style schemas combine NewType IDs, nested lists and optional links.
        from typing import NewType, NotRequired

        UserId = NewType("UserId", str)

        class User(TypedDict):
            id: UserId
            name: str
            manager: NotRequired[Optional["User"]]

        class UserPage(TypedDict):
            users: List[User]
            next_cursor: NotRequired[str]

        user = User(id=UserId("u1"), name="Ada")
        page = UserPage(users=[user])
        self.assertIs(type(user), dict)
        self.assertIs(type(page), dict)
        self.assertEqual(page, {"users": [{"id": "u1", "name": "Ada"}]})
        self.assertEqual(User.__required_keys__, frozenset({"id", "name"}))
        self.assertEqual(User.__optional_keys__, frozenset({"manager"}))
        self.assertEqual(UserPage.__optional_keys__, frozenset({"next_cursor"}))
        self.assertEqual(get_args(UserPage.__annotations__["users"]), (User,))
        manager_type = get_args(User.__annotations__["manager"])[0]
        self.assertEqual(get_args(manager_type), (ForwardRef("User"), type(None)))

    def test_specialized_base_preserves_inheritance(self):
        T = TypeVar('T')
        class Base(Generic[T]):
            def value(self):
                return 42
        class Child(Base[int]):
            pass
        self.assertTrue(issubclass(Child, Base))
        self.assertEqual(Child().value(), 42)

    def test_namedtuple_preserves_class_body(self):
        class Point(NamedTuple):
            """A point with a computed total."""
            x: int
            y: int = 0
            label = 'point'

            def total(self):
                return self.x + self.y

            @property
            def doubled(self):
                return self.total() * 2

        point = Point(3)
        self.assertEqual(point.total(), 3)
        self.assertEqual(point.doubled, 6)
        self.assertEqual(point.label, 'point')
        self.assertEqual(Point.__doc__, 'A point with a computed total.')
        self.assertEqual(Point._field_defaults, {'y': 0})

    def test_namedtuple_rejects_nontrailing_defaults(self):
        with self.assertRaises(TypeError):
            class Point(NamedTuple):
                x: int = 1
                y: int

    def test_mixed_union_annotations(self):
        T = TypeVar('T')
        cases = [
            (List[int] | None, (List[int], type(None))),
            (None | List[int], (type(None), List[int])),
            (list[int] | str, (list[int], str)),
            (str | list[int], (str, list[int])),
            (Union[int, str] | None, (int, str, type(None))),
            (None | Union[int, str], (type(None), int, str)),
            ((int | str) | List[int], (int, str, List[int])),
            (Optional[int] | str, (int, type(None), str)),
            (T | None, (T, type(None))),
            (int | None, (int, type(None))),
        ]
        for annotation, args in cases:
            self.assertEqual(get_args(annotation), args)
        self.assertEqual(list[int] | str, str | list[int])
        self.assertEqual(hash(list[int] | str), hash(str | list[int]))
        self.assertEqual(get_args(list[int] | str | list[int]), (list[int], str))
        self.assertEqual(get_args(Union[int, str] | int), (int, str))
        with self.assertRaises(TypeError):
            list[int] | 3
        with self.assertRaises(TypeError):
            3 | list[int]

    def test_evaluated_function_annotations(self):
        def process(items: List[int]) -> Optional[int]:
            return items[0] if items else None
        self.assertEqual(process.__annotations__, {"items": List[int], "return": Optional[int]})

    def test_newtype_identity(self):
        from typing import NewType
        UserId = NewType("UserId", int)
        value = object()
        self.assertIs(UserId(value), value)
        self.assertIsNot(UserId, int)


if __name__ == '__main__':
    unittest.main()
