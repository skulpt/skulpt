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

const intProto = Sk.builtin.int_.prototype;

Sk.builtin.lng = Sk.abstr.buildNativeClass("long", {
    base: Sk.builtin.int_, // not technically correct but makes backward compatibility easy
    constructor: function (x) {
        Sk.builtin.int_.call(this, x);
    },
    slots: {
        $r: function () {
            return new Sk.builtin.str(this.v.toString() + "L");
        },
        tp$as_number: true,
        nb$negative: function () {
            return new Sk.builtin.lng(intProto.nb$negative.call(this).v);
        },
        nb$positive: function () {
            return new Sk.builtin.lng(intProto.nb$positive.call(this).v);
        },
    },
});
