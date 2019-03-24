import { setUpInheritance } from './abstract';
import { int_ } from './int';
import { str } from './str';
import { float_ } from './float';
import { func, pyCheckArgs } from './function';
import { remapToJs } from './ffi';
import { pyCheckArgs } from './function';
import { asnum$ } from './builtin';
import { true$, false$ } from './constants';
import { isTrue } from './misceval';

/**
 * @constructor
 * bool
 *
 * @description
 * Constructor for Python bool. Also used for builtin bool() function.
 *
 * Where possible, do not create a new instance but use the constants
 * bool.true$ or bool.false$. These are defined in src/constant.js
 *
 * @extends {object}
 *
 * @param  {(Object|number|boolean)} x Value to evaluate as true or false
 * @return {bool} bool.true$ if x is true, bool.false$ otherwise
 */
export class bool extends int_ {
    constructor(x) {
        pyCheckArgs("bool", arguments, 1);
        if (isTrue(x)) {
            return true$;
        } else {
            return false$;
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
        var v = asnum$(self);

        return new int_(v);
    })

    __float__ = new func(function(self) {
        return new float_(remapToJs(self));
    });
}

setUpInheritance("bool", bool, int_);