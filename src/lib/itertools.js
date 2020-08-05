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


    var _accumulate_gen = function ($gen) {
        const it = $gen.gi$locals.it;
        const f = $gen.gi$locals.func;
        let total = $gen.gi$locals.total;
        const initial = $gen.gi$locals.initial;

        if (initial) {
            total = Sk.builtin.checkNone(total) ? it.tp$iternext() : total;
            $gen.gi$locals.total = total;
            $gen.gi$locals.initial = false;
            return [ /*resume*/ , /*ret*/ total];
        }

        element = it.tp$iternext();
        if (element !== undefined) {
            total = (f.tp$call) ? f.tp$call([total, element], undefined) : Sk.misceval.applyOrSuspend(f, undefined, undefined, undefined, [total, element]);
            $gen.gi$locals.total = total;
            return [ /*resume*/ , /*ret*/ total];
        } else {
            return [ /*resume*/ , /*ret*/ ];
        }
    };

    var _accumulate = function (iterable, func, initial) {
        Sk.builtin.pyCheckArgsLen("accumulate", arguments.length, 1, 3, true);
        const it = Sk.abstr.iter(iterable);
        const total = initial;
        return new Sk.builtin.itertools_gen(_accumulate_gen, mod, [it, func, total, true])
    };

    const func = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.numberBinOp(a, b, "Add");
    });
    _accumulate_gen.co_name = new Sk.builtin.str("accumulate");
    _accumulate_gen.co_varnames = ["it", "func", "total", "initial"];
    _accumulate.$defaults = [func];
    _accumulate.co_name = new Sk.builtin.str("accumulate");
    _accumulate.co_argcount = 2;
    _accumulate.co_kwonlyargcount = 1;
    _accumulate.$kwdefs = [Sk.builtin.none.none$];
    _accumulate.co_varnames = ["iterable", "func", "initial"];

    mod.accumulate = new Sk.builtin.func(_accumulate);


    _chain_gen = function ($gen) {
        const iterables = $gen.gi$locals.iterables;
        let current_it = $gen.gi$locals.current_it;
        let made_iter = $gen.gi$locals.made_iter;
        let element;

        while (element === undefined) {
            if (current_it === undefined) {
                return [ /*resume*/ , /*ret*/ ];
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
        $gen.gi$locals.current_it = current_it;
        $gen.gi$locals.made_iter = made_iter;
        return [ /*resume*/ , /*ret*/ element];
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

    _chain_from_iterable.co_name = new Sk.builtin.str("from_iterable");
    _chain.co_name = new Sk.builtin.str("chain");
    _chain_gen.co_name = new Sk.builtin.str("chain");
    _chain_gen.co_varnames = ["iterables", "current_it"];

    mod.chain = new Sk.builtin.chain_func(_chain);


    var _combinations_gen = function ($gen) {
        const indices = $gen.gi$locals.indices;
        const pool = $gen.gi$locals.pool;
        const n = $gen.gi$locals.n;
        const r = $gen.gi$locals.r;
        const initial = $gen.gi$locals.initial;

        if (r > n) {
            return [ /*resume*/ , /*ret*/ ];
        }

        if (initial === undefined) {
            $gen.gi$locals.initial = false;
            return [ /*resume*/ , /*ret*/ new Sk.builtin.tuple(pool.slice(0, r))];
        }
        let found = false
        let i;
        for (i = r - 1; i >= 0; i--) {
            if (indices[i] != i + n - r) {
                found = true;
                break;
            }
        }
        if (!found) {
            $gen.gi$locals.r = 0;
            return [ /*resume*/ , /*ret*/ ]
        }
        indices[i]++;
        for (let j = i + 1; j < r; j++) {
            indices[j] = indices[j - 1] + 1;
        }
        const res = indices.map(i => pool[i]);
        return [ /*resume*/ , /*ret*/ new Sk.builtin.tuple(res)];
    };

    var _combinations = function (iterable, r) {
        Sk.builtin.pyCheckArgsLen("combinations", arguments.length, 2, 2);
        const pool = Sk.misceval.arrayFromIterable(iterable); // want pool as an array
        Sk.builtin.pyCheckType("r", "int", Sk.builtin.checkInt(r));

        const n = pool.length;
        r = Sk.builtin.asnum$(r);
        if (r < 0) {
            throw new Sk.builtin.ValueError("r must be non-negative");
        }
        const indices = new Array(r).fill().map((_, i) => i);
        return new Sk.builtin.itertools_gen(_combinations_gen, mod, [indices, pool, n, r]);
    };

    _combinations_gen.co_name = new Sk.builtin.str("combinations");
    _combinations_gen.co_varnames = ["indices", "pool", "n", "r"];
    _combinations.co_name = new Sk.builtin.str("combinations");
    _combinations.co_varnames = ["iterable", "r"];

    mod.combinations = new Sk.builtin.func(_combinations);


    var _combinations_with_replacement_gen = function ($gen) {
        const indices = $gen.gi$locals.indices;
        const pool = $gen.gi$locals.pool;
        const n = $gen.gi$locals.n;
        const r = $gen.gi$locals.r;
        const initial = $gen.gi$locals.initial;

        if (r && !n) {
            return [ /*resume*/ , /*ret*/ ];
        }

        if (initial === undefined) {
            const res = indices.map(i => pool[i]);
            $gen.gi$locals.initial = false;
            return [ /*resume*/ , /*ret*/ new Sk.builtin.tuple(res)];
        }
        let found = false
        let i;
        for (i = r - 1; i >= 0; i--) {
            if (indices[i] != n - 1) {
                found = true;
                break;
            }
        }
        if (!found) {
            $gen.gi$locals.r = 0;
            return [ /*resume*/ , /*ret*/ ];
        }
        const val = indices[i] + 1;
        for (let j = i; j < r; j++) {
            indices[j] = val
        }
        const res = indices.map(i => pool[i]);
        return [ /*resume*/ , /*ret*/ new Sk.builtin.tuple(res)];
    };

    var _combinations_with_replacement = function (iterable, r) {
        Sk.builtin.pyCheckArgsLen("combinations", arguments.length, 2, 2);
        const pool = Sk.misceval.arrayFromIterable(iterable); // want pool as an array
        Sk.builtin.pyCheckType("r", "int", Sk.builtin.checkInt(r));

        const n = pool.length;
        r = Sk.builtin.asnum$(r);
        if (r < 0) {
            throw new Sk.builtin.ValueError("r must be non-negative");
        }
        const indices = new Array(r).fill(0);
        return new Sk.builtin.itertools_gen(_combinations_with_replacement_gen, mod, [indices, pool, n, r]);
    };

    _combinations_with_replacement_gen.co_name = new Sk.builtin.str("combinations_with_replacement");
    _combinations_with_replacement_gen.co_varnames = ["indices", "pool", "n", "r"];
    _combinations_with_replacement.co_name = new Sk.builtin.str("combinations_with_replacement");
    _combinations_with_replacement.co_varnames = ["iterable", "r"];

    mod.combinations_with_replacement = new Sk.builtin.func(_combinations_with_replacement);


    _compress_gen = function ($gen) {
        const data = $gen.gi$locals.data;
        const selectors = $gen.gi$locals.selectors;
        let d = data.tp$iternext();
        let s = selectors.tp$iternext();

        while (d !== undefined && s !== undefined) {
            if (Sk.misceval.isTrue(s)) {
                return [ /*resume*/ , /*ret*/ d];
            }
            d = data.tp$iternext();
            s = selectors.tp$iternext();
        }
        return [ /*resume*/ , /*ret*/ ];

    };

    _compress = function (data, selectors) {
        Sk.builtin.pyCheckArgsLen("compress", arguments.length, 2, 2);
        data = Sk.abstr.iter(data);
        selectors = Sk.abstr.iter(selectors);

        return new Sk.builtin.itertools_gen(_compress_gen, mod, [data, selectors])
    };

    _compress_gen.co_name = new Sk.builtin.str("compress");
    _compress_gen.co_varnames = ["data", "selectors"];
    _compress.co_name = new Sk.builtin.str("compress");
    _compress.co_varnames = ["data", "selectors"];

    mod.compress = new Sk.builtin.func(_compress);


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
        if (!Sk.builtin.checkNumber(start) && !Sk.builtin.checkComplex(start)) {
            throw new Sk.builtin.TypeError("a number is required")
        }
        if (!Sk.builtin.checkNumber(step) && !Sk.builtin.checkComplex(step)) {
            throw new Sk.builtin.TypeError("a number is required")
        }
        const n = start;
        return new Sk.builtin.itertools_count(_count_gen, mod, [n, step]);
    };
    _count.co_name = new Sk.builtin.str("count");
    _count.$defaults = [new Sk.builtin.int_(0), new Sk.builtin.int_(1)];
    _count.co_varnames = ["start", "step"];
    _count_gen.co_name = new Sk.builtin.str("count");
    _count_gen.co_varnames = ["n", "step"];

    mod.count = new Sk.builtin.func(_count);


    var _cycle_gen = function ($gen) {
        let iter, saved, element;
        iter = $gen.gi$locals.iter;
        saved = $gen.gi$locals.saved;
        element = iter.tp$iternext();
        if (!(element === undefined)) {
            // consume iter before cycling through saved
            saved.push(element);
            return [ /*resume*/ , /*ret*/ element];
        } else if (saved.length) {
            element = saved.shift();
            saved.push(element);
            return [ /*resume*/ , /*ret*/ element];
        } else {
            return [ /*resume*/ , /*ret*/ ];
        }
    };


    var _cycle = function (iter) {
        Sk.builtin.pyCheckArgsLen("cycle", arguments.length, 1, 1);
        iter = Sk.abstr.iter(iter);
        const saved = [];
        return new Sk.builtin.itertools_gen(_cycle_gen, mod, [iter, saved]);
    };


    _cycle.co_name = new Sk.builtin.str("cycle");
    _cycle_gen.co_name = new Sk.builtin.str("cycle");
    _cycle_gen.co_varnames = ["iter", "saved"];


    mod.cycle = new Sk.builtin.func(_cycle);


    var _dropwhile_gen = function ($gen) {
        const p = $gen.gi$locals.predicate;
        const it = $gen.gi$locals.it;
        const passed = $gen.gi$locals.passed;
        let x = it.tp$iternext();

        while (passed === undefined && x !== undefined) {
            const val = (p.tp$call) ? p.tp$call([x], undefined) : Sk.misceval.applyOrSuspend(p, undefined, undefined, undefined, [x]);
            if (!Sk.misceval.isTrue(val)) {
                $gen.gi$locals.passed = true;
                return [ /*resume*/ , /*ret*/ x];
            }
            x = it.tp$iternext()
        }
        return [ /*resume*/ , /*ret*/ x];
    };

    _dropwhile = function (predicate, iterable) {
        Sk.builtin.pyCheckArgsLen("dropwhile", arguments.length, 2, 2);
        const it = Sk.abstr.iter(iterable);
        return new Sk.builtin.itertools_gen(_dropwhile_gen, mod, [predicate, it])
    }

    _dropwhile_gen.co_name = new Sk.builtin.str("dropwhile");
    _dropwhile_gen.co_varnames = ["predicate", "it"];
    _dropwhile.co_name = new Sk.builtin.str("dropwhile");
    _dropwhile.co_varnames = ["predicate", "iterable"];

    mod.dropwhile = new Sk.builtin.func(_dropwhile);


    var _filterfalse_gen = function ($gen) {
        const p = $gen.gi$locals.predicate;
        let it = $gen.gi$locals.it;
        const initial = $gen.gi$locals.initial;
        if (initial === undefined) {
            $gen.gi$locals.it = Sk.abstr.iter(it); // unusually only make an iter inside the generator else fail testGC
            it = $gen.gi$locals.it;
            $gen.gi$locals.initial = false;
        }
        let x = it.tp$iternext();

        if (x === undefined) {
            return [ /*resume*/ , /*ret*/ ];
        }

        let val = (p.tp$call) ? p.tp$call([x], undefined) : Sk.misceval.applyOrSuspend(p, undefined, undefined, undefined, [x]);
        while (Sk.misceval.isTrue(val)) {
            x = it.tp$iternext();
            if (x === undefined) {
                return [ /*resume*/ , /*ret*/ ];
            }
            val = (p.tp$call) ? p.tp$call([x], undefined) : Sk.misceval.applyOrSuspend(p, undefined, undefined, undefined, [x]);
        }
        return [ /*resume*/ , /*ret*/ x];
    };

    _filterfalse = function (predicate, iterable) {
        Sk.builtin.pyCheckArgsLen("filterfalse", arguments.length, 2, 2);
        if (!Sk.builtin.checkIterable(iterable)) {
            throw new Sk.builtin.TypeError(
                "'" + Sk.abstr.typeName(iterable) + "' object is not iterable"
            );
        }
        const it = iterable; // unlike many don't convert to an iter until inside the generator 
        predicate = Sk.builtin.checkNone(predicate) ? Sk.builtin.bool : predicate;
        return new Sk.builtin.itertools_gen(_filterfalse_gen, mod, [predicate, it])
    }

    _filterfalse_gen.co_name = new Sk.builtin.str("filterfalse");
    _filterfalse_gen.co_varnames = ["predicate", "it"];
    _filterfalse.co_name = new Sk.builtin.str("filterfalse");
    _filterfalse.co_varnames = ["predicate", "iterable"];

    mod.filterfalse = new Sk.builtin.func(_filterfalse);


    _grouper = function ($gen) {
        const groupby_gen = $gen.gi$locals.groupby_gen;
        const tgtkey = $gen.gi$locals.tgtkey;
        const id = $gen.gi$locals.id;
        let currval = groupby_gen.gi$locals.currval;
        let currkey = groupby_gen.gi$locals.currkey;
        const keyf = groupby_gen.gi$locals.keyfunc;
        const it = groupby_gen.gi$locals.it;
        const groupby_id = groupby_gen.gi$locals.id;

        const compare = Sk.misceval.richCompareBool(currkey, tgtkey, "Eq", true);

        if (groupby_id === id && compare) {
            try {
                return [ /*resume*/ , /*ret*/ currval];
            } finally {
                currval = it.tp$iternext();
                if (currval !== undefined) {
                    currkey = (keyf.tp$call) ? keyf.tp$call([currval], undefined) : Sk.misceval.applyOrSuspend(keyf, undefined, undefined, undefined, [currval]);
                }
                groupby_gen.gi$locals.currkey = currkey;
                groupby_gen.gi$locals.currval = currval;
            }
        }
        return [ /*resume*/ , /*ret*/ ];
    };

    _groupby_gen = function ($gen) {
        const tgtkey = $gen.gi$locals.tgtkey;
        let currval = $gen.gi$locals.currval;
        let currkey = $gen.gi$locals.currkey;
        const keyf = $gen.gi$locals.keyfunc;
        const it = $gen.gi$locals.it;
        $gen.gi$locals.id = Object();
        let compare = Sk.misceval.richCompareBool(currkey, tgtkey, "Eq", true);
        while (compare) {
            currval = it.tp$iternext()
            if (currval === undefined) {
                return [ /*resume*/ , /*ret*/ ]
            }
            currkey = (keyf.tp$call) ? keyf.tp$call([currval], undefined) : Sk.misceval.applyOrSuspend(keyf, undefined, undefined, undefined, [currval]);
            compare = Sk.misceval.richCompareBool(currkey, tgtkey, "Eq", true);
        }
        $gen.gi$locals.tgtkey = $gen.gi$locals.currkey = currkey;
        $gen.gi$locals.currval = currval;

        const grouper = new Sk.builtin.itertools_gen(_grouper, mod, [$gen, $gen.gi$locals.tgtkey, $gen.gi$locals.id])
        return [ /*resume*/ , /*ret*/ new Sk.builtin.tuple([currkey, grouper])];
    };

    _groupby = function (iterable, key) {
        Sk.builtin.pyCheckArgsLen("groupby", arguments.length, 1, 2);
        iterable = Sk.abstr.iter(iterable);
        if (Sk.builtin.checkNone(key)) {
            key = new Sk.builtin.func(function (x) {
                return x
            });
        }
        const currval = currkey = tgtkey = Sk.builtin.object();
        return new Sk.builtin.itertools_gen(_groupby_gen, mod, [iterable, key, currval, currkey, tgtkey])
    };

    _groupby_gen.co_name = new Sk.builtin.str("groupby");
    _groupby_gen.co_varnames = ["it", "keyfunc", "currval", "currkey", "tgtkey"];
    _groupby.co_name = new Sk.builtin.str("groupby");
    _groupby.$defaults = [Sk.builtin.none.none$];
    _groupby.co_varnames = ["iterable", "key"];

    _grouper.co_name = new Sk.builtin.str("_grouper");
    _grouper.co_varnames = ["groupby_gen", "tgtkey", "id"];

    mod.groupby = new Sk.builtin.func(_groupby);


    var _islice_gen = function ($gen) {
        let iter, previt, stop, step, initial;
        iter = $gen.gi$locals.iter;
        previt = $gen.gi$locals.previt;
        stop = $gen.gi$locals.stop;
        step = $gen.gi$locals.step;
        initial = $gen.gi$locals.initial;
        if (initial === undefined) {
            $gen.gi$locals.initial = false;
            if (previt >= stop) {
                // consume generator up to stop and return
                for (let i = 0; i < stop; i++) {
                    iter.tp$iternext();
                }
                return [ /*resume*/ , /*ret*/ ];
            } else {
                //conusme generator up to start and yield
                for (let i = 0; i < previt; i++) {
                    iter.tp$iternext();
                }
                return [ /*resume*/ , /*ret*/ iter.tp$iternext()];
            }
        }
        if (previt + step >= stop) {
            // consume generator up to stop and return
            for (let i = previt + 1; i < stop; i++) {
                $gen.gi$locals.previt = previt + step;
                iter.tp$iternext();
            }
            return [ /*resume*/ , /*ret*/ ];
        } else {
            // consume generator up to previt + step and yield
            for (let i = previt + 1; i < previt + step; i++) {
                iter.tp$iternext();
            }
            $gen.gi$locals.previt = previt + step;
            return [ /*resume*/ , /*ret*/ iter.tp$iternext()];
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
    _islice_gen.co_name = new Sk.builtin.str("islice");
    _islice.co_name = new Sk.builtin.str("islice");

    mod.islice = new Sk.builtin.func(_islice);


    var _permutations_gen = function ($gen) {
        const indices = $gen.gi$locals.indices;
        const cycles = $gen.gi$locals.cycles;
        const pool = $gen.gi$locals.pool;
        const n = $gen.gi$locals.n;
        const r = $gen.gi$locals.r;
        const initial = $gen.gi$locals.initial;

        if (r > n) {
            return [ /*resume*/ , /*ret*/ ];
        }

        if (initial === undefined) {
            $gen.gi$locals.initial = false;
            return [ /*resume*/ , new Sk.builtin.tuple(pool.slice(0, r))];
        }

        for (let i = r - 1; i >= 0; i--) {
            cycles[i]--;

            if (cycles[i] == 0) {
                indices.push(indices.splice(i, 1)[0]); // push ith element to the end
                cycles[i] = n - i;
            } else {
                j = cycles[i];
                [indices[i], indices[n - j]] = [indices[n - j], indices[i]]; //swap elements;
                const res = indices.map(i => pool[i]).slice(0, r);
                return [ /*resume*/ , /*ret*/ new Sk.builtin.tuple(res)];
            }
        }

        $gen.gi$locals.r = 0;
        return [ /*resume*/ , /*ret*/ ];
    };

    var _permutations = function (iterable, r) {
        Sk.builtin.pyCheckArgsLen("permutations", arguments.length, 1, 2);
        const pool = Sk.misceval.arrayFromIterable(iterable); // want pool as an array
        const n = pool.length;
        r = Sk.builtin.checkNone(r) ? new Sk.builtin.int_(n) : r;
        Sk.builtin.pyCheckType("r", "int", Sk.builtin.checkInt(r));
        r = Sk.builtin.asnum$(r);
        if (r < 0) {
            throw new Sk.builtin.ValueError("r must be non-negative");
        }
        const indices = new Array(n).fill().map((_, i) => i);
        const cycles = new Array(r).fill().map((_, i) => n - i);

        return new Sk.builtin.itertools_gen(_permutations_gen, mod, [indices, cycles, pool, n, r]);
    };

    _permutations_gen.co_name = new Sk.builtin.str("permutations");
    _permutations_gen.co_varnames = ["indices", "cycles", "pool", "n", "r"];
    _permutations.co_name = new Sk.builtin.str("permutations");
    _permutations.co_varnames = ["iterable", "r"];
    _permutations.$defaults = [Sk.builtin.none.none$];

    mod.permutations = new Sk.builtin.func(_permutations);


    var _product_gen = function ($gen) {
        const pools = $gen.gi$locals.pools;
        const pool_sizes = $gen.gi$locals.pool_sizes;
        const n = $gen.gi$locals.n;
        const indices = $gen.gi$locals.indices;
        const initial = $gen.gi$locals.initial;
        if (initial === undefined) {
            $gen.gi$locals.initial = false;
            const res = indices.map((_, i) => pools[i][indices[i]]);
            if (res.some(element => element === undefined)) {
                $gen.gi$locals.n = 0; // at least one pool arguments is an empty iterator
                return [ /*resume*/ , /*ret*/ ];
            }
            return [ /*resume*/ , /*ret*/ new Sk.builtin.tuple(res)];
        }

        let i = n - 1;
        while (i >= 0 && i < n) {
            indices[i]++
            if (indices[i] >= pool_sizes[i]) {
                indices[i] = -1
                i--;
            } else {
                i++;
            }
        }
        if (!n || indices.every(index => index === -1)) {
            $gen.gi$locals.n = 0; // we've done all the iterations
            return [ /*resume*/ , /*ret*/ ];
        } else {
            const res = indices.map((_, i) => pools[i][indices[i]]);
            return [ /*resume*/ , /*ret*/ new Sk.builtin.tuple(res)];
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
        for (let i = 0; i < args.length; i++) {
            if (!Sk.builtin.checkIterable(args[i])) {
                throw new Sk.builtin.TypeError(
                    "'" + Sk.abstr.typeName(args[i]) + "' object is not iterable"
                );
            }
            args[i] = Sk.misceval.arrayFromIterable(args[i]); // want each arg as an array
        }
        const pools = [].concat(...Array(repeat).fill(args)); // js equivalent to [arg for arg in args] * repeat
        const n = pools.length;
        const pool_sizes = pools.map(x => x.length)
        const indices = Array(n).fill(0)
        return new Sk.builtin.itertools_gen(_product_gen, mod, [pools, pool_sizes, n, indices]);
    };

    _product_gen.co_name = new Sk.builtin.str("product");
    _product_gen.co_varnames = ["pools", "pool_sizes", "n", "indices"];
    _product.co_name = new Sk.builtin.str("product");
    _product.co_kwonlyargcount = 1;
    _product.co_argcount = 0;
    _product.co_varnames = ["repeat"];
    _product.co_varargs = 1;
    _product.$kwdefs = [new Sk.builtin.int_(1)];

    mod.product = new Sk.builtin.func(_product);


    var _repeat_gen = function ($gen) {
        const times = $gen.gi$locals.times;
        const object = $gen.gi$locals.object;

        if (times === undefined) {
            return [ /*resume*/ , /*ret*/ object];
        } else if (times > 0) {
            $gen.gi$locals.times = times - 1;
            return [ /*resume*/ , /*ret*/ object];
        } else {
            return [ /*resume*/ , /*ret*/ ];
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
    _repeat_gen.co_name = new Sk.builtin.str("repeat");
    _repeat.co_varnames = ["object", "times"];
    _repeat.co_name = new Sk.builtin.str("repeat");
    _repeat.$defaults = [Sk.builtin.none.none$]

    mod.repeat = new Sk.builtin.func(_repeat);


    var _starmap_gen = function ($gen) {
        const f = $gen.gi$locals.func;
        const it = $gen.gi$locals.it;
        const unpack = []
        const args = it.tp$iternext();

        if (args === undefined) {
            return [ /*resume*/ , /*ret*/ ];
        }

        Sk.misceval.iterFor(Sk.abstr.iter(args), function (e) {
            unpack.push(e);
        });
        const val = (f.tp$call) ? f.tp$call(unpack, undefined) : Sk.misceval.applyOrSuspend(f, undefined, undefined, undefined, unpack);

        return [ /*resume*/ , /*ret*/ val];
    };

    _starmap = function (func, iterable) {
        Sk.builtin.pyCheckArgsLen("starmap", arguments.length, 2, 2);
        it = Sk.abstr.iter(iterable);
        func = Sk.builtin.checkNone(func) ? Sk.builtin.bool : func;
        return new Sk.builtin.itertools_gen(_starmap_gen, mod, [func, it])
    }

    _starmap_gen.co_name = new Sk.builtin.str("starmap");
    _starmap_gen.co_varnames = ["func", "it"];
    _starmap.co_name = new Sk.builtin.str("starmap");
    _starmap.co_varnames = ["func", "iterable"];

    mod.starmap = new Sk.builtin.func(_starmap);


    var _takewhile_gen = function ($gen) {
        const p = $gen.gi$locals.predicate;
        const it = $gen.gi$locals.it;
        const failed = $gen.gi$locals.failed;
        let x = it.tp$iternext();

        if (failed === undefined && x !== undefined) {
            const val = (p.tp$call) ? p.tp$call([x], undefined) : Sk.misceval.applyOrSuspend(p, undefined, undefined, undefined, [x]);
            if (Sk.misceval.isTrue(val)) {
                return [ /*resume*/ , /*ret*/ x];
            } else {
                $gen.gi$locals.failed = true;
            }
        }
        return [ /*resume*/ , /*ret*/ ];
    };

    _takewhile = function (predicate, iterable) {
        Sk.builtin.pyCheckArgsLen("takewhile", arguments.length, 2, 2);
        it = Sk.abstr.iter(iterable);
        return new Sk.builtin.itertools_gen(_takewhile_gen, mod, [predicate, it])
    }

    _takewhile_gen.co_name = new Sk.builtin.str("takewhile");
    _takewhile_gen.co_varnames = ["predicate", "it"];
    _takewhile.co_name = new Sk.builtin.str("takewhile");
    _takewhile.co_varnames = ["predicate", "iterable"];

    mod.takewhile = new Sk.builtin.func(_takewhile);


    mod.tee = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("tee is not yet implemented in Skulpt");
    });


    _zip_longest_gen = function ($gen) {
        const its = $gen.gi$locals.its;
        let active = $gen.gi$locals.active;
        const fillvalue = $gen.gi$locals.fillvalue;

        if (!active) {
            return [ /*resume*/ , /*ret*/ ];
        }

        values = [];
        for (let i = 0; i < its.length; i++) {
            val = its[i].tp$iternext();
            if (val === undefined) {
                active--;
                $gen.gi$locals.active = active;
                if (!active) {
                    return [ /*resume*/ , /*ret*/ ];
                }
                its[i] = _repeat(fillvalue, Sk.builtin.none.none$);
                val = fillvalue;
            }
            values.push(val);
        }
        return [ /*resume*/ , /*ret*/ new Sk.builtin.tuple(values)];
    };

    _zip_longest = function (fillvalue, args) {
        Sk.builtin.pyCheckArgsLen("zip_longest", arguments.length, 0, Infinity);
        // args is a tuple it's .v property is an array
        args = args.v;
        for (let i = 0; i < args.length; i++) {
            const iterable = args[i];
            if (!Sk.builtin.checkIterable(iterable)) {
                throw new Sk.builtin.TypeError("zip_longest argument #" + i + " must support iteration");
            }
            args[i] = Sk.abstr.iter(iterable);
        }
        const active = args.length;
        return new Sk.builtin.itertools_gen(_zip_longest_gen, mod, [args, active, fillvalue])
    };

    _zip_longest_gen.co_name = new Sk.builtin.str("zip_longest");
    _zip_longest_gen.co_varnames = ["its", "active", "fillvalue"];
    _zip_longest.co_name = new Sk.builtin.str("zip_longest");
    _zip_longest.co_argcount = 0;
    _zip_longest.co_kwonlyargcount = 1;
    _zip_longest.$kwdefs = [Sk.builtin.none.none$];
    _zip_longest.co_varnames = ["fillvalue"];
    _zip_longest.co_varargs = 1;

    mod.zip_longest = new Sk.builtin.func(_zip_longest);

    mod.__doc__ = new Sk.builtin.str("An implementation of the python itertools module in Skulpt")
    mod.__package__ = new Sk.builtin.str("")

    return mod;
};