"""
Minimal dataclasses support for Skulpt.

This module intentionally implements a focused subset of CPython's dataclasses.
"""

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


def _unsupported(feature):
    raise NotImplementedError(feature + " is not supported in skulpt.dataclasses")


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
        self.metadata = {} if metadata is None else metadata
        self.kw_only = kw_only
        self._field_type = None

    def _clone(self):
        return Field(
            default=self.default,
            default_factory=self.default_factory,
            init=self.init,
            repr=self.repr,
            hash=self.hash,
            compare=self.compare,
            metadata=self.metadata,
            kw_only=self.kw_only,
            name=self.name,
            type=self.type,
        )

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
    if kw_only is not MISSING:
        _unsupported("field(kw_only=...)")
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


def _is_dataclass_instance(obj):
    return hasattr(type(obj), _FIELDS)


def _has_default(f):
    return f.default is not MISSING or f.default_factory is not MISSING


def _iter_fields(cls):
    all_fields = {}
    for base in reversed(cls.__mro__[1:]):
        base_fields = getattr(base, _FIELDS, None)
        if base_fields:
            for name, f in base_fields.items():
                all_fields[name] = f._clone()
    return all_fields


def _process_own_fields(cls, all_fields):
    annotations = getattr(cls, "__annotations__", {})
    class_dict = cls.__dict__
    for name, typ in annotations.items():
        if typ is KW_ONLY or typ == "KW_ONLY":
            _unsupported("KW_ONLY sentinel")
        if typ is InitVar or isinstance(typ, InitVar):
            _unsupported("InitVar")
        if isinstance(typ, str):
            if "ClassVar" in typ:
                _unsupported("ClassVar")
            if "InitVar" in typ:
                _unsupported("InitVar")
        else:
            typ_name = getattr(typ, "__name__", "")
            if typ_name == "ClassVar" or "ClassVar" in repr(typ):
                _unsupported("ClassVar")

        candidate = class_dict.get(name, MISSING)
        if isinstance(candidate, Field):
            f = candidate
            f.name = name
            f.type = typ
            if f.default is not MISSING:
                setattr(cls, name, f.default)
            elif name in class_dict:
                delattr(cls, name)
        else:
            default = candidate
            f = Field(default=default, name=name, type=typ)
        all_fields[name] = f


def _build_init(cls, fields_in_init, frozen):
    def __init__(self, *args, **kwargs):
        if len(args) > len(fields_in_init):
            raise TypeError(
                "__init__() takes at most %d positional arguments (%d given)"
                % (len(fields_in_init), len(args))
            )

        seen = {}

        for idx, value in enumerate(args):
            fname = fields_in_init[idx].name
            seen[fname] = value

        for f in fields_in_init[len(args):]:
            if f.name in kwargs:
                seen[f.name] = kwargs.pop(f.name)
            elif f.default is not MISSING:
                seen[f.name] = f.default
            elif f.default_factory is not MISSING:
                seen[f.name] = f.default_factory()
            else:
                raise TypeError("missing required argument: '%s'" % (f.name,))

        if kwargs:
            keys = ", ".join(sorted(kwargs.keys()))
            raise TypeError("got unexpected keyword argument(s): %s" % (keys,))

        for f in fields_in_init:
            if frozen:
                object.__setattr__(self, f.name, seen[f.name])
            else:
                setattr(self, f.name, seen[f.name])

        post_init = getattr(self, "__post_init__", None)
        if post_init is not None:
            post_init()

    return __init__


def _build_repr(repr_fields):
    def __repr__(self):
        body = ", ".join(
            "%s=%r" % (f.name, getattr(self, f.name)) for f in repr_fields
        )
        return "%s(%s)" % (self.__class__.__qualname__, body)

    return __repr__


def _build_eq(eq_fields):
    def __eq__(self, other):
        if other.__class__ is self.__class__:
            return tuple(getattr(self, f.name) for f in eq_fields) == tuple(
                getattr(other, f.name) for f in eq_fields
            )
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


def _frozen_setattr(self, name, value):
    raise FrozenInstanceError("cannot assign to field '%s'" % (name,))


