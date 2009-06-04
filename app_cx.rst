


Creating a new data type
========================

Object-oriented programming languages allow programmers to create new
data types that behave much like built-in data types. We will explore
this capability by building a `Fraction` class that works very much
like the built-in numeric types, integers, longs, and floats.

Fractions, also known as rational numbers, are values that can be
expressed as a ratio of whole numbers, such as `5/6`. The top number
is called the numerator and the bottom number is called the
denominator.

We start by defining a `Fraction` class with an initialization method
that provides the numerator and denominator as integers:

.. sourcecode:: python

    
    class Fraction:
        def __init__(self, numerator, denominator=1):
            self.numerator = numerator
            self.denominator = denominator


The denominator is optional. A Fraction with just one just one
parameter represents a whole number. If the numerator is `n`, we build
the Fraction `n/1`.

The next step is to write a `__str__` method that displays fractions
in a way that makes sense. The form numerator/denominator is natural
here:

.. sourcecode:: python

    
    class Fraction:
        ...
        def __str__(self):
            return "%d/%d" % (self.numerator, self.denominator)


To test what we have so far, we put it in a file named `fraction.py`
and import it into the Python interpreter. Then we create a Fraction
object and print it.

.. sourcecode:: python

    
    >>> from fraction import Fraction
    >>> f = Fraction(5, 6)
    >>> print "The fraction is", f
    The fraction is 5/6


As usual, the `print` command invokes the `__str__` method implicitly.


Fraction multiplication
-----------------------

We would like to be able to apply the normal addition, subtraction,
multiplication, and division operations to fractions. To do this, we
can overload the mathematical operators for `Fraction` objects.

We'll start with multiplication because it is the easiest to
implement. To multiply fractions, we create a new fraction with a
numerator that is the product of the original numerators and a
denominator that is a product of the original denominators. `__mul__`
is the name Python uses for a method that overloads the `*` operator:

.. sourcecode:: python

    
    class Fraction:
        ...
        def __mul__(self, object):
            return Fraction(self.numerator*object.numerator,
                            self.denominator*object.denominator)


We can test this method by computing the product of two fractions:

.. sourcecode:: python

    
    >>> print Fraction(5, 6) * Fraction(3, 4)
    15/24


It works, but we can do better! We can extend the method to handle
multiplication by an integer. We use the `type` function to test if
`other` is an integer and convert it to a fraction if it is.

.. sourcecode:: python

    
    class Fraction:
        ...
        def __mul__(self, other):
           if type(other) == type(5):
               other = Fraction(other)
           return Fraction(self.numerator   * other.numerator,
                           self.denominator * other.denominator)


Multiplying fractions and integers now works, but only if the fraction
is the left operand:

.. sourcecode:: python

    
    >>> print Fraction(5,6) * 4
    20/6
    >>> print 4 * Fraction(5,6)
    TypeError: __mul__ nor __rmul__ defined for these operands


To evaluate a binary operator like multiplication, Python checks the
left operand first to see if it provides a `__mul__` that supports the
type of the second operand. In this case, the built-in integer
operator doesn't support fractions.

Next, Python checks the right operand to see if it provides an
`__rmul__` method that supports the first type. In this case, we
haven't provided `__rmul__`, so it fails.

On the other hand, there is a simple way to provide `__rmul__`:

.. sourcecode:: python

    
    class Fraction:
        ...
        __rmul__ = __mul__


This assignment says that the `__rmul__` is the same as `__mul__`. Now
if we evaluate `4 * Fraction(5,6)`, Python invokes `__rmul__` on the
`Fraction` object and passes 4 as a parameter:

.. sourcecode:: python

    
    >>> print 4 * Fraction(5, 6)
    20/6


Since `__rmul__` is the same as `__mul__`, and `__mul__` can handle an
integer parameter, we're all set.


Fraction addition
-----------------

Addition is more complicated than multiplication, but still not too
bad. The sum of `a/b` and `c/d` is the fraction `(a*d+c*b)/b*d`.

Using the multiplication code as a model, we can write `__add__` and
`__radd__`:

.. sourcecode:: python

    
    class Fraction:
        ...
        def __add__(self, other):
            if type(other) == type(5):
                other = Fraction(other)
            return Fraction(self.numerator   * other.denominator +
                            self.denominator * other.numerator,
                            self.denominator * other.denominator)
       
            __radd__ = __add__


We can test these methods with `Fraction`s and integers.

.. sourcecode:: python

    
    >>> print Fraction(5, 6) + Fraction(5, 6)
    60/36
    >>> print Fraction(5, 6) + 3
    23/6
    >>> print 2 + Fraction(5, 6)
    17/6


