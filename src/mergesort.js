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
Sk.mergeSort = function(arr, cmp, key, reverse)	//	Replaced by quicksort
{
	Sk.quickSort(arr, cmp, key, reverse)
}

Sk.quickSort = function(arr, cmp, key, reverse)
{
    goog.asserts.assert(!key, "todo;");

    if (!cmp)
    {
        cmp = Sk.mergeSort.stdCmp;
    }

    var partition = function(arr, begin, end, pivot, reverse)
	{
		var tmp;
		var piv=arr[pivot];
		
//		swap pivot, end-1
		tmp=arr[pivot];
		arr[pivot]=arr[end-1];
		arr[end-1]=tmp;

		var store=begin;
		var ix;
		for(ix=begin; ix<end-1; ++ix) {
            if ( reverse ) {
			  var cmpresult = Sk.misceval.callsim(cmp, piv, arr[ix]);
            } else {
			  var cmpresult = Sk.misceval.callsim(cmp, arr[ix], piv);
            }
            if( Sk.builtin.asnum$(cmpresult) < 0 ) {
//				swap store, ix
				tmp=arr[store];
				arr[store]=arr[ix];
				arr[ix]=tmp;
				++store;
			}
		}
		
//		swap end-1, store
		tmp=arr[end-1];
		arr[end-1]=arr[store];
		arr[store]=tmp;
	
		return store;
	}
	
	var qsort = function(arr, begin, end, reverse)
	{
		if(end-1>begin) {
			var pivot=begin+Math.floor(Math.random()*(end-begin));
	
			pivot=partition(arr, begin, end, pivot, reverse);
	
			qsort(arr, begin, pivot, reverse);
			qsort(arr, pivot+1, end, reverse);
		}
	}

    qsort(arr, 0, arr.length, reverse);
    return null;
};

Sk.mergeSort.stdCmp = new Sk.builtin.func(function(k0, k1)
{
    //print("CMP", JSON.stringify(k0), JSON.stringify(k1));
    var res = Sk.misceval.richCompareBool(k0, k1, "Lt") ? -1 : 0;
    //print("  ret:", res);
    return res;
});

//	A javascript mergesort from the web

//function merge_sort(arr) {  
//    var l = arr.length, m = Math.floor(l/2);  
//    if (l <= 1) return arr;  
//    return merge(merge_sort(arr.slice(0, m)), merge_sort(arr.slice(m)));  
//}  
//  
//function merge(left,right) {  
//    var result = [];  
//    var ll = left.length, rl = right.length;  
//    while (ll > 0 && rl > 0) {  
//        if (left[0] <= right[0]) {  
//            result.push(left.shift());  
//            ll--;  
//        } else {  
//            result.push(right.shift());  
//            rl--;  
//        }  
//    }  
//    if (ll > 0) {  
//        result.push.apply(result, left);  
//    } else if (rl > 0) {  
//        result.push.apply(result, right);  
//    }  
//    return result;  
//} 

//	Old, original code (doesn't work)
//Sk.mergeSort = function(arr, cmp, key, reverse)
//{
//    goog.asserts.assert(!key, "todo;");
//    goog.asserts.assert(!reverse, "todo;");
//
//    if (!cmp)
//    {
//        cmp = Sk.mergeSort.stdCmp;
//    }
//
//    var mergeInPlace = function(begin, beginRight, end)
//    {
//        for (; begin < beginRight; ++begin)
//        {
//            if (!(Sk.misceval.callsim(cmp, arr[begin], arr[beginRight]) < 0))
//            {
//                var v = arr[begin];
//                arr[begin] = arr[beginRight];
//
//                while (begin + 1 < end && Sk.misceval.callsim(cmp, arr[begin + 1], v) < 0)
//                {
//                    var tmp = arr[begin];
//                    arr[begin] = arr[begin + 1];
//                    arr[begin + 1] = tmp;
//                    begin += 1;
//                }
//                arr[begin] = v;
//            }
//        }
//    };
//
//    var sort = function(begin, end)
//    {
//        var size = end - begin;
//        if (size < 2) return;
//
//        var beginRight = begin + Math.floor(size / 2);
//
//        sort(begin, beginRight);
//        sort(beginRight, end);
//        mergeInPlace(begin, beginRight, end);
//    };
//
//    //print("SORT", JSON.stringify(arr, null, 2));
//    sort(0, arr.length);
//    //print("SORTRES", JSON.stringify(arr, null, 2));
//    return null;
//};
