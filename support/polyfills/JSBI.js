/**
 * functional approach to BigInt
 * 
 * We use the JSBI library if BigInt is not available
 * https://github.com/GoogleChromeLabs/jsbi/
 * 
 * If BigInt is available then we use the same functions as defined in the JSBI library
 * but use BigInt as the primitive type
 * 
 */
if (Sk.global.BigInt === undefined) {
    Sk.global.JSBI = require("jsbi");
    // __isBigInt is not part of the public api so include it if this is ever removed
    Sk.global.JSBI.__isBigInt = Sk.global.JSBI.__isBigInt || ((x) => x instanceof JSBI);
} else {
    Sk.global.JSBI = Object.assign(Object.create(null), {
        BigInt: Sk.global.BigInt,
        toNumber: (x) => Number(x),
        toString: (x) => x.toString(),
        __isBigInt: (x) => typeof x === "bigint",
        unaryMinus: (x) => -x,
        bitwiseNot: (x) => ~x,
        bitwiseAnd: (x, y) => x & y,
        bitwiseOr: (x, y) => x | y,
        bitwiseXor: (x, y) => x ^ y,
        exponentiate: (x, y) => x ** y,
        multiply: (x, y) => x * y,
        divide: (x, y) => x / y,
        remainder: (x, y) => x % y,
        add: (x, y) => x + y,
        subtract: (x, y) => x - y,
        leftShift: (x, y) => x << y,
        signedRightShift: (x, y) => x >> y,
        unsignedRightShift: (x, y) => x >>> y, // will raise TypeError
        lessThan: (x, y) => x < y,
        lessThanOrEqual: (x, y) => x <= y,
        greaterThan: (x, y) => x > y,
        greaterThanOrEqual: (x, y) => x >= y,
        equal: (x, y) => x == y,
        notEqual: (x, y) => x != y,
    });
}
const JSBI = Sk.global.JSBI;
JSBI.__ZERO = JSBI.BigInt(0);
JSBI.__MAX_SAFE = JSBI.BigInt(Number.MAX_SAFE_INTEGER);
JSBI.__MIN_SAFE = JSBI.BigInt(-Number.MAX_SAFE_INTEGER);
JSBI.numberIfSafe = (val) =>  JSBI.lessThan(val, JSBI.__MAX_SAFE) && JSBI.greaterThan(val, JSBI.__MIN_SAFE) ? JSBI.toNumber(val) : val;

