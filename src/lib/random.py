from _random import *
from math import floor as _floor, isfinite as _isfinite
from itertools import accumulate as _accumulate, repeat as _repeat
from bisect import bisect as _bisect
from sys import version_info

if 3 in version_info:
    exec("""def choices(population, weights=None, *, cum_weights=None, k=1):
        '''Return a k sized list of population elements chosen with replacement.

        If the relative weights or cumulative weights are not specified,
        the selections are made with equal probability.

        '''
        n = len(population)
        if cum_weights is None:
            if weights is None:
                floor = _floor
                n += 0.0    # convert to float for a small speed improvement
                return [population[floor(random() * n)] for i in _repeat(None, k)]
            try:
                cum_weights = list(_accumulate(weights))
            except TypeError:
                if not isinstance(weights, int):
                    raise
                k = weights
                raise TypeError(
                    'The number of choices must be a keyword argument: k=' + k
                )
        elif weights is not None:
            raise TypeError('Cannot specify both weights and cumulative weights')
        if len(cum_weights) != n:
            raise ValueError('The number of weights does not match the population')
        total = cum_weights[-1] + 0.0   # convert to float
        if total <= 0.0:
            raise ValueError('Total of weights must be greater than zero')
        if not _isfinite(total):
            raise ValueError('Total of weights must be finite')
        bisect = _bisect
        hi = n - 1
        return [population[bisect(cum_weights, random() * total, 0, hi)]
                for i in _repeat(None, k)]""")