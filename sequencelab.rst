.. This document is Licensed by Brad Miller Creative Commons:
   Attribution, Share Alike

Experimenting With the 3n+1 Sequence
====================================





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



#. Repeat the call to seq3np1 using a range of values, up to and including an upper bound.

#. Count the number of iterations it takes to stop.


This function also demonstrates an important pattern of computation called a **counter** (note that it is
a type of accumulator).
The variable ``count`` is initialized to 0 and then incremented each time the
loop body is executed. When the loop exits, ``count`` contains the result ---
the total number of times the loop body was executed, which is the same as the
number of digits.


#. Keep track of the maximum number of iterations.

