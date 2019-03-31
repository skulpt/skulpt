import { setUpInheritance, typeName } from '../type';
import { pyCheckArgs } from '../function/checks';
import { func } from '../function';
import { object } from './object';
import { ExternalError, TypeError } from '../errors';
import { int_ } from './int';
import { true$, false$ } from '../constants';
import { isIndex } from '../misceval';

export class seqtype extends object {
    /**
     * @constructor
     * seqtype
     *
     * @description
     * Abstract class for Python sequence types.
     *
     * @extends {object}
     *
     * @return {undefined} Cannot instantiate a seqtype object
     */
    constructor() {
        throw new ExternalError("Cannot instantiate abstract seqtype class");
    }

    /**
     * Python wrapper of `__len__` method.
     *
     * @name  __len__
     * @instance
     * @memberOf seqtype.prototype
     */
    __len__ = new func(function (self) {

        pyCheckArgs("__len__", arguments, 0, 0, false, true);

        return new int_(self.sq$length());

    });

    /**
     * Python wrapper of `__iter__` method.
     *
     * @name  __iter__
     * @instance
     * @memberOf seqtype.prototype
     */
    __iter__ = new func(function (self) {

        pyCheckArgs("__iter__", arguments, 0, 0, false, true);

        return self.tp$iter();

    })

    /**
     * Python wrapper of `__contains__` method.
     *
     * @name  __contains__
     * @instance
     * @memberOf seqtype.prototype
     */
    __contains__ = new func(function (self, item) {

        pyCheckArgs("__contains__", arguments, 1, 1, false, true);

        if (self.sq$contains(item)) {
            return true$;
        } else {
            return false$;
        }

    });

    /**
     * Python wrapper of `__getitem__` method.
     *
     * @name  __getitem__
     * @instance
     * @memberOf seqtype.prototype
     */
    __getitem__ = new func(function (self, key) {

        pyCheckArgs("__getitem__", arguments, 1, 1, false, true);

        return self.mp$subscript(key);

    })

    /**
     * Python wrapper of `__add__` method.
     *
     * @name  __add__
     * @instance
     * @memberOf seqtype.prototype
     */
    __add__ = new func(function (self, other) {

        pyCheckArgs("__add__", arguments, 1, 1, false, true);

        return self.sq$concat(other);

    })

    /**
     * Python wrapper of `__mul__` method.
     *
     * @name  __mul__
     * @instance
     * @memberOf seqtype.prototype
     */
    __mul__ = new func(function (self, n) {

        pyCheckArgs("__mul__", arguments, 1, 1, false, true);

        if (!isIndex(n)) {
            throw new TypeError("can't multiply sequence by non-int of type '" + typeName(n) + "'");
        }

        return self.sq$repeat(n);

    })

    /**
     * Python wrapper of `__rmul__` method.
     *
     * @name  __rmul__
     * @instance
     * @memberOf seqtype.prototype
     */
    __rmul__ = new func(function (self, n) {

        pyCheckArgs("__rmul__", arguments, 1, 1, false, true);

        return self.sq$repeat(n);

    })
}

setUpInheritance("SequenceType", seqtype, object);

seqtype.ct = true;

