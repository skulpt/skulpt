/**
 *
 * @constructor
 *
 * @param {Object} d
 *
 * @description
 * This should be called with the prototype of a type object
 * It returns a mapping proxy
 * useful for when we do typeobject.__dict__
 * or module.__dict__ since a module $d is an object literal
 *
 * Internally this should be called with an object literal
 * from python this can be called with a dict instance (or @todo other mapping type)
 *
 * For internal object literals we create a dict object whose internal representation of
 * this.entries is created on the fly (when requested)
 *
 * We could potentially memoise the entries for static objects (builtin types @todo)
 * The problem with memoising for all type objects is that the mappingproxy
 * is a live view of the mapping rather than a static copy
 *
 * ```python
 * >>> x = A.__dict__
 * >>> A.foo = 'bar'
 * >>> x['foo']
 * 'bar'
 * ```
 *
 */
Sk.builtin.mappingproxy = Sk.abstr.buildNativeClass("mappingproxy", {
    constructor: function mappingproxy(d) {
        Sk.asserts.assert(this instanceof Sk.builtin.mappingproxy, "bad call to mapping proxy, use 'new'");
        this.mapping = new Sk.builtin.dict([]);
        if (d !== undefined) {
            // internal call so d is an object literal
            // adust this.mapping.entries to be a custom getter
            // allowing support for dynamic object literals
            customEntriesGetter(this.mapping, d);
        }
    },
    slots: {
        tp$getattr: Sk.generic.getAttr,
        tp$as_sequence_or_mapping: true,
        tp$hash: Sk.builtin.none.none$,
        tp$new(args, kwargs) {
            Sk.abstr.checkNoKwargs("mappingproxy", kwargs);
            Sk.abstr.checkOneArg("mappingproxy", args, kwargs);
            const mapping = args[0];
            if (!Sk.builtin.checkMapping(mapping)) {
                throw new Sk.builtin.TypeError("mappingproxy() argument must be a mapping, not " + Sk.abstr.typeName(mapping));
            }
            const mp = new Sk.builtin.mappingproxy();
            mp.mapping = mapping;
            return mp;
        },
        tp$richcompare(other, op) {
            return Sk.misceval.richCompareBool(this.mapping, other, op);
        },
        tp$str() {
            return this.mapping.tp$str();
        },
        $r() {
            return new Sk.builtin.str("mappingproxy(" + Sk.misceval.objectRepr(this.mapping) + ")");
        },
        mp$subscript(key, canSuspend) {
            return this.mapping.mp$subscript(key, canSuspend);
        },
        sq$contains(key) {
            return this.mapping.sq$contains(key);
        },
        sq$length() {
            return this.mapping.sq$length();
        },
        tp$iter() {
            return this.mapping.tp$iter();
        },
        tp$as_number: true,
        nb$or(other) {
            if (other instanceof Sk.builtin.mappingproxy) {
                other = other.mapping;
            }
            return Sk.abstr.numberBinOp(this.mapping, other, "BitOr");
        },
        nb$reflected_or(other) {
            if (other instanceof Sk.builtin.mappingproxy) {
                other = other.mapping;
            }
            return Sk.abstr.numberBinOp(other, this.mapping, "BitOr");
        },
        nb$inplace_or(other) {
            throw new Sk.builtin.TypeError("'|=' is not supported by " + Sk.abstr.typeName(this) + "; use '|' instead");
        },
    },
    methods: {
        get: {
            $meth(args, kwargs) {
                return Sk.misceval.callsimArray(this.mapping.tp$getattr(this.str$get), args, kwargs);
            },
            $flags: { FastCall: true },
            $textsig: null,
            $doc: "D.get(k[,d]) -> D[k] if k in D, else d.  d defaults to None.",
        },
        keys: {
            $meth() {
                return Sk.misceval.callsimArray(this.mapping.tp$getattr(this.str$keys), []);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.keys() -> a set-like object providing a view on D's keys",
        },
        items: {
            $meth() {
                return Sk.misceval.callsimArray(this.mapping.tp$getattr(this.str$items), []);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.items() -> a set-like object providing a view on D's items",
        },
        values: {
            $meth() {
                return Sk.misceval.callsimArray(this.mapping.tp$getattr(this.str$values), []);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.values() -> a set-like object providing a view on D's values",
        },
        copy: {
            $meth() {
                return Sk.misceval.callsimArray(this.mapping.tp$getattr(this.str$copy), []);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.copy() -> a shallow copy of D",
        },
    },
    proto: {
        str$get: new Sk.builtin.str("get"),
        str$copy: new Sk.builtin.str("copy"),
        str$keys: new Sk.builtin.str("keys"),
        str$items: new Sk.builtin.str("items"),
        str$values: new Sk.builtin.str("values"),
        mp$lookup(key) {
            return this.mapping.mp$lookup(key);
        },
    },
    flags: {
        sk$acceptable_as_base_class: false,
    },
});

function customEntriesGetter(mapping, d) {
    Object.defineProperties(mapping, {
        entries: {
            get: () => {
                const entries = Object.create(null);
                Object.entries(d).forEach(([key, val]) => {
                    key = Sk.unfixReserved(key);
                    if (!key.includes("$")) {
                        key = new Sk.builtin.str(key);
                        entries[key.$savedKeyHash] = [key, val];
                    }
                });
                return entries;
            },
            configurable: true,
        },
        size: {
            get: () => {
                return Object.keys(d)
                    .map((k) => Sk.unfixReserved(k))
                    .filter((k) => !k.includes("$")).length;
            },
            configurable: true,
        },
    });
}
