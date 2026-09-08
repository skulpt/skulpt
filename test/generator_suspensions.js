const assert = require("assert");
const fs = require("fs");
const load = require("../support/run/require-skulpt").requireSkulpt;
load(false);
const events = [];
Sk.builtins.suspend_probe = new Sk.builtin.func(function (phase) {
    events.push("start " + phase.v);
    const suspension = new Sk.misceval.Suspension();
    suspension.data = { type: "generator test" };
    suspension.resume = () => {
        assert.strictEqual(Sk.globals.g.gi$running, true);
        assert.strictEqual(Sk.globals.child.gi$running, true);
        events.push("finish " + phase.v);
        return Sk.builtin.none.none$;
    };
    return suspension;
});
Sk.configure({ read: (file) => fs.readFileSync(file, "utf8"), __future__: Sk.python3 });
const source = `
def inner():
    try:
        suspend_probe('body')
        try:
            yield 1
        except ValueError:
            suspend_probe('throw')
            yield 2
    finally:
        suspend_probe('close')
child = inner()
def outer():
    yield from child
g = outer()
assert next(g) == 1
assert not g.gi_running and not child.gi_running
assert g.throw(ValueError) == 2
assert not g.gi_running and not child.gi_running
g.close()
assert not g.gi_running and not child.gi_running
assert list(g) == []
`;
let result = Sk.importMainWithBody("<generator suspension test>", false, source, true);
while (result instanceof Sk.misceval.Suspension) {
    assert.strictEqual(Sk.globals.g.gi$running, true);
    assert.throws(() => Sk.globals.g.tp$iternext(true), (e) => e instanceof Sk.builtin.ValueError);
    result = result.resume();
}
assert.deepStrictEqual(events, ["start body", "finish body", "start throw", "finish throw", "start close", "finish close"]);

// Yield itself needs a saved frame even in synchronous compiled code.
Sk.importMainWithBody("<synchronous generator test>", false, "def gen():\n    yield 42\nassert list(gen()) == [42]\n", false);
console.log("Generator suspension tests passed");
