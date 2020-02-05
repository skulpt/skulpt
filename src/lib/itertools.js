var $builtinmodule = function (name) {
    var mod = {};


    mod.accumulate = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("accumulate is not yet implemented in Skulpt");
    })


    mod.chain = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("chain is not yet implemented in Skulpt");
    })


    mod.combinations = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("combinations is not yet implemented in Skulpt");
    })


    mod.combinations_with_replacement = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("combinations_with_replacement is not yet implemented in Skulpt");
    })


    mod.compress = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("compress is not yet implemented in Skulpt");
    })


    var _count_gen = function ($gen) {
        const n = $gen.gi$locals.n;
        const step = $gen.gi$locals.step;
        while (true) {
            try {
                return [ /*resume*/ , /*ret*/ n];
            } finally {
                $gen.gi$locals.n = Sk.abstr.numberInplaceBinOp(n, step, 'Add');
            }
        };
    };

    var _count = function (start, step) {
        Sk.builtin.pyCheckArgsLen("count", arguments.length, 0, 2);
        Sk.builtin.pyCheckType("start", "number", Sk.builtin.checkNumber(start));
        Sk.builtin.pyCheckType("step", "number", Sk.builtin.checkNumber(step));
        const n = start;
        return new Sk.builtin.generator(_count_gen, Sk.$gbl, [n, step]);
    };
    _count.co_name = new Sk.builtins.str('count');
    _count.$defaults = [new Sk.builtin.int_(0), new Sk.builtin.int_(1)];
    _count.co_varnames = ['start', 'step'];
    _count_gen.co_name = new Sk.builtins.str('count');
    _count_gen.co_varnames = ['n', 'step'];

    mod.count = new Sk.builtin.func(_count);


    mod.cycle = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("cycle is not yet implemented in Skulpt");
    })


    mod.dropwhile = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("dropwhile is not yet implemented in Skulpt");
    })


    mod.filterfalse = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("filterfalse is not yet implemented in Skulpt");
    })


    mod.groupby = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("groupby is not yet implemented in Skulpt");
    })


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
                    iter.tp$iternext()
                };
                return [];
            } else { //conusme generator up to start and yield
                for (let i = 0; i < previt; i++) {
                    iter.tp$iternext()
                };
                try {
                    return [ /*resume*/ , /*ret*/ iter.tp$iternext()];
                } finally {
                    $gen.gi$locals.initial = false;
                    $gen.gi$locals.iter = iter;
                };
            };
        };
        if (previt + step >= stop) {
            // consume generator up to stop and return
            for (let i = previt + 1; i < stop; i++) {
                iter.tp$iternext()
            };
            return [];
        } else { // consume generator up to previt + step and yield
            try {
                for (let i = previt + 1; i < previt + step; i++) {
                    iter.tp$iternext()
                };
                return [ /*resume*/ , /*ret*/ iter.tp$iternext()];
            } finally {
                $gen.gi$locals.iter = iter;
                $gen.gi$locals.previt = previt + step;
            };

        };
    };


    var _islice = function (iter, start, stop, step) {
        Sk.builtin.pyCheckArgsLen("islice", arguments.length, 2, 4);
        if (!Sk.builtin.checkIterable(iter)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter) + "' object is not iterable");
        };
        iter = Sk.abstr.iter(iter);

        if (stop === undefined) {
            stop = start;
            start = Sk.builtin.none.none$
            step = Sk.builtin.none.none$
        } else if (step === undefined) {
            step = Sk.builtin.none.none$
        };

        // check stop first
        if (!(Sk.builtin.checkNone(stop) || Sk.misceval.isIndex(stop))) {
            throw new Sk.builtin.ValueError('Stop for islice() must be None or an integer: 0 <= x <= sys.maxsize.')
        } else {
            stop = Sk.builtin.checkNone(stop) ? Number.MAX_SAFE_INTEGER : Sk.misceval.asIndex(stop);
            if (stop < 0 || stop > Number.MAX_SAFE_INTEGER) {
                throw new Sk.builtin.ValueError('Stop for islice() must be None or an integer: 0 <= x <= sys.maxsize.')
            }
        };

        // check start
        if (!(Sk.builtin.checkNone(start) || Sk.misceval.isIndex(start))) {
            throw new Sk.builtin.ValueError('Indices for islice() must be None or an integer: 0 <= x <= sys.maxsize.')
        } else {
            start = Sk.builtin.checkNone(start) ? 0 : Sk.misceval.asIndex(start);
            if (start < 0 || start > Number.MAX_SAFE_INTEGER) {
                throw new Sk.builtin.ValueError('Indices for islice() must be None or an integer: 0 <= x <= sys.maxsize.')
            }
        };

        // check step
        if (!(Sk.builtin.checkNone(step) || Sk.misceval.isIndex(step))) {
            throw new Sk.builtin.ValueError('Step for islice() must be a positive integer or None')
        } else {
            step = Sk.builtin.checkNone(step) ? 1 : Sk.misceval.asIndex(step);
            if (step <= 0 || step > Number.MAX_SAFE_INTEGER) {
                throw new Sk.builtin.ValueError('Step for islice() must be a positive integer or None.')
            }
        }
        const previt = start;
        return new Sk.builtin.generator(_islice_gen, Sk.$gbl, [iter, previt, stop, step]);
    };

    _islice_gen.co_varnames = ['iter', 'previt', 'stop', 'step'];
    _islice_gen.co_name = new Sk.builtins.str('islice');
    _islice.$defaults = [Sk.builtin.none.none$, undefined, undefined];
    _islice.co_name = new Sk.builtins.str('islice');

    mod.islice = new Sk.builtin.func(_islice);



    mod.permutations = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("permutations is not yet implemented in Skulpt");
    })


    mod.product = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("product is not yet implemented in Skulpt");
    })


    mod.repeat = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("repeat is not yet implemented in Skulpt");
    })


    mod.starmap = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("starmap is not yet implemented in Skulpt");
    })


    mod.takewhile = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("takewhile is not yet implemented in Skulpt");
    })


    mod.tee = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("tee is not yet implemented in Skulpt");
    })


    mod.zip_longest = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("zip_longest is not yet implemented in Skulpt");
    })

    return mod;
}