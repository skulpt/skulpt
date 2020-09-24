/**
 * @constructor
 * @param {pyObject} iterable
 * @param {number|string=} start
 * @extends Sk.builtin.object
 */
Sk.builtin.enumerate = Sk.abstr.buildIteratorClass("enumerate", {
    constructor: function enumerate(iterable, start) {
        if (!(this instanceof Sk.builtin.enumerate)) {
            throw TypeError("Failed to construct 'enumerate': Please use the 'new' operator");
        }
        this.$iterable = iterable;
        this.$index = start;
        return this;
    },
    iternext(canSuspend) {
        const ret = Sk.misceval.chain(this.$iterable.tp$iternext(canSuspend), (i) => {
            if (i === undefined) {
                return undefined;
            }
            return new Sk.builtin.tuple([new Sk.builtin.int_(this.$index++), i]);
        });
        return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
    },
    slots: {
        tp$doc:
            "Return an enumerate object.\n\n  iterable\n    an object supporting iteration\n\nThe enumerate object yields pairs containing a count (from start, which\ndefaults to zero) and a value yielded by the iterable argument.\n\nenumerate is useful for obtaining an indexed list:\n    (0, seq[0]), (1, seq[1]), (2, seq[2]), ...",
        tp$new(args, kwargs) {
            let [iterable, start] = Sk.abstr.copyKeywordsToNamedArgs("enumerate", ["iterable", "start"], args, kwargs, [new Sk.builtin.int_(0)]);
            iterable = Sk.abstr.iter(iterable);
            start = Sk.misceval.asIndexOrThrow(start);
            if (this === Sk.builtin.enumerate.prototype) {
                return new Sk.builtin.enumerate(iterable, start);
            } else {
                const instance = new this.constructor();
                Sk.builtin.enumerate.call(instance, iterable, start);
                return instance;
            }
        },
    },
});
Sk.exportSymbol("Sk.builtin.enumerate", Sk.builtin.enumerate);