


Doctests and test driven development
====================================


Automated testing with `doctest`
--------------------------------

`doctest` is a module in the Python standard library which makes
innovative use of Python's docstring, interactive shell, and
introspection capabilities.


docstrings
----------

Python's docstring s provide an easy way to document modules, classes,
methods, and functions. A docstring is simply a string constant that
occurs as the first statement of an object's definition. Here is an
example from the chapter on trees illustrating its use:

.. sourcecode:: python

    
    def total(tree):
        """total(tree) -> sum
    
          Return the sum of the values of the elements of a tree of numbers.
        """
        if tree == None: return 0
        return total(tree.left) + total(tree.right)


Assuming the example above is in a module named `trees.py`, the
following is now possible:

.. sourcecode:: python

    
    >>> from trees import *
    >>> print total.__doc__
    total(tree) -> sum
    
          Return the sum of the values of the elements of a tree of numbers.
    



The `doctest` module
--------------------

The `doctest` module was added to the 2.3 release of Python. Created
by core python developer Tim Peters, `doctest` enables programmers to
use docstrings for automated testing.

.. sourcecode:: python

    
    """
      >>> distance(1, 2, 4, 6)
      5.0
    """
    
    def distance(x1, y1, x2, y2):
        return 0.0 
    
    if __name__ == "__main__":
        import doctest
        doctest.testmod()


The example above is taken from the *Program development* section of
chapter 5. Running this program produces the following output:

.. sourcecode:: python

    
    **********************************************************************
    File "doctest_example01.py", line 2, in __main__
    Failed example:
        distance(1, 2, 4, 6)
    Expected:
        5.0
    Got:
        0.0
    **********************************************************************
    1 items had failures:
       1 of   1 in __main__
    ***Test Failed*** 1 failures.


Doctests are written as sample Python interpreter sessions inside a
docstring. The doctest in this example is in the module's docstring,
but it could also be placed in the docstring of the function being
tested.

Each test consists of a Python expression written after the
interpreter prompt ( `>>>`) followed on the next line by the expected
evaluation of the given expression. The doctest module runs each
expression through the interpreter and compares the evaluation with
the expected one.


Doctest Exercises
-----------------

In each of the exercises below, write just enough code to make the
doctests pass.


Chapter 2
---------


#.

.. sourcecode:: python

    
    """
      >>> n
      17
    """


#.

.. sourcecode:: python

    
    """
      >>> s
      'I am a string!'
    """


#.

.. sourcecode:: python

    
    """
      >>> type(m)
      
    """


#.

.. sourcecode:: python

    
    """
      >>> type(r)
      
    """





Chapter 5
---------


#.

.. sourcecode:: python

    
    """
      >>> avg(3, 5)
      4.0
      >>> avg(8, 10)
      9.0
    """


#.

.. sourcecode:: python

    
    """
      >>> is_even(8)
      True
      >>> is_even(11)
      False
      >>> is_even(2)
      True
      >>> is_even(5)
      False
    """


#.

.. sourcecode:: python

    
    """
      >>> is_odd(8)
      False
      >>> is_odd(11)
      True
      >>> is_odd(2)
      False
      >>> is_odd(5)
      True
    """


#.

.. sourcecode:: python

    
    """
      >>> double(3)
      6
      >>> double(4.5)
      9.0
      >>> double("Pizza")
      'PizzaPizza' 
    """


#.

.. sourcecode:: python

    
    """
      >>> f(0)
      5
      >>> f(1)
      8
      >>> f(2)
      11
      >>> f(3)
      14 
    """


#.

.. sourcecode:: python

    
    """
      >>> g(0)
      -7
      >>> g(1)
      -2
      >>> g(2)
      3
      >>> g(3)
      8
    """


#.

.. sourcecode:: python

    
    """
      >>> str_double("Python")
      'Python Python' 
      >>> str_double(5)
      '5 5'
      >>> str_double(None)
      'None None' 
      >>> str_double(True)
      'True True' 
    """





Chapter 6
---------


#.

.. sourcecode:: python

    
    """
      >>> is_prime(3)
      True
      >>> is_prime(6)
      False
      >>> is_prime(2)
      True
      >>> is_prime(9)
      False
      >>> is_prime(19)
      True
      >>> is_prime(53)
      True
      >>> is_prime(55)
      False
    """





