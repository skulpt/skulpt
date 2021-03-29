const fs = require("fs");
const path = require("path");
const { compiler: Compiler } = require("google-closure-compiler");
const DEFAULT_LANG_OUT = "ECMASCRIPT_2015";
/**
 * If this optional file exists in the top level directory, it will be
 * used to exclude libraries from the standard library file.
 *
 * It should consist of a JSON array of filenames and/or directory
 * names (relative to the top level directory).
 *
 * Example:
 * [
 *   "src/lib/webgl",
 *   "src/lib/sqlite3",
 *   "src/lib/__phello__.foo.py"
 * ]
 *
 * This can be used to reduce the standard library file size by
 * excluding libraries that are not relevant to a particular
 * distribution.
 */
const excludeFileName = "libexcludes.json";
let js_bytes = 0;

async function processDirectories(dirs, exts, ret, options) {
    const { production, languageOut, excludes, recursive, singleFile } = options;
    const depth = options.depth || 0;
    for (let dir of dirs) {
        let files = fs.readdirSync(dir);

        for (let file of files) {
            let fullname = dir + "/" + file;

            if (!excludes.includes(fullname)) {
                let stat = fs.statSync(fullname);

                if (recursive && stat.isDirectory()) {
                    await processDirectories([fullname], exts, ret, { ...options, depth: depth + 1 });
                } else if (stat.isFile()) {
                    let ext = path.extname(file);
                    if (singleFile && file !== singleFile) {
                        continue;
                    }
                    if (exts.includes(ext)) {
                        if (production && ext === ".js") {
                            console.log(`Compiling ${fullname}...`);

                            // STANDARD
                            opts = {
                                language_in: "ECMASCRIPT_NEXT",
                                language_out: languageOut,
                                source_map_include_content: true,
                            };

                            Object.assign(opts, {
                                js: fullname,
                                jscomp_error: [
                                    "accessControls",
                                    "checkRegExp",
                                    "checkVars",
                                    "invalidCasts",
                                    "missingProperties",
                                    "nonStandardJsDocs",
                                    "strictModuleDepCheck",
                                    "undefinedVars",
                                    "unknownDefines",
                                    "visibility",
                                ],
                                jscomp_off: [
                                    "fileoverviewTags",
                                    "deprecated",
                                    "uselessCode",
                                    "suspiciousCode",
                                    "checkTypes",
                                ],
                                languageOut,
                                externs: "support/externs/sk.js",

                                // https://stackoverflow.com/questions/43807412/shared-polyfills-in-google-closure-compiler#43835873
                                rewritePolyfills: false,
                                // injectLibraries: false, // This will prevent use of async/await. Removing this will allow async/await, but will include all the necessary polyfills at the top of every file that needs them.

                                // useful for debugging
                                // warningLevel: "QUIET",
                                // formatting: 'PRETTY_PRINT',
                                // debug: true,
                                // renaming: false
                            });

                            const compiler = new Compiler(opts);

                            let contents = await new Promise((resolve, reject) => {
                                compiler.run((exitCode, stdOut, stdErr) => {
                                    if (exitCode === 0) {
                                        resolve(stdOut);
                                    } else {
                                        reject(stdErr);
                                    }
                                });
                            });
                            const kb = Math.round(Buffer.byteLength(contents, "utf8") / 1000);
                            console.log(`${kb} kb`);
                            js_bytes += kb;

                            ret.files[fullname] = contents;
                            if (singleFile && file === singleFile) {
                                return;
                            }
                        } else {
                            ret.files[fullname] = fs.readFileSync(fullname, "utf8");
                        }
                    }
                }
            }
        }
    }
    if (!depth && singleFile) {
        console.error(`Unable to compile ${singleFile}: not found in src`);
    }
}

async function buildJsonFile(name, dirs, exts, outfile, options) {
    options = options || {};
    const ret = { files: {} };

    await processDirectories(dirs, exts, ret, options);

    const contents = "Sk." + name + "=" + JSON.stringify(ret, null, 2);
    if (options.singleFile) {
        return;
    }
    fs.writeFileSync(outfile, contents, "utf8");
    if (js_bytes) {
        console.log(`js lib size: ${js_bytes} kb`);
    }
}

async function main() {
    if (process.argv.includes("stdlib")) {
        let excludes = [];
        if (fs.existsSync(excludeFileName)) {
            excludes = JSON.parse(fs.readFileSync(excludeFileName));
        }

        const production = process.argv.includes("prod");
        const langMatch = process.env.npm_config_argv.match(/env\.languageOut=(?<lang>\w+)/);
        const languageOut = (langMatch && langMatch.groups.lang) || DEFAULT_LANG_OUT;
        console.log(languageOut);

        const opts = {
            recursive: true,
            excludes: excludes,
            production,
            languageOut,
        };

        await buildJsonFile("builtinFiles", ["src/builtin", "src/lib"], [".js", ".py"], "dist/skulpt-stdlib.js", opts);
        let stat = fs.statSync("dist/skulpt-stdlib.js");

        console.log(`\nstd-lib size: ${Math.round(stat.size / 1000)} kb`);
        console.log("\nUpdated dist/skulpt-stdlib.js");
        if (production) {
            updateConstructorNames();
        }
    } else if (process.argv.includes("unit2")) {
        if (!fs.existsSync("support/tmp")) {
            fs.mkdirSync("support/tmp");
        }
        buildJsonFile("unit2", ["test/unit"], [".py"], "support/tmp/unit2.js", { recursive: true });
    } else if (process.argv.includes("unit3")) {
        if (!fs.existsSync("support/tmp")) {
            fs.mkdirSync("support/tmp");
        }
        buildJsonFile("unit3", ["test/unit3"], [".py"], "support/tmp/unit3.js");
    } else if (process.argv.includes("compile")) {
        // compile a single file from the stdlib
        // useful for debugging compilation errors in the stdlib
        let singleFile = process.argv[3];
        if (!singleFile.endsWith(".js")) {
            singleFile += ".js";
        }

        const opts = {
            recursive: true,
            excludes: [],
            production: true,
            languageOut: DEFAULT_LANG_OUT,
            singleFile,
        };
        await buildJsonFile("builtinFiles", ["src/builtin", "src/lib"], [".js"], "dist/" + singleFile, opts);
    }
}

/**
 * A helper function to change the constructor name of builtins
 *
 * Sk.builtin.str=Sk.abstr.buildNativeClass("str": {constructor: function()...
 * becomes
 * Sk.builtin.str=Sk.abstr.buildNativeClass("str": {constructor: function str()...
 *
 * Useful for debugging in the console
 * Stops builtin types all being called 'constructor'
 */
function updateConstructorNames() {
    try {
        const minFile = "dist/skulpt.min.js";
        fs.readFile(minFile, "utf8", (err, data) => {
            if (err) {
                return console.error(err);
            }
            const result = data.replace(
                /\.([\w]+)=Sk\.abstr\.build(Native|Iterator)Class\("([\w]+)",\{constructor:function\(/g,
                '.$1=Sk.abstr.build$2Class("$3",{constructor:function $1('
            );

            fs.writeFile(minFile, result, "utf8", function (err) {
                if (err) {
                    return console.log(err);
                }
            });
        });
    } catch (e) {
        console.error(e);
    }
}

main().catch((e) => {
    console.error(e);
});
