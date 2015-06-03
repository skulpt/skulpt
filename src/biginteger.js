/**
 * @fileoverview
 * @suppress {checkTypes}
 */

/*
 * Basic JavaScript BN library - subset useful for RSA encryption.
 *
 * Copyright (c) 2003-2005  Tom Wu
 * All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
 *
 * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
 * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
 * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * In addition, the following condition applies:
 *
 * All redistributions must retain an intact copy of this copyright notice
 * and disclaimer.
 */


// (public) Constructor
/**
 * @constructor
 * @param {number|string|null} a
 * @param {number=} b
 * @param {*=} c
 */
Sk.builtin.biginteger = function (a, b, c) {
    if (a != null) {
        if ("number" == typeof a) {
            this.fromNumber(a, b, c);
        } else if (b == null && "string" != typeof a) {
            this.fromString(a, 256);
        } else {
            this.fromString(a, b);
        }
    }
};

// Bits per digit
//Sk.builtin.biginteger.dbits;

// JavaScript engine analysis
Sk.builtin.biginteger.canary = 0xdeadbeefcafe;
Sk.builtin.biginteger.j_lm = ((Sk.builtin.biginteger.canary & 0xffffff) == 0xefcafe);

// return new, unset Sk.builtin.biginteger
Sk.builtin.biginteger.nbi = function () {
    return new Sk.builtin.biginteger(null);
};

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
Sk.builtin.biginteger.prototype.am1 = function (i, x, w, j, c, n) {
    var v;
    while (--n >= 0) {
        v = x * this[i++] + w[j] + c;
        c = Math.floor(v / 0x4000000);
        w[j++] = v & 0x3ffffff;
    }
    return c;
};
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
Sk.builtin.biginteger.prototype.am2 = function (i, x, w, j, c, n) {
    var m;
    var h;
    var l;
    var xl = x & 0x7fff, xh = x >> 15;
    while (--n >= 0) {
        l = this[i] & 0x7fff;
        h = this[i++] >> 15;
        m = xh * l + h * xl;
        l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
        c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
        w[j++] = l & 0x3fffffff;
    }
    return c;
};
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
Sk.builtin.biginteger.prototype.am3 = function (i, x, w, j, c, n) {
    var m;
    var h;
    var l;
    var xl = x & 0x3fff, xh = x >> 14;
    while (--n >= 0) {
        l = this[i] & 0x3fff;
        h = this[i++] >> 14;
        m = xh * l + h * xl;
        l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
        c = (l >> 28) + (m >> 14) + xh * h;
        w[j++] = l & 0xfffffff;
    }
    return c;
};

// We need to select the fastest one that works in this environment.
//if (Sk.builtin.biginteger.j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
//	Sk.builtin.biginteger.prototype.am = am2;
//	Sk.builtin.biginteger.dbits = 30;
//} else if (Sk.builtin.biginteger.j_lm && (navigator.appName != "Netscape")) {
//	Sk.builtin.biginteger.prototype.am = am1;
//	Sk.builtin.biginteger.dbits = 26;
//} else { // Mozilla/Netscape seems to prefer am3
//	Sk.builtin.biginteger.prototype.am = am3;
//	Sk.builtin.biginteger.dbits = 28;
//}

// For node.js, we pick am3 with max Sk.builtin.biginteger.dbits to 28.
Sk.builtin.biginteger.prototype.am = Sk.builtin.biginteger.prototype.am3;
Sk.builtin.biginteger.dbits = 28;

Sk.builtin.biginteger.prototype.DB = Sk.builtin.biginteger.dbits;
Sk.builtin.biginteger.prototype.DM = ((1 << Sk.builtin.biginteger.dbits) - 1);
Sk.builtin.biginteger.prototype.DV = (1 << Sk.builtin.biginteger.dbits);

Sk.builtin.biginteger.BI_FP = 52;
Sk.builtin.biginteger.prototype.FV = Math.pow(2, Sk.builtin.biginteger.BI_FP);
Sk.builtin.biginteger.prototype.F1 = Sk.builtin.biginteger.BI_FP - Sk.builtin.biginteger.dbits;
Sk.builtin.biginteger.prototype.F2 = 2 * Sk.builtin.biginteger.dbits - Sk.builtin.biginteger.BI_FP;

// Digit conversions
Sk.builtin.biginteger.BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
Sk.builtin.biginteger.BI_RC = [];
var rr, vv;
rr = "0".charCodeAt(0);
for (vv = 0; vv <= 9; ++vv) {
    Sk.builtin.biginteger.BI_RC[rr++] = vv;
}
rr = "a".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) {
    Sk.builtin.biginteger.BI_RC[rr++] = vv;
}
rr = "A".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) {
    Sk.builtin.biginteger.BI_RC[rr++] = vv;
}

Sk.builtin.biginteger.int2char = function (n) {
    return Sk.builtin.biginteger.BI_RM.charAt(n);
};
Sk.builtin.biginteger.intAt = function (s, i) {
    var c = Sk.builtin.biginteger.BI_RC[s.charCodeAt(i)];
    return (c == null) ? -1 : c;
};

// (protected) copy this to r
Sk.builtin.biginteger.prototype.bnpCopyTo = function (r) {
    var i;
    for (i = this.t - 1; i >= 0; --i) {
        r[i] = this[i];
    }
    r.t = this.t;
    r.s = this.s;
};

// (protected) set from integer value x, -DV <= x < DV
Sk.builtin.biginteger.prototype.bnpFromInt = function (x) {
    this.t = 1;
    this.s = (x < 0) ? -1 : 0;
    if (x > 0) {
        this[0] = x;
    } else if (x < -1) {
        this[0] = x + this.DV;
    } else {
        this.t = 0;
    }
};

// return bigint initialized to value
Sk.builtin.biginteger.nbv = function (i) {
    var r = new Sk.builtin.biginteger(null);
    r.bnpFromInt(i);
    return r;
};

// (protected) set from string and radix
Sk.builtin.biginteger.prototype.bnpFromString = function (s, b) {
    var x;
    var i, mi, sh;
    var k;
    if (b == 16) {
        k = 4;
    } else if (b == 8) {
        k = 3;
    } else if (b == 256) {
        k = 8;
    }  else if (b == 2) {
        // byte array
        k = 1;
    } else if (b == 32) {
        k = 5;
    } else if (b == 4) {
        k = 2;
    } else {
        this.fromRadix(s, b);
        return;
    }
    this.t = 0;
    this.s = 0;
    i = s.length;
    mi = false;
    sh = 0;
    while (--i >= 0) {
        x = (k == 8) ? s[i] & 0xff : Sk.builtin.biginteger.intAt(s, i);
        if (x < 0) {
            if (s.charAt(i) == "-") {
                mi = true;
            }
            continue;
        }
        mi = false;
        if (sh === 0) {
            this[this.t++] = x;
        } else if (sh + k > this.DB) {
            this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
            this[this.t++] = (x >> (this.DB - sh));
        } else {
            this[this.t - 1] |= x << sh;
        }
        sh += k;
        if (sh >= this.DB) {
            sh -= this.DB;
        }
    }
    if (k == 8 && (s[0] & 0x80) !== 0) {
        this.s = -1;
        if (sh > 0) {
            this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
        }
    }
    this.clamp();
    if (mi) {
        Sk.builtin.biginteger.ZERO.subTo(this, this);
    }
};

// (protected) clamp off excess high words
Sk.builtin.biginteger.prototype.bnpClamp = function () {
    var c = this.s & this.DM;
    while (this.t > 0 && this[this.t - 1] == c) {
        --this.t;
    }
};

