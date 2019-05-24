const program = require('commander');

program
    .option('-o, --opt', 'use optimized skulpt')
    .parse(process.argv);

// Import Skulpt
var skulptname = 'skulpt.js';
if (program.opt) {
    skulptname = 'skulpt.min.js';
}
require('../dist/' + skulptname);

// Run tests
require('./test.js');

