..  Copyright (C)  Jeffrey Elkner, Peter Wentworth, Allen B. Downey, Chris
    Meyers, and Dario Mitchell.  Permission is granted to copy, distribute
    and/or modify this document under the terms of the GNU Free Documentation
    License, Version 1.3 or any later version published by the Free Software
    Foundation; with Invariant Sections being Forward, Prefaces, and
    Contributor List, no Front-Cover Texts, and no Back-Cover Texts.  A copy of
    the license is included in the section entitled "GNU Free Documentation
    License".

Iteration Revisited
===================

.. index:: iteration, assignment, assignment statement, reassignment

.. index::
    single: statement; assignment
   
    
Computers are often used to automate repetitive tasks. Repeating identical or
similar tasks without making errors is something that computers do well and
people do poorly.

Repeated execution of a sequence of statements is called **iteration**.  Because
iteration is so common, Python provides several language features to make it
easier. We've already seen the ``for`` statement in chapter 3.  This is a very common 
form of iteration in Python. In this chapter
we are also going to look at the ``while`` statement --- another way to have your
program do iteration.


.. index:: for loop

The ``for`` loop revisited
--------------------------

Recall that the ``for`` loop processes each item in a list.  Each item in
turn is (re-)assigned to the loop variable, and the body of the loop is executed.
We saw this example in an earlier chapter.

.. activecode:: ch07_for1

    for f in ["Joe", "Amy", "Brad", "Angelina", "Zuki", "Thandi", "Paris"]:
        invitation = "Hi " + f + ".  Please come to my party on Saturday!"
        print(invitation) 
        
Running through all the items in a list is called **traversing** the list
or sometimes just **traversal**.      


The ``while`` Statement
-----------------------

Here is a program that demonstrates the use of the ``while`` statement:

.. activecode:: ch07_while1
    
    def sumTo(aBound):
        """ Return the sum of 1+2+3 ... n """
        
        theSum  = 0
        aNumber = 1
        while aNumber <= aBound:
            theSum = theSum + aNumber
            aNumber = aNumber + 1
        return theSum
        
    print(sumTo(4))
    print(sumTo(1000))



You can almost read the ``while`` statement as if it were in natural language. It means,
while ``aNumber`` is less than or equal to ``aBound``, continue executing the body of the loop. Within
the body, each time, increment ``aNumber``. When ``aNumber`` passes ``aBound``, return your accumulated sum.

.. note:: The names of the variables have been chosen to help readability.  

More formally, here is the flow of execution for a ``while`` statement:

#. Evaluate the condition, yielding ``False`` or ``True``.
#. If the condition is ``False``, exit the ``while`` statement and continue
   execution at the next statement.
#. If the condition is ``True``, execute each of the statements in the body and
   then go back to step 1.

The body consists of all of the statements below the header with the same
indentation.

This type of flow is called a **loop** because the third step loops back around
to the top. Notice that if the condition is ``False`` the first time through the
loop, the statements inside the loop are never executed.

The body of the loop should change the value of one or more variables so that
eventually the condition becomes ``False`` and the loop terminates. Otherwise the
loop will repeat forever. This is called an **infinite loop**. 
An endless
source of amusement for computer scientists is the observation that the
directions on shampoo, lather, rinse, repeat, are an infinite loop.

In the case shown above, we can prove that the loop terminates because we
know that the value of ``n`` is finite, and we can see that the value of ``v``
increments each time through the loop, so eventually it will have to exceed ``n``. In
other cases, it is not so easy to tell.  

.. note::

	Introduction of the while statement causes us to think about the types of iteration we have seen.  The ``for`` statement will always iterate through a sequence of values like the list of names for the party or the list of numbers created by ``range``.  Since we know that it will iterate once for each value in the collection, it is often said that a ``for`` loop creates a
	**definite iteration** because we definitely know how many times we are going to iterate.  On the other
	hand, the ``while`` statement is dependent on a condition that needs to evaluate to ``False`` in order 
	for the loop to terminate.  Since we do not necessarily know when this will happen, it creates what we
	call **indefinite iteration**.  Indefinite iteration simply means that we don't know how many times we will repeat but eventually the condition controlling the iteration will fail and the iteration will stop. (Unless we have an infinite loop which is of course a problem)

What you will notice here is that the ``while`` loop is more work for
you --- the programmer --- than the equivalent ``for`` loop.  When using a ``while``
loop you have to control the loop variable yourself.  You give it an initial value, test
for completion, and then make sure you change something in the body so that the loop
terminates.  By comparison, here is an alternative function that uses ``for`` instead: 

