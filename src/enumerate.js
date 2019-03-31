import { typeName, setUpInheritance } from './type'
import { object } from './types/object';
import { func } from './function';
import { TypeError } from './errors';
import { isIndex, asIndex } from './misceval';
import { pyCheckArgs } from './function/checks';

export class enumerate extends object {
    /**
     * @constructor
     * @param {Object} iterable
     * @param {number=} start
     * @extends Sk.builtin.object
     */
    constructor(iterable, start) {
        var it;
        if (!(this instanceof Sk.builtin.enumerate)) {
            return new Sk.builtin.enumerate(iterable, start);
        }


        pyCheckArgs("enumerate", arguments, 1, 2);
        if (!Sk.builtin.checkIterable(iterable)) {
            throw new TypeError("'" + typeName(iterable) + "' object is not iterable");
        }
        if (start !== undefined) {
            if (!isIndex(start)) {
                throw new TypeError("'" + typeName(start) + "' object cannot be interpreted as an index");
            } else {
                start = asIndex(start);
            }
        } else {
            start = 0;
        }

        it = iterable.tp$iter();

        this.tp$iter = function () {
            return this;
        };
        this.$index = start;
        this.tp$iternext = function () {
            // todo; StopIteration
            var idx;
            var next = it.tp$iternext();
            if (next === undefined) {
                return undefined;
            }
            idx = new Sk.builtin.int_(this.$index++);
            return new Sk.builtin.tuple([idx, next]);
        };

        this.__class__ = Sk.builtin.enumerate;

        return this;
    }

    __iter__ = new func(function (self) {
        return self.tp$iter();
    })

    next$(self) {
        return self.tp$iternext();
    }

    $r() {
        return new Sk.builtin.str("<enumerate object>");
    }
}

setUpInheritance("enumerate", Sk.builtin.enumerate, Sk.builtin.object);
