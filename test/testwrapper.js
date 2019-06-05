const reqskulpt = require('../support/run/require-skulpt').requireSkulpt;

// Import Skulpt
var skulpt = reqskulpt(false);
if (skulpt === null) {
    process.exit(1);
}

// Run tests
require('./test.js');