.. activecode:: ch07_altsum

    def sumTo(aBound):
        """ Return the sum of 1+2+3 ... n """
        theSum  = 0
        for aNumber in range(aBound + 1):
            theSum = theSum + aNumber
        return theSum

    print(sumTo(10))


Notice the slightly tricky call to the ``range`` function --- we had to add one onto ``n``
because ``range`` generates its list up to but not including the value you give it.  
It would be easy to make a programming mistake and overlook this. 
        
So why have two kinds of loop if ``for`` looks easier?  This next example shows an indefinite iteration where
we need the extra power that we get from the ``while`` loop.        
        
.. index:: 3n + 1 sequence        
        
The 3n + 1 Sequence
-------------------

Let's look at a simple sequence that has fascinated mathematicians for many years.
They still cannot answer even quite simple questions about it.  

The rule is to start from
some given ``n``, and to generate
the next term of the sequence from ``n``, either by halving ``n``, 
whenever ``n`` is even, or else by multiplying it by three and adding 1 .  The sequence
terminates when ``n`` reaches 1. 

This Python function captures that algorithm.

.. activecode:: ch07_indef1
    
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


    
                
The condition for this loop is ``n != 1``.  The loop will continue running until
``n`` is ``1`` (which will make the condition false).

Each time through the loop, the program outputs the value of ``n`` and then
checks whether it is even or odd. If it is even, the value of ``n`` is divided
by 2 using integer division. If it is odd, the value is replaced by ``n * 3 + 1``.  
Try some other examples.
    
Since ``n`` sometimes increases and sometimes decreases, there is no obvious
proof that ``n`` will ever reach 1, or that the program terminates. For some
particular values of ``n``, we can prove termination. For example, if the
starting value is a power of two, then the value of ``n`` will be even each
time through the loop until it reaches 1. 

You might like to have some fun and see if you can find a small starting 
number that needs more than a hundred steps before it terminates. 

Particular values aside, the interesting question is whether we can prove that
this sequence terminates for *all* values of ``n``. So far, no one has been able
to prove it *or* disprove it!   

Think carefully about what would be needed for a proof or disproof of the hypothesis
*"All positive integers will eventually converge to 1"*.  With fast computers we have
been able to test every integer up to very large values, and so far, they all 
eventually end up at 1.  But this doesn't mean that there might not be some
as-yet untested number which does not reduce to 1.   

You'll notice that if you don't stop when you reach one, the sequence gets into
its own loop:  1, 4, 2, 1, 4, 2, 1, 4, and so on.  One possibility is that there might
be other cycles that we just haven't found.  

.. admonition:: Choosing between ``for`` and ``while``

   Use a ``for`` loop if you know the maximum number of times that you'll
   need to execute the body.  For example, if you're traversing a list of elements,
   or can formulate a suitable call to ``range``, then choose the ``for`` loop.

   So any problem like "iterate this weather model run for 1000 cycles", or "search this
   list of words", "check all integers up to 10000 to see which are prime" suggest that a ``for`` loop is best.

   By contrast, if you are required to repeat some computation until some condition is 
   met, as we did in this 3n + 1 problem, you'll need a ``while`` loop. 

   As we noted before, the first case is called **definite iteration** --- we have some definite bounds for 
   what is needed.   The latter case is called **indefinite iteration** --- we are not sure
   how many iterations we'll need --- we cannot even establish an upper bound!    


.. index:: program tracing, hand trace, tracing a program

Tracing a program
-----------------

To write effective computer programs a programmer needs to develop the ability
to **trace** the execution of a computer program as it is being executed. Tracing involves becoming the
computer and following the flow of execution through a sample program run,
recording the state of all variables and any output the program generates after
each instruction is executed.

To understand this process, let's trace the call to ``seq3np1(3)`` from the
previous section. At the start of the trace, we have a local variable, ``n``
(the parameter), with an initial value of 3. Since 3 is not equal to 1, the
``while`` loop body is executed. 3 is printed and ``3 % 2 == 0`` is evaluated.
Since it evaluates to ``False``, the ``else`` branch is executed and
``3 * 3 + 1`` is evaluated and assigned to ``n``.

To keep track of all this as you hand trace a program, make a column heading on
a piece of paper for each variable created as the program runs and another one
for output. Our trace so far would look something like this::
    
    n               output printed so far
    --              ---------------------
    3               3, 
    10