// (public) return string representation in given radix
Sk.builtin.biginteger.prototype.bnToString = function (b) {
    var p;
    var km, d, m, r, i;
    var k;
    if (this.s < 0) {
        return "-" + this.negate().toString(b);
    }
    if (b == 16) {
        k = 4;
    } else if (b == 8) {
        k = 3;
    } else if (b == 2) {
        k = 1;
    } else if (b == 32) {
        k = 5;
    } else if (b == 4) {
        k = 2;
    } else {
        return this.toRadix(b);
    }
    km = (1 << k) - 1, m = false, r = "", i = this.t;
    p = this.DB - (i * this.DB) % k;
    if (i-- > 0) {
        if (p < this.DB && (d = this[i] >> p) > 0) {
            m = true;
            r = Sk.builtin.biginteger.int2char(d);
        }
        while (i >= 0) {
            if (p < k) {
                d = (this[i] & ((1 << p) - 1)) << (k - p);
                d |= this[--i] >> (p += this.DB - k);
            } else {
                d = (this[i] >> (p -= k)) & km;
                if (p <= 0) {
                    p += this.DB;
                    --i;
                }
            }
            if (d > 0) {
                m = true;
            }
            if (m) {
                r += Sk.builtin.biginteger.int2char(d);
            }
        }
    }
    return m ? r : "0";
};

// (public) -this
Sk.builtin.biginteger.prototype.bnNegate = function () {
    var r = Sk.builtin.biginteger.nbi();
    Sk.builtin.biginteger.ZERO.subTo(this, r);
    return r;
};

// (public) |this|
Sk.builtin.biginteger.prototype.bnAbs = function () {
    return (this.s < 0) ? this.negate() : this;
};

// (public) return + if this > a, - if this < a, 0 if equal
Sk.builtin.biginteger.prototype.bnCompareTo = function (a) {
    var i;
    var r = this.s - a.s;
    if (r !== 0) {
        return r;
    }
    i = this.t;
    r = i - a.t;
    if (r !== 0) {
        return (this.s < 0) ? -r : r;
    }
    while (--i >= 0) {
        if ((r = this[i] - a[i]) !== 0) {
            return r;
        }
    }
    return 0;
};

// returns bit length of the integer x
Sk.builtin.biginteger.nbits = function (x) {
    var r = 1, t;
    if ((t = x >>> 16) !== 0) {
        x = t;
        r += 16;
    }
    if ((t = x >> 8) !== 0) {
        x = t;
        r += 8;
    }
    if ((t = x >> 4) !== 0) {
        x = t;
        r += 4;
    }
    if ((t = x >> 2) !== 0) {
        x = t;
        r += 2;
    }
    if ((t = x >> 1) !== 0) {
        x = t;
        r += 1;
    }
    return r;
};

// (public) return the number of bits in "this"
Sk.builtin.biginteger.prototype.bnBitLength = function () {
    if (this.t <= 0) {
        return 0;
    }
    return this.DB * (this.t - 1) + Sk.builtin.biginteger.nbits(this[this.t - 1] ^ (this.s & this.DM));
};

// (protected) r = this << n*DB
Sk.builtin.biginteger.prototype.bnpDLShiftTo = function (n, r) {
    var i;
    for (i = this.t - 1; i >= 0; --i) {
        r[i + n] = this[i];
    }
    for (i = n - 1; i >= 0; --i) {
        r[i] = 0;
    }
    r.t = this.t + n;
    r.s = this.s;
};

// (protected) r = this >> n*DB
Sk.builtin.biginteger.prototype.bnpDRShiftTo = function (n, r) {
    var i;
    for (i = n; i < this.t; ++i) {
        r[i - n] = this[i];
    }
    r.t = Math.max(this.t - n, 0);
    r.s = this.s;
};

// (protected) r = this << n
Sk.builtin.biginteger.prototype.bnpLShiftTo = function (n, r) {
    var bs = n % this.DB;
    var cbs = this.DB - bs;
    var bm = (1 << cbs) - 1;
    var ds = Math.floor(n / this.DB), c = (this.s << bs) & this.DM, i;
    for (i = this.t - 1; i >= 0; --i) {
        r[i + ds + 1] = (this[i] >> cbs) | c;
        c = (this[i] & bm) << bs;
    }
    for (i = ds - 1; i >= 0; --i) {
        r[i] = 0;
    }
    r[ds] = c;
    r.t = this.t + ds + 1;
    r.s = this.s;
    r.clamp();
};

// (protected) r = this >> n
Sk.builtin.biginteger.prototype.bnpRShiftTo = function (n, r) {
    var i;
    var bm;
    var cbs;
    var bs;
    var ds;
    r.s = this.s;
    ds = Math.floor(n / this.DB);
    if (ds >= this.t) {
        r.t = 0;
        return;
    }
    bs = n % this.DB;
    cbs = this.DB - bs;
    bm = (1 << bs) - 1;
    r[0] = this[ds] >> bs;
    for (i = ds + 1; i < this.t; ++i) {
        r[i - ds - 1] |= (this[i] & bm) << cbs;
        r[i - ds] = this[i] >> bs;
    }
    if (bs > 0) {
        r[this.t - ds - 1] |= (this.s & bm) << cbs;
    }
    r.t = this.t - ds;
    r.clamp();
};

