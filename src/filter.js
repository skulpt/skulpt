/**
 * @constructor
 * @param {Object} iterable
 * @extends Sk.builtin.object
 */
Sk.builtin.filter = function filter (fun, iterable) {
    var result;
    var iter, item;
    var retval;
    var ret;
    var add;
    var ctor;
    var ret1;
    Sk.builtin.pyCheckArgsLen("filter", arguments.length, 2, 2);

    if (!(this instanceof Sk.builtin.filter) && (Sk.__future__.python_version)) {
        return new Sk.builtin.filter(fun, iterable);
    }

    if (!Sk.builtin.checkIterable(iterable)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
    }

    ctor = function () {
        return [];
    };
    add = function (iter, item) {
        iter.push(item);
        return iter;
    };
    ret = function (iter) {
        return new Sk.builtin.list(iter);
    };

    if (iterable.__class__ === Sk.builtin.str) {
        ctor = function () {
            return new Sk.builtin.str("");
        };
        add = function (iter, item) {
            return iter.sq$concat(item);
        };
        ret = function (iter) {
            return iter;
        };
    } else if (iterable.__class__ === Sk.builtin.tuple) {
        ret = function (iter) {
            return new Sk.builtin.tuple(iter);
        };
    }

    retval = ctor();

    for (iter = Sk.abstr.iter(iterable), item = iter.tp$iternext();
        item !== undefined;
        item = iter.tp$iternext()) {
        if (fun === Sk.builtin.none.none$) {
            result = new Sk.builtin.bool( item);
        } else {
            result = Sk.misceval.callsimArray(fun, [item]);
        }

        if (Sk.misceval.isTrue(result)) {
            retval = add(retval, item);
        }
    }
    if (!(Sk.__future__.python_version)) {
        return ret(retval);
    }
    ret1 = ret(retval).tp$iter();
    this.tp$iternext = function () {
        var next = ret1.tp$iternext();
        if (next === undefined) {
            return undefined;
        }
        return next;
    };
    this.tp$iter = function () {
        return this;
    };

    this.__class__ = Sk.builtin.filter;
    return this;
};


Sk.abstr.setUpInheritance("filter", Sk.builtin.filter, Sk.builtin.object);

Sk.builtin.filter.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    return self.tp$iter();
});

Sk.builtin.filter.prototype.next$ = function (self) {
    return self.tp$iternext();
};

Sk.builtin.filter.prototype["$r"] = function () {
    return new Sk.builtin.str("<filter object>");
};