/**
 * @constructor
 * @param {Object} iterable
 * @extends Sk.builtin.object
 */
Sk.builtin.map = function map (fun, seq) {
    var retval = [];
    var next;
    var nones;
    var args;
    var argnum;
    var i;
    var iterables;
    var combined;
    var ret;
    var ret1;
    var args;
    Sk.builtin.pyCheckArgsLen("map", arguments.length, 2);
    if (!(this instanceof Sk.builtin.map) && (Sk.__future__.python_version)) {
        args = Array.prototype.slice.apply(arguments).slice(1);
        return new Sk.builtin.map(fun, ...args);
    }


    if (arguments.length > 2) {
        // Pack sequences into one list of Javascript Arrays

        combined = [];
        iterables = Array.prototype.slice.apply(arguments).slice(1);
        for (i = 0; i < iterables.length; i++) {
            if (!Sk.builtin.checkIterable(iterables[i])) {
                argnum = parseInt(i, 10) + 2;
                throw new Sk.builtin.TypeError("argument " + argnum + " to map() must support iteration");
            }
            iterables[i] = Sk.abstr.iter(iterables[i]);
        }

        while (true) {
            args = [];
            nones = 0;
            for (i = 0; i < iterables.length; i++) {
                next = iterables[i].tp$iternext();
                if (next === undefined) {
                    args.push(Sk.builtin.none.none$);
                    nones++;
                } else {
                    args.push(next);
                }
            }
            if (nones !== iterables.length) {
                combined.push(args);
            } else {
                // All iterables are done
                break;
            }
        }
        seq = new Sk.builtin.list(combined);
    }

    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    ret = Sk.misceval.chain(Sk.misceval.iterFor(Sk.abstr.iter(seq), function (item) {

        if (fun === Sk.builtin.none.none$) {
            if (item instanceof Array) {
                // With None function and multiple sequences,
                // map should return a list of tuples
                item = new Sk.builtin.tuple(item);
            }
            retval.push(item);
        } else {
            if (!(item instanceof Array)) {
                // If there was only one iterable, convert to Javascript
                // Array for call to apply.
                item = [item];
            }

            return Sk.misceval.chain(Sk.misceval.applyOrSuspend(fun, undefined, undefined, undefined, item), function (result) {
                retval.push(result);
            });
        }
    }), function () {
        return new Sk.builtin.list(retval);
    });
    if (!(Sk.__future__.python_version)) {
        return ret;
    }
    ret1 = ret.tp$iter();
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

    this.__class__ = Sk.builtin.map;
    return this;

};

Sk.abstr.setUpInheritance("map", Sk.builtin.map, Sk.builtin.object);

Sk.builtin.map.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    return self.tp$iter();
});

Sk.builtin.map.prototype.next$ = function (self) {
    return self.tp$iternext();
};

Sk.builtin.map.prototype["$r"] = function () {
    return new Sk.builtin.str("<map object>");
};