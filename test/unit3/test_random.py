import random 
import unittest
from math import exp, factorial, sqrt
from collections import Counter

class TestBasicOps:
    # Superclass with tests common to all generators.
    # Subclasses must arrange for self.gen to retrieve the Random instance
    # to be tested.

    def randomlist(self, n):
        """Helper function to make a list of random numbers"""
        return [self.gen.random() for i in range(n)]

    def test_shuffle(self):
        shuffle = self.gen.shuffle
        lst = []
        shuffle(lst)
        self.assertEqual(lst, [])
        lst = [37]
        shuffle(lst)
        self.assertEqual(lst, [37])
        seqs = [list(range(n)) for n in range(10)]
        shuffled_seqs = [list(range(n)) for n in range(10)]
        for shuffled_seq in shuffled_seqs:
            shuffle(shuffled_seq)
        for (seq, shuffled_seq) in zip(seqs, shuffled_seqs):
            self.assertEqual(len(seq), len(shuffled_seq))
            self.assertEqual(set(seq), set(shuffled_seq))
        # The above tests all would pass if the shuffle was a
        # no-op. The following non-deterministic test covers that.  It
        # asserts that the shuffled sequence of 1000 distinct elements
        # must be different from the original one. Although there is
        # mathematically a non-zero probability that this could
        # actually happen in a genuinely random shuffle, it is
        # completely negligible, given that the number of possible
        # permutations of 1000 objects is 1000! (factorial of 1000),
        # which is considerably larger than the number of atoms in the
        # universe...
        lst = list(range(1000))
        shuffled_lst = list(range(1000))
        shuffle(shuffled_lst)
        self.assertTrue(lst != shuffled_lst)
        shuffle(lst)
        self.assertTrue(lst != shuffled_lst)
        self.assertRaises(TypeError, shuffle, (1, 2, 3))

    def test_choice(self):
        choice = self.gen.choice
        with self.assertRaises(IndexError):
            choice([])
        self.assertEqual(choice([50]), 50)
        self.assertIn(choice([25, 75]), [25, 75])

    def test_choice_with_numpy(self):
        # Accommodation for NumPy arrays which have disabled __bool__().
        # See: https://github.com/python/cpython/issues/100805
        choice = self.gen.choice

        class NA(list):
            "Simulate numpy.array() behavior"
            def __bool__(self):
                raise RuntimeError

        with self.assertRaises(IndexError):
            choice(NA([]))
        self.assertEqual(choice(NA([50])), 50)
        self.assertIn(choice(NA([25, 75])), [25, 75])

    def test_sample(self):
        # For the entire allowable range of 0 <= k <= N, validate that
        # the sample is of the correct length and contains only unique items
        N = 100
        population = range(N)
        for k in range(N+1):
            s = self.gen.sample(population, k)
            self.assertEqual(len(s), k)
            uniq = set(s)
            self.assertEqual(len(uniq), k)
            self.assertTrue(uniq <= set(population))
        self.assertEqual(self.gen.sample([], 0), [])  # test edge case N==k==0

    def test_sample_distribution(self):
        # For the entire allowable range of 0 <= k <= N, validate that
        # sample generates all possible permutations
        n = 5
        pop = range(n)
        trials = 10000  # large num prevents false negatives without slowing normal case
        for k in range(n):
            expected = factorial(n) // factorial(n-k)
            perms = {}
            for i in range(trials):
                perms[tuple(self.gen.sample(pop, k))] = None
                if len(perms) == expected:
                    break
            else:
                self.fail()

    def test_sample_inputs(self):
        # SF bug #801342 -- population can be any iterable defining __len__()
        self.gen.sample(range(20), 2)
        self.gen.sample(range(20), 2)
        self.gen.sample(str('abcdefghijklmnopqrst'), 2)
        self.gen.sample(tuple('abcdefghijklmnopqrst'), 2)

    def test_sample_on_sets(self):
        with self.assertRaises(TypeError):
            population = {10, 20, 30, 40, 50, 60, 70}
            self.gen.sample(population, k=5)

    def test_choices(self):
        choices = self.gen.choices
        data = ['red', 'green', 'blue', 'yellow']
        str_data = 'abcd'
        range_data = range(4)
        set_data = set(range(4))

        # basic functionality
        for sample in [
            choices(data, k=5),
            choices(data, range(4), k=5),
            choices(k=5, population=data, weights=range(4)),
            choices(k=5, population=data, cum_weights=range(4)),
        ]:
            self.assertEqual(len(sample), 5)
            self.assertEqual(type(sample), list)
            self.assertTrue(set(sample) <= set(data))

        # test argument handling
        with self.assertRaises(TypeError):                               # missing arguments
            choices(2)

        self.assertEqual(choices(data, k=0), [])                         # k == 0
        self.assertEqual(choices(data, k=-1), [])                        # negative k behaves like ``[0] * -1``
        with self.assertRaises(TypeError):
            choices(data, k=2.5)                                         # k is a float

        self.assertTrue(set(choices(str_data, k=5)) <= set(str_data))    # population is a string sequence
        self.assertTrue(set(choices(range_data, k=5)) <= set(range_data))  # population is a range
        with self.assertRaises(TypeError):
            choices(set_data, k=2)                                       # population is not a sequence

        self.assertTrue(set(choices(data, None, k=5)) <= set(data))      # weights is None
        self.assertTrue(set(choices(data, weights=None, k=5)) <= set(data))
        with self.assertRaises(ValueError):
            choices(data, [1,2], k=5)                                    # len(weights) != len(population)
        with self.assertRaises(TypeError):
            choices(data, 10, k=5)                                       # non-iterable weights
        with self.assertRaises(TypeError):
            choices(data, [None]*4, k=5)                                 # non-numeric weights
        for weights in [
                [15, 10, 25, 30],                                                 # integer weights
                [15.1, 10.2, 25.2, 30.3],                                         # float weights
                # fractions module isn't implemented [Fraction(1, 3), Fraction(2, 6), Fraction(3, 6), Fraction(4, 6)], # fractional weights
                [True, False, True, False]                                        # booleans (include / exclude)
        ]:
            self.assertTrue(set(choices(data, weights, k=5)) <= set(data))

        with self.assertRaises(ValueError):
            choices(data, cum_weights=[1,2], k=5)                        # len(weights) != len(population)
        with self.assertRaises(TypeError):
            choices(data, cum_weights=10, k=5)                           # non-iterable cum_weights
        with self.assertRaises(TypeError):
            choices(data, cum_weights=[None]*4, k=5)                     # non-numeric cum_weights
        with self.assertRaises(TypeError):
            choices(data, range(4), cum_weights=range(4), k=5)           # both weights and cum_weights
        for weights in [
                [15, 10, 25, 30],                                                 # integer cum_weights
                [15.1, 10.2, 25.2, 30.3],                                         # float cum_weights
                # fractions module isn't implemented [Fraction(1, 3), Fraction(2, 6), Fraction(3, 6), Fraction(4, 6)], # fractional cum_weights
        ]:
            self.assertTrue(set(choices(data, cum_weights=weights, k=5)) <= set(data))

        # Test weight focused on a single element of the population
        self.assertEqual(choices('abcd', [1, 0, 0, 0]), ['a'])
        self.assertEqual(choices('abcd', [0, 1, 0, 0]), ['b'])
        self.assertEqual(choices('abcd', [0, 0, 1, 0]), ['c'])
        self.assertEqual(choices('abcd', [0, 0, 0, 1]), ['d'])

        # Test consistency with random.choice() for empty population
        with self.assertRaises(IndexError):
            choices([], k=1)
        with self.assertRaises(IndexError):
            choices([], weights=[], k=1)
        with self.assertRaises(IndexError):
            choices([], cum_weights=[], k=5)

    def test_choices_subnormal(self):
        # Subnormal weights would occasionally trigger an IndexError
        # in choices() when the value returned by random() was large
        # enough to make `random() * total` round up to the total.
        # See https://bugs.python.org/msg275594 for more detail.
        choices = self.gen.choices
        choices(population=[1, 2], weights=[1e-323, 1e-323], k=5000)

    def test_choices_with_all_zero_weights(self):
        # See issue #38881
        with self.assertRaises(ValueError):
            self.gen.choices('AB', [0.0, 0.0])

    def test_choices_negative_total(self):
        with self.assertRaises(ValueError):
            self.gen.choices('ABC', [3, -5, 1])

    def test_choices_infinite_total(self):
        with self.assertRaises(ValueError):
            self.gen.choices('A', [float('inf')])
        with self.assertRaises(ValueError):
            self.gen.choices('AB', [0.0, float('inf')])
        with self.assertRaises(ValueError):
            self.gen.choices('AB', [-float('inf'), 123])
        with self.assertRaises(ValueError):
            self.gen.choices('AB', [0.0, float('nan')])
        with self.assertRaises(ValueError):
            self.gen.choices('AB', [float('-inf'), float('inf')])

    def test_bug_9025(self):
        # Had problem with an uneven distribution in int(n*random())
        # Verify the fix by checking that distributions fall within expectations.
        n = 100000
        randrange = self.gen.randrange
        k = sum(randrange(6755399441055744) % 3 == 2 for i in range(n))
        self.assertTrue(0.30 < k/n < .37, (k/n))

