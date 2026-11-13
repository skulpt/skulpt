/**
 * @constructor
 * @extends {Sk.builtin.object}
 */
Sk.builtin.module = Sk.abstr.buildNativeClass("module", {
    constructor: function module_() {
        this.$d = {}; // set this now - we could subclass from Module so override sk$klass $d object
    },
    slots: {
        tp$doc: "Create a module object.\n\nThe name must be a string; the optional doc argument can have any type.",
        tp$getattr(pyName, canSuspend) {
            const jsMangled = pyName.$mangled;
            const ret = this.$d[jsMangled];
            if (ret !== undefined && jsMangled !== "__dict__") {
                return ret;
            }
            // technically this is the wrong way round but its seems performance wise better
            // to just return the module elements before checking for descriptors
            const descr = this.ob$type.$typeLookup(pyName);
            if (descr !== undefined) {
                const f = descr.tp$descr_get;
                if (f) {
                    return f.call(descr, this, this.ob$type, canSuspend);
                }
                return descr;
            }
            // ok we've failed to find anything check if there is __getattr__ defined as per pep 562
            const getattr = this.$d.__getattr__;
            if (getattr !== undefined) {
                const res  = Sk.misceval.tryCatch(
                    () => Sk.misceval.callsimOrSuspendArray(getattr, [pyName]),
                    (e) => {
                        if (e instanceof Sk.builtin.AttributeError) {
                            return;
                        }
                        throw e;
                    }
                );
                return canSuspend ? res : Sk.misceval.retryOptionalSuspensionOrThrow(res);
            }
        },
        tp$setattr: Sk.generic.setAttr,
        tp$new: Sk.generic.new,
        tp$init(args, kwargs) {
            const [name, doc] = Sk.abstr.copyKeywordsToNamedArgs("module", ["name", "doc"], args, kwargs, [Sk.builtin.none.none$]);
            Sk.builtin.pyCheckType("module", "string", name);
            this.init$dict(name, doc);
        },
        $r() {
            let name = this.get$name();
            if (name !== undefined) {
                const module_reprf = this.get$mod_reprf();
                if (module_reprf !== undefined) {
                    return Sk.misceval.callsimOrSuspendArray(module_reprf, [this]);
                }
            }
            name = name === undefined ? "'?'" : name;
            let extra = this.from$file();
            extra = extra === undefined ? this.empty_or$loader() : extra;
            return new Sk.builtin.str("<module " + name + extra + ">");
        },
    },
    getsets: {
        __dict__: {
            $get() {
                const namespace = this.$d;
                let dict = moduleDictViews.get(namespace);
                if (dict === undefined) {
                    dict = new ModuleDict(namespace);
                    moduleDictViews.set(namespace, dict);
                }
                return dict;
            },
        },
    },
    methods: {
        __dir__: {
            $meth() {
                // could be cleaner but this is inline with cpython's version
                const dict = this.tp$getattr(Sk.builtin.str.$dict);
                if (!Sk.builtin.checkMapping(dict)) {
                    throw new Sk.builtin.TypeError("__dict__ is not a dictionary");
                }
                const dirfunc = dict.mp$lookup(Sk.builtin.str.$dir);
                if (dirfunc !== undefined) {
                    return Sk.misceval.callsimOrSuspendArray(dirfunc, []);
                } else {
                    return new Sk.builtin.list(Sk.misceval.arrayFromIterable(dict));
                }
            },
            $flags: { NoArgs: true },
            $doc: "__dir__() -> list\nspecialized dir() implementation",
        },
    },
    proto: {
        sk$hasDict: true, // for reassigning __class__
        init$dict(name, doc) {
            this.$d.__name__ = name;
            this.$d.__doc__ = doc;
            this.$d.__package__ = Sk.builtin.none.none$;
            this.$d.__spec__ = Sk.builtin.none.none$;
            this.$d.__loader__ = Sk.builtin.none.none$;
        },
        sk$attrError() {
            let name = this.get$name();
            name = name === undefined ? "module" : "module " + name;
            if (this.$initializing) {
                name = "(most likely due to a circular import) partially initialized " + name;
            }
            return name;
        },
        get$name() {
            const name = this.tp$getattr(Sk.builtin.str.$name);
            return name && Sk.misceval.objectRepr(name);
        },
        from$file() {
            const file = this.tp$getattr(Sk.builtin.str.$file);
            return file && " from " + Sk.misceval.objectRepr(file);
        },
        empty_or$loader() {
            if (this.$js && this.$js.includes("$builtinmodule")) {
                return " (built-in)";
            }
            const loader = this.tp$getattr(Sk.builtin.str.$loader);
            return loader === undefined || Sk.builtin.checkNone(loader) ? "" : " (" + Sk.misceval.objectRepr(loader) + ")";
        },
        get$mod_reprf() {
            const loader = this.tp$getattr(Sk.builtin.str.$loader);
            return loader && loader.tp$getattr(this.str$mod_repr);
        },
        str$mod_repr: new Sk.builtin.str("module_repr"),
    },
});

