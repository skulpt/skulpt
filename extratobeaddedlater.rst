.. index:: type converter functions, int, float, str, truncation

Type conversion functions
-------------------------
    
Here we'll look at three more Python functions, `int`, `float` and `str`, which
will (attempt to) convert their arguments into types `int`, `float` and `str`
respectively.  We call these **type conversion** functions.  

The `int` function can take a floating point number or a string, and turn it
into an int. For floating point numbers, it *discards* the decimal portion of
the number - a process we call *truncation towards zero* on the number line.
Let us see this in action:

.. activecode:: ch02_20
    :nocanvas:

    print(3.14, int(3.14))
    print(3.9999, int(3.9999))       # This doesn't round to the closest int!
    print(3.0,int(3.0))
    print(-3.999,int(-3.999))        # Note that the result is closer to zero
    minutes = 600.0
    print(int(minutes/60))
    print("2345",int("2345"))        # parse a string to produce an int
    print(17,int(17))                # int even works on integers
    print(int("23bottles"))


The last case shows that a string has to be a syntactically legal number,
otherwise you'll get one of those pesky runtime errors.

The type converter `float` can turn an integer, a float, or a syntactically
legal string into a float.

.. activecode:: ch02_21
    :nocanvas:

    print(float(17))
    print(float("123.45"))


The type converter `str` turns its argument into a string:

