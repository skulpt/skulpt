// Itertools generators have a different repr
Sk.builtin.itertools_gen = function (code, globals, args, closure, closure2) {
    Sk.builtin.generator.call(this, code, globals, args, closure, closure2)
}
Sk.builtin.itertools_gen.prototype = Object.create(Sk.builtin.generator.prototype)
Sk.builtin.itertools_gen.prototype["$r"] = function () {
    return new Sk.builtin.str("<itertools." + this.func_code["co_name"].v + " object>")
};

// repeat has a different repr
Sk.builtin.itertools_repeat = function (code, globals, args, closure, closure2) {
    Sk.builtin.generator.call(this, code, globals, args, closure, closure2)
}
Sk.builtin.itertools_repeat.prototype = Object.create(Sk.builtin.generator.prototype)
Sk.builtin.itertools_repeat.prototype["$r"] = function () {
    object_repr = this.gi$locals.object.$r().$jsstr();
    times = this.gi$locals.times;
    times_repr = times === undefined ? "" : ", " + times;
    return new Sk.builtin.str(this.func_code["co_name"].v +
        "(" + object_repr + times_repr + ")")
};

// count has a different repr
Sk.builtin.itertools_count = function (code, globals, args, closure, closure2) {
    Sk.builtin.generator.call(this, code, globals, args, closure, closure2)
}
Sk.builtin.itertools_count.prototype = Object.create(Sk.builtin.generator.prototype)
Sk.builtin.itertools_count.prototype["$r"] = function () {
    start_repr = this.gi$locals.n.$r().$jsstr();
    step_repr = this.gi$locals.step.$r().$jsstr();
    step_repr = step_repr === "1" ? "" : ", " + step_repr;
    return new Sk.builtin.str(this.func_code["co_name"].v +
        "(" + start_repr + step_repr + ")")
};



