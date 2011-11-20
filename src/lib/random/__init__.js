var $builtinmodule = function(name)
{
    var mod = {};

    var checkArgs = function(expected, actual, func) {
        if (actual != expected ) {
            throw new Sk.builtin.TypeError(func + " takes exactly " + expected +
                    " positional argument (" + actual + " given)")
        }
    }

    mod.random = new Sk.builtin.func(function() {
	return Math.random();
    });

    mod.randint = new Sk.builtin.func(function(low,high) {
        checkArgs(2,arguments.length,"randint()")
        return Math.round(Math.random()*(high-low))+low;
    });

    mod.randrange = new Sk.builtin.func(function(low,high) {
        if (high === undefined) {
            high = low;
            low = 0;
        }
        high = high - 1;
        return Math.round(Math.random()*(high-low))+low;
    });
    return mod;
}