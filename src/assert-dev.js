Sk.asserts = {ENABLE_ASSERTS: true};

/**
 * Cause assertion failure when condition is false.
 * 
 * @param {*} condition condition to check
 * @param {string=} message error message
 */
Sk.asserts.assert = function (condition, message) {
    if (Sk.asserts.ENABLE_ASSERTS && !condition) {
        var msg = "Assertion failure";
        if (message) {
            msg = msg + ": " + message;
        }
        throw new Error(msg);
    }
    return condition;
};
Sk.exportSymbol("Sk.asserts.assert", Sk.asserts.assert);

/**
 * Cause assertion failure.
 * 
 * @param {string=} message error message
 */
Sk.asserts.fail = function (message) {
    if (Sk.asserts.ENABLE_ASSERTS) {
        var msg = "Assertion failure";
        if (message) {
            msg = msg + ": " + message;
        }
        throw new Error(msg);
    }
};
Sk.exportSymbol("Sk.asserts.fail", Sk.asserts.fail);