var $builtinmodule = function (name) {
    var mod = {};


    mod.accumulate = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("accumulate is not yet implemented in Skulpt");
    });


    _chain_gen = function ($gen) {
        let iterables, current_it, element, made_iter;
        iterables = $gen.gi$locals.iterables;
        current_it = $gen.gi$locals.current_it;
        made_iter = $gen.gi$locals.made_iter;

        while (element === undefined) {
            if (current_it === undefined) {
                return [];
            } else if (!made_iter) {
                current_it = Sk.abstr.iter(current_it);
                made_iter = true;
            }

            element = current_it.tp$iternext();
            if (element === undefined) {
                current_it = iterables.tp$iternext();
                made_iter = false;
            }
        }
        try {
            return [ /*resume*/ , /*ret*/ element];
        } finally {
            $gen.gi$locals.current_it = current_it;
            $gen.gi$locals.made_iter = made_iter;
        }
    };

    _chain = function () {
        let iterables = Array.from(arguments);
        iterables = Sk.abstr.iter(Sk.builtin.list(iterables));
        const current_it = iterables.tp$iternext();
        return new Sk.builtin.itertools_gen(_chain_gen, mod, [iterables, current_it]);
    };

    _chain_from_iterable = function (iterables) {
        Sk.builtin.pyCheckArgsLen("from_iterable", arguments.length, 1, 1);
        iterables = Sk.abstr.iter(iterables);
        const current_it = iterables.tp$iternext();
        return new Sk.builtin.itertools_gen(_chain_gen, mod, [iterables, current_it]);
    }

    // chain has a bound method from_iterable
    Sk.builtin.chain_func = function (func) {
        Sk.builtin.func.call(this, func);
        this.$d["from_iterable"] = new Sk.builtin.func(_chain_from_iterable);
    };
    Sk.builtin.chain_func.prototype = Object.create(Sk.builtin.func.prototype)

    _chain_from_iterable.co_name = new Sk.builtins.str("from_iterable");
    _chain.co_name = new Sk.builtins.str("chain");
    _chain_gen.co_name = new Sk.builtins.str("chain");
    _chain_gen.co_varnames = ["iterables", "current_it"];

    mod.chain = new Sk.builtin.chain_func(_chain);


    mod.combinations = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("combinations is not yet implemented in Skulpt");
    });


    mod.combinations_with_replacement = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("combinations_with_replacement is not yet implemented in Skulpt");
    });


    mod.compress = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("compress is not yet implemented in Skulpt");
    });


    var _count_gen = function ($gen) {
        const n = $gen.gi$locals.n;
        const step = $gen.gi$locals.step;
        try {
            return [ /*resume*/ , /*ret*/ n];
        } finally {
            $gen.gi$locals.n = Sk.abstr.numberInplaceBinOp(n, step, "Add");
        }
    };

    var _count = function (start, step) {
        Sk.builtin.pyCheckArgsLen("count", arguments.length, 0, 2);
        Sk.builtin.pyCheckType("start", "number", Sk.builtin.checkNumber(start));
        Sk.builtin.pyCheckType("step", "number", Sk.builtin.checkNumber(step));
        const n = start;
        return new Sk.builtin.itertools_count(_count_gen, mod, [n, step]);
    };
    _count.co_name = new Sk.builtins.str("count");
    _count.$defaults = [new Sk.builtin.int_(0), new Sk.builtin.int_(1)];
    _count.co_varnames = ["start", "step"];
    _count_gen.co_name = new Sk.builtins.str("count");
    _count_gen.co_varnames = ["n", "step"];

    mod.count = new Sk.builtin.func(_count);


    var _cycle_gen = function ($gen) {
        let iter, saved;
        iter = $gen.gi$locals.iter;
        saved = $gen.gi$locals.saved;
        element = iter.tp$iternext();
        if (!(element === undefined)) {
            // consume iter before cycling through saved
            try {
                return [ /*resume*/ , /*ret*/ element];
            } finally {
                saved.push(element);
            }
        } else if (saved.length) {
            element = saved.shift();
            try {
                return [ /*resume*/ , /*ret*/ element];
            } finally {
                saved.push(element);
            }
        } else {
            return [];
        }
    };


    var _cycle = function (iter) {
        Sk.builtin.pyCheckArgsLen("cycle", arguments.length, 1, 1);
        iter = Sk.abstr.iter(iter);
        const saved = [];
        return new Sk.builtin.itertools_gen(_cycle_gen, mod, [iter, saved]);
    };


    _cycle.co_name = new Sk.builtins.str("cycle");
    _cycle_gen.co_name = new Sk.builtins.str("cycle");
    _cycle_gen.co_varnames = ["iter", "saved"];


    mod.cycle = new Sk.builtin.func(_cycle);


    mod.dropwhile = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("dropwhile is not yet implemented in Skulpt");
    });


    mod.filterfalse = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("filterfalse is not yet implemented in Skulpt");
    });


    mod.groupby = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("groupby is not yet implemented in Skulpt");
    });


    var _islice_gen = function ($gen) {
        let iter, previt, stop, step, initial;
        iter = $gen.gi$locals.iter;
        previt = $gen.gi$locals.previt;
        stop = $gen.gi$locals.stop;
        step = $gen.gi$locals.step;
        initial = $gen.gi$locals.initial;
        if (initial === undefined) {
            if (previt >= stop) {
                // consume generator up to stop and return
                for (let i = 0; i < stop; i++) {
                    iter.tp$iternext();
                }
                return [];
            } else {
                //conusme generator up to start and yield
                for (let i = 0; i < previt; i++) {
                    iter.tp$iternext();
                }
                try {
                    return [ /*resume*/ , /*ret*/ iter.tp$iternext()];
                } finally {
                    $gen.gi$locals.initial = false;
                }
            }
        }
        if (previt + step >= stop) {
            // consume generator up to stop and return
            for (let i = previt + 1; i < stop; i++) {
                iter.tp$iternext();
            }
            return [];
        } else {
            // consume generator up to previt + step and yield
            try {
                for (let i = previt + 1; i < previt + step; i++) {
                    iter.tp$iternext();
                }
                return [ /*resume*/ , /*ret*/ iter.tp$iternext()];
            } finally {
                $gen.gi$locals.previt = previt + step;
            }
        }
    };


    var _islice = function (iter, start, stop, step) {
        Sk.builtin.pyCheckArgsLen("islice", arguments.length, 2, 4);
        iter = Sk.abstr.iter(iter);

        if (stop === undefined) {
            stop = start;
            start = Sk.builtin.none.none$;
            step = Sk.builtin.none.none$;
        } else if (step === undefined) {
            step = Sk.builtin.none.none$;
        };

        // check stop first
        if (!(Sk.builtin.checkNone(stop) || Sk.misceval.isIndex(stop))) {
            throw new Sk.builtin.ValueError("Stop for islice() must be None or an integer: 0 <= x <= sys.maxsize.")
        } else {
            stop = Sk.builtin.checkNone(stop) ? Number.MAX_SAFE_INTEGER : Sk.misceval.asIndex(stop);
            if (stop < 0 || stop > Number.MAX_SAFE_INTEGER) {
                throw new Sk.builtin.ValueError("Stop for islice() must be None or an integer: 0 <= x <= sys.maxsize.")
            }
        };

        // check start
        if (!(Sk.builtin.checkNone(start) || Sk.misceval.isIndex(start))) {
            throw new Sk.builtin.ValueError("Indices for islice() must be None or an integer: 0 <= x <= sys.maxsize.")
        } else {
            start = Sk.builtin.checkNone(start) ? 0 : Sk.misceval.asIndex(start);
            if (start < 0 || start > Number.MAX_SAFE_INTEGER) {
                throw new Sk.builtin.ValueError("Indices for islice() must be None or an integer: 0 <= x <= sys.maxsize.")
            }
        };

        // check step
        if (!(Sk.builtin.checkNone(step) || Sk.misceval.isIndex(step))) {
            throw new Sk.builtin.ValueError("Step for islice() must be a positive integer or None")
        } else {
            step = Sk.builtin.checkNone(step) ? 1 : Sk.misceval.asIndex(step);
            if (step <= 0 || step > Number.MAX_SAFE_INTEGER) {
                throw new Sk.builtin.ValueError("Step for islice() must be a positive integer or None.")
            }
        };
        const previt = start;
        return new Sk.builtin.itertools_gen(_islice_gen, mod, [iter, previt, stop, step]);
    };

    _islice_gen.co_varnames = ["iter", "previt", "stop", "step"];
    _islice_gen.co_name = new Sk.builtins.str("islice");
    _islice.co_name = new Sk.builtins.str("islice");

    mod.islice = new Sk.builtin.func(_islice);



    mod.permutations = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("permutations is not yet implemented in Skulpt");
    });


    var _product_gen = function ($gen) {
        args = $gen.gi$locals.args;
        pools = $gen.gi$locals.pools;
        len = $gen.gi$locals.len;
        res = $gen.gi$locals.res;
        first = $gen.gi$locals.first;
        if (first === undefined) {
            $gen.gi$locals.first = false;
            // then this is the first call to gen so yield the first result
            // or if any of the args were empty iterables then StopIteration
            if (res.some(element => element === undefined)) {
                return []
            }
            try {
                return [ /*resume*/ , /*ret*/ Sk.builtin.tuple([...res])];
            } finally {}
        }

        let i = len - 1;
        while (i >= 0 && i < len) {
            res[i] = pools[i].tp$iternext();
            if (res[i] === undefined) {
                i--;
            } else {
                i++;
                if (i < len) {
                    pools[i] = Sk.abstr.iter(args[i]);
                }
            }
        }
        if (res.every(element => element === undefined)) {
            $gen.gi$locals.args = pools;
            return [];
        } else {
            try {
                return [ /*resume*/ , /*ret*/ Sk.builtin.tuple([...res])];
            } finally {}
        };

    };

    var _product = function (repeat, args) {
        Sk.builtin.pyCheckArgsLen("product", arguments.length, 0, Infinity, true);
        Sk.builtin.pyCheckType("repeat", "integer", Sk.builtin.checkInt(repeat));
        repeat = Sk.builtin.asnum$(repeat);
        if (repeat < 0) {
            throw new Sk.builtin.ValueError("repeat argument cannot be negative");
        }
        // args is a tuple it's .v property is an array
        args = args.v;
        args = [].concat(...Array(repeat).fill(args)); // js equivalent to [arg for arg in args] * repeat
        pools = args.map(x => Sk.abstr.iter(x)); //also will raise the exception if not iterable
        len = pools.length;
        res = Array(len);
        for (let i = 0; i < len; i++) {
            res[i] = pools[i].tp$iternext(); // tests imply that we should iternext before yielding anything - see devision by zero test
        }
        return new Sk.builtin.itertools_gen(_product_gen, mod, [args, pools, len, res]);
    };

    _product_gen.co_name = new Sk.builtins.str("product");
    _product_gen.co_varnames = ["args", "pools", "len", "res"];
    _product.co_name = new Sk.builtins.str("product");
    _product.co_kwonlyargcount = 1;
    _product.co_argcount = 0;
    _product.co_varnames = ["repeat"];
    _product.co_varargs = 1;
    _product.$kwdefs = [Sk.builtin.int_(1)];

    mod.product = new Sk.builtin.func(_product);


    var _repeat_gen = function ($gen) {
        let times, object;
        times = $gen.gi$locals.times;
        object = $gen.gi$locals.object;

        if (times === undefined) {
            try {
                return [, /*resume*/ /*ret*/ object];
            } finally {}
        } else if (times > 0) {
            try {
                return [ /*resume*/ , /*ret*/ object];
            } finally {
                $gen.gi$locals.times = times - 1;
            }
        } else {
            return [];
        }
    };

    var _repeat = function (object, times) {
        Sk.builtin.pyCheckArgsLen("repeat", arguments.length, 1, 2);
        if (!Sk.builtin.checkNone(times)) {
            Sk.builtin.pyCheckType("times", "integer", Sk.builtin.checkInt(times));
            times = Sk.builtin.asnum$(times)
            times = times < 0 ? 0 : times; //not important for the algorithm but the repr
        } else {
            times = undefined;
        }
        return new Sk.builtin.itertools_repeat(_repeat_gen, mod, [object, times]);
    };

    _repeat_gen.co_varnames = ["object", "times"];
    _repeat_gen.co_name = new Sk.builtins.str("repeat");
    _repeat.co_varnames = ["object", "times"];
    _repeat.co_name = new Sk.builtins.str("repeat");
    _repeat.$defaults = [Sk.builtin.none.none$]

    mod.repeat = new Sk.builtin.func(_repeat);


    mod.starmap = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("starmap is not yet implemented in Skulpt");
    });


    mod.takewhile = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("takewhile is not yet implemented in Skulpt");
    });


    mod.tee = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("tee is not yet implemented in Skulpt");
    });


    mod.zip_longest = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("zip_longest is not yet implemented in Skulpt");
    });

    mod.__doc__ = new Sk.builtin.str("An implementation of the python itertools module in Skulpt")
    mod.__package__ = new Sk.builtin.str("")

    return mod;
};