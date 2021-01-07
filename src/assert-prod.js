Sk.asserts = {};

/**
 * Cause assertion failure when condition is false.
 * 
 * @param {*} condition condition to check
 * @param {string=} message error message
 */
Sk.asserts.assert = function (condition, message) {
    return condition;
};


/**
 * Cause assertion failure.
 * 
 * @param {string=} message error message
 */
Sk.asserts.fail = function (message) {
};

