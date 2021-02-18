/* jshint ignore:start */

// This file list is only used for testing.
// It should be kept in sync with ../skulpt.py.
// Order is important!

require("./util.js");

// Global support functions
Sk.global["strftime"] = require("strftime");
Sk.global["strptime"] = require("../support/time-helpers/strptime.js");
require("../support/polyfills/JSBI");
require("setimmediate");

// Skulpt
require("assert");
require("./env.js");
require("./type.js");
require("./generic.js");
require("./check.js");
require("./abstract.js");
require("./object.js");
require("./slotdefs.js");
require("./descr.js");
// can only setUpMethods / setUpGetsets / setUpSlots from now.
require("./sk_method.js");
// can only do setUpSlots with tp$new from now since __new__ is a sk_method
[Sk.builtin.object, Sk.builtin.type].forEach((cls) => {
    Sk.abstr.setUpSlots(cls);
    Sk.abstr.setUpMethods(cls);
    Sk.abstr.setUpGetSets(cls);
});
require("./nonetype");
require("./formatting.js");
require("./str.js");

[Sk.builtin.str, Sk.builtin.none, Sk.builtin.NotImplemented, Sk.builtin.object].forEach((cls) => {
    const cls_proto = cls.prototype;
    cls_proto.__doc__ = cls_proto.hasOwnProperty("tp$doc") ? new Sk.builtin.str(cls_proto.tp$doc) : Sk.builtin.none.none$;
});

require("./function.js");
require("./builtin.js");
require("./errors.js");
require("./method.js");
require("./misceval.js");
require("./simple_iterators.js");
require("./list.js");

require("./bytes.js");
require("./tuple.js");
require("./dict.js");
require("./mappingproxy.js");
require("./property_class_static.js");
require("./int.js");
require("./bool.js");
require("./float.js");
require("./complex.js");
require("./slice.js");
require("./set.js");
require("./print.js");
require("./module.js");
require("./structseq.js");
require("./generator.js");
require("./file.js");
require("./ffi.js");
require("./range.js");
require("./enumerate.js");
require("./filter.js");
require("./map.js");
require("./reversed.js");
require("./zip.js");
require("./token.js");
require("./tokenize.js");
require("../gen/parse_tables.js");
require("./parser.js");
require("../gen/astnodes.js");
require("./ast.js");
require("./symtable.js");
require("./compile.js");
require("./import.js");
require("./timsort.js");
require("./super.js");
require("./builtindict.js");
require("./constants.js");

/* jshint ignore:end */
