const fs = require('fs');
const path = require('path');
const minify = require('babel-minify');

function buildBundle() {
    let vendor = fs.readFileSync('dist/vendor.js');
    vendor = minify(vendor).code;

    let skulpt = fs.readFileSync('dist/internal.min.js');

    fs.writeFileSync('dist/skulpt.min.js', vendor + "\n" + skulpt);
    console.log("Bundled skulpt.min.js.");
};

buildBundle();
