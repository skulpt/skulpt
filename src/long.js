/* global Sk: true, goog:true */

// long aka "bignumber" implementation
//
//  Using javascript BigInteger by Tom Wu
/**
 * @constructor
 * Sk.builtin.lng
 *
 * @description
 * Constructor for Python long. Also used for builtin long().
 *
 * @extends {Sk.builtin.numtype}
 *
 * @param {*} x Object or number to convert to Python long.
 * @param {number=} base Optional base.
 * @return {Sk.builtin.lng} Python long
 */

Sk.builtin.lng = function (x) {
    Sk.builtin.int_.call(this, x);
};
Sk.abstr.setUpInheritance("long", Sk.builtin.lng, Sk.builtin.int_);

Sk.builtin.lng.prototype.nb$negative = function () {
    return new Sk.builtin.lng(Sk.builtin.int_.prototype.nb$negative.call(this).v);
};

Sk.builtin.lng.prototype.$r = function () {
    return new Sk.builtin.str(this.v.toString() + "L");
};