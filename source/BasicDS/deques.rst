..  Copyright (C)  Brad Miller, David Ranum
    Permission is granted to copy, distribute and/or modify this document
    under the terms of the GNU Free Documentation License, Version 1.3 or 
    any later version published by the Free Software Foundation; with 
    Invariant Sections being Forward, Prefaces, and Contributor List, 
    no Front-Cover Texts, and no Back-Cover Texts.  A copy of the license
    is included in the section entitled "GNU Free Documentation License".

..  shortname:: Deques
..  description:: The deque data structure

Deques
------

We will conclude this introduction to basic data structures by looking
at another variation on the theme of linear collections. However, unlike
stack and queue, the deque (pronounced “deck”) has very few
restrictions. Also, be careful that you do not confuse the spelling of
“deque” with the queue removal operation “dequeue.”

What Is a Deque?
~~~~~~~~~~~~~~~~

A **deque**, also known as a double-ended queue, is an ordered
collection of items similar to the queue. It has two ends, a front and a
rear, and the items remain positioned in the collection. What makes a
deque different is the unrestrictive nature of adding and removing
items. New items can be added at either the front or the rear. Likewise,
existing items can be removed from either end. In a sense, this hybrid
linear structure provides all the capabilities of stacks and queues in a
single data structure. :ref:`Figure 1 <fig_basicdeque>` shows a deque of Python
data objects.

It is important to note that even though the deque can assume many of
the characteristics of stacks and queues, it does not require the LIFO
and FIFO orderings that are enforced by those data structures. It is up
to you to make consistent use of the addition and removal operations.

.. _fig_basicdeque:

.. figure:: Figures/basicdeque.png
   :align: center

   A Deque of Python Data Objects


The Deque Abstract Data Type
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The deque abstract data type is defined by the following structure and
operations. A deque is structured, as described above, as an ordered
collection of items where items are added and removed from either end,
either front or rear. The deque operations are given below.

-  ``Deque()`` creates a new deque that is empty. It needs no parameters
   and returns an empty deque.

-  ``addFront(item)`` adds a new item to the front of the deque. It
   needs the item and returns nothing.

-  ``addRear(item)`` adds a new item to the rear of the deque. It needs
   the item and returns nothing.

-  ``removeFront()`` removes the front item from the deque. It needs no
   parameters and returns the item. The deque is modified.

-  ``removeRear()`` removes the rear item from the deque. It needs no
   parameters and returns the item. The deque is modified.

-  ``isEmpty()`` tests to see whether the deque is empty. It needs no
   parameters and returns a boolean value.

-  ``size()`` returns the number of items in the deque. It needs no
   parameters and returns an integer.

As an example, if we assume that ``d`` is a deque that has been created
and is currently empty, then Table {dequeoperations} shows the results
of a sequence of deque operations. Note that the contents in front are
listed on the right. It is very important to keep track of the front and
the rear as you move items in and out of the collection as things can
get a bit confusing.

.. _tbl_dequeoperations:

============================ ============================ ================== 
         **Deque Operation**           **Deque Contents**   **Return Value** 
============================ ============================ ================== 
             ``d.isEmpty()``                       ``[]``           ``True`` 
            ``d.addRear(4)``                      ``[4]``                    
        ``d.addRear('dog')``               ``['dog',4,]``                    
       ``d.addFront('cat')``          ``['dog',4,'cat']``                    
        ``d.addFront(True)``     ``['dog',4,'cat',True]``                    
                ``d.size()``     ``['dog',4,'cat',True]``              ``4`` 
             ``d.isEmpty()``     ``['dog',4,'cat',True]``          ``False`` 
          ``d.addRear(8.4)`` ``[8.4,'dog',4,'cat',True]``                    
          ``d.removeRear()``     ``['dog',4,'cat',True]``            ``8.4`` 
         ``d.removeFront()``          ``['dog',4,'cat']``           ``True`` 
============================ ============================ ================== 

    Examples of Deque Operations

Implementing a Deque in Python
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

As we have done in previous sections, we will create a new class for the
implementation of the abstract data type deque. Again, the Python list
will provide a very nice set of methods upon which to build the details
of the deque. Our implementation (:ref:`Listing 1 <lst_dequecode>`) will assume that
the rear of the deque is at position 0 in the list.

.. _lst_dequecode:

.. activecode:: dequecode

    class Deque:
        def __init__(self):
            self.items = []

        def isEmpty(self):
            return self.items == []

        def addFront(self, item):
            self.items.append(item)

        def addRear(self, item):
            self.items.insert(0,item)

        def removeFront(self):
            return self.items.pop()

        def removeRear(self):
            return self.items.pop(0)

        def size(self):
            return len(self.items)


In ``removeFront`` we use the ``pop`` method to remove the last element
from the list. However, in ``removeRear``, the ``pop(0)`` method must
remove the first element of the list. Likewise, we need to use the
``insert`` method (line 12) in ``addRear`` since the ``append`` method
assumes the addition of a new element to the end of the list.

The following interactive Python session shows the ``Deque`` class in
action as we perform the sequence of operations from
:ref:`Table 1 <tbl_dequeoperations>`.

.. activecode:: deqtest
   :include: dequecode

   d=Deque()
   print(d.isEmpty())
   d.addRear(4)
   d.addRear('dog')
   d.addFront('cat')
   d.addFront(True)
   print(d.size())
   print(d.isEmpty())
   d.addRear(8.4)
   print(d.removeRear())
   print(d.removeFront())
   

You can see many similarities to Python code already described for
stacks and queues. You are also likely to observe that in this
implementation adding and removing items from the front is O(1) whereas
adding and removing from the rear is O(n). This is to be expected given
the common operations that appear for adding and removing items. Again,
the important thing is to be certain that we know where the front and
rear are assigned in the implementation.

Palindrome-Checker
~~~~~~~~~~~~~~~~~~

An interesting problem that can be easily solved using the deque data
structure is the classic palindrome problem. A **palindrome** is a
string that reads the same forward and backward, for example, *radar*,
*toot*, and *madam*. We would like to construct an algorithm to input a
string of characters and check whether it is a palindrome.

The solution to this problem will use a deque to store the characters of
the string. We will process the string from left to right and add each
character to the rear of the deque. At this point, the deque will be
acting very much like an ordinary queue. However, we can now make use of
the dual functionality of the deque. The front of the deque will hold
the first character of the string and the rear of the deque will hold
the last character (see :ref:`Figure 2 <fig_palindrome>`).

.. _fig_palindrome:

.. figure:: Figures/palindromesetup.png
   :align: center

   A Deque


Since we can remove both of them directly, we can compare them and
continue only if they match. If we can keep matching first and the last
items, we will eventually either run out of characters or be left with a
deque of size 1 depending on whether the length of the original string
was even or odd. In either case, the string must be a palindrome. The
complete function for palindrome-checking appears in
:ref:`Listing 2 <lst_palchecker>`.

.. _lst_palchecker:

.. activecode:: palchecker

   from pythonds.basic.deque import Deque
   def palchecker(aString):
       chardeque = Deque()

       for ch in aString:
           chardeque.addRear(ch)

       stillEqual = True

       while chardeque.size() > 1 and stillEqual:
           first = chardeque.removeFront()
           last = chardeque.removeRear()
           if first != last:
               stillEqual = False

       return stillEqual

   print(palchecker("lsdkjfskf"))
   print(palchecker("radar"))

