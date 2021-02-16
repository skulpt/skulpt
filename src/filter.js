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
    },
    iternext(canSuspend) {
        // iterate over iterable until we pass the predicate
        // this.chcek$filter either returns the item or undefined
        const ret = Sk.misceval.iterFor(this.$iterable, (i) =>
            Sk.misceval.chain(this.check$filter(i), (i) => (i ? new Sk.misceval.Break(i) : undefined))
        );
        return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
    },
    slots: {
        tp$doc:
            "Return an iterator yielding those items of iterable for which function(item)\nis true. If function is None, return the items that are true.",
        tp$new(args, kwargs) {
            let [func, iterable] = Sk.abstr.copyKeywordsToNamedArgs("filter", ["predicate", "iterable"], args, kwargs, []);
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
    proto: {
        check$filter(item) {
            let res;
            if (this.$func === null) {
                res = item;
            } else {
                res = Sk.misceval.callsimOrSuspendArray(this.$func, [item]);
            }
            return Sk.misceval.chain(res, (ret) => (Sk.misceval.isTrue(ret) ? item : undefined));
        },
    },
});

Sk.exportSymbol("Sk.builtin.filter_", Sk.builtin.filter_);