// (protected) r = this - a
Sk.builtin.biginteger.prototype.bnpSubTo = function (a, r) {
    var i = 0, c = 0, m = Math.min(a.t, this.t);
    while (i < m) {
        c += this[i] - a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
    }
    if (a.t < this.t) {
        c -= a.s;
        while (i < this.t) {
            c += this[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += this.s;
    } else {
        c += this.s;
        while (i < a.t) {
            c -= a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c -= a.s;
    }
    r.s = (c < 0) ? -1 : 0;
    if (c < -1) {
        r[i++] = this.DV + c;
    } else if (c > 0) {
        r[i++] = c;
    }
    r.t = i;
    r.clamp();
};

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
Sk.builtin.biginteger.prototype.bnpMultiplyTo = function (a, r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i + y.t;
    while (--i >= 0) {
        r[i] = 0;
    }
    for (i = 0; i < y.t; ++i) {
        r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
    }
    r.s = 0;
    r.clamp();
    if (this.s != a.s) {
        Sk.builtin.biginteger.ZERO.subTo(r, r);
    }
};

// (protected) r = this^2, r != this (HAC 14.16)
Sk.builtin.biginteger.prototype.bnpSquareTo = function (r) {
    var c;
    var x = this.abs();
    var i = r.t = 2 * x.t;
    while (--i >= 0) {
        r[i] = 0;
    }
    for (i = 0; i < x.t - 1; ++i) {
        c = x.am(i, x[i], r, 2 * i, 0, 1);
        if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
            r[i + x.t] -= x.DV;
            r[i + x.t + 1] = 1;
        }
    }
    if (r.t > 0) {
        r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
    }
    r.s = 0;
    r.clamp();
};

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
Sk.builtin.biginteger.prototype.bnpDivRemTo = function (m, q, r) {
    var qd;
    var i, j, t;
    var d1, d2, e;
    var yt;
    var y0;
    var ys;
    var nsh;
    var y, ts, ms;
    var pt;
    var pm = m.abs();
    if (pm.t <= 0) {
        return;
    }
    pt = this.abs();
    if (pt.t < pm.t) {
        if (q != null) {
            q.fromInt(0);
        }
        if (r != null) {
            this.copyTo(r);
        }
        return;
    }
    if (r == null) {
        r = Sk.builtin.biginteger.nbi();
    }
    y = Sk.builtin.biginteger.nbi();
    ts = this.s;
    ms = m.s;
    nsh = this.DB - Sk.builtin.biginteger.nbits(pm[pm.t - 1]);	// normalize modulus
    if (nsh > 0) {
        pm.lShiftTo(nsh, y);
        pt.lShiftTo(nsh, r);
    } else {
        pm.copyTo(y);
        pt.copyTo(r);
    }
    ys = y.t;
    y0 = y[ys - 1];
    if (y0 === 0) {
        return;
    }
    yt = y0 * (1 << this.F1) + ((ys > 1) ? y[ys - 2] >> this.F2 : 0);
    d1 = this.FV / yt, d2 = (1 << this.F1) / yt;
    e = 1 << this.F2;
    i = r.t, j = i - ys;
    t = (q == null) ? Sk.builtin.biginteger.nbi() : q;
    y.dlShiftTo(j, t);
    if (r.compareTo(t) >= 0) {
        r[r.t++] = 1;
        r.subTo(t, r);
    }
    Sk.builtin.biginteger.ONE.dlShiftTo(ys, t);
    t.subTo(y, y);	// "negative" y so we can replace sub with am later
    while (y.t < ys) {
        y[y.t++] = 0;
    }
    while (--j >= 0) {
        // Estimate quotient digit
        qd = (r[--i] == y0) ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
        if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {	// Try it out
            y.dlShiftTo(j, t);
            r.subTo(t, r);
            while (r[i] < --qd) {
                r.subTo(t, r);
            }
        }
    }
    if (q != null) {
        r.drShiftTo(ys, q);
        if (ts != ms) {
            Sk.builtin.biginteger.ZERO.subTo(q, q);
        }
    }
    r.t = ys;
    r.clamp();
    if (nsh > 0) {
        r.rShiftTo(nsh, r);
    }	// Denormalize remainder
    if (ts < 0) {
        Sk.builtin.biginteger.ZERO.subTo(r, r);
    }
};

// (public) this mod a
Sk.builtin.biginteger.prototype.bnMod = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.abs().divRemTo(a, null, r);
    if (this.s < 0 && r.compareTo(Sk.builtin.biginteger.ZERO) > 0) {
        a.subTo(r, r);
    }
    return r;
};

// Modular reduction using "classic" algorithm
/**
 * @constructor
 * @extends Sk.builtin.biginteger
 */
Sk.builtin.biginteger.Classic = function (m) {
    this.m = m;
};
Sk.builtin.biginteger.prototype.cConvert = function (x) {
    if (x.s < 0 || x.compareTo(this.m) >= 0) {
        return x.mod(this.m);
    } else {
        return x;
    }
};
Sk.builtin.biginteger.prototype.cRevert = function (x) {
    return x;
};
Sk.builtin.biginteger.prototype.cReduce = function (x) {
    x.divRemTo(this.m, null, x);
};
Sk.builtin.biginteger.prototype.cMulTo = function (x, y, r) {
    x.multiplyTo(y, r);
    this.reduce(r);
};
Sk.builtin.biginteger.prototype.cSqrTo = function (x, r) {
    x.squareTo(r);
    this.reduce(r);
};

Sk.builtin.biginteger.Classic.prototype.convert = Sk.builtin.biginteger.prototype.cConvert;
Sk.builtin.biginteger.Classic.prototype.revert = Sk.builtin.biginteger.prototype.cRevert;
Sk.builtin.biginteger.Classic.prototype.reduce = Sk.builtin.biginteger.prototype.cReduce;
Sk.builtin.biginteger.Classic.prototype.mulTo = Sk.builtin.biginteger.prototype.cMulTo;
Sk.builtin.biginteger.Classic.prototype.sqrTo = Sk.builtin.biginteger.prototype.cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
Sk.builtin.biginteger.prototype.bnpInvDigit = function () {
    var y;
    var x;
    if (this.t < 1) {
        return 0;
    }
    x = this[0];
    if ((x & 1) === 0) {
        return 0;
    }
    y = x & 3;		// y == 1/x mod 2^2
    y = (y * (2 - (x & 0xf) * y)) & 0xf;	// y == 1/x mod 2^4
    y = (y * (2 - (x & 0xff) * y)) & 0xff;	// y == 1/x mod 2^8
    y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y * (2 - x * y % this.DV)) % this.DV;		// y == 1/x mod 2^Sk.builtin.biginteger.dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y > 0) ? this.DV - y : -y;
};

// Sk.builtin.Montgomery reduction
/**
 * @constructor
 * @extends Sk.builtin.biginteger
 */
Sk.builtin.biginteger.Montgomery = function (m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp & 0x7fff;
    this.mph = this.mp >> 15;
    this.um = (1 << (m.DB - 15)) - 1;
    this.mt2 = 2 * m.t;
};

// xR mod m
Sk.builtin.biginteger.prototype.montConvert = function (x) {
    var r = Sk.builtin.biginteger.nbi();
    x.abs().dlShiftTo(this.m.t, r);
    r.divRemTo(this.m, null, r);
    if (x.s < 0 && r.compareTo(Sk.builtin.biginteger.ZERO) > 0) {
        this.m.subTo(r, r);
    }
    return r;
};

// x/R mod m
Sk.builtin.biginteger.prototype.montRevert = function (x) {
    var r = Sk.builtin.biginteger.nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
};

// x = x/R mod m (HAC 14.32)
Sk.builtin.biginteger.prototype.montReduce = function (x) {
    var u0;
    var j;
    var i;
    while (x.t <= this.mt2) {
        // pad x so am has enough room later
        x[x.t++] = 0;
    }
    for (i = 0; i < this.m.t; ++i) {
        // faster way of calculating u0 = x[i]*mp mod DV
        j = x[i] & 0x7fff;
        u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;
        // use am to combine the multiply-shift-add into one call
        j = i + this.m.t;
        x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
        // propagate carry
        while (x[j] >= x.DV) {
            x[j] -= x.DV;
            x[++j]++;
        }
    }
    x.clamp();
    x.drShiftTo(this.m.t, x);
    if (x.compareTo(this.m) >= 0) {
        x.subTo(this.m, x);
    }
};

// r = "x^2/R mod m"; x != r
Sk.builtin.biginteger.prototype.montSqrTo = function (x, r) {
    x.squareTo(r);
    this.reduce(r);
};

// r = "xy/R mod m"; x,y != r
Sk.builtin.biginteger.prototype.montMulTo = function (x, y, r) {
    x.multiplyTo(y, r);
    this.reduce(r);
};

Sk.builtin.biginteger.Montgomery.prototype.convert = Sk.builtin.biginteger.prototype.montConvert;
Sk.builtin.biginteger.Montgomery.prototype.revert = Sk.builtin.biginteger.prototype.montRevert;
Sk.builtin.biginteger.Montgomery.prototype.reduce = Sk.builtin.biginteger.prototype.montReduce;
Sk.builtin.biginteger.Montgomery.prototype.mulTo = Sk.builtin.biginteger.prototype.montMulTo;
Sk.builtin.biginteger.Montgomery.prototype.sqrTo = Sk.builtin.biginteger.prototype.montSqrTo;

