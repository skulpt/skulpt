/* jshint ignore:start */

// This file list is only used for testing.
// It should be kept in sync with ../skulpt.py.
// Order is important!

require("./util.js");

// Global support functions
Sk.global["strftime"] = require("strftime");
Sk.global["strptime"] = require("../support/time-helpers/strptime.js");
Sk.global["JSBI"] = require("jsbi");
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
require("./function.js");
require("./sk_method.js");
// can only do setUpSlots with tp$new from now since __new__ is a sk_method
require("./builtin.js");
require("./fromcodepoint.js");
require("./errors.js");
require("./method.js");
require("./misceval.js");
require("./simple_iterators.js");
require("./list.js");
require("./str.js");
require("./formatting.js");
require("./tuple.js");
require("./dict.js");
require("./dictviews.js");
require("./mappingproxy.js");
require("./property_class_static.js");
require("./biginteger.js");
require("./int.js");
require("./bool.js");
require("./float.js");
// require("./number.js");
require("./long.js");
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
require("./iteratorobjects.js");
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
require("./sorted.js");
require("./super.js");
require("./builtindict.js");
require("./constants.js");
require("./internalpython.js");

/* jshint ignore:end */
