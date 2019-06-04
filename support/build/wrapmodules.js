const fs = require('fs');
const path = require('path');
const uglifyjs = require('uglify-js');

function processDirectories(dirs, recursive, exts, ret, minifyjs) {
    dirs.forEach((dir) => {
	let files = fs.readdirSync(dir);

	files.forEach((file) => {
	    let fullname = dir + '/' + file;
	    let stat = fs.statSync(fullname)

	    if (recursive && stat.isDirectory()) {
		processDirectories([fullname], recursive, exts, ret);
	    } else if (stat.isFile()) {
		let ext = path.extname(file);
		if (exts.includes(ext)) {
		    let contents = fs.readFileSync(fullname, 'utf8');
		    if (minifyjs && (ext == ".js")) {
			let result = uglifyjs.minify(contents);
			if (result.error) {
			    throw new Error("Error minimizing " + fullname + " (uglify js error code: " + result.error + ")");
			}
			contents = result.code;
		    }
		    ret.files[fullname] = contents;
		}
	    }
	});
    });
};


function buildJsonFile(name, dirs, recursive, exts, outfile, minifyjs) {
    var dir, file;
    let ret = {};
    ret.files = {};

    processDirectories(dirs, recursive, exts, ret, minifyjs);

    let contents = "Sk." + name + "=" + JSON.stringify(ret);
    fs.writeFileSync(outfile, contents, 'utf8');
    console.log("Updated " + outfile + ".");
}

if (process.argv.includes("internal")) {
    buildJsonFile("internalPy", ["src"], false, [".py"], "src/internalpython.js", false);
} else if (process.argv.includes("builtin")) {
    buildJsonFile("builtinFiles", ["src/builtin", "src/lib"], true, [".js", ".py"], "dist/skulpt-stdlib.js", true);
} else if (process.argv.includes("unit2")) {
    buildJsonFile("unit2", ["test/unit"], true, [".py"], "support/tmp/unit2.js", false);
} else if (process.argv.includes("unit3")) {
    buildJsonFile("unit3", ["test/unit3"], false, [".py"], "support/tmp/unit3.js", false);
}
