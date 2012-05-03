..  Copyright (C)  Jeffrey Elkner, Peter Wentworth, Allen B. Downey, Chris
    Meyers, and Dario Mitchell.  Permission is granted to copy, distribute
    and/or modify this document under the terms of the GNU Free Documentation
    License, Version 1.3 or any later version published by the Free Software
    Foundation; with Invariant Sections being Forward, Prefaces, and
    Contributor List, no Front-Cover Texts, and no Back-Cover Texts.  A copy of
    the license is included in the section entitled "GNU Free Documentation
    License".

Preface to the Third Edition
============================

by Jeffrey Elkner


    
The Rhodes Local Edition (RLE)
==============================

by Peter Wentworth

.. admonition:: A word of thanks ... 
 
    We switched from Java to Python in our introductory courses a year ago, and
    so far we think the results look positive. More time will tell.

    This book was a great starting point for us, especially because of the
    liberal permission to change things.  Having our own in-house course notes
    or handouts allows us to adapt and stay fresh, rearrange, see what works,
    and it gives us agility.  We can also ensure that every student in the
    course gets a copy of the handouts --- something that doesn't always happen
    if we prescribe costly textbooks in a developing country or third-world
    situation. 
    
    Many thanks to all the contributors and the authors for making their hard 
    work available to the Python community and to our students.

A colleague and friend, Peter Warren, once made the remark that learning
introductory programming is as much about the environment as it is about the
programming language. 

I'm a big fan of IDEs (Integrated Development Environments).  I want help to be
integrated into my editor, as a first-class citizen, available at the press of
a button. I want syntax highlighting.  I want immediate syntax checking, and
sensible autocompletion.  

I'm especially keen on having a single-stepping debugger and breakpoints with
code inspection built in.  We're trying to build a conceptual model of program
execution in the student's mind, so I find most helpful for teaching to have
the call stack and variables explicitly visible, and to be able to immediately
inspect the result of executing a statement.

My philosophy, then, is not to look for a language to teach, but to look for a
combination of IDE and language that are packaged together, and evaluated as a
whole. 

I've made some quite deep changes to the original book to reflect this (and
various other opinionated views that I hold), and I have no doubt that more
changes will follow if we do get to RLE versions 2, or 3, or 4.

Here are some of the key things I've approached differently:

* Our local situation demands that we have a large number of service course
  students in an introductory course of just 3 or 4 weeks, and then we get
  another semester of teaching with those going into our mainstream program.
  So the book is in two parts: we'll do the first five chapters in the
  big "get your toes wet" course, and the rest of the material in a separate
  semester. 
* We're using Python 3.  It is cleaner, more object oriented, and has fewer
  ad-hoc irregularities than earlier versions of Python. 
* We're using PyScripter as our IDE, on Windows.  And it is hardwired into
  parts of these notes, with screenshots, etc.  
* I've dropped GASP. 
* For graphics we start with the Turtle module. As things
  move along, we use PyGame for advanced graphics.  (At this revision, the
  PyGame practicals and lessons are not included in the textbook yet.)
* I have tried to push more object-oriented notions earlier, without asking
  students to synthesize objects or write their own classes.  So, for example,
  in the chapter about the turtle, we create multiple instances of turtles, 
  talk about their attributes and state (colour, position, etc), and favour
  method-call style to move them around, i.e.  ``tess.forward(100)``.
  Similarly, when we use random numbers, we avoid the "hidden singleton
  generator" in the random module --- we rather create an instance of a
  generator, and invoke methods on the instance.
* The ease of constructing lists and the ``for`` loop seem to be winners in
  Python, so rather than use the traditional command-line ``input`` for data,
  I've favoured using loops and lists right up front, like this:
  
  .. sourcecode:: python
  
        friends = ["Amy", "Joe", "Bill"]
        for f in friends:
           invitation = "Hi " + f + ".  Please come to my party on Saturday!"
           print(invitation)
        
  This also means that I bumped ``range`` up for early exposure.  I envisage
  that over time we'll see more opportunities to exploit "early lists, early
  iteration" in its most simple form. 
* I dumped ``doctest`` : it is a bit too quirky for my liking.  For example,
  it fails a test if the spacing between list elements is not precisely the same
  as the output string, or if Python prints a string with single quotes, but
  you wrote up the test case with double quotes. 
  Cases like this also confused students (and instructors) quite badly::
  
      def sum(xs):
         """
           >>> xs = [2, 3, 4]
           >>> sum(xs)
           9
         """
        ...
   
  If you can explain the difference in scope rules and lifetimes between the
  parameter ``xs`` and the doctest variable ``xs`` elegantly, please let me
  know.  (Yes, I know doctest creates its own scope behind our back, but this
  is confusing. It looks like the doctests are nested inside the function
  scope, but they are not. Students thought that the parameter had been given
  its value by the assignment in the doctest!)   
  
  I also think that keeping the test suite separate from the functions under
  test leads to a cleaner relationship between caller and callee, and gives a
  better chance of getting argument passing / parameter concepts taught
  accurately.  
  
  There is a good unit testing module in Python, (and PyScripter offers
  integrated support for it, and automated generation of skeleton test
  modules), but it looked too advanced for beginners, because it requires
  multi-module concepts.  
  
  So I've favoured my own test scaffolding in Chapter 6 (about 10 lines of
  code) that the students must insert into whatever file they're working on.
* I've played down command-line input / process / output where possible.  Many
  of our students have never seen a command-line shell, and it is arguably
  quite intimidating.     
* We've gone back to a more "classic / static" approach to writing our own
  classes and objects. Python (in company with languages like Javascript, Ruby,
  Perl, PHP, etc.) don't really emphasize notions of "sealed" classes or
  "private" members, or even "sealed instances".  
  
  So one teaching approach is to allocate each instance as an empty container,
  and subsequently allow the external clients of the class to poke new members
  (methods or attributes) into different instances as they wish to.  It is a
  very dynamic approach, but perhaps not one that encourages thinking in
  abstractions, layers, contracts, decoupling, etc.  It might even be the kind
  of thing that one could write one of those *"x,y,z ... considered harmful"*
  papers about. 
  
  In our more conservative approach, we put an initializer into every class, we
  determine at object instantiation time what members we want, and we
  initialize the instances from within the class.  So we've moved closer in
  philosophy to C# / Java.
  
* Our next intended move is to introduce more algorithms into the course.
  Python is an efficient teaching language --- we can make fast progress.  But
  the gains we make there we'd like to invest not in doing "more Python
  features", but in doing deeper problem solving, and more complex algorithms
  with the basics. This will likely be separated from the main text, perhaps in
  an addendum or appendix.  
