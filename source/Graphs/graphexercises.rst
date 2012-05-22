..  Copyright (C)  Brad Miller, David Ranum
    Permission is granted to copy, distribute and/or modify this document
    under the terms of the GNU Free Documentation License, Version 1.3 or 
    any later version published by the Free Software Foundation; with 
    Invariant Sections being Forward, Prefaces, and Contributor List, 
    no Front-Cover Texts, and no Back-Cover Texts.  A copy of the license
    is included in the section entitled "GNU Free Documentation License".
    
..  shortname:: GraphsExercises
..  description:: These are graph exercises


Summary
-------

In this chapter we have looked at the graph abstract data type, and some
implementations of a graph. A graph enables us to solve many problems
provided we can transform the original problem into something that can
be represented by a graph. In particular, we have seen that graphs are
useful to solve problems in the following general areas.

-  Breadth first search for finding the unweighted shortest path.

-  Dijkstra’s algorithm for weighted shortest path.

-  Depth first search for graph exploration.

-  Strongly connected components for simplifying a graph.

-  Topological sort for ordering tasks.

-  Minimum weight spanning trees for broadcasting messages.

Key Terms
---------

===================================== =================================== ===================================
acyclic graph                         adjacency list                      adjacency matrix
adjacent                              breadth first search (BFS)          cycle
cyclic graph                          DAG                                 depth first forest
depth first search (DFS)              digraph                             directed acyclic graph (DAG)
directed graph                        edge cost                           edge
parenthesis property                  path                                shortest path
spanning tree                         strongly connected components (SCC) topological sort & uncontrolled flooding
vertex                                weight
===================================== =================================== ===================================


Discussion Questions
--------------------

#. Draw the graph corresponding to the following adjacency matrix.

.. figure:: Figures/adjMatEx.png
   :align: center


#. Draw the graph corresponding to the following list of edges.

           +--------+------+--------+
           | from   | to   | cost   |
           +========+======+========+
           | 1      | 2    | 10     |
           +--------+------+--------+
           | 1      | 3    | 15     |
           +--------+------+--------+
           | 1      | 6    | 5      |
           +--------+------+--------+
           | 2      | 3    | 7      |
           +--------+------+--------+
           | 3      | 4    | 7      |
           +--------+------+--------+
           | 3      | 6    | 10     |
           +--------+------+--------+
           | 4      | 5    | 7      |
           +--------+------+--------+
           | 6      | 4    | 5      |
           +--------+------+--------+
           | 5      | 6    | 13     |
           +--------+------+--------+

#. Ignoring the weights, perform a breadth first search on the graph
   from the previous question.

#. What is the Big-O running time of the ``buildGraph`` function?

#. Derive the Big-O running time for the topological sort algorithm.

#. Derive the Big-O running time for the strongly connected components
   algorithm.

#. Show each step in applying Dijkstra’s algorithm to the graph shown above.

#. Using Prim’s algorithm, find the minimum weight spanning tree for the
   graph shown above.

#. Draw a dependency graph illustrating the steps needed to send an
   email. Perform a topological sort on your graph.

#. Derive an expression for the base of the exponent used in expressing
   the running time of the knights tour.

#. Explain why the general DFS algorithm is not suitable for solving the
   knights tour problem.

#. What is the Big-O running time for Prim’s minimum spanning tree
   algorithm?

Programming Exercises
---------------------

#. Modify the depth first search function to produce a topological sort.

#. Modify the depth first search to produce strongly connected
   components.

#. Write the ``transpose`` method for the ``Graph`` class.

#. Using breadth first search write an algorithm that can determine the
   shortest path from each vertex to every other vertex. This is called
   the all pairs shortest path problem.

#. Using breadth first search revise the maze program from
   the recursion chapter to find the shortest path out of a maze.

#. Write a program to solve the following problem: You have two jugs, a
   4-gallon and a 3-gallon. Neither of the jugs has markings on them.
   There is a pump that can be used to fill the jugs with water. How can
   you get exactly two gallons of water in the 4 gallon jug?

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


