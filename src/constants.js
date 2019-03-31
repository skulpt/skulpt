import { bool, str } from './types';

export const $emptystr = new str("");

/**
 * Python bool True constant.
 * @type {bool}
 * @memberOf bool
 */
export const true$ = /** @type {Sk.builtin.bool} */ new bool(true);

/**
 * Python bool False constant.
 * @type {bool}
 * @memberOf bool
 */
export const false$ = /** @type {Sk.builtin.bool} */ new bool(false);

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

// Sk.builtin.dict.fromkeys
Sk.builtin.dict.$fromkeys.co_name = new Sk.builtin.str("fromkeys");
Sk.builtin.dict.prototype["fromkeys"] = new Sk.builtin.func(Sk.builtin.dict.$fromkeys);

var builtinNames = [
    "int_",
    "lng",
    "sorted",
    "range",
    "round",
    "len",
    "min",
    "max",
    "sum",
    "zip",
    "abs",
    "fabs",
    "ord",
    "chr",
    "hex",
    "oct",
    "bin",
    "dir",
    "repr",
    "open",
    "isinstance",
    "hash",
    "getattr",
    "hasattr",
    "id",
    "map",
    "filter",
    "reduce",
    "sorted",
    "any",
    "all",
    "input",
    "raw_input",
    "setattr",
    "quit",
    "quit",
    "divmod",
    "format",
    "globals",
    "issubclass"
];

for (var i = 0; i < builtinNames.length; i++) {
    Sk.builtin[builtinNames[i]].co_name = new Sk.builtin.str(builtinNames[i]);
}
