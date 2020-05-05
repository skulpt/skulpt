/**
 * @constructor
 * @param {String} _name
 * @param {Function} get
 * @param {Function} set 
 * @param {String} doc
 * @param {closure} 
 */

Sk.builtin.getset_descriptor = function (type_obj, gsd) {
    this.d_type = type_obj;
    this.d_name = gsd._name;
    this.d_getset = gsd;
};

Sk.builtin.getset_descriptor.prototype.tp$descr_get = function (obj, type) {
    if (Sk.builtin.checkNone(obj)) {
        return this;
    } else if (obj.ob$type !== this.d_type) {
        throw new Sk.builtin.TypeError("descriptor '"+ this.d_name + "' for '"+ this.d_type.prototype.tp$name + "' object doesn't apply to a '" + Sk.abstr.typeName(obj) + "' object");
    } 

    if (this.d_getset && this.d_getset.get !== undefined) {
        return this.d_getset.get(obj, this.d_getset.closure);
    }

    throw new Sk.builtin.AttributeError("getset_descriptor '"+ this.d_name +"' of '" + this.d_type.prototype.tp$name + "' objects is not readable");
};


Sk.builtin.getset_descriptor.prototype.tp$descr_set = function (obj, value) {
    if (obj.ob$type !== this.d_type) {
        throw new Sk.builtin.TypeError("descriptor '"+ this.d_name + "' for '"+ this.d_type.prototype.tp$name + "' object doesn't apply to a '" + Sk.abstr.typeName(obj) + "' object");
    } else if (this.d_getset.set !== undefined){
        return descr.d_getset.set(obj, value, descr.d_getset.closure);
    }
    throw new Sk.builtin.AttributeError("attribute '"+ this.d_name +"' of '" + this.d_type.prototype.tp$name + "' objects is not writeable");
};

Sk.builtin.getset_descriptor.prototype.$r = function () {
    return new Sk.builtin.str("<attribute '"+ this.d_name +"' of '"+ this.d_type.prototype.tp$name+"' objects>")
};

Sk.builtin.getset_descriptor.prototype.tp$getsets = [
    new Sk.GetSetDef("__doc__", function () {
        return this.d_getset.doc ? new Sk.builtin.str(this.d_getset.doc) : Sk.builtin.none.$none;
    }),
    new Sk.GetSetDef("__objclass__", function () {
        return this.d_type;
    }),
    new Sk.GetSetDef("__name__", function () {
        return this.d_name;
    })
]