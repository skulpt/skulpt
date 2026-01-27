function $builtinmodule() {
    const typing = {};

    const {
        object: pyObject,
        str: pyStr,
        tuple: pyTuple,
        list: pyList,
        dict: pyDict,
        set: pySet,
        frozenset: pyFrozenSet,
        type: pyType,
        none: { none$: pyNone },
        bool: { true$: pyTrue, false$: pyFalse },
        TypeError: pyTypeError,
        NotImplemented: { NotImplemented$: pyNotImplemented },
        GenericAlias,
        Ellipsis: pyEllipsis,
        checkNone,
        UnionType: pyUnionType,
    } = Sk.builtin;

    const {
        callsimArray: pyCall,
        isTrue,
        richCompareBool,
        objectRepr,
        buildClass,
        chain: chainOrSuspend,
    } = Sk.misceval;

    const {
        buildNativeClass,
        setUpModuleMethods,
        checkArgsLen,
        checkNoKwargs,
        lookupSpecial,
        iter: pyIter,
        objectHash,
    } = Sk.abstr;

    // ==================== _SpecialForm ====================
    // Base class for typing constructs like Any, Union, Optional, etc.

    const _SpecialForm = buildNativeClass("typing._SpecialForm", {
        constructor: function _SpecialForm(name, doc, getitem) {
            this.$name = name;
            this.$doc = doc || "";
            this.$getitem = getitem; // null means not subscriptable
        },
        slots: {
            tp$new() {
                throw new pyTypeError("Cannot instantiate " + this.$name);
            },
            $r() {
                return new pyStr("typing." + this.$name);
            },
            tp$hash() {
                return pyStr.prototype.tp$hash.call(new pyStr(this.$name));
            },
            tp$as_sequence_or_mapping: true,
            mp$subscript(item) {
                if (this.$getitem === null) {
                    throw new pyTypeError("typing." + this.$name + " is not subscriptable");
                }
                return this.$getitem(item);
            },
        },
        getsets: {
            __doc__: {
                $get() {
                    return new pyStr(this.$doc);
                },
            },
        },
    });

    // ==================== _GenericAlias ====================
    // Result of subscripting typing constructs

    const _GenericAlias = buildNativeClass("typing._GenericAlias", {
        constructor: function _GenericAlias(origin, args, name) {
            this.$origin = origin;
            if (!(args instanceof pyTuple)) {
                args = new pyTuple([args]);
            }
            this.$args = args;
            this.$name = name || null; // optional display name override
        },
        slots: {
            tp$new(args, kwargs) {
                checkNoKwargs("_GenericAlias", kwargs);
                checkArgsLen("_GenericAlias", args, 2, 3);
                const name = args.length > 2 ? args[2].toString() : null;
                return new _GenericAlias(args[0], args[1], name);
            },
            $r() {
                let origin_repr;
                if (this.$name) {
                    origin_repr = "typing." + this.$name;
                } else if (this.$origin instanceof _SpecialForm) {
                    origin_repr = "typing." + this.$origin.$name;
                } else if (this.$origin === pyList) {
                    origin_repr = "typing.List";
                } else if (this.$origin === pyDict) {
                    origin_repr = "typing.Dict";
                } else if (this.$origin === pySet) {
                    origin_repr = "typing.Set";
                } else if (this.$origin === pyTuple) {
                    origin_repr = "typing.Tuple";
                } else if (this.$origin === pyFrozenSet) {
                    origin_repr = "typing.FrozenSet";
                } else if (this.$origin === pyType) {
                    origin_repr = "typing.Type";
                } else {
                    origin_repr = ga$repr(this.$origin);
                }

                let arg_repr = "";
                const args = this.$args.v;

                // Special handling for Callable
                if (this.$name === "Callable" && args.length === 2) {
                    const params = args[0];
                    const ret = args[1];
                    let params_repr;
                    if (params instanceof pyList) {
                        params_repr = "[" + params.v.map(ga$repr).join(", ") + "]";
                    } else {
                        params_repr = ga$repr(params);
                    }
                    return new pyStr(origin_repr + "[" + params_repr + ", " + ga$repr(ret) + "]");
                }

                args.forEach((arg, i) => {
                    arg_repr += i > 0 ? ", " : "";
                    arg_repr += ga$repr(arg);
                });
                if (!arg_repr) {
                    arg_repr = "()";
                }
                return new pyStr(origin_repr + "[" + arg_repr + "]");
            },
            tp$hash() {
                const h0 = objectHash(this.$origin);
                const h1 = objectHash(this.$args);
                return h0 ^ h1;
            },
            tp$richcompare(other, op) {
                if (!(other instanceof _GenericAlias) || (op !== "Eq" && op !== "NotEq")) {
                    return pyNotImplemented;
                }
                const eq = richCompareBool(this.$origin, other.$origin, "Eq");
                if (!eq) {
                    return op === "Eq" ? eq : !eq;
                }
                const res = richCompareBool(this.$args, other.$args, "Eq");
                return op === "Eq" ? res : !res;
            },
            tp$call(args, kwargs) {
                // Delegate to the origin type
                if (this.$origin && this.$origin.tp$call) {
                    const result = this.$origin.tp$call(args, kwargs);
                    // Try to set __orig_class__ on the result
                    if (result && result.tp$setattr) {
                        try {
                            result.tp$setattr(new pyStr("__orig_class__"), this);
                        } catch (e) {
                            // Ignore if we can't set it
                        }
                    }
                    return result;
                }
                throw new pyTypeError("'" + (this.$name || "typing._GenericAlias") + "' object is not callable");
            },
            tp$as_sequence_or_mapping: true,
            mp$subscript(item) {
                // Allow further subscripting for nested generics
                if (!(item instanceof pyTuple)) {
                    item = new pyTuple([item]);
                }
                return new _GenericAlias(this, item);
            },
        },
        methods: {
            __mro_entries__: {
                $meth(bases) {
                    // bases argument is required in CPython but Skulpt doesn't use it yet
                    // For Generic[T] as a base, return (Generic,)
                    if (this.$origin === typing.Generic || this.$name === "Generic") {
                        return new pyTuple([typing.Generic]);
                    }
                    // For Protocol[T], return (Protocol,)
                    if (this.$origin === typing.Protocol || this.$name === "Protocol") {
                        return new pyTuple([typing.Protocol]);
                    }
                    // For other generic aliases, return the origin
                    if (this.$origin && this.$origin.sk$type) {
                        return new pyTuple([this.$origin]);
                    }
                    return new pyTuple([pyObject]);
                },
                $flags: { OneArg: true },
            },
        },
        getsets: {
            __origin__: {
                $get() {
                    return this.$origin;
                },
            },
            __args__: {
                $get() {
                    return this.$args;
                },
            },
        },
    });

    // Helper function for repr
    function ga$repr(item) {
        if (item === pyEllipsis) {
            return "...";
        }
        if (item === pyNone) {
            return "None";
        }
        if (item instanceof _SpecialForm) {
            return "typing." + item.$name;
        }
        if (item instanceof _GenericAlias) {
            return objectRepr(item);
        }
        if (item instanceof TypeVar) {
            return "~" + item.$name;
        }
        if (item instanceof ParamSpec) {
            return "~" + item.$name;
        }
        if (item instanceof TypeVarTuple) {
            return item.$name;
        }
        // For built-in types like int, str, etc.
        const qualname = lookupSpecial(item, pyStr.$qualname);
        if (qualname !== undefined) {
            const mod = lookupSpecial(item, pyStr.$module);
            if (mod !== undefined && !checkNone(mod)) {
                if (mod.toString() === "builtins") {
                    return qualname.toString();
                }
                return mod.toString() + "." + qualname.toString();
            }
            return qualname.toString();
        }
        return objectRepr(item);
    }

    // ==================== Special Forms ====================

    // Any - represents any type
    typing.Any = new _SpecialForm("Any", "Special type indicating an unconstrained type.", null);

    // Union - represents Union[X, Y]
    typing.Union = new _SpecialForm("Union", "Union type; Union[X, Y] means either X or Y.", (item) => {
        if (!(item instanceof pyTuple)) {
            item = new pyTuple([item]);
        }
        return new _GenericAlias(typing.Union, item);
    });

    // Optional - Optional[X] is equivalent to Union[X, None]
    typing.Optional = new _SpecialForm(
        "Optional",
        "Optional type. Optional[X] is equivalent to Union[X, None].",
        (item) => {
            const noneType = pyNone.ob$type;
            const args = new pyTuple([item, noneType]);
            return new _GenericAlias(typing.Union, args);
        },
    );

    // Literal - Literal[value1, value2, ...]
    typing.Literal = new _SpecialForm(
        "Literal",
        "Special typing form to define literal types (a.k.a. value types).",
        (item) => {
            if (!(item instanceof pyTuple)) {
                item = new pyTuple([item]);
            }
            return new _GenericAlias(typing.Literal, item);
        },
    );

    // ClassVar - ClassVar[type]
    typing.ClassVar = new _SpecialForm(
        "ClassVar",
        "Special type construct to mark class variables.",
        (item) => new _GenericAlias(typing.ClassVar, item),
    );

    // Final - Final[type]
    typing.Final = new _SpecialForm(
        "Final",
        "Special typing construct to indicate final names to type checkers.",
        (item) => new _GenericAlias(typing.Final, item),
    );

    // NoReturn - not subscriptable
    typing.NoReturn = new _SpecialForm("NoReturn", "Special type indicating functions that never return.", null);

    // Never - bottom type (equivalent to NoReturn but for type expressions)
    typing.Never = new _SpecialForm("Never", "The bottom type, a type that has no members.", null);

    // Self - not subscriptable (refers to the enclosing class)
    typing.Self = new _SpecialForm("Self", 'Used to spell the type of "self" in classes.', null);

    // TypeAlias - marker for explicit type alias declarations (PEP 613)
    typing.TypeAlias = new _SpecialForm(
        "TypeAlias",
        "Special marker indicating that an assignment should be recognized as a type alias.",
        null
    );

    // Annotated - Annotated[type, metadata...]
    typing.Annotated = new _SpecialForm("Annotated", "Add context-specific metadata to a type.", (item) => {
        if (!(item instanceof pyTuple)) {
            throw new pyTypeError("Annotated requires at least two arguments");
        }
        if (item.v.length < 2) {
            throw new pyTypeError("Annotated requires at least two arguments");
        }
        return new _GenericAlias(typing.Annotated, item);
    });

    // Concatenate - for ParamSpec
    typing.Concatenate = new _SpecialForm("Concatenate", "Used in conjunction with ParamSpec and Callable.", (item) => {
        if (!(item instanceof pyTuple)) {
            item = new pyTuple([item]);
        }
        return new _GenericAlias(typing.Concatenate, item);
    });

    // Unpack - for unpacking TypeVarTuples
    typing.Unpack = new _SpecialForm(
        "Unpack",
        "Used to unpack TypeVarTuples. Unpack[Ts] expands Ts in a type context.",
        (item) => new _GenericAlias(typing.Unpack, item, "Unpack")
    );

    // ==================== Collection Type Aliases ====================

    typing.List = new _SpecialForm(
        "List",
        "Generic list type. Use List[T] for a list containing elements of type T.",
        (item) => new GenericAlias(pyList, item),
    );

    typing.Dict = new _SpecialForm(
        "Dict",
        "Generic dict type. Use Dict[K, V] for a dict mapping keys of type K to values of type V.",
        (item) => new GenericAlias(pyDict, item),
    );

    typing.Set = new _SpecialForm(
        "Set",
        "Generic set type. Use Set[T] for a set containing elements of type T.",
        (item) => new GenericAlias(pySet, item),
    );

    typing.Tuple = new _SpecialForm(
        "Tuple",
        "Generic tuple type. Use Tuple[T1, T2, ...] for a tuple of specific types.",
        (item) => new GenericAlias(pyTuple, item),
    );

    typing.FrozenSet = new _SpecialForm(
        "FrozenSet",
        "Generic frozenset type.",
        (item) => new GenericAlias(pyFrozenSet, item),
    );

    typing.Type = new _SpecialForm(
        "Type",
        "A special form used to annotate class objects.",
        (item) => new GenericAlias(pyType, item),
    );

    // Callable - Callable[[args], return_type]
    typing.Callable = new _SpecialForm(
        "Callable",
        "Callable type; Callable[[int], str] is a function of (int) -> str.",
        (item) => {
            if (!(item instanceof pyTuple) || item.v.length !== 2) {
                throw new pyTypeError("Callable must be used as Callable[[arg_types], return_type]");
            }
            return new _GenericAlias(typing.Callable, item, "Callable");
        },
    );

    // ==================== TypeVar ====================

    const TypeVar = (typing.TypeVar = buildNativeClass("typing.TypeVar", {
        constructor: function TypeVar(name, constraints, bound, covariant, contravariant) {
            this.$name = name;
            this.$constraints = constraints || new pyTuple([]);
            this.$bound = bound || pyNone;
            this.$covariant = covariant || false;
            this.$contravariant = contravariant || false;
        },
        slots: {
            tp$new(args, kwargs) {
                const [name, ...constraints_arr] = args;
                if (!name) {
                    throw new pyTypeError("TypeVar() missing required argument: 'name'");
                }
                let bound = pyNone;
                let covariant = false;
                let contravariant = false;
                if (kwargs) {
                    for (let i = 0; i < kwargs.length; i += 2) {
                        if (kwargs[i] === "bound") {
                            bound = kwargs[i + 1];
                        } else if (kwargs[i] === "covariant") {
                            covariant = isTrue(kwargs[i + 1]);
                        } else if (kwargs[i] === "contravariant") {
                            contravariant = isTrue(kwargs[i + 1]);
                        }
                    }
                }
                const constraints = new pyTuple(constraints_arr);
                return new TypeVar(name.toString(), constraints, bound, covariant, contravariant);
            },
            $r() {
                return new pyStr("~" + this.$name);
            },
            tp$hash() {
                return pyStr.prototype.tp$hash.call(new pyStr(this.$name));
            },
        },
        getsets: {
            __name__: {
                $get() {
                    return new pyStr(this.$name);
                },
            },
            __constraints__: {
                $get() {
                    return this.$constraints;
                },
            },
            __bound__: {
                $get() {
                    return this.$bound;
                },
            },
            __covariant__: {
                $get() {
                    return this.$covariant ? pyTrue : pyFalse;
                },
            },
            __contravariant__: {
                $get() {
                    return this.$contravariant ? pyTrue : pyFalse;
                },
            },
        },
    }));

    // ==================== Generic ====================

    typing.Generic = buildNativeClass("typing.Generic", {
        constructor: function Generic() {},
        base: pyObject,
        classmethods: {
            __class_getitem__: {
                $meth(item) {
                    if (!(item instanceof pyTuple)) {
                        item = new pyTuple([item]);
                    }
                    return new _GenericAlias(this, item, "Generic");
                },
                $flags: { OneArg: true },
            },
        },
    });

    // ==================== Protocol ====================

    typing.Protocol = buildNativeClass("typing.Protocol", {
        constructor: function Protocol() {},
        base: pyObject,
        slots: {
            tp$new(args, kwargs) {
                // Allow subclasses to instantiate
                if (this.prototype === typing.Protocol.prototype) {
                    throw new pyTypeError("Cannot instantiate Protocol directly");
                }
                return pyObject.prototype.tp$new.call(this, args, kwargs);
            },
        },
        classmethods: {
            __class_getitem__: {
                $meth(item) {
                    if (!(item instanceof pyTuple)) {
                        item = new pyTuple([item]);
                    }
                    return new _GenericAlias(this, item, "Protocol");
                },
                $flags: { OneArg: true },
            },
        },
    });

    // ==================== NamedTuple ====================
    // NamedTuple is a callable factory that creates namedtuple classes
    // It also supports class-based syntax via __mro_entries__ and NamedTupleMeta (like CPython)

    // NamedTupleMeta - metaclass that intercepts class creation for class-based syntax
    // Like CPython, we override __new__ (tp$new) to intercept class creation
    const NamedTupleMeta = buildNativeClass("typing.NamedTupleMeta", {
        constructor: function NamedTupleMeta() {},
        base: pyType,
        slots: {
            tp$new(args, kwargs) {
                // args = [name, bases, namespace]
                if (args.length !== 3) {
                    return pyType.prototype.tp$new.call(this, args, kwargs);
                }
                const [name, bases, ns] = args;
                const typename = name.toString();

                // Get __annotations__ from namespace
                const annotations = ns.mp$lookup(new pyStr("__annotations__")) || new pyDict();

                // Extract field names and types
                const field_names = [];
                const flds = [];
                for (let iter = pyIter(annotations), k = iter.tp$iternext();
                     k !== undefined; k = iter.tp$iternext()) {
                    field_names.push(k);
                    flds.push(k.toString());
                }

                // For _NamedTuple sentinel (no fields), create a simple tuple subclass
                if (field_names.length === 0) {
                    return pyType.prototype.tp$new.call(this, [name, new pyTuple([pyTuple]), ns], kwargs);
                }

                // Extract defaults from namespace (class body assignments)
                const defaults = [];
                for (const fname of field_names) {
                    const val = ns.mp$lookup(fname);
                    if (val !== undefined) {
                        defaults.push(val);
                    }
                }

                // Get module from namespace
                const module = ns.mp$lookup(new pyStr("__module__"));

                // Create the namedtuple class using collections helper
                return chainOrSuspend(
                    Sk.importModule("collections", false, true),
                    (collections) => {
                        return collections.$d._make_namedtuple_class(
                            typename, field_names, flds, defaults, module, annotations
                        );
                    }
                );
            },
        },
    });

    // Create _NamedTuple sentinel class with NamedTupleMeta as its metaclass
    // This is equivalent to CPython's: _NamedTuple = type.__new__(NamedTupleMeta, 'NamedTuple', (), {})
    const _NamedTuple = pyCall(NamedTupleMeta, [
        new pyStr("_NamedTuple"),
        new pyTuple([pyTuple]),
        new pyDict()
    ]);
    typing._NamedTuple = _NamedTuple;

    const _NamedTupleType = buildNativeClass("typing.NamedTuple", {
        constructor: function _NamedTupleType() {},
        slots: {
            tp$call(args, kwargs) {
                // NamedTuple('Point', [('x', int), ('y', int)])
                checkArgsLen("NamedTuple", args, 2, 2);
                const name = args[0];
                const fields = args[1];

                // Extract field names and types from the list of (name, type) tuples
                const field_names = [];
                const field_types = [];
                const iter = pyIter(fields);
                for (let item = iter.tp$iternext(); item !== undefined; item = iter.tp$iternext()) {
                    if (item instanceof pyTuple && item.v.length >= 1) {
                        field_names.push(item.v[0]);
                        if (item.v.length >= 2) {
                            field_types.push(item.v[0], item.v[1]);
                        }
                    } else if (item instanceof pyStr) {
                        field_names.push(item);
                    }
                }

                // Build annotations dict
                const annotations = new pyDict(field_types);

                // Import collections and use the helper
                return chainOrSuspend(Sk.importModule("collections", false, true), (collections) => {
                    const flds = field_names.map(f => f.toString());
                    return collections.$d._make_namedtuple_class(
                        name.toString(), field_names, flds, [], null, annotations
                    );
                });
            },
            $r() {
                return new pyStr("<class 'typing.NamedTuple'>");
            },
            tp$as_sequence_or_mapping: true,
            mp$subscript(item) {
                return new _GenericAlias(typing.NamedTuple, item, "NamedTuple");
            },
        },
        methods: {
            __mro_entries__: {
                $meth(bases) {
                    // Swap NamedTuple with _NamedTuple (which has NamedTupleMeta as its metaclass)
                    return new pyTuple([_NamedTuple]);
                },
                $flags: { OneArg: true },
            },
        },
    });

    // Create NamedTuple as an instance that can be called
    typing.NamedTuple = new _NamedTupleType();




    // ==================== TypedDict ====================
    // TypedDict is a callable factory that creates typed dict classes

    const _TypedDictType = buildNativeClass("typing.TypedDict", {
        constructor: function _TypedDictType() {},
        slots: {
            tp$call(args, kwargs) {
                // TypedDict('Movie', {'name': str, 'year': int})
                checkArgsLen("TypedDict", args, 2, 2);
                const name = args[0].toString();
                const fields = args[1]; // dict of {field_name: type}

                // Create a new class that inherits from dict
                const newClass = buildClass(
                    { __name__: new pyStr(name) },
                    (gbl, loc) => {
                        loc.__annotations__ = fields;
                    },
                    name,
                    [pyDict],
                );
                return newClass;
            },
            $r() {
                return new pyStr("<class 'typing.TypedDict'>");
            },
            tp$as_sequence_or_mapping: true,
            mp$subscript(item) {
                return new _GenericAlias(typing.TypedDict, item, "TypedDict");
            },
        },
        methods: {
            __mro_entries__: {
                $meth(bases) {
                    // When TypedDict is used as base class, replace with dict
                    return new pyTuple([pyDict]);
                },
                $flags: { OneArg: true },
            },
        },
    });

    // Create TypedDict as an instance that can be called
    typing.TypedDict = new _TypedDictType();

    // ==================== ParamSpec ====================

    // Helper classes for ParamSpec.args and ParamSpec.kwargs
    const _ParamSpecArgs = buildNativeClass("typing.ParamSpecArgs", {
        constructor: function _ParamSpecArgs(origin) {
            this.$origin = origin;
        },
        slots: {
            $r() {
                return new pyStr(this.$origin.$name + ".args");
            },
            tp$richcompare(other, op) {
                if (!(other instanceof _ParamSpecArgs) || (op !== "Eq" && op !== "NotEq")) {
                    return pyNotImplemented;
                }
                const eq = this.$origin === other.$origin;
                return op === "Eq" ? eq : !eq;
            },
        },
        getsets: {
            __origin__: {
                $get() {
                    return this.$origin;
                },
            },
        },
    });

    const _ParamSpecKwargs = buildNativeClass("typing.ParamSpecKwargs", {
        constructor: function _ParamSpecKwargs(origin) {
            this.$origin = origin;
        },
        slots: {
            $r() {
                return new pyStr(this.$origin.$name + ".kwargs");
            },
            tp$richcompare(other, op) {
                if (!(other instanceof _ParamSpecKwargs) || (op !== "Eq" && op !== "NotEq")) {
                    return pyNotImplemented;
                }
                const eq = this.$origin === other.$origin;
                return op === "Eq" ? eq : !eq;
            },
        },
        getsets: {
            __origin__: {
                $get() {
                    return this.$origin;
                },
            },
        },
    });

    const ParamSpec = (typing.ParamSpec = buildNativeClass("typing.ParamSpec", {
        constructor: function ParamSpec(name) {
            this.$name = name;
            this.$args = new _ParamSpecArgs(this);
            this.$kwargs = new _ParamSpecKwargs(this);
        },
        slots: {
            tp$new(args, kwargs) {
                checkArgsLen("ParamSpec", args, 1, 1);
                return new ParamSpec(args[0].toString());
            },
            $r() {
                return new pyStr("~" + this.$name);
            },
            tp$hash() {
                return pyStr.prototype.tp$hash.call(new pyStr(this.$name));
            },
        },
        getsets: {
            __name__: {
                $get() {
                    return new pyStr(this.$name);
                },
            },
            args: {
                $get() {
                    return this.$args;
                },
            },
            kwargs: {
                $get() {
                    return this.$kwargs;
                },
            },
        },
    }));

    // ==================== TypeVarTuple ====================

    const TypeVarTuple = (typing.TypeVarTuple = buildNativeClass("typing.TypeVarTuple", {
        constructor: function TypeVarTuple(name) {
            this.$name = name;
        },
        slots: {
            tp$new(args, kwargs) {
                checkArgsLen("TypeVarTuple", args, 1, 1);
                return new TypeVarTuple(args[0].toString());
            },
            $r() {
                return new pyStr(this.$name);
            },
            tp$hash() {
                return pyStr.prototype.tp$hash.call(new pyStr(this.$name));
            },
        },
        getsets: {
            __name__: {
                $get() {
                    return new pyStr(this.$name);
                },
            },
        },
    }));

    // ==================== ForwardRef ====================

    typing.ForwardRef = buildNativeClass("typing.ForwardRef", {
        constructor: function ForwardRef(arg) {
            this.$arg = arg;
        },
        slots: {
            tp$new(args, kwargs) {
                checkArgsLen("ForwardRef", args, 1, 1);
                return new typing.ForwardRef(args[0].toString());
            },
            $r() {
                return new pyStr("ForwardRef('" + this.$arg + "')");
            },
        },
        getsets: {
            __forward_arg__: {
                $get() {
                    return new pyStr(this.$arg);
                },
            },
        },
    });

    // ==================== Minimal ABCs ====================

    function makeABC(name) {
        const ABC = buildNativeClass("typing." + name, {
            constructor: function () {},
            slots: {
                tp$new(args, kwargs) {
                    throw new pyTypeError("Cannot instantiate " + name);
                },
            },
            classmethods: {
                __class_getitem__: {
                    $meth(item) {
                        if (!(item instanceof pyTuple)) {
                            item = new pyTuple([item]);
                        }
                        return new _GenericAlias(this, item, name);
                    },
                    $flags: { OneArg: true },
                },
            },
        });
        return ABC;
    }

    typing.Iterable = makeABC("Iterable");
    typing.Iterator = makeABC("Iterator");
    typing.Sequence = makeABC("Sequence");
    typing.MutableSequence = makeABC("MutableSequence");
    typing.Mapping = makeABC("Mapping");
    typing.MutableMapping = makeABC("MutableMapping");

    // ==================== Helper Functions ====================

    setUpModuleMethods("typing", typing, {
        cast: {
            $meth(typ, val) {
                // cast is a no-op at runtime
                return val;
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $doc: "Cast a value to a type. This returns the value unchanged.",
        },
        get_origin: {
            $meth(tp) {
                // Return the __origin__ of a generic type
                // PEP 604: UnionType returns types.UnionType as origin (not typing.Union)
                if (tp instanceof pyUnionType) {
                    return pyUnionType;
                }
                if (tp instanceof _GenericAlias) {
                    return tp.$origin;
                }
                if (tp instanceof GenericAlias) {
                    return tp.$origin;
                }
                // Check for __origin__ attribute
                const origin = lookupSpecial(tp, new pyStr("__origin__"));
                if (origin !== undefined) {
                    return origin;
                }
                return pyNone;
            },
            $flags: { OneArg: true },
            $doc: "Get the unsubscripted version of a type.",
        },
        get_args: {
            $meth(tp) {
                // Return the __args__ of a generic type
                // PEP 604: UnionType has $args tuple
                if (tp instanceof pyUnionType) {
                    return tp.$args;
                }
                if (tp instanceof _GenericAlias) {
                    return tp.$args;
                }
                if (tp instanceof GenericAlias) {
                    return tp.$args;
                }
                // Check for __args__ attribute
                const args = lookupSpecial(tp, new pyStr("__args__"));
                if (args !== undefined) {
                    return args;
                }
                return new pyTuple([]);
            },
            $flags: { OneArg: true },
            $doc: "Get type arguments with all substitutions performed.",
        },
        overload: {
            $meth(func) {
                // overload is a no-op at runtime
                return func;
            },
            $flags: { OneArg: true },
            $doc: "Decorator for overloaded functions/methods.",
        },
        runtime_checkable: {
            $meth(cls) {
                // Mark the class as runtime checkable
                cls.$runtime_checkable = true;
                return cls;
            },
            $flags: { OneArg: true },
            $doc: "Mark a protocol class as a runtime protocol.",
        },
        override: {
            $meth(func) {
                // override is a no-op at runtime
                return func;
            },
            $flags: { OneArg: true },
            $doc: "Decorator to indicate that a method is intended to override a method in a base class.",
        },
    });

    // ==================== Module metadata ====================

    typing.__name__ = new pyStr("typing");
    typing.__doc__ = new pyStr(
        "Support for type hints.\n\n" +
            "This module provides runtime support for type hints as specified by PEP 484.\n" +
            "The most fundamental support consists of the types Any, Union, Tuple, Callable,\n" +
            "TypeVar, and Generic.",
    );
    typing.__all__ = new pyList(
        [
            "Any",
            "Union",
            "Optional",
            "List",
            "Dict",
            "Set",
            "Tuple",
            "FrozenSet",
            "Callable",
            "Type",
            "ClassVar",
            "Final",
            "Literal",
            "TypeVar",
            "Generic",
            "NoReturn",
            "Never",
            "Self",
            "TypeAlias",
            "Protocol",
            "runtime_checkable",
            "override",
            "NamedTuple",
            "TypedDict",
            "Annotated",
            "overload",
            "ParamSpec",
            "TypeVarTuple",
            "Concatenate",
            "Unpack",
            "ForwardRef",
            "Iterable",
            "Iterator",
            "Sequence",
            "Mapping",
            "MutableMapping",
            "MutableSequence",
            "cast",
            "get_origin",
            "get_args",
        ].map((x) => new pyStr(x)),
    );

    // Export internal classes for potential use
    typing._SpecialForm = _SpecialForm;
    typing._GenericAlias = _GenericAlias;


    return typing;
}
