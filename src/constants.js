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
Sk.builtin.int_.$defaults = [ Sk.builtin.none.none$ ];

// Sk.builtin.lng
Sk.builtin.lng.co_varnames = [ "number", "base" ];
Sk.builtin.lng.$defaults = [ Sk.builtin.none.none$ ];

// Sk.builtin.sorted
Sk.builtin.sorted.co_varnames = ["list", "cmp", "key", "reverse"];
Sk.builtin.sorted.$defaults = [Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.bool.false$];

Sk.builtin.int_.co_name = new Sk.builtin.str("int");
Sk.builtin.lng.co_name = new Sk.builtin.str("long");
Sk.builtin.sorted.co_name = new Sk.builtin.str("sorted");
Sk.builtin.range.co_name = new Sk.builtin.str("range");
Sk.builtin.round.co_name = new Sk.builtin.str("round");
Sk.builtin.len.co_name = new Sk.builtin.str("len");
Sk.builtin.min.co_name = new Sk.builtin.str("min");
Sk.builtin.max.co_name = new Sk.builtin.str("max");
Sk.builtin.sum.co_name = new Sk.builtin.str("sum");
Sk.builtin.zip.co_name = new Sk.builtin.str("zip");
Sk.builtin.abs.co_name = new Sk.builtin.str("abs");
Sk.builtin.abs.co_name = new Sk.builtin.str("fabs");
Sk.builtin.ord.co_name = new Sk.builtin.str("ord");
Sk.builtin.chr.co_name = new Sk.builtin.str("chr");
Sk.builtin.hex.co_name = new Sk.builtin.str("hex");
Sk.builtin.oct.co_name = new Sk.builtin.str("oct");
Sk.builtin.bin.co_name = new Sk.builtin.str("bin");
Sk.builtin.dir.co_name = new Sk.builtin.str("dir");
Sk.builtin.repr.co_name = new Sk.builtin.str("repr");
Sk.builtin.open.co_name = new Sk.builtin.str("open");
Sk.builtin.isinstance.co_name = new Sk.builtin.str("isinstance");
Sk.builtin.hash.co_name = new Sk.builtin.str("hash");
Sk.builtin.getattr.co_name = new Sk.builtin.str("getattr");
Sk.builtin.hasattr.co_name = new Sk.builtin.str("hasattr");
Sk.builtin.id.co_name = new Sk.builtin.str("id");
Sk.builtin.map.co_name = new Sk.builtin.str("map");
Sk.builtin.filter.co_name = new Sk.builtin.str("filter");
Sk.builtin.reduce.co_name = new Sk.builtin.str("reduce");
Sk.builtin.sorted.co_name = new Sk.builtin.str("sorted");
Sk.builtin.any.co_name = new Sk.builtin.str("any");
Sk.builtin.all.co_name = new Sk.builtin.str("all");
Sk.builtin.input.co_name = new Sk.builtin.str("input");
Sk.builtin.raw_input.co_name = new Sk.builtin.str("raw_input");
Sk.builtin.setattr.co_name = new Sk.builtin.str("setattr");
Sk.builtin.quit.co_name = new Sk.builtin.str("quit");
Sk.builtin.quit.co_name = new Sk.builtin.str("exit");
Sk.builtin.divmod.co_name = new Sk.builtin.str("divmod");
Sk.builtin.format.co_name = new Sk.builtin.str("format");
Sk.builtin.globals.co_name = new Sk.builtin.str("globals");
Sk.builtin.issubclass.co_name = new Sk.builtin.str("issubclass");