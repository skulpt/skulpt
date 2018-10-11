import unittest
from math import factorial
import bisect

def Primes(n) :
    primes = [2, 3]
    lim, tog = n // 3, False
    composite = [False for i in range(lim)]

    d1 = 8; d2 = 8; p1 = 3; p2 = 7; s = 7; s2 = 3; m = -1

    while s < lim :             # --  scan the sieve
        m += 1                  # --  if a prime is found
        if not composite[m] :   # --  cancel its multiples
            inc = p1 + p2
            for k in range(s,      lim, inc) : composite[k] = True
            for k in range(s + s2, lim, inc) : composite[k] = True

            tog = not tog
            if tog: s += d2; d1 += 16; p1 += 2; p2 += 2; s2 = p2
            else:   s += d1; d2 +=  8; p1 += 2; p2 += 6; s2 = p1

    k, p, tog = 0, 5, False
    while p <= n :
        if not composite[k] : primes.append(p)
        k += 1;
        tog = not tog
        p += 2 if tog else 4

    return primes

def bit_length(n):
    try:
        return n.bit_length()
    except AttributeError:
        return len(bin(n))-2

def isqrt(x):
    '''
    Writing your own square root function
    '''
    if x < 0: raise ValueError('square root not defined for negative numbers')
    n = int(x)
    if n == 0: return 0
    a, b = divmod(bit_length(n), 2)
    x = 2**(a + b)
    while True:
        y = (x + n // x) // 2
        if y >= x: return x
        x = y

def product(s, n, m):
    if n > m: return 1
    if n == m: return s[n]
    k = (n + m) // 2
    return product(s, n, k) * product(s, k + 1, m)

def factorialPS(n):

    small_swing = [1,1,1,3,3,15,5,35,35,315,63,693,231,3003,429,6435,6435,
        109395,12155,230945,46189,969969,88179,2028117,676039,16900975,
        1300075,35102025,5014575,145422675,9694845,300540195,300540195]

    def swing(m, primes):
        if m < 33: return small_swing[m]

        s = bisect.bisect_left(primes, 1 + isqrt(m))
        d = bisect.bisect_left(primes, 1 + m // 3)
        e = bisect.bisect_left(primes, 1 + m // 2)
        g = bisect.bisect_left(primes, 1 + m)

        factors = primes[e:g]
        factors += filter(lambda x: (m // x) & 1 == 1, primes[s:d])
        for prime in primes[1:s]:
            p, q = 1, m
            while True:
                q //= prime
                if q == 0: break
                if q & 1 == 1:
                    p *= prime
            if p > 1: factors.append(p)

        return product(factors, 0, len(factors) - 1)

    def odd_factorial(n, primes):
        if n < 2: return 1
        return (odd_factorial(n // 2, primes)**2) * swing(n, primes)

    def eval(n):
        if n < 0:
            raise ValueError('factorial not defined for negative numbers')

        if n == 0: return 1
        if n < 20: return product(range(2, n + 1), 0, n-2)

        N, bits = n, n
        while N != 0:
            bits -= N & 1
            N >>= 1

        primes = Primes(n)
        return odd_factorial(n, primes) * 2**bits

    return eval(n)

class FactorialTests(unittest.TestCase):

    def test_intFactorial(self):
        for i in range(0, 18):
            self.assertEqual(factorial(i), factorialPS(i))

    def test_longFactorial(self):
        for i in range(18, 30):
            self.assertEqual(factorial(i), factorialPS(i))

        for i in [100, 333, 1000]:
            self.assertEqual(factorial(i), factorialPS(i))

        self.assertEqual(str(factorial(8888)).count("8"), 2887)
        self.assertEqual(len(str(factorial(3333))), 10297)

if __name__ == '__main__':
    unittest.main()
