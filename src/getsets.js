/**
 * @constructor
 * @param {Sk.builtin.type} type_obj
 * @param {Sk.GetSetDef} gsd
 */

Sk.builtin.getset_descriptor = function (type_obj, gsd) {
    this.d$type = type_obj;
    this.d$name = gsd._name;
    this.d$getset = gsd;
};

Sk.abstr.setUpInheritance("getset_descriptor", Sk.builtin.getset_descriptor, Sk.builtin.object);

Sk.builtin.getset_descriptor.prototype.tp$descr_get = function (obj, type) {
    if (Sk.builtin.checkNone(obj)) {
        return this;
    } else if (!(Sk.builtin.issubclass(obj.ob$type, this.d$type))) {
        throw new Sk.builtin.TypeError("descriptor '"+ this.d$name + "' for '"+ this.d$type.prototype.tp$name + "' object doesn't apply to a '" + Sk.abstr.typeName(obj) + "' object");
    } 

    if (this.d$getset && this.d$getset.get !== undefined) {
        return this.d$getset.get.call(obj, this.d$getset.closure);
    }

    throw new Sk.builtin.AttributeError("getset_descriptor '"+ this.d$name +"' of '" + this.d$type.prototype.tp$name + "' objects is not readable");
};


Sk.builtin.getset_descriptor.prototype.tp$descr_set = function (obj, value) {
    if (!(Sk.builtin.issubclass(obj.ob$type, this.d$type))) {
        throw new Sk.builtin.TypeError("descriptor '"+ this.d$name + "' for '"+ this.d$type.prototype.tp$name + "' object doesn't apply to a '" + Sk.abstr.typeName(obj) + "' object");
    } else if (this.d$getset.set !== undefined){
        return this.d$getset.set.call(obj, value, this.d$getset.closure);
    }
    throw new Sk.builtin.AttributeError("getset_descriptor '"+ this.d$name +"' of '" + this.d$type.prototype.tp$name + "' objects is not writeable");
};

Sk.builtin.getset_descriptor.prototype.$r = function () {
    return new Sk.builtin.str("<getset_descriptor '"+ this.d$name +"' of '"+ this.d$type.prototype.tp$name+"' objects>");
};

Sk.builtin.getset_descriptor.prototype.tp$getsets = [
    new Sk.GetSetDef("__doc__", function () {
        return this.d$getset.doc ? new Sk.builtin.str(this.d$getset.doc) : Sk.builtin.none.none$;
    }),
    new Sk.GetSetDef("__objclass__", function () {
        return this.d$type;
    }),
    new Sk.GetSetDef("__name__", function () {
        return new Sk.builtin.str(this.d$name);
    })
];
