Sk.builtin.timSort = function(list, length){
    this.v = list;
    if (length) {
        this.l = length;
    }
    else {
        this.l = list.sq$length();
    }
}


Sk.builtin.timSort.prototype.setitem = function(list, item, value){
    list.v[item] = value;
};

Sk.builtin.timSort.prototype.getitem = function(list, item){
    return list.v[item];
}

Sk.builtin.timSort.prototype.lt = function(a, b){
    return a < b;
};

Sk.builtin.timSort.prototype.le = function(a, b){
    return !this.lt(b, a)
};

/*
 # binarysort is the best method for sorting small arrays: it does
 # few compares, but can do data movement quadratic in the number of
 # elements.
 # "a" is a contiguous slice of a list, and is sorted via binary insertion.
 # This sort is stable.
 # On entry, the first "sorted" elements are already sorted.
 # Even in case of error, the output slice will be some permutation of
 # the input (nothing is lost or duplicated)
*/
Sk.builtin.timSort.prototype.binarysort = function(a, sorted){
    //todo: find index of first element this assumes a list starts with index 0
    for(var start in Sk.builtin.range(0, a.sq$length()).v){
        var l = 0;
        var r = start;
        var pivot = this.getitem(a, r);
        // Invariants:
        // pivot >= all in [base, l).
        // pivot  < all in [r, start).
        // The second is vacuously true at the start.
        while(l < r){
            var p = l + ((r - l) >> 1);
            if (this.lt(pivot, this.getitem(a, p))){
                r = p;
            }
            else {
                l = p + 1;
            }
        }
        goog.asserts.assert(l == r);
        // The invariants still hold, so pivot >= all in [base, l) and
        // pivot < all in [l, start), so pivot belongs at l.  Note
        // that if there are elements equal to pivot, l points to the
        // first slot after them -- that's why this sort is stable.
        // Slide over to make room.
        for (var j in Sk.builtin.range(start, l,-1).v){
            this.setitem(a, p, this.getitem(a, p-1));
        }
        this.setitem(a, l, pivot);
    }
};

