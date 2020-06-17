/**
 * @constructor
 * Sk.builtin.lng
 *
 * @description
 * This is only for backward compatibility with py2. 
 * We take the approach of using a trivial subclass with int and overriding a few methods
 *
 * @param {Number|String|BigInt} x 
 */
Sk.builtin.lng = Sk.abstr.buildNativeClass("long", {
    base: Sk.builtin.int_, // not technically correct but makes backward compatibility easy
    constructor: function lng (x) {
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

const intProto = Sk.builtin.int_.prototype;