// (protected) true iff this is even
Sk.builtin.biginteger.prototype.bnpIsEven = function () {
    return ((this.t > 0) ? (this[0] & 1) : this.s) === 0;
};

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
Sk.builtin.biginteger.prototype.bnpExp = function (e, z) {
    var t;
    var r, r2, g, i;
    if (e > 0xffffffff || e < 1) {
        return Sk.builtin.biginteger.ONE;
    }
    r = Sk.builtin.biginteger.nbi();
    r2 = Sk.builtin.biginteger.nbi();
    g = z.convert(this);
    i = Sk.builtin.biginteger.nbits(e) - 1;
    g.copyTo(r);
    while (--i >= 0) {
        z.sqrTo(r, r2);
        if ((e & (1 << i)) > 0) {
            z.mulTo(r2, g, r);
        } else {
            t = r;
            r = r2;
            r2 = t;
        }
    }
    return z.revert(r);
};

// (public) this^e % m, 0 <= e < 2^32
Sk.builtin.biginteger.prototype.bnModPowInt = function (e, m) {
    var z;
    if (e < 256 || m.isEven()) {
        z = new Sk.builtin.biginteger.Classic(m);
    } else {
        z = new Sk.builtin.biginteger.Montgomery(m);
    }
    return this.exp(e, z);
};

// protected
Sk.builtin.biginteger.prototype.copyTo = Sk.builtin.biginteger.prototype.bnpCopyTo;
Sk.builtin.biginteger.prototype.fromInt = Sk.builtin.biginteger.prototype.bnpFromInt;
Sk.builtin.biginteger.prototype.fromString = Sk.builtin.biginteger.prototype.bnpFromString;
Sk.builtin.biginteger.prototype.clamp = Sk.builtin.biginteger.prototype.bnpClamp;
Sk.builtin.biginteger.prototype.dlShiftTo = Sk.builtin.biginteger.prototype.bnpDLShiftTo;
Sk.builtin.biginteger.prototype.drShiftTo = Sk.builtin.biginteger.prototype.bnpDRShiftTo;
Sk.builtin.biginteger.prototype.lShiftTo = Sk.builtin.biginteger.prototype.bnpLShiftTo;
Sk.builtin.biginteger.prototype.rShiftTo = Sk.builtin.biginteger.prototype.bnpRShiftTo;
Sk.builtin.biginteger.prototype.subTo = Sk.builtin.biginteger.prototype.bnpSubTo;
Sk.builtin.biginteger.prototype.multiplyTo = Sk.builtin.biginteger.prototype.bnpMultiplyTo;
Sk.builtin.biginteger.prototype.squareTo = Sk.builtin.biginteger.prototype.bnpSquareTo;
Sk.builtin.biginteger.prototype.divRemTo = Sk.builtin.biginteger.prototype.bnpDivRemTo;
Sk.builtin.biginteger.prototype.invDigit = Sk.builtin.biginteger.prototype.bnpInvDigit;
Sk.builtin.biginteger.prototype.isEven = Sk.builtin.biginteger.prototype.bnpIsEven;
Sk.builtin.biginteger.prototype.exp = Sk.builtin.biginteger.prototype.bnpExp;

// public
Sk.builtin.biginteger.prototype.toString = Sk.builtin.biginteger.prototype.bnToString;
Sk.builtin.biginteger.prototype.negate = Sk.builtin.biginteger.prototype.bnNegate;
Sk.builtin.biginteger.prototype.abs = Sk.builtin.biginteger.prototype.bnAbs;
Sk.builtin.biginteger.prototype.compareTo = Sk.builtin.biginteger.prototype.bnCompareTo;
Sk.builtin.biginteger.prototype.bitLength = Sk.builtin.biginteger.prototype.bnBitLength;
Sk.builtin.biginteger.prototype.mod = Sk.builtin.biginteger.prototype.bnMod;
Sk.builtin.biginteger.prototype.modPowInt = Sk.builtin.biginteger.prototype.bnModPowInt;

// "constants"
Sk.builtin.biginteger.ZERO = Sk.builtin.biginteger.nbv(0);
Sk.builtin.biginteger.ONE = Sk.builtin.biginteger.nbv(1);

//Copyright (c) 2005-2009  Tom Wu
//All Rights Reserved.
//See "LICENSE" for details.

//Extended JavaScript BN functions, required for RSA private ops.

//Version 1.1: new Sk.builtin.biginteger("0", 10) returns "proper" zero

//(public)
Sk.builtin.biginteger.prototype.bnClone = function () {
    var r = Sk.builtin.biginteger.nbi();
    this.copyTo(r);
    return r;
};

//(public) return value as integer
Sk.builtin.biginteger.prototype.bnIntValue = function () {
    if (this.s < 0) {
        if (this.t == 1) {
            return this[0] - this.DV;
        } else if (this.t === 0) {
            return -1;
        }
    } else if (this.t == 1) {
        return this[0];
    } else if (this.t === 0) {
        return 0;
    }
    return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0];
};

//(public) return value as byte
Sk.builtin.biginteger.prototype.bnByteValue = function () {
    return (this.t === 0) ? this.s : (this[0] << 24) >> 24;
};

//(public) return value as short (assumes DB>=16)
Sk.builtin.biginteger.prototype.bnShortValue = function () {
    return (this.t === 0) ? this.s : (this[0] << 16) >> 16;
};

//(protected) return x s.t. r^x < DV
Sk.builtin.biginteger.prototype.bnpChunkSize = function (r) {
    return Math.floor(Math.LN2 * this.DB / Math.log(r));
};

//(public) 0 if this == 0, 1 if this > 0
Sk.builtin.biginteger.prototype.bnSigNum = function () {
    if (this.s < 0) {
        return -1;
    } else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) {
        return 0;
    } else {
        return 1;
    }
};

//(protected) convert to radix string
Sk.builtin.biginteger.prototype.bnpToRadix = function (b) {
    var d, y, z, r;
    var a;
    var cs;
    if (b == null) {
        b = 10;
    }
    if (this.signum() === 0 || b < 2 || b > 36) {
        return "0";
    }
    cs = this.chunkSize(b);
    a = Math.pow(b, cs);
    d = Sk.builtin.biginteger.nbv(a);
    y = Sk.builtin.biginteger.nbi(); z = Sk.builtin.biginteger.nbi();
    r = "";
    this.divRemTo(d, y, z);
    while (y.signum() > 0) {
        r = (a + z.intValue()).toString(b).substr(1) + r;
        y.divRemTo(d, y, z);
    }
    return z.intValue().toString(b) + r;
};

//(protected) convert from radix string
Sk.builtin.biginteger.prototype.bnpFromRadix = function (s, b) {
    var x;
    var i;
    var d, mi, j, w;
    var cs;
    this.fromInt(0);
    if (b == null) {
        b = 10;
    }
    cs = this.chunkSize(b);
    d = Math.pow(b, cs);
    mi = false;
    j = 0;
    w = 0;
    for (i = 0; i < s.length; ++i) {
        x = Sk.builtin.biginteger.intAt(s, i);
        if (x < 0) {
            if (s.charAt(i) == "-" && this.signum() === 0) {
                mi = true;
            }
            if (s.charAt(i) == ".") {
                break;
            }
            continue;
        }
        w = b * w + x;
        if (++j >= cs) {
            this.dMultiply(d);
            this.dAddOffset(w, 0);
            j = 0;
            w = 0;
        }
    }
    if (j > 0) {
        this.dMultiply(Math.pow(b, j));
        this.dAddOffset(w, 0);
    }
    if (mi) {
        Sk.builtin.biginteger.ZERO.subTo(this, this);
    }
};

