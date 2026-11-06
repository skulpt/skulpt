// The native-only core must not download the compatibility dependencies.
const assert = require("assert");
const fs = require("fs");
const acorn = require("acorn");
const path = require("path");
const vm = require("vm");
const dist = process.argv[2] || "dist";
const compatTarget = Number(process.argv[3] || 2015);
const checkCompatSyntax = require("./compat-syntax");

for (const [file, includesFallbacks] of [[path.join(dist, "skulpt.min.js"), true], [path.join(dist, "modern/skulpt.modern.min.js"), false]]) {
    const core = fs.readFileSync(file, "utf8");
    if (includesFallbacks) {
        checkCompatSyntax(core, compatTarget);
    } else {
        acorn.parse(core, { ecmaVersion: 2020 });
    }
    const sources = JSON.parse(fs.readFileSync(file + ".map", "utf8")).sources;
    for (const dependency of [/node_modules\/jsbi\//, /support\/polyfills\/UnicodeData\.js$/]) {
        assert.strictEqual(sources.some((source) => dependency.test(source)), includesFallbacks,
            file + ": unexpected dependency inclusion: " + dependency);
    }
}
console.log("Build variants contain only their intended compatibility dependencies");

// re detects optional regex features at runtime, including in a compiled stdlib.
const context = { Sk: {} };
vm.runInNewContext(fs.readFileSync(path.join(dist, "skulpt-stdlib.js"), "utf8"), context);
const moduleFile = "src/lib/re.js";
let source = context.Sk.builtinFiles.files[moduleFile];
if (typeof source === "number") {
    // Anvil's fork packages the shared stdlib in numbered JSON files.
    source = JSON.parse(fs.readFileSync(path.join(dist, "skulpt-stdlib-" + source + ".json"), "utf8"))[moduleFile];
}
assert.strictEqual(typeof source, "string", "Packaged re source is missing");
checkCompatSyntax(source, 2020);
console.log("Packaged re keeps optional regex syntax in runtime constructors");
