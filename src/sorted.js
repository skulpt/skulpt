Sk.builtin.sorted = function sorted (iterable, cmp, key, reverse) {
    var arr;
    var next;
    var iter;
    var compare_func;
    var list;
    if (key !== undefined && !(key instanceof Sk.builtin.none)) {
        if (cmp instanceof Sk.builtin.none || cmp === undefined) {
            compare_func = function (a, b) {
                return Sk.misceval.richCompareBool(a[0], b[0], "Lt") ? new Sk.builtin.nmber(-1, Sk.builtin.nmber.int$) : new Sk.builtin.nmber(0, Sk.builtin.nmber.int$);
            };
        }
        else {
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
    }
    else {
        if (!(cmp instanceof Sk.builtin.none) && cmp !== undefined) {
            compare_func = cmp;
        }
        list = new Sk.builtin.list(iterable);
    }

    if (compare_func !== undefined) {
        list.list_sort_(list, compare_func);
    }
    else {
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
Sk.builtin.sorted.co_varnames = ["cmp", "key", "reverse"];
Sk.builtin.sorted.$defaults = [Sk.builtin.none.none$, Sk.builtin.none.none$, false];
Sk.builtin.sorted.co_numargs = 4;
