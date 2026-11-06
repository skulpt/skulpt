// Optional regex syntax must stay in constructors so capability fallbacks can run.
const fs = require("fs");
const acorn = require("acorn");

function checkCompatSyntax(source, ecmaVersion) {
    acorn.parse(source, {
        ecmaVersion,
        onToken(token) {
            if (token.type.label === "regexp") {
                // Allow newer JavaScript while keeping optional regex features
                // in runtime constructors so capability fallbacks can run.
                acorn.parse("/" + token.value.pattern + "/" + token.value.flags, { ecmaVersion: 2015 });
            }
        },
    });
}

if (require.main === module) {
    const coreFile = process.argv[2] || "dist/skulpt.min.js";
    const ecmaVersion = Number(process.argv[3] || 2015);
    checkCompatSyntax(fs.readFileSync(coreFile, "utf8"), ecmaVersion);
    console.log("Compatibility core parses as ES" + ecmaVersion + " with baseline regex syntax");
}
module.exports = checkCompatSyntax;
