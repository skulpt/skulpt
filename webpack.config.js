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
    var mod = {};

    if (argv.mode === 'production') {
        opt = {
            noEmitOnErrors: true,
            minimizer: [
                new ClosureWebpackPlugin({mode: 'STANDARD'}, {
                    jscomp_error: ['accessControls', 'checkRegExp', 'checkTypes', 'checkVars',
                                   'invalidCasts', 'missingProperties',
                                   'nonStandardJsDocs', 'strictModuleDepCheck', 'undefinedVars',
                                   'unknownDefines', 'visibility'],
                    jscomp_off: ['fileoverviewTags', 'deprecated'],
                    languageOut: (env && env.languageOut) ? env.languageOut : 'ECMASCRIPT_2015',
                    externs: 'support/externs/sk.js'
                })
            ]
        };
        outfile = 'skulpt.min.js';
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
                GITVERSION: JSON.stringify(git.version()),
                GITHASH: JSON.stringify(git.commithash()),
                GITBRANCH: JSON.stringify(git.branch()),
                BUILDDATE: JSON.stringify(new Date()),
                ENABLEASSERTS: argv.mode === "production" ? false : true,
            }),
            new CompressionWebpackPlugin({
                include: /^skulpt\.min\.js$/,
                algorithm: 'gzip'
            })
        ],
        optimization: opt,
        module: mod
    };

    return config;
};