The first two examples invoke `__add__`; the last invokes `__radd__`.


Euclid's algorithm
------------------

In the previous example, we computed the sum `5/6` + `5/6` and got
`60/36`. That is correct, but it's not the best way to represent the
answer. To reduce the fraction to its simplest terms, we have to
divide the numerator and denominator by their greatest common divisor
(GCD) , which is 12. The result is `5/3`.

In general, whenever we create a new `Fraction` object, we should
reduce it by dividing the numerator and denominator by their GCD. If
the fraction is already reduced, the GCD is 1.

Euclid of Alexandria (approx. 325--265 BCE) presented an algorithm to
find the GCD for two integers `m` and `n`:
If `n` divides `m` evenly, then `n` is the GCD. Otherwise the GCD is
the GCD of `n` and the remainder of `m` divided by `n`.
This recursive definition can be expressed concisely as a function:

.. sourcecode:: python

    
    def gcd (m, n):
        if m % n == 0:
            return n
        else:
            return gcd(n, m%n)


In the first line of the body, we use the modulus operator to check
divisibility. On the last line, we use it to compute the remainder
after division.

Since all the operations we've written create new `Fraction`s for the
result, we can reduce all results by modifying the initialization
method.

.. sourcecode:: python

    
    class Fraction:
        def __init__(self, numerator, denominator = 1):
            g = gcd (numerator, denominator)
            self.numerator = numerator / g
            self.denominator = denominator / g


Now whenever we create a `Fraction`, it is reduced to its simplest
form:

.. sourcecode:: python

    
    >>> Fraction(100, -36)
    -25/9


A nice feature of `gcd` is that if the fraction is negative, the minus
sign is always moved to the numerator.


Comparing fractions
-------------------

Suppose we have two `Fraction` objects, `a` and `b`, and we evaluate
`a == b`. The default implementation of `==` tests for shallow
equality, so it only returns true if `a` and `b` are the same object.

More likely, we want to return true if `a` and `b` have the same value
---that is, deep equality.

We have to teach fractions how to compare themselves. As we saw in
Section , we can overload all the comparison operators at once by
supplying a `__cmp__` method.

By convention, the `__cmp__` method returns a negative number if
`self` is less than `other`, zero if they are the same, and a positive
number if `self` is greater than `other`.

The simplest way to compare fractions is to cross-multiply. If `a/b >
c/d`, then `ad > bc`. With that in mind, here is the code for
`__cmp__`:

.. sourcecode:: python

    
    class Fraction:
        ...
        def __cmp__(self, other):
            diff = (self.numerator  * other.denominator -
                    other.numerator * self.denominator)
            return diff


If `self` is greater than `other`, then `diff` will be positive. If
`other` is greater, then `diff` will be negative. If they are the
same, `diff` is zero.


Taking it further
-----------------

Of course, we are not done. We still have to implement subtraction by
overriding `__sub__` and division by overriding `__div__`.

One way to handle those operations is to implement negation by
overriding `__neg__` and inversion by overriding `__invert__`. Then we
can subtract by negating the second operand and adding, and we can
divide by inverting the second operand and multiplying.

Next, we have to provide `__rsub__` and `__rdiv__`. Unfortunately, we
can't use the same trick we used for addition and multiplication,
because subtraction and division are not commutative. We can't just
set `__rsub__` and `__rdiv__` equal to `__sub__` and `__div__`. In
these operations, the order of the operands makes a difference.

To handle unary negation , which is the use of the minus sign with a
single operand, we override `__neg__`.

We can compute powers by overriding `__pow__`, but the implementation
is a little tricky. If the exponent isn't an integer, then it may not
be possible to represent the result as a `Fraction`. For example,
`Fraction(2) ** Fraction(1,2)` is the square root of 2, which is an
irrational number (it can't be represented as a fraction). So it's not
easy to write the most general version of `__pow__`.

There is one other extension to the `Fraction` class that you might
want to think about. So far, we have assumed that the numerator and
denominator are integers. We might also want to allow them to be long
integers.
As an exercise, finish the implementation of the `Fraction` class so
that it handles subtraction, division, exponentiation, and long
integers as numerators and denominators.


Glossary
--------

:greatest common divisor (GCD):: The largest positive integer that
  divides without a remainder into both the numerator and denominator of
  a fraction.
:reduce:: To change a fraction into an equivalent form with a GCD of
  1.
:unary negation:: The operation that computes an additive inverse,
  usually denoted with a leading minus sign. Called unary by contrast
  with the binary minus operation, which is subtraction.



