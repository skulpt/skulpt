Sk.builtin.sorted = function sorted (iterable, cmp, key, reverse) {
    // TODO make this suspension aware
    var arr;
    var next;
    var iter;
    var compare_func;
    var list;
    var rev;

    if (reverse === undefined) {
        rev = false;
    } else if (reverse instanceof Sk.builtin.float_) {
        throw new Sk.builtin.TypeError("an integer is required, got float");
    } else if (reverse instanceof Sk.builtin.int_ || reverse.prototype instanceof Sk.builtin.int_) {
        rev = Sk.misceval.isTrue(reverse);
    } else {
        throw new Sk.builtin.TypeError("an integer is required");
    }

    if (key !== undefined && !(key instanceof Sk.builtin.none)) {
        if (cmp instanceof Sk.builtin.none || cmp === undefined) {
            compare_func = function (a, b) {
                return Sk.misceval.richCompareBool(a[0], b[0], "Lt") ? new Sk.builtin.int_(-1) : new Sk.builtin.int_(0);
            };
        } else {
            compare_func = function (a, b) {
                return Sk.misceval.callsimArray(cmp, [a[0], b[0]]);
            };
        }
        iter = Sk.abstr.iter(iterable);
        next = iter.tp$iternext();
        arr = [];
        while (next !== undefined) {
            arr.push([Sk.misceval.callsimArray(key, [next]), next]);
            next = iter.tp$iternext();
        }
        list = new Sk.builtin.list(arr);
    } else {
        if (!(cmp instanceof Sk.builtin.none) && cmp !== undefined) {
            compare_func = cmp;
        }
        arr = [];
        iter = Sk.abstr.iter(iterable);
        next = iter.tp$iternext();
        while (next !== undefined) {
            arr.push(next);
            next = iter.tp$iternext();
        }
        list = new Sk.builtin.list(arr);
    }

    if (compare_func !== undefined) {
        list.$list_sort(compare_func);
    } else {
        list.$list_sort();
    }

    if (rev) {
        list.$list_reverse();
    }

    if (key !== undefined && !(key instanceof Sk.builtin.none)) {
        iter = list.tp$iter();
        next = iter.tp$iternext();
        arr = [];
        while (next !== undefined) {
            arr.push(next[1]);
            next = iter.tp$iternext();
        }
        list = new Sk.builtin.list(arr);
    }

    return list;
};

/* NOTE: See constants used for kwargs in constants.js */