Sk.exportSymbol("Sk.builtin.module", Sk.builtin.module);

// Replacing a module's $d gives it a view of the new namespace.
const moduleDictViews = new WeakMap();

function readNamespaceEntry(namespace, name) {
    if (!Object.prototype.propertyIsEnumerable.call(namespace, name)) {
        return;
    }
    // Native code uses the same property spelling as compiled Python.
    if (Sk.fixReserved(Sk.unfixReserved(name)) !== name) {
        return;
    }
    const value = namespace[name];
    // Native modules can keep private JS helpers beside Python values.
    if (name[0] !== "$" || (value != null && value.sk$object === true)) {
        return value;
    }
}

function deleteNamespaceEntry(namespace, name) {
    if (!Reflect.deleteProperty(namespace, name)) {
        throw new Sk.builtin.TypeError("cannot delete module namespace entry '" + Sk.unfixReserved(name) + "'");
    }
}

const ModuleDict = Sk.abstr.buildNativeClass("module_dict", {
    base: Sk.builtin.dict,
    constructor: function moduleDict(namespace) {
        Sk.builtin.dict.call(this);
        this.$namespace = namespace;
    },
    slots: {
        tp$new() {
            throw new Sk.builtin.TypeError("cannot create 'module_dict' instances");
        },
    },
    classmethods: {
        fromkeys: {
            $meth(keys, value) {
                // The result is an ordinary dict, independent of the module namespace.
                return Sk.builtin.dict.prototype.fromkeys.$meth.call(Sk.builtin.dict, keys, value);
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
        },
    },
    proto: {
        sk$toNamespace() {
            return this.$namespace;
        },
        get$size() {
            // Count on demand so writes through any JS reference stay visible.
            const namespace = this.$namespace;
            let size = 0;
            for (const name of Object.keys(namespace)) {
                if (readNamespaceEntry(namespace, name) !== undefined) {
                    size++;
                }
            }
            return size;
        },
        quick$lookup(key) {
            // Literal reserved-name suffixes cannot be represented in the JS namespace.
            if (Sk.unfixReserved(key.v) === key.v) {
                return readNamespaceEntry(this.$namespace, key.$mangled);
            }
        },
        mp$lookup(key) {
            if (Sk.builtin.checkString(key)) {
                return this.quick$lookup(key);
            }
            Sk.abstr.objectHash(key);
        },
        dict$setItem(key, value) {
            if (!Sk.builtin.checkString(key)) {
                throw new Sk.builtin.TypeError("module namespace keys must be strings");
            }
            if (Sk.unfixReserved(key.v) !== key.v) {
                throw new Sk.builtin.ValueError("module namespace keys cannot end with '_$rw$'");
            }
            const namespace = this.$namespace;
            const name = key.$mangled;
            let written;
            if (Object.prototype.hasOwnProperty.call(namespace, name)) {
                written = Reflect.set(namespace, name, value);
            } else {
                // Native namespace proxies can forward attribute writes to another module.
                // A new dictionary key belongs to this module.
                written = Reflect.defineProperty(namespace, name, {
                    value, enumerable: true, writable: true, configurable: true,
                });
            }
            if (!written) {
                throw new Sk.builtin.TypeError("cannot write module namespace entry '" + key.v + "'");
            }
        },
        pop$item(key) {
            const value = this.mp$lookup(key);
            if (value !== undefined) {
                deleteNamespaceEntry(this.$namespace, key.$mangled);
                return [key, value];
            }
        },
        dict$clear() {
            for (const name of Object.keys(this.$namespace)) {
                if (readNamespaceEntry(this.$namespace, name) !== undefined) {
                    deleteNamespaceEntry(this.$namespace, name);
                }
            }
        },
        dict$copy() {
            return new Sk.builtin.dict(this.$items().flat());
        },
        $items() {
            const namespace = this.$namespace;
            const entries = [];
            for (const name of Object.keys(namespace)) {
                const value = readNamespaceEntry(namespace, name);
                if (value !== undefined) {
                    entries.push([new Sk.builtin.str(Sk.unfixReserved(name)), value]);
                }
            }
            return entries;
        },
    },
    flags: { sk$unacceptableBase: true },
});