//(protected) alternate constructor
Sk.builtin.biginteger.prototype.bnpFromNumber = function (a, b, c) {
    if ("number" == typeof b) {
        // new Sk.builtin.biginteger(int,int,RNG)
        if (a < 2) {
            this.fromInt(1);
        } else {
            this.fromNumber(a, c);
            if (!this.testBit(a - 1))	{
                // force MSB set
                this.bitwiseTo(Sk.builtin.biginteger.ONE.shiftLeft(a - 1), Sk.builtin.biginteger.op_or, this);
            }
            if (this.isEven()) {
                this.dAddOffset(1, 0);
            } // force odd
            while (!this.isProbablePrime(b)) {
                this.dAddOffset(2, 0);
                if (this.bitLength() > a) {
                    this.subTo(Sk.builtin.biginteger.ONE.shiftLeft(a - 1), this);
                }
            }
        }
    }
    //	Constructor to support Java BigInteger random generation.  Forget it.
    this.fromString(a + "");
};

//(public) convert to bigendian byte array
Sk.builtin.biginteger.prototype.bnToByteArray = function () {
    var p, d, k;
    var i = this.t, r = [];
    r[0] = this.s;
    p = this.DB - (i * this.DB) % 8;
    k = 0;
    if (i-- > 0) {
        if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p) {
            r[k++] = d | (this.s << (this.DB - p));
        }
        while (i >= 0) {
            if (p < 8) {
                d = (this[i] & ((1 << p) - 1)) << (8 - p);
                d |= this[--i] >> (p += this.DB - 8);
            } else {
                d = (this[i] >> (p -= 8)) & 0xff;
                if (p <= 0) {
                    p += this.DB;
                    --i;
                }
            }
            if ((d & 0x80) !== 0) {
                d |= -256;
            }
            if (k === 0 && (this.s & 0x80) != (d & 0x80)) {
                ++k;
            }
            if (k > 0 || d != this.s) {
                r[k++] = d;
            }
        }
    }
    return r;
};

Sk.builtin.biginteger.prototype.bnEquals = function (a) {
    return(this.compareTo(a) === 0);
};
Sk.builtin.biginteger.prototype.bnMin = function (a) {
    return(this.compareTo(a) < 0) ? this : a;
};
Sk.builtin.biginteger.prototype.bnMax = function (a) {
    return(this.compareTo(a) > 0) ? this : a;
};

//(protected) r = this op a (bitwise)
Sk.builtin.biginteger.prototype.bnpBitwiseTo = function (a, op, r) {
    var i, f, m = Math.min(a.t, this.t);
    for (i = 0; i < m; ++i) {
        r[i] = op(this[i], a[i]);
    }
    if (a.t < this.t) {
        f = a.s & this.DM;
        for (i = m; i < this.t; ++i) {
            r[i] = op(this[i], f);
        }
        r.t = this.t;
    } else {
        f = this.s & this.DM;
        for (i = m; i < a.t; ++i) {
            r[i] = op(f, a[i]);
        }
        r.t = a.t;
    }
    r.s = op(this.s, a.s);
    r.clamp();
};

//(public) this & a
Sk.builtin.biginteger.op_and = function (x, y) {
    return x & y;
};
Sk.builtin.biginteger.prototype.bnAnd = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.bitwiseTo(a, Sk.builtin.biginteger.op_and, r);
    return r;
};

//(public) this | a
Sk.builtin.biginteger.op_or = function (x, y) {
    return x | y;
};
Sk.builtin.biginteger.prototype.bnOr = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.bitwiseTo(a, Sk.builtin.biginteger.op_or, r);
    return r;
};

//(public) this ^ a
Sk.builtin.biginteger.op_xor = function (x, y) {
    return x ^ y;
};
Sk.builtin.biginteger.prototype.bnXor = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.bitwiseTo(a, Sk.builtin.biginteger.op_xor, r);
    return r;
};

//(public) this & ~a
Sk.builtin.biginteger.op_andnot = function (x, y) {
    return x & ~y;
};
Sk.builtin.biginteger.prototype.bnAndNot = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.bitwiseTo(a, Sk.builtin.biginteger.op_andnot, r);
    return r;
};

//(public) ~this
Sk.builtin.biginteger.prototype.bnNot = function () {
    var i;
    var r = Sk.builtin.biginteger.nbi();
    for (i = 0; i < this.t; ++i) {
        r[i] = this.DM & ~this[i];
    }
    r.t = this.t;
    r.s = ~this.s;
    return r;
};

//(public) this << n
Sk.builtin.biginteger.prototype.bnShiftLeft = function (n) {
    var r = Sk.builtin.biginteger.nbi();
    if (n < 0) {
        this.rShiftTo(-n, r);
    } else {
        this.lShiftTo(n, r);
    }
    return r;
};

//(public) this >> n
Sk.builtin.biginteger.prototype.bnShiftRight = function (n) {
    var r = Sk.builtin.biginteger.nbi();
    if (n < 0) {
        this.lShiftTo(-n, r);
    } else {
        this.rShiftTo(n, r);
    }
    return r;
};

//return index of lowest 1-bit in x, x < 2^31
Sk.builtin.biginteger.lbit = function (x) {
    var r;
    if (x === 0) {
        return -1;
    }
    r = 0;
    if ((x & 0xffff) === 0) {
        x >>= 16;
        r += 16;
    }
    if ((x & 0xff) === 0) {
        x >>= 8;
        r += 8;
    }
    if ((x & 0xf) === 0) {
        x >>= 4;
        r += 4;
    }
    if ((x & 3) === 0) {
        x >>= 2;
        r += 2;
    }
    if ((x & 1) === 0) {
        ++r;
    }
    return r;
};

//(public) returns index of lowest 1-bit (or -1 if none)
Sk.builtin.biginteger.prototype.bnGetLowestSetBit = function () {
    var i;
    for (i = 0; i < this.t; ++i) {
        if (this[i] !== 0) {
            return i * this.DB + Sk.builtin.biginteger.lbit(this[i]);
        }
    }
    if (this.s < 0) {
        return this.t * this.DB;
    }
    return -1;
};

//return number of 1 bits in x
Sk.builtin.biginteger.cbit = function (x) {
    var r = 0;
    while (x !== 0) {
        x &= x - 1;
        ++r;
    }
    return r;
};

//(public) return number of set bits
Sk.builtin.biginteger.prototype.bnBitCount = function () {
    var i;
    var r = 0, x = this.s & this.DM;
    for (i = 0; i < this.t; ++i) {
        r += Sk.builtin.biginteger.cbit(this[i] ^ x);
    }
    return r;
};

//(public) true iff nth bit is set
Sk.builtin.biginteger.prototype.bnTestBit = function (n) {
    var j = Math.floor(n / this.DB);
    if (j >= this.t) {
        return(this.s !== 0);
    }
    return((this[j] & (1 << (n % this.DB))) !== 0);
};

//(protected) this op (1<<n)
Sk.builtin.biginteger.prototype.bnpChangeBit = function (n, op) {
    var r = Sk.builtin.biginteger.ONE.shiftLeft(n);
    this.bitwiseTo(r, op, r);
    return r;
};

//(public) this | (1<<n)
Sk.builtin.biginteger.prototype.bnSetBit = function (n) {
    return this.changeBit(n, Sk.builtin.biginteger.op_or);
};

//(public) this & ~(1<<n)
Sk.builtin.biginteger.prototype.bnClearBit = function (n) {
    return this.changeBit(n, Sk.builtin.biginteger.op_andnot);
};

//(public) this ^ (1<<n)
Sk.builtin.biginteger.prototype.bnFlipBit = function (n) {
    return this.changeBit(n, Sk.builtin.biginteger.op_xor);
};

