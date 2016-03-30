import random 
import unittest
from math import exp, sqrt

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
        for i in xrange(N):
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
        sampled = random.sample(population, 2)
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


if __name__ == '__main__':
    unittest.main() 
