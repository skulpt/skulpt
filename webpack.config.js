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
    var languageOut = (env && env.languageOut) || 'ECMASCRIPT_2018';
    // Production builds targeting ES2020+ have native BigInt and Unicode
    // property escapes, so webpack omits JSBI and the Unicode fallback tables.
    // Older targets and development builds include those fallbacks.
    var esYear = /^ECMASCRIPT_?(\d{4})$/.exec(languageOut);
    var nativeOnly = argv.mode === 'production'
        && (languageOut === 'ECMASCRIPT_NEXT'
            || languageOut === 'STABLE'
            || !!(esYear && Number(esYear[1]) >= 2020));

    if (argv.mode === 'production') {
        opt = {
            noEmitOnErrors: true,
            minimizer: [
                new ClosureWebpackPlugin({mode: 'STANDARD'}, {
                    jscomp_error: ['accessControls', 'checkRegExp', 'checkVars', /*'checkTypes',*/
                                   'invalidCasts', 'missingProperties',
                                   'nonStandardJsDocs', 'strictModuleDepCheck', 'undefinedVars',
                                   'unknownDefines', 'visibility'],
                    jscomp_off: ['deprecated', 'uselessCode', 'suspiciousCode', 'checkTypes',],
                    languageOut: languageOut,
                    externs: 'support/externs/sk.js',
                    rewritePolyfills: true,
                    // compiler flags here
                    //
                    // for debugging help, try these:
                    //
                    // warningLevel: "QUIET",
                    // formatting: 'PRETTY_PRINT',
                    // debug: true,
                    // renaming: false
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
            new CopyWebpackPlugin([
                { from: 'debugger/debugger.js', to: 'debugger.js' }
            ]),
            new webpack.DefinePlugin({
                SKULPT_LANGUAGE_OUT: JSON.stringify(argv.mode === 'production' ? languageOut : null),
                SKULPT_NATIVE_ONLY: nativeOnly,
                SKULPT_VERSION: JSON.stringify(require('./package.json').version),
                GITVERSION: JSON.stringify(git.version()),
                GITHASH: JSON.stringify(git.commithash()),
                GITBRANCH: JSON.stringify(git.branch()),
                BUILDDATE: JSON.stringify(new Date())
            }),
            new CompressionWebpackPlugin({
                include: /\.min\.js$/,
                algorithm: 'gzip'
            })
        ],
        optimization: opt,
        resolve: {
            alias: {
                'assert': assertfile,
            }
        },

        module: mod,
        // uncomment this while working on closure compiler errors
        // externals: {
        //     jsbi: "JSBI",
        // }
    };

    return config;
};
