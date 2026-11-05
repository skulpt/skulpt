"""
Minimal dataclasses support for Skulpt.

Field collection follows CPython's ordered field model. This subset uses Python
closures rather than per-class source generation. The constructor binds field
arguments itself; field-specific signatures and annotations are outside this subset.
Slots, custom descriptor defaults and InitVar(init=False)
are unsupported. ClassVar recognition requires an externally supplied typing
module; unbound annotation strings remain ordinary fields, as in CPython.
"""

import copy
import keyword
import re
import sys
from collections import defaultdict
from types import FunctionType, MappingProxyType

__all__ = [
    "dataclass",
    "field",
    "Field",
    "FrozenInstanceError",
    "InitVar",
    "KW_ONLY",
    "MISSING",
    "fields",
    "asdict",
    "astuple",
    "make_dataclass",
    "replace",
    "is_dataclass",
]


class FrozenInstanceError(AttributeError):
    pass


class _MISSING_TYPE:
    def __repr__(self):
        return "MISSING"


MISSING = _MISSING_TYPE()


class _KW_ONLY_TYPE:
    def __repr__(self):
        return "KW_ONLY"


KW_ONLY = _KW_ONLY_TYPE()


class InitVar:
    def __init__(self, typ):
        self.type = typ

    def __repr__(self):
        return "dataclasses.InitVar[%r]" % (self.type,)

    def __class_getitem__(cls, typ):
        return cls(typ)


def _unsupported(feature):
    raise NotImplementedError(feature + " is not supported in skulpt.dataclasses")


_MODULE_IDENTIFIER_RE = re.compile(r"^(?:\s*(\w+)\s*\.)?\s*(\w+)")


def _annotation_type(annotation, cls):
    """Resolve only the leading type name, as CPython does for pseudo-fields."""
    match = _MODULE_IDENTIFIER_RE.match(annotation)
    module = sys.modules.get(cls.__module__)
    if match is None or module is None:
        return MISSING
    module_name, name = match.groups()
    if module_name:
        module = module.__dict__.get(module_name)
        if module is not sys.modules[__name__] and module is not sys.modules.get("typing"):
            return MISSING
    return getattr(module, name, MISSING)


def _is_classvar(typ):
    # typing is optional and not currently bundled with Skulpt. In particular,
    # an unbound string "ClassVar[int]" must remain an ordinary field.
    typing = sys.modules.get("typing")
    return typing is not None and (
        typ is typing.ClassVar or getattr(typ, "__origin__", None) is typing.ClassVar
    )


def _is_initvar(typ):
    if typ is InitVar:
        return True
    if isinstance(typ, InitVar):
        return True
    return False


class _DataclassParams:
    def __init__(
        self,
        init,
        repr_,
        eq,
        order,
        unsafe_hash,
        frozen,
        match_args,
        kw_only,
        slots,
        weakref_slot,
    ):
        self.init = init
        self.repr = repr_
        self.eq = eq
        self.order = order
        self.unsafe_hash = unsafe_hash
        self.frozen = frozen
        self.match_args = match_args
        self.kw_only = kw_only
        self.slots = slots
        self.weakref_slot = weakref_slot

    def __repr__(self):
        return (
            "_DataclassParams(init=%r,repr=%r,eq=%r,order=%r,unsafe_hash=%r,"
            "frozen=%r,match_args=%r,kw_only=%r,slots=%r,weakref_slot=%r)"
            % (
                self.init,
                self.repr,
                self.eq,
                self.order,
                self.unsafe_hash,
                self.frozen,
                self.match_args,
                self.kw_only,
                self.slots,
                self.weakref_slot,
            )
        )


class Field:
    def __init__(
        self,
        default=MISSING,
        default_factory=MISSING,
        init=True,
        repr=True,
        hash=None,
        compare=True,
        metadata=None,
        kw_only=MISSING,
        name=None,
        type=None,
    ):
        self.name = name
        self.type = type
        self.default = default
        self.default_factory = default_factory
        self.init = init
        self.repr = repr
        self.hash = hash
        self.compare = compare
        self.metadata = MappingProxyType({} if metadata is None else metadata)
        self.kw_only = kw_only
        self._field_type = None

    def __repr__(self):
        return (
            "Field(name=%r,type=%r,default=%r,default_factory=%r,init=%r,"
            "repr=%r,hash=%r,compare=%r,metadata=%r,kw_only=%r,_field_type=%r)"
            % (
                self.name,
                self.type,
                self.default,
                self.default_factory,
                self.init,
                self.repr,
                self.hash,
                self.compare,
                self.metadata,
                self.kw_only,
                self._field_type,
            )
        )


