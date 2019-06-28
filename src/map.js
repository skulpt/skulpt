/**
 * @constructor
 * @param {Object} iterable
 * @extends Sk.builtin.object
 */
Sk.builtin.map_ = function map_ (fun, seq) {
    var next;
    var nones;
    var args;
    var argnum;
    var getnext;
    var i;
    var item;
    var iterables;
    var combined;
    var args;

    Sk.builtin.pyCheckArgsLen("map_", arguments.length, 2);

    if (!(this instanceof Sk.builtin.map_)) {
        args = Array.prototype.slice.apply(arguments).slice(1);
        return new Sk.builtin.map_(fun, ...args);
    }

    if (arguments.length > 2) {
        // Pack sequences into one list of Javascript Arrays
        iterables = Array.prototype.slice.apply(arguments).slice(1);
        for (i = 0; i < iterables.length; i++) {
            if (!Sk.builtin.checkIterable(iterables[i])) {
                argnum = parseInt(i, 10) + 2;
                throw new Sk.builtin.TypeError("argument " + argnum + " to map() must support iteration");
            }
            iterables[i] = Sk.abstr.iter(iterables[i]);
        }

        getnext = function () {
            combined = [];
            for (i = 0; i < iterables.length; i++) {
                next = iterables[i].tp$iternext();
                if (next === undefined) {
                    return undefined;

                } else {
                    combined.push(next);
                }
            }
            if (nones !== iterables.length) {
                return combined;
            }
            return undefined;
        };
    }

    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    if (!(arguments.length > 2)) {
        seq = Sk.abstr.iter(seq);
    }
    this.tp$iternext = function () {
        if (getnext) {
            item = getnext();
        } else {
            item = seq.tp$iternext();
        }
        if (item === undefined) {
            return undefined;
        }
        if (fun === Sk.builtin.none.none$) {
            if (item instanceof Array) {
                item = new Sk.builtin.tuple(item);
                return item;
            }
            return item;
        }
        if (!(item instanceof Array)) {
            item = [item];
        }
        return Sk.misceval.applyOrSuspend(fun, undefined, undefined, undefined, item);
    };

    this.tp$iter = function () {
        return this;
    };

    this.__class__ = Sk.builtin.map_;
    return this;

};

Sk.abstr.setUpInheritance("map", Sk.builtin.map_, Sk.builtin.object);

Sk.builtin.map_.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    return self.tp$iter();
});

Sk.builtin.map_.prototype.next$ = function (self) {
    return self.tp$iternext();
};

Sk.builtin.map_.prototype["$r"] = function () {
    return new Sk.builtin.str("<map object>");
};

Sk.exportSymbol("Sk.builtin.map_", Sk.builtin.map_);