//(protected) r = this + a
Sk.builtin.biginteger.prototype.bnpAddTo = function (a, r) {
    var i = 0, c = 0, m = Math.min(a.t, this.t);
    while (i < m) {
        c += this[i] + a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
    }
    if (a.t < this.t) {
        c += a.s;
        while (i < this.t) {
            c += this[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += this.s;
    } else {
        c += this.s;
        while (i < a.t) {
            c += a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += a.s;
    }
    r.s = (c < 0) ? -1 : 0;
    if (c > 0) {
        r[i++] = c;
    } else if (c < -1) {
        r[i++] = this.DV + c;
    }
    r.t = i;
    r.clamp();
};

//(public) this + a
Sk.builtin.biginteger.prototype.bnAdd = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.addTo(a, r);
    return r;
};

//(public) this - a
Sk.builtin.biginteger.prototype.bnSubtract = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.subTo(a, r);
    return r;
};

//(public) this * a
Sk.builtin.biginteger.prototype.bnMultiply = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.multiplyTo(a, r);
    return r;
};

//(public) this / a
Sk.builtin.biginteger.prototype.bnDivide = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.divRemTo(a, r, null);
    return r;
};

//(public) this % a
Sk.builtin.biginteger.prototype.bnRemainder = function (a) {
    var r = Sk.builtin.biginteger.nbi();
    this.divRemTo(a, null, r);
    return r;
};

//(public) [this/a,this%a]
Sk.builtin.biginteger.prototype.bnDivideAndRemainder = function (a) {
    var q = Sk.builtin.biginteger.nbi(), r = Sk.builtin.biginteger.nbi();
    this.divRemTo(a, q, r);
    return new Array(q, r);
};

//(protected) this *= n, this >= 0, 1 < n < DV
Sk.builtin.biginteger.prototype.bnpDMultiply = function (n) {
    this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
    ++this.t;
    this.clamp();
};

//(protected) this += n << w words, this >= 0
Sk.builtin.biginteger.prototype.bnpDAddOffset = function (n, w) {
    if (n === 0) {
        return;
    }
    while (this.t <= w) {
        this[this.t++] = 0;
    }
    this[w] += n;
    while (this[w] >= this.DV) {
        this[w] -= this.DV;
        if (++w >= this.t) {
            this[this.t++] = 0;
        }
        ++this[w];
    }
};

//A "null" reducer
/**
 * @constructor
 * @extends Sk.builtin.biginteger
 */
Sk.builtin.biginteger.NullExp = function () {
};
Sk.builtin.biginteger.prototype.nNop = function (x) {
    return x;
};
Sk.builtin.biginteger.prototype.nMulTo = function (x, y, r) {
    x.multiplyTo(y, r);
};
Sk.builtin.biginteger.prototype.nSqrTo = function (x, r) {
    x.squareTo(r);
};

Sk.builtin.biginteger.NullExp.prototype.convert = Sk.builtin.biginteger.prototype.nNop;
Sk.builtin.biginteger.NullExp.prototype.revert = Sk.builtin.biginteger.prototype.nNop;
Sk.builtin.biginteger.NullExp.prototype.mulTo = Sk.builtin.biginteger.prototype.nMulTo;
Sk.builtin.biginteger.NullExp.prototype.sqrTo = Sk.builtin.biginteger.prototype.nSqrTo;

//(public) this^e
Sk.builtin.biginteger.prototype.bnPow = function (e) {
    return this.exp(e, new Sk.builtin.biginteger.NullExp());
};

//(protected) r = lower n words of "this * a", a.t <= n
//"this" should be the larger one if appropriate.
Sk.builtin.biginteger.prototype.bnpMultiplyLowerTo = function (a, n, r) {
    var j;
    var i = Math.min(this.t + a.t, n);
    r.s = 0; // assumes a,this >= 0
    r.t = i;
    while (i > 0) {
        r[--i] = 0;
    }
    for (j = r.t - this.t; i < j; ++i) {
        r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
    }
    for (j = Math.min(a.t, n); i < j; ++i) {
        this.am(0, a[i], r, i, 0, n - i);
    }
    r.clamp();
};

//(protected) r = "this * a" without lower n words, n > 0
//"this" should be the larger one if appropriate.
Sk.builtin.biginteger.prototype.bnpMultiplyUpperTo = function (a, n, r) {
    var i;
    --n;
    i = r.t = this.t + a.t - n;
    r.s = 0; // assumes a,this >= 0
    while (--i >= 0) {
        r[i] = 0;
    }
    for (i = Math.max(n - this.t, 0); i < a.t; ++i) {
        r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
    }
    r.clamp();
    r.drShiftTo(1, r);
};

//Barrett modular reduction
/**
 * @constructor
 * @extends Sk.builtin.biginteger
 */
Sk.builtin.biginteger.Barrett = function (m) {
    this.r2 = Sk.builtin.biginteger.nbi();
    this.q3 = Sk.builtin.biginteger.nbi();
    Sk.builtin.biginteger.ONE.dlShiftTo(2 * m.t, this.r2);
    this.mu = this.r2.divide(m);
    this.m = m;
};

Sk.builtin.biginteger.prototype.barrettConvert = function (x) {
    var r;
    if (x.s < 0 || x.t > 2 * this.m.t) {
        return x.mod(this.m);
    } else if (x.compareTo(this.m) < 0) {
        return x;
    } else {
        r = Sk.builtin.biginteger.nbi();
        x.copyTo(r);
        this.reduce(r);
        return r;
    }
};

Sk.builtin.biginteger.prototype.barrettRevert = function (x) {
    return x;
};

//x = x mod m (HAC 14.42)
Sk.builtin.biginteger.prototype.barrettReduce = function (x) {
    x.drShiftTo(this.m.t - 1, this.r2);
    if (x.t > this.m.t + 1) {
        x.t = this.m.t + 1;
        x.clamp();
    }
    this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
    this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
    while (x.compareTo(this.r2) < 0) {
        x.dAddOffset(1, this.m.t + 1);
    }
    x.subTo(this.r2, x);
    while (x.compareTo(this.m) >= 0) {
        x.subTo(this.m, x);
    }
};

//r = x^2 mod m; x != r
Sk.builtin.biginteger.prototype.barrettSqrTo = function (x, r) {
    x.squareTo(r);
    this.reduce(r);
};

//r = x*y mod m; x,y != r
Sk.builtin.biginteger.prototype.barrettMulTo = function (x, y, r) {
    x.multiplyTo(y, r);
    this.reduce(r);
};

Sk.builtin.biginteger.Barrett.prototype.convert = Sk.builtin.biginteger.prototype.barrettConvert;
Sk.builtin.biginteger.Barrett.prototype.revert = Sk.builtin.biginteger.prototype.barrettRevert;
Sk.builtin.biginteger.Barrett.prototype.reduce = Sk.builtin.biginteger.prototype.barrettReduce;
Sk.builtin.biginteger.Barrett.prototype.mulTo = Sk.builtin.biginteger.prototype.barrettMulTo;
Sk.builtin.biginteger.Barrett.prototype.sqrTo = Sk.builtin.biginteger.prototype.barrettSqrTo;

