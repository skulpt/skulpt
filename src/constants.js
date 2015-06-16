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

// Manually call super constructors on boolean singletons
Sk.abstr.setUpObject(Sk.builtin.bool.true$);
Sk.abstr.setUpObject(Sk.builtin.bool.false$);

Sk.builtin.int_.$defaults = [ new Sk.builtin.int_(10) ];
