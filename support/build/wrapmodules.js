const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

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

async function processDirectories(dirs, recursive, exts, ret, minifyjs, excludes) {
    await Promise.all(dirs.map(async (dir) => {
        let files = fs.readdirSync(dir);

        await Promise.all(files.map(async (file) => {
            let fullname = dir + '/' + file;

            if (!excludes.includes(fullname)) {
                let stat = fs.statSync(fullname)

                if (recursive && stat.isDirectory()) {
                    await processDirectories([fullname], recursive, exts, ret, minifyjs, excludes);
                } else if (stat.isFile()) {
                    let ext = path.extname(file);
                    if (exts.includes(ext)) {
                        let contents = fs.readFileSync(fullname, 'utf8');
                        if (minifyjs && (ext == ".js")) {
                            let result = await minify(contents, {
                                compress: {
                                    keep_classnames: true,
                                    keep_fnames: true,
                                    drop_debugger: false,
                                    typeofs: false,
                                },
                                mangle: {
                                    keep_classnames: true,
                                    keep_fnames: true,
                                    safari10: true,
                                },
                            });
                            contents = result.code;
                        }
                        ret.files[fullname] = contents;
                    }
                }
            }
        }));
    }));
};


async function buildJsonFile(name, dirs, exts, outfile, options) {
    options = options || {};
    let recursive = options.recursive || false;
    let minifyjs = options.minifyjs || false;
    let excludes = options.excludes || [];
    let dir, file;
    let ret = {};

    ret.files = {};

    await processDirectories(dirs, recursive, exts, ret, minifyjs, excludes);

    let contents = "Sk." + name + "=" + JSON.stringify(ret);
    fs.writeFileSync(outfile, contents, 'utf8');
    console.log("Updated " + outfile + ".");
}

async function main() {
    if (process.argv.includes("internal")) {
        // await buildJsonFile("internalPy", ["src"], [".py"], "src/internalpython.js");
    } else if (process.argv.includes("builtin")) {
        let excludes = [];
        if (fs.existsSync(excludeFileName)) {
            excludes = JSON.parse(fs.readFileSync(excludeFileName));
        }
        let opts = {
            recursive: true,
            minifyjs: true,
            excludes: excludes
        };

        await buildJsonFile(
            "builtinFiles",
            ["src/builtin", "src/lib"],
            [".js", ".py"],
            "dist/skulpt-stdlib.js",
            opts
        );
    } else if (process.argv.includes("unit2")) {
        if (!fs.existsSync("support/tmp")) {
            fs.mkdirSync("support/tmp");
        }
        await buildJsonFile(
            "unit2",
            ["test/unit"],
            [".py"],
            "support/tmp/unit2.js",
            { recursive: true }
        );
    } else if (process.argv.includes("unit3")) {
        if (!fs.existsSync("support/tmp")) {
            fs.mkdirSync("support/tmp");
        }
        await buildJsonFile(
            "unit3",
            ["test/unit3"],
            [".py"],
            "support/tmp/unit3.js"
        );
    }
}

main().then(() => {
    console.log("wrapmodules done");
}).catch((err) => {
    console.log("wrapmodules FAILED");
    console.log(err);
});