class MersenneTwister_TestBasicOps(TestBasicOps, unittest.TestCase):
    gen = random

    def test_choices_algorithms(self):
        # The various ways of specifying weights should produce the same results
        choices = random.choices
        n = 104729

        self.gen.seed(8675309)
        a = random.choices(range(n), k=10000)

        self.gen.seed(8675309)
        b = random.choices(range(n), [1]*n, k=10000)
        self.assertEqual(a, b)

        self.gen.seed(8675309)
        c = random.choices(range(n), cum_weights=range(1, n+1), k=10000)
        self.assertEqual(a, c)

        # American Roulette
        population = ['Red', 'Black', 'Green']
        weights = [18, 18, 2]
        cum_weights = [18, 36, 38]
        expanded_population = ['Red'] * 18 + ['Black'] * 18 + ['Green'] * 2

        self.gen.seed(9035768)
        a = random.choices(expanded_population, k=10000)

        self.gen.seed(9035768)
        b = random.choices(population, weights, k=10000)
        self.assertEqual(a, b)

        self.gen.seed(9035768)
        c = random.choices(population, cum_weights=cum_weights, k=10000)
        self.assertEqual(a, c)

class Test_Distributions(unittest.TestCase):
    def test_seeding(self):
        # Python's seeding is different so we can't hard code
        random.seed(1)
        a = random.uniform(1,5)
        random.seed(1)
        b = random.uniform(1,5)
        self.assertEqual(a, b)

    def _excluded_test_avg_std(self):
        # Use integration to test distribution average and standard deviation.
        # Only works for distributions which do not consume variates in pairs
        #g = random.Random()
        N = 5000
        x = [i/float(N) for i in xrange(1,N)]
        for variate, args, mu, sigmasqrd in [
                (random.uniform, (1.0,10.0), (10.0+1.0)/2, (10.0-1.0)**2/12),
                (random.gauss, (-5.0,2.0), -5.0, 2.0**2),
                (random.normalvariate, (2.0,0.8), 2.0, 0.8**2),
                (random.lognormvariate, (-1.0,0.5), exp(-1.0 + 0.5**2)/2.0, (exp(0.5**2) - 1) * exp(-2.0 + 0.5**2)),
                (random.expovariate, (0.4,), 1.0/0.4, 1.0/0.4**2),
                (random.triangular, (0.0, 1.0, 1.0/3.0), 4.0/9.0, 7.0/9.0/18.0) #,
#                 (g.expovariate, (1.5,), 1/1.5, 1/1.5**2),
#                 (g.paretovariate, (5.0,), 5.0/(5.0-1),
#                                   5.0/((5.0-1)**2*(5.0-2))),
#                 (g.weibullvariate, (1.0, 3.0), gamma(1+1/3.0),
#                                   gamma(1+2/3.0)-gamma(1+1/3.0)**2) 
                                                    ]:
            #g.random = x[:].pop
            y = []
            for i in xrange(len(x)):
                try:
                    y.append(variate(*args))
                except IndexError:
                    pass
            s1 = s2 = 0
            for e in y:
                s1 += e
                s2 += (e - mu) ** 2
            N = len(y)
            # Reduced precision from two to zero decimal places
            self.assertAlmostEqual(s1/N, mu, 0)
            self.assertAlmostEqual(s2/(N-1), sigmasqrd, 0)

    def test_sample_frequency(self):
        N = 1000
        population = [-2, -1, 0, 1, 2]
        hist = {}
        for i in range(N):
            # changed from for i in xrange(N):
            sampled = random.sample(population, 2)
            key = ','.join(str(x) for x in sampled)
            hist[key] = hist.get(key, 0) + 1

        # There are m * (m-1) ways to pick an ordered pair. The
        # observed number of occurrences of a pair follows a
        # Binomial(N, 1/(m*(m-1))) distribution.
        m = len(population)
        p = 1.0 / (m*(m-1))
        mean = N*p
        stddev = sqrt(N*p*(1-p))
        low = mean - 4*stddev
        high = mean + 4*stddev

        for a in population:
            for b in population:
                if a != b:
                    key = '%s,%s' % (a, b)
                    observed = hist.get(key, 0)
                    self.assertLess(low, observed, 'Sample %s' % key)
                    self.assertGreater(high, observed, 'Sample %s' % key)

    def test_sample_tuple(self):
        population = (1, 2, 3, 4)
        sampled = random.sample(population, 3)
        self.assertEqual(len(sampled), 3)
        for x in sampled:
            self.assertIn(x, population)

    def test_sample_set(self):
        population = set(range(20))
        sampled = random.sample(population, 10)
        self.assertEqual(len(sampled), 10)
        for x in sampled:
            self.assertIn(x, population)

    def test_sample_dict(self):
        population = {"one": 1, "two": 2, "three": 3}
        sampled = random.sample(list(population), 2)
        # changed from sampled = random.sample(population, 2)
        self.assertEqual(len(sampled), 2)
        for x in sampled:
            self.assertIn(x, population.keys())

    def test_sample_empty(self):
        sampled = random.sample([], 0)
        self.assertEqual(sampled, [])

    def test_sample_all(self):
        population = "ABCDEF"
        sampled = random.sample(population, len(population))
        self.assertEqual(set(sampled), set(population))

    def test_sample_one_too_many(self):
        self.assertRaises(ValueError, random.sample, range(4), 5)

    def test_choices(self):
        choices = random.choices
        data = ['red', 'green', 'blue', 'yellow']
        str_data = 'abcd'
        range_data = range(4)
        set_data = set(range(4))

        # basic functionality
        for sample in [
            choices(data, k=5),
            choices(data, range(4), k=5),
            choices(k=5, population=data, weights=range(4)),
            choices(k=5, population=data, cum_weights=range(4)),
        ]:
            self.assertEqual(len(sample), 5)
            self.assertEqual(type(sample), list)
            self.assertTrue(set(sample) <= set(data))

        # test argument handling
        with self.assertRaises(TypeError):                               # missing arguments
            choices(2)

        self.assertEqual(choices(data, k=0), [])                         # k == 0
        self.assertEqual(choices(data, k=-1), [])                        # negative k behaves like ``[0] * -1``
        with self.assertRaises(TypeError):
            choices(data, k=2.5)                                         # k is a float

        self.assertTrue(set(choices(str_data, k=5)) <= set(str_data))    # population is a string sequence
        self.assertTrue(set(choices(range_data, k=5)) <= set(range_data))  # population is a range
        with self.assertRaises(TypeError):
            choices(set_data, k=2)                                       # population is not a sequence

        self.assertTrue(set(choices(data, None, k=5)) <= set(data))      # weights is None
        self.assertTrue(set(choices(data, weights=None, k=5)) <= set(data))
        with self.assertRaises(ValueError):
            choices(data, [1,2], k=5)                                    # len(weights) != len(population)
        with self.assertRaises(TypeError):
            choices(data, 10, k=5)                                       # non-iterable weights
        with self.assertRaises(TypeError):
            choices(data, [None]*4, k=5)                                 # non-numeric weights
        for weights in [
                [15, 10, 25, 30],                                                 # integer weights
                [15.1, 10.2, 25.2, 30.3],                                         # float weights
                # fractions module isn't implemented [Fraction(1, 3), Fraction(2, 6), Fraction(3, 6), Fraction(4, 6)], # fractional weights
                [True, False, True, False]                                        # booleans (include / exclude)
        ]:
            self.assertTrue(set(choices(data, weights, k=5)) <= set(data))

        with self.assertRaises(ValueError):
            choices(data, cum_weights=[1,2], k=5)                        # len(weights) != len(population)
        with self.assertRaises(TypeError):
            choices(data, cum_weights=10, k=5)                           # non-iterable cum_weights
        with self.assertRaises(TypeError):
            choices(data, cum_weights=[None]*4, k=5)                     # non-numeric cum_weights
        with self.assertRaises(TypeError):
            choices(data, range(4), cum_weights=range(4), k=5)           # both weights and cum_weights
        for weights in [
                [15, 10, 25, 30],                                                 # integer cum_weights
                [15.1, 10.2, 25.2, 30.3],                                         # float cum_weights
                # fractions module isn't implemented [Fraction(1, 3), Fraction(2, 6), Fraction(3, 6), Fraction(4, 6)], # fractional cum_weights
        ]:
            self.assertTrue(set(choices(data, cum_weights=weights, k=5)) <= set(data))

        # Test weight focused on a single element of the population
        self.assertEqual(choices('abcd', [1, 0, 0, 0]), ['a'])
        self.assertEqual(choices('abcd', [0, 1, 0, 0]), ['b'])
        self.assertEqual(choices('abcd', [0, 0, 1, 0]), ['c'])
        self.assertEqual(choices('abcd', [0, 0, 0, 1]), ['d'])

        # Test consistency with random.choice() for empty population
        with self.assertRaises(IndexError):
            choices([], k=1)
        with self.assertRaises(IndexError):
            choices([], weights=[], k=1)
        with self.assertRaises(IndexError):
            choices([], cum_weights=[], k=5)

    def test_choices_subnormal(self):
        # Subnormal weights would occasionally trigger an IndexError
        # in choices() when the value returned by random() was large
        # enough to make `random() * total` round up to the total.
        # See https://bugs.python.org/msg275594 for more detail.
        choices = random.choices
        choices(population=[1, 2], weights=[1e-323, 1e-323], k=5000)

    def test_choices_with_all_zero_weights(self):
        # See issue #38881
        with self.assertRaises(ValueError):
            random.choices('AB', [0.0, 0.0])

    def test_choices_negative_total(self):
        with self.assertRaises(ValueError):
            random.choices('ABC', [3, -5, 1])

    def test_choices_infinite_total(self):
        with self.assertRaises(ValueError):
            random.choices('A', [float('inf')])
        with self.assertRaises(ValueError):
            random.choices('AB', [0.0, float('inf')])
        with self.assertRaises(ValueError):
            random.choices('AB', [-float('inf'), 123])
        with self.assertRaises(ValueError):
            random.choices('AB', [0.0, float('nan')])
        with self.assertRaises(ValueError):
            random.choices('AB', [float('-inf'), float('inf')])

if __name__ == '__main__':
    unittest.main() 
