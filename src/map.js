/**
 * @constructor
 * @param {Sk.builtin.func} func
 * @param {Array} array of iterators
 * @extends Sk.builtin.object
 */
Sk.builtin.map_ = Sk.abstr.buildIteratorClass("map", {
    constructor: function map_(func, iters) {
        this.$func = func;
        this.$iters = iters;
    },
    iternext(canSuspend) {
        const args = [];
        const ret = Sk.misceval.chain(
            Sk.misceval.iterArray(this.$iters, (it) =>
                Sk.misceval.chain(it.tp$iternext(canSuspend), (i) => {
                    if (i === undefined) {
                        return new Sk.misceval.Break(true);
                    }
                    args.push(i);
                })
            ),
            (endmap) => (endmap ? undefined : Sk.misceval.callsimOrSuspendArray(this.$func, args))
        );
        return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
    },
    slots: {
        tp$doc:
            "map(func, *iterables) --> map object\n\nMake an iterator that computes the function using arguments from\neach of the iterables.  Stops when the shortest iterable is exhausted.",
        tp$new(args, kwargs) {
            if (this === Sk.builtin.map_.prototype) {
                Sk.abstr.checkNoKwargs("map", kwargs);
            }
            Sk.abstr.checkArgsLen("map", args, 2);
            const func = args[0];
            const iters = [];
            for (let i = 1; i < args.length; i++) {
                iters.push(Sk.abstr.iter(args[i]));
            }
            if (this === Sk.builtin.map_.prototype) {
                return new Sk.builtin.map_(func, iters);
            } else {
                const instance = new this.constructor();
                Sk.builtin.map_.call(instance, func, iters);
                return instance;
            }
        },
    },
});

Sk.exportSymbol("Sk.builtin.map_", Sk.builtin.map_);
