/*
 I've wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
 so it's better encapsulated. Now you can have multiple random number generators
 and they won't stomp all over eachother's state.

 If you want to use this as a substitute for Math.random(), use the random()
 method like so:

 var m = new MersenneTwister();
 var randomNumber = m.random();

 You can also call the other genrand_{foo}() methods on the instance.

 If you want to use a specific seed in order to get a repeatable random
 sequence, pass an integer into the constructor:

 var m = new MersenneTwister(123);

 and that will always produce the same random sequence.

 Sean McCullough (banksean@gmail.com)
 */

/* 
 A C-program for MT19937, with initialization improved 2002/1/26.
 Coded by Takuji Nishimura and Makoto Matsumoto.

 Before using, initialize the state by using init_genrand(seed)
 or init_by_array(init_key, key_length).

 Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions
 are met:

 1. Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.

 3. The names of its contributors may not be used to endorse or promote
 products derived from this software without specific prior written
 permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


 Any feedback is very welcome.
 http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
 email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
 */

var MersenneTwister = function (seed) {
    if (seed == undefined) {
        seed = new Date().getTime();
    }
    /* Period parameters */
    this.N = 624;
    this.M = 397;
    this.MATRIX_A = 0x9908b0df;
    /* constant vector a */
    this.UPPER_MASK = 0x80000000;
    /* most significant w-r bits */
    this.LOWER_MASK = 0x7fffffff;
    /* least significant r bits */

    this.mt = new Array(this.N);
    /* the array for the state vector */
    this.mti = this.N + 1;
    /* mti==N+1 means mt[N] is not initialized */

    this.init_genrand(seed);
}

/* initializes mt[N] with a seed */
MersenneTwister.prototype.init_genrand = function (s) {
    this.mt[0] = s >>> 0;
    for (this.mti = 1; this.mti < this.N; this.mti++) {
        var s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
        this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253)
            + this.mti;
        /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
        /* In the previous versions, MSBs of the seed affect   */
        /* only MSBs of the array mt[].                        */
        /* 2002/01/09 modified by Makoto Matsumoto             */
        this.mt[this.mti] >>>= 0;
        /* for >32 bit machines */
    }
}

/* initialize by an array with array-length */
/* init_key is the array for initializing keys */
/* key_length is its length */
/* slight change for C++, 2004/2/26 */
MersenneTwister.prototype.init_by_array = function (init_key, key_length) {
    var i, j, k;
    this.init_genrand(19650218);
    i = 1;
    j = 0;
    k = (this.N > key_length ? this.N : key_length);
    for (; k; k--) {
        var s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30)
        this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525)))
            + init_key[j] + j;
        /* non linear */
        this.mt[i] >>>= 0;
        /* for WORDSIZE > 32 machines */
        i++;
        j++;
        if (i >= this.N) {
            this.mt[0] = this.mt[this.N - 1];
            i = 1;
        }
        if (j >= key_length) {
            j = 0;
        }
    }
    for (k = this.N - 1; k; k--) {
        var s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
        this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941))
            - i;
        /* non linear */
        this.mt[i] >>>= 0;
        /* for WORDSIZE > 32 machines */
        i++;
        if (i >= this.N) {
            this.mt[0] = this.mt[this.N - 1];
            i = 1;
        }
    }

    this.mt[0] = 0x80000000;
    /* MSB is 1; assuring non-zero initial array */
}

/* generates a random number on [0,0xffffffff]-interval */
MersenneTwister.prototype.genrand_int32 = function () {
    var y;
    var mag01 = new Array(0x0, this.MATRIX_A);
    /* mag01[x] = x * MATRIX_A  for x=0,1 */

    if (this.mti >= this.N) { /* generate N words at one time */
        var kk;

        if (this.mti == this.N + 1)   /* if init_genrand() has not been called, */
        {
            this.init_genrand(5489);
        }
        /* a default initial seed is used */

        for (kk = 0; kk < this.N - this.M; kk++) {
            y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
            this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
        }
        for (; kk < this.N - 1; kk++) {
            y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
            this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
        }
        y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
        this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

        this.mti = 0;
    }

    y = this.mt[this.mti++];

    /* Tempering */
    y ^= (y >>> 11);
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= (y >>> 18);

    return y >>> 0;
}

