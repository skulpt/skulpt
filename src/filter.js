/**
 * @constructor
 * @param {pyObject} func
 * @param {pyObject} iterable
 * @extends Sk.builtin.object
 */
Sk.builtin.filter_ = Sk.abstr.buildIteratorClass("filter", {
    constructor: function filter_(func, iterable) {
        this.$func = func;
        this.$iterable = iterable;
        if (this.$func === null) {
            this.$filter = () =>
                Sk.misceval.iterFor(this.$iterable, (i) => {
                    if (Sk.misceval.isTrue(i)) {
                        throw new Sk.misceval.Break(i);
                    }
                });
        } else {
            this.$filter = () =>
                Sk.misceval.iterFor(this.$iterable, (i) =>
                    Sk.misceval.chain(
                        () => Sk.misceval.callsimOrSuspendArray(this.$func, [i]),
                        (ret) => {
                            if (Sk.misceval.isTrue(ret)) {
                                throw new Sk.misceval.Break(i);
                            }
                        }
                    )
                );
        }
    },
    iternext(canSuspend) {
        // iterate over iterable until we pass the predicate
        return canSuspend ? this.$filter() : Sk.misceval.retryOptionalSuspensionOrThrow(this.$filter);
    },
    slots: {
        tp$doc:
            "Return an iterator yielding those items of iterable for which function(item)\nis true. If function is None, return the items that are true.",
        tp$new(args, kwargs) {
            let [func, iterable] = Sk.abstr.copyKeywordsToNamedArgs(
                "filter",
                ["predicate", "iterable"],
                args,
                kwargs,
                []
            );
            func = Sk.builtin.checkNone(func) ? null : func;
            iterable = Sk.abstr.iter(iterable);
            // in theory you could subclass
            if (this === Sk.builtin.filter_.prototype) {
                return new Sk.builtin.filter_(func, iterable);
            } else {
                const instance = new this.constructor();
                Sk.builtin.filter_.call(instance, func, iterable);
                return instance;
            }
        },
    },
});

Sk.exportSymbol("Sk.builtin.filter_", Sk.builtin.filter_);
