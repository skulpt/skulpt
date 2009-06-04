def is_prime(n):
    """
      >>> is_prime(2)
      True
      >>> is_prime(3)
      True
      >>> is_prime(4)
      False
      >>> is_prime(15)
      False
      >>> is_prime(121)
      False
      >>> is_prime(83)
      True
    """
    if n == 2:              # handle the only even prime.
        return True
    elif n % 2 == 0:        # rule out all other even numbers.
        return False
    else:                   # check odd numbers between 3 and sqrt of n.
        i = 3
        root_n = n**0.5
        while i <= root_n:
            if n % i == 0:
                return False
            i += 2
        return True


def num_digits(n):
    """
      >>> num_digits(12345)
      5
      >>> num_digits(12345678)
      8
      >>> num_digits(246)
      3
      >>> num_digits(8)
      1
      >>> num_digits(9876543210987)
      13
    """
    count = 0
    while n:
        count += 1
        n /= 10
    return count


def print_digits(n):
    """
      >>> print_digits(13789)
      9 8 7 3 1
      >>> print_digits(39874613)
      3 1 6 4 7 8 9 3
      >>> print_digits(213141)
      1 4 1 3 1 2
      >>> print_digits(100)
      0 0 1
    """
    while n:
        print n % 10,
        n /= 10


def sum_of_squares_of_digits(n):
    """
      >>> sum_of_squares_of_digits(1)
      1
      >>> sum_of_squares_of_digits(9)
      81
      >>> sum_of_squares_of_digits(11)
      2
      >>> sum_of_squares_of_digits(121)
      6
      >>> sum_of_squares_of_digits(987)
      194
    """
    sum = 0
    while n:
        d = n % 10
        sum += d**2
        n /= 10
    return sum
            

if __name__ == '__main__':
    import doctest
    doctest.testmod()
