/**
 * 
 * @namespace Sk.builtin
 *
 * @constructor
 *
 * @param {Object} d
 * 
 */

Sk.builtin.mappingproxy = function (d) {
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
        d = {...d};
        delete d["constructor"];

        for (let key in d) {
            let k = Sk.unfixReserved(key);
            if (!(k.includes("$"))) {
                this.v[k] = d[key];
            }
        };

        if (this === Sk.builtin.type.prototype) {
            delete this.v["call"];
            delete this.v["apply"];
        }

        return this;
    }
};

Sk.exportSymbol("Sk.builtin.mappingproxy", Sk.builtin.mappingproxy);
Sk.abstr.setUpInheritance("mappingproxy", Sk.builtin.mappingproxy, Sk.builtin.object);


Sk.builtin.mappingproxy.prototype["$r"] = function () {
    let repr = [];
    for (let k in this.v) {
        repr.push("'" + k + "' : " + Sk.misceval.objectRepr(this.v[k]).$jsstr());
    }
    repr = "mappingproxy({" + repr.join(", ") + "}";
    return new Sk.builtin.str(repr);
};



// Perform dictionary lookup, either return value or undefined if key not in dictionary
Sk.builtin.mappingproxy.prototype.mp$lookup = function (key) {
    if (typeof key === "string") {
        return this.v[Sk.unfixReserved(key)];
    } else if (key instanceof Sk.builtin.str) {
        return this.v[key.$jsstr()];
    } else {
        return undefined;
    }
};

Sk.builtin.mappingproxy.prototype.mp$subscript = function (key) {
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
};

Sk.builtin.mappingproxy.prototype.sq$contains = function (key) {
    const res = this.mp$lookup(key);
    return (res !== undefined);
};


Sk.builtin.mappingproxy.prototype.mp$length = function () {
    return Object.keys(this.v).length;
};


Sk.builtin.mappingproxy.prototype.$allkeys = function () {
    return Object.keys(this.v).map(x  => new Sk.builtin.str(x));
};

Sk.builtin.mappingproxy.prototype.tp$iter = function () {
    return new Sk.builtin.dict_iter_(this);
};