def field(
    *,
    default=MISSING,
    default_factory=MISSING,
    init=True,
    repr=True,
    hash=None,
    compare=True,
    metadata=None,
    kw_only=MISSING
):
    if default is not MISSING and default_factory is not MISSING:
        raise ValueError("cannot specify both default and default_factory")
    return Field(
        default=default,
        default_factory=default_factory,
        init=init,
        repr=repr,
        hash=hash,
        compare=compare,
        metadata=metadata,
        kw_only=kw_only,
    )


_FIELDS = "__dataclass_fields__"
_PARAMS = "__dataclass_params__"
_FIELD = "field"
_FIELD_CLASSVAR = "classvar"
_FIELD_INITVAR = "initvar"


def _is_dataclass_instance(obj):
    return hasattr(type(obj), _FIELDS)


def _has_default(f):
    return f.default is not MISSING or f.default_factory is not MISSING


def _value_from_default(default, default_factory, name, kwonly):
    if default is not MISSING:
        return default
    if default_factory is not MISSING:
        return default_factory()
    if kwonly:
        raise TypeError("missing required keyword-only argument: '%s'" % (name,))
    raise TypeError("missing required argument: '%s'" % (name,))


def _collect_inherited_fields(cls, frozen):
    all_fields = {}
    for base in reversed(cls.__mro__[1:]):
        base_fields = getattr(base, _FIELDS, None)
        if base_fields is not None:
            if getattr(base, _PARAMS).frozen != frozen:
                raise TypeError("cannot mix frozen and non-frozen dataclass inheritance")
            for name, f in base_fields.items():
                all_fields[name] = f
    return all_fields


def _process_own_fields(cls, all_fields, default_kw_only):
    annotations = cls.__dict__.get("__annotations__", {})
    class_dict = cls.__dict__
    seen_kw_only = False
    for name, typ in annotations.items():
        marker = _annotation_type(typ, cls) if isinstance(typ, str) else typ
        if marker is KW_ONLY:
            if seen_kw_only:
                raise TypeError("%r is KW_ONLY, but KW_ONLY has already been specified" % name)
            seen_kw_only = True
            default_kw_only = True
            continue
        if not _is_classvar(marker) and not _is_initvar(marker):
            # Inspect the stored attribute before getattr invokes a descriptor.
            for base in cls.__mro__:
                if name in base.__dict__:
                    raw_default = base.__dict__[name]
                    if isinstance(raw_default, Field):
                        raw_default = raw_default.default
                    if hasattr(type(raw_default), "__get__") and not isinstance(raw_default, FunctionType):
                        _unsupported("descriptor-typed fields")
                    break
        candidate = getattr(cls, name, MISSING)
        if isinstance(candidate, Field):
            f = candidate
            f.name = name
            f.type = typ
            if f.default is not MISSING:
                setattr(cls, name, f.default)
            elif name in class_dict:
                delattr(cls, name)
        else:
            f = Field(default=candidate, name=name, type=typ)
        f._field_type = _FIELD
        if _is_classvar(marker):
            f._field_type = _FIELD_CLASSVAR
        elif _is_initvar(marker):
            f._field_type = _FIELD_INITVAR

        if f._field_type != _FIELD and f.default_factory is not MISSING:
            raise TypeError("field %s cannot have a default factory" % name)
        if f._field_type == _FIELD_CLASSVAR:
            if f.kw_only is not MISSING:
                raise TypeError("field %s is a ClassVar but specifies kw_only" % name)
        elif f.kw_only is MISSING:
            f.kw_only = default_kw_only
        if f._field_type == _FIELD_INITVAR and not f.init:
            _unsupported("InitVar with init=False")
        if f._field_type == _FIELD and f.default is not MISSING:
            if type(f.default).__hash__ is None:
                raise ValueError("mutable default for field %s is not allowed: use default_factory" % name)
        all_fields[name] = f

    for name, value in class_dict.items():
        if isinstance(value, Field) and name not in annotations:
            raise TypeError("%r is a field but has no type annotation" % name)