Chapter 7
---------


#.

.. sourcecode:: python

    
    """
      >>> s1[4]
      '3'
    """


#.

.. sourcecode:: python

    
    """
      >>> len(message) 
      15
    """


#.

.. sourcecode:: python

    
    """
      >>> s2[4:]
      'Python!'
    """


#.

.. sourcecode:: python

    
    """
      >>> type(s3)
      
      >>> s3[3]
      'q'
      >>> s3[7]
      '3'
      >>> len(s3)
      22
      >>> s3[10:16]
      'cheese'
    """


#.

.. sourcecode:: python

    
    """
      >>> s4 + s5
      'happy birthday!'
      >>> s4 < s5
      True
    """


#.

.. sourcecode:: python

    
    """
      >>> count_letters('a', 'banana')
      3 
      >>> count_letters('b', 'banana')
      1 
      >>> count_letters('n', 'banana')
      2
      >>> count_letters('x', 'banana')
      0
      >>> count_letters('i', 'Mississippi')
      4
    """


#.

.. sourcecode:: python

    
    """
      >>> replace('a', 'i', 'banana')
      'binini' 
      >>> replace('i', 'o', 'Mississippi')
      'Mossossoppo'
      >>> replace('a', '', 'banana')
      'bnn'
      >>> replace('a', 'aba', 'banana')
      'babanabanaba'
    """


#.

.. sourcecode:: python

    
    """
      >>> reverse("Python")
      'nohtyP'
      >>> reverse("Try to say this backwards!")
      '!sdrawkcab siht yas ot yrT'
    """


#.

.. sourcecode:: python

    
    """
      >>> extract_email("This has bill@gmail.com in it.")
      'bill@gmail.com'
      >>> extract_email("Can you find an email address bob@bob.com in this string?")
      'bob@bob.com'
    """





Chapter 8
---------


#.

.. sourcecode:: python

    
    """
      >>> lst1[4]
      3
      >>> lst1[0]
      5
      >>> lst1[2]
      17
    """


#.

.. sourcecode:: python

    
    """
      >>> lst2[1]
      'banana' 
      >>> lst2[0] < lst2[1]
      True 
      >>> lst2[2:]
      ['cherry', 'date', 'elderberry', 'fig', 'grapefruit'] 
    """


#.

.. sourcecode:: python

    
    """
      >>> 43 in lst3
      False 
      >>> 22 in lst3
      True 
      >>> len(lst3)
      5
      >>> lst3[1:3]
      [12, 22]
      >>> lst3[0] < lst3[1]
      True
      >>> lst3[4] < lst3[3]
      False
    """


#.

.. sourcecode:: python

    
    """
      >>> find_sum([3, 1, 1, 0]) 
      5 
      >>> find_sum([1, 2]) 
      3
      >>> find_sum([1, 2, 3, 4, 5, 6]) 
      21 
      >>> find_sum([42]) 
      42
      >>> find_sum([]) 
      0
    """


#.

.. sourcecode:: python

    
    """
      >>> find_max([1, 2, 3, 4]) 
      4
      >>> find_max([4, 3, 2, 1]) 
      4
      >>> find_max([8, 51, 5, 73, 4, 67])
      73
      >>> find_max(['Tsagaank', 'Shitaye', 'Xavier', 'Bao', 'Julia'])
      'Xavier' 
    """


#.

.. sourcecode:: python

    
    """
      >>> only_evens([1, 2, 3, 4, 5, 6, 7, 8])
      [2, 4, 6, 8]
      >>> only_evens([12, 34, 37, 43, 58, 60, 88])
      [12, 34, 58, 60, 88]
      >>> only_evens([12, 34, 36, 44])
      [12, 34, 36, 44]
      >>> only_evens([13, 35, 37, 49])
      []
    """


#.

.. sourcecode:: python

    
    """
      >>> only_odds([1, 2, 3, 4, 5, 6, 7, 8])
      [1, 3, 5, 7]
      >>> only_odds([12, 34, 37, 43, 58, 60, 88])
      [37, 42]
      >>> only_odds([12, 34, 36, 44])
      []
      >>> only_odds([13, 35, 37, 49])
      [13, 35, 37, 49]
    """


