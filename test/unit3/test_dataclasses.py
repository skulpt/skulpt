import unittest
import dataclasses
from collections import namedtuple
from dataclasses import (
    dataclass,
    field,
    fields,
    asdict,
    astuple,
    make_dataclass,
    replace,
    is_dataclass,
    FrozenInstanceError,
    InitVar,
    KW_ONLY,
)


class TestDataclasses(unittest.TestCase):
    # Selected behaviour from CPython's Lib/test/test_dataclasses.
    def test_class_var(self):
        # CPython TestCase.test_class_var; use the class's qualname in repr.
        from typing import ClassVar

        @dataclass
        class C:
            x: int
            y: int = 10
            z: ClassVar[int] = 1000
            w: ClassVar[int] = 2000
            t: ClassVar[int] = 3000
            s: ClassVar = 4000

        c = C(5)
        self.assertEqual(repr(c), C.__qualname__ + "(x=5, y=10)")
        self.assertEqual(len(fields(C)), 2)
        self.assertEqual(len(C.__annotations__), 6)
        self.assertEqual(c.z, 1000)
        self.assertEqual(c.w, 2000)
        self.assertEqual(c.t, 3000)
        self.assertEqual(c.s, 4000)
        C.z += 1
        self.assertEqual(c.z, 1001)
        c = C(20)
        self.assertEqual((c.x, c.y), (20, 10))
        self.assertEqual(c.z, 1001)
        self.assertEqual(c.w, 2000)
        self.assertEqual(c.t, 3000)
        self.assertEqual(c.s, 4000)

    def test_class_var_default_factory(self):
        # CPython TestCase.test_class_var_default_factory.
        from typing import ClassVar

        with self.assertRaisesRegex(TypeError, "cannot have a default factory"):
            @dataclass
            class C:
                x: ClassVar[int] = field(default_factory=int)

    def test_generic_dataclasses(self):
        # CPython TestCase.test_generic_dataclasses, plus specialised construction.
        from typing import Generic, List, TypeVar

        T = TypeVar("T")

        @dataclass
        class LabeledBox(Generic[T]):
            content: T
            label: str = "<unknown>"

        box = LabeledBox(42)
        self.assertEqual(box.content, 42)
        self.assertEqual(box.label, "<unknown>")
        Alias = List[LabeledBox[int]]
        self.assertIs(Alias.__args__[0].__origin__, LabeledBox)
        self.assertEqual(Alias.__args__[0].__args__, (int,))

        box = LabeledBox[int](43, "answer")
        self.assertEqual((box.content, box.label), (43, "answer"))
        self.assertEqual(box.__orig_class__, LabeledBox[int])

    def test_no_repr(self):
        @dataclass(repr=False)
        class C:
            x: int

        self.assertNotIn("__repr__", C.__dict__)
        self.assertEqual(C(3).x, 3)

        @dataclass
        class Custom:
            def __repr__(self):
                return "custom"

        self.assertEqual(repr(Custom()), "custom")

    def test_default_factory_with_no_init(self):
        calls = []

        def factory():
            calls.append(1)
            return []

        for frozen in (False, True):
            @dataclass(frozen=frozen)
            class C:
                x: list = field(default_factory=factory, init=False)

            first, second = C(), C()
            self.assertEqual(first.x, [])
            self.assertIsNot(first.x, second.x)
        self.assertEqual(len(calls), 4)

    def test_default_factory_not_called_if_value_given(self):
        calls = []

        def factory():
            calls.append(1)
            return []

        @dataclass
        class C:
            x: list = field(default_factory=factory)

        value = []
        self.assertIs(C(value).x, value)
        self.assertIs(C(x=value).x, value)
        with self.assertRaises(TypeError):
            C(value, x=value)
        with self.assertRaises(TypeError):
            C(unexpected=1)
        self.assertEqual(calls, [])
        self.assertIsNot(C().x, C().x)
        self.assertEqual(len(calls), 2)

    def test_no_fields(self):
        @dataclass
        class C:
            pass

        o = C()
        self.assertEqual(len(fields(C)), 0)
        self.assertEqual(len(fields(o)), 0)

    def test_no_fields_but_member_variable(self):
        @dataclass
        class C:
            i = 0

        o = C()
        self.assertEqual(len(fields(C)), 0)
        self.assertEqual(o.i, 0)

    def test_one_field_no_default(self):
        @dataclass
        class C:
            x: int

        o = C(42)
        self.assertEqual(o.x, 42)

    def test_named_init_params(self):
        @dataclass
        class C:
            x: int

        o = C(x=32)
        self.assertEqual(o.x, 32)

    def test_two_fields_one_default(self):
        @dataclass
        class C:
            x: int
            y: int = 0

        o = C(3)
        self.assertEqual((o.x, o.y), (3, 0))

    def test_non_default_follows_default(self):
        with self.assertRaisesRegex(TypeError, "non-default argument 'y' follows default argument 'x'"):
            @dataclass
            class C:
                x: int = 0
                y: int

        with self.assertRaisesRegex(TypeError, "non-default argument 'y' follows default argument 'x'"):
            @dataclass
            class B:
                x: int = 0

            @dataclass
            class C(B):
                y: int

    def test_field_default_default_factory_error(self):
        with self.assertRaisesRegex(ValueError, "cannot specify both default and default_factory"):
            @dataclass
            class C:
                x: int = field(default=1, default_factory=int)

    def test_dataclass_params_repr(self):
        @dataclass(frozen=True)
        class Some:
            pass

        expected = (
            "_DataclassParams(init=True,repr=True,eq=True,order=False,unsafe_hash=False,"
            "frozen=True,match_args=True,kw_only=False,slots=False,weakref_slot=False)"
        )
        self.assertEqual(repr(Some.__dataclass_params__), expected)

    def test_field_repr_contains_expected_parts(self):
        int_field = field(default=1, init=True, repr=False)
        int_field.name = "id"
        out = repr(int_field)
        self.assertIn("Field(name='id'", out)
        self.assertIn("default=1", out)
        self.assertIn("default_factory=" + repr(dataclasses.MISSING), out)
        self.assertIn("repr=False", out)

    def test_overwrite_hash(self):
        @dataclass(frozen=True)
        class C:
            x: int

            def __hash__(self):
                return 301

        self.assertEqual(hash(C(100)), 301)

        @dataclass(frozen=True)
        class D:
            x: int

            def __eq__(self, other):
                return False

        self.assertEqual(hash(D(100)), hash((100,)))

        with self.assertRaisesRegex(TypeError, "Cannot overwrite attribute __hash__"):
            @dataclass(unsafe_hash=True)
            class E:
                def __hash__(self):
                    pass

    def test_overwrite_fields_in_derived_class(self):
        @dataclass
        class Base:
            x: float = 15.0
            y: int = 0

        @dataclass
        class C1(Base):
            z: int = 10
            x: int = 15

        o = C1(x=5)
        self.assertEqual((o.x, o.y, o.z), (5, 0, 10))
        self.assertIn("x=5", repr(o))
        self.assertIn("y=0", repr(o))
        self.assertIn("z=10", repr(o))
        positional = C1(1, 2, 3)
        self.assertEqual((positional.x, positional.y, positional.z), (1, 2, 3))
        self.assertEqual(C1.__match_args__, ("x", "y", "z"))

    def test_inherited_default(self):
        class Base:
            x = 5

        @dataclass
        class C(Base):
            x: int

        self.assertEqual(C().x, 5)

    def test_init_var_inheritance(self):
        @dataclass
        class Base:
            x: int
            init_base: InitVar[int]

        @dataclass
        class C(Base):
            y: int
            init_derived: InitVar[int]

            def __post_init__(self, init_base, init_derived):
                self.x += init_base
                self.y += init_derived

        self.assertEqual(C(10, 11, 50, 51).__dict__, {"x": 21, "y": 101})

    def test_initvar_post_init_definition_order(self):
        @dataclass
        class C:
            first: InitVar[int] = field(kw_only=True)
            second: InitVar[int]

            def __post_init__(self, first, second):
                self.values = (first, second)

        self.assertEqual(C(2, first=1).values, (1, 2))

    def test_mutable_defaults_rejected(self):
        for default in ([], {}, set()):
            with self.assertRaises(ValueError):
                @dataclass
                class C:
                    x: object = default

    def test_frozen_inheritance(self):
        @dataclass(frozen=True)
        class Frozen:
            x: int

        with self.assertRaises(TypeError):
            @dataclass
            class MutableChild(Frozen):
                pass

        @dataclass
        class Mutable:
            x: int

        with self.assertRaises(TypeError):
            @dataclass(frozen=True)
            class FrozenChild(Mutable):
                pass

        class NormalChild(Frozen):
            pass

        child = NormalChild(1)
        child.extra = 2
        self.assertEqual(child.extra, 2)
        with self.assertRaises(FrozenInstanceError):
            child.x = 3

    def test_recursive_repr(self):
        @dataclass
        class Node:
            next: object = None

        node = Node()
        node.next = node
        self.assertIn("Node(next=...)", repr(node))

    def test_field_named_self(self):
        @dataclass
        class C:
            self: str

        c = C("foo")
        self.assertEqual(c.self, "foo")
        self.assertEqual(C(self="bar").self, "bar")

    def test_field_named_object(self):
        @dataclass
        class C:
            object: str

        c = C("foo")
        self.assertEqual(c.object, "foo")

    def test_frozen(self):
        @dataclass(frozen=True)
        class C:
            x: int

        c = C(10)
        self.assertEqual(c.x, 10)
        with self.assertRaises(FrozenInstanceError):
            c.x = 11

    def test_is_dataclass(self):
        @dataclass
        class C:
            x: int

        self.assertTrue(is_dataclass(C))
        self.assertTrue(is_dataclass(C(1)))
        self.assertFalse(is_dataclass(123))

    def test_fields(self):
        @dataclass
        class C:
            x: int
            y: int = 5

        f = fields(C)
        self.assertEqual([i.name for i in f], ["x", "y"])

    def test_asdict_astuple(self):
        @dataclass
        class Child:
            z: int

        @dataclass
        class Parent:
            x: int
            y: Child

        p = Parent(3, Child(7))
        self.assertEqual(asdict(p), {"x": 3, "y": {"z": 7}})
        self.assertEqual(astuple(p), (3, (7,)))

    def test_asdict_astuple_recursive_raises(self):
        @dataclass
        class Node:
            x: int
            nxt: object = None

        n = Node(1)
        n.nxt = n
        with self.assertRaises(RecursionError):
            asdict(n)
        with self.assertRaises(RecursionError):
            astuple(n)

    def test_asdict_astuple_copy_leaf_values(self):
        class Box:
            def __init__(self, values):
                self.values = values

        @dataclass
        class C:
            value: object

        box = Box([1])
        for converted in (asdict(C(box))["value"], astuple(C(box))[0]):
            self.assertIsNot(converted, box)
            self.assertEqual(converted.values, [1])
            self.assertIsNot(converted.values, box.values)

    def test_conversion_preserves_containers(self):
        Pair = namedtuple("Pair", "x y")

        @dataclass
        class C:
            pair: object
            ordinary: tuple

        value = C(Pair(1, 2), (3, 4))
        self.assertIsInstance(asdict(value)["pair"], Pair)
        self.assertIsInstance(astuple(value)[0], Pair)
        self.assertEqual(astuple(value, tuple_factory=list), [Pair(1, 2), (3, 4)])

    def test_metadata_readonly(self):
        metadata = {"label": "value"}
        info = field(metadata=metadata).metadata
        self.assertEqual(info["label"], "value")
        with self.assertRaises(TypeError):
            info["label"] = "changed"
        metadata["label"] = "updated"
        self.assertEqual(info["label"], "updated")

    def test_replace(self):
        @dataclass
        class C:
            x: int
            y: int = 0

        o = C(1, 2)
        o2 = replace(o, x=9)
        self.assertEqual((o2.x, o2.y), (9, 2))

    def test_replace_field_named_obj(self):
        @dataclass
        class C:
            obj: int

        self.assertEqual(replace(C(1), obj=2).obj, 2)

    def test_replace_requires_initvar(self):
        @dataclass
        class C:
            x: int
            y: InitVar[int]
            z: int = 0

            def __post_init__(self, y):
                self.z = y

        o = C(1, 2)
        with self.assertRaisesRegex(TypeError, "InitVar 'y' must be specified with replace\\(\\)"):
            replace(o, x=9)
        o2 = replace(o, x=9, y=7)
        self.assertEqual((o2.x, o2.z), (9, 7))

    def test_replace_initvar_with_default_not_required(self):
        @dataclass
        class C:
            x: int
            y: InitVar[int] = 4
            z: int = 0

            def __post_init__(self, y):
                self.z = y

        o = C(1, 6)
        o2 = replace(o, x=9)
        self.assertEqual((o2.x, o2.z), (9, 4))

    def test_replace_with_init_false_rejected(self):
        @dataclass
        class C:
            x: int
            y: int = field(default=0, init=False)

        o = C(1)
        with self.assertRaisesRegex(TypeError, "field y is declared with init=False"):
            replace(o, y=10)

    def test_make_dataclass(self):
        C = make_dataclass("C", fields=[("x", int), ("y", int, 7)])
        o = C(1)
        self.assertEqual((o.x, o.y), (1, 7))

    def test_make_dataclass_invalid_fields(self):
        for definitions in (["x", "x"], ["not-an-identifier"], ["class"], [(1, int)]):
            with self.assertRaises(TypeError):
                make_dataclass("C", definitions)

    def test_order(self):
        @dataclass(order=True)
        class C:
            x: int
            y: int

        self.assertTrue(C(1, 2) < C(2, 0))
        self.assertTrue(C(1, 2) <= C(1, 2))
        self.assertTrue(C(3, 0) > C(2, 9))
        self.assertTrue(C(3, 0) >= C(3, 0))

    # From CPython's TestEq in Lib/test/test_dataclasses.
    def test_recursive_eq(self):
        @dataclass
        class C:
            recursive: object = ...

        c = C()
        c.recursive = c
        self.assertEqual(c, c)

    def test_eq_field_by_field(self):
        @dataclass
        class Point:
            x: int
            y: int

        p1 = Point(1, 2)
        p2 = Point(1, 2)
        p3 = Point(2, 1)
        self.assertEqual(p1, p2)
        self.assertNotEqual(p1, p3)

    def test_eq_type_check(self):
        @dataclass
        class A:
            x: int

        @dataclass
        class B:
            x: int

        self.assertNotEqual(A(1), B(1))

    def test_eq_custom_field(self):
        class AlwaysEqual(int):
            def __eq__(self, other):
                return True

        @dataclass
        class Foo:
            x: AlwaysEqual
            y: int

        f1 = Foo(AlwaysEqual(1), 2)
        f2 = Foo(AlwaysEqual(2), 2)
        self.assertEqual(f1, f2)

    def test_eq_nan_field(self):
        @dataclass
        class D:
            x: float

        nan = float("nan")
        d1 = D(nan)
        d2 = D(nan)
        self.assertNotEqual(d1, d2)

    def test_order_requires_eq(self):
        with self.assertRaisesRegex(ValueError, "eq must be true if order is true"):
            @dataclass(order=True, eq=False)
            class C:
                x: int

    def test_match_args(self):
        @dataclass
        class C:
            x: int
            y: int = 0

        self.assertEqual(C.__match_args__, ("x", "y"))

    def test_match_args_preserved_or_disabled(self):
        @dataclass(match_args=False)
        class Disabled:
            x: int

        self.assertNotIn("__match_args__", Disabled.__dict__)

        @dataclass
        class Custom:
            x: int
            __match_args__ = ("custom",)

        self.assertEqual(Custom.__match_args__, ("custom",))

        @dataclass
        class WithInitVar:
            x: InitVar[int]

        self.assertEqual(WithInitVar.__match_args__, ("x",))

    def test_post_init_called(self):
        @dataclass
        class C:
            x: int
            y: int = 0

            def __post_init__(self):
                self.y = self.x + 1

        c = C(10)
        self.assertEqual((c.x, c.y), (10, 11))

    def test_kw_only_decorator(self):
        @dataclass(kw_only=True)
        class C:
            x: int
            y: int = 0

        c = C(x=10)
        self.assertEqual((c.x, c.y), (10, 0))
        with self.assertRaises(TypeError):
            C(10)
        self.assertEqual(C.__match_args__, ())

    def test_guard_slots(self):
        with self.assertRaisesRegex(NotImplementedError, "slots"):
            @dataclass(slots=True)
            class C:
                x: int

    def test_guard_weakref_slot(self):
        with self.assertRaisesRegex(NotImplementedError, "weakref_slot"):
            @dataclass(weakref_slot=True)
            class C:
                x: int

    def test_field_kw_only(self):
        @dataclass
        class C:
            x: int
            y: int = field(default=1, kw_only=True)

        c = C(7, y=9)
        self.assertEqual((c.x, c.y), (7, 9))
        with self.assertRaises(TypeError):
            C(7, 9)
        self.assertEqual(C.__match_args__, ("x",))

    def test_kw_only_does_not_trigger_default_order_error(self):
        @dataclass
        class C:
            x: int = 0
            y: int = field(kw_only=True)

        c = C(y=3)
        self.assertEqual((c.x, c.y), (0, 3))

    def test_initvar(self):
        @dataclass
        class C:
            x: int
            y: InitVar(int)
            z: int = 0

            def __post_init__(self, y):
                self.z = self.x + y

        c = C(2, 3)
        self.assertEqual((c.x, c.z), (2, 5))
        self.assertFalse(hasattr(c, "y"))

    def test_initvar_kw_only_and_default(self):
        @dataclass
        class C:
            x: int
            y: InitVar(int) = field(default=4, kw_only=True)
            z: int = 0

            def __post_init__(self, y):
                self.z = y

        c = C(2, y=7)
        self.assertEqual((c.x, c.z), (2, 7))
        c2 = C(2)
        self.assertEqual((c2.x, c2.z), (2, 4))

    def test_isnt_classvar_or_initvar(self):
        # An unbound ClassVar name, or a name merely containing
        # ClassVar/InitVar, is an ordinary field.
        for annotation in ("ClassVar[int]", "MyClassVarThing", "NotInitVar"):
            C = make_dataclass("C", [("x", annotation)])
            self.assertEqual([f.name for f in fields(C)], ["x"])
            self.assertEqual(C(5).x, 5)

    def test_string_initvar_and_kw_only(self):
        @dataclass
        class C:
            _: "dataclasses.KW_ONLY"
            value: "dataclasses.InitVar[int]"

            def __post_init__(self, value):
                self.result = value

        self.assertEqual(C(value=4).result, 4)
        self.assertEqual(fields(C), ())
        with self.assertRaises(TypeError):
            C(4)

    def test_kw_only_sentinel(self):
        @dataclass
        class C:
            x: int
            _: KW_ONLY
            y: int

        c = C(1, y=2)
        self.assertEqual((c.x, c.y), (1, 2))
        with self.assertRaises(TypeError):
            C(1, 2)
        self.assertEqual(C.__match_args__, ("x",))

    def test_kw_only_sentinel_once(self):
        with self.assertRaisesRegex(TypeError, "KW_ONLY.*already been specified"):
            @dataclass
            class C:
                _: KW_ONLY
                __: KW_ONLY
                x: int

    def test_guard_existing_slots(self):
        with self.assertRaisesRegex(NotImplementedError, "slots"):
            @dataclass
            class C:
                __slots__ = ("x",)
                x: int

    def test_guard_descriptor_defaults(self):
        class Descriptor:
            def __get__(self, instance, owner):
                return 7

        for default in (Descriptor(), field(default=Descriptor())):
            with self.assertRaisesRegex(NotImplementedError, "descriptor"):
                make_dataclass("C", [("x", int, default)])

    def test_function_default(self):
        def callback():
            return 7

        @dataclass
        class C:
            action: object = callback

        self.assertIs(C().action, callback)
        self.assertEqual(C().action(), 7)

    def test_guard_initvar_with_no_init(self):
        with self.assertRaisesRegex(NotImplementedError, "InitVar with init=False"):
            make_dataclass("C", [("x", InitVar[int], field(init=False))])


class TestSkulptDataclassRegressions(unittest.TestCase):
    """Bespoke regressions for the closure-based generated methods."""

    def test_reusing_field_preserves_generated_methods(self):
        shared = field(default=1)

        @dataclass(order=True, unsafe_hash=True)
        class First:
            x: int = shared

        first = First(x=2)

        @dataclass
        class Second:
            y: int = shared

        self.assertEqual(First(x=2).__dict__, {"x": 2})
        self.assertEqual(repr(first), First.__qualname__ + "(x=2)")
        self.assertEqual(first, First(2))
        self.assertLess(First(1), first)
        self.assertEqual(hash(first), hash((2,)))
        self.assertEqual(First().x, 1)
        self.assertIs(fields(First)[0], shared)
        self.assertEqual(Second(3).y, 3)


if __name__ == "__main__":
    unittest.main()
