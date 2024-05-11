const chalk = require('chalk');

var commands = {
    "run help": "Help on all " + chalk.green("npm") + " commands.",
    "run build": "Production, optimized build. (Output language: ECMASCRIPT_2015)\n\n\tSelect an arbitrary output language with " + chalk.green("npm run build -- --env.languageOut=<language>") + "\n\twhere <language> is an output language supported by the closure compiler",
    "run build-es3": "Production, optimized build. (Output language: ECMASCRIPT3)",
    "run build-es5": "Production, optimized build. (Output language: ECMASCRIPT5)",
    "run build-es19": "Production, optimized build. (Output language: ECMASCRIPT_2019)",
    "run devbuild": "Development, unoptimized build",
    "run watch": "Development, unoptimized build, which will automatically be rebuilt when there are any source changes.",
    "run dist": "Prepare the distribution: build the optimized Skulpt, run all tests, build docs.",
    "run brun <pyfile>": "Run Python <pyfile> in the browser.  This will automatically rebuild the unoptimized Skulpt first.",
    "run btest": "Run all unit tests in the browser.",
    "run repl <py2|py3>": "Open the REPL. You need to build Skulpt (either " + chalk.green("npm run build") + " or " + chalk.green("npm run devbuild") + ") first.",
    "test": "Run all tests. You need to build Skulpt (either " + chalk.green("npm run build") + " or " + chalk.green("npm run devbuild") + ") first.",
    "start <py2|py3> <pyfile>": "Run pyfile using either Python 2 (py2) or Python 3 (py3). You need to build Skulpt (either " + chalk.green("npm run build") + " or " + chalk.green("npm run devbuild") + ") first.",
    "run profile <py2|py3> <pyfile>": "Run pyfile using either Python 2 (py2) or Python 3 (py3) with the profiler on.  Will report the profiling results to the console. You need to build the optimized Skulpt (" + chalk.green("npm run build") + ") first."
};

for (command in commands) {
    console.log(chalk.green("npm " + command));
    console.log("\t" + commands[command]);
    console.log("");
}



