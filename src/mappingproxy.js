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
 * In Python this can technically be called with a dict
 * but we don't implement this feature. If you tried to call this in Skulpt
 * You would get an error because object's new property won't allow any arguments
 * 
 * Technically we can also have any hashable item as a key - we also ignore this implementation detail
 *
 */
Sk.builtin.mappingproxy = Sk.abstr.buildNativeClass("mappingproxy", {
    constructor: function mappingproxy(d) {
        Sk.asserts.assert(this instanceof Sk.builtin.mappingproxy, "bad call to mapping proxy, use 'new'");
        this.mapping = Object.create(null); // create from null to avoid name conflicts or prototype issues
        d = d || {};
        const d_copy = { ...d }; // we make a shallow copy in order to ignore inherited attributes from the prototype
        delete d_copy["constructor"];
        if (d === Sk.builtin.type.prototype) {
            delete d_copy["call"]; // we added these on type's prototype to allow type objects to be callable
            delete d_copy["apply"];
        }
        this.size = 0;
        for (let key in d_copy) {
            const k = Sk.unfixReserved(key);
            if (!k.includes("$")) {
                this.mapping[k] = d_copy[key];
                this.size++;
            }
        }
    },
    slots: {
        tp$as_sequence_or_mapping: true,
        tp$hash: Sk.builtin.none.none$,
        $r: function () {
            const bits = [];
            for (let k in this.mapping) {
                bits.push("'" + k + "': " + Sk.misceval.objectRepr(this.mapping[k]).$jsstr());
            }
            const repr = "mappingproxy({" + bits.join(", ") + "}";
            return new Sk.builtin.str(repr);
        },
        mp$subscript: function (key) {
            const res = this.mp$lookup(key);
            if (res !== undefined) {
                return res;
            } else {
                throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(key).$jsstr());
            }
        },
        sq$contains: function (key) {
            return this.mp$lookup(key) !== undefined;
        },
        sq$length: function () {
            return this.get$size();
        },
        tp$iter: function () {
            return new Sk.builtin.dict_iter_(this);
        },
    },
    methods: {
        get: Sk.builtin.dict.prototype.get.d$def, // just use the descriptor defn for get
        keys: Sk.builtin.dict.prototype.keys.d$def,
        items: Sk.builtin.dict.prototype.items.d$def,
        values: Sk.builtin.dict.prototype.values.d$def,
    },
    proto: {
        mp$lookup: function (key) {
            if (Sk.builtin.checkString(key)) {
                return this.mapping[key.$jsstr()];
            } else {
                return undefined;
            }
        },
        sk$asarray: function () {
            return Object.keys(this.mapping).map((key) => new Sk.builtin.str(key));
        },
        get$size: function () {
            // useful for using dict key iterators
            return this.size;
        },
    },
    flags: {
        sk$acceptable_as_base_type: false,
    },
});

Sk.exportSymbol("Sk.builtin.mappingproxy", Sk.builtin.mappingproxy);
