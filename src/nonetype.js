/**
 * @constructor
 * 
 * @extends {Sk.builtin.object}
 *
 * @description
 * It would be rare to call this as a constructor since it returns {@link Sk.builtin.none.none$}
 */
Sk.builtin.none = Sk.abstr.buildNativeClass("NoneType", {
    constructor: function NoneType() {
        return Sk.builtin.none.none$; // always return the same object
    },
    slots: /**@lends {Sk.builtin.none.prototype}*/ {
        tp$new(args, kwargs) {
            Sk.abstr.checkNoArgs("NoneType", args, kwargs);
            return Sk.builtin.none.none$;
        },
        $r() {
            return new Sk.builtin.str("None");
        },
        tp$as_number: true,
        nb$bool() {
            return false;
        },
    },
    flags: {
        sk$acceptable_as_base_class: false,
    },
});

/**
 * Python None value.
 * @type {Sk.builtin.none}
 * @member {Sk.builtin.none}
 */
Sk.builtin.none.none$ = /** @type {Sk.builtin.none} */ (Object.create(Sk.builtin.none.prototype, {
    v: { value: null, enumerable: true },
}));

/**
 * @constructor
 * Sk.builtin.NotImplemented
 *
 * @extends {Sk.builtin.object}
 */
Sk.builtin.NotImplemented = Sk.abstr.buildNativeClass("NotImplementedType", {
    constructor: function NotImplementedType() {
        return Sk.builtin.NotImplemented.NotImplemented$; // always return the same object
    },
    slots: /**@lends {Sk.builtin.NotImplemented.prototype}*/ {
        $r() {
            return new Sk.builtin.str("NotImplemented");
        },
        tp$new (args, kwargs) {
            Sk.abstr.checkNoArgs("NotImplementedType", args, kwargs);
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
    flags: {
        sk$acceptable_as_base_class: false,
    }
});

/**
 * Python NotImplemented constant.
 * @type {Sk.builtin.NotImplemented}
 * @member {Sk.builtin.NotImplemented}
 */
Sk.builtin.NotImplemented.NotImplemented$ = /** @type {Sk.builtin.NotImplemented} */ (Object.create(Sk.builtin.NotImplemented.prototype, {
    v: { value: null, enumerable: true },
}));