def _build_init(initialization_fields, pos_fields, kwonly_fields, frozen, has_post_init):
    init_names = {f.name for f in pos_fields + kwonly_fields}

    def __init__(*args, **kwargs):
        # Accept a field named "self" as a keyword as well as positionally.
        self, args = args[0], args[1:]
        if len(args) > len(pos_fields):
            raise TypeError(
                "__init__() takes at most %d positional arguments (%d given)"
                % (len(pos_fields), len(args))
            )

        # Validate the whole call before assigning fields or invoking factories.
        for name in kwargs:
            if name not in init_names:
                raise TypeError("got unexpected keyword argument: %s" % name)
        values = {}
        for f, value in zip(pos_fields, args):
            if f.name in kwargs:
                raise TypeError("got multiple values for argument '%s'" % f.name)
            values[f.name] = value
        for f in pos_fields[len(args):] + kwonly_fields:
            if f.name in kwargs:
                values[f.name] = kwargs[f.name]
            elif not _has_default(f):
                _value_from_default(f.default, f.default_factory, f.name, f.kw_only)

        initvars = []
        # Assignment, factory calls and post-init arguments follow field order,
        # even when keyword-only parameters appear before positional ones.
        for f in initialization_fields:
            if f.init:
                value = values[f.name] if f.name in values else _value_from_default(
                    f.default, f.default_factory, f.name, f.kw_only
                )
            elif f.default_factory is not MISSING:
                value = f.default_factory()
            else:
                continue
            if f._field_type == _FIELD_INITVAR:
                initvars.append(value)
            elif frozen:
                object.__setattr__(self, f.name, value)
            else:
                setattr(self, f.name, value)

        if has_post_init:
            self.__post_init__(*initvars)

    return __init__


def _build_repr(repr_fields):
    running = set()

    def __repr__(self):
        oid = id(self)
        if oid in running:
            return "..."
        running.add(oid)
        try:
            body = ", ".join(
                "%s=%r" % (f.name, getattr(self, f.name)) for f in repr_fields
            )
            return "%s(%s)" % (self.__class__.__qualname__, body)
        finally:
            running.remove(oid)

    return __repr__


def _build_eq(eq_fields):
    def __eq__(self, other):
        if self is other:
            return True
        if other.__class__ is self.__class__:
            # Preserve the result of CPython's short-circuiting "and" expression.
            result = True
            for f in eq_fields:
                if not result:
                    return result
                result = getattr(self, f.name) == getattr(other, f.name)
            return result
        return NotImplemented

    return __eq__


def _build_order(name, op, order_fields):
    def fn(self, other):
        if other.__class__ is not self.__class__:
            return NotImplemented
        left = tuple(getattr(self, f.name) for f in order_fields)
        right = tuple(getattr(other, f.name) for f in order_fields)
        return op(left, right)

    fn.__name__ = name
    return fn


def _build_hash(hash_fields):
    def __hash__(self):
        return hash(tuple(getattr(self, f.name) for f in hash_fields))

    return __hash__


def _build_frozen(cls, real_fields):
    names = {f.name for f in real_fields}

    def __setattr__(self, name, value):
        if type(self) is cls or name in names:
            raise FrozenInstanceError("cannot assign to field '%s'" % name)
        super(cls, self).__setattr__(name, value)

    def __delattr__(self, name):
        if type(self) is cls or name in names:
            raise FrozenInstanceError("cannot delete field '%s'" % name)
        super(cls, self).__delattr__(name)

    return __setattr__, __delattr__


