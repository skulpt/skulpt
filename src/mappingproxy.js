/**
 *
 * @namespace Sk.builtin
 *
 * @constructor
 *
 * @param {Object} d
 *
 */

Sk.builtin.mappingproxy = Sk.abstr.buildNativeClass("mappingproxy", {
    constructor: function (d) {
        if (d === undefined) {
            d = {};
        }

        if (!(this instanceof Sk.builtin.mappingproxy)) {
            return new Sk.builtin.mappingproxy(d);
        }
        // mappingproxy's v is a javascript object
        this.v = Object.create(null);

        // might be passed a dict but dict may not have been implemented yet!
        if (Sk.abstr.typeName(d) === "dict") {
            let k, it;
            for (it = d.tp$iter(), k = it.tp$iternext(); k !== undefined; k = it.tp$iternext()) {
                let v = d.mp$subscript(k);
                if (v === undefined) {
                    v = null;
                }
                this.v[k.$jsstr()] = v;
            }
        } else {
            let d_copy = { ...d };
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
        $tp$as_sequence_or_mapping: true,
        $r: function () {
            let repr = [];
            for (let k in this.v) {
                repr.push("'" + k + "' : " + Sk.misceval.objectRepr(this.v[k]).$jsstr());
            }
            repr = "mappingproxy({" + repr.join(", ") + "}";
            return new Sk.builtin.str(repr);
        },
        mp$lookup: function (key) {
            if (typeof key === "string") {
                return this.v[Sk.unfixReserved(key)];
            } else if (key instanceof Sk.builtin.str) {
                return this.v[key.$jsstr()];
            } else {
                return undefined;
            }
        },
        mp$subscript: function (key) {
            Sk.builtin.pyCheckArgsLen("[]", arguments.length, 1, 2, false, false);
            var s;
            var res = this.mp$lookup(key);

            if (res !== undefined) {
                // Found in dictionary
                return res;
            } else {
                // Not found in dictionary
                s = new Sk.builtin.str(key);
                throw new Sk.builtin.KeyError(s.v);
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
        sk$asarray: function () {
            return Object.keys(this.v).map((x) => new Sk.builtin.str(x));
        },
        keys: Sk.builtin.dict.prototype.keys,
        items: Sk.builtin.dict.prototype.items,
        values: Sk.builtin.dict.prototype.values,
    },
});

Sk.exportSymbol("Sk.builtin.mappingproxy", Sk.builtin.mappingproxy);
