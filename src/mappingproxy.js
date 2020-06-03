/**
 *
 * @namespace Sk.builtin
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
 */

Sk.builtin.mappingproxy = Sk.abstr.buildNativeClass("mappingproxy", {
    constructor: function mappingproxy (d) {
        Sk.asserts.assert(this instanceof Sk.builtin.mappingproxy, "bad call to mapping proxy, use 'new'");
        if (d === undefined) {
            d = {};
        }
        // mappingproxy's v is a javascript object
        this.v = Object.create(null);
        // might be passed a dict but dict may not have been implemented yet!
        if (d instanceof Sk.builtin.dict) {
            for (let it = d.tp$iter(), k = it.tp$iternext(); k !== undefined; k = it.tp$iternext()) {
                let v = d.mp$subscript(k);
                this.v[k.$jsstr()] = v;
            }
        } else {
            let d_copy = { ...d }; // we make a shallow copy in order to ignore inherited attibutes from the prototype
            delete d_copy["constructor"];

            if (d === Sk.builtin.type.prototype) {
                delete d_copy["call"];
                delete d_copy["apply"];
            }

            for (let key in d_copy) {
                let k = Sk.unfixReserved(key);
                if (!k.includes("$")) {
                    this.v[k] = d_copy[key];
                }
            }

            return this;
        }
    },
    slots: {
        tp$as_sequence_or_mapping: true,
        tp$hash: Sk.builtin.none.none$,
        $r: function () {
            const bits = [];
            for (let k in this.v) {
                bits.push("'" + k + "' : " + Sk.misceval.objectRepr(this.v[k]).$jsstr());
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
            const res = this.mp$lookup(key);
            return res !== undefined;
        },
        sq$length: function () {
            return Object.keys(this.v).length;
        },
        tp$iter: function () {
            return new Sk.builtin.dict_iter_(this);
        },
    },
    proto: {
        mp$lookup: function (key) {
            if (typeof key === "string") {
                return this.v[Sk.unfixReserved(key)];
            } else if (Sk.builtin.checkString(key)) {
                return this.v[key.$jsstr()];
            } else {
                return undefined;
            }
        },
        sk$asarray: function () {
            return Object.keys(this.v).map((x) => new Sk.builtin.str(x));
        },
        get$size: function() {
            // useful for using dict key iterators
            return this.sq$length();
        },
        keys: Sk.builtin.dict.prototype.keys,
        items: Sk.builtin.dict.prototype.items,
        values: Sk.builtin.dict.prototype.values,
    },
    flags: {
        sk$acceptable_as_base_type: false,
    },
});

Sk.exportSymbol("Sk.builtin.mappingproxy", Sk.builtin.mappingproxy);


