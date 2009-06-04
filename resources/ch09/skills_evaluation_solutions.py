"""
  >>> h
  42
  >>> type(something)
  <type 'str'>
  >>> s + t
  'Happy Birthday!'
  >>> a % b
  1
  >>> lineEq(0)
  7
  >>> lineEq(1)
  11
  >>> lineEq(2)
  15
  >>> lineEq(3)
  19
  >>> type(somethingElse)
  <type 'NoneType'>
  >>> p and q 
  False
  >>> result = func(5, 5)
  >>> result 
  0.0
  >>> print mistake(8, 2)
  None
  >>> hmm(1, 2)
  2
  >>> hmm(5, 3)
  5
  >>> hmm(7, 10)
  10
  >>> hmm(-2, 0)
  0
  >>> f(4, 3)
  1
  >>> f(12, 5)
  2
  >>> f(13, 4)
  3
  >>> f(13, 5)
  2
  >>> f(13, 6)
  2
  >>> f(13, 7)
  1
  >>> g(3, 4, 5)
  4
""" 

# 1.
h = 42

# 2.
something = 'You need a string here.'

# 3.
s, t = 'Happy ', 'Birthday!'

# 4.
a, b = 3, 2

# 5.
def lineEq(x):
    return 4*x + 7 

# 6.
somethingElse = None

# 7.
p, q = False, True

# 8.
def func(x, y):
    return 0.0

# 9.
def mistake(a, b):
    4*a - 3*b

# 10.
def hmm(a, b):
    if a > b: return a
    return b

# 11.
def f(x, y):
    return x/y

# 12.
def g(a, b, c):
    return b


if __name__ == '__main__':
    import doctest
    doctest.testmod()
