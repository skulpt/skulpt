const assert = require("assert");
const fs = require("fs");
require("../support/run/require-skulpt").requireSkulpt(false);
const events = [];
Sk.builtins.suspend_probe = new Sk.builtin.func(function (phase) {
    events.push("start " + phase.v);
    const suspension = new Sk.misceval.Suspension();
    suspension.data = { type: "contextlib test" };
    suspension.resume = () => {
        events.push("finish " + phase.v);
        if (phase.v === "error") {
            throw new Sk.builtin.ValueError("from suspension");
        }
        return Sk.builtin.none.none$;
    };
    return suspension;
});
Sk.configure({ read: (file) => fs.readFileSync(file, "utf8"), __future__: Sk.python3 });
const source = `
from contextlib import contextmanager, closing
@contextmanager
def manager():
    suspend_probe('enter')
    try:
        yield
    except ValueError:
        pass
    finally:
        suspend_probe('exit')
@manager()
def decorated():
    suspend_probe('body')
    return 42
assert decorated() == 42
@manager()
def suppressed():
    suspend_probe('error')
assert suppressed() is None
with manager():
    suspend_probe('body')
class Resource:
    @property
    def close(self):
        suspend_probe('close lookup')
        return self.finish
    def finish(self):
        suspend_probe('close')
with closing(Resource()):
    pass
@contextmanager
def failed_entry():
    suspend_probe('error')
    yield
@failed_entry()
def never_called():
    assert False
try:
    never_called()
except ValueError as error:
    assert str(error) == 'from suspension'
else:
    assert False
`;
let result = Sk.importMainWithBody("<contextlib suspension test>", false, source, true);
while (result instanceof Sk.misceval.Suspension) {
    result = result.resume();
}
const phases = ["enter", "body", "exit", "enter", "error", "exit", "enter", "body", "exit", "close lookup", "close", "error"];
assert.deepStrictEqual(events, phases.reduce((all, phase) => all.concat("start " + phase, "finish " + phase), []));
console.log("Contextlib suspension tests passed");
