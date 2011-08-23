..  Copyright (C) 2011  Brad Miller and David Ranum
    Permission is granted to copy, distribute
    and/or modify this document under the terms of the GNU Free Documentation
    License, Version 1.3 or any later version published by the Free Software
    Foundation; with Invariant Sections being Forward, Prefaces, and
    Contributor List, no Front-Cover Texts, and no Back-Cover Texts.  A copy of
    the license is included in the section entitled "GNU Free Documentation
    License".



Experimenting With the 3n+1 Sequence
====================================


In this lab we will try to gain a bit more information about the 3n+1 sequence.  We will start with the code from the chapter and make modifications.  Here is the function so far.


.. activecode:: seq3nlab1
    
    def seq3np1(n):
        """ Print the 3n+1 sequence from n, terminating when it reaches 1."""

        while n != 1:
            print(n)
            if n % 2 == 0:        # n is even
                n = n // 2
            else:                 # n is odd
                n = n * 3 + 1
        print(n)                  # the last print is 1

    seq3np1(3)


#. Count the number of iterations it takes to stop.

	Our program currently **prints** the values in the sequence until it stops at 1.  Remember that one of the interesting
	questions is `How many items are in the sequence before stopping at 1?`.  To determine this, we will need to count them.

	First, comment out (or delete) the print statements that currently exist.  Now we will need a local variable to keep track of the count.  It would make sense to call it `count`.  It will need to be initialized to 0 since before we begin the loop.

	Once inside the loop, we will need to update ``count`` by 1 (increment), so that we can keep track of the number of iterations.  It is very important that you put these statements in the right place.  Notice that the previous location of the print statements can be very helpful in determining the location.

	When the loop terminates (we get to 1), **return** the value of ``count``.

	This demonstrates an important pattern of computation called a **counter** (note that it is
	a type of accumulator).
	The variable ``count`` is initialized to 0 and then incremented each time the
	loop body is executed. When the loop exits, ``count`` contains the result ---
	the total number of times the loop body was executed.

	Since the function now returns a value, we will need to call the function inside of a print statement in order to see the result.




#. Repeat the call to ``seq3np1`` using a range of values, up to and including an upper bound.

	Now that we have a function that can return the number of iterations required to get to 1, we can use it to check a wide range of starting values.  In fact, instead of just doing one value at a time, we can call the function iteratively, each time passing in a new value.

	Create a simple for loop using a loop variable called ``start`` that provides values from 1 up to 50.  Call the ``seq3np1`` function once for each value of ``start``.  Modify the print statement to also print the value of ``start``.

#. Keep track of the maximum number of iterations.

	Scanning this list of results causes us to ask the following question: `What is the longest sequence?` The easiest way to compute this is to keep track of the largest count seen so far.  Each time we generate a new count, we check to see if it is larger than what we think is the largest.  If it is greater, we update our largest so far and go on to the next count.
	At the end of the process, the largest seen so far is the largest of all.

	Create a variable call ``maxSoFar`` and initialize it to zero.  Place this initialization outside the **for loop** so that it only happens once.  Now, inside the for loop, modify the code so that instead of printing the result of the ``seq3np1`` function, we save it in a variable, call it ``result``.  Then we can check ``result`` to see if it is greater than ``maxSoFar``.  If so, update ``maxSoFar``.

Experiment with different ranges of starting values.