def _apply_dataclass(
    cls,
    init,
    repr_,
    eq,
    order,
    unsafe_hash,
    frozen,
    match_args,
    kw_only,
    slots,
    weakref_slot,
):
    if slots:
        _unsupported("dataclass(slots=True)")
    if weakref_slot:
        _unsupported("dataclass(weakref_slot=True)")
    if any("__slots__" in base.__dict__ for base in cls.__mro__):
        _unsupported("classes with __slots__")

    if order and not eq:
        raise ValueError("eq must be true if order is true")

    all_fields = _collect_inherited_fields(cls, frozen)
    _process_own_fields(cls, all_fields, kw_only)

    # CPython embeds field names and defaults in generated methods. Snapshot
    # their metadata so reusing a Field cannot change methods already installed.
    method_fields = [copy.copy(f) for f in all_fields.values()]
    initialization_fields = [f for f in method_fields if f._field_type != _FIELD_CLASSVAR]
    pos_fields = [f for f in initialization_fields if f.init and not f.kw_only]
    kwonly_fields = [f for f in initialization_fields if f.init and f.kw_only]
    seen_default = None
    for f in pos_fields if init else ():
        if _has_default(f):
            if seen_default is None:
                seen_default = f.name
        elif seen_default is not None:
            raise TypeError(
                "non-default argument '%s' follows default argument '%s'"
                % (f.name, seen_default)
            )

    class_hash = cls.__dict__.get("__hash__", MISSING)
    has_explicit_hash = not (
        class_hash is MISSING or (class_hash is None and "__eq__" in cls.__dict__)
    )
    real_fields = [f for f in method_fields if f._field_type == _FIELD]
    if init and "__init__" not in cls.__dict__:
        cls.__init__ = _build_init(
            initialization_fields, pos_fields, kwonly_fields, frozen, hasattr(cls, "__post_init__")
        )

    if repr_ and "__repr__" not in cls.__dict__:
        cls.__repr__ = _build_repr([f for f in real_fields if f.repr])

    if eq and "__eq__" not in cls.__dict__:
        cls.__eq__ = _build_eq([f for f in real_fields if f.compare])

    if order:
        for n in ("__lt__", "__le__", "__gt__", "__ge__"):
            if n in cls.__dict__:
                raise TypeError("Cannot overwrite attribute %s in class %s" % (n, cls.__name__))
        order_fields = [f for f in real_fields if f.compare]
        cls.__lt__ = _build_order("__lt__", lambda a, b: a < b, order_fields)
        cls.__le__ = _build_order("__le__", lambda a, b: a <= b, order_fields)
        cls.__gt__ = _build_order("__gt__", lambda a, b: a > b, order_fields)
        cls.__ge__ = _build_order("__ge__", lambda a, b: a >= b, order_fields)

    if unsafe_hash:
        if has_explicit_hash:
            raise TypeError("Cannot overwrite attribute __hash__ in class %s" % (cls.__name__,))
        cls.__hash__ = _build_hash(
            [f for f in real_fields if (f.hash is True or (f.hash is None and f.compare))]
        )
    elif eq and frozen:
        if not has_explicit_hash:
            cls.__hash__ = _build_hash(
                [f for f in real_fields if (f.hash is True or (f.hash is None and f.compare))]
            )
    elif eq and not frozen:
        if not has_explicit_hash:
            cls.__hash__ = None

    if frozen:
        if "__setattr__" in cls.__dict__ or "__delattr__" in cls.__dict__:
            raise TypeError("Cannot overwrite attribute __setattr__ or __delattr__ in class %s" % (cls.__name__,))
        cls.__setattr__, cls.__delattr__ = _build_frozen(cls, real_fields)

    if match_args and "__match_args__" not in cls.__dict__:
        cls.__match_args__ = tuple(f.name for f in pos_fields)
    setattr(cls, _FIELDS, all_fields)
    setattr(
        cls,
        _PARAMS,
        _DataclassParams(
            init,
            repr_,
            eq,
            order,
            unsafe_hash,
            frozen,
            match_args,
            kw_only,
            slots,
            weakref_slot,
        ),
    )
    return cls


def dataclass(
    cls=None,
    *,
    init=True,
    repr=True,
    eq=True,
    order=False,
    unsafe_hash=False,
    frozen=False,
    match_args=True,
    kw_only=False,
    slots=False,
    weakref_slot=False
):
    def wrap(c):
        return _apply_dataclass(
            c,
            init,
            repr,
            eq,
            order,
            unsafe_hash,
            frozen,
            match_args,
            kw_only,
            slots,
            weakref_slot,
        )

    if cls is None:
        return wrap
    return wrap(cls)


def fields(class_or_instance):
    cls = class_or_instance if isinstance(class_or_instance, type) else type(class_or_instance)
    f = getattr(cls, _FIELDS, None)
    if f is None:
        raise TypeError("must be called with a dataclass type or instance")
    return tuple(field for field in f.values() if field._field_type == _FIELD)


