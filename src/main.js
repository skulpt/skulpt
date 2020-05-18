/* jshint ignore:start */

// This file list is only used for testing.
// It should be kept in sync with ../skulpt.py.
// Order is important!

require("./util.js");

// Global support functions
Sk.global["strftime"] = require("strftime");
Sk.global["strptime"] = require("../support/time-helpers/strptime.js");
require("setimmediate");

// Skulpt
require("assert");
require("./env.js");
require("./type.js");
require("./generic.js");
require("./abstract.js");
require("./object.js");
require("./getsets.js");
require("./function.js");
require("./builtin.js");
require("./fromcodepoint.js");
require("./errors.js");
require("./method.js");
require("./misceval.js");
require("./seqtype.js");
require("./iterators.js");
require("./list.js");
require("./str.js");
require("./formatting.js");
require("./tuple.js");
require("./dict.js");
require("./mappingproxy.js");
require("./numtype.js");
require("./biginteger.js");
require("./int.js");
require("./bool.js");
require("./float.js");
require("./number.js");
require("./long.js");
require("./complex.js");
require("./slice.js");
require("./set.js");
require("./frozenset.js");
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
require("./typeobject.js");
require("./builtindict.js");
require("./constants.js");
require("./internalpython.js");

/* jshint ignore:end */
