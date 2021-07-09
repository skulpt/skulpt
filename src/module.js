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
            if (ret !== undefined) {
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
                // modules in skulpt have a $d as a js object so just return it as a mapping proxy;
                // TODO we should really have a dict object
                return new Sk.builtin.mappingproxy(this.$d);
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
        init$dict(name, doc) {
            this.$d.__name__ = name;
            this.$d.__doc__ = doc;
            this.$d.__package__ = Sk.builtin.none.none$;
            this.$d.__spec__ = Sk.builtin.none.none$;
            this.$d.__loader__ = Sk.builtin.none.none$;
        },
        sk$attrError() {
            const name = this.get$name();
            return name === undefined ? "module" : "module " + name;
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
