const path = require('path');
const webpack = require('webpack');
const ClosureWebpackPlugin = require('closure-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const git = new GitRevisionPlugin({branch: true});

const styleexcludes = /(node_modules)|(support)|(gen)|(tokenize.js)|(symtable.js)|(compile.js)|(ast.js)|(internalpython.js)/;

module.exports = (env, argv) => {
    var opt = {
        minimize: false
    };
    var outfile = 'skulpt.js';
    var assertfile = './assert-dev.js';
    var mod = {};

    if (argv.mode === 'production') {
        opt = {
            noEmitOnErrors: true,
            minimizer: [
                new ClosureWebpackPlugin({mode: 'STANDARD'}, {
                    jscomp_error: ['accessControls', 'checkRegExp', 'checkTypes', 'checkVars',
                                   'deprecated', 'invalidCasts', 'missingProperties',
                                   'nonStandardJsDocs', 'strictModuleDepCheck', 'undefinedVars',
                                   'unknownDefines', 'visibility'],
                    jscomp_off: ['fileoverviewTags', 'deprecated'],
		    externs: 'support/externs/sk.js'
                })
            ]
        };
        outfile = 'skulpt.min.js';
        assertfile = './assert-prod.js';
	mod = {
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
                },
                {
                     test: /\.js$/,
                     enforce: 'pre',
                     exclude: styleexcludes,
                     loader: 'eslint-loader'
                }
            ]
        };
    }

    var config = {
        entry: './src/main.js',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: outfile
        },
        devtool: 'source-map',
        plugins: [
            new CleanWebpackPlugin(),
            new webpack.DefinePlugin({
                GITVERSION: JSON.stringify(git.version()),
                GITHASH: JSON.stringify(git.commithash()),
                GITBRANCH: JSON.stringify(git.branch()),
                BUILDDATE: JSON.stringify(new Date())
            })
        ],
        optimization: opt,
        resolve: {
            alias: {
                'assert': assertfile
            }
        },
        module: mod
    };

    return config;
};