def is_dataclass(obj):
    if isinstance(obj, type):
        return hasattr(obj, _FIELDS)
    return _is_dataclass_instance(obj)


def _convert(obj, factory, as_dict, active):
    dataclass_instance = _is_dataclass_instance(obj)
    if not dataclass_instance and not isinstance(obj, (list, tuple, dict)):
        return copy.deepcopy(obj)
    oid = id(obj)
    if oid in active:
        raise RecursionError("cannot convert recursive dataclass structure")
    active.add(oid)
    try:
        if dataclass_instance:
            if as_dict:
                return factory([
                    (f.name, _convert(getattr(obj, f.name), factory, as_dict, active))
                    for f in fields(obj)
                ])
            return factory([
                _convert(getattr(obj, f.name), factory, as_dict, active)
                for f in fields(obj)
            ])
        if isinstance(obj, dict):
            items = [
                (_convert(k, factory, as_dict, active), _convert(v, factory, as_dict, active))
                for k, v in obj.items()
            ]
            if isinstance(obj, defaultdict):
                result = type(obj)(obj.default_factory)
                result.update(items)
                return result
            return type(obj)(items)
        items = [_convert(x, factory, as_dict, active) for x in obj]
        if isinstance(obj, tuple) and hasattr(obj, "_fields"):
            return type(obj)(*items)
        return type(obj)(items)
    finally:
        active.remove(oid)


def asdict(obj, *, dict_factory=dict):
    if not _is_dataclass_instance(obj):
        raise TypeError("asdict() should be called on dataclass instances")
    return _convert(obj, dict_factory, True, set())


def astuple(obj, *, tuple_factory=tuple):
    if not _is_dataclass_instance(obj):
        raise TypeError("astuple() should be called on dataclass instances")
    return _convert(obj, tuple_factory, False, set())


def replace(*args, **changes):
    # Extract the instance positionally so "obj" remains a valid field name.
    if len(args) != 1:
        raise TypeError("replace() takes exactly one positional argument")
    obj = args[0]
    if not _is_dataclass_instance(obj):
        raise TypeError("replace() should be called on dataclass instances")
    for f in getattr(type(obj), _FIELDS).values():
        if f._field_type == _FIELD_CLASSVAR:
            continue
        if not f.init:
            if f.name in changes:
                raise TypeError(
                    "field %s is declared with init=False, it cannot be specified with replace()"
                    % (f.name,)
                )
            continue
        if f.name not in changes:
            if f._field_type == _FIELD_INITVAR and f.default is MISSING:
                raise TypeError("InitVar %r must be specified with replace()" % f.name)
            changes[f.name] = getattr(obj, f.name)
    return type(obj)(**changes)


def make_dataclass(
    cls_name,
    fields,
    *,
    bases=(),
    namespace=None,
    init=True,
    repr=True,
    eq=True,
    order=False,
    unsafe_hash=False,
    frozen=False,
    match_args=True,
    kw_only=False,
    slots=False,
    weakref_slot=False
):
    if namespace is None:
        namespace = {}
    else:
        namespace = dict(namespace)
    annotations = {}

    for item in fields:
        if isinstance(item, str):
            fname = item
            ftype = object
            fdefault = MISSING
        elif isinstance(item, tuple):
            if len(item) == 2:
                fname, ftype = item
                fdefault = MISSING
            elif len(item) == 3:
                fname, ftype, fdefault = item
            else:
                raise TypeError("Invalid field definition: %r" % (item,))
        else:
            raise TypeError("Invalid field definition: %r" % (item,))

        if not isinstance(fname, str) or not fname.isidentifier():
            raise TypeError("Field names must be valid identifiers: %r" % (fname,))
        if keyword.iskeyword(fname):
            raise TypeError("Field names must not be keywords: %r" % (fname,))
        if fname in annotations:
            raise TypeError("Field name duplicated: %r" % (fname,))
        annotations[fname] = ftype
        if fdefault is not MISSING:
            namespace[fname] = fdefault

    namespace["__annotations__"] = annotations
    cls = type(cls_name, bases, namespace)
    return dataclass(
        cls,
        init=init,
        repr=repr,
        eq=eq,
        order=order,
        unsafe_hash=unsafe_hash,
        frozen=frozen,
        match_args=match_args,
        kw_only=kw_only,
        slots=slots,
        weakref_slot=weakref_slot,
    )