Since ``10 != 1`` evaluates to ``True``, the loop body is again executed,
and 10 is printed. ``10 % 2 == 0`` is true, so the ``if`` branch is
executed and ``n`` becomes 5. By the end of the trace we have::

      n               output printed so far
      --              ---------------------
      3               3,
      10              3, 10,
      5               3, 10, 5,
      16              3, 10, 5, 16,
      8               3, 10, 5, 16, 8,
      4               3, 10, 5, 16, 8, 4,
      2               3, 10, 5, 16, 8, 4, 2,
      1               3, 10, 5, 16, 8, 4, 2, 1.

Tracing can be a bit tedious and error prone (that's why we get computers to do
this stuff in the first place!), but it is an essential skill for a programmer
to have. From this trace we can learn a lot about the way our code works. We
can observe that as soon as n becomes a power of 2, for example, the program
will require log\ :sub:`2`\ (n) executions of the loop body to complete. We can
also see that the final 1 will not be printed as output within the body of the loop,
which is why we put the special ``print`` function at the end. 



.. There are also some great visualization tools becoming available to help you 
.. trace and understand small fragments of Python code.  The one we recommend is at 
.. http://netserv.ict.ru.ac.za/python3_viz 



.. _counting:

Counting Digits
---------------

The following function counts the number of decimal digits in a positive
integer.  The function works by continually dividing the number by 10 until it is not
possible to do so any longer.  This is another example of indefinite iteration since we
do not know how many divisions will be necessary ahead of time.

.. activecode:: ch07_digits1

    def numDigits(n):
        count = 0
        while n > 0:
            count = count + 1
            n = n // 10
        return count

    print(numDigits(710))

    
As you can see, a call to ``print(num_digits(710))`` will display ``3``. Trace the execution of this
function call on a piece of paper to convince yourself that it works.

This function also demonstrates an important pattern of computation called a **counter** (note that it is
a type of accumulator).
The variable ``count`` is initialized to 0 and then incremented each time the
loop body is executed. When the loop exits, ``count`` contains the result ---
the total number of times the loop body was executed, which is the same as the
number of digits.

If we wanted to only count digits that are either 0 or 5, adding a conditional
before incrementing the counter will do the trick:

.. activecode:: ch07_digits2
    
    def numZeroAndFiveDigits(n):
        count = 0
        while n > 0:
            digit = n % 10
            if digit == 0 or digit == 5:
                count = count + 1
            n = n // 10
        return count

    print(numZeroAndFiveDigits(1055030250))

.. index:: abbreviated assignment    
    

.. index::
    single: Newton's method

Newton's Method
---------------

Loops are often used in programs that compute numerical results by starting
with an approximate answer and iteratively improving it.

For example, one way of computing square roots is Newton's method.  Suppose
that you want to know the square root of ``n``. If you start with almost any
approximation, you can compute a better approximation with the following
formula:

.. sourcecode:: python
    
    better =  1/2 * (approx + n/approx)
    
Execute this algorithm a few times using your calculator.  Can you
see why each iteration brings your estimate a little closer?  One of the amazing
properties of this particular algorithm is how quickly it converges to an accurate
answer.    

The following implementation of Newton's method requires two parameters.  The first is the
value whose square root will be approximated.  The second is the number of times to iterate the
calculation yielding a better result.

.. activecode:: chp07_newtonsdef
    
    def newtonSqrt(n, howmany):
        approx = n/2
        for i in range(howmany):
            betterapprox = 1/2 * (approx + n/approx)
            approx = betterapprox
        return betterapprox

    print(newtonSqrt(10,3))
    print(newtonSqrt(10,5))
    print(newtonSqrt(10,10))



By repeatedly applying this formula until the better approximation gets close
enough to the previous one, we can write a function for computing the square root.  This implementation
uses a ``while`` to execute until the approximation is no longer changing.

.. activecode:: chp07_newtonswhile
    
    def newtonSqrt(n):
        approx = n/2
        better = 1/2 * (approx + n/approx)
        while  better !=  approx:
            approx = better
            better = 1/2 * (approx + n/approx)
        return approx

    print(newtonSqrt(10))
    print(newtonSqrt(100))
    print(newtonSqrt(46))


.. note::

	The ``while`` statement shown above uses comparison of two floating point numbers in the condition.  Since floating point numbers are themselves approximation of real numbers in mathematics, it is often
	better to compare for a result that is within some small threshold of the value you are looking for.

.. index:: algorithm 

Algorithms Revisited
--------------------

Newton's method is an example of an **algorithm**: it is a mechanical process
for solving a category of problems (in this case, computing square roots).

