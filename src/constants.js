Sk.builtin.str.$emptystr = new Sk.builtin.str("");

/**
 * Python bool True constant.
 * @type {Sk.builtin.bool}
 * @memberOf Sk.builtin.bool
 */
Sk.builtin.bool.true$ = /** @type {Sk.builtin.bool} */ (Object.create(Sk.builtin.bool.prototype, {v: {value: 1, enumerable: true}}));

/**
 * Python bool False constant.
 * @type {Sk.builtin.bool}
 * @memberOf Sk.builtin.bool
 */
Sk.builtin.bool.false$ = /** @type {Sk.builtin.bool} */ (Object.create(Sk.builtin.bool.prototype, {v: {value: 0, enumerable: true}}));

/* Constants used for kwargs */

// Sk.builtin.int_
Sk.builtin.int_.co_varnames = [ "number", "base" ];
Sk.builtin.int_.$defaults = [ new Sk.builtin.int_(10) ];

// Sk.builtin.lng
Sk.builtin.lng.co_varnames = [ "number", "base" ];
Sk.builtin.lng.$defaults = [ new Sk.builtin.int_(10) ];

// Sk.builtin.sorted
Sk.builtin.sorted.co_varnames = ["list", "cmp", "key", "reverse"];
Sk.builtin.sorted.$defaults = [Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.bool.false$];
