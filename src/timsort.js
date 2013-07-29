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

Sk.builtin.timSort.prototype.count_run = funtion(a){
	/*
	# Compute the length of the run in the slice "a".
    # "A run" is the longest ascending sequence, with
    #
    #     a[0] <= a[1] <= a[2] <= ...
    #
    # or the longest descending sequence, with
    #
    #     a[0] > a[1] > a[2] > ...
    #
    # Return (run, descending) where descending is False in the former case,
    # or True in the latter.
    # For its intended use in a stable mergesort, the strictness of the defn of
    # "descending" is needed so that the caller can safely reverse a descending
    # sequence without violating stability (strict > ensures there are no equal
    # elements to get out of order).
*/
	var descending;
	if (a.len <= 1) {
		var n = a.len;
		descending = false;
	}
	else {
		var n = 2;
		if (this.lt(this.getitem(a, 1), this.getitem(a, 0))){
			descending = true;
			for (var p in Sk.builtin.range(2, a.sq$length())){
				if (this.lt(a.getitem(p), this.getitem(p-1))){
					break;
				}
				else {
					n++;
				}
			}
		}
	}
	return [new Sk.builtin.listslice(a.list, a.base, n), descending]
};

Sk.builtin.timSort.prototype.sort = function (){
	/*
	# ____________________________________________________________
    # Entry point.
	*/
	
	var remaining = new Sk.builtin.listslice(this.list, 0, this.listlength);
	if (remaining.len < 2){
		return;
	}
	
    // March over the array once, left to right, finding natural runs,
    // and extending short natural runs to minrun elements.
    this.merge_init()
    var minrun = this.merge_compute_minrun(remaining.len)
	while (remaining.len > 0){
		// Identify next run.
		var cr = this.count_run(remaining);
		if (cr.descending){
			cr.run.reverse();
		}
		// If short, extend to min(minrun, nremaining).
		if (cr.run.len < minrun){
			var sorted = cr.run.len;
			run.len = min(minrun, remaining.len);
			this.binary_sort(run, sorted)
		}
		// Advance remaining past this run.
        remaining.advance(run.len);
		// Push run onto pending-runs stack, and maybe merge.
        this.pending.append(run)/;
        this.merge_collapse();
	}
	goog.assers.assert(remaining.base == self.listlength);
  
  	this.merge_force_collapse();

	goog.asserts.assert(this.pending.length == 1);
	goog.asserts.assert(this.pending[0].base == 0);
	goog.asserts.assert(this.pending[0].len == self.listlength);
}
/*
	# Locate the proper position of key in a sorted vector; if the vector
	# contains an element equal to key, return the position immediately to the
	# left of the leftmost equal element -- or to the right of the rightmost
	# equal element if the flag "rightmost" is set.
	#
	# "hint" is an index at which to begin the search, 0 <= hint < a.len.
	# The closer hint is to the final result, the faster this runs.
	#
	# The return value is the index 0 <= k <= a.len such that
	#
	#     a[k-1] < key <= a[k]      (if rightmost is False)
	#     a[k-1] <= key < a[k]      (if rightmost is True)
	#
	# as long as the indices are in bound.  IOW, key belongs at index k;
	# or, IOW, the first k elements of a should precede key, and the last
	# n-k should follow key.
*/
Sk.builtin.timSort.prototype.gallop = function(key, a, hint, rightmost){
	goog.asserts.assert(0 <= hint < a.len);
	if (rightmost) {
		lower = this.le // search for the largest k for which a[k] <= key
	} 
	else {
		lower = this.lt // search for the largest k for which a[k] < key
	}
	var p = a.base + hint;
	var lastofs = 0;
	var ofs = 1;
	if (lower(a.getitem(p), key)) {
		// a[hint] < key -- gallop right, until
	    // a[hint + lastofs] < key <= a[hint + ofs]

	    var maxofs = a.len - hint // a[a.len-1] is highest
	    while (ofs < maxofs){
	    	if lower(a.getitem(p + ofs), key){
	        	lastofs = ofs
	        	try {
	            	ofs = ovfcheck(ofs << 1);
					ofs = ofs + 1;
	        	} catch (err){
					ofs = maxofs
				}
			}
	        else {
	        	// key <= a[hint + ofs]
	            break;
			}
	        if (ofs > maxofs) {
		        ofs = maxofs;
			}
	        // Translate back to offsets relative to a.
	        lastofs += hint;
	        ofs += hint;
		}	
	}
	else {
		// key <= a[hint] -- gallop left, until
        // a[hint - ofs] < key <= a[hint - lastofs]
        var maxofs = hint + 1   // a[0] is lowest
        while (ofs < maxofs) {
            if (lower(a.getitem(p - ofs), key)) {
                break;
			}
            else {
                # key <= a[hint - ofs]
                lastofs = ofs
                try {
                    ofs = ovfcheck(ofs << 1)
					ofs = ofs + 1
                } catch(err) {
					ofs = maxofs;
				}
			}
		}
        if (ofs > maxofs){
            ofs = maxofs
		}
        // Translate back to positive offsets relative to a.
        lastofs = hint-ofs;
		ofs = hint-lastofs;
	}
	goog.asserts.assert( -1 <= lastofs < ofs <= a.len):

    // Now a[lastofs] < key <= a[ofs], so key belongs somewhere to the
    // right of lastofs but no farther right than ofs.  Do a binary
    // search, with invariant a[lastofs-1] < key <= a[ofs].

    lastofs += 1
    while (lastofs < ofs){
        var m = lastofs + ((ofs - lastofs) >> 1);
        if (lower(a.getitem(a.base + m), key)){
            lastofs = m+1;   // a[m] < key
        }
		else{
            ofs = m;         // key <= a[m]
		}
	}
    goog.asserts.assert(lastofs == ofs);         // so a[ofs-1] < key <= a[ofs]
    return ofs;
};
    
    
       

