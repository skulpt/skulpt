# Add lightweight typing module and PEP 604 Union Type syntax

## Summary

Implements a lightweight `typing` module for Skulpt, providing runtime support for type hints without the heavyweight CPython implementation (~880 lines vs CPython's 3800+).

Also implements **PEP 604 Union Type syntax** (`int | str`) for Python 3.10+ compatibility.

## Motivation

Many Python libraries use typing imports for type hints. Without a typing module, code like `from typing import List, Optional` fails in Skulpt. This implementation provides the common typing constructs needed for client-side Python code (e.g., Anvil).

## Approach

The implementation prioritizes:

1. **Import compatibility** - All common typing imports work
2. **Subscriptability** - `List[int]`, `Dict[str, int]`, `Optional[T]` etc. all work
3. **Runtime introspection** - `get_origin()` and `get_args()` work correctly
4. **Generic subclassing** - `class MyClass(Generic[T])` works
5. **No runtime type checking** - Types exist for hints, not enforcement (matches Python's behavior)

### Key implementation details

- `_SpecialForm` class for typing constructs (`Any`, `Union`, `Optional`, etc.)
- `_GenericAlias` class for subscripted types with `__origin__` and `__args__`
- Reuses `Sk.builtin.GenericAlias` for collection types (`List`, `Dict`, etc.)
- Implements PEP 560 `__mro_entries__` for generic base class support
- `Sk.builtin.UnionType` class for PEP 604 union syntax (`int | str`)

## Changes

### New files
- `src/lib/typing.js` - The typing module (~880 lines)
- `src/union_type.js` - PEP 604 UnionType implementation (~120 lines)
- `test/unit3/test_typing.py` - Unit tests (68 tests)
- `test/unit3/test_typing_functional.py` - Real-world usage tests (20 tests)
- `test/unit3/test_union_type.py` - Union type tests (23 tests)

### Modified files
- `src/constants.js` - Added `Sk.builtin.str.$mro_entries`
- `src/misceval.js` - Implemented `update_bases()` to process `__mro_entries__` (PEP 560)
- `src/type.js` - Added `nb$or`/`nb$ror` slots for `int | str` syntax
- `src/nonetype.js` - Added `nb$or` slot for `None | int` syntax
- `src/main.js` - Added union_type.js to the build
- `src/lib/types.py` - Added `UnionType` export
- `src/lib/typing.js` - Updated `get_origin()`/`get_args()` to handle `UnionType`

## Supported exports (45 items)

### Special forms
`Any`, `Union`, `Optional`, `NoReturn`, `Never`, `Self`, `ClassVar`, `Final`, `Literal`, `Annotated`, `Concatenate`, `Unpack`

### Collection type aliases
`List`, `Dict`, `Set`, `Tuple`, `FrozenSet`, `Callable`, `Type`

### Generics
`TypeVar`, `Generic`, `Protocol`, `NamedTuple`, `TypedDict`, `ParamSpec`, `TypeVarTuple`, `ForwardRef`

### ABCs (marker classes)
`Iterable`, `Iterator`, `Sequence`, `MutableSequence`, `Mapping`, `MutableMapping`

### Functions/decorators
`cast`, `get_origin`, `get_args`, `overload`, `runtime_checkable`

## Usage examples

### PEP 604 Union Type syntax (Python 3.10+)

```python
# Union type syntax works
x: int | str = "hello"
y: int | None = None  # Equivalent to Optional[int]

# Works with any types
from typing import get_origin, get_args
from types import UnionType

u = int | str | bool
print(type(u))         # <class 'types.UnionType'>
print(get_origin(u))   # <class 'types.UnionType'>
print(get_args(u))     # (int, str, bool)

# Unions flatten automatically
u1 = int | str
u2 = u1 | bool         # Same as int | str | bool

# Duplicates are removed
u = int | int          # Returns int (not UnionType)
```

### typing module

```python
from typing import List, Dict, Optional, TypeVar, Generic

# Type aliases work
def process(items: List[int]) -> Dict[str, int]:
    return {str(x): x for x in items}

# Optional works
def maybe(x: Optional[int]) -> int:
    return x if x is not None else 0

# Generic subclassing works
T = TypeVar('T')
class Stack(Generic[T]):
    def __init__(self):
        self.items: List[T] = []
    def push(self, item: T):
        self.items.append(item)

# Runtime introspection works
from typing import get_origin, get_args
print(get_origin(List[int]))  # <class 'list'>
print(get_args(List[int]))    # (int,)

# NamedTuple works (function syntax)
from typing import NamedTuple
Point = NamedTuple('Point', [('x', int), ('y', int)])
p = Point(1, 2)

# TypedDict works (function syntax)
from typing import TypedDict
Movie = TypedDict('Movie', {'name': str, 'year': int})
m = Movie(name='Blade Runner', year=1982)
```

## Limitations

### Not supported

1. **Class-based NamedTuple/TypedDict syntax**
   ```python
   # This doesn't work:
   class Point(NamedTuple):
       x: int
       y: int

   # Use function syntax instead:
   Point = NamedTuple('Point', [('x', int), ('y', int)])
   ```

2. **Protocol structural isinstance checks**
   ```python
   @runtime_checkable
   class Readable(Protocol):
       def read(self): ...

   # isinstance() won't check for .read() method
   isinstance(obj, Readable)  # Doesn't verify structure
   ```

3. **ForwardRef evaluation** - Stores the string but has no `_evaluate()` method

4. **Not implemented**:
   - `@final` decorator
   - `TypeGuard`, `TypeIs` (type narrowing)
   - `IO`, `TextIO`, `BinaryIO`
   - `@dataclass_transform`
   - `reveal_type()`, `assert_type()`
   - `Required`, `NotRequired` (TypedDict modifiers)
   - `get_type_hints()`

## Testing

- 68 typing module unit tests covering all exports and edge cases
- 20 functional tests covering real-world usage patterns
- 23 union type tests covering PEP 604 syntax
- All tests pass on both CPython 3.13 and Skulpt
- Full Skulpt test suite passes (2978 tests)
