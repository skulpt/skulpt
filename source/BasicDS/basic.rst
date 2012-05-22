..  Copyright (C)  Brad Miller, David Ranum
    Permission is granted to copy, distribute and/or modify this document
    under the terms of the GNU Free Documentation License, Version 1.3 or 
    any later version published by the Free Software Foundation; with 
    Invariant Sections being Forward, Prefaces, and Contributor List, 
    no Front-Cover Texts, and no Back-Cover Texts.  A copy of the license
    is included in the section entitled "GNU Free Documentation License".

..  shortname:: BasicDSIntroduction
..  description:: This is the introduction to the Basic Data Structures Module

Basic Data Structures
=====================

Objectives
----------

-  To understand the abstract data types stack, queue, deque, and list.

-  To be able to implement the ADTs stack, queue, and deque using Python
   lists.

-  To understand the performance of the implementations of basic linear
   data structures.

-  To understand prefix, infix, and postfix expression formats.

-  To use stacks to evaluate postfix expressions.

-  To use stacks to convert expressions from infix to postfix.

-  To use queues for basic timing simulations.

-  To be able to recognize problem properties where stacks, queues, and
   deques are appropriate data structures.

-  To be able to implement the abstract data type list as a linked list
   using the node and reference pattern.

-  To be able to compare the performance of our linked list
   implementation with Python’s list implementation.

What Are Linear Structures?
---------------------------

We will begin our study of data structures by
considering four simple but very powerful concepts. Stacks, queues,
deques, and lists are examples of data collections whose items are
ordered depending on how they are added or removed. Once an item is
added, it stays in that position relative to the other elements that
came before and came after it. Collections such as these are often
referred to as **linear data structures**.

Linear structures can be thought of as having two ends. Sometimes these
ends are referred to as the “left” and the “right” or in some cases the
“front” and the “rear.” You could also call them the “top” and the
“bottom.” The names given to the ends are not significant. What
distinguishes one linear structure from another is the way in which
items are added and removed, in particular the location where these
additions and removals occur. For example, a structure might allow new
items to be added at only one end. Some structures might allow items to
be removed from either end.

These variations give rise to some of the most useful data structures in
computer science. They appear in many algorithms and can be used to
solve a variety of important problems.







