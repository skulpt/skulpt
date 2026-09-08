const assert = require("assert");

function pause(resume) {
    const suspension = new Sk.misceval.Suspension();
    suspension.resume = resume;
    return suspension;
}

// Cleanup follows the complete operation, even when the catch handler and
// cleanup themselves suspend. The catch handler's result survives cleanup.
const events = [];
const failure = new Error("body");
let result = Sk.misceval.tryCatch(
    () => pause(() => pause(() => { events.push("body"); throw failure; })),
    (error) => {
        assert.strictEqual(error, failure);
        return pause(() => { events.push("catch"); return 42; });
    },
    () => { events.push("cleanup"); return pause(() => events.push("cleanup done")); }
);
assert.deepStrictEqual(events, []);
while (result instanceof Sk.misceval.Suspension) {
    result = result.resume();
}
assert.strictEqual(result, 42);
assert.deepStrictEqual(events, ["body", "catch", "cleanup", "cleanup done"]);

for (const suspended of [false, true]) {
    for (const cleanupFails of [false, true]) {
        let cleanups = 0;
        const cleanupError = new Error("cleanup");
        assert.throws(() => {
            let pending = Sk.misceval.tryCatch(
                () => { throw failure; },
                (error) => { throw error; },
                () => {
                    cleanups++;
                    const finish = () => { if (cleanupFails) { throw cleanupError; } };
                    return suspended ? pause(finish) : finish();
                }
            );
            while (pending instanceof Sk.misceval.Suspension) {
                pending = pending.resume();
            }
        }, (error) => error === (cleanupFails ? cleanupError : failure));
        assert.strictEqual(cleanups, 1);
    }
}

assert.strictEqual(Sk.misceval.tryCatch(() => 7, () => 0, () => 99), 7);
console.log("Suspension cleanup tests passed");
