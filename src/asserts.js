Sk.asserts = {};

let ENABLE_ASSERTS = ENABLEASSERTS;

Object.defineProperty(Sk.asserts, "ENABLE_ASSERTS", {
    get() {
        return ENABLE_ASSERTS;
    },
    set(v) {
        ENABLE_ASSERTS = v;
    },
});

/**
 * Cause assertion failure when condition is false.
 *
 * @param {Function} condition condition to check
 * @param {string=} message error message
 */
Sk.asserts.assert = function (condition, message) {
    if (ENABLE_ASSERTS) {
        condition = condition();
        if (!condition) {
            let msg = "Assertion failure";
            if (message) {
                msg = msg + ": " + message;
            }
            throw new Error(msg);
        }
    }
};
Sk.exportSymbol("Sk.asserts.assert", Sk.asserts.assert);

/**
 * Cause assertion failure.
 *
 * @param {string=} message error message
 */
Sk.asserts.fail = function (message) {
    if (ENABLE_ASSERTS) {
        var msg = "Assertion failure";
        if (message) {
            msg = msg + ": " + message;
        }
        throw new Error(msg);
    }
};
Sk.exportSymbol("Sk.asserts.fail", Sk.asserts.fail);
