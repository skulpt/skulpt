/**
 * @constructor
 */
Sk.builtin.module = function module (name) {
    if (!(this instanceof Sk.builtin.module)) {
        return new Sk.builtin.module(name);
    }
    this["$d"] = {__name__: name};
    this["$d"]["__dict__"] = this["$d"];
    return this;
};
Sk.exportSymbol("Sk.builtin.module", Sk.builtin.module);

Sk.builtin.module.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("module", Sk.builtin.module);
Sk.builtin.module.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.module.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
Sk.builtin.module.prototype.tp$name = "module";
