..  Copyright (C)  Brad Miller, David Ranum
    Permission is granted to copy, distribute and/or modify this document
    under the terms of the GNU Free Documentation License, Version 1.3 or 
    any later version published by the Free Software Foundation; with 
    Invariant Sections being Forward, Prefaces, and Contributor List, 
    no Front-Cover Texts, and no Back-Cover Texts.  A copy of the license
    is included in the section entitled "GNU Free Documentation License".
    
..  shortname:: SearchSortExercises
..  description:: Exercises about sorting and searching

Searching and Sorting
=====================




Summary
-------

-  A sequential search is :math:`O(n)` for ordered and unordered
   lists.

-  A binary search of an ordered list is :math:`O(\log n)` in the
   worst case.

-  Hash tables can provide constant time searching.

-  A bubble sort, a selection sort, and an insertion sort are
   :math:`O(n^{2})` algorithms.

-  A shell sort improves on the insertion sort by sorting incremental
   sublists. It falls between :math:`O(n)` and :math:`O(n^{2})`.

-  A merge sort is :math:`O(n \log n)`, but requires additional space
   for the merging process.

-  A quick sort is :math:`O(n \log n)`, but may degrade to
   :math:`O(n^{2})` if the split points are not near the middle of the
   list. It does not require additional space.

Key Terms
---------

========================= ========================= =========================
            binary Search               bubble Sort                  chaining
               clustering                 collision      collision resolution
           folding method                       gap             hash function
               hash table                   hashing            insertion sort
           linear probing               load factor                       map
          median of three                     merge                merge sort
        mid-square method           open addressing                 partition
    perfect hash function               pivot value         quadratic probing
               quick sort                 rehashing            selection sort
        sequential search                shell sort              short bubble
                     slot               split point                          
========================= ========================= =========================

Discussion Questions
--------------------

#. Using the hash table performance formulas given in the chapter,
   compute the average number of comparisons necessary when the table is

   -  10% full

   -  25% full

   -  50% full

   -  75% full

   -  90% full

   -  99% full

   At what point do you think the hash table is too small? Explain.

#. Modify the hash function for strings to use positional weightings.

#. We used a hash function for strings that weighted the characters by
   position. Devise an alternative weighting scheme. What are the biases
   that exist with these functions?

#. Research perfect hash functions. Using a list of names (classmates,
   family members, etc.), generate the hash values using the perfect
   hash algorithm.

#. Generate a random list of integers. Show how this list is sorted by
   the following algorithms:

   -  bubble sort

   -  selection sort

   -  insertion sort

   -  shell sort (you decide on the increments)

   -  merge sort

   -  quick sort (you decide on the pivot value)

#. Consider the following list of integers: [1,2,3,4,5,6,7,8,9,10]. Show
   how this list is sorted by the following algorithms:

   -  bubble sort

   -  selection sort

   -  insertion sort

   -  shell sort (you decide on the increments)

   -  merge sort

   -  quick sort (you decide on the pivot value)

#. Consider the following list of integers: [10,9,8,7,6,5,4,3,2,1]. Show
   how this list is sorted by the following algorithms:

   -  bubble sort

   -  selection sort

   -  insertion sort

   -  shell sort (you decide on the increments)

   -  merge sort

   -  quick sort (you decide on the pivot value)

#. Consider the list of characters: [``'P','Y','T','H','O','N'``]. Show
   how this list is sorted using the following algorithms:

   -  bubble sort

   -  selection sort

   -  insertion sort

   -  shell sort (you decide on the increments)

   -  merge sort

   -  quick sort (you decide on the pivot value)

#. Devise alternative strategies for choosing the pivot value in quick
   sort. For example, pick the middle item. Re-implement the algorithm
   and then execute it on random data sets. Under what criteria does
   your new strategy perform better or worse than the strategy from this
   chapter?

Programming Exercises
---------------------

#. Set up a random experiment to test the difference between a
   sequential search and a binary search on a list of integers.

#. Use the binary search functions given in the text (recursive and
   iterative). Generate a random, ordered list of integers and do a
   benchmark analysis for each one. What are your results? Can you
   explain them?

#. Implement the binary search using recursion without the slice
   operator. Recall that you will need to pass the list along with the
   starting and ending index values for the sublist. Generate a random,
   ordered list of integers and do a benchmark analysis.

#. Implement the ``len`` method (\_\_len\_\_) for the hash table Map ADT
   implementation.

#. Implement the ``in`` method (\_\_contains\_\_) for the hash table Map
   ADT implementation.

#. How can you delete items from a hash table that uses chaining for
   collision resolution? How about if open addressing is used? What are
   the special circumstances that must be handled? Implement the ``del``
   method for the ``HashTable`` class.

#. In the hash table map implementation, the hash table size was chosen
   to be 101. If the table gets full, this needs to be increased.
   Re-implement the ``put`` method so that the table will automatically
   resize itself when the loading factor reaches a predetermined value
   (you can decide the value based on your assessment of load versus
   performance).

#. Implement quadratic probing as a rehash technique.

#. Using a random number generator, create a list of 500 integers.
   Perform a benchmark analysis using some of the sorting algorithms
   from this chapter. What is the difference in execution speed?

#. Implement the bubble sort using simultaneous assignment.

#. A bubble sort can be modified to “bubble” in both directions. The
   first pass moves “up” the list, and the second pass moves “down.”
   This alternating pattern continues until no more passes are
   necessary. Implement this variation and describe under what
   circumstances it might be appropriate.

#. Implement the selection sort using simultaneous assignment.

#. Perform a benchmark analysis for a shell sort, using different
   increment sets on the same list.

#. Implement the ``mergeSort`` function without using the slice
   operator.

#. One way to improve the quick sort is to use an insertion sort on
   lists that have a small length (call it the “partition limit”). Why
   does this make sense? Re-implement the quick sort and use it to sort
   a random list of integers. Perform an analysis using different list
   sizes for the partition limit.

#. Implement the median-of-three method for selecting a pivot value as a
   modification to ``quickSort``. Run an experiment to compare the two
   techniques.

