/**
 * @constructor
 */
Sk.builtin.module = function module () {
};
Sk.exportSymbol("Sk.builtin.module", Sk.builtin.module);

Sk.abstr.setUpInheritance("module", Sk.builtin.module, Sk.builtin.object)

Sk.builtin.module.prototype.$r = function() {
    let get = (s) => {
        let v = this.tp$getattr(new Sk.builtin.str(s));
        return Sk.builtin.repr(v || Sk.builtin.str.$emptystr).$jsstr();
    };
    _name = get("__name__");
    _file = get("__file__");
    if (_file === "''") {
        _file = "(built-in)";
    } else {
        _file = "from " + _file;
    }
    return new Sk.builtin.str("<module " + _name + " " + _file + ">");
};

Sk.builtin.module.prototype.tp$getsets = [
    new Sk.GetSetDef("__dict__", 
    function () {
        // modules in skulpt have a $d as a js object so just return it as a mapping proxy;
        return new Sk.builtin.mappingproxy(this.$d);
    }
)
];