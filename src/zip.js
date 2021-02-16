/**
 * @constructor
 * @param {Array} JS Array of iterator objects
 * @extends Sk.builtin.object
 */
Sk.builtin.zip_ = Sk.abstr.buildIteratorClass("zip", {
    constructor: function zip_(iters) {
        this.$iters = iters;
        if (iters.length === 0) {
            this.tp$iternext = () => undefined;
        }
    },
    iternext(canSuspend) {
        const tup = [];
        const ret = Sk.misceval.chain(
            Sk.misceval.iterArray(this.$iters, (it) =>
                Sk.misceval.chain(it.tp$iternext(canSuspend), (i) => {
                    if (i === undefined) {
                        return new Sk.misceval.Break(true);
                    }
                    tup.push(i);
                })
            ),
            (endzip) => (endzip ? undefined : new Sk.builtin.tuple(tup))
        );
        return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
    },
    slots: {
        tp$doc:
            "zip(iter1 [,iter2 [...]]) --> zip object\n\nReturn a zip object whose .__next__() method returns a tuple where\nthe i-th element comes from the i-th iterable argument.  The .__next__()\nmethod continues until the shortest iterable in the argument sequence\nis exhausted and then it raises StopIteration.",
        tp$new(args, kwargs) {
            if (this === Sk.builtin.zip_.prototype) {
                Sk.abstr.checkNoKwargs("zip", kwargs);
            }
            const iters = [];
            for (let i = 0; i < args.length; i++) {
                try {
                    iters.push(Sk.abstr.iter(args[i]));
                } catch (e) {
                    if (e instanceof Sk.builtin.TypeError) {
                        throw new Sk.builtin.TypeError("zip argument #" + (i + 1) + " must support iteration");
                    } else {
                        throw e;
                    }
                }
            }
            if (this === Sk.builtin.zip_.prototype) {
                return new Sk.builtin.zip_(iters);
            } else {
                const instance = new this.constructor();
                Sk.builtin.zip_.call(instance, iters);
                return instance;
            }
        },
    },
});
Sk.exportSymbol("Sk.builtin.zip_", Sk.builtin.zip_);

