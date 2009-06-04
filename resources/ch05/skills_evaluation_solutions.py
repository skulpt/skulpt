"""
  >>> j
  3.0
  >>> type(stuff)
  <type 'bool'>
  >>> z * w
  20
  >>> g(0)
  20
  >>> g(1)
  17
  >>> g(2)
  14
  >>> g(3)
  11
  >>> type(junk)
  <type 'NoneType'>
  >>> m % n
  5
  >>> u = yo(7, 2)
  >>> u
  5
  >>> p or q
  True
  >>> snewz(5, 7)
  0
  >>> snewz(7, 5)
  1
  >>> snewz(20, 7)
  2
  >>> print go('team')
  None
"""

j = 3.0
stuff = True 
z = 4
w = 5

def g(n):
    return 20 - 3 * n

junk = None
m = 16
n = 11

def yo(a, b):
    return 5

p = False
q = True

def snewz(m, n):
    return m / n

def go(s):
    pass


if __name__ == '__main__':
    import doctest
    doctest.testmod()