//(public) this^e % m (HAC 14.85)
Sk.builtin.biginteger.prototype.bnModPow = function (e, m) {
    var j, w, is1, r2, t;
    var g2;
    var g, n, k1, km;
    var i = e.bitLength(), k, r = Sk.builtin.biginteger.nbv(1), z;
    if (i <= 0) {
        return r;
    } else if (i < 18) {
        k = 1;
    } else if (i < 48) {
        k = 3;
    } else if (i < 144) {
        k = 4;
    } else if (i < 768) {
        k = 5;
    } else {
        k = 6;
    }
    if (i < 8) {
        z = new Sk.builtin.biginteger.Classic(m);
    } else if (m.isEven()) {
        z = new Sk.builtin.biginteger.Barrett(m);
    } else {
        z = new Sk.builtin.biginteger.Montgomery(m);
    }

    g = [];
    n = 3;
    k1 = k - 1;
    km = (1 << k) - 1;
    g[1] = z.convert(this);
    if (k > 1) {
        g2 = Sk.builtin.biginteger.nbi();
        z.sqrTo(g[1], g2);
        while (n <= km) {
            g[n] = Sk.builtin.biginteger.nbi();
            z.mulTo(g2, g[n - 2], g[n]);
            n += 2;
        }
    }

    j = e.t - 1;
    is1 = true;
    r2 = Sk.builtin.biginteger.nbi();
    i = Sk.builtin.biginteger.nbits(e[j]) - 1;
    while (j >= 0) {
        if (i >= k1) {
            w = (e[j] >> (i - k1)) & km;
        } else {
            w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i);
            if (j > 0) {
                w |= e[j - 1] >> (this.DB + i - k1);
            }
        }

        n = k;
        while ((w & 1) === 0) {
            w >>= 1;
            --n;
        }
        if ((i -= n) < 0) {
            i += this.DB;
            --j;
        }
        if (is1) {	// ret == 1, don't bother squaring or multiplying it
            g[w].copyTo(r);
            is1 = false;
        } else {
            while (n > 1) {
                z.sqrTo(r, r2);
                z.sqrTo(r2, r);
                n -= 2;
            }
            if (n > 0) {
                z.sqrTo(r, r2);
            } else {
                t = r;
                r = r2;
                r2 = t;
            }
            z.mulTo(r2, g[w], r);
        }

        while (j >= 0 && (e[j] & (1 << i)) === 0) {
            z.sqrTo(r, r2);
            t = r;
            r = r2;
            r2 = t;
            if (--i < 0) {
                i = this.DB - 1;
                --j;
            }
        }
    }
    return z.revert(r);
};

//(public) gcd(this,a) (HAC 14.54)
Sk.builtin.biginteger.prototype.bnGCD = function (a) {
    var i, g;
    var t;
    var x = (this.s < 0) ? this.negate() : this.clone();
    var y = (a.s < 0) ? a.negate() : a.clone();
    if (x.compareTo(y) < 0) {
        t = x;
        x = y;
        y = t;
    }
    i = x.getLowestSetBit();
    g = y.getLowestSetBit();
    if (g < 0) {
        return x;
    }
    if (i < g) {
        g = i;
    }
    if (g > 0) {
        x.rShiftTo(g, x);
        y.rShiftTo(g, y);
    }
    while (x.signum() > 0) {
        if ((i = x.getLowestSetBit()) > 0) {
            x.rShiftTo(i, x);
        }
        if ((i = y.getLowestSetBit()) > 0) {
            y.rShiftTo(i, y);
        }
        if (x.compareTo(y) >= 0) {
            x.subTo(y, x);
            x.rShiftTo(1, x);
        } else {
            y.subTo(x, y);
            y.rShiftTo(1, y);
        }
    }
    if (g > 0) {
        y.lShiftTo(g, y);
    }
    return y;
};

//(protected) this % n, n < 2^26
Sk.builtin.biginteger.prototype.bnpModInt = function (n) {
    var i;
    var d, r;
    if (n <= 0) {
        return 0;
    }
    d = this.DV % n;
    r = (this.s < 0) ? n - 1 : 0;
    if (this.t > 0) {
        if (d === 0) {
            r = this[0] % n;
        } else {
            for (i = this.t - 1; i >= 0; --i) {
                r = (d * r + this[i]) % n;
            }
        }
    }
    return r;
};

//(public) 1/this % m (HAC 14.61)
Sk.builtin.biginteger.prototype.bnModInverse = function (m) {
    var a, b, c, d;
    var u, v;
    var ac = m.isEven();
    if ((this.isEven() && ac) || m.signum() === 0) {
        return Sk.builtin.biginteger.ZERO;
    }
    u = m.clone();
    v = this.clone();
    a = Sk.builtin.biginteger.nbv(1);
    b = Sk.builtin.biginteger.nbv(0);
    c = Sk.builtin.biginteger.nbv(0);
    d = Sk.builtin.biginteger.nbv(1);
    while (u.signum() !== 0) {
        while (u.isEven()) {
            u.rShiftTo(1, u);
            if (ac) {
                if (!a.isEven() || !b.isEven()) {
                    a.addTo(this, a);
                    b.subTo(m, b);
                }
                a.rShiftTo(1, a);
            } else if (!b.isEven()) {
                b.subTo(m, b);
            }
            b.rShiftTo(1, b);
        }
        while (v.isEven()) {
            v.rShiftTo(1, v);
            if (ac) {
                if (!c.isEven() || !d.isEven()) {
                    c.addTo(this, c);
                    d.subTo(m, d);
                }
                c.rShiftTo(1, c);
            } else if (!d.isEven()) {
                d.subTo(m, d);
            }
            d.rShiftTo(1, d);
        }
        if (u.compareTo(v) >= 0) {
            u.subTo(v, u);
            if (ac) {
                a.subTo(c, a);
            }
            b.subTo(d, b);
        } else {
            v.subTo(u, v);
            if (ac) {
                c.subTo(a, c);
            }
            d.subTo(b, d);
        }
    }
    if (v.compareTo(Sk.builtin.biginteger.ONE) !== 0) {
        return Sk.builtin.biginteger.ZERO;
    }
    if (d.compareTo(m) >= 0) {
        return d.subtract(m);
    }
    if (d.signum() < 0) {
        d.addTo(m, d);
    } else {
        return d;
    }
    if (d.signum() < 0) {
        return d.add(m);
    } else {
        return d;
    }
};

Sk.builtin.biginteger.lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509];
Sk.builtin.biginteger.lplim = (1 << 26) / Sk.builtin.biginteger.lowprimes[Sk.builtin.biginteger.lowprimes.length - 1];

//(public) test primality with certainty >= 1-.5^t
Sk.builtin.biginteger.prototype.bnIsProbablePrime = function (t) {
    var m, j;
    var i, x = this.abs();
    if (x.t == 1 && x[0] <= Sk.builtin.biginteger.lowprimes[Sk.builtin.biginteger.lowprimes.length - 1]) {
        for (i = 0; i < Sk.builtin.biginteger.lowprimes.length; ++i) {
            if (x[0] == Sk.builtin.biginteger.lowprimes[i]) {
                return true;
            }
        }
        return false;
    }
    if (x.isEven()) {
        return false;
    }
    i = 1;
    while (i < Sk.builtin.biginteger.lowprimes.length) {
        m = Sk.builtin.biginteger.lowprimes[i];
        j = i + 1;
        while (j < Sk.builtin.biginteger.lowprimes.length && m < Sk.builtin.biginteger.lplim) {
            m *= Sk.builtin.biginteger.lowprimes[j++];
        }
        m = x.modInt(m);
        while (i < j) {
            if (m % Sk.builtin.biginteger.lowprimes[i++] === 0) {
                return false;
            }
        }
    }
    return x.millerRabin(t);
};