def _frozen_delattr(self, name):
    raise FrozenInstanceError("cannot delete field '%s'" % (name,))


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
    if kw_only:
        _unsupported("dataclass(kw_only=True)")
    if slots:
        _unsupported("dataclass(slots=True)")
    if weakref_slot:
        _unsupported("dataclass(weakref_slot=True)")

    if order and not eq:
        raise ValueError("eq must be true if order is true")

    all_fields = _iter_fields(cls)
    _process_own_fields(cls, all_fields)

    init_fields = [f for f in all_fields.values() if f.init]
    seen_default = None
    for f in init_fields:
        if _has_default(f):
            if seen_default is None:
                seen_default = f.name
        elif seen_default is not None:
            raise TypeError(
                "non-default argument '%s' follows default argument '%s'"
                % (f.name, seen_default)
            )

    if init and "__init__" not in cls.__dict__:
        cls.__init__ = _build_init(cls, init_fields, frozen)

    if repr_ and "__repr__" not in cls.__dict__:
        cls.__repr__ = _build_repr([f for f in all_fields.values() if f.repr])

    if eq and "__eq__" not in cls.__dict__:
        cls.__eq__ = _build_eq([f for f in all_fields.values() if f.compare])

    if order:
        for n in ("__lt__", "__le__", "__gt__", "__ge__"):
            if n in cls.__dict__:
                raise TypeError("Cannot overwrite attribute %s in class %s" % (n, cls.__name__))
        order_fields = [f for f in all_fields.values() if f.compare]
        cls.__lt__ = _build_order("__lt__", lambda a, b: a < b, order_fields)
        cls.__le__ = _build_order("__le__", lambda a, b: a <= b, order_fields)
        cls.__gt__ = _build_order("__gt__", lambda a, b: a > b, order_fields)
        cls.__ge__ = _build_order("__ge__", lambda a, b: a >= b, order_fields)

    if unsafe_hash:
        if "__hash__" in cls.__dict__ and cls.__dict__["__hash__"] is not None:
            raise TypeError("Cannot overwrite attribute __hash__ in class %s" % (cls.__name__,))
        cls.__hash__ = _build_hash(
            [f for f in all_fields.values() if (f.hash is True or (f.hash is None and f.compare))]
        )
    elif eq and frozen:
        if "__hash__" not in cls.__dict__ or cls.__dict__["__hash__"] is None:
            cls.__hash__ = _build_hash(
                [f for f in all_fields.values() if (f.hash is True or (f.hash is None and f.compare))]
            )
    elif eq and not frozen:
        if "__hash__" not in cls.__dict__:
            cls.__hash__ = None

    if frozen:
        if "__setattr__" in cls.__dict__ or "__delattr__" in cls.__dict__:
            raise TypeError("Cannot overwrite attribute __setattr__ or __delattr__ in class %s" % (cls.__name__,))
        cls.__setattr__ = _frozen_setattr
        cls.__delattr__ = _frozen_delattr

    cls.__match_args__ = tuple(f.name for f in init_fields) if match_args else ()
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
    repr_=True,
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
            repr_,
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
    return tuple(f.values())


def is_dataclass(obj):
    if isinstance(obj, type):
        return hasattr(obj, _FIELDS)
    return _is_dataclass_instance(obj)


def _convert_asdict(obj, dict_factory):
    if _is_dataclass_instance(obj):
        items = []
        for f in fields(obj):
            items.append((f.name, _convert_asdict(getattr(obj, f.name), dict_factory)))
        return dict_factory(items)
    if isinstance(obj, list):
        return [_convert_asdict(x, dict_factory) for x in obj]
    if isinstance(obj, tuple):
        return tuple(_convert_asdict(x, dict_factory) for x in obj)
    if isinstance(obj, dict):
        return type(obj)(
            (_convert_asdict(k, dict_factory), _convert_asdict(v, dict_factory))
            for k, v in obj.items()
        )
    return obj


def asdict(obj, *, dict_factory=dict):
    if not _is_dataclass_instance(obj):
        raise TypeError("asdict() should be called on dataclass instances")
    return _convert_asdict(obj, dict_factory)


def _convert_astuple(obj, tuple_factory):
    if _is_dataclass_instance(obj):
        return tuple_factory([_convert_astuple(getattr(obj, f.name), tuple_factory) for f in fields(obj)])
    if isinstance(obj, list):
        return [_convert_astuple(x, tuple_factory) for x in obj]
    if isinstance(obj, tuple):
        return tuple_factory([_convert_astuple(x, tuple_factory) for x in obj])
    if isinstance(obj, dict):
        return type(obj)((_convert_astuple(k, tuple_factory), _convert_astuple(v, tuple_factory)) for k, v in obj.items())
    return obj


def astuple(obj, *, tuple_factory=tuple):
    if not _is_dataclass_instance(obj):
        raise TypeError("astuple() should be called on dataclass instances")
    return _convert_astuple(obj, tuple_factory)


def replace(obj, **changes):
    if not _is_dataclass_instance(obj):
        raise TypeError("replace() should be called on dataclass instances")
    kwargs = {}
    for f in fields(obj):
        if not f.init:
            if f.name in changes:
                raise ValueError(
                    "field %s is declared with init=False, it cannot be specified with replace()"
                    % (f.name,)
                )
            continue
        if f.name in changes:
            kwargs[f.name] = changes.pop(f.name)
        else:
            kwargs[f.name] = getattr(obj, f.name)
    if changes:
        bad = ", ".join(sorted(changes.keys()))
        raise TypeError("got unexpected field name(s): %s" % (bad,))
    return type(obj)(**kwargs)


def make_dataclass(
    cls_name,
    field_defs,
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

    for item in field_defs:
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

        annotations[fname] = ftype
        if fdefault is not MISSING:
            namespace[fname] = fdefault

    namespace["__annotations__"] = annotations
    cls = type(cls_name, bases, namespace)
    return dataclass(
        cls,
        init=init,
        repr_=repr,
        eq=eq,
        order=order,
        unsafe_hash=unsafe_hash,
        frozen=frozen,
        match_args=match_args,
        kw_only=kw_only,
        slots=slots,
        weakref_slot=weakref_slot,
    )
