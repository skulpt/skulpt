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



/**
 * @constructor
 * @param {Sk.builtin.func} fget
 * @param {Sk.builtin.func} fset
 * @param {Sk.builtin.func} fdel
 * @param {Sk.builtin.str || String} doc
 */

Sk.builtin.property = function (fget, fset, fdel, doc) {
    this.prop$get = fget || Sk.builtin.none.none$;
    this.prop$set = fset || Sk.builtin.none.none$;
    this.prop$del = fdel || Sk.builtin.none.none$;
    if (doc !== undefined) {
        this.prop$doc = doc;
    } else if (fget && fget.f$doc) {
        this.prop$doc = fget.f$doc;
    } else {
        this.prop$doc = Sk.builtin.none.none$;
    }
};

Sk.abstr.setUpInheritance("property", Sk.builtin.property, Sk.builtin.object);


Sk.builtin.property.prototype.tp$new = Sk.builtin.genericNew;

Sk.builtin.property.prototype.tp$init = function (args, kwargs) {
    args.unshift(this);
    return Sk.builtin.property.prototype.__init__.tp$call(args, kwargs);
};

Sk.builtin.property.prototype.__init__ = function (self, fget, fset, fdel, doc) {
    self.prop$get = fget;
    self.prop$set = fset;
    self.prop$del = fdel;
    self.prop$doc = doc;
    return Sk.builtin.none.none$;
};

Sk.builtin.property.prototype.__init__.$defaults = [Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.none.none$];
Sk.builtin.property.prototype.__init__.co_varnames = ['self', 'fget', 'fset', 'fdel', 'doc'];


Sk.builtin.property.prototype.tp$doc = "Property attribute.\n\n  fget\n    function to be used for getting an attribute value\n  fset\n    function to be used for setting an attribute value\n  fdel\n    function to be used for del\'ing an attribute\n  doc\n    docstring\n\nTypical use is to define a managed attribute x:\n\nclass C(object):\n    def getx(self): return self._x\n    def setx(self, value): self._x = value\n    def delx(self): del self._x\n    x = property(getx, setx, delx, 'I\'m the \'x\' property.')\n\nDecorators make defining new properties or modifying existing ones easy:\n\nclass C(object):\n    @property\n    def x(self):\n        'I am the \'x\' property.'\n        return self._x\n    @x.setter\n    def x(self, value):\n        self._x = value\n    @x.deleter\n    def x(self):\n        del self._x"


Sk.builtin.property.prototype.tp$descr_get = function (obj, type) {
    if (Sk.builtin.checkNone(obj)) {
        return this;
    }

    if (this.prop$get === undefined) {
        throw new Sk.builtin.AttributeError("unreadable attribute")
    }

    return this.prop$get.tp$call([obj]);

};

Sk.builtin.property.prototype.tp$descr_set = function (obj, value) {
    if (value === undefined) {
        func = this.prop$del;
    } else {
        func = this.prop$set;
    }
    if (Sk.builtin.checkNone(func)) {
        const msg = value === undefined ? "delete" : "set";
        throw new Sk.builtin.AttributeError("can't " + msg + " attribute");
    }
    if (value === undefined) {
        return func.tp$call([obj]);
    } else {
        return func.tp$call([obj, value]);
    }
};

Sk.builtin.property.prototype.getter = function (self, fget) {
    return new Sk.builtin.property(fget, self.prop$set, self.prop$del, self.prop$doc);
};

Sk.builtin.property.prototype.setter = function (self, fset) {
    return new Sk.builtin.property(self.prop$get, fset, self.prop$del, self.prop$doc);
};

Sk.builtin.property.prototype.deleter = function (self, fdel) {
    return new Sk.builtin.property(self.prop$get, self.prop$set, fdel, self.prop$doc);
};

Sk.builtin.property.prototype.tp$getsets = [
    new Sk.GetSetDef("fget", function () {return this.prop$get}),
    new Sk.GetSetDef("fset", function () {return this.prop$set}),
    new Sk.GetSetDef("fdel", function () {return this.prop$del}),
    new Sk.GetSetDef("__doc__", function () {return this.prop$doc}),
];

Sk.builtin.property.pythonFunctions = [
    "getter", "setter", "deleter", "__init__"
];
