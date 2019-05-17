/* jshint ignore:start */

// This file list is only used for testing.
// It should be kept in sync with ../skulpt.py.
// Order is important!

// Closure
require("google-closure-library");
goog.require("goog.debug.Error");
goog.require("goog.asserts");

// Global support functions
strftime = require("strftime");

// Global Sk Object
Sk = {};
Sk.js_beautify = require("js-beautify").js;

// Skulpt
require("./env.js");
require("./type.js");
require("./abstract.js");
require("./object.js");
require("./function.js");
require("./builtin.js");
require("./fromcodepoint.js");
require("./errors.js");
require("./method.js");
require("./misceval.js");
require("./seqtype.js");
require("./list.js");
require("./str.js");
require("./formatting.js");
require("./tuple.js");
require("./dict.js");
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
require("./print.js");
require("./module.js");
require("./structseq.js");
require("./generator.js");
require("./file.js");
require("./ffi.js");
require("./iterator.js");
require("./enumerate.js");
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
