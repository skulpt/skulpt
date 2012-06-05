..  Copyright (C)  Brad Miller, David Ranum
    Permission is granted to copy, distribute and/or modify this document
    under the terms of the GNU Free Documentation License, Version 1.3 or 
    any later version published by the Free Software Foundation; with 
    Invariant Sections being Forward, Prefaces, and Contributor List, 
    no Front-Cover Texts, and no Back-Cover Texts.  A copy of the license
    is included in the section entitled "GNU Free Documentation License".
    
..  shortname:: RecursionExercises
..  description:: These exercises are for recursion

Summary
-------

In this chapter we have looked at examples of several recursive
algorithms. These algorithms were chosen to expose you to several
different problems where recursion is an effective problem-solving
technique. The key points to remember from this chapter are as follows:

-  All recursive algorithms must have a base case.

-  A recursive algorithm must change its state and make progress toward
   the base case.

-  A recursive algorithm must call itself (recursively).

-  Recursion can take the place of iteration in some cases.

-  Recursive algorithms often map very naturally to a formal expression
   of the problem you are trying to solve.

-  Recursion is not always the answer. Sometimes a recursive solution
   may be more computationally expensive than an alternative algorithm.

Key Terms
---------

============================= ========================== ======================= 
                    base case                    decrypt     dynamic programming
                    recursion             recursive call             stack frame
============================= ========================== ======================= 


Discussion Questions
--------------------

#. Draw a call stack for the Tower of Hanoi problem. Assume that you
   start with a stack of three disks.

#. Using the recursive rules as described, draw a
   Sierpinski triangle using paper and pencil.

#. Using the dynamic programming algorithm for making change, find the
   smallest number of coins that you can use to make 33 cents in change.
   In addition to the usual coins assume that you have an 8 cent coin.

Programming Exercises
---------------------

#. Write a recursive function to compute the factorial of a number.

#. Write a recursive function to reverse a list.

#. Modify the recursive tree program using one or all of the following
   ideas:

   -  Modify the thickness of the branches so that as the ``branchLen``
      gets smaller, the line gets thinner.

   -  Modify the color of the branches so that as the ``branchLen`` gets
      very short it is colored like a leaf.

   -  Modify the angle used in turning the turtle so that at each branch
      point the angle is selected at random in some range. For example
      choose the angle between 15 and 45 degrees. Play around to see
      what looks good.

   -  Modify the ``branchLen`` recursively so that instead of always
      subtracting the same amount you subtract a random amount in some
      range.

   If you implement all of the above ideas you will have a very
   realistic looking tree.

#. Find or invent an algorithm for drawing a fractal mountain. Hint: One
   approach to this uses triangles again.

#. Write a recursive function to compute the Fibonacci sequence. How
   does the performance of the recursive function compare to that of an
   iterative version?

#. Implement a solution to the Tower of Hanoi using three stacks to keep
   track of the disks.

#. Using the turtle graphics module, write a recursive program to
   display a Hilbert curve.

#. Using the turtle graphics module, write a recursive program to
   display a Koch snowflake.

#. Write a program to solve the following problem: You have two jugs: a
   4-gallon jug and a 3-gallon jug. Neither of the jugs have markings on
   them. There is a pump that can be used to fill the jugs with water.
   How can you get exactly two gallons of water in the 4-gallon jug?

#. Generalize the problem above so that the parameters to your solution
   include the sizes of each jug and the final amount of water to be
   left in the larger jug.

#. Write a program that solves the following problem: Three missionaries
   and three cannibals come to a river and find a boat that holds two
   people. Everyone must get across the river to continue on the
   journey. However, if the cannibals ever outnumber the missionaries on
   either bank, the missionaries will be eaten. Find a series of
   crossings that will get everyone safely to the other side of the
   river.

#. Modify the Tower of Hanoi program using turtle graphics to animate
   the movement of the disks. Hint: You can make multiple turtles and
   have them shaped like rectangles.

#. Pascal’s triangle is a number triangle with numbers arranged in
   staggered rows such that 

   .. math::
      a_{nr} = {n! \over{r! (n-r)!}}
   
   This equation is the equation for a binomial coefficient. You can
   build Pascal’s triangle by adding the two numbers that are diagonally
   above a number in the triangle. An example of Pascal’s triangle is
   shown below.

   ::

                         1
                       1   1
                     1   2   1
                   1   3   3   1
                 1   4   6   4   1

   Write a program that prints out Pascal’s triangle. Your program
   should accept a parameter that tells how many rows of the triangle to
   print.

#. Suppose you are a computer scientist/art thief who has broken into a
   major art gallery. All you have with you to haul out your stolen art
   is your knapsack which only holds :math:`W` pounds of art, but for
   every piece of art you know its value and its weight. Write a dynamic
   programming function to help you maximize your profit. Here is a
   sample problem for you to use to get started: Suppose your knapsack
   can hold a total weight of 20. You have 5 items as follows:

   :: 
   
        item     weight      value
          1        2           3
          2        3           4
          3        4           8
          4        5           8
          5        9          10

#. This problem is called the string edit distance problem, and is quite
   useful in many areas of research. Suppose that you want to transform
   the word “algorithm” into the word “alligator.” For each letter you
   can either copy the letter from one word to another at a cost of 5,
   you can delete a letter at cost of 20, or insert a letter at a cost
   of 20. The total cost to transform one word into another is used by
   spell check programs to provide suggestions for words that are close
   to one another. Use dynamic programming techniques to develop an
   algorithm that gives you the smallest edit distance between any two
   words.



