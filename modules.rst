..  Copyright (C)  Jeffrey Elkner, Peter Wentworth, Allen B. Downey, Chris
    Meyers, and Dario Mitchell.  Permission is granted to copy, distribute
    and/or modify this document under the terms of the GNU Free Documentation
    License, Version 1.3 or any later version published by the Free Software
    Foundation; with Invariant Sections being Forward, Prefaces, and
    Contributor List, no Front-Cover Texts, and no Back-Cover Texts.  A copy of
    the license is included in the section entitled "GNU Free Documentation
    License".
 
Modules and Getting Help
========================

Modules
-------

A **module** is a file containing Python definitions and statements intended
for use in other Python programs. There are many Python modules that come with
Python as part of the **standard library**. We have already used one of these quite extensively,
the ``turtle`` module.  Recall that once we import the module, we can use things
that are defined inside.


.. activecode:: chmod_01
    :nopre:

    import turtle            # allows us to use the turtles library

    wn = turtle.Screen()     # creates a graphics window
    alex = turtle.Turtle()   # create a turtle named alex

    alex.forward(150)        # tell alex to move forward by 150 units
    alex.left(90)            # turn by 90 degrees
    alex.forward(75)         # complete the second side of a rectangle
    wn.exitonclick()


Here we are using ``Screen`` and ``Turtle``, both of which are defined inside the turtle module.

But what if no one had told us about turtle?  How would we know
that it exists. How would we know what it can do for us? The answer is to ask for help and the best place to get 
help about the Python programming environment is to consult with the Python Documentation.


The  `Python Documentation <http://docs.python.org/py3k/>`_ site for Python version 3 (the home page is shown below) is an extremely useful reference
for all aspects of Python.  
The site contains 
a listing of all the standard modules that are available with Python 
(see `Global Module Index <http://docs.python.org/py3k/py-modindex.html>`_).  
You will also see that there is a `Language Reference <http://docs.python.org/py3k/reference/index.html>`_, 
a `Tutorial <http://docs.python.org/py3k/tutorial/index.html>`_, as well as 
installation instructions, how-tos, and frequently asked questions.  We encourage you to become familiar with this site
and to use it often.



.. image:: illustrations/chmodules/pythondocmedium.png

If you have not done so already, take a look at the Module Index.  Here you will see an alphabetical listing of all
the modules that are available as part of the standard library.  Find the turtle module.

.. image:: illustrations/chmodules/moduleindexmedium.png

.. image:: illustrations/chmodules/turtlemodmedium.png

You can see that all the turtle functionality that we have talked about is there.  However, there is so much more.  Take some time to read through and familiarize yourself with some of the other things that turtles can do.

We will now turn our attention to a few other modules that you might find useful.


The `math` module
-----------------

The ``math`` module contains the kinds of mathematical functions you'd typically find on your
calculator and some mathematical constants
like `pi` and `e`.

.. activecode:: chmodule_02

    import math

    print(math.pi)
    print(math.e)    

    print(math.sqrt(2.0))

    print(math.sin(math.pi/2))   # sin of 90 degrees (pi/2 radians)
    
 
..  Like almost all other programming languages, angles are expressed in *radians*
.. rather than degrees.  There are two functions ``radians`` and ``degrees`` to
.. convert between the two popular ways of measuring angles.

Notice another difference between this module and our use of ``turtle``.
In  ``turtle`` we create objects (either ``Turtle`` or ``Screen``) and call methods on those objects.  Remember that
a turtle is a data object (recall ``alex`` and ``tess``).  We need to create one in order to use it.
 

Mathematical functions, on the other hand, are not objects.  They do not remember anything about themselves.  They simply
perform a task.
They are all housed together in a module called `math`.  If you have not done so already, take a look at the documentation
for the math module.  


The `random` module
-----------------------------------

We often want to use **random numbers** in programs.  Here are a few typical uses:

* To play a game of chance where the computer needs to throw some dice, pick a number, or flip a coin,
* To shuffle a deck of playing cards randomly,
* To randomly allow a new enemy spaceship to appear and shoot at you,
* To simulate possible rainfall when we make a computerized model for
  estimating the environmental impact of building a dam,
* For encrypting your banking session on the Internet.
  
Python provides a module ``random`` that helps with tasks like this.  You can
take a look at it in the documentation.  Here are the key things we can do with it.

.. activecode:: chmodule_rand

    import random
    
    prob = random.random()
    print(prob)

    diceThrow = random.randrange(1,7)       # return an int, one of 1,2,3,4,5,6
    print(diceThrow)

Press the run button a number of times.  Note that the values change each time.  These are random numbers.
    
The ``randrange`` function generates an integer between its lower and upper
argument, using the same semantics as ``range`` --- so the lower bound is included, but
the upper bound is excluded.   All the values have an equal probability of occurring  
(i.e. the results are *uniformly* distributed). 

The ``random()`` function returns a floating point number in the range [0.0, 1.0) --- the
square bracket means "closed interval on the left" and the round parenthesis means
"open interval on the right".  In other words, 0.0 is possible, but all returned
numbers will be strictly less than 1.0.  It is usual to *scale* the results after
calling this method, to get them into a range suitable for your application.  

.. activecode:: chmodule_rand2

    import random
    
    prob = random.random()
    result = prob * 5
    print(result)



In the
case shown here, we've converted the result of the method call to a number in
the range [0.0, 5.0).  Once more, these are uniformly distributed numbers --- numbers
close to 0 are just as likely to occur as numbers close to 0.5, or numbers close to 1.0.
If you continue to press the run button you will see random values between 0.0 and up to but not including 5.0.


.. index:: deterministic algorithm,  algorithm; deterministic, unit tests   
   
It is important to note that
random number generators are based on a **deterministic** algorithm --- repeatable and predictable.
So they're called **pseudo-random** generators --- they are not genuinely random.
They start with a *seed* value. Each time you ask for another random number, you'll get
one based on the current seed attribute, and the state of the seed (which is one
of the attributes of the generator) will be updated.  The good news is that each time you run your program, the seed value
is likely different meaning that even though the random numbers are being created algorithmically, you will likely
get random behavior each time you execute.




Glossary
--------

.. glossary::



         
    module
        A file containing Python definitions and statements intended for use in
        other Python programs. The contents of a module are made available to
        the other program by using the *import* statement.
        

    documentation
        A place where you can go to get detailed information about aspects of your
        programming language.

    random number generator
		A function that will provide you with random numbers, usually between 0 and 1.

Exercises
---------
