/**
 * py sort is guaranteed to be stable, js's is not (and isn't in some
 * browsers). we also have to do cmp/key/rev anyway, so this is a simple
 * mergesort implementation to handle sorting for list (and other stuff
 * eventually).
 *
 * @param {Array.<Object>} arr
 * @param {Sk.builtin.func} cmp
 * @param {Sk.builtin.func=} key
 * @param {boolean=} reverse
 */
Sk.mergeSort = function(arr, cmp, key, reverse)
{
    goog.asserts.assert(!key, "todo;");
    goog.asserts.assert(!reverse, "todo;");

    if (!cmp)
    {
        cmp = Sk.mergeSort.stdCmp;
    }

    var mergeInPlace = function(begin, beginRight, end)
    {
        for (; begin < beginRight; ++begin)
        {
            if (!(Sk.misceval.callsim(cmp, arr[begin], arr[beginRight]) < 0))
            {
                var v = arr[begin];
                arr[begin] = arr[beginRight];

                while (begin + 1 < end && Sk.misceval.callsim(cmp, arr[begin + 1], v) < 0)
                {
                    var tmp = arr[begin];
                    arr[begin] = arr[begin + 1];
                    arr[begin + 1] = tmp;
                    begin += 1;
                }
                arr[begin] = v;
            }
        }
    };

    var sort = function(begin, end)
    {
        var size = end - begin;
        if (size < 2) return;

        var beginRight = begin + Math.floor(size / 2);

        sort(begin, beginRight);
        sort(beginRight, end);
        mergeInPlace(begin, beginRight, end);
    };

    //print("SORT", JSON.stringify(arr, null, 2));
    sort(0, arr.length);
    //print("SORTRES", JSON.stringify(arr, null, 2));
    return null;
};

Sk.mergeSort.stdCmp = new Sk.builtin.func(function(k0, k1)
{
    //print("CMP", JSON.stringify(k0), JSON.stringify(k1));
    var res = Sk.misceval.richCompareBool(k0, k1, "Lt") ? -1 : 0;
    //print("  ret:", res);
    return res;
});