It is not easy to define an algorithm. It might help to start with something
that is not an algorithm. When you learned to multiply single-digit numbers,
you probably memorized the multiplication table.  In effect, you memorized 100
specific solutions. That kind of knowledge is not algorithmic.

But if you were lazy, you probably cheated by learning a few tricks.  For
example, to find the product of n and 9, you can write n - 1 as the first digit
and 10 - n as the second digit. This trick is a general solution for
multiplying any single-digit number by 9. That's an algorithm!

Similarly, the techniques you learned for addition with carrying, subtraction
with borrowing, and long division are all algorithms. One of the
characteristics of algorithms is that they do not require any intelligence to
carry out. They are mechanical processes in which each step follows from the
last according to a simple set of rules.

On the other hand, understanding that hard problems can be solved by step-by-step
algorithmic processess is one of the major simplifying breakthroughs that has 
had enormous benefits.  So while the execution of the algorithm
may be boring and may require no intelligence, algorithmic or computational 
thinking is having a vast impact.  It is the process of designing algorithms that is interesting,
intellectually challenging, and a central part of what we call programming.

Some of the things that people do naturally, without difficulty or conscious
thought, are the hardest to express algorithmically.  Understanding natural
language is a good example. We all do it, but so far no one has been able to
explain *how* we do it, at least not in the form of a step-by-step mechanical 
algorithm.




.. index:: table, logarithm, Intel, Pentium, escape sequence, tab, newline,
           cursor

Simple Tables
-------------

One of the things loops are good for is generating tabular data.  Before
computers were readily available, people had to calculate logarithms, sines and
cosines, and other mathematical functions by hand. To make that easier,
mathematics books contained long tables listing the values of these functions.
Creating the tables was slow and boring, and they tended to be full of errors.

When computers appeared on the scene, one of the initial reactions was, *"This is
great! We can use the computers to generate the tables, so there will be no
errors."* That turned out to be true (mostly) but shortsighted. Soon thereafter,
computers and calculators were so pervasive that the tables became obsolete.

Well, almost. For some operations, computers use tables of values to get an
approximate answer and then perform computations to improve the approximation.
In some cases, there have been errors in the underlying tables, most famously
in the table the Intel Pentium processor chip used to perform floating-point division.

Although a log table is not as useful as it once was, it still makes a good
example of iteration. The following program outputs a sequence of values in the
left column and 2 raised to the power of that value in the right column:

.. activecode:: ch07_table1

    print("n",'\t',"2**n")     #table column headings
    print("---",'\t',"-----")   
 
    for x in range(13):        # generate values for columns
        print(x, '\t', 2**x)

The string ``'\t'`` represents a **tab character**. The backslash character in
``'\t'`` indicates the beginning of an **escape sequence**.  Escape sequences
are used to represent invisible characters like tabs and newlines. The sequence
``\n`` represents a **newline**.

An escape sequence can appear anywhere in a string.  In this example, the tab
escape sequence is the only thing in the string. How do you think you represent
a backslash in a string?

As characters and strings are displayed on the screen, an invisible marker
called the **cursor** keeps track of where the next character will go. After a
``print`` function, the cursor normally goes to the beginning of the next
line.

The tab character shifts the cursor to the right until it reaches one of the
tab stops. Tabs are useful for making columns of text line up, as in the output
of the previous program.
Because of the tab characters between the columns, the position of the second
column does not depend on the number of digits in the first column.



.. index::
    single: local variable
    single: variable; local



2-Dimensional Iteration: Image Processing
-----------------------------------------

Two dimensional tables have both rows and columns.  You have probably seen many tables like this if you have used a
spreadsheet program.  Another object that is organized in rows and columns is a digital image.  In this section we will
explore how iteration allows us to manipulate these images.

A **digital image** is a finite collection of small, discrete picture elements called **pixels**.  These pixels are organized in a two-dimensional grid.  Each pixel represents the smallest amount of picture information that is
available.  Sometimes these pixels appear as small "dots".

Each image (grid of pixels) has its own width and its own height.  The width is the number of columns and the height is the number of rows.  We can name the pixels in the grid by using the column number and row number.  However, it is very important to remember
that computer scientists like to start counting with 0!  This means that if there are 20 rows, they will be named 0,1,2, and so on thru 19.  This will be very useful later when we iterate using range.


In the figure below, the pixel of interest is found at column **c** and row **r**.

.. image:: illustrations/imageprocessing/image.png

The RGB Color Model
^^^^^^^^^^^^^^^^^^^

