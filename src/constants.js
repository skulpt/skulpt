Sk.builtin.str.$emptystr = new Sk.builtin.str("");

Sk.builtin.bool.true$ = Object.create(Sk.builtin.bool.prototype, {v: {value: 1, enumerable: true}});
Sk.builtin.bool.false$ = Object.create(Sk.builtin.bool.prototype, {v: {value: 0, enumerable: true}});

// Manually call super constructors on boolean singletons
Sk.abstr.superConstructor(Sk.builtin.bool, Sk.builtin.bool.true$);
Sk.abstr.superConstructor(Sk.builtin.bool, Sk.builtin.bool.false$);

Sk.builtin.int_.$defaults = [ new Sk.builtin.int_(10) ];
