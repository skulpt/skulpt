Sk.builtin.sorted = function sorted (iterable, cmp, key, reverse) {
    var arr;
    var next;
    var iter;
    var compare_func;
    var list;
    if (key !== undefined && !(key instanceof Sk.builtin.none)) {
        if (cmp instanceof Sk.builtin.none || cmp === undefined) {
            compare_func = function (a, b) {
                return Sk.misceval.richCompareBool(a[0], b[0], "Lt") ? new Sk.builtin.int_(-1) : new Sk.builtin.int_(0);
            };
        } else {
            compare_func = function (a, b) {
                return Sk.misceval.callsim(cmp, a[0], b[0]);
            };
        }
        iter = iterable.tp$iter();
        next = iter.tp$iternext();
        arr = [];
        while (next !== undefined) {
            arr.push([Sk.misceval.callsim(key, next), next]);
            next = iter.tp$iternext();
        }
        list = new Sk.builtin.list(arr);
    } else {
        if (!(cmp instanceof Sk.builtin.none) && cmp !== undefined) {
            compare_func = cmp;
        }
        list = new Sk.builtin.list(iterable);
    }

    if (compare_func !== undefined) {
        list.list_sort_(list, compare_func);
    } else {
        list.list_sort_(list);
    }

    if (reverse) {
        list.list_reverse_(list);
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