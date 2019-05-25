const fs = require('fs');
const path = require('path');

function processDirectories(dirs, recursive, exts, ret) {
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
		    ret.files[fullname] = fs.readFileSync(fullname, 'utf8');
		}
	    }
	});
    });
};


function buildJsonFile(name, dirs, recursive, exts, outfile) {
    var dir, file;
    let ret = {};
    ret.files = {};

    processDirectories(dirs, recursive, exts, ret);

    let contents = "Sk." + name + "=" + JSON.stringify(ret);
    fs.writeFileSync(outfile, contents, 'utf8');
    console.log("Updated " + outfile + ".");
}

if (process.argv.includes("internal")) {
    buildJsonFile("internalPy", ["src"], false, [".py"], "src/internalpython.js");
} else if (process.argv.includes("builtin")) {
    buildJsonFile("builtinFiles", ["src/builtin", "src/lib"], true, [".js", ".py"], "dist/skulpt-stdlib.js");
} else if (process.argv.includes("unit2")) {
    buildJsonFile("unit2", ["test/unit"], false, [".py"], "support/tmp/unit2.js");
} else if (process.argv.includes("unit3")) {
    buildJsonFile("unit3", ["test/unit3"], false, [".py"], "support/tmp/unit3.js");
}
