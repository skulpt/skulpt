const path = require('path');
const shell = require('shelljs');

shell.cp(path.resolve(__dirname, "..", "..", "dist", "skulpt.min.js"),
	 path.resolve(__dirname, "..", "..", "doc", "static", ""));
shell.cp(path.resolve(__dirname, "..", "..", "dist", "skulpt-stdlib.js"),
	 path.resolve(__dirname, "..", "..", "doc", "static", ""));
shell.cp(path.resolve(__dirname, "..", "..", "dist", "debugger.js"),
	 path.resolve(__dirname, "..", "..", "doc", "static", "debugger", ""));
