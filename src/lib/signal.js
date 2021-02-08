var $builtinmodule = function (name) {
    var mod = {};

    mod.SIG_DFL = new Sk.builtin.int_(0);
    mod.SIG_IGN = new Sk.builtin.int_(1);

    // Symbolic Signal numbers

    /**
     * The signal corresponding to the Ctrl+C keystroke event. This signal can only be used with os.kill().
     */
    mod.CTRL_C_EVENT = new Sk.builtin.int_(0);

    /**
     * The signal corresponding to the Ctrl+Break keystroke event. This signal can only be used with os.kill().
     */
    mod.CTRL_BREAK_EVENT = new Sk.builtin.int_(0);

    mod.NSIG = new Sk.builtin.int_(23);

    // Hangup detected
    mod.SIGHUP = new Sk.builtin.int_(1);

    /**
     * Interrupt from keyboard
     */
    mod.SIGNINT = new Sk.builtin.int_(2);

    // Illegal instruction; CPU attempted to execute and instruction it did not understand, invalid instruction in jumping to an address
    mod.SIGILL = new Sk.builtin.int_(4);

    // Floating-point exception
    mod.SIGFPE = new Sk.builtin.int_(8);

    // Kill, unblockable
    mod.SIGKILL = new Sk.builtin.int_(9);

    // Segmentation violation
    mod.SIGSEGV = new Sk.builtin.int_(11);

    // Termination request
    mod.SIGTERM = new Sk.builtin.int_(15);

    mod.SIGBREAK = new Sk.builtin.int_(21);

    // Abnormal termination
    mod.SIGABRT = new Sk.builtin.int_(22);


    /**
     * Hold the execution of skulpt until an external signal has been
     * triggered.
     * 
     * @returns
     */    
    mod.pause = new Sk.builtin.func(function () {
        Sk.builtin.pyCheckArgsLen("pause", arguments.length, 0, 0);
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
        susp.suspend();
    });

    mod.signal = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError('signal.signal is not supported.');
    });

    return mod;
};
