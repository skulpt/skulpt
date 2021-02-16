const int_proto = Sk.builtin.int_.prototype;

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
 * @extends {Sk.builtin.int_}
 *
 * @param  {(Object|number|boolean)} x Value to evaluate as true or false
 * @return {Sk.builtin.bool} Sk.builtin.bool.true$ if x is true, Sk.builtin.bool.false$ otherwise
 */
Sk.builtin.bool = Sk.abstr.buildNativeClass("bool", {
    constructor: function bool (x) {
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
        tp$new(args, kwargs) {
            Sk.abstr.checkNoKwargs("bool", kwargs);
            Sk.abstr.checkArgsLen("bool", args, 0, 1);
            return new Sk.builtin.bool(args[0]); //technically we don't need new but easier to keep consistent
        },
        $r() {
            return this.v ? this.str$True : this.str$False;
        },

        tp$as_number: true,
        nb$and(other) {
            if (other.ob$type === Sk.builtin.bool) {
                return new Sk.builtin.bool(this.v & other.v);
            } 
            return int_proto.nb$and.call(this, other);
        },
        nb$or(other) {
            if (other.ob$type === Sk.builtin.bool) {
                return new Sk.builtin.bool(this.v | other.v);
            } 
            return int_proto.nb$or.call(this, other);
        },
        nb$xor(other) {
            if (other.ob$type === Sk.builtin.bool) {
                return new Sk.builtin.bool(this.v ^ other.v);
            } 
            return int_proto.nb$xor.call(this, other);
        },
    },
    flags: {
        sk$acceptable_as_base_class: false,
    },
    methods: {
        __format__: {
            $meth() {
                return this.$r();
            },
            $flags: {OneArg: true},
        }
    },
    proto: {
        str$False: new Sk.builtin.str("False"),
        str$True: new Sk.builtin.str("True"),
    }
});
Sk.exportSymbol("Sk.builtin.bool", Sk.builtin.bool);

/**
 * Python bool True constant.
 * @type {Sk.builtin.bool}
 * @member {Sk.builtin.bool}
 */
Sk.builtin.bool.true$ = /** @type {Sk.builtin.bool} */ (Object.create(Sk.builtin.bool.prototype, {
    v: { value: 1, enumerable: true },
}));

/**
 * Python bool False constant.
 * @type {Sk.builtin.bool}
 * @member {Sk.builtin.bool}
 */
Sk.builtin.bool.false$ = /** @type {Sk.builtin.bool} */ (Object.create(Sk.builtin.bool.prototype, {
    v: { value: 0, enumerable: true },
}));
