const reqskulpt = require("../support/run/require-skulpt").requireSkulpt;

// Import Skulpt
var skulpt = reqskulpt(false);
if (skulpt === null) {
    process.exit(1);
}

// Run regex parser tests (summary only)
const { run: runReParserTests } = require("./re_parser.test.js");
console.log("Running re_parser tests...");
const { failed } = runReParserTests({ verbose: false });
if (failed > 0) {
    process.exit(1);
}


// Run tests
require("./test.js");

