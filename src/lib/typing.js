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
        callsimOrSuspendArray: pyCallOrSuspend,
        isTrue,
        richCompareBool,
        objectRepr,
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

    function unionOr(other) {
        const valid = (arg) => arg.sk$type || arg === pyNone || arg instanceof GenericAlias ||
            arg instanceof pyUnionType || arg instanceof _GenericAlias || arg instanceof _SpecialForm ||
            arg instanceof TypeVar || arg instanceof pyStr || arg instanceof typing.ForwardRef;
        if (!valid(this) || !valid(other)) {
            return pyNotImplemented;
        }
        return typing.Union.mp$subscript(new pyTuple([this, other]));
    }

    function unionRor(other) {
        return unionOr.call(other, this);
    }

    function typeArgument(arg) {
        if (arg === pyNone) {
            return pyNone.ob$type;
        }
        return arg instanceof pyStr ? new typing.ForwardRef(arg.toString()) : arg;
    }

    // ==================== _SpecialForm ====================
    // Base class for typing constructs like Any, Union, Optional, etc.

    const _SpecialForm = buildNativeClass("typing._SpecialForm", {
        constructor: function _SpecialForm(name, doc, getitem) {
            this.$name = name;
            this.$doc = doc || "";
            this.$getitem = getitem; // null means not subscriptable
        },
        slots: {
            tp$as_number: true,
            nb$or: unionOr,
            nb$reflected_or: unionRor,
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
    // typing-specific aliases retain typing names and construction rules;
    // builtin list[T]/dict[K, V] remain native GenericAlias objects. Both use
    // the same parameter collection and substitution machinery.

    const _GenericAlias = buildNativeClass("typing._GenericAlias", {
        constructor: function _GenericAlias(origin, args, name) {
            this.$origin = origin;
            if (!(args instanceof pyTuple)) {
                args = new pyTuple([args]);
            }
            // Literal values and Annotated metadata are not type arguments.
            this.$args = origin === typing.Literal ? args : new pyTuple(args.v.map((arg, i) =>
                origin === typing.Annotated && i > 0 ? arg : typeArgument(arg)));
            this.$name = name || null; // optional display name override
            this.$params = null;
        },
        slots: {
            tp$as_number: true,
            nb$or: unionOr,
            nb$reflected_or: unionRor,
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
                if (this.$name === "Callable") {
                    const [params, ret] = callableArgs(this).v;
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
                if (this.$origin === typing.Union) {
                    return objectHash(new pyFrozenSet(this.$args.v));
                }
                if (this.$origin === typing.Literal) {
                    return objectHash(literalValues(this));
                }
                const h0 = objectHash(this.$origin);
                const h1 = objectHash(this.$args);
                return h0 ^ h1;
            },
            tp$richcompare(other, op) {
                if (op !== "Eq" && op !== "NotEq") {
                    return pyNotImplemented;
                }
                if (this.$origin === typing.Union && (other instanceof pyUnionType ||
                    (other instanceof _GenericAlias && other.$origin === typing.Union))) {
                    return richCompareBool(new pyFrozenSet(this.$args.v), new pyFrozenSet(other.$args.v), op);
                }
                if (!(other instanceof _GenericAlias)) {
                    return pyNotImplemented;
                }
                if (this.$origin === typing.Literal && other.$origin === typing.Literal) {
                    return richCompareBool(literalValues(this), literalValues(other), op);
                }
                const eq = richCompareBool(this.$origin, other.$origin, "Eq");
                if (!eq) {
                    return op === "Eq" ? eq : !eq;
                }
                const res = richCompareBool(this.$args, other.$args, "Eq");
                return op === "Eq" ? res : !res;
            },
            tp$call(args, kwargs) {
                if (this.$name || !this.$origin.sk$type) {
                    throw new pyTypeError("Cannot instantiate " + objectRepr(this));
                }
                return chainOrSuspend(pyCallOrSuspend(this.$origin, args, kwargs), (result) => {
                    // Builtin/immutable instances may reject this metadata.
                    if (result.tp$setattr) {
                        try {
                            result.tp$setattr(new pyStr("__orig_class__"), this);
                        } catch (e) {
                            if (!(e instanceof Sk.builtin.AttributeError || e instanceof pyTypeError)) {
                                throw e;
                            }
                        }
                    }
                    return result;
                });
            },
            tp$as_sequence_or_mapping: true,
            mp$subscript(item) {
                if (this.$origin === typing.Generic) {
                    throw new pyTypeError("Cannot subscript already-subscripted Generic");
                }
                const typeArgs = this.$origin === typing.Annotated ? this.$args.v.slice(0, 1) : this.$args.v;
                const parameters = GenericAlias.$typeParameters(typeArgs);
                const args = GenericAlias.$substitute(typeArgs, parameters, item);
                if (this.$origin === typing.Annotated) {
                    args.push(...this.$args.v.slice(1));
                }
                if (this.$origin === typing.Union) {
                    return typing.Union.mp$subscript(new pyTuple(args));
                }
                return new _GenericAlias(this.$origin, new pyTuple(args), this.$name);
            },
        },
        methods: {
            __instancecheck__: {
                $meth(obj) {
                    if (this.$origin === typing.Union) {
                        return Sk.builtin.isinstance(obj, this.$args);
                    }
                    throw new pyTypeError("Subscripted generics cannot be used with class and instance checks");
                },
                $flags: { OneArg: true },
            },
            __subclasscheck__: {
                $meth(cls) {
                    if (this.$origin === typing.Union) {
                        return Sk.builtin.issubclass(cls, this.$args);
                    }
                    throw new pyTypeError("Subscripted generics cannot be used with class and instance checks");
                },
                $flags: { OneArg: true },
            },
            __mro_entries__: {
                $meth(bases) {
                    if (this.$origin && this.$origin.sk$type) {
                        return new pyTuple([this.$origin]);
                    }
                    throw new pyTypeError("Cannot subclass " + objectRepr(this));
                },
                $flags: { OneArg: true },
            },
        },
        getsets: {
            __parameters__: {
                $get() {
                    if (this.$params === null) {
                        const args = this.$origin === typing.Annotated ? this.$args.v.slice(0, 1) : this.$args.v;
                        this.$params = new pyTuple(GenericAlias.$typeParameters(args));
                    }
                    return this.$params;
                },
            },
            __origin__: {
                $get() {
                    return this.$origin === typing.Annotated ? this.$args.v[0] : this.$origin;
                },
            },
            __args__: {
                $get() {
                    return this.$origin === typing.Annotated ? new pyTuple(this.$args.v.slice(0, 1)) : this.$args;
                },
            },
            __metadata__: {
                $get() {
                    return this.$origin === typing.Annotated ? new pyTuple(this.$args.v.slice(1)) : undefined;
                },
            },
        },
    });

    function callableArgs(alias) {
        // Callable stores a flat immutable tuple; its public get_args result
        // rebuilds the parameter list on each call.
        const args = alias.$args.v;
        const first = args[0];
        if (args.length === 2 && (first === pyEllipsis || first instanceof ParamSpec ||
            first.$origin === typing.Concatenate)) {
            return alias.$args;
        }
        return new pyTuple([new pyList(args.slice(0, -1)), args[args.length - 1]]);
    }

    function literalValues(alias) {
        // Type participates in equality: Literal[True] differs from Literal[1].
        return new pyFrozenSet(alias.$args.v.map((arg) => new pyTuple([arg, arg.ob$type])));
    }

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
        const args = [];
        for (let arg of item.v) {
            arg = typeArgument(arg);
            const nested = arg instanceof pyUnionType || (arg instanceof _GenericAlias && arg.$origin === typing.Union);
            for (const member of nested ? arg.$args.v : [arg]) {
                if (!args.some((existing) => richCompareBool(existing, member, "Eq"))) {
                    args.push(member);
                }
            }
        }
        return args.length === 1 ? args[0] : new _GenericAlias(typing.Union, new pyTuple(args));
    });

    // Optional - Optional[X] is equivalent to Union[X, None]
    typing.Optional = new _SpecialForm(
        "Optional",
        "Optional type. Optional[X] is equivalent to Union[X, None].",
        (item) => {
            const noneType = pyNone.ob$type;
            const args = new pyTuple([item, noneType]);
            return typing.Union.mp$subscript(args);
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
            const args = [];
            for (const arg of item.v) {
                const members = arg.$origin === typing.Literal ? arg.$args.v : [arg];
                for (const member of members) {
                    if (!args.some((existing) => existing.ob$type === member.ob$type && richCompareBool(existing, member, "Eq"))) {
                        args.push(member);
                    }
                }
            }
            return new _GenericAlias(typing.Literal, new pyTuple(args));
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
        if (item.v[0].$origin === typing.Annotated) {
            item = new pyTuple([...item.v[0].$args.v, ...item.v.slice(1)]);
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

    function collectionAlias(name, origin, arity) {
        const alias = new _SpecialForm(name, "Collection type annotation.", (item) => {
            const args = item instanceof pyTuple ? item : new pyTuple([item]);
            if (arity !== null && args.v.length !== arity) {
                throw new pyTypeError("typing." + name + " expects " + arity + " type arguments");
            }
            return new _GenericAlias(origin, args, name);
        });
        alias.$origin = origin;
        return alias;
    }

    typing.List = collectionAlias("List", pyList, 1);
    typing.Dict = collectionAlias("Dict", pyDict, 2);
    typing.Set = collectionAlias("Set", pySet, 1);
    typing.Tuple = collectionAlias("Tuple", pyTuple, null);
    typing.FrozenSet = collectionAlias("FrozenSet", pyFrozenSet, 1);
    typing.Type = collectionAlias("Type", pyType, 1);

    // Callable - Callable[[args], return_type]
    typing.Callable = new _SpecialForm(
        "Callable",
        "Callable type; Callable[[int], str] is a function of (int) -> str.",
        (item) => {
            if (!(item instanceof pyTuple) || item.v.length !== 2) {
                throw new pyTypeError("Callable must be used as Callable[[arg_types], return_type]");
            }
            const [params, result] = item.v;
            if (params instanceof pyList || params instanceof pyTuple) {
                // Like CPython, store a flat immutable tuple; get_args rebuilds
                // the public parameter list so callers cannot mutate the alias.
                return new _GenericAlias(typing.Callable, new pyTuple([...params.v, result]), "Callable");
            }
            if (params !== pyEllipsis && !(params instanceof ParamSpec) && params.$origin !== typing.Concatenate) {
                throw new pyTypeError("Callable parameters must be a list, ellipsis or parameter specification");
            }
            return new _GenericAlias(typing.Callable, item, "Callable");
        },
    );

    // ==================== TypeVar ====================

    const TypeVar = (typing.TypeVar = buildNativeClass("typing.TypeVar", {
        constructor: function TypeVar(name, constraints, bound, covariant, contravariant) {
            this.$isTypeParameter = true;
            this.$name = name;
            this.$constraints = constraints || new pyTuple([]);
            this.$bound = bound || pyNone;
            this.$covariant = covariant || false;
            this.$contravariant = contravariant || false;
        },
        slots: {
            tp$as_number: true,
            nb$or: unionOr,
            nb$reflected_or: unionRor,
            tp$new(args, kwargs) {
                const [name, ...constraints_arr] = args;
                checkArgsLen("TypeVar", args, 1);
                if (!(name instanceof pyStr)) {
                    throw new pyTypeError("TypeVar() name must be a string");
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
                        } else if (kwargs[i] === "infer_variance" || kwargs[i] === "default") {
                            throw new Sk.builtin.NotImplementedError("TypeVar defaults and inferred variance are not supported");
                        } else {
                            throw new pyTypeError("TypeVar got an unexpected keyword argument '" + kwargs[i] + "'");
                        }
                    }
                }
                if (constraints_arr.length === 1) {
                    throw new pyTypeError("A single constraint is not allowed");
                }
                if (constraints_arr.length && bound !== pyNone) {
                    throw new pyTypeError("Constraints cannot be combined with bound");
                }
                if (covariant && contravariant) {
                    throw new Sk.builtin.ValueError("Bivariant types are not supported");
                }
                const constraints = new pyTuple(constraints_arr);
                return new TypeVar(name.toString(), constraints, bound, covariant, contravariant);
            },
            $r() {
                return new pyStr((this.$covariant ? "+" : this.$contravariant ? "-" : "~") + this.$name);
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
            __init_subclass__: {
                $meth(args, kwargs) {
                    const parent = new Sk.builtin.super_(typing.Generic, this);
                    pyCall(parent.tp$getattr(Sk.builtin.str.$initsubclass), args, kwargs);
                    const bases = this.prototype.hasOwnProperty("__orig_bases__")
                        ? this.prototype.__orig_bases__.v : this.prototype.tp$bases;
                    if (bases.includes(typing.Generic)) {
                        throw new pyTypeError("Cannot inherit from plain Generic");
                    }
                    let parameters = GenericAlias.$typeParameters(bases);
                    let declared;
                    for (const base of bases) {
                        if (base.$origin === typing.Generic) {
                            if (declared !== undefined) {
                                throw new pyTypeError("Cannot inherit from Generic multiple times");
                            }
                            declared = base.$args.v;
                        }
                    }
                    // An explicit Generic[...] defines parameter order and must
                    // include every inherited parameter (CPython _generic_init_subclass).
                    if (declared !== undefined) {
                        if (parameters.some((parameter) => !declared.includes(parameter))) {
                            throw new pyTypeError("Some type variables are not listed in Generic");
                        }
                        parameters = declared;
                    }
                    this.tp$setattr(new pyStr("__parameters__"), new pyTuple(parameters));
                    return pyNone;
                },
                $flags: { FastCall: true },
            },
            __class_getitem__: {
                $meth(item) {
                    if (!(item instanceof pyTuple)) {
                        item = new pyTuple([item]);
                    }
                    if (this === typing.Generic) {
                        if (!item.v.length || item.v.some((arg) => !arg.$isTypeParameter)) {
                            throw new pyTypeError("Parameters to Generic must be type variables");
                        }
                        if (new Set(item.v).size !== item.v.length) {
                            throw new pyTypeError("Parameters to Generic must be unique");
                        }
                    } else {
                        const parameters = this.$typeLookup(new pyStr("__parameters__"));
                        GenericAlias.$substitute(parameters.v, parameters.v, item);
                    }
                    return new _GenericAlias(this, item);
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

    function makeNamedTuple(name, fieldNames, defaults, module, annotations) {
        // Reuse collections' constructor and validation for both creation forms.
        return chainOrSuspend(
            Sk.importModule("collections", false, true),
            (collections) => pyCallOrSuspend(
                collections.$d.namedtuple, [name, new pyList(fieldNames)],
                ["defaults", new pyTuple(defaults), "module", module || pyNone]
            ),
            (klass) => {
                klass.tp$setattr(new pyStr("__annotations__"), annotations);
                return klass;
            }
        );
    }

    // NamedTupleMeta - metaclass that intercepts class creation for class-based syntax
    // Like CPython, we override __new__ (tp$new) to intercept class creation
    const NamedTupleMeta = buildNativeClass("typing.NamedTupleMeta", {
        constructor: function NamedTupleMeta() {},
        base: pyType,
        slots: {
            tp$new(args, kwargs) {
                checkNoKwargs("NamedTuple", kwargs);
                // args = [name, bases, namespace]
                if (args.length !== 3) {
                    return pyType.prototype.tp$new.call(this, args, kwargs);
                }
                const [name, bases, ns] = args;
                if (bases.v.length !== 1 || bases.v[0] !== _NamedTuple) {
                    throw new pyTypeError("NamedTuple supports only a single NamedTuple base");
                }

                // Get __annotations__ from namespace
                const annotations = ns.mp$lookup(new pyStr("__annotations__")) || new pyDict();

                // Extract field names and types
                const field_names = [];
                for (let iter = pyIter(annotations), k = iter.tp$iternext();
                     k !== undefined; k = iter.tp$iternext()) {
                    field_names.push(k);
                }

                // Extract defaults from namespace (class body assignments)
                const defaults = [];
                for (const fname of field_names) {
                    const val = ns.mp$lookup(fname);
                    if (val !== undefined) {
                        defaults.push(val);
                    } else if (defaults.length) {
                        throw new pyTypeError("Non-default namedtuple field " + fname.toString() + " cannot follow default fields");
                    }
                }

                // Get module from namespace
                const module = ns.mp$lookup(new pyStr("__module__"));

                // Retain the generated constructor while preserving class-body members.
                return chainOrSuspend(
                    makeNamedTuple(name, field_names, defaults, module, annotations),
                    (klass) => {
                        const prohibited = new Set([
                            "__new__", "__init__", "__slots__", "__getnewargs__",
                            "_fields", "_field_defaults", "_make", "_replace", "_asdict", "_source",
                        ]);
                        for (let iter = pyIter(ns), key = iter.tp$iternext(); key !== undefined; key = iter.tp$iternext()) {
                            const name = key.toString();
                            if (prohibited.has(name)) {
                                throw new Sk.builtin.AttributeError("Cannot overwrite NamedTuple attribute " + name);
                            }
                            if (annotations.mp$lookup(key) === undefined && name !== "__module__" && name !== "__annotations__" && name !== "__name__") {
                                klass.tp$setattr(key, ns.mp$subscript(key));
                            }
                        }
                        return klass;
                    }
                );
            },
        },
    });

    // Bootstrap through type.__new__, as CPython does, so empty user classes
    // still follow NamedTupleMeta's normal namedtuple construction path.
    const _NamedTuple = pyType.prototype.tp$new.call(NamedTupleMeta.prototype, [
        new pyStr("_NamedTuple"),
        new pyTuple([pyTuple]),
        new pyDict()
    ], []);
    typing._NamedTuple = _NamedTuple;

    const _NamedTupleType = buildNativeClass("typing.NamedTuple", {
        constructor: function _NamedTupleType() {},
        slots: {
            tp$call(args, kwargs) {
                // NamedTuple('Point', [('x', int), ('y', int)])
                checkNoKwargs("NamedTuple", kwargs);
                checkArgsLen("NamedTuple", args, 2, 2);
                const name = args[0];
                const fields = args[1];

                // Extract field names and types from the list of (name, type) tuples
                const field_names = [];
                const field_types = [];
                const iter = pyIter(fields);
                for (let item = iter.tp$iternext(); item !== undefined; item = iter.tp$iternext()) {
                    const pair = Sk.misceval.arrayFromIterable(item);
                    if (pair.length !== 2) {
                        throw new Sk.builtin.ValueError("NamedTuple fields must be pairs of names and types");
                    }
                    field_names.push(pair[0]);
                    field_types.push(pair[0], pair[1]);
                }

                // Build annotations dict
                const annotations = new pyDict(field_types);

                return makeNamedTuple(name, field_names, [], null, annotations);
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
    // TypedDict classes carry schema metadata, but calling one produces an
    // ordinary dict. A metaclass keeps these separate, as in CPython.
    const TypedDictMeta = buildNativeClass("typing._TypedDictMeta", {
        constructor: function TypedDictMeta() {},
        base: pyType,
        slots: {
            tp$new(args, kwargs) {
                let total = pyTrue;
                for (let i = 0; kwargs && i < kwargs.length; i += 2) {
                    if (kwargs[i] !== "total") {
                        throw new pyTypeError("TypedDict got an unexpected keyword argument '" + kwargs[i] + "'");
                    }
                    total = kwargs[i + 1];
                }
                const [name, bases, ns] = args;
                const annotations = new pyDict();
                const required = new Set();
                const optional = new Set();
                for (const base of bases.v) {
                    if (base.ob$type !== TypedDictMeta) {
                        throw new pyTypeError("cannot inherit from both a TypedDict type and a non-TypedDict base class");
                    }
                    const inherited = base.$typeLookup(new pyStr("__annotations__"));
                    for (const [key, value] of inherited.$items()) {
                        annotations.mp$ass_subscript(key, value);
                    }
                    for (const key of Sk.misceval.arrayFromIterable(base.$typeLookup(new pyStr("__required_keys__")))) {
                        required.add(key.toString());
                        optional.delete(key.toString());
                    }
                    for (const key of Sk.misceval.arrayFromIterable(base.$typeLookup(new pyStr("__optional_keys__")))) {
                        optional.add(key.toString());
                        required.delete(key.toString());
                    }
                }
                const own = ns.mp$lookup(new pyStr("__annotations__")) || new pyDict();
                for (const [key, value] of own.$items()) {
                    annotations.mp$ass_subscript(key, value);
                    const name = key.toString();
                    let qualifier = value;
                    while (qualifier.$origin === typing.Annotated) {
                        qualifier = qualifier.$args.v[0];
                    }
                    const isRequired = qualifier.$origin === typing.Required ||
                        (qualifier.$origin !== typing.NotRequired && isTrue(total));
                    if (isRequired) {
                        required.add(name);
                        optional.delete(name);
                    } else {
                        optional.add(name);
                        required.delete(name);
                    }
                }
                ns.mp$ass_subscript(new pyStr("__annotations__"), annotations);
                const origBases = new pyStr("__orig_bases__");
                if (ns.mp$lookup(origBases) === undefined) {
                    ns.mp$ass_subscript(origBases, bases);
                }
                ns.mp$ass_subscript(new pyStr("__total__"), total);
                ns.mp$ass_subscript(new pyStr("__required_keys__"), new pyFrozenSet([...required].map((key) => new pyStr(key))));
                ns.mp$ass_subscript(new pyStr("__optional_keys__"), new pyFrozenSet([...optional].map((key) => new pyStr(key))));
                return pyType.prototype.tp$new.call(this, [name, new pyTuple([pyDict]), ns], []);
            },
            tp$call(args, kwargs) {
                return pyCallOrSuspend(pyDict, args, kwargs);
            },
        },
        methods: {
            __instancecheck__: {
                $meth(obj) {
                    throw new pyTypeError("TypedDict does not support instance and class checks");
                },
                $flags: { OneArg: true },
            },
            __subclasscheck__: {
                $meth(cls) {
                    throw new pyTypeError("TypedDict does not support instance and class checks");
                },
                $flags: { OneArg: true },
            },
        },
    });

    const _TypedDict = pyCall(TypedDictMeta, [
        new pyStr("_TypedDict"), new pyTuple([]), new pyDict(),
    ]);

    const _TypedDictType = buildNativeClass("typing.TypedDict", {
        constructor: function _TypedDictType() {},
        slots: {
            tp$call(args, kwargs) {
                // TypedDict('Movie', {'name': str, 'year': int})
                checkArgsLen("TypedDict", args, 2, 2);
                const name = args[0];
                const fields = args[1]; // dict of {field_name: type}
                if (!(fields instanceof pyDict)) {
                    throw new pyTypeError("TypedDict fields must be a dict");
                }
                const ns = new pyDict([
                    new pyStr("__annotations__"), fields,
                    pyStr.$module, Sk.globals.__name__,
                    new pyStr("__orig_bases__"), new pyTuple([typing.TypedDict]),
                ]);
                return pyCallOrSuspend(TypedDictMeta, [name, new pyTuple([_TypedDict]), ns], kwargs);
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
                    return new pyTuple([_TypedDict]);
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
            this.$isTypeParameter = true;
            this.$isVariadic = true;
            this.$name = name;
            this.$args = new _ParamSpecArgs(this);
            this.$kwargs = new _ParamSpecKwargs(this);
        },
        slots: {
            tp$new(args, kwargs) {
                checkArgsLen("ParamSpec", args, 1, 1);
                if (kwargs && kwargs.length) {
                    throw new Sk.builtin.NotImplementedError("ParamSpec options are not supported");
                }
                if (!(args[0] instanceof pyStr)) {
                    throw new pyTypeError("ParamSpec() name must be a string");
                }
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
            this.$isTypeParameter = true;
            this.$isVariadic = true;
            this.$name = name;
        },
        slots: {
            tp$new(args, kwargs) {
                checkArgsLen("TypeVarTuple", args, 1, 1);
                if (kwargs && kwargs.length) {
                    throw new Sk.builtin.NotImplementedError("TypeVarTuple options are not supported");
                }
                if (!(args[0] instanceof pyStr)) {
                    throw new pyTypeError("TypeVarTuple() name must be a string");
                }
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
                if (kwargs && kwargs.length) {
                    throw new Sk.builtin.NotImplementedError("ForwardRef options are not supported");
                }
                if (!(args[0] instanceof pyStr)) {
                    throw new pyTypeError("ForwardRef() argument must be a string");
                }
                return new typing.ForwardRef(args[0].toString());
            },
            $r() {
                return new pyStr("ForwardRef(" + objectRepr(new pyStr(this.$arg)) + ")");
            },
            tp$hash() {
                return objectHash(new pyStr(this.$arg));
            },
            tp$richcompare(other, op) {
                if (!(other instanceof typing.ForwardRef) || (op !== "Eq" && op !== "NotEq")) {
                    return pyNotImplemented;
                }
                return op === "Eq" ? this.$arg === other.$arg : this.$arg !== other.$arg;
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

    // ==================== TYPE_CHECKING constant ====================
    // Always False at runtime - only True during static type checking
    typing.TYPE_CHECKING = pyFalse;

    // ==================== AnyStr TypeVar ====================
    // TypeVar constrained to str and bytes
    typing.AnyStr = new TypeVar("AnyStr", new pyTuple([pyStr, Sk.builtin.bytes]), pyNone, false, false);

    // ==================== TypeGuard ====================
    typing.TypeGuard = new _SpecialForm(
        "TypeGuard",
        "Special form for type narrowing.",
        (item) => new _GenericAlias(typing.TypeGuard, item)
    );

    // ==================== Required / NotRequired ====================
    typing.Required = new _SpecialForm(
        "Required",
        "Mark TypedDict key as required.",
        (item) => new _GenericAlias(typing.Required, item)
    );
    typing.NotRequired = new _SpecialForm(
        "NotRequired",
        "Mark TypedDict key as not required.",
        (item) => new _GenericAlias(typing.NotRequired, item)
    );

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
                if (tp === typing.Generic) {
                    return tp;
                }
                if (tp instanceof _SpecialForm && tp.$origin !== undefined) {
                    return tp.$origin;
                }
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
                    if (tp.$name === "Callable") {
                        return callableArgs(tp);
                    }
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
                throw new Sk.builtin.NotImplementedError("Structural Protocol checks are not supported");
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
        NewType: {
            $meth(name, tp) {
                if (!(name instanceof pyStr)) {
                    throw new pyTypeError("NewType() argument 1 must be a string");
                }
                return new Sk.builtin.func(function (value) {
                    checkArgsLen(name.toString(), arguments, 1, 1);
                    return value;
                });
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $doc: "Create a callable that returns its argument unchanged.",
        },
        final_$rw$: {
            $meth(func) {
                // No-op decorator
                return func;
            },
            $flags: { OneArg: true },
            $doc: "Decorator to indicate final methods and final classes.",
        },
        no_type_check: {
            $meth(func) {
                // No-op decorator
                return func;
            },
            $flags: { OneArg: true },
            $doc: "Decorator to indicate that annotations are not type hints.",
        },
        no_type_check_decorator: {
            $meth(func) {
                // No-op decorator
                return func;
            },
            $flags: { OneArg: true },
            $doc: "Decorator to give another decorator the @no_type_check effect.",
        },
        get_type_hints: {
            $meth(args, kwargs) {
                checkArgsLen("get_type_hints", args, 1, 3);
                throw new Sk.builtin.NotImplementedError("get_type_hints evaluation is not supported; use __annotations__ directly");
            },
            $flags: { FastCall: true },
            $doc: "Return type hints for an object.",
        },
        assert_never: {
            $meth(arg) {
                throw new pyTypeError("Expected code to be unreachable");
            },
            $flags: { OneArg: true },
            $doc: "Statically assert that a line of code is unreachable.",
        },
        assert_type: {
            $meth(val, typ) {
                // Returns the value unchanged at runtime
                return val;
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $doc: "Assert (to the type checker) that the value is of the given type.",
        },
        reveal_type: {
            $meth(obj) {
                // Just return the object at runtime
                return obj;
            },
            $flags: { OneArg: true },
            $doc: "Reveal the inferred type of a value.",
        },
        is_typeddict: {
            $meth(tp) {
                return tp.ob$type === TypedDictMeta ? pyTrue : pyFalse;
            },
            $flags: { OneArg: true },
            $doc: "Check if a class is a TypedDict.",
        },
    });

    // ==================== Module metadata ====================

    typing.__name__ = new pyStr("typing");
    typing.__doc__ = new pyStr(
        "Support for type hints.\n\n" +
            "Annotation support for common collection aliases, TypeVar/Generic,\n" +
            "NamedTuple and TypedDict schemas. Uses the Python 3.13 split between\n" +
            "typing.Union and types.UnionType. Full hint evaluation, structural\n" +
            "Protocol checks and parameter-pack substitution are not implemented.",
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
            "TYPE_CHECKING",
            "NewType",
            "final",
            "no_type_check",
            "no_type_check_decorator",
            "AnyStr",
            "get_type_hints",
            "TypeGuard",
            "Required",
            "NotRequired",
            "assert_never",
            "assert_type",
            "reveal_type",
            "is_typeddict",
        ].map((x) => new pyStr(x)),
    );

    // Compatibility exports used by annotation consumers, including Anvil.
    typing._SpecialForm = _SpecialForm;
    typing._GenericAlias = _GenericAlias;


    return typing;
}