Each pixel of the image will represent a single color.  The specific color depends on a formula that mixes various amounts
of three basic colors: red, green, and blue.  This technique for creating color is known as the **RGB Color Model**.
The amount of each color, sometimes called the **intensity** of the color, allows us to have very fine control over the
resulting color.

The minimum intensity value for a basic color is 0.  For example if the red intensity is 0, then there is no red in the pixel.  The maximum
intensity is 255.  This means that there are actually 256 different amounts of intensity for each basic color.  Since there
are three basic colors, that means that you can create 256\ :sup:`3` distinct colors using the RGB Color Model.


Here are the red, green and blue intensities for some common colors.  Note that "Black" is represented by a pixel having
no basic color.  On the other hand, "White" has maximum values for all three basic color components.

	=======  =======  =======  =======
	Color    Red      Green    Blue
	=======  =======  =======  =======
	Red      255      0        0
	Green    0        255      0
	Blue     0        0        255
	White    255      255      255
	Black    0        0        0
	Yellow   255      255      0
	Magenta  255      0        255
	=======  =======  =======  =======

In order to manipulate an image, we need to be able to access individual pixels.  This capability is provided by
a module called **image**.  The image module defines two classes: ``Image`` and ``Pixel``.

Each Pixel object has three attributes: the red intensity, the green intensity, and the blue intensity.  A pixel provides three methods
that allow us to ask for the intensity values.  They are called ``getRed``, ``getGreen``, and ``getBlue``.  In addition, we can ask a
pixel to change an intensity value using its ``setRed``, ``setGreen``, and ``setBlue`` methods. 


    ============  ================            ===============================================
    Method Name   Example                     Explanation
    ============  ================            ===============================================
    Pixel(r,g,b)  Pixel(20,100,50)            Create a new pixel with 20 red, 100 green, and 50 blue.
    getRed()      r = p.getRed()              Return the red component intensity.
    getGreen()    r = p.getGreen()            Return the green component intensity.
    getBlue()     r = p.getBlue()             Return the blue component intensity.
    setRed()      p.setRed(100)               Set the red component intensity to 100.
    setGreen()    p.setGreen(45)              Set the green component intensity to 45.
    setBlue()     p.setBlue(156)              Set the blue component intensity to 156.
    ============  ================            ===============================================

In the example below, we first create a pixel with 45 units of red, 76 units of green, and 200 units of blue.
We then print the current amount of red, change the amount of red, and finally, set the amount of blue to be
the same as the current amount of green.

.. activecode::  pixelex1a
    
    import image

    p = image.Pixel(45,76,200)
    print(p.getRed())
    p.setRed(66)
    print(p.getRed())
    p.setBlue(p.getGreen())
    print(p.getGreen(), p.getBlue())


Image Objects
^^^^^^^^^^^^^


To access the pixels in a real image, we need to first create an ``Image`` object.  Image objects can be created in two
ways.  First, an Image object can be made from the
files that store digital images.  The image object has an attribute corresponding to the width, the height, and the
collection of pixels in the image.  

It is also possible to create an Image object that is "empty".  An ``EmptyImage`` has a width and a height.  However, the
pixel collection consists of only "White" pixels.

We can ask an image object to return its size using the ``getWidth`` and ``getHeight`` methods.  We can also get a pixel from a particular location in the image using ``getPixel`` and change the pixel at
a particular location using ``setPixel``. 


The Image class is shown below.  Note that the first two entries show how to create image objects.  The parameters are 
different depending on whether you are using an image file or creating an empty image.

    =================== =============================== ==================================================
    Method Name         Example                         Explanation
    =================== =============================== ==================================================
    Image(filename)     img = image.Image("cy.png")     Create an Image object from the file cy.png.
    EmptyImage()        img = image.EmptyImage(100,200) Create an Image object that has all "White" pixels
    getWidth()          w = img.getWidth()              Return the width of the image in pixels.
    getHeight()         h = img.getHeight()             Return the height of the image in pixels.
    getPixel(col,row)   p = img.getPixel(35,86)         Return the pixel at column 35, row 86d.
    setPixel(col,row,p) img.setPixel(100,50,mp)         Set the pixel at column 100, row 50 to be mp.
    =================== =============================== ==================================================

Consider the image shown below.  Assume that the image is stored in a file called "cy.png".  Line 2 opens the
file and uses the contents to create an image object that is referred to by ``img``.  Once we have an image object,
we can use the methods described above to access information about the image or to get a specific pixel and check
on its basic color intensities.





.. raw:: html

    <img src="_static/LutherBellPic.jpg" id="luther.jpg">