//(protected) true if probably prime (HAC 4.24, Miller-Rabin)
Sk.builtin.biginteger.prototype.bnpMillerRabin = function (t) {
    var j;
    var y;
    var i;
    var a;
    var r;
    var n1 = this.subtract(Sk.builtin.biginteger.ONE);
    var k = n1.getLowestSetBit();
    if (k <= 0) {
        return false;
    }
    r = n1.shiftRight(k);
    t = (t + 1) >> 1;
    if (t > Sk.builtin.biginteger.lowprimes.length) {
        t = Sk.builtin.biginteger.lowprimes.length;
    }
    a = Sk.builtin.biginteger.nbi();
    for (i = 0; i < t; ++i) {
        a.fromInt(Sk.builtin.biginteger.lowprimes[i]);
        y = a.modPow(r, this);
        if (y.compareTo(Sk.builtin.biginteger.ONE) !== 0 && y.compareTo(n1) !== 0) {
            j = 1;
            while (j++ < k && y.compareTo(n1) !== 0) {
                y = y.modPowInt(2, this);
                if (y.compareTo(Sk.builtin.biginteger.ONE) === 0) {
                    return false;
                }
            }
            if (y.compareTo(n1) !== 0) {
                return false;
            }
        }
    }
    return true;
};

Sk.builtin.biginteger.prototype.isnegative = function () {
    return this.s < 0;
};
Sk.builtin.biginteger.prototype.ispositive = function () {
    return this.s >= 0;
};
Sk.builtin.biginteger.prototype.trueCompare = function (a) {
    if (this.s >= 0 && a.s < 0) {
        return 1;
    }
    if (this.s < 0 && a.s >= 0) {
        return -1;
    }
    return this.compare(a);
};

//protected
Sk.builtin.biginteger.prototype.chunkSize = Sk.builtin.biginteger.prototype.bnpChunkSize;
Sk.builtin.biginteger.prototype.toRadix = Sk.builtin.biginteger.prototype.bnpToRadix;
Sk.builtin.biginteger.prototype.fromRadix = Sk.builtin.biginteger.prototype.bnpFromRadix;
Sk.builtin.biginteger.prototype.fromNumber = Sk.builtin.biginteger.prototype.bnpFromNumber;
Sk.builtin.biginteger.prototype.bitwiseTo = Sk.builtin.biginteger.prototype.bnpBitwiseTo;
Sk.builtin.biginteger.prototype.changeBit = Sk.builtin.biginteger.prototype.bnpChangeBit;
Sk.builtin.biginteger.prototype.addTo = Sk.builtin.biginteger.prototype.bnpAddTo;
Sk.builtin.biginteger.prototype.dMultiply = Sk.builtin.biginteger.prototype.bnpDMultiply;
Sk.builtin.biginteger.prototype.dAddOffset = Sk.builtin.biginteger.prototype.bnpDAddOffset;
Sk.builtin.biginteger.prototype.multiplyLowerTo = Sk.builtin.biginteger.prototype.bnpMultiplyLowerTo;
Sk.builtin.biginteger.prototype.multiplyUpperTo = Sk.builtin.biginteger.prototype.bnpMultiplyUpperTo;
Sk.builtin.biginteger.prototype.modInt = Sk.builtin.biginteger.prototype.bnpModInt;
Sk.builtin.biginteger.prototype.millerRabin = Sk.builtin.biginteger.prototype.bnpMillerRabin;

//public
Sk.builtin.biginteger.prototype.clone = Sk.builtin.biginteger.prototype.bnClone;
Sk.builtin.biginteger.prototype.intValue = Sk.builtin.biginteger.prototype.bnIntValue;
Sk.builtin.biginteger.prototype.byteValue = Sk.builtin.biginteger.prototype.bnByteValue;
Sk.builtin.biginteger.prototype.shortValue = Sk.builtin.biginteger.prototype.bnShortValue;
Sk.builtin.biginteger.prototype.signum = Sk.builtin.biginteger.prototype.bnSigNum;
Sk.builtin.biginteger.prototype.toByteArray = Sk.builtin.biginteger.prototype.bnToByteArray;
Sk.builtin.biginteger.prototype.equals = Sk.builtin.biginteger.prototype.bnEquals;
Sk.builtin.biginteger.prototype.compare = Sk.builtin.biginteger.prototype.compareTo;
Sk.builtin.biginteger.prototype.min = Sk.builtin.biginteger.prototype.bnMin;
Sk.builtin.biginteger.prototype.max = Sk.builtin.biginteger.prototype.bnMax;
Sk.builtin.biginteger.prototype.and = Sk.builtin.biginteger.prototype.bnAnd;
Sk.builtin.biginteger.prototype.or = Sk.builtin.biginteger.prototype.bnOr;
Sk.builtin.biginteger.prototype.xor = Sk.builtin.biginteger.prototype.bnXor;
Sk.builtin.biginteger.prototype.andNot = Sk.builtin.biginteger.prototype.bnAndNot;
Sk.builtin.biginteger.prototype.not = Sk.builtin.biginteger.prototype.bnNot;
Sk.builtin.biginteger.prototype.shiftLeft = Sk.builtin.biginteger.prototype.bnShiftLeft;
Sk.builtin.biginteger.prototype.shiftRight = Sk.builtin.biginteger.prototype.bnShiftRight;
Sk.builtin.biginteger.prototype.getLowestSetBit = Sk.builtin.biginteger.prototype.bnGetLowestSetBit;
Sk.builtin.biginteger.prototype.bitCount = Sk.builtin.biginteger.prototype.bnBitCount;
Sk.builtin.biginteger.prototype.testBit = Sk.builtin.biginteger.prototype.bnTestBit;
Sk.builtin.biginteger.prototype.setBit = Sk.builtin.biginteger.prototype.bnSetBit;
Sk.builtin.biginteger.prototype.clearBit = Sk.builtin.biginteger.prototype.bnClearBit;
Sk.builtin.biginteger.prototype.flipBit = Sk.builtin.biginteger.prototype.bnFlipBit;
Sk.builtin.biginteger.prototype.add = Sk.builtin.biginteger.prototype.bnAdd;
Sk.builtin.biginteger.prototype.subtract = Sk.builtin.biginteger.prototype.bnSubtract;
Sk.builtin.biginteger.prototype.multiply = Sk.builtin.biginteger.prototype.bnMultiply;
Sk.builtin.biginteger.prototype.divide = Sk.builtin.biginteger.prototype.bnDivide;
Sk.builtin.biginteger.prototype.remainder = Sk.builtin.biginteger.prototype.bnRemainder;
Sk.builtin.biginteger.prototype.divideAndRemainder = Sk.builtin.biginteger.prototype.bnDivideAndRemainder;
Sk.builtin.biginteger.prototype.modPow = Sk.builtin.biginteger.prototype.bnModPow;
Sk.builtin.biginteger.prototype.modInverse = Sk.builtin.biginteger.prototype.bnModInverse;
Sk.builtin.biginteger.prototype.pow = Sk.builtin.biginteger.prototype.bnPow;
Sk.builtin.biginteger.prototype.gcd = Sk.builtin.biginteger.prototype.bnGCD;
Sk.builtin.biginteger.prototype.isProbablePrime = Sk.builtin.biginteger.prototype.bnIsProbablePrime;
//Sk.builtin.biginteger.int2char = int2char;

//Sk.builtin.biginteger interfaces not implemented in jsbn:

//Sk.builtin.biginteger(int signum, byte[] magnitude)
//double doubleValue()
//float floatValue()
//int hashCode()
//long longValue()
//static Sk.builtin.biginteger valueOf(long val)

//module.exports = Sk.builtin.biginteger;
