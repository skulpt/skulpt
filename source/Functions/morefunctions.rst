..  Copyright (C)  Jeffrey Elkner, Peter Wentworth, Allen B. Downey, Chris
    Meyers, and Dario Mitchell.  Permission is granted to copy, distribute
    and/or modify this document under the terms of the GNU Free Documentation
    License, Version 1.3 or any later version published by the Free Software
    Foundation; with Invariant Sections being Forward, Prefaces, and
    Contributor List, no Front-Cover Texts, and no Back-Cover Texts.  A copy of
    the license is included in the section entitled "GNU Free Documentation
    License".
    
..  shortname:: MoreAboutFunctions
..  description:: This module contains more details about functions

Functions Revisited
===================

.. index:: return statement, return value, temporary variable,
           dead code, None, unreachable code

.. index::
    single: value 
    single: variable; temporary 


.. index:: scaffolding, incremental development

Program Development
-------------------

At this point, you should be able to look at complete functions and tell what
they do. Also, if you have been doing the exercises, you have written some
small functions. As you write larger functions, you might start to have more
difficulty, especially with runtime and semantic errors.

To deal with increasingly complex programs, we are going to suggest a technique
called **incremental development**. The goal of incremental development is to
avoid long debugging sessions by adding and testing only a small amount of code
at a time.

As an example, suppose you want to find the distance between two points, given
by the coordinates (x\ :sub:`1`\ , y\ :sub:`1`\ ) and
(x\ :sub:`2`\ , y\ :sub:`2`\ ).  By the Pythagorean theorem, the distance is:

.. image:: Figures/distance_formula.png
   :alt: Distance formula 

The first step is to consider what a ``distance`` function should look like in
Python. In other words, what are the inputs (parameters) and what is the output
(return value)?

In this case, the two points are the inputs, which we can represent using four
parameters. The return value is the distance, which is a floating-point value.

Already we can write an outline of the function that captures our thinking so far.

.. sourcecode:: python
    
    def distance(x1, y1, x2, y2):
        return 0.0

Obviously, this version of the function doesn't compute distances; it always
returns zero. But it is syntactically correct, and it will run, which means
that we can test it before we make it more complicated.

To test the new function, we call it with sample values.


.. activecode:: ch06_distance1
    
    def distance(x1, y1, x2, y2):
        return 0.0

    print(distance(1, 2, 4, 6))


We chose these values so that the horizontal distance equals 3 and the vertical
distance equals 4; that way, the result is 5 (the hypotenuse of a 3-4-5
triangle). When testing a function, it is useful to know the right answer.

At this point we have confirmed that the function is syntactically correct, and
we can start adding lines of code. After each incremental change, we test the
function again. If an error occurs at any point, we know where it must be --- in
the last line we added.

A logical first step in the computation is to find the differences
x\ :sub:`2`\ - x\ :sub:`1`\  and y\ :sub:`2`\ - y\ :sub:`1`\ .  We will store
those values in temporary variables named ``dx`` and ``dy``.

.. sourcecode:: python
    
    def distance(x1, y1, x2, y2):
        dx = x2 - x1
        dy = y2 - y1
        return 0.0


Next we compute the sum of squares of ``dx`` and ``dy``.

.. sourcecode:: python
    
    def distance(x1, y1, x2, y2):
        dx = x2 - x1
        dy = y2 - y1
        dsquared = dx**2 + dy**2
        return 0.0

Again, we could run the program at this stage and check the value of ``dsquared`` (which
should be 25).

Finally, using the fractional exponent ``0.5`` to find the square root,
we compute and return the result.

.. activecode:: ch06_distancefinal
    
    def distance(x1, y1, x2, y2):
        dx = x2 - x1
        dy = y2 - y1
        dsquared = dx**2 + dy**2
        result = dsquared**0.5
        return result

    print(distance(1, 2, 4, 6))


If that works correctly, you are done. Otherwise, you might want to print the
value of ``result`` before the return statement.

When you start out, you might add only a line or two of code at a time. As you
gain more experience, you might find yourself writing and debugging bigger
conceptual chunks. As you improve your programming skills you should find yourself
managing bigger and bigger chunks: this is very similar to the way we learned to read
letters, syllables, words, phrases, sentences, paragraphs, etc., or the way we learn
to chunk music --- from indvidual notes to chords, bars, phrases, and so on.  

The key aspects of the process are:

#. Start with a working skeleton program and make small incremental changes. At any
   point, if there is an error, you will know exactly where it is.
#. Use temporary variables to hold intermediate values so that you can easily inspect
   and check them.
#. Once the program is working, you might want to consolidate multiple statements 
   into compound expressions,
   but only do this if it does not make the program more difficult to read.

   
.. index:: composition, function composition

Composition
-----------

As we have already seen, you can call one function from within another.
This ability is called **composition**.

As an example, we'll write a function that takes two points, the center of the
circle and a point on the perimeter, and computes the area of the circle.

Assume that the center point is stored in the variables ``xc`` and ``yc``, and
the perimeter point is in ``xp`` and ``yp``. The first step is to find the
radius of the circle, which is the distance between the two points.
Fortunately, we've just written a function, ``distance``, that does just that,
so now all we have to do is use it:

.. sourcecode:: python
    
    radius = distance(xc, yc, xp, yp)

The second step is to find the area of a circle with that radius and return it.
Again we will use one of our earlier functions:

