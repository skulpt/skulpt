// The native-only core must not download the compatibility dependencies.
const assert = require("assert");
const fs = require("fs");
const acorn = require("acorn");

for (const [file, includesFallbacks] of [["dist/skulpt.min.js", true], ["dist/modern/skulpt.modern.min.js", false]]) {
    acorn.parse(fs.readFileSync(file, "utf8"), { ecmaVersion: includesFallbacks ? 2015 : 2020 });
    const sources = JSON.parse(fs.readFileSync(file + ".map", "utf8")).sources;
    for (const dependency of [/node_modules\/jsbi\//, /support\/polyfills\/UnicodeData\.js$/]) {
        assert.strictEqual(sources.some((source) => dependency.test(source)), includesFallbacks,
            file + ": unexpected dependency inclusion: " + dependency);
    }
}
console.log("Build variants contain only their intended compatibility dependencies");