.. activecode::  pixelex1

    import image
    img = image.Image("luther.jpg")

    print(img.getWidth())
    print(img.getHeight())

    p = img.getPixel(45,55)
    print(p.getRed(), p.getGreen(), p.getBlue())


When you run the program you can see that the image has a width of 400 pixels and a height of 244 pixels.  Also, the
pixel at column 45, row 55, has RGB values of 165, 161, and 158.  Try a few other pixel locations by changing the ``getPixel`` arguments and rerunning the program. 

Image Processing and Nested Iteration
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

**Image processing** refers to the ability to manipulate the individual pixels in a digital image.  In order to process
all of the pixels, we need to be able to systematically visit all of the rows and columns in the image.  The best way
to do this is to use **nested iteration**.  

Nested iteration simply means that we will place one iteration construct inside of another.  We will call these two
iterations the **outer iteration** and the **inner iteration**.  
To see how this works, consider the simple iteration below.

.. sourcecode:: python

    for i in range(5):
       print(i)

We have seen this enough times to know that the value of ``i`` will be 0, then 1, then 2, and so on up to 4.
The ``print`` will be performed once for each pass.
However, the ``print`` function can be any statement including another iteration (another ``for`` statement).  For example,

.. sourcecode:: python

    for i in range(5):
       for j in range(3):
            print(i,j)

The ``for i`` iteration is the `outer iteration` and the ``for j`` iteration is the `inner iteration`.  Each pass thru
the outer iteration will result in the complete processing of the inner iteration from beginning to end.  This means that
the output from this nested iteration will show that for each value of ``i``, all values of ``j`` will occur.

Here is the same example in activecode.  Try it.  Note that the value of ``i`` stays the same while the value of ``j`` changes.  The inner iteration, in effect, is moving faster than the outer iteration.

.. activecode:: nested1

    for i in range(5):
       for j in range(3):
            print(i,j)

Another way to see this in more detail is to examine the behavior with codelens.  Step thru the iterations to see the
flow of control as it occurs with the nested iteration.  Again, for every value of ``i``, all of the values of ``j`` will occur.  You can see that the inner iteration completes before going on to the next pass of the outer iteration.

.. codelens:: nested2

    for i in range(5):
       for j in range(3):
            print(i,j)

Our goal with image processing is to visit each pixel.  We will use an iteration to process each `row`.  Within that iteration, we will use a nested iteration to process each `column`.  The result is a nested iteration, similar to the one
seen above, where the outer ``for`` loop processes the rows, from 0 up to but not including the height of the image.
The inner ``for`` loop will process each column of a row, again from 0 up to but not including the width of the image.

The resulting code will look like the following.  We are now free to do anything we wish to each pixel in the image.

.. sourcecode:: python

	for col in range(img.getWidth()):
	    for row in range(img.getHeight()):
	        #do something with the pixel at position (col,row)
	
One of the easiest image processing algorithms will create what is known as a **negative** image.  A negative image simply means that
each pixel will be the `opposite` of what it was originally.  But what does opposite mean?

In the RGB color model, we can consider the opposite of the red component as the difference between the original red
and 255.  For example, if the original red component was 50, then the opposite, or negative red value would be
``255-50`` or 205.  In other words, pixels with alot of red will have negatives with little red and pixels with little red will have negatives with alot.  We do the same for the blue and green as well.

The program below implements this algorithm using the previous image.  Run it to see the resulting negative image.



.. activecode::  acimg_1

    import image

    img = image.Image("luther.jpg")

    win = image.ImageWin()
    newimg = image.EmptyImage(img.getHeight(),img.getWidth())

    for col in range(img.getWidth()):
        for row in range(img.getHeight()):
           p = img.getPixel(col,row)    

           newred = 255-p.getRed()    
           newgreen = 255-p.getGreen()
           newblue = 255-p.getBlue()

           newpixel = image.Pixel(newred,newgreen,newblue)

           newimg.setPixel(col,row,newpixel)

    newimg.draw(win)

After importing the image module, we create two image objects.  The first, ``img``, represents a typical digital photo.  The second, ``newimg``, is an empty image that will be "filled in" as we process the original pixel by pixel.  Note that the width and height of the empty image is set to be the same as the width and height of the original.

Lines 8 and 9 create the nested iteration that we discussed earlier.  This allows us to process each pixel in the image.
Line 10 gets an individual pixel.

Lines 12-14 create the negative intensity values by extracting the original intensity from the pixel and subtracting it
from 255.  Once we have the ``newred``, ``newgreen``, and ``newblue`` values, we can create a new pixel (Line 16).

Finally, we need to insert the new pixel into the empty image in the same location as the original pixel that it came from in the digital photo.


