'use strict';
var sass = require('node-sass');
var async = require('async');

module.exports = function (grunt) {
	grunt.registerMultiTask('sass', 'Compile SCSS to CSS', function () {
		var options = this.options({
			includePaths: [],
			outputStyle: 'nested',
			sourceComments: 'none'
		});

		async.eachSeries(this.files, function (el, next) {
			sass.render({
				file: el.src[0],
				success: function (css) {
					grunt.file.write(el.dest, css);
					grunt.log.writeln('File "' + el.dest + '" created.');
					next();
				},
				error: function (err) {
					grunt.warn(err);
				},
				includePaths: options.includePaths,
				outputStyle: options.outputStyle,
				sourceComments: options.sourceComments
			});
		}, this.async());
	});
};
