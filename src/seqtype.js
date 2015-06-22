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

    throw new Sk.builtin.ExternalError("Cannot instantiate abstract Sk.builtin.seqtype class");

};

Sk.abstr.setUpInheritance("SequenceType", Sk.builtin.seqtype, Sk.builtin.object);

Sk.builtin.seqtype.sk$abstract = true;

/**
 * Python wrapper of `__len__` method.
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
 * Python wrapper of `__iter__` method.
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
 * Python wrapper of `__contains__` method.
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
 * Python wrapper of `__getitem__` method.
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
 * Python wrapper of `__add__` method.
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
 * Python wrapper of `__mul__` method.
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
 * Python wrapper of `__rmul__` method.
 *
 * @name  __rmul__
 * @instance
 * @memberOf Sk.builtin.seqtype.prototype
 */
Sk.builtin.seqtype.prototype["__rmul__"] = new Sk.builtin.func(function (self, n) {

    Sk.builtin.pyCheckArgs("__rmul__", arguments, 1, 1, false, true);

    return self.sq$repeat(n);    

});
