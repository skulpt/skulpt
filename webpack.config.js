const path = require('path');
const webpack = require('webpack');
const shell = require('shelljs');
const chalk = require('chalk');

const ClosureWebpackPlugin = require('closure-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const CompressionWebpackPlugin = require('compression-webpack-plugin');

const git = new GitRevisionPlugin({branch: true});

const styleexcludes = /(node_modules)|(support)|(gen)|(tokenize.js)|(symtable.js)|(compile.js)|(ast.js)|(internalpython.js)/;

if (!shell.which('git')) {
    console.log(chalk.red("WARNING: Cannot find git!  Unsure if working directory is clean."));
}

var output = shell.exec('git diff-index --quiet HEAD');
if (output.code !== 0) {
    console.log(chalk.red("WARNING: Working directory is not clean."));
} else {
    console.log("Working directory is clean.");
}

module.exports = (env, argv) => {
    var opt = {
        minimize: false
    };
    var outfile = 'skulpt.js';
    var assertfile = './assert-dev.js';
    var mod = {};
    var externals = {};
    var plugins = [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            { from: 'debugger/debugger.js', to: 'debugger.js' }
        ]),
        new webpack.DefinePlugin({
            GITVERSION: JSON.stringify(git.version()),
            GITHASH: JSON.stringify(git.commithash()),
            GITBRANCH: JSON.stringify(git.branch()),
            BUILDDATE: JSON.stringify(new Date())
        }),
        new CompressionWebpackPlugin({
            include: /^skulpt\.min\.js$/,
            algorithm: 'gzip'
        }),
    ];


    if (argv.mode === 'production') {
        opt = {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]|[\\/]support[\\/]/,
                        name: 'vendor',
                        chunks: 'initial',
                        filename: 'vendor.js'
                    }
                }
            },
            noEmitOnErrors: true,
            minimizer: [
                new ClosureWebpackPlugin({mode: 'STANDARD'}, {
                    jscomp_error: ['accessControls', 'checkRegExp', 'checkTypes', 'checkVars',
                                   'invalidCasts', 'missingProperties',
                                   'nonStandardJsDocs', 'strictModuleDepCheck', 'undefinedVars',
                                   'unknownDefines', 'visibility'],
                    jscomp_off: ['fileoverviewTags', 'deprecated'],
                    languageOut: (env && env.languageOut) ? env.languageOut : 'ECMASCRIPT_2015',
                    externs: ['support/externs/sk.js',
                              'support/externs/strptime-extern.js',
                              'support/externs/strftime-extern.js',
                              'support/externs/biginteger-extern.js']
                })
            ]
        };
        outfile = 'internal.min.js';
        assertfile = './assert-prod.js';

        plugins.push({
            // Inlined plugin to fix up webpack code for the closure compiler

            apply: (compiler) => {
                compiler.hooks.compilation.tap('CompilationPlugin', (compilation, compilationParams) => {
                    compilation.hooks.optimizeChunkAssets.tap('ReplacePlugin', chunks => {
                        // Skulpt code which will run through closure compiler
                        let skulptCode = compilation.assets['internal.min.js']['_source']['children'];
                        for (line in skulptCode) {
                            if ((skulptCode[line]['_source']) && (skulptCode[line]['_source']['_name'] === 'webpack/bootstrap')) {
                                let bootstrap= skulptCode[line]['_source']['_value'];

                                // Access global variable directly, instead of via window
                                bootstrap = bootstrap.replace('window["webpackJsonp"] = window["webpackJsonp"] || []',
                                                              'webpackJsonp = webpackJsonp || []');

                                // Ugly hacks to make closure happy, will need to be updated if webpack bootstrap code changes
                                bootstrap = bootstrap.replace('var moduleId, chunkId, i = 0, resolves = [];',
                                                              'var moduleId; var chunkId; var i = 0; var resolves = [];')
                                bootstrap = bootstrap.replace('modules[moduleId] = moreModules[moduleId];',
                                                              '/** @suppress {checkTypes} */ modules[moduleId] = moreModules[moduleId];')

                                skulptCode[line]['_source']['_value'] = bootstrap;
                                break;
                            }
                        }

                        // Vendor code which will not run through closure compiler
                        let vendorCode = compilation.assets['vendor.js']['_source']['children'];
                        for (line in vendorCode) {
                            // Declare global with "var" instead of referencing window
                            let newLine = vendorCode[line].replace('(window["webpackJsonp"] = window["webpackJsonp"] || [])',
                                                                   'var webpackJsonp = webpackJsonp || []; webpackJsonp');
                            if (newLine != vendorCode[line]) {
                                vendorCode[line] = newLine;
                                break;
                            }
                        }
                    });
                })
            }
        });

        mod = {
            rules: [
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
        plugins: plugins,
        externals: externals,
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
