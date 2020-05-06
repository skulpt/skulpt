/**
 * @constructor
 */
Sk.builtin.module = function module () {
};
Sk.exportSymbol("Sk.builtin.module", Sk.builtin.module);

Sk.builtin.module.prototype.ob$type = Sk.builtin.type.$makeIntoTypeObj("module", Sk.builtin.module);
Sk.builtin.module.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.module.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
Sk.builtin.module.prototype.tp$name = "module";

Sk.builtin.module.prototype.$r = function() {
    let get = (s) => {
        let v = this.tp$getattr(new Sk.builtin.str(s));
        return Sk.builtin.repr(v || Sk.builtin.str.$emptystr).$jsstr();
    };
    return new Sk.builtin.str("<module " + get("__name__") + " from " + get("__file__") + ">");
};