#.

.. sourcecode:: python

    
    """
      >>> index_of(12, [4, 8, 12, 16, 20]) 
      2
      >>> index_of(20, [4, 8, 12, 16, 20]) 
      4
      >>> index_of(8, [4, 8, 12, 16, 20]) 
      1
      >>> index_of(9, [4, 8, 12, 16, 20]) 
      -1
      >>> index_of('Bao', ['Tsagaank', 'Shitaye', 'Xavier', 'Bao', 'Julia'])
      3
    """


#.

.. sourcecode:: python

    
    """
      >>> remove_at(0, [5, 4, 3, 2])
      [4, 3, 2] 
      >>> remove_at(2, [5, 4, 3, 2])
      [5, 4, 2] 
      >>> remove_at(4, ['a', 'b', 'c', 'd', 'e', 'f'])
      ['a', 'b', 'c', 'd', 'f']
    """


#.

.. sourcecode:: python

    
    """
      >>> remove_val(3, [5, 4, 3, 2])
      [5, 4, 2]
      >>> remove_val(5, [5, 4, 3, 2])
      [4, 3, 2]
      >>> remove_val('e', ['a', 'b', 'c', 'd', 'e', 'f'])
      ['a', 'b', 'c', 'd', 'f']
      >>> remove_val(6, [5, 4, 3, 2])
      [5, 4, 3, 2]
    """


#.

.. sourcecode:: python

    
    """
      >>> sort_list([3, 7, 1, 8, 2])
      [1, 2, 3, 7, 8]
      >>> sort_list([6, 5, 4, 3, 2, 1])
      [1, 2, 3, 4, 5, 6]
      >>> sort_list(['cherries', 'pears', 'apples', 'bananas', 'apricots'])
      ['apples', 'apricots', 'bananas', 'cherries', 'pears']
    """


#.

.. sourcecode:: python

    
    """
      >>> mean([1, 2])
      1.5
      >>> mean([1, 2, 4, 7])
      3.5
      >>> mean([1, 1, 1, 1, 1])
      1.0
      >>> mean([5, 10, 15, 20, 25])
      15.0
    """


#.

.. sourcecode:: python

    
    """
      >>> median([1, 1, 2, 3, 3])
      2
      >>> median([3, 2, 1, 1, 3])
      2
      >>> median([1, 1, 3, 3])
      2.0
    """


#.

.. sourcecode:: python

    
    """
      >>> mode([1, 2, 2, 3, 4, 5, 6])
      2
      >>> mode([1, 2, 3, 4, 4, 5, 6])
      4
      >>> mode([1, 2, 3, 4, 4, 5, 6, 6, 6, 7])
      6
    """





Chapter 9
---------


#.

.. sourcecode:: python

    
    """
      >>> encapsulate(5, ())
      (5, )
      >>> encapsulate(5, [])
      [5]
      >>> encapsulate(5, '')
      '5'
      >>> encapsulate('bob', (1, 2))
      ('bob', )
      >>> encapsulate((1, 2), ['a', 'b', 'c'])
      [(1, 2)]
    """


#.

.. sourcecode:: python

    
    """
      >>> insert_at_end(3, (1, 2))
      (1, 2, 3)
      >>> insert_at_end(3, [1, 2])
      [1, 2, 3]
      >>> insert_at_end(3, 'ab')
      'ab3'
    """


#.

.. sourcecode:: python

    
    """
      >>> insert_in_front('x', 'ab')
      'xab'
      >>> insert_in_front('x', (1, 2))
      ('x', 1, 2)
      >>> insert_in_front('x', [1, 2])
      ['x', 1, 2]
    """





Chapter 10
----------


#.

.. sourcecode:: python

    
    """
      >>> d1 = make_dictionary([('this', 'that')])
      >>> d1
      {'this': 'that'}
      >>> d2 = make_dictionary([('this', 'that'), ('some', 'other'), (4, 'cheese')])
      >>> d2.has_key('some')
      True
      >>> d2.has_key('other')
      False
      >>> d2[4]
      'cheese'
    """





