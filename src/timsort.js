/**
 * @constructor
 * @param {Sk.builtin.list=} list
 * @param {number=} length optional
 * @extends Sk.builtin.object
 */
Sk.builtin.timSort = function (list, length) {
    this.list = new Sk.builtin.list(list.v);
    // When we get into galloping mode, we stay there until both runs win less
    // often than MIN_GALLOP consecutive times.  See listsort.txt for more info.
    this.MIN_GALLOP = 7;
    if (length) {
        this.listlength = length;
    } else {
        this.listlength = list.sq$length();
    }
};

Sk.builtin.timSort.prototype.lt = function (a, b) {
    return Sk.misceval.richCompareBool(a, b, "Lt");
};

Sk.builtin.timSort.prototype.le = function (a, b) {
    return !this.lt(b, a);
};

Sk.builtin.timSort.prototype.setitem = function (item, value) {
    this.list.v[item] = value;
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
Sk.builtin.timSort.prototype.binary_sort = function (a, sorted) {
    var pivot;
    var p;
    var r;
    var l;
    var start;
    for (start = a.base + sorted; start < a.base + a.len; start++) {
        l = a.base;
        r = start;
        pivot = a.getitem(r);
        // Invariants:
        // pivot >= all in [base, l).
        // pivot  < all in [r, start).
        // The second is vacuously true at the start.
        while (l < r) {
            p = l + ((r - l) >> 1);
            if (this.lt(pivot, a.getitem(p))) {
                r = p;
            } else {
                l = p + 1;
            }
        }
        goog.asserts.assert(l === r);
        // The invariants still hold, so pivot >= all in [base, l) and
        // pivot < all in [l, start), so pivot belongs at l.  Note
        // that if there are elements equal to pivot, l points to the
        // first slot after them -- that's why this sort is stable.
        // Slide over to make room.
        for (p = start; p > l; p--) {
            a.setitem(p, a.getitem(p - 1));
        }
        a.setitem(l, pivot);
    }
};

Sk.builtin.timSort.prototype.count_run = function (a) {
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
    var n;
    var p;
    var descending;
    if (a.len <= 1) {
        n = a.len;
        descending = false;
    } else {
        n = 2;
        if (this.lt(a.getitem(a.base + 1), a.getitem(a.base))) {
            descending = true;
            for (p = a.base + 2; p < a.base + a.len; p++) {
                if (this.lt(a.getitem(p), a.getitem(p - 1))) {
                    n++;
                } else {
                    break;
                }
            }
        } else {
            descending = false;
            for (p = a.base + 2; p < a.base + a.len; p++) {
                if (this.lt(a.getitem(p), a.getitem(p - 1))) {
                    break;
                } else {
                    n++;
                }
            }
        }
    }
    return {"run": new Sk.builtin.listSlice(a.list, a.base, n), "descending": descending};
};

Sk.builtin.timSort.prototype.sort = function () {
    /*
     # ____________________________________________________________
     # Entry point.
     */

    var minrun;
    var cr;
    var sorted;
    var remaining = new Sk.builtin.listSlice(this.list, 0, this.listlength);
    if (remaining.len < 2) {
        return;
    }

    // March over the array once, left to right, finding natural runs,
    // and extending short natural runs to minrun elements.
    this.merge_init();
    minrun = this.merge_compute_minrun(remaining.len);
    while (remaining.len > 0) {
        // Identify next run.
        cr = this.count_run(remaining);
        if (cr.descending) {
            cr.run.reverse();
        }
        // If short, extend to min(minrun, nremaining).
        if (cr.run.len < minrun) {
            sorted = cr.run.len;
            if (minrun < remaining.len) {
                cr.run.len = minrun;
            } else {
                cr.run.len = remaining.len;
            }
            this.binary_sort(cr.run, sorted);
        }
        // Advance remaining past this run.
        remaining.advance(cr.run.len);
        // Push run onto pending-runs stack, and maybe merge.
        this.pending.push(cr.run);
        this.merge_collapse();
    }
    goog.asserts.assert(remaining.base == this.listlength);

    this.merge_force_collapse();
    goog.asserts.assert(this.pending.length == 1);
    goog.asserts.assert(this.pending[0].base === 0);
    goog.asserts.assert(this.pending[0].len == this.listlength);
};

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
Sk.builtin.timSort.prototype.gallop = function (key, a, hint, rightmost) {
    var lower;
    var self;
    var p;
    var lastofs;
    var ofs;
    var maxofs;
    var hintminofs;
    var hintminlastofs;
    var m;
    goog.asserts.assert(0 <= hint && hint < a.len);
    self = this;
    if (rightmost) {
        lower = function (a, b) {
            return self.le(a, b);
        }; // search for the largest k for which a[k] <= key
    } else {
        lower = function (a, b) {
            return self.lt(a, b);
        }; // search for the largest k for which a[k] < key
    }
    p = a.base + hint;
    lastofs = 0;
    ofs = 1;
    if (lower(a.getitem(p), key)) {
        // a[hint] < key -- gallop right, until
        // a[hint + lastofs] < key <= a[hint + ofs]

        maxofs = a.len - hint; // a[a.len-1] is highest
        while (ofs < maxofs) {
            if (lower(a.getitem(p + ofs), key)) {
                lastofs = ofs;
                try {
                    ofs = (ofs << 1) + 1;
                } catch (err) {
                    ofs = maxofs;
                }
            } else {
                // key <= a[hint + ofs]
                break;
            }
        }
        if (ofs > maxofs) {
            ofs = maxofs;
        }
        // Translate back to offsets relative to a.
        lastofs += hint;
        ofs += hint;
    } else {
        // key <= a[hint] -- gallop left, until
        // a[hint - ofs] < key <= a[hint - lastofs]
        maxofs = hint + 1;   // a[0] is lowest
        while (ofs < maxofs) {
            if (lower(a.getitem(p - ofs), key)) {
                break;
            } else {
                // key <= a[hint - ofs]
                lastofs = ofs;
                try {
                    ofs = (ofs << 1) + 1;
                } catch (err) {
                    ofs = maxofs;
                }
            }
        }
        if (ofs > maxofs) {
            ofs = maxofs;
        }
        // Translate back to positive offsets relative to a.
        hintminofs = hint - ofs;
        hintminlastofs = hint - lastofs;
        lastofs = hintminofs;
        ofs = hintminlastofs;
    }
    goog.asserts.assert(-1 <= lastofs < ofs <= a.len);

    // Now a[lastofs] < key <= a[ofs], so key belongs somewhere to the
    // right of lastofs but no farther right than ofs.  Do a binary
    // search, with invariant a[lastofs-1] < key <= a[ofs].

    lastofs += 1;
    while (lastofs < ofs) {
        m = lastofs + ((ofs - lastofs) >> 1);
        if (lower(a.getitem(a.base + m), key)) {
            lastofs = m + 1;   // a[m] < key
        } else {
            ofs = m;         // key <= a[m]
        }
    }
    goog.asserts.assert(lastofs == ofs);         // so a[ofs-1] < key <= a[ofs]
    return ofs;
};

// ____________________________________________________________

Sk.builtin.timSort.prototype.merge_init = function () {
    // This controls when we get *into* galloping mode.  It's initialized
    // to MIN_GALLOP.  merge_lo and merge_hi tend to nudge it higher for
    // random data, and lower for highly structured data.
    this.min_gallop = this.MIN_GALLOP;

    // A stack of n pending runs yet to be merged.  Run #i starts at
    // address pending[i].base and extends for pending[i].len elements.
    // It's always true (so long as the indices are in bounds) that
    //
    //     pending[i].base + pending[i].len == pending[i+1].base
    //
    // so we could cut the storage for this, but it's a minor amount,
    // and keeping all the info explicit simplifies the code.
    this.pending = [];
};

// Merge the slice "a" with the slice "b" in a stable way, in-place.
// a.len <= b.len.  See listsort.txt for more info.
// a.len and b.len must be > 0, and a.base + a.len == b.base.
// Must also have that b.list[b.base] < a.list[a.base], that
// a.list[a.base+a.len-1] belongs at the end of the merge, and should have

Sk.builtin.timSort.prototype.merge_lo = function (a, b) {
    var min_gallop;
    var dest;
    var acount, bcount;
    var p;
    goog.asserts.assert(a.len > 0 && b.len > 0 && a.base + a.len == b.base);
    min_gallop = this.min_gallop;
    dest = a.base;
    a = a.copyitems();

    // Invariant: elements in "a" are waiting to be reinserted into the list
    // at "dest".  They should be merged with the elements of "b".
    // b.base == dest + a.len.
    // We use a finally block to ensure that the elements remaining in
    // the copy "a" are reinserted back into this.list in all cases.
    try {
        this.setitem(dest, b.popleft());

        dest++;
        if (a.len == 1 || b.len === 0) {
            return;
        }

        while (true) {
            acount = 0;   // number of times A won in a row
            bcount = 0;   // number of times B won in a row

            // Do the straightforward thing until (if ever) one run
            // appears to win consistently.
            while (true) {
                if (this.lt(b.getitem(b.base), a.getitem(a.base))) {
                    this.setitem(dest, b.popleft());
                    dest++;
                    if (b.len === 0) {
                        return;
                    }
                    bcount++;
                    acount = 0;
                    if (bcount >= min_gallop) {
                        break;
                    }
                } else {
                    this.setitem(dest, a.popleft());
                    dest++;
                    if (a.len == 1) {
                        return;
                    }
                    acount++;
                    bcount = 0;
                    if (acount >= min_gallop) {
                        break;
                    }
                }
            }

            // One run is winning so consistently that galloping may
            // be a huge win.  So try that, and continue galloping until
            // (if ever) neither run appears to be winning consistently
            // anymore.
            min_gallop += 1;

            while (true) {
                min_gallop -= min_gallop > 1;
                this.min_gallop = min_gallop;
                acount = this.gallop(b.getitem(b.base), a, 0, true);
                for (p = a.base; p < a.base + acount; p++) {
                    this.setitem(dest, a.getitem(p));
                    dest++;
                }

                a.advance(acount);

                if (a.len <= 1) {
                    return;
                }

                this.setitem(dest, b.popleft());
                dest++;

                // a.len==0 is impossible now if the comparison
                // function is consistent, but we can't assume
                // that it is.
                if (b.len === 0) {
                    return;
                }

                bcount = this.gallop(a.getitem(a.base), b, 0, false);

                for (p = b.base; p < b.base + bcount; p++) {
                    this.setitem(dest, b.getitem(p));
                    dest++;
                }

                b.advance(bcount);
                if (b.len === 0) {
                    return;
                }
                this.setitem(dest, a.popleft());
                dest++;

                if (a.len == 1) {
                    return;
                }

                if (acount < this.MIN_GALLOP && bcount < this.MIN_GALLOP) {
                    break;
                }

                min_gallop++;  // penalize it for leaving galloping mode
                this.min_gallop = min_gallop;
            }
        }
    }
    finally {
        // The last element of a belongs at the end of the merge, so we copy
        // the remaining elements of b before the remaining elements of a.
        goog.asserts.assert(a.len >= 0 && b.len >= 0);
        for (p = b.base; p < b.base + b.len; p++) {
            this.setitem(dest, b.getitem(p));
            dest++;
        }
        for (p = a.base; p < a.base + a.len; p++) {
            this.setitem(dest, a.getitem(p));
            dest++;
        }
    }
};

Sk.builtin.timSort.prototype.merge_hi = function (a, b) {
    var min_gallop;
    var dest;
    var acount, bcount, nexta, nextb;
    var k;
    var p;
    goog.asserts.assert(a.len > 0 && b.len > 0 && a.base + a.len == b.base);
    min_gallop = this.min_gallop;
    dest = b.base + b.len;
    b = b.copyitems();

    // Invariant: elements in "a" are waiting to be reinserted into the list
    // at "dest".  They should be merged with the elements of "b".
    // b.base == dest + a.len.
    // We use a finally block to ensure that the elements remaining in
    // the copy "a" are reinserted back into this.list in all cases.
    try {
        dest--;
        this.setitem(dest, a.popright());

        if (a.len === 0 || b.len == 1) {
            return;
        }

        while (true) {
            acount = 0;   // number of times A won in a row
            bcount = 0;   // number of times B won in a row

            // Do the straightforward thing until (if ever) one run
            // appears to win consistently.
            while (true) {
                nexta = a.getitem(a.base + a.len - 1);
                nextb = b.getitem(b.base + b.len - 1);
                if (this.lt(nextb, nexta)) {
                    dest--;
                    this.setitem(dest, nexta);
                    a.len--;
                    if (a.len === 0) {
                        return;
                    }
                    acount++;
                    bcount = 0;
                    if (acount >= min_gallop) {
                        break;
                    }
                } else {
                    dest--;
                    this.setitem(dest, nextb);
                    b.len--;
                    if (b.len == 1) {
                        return;
                    }
                    bcount++;
                    acount = 0;
                    if (bcount >= min_gallop) {
                        break;
                    }
                }
            }

            // One run is winning so consistently that galloping may
            // be a huge win.  So try that, and continue galloping until
            // (if ever) neither run appears to be winning consistently
            // anymore.
            min_gallop += 1;

            while (true) {
                min_gallop -= min_gallop > 1;
                this.min_gallop = min_gallop;
                nextb = b.getitem(b.base + b.len - 1);
                k = this.gallop(nextb, a, a.len - 1, true);
                acount = a.len - k;
                for (p = a.base + a.len - 1; p > a.base + k - 1; p--) {
                    dest--;
                    this.setitem(dest, a.getitem(p));
                }
                a.len -= acount;
                if (a.len === 0) {
                    return;
                }

                dest--;
                this.setitem(dest, b.popright());
                if (b.len == 1) {
                    return;
                }

                nexta = a.getitem(a.base + a.len - 1);
                k = this.gallop(nexta, b, b.len - 1, false);
                bcount = b.len - k;
                for (p = b.base + b.len - 1; p > b.base + k - 1; p--) {
                    dest--;
                    this.setitem(dest, b.getitem(p));
                }

                b.len -= bcount;

                // b.len==0 is impossible now if the comparison
                // function is consistent, but we can't assume
                // that it is.
                if (b.len <= 1) {
                    return;
                }
                dest--;
                this.setitem(dest, a.popright());
                if (a.len === 0) {
                    return;
                }

                if (acount < this.MIN_GALLOP && bcount < this.MIN_GALLOP) {
                    break;
                }

                min_gallop++;  // penalize it for leaving galloping mode
                this.min_gallop = min_gallop;
            }
        }
    }
    finally {
        // The last element of a belongs at the end of the merge, so we copy
        // the remaining elements of b before the remaining elements of a.
        goog.asserts.assert(a.len >= 0 && b.len >= 0);
        for (p = a.base + a.len - 1; p > a.base - 1; p--) {
            dest--;
            this.setitem(dest, a.getitem(p));
        }
        for (p = b.base + b.len - 1; p > b.base - 1; p--) {
            dest--;
            this.setitem(dest, b.getitem(p));
        }
    }
};

// Merge the two runs at stack indices i and i+1.

Sk.builtin.timSort.prototype.merge_at = function (i) {
    var a;
    var b;
    var k;
    if (i < 0) {
        i = this.pending.length + i;
    }

    a = this.pending[i];
    b = this.pending[i + 1];
    goog.asserts.assert(a.len > 0 && b.len > 0);
    goog.asserts.assert(a.base + a.len == b.base);

    // Record the length of the combined runs and remove the run b
    this.pending[i] = new Sk.builtin.listSlice(this.list, a.base, a.len + b.len);
    this.pending.splice(i + 1, 1);

    // Where does b start in a?  Elements in a before that can be
    // ignored (already in place).
    k = this.gallop(b.getitem(b.base), a, 0, true);
    a.advance(k);
    if (a.len === 0) {
        return;
    }

    // Where does a end in b?  Elements in b after that can be
    // ignored (already in place).
    b.len = this.gallop(a.getitem(a.base + a.len - 1), b, b.len - 1, false);
    if (b.len === 0) {
        return;
    }

    // Merge what remains of the runs.  The direction is chosen to
    // minimize the temporary storage needed.
    if (a.len <= b.len) {
        this.merge_lo(a, b);
    } else {
        this.merge_hi(a, b);
    }
};

// Examine the stack of runs waiting to be merged, merging adjacent runs
// until the stack invariants are re-established:
//
// 1. len[-3] > len[-2] + len[-1]
// 2. len[-2] > len[-1]
//
// See listsort.txt for more info.
Sk.builtin.timSort.prototype.merge_collapse = function () {
    var p = this.pending;
    while (p.length > 1) {
        if (p.length >= 3 && p[p.length - 3].len <= p[p.length - 2].len + p[p.length - 1].len) {
            if (p[p.length - 3].len < p[p.length - 1].len) {
                this.merge_at(-3);
            } else {
                this.merge_at(-2);
            }
        } else if (p[p.length - 2].len <= p[p.length - 1].len) {
            this.merge_at(-2);
        } else {
            break;
        }
    }
};

// Regardless of invariants, merge all runs on the stack until only one
// remains.  This is used at the end of the mergesort.

Sk.builtin.timSort.prototype.merge_force_collapse = function () {
    var p = this.pending;
    while (p.length > 1) {
        if (p.length >= 3 && p[p.length - 3].len < p[p.length - 1].len) {
            this.merge_at(-3);
        } else {
            this.merge_at(-2);
        }
    }
};
// Compute a good value for the minimum run length; natural runs shorter
// than this are boosted artificially via binary insertion.
//
// If n < 64, return n (it's too small to bother with fancy stuff).
// Else if n is an exact power of 2, return 32.
// Else return an int k, 32 <= k <= 64, such that n/k is close to, but
// strictly less than, an exact power of 2.
//
// See listsort.txt for more info.

Sk.builtin.timSort.prototype.merge_compute_minrun = function (n) {
    var r = 0;    // becomes 1 if any 1 bits are shifted off
    while (n >= 64) {
        r = r | n & 1;
        n >>= 1;
    }
    return n + r;
};

//ListSlice
/**
 * @constructor
 * @param {Sk.builtin.list=} list
 * @param {number=} base
 * @param {number=} len
 * @extends Sk.builtin.object
 */
Sk.builtin.listSlice = function (list, base, len) {
    this.list = list;
    this.base = base;
    this.len = len;
};

Sk.builtin.listSlice.prototype.copyitems = function () {
    //Make a copy of the slice of the original list
    var start = this.base;
    var stop = this.base + this.len;
    goog.asserts.assert(0 <= start <= stop);
    return new Sk.builtin.listSlice(new Sk.builtin.list(this.list.v.slice(start, stop)), 0, this.len);
};

Sk.builtin.listSlice.prototype.advance = function (n) {
    this.base += n;
    this.len -= n;
    goog.asserts.assert(this.base <= this.list.sq$length());
};

Sk.builtin.listSlice.prototype.getitem = function (item) {
    return this.list.v[item];
};

Sk.builtin.listSlice.prototype.setitem = function (item, value) {
    this.list.v[item] = value;
};

Sk.builtin.listSlice.prototype.popleft = function () {
    var result = this.list.v[this.base];
    this.base++;
    this.len--;
    return result;
};

Sk.builtin.listSlice.prototype.popright = function () {
    this.len--;
    return this.list.v[this.base + this.len];
};

Sk.builtin.listSlice.prototype.reverse = function () {
    // Reverse the slice in-place.
    var list_hi;
    var list_lo;
    var list = this.list;
    var lo = this.base;
    var hi = lo + this.len - 1;
    while (lo < hi) {
        list_hi = list.v[hi];
        list_lo = list.v[lo];
        list.v[lo] = list_hi;
        list.v[hi] = list_lo;
        lo++;
        hi--;
    }
};

goog.exportSymbol("Sk.builtin.listSlice", Sk.builtin.listSlice);
goog.exportSymbol("Sk.builtin.timSort", Sk.builtin.timSort);
