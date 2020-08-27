/**
 * @constructor
 * @extends {Sk.builtin.object}
 */
Sk.builtin.module = Sk.abstr.buildNativeClass("module", {
    constructor: function module_ () {
        this.$d = {};
    },
    slots: {
        tp$doc: "Create a module object.\n\nThe name must be a string; the optional doc argument can have any type.",
        tp$getattr: function (pyName, canSuspend) {
            var jsMangled = pyName.$mangled;
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
                const res = Sk.misceval.callsimOrSuspendArray(getattr, [pyName]);
                return canSuspend ? res : Sk.misceval.retryOptionalSuspensionOrThrow(res);
            }
        },
        tp$setattr: Sk.generic.setAttr,
        tp$new: Sk.generic.new,
        tp$init: function(args, kwargs) {
            const [name, doc] = Sk.abstr.copyKeywordsToNamedArgs("module", ["name", "doc"], args, kwargs, [Sk.builtin.none.none$]);
            Sk.builtin.pyCheckType("module", "string", name);
            if (this.$d === undefined) {
                this.$d = {};
            }
            this.init$dict(name, doc);
            return Sk.builtin.none.none$;
        },
        $r: function () {
            let get = (s) => {
                let v = this.tp$getattr(new Sk.builtin.str(s));
                return Sk.misceval.objectRepr(v || Sk.builtin.str.$emptystr);
            };
            const _name = get("__name__");
            let _file = get("__file__");
            if (_file !== "''") {
                _file = " from " + _file;
            } else {
                _file = "";
            }
            return new Sk.builtin.str("<module " + _name +  _file + ">");
        }
    },
    getsets: {
        __dict__: {
            $get: function () {
                // modules in skulpt have a $d as a js object so just return it as a mapping proxy;
                // TODO we should really have a dict object 
                return new Sk.builtin.mappingproxy(this.$d);
            }
        }
    },
    methods: {
        __dir__: {
            $meth: function () {
                // could be cleaner but this is inline with cpython's version
                const dict = this.tp$getattr(Sk.builtin.str.$dict);
                if (dict !== undefined) {
                    if (!Sk.builtin.checkMapping(dict)) {
                        throw new Sk.builtin.TypeError("__dict__ is not a dictionary");
                    }
                    const dirfunc = dict.mp$lookup(Sk.builtin.str.$dir);
                    if (dirfunc !== undefined) {
                        res = Sk.misceval.callsimOrSuspendArray(dirfunc, []);
                    } else {
                        res = new Sk.builtin.list(Sk.misceval.arrayFromIterable(dict));
                    }
                    return res;
                }
            },
            $flags: {NoArgs: true},
            $doc: "__dir__() -> list\nspecialized dir() implementation",
        }
    },
    proto: {
        init$dict: function(name, doc) {
            this.$d.__name__ = name;
            this.$d.__doc__ = doc;
            this.$d.__package__ = Sk.builtin.none.none$;
            // this.$d.__spec__ = Sk.builtin.none.none$;
            // this.$d.__loader__ = Sk.builtin.none.none$;
        }
    }
});

Sk.exportSymbol("Sk.builtin.module", Sk.builtin.module);
