var $builtinmodule = function (name) {
    var mod = {};


    /**
     * Hold the execution of skulpt until an external signal has been
     * triggered.
     * 
     * @returns
     */    
    mod.pause = new Sk.builtin.func(function () {
        Sk.builtin.pyCheckArgs("pause", arguments, 0, 0);
        var susp = new Sk.misceval.Suspension();
        susp.resume = function () {
            return Sk.builtin.none.none$;
        };
        susp.data = {
            type: "Sk.promise",
            promise: new Promise(function (resolve, reject) {
                if (Sk.signals != null && Sk.signals.addEventListener) {
                    // Define handler here, in order to remove it later
                    function handleSignal (signal) {
                        Sk.signals.removeEventListener(handleSignal);
                        resolve();
                    }
                    Sk.signals.addEventListener(handleSignal);
                } else {
                    console.warn('signal.pause() not supported');
                    Sk.misceval.print_('signal.pause() not supported')
                    // if signal has not been configured, just resume immediatelly
                    resolve();
                }
            })
        };
        return susp;
    });

    return mod;
};