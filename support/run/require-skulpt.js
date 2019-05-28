const chalk = require('chalk');

module.exports = {
    requireSkulpt: function (requireOptimized) {
        var skulpt;

        try {
            skulpt = require("../../dist/skulpt.min.js");
            console.log(chalk.green("Using skulpt.min.js"));
        } catch (err) {
            if (requireOptimized) {
                skulpt = null;
                console.log(chalk.red("No optimized skulpt distribution, run 'npm run build' first."));
            } else {
                try {
                    skulpt = require("../../dist/skulpt.js");
                    console.log(chalk.blue("Using skulpt.js"));
                } catch (err) {
                    skulpt = null;
                    console.log(chalk.red("No skulpt distribution, run 'npm run build' or 'npm run devbuild' first."));
                }
            }
        }

        return skulpt;
    }
}
