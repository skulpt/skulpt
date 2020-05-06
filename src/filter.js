/**
 * @constructor
 * @param {Object} iterable
 * @extends Sk.builtin.object
 */

Sk.builtin.filter_ = function filter_ (fun, iterable) {
    var it;
    var getitem;
    var result;
    var item;
    Sk.builtin.pyCheckArgsLen("filter_", arguments.length, 2, 2);

    if (!(this instanceof Sk.builtin.filter_)) {
        return new Sk.builtin.filter_(fun, iterable);
    }
    //don't need to check if iterable is an iterable because Sk.abstr.iter will throw the right error msg
    it = Sk.abstr.iter(iterable);
    getitem = function (item) {
        if (fun === Sk.builtin.none.none$) {
            result = item;
        } else {
            result = Sk.misceval.callsimArray(fun, [item]);
        }

        if (Sk.misceval.isTrue(result)) {
            return result;
        }
        return undefined;
    };
    this.tp$iter = function () {
        return this;
    };
    this.tp$iternext = function () {
        item = it.tp$iternext();
        if (item === undefined) {
            return undefined;
        }
        result = getitem(item);
        while (result === undefined) {
            item = it.tp$iternext();
            if (item === undefined) {
                return undefined;
            }
            result = getitem(item);
        }
        return item;
    };
    return this;
};

Sk.abstr.setUpInheritance("filter", Sk.builtin.filter_, Sk.builtin.object);

Sk.builtin.filter_.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    return self.tp$iter();
});

Sk.builtin.filter_.prototype.next$ = function (self) {
    return self.tp$iternext();
};

Sk.builtin.filter_.prototype["$r"] = function () {
    return new Sk.builtin.str("<filter object>");
};

Sk.exportSymbol("Sk.builtin.filter_", Sk.builtin.filter_);
