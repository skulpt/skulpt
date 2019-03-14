import { setUpInheritance } from './abstract';
import { int_ } from './int';
import { str } from './str';
import { float_ } from './float';
import { func, pyCheckArgs } from './function';
import { remapToJs } from './ffi';
import { pyCheckArgs } from './function';

/**
 * @constructor
 * Sk.builtin.bool
 *
 * @description
 * Constructor for Python bool. Also used for builtin bool() function.
 *
 * Where possible, do not create a new instance but use the constants
 * Sk.builtin.bool.true$ or Sk.builtin.bool.false$. These are defined in src/constant.js
 *
 * @extends {Sk.builtin.object}
 *
 * @param  {(Object|number|boolean)} x Value to evaluate as true or false
 * @return {Sk.builtin.bool} Sk.builtin.bool.true$ if x is true, Sk.builtin.bool.false$ otherwise
 */
export class bool extends int_ {
    constructor(x) {
        pyCheckArgs("bool", arguments, 1);
        if (Sk.misceval.isTrue(x)) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.bool.false$;
        }
    }

    $r() {
        if (this.v) {
            return new str("True");
        }
        return new str("False");
    }

    tp$hash() {
        return new int_(this.v);
    }

    __int__ = new func(function (self) {
        var v = Sk.builtin.asnum$(self);

        return new int_(v);
    })

    __float__ = new func(function(self) {
        return new float_(remapToJs(self));
    });
}

setUpInheritance("bool", bool, int_);