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
Sk.builtin.bool = Sk.abstr.buildNativeClass("bool", {
    constructor: function (x) {
        if (Sk.misceval.isTrue(x)) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.bool.false$;
        }
    },
    base: Sk.builtin.int_,
    slots: {
        tp$doc:
            "bool(x) -> bool\n\nReturns True when the argument x is true, False otherwise.\nThe builtins True and False are the only two instances of the class bool.\nThe class bool is a subclass of the class int, and cannot be subclassed.",
        tp$new: function (args, kwargs) {
            Sk.abstr.checkNoKwargs("bool", kwargs);
            Sk.abstr.checkArgsLen("bool", args, 0, 1);
            return new Sk.builtin.bool(args[0]); //technically we don't need new but easier to keep consistent
        },
        $r: function () {
            return this.v ? new Sk.builtin.str("True") : new Sk.builtin.str("False");
        },
        // TODO: these should return bools if both bools else pass up to int/Long
        // tp$as_number: true,
        // nb$and: function () {
        // },
        // nb$or: function () {
        // },
        // nb$xor: function () {
        // },
    },
    flags: {
        sk$acceptable_as_base_class: false,
    },
    methods: {
        __format__: {
            $meth: function () {
                return this.$r();
            },
            $flags: {OneArg: true},
        }
    }
});
Sk.exportSymbol("Sk.builtin.bool", Sk.builtin.bool);

/**
 * Python bool True constant.
 * @type {Sk.builtin.bool}
 * @memberOf Sk.builtin.bool
 */
Sk.builtin.bool.true$ = Object.create(Sk.builtin.bool.prototype, {
    v: { value: 1, enumerable: true },
});

/**
 * Python bool False constant.
 * @type {Sk.builtin.bool}
 * @memberOf Sk.builtin.bool
 */
Sk.builtin.bool.false$ = Object.create(Sk.builtin.bool.prototype, {
    v: { value: 0, enumerable: true },
});