.. admonition:: Other pixel manipulation

	There are a number of different image processing algorithms that follow the same pattern as shown above.  Namely, take the original pixel, extract the red, green, and blue intensities, and then create a new pixel from them.  The new pixel is inserted into an empty image at the same location as the original.

	For example, you can create a **gray scale** pixel by averaging the red, green and blue intensities and then using that value for all intensities.

	From the gray scale you can create **black white** by setting a threshold and selecting to either insert a white pixel or a black pixel into the empty image.

	You can also do some complex arithmetic and create interesting effects, such as 
	`Sepia Tone <http://en.wikipedia.org/wiki/Sepia_tone#Sepia_toning>`_


Glossary
--------

.. glossary::


    algorithm
        A step-by-step process for solving a category of problems.

    body
        The statements inside a loop.
        
    breakpoint
        A place in your program code where program execution will pause (or break),
        allowing you to inspect the state of the program's variables, or single-step
        through individual statements, executing them one at a time. 
        
    bump
        Programmer slang. Synonym for increment.

    counter
        A variable used to count something, usually initialized to zero and
        incremented in the body of a loop.

    cursor
        An invisible marker that keeps track of where the next character will
        be printed.


    definite iteration
        A loop where we have an upper bound on the number of times the 
        body will be executed.  Definite iteration is usually best coded
        as a ``for`` loop.    
        
    development plan
        A process for developing a program. In this chapter, we demonstrated a
        style of development based on developing code to do simple, specific
        things and then encapsulating and generalizing.

    encapsulate
        To divide a large complex program into components (like functions) and
        isolate the components from each other (by using local variables, for
        example).

    escape sequence
        An escape character, \\, followed by one or more printable characters
        used to designate a nonprintable character.

    generalize
        To replace something unnecessarily specific (like a constant value)
        with something appropriately general (like a variable or parameter).
        Generalization makes code more versatile, more likely to be reused, and
        sometimes even easier to write.



    infinite loop
        A loop in which the terminating condition is never satisfied.

    indefinite iteration
        A loop where we just need to keep going until some condition is met.
        A ``while`` statement is used for this case.      
        


    iteration
        Repeated execution of a set of programming statements.

    loop
        A statement or group of statements that execute repeatedly until a
        terminating condition is satisfied.

    loop variable
        A variable used as part of the terminating condition of a loop.
     
    meta-notation
        Extra symbols or notation that helps describe other notation. Here we introduced
        square brackets, ellipses, italics, and bold as meta-notation to help 
        describe optional, repeatable, substitutable and fixed parts of the Python syntax.
     
    middle-test loop
        A loop that executes some of the body, then tests for the exit condition, 
        and then may execute some more of the body.  We don't have a special 
        Python construct for this case, but can 
        use ``while`` and ``break`` together.
    
    nested loop
        A loop inside the body of another loop.
    
    newline
        A special character that causes the cursor to move to the beginning of
        the next line.

    post-test loop
        A loop that executes the body, then tests for the exit condition.  We don't have a special
        Python construct for this, but can use ``while`` and ``break`` together.
        
    pre-test loop
        A loop that tests before deciding whether the execute its body.  ``for`` and ``while``
        are both pre-test loops.    
        
    reassignment
        Making more than one assignment to the same variable during the
        execution of a program.
    
    single-step
        A mode of interpreter execution where you are able to execute your 
        program one step at a time, and inspect the consequences of that step. 
        Useful for debugging and building your internal mental model of what is
        going on.
     
    tab
        A special character that causes the cursor to move to the next tab stop
        on the current line.
        
    trichotomy
        Given any real numbers *a* and *b*, exactly one of the following
        relations holds: *a < b*, *a > b*, or *a == b*. Thus when you can
        establish that two of the relations are false, you can assume the
        remaining one is true.

    trace
        To follow the flow of execution of a program by hand, recording the
        change of state of the variables and any output produced.

        
Exercises
---------

