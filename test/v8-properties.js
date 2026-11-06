// Runtime shape check, separate from Python unit tests.
// Run with node --allow-natives-syntax; see https://github.com/skulpt/skulpt/pull/1143
const fs = require("fs");
const vm = require("vm");
const hasFastProperties = new Function("object", "return %HasFastProperties(object);");
const coreFile = process.argv[2] || "dist/skulpt.min.js";

async function run() {
    const context = vm.createContext({ console, setTimeout, clearTimeout });
    vm.runInContext(fs.readFileSync(coreFile, "utf8"), context);
    const Sk = context.Sk;
    const check = (stage) => {
        if (!hasFastProperties(Sk)) {
            throw new Error("Sk has dictionary properties " + stage);
        }
    };
    check("after core startup");
    vm.runInContext(fs.readFileSync("dist/skulpt-stdlib.js", "utf8"), context);
    check("after stdlib loading");
    for (const future of [Sk.python3, Sk.python2]) {
        Sk.configure({
            __future__: future,
            read: (filename) => {
                const source = Sk.builtinFiles.files[filename];
                if (source === undefined) {
                    throw new Error("File not found: " + filename);
                }
                return source;
            },
            output: () => {},
        });
        check("after Python configuration");
        await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("v8_smoke", false,
            "import re\nimport math\nfrom datetime import datetime\nvalues = [i * i for i in range(10)]\n", true));
        check("after imports and execution");
    }
    console.log(coreFile + ": V8 fast properties retained");
}

run().catch((error) => {
    console.error(error.toString());
    process.exitCode = 1;
});
