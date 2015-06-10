Sk.builtin.seqtype = function () {

    Sk.abstr.superConstructor(Sk.builtin.seqtype, this);

};

Sk.abstr.setUpInheritance("SequenceType", Sk.builtin.seqtype, Sk.builtin.object);

Sk.builtin.seqtype.prototype["__len__"] = new Sk.builtin.func(function (self) {

    Sk.builtin.pyCheckArgs("__len__", arguments, 0, 0, false, true);

    return new Sk.builtin.int_(self.sq$length());    

});

Sk.builtin.seqtype.prototype["__iter__"] = new Sk.builtin.func(function (self) {

    Sk.builtin.pyCheckArgs("__iter__", arguments, 0, 0, false, true);

    return self.tp$iter();

});

Sk.builtin.seqtype.prototype["__contains__"] = new Sk.builtin.func(function (self, item) {

    Sk.builtin.pyCheckArgs("__contains__", arguments, 1, 1, false, true);

    if (self.sq$contains(item)) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.bool.false$;
    }

});

Sk.builtin.seqtype.prototype["__getitem__"] = new Sk.builtin.func(function (self, key) {

    Sk.builtin.pyCheckArgs("__getitem__", arguments, 1, 1, false, true);

    return self.mp$subscript(key);

});

Sk.builtin.seqtype.prototype["__add__"] = new Sk.builtin.func(function (self, other) {

    Sk.builtin.pyCheckArgs("__add__", arguments, 1, 1, false, true);

    return self.sq$concat(other);

});

Sk.builtin.seqtype.prototype["__mul__"] = new Sk.builtin.func(function (self, n) {

    Sk.builtin.pyCheckArgs("__mul__", arguments, 1, 1, false, true);

    if (!Sk.misceval.isIndex(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }

    return self.sq$repeat(n);

});

Sk.builtin.seqtype.prototype["__rmul__"] = new Sk.builtin.func(function (self, n) {

    Sk.builtin.pyCheckArgs("__rmul__", arguments, 1, 1, false, true);

    return self.sq$repeat(n);    

});

Sk.abstr.registerPythonFunctions(Sk.builtin.seqtype, 
    ["__len__", "__iter__", "__contains__", "__getitem__", "__add__",
     "__mul__", "__rmul__"]);