This chapter showed us how to sum a list of items, 
and how to count items.  The counting example also had an ``if`` statement
that let us only count some selected items.  In the previous
chapter we also showed a function ``find_first_2_letter_word`` that allowed
us an "early exit" from inside a loop by using ``return`` when some condition occurred.  
We now also have ``break`` to exit a loop (but not the enclosing function, and 
``continue`` to abandon the current iteration of the loop without ending the loop.

Composition of list traversal, summing, counting, testing conditions
and early exit is a rich collection of building blocks that can be combined
in powerful ways to create many functions that are all slightly different.  

The first six questions are typical functions you should be able to write using only
these building blocks.
   
#. Write a function to count how many odd numbers are in a list.
#. Sum up all the even numbers in a list.
#. Sum up all the negative numbers in a list.
#. Count how many words in a list have length 5.
#. Sum all the elements in a list up to but not including the first even number.
   (Write your unit tests.  What if there is no even number?)
#. Count how many words occur in a list up to and including the first occurrence of the word "sam".
   (Write your unit tests for this case too.  What if "sam" does not occur?)
   
#. Add a print function to Newton's ``sqrt`` function that
   prints out ``better`` each time it is calculated. Call your modified
   function with 25 as an argument and record the results.
   
#. Trace the execution of the last version of ``print_mult_table`` and figure
   out how it works.
   
#. Write a function ``print_triangular_numbers(n)`` that prints out the first
   n triangular numbers. A call to ``print_triangular_numbers(5)`` would
   produce the following output::
    
       1       1
       2       3
       3       6
       4       10
       5       15

   (*hint: use a web search to find out what a triangular number is.*)
   
   
#. Write a function, ``is_prime``, which takes a single integer argument
   and returns ``True`` when the argument is a *prime number* and ``False``
   otherwise. Add tests for cases like this::
   
       test(is_prime(11), True)
       test(is_prime(35), False)
       test(is_prime(19911129), True)
   
   The last case could represent your birth date.  Were you born on a prime day?
   In a class of 100 students, how many do you think would have prime birth dates?
   
#. Revisit the drunk student problem from the exercises in chapter 3. 
   Now write a function that gets the student to make 50 random turns and moves.
   Each random turn should be an angle between 0 and 360, and each move should be
   a random move forward between 0 and 100 steps.  Use the turtle module to 
   plot these.   Peek ahead to the 
   section on random numbers (look it up in the index)
   to see how to make the computer generate random numbers for you.   
      
#. What will ``num_digits(0)`` return? Modify it to return ``1`` for this
   case. Why does a call to ``num_digits(-24)`` result in an infinite loop?
   (*hint: -1//10 evaluates to -1*)  Modify ``num_digits`` so that it works
   correctly with any integer value. Add these tests::

       test(num_digits(0), 1)
       test(num_digits(-12345), 5)

#. Write a function ``num_even_digits(n)`` that counts the number
   of even digits in ``n``.  These tests should pass::

       test(num_even_digits(123456), 3)
       test(num_even_digits(2468), 4)
       test(num_even_digits(1357), 0)
       test(num_even_digits(0), 1)

#. Write a function ``sum_of_squares(xs)`` that computes the sum
   of the squares of the numbers in the list ``xs``.  For example,
   ``sum_of_squares([2, 3, 4])`` should return 4+9+16 which is 29::
    
       test(sum_of_squares([2, 3, 4]), 29) 
       test(sum_of_squares([ ]), 0)
       test(sum_of_squares([2, -3, 4]), 29)
       
#. You and your friend are in a team to write a two-player game, 
   human against computer, such as Tic-Tac-Toe / Noughts and Crosses.  
   Your friend will write the logic to play one round of the game, while you will
   write the logic to allow many rounds of play, keep score, decide who
   plays, first, etc.  The two of you negotiate on how the two parts of the 
   program will interact with each other, and you come up with this simple 
   scaffolding (which your friend will improve later):
   
   .. sourcecode:: python
   
       def play_once(human_plays_first):
           """ 
              Must play one round of the game. If the parameter is True, the
              human gets to play first, else the computer gets to play first.   
              When the round ends, the return value of the function is one of 
              -1 (human wins),  0 (game drawn),   1 (computer wins).
           """
           # This is all dummy code right at the moment...
           import random                # see ch 10 for details 
           rng = random.Random()
           result = rnd.randrange(-1,2) # pick a random result.
           print("Human plays first={0},  winner={1} ".format(human_plays_first, result))
           return result
           
   a. Write the main program which repeatedly calls the function to play 
      the game, and announces the outcome as "I win". "You win", or "Game drawn!".
      It then asks the player "Do you want to play again?" and either plays again,
      or says "Goodbye", and terminates.
   b. Keep score of how many wins each player has had, and how many draws there have been.
      After each round of play, announce the scores.
   c. Add logic to ensure that the player who gets to play first alternates on every round.
   d. Change the logic from part (c.) so that the player who won the previous round gets to
      play first. 
   e. Compute the percentage of wins for the human, out of all games played.  Announce this
      at the end of each round. 
   f. Draw a flowchart of your logic.  
   
           