.. sourcecode:: python
    
    result = area(radius)
    return result

Wrapping that up in a function, we get:

.. activecode:: ch06_newarea
    
    def distance(x1, y1, x2, y2):
	    dx = x2 - x1
	    dy = y2 - y1
	    dsquared = dx**2 + dy**2
	    result = dsquared**0.5
	    return result

    def area(radius):
        b = 3.14159 * radius**2
        return b

    def area2(xc, yc, xp, yp):
        radius = distance(xc, yc, xp, yp)
        result = area(radius)
        return result

    print(area2(0,0,1,1))



We called this function ``area2`` to distinguish it from the ``area`` function
defined earlier. There can only be one function with a given name within a
module.

Note that we could have written the composition without storing the intermediate results.

.. sourcecode:: python
    
    def area2(xc, yc, xp, yp):
        return area(distance(xc, yc, xp, yp))


.. index:: boolean function

Boolean Functions
-----------------

Functions can return boolean values, which is often convenient for hiding
complicated tests inside functions. For example:

.. activecode:: ch06_boolfun1
    
    def isDivisible(x, y):
        if x % y == 0:
            return True 
        else:
            return False 

    print(isDivisible(10,5))

The name of this function is ``isDivisible``. It is common to give **boolean
functions** names that sound like yes/no questions.  ``isDivisible`` returns
either ``True`` or ``False`` to indicate whether the ``x`` is or is not
divisible by ``y``.

We can make the function more concise by taking advantage of the fact that the
condition of the ``if`` statement is itself a boolean expression. We can return
it directly, avoiding the ``if`` statement altogether:

.. sourcecode:: python
    
    def isDivisible(x, y):
        return x % y == 0


Boolean functions are often used in conditional statements:

.. sourcecode:: python
    
    if isDivisible(x, y):
        ... # do something ...
    else:
        ... # do something else ...

It might be tempting to write something like:

.. sourcecode:: python
    
    if isDivisible(x, y) == True:


but the extra comparison is unnecessary.

.. activecode:: ch06_boolfun2
    
    def isDivisible(x, y):
        if x % y == 0:
            return True 
        else:
            return False 

    if isDivisible(10,5):
        print("That works")
    else:
        print("Those values are no good")


Try a few other pairs of values to see the results.

.. index:: style

Programming With Style
----------------------

Readability is very important to programmers, since in practice programs are
read and modified far more often then they are written.  

.. All the code examples
.. in this book will be consistent with the *Python Enhancement Proposal 8*
.. (`PEP 8 <http://www.python.org/dev/peps/pep-0008/>`__), a style guide developed by the Python community.

We'll have more to say about style as our programs become more complex, but a
few pointers will be helpful already:

* use 4 spaces for indentation
* imports should go at the top of the file
* separate function definitions with two blank lines
* keep function definitions together
* keep top level statements, including function calls, together at the
  bottom of the program


Glossary
--------

.. glossary::


    chatterbox function
        A function which interacts with the user (using ``input`` or ``print``) when
        it should not. Silent functions that just convert their input arguments into
        their output results are usually the most useful ones.
        
    composition (of functions)
        Calling one function from within the body of another, or using the
        return value of one function as an argument to the call of another.

    dead code
        Part of a program that can never be executed, often because it appears
        after a ``return`` statement.

    fruitful function
        A function that yields a return value instead of ``None``.

    incremental development
        A program development plan intended to simplify debugging by adding and
        testing only a small amount of code at a time.

    None
        A special Python value. One use in Python is that it is returned 
        by functions that do not execute a return statement with a return argument. 

    return value
        The value provided as the result of a function call.

    scaffolding
        Code that is used during program development to assist with development
        and debugging. The unit test code that we added in this chapter are
        examples of scaffolding.
        
    temporary variable
        A variable used to store an intermediate value in a complex
        calculation.
       



Exercises
---------


#. Write a function ``to_secs`` that converts hours, minutes and seconds to 
   a total number of seconds.  
       
#. Extend ``to_secs`` so that it can cope with real values as inputs.  It
   should always return an integer number of seconds (truncated towards zero):

       
#. Write three functions that are the "inverses" of ``to_secs``:
   
   #. ``hours_in`` returns the whole integer number of hours
      represented by a total number of seconds.
      
   #. ``minutes_in`` returns the whole integer number of left over minutes
      in a total number of seconds, once the hours
      have been taken out.
      
   #. ``seconds_in`` returns the left over seconds
      represented by a total number of seconds.
      
   You may assume that the total number of seconds passed to these functions is an integer.
       
       
#. Write a ``compare`` function that returns ``1`` if ``a > b``, ``0`` if
   ``a == b``, and ``-1`` if ``a < b``.


#. Write a function called ``hypotenuse`` that
   returns the length of the hypotenuse of a right triangle given the lengths
   of the two legs as parameters.
    

 
#. Write a function ``slope(x1, y1, x2, y2)`` that returns the slope of
   the line through the points (x1, y1) and (x2, y2).

   Then use a call to ``slope`` in a new function named
   ``intercept(x1, y1, x2, y2)`` that returns the y-intercept of the line
   through the points ``(x1, y1)`` and ``(x2, y2)``.


 

#. Write the function ``f2c(t)`` designed to return the
   degrees Celsius for given temperature in
   Fahrenheit.
    


#. Now do the opposite: write the function ``c2f`` which converts Celcius to Fahrenheit.


