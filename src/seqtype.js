/**
 * @constructor
 * Sk.builtin.seqtype
 *
 * @description
 * Abstract class for Python sequence types.
 *
 * @extends {Sk.builtin.object}
 *
 * @return {undefined} Cannot instantiate a Sk.builtin.seqtype object
 */
Sk.builtin.seqtype = function () {

    Sk.abstr.setUpObject(this);

};

Sk.abstr.setUpInheritance("SequenceType", Sk.builtin.seqtype, Sk.builtin.object);

/**
 * Python wrapper of \_\_len\_\_ method.
 *
 * @name  __len__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__len__"] = new Sk.builtin.func(function (self) {

    Sk.builtin.pyCheckArgs("__len__", arguments, 0, 0, false, true);

    return new Sk.builtin.int_(self.sq$length());    

});

/**
 * Python wrapper of \_\_iter\_\_ method.
 *
 * @name  __iter__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__iter__"] = new Sk.builtin.func(function (self) {

    Sk.builtin.pyCheckArgs("__iter__", arguments, 0, 0, false, true);

    return self.tp$iter();

});

/**
 * Python wrapper of \_\_contains\_\_ method.
 *
 * @name  __contains__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__contains__"] = new Sk.builtin.func(function (self, item) {

    Sk.builtin.pyCheckArgs("__contains__", arguments, 1, 1, false, true);

    if (self.sq$contains(item)) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.bool.false$;
    }

});

/**
 * Python wrapper of \_\_getitem\_\_ method.
 *
 * @name  __getitem__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__getitem__"] = new Sk.builtin.func(function (self, key) {

    Sk.builtin.pyCheckArgs("__getitem__", arguments, 1, 1, false, true);

    return self.mp$subscript(key);

});

/**
 * Python wrapper of \_\_add\_\_ method.
 *
 * @name  __add__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__add__"] = new Sk.builtin.func(function (self, other) {

    Sk.builtin.pyCheckArgs("__add__", arguments, 1, 1, false, true);

    return self.sq$concat(other);

});

/**
 * Python wrapper of \_\_mul\_\_ method.
 *
 * @name  __mul__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__mul__"] = new Sk.builtin.func(function (self, n) {

    Sk.builtin.pyCheckArgs("__mul__", arguments, 1, 1, false, true);

    if (!Sk.misceval.isIndex(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }

    return self.sq$repeat(n);

});

/**
 * Python wrapper of \_\_rmul\_\_ method.
 *
 * @name  __rmul__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__rmul__"] = new Sk.builtin.func(function (self, n) {

    Sk.builtin.pyCheckArgs("__rmul__", arguments, 1, 1, false, true);

    return self.sq$repeat(n);    

});

Sk.abstr.registerPythonFunctions(Sk.builtin.seqtype, 
    ["__len__", "__iter__", "__contains__", "__getitem__", "__add__",
     "__mul__", "__rmul__"]);