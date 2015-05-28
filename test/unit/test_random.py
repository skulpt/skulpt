import random 
import unittest

class Test_Distributions(unittest.TestCase):
    def test_seeding(self):
        # Python's seeding is different so we can't hard code
        random.seed(1)
        a = random.uniform(1,5)
        random.seed(1)
        b = random.uniform(1,5)
        self.assertEqual(a, b)
    def test_avg_std(self):
        # Use integration to test distribution average and standard deviation.
        # Only works for distributions which do not consume variates in pairs
        #g = random.Random()
        N = 5000
        x = [i/float(N) for i in xrange(1,N)]
        for variate, args, mu, sigmasqrd in [
                (random.uniform, (1.0,10.0), (10.0+1.0)/2, (10.0-1.0)**2/12) #,
#                 (g.triangular, (0.0, 1.0, 1.0/3.0), 4.0/9.0, 7.0/9.0/18.0),
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
        
if __name__ == '__main__':
    unittest.main() 