const path = require('path');
const ClosureWebpackPlugin = require('closure-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const styleexcludes = /(node_modules)|(support)|(gen)|(tokenize.js)|(symtable.js)|(compile.js)|(ast.js)|(internalpython.js)/;

module.exports = (env, argv) => {
    var opt = {
	minimize: false
    };
    var outfile = 'skulpt.js';

    if (argv.mode === 'production') {
	opt = {
	    noEmitOnErrors: true,
	    minimizer: [
		new ClosureWebpackPlugin({mode: 'STANDARD'}, {
		})
	    ]
	};
	outfile = 'skulpt.min.js';
    }

    var config = {
	entry: './src/main.js',
	output: {
            path: path.resolve(__dirname, 'dist'),
	    filename: outfile
	},
	devtool: 'source-map',
	plugins: [
	    new CleanWebpackPlugin()
	],
	optimization: opt,
	module: {
	    rules: [
		{
		    test: /\.js$/,
		    enforce: 'pre',
		    exclude: styleexcludes,
		    use: [
			{
			    loader: 'webpack-jshint-loader',
			    options: {
				emitErrors: true
			    }
			}
		    ]
		}
		// {
		// 	test: /\.js$/,
		// 	enforce: 'pre',
		// 	exclude: styleexcludes,
		// 	loader: 'eslint-loader'
		// }
	    ]
	}
    };

    return config;
};
