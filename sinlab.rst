.. This document is Licensed by Brad Miller Creative Commons:
   Attribution, Share Alike

Plotting a sine Wave
====================

Have you ever used a graphing calculator?  You can enter an equation, push a few buttons, and the calculator will draw a line.  In this exercise, we will use our turtle to plot a simple math function, the sine wave.


What is the sine function?
--------------------------

The sine function, sometimes called the sine wave, is a smooth, repetitive oscillation that occurs often in many fields including mathematics, physics, and engineering.  For this lab, we will use the math library to generate the values that
we need.

To help you, consider the following Python program.  

.. sourcecode:: python

    import math

    y = math.sin(math.radians(90))
    print(y)



In order to plot a smooth line, we will use the turtle's ``goto`` method.  ``goto`` takes two parameters, ``x`` and ``y``,
and moves the turtle to that location.  If the tail is down, a line will be drawn from the previous location to the new
location.

.. sourcecode:: python

    fred.goto(50,60)


.. activecode:: sin1

    import math
    import turtle              

    wn = turtle.Screen()      
    wn.bgcolor('lightblue')

    fred = turtle.Turtle()  

    # your code goes here

    wn.exitonclick()

