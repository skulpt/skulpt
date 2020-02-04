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
        console.log(arguments)
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


    mod.islice = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("islice is not yet implemented in Skulpt");
    })


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