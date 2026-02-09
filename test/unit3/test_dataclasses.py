import unittest
import dataclasses
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
        self.assertIn("default_factory=MISSING", out)
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

    def test_field_named_self(self):
        @dataclass
        class C:
            self: str

        c = C("foo")
        self.assertEqual(c.self, "foo")

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

    def test_replace(self):
        @dataclass
        class C:
            x: int
            y: int = 0

        o = C(1, 2)
        o2 = replace(o, x=9)
        self.assertEqual((o2.x, o2.y), (9, 2))

    def test_replace_with_init_false_rejected(self):
        @dataclass
        class C:
            x: int
            y: int = field(default=0, init=False)

        o = C(1)
        with self.assertRaisesRegex(ValueError, "field y is declared with init=False"):
            replace(o, y=10)

    def test_make_dataclass(self):
        C = make_dataclass("C", [("x", int), ("y", int, 7)])
        o = C(1)
        self.assertEqual((o.x, o.y), (1, 7))

    def test_order(self):
        @dataclass(order=True)
        class C:
            x: int
            y: int

        self.assertTrue(C(1, 2) < C(2, 0))
        self.assertTrue(C(1, 2) <= C(1, 2))
        self.assertTrue(C(3, 0) > C(2, 9))
        self.assertTrue(C(3, 0) >= C(3, 0))

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

    def test_guard_initvar(self):
        with self.assertRaisesRegex(NotImplementedError, "InitVar"):
            @dataclass
            class C:
                x: InitVar(int)

    def test_classvar_ignored(self):
        @dataclass
        class C:
            x: "ClassVar[int]" = 1
            y: int

        o = C(5)
        self.assertEqual(o.y, 5)
        self.assertEqual(C.x, 1)
        self.assertEqual([f.name for f in fields(C)], ["y"])

    def test_guard_kw_only_sentinel(self):
        with self.assertRaisesRegex(NotImplementedError, "KW_ONLY"):
            @dataclass
            class C:
                _: KW_ONLY
                x: int

    # Intentionally omitted/skipped for minimal implementation:
    # - full InitVar/KW_ONLY semantics (guarded with explicit errors)
    # - slots / weakref_slot implementation (guarded with explicit errors)
    # - recursive protection / deepcopy semantics in asdict/astuple
    # - metadata mappingproxy details
    # - full error text parity with CPython


if __name__ == "__main__":
    unittest.main()