.. activecode:: ch02_22
    :nocanvas:

    print(str(17))
    print(str(123.45))





	.. index:: composition of functions

	Composition
	-----------

	So far, we have looked at the elements of a program --- variables, expressions,
	statements, and function calls --- in isolation, without talking about how to
	combine them.

	One of the most useful features of programming languages is their ability to
	take small building blocks and **compose** them into larger chunks. 

	For example, we know how to get the user to enter some input, we know how to
	convert the string we get into a float, we know how to write a complex
	expression, and we know how to print values. Let's put these together in a
	small four-step program that asks the user to input a value for the radius of a
	circle, and then computes the area of the circle from the formula  

	.. image:: illustrations/ch02/circle_area.png
	   :alt: formula for area of a circle

	Firstly, we'll do the four steps one at a time: 

	.. activecode:: ch02_25
	   :nocanvas:

	   response = input("What is your radius? ")
	   r = float(response)
	   area = 3.14159 * r**2
	   print("The area is ", area)

	Now let's compose the first two lines into a single line of code, and compose
	the second two lines into another line of code.

	.. activecode:: ch02_26
	    :nocanvas:

	   r = float(input("What is your radius? "))
	   print("The area is ", 3.14159 * r**2)

	If we really wanted to be tricky, we could write it all in one statement:

	.. activecode:: ch02_27
	    :nocanvas:

	   print("The area is ", 3.14159*float(input("What is your radius?"))**2)

	Such compact code may not be most understandable for humans, but it does
	illustrate how we can compose bigger chunks from our building blocks.

	If you're ever in doubt about whether to compose code or fragment it into
	smaller steps, try to make it as simple as you can for the human to follow.  My
	choice would be the first case above, with four separate steps.
	
	
	
	.. index:: PyScripter; single stepping

	.. admonition:: Watch the flow of execution in action

	   In PyScripter, you can watch the flow of execution by "single-stepping" through
	   any program.  PyScripter will highlight each line of code just before it is about to
	   be executed.  

	   PyScripter also lets you hover the mouse over any
	   variable in the program, and it will pop up the current value of that variable. 
	   So this makes it easy to inspect the "state snapshot" of the program --- the
	   current values that are assigned to the program's variables.

	   This is a powerful mechanism for building a deep and thorough understanding of
	   what is happening at each step of the way.  Learn to use the single-stepping 
	   feature well, and be mentally proactive:  as you work through the code,
	   challenge yourself before each step: *"What changes will this line make to 
	   any variables in the program?"* and *"Where will flow of execution go next?"* 

	   Let us go back and see how this works with the program above that draws 15 
	   multicolour squares.  First, we're going to add one line of magic below
	   the import statement --- not strictly necessary, but it will make our lives
	   much simpler, because it prevents stepping into the module containing 
	   the turtle code.   

	   .. sourcecode:: python

	       import turtle
	       __import__('turtle').__traceable__ = False

	   Now we're ready to begin.  Put the mouse cursor on the line of the program
	   where we create the turtle screen, and press the *F4* key.  This will run the Python
	   program up to, but not including, the line where you have the cursor.   Your program 
	   will "break" now, and provide a highlight on the next line to be executed, something like this:

	   .. image:: illustrations/ch04/breakpoint.png

	   At this point you can press the *F7* key (*step into*) repeatedly to single step through
	   the code.  Observe as you execute lines 10, 11, 12, ... how the turtle window gets 
	   created, how its canvas colour is changed, how the title
	   gets changed, how the turtle is created on the canvas, and then how the flow of execution gets into the loop, and from there into the function, 
	   and into the function's loop, and then repeatedly through the body of that loop.

	   While you do this, also hover your mouse over some of the variables in the program, and confirm that
	   their values match your conceptual model of what is happening.

	   After a few loops, when you're about to execute line 20 and you're starting to get bored, you can use the key *F8*
	   to "step over" the function you are calling.  This executes all the statements in the function, but without
	   having to step through each one.   You always have the choice to either 
	   "go for the detail", or to "take the high-level view" and execute the function as a single chunk.

	   There are some other options, including one that allow you to *resume* execution without further stepping.
	   Find them under the *Run* menu of PyScripter.



	The ``return`` statement
	------------------------

	The ``return`` statement, with or without a value, depending on whether the 
	function is fruitful or not, allows you to terminate the execution of a function
	before you reach the end. One reason to use it is if you detect an error
	condition:

	.. sourcecode:: python

	    def print_square_root(x):
	        if x <= 0:
	            print("Positive numbers only, please.")
	            return

	        result = x**0.5
	        print("The square root of", x, "is", result)

	The function ``print_square_root`` has a parameter named ``x``. The first thing
	it does is check whether ``x`` is less than or equal to 0, in which case it
	displays an error message and then uses ``return`` to exit the function. The
	flow of execution immediately returns to the caller, and the remaining lines of
	the function are not executed.


	.. index::
	    single: type conversion
	    single: type; conversion

	Type conversion
	---------------

	We've had a first look at this in an earlier chapter.  Seeing it again won't hurt! 

	Many Python types comes with a built-in function that attempts to convert values
	of another type into its own type. The ``int(ARGUMENT)`` function, for example,
	takes any value and converts it to an integer, if possible, or complains
	otherwise:

	.. sourcecode:: python

	    >>> int("32")
	    32
	    >>> int("Hello")
	    ValueError: invalid literal for int() with base 10: 'Hello'

	``int`` can also convert floating-point values to integers, but remember
	that it truncates the fractional part:

	.. sourcecode:: python

	    >>> int(-2.3)
	    -2
	    >>> int(3.99999)
	    3
	    >>> int("42")
	    42
	    >>> int(1.0)
	    1

	The ``float(ARGUMENT)`` function converts integers and strings to floating-point
	numbers:

	.. sourcecode:: python

	    >>> float(32)
	    32.0
	    >>> float("3.14159")
	    3.14159
	    >>> float(1)
	    1.0

	It may seem odd that Python distinguishes the integer value ``1`` from the
	floating-point value ``1.0``. They may represent the same number, but they
	belong to different types. The reason is that they are represented differently
	inside the computer.

	The ``str(ARGUMENT)`` function converts any argument given to it to type
	``string``:

	.. sourcecode:: python

	    >>> str(32)
	    '32'
	    >>> str(3.14149)
	    '3.14149'
	    >>> str(True)
	    'True'
	    >>> str(true)
	    Traceback (most recent call last):
	      File "<interactive input>", line 1, in <module>
	    NameError: name 'true' is not defined

	``str(ARGUMENT)`` will work with any value and convert it into a string.  As
	mentioned earlier, ``True`` is boolean value; ``true`` is not.
	
	
	
	Although the indentation of the statements makes the structure apparent, nested
	conditionals very quickly become difficult to read.  In general, it is a good
	idea to avoid them when you can.

	Logical operators often provide a way to simplify nested conditional
	statements. For example, we can rewrite the following code using a single
	conditional:

	.. sourcecode:: python

	    if 0 < x:            # assume x is an int here
	        if x < 10:
	            print("x is a positive single digit.")

	The ``print`` function is called only if we make it past both the
	conditionals, so we can use the ``and`` operator:

	.. sourcecode:: python

	    if 0 < x and x < 10:
	        print("x is a positive single digit.")


	.. index::
	    single: return statement
	    single: statement; return


		It is also possible to use a return statement in the middle of a ``for`` loop,
		in which case control immediately returns from the function.  Let us assume that we want
		a function which looks through a list of words.  It should return the
		first 2-letter word.  If there is not one, it should return the 
		empty string:

		.. sourcecode:: python

		    def find_first_2_letter_word(xs):
		        for wd in xs:
		            if len(wd) == 2:
		               return wd
		        return ""

		    test(find_first_2_letter_word(["This",  "is", "a", "dead", "parrot"]), "is")   
		    test(find_first_2_letter_word(["I",  "like",  "cheese"]), "")     

		Single-step through this code and convince yourself that in the first test case
		that we've provided, the function returns while processing the second element
		in the list: it does not have to traverse the whole list.  

		.. index:: debugging   

		Debugging with ``print``
		------------------------

		Another powerful technique for debugging is to insert ``print`` functions
		in carefully selected places in your code.  Then, by inspecting the output
		of the program, you can check whether the algorithm is doing what you expect
		it to.  Be clear about the following, however:

		* You must have a clear solution to the problem, and must know what should
		  happen before you can debug a program.  Work on *solving* the problem
		  on a piece of paper (perhaps using a flowchart to record the steps you take)
		  *before* you concern yourself with
		  writing code.  Writing a program doesn't solve the problem --- it simply *automates* 
		  the manual steps you would take. So first make sure you have
		  a pen-and-paper manual solution that works.  
		  Programming then is about making those manual steps happen automatically. 
		* Do not write **chatterbox** functions.  A chatterbox is a fruitful
		  function that, in addition to its primary task, also asks the user for input, 
		  or prints output, when it would be more useful
		  if it simply shut up and did its work quietly.  

		  For example, we've seen built-in functions like ``range``,
		  ``max`` and ``abs``.  None of these would be useful building blocks for other
		  programs if they prompted the user for input, or printed their results while
		  they performed their tasks.

		  So a good tip is to avoid calling ``print`` and ``input`` functions inside 
		  fruitful functions, *unless the primary purpose of your function is to
		  perform input and output*.  The one exception
		  to this rule might be to temporarily sprinkle some calls to ``print`` into
		  your code to help debug and understand what is happening when the code runs,
		  but these will then be removed once you get things working.


		Unit testing 
		------------

		It is a common best practice in software development these days to include
		automatic **unit testing** of source code. Unit testing provides a way to
		automatically verify that individual pieces of code, such as functions, are
		working properly. This makes it possible to change the implementation of a
		function at a later time and quickly test that it still does what it was
		intended to do.

		Unit testing also forces the programmer to think about the different cases 
		that the function needs to handle.  You also only have to type the tests once
		into the script, rather than having to keep entering the same test data over
		and over as you develop your code.

		Extra code in your program which is there because it makes debugging or testing
		easier is called **scaffolding**.  

		A collection of tests for some code is called its **test suite**.  

		There are a few different preferred ways to do unit testing in Python --- 
		but at this stage we're going to ignore what the Python community ususally does, 
		and we're going to start with two functions that we'll write ourselves.
		We'll use these for writing our unit tests.

		Let's start with the ``absolute_value`` function that we wrote earlier in this
		chapter.  Recall that we wrote a few different versions, the last of which was
		incorrect, and had a bug. Would tests have help catch this bug?

		First we plan our tests.  We'd like to know
		if the function returns the correct value when its argument is negative,
		or when its argument is positive, or when its argument is zero.  When
		planning your tests, you'll always want to think carefully about the "edge" cases ---
		here, an argument of 0 to ``absolute_value`` is on the edge of where the function
		behaviour changes, and as we saw at the beginning of the chapter, it is an easy
		spot for the programmer to make a mistake!  So it is a good case to include in
		our test suite. 

		We're going to write a helper function for checking the results of one test.  It
		takes two arguments --- the actual value that was
		returned from the computation, and the value we expected to get.
		It compares these, and will either print
		a message telling us that the test passed, or it will print a message to
		inform us that the test failed.  The first two lines of the body (after
		the function's docstring) can be copied to your own code as they are here:
		they import a module called ``sys``, and extract the caller's
		line number from the stack frame.  This allows us to print the line number
		of the test, which will help when we want to fix any tests that fail. 

		.. sourcecode:: python

		    def test(actual, expected):
		        """ Compare the actual to the expected value, and print a suitable message. """
		        import sys
		        linenum = sys._getframe(1).f_lineno         # get the caller's line number.
		        if (expected == actual):
		            msg = "Test on line {0} passed.".format(linenum)
		        else:
		            msg = "Test on line {0} failed. Expected '{1}', but got '{2}'.".format(linenum, expected, actual)
		        print(msg)

		There is also some slightly tricky string formatting using the ``format`` method which we will
		gloss over for the moment, and cover in detail in a future chapter.  
		But with this function written, we can proceed to construct our test suite:

		.. sourcecode:: python

		    def test_suite():
		        """ Run the suite of tests for code in this module (this file) """
		        test(absolute_value(17), 17)  
		        test(absolute_value(-17), 17) 
		        test(absolute_value(0), 0) 
		        test(absolute_value(3.14), 3.14) 
		        test(absolute_value(-3.14), 3.14) 

		    test_suite()        # and here is the call to run the tests

		Here you'll see that we've constructed five tests in our test suite.  We could run this
		against the first or second versions (the correct versions) of ``absolute_value``, and we'd get output similar to the following:: 

		    Test on line 24 passed.
		    Test on line 25 passed.
		    Test on line 26 passed.
		    Test on line 27 passed.
		    Test on line 28 passed.

		But let's say you change the function to an incorrect version like this:

		.. sourcecode:: python

		    def absolute_value(n):   # Buggy version
		        """ Compute the absolute value of n """  
		        if n < 0:
		            return 1
		        elif n > 0:
		            return n

		Can you find at least two mistakes in this code?  Running our test suite we get::

		    Test on line 24 passed.
		    Test on line 25 failed. Expected '17', but got '1'.
		    Test on line 26 failed. Expected '0', but got 'None'.
		    Test on line 27 passed.
		    Test on line 28 failed. Expected '3.14', but got '1'.

		These are three examples of *failing tests*.

.. adding functionality to print

		Notice first that the print function has an extra argument ``end=', '``.  This 
		tells the ``print`` function to follow the printed string with whatever the programmer
		chooses (in this case, a comma followed by a space), instead of ending the line. So
		each time something is printed in the loop, it is printed on the same line, with
		the output separated by commas.  The call to ``print(n, end='.\n')`` when the loop terminates
		will then print the final value of ``n`` followed by a period and a newline character. 
		(You'll cover the ``\n`` (newline character) in the next chapter).
	
	
		Abbreviated assignment
		----------------------

		Incrementing a variable is so common that Python provides an abbreviated syntax
		for it:

		.. sourcecode:: python

		    >>> count = 0
		    >>> count += 1
		    >>> count
		    1
		    >>> count += 1
		    >>> count
		    2
		    >>>

		``count += 1`` is an abreviation for ``count = count + 1`` . We pronouce the operator
		as *"plus-equals"*.  The increment value does not have to be 1:

		.. sourcecode:: python

		    >>> n = 2
		    >>> n += 5
		    >>> n
		    7
		    >>>

		There are similar abbreviations for ``-=``, ``*=``, ``/=``, ``//=`` and ``%=``:

		.. sourcecode:: python

		    >>> n = 2
		    >>> n *= 5
		    >>> n
		    10
		    >>> n -= 4
		    >>> n
		    6
		    >>> n //= 2
		    >>> n
		    3
		    >>> n %= 2
		    >>> n
		    1

			.. index:: help, meta-notation   

			Help and meta-notation
			----------------------

			Python comes with extensive documentation for all its built-in functions, and its libraries.
			Different systems have different ways of accessing this help.  In PyScripter, click on the
			*Help* menu item, and select *Python Manuals*.  Then search for help on the built-in function
			**range**.   You'll get something like this...

			.. image:: illustrations/ch07/help_range.png  

			Notice the square brackets in the description of the arguments. 
			These are examples of **meta-notation** --- notation that describes Python syntax, but is not part of it.
			The square brackets in this documentation mean that the argument is *optional* --- the programmer can
			omit it.  So what this first line of help tells us is that ``range`` must always have a ``stop`` argument,
			but it may have an optional ``start`` argument (which must be followed by a comma if it is present),
			and it can also have an optional ``step`` argument, preceded by a comma if it is present.

			The examples from help show that ``range`` can have either 1, 2 or 3 arguments.  The list can
			start at any starting value, and go up or down in increments other than 1.  The documentation
			here also says that the arguments must be integers.

			Other meta-notation you'll frequently encounter is the use of bold and italics.  The bold
			means that these are tokens --- keywords or symbols --- typed into your Python code exactly as
			they are, whereas the
			italic terms stand for "something of this type".  So the syntax description

			    **for** *variable* **in** *list* **:** 

			means you can substitute any legal 
			variable and any legal list when you write your Python code.  

			This (simplified) description of the ``print`` function, shows another example
			of meta-notation in which the ellipses (``...``) mean that you can have as many
			objects as you like (even zero), separated by commas:

			   **print( [**\ *object,* ... **] )**

			Meta-notation gives us a concise and powerful way to describe the *pattern* of some syntax
			or feature.  



			Tracing a program is, of course, related to single-stepping through your code
			and being able to inspect the variables. Using the computer to **single-step** for you is
			less error prone and more convenient. 
			Also, as your ptograms get more complex, they might execute many millions of 
			steps before they get to the code that you're really interested in, so manual tracing 
			becomes impossible.  Being able to set a **breakpoint** where you need
			one is far more powerful. So we strongly encourage you to invest time in
			learning using to use your programming environment (PyScripter, in these notes) to full
			effect.
			
			
			.. index:: two-dimensional table

			Two-dimensional tables
			----------------------

			A two-dimensional table is a table where you read the value at the intersection
			of a row and a column. A multiplication table is a good example. Let's say you
			want to print a multiplication table for the values from 1 to 6.

			A good way to start is to write a loop that prints the multiples of 2, all on
			one line:

			.. sourcecode:: python

			    for i in range(1, 7):
			        print(2 * i, end='   ')
			    print()

			Here we've used the ``range`` function, but made it start its sequence at 1. 
			As the loop executes, the value of ``i`` changes from 1 to
			6. When all the elements of the range have been assigned to ``i``, the loop terminates. 
			Each time through the loop, it
			displays the value of ``2 * i``, followed by three spaces.

			Again, the extra ``end='   '`` argument in the ``print`` function suppresses the newline, and
			uses three spaces instead.  After the
			loop completes, the second call to ``print`` finishes the current line, and starts a new line.

			The output of the program is::

			    2      4      6      8      10     12

			So far, so good. The next step is to **encapsulate** and **generalize**.


			.. index:: encapsulation, generalization, program development

			Encapsulation and generalization
			--------------------------------

			Encapsulation is the process of wrapping a piece of code in a function,
			allowing you to take advantage of all the things functions are good for. You
			have already seen some examples of encapsulation, including ``is_divisible`` in a previous chapter.

			Generalization means taking something specific, such as printing the multiples
			of 2, and making it more general, such as printing the multiples of any
			integer.

			This function encapsulates the previous loop and generalizes it to print
			multiples of ``n``:

			.. sourcecode:: python

			    def print_multiples(n):
			        for i in range(1, 7):
			            print(n * i, end='   ')
			        print()

			To encapsulate, all we had to do was add the first line, which declares the
			name of the function and the parameter list. To generalize, all we had to do
			was replace the value 2 with the parameter ``n``.

			If we call this function with the argument 2, we get the same output as before.
			With the argument 3, the output is::

			    3      6      9      12     15     18

			With the argument 4, the output is::

			    4      8      12     16     20     24

			By now you can probably guess how to print a multiplication table --- by
			calling ``print_multiples`` repeatedly with different arguments. In fact, we
			can use another loop:

			.. sourcecode:: python

			    for i in range(1, 7):
			        print_multiples(i)

			Notice how similar this loop is to the one inside ``print_multiples``.  All we
			did was replace the ``print`` function with a function call.

			The output of this program is a multiplication table::

			    1      2      3      4      5      6
			    2      4      6      8      10     12
			    3      6      9      12     15     18
			    4      8      12     16     20     24
			    5      10     15     20     25     30
			    6      12     18     24     30     36


			.. index:: development plan

			More encapsulation
			------------------

			To demonstrate encapsulation again, let's take the code from the last section
			and wrap it up in a function:

			.. sourcecode:: python

			    def print_mult_table():
			        for i in range(1, 7):
			            print_multiples(i)

			This process is a common **development plan**. We develop code by writing lines
			of code outside any function, or typing them in to the interpreter. When we get
			the code working, we extract it and wrap it up in a function.

			This development plan is particularly useful if you don't know how to divide
			the program into functions when you start writing. This approach lets you
			design as you go along.



			.. index:: break statement,  statement: break

			The ``break`` statement, and flavours of loops
			----------------------------------------------

			.. sidebar::  A pre-test loop

			    .. image:: illustrations/ch07/pre_test_loop.png  

			The **break** statement is used to immediately leave the body of its loop.  The next
			statement to be executed is the first one after the body::

			    for i in [12, 16, 17, 24, 29]: 
			        if i % 2 == 1:  # if the number is odd
			           break        # immediately exit the loop
			        print(i)
			    print("done")

			This prints::

			    12
			    16
			    done



			``for`` and ``while`` loops do their tests at the start, before executing
			any part of the body.  (They're called **pre-test** loops, because the test
			happens before (pre) the body.)  


			.. sidebar::  A middle-test loop

			    .. image:: illustrations/ch07/mid_test_loop.png  

			Sometimes we'd like to have the **middle-test** loop with the exit test in the middle 
			of the body, rather than at the beginning.  Or a **post-test** loop that
			puts its exit test after the body.   Python doesn't provide different
			loops for these cases: but a combination of ``while`` and ``break`` are sufficient
			to get the job done.    

			A typical example is a problem where the user has to input numbers to be summed.  
			To indicate that there are no more inputs, the user enters a special value, often
			the value -1, or the empty string.  This needs a middle-exit loop pattern: 
			input the next number, then test whether to exit, or else process the number::

			    total = 0
			    while True:
			        response = input("Enter the next number. (Leave blank to end)")
			        if response == "":
			            break 
			        total += int(response)
			    print("The total of the numbers you entered is ", total)


			A post-test loop would be useful,for example, if you were playing an
			interactive game against the user::

			    while True:
			        play_the_game()
			        response = input("Play again? (yes or no)")
			        if response != "yes":
			            break 
			    print("Goodbye!")

			.. sidebar::  A post-test loop

			    .. image:: illustrations/ch07/post_test_loop.png        

			The ``while True:`` in these cases is *idiomatic* --- a convention that
			most programmers will recognize immediately. The test in the ``while`` loop must
			always succeed. A clever compiler or interpreter will understand that
			and won't generate any unnecessary work!   


			The following program implements a simple guessing game:


			.. sourcecode:: python
			    :linenos:

			    import random                     # We cover random numbers in chapter 10
			    rng = random.Random()             # so you can peek ahead.
			    number = rng.randrange(1, 1000)   # Get a random number between [1 and 1000).

			    guesses = 0
			    msg = ""

			    while True:
			        guess = int(input(msg + "\nGuess my number between 1 and 1000: "))
			        guesses += 1
			        if guess > number:
			            msg += str(guess) + " is too high.\n"  
			        elif guess < number:
			            msg += str(guess) + " is too low.\n"  
			        else:
			            break

			    input("\n\nCongratulations, you got it in {0} guesses!\n\n" .format(guesses))

			This program makes use of the mathematical law of **trichotomy** (given real
			numbers a and b, exactly one of these three must be true:  a > b, a < b, or a == b). 

			At line 18 there is a call to the input function, but we don't do 
			anything with the result, not even assign it to a variable.  This is legal in Python.
			Here it has the effect of popping up the input dialog window and waiting for the
			user to respond before the program terminates.  Programmers often use the trick 
			of doing some extra input at the end of a script, just to keep the windows open.

			Also notice the use of the ``msg`` variable, initially an empty string, on lines 6, 12 and 14.
			Each time through the loop we extend the message being displayed: this allows us to 
			display the program's feedback right at the same place as we're asking for the next guess. 

			.. image:: illustrations/ch07/python_input.png

			.. index:: continue statement,  statement; continue

			The ``continue`` statement
			--------------------------

			This is a control flow statement that causes the program to immediately skip the
			processing of the rest of the body of the loop, *for the current iteration*.  But
			the loop still carries on running for its remaining iterations::

			    for i in [12, 16, 17, 24, 29, 30]: 
			        if i % 2 == 1:      # if the number is odd
			           continue         # don't process it
			        print(i)
			    print("done")

			This prints::

			    12
			    16
			    24
			    30
			    done    

			More generalization
			-------------------

			As another example of generalization, imagine you wanted a program that would
			print a multiplication table of any size, not just the six-by-six table. You
			could add a parameter to ``print_mult_table``:

			.. sourcecode:: python

			    def print_mult_table(high):
			        for i in range(1, high+1):
			            print_multiples(i)

			We replaced the value 1 with the expression ``high+1``. If we call
			``print_mult_table`` with the argument 7, it displays::

			    1      2      3      4      5      6
			    2      4      6      8      10     12
			    3      6      9      12     15     18
			    4      8      12     16     20     24
			    5      10     15     20     25     30
			    6      12     18     24     30     36
			    7      14     21     28     35     42

			This is fine, except that we probably want the table to be square --- with the
			same number of rows and columns. To do that, we add another parameter to
			``print_multiples`` to specify how many columns the table should have.

			Just to be annoying, we call this parameter ``high``, demonstrating that
			different functions can have parameters with the same name (just like local
			variables). Here's the whole program:

			.. sourcecode:: python

			    def print_multiples(n, high):
			        for i in range(1, high+1):
			            print(n * i, end='   ')
			        print()

			    def print_mult_table(high):
			        for i in range(1, high+1):
			            print_multiples(i, high)

			Notice that when we added a new parameter, we had to change the first line of
			the function (the function heading), and we also had to change the place where
			the function is called in ``print_mult_table``.

			Now, when we call ``print_mult_table(7)``::

			    1      2      3      4      5      6      7
			    2      4      6      8      10     12     14
			    3      6      9      12     15     18     21
			    4      8      12     16     20     24     28
			    5      10     15     20     25     30     35
			    6      12     18     24     30     36     42
			    7      14     21     28     35     42     49

			When you generalize a function appropriately, you often get a program with
			capabilities you didn't plan. For example, you might notice that, because ab =
			ba, all the entries in the table appear twice. You could save ink by printing
			only half the table. To do that, you only have to change one line of
			``print_mult_table``. Change

			.. sourcecode:: python

			            print_multiples(i, high+1)

			to

			.. sourcecode:: python

			            print_multiples(i, i+1)

			and you get::

			    1
			    2      4
			    3      6      9
			    4      8      12     16
			    5      10     15     20     25
			    6      12     18     24     30     36
			    7      14     21     28     35     42     49


			.. index:: function

			Functions
			---------

			A few times now, we have mentioned all the things functions are good for. By
			now, you might be wondering what exactly those things are.  Here are some of
			them:

			#. Giving a name to a sequence of statements makes your program easier to read
			   and debug.
			#. Dividing a long program into functions allows you to separate parts of the
			   program, debug them in isolation, and then compose them into a whole.
			#. Functions facilitate the use of iteration.
			#. Well-designed functions are often useful for many programs. Once you write
			   and debug one, you can reuse it.



			There are also methods like `capitalize` and `swapcase` that do other interesting stuff.  Give them a try.

			To learn what methods are available, you can consult the Help documentation, look for 
			the ``string`` module, and read the documentation.  Or, if you're a bit lazier, 
			simply type the following into a PyScripter script::

			    ss = "Hello, World!"
			    tt = ss.

			When you type the period to select one of the methods of `ss`, PyScripter will pop up a 
			selection window showing all the methods (there are around 70 of them --- thank goodness we'll only
			use a few of those!) that could be used on your string. 

			.. image::  illustrations/ch08/string_methods.png

			When you type the name of the method, some further help about it's parameter and return
			type, and its docstring, will be displayed.  This is a good example of a tool --- PyScripter ---
			using the meta-information --- the docstrings --- provided by the module programmers. 

			.. image::  illustrations/ch08/swapcase.png
			
			
			.. note:: 

			We've also seen lists previously.  The same indexing notation works to extract elements from
			a list::

			    >>> prime_nums = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31]
			    >>> prime_nums[4]
			    11
			    >>> friends = ["Joe", "Amy", "Brad", "Angelina", "Zuki", "Thandi", "Paris"]
			    >>> friends[3]
			    'Angelina'

				The ``string`` module contains useful functions that manipulate strings.  As
				usual, we have to import the module before we can use it.  We
				can use the same trick as before: as we type the period, PyScripter will pop
				up a selection list of the available attributes that can be accessed directly
				through the module name (``string``).  Notice that these are different from
				the methods that are attached to each string instance.

				.. sourcecode:: python

				    import string
				    ...
				    string.

				Pops up these hints:

				.. image:: illustrations/ch08/string_members.png

				You will notice that there are different icons next to some items
				in the list.  Recall that objects can have *attributes* (e.g. the
				colour of a turtle's pen), and *methods* (functions that can be called
				on the object).  The icon alongside  ``capwords`` indicates that this
				is a method that can be called.  The icon alongside ``digits`` indicate
				that this is an attribute.  It's value can be used directly::

				    >>> string.digits
				    '0123456789'
				    >>> string.hexdigits
				    '0123456789abcdefABCDEF'
				    >>> string.capwords('the cat in the hat')
				    'The Cat In The Hat'

				Actually, the built-in ``find`` method is more general than our version. It can find
				substrings, not just characters:

				.. sourcecode:: python

				    >>> "banana".find("na")
				    2
				    >>> "banana".find("na", 3)
				    4


				.. index:: character classification, uppercase, lowercase,  
				           whitespace, string module, Python Library Reference


						    >>> "?".ispunctuation()
						    Traceback (most recent call last):
						    File "<interactive input>", line 1, in <module>
						    AttributeError: 'str' object has no attribute 'ispunctuation'

						Oops!  It seems they forgot to create a method for the last one.  We'll need to do this one the long way.  
						So let's use these to remove all punction from a string, similar to our
						previous example where we removed all vowels::

						    import string

						    def remove_punctuation(s):
						        s_without_punct = ""
						        for letter in s:
						            if letter not in string.punctuation:
						                s_without_punct += letter
						        return s_without_punct

						    test(remove_punctuation('"Well, I never did!", said Alice.'),
						                                "Well I never did said Alice")
						    test(remove_punctuation("Are you very, very, sure?"),
						                                 "Are you very very sure")

						One of the most useful methods on strings is the ``split`` method:
						it splits a single multi-word string into a list of individual words, removing
						all the whitespace between them.  

						    >>> ss = remove_punctuation('"Well, I never did!", said Alice.')
						    >>> wds = ss.split()
						    >>> wds
						    ['Well', 'I', 'never', 'did', 'said', 'Alice']

						There are other useful functions in the ``string`` module, and other
						methods on string instances, but this book isn't
						intended to be a reference manual. On the other hand, the *Python Library
						Reference* is. Along with a wealth of other documentation, it's available from
						the Python website, `http://www.python.org <http://www.python.org>`__.

						**Whitespace** characters move the cursor without printing anything.  They
						create the white space between visible characters (at least on white paper).
						The constant ``string.whitespace`` contains all the whitespace characters,
						including space, tab (``\t``), and newline (``\n``).

						While we could use ``find`` and these constants, there are also string methods 
						that are much more convenient for classifying the string, for example::

						    >>> "2".isdigit()
						    True
						    >>> "x".isprintable()
						    True

						.. index:: string formatting, operations on strings, formatting; strings, justification, field width

						The format method for strings
						-----------------------------

						The easiest and most powerful way to format a string in Python 3 is to use the
						*format* method.  To see how this works, let's start with a few examples:

						.. sourcecode:: python
						    :linenos:

						    s1 = "His name is {0}!".format("Arthur")
						    print(s1)

						    name = "Alice"
						    age = 10
						    s2 = "I am {0} and I am {1} years old.".format(name, age)
						    print(s2)

						    n1 = 4
						    n2 = 5
						    s3 = "2**10 = {0} and {1} * {2} = {3:f}".format(2**10, n1, n2, n1 * n2)
						    print(s3)

						Running the script produces::

						    His name is Arthur!
						    I am Alice and I am 10 years old.
						    2**10 = 1024 and 4 * 5 = 20.000000

						The key idea is that one provides a *formatter string* which
						contains embedded *placeholder fields*, ``... {0} ... {1} ... {2} ...`` etc.
						The **format method** of a string uses the numbers as indexes into
						its arguments, and substitutes the appropriate argument into each
						placeholder fields.  

						Each of the placeholders can optionally contain an additional **format specification** ---
						it is always introduced by the ``:`` symbol.  This can control things like

						* whether the field is aligned left ``<``, centered ``^``, or right ``>``
						* the width allocated to the field within the result string (a number like ``10``)
						* the type of conversion (we'll initially only force conversion to float, ``f``, as we did in
						  line 11 of the code above, or perhaps we'll ask integer numbers to be converted to hexadecimal using ``x``)
						* if the type conversion is a float, you can also specify how many decimal places are wanted 
						  (typically, ``.2f`` is useful for working with currencies to two decimal places.)

						Let's do a few simple and common examples that should be enough for most needs.  If you need to
						do anything more esoteric, use *help* and read all the gory details.

						.. sourcecode:: python

						    n1 = "Paris"
						    n2 = "Whitney"
						    n3 = "Hilton"

						    print("The value of pi to three decimal places is {0:.3f}".format(3.1415926))
						    print("123456789 123456789 123456789 123456789 123456789 123456789")
						    print("|||{0:<15}|||{1:^15}|||{2:>15}|||Born in {3}|||".format(n1,n2,n3,1981))
						    print("The decimal value {0} converts to hex value {0:x}".format(123456))

						This script produces the output::

						    The value of pi to three decimal places is 3.142
						    123456789 123456789 123456789 123456789 123456789 123456789
						    |||Paris          |||    Whitney    |||         Hilton|||Born in 1981|||
						    The decimal value 123456 converts to hex value 1e240

						You can have multiple placeholders indexing the
						same argument, or perhaps even have extra arguments that are not referenced
						at all:

						.. sourcecode:: python

						    letter = """
						    Dear {0} {2}.
						     {0}, I have an interesting money-making proposition for you!
						     If you deposit $10 million into my bank account I can double your money ...
						    """

						    print(letter.format("Paris", "Whitney", "Hilton"))
						    print(letter.format("Bill", "Henry", "Gates"))

						This produces the following::

						    Dear Paris Hilton.
						         Paris, I have an interesting money-making proposition for you!
						         If you deposit $10 million into my bank account I can double your money ...

						    Dear Bill Gates.
						         Bill, I have an interesting money-making proposition for you!
						         If you deposit $10 million into my bank account I can double your money ...

						As you might expect, you'll get an index error if 
						your placeholders refer to arguments that you do not provide::

						    >>> "hello {3}".format("Dave")
						    Traceback (most recent call last):
						      File "<interactive input>", line 1, in <module>
						    IndexError: tuple index out of range

						The following example illustrates the real utility of string formatting:

						.. sourcecode:: python

						    print("i\ti**2\ti**3\ti**5\ti**10\ti**20")
						    for i in range(1, 11):
						        print(i, '\t', i**2, '\t', i**3, '\t', i**5, '\t', i**10, '\t', i**20)

						This program prints out a table of various powers of the numbers from 1 to 10.
						(This assumes that the tab width is 8.  You might see
						something even worse than this if you tab width is set to 4.)
						In its current form it relies on the tab character ( ``\t``) to align the
						columns of values, but this breaks down when the values in the table get larger
						than the tab width::

						    i       i**2    i**3    i**5    i**10   i**20
						    1       1       1       1       1       1
						    2       4       8       32      1024    1048576
						    3       9       27      243     59049   3486784401
						    4       16      64      1024    1048576         1099511627776
						    5       25      125     3125    9765625         95367431640625
						    6       36      216     7776    60466176        3656158440062976
						    7       49      343     16807   282475249       79792266297612001
						    8       64      512     32768   1073741824      1152921504606846976
						    9       81      729     59049   3486784401      12157665459056928801
						    10      100     1000    100000  10000000000     100000000000000000000

						One possible solution would be to change the tab width, but the first column
						already has more space than it needs. The best solution would be to set the
						width of each column independently. As you may have guessed by now, string
						formatting provides the solution.  We can also right-justify each field:

						.. sourcecode:: python

						    layout = "{0:>4}{1:>6}{2:>6}{3:>8}{4:>13}{5:>24}"

						    print(layout.format('i', 'i**2', 'i**3', 'i**5', 'i**10', 'i**20'))
						    for i in range(1, 11):
						        print(layout.format(i, i**2, i**3, i**5, i**10, i**20))


						Running this version produces the following output::

						   i  i**2  i**3    i**5        i**10                   i**20
						   1     1     1       1            1                       1
						   2     4     8      32         1024                 1048576
						   3     9    27     243        59049              3486784401
						   4    16    64    1024      1048576           1099511627776
						   5    25   125    3125      9765625          95367431640625
						   6    36   216    7776     60466176        3656158440062976
						   7    49   343   16807    282475249       79792266297612001
						   8    64   512   32768   1073741824     1152921504606846976
						   9    81   729   59049   3486784401    12157665459056928801
						  10   100  1000  100000  10000000000   100000000000000000000



						This pattern is common enough that Python provides a nicer way to implement it:

						.. sourcecode:: python

						    numbers = [1, 2, 3, 4, 5]

						    for i, value in enumerate(numbers):
						        numbers[i] = value**2

						``enumerate`` generates both the index and the value associated with it during
						the list traversal. Try this next example to see more clearly how ``enumerate``
						works:

						.. sourcecode:: python

						    >>> for i, value in enumerate(['banana', 'apple', 'pear', 'quince']):
						    ...    print(i, value)
						    ...
						    0 banana
						    1 apple
						    2 pear
						    3 quince
						    >>>


							Test-driven development (TDD)
							-----------------------------

							**Test-driven development (TDD)** is a software development practice which
							arrives at a desired feature through a series of small, iterative steps
							motivated by automated tests which are *written first* that express increasing
							refinements of the desired feature.

							Unit tests enable us to easily demonstrate TDD. Let's say we want a function
							which creates a ``rows`` by ``columns`` matrix given arguments for ``rows`` and
							``columns``.

							We first setup a skeleton for this function, and add some test cases.  We assume
							the test scaffolding from the earlier chapters is also included:

							.. sourcecode:: python

							    def make_matrix(rows, columns):
							        """ 
							          Create an empty matrix, all elements 0, of rows 
							          where each row has columns elements. 
							        """
							        return []  # dummy return value...

							    test(make_matrix(3,5), [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]])

							Running this fails, of course::

							    >>> 
							    Test on line 20 failed. Expected '[[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]', but got '[]'.
							    >>> 

							We could make the test pass by just returning what the test wants.  But a bit of forethought
							suggests we need a few more tests first::

							    test(make_matrix(4, 2), [[0, 0], [0, 0], [0, 0], [0, 0]])
							    test(make_matrix(1, 1), [[0]])
							    test(make_matrix(0, 7), [])
							    test(make_matrix(7, 0), [[], [], [], [], [], [], []])

							Notice how thinking about the test cases *first*, especially those
							tough edge condition cases, helps us create a clearer specification
							of what we need our function to do.  

							This technique is called *test-driven* because code should only be written when
							there is a failing test to make pass. Motivated by the failing tests, we can now
							produce a more general solution:

							.. sourcecode:: python

							    def make_matrix(rows, columns):
							        """ 
							          Create an empty matrix, all elements 0, of rows 
							          where each row has columns elements. 
							        """
							        return [[0] * columns] * rows 

							Running this produces the much more agreeable::

							    Test on line 20 passed.
							    Test on line 21 passed.
							    Test on line 22 passed.
							    Test on line 23 passed.
							    Test on line 24 passed.

							We may think we are finished, but when we use the new function later we discover a bug:

							.. sourcecode:: python

							    >>> m = make_matrix(4, 3)
							    >>> m
							    [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]
							    >>> m[1][2] = 7
							    >>> m
							    [[0, 0, 7], [0, 0, 7], [0, 0, 7], [0, 0, 7]]
							    >>>

							We wanted to assign the element in the second row and the third column the
							value 7, instead, *all* elements in the third column are 7!

							Upon reflection, we realize that in our current solution, each row is an
							*alias* of the other rows. This is definitely not what we intended, so we set
							about fixing the problem, *first by writing a failing test*:

							.. sourcecode:: python

							    m = make_matrix(4, 2)
							    m[2][1] = 7
							    test(m, [[0, 0], [0, 0], [0, 7], [0, 0]])

							When run, we get::

							    Test on line 20 passed.
							    Test on line 21 passed.
							    Test on line 22 passed.
							    Test on line 23 passed.
							    Test on line 24 passed.
							    Test on line 28 failed. Expected '[[0, 0], [0, 0], [0, 7], [0, 0]]', but got '[[0, 7], [0, 7], [0, 7], [0, 7]]'.

							This test is not a "one-liner" like most of our other tests have been.  It illustrates that tests can
							be arbitrarily complex, and may require some setup before we can test what we wish to.  

							Software development teams generally have people whose sole job is to 
							construct devious and complex test cases for a product.
							Being a software tester is certainly not a "secondary" role ranked 
							behind programmers, either --- development
							managers often report that the brightest and most capable programmers 
							often move into testing roles because
							they find it very challenging work, and it requires more 
							"thinking out of the box" to be able to anticipate
							situations in which some code could fail.  

							With a failing test to fix, we are now driven to a better solution:

							.. sourcecode:: python

							    def make_matrix(rows, columns):
							        """ 
							          Create an empty matrix, all elements 0, of rows
							          where each row has columns elements 
							        """
							        matrix = []
							        for r in range(rows):
							            this_row = [0] * columns
							            matrix.append(this_row)
							        return matrix

							Using TDD has several benefits to our software development process.  It:

							* helps us think concretely about the problem we are trying solve *before* we
							  attempt to solve it.
							* encourages breaking down complex problems into smaller, simpler problems and
							  working our way toward a solution of the larger problem step-by-step.
							* assures that we have a well developed automated test suite for our software,
							  facilitating later additions and improvements.



							One particular feature of ``range`` is that it 
							doesn't instantly compute all its values: it "puts off" the computation,
							and does it on demand, or "lazily".  We'll say that it gives a **promise**
							to produce the values when they are needed.   This is very convenient if your
							computation is abandoned early, as in this case::

							    def f(n):
							    """ Find the first positive integer between 101 and n that is divisible by 21 """
							        for i in range(101, n):
							           if (i % 21 == 0):
							                return i


							    test(f(110), 105)
							    test(f(1000000000), 105)


							.. sidebar:: Your Mileage May Vary

							    The acronym YMMV stands for *your mileage may vary*.  American car advertisements
							    often quoted fuel consumption figures for cars, that they would get 28 miles per
							    gallon, etc.  But this always had to be accompanied by legal small-print
							    telling you that your mileage may vary.  The term YMMV is now used
							    idiomatically to mean "your results may differ", 
							    e.g. *The battery life on this phone is 3 days, but YMMV.*     

							In the second test, if range were to eagerly go about building a list 
							with all those elements, you would soon exhaust your computer's available
							memory and crash the program.  But it is cleverer than that!  This computation works
							just fine, because the ``range`` object is just a promise to produce the elements
							if and when they are needed.  Once the condition in the `if` becomes true, no
							further elements are generated, and the function returns.  (Note: Before Python 3,
							``range`` was not lazy. If you use an earlier versions of Python, YMMV!)

							You'll sometimes find the lazy ``range`` wrapped in a call to ``list``.  This forces
							Python to turn the lazy promise into an actual list::

							    >>> range(10)           # create a lazy promise 
							    range(0, 10)
							    >>> list(range(10))     # Call in the promise, to produce a list.
							    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
							
							
							
								Memos
								-----

								If you played around with the ``fibonacci`` function from the last chapter, you
								might have noticed that the bigger the argument you provide, the longer the
								function takes to run. Furthermore, the run time increases very quickly. On one
								of our machines, ``fibonacci(20)`` finishes instantly, ``fibonacci(30)`` takes
								about a second, and ``fibonacci(40)`` takes roughly forever.

								To understand why, consider this **call graph** for ``fibonacci`` with
								``n = 4``:

								.. image:: illustrations/ch12/fibonacci.png
								   :alt: fibonacci tree 

								A call graph shows some function frames (instances when the function has
								been invoked), with lines connecting each frame to
								the frames of the functions it calls. At the top of the graph, ``fibonacci``
								with ``n = 4`` calls ``fibonacci`` with ``n = 3`` and ``n = 2``. In turn,
								``fibonacci`` with ``n = 3`` calls ``fibonacci`` with ``n = 2`` and ``n = 1``.
								And so on.

								Count how many times ``fibonacci(0)`` and ``fibonacci(1)`` are called.  This is
								an inefficient solution to the problem, and it gets far worse as the argument
								gets bigger.

								A good solution is to keep track of values that have already been computed by
								storing them in a dictionary. A previously computed value that is stored for
								later use is called a **memo**. Here is an implementation of ``fibonacci``
								using memos:

								.. sourcecode:: python

								    previous = {0: 0, 1: 1}

								    def fibonacci(n):
								        if n in previous:
								            return previous[n]
								        else:
								            new_value = fibonacci(n-1) + fibonacci(n-2)
								            previous[n] = new_value
								            return new_value

								The dictionary named ``previous`` keeps track of the Fibonacci numbers we
								already know. We start with only two pairs: 0 maps to 1; and 1 maps to 1.

								Whenever ``fibonacci`` is called, it checks the dictionary to determine if it
								contains the result. If it's there, the function can return immediately without
								making any more recursive calls. If not, it has to compute the new value. The
								new value is added to the dictionary before the function returns.

								Using this version of ``fibonacci``, our machines can compute
								``fibonacci(100)`` in an eyeblink.

								.. sourcecode:: python

								    >>> fibonacci(100)
								    354224848179261915075
								
								
									Throwing a Handful of Die
									^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

									Here is an example to generate a list containing `n` random ints between one and
									`limit`.

									.. activecode:: python

									    import random

									    def make_random_ints(num, lower_bound, upper_bound): 
									       """ 
									         Generate a list containing num random ints between lower_bound
									         and upper_bound. upper_bound is an open bound.
									       """
									       result = []
									       rng = random.Random()
									       for i in range(num):
									          result.append(rng.randrange(lower_bound, upper_bound))
									       return result

									>>> make_random_ints(5, 1, 13)  # pick 5 random month numbers
									[8, 1, 8, 5, 6] 

									Notice that we got a duplicate in the result. Often this is
									wanted, e.g. if we throw a die five times, we would expect
									duplicates. 

									But what if you don't want duplicates?  If you wanted 5 distinct months, 
									then this algorithm is wrong.  A better algorithm is to generate the 
									list of possibilities, shuffle it, and slice off the number of elements you want::

									    xs = list(range(1,13))  # make the list 1..12
									    random.shuffle(xs)      # shuffle it
									    result = xs[:5]         # take the first five elements

									In statistics courses, the first case is usually described as
									pulling balls out of a bag *with replacement* --- you put the drawn
									ball back in each time.  The latter case, with no duplicates, 
									is usually described as pulling balls out of the bag *without
									replacement*. 


.. index:: import statement, statement; import


Creating your own modules
-------------------------

All we need to create our own modules is to save our python code as 
a file with a ``.py`` extension on the filename.  Suppose,
for example, this script is saved as a file named ``seqtools.py``::

    def remove_at(pos, seq):
        return seq[:pos] + seq[pos+1:]

We can now use our module in both scripts and the Python shell. To do so, we
must first *import* the module.  

.. sourcecode:: python

    >>> import seqtools
    >>> s = "A string!"
    >>> seqtools.remove_at(4, s)
    'A sting!'


Notice that  we do not include the ``.py`` file extension when
importing. Python expects the file names of Python modules to end in ``.py``,
so the file extention is not included in the **import statement**.

The use of modules makes it possible to break up very large programs into
managable sized parts, and to keep related parts together.



There are many *modules* in Python that provide very powerful features that we
can use in our own programs.  Some of these can send email or fetch web pages. Others allow us to perform complex mathematical calculations.

Once you are comfortable with the basics of turtle graphics you can read about even
more options on the `Python Docs Website <http://docs.python.org/dev/py3k/library/turtle.html>`_.

.. admonition:: Recursion, the low-level operational view

    Another way of trying to understand recursion is to get rid of it! If we
    had separate functions to draw a level 3 fractal, a level 2 fractal, a level 1
    fractal and a level 0 fractal, we could simplify the above code, quite mechanically,
    to code where there was no longer any recursion, like this:
    
    .. sourcecode:: python
        :linenos:
        
        def koch_0(t, size):
            t.forward(size)

        def koch_1(t, size):
            for angle in [60, -120, 60, 0]:
               koch_0(t,  size/3)
               t.left(angle)

        def koch_2(t, size):
            for angle in [60, -120, 60, 0]:
               koch_1(t,  size/3)
               t.left(angle)

        def koch_3(t, size):
            for angle in [60, -120, 60, 0]:
               koch_2(t,  size/3)
               t.left(angle)
    
    This trick of "unrolling" the recursion gives us an operational view
    of what happens.  You can trace the program into ``koch_3``, and from
    there, into ``koch_2``, and then into ``koch_1``, etc., all the way down
    the different layers of the recursion.  
    
    This might be a useful hint to build your understanding.  The mental goal
    is, however, to be able to do the abstraction!


	.. index:: exception, handling an exception, exception; handling, try ... except 

	Exceptions
	----------

	Whenever a runtime error occurs, it creates an **exception**. The program stops
	running at this point and Python prints out the traceback, which ends with the
	exception that occured.

	For example, dividing by zero creates an exception:

	.. sourcecode:: python

	    >>> print 55/0
	    Traceback (most recent call last):
	      File "<interactive input>", line 1, in <module>
	    ZeroDivisionError: integer division or modulo by zero
	    >>>

	So does accessing a non-existent list item:

	.. sourcecode:: python

	    >>> a = []
	    >>> print a[5]
	    Traceback (most recent call last):
	      File "<interactive input>", line 1, in <module>
	    IndexError: list index out of range
	    >>>

	Or trying to make an item assignment on a tuple:

	.. sourcecode:: python

	    >>> tup = ('a', 'b', 'd', 'd')
	    >>> tup[2] = 'c' 
	    Traceback (most recent call last):
	      File "<interactive input>", line 1, in <module>
	    TypeError: 'tuple' object does not support item assignment
	    >>>

	In each case, the error message on the last line has two parts: the type of
	error before the colon, and specifics about the error after the colon.

	Sometimes we want to execute an operation that might cause an exception, but we
	don't want the program to stop. We can **handle the exception** using the
	``try`` statement to "wrap" a region of code.  

	For example, we might prompt the user for the name of a file and then try to
	open it. If the file doesn't exist, we don't want the program to crash; we want
	to handle the exception:

	.. sourcecode:: python

	    filename = input('Enter a file name: ')
	    try:
	        f = open (filename, "r")
	    except:
	        print('There is no file named', filename)

	The ``try`` statement has three separate clauses, or parts, 
	introduced by the keywords ``try`` ... ``except`` ... ``finally``.
	The ``finally`` clause can be omitted, so we'll consider the two-clause version
	of the ``try`` statement first.        

	The ``try`` statement executes and monitors the statements in the first block. If no
	exceptions occur, it skips the block under the ``except`` clause. If any exception occurs,
	it executes the statements in the ``except`` clause and then continues.

	We can encapsulate this capability in a function: ``exists`` takes a filename
	and returns true if the file exists, false if it doesn't:

	.. sourcecode:: python

	    def exists(filename):
	        try:
	            f = open(filename)
	            f.close()
	            return True 
	        except:
	            return False 

	.. sidebar:: How to test if a file exists, without using exceptions

	    The function we've just shown is not one we'd recommend. It opens
	    and closes the file, which is semantically different from asking "does
	    it exist?". How?  Firstly, it might update some timestamps on the file.  
	    Secondly, it might tell you that there is no such file if some other 
	    program already happens to have the file open, or if your permissions 
	    settings don't allow you to access the file.

	    Python provides a module called ``os.path`` (this is the first
	    time we've seen a module name with two namespace components). It
	    provides a number of useful functions to work with paths, files and directories,
	    so you should check out the help.  

	    .. sourcecode:: python

	        import os.path

	        # This is the preferred way to check if a file exists.
	        if os.path.isfile("c:/temp/testdata.txt"):
	           ...



	You can use multiple ``except`` clauses to handle different kinds of exceptions
	(see the `Errors and Exceptions <http://docs.python.org/tut/node10.html>`__
	lesson from Python creator Guido van Rossum's `Python Tutorial
	<http://docs.python.org/tut/tut.html>`__ for a more complete discussion of
	exceptions).

	If your program detects an error condition, you can make it **raise** an
	exception. Here is an example that gets input from the user and checks that the
	number is non-negative.

	.. sourcecode:: python

	    def get_age():
	        age = int(input('Please enter your age: '))
	        if age < 0:
	            raise ValueError('{0} is not a valid age'.format(age))
	        return age

	The ``raise`` statement creates an exception object, in this case, a ValueError 
	object, which encapsulates your specific information about the error.   
	``ValueError`` is one of the built-in exception types which
	most closely matches the kind of error we want to raise. The complete listing
	of built-in exceptions is found in  the `Built-in Exceptions
	<http://docs.python.org/lib/module-exceptions.html>`__ section of the `Python 
	Library Reference <http://docs.python.org/lib/>`__, again by Python's creator, 
	Guido van Rossum.

	If the function that called ``get_age`` handles the error, then the program can
	continue; otherwise, Python prints the traceback and exits:

	.. sourcecode:: python

	    >>> get_age()
	    Please enter your age: 42
	    42 
	    >>> get_age()
	    Please enter your age: -2
	    Traceback (most recent call last):
	      File "<interactive input>", line 1, in <module>
	      File "learn_exceptions.py", line 4, in get_age
	        raise ValueError, '{0} is not a valid age'.format(age)
	    ValueError: -2 is not a valid age
	    >>>

	The error message includes the exception type and the additional information
	you provided.

	Using exception handling, we can now modify our infinite recursion function
	so that it stops when it reaches the maximum recursion depth allowed:

	.. sourcecode:: python

	    def recursion_depth(number):
	        print("Recursion depth number", number)
	        try:
	            recursion_depth(number + 1)
	        except:
	            print("Maximum recursion depth exceeded.")

	    recursion_depth(0)

	Run this version and observe the results.

	.. index:: try ... except ... finally

	The ``finally`` clause of the ``try`` statement
	-----------------------------------------------

	A common programming pattern is to grab a resource of some kind --- e.g. 
	we create a window for turtles to draw on, or dial up a connection to our
	internet service provider, or we may open a file for writing.   
	Then we perform some computation which may raise exceptions, 
	or may work without any problems.

	In either case, we want to "clean up" the resources we grabbed --- e.g. close
	the window, disconnect our dial-up connection, or close the file.  The ``finally``
	clause of the ``try`` statement is the mechanism for doing just this.  Consider
	this (somewhat contrived) example:

	.. sourcecode:: python
	   :linenos:

	    import turtle, time

	    def show_poly():
	        try:
	            win = turtle.Screen()   # Grab or create some resource - a window...
	            tess = turtle.Turtle()
	                # This dialog could be cancelled, or the conversion to int might fail.
	            n = int(input("How many sides do you want in your polygon?"))
	            angle = 360 / n
	            for i in range(n):      # Draw the polygon 
	                tess.forward(10)
	                tess.left(angle)
	            time.sleep(3)           # make program wait for a few seconds
	        finally:         
	            win.bye()               # close the turtle's window.


	    show_poly()
	    show_poly()
	    show_poly()

	In lines 18-20, ``show_poly`` is called three times.  Each one creates a new
	window for its turtle, and draws a polygon with the number of sides
	input by the user.  But what if the user enters a string that cannot be
	converted to an int?  What if they close the dialog?  We'll get an exception, 
	*but even though we've had an exception, we still want to close the turtle's window*.  
	Lines 14-15 does this for us.  Whether we complete the statements in the ``try`` 
	clause successfully or not, the ``finally`` block will always be executed.

	Notice that the exception is still unhandled --- only an ``except`` clause can
	handle an exception, so your program will still crash.  But it's turtle window
	will be closed when it crashes! 


	.. index:: fibonacci numbers

	Case study: Fibonacci numbers  
	----------------------------- 

	The famous **Fibonacci sequence** 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 134, ... was devised by 
	Fibonacci (1170-1250), who used this to model the breeding of (pairs) of rabbits.   
	If, in generation 7 you had 21 pairs in total, of which 13 were adults, 
	then next generation the adults will all have bred new children, 
	and the previous children will have grown up to become adults.  
	So in generation 8 you'll have 13+21=34, of which 21 are adults.

	This *model* to explain rabbit breeding made the simplifying assumption that rabbits never died. 
	Scientists often make (unrealistic) simplifying assumptions and restrictions 
	to make some headway with the problem.

	If we number the terms of the sequence from 0, we can describe each term recursively
	as the sum of the previous two terms::

	    fib(0) = 0
	    fib(1) = 1
	    fib(n) = fib(n-1) + fib(n-2)  for n >= 2

	This translates very directly into some Python: 

	.. sourcecode:: python

	    def fib(n):
	        if n <= 1:
	            return n
	        t = fib(n-1) + fib(n-2)
	        return t

	This is a particularly inefficient algorithm, and we'll show one way of fixing it in the next chapter::

	    t0 = time.time()
	    n = 35
	    result = fib(n)
	    t1 = time.time()

	    print('fib({0}) = {1}, ({2:.2f} secs)'.format(n, result, t1-t0))


	We get the correct result, but an exploding amount of work! ::

	     fib(35) = 9227465, (10.54 secs)


	Example with recursive directories and files
	--------------------------------------------

	The following program lists the contents of a directory and all its subdirectories.

	.. sourcecode:: python

	    import os

	    def get_dirlist(path):
	        """ 
	          Return a sorted list of all entries in path.
	          This returns just the names, not the full path to the names.
	        """
	        dirlist = os.listdir(path)
	        dirlist.sort()
	        return dirlist

	    def print_files(path, prefix = ""):
	        """ Print recursive listing of contents of path """
	        if prefix == "":  # detect outermost call, print a heading
	            print('Folder listing for', path)
	            prefix = "| "

	        dirlist = get_dirlist(path)
	        for f in dirlist:
	            print(prefix+f)                 # print the line 
	            fullE = os.path.join(path, f)   # turn the name into a full path
	            if os.path.isdir(fullE):        # if it is a directory, recurse. 
	                print_files(fullE, prefix + "| ")

	Calling the function ``print_files`` with some folder name will produce output similar to this::       

	    Folder listing for c:\python31\Lib\site-packages\pygame\examples
	    | __init__.py
	    | aacircle.py
	    | aliens.py
	    | arraydemo.py
	    | blend_fill.py
	    | blit_blends.py
	    | camera.py
	    | chimp.py
	    | cursors.py
	    | data
	    | | alien1.png
	    | | alien2.png
	    | | alien3.png
	    ...    


.. From functions chapter

Turtles Revisited
-----------------

Now that we have fruitful functions, we can focus our attention on 
reorganizing our code so that it fits more nicely into our mental chunks.  
This process of rearrangement is called **refactoring** the code.  
 
Two things we're always going to want to do when working with turtles
is to create the window for the turtle, and to create one or more turtles.
We could write some functions to make these tasks easier in future:

.. activecode:: ch04_8

   import turtle

   def make_window(colr):   
       """
         Set up the window with the given background color. 
         Returns the new window.
       """
       w = turtle.Screen()             
       w.bgcolor(colr)
       return w
       
       
   def make_turtle(colr, sz):      
       """
         Set up a turtle with the given colour and pensize.
         Returns the new turtle.
       """
       t = turtle.Turtle()
       t.color(colr)
       t.pensize(sz)
       return t

       
   wn = make_window("lightgreen")
   tess = make_turtle("hotpink", 5)
   alex = make_turtle("black", 1)
   dave = make_turtle("yellow", 2)  
   wn.exitonclick()
   
.. admonition:: Extend this program ...

    How about adding a drawTriangle function and having each turtle draw a different size
    triangle?

The trick about refactoring code is to see which things you are likely to want to change
each time you call the function: these should become the parameters, or changeable bits,
of the functions you write.



Local variables
---------------

You might be wondering how we can use the same variable, ``i``, in both
``print_multiples`` and ``print_mult_table``. Doesn't it cause problems when
one of the functions changes the value of the variable?

The answer is no, because the ``i`` in ``print_multiples`` and the ``i`` in
``print_mult_table`` are *not* the same variable.

Variables created inside a function definition are local; you can't access a
local variable from outside its home function. That means you are free to have
multiple variables with the same name as long as they are not in the same
function.

The stack diagram for this program shows that the two variables named ``i`` are
not the same variable. They can refer to different values, and changing one
does not affect the other.

.. image:: illustrations/ch07/stack2.png
   :alt: Stack 2 diagram 

The value of ``i`` in ``print_mult_table`` goes from 1 to 6. In the diagram it
happens to be 3. The next time through the loop it will be 4. Each time through
the loop, ``print_mult_table`` calls ``print_multiples`` with the current value
of ``i`` as an argument. That value gets assigned to the parameter ``n``.

Inside ``print_multiples``, the value of ``i`` goes from 1 to 6. In the
diagram, it happens to be 2. Changing this variable has no effect on the value
of ``i`` in ``print_mult_table``.

It is common and perfectly legal to have different local variables with the
same name. In particular, names like ``i`` and ``j`` are used frequently as
loop variables. If you avoid using them in one function just because you used
them somewhere else, you will probably make the program harder to read.

The visualizer at http://netserv.ict.ru.ac.za/python3_viz/ shows very clearly how the 
two variables ``i`` are distinct variables, and how they have independent values.
(The visualizer has a limit of showing 100 steps, though --- not quite enough
to run this particular example all the way to the end.)


..index:: copy, copy; deep, copy; shallow 

Copying
-------

Aliasing can make a program difficult to read because changes made in
one place might have unexpected effects in another place. It is hard
to keep track of all the variables that might refer to a given object.

Copying an object is often an alternative to aliasing. The ``copy``
module contains a function called ``copy`` that can duplicate any
object:

.. sourcecode:: python

    
    >>> import copy
    >>> p1 = Point(3, 4)
    >>> p2 = copy.copy(p1)   # ugly!  <module_name>.<function_name> are identical! 
    >>> p1 is p2
    False
    >>> same_coordinates(p1, p2)
    True

Once we import the ``copy`` module, we can use the ``copy`` function to make
a new ``Point``. ``p1`` and ``p2`` are not the same point, but they contain
the same data.

To copy a simple object like a ``Point``, which doesn't contain any
embedded objects, ``copy`` is sufficient. This is called **shallow
copying**.

For something like a ``Rectangle``, which contains a reference to a
``Point``, ``copy`` doesn't do quite the right thing. It copies the
reference to the ``Point`` object, so both the old ``Rectangle`` and the
new one refer to a single ``Point``.

If we create a box, ``b1``, in the usual way and then make a copy, ``b2``,
using ``copy``, the resulting state diagram looks like this:

.. image:: illustrations/ch14/rectangle2.png

This is almost certainly not what we want. In this case, invoking
``grow`` on one of the ``Rectangles`` would not affect the other, but
invoking ``move`` on either would affect both! This behavior is
confusing and error-prone. The shallow copy has created an alias to the
Point that represents the corner. 

Fortunately, the ``copy`` module contains a function named ``deepcopy`` that
copies not only the object but also any embedded objects. You will not
be surprised to learn that this operation is called a **deep copy**.

.. sourcecode:: python

    >>> b2 = copy.deepcopy(b1)

Now ``b1`` and ``b2`` are completely separate objects.

