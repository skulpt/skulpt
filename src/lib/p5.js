function $builtinmodule() {
    const {
        builtins: __builtins__,
        builtin: {
            str: pyStr,
            func: pyFunc,
            none: { none$: pyNone },
        },
        misceval: { callsimArray: pyCall },
        ffi: { toPy },
    } = Sk;

    const mod = {
        __name__: new pyStr("p5"),
        p5: toPy(window.p5),
        __doc__: new pyStr("A skulpt implementation of the p5 library"),
    };

    // override _start to a plain function and call this in run when we need it
    let _start;
    Object.defineProperty(window.p5.prototype, "_start", {
        get() {
            return () => {};
        },
        set(val) {
            _start = val;
        },
        configurable: true,
    });

    function sketch(p) {
        for (let i in window.p5.prototype) {
            const asStr = new pyStr(i);
            const mangled = asStr.$mangled;
            // it would be crazy to override builtins like print
            if (!(mangled in __builtins__)) {
                mod[mangled] = p.tp$getattr(asStr);
            }
        }
    }

    // create an instance of p5 and assign all the attributes to mod
    const p = pyCall(mod.p5, [new pyFunc(sketch), toPy(Sk.canvas)]);

    const wrapFunc = (func) => () => {
        try {
            pyCall(func);
        } catch (e) {
            Sk.uncaughtException && Sk.uncaughtException(e);
        }
        // note we can't suspend because promises are just ignored in these methods
    };

    mod.run = new pyFunc(function run() {
        const main = Sk.sysmodules.quick$lookup(new pyStr("__main__")).$d;
        delete window.p5.prototype._start;
        const pInstance = p.valueOf();
        pInstance._start = _start;

        ["preload", "setup", "draw", "deviceMoved", "deviceTurned", "deviceShaken",
        "windowResized", "keyPressed", "keyReleased", "keyTyped", "mousePressed",
        "mouseReleased", "mouseClicked", "doubleClicked", "mouseMoved", "mouseDragged",
        "mouseWheel", "touchStarted", "touchMoved", "touchEnded"].forEach((methodName) => {
            const method = main[methodName];
            if (method !== undefined) {
                pInstance[methodName] = wrapFunc(method);
            }
        });

        // p5 wants to change the global namespace of things like frameCount, key. So let it
        const _setProperty = pInstance._setProperty;
        pInstance._setProperty = function (prop, val) {
            _setProperty.call(this, prop, val);
            const asStr = new pyStr(prop);
            const mangled = asStr.$mangled;
            mod[mangled] = main[mangled] = p.tp$getattr(asStr);
        };

        pInstance._start();
        return pyNone;
    });

    return mod;
}
