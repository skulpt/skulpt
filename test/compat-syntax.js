// Unsupported syntax must not prevent the compatibility fallbacks from running.
const fs = require("fs");
const acorn = require("acorn");
const coreFile = process.argv[2] || "dist/skulpt.min.js";
acorn.parse(fs.readFileSync(coreFile, "utf8"), { ecmaVersion: 2015 });
console.log("Compatibility core parses as ES2015");