/* generates a random number on [0,0x7fffffff]-interval */
MersenneTwister.prototype.genrand_int31 = function () {
    return (this.genrand_int32() >>> 1);
}

/* generates a random number on [0,1]-real-interval */
MersenneTwister.prototype.genrand_real1 = function () {
    return this.genrand_int32() * (1.0 / 4294967295.0);
    /* divided by 2^32-1 */
}

/* generates a random number on [0,1)-real-interval */
MersenneTwister.prototype.random = function () {
    return this.genrand_int32() * (1.0 / 4294967296.0);
    /* divided by 2^32 */
}

/* generates a random number on (0,1)-real-interval */
MersenneTwister.prototype.genrand_real3 = function () {
    return (this.genrand_int32() + 0.5) * (1.0 / 4294967296.0);
    /* divided by 2^32 */
}

/* generates a random number on [0,1) with 53-bit resolution*/
MersenneTwister.prototype.genrand_res53 = function () {
    var a = this.genrand_int32() >>> 5, b = this.genrand_int32() >>> 6;
    return(a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
}

/* These real versions are due to Isaku Wada, 2002/01/09 added */


var $builtinmodule = function (name) {

    var mod = {};

    var myGenerator = new MersenneTwister();
    var nextNormalSample = undefined;

    mod.seed = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("seed", arguments, 0, 1);
        x = Sk.builtin.asnum$(x);

        if (arguments.length > 0) {
            myGenerator = new MersenneTwister(x);
        }
        else {
            myGenerator = new MersenneTwister();
        }

        return Sk.builtin.none.none$;
    });

    mod.random = new Sk.builtin.func(function () {
        Sk.builtin.pyCheckArgs("random", arguments, 0, 0);

        return new Sk.builtin.float_(myGenerator.genrand_res53());
    });

    var toInt = function (num) {
        return num | 0;
    };

    var randrange = function (start, stop, step) {
        // Ported from CPython 2.7
        var width, n, ret;

        if (!Sk.builtin.checkInt(start)) {
            throw new Sk.builtin.ValueError("non-integer first argument for randrange()");
        }
        ;

        if (stop === undefined) {
            // Random in [0, start)
            ret = toInt(myGenerator.genrand_res53() * start);
            return new Sk.builtin.int_(ret);
        }
        ;

        if (!Sk.builtin.checkInt(stop)) {
            throw new Sk.builtin.ValueError("non-integer stop for randrange()");
        }
        ;

        if (step === undefined) {
            step = 1;
        }
        ;

        width = stop - start;

        if ((step == 1) && (width > 0)) {
            // Random in [start, stop), must use toInt on product for correct results with negative ranges
            ret = start + toInt(myGenerator.genrand_res53() * width);
            return new Sk.builtin.int_(ret);
        }
        ;

        if (step == 1) {
            throw new Sk.builtin.ValueError("empty range for randrange() (" + start + ", " + stop + ", " + width + ")");
        }
        ;

        if (!Sk.builtin.checkInt(step)) {
            throw new Sk.builtin.ValueError("non-integer step for randrange()");
        }
        ;

        if (step > 0) {
            n = toInt((width + step - 1) / step);
        } else if (step < 0) {
            n = toInt((width + step + 1) / step);
        } else {
            throw new Sk.builtin.ValueError("zero step for randrange()");
        }
        ;

        if (n <= 0) {
            throw new Sk.builtin.ValueError("empty range for randrange()");
        }
        ;

        // Random in range(start, stop, step)
        ret = start + (step * toInt(myGenerator.genrand_res53() * n));
        return new Sk.builtin.int_(ret);
    };

    mod.randint = new Sk.builtin.func(function (a, b) {
        Sk.builtin.pyCheckArgs("randint", arguments, 2, 2);

        a = Sk.builtin.asnum$(a);
        b = Sk.builtin.asnum$(b);
        return randrange(a, b + 1);
    });

    mod.randrange = new Sk.builtin.func(function (start, stop, step) {
        Sk.builtin.pyCheckArgs("randrange", arguments, 1, 3);

        start = Sk.builtin.asnum$(start);
        stop = Sk.builtin.asnum$(stop);
        step = Sk.builtin.asnum$(step);
        return randrange(start, stop, step);
    });
  
    mod.uniform = new Sk.builtin.func(function (a, b) {
        Sk.builtin.pyCheckArgs("uniform", arguments, 2, 2);

        a = Sk.builtin.asnum$(a);
        b = Sk.builtin.asnum$(b);
        var rnd = myGenerator.genrand_res53();
        c = a + rnd * (b - a)
        return new Sk.builtin.float_(c);
    });

    mod.triangular = new Sk.builtin.func(function (low, high, mode) {
        Sk.builtin.pyCheckArgs("triangular", arguments, 2, 3);
        Sk.builtin.pyCheckType("low", "number", Sk.builtin.checkNumber(low));
        Sk.builtin.pyCheckType("high", "number", Sk.builtin.checkNumber(high));

        var rnd, sample, swap;

        low = Sk.builtin.asnum$(low);
        high = Sk.builtin.asnum$(high);
        if (low > high) {
            swap = low;
            low = high;
            high = swap;
        }
        if ((mode === undefined) || (mode instanceof Sk.builtin.none)) {
            mode = (high - low)/2.0;
        } else {
            Sk.builtin.pyCheckType("mode", "number", Sk.builtin.checkNumber(mode));
            mode = Sk.builtin.asnum$(mode);
        }

        // https://en.wikipedia.org/wiki/Triangular_distribution
        rnd = myGenerator.genrand_res53();
        if (rnd < (mode - low)/(high - low)) {
            sample = low + Math.sqrt(rnd * (high - low) * (mode - low));
        } else {
            sample = high - Math.sqrt((1 - rnd) * (high - low) * (high - mode));
        }

        return new Sk.builtin.float_(sample);
    });

    var normalSample = function(mu, sigma) {
        var r1, r2, u, v, s;

        // Box-Muller transform
        // (https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform)
        // generates two independent samples from a Gaussian
        // distribution. Return one of them and store the another one
        // and return it next time.

        if (nextNormalSample !== undefined) {
            s = nextNormalSample;
            nextNormalSample = undefined;
        } else {
            r1 = myGenerator.genrand_res53();
            r2 = myGenerator.genrand_res53();
            u = Math.sqrt(-2*Math.log(r1));
            v = 2*Math.PI*r2;
            s = u * Math.cos(v);
            nextNormalSample = u * Math.sin(v);
        }

        return mu + sigma*s;
    };
    
    mod.gauss = new Sk.builtin.func(function (mu, sigma) {
        Sk.builtin.pyCheckArgs("gauss", arguments, 2, 2);
        Sk.builtin.pyCheckType("mu", "number", Sk.builtin.checkNumber(mu));
        Sk.builtin.pyCheckType("sigma", "number", Sk.builtin.checkNumber(sigma));

        mu = Sk.builtin.asnum$(mu);
        sigma = Sk.builtin.asnum$(sigma);

        return new Sk.builtin.float_(normalSample(mu, sigma));
    });

    // CPython uses a different (slower but thread-safe) algorithm for
    // normalvariate. We use the same algorithm for normalvariate and
    // gauss.
    mod.normalvariate = mod.gauss;

    mod.lognormvariate = new Sk.builtin.func(function (mu, sigma) {
        Sk.builtin.pyCheckArgs("lognormvariate", arguments, 2, 2);
        Sk.builtin.pyCheckType("mu", "number", Sk.builtin.checkNumber(mu));
        Sk.builtin.pyCheckType("sigma", "number", Sk.builtin.checkNumber(sigma));

        mu = Sk.builtin.asnum$(mu);
        sigma = Sk.builtin.asnum$(sigma);

        return new Sk.builtin.float_(Math.exp(normalSample(mu, sigma)));
    });

    mod.expovariate = new Sk.builtin.func(function (lambd) {
        Sk.builtin.pyCheckArgs("expovariate", arguments, 1, 1);
        Sk.builtin.pyCheckType("lambd", "number", Sk.builtin.checkNumber(lambd));

        lambd = Sk.builtin.asnum$(lambd);

        var rnd = myGenerator.genrand_res53();
        return new Sk.builtin.float_(-Math.log(rnd)/lambd);
    });

    mod.choice = new Sk.builtin.func(function (seq) {
        Sk.builtin.pyCheckArgs("choice", arguments, 1, 1);
        Sk.builtin.pyCheckType("seq", "sequence", Sk.builtin.checkSequence(seq));

        if (seq.sq$length !== undefined) {
            var r = toInt(myGenerator.genrand_res53() * seq.sq$length());
            return seq.mp$subscript(r);
        } else {
            throw new Sk.builtin.TypeError("object has no length");
        }
    });

    mod.shuffle = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("shuffle", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "sequence", Sk.builtin.checkSequence(x));

        if (x.sq$length !== undefined) {
            if (x.mp$ass_subscript !== undefined) {
                for (var i = x.sq$length() - 1; i > 0; i -= 1) {
                    var r = toInt(myGenerator.genrand_res53() * (i + 1));
                    var tmp = x.mp$subscript(r);
                    x.mp$ass_subscript(r, x.mp$subscript(i));
                    x.mp$ass_subscript(i, tmp);
                }
                ;
            } else {
                throw new Sk.builtin.TypeError("object is immutable");
            }
            ;
        } else {
            throw new Sk.builtin.TypeError("object has no length");
        }
        ;

        return Sk.builtin.none.none$;
    });

    mod.sample = new Sk.builtin.func(function (population, k) {
        var i, j, iter, elem, reservoir;

        Sk.builtin.pyCheckArgs("sample", arguments, 2, 2);
        Sk.builtin.pyCheckType("population", "iterable", Sk.builtin.checkIterable(population));
        Sk.builtin.pyCheckType("k", "integer", Sk.builtin.checkInt(k));
        k = Sk.builtin.asnum$(k);
        
        // "Algorithm R" in
        // https://en.wikipedia.org/wiki/Reservoir_sampling
        //
        // This algorithm guarantees that each element has
        // equal probability of being included in the
        // resulting list. See the Wikipedia page for a proof.
        //
        // This requires no extra space but the runtime is
        // proportional to len(population). CPython implements a fast
        // path for the case when k is much smaller than
        // len(population). A similar optimization could be
        // implemented here.
        reservoir = [];
        iter = Sk.abstr.iter(population);
        for (i = 0, elem = iter.tp$iternext();
             elem !== undefined;
             i++, elem = iter.tp$iternext()) {
            j = Math.floor(myGenerator.genrand_res53() * (i + 1));
            if (i < k) {
                // Fill the reservoir
                if (j < i) {
                    // Shuffle the existing elements to ensure that
                    // subslices are valid random samples
                    reservoir[i] = reservoir[j];
                }
                reservoir[j] = elem;
            } else {
                // Replace elements with a probability that decreases
                // the further we get
                if (j < k) {
                    reservoir[j] = elem;
                }
            }
        }
        
        if (i < k) {
            throw new Sk.builtin.ValueError("sample larger than population");
        }

        return Sk.builtin.list(reservoir);
    });

    return mod;
}
