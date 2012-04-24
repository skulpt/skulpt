Implementation
--------------

Keeping in mind the definitions from the previous section, we can use
the following functions to create and manipulate a binary tree:

-  ``BinaryTree()`` creates a new instance of a binary tree.

-  ``getLeftChild()`` returns the binary tree corresponding to the left
   child of the current node.

-  ``getRightChild()`` returns the binary tree corresponding to the
   right child of the current node.

-  ``setRootVal(val)`` stores the object in parameter ``val`` in the
   current node.

-  ``getRootVal()`` returns the object stored in the current node.

-  ``insertLeft(val)`` creates a new binary tree and installs it as the
   left child of the current node.

-  ``insertRight(val)`` creates a new binary tree and installs it as the
   right child of the current node.

The key decision in implementing a tree is choosing a good internal
storage technique. Python allows us two very interesting possibilities,
so we will examine both before choosing one. The first technique we will
call “list of lists,” the second technique we will call “nodes and
references.”

List of Lists Representation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In a tree represented by a list of lists, we will begin
with Python’s list data structure and write the functions defined above.
Although writing the interface as a set of operations on a list is a bit
different from the other abstract data types we have implemented, it is
interesting to do so because it provides us with a simple recursive data
structure that we can look at and examine directly. In a list of lists
tree, we will store the value of the root node as the first element of
the list. The second element of the list will itself be a list that
represents the left subtree. The third element of the list will be
another list that represents the right subtree. To illustrate this
storage technique, let’s look at an example. Figure {fig:smalltree}
shows a simple tree and the corresponding list implementation.

.. figure:: smalltree.png
   :align: center
           
   A small tree

::

        myTree = ['a',   #root
              ['b',  #left subtree
               ['d' [], []],
               ['e' [], []] ],  
              ['c',  #right subtree
               ['f' [], []],
               [] ]  
             ]           
                  
       The list representation of the tree}



Notice that we can access subtrees of the list using standard list
slices. The root of the tree is ``myTree[0]``, the left subtree of the
root is ``myTree[1]``, and the right subtree is ``myTree[2]``. The
following Python session illustrates creating a simple tree using a
list. Once the tree is constructed, we can access the root and the left
and right subtrees. One very nice property of this list of lists
approach is that the structure of a list representing a subtree adheres
to the structure defined for a tree; the structure itself is recursive!
A subtree that has a root value and two empty lists is a leaf node.
Another nice feature of the list of lists approach is that it
generalizes to a tree that has many subtrees. In the case where the tree
is more than a binary tree, another subtree is just another list.


.. activecode:: tree_list1

    myTree = ['a', ['b', ['d',[],[]], ['e',[],[]] ], ['c', ['f',[],[]], []] ]
    print(myTree)
    print 'left subtree = ', myTree[1]
    print 'root = ', myTree[0]
    print 'right subtree = ', myTree[2]


Let’s formalize this definition of the tree data structure by providing
some functions that make it easy for us to use lists as trees. Note that
we are not going to define a binary tree class. The functions we will
write will just help us manipulate a standard list as though we are
working with a tree.

::


    def BinaryTree(r):
        return [r, [], []]    

The ``BinaryTree`` function simply constructs a list with a root node
and two empty sublists for the children. To add a left subtree to the
root of a tree, we need to insert a new list into the second position of
the root list. We must be careful. If the list already has something in
the second position, we need to keep track of it and push it down the
tree as the left child of the list we are adding. Listing {lst:linsleft}
shows the Python code for inserting a left child.

::

    def insertLeft(root,newBranch):
        t = root.pop(1)
        if len(t) > 1:
            root.insert(1,[newBranch,t,[]])
        else:
            root.insert(1,[newBranch, [], []])
        return root

Notice that to insert a left child, we first obtain the (possibly empty)
list that corresponds to the current left child. We then add the new
left child, installing the old left child as the left child of the new
one. This allows us to splice a new node into the tree at any position.
The code for ``insertRight`` is similar to ``insertLeft`` and is shown
in Listing {lst:linsright}.

::

    def insertRight(root,newBranch):
        t = root.pop(2)
        if len(t) > 1:
            root.insert(2,[newBranch,[],t])
        else:
            root.insert(2,[newBranch,[],[]])
        return root

To round out this set of tree-making functions, let’s write a couple of
access functions for getting and setting the root value, as well as
getting the left or right subtrees.

::


    def getRootVal(root):
        return root[0]
    
    def setRootVal(root,newVal):
        root[0] = newVal
    
    def getLeftChild(root):
        return root[1]
    
    def getRightChild(root):
        return root[2]

The Python session in Figure {fig:makeTreess} exercises the tree
functions we have just written. You should type in this code and try it
out for yourself. One of the exercises asks you to draw the tree
structure resulting from this set of calls.

.. activecode:: bin_tree
    :caption: A Python Session to Illustrate Basic Tree Functions

    def BinaryTree(r):
        return [r, [], []]    

    def insertLeft(root,newBranch):
        t = root.pop(1)
        if len(t) > 1:
            root.insert(1,[newBranch,t,[]])
        else:
            root.insert(1,[newBranch, [], []])
        return root

    def insertRight(root,newBranch):
        t = root.pop(2)
        if len(t) > 1:
            root.insert(2,[newBranch,[],t])
        else:
            root.insert(2,[newBranch,[],[]])
        return root

    def getRootVal(root):
        return root[0]
    
    def setRootVal(root,newVal):
        root[0] = newVal
    
    def getLeftChild(root):
        return root[1]
    
    def getRightChild(root):
        return root[2]

    r = BinaryTree(3)
    insertLeft(r,4)
    insertLeft(r,5)
    insertRight(r,6)
    insertRight(r,7)
    l = getLeftChild(r)
    print l
    
    setRootVal(l,9)
    print r
    insertLeft(l,11)
    print r
    print getRightChild(getRightChild(r))
    


{fig:makeTreess}

Nodes and References
~~~~~~~~~~~~~~~~~~~~

Our second method to represent a tree uses nodes and references. In this
case we will define a class that has attributes for the root value, as
well as the left and right subtrees. Since this representation more
closely follows the object-oriented programming paradigm, we will
continue to use this representation for the remainder of the chapter.

Using nodes and references, we might think of the tree as being
structured like the one shown in Figure {fig:treerec}.

    .. _fig_treerec:

    .. figure:: treerecs.png
       :align: center
       :alt: image

       A Simple Tree Using a Nodes and References Approach

We will start out with a simple class definition for the nodes and
references approach as shown in Listing {lst:nar}. The important thing
to remember about this representation is that the attributes ``left``
and ``right`` will become references to other instances of the
``BinaryTree`` class. For example, when we insert a new left child into
the tree we create another instance of ``BinaryTree`` and modify
``self.leftChild`` in the root to reference the new tree.

::

    class BinaryTree:
        def __init__(self,rootObj):
            self.key = rootObj
            self.leftChild = None
            self.rightChild = None
        

Notice that in Listing {lst:nar}, the constructor function expects to
get some kind of object to store in the root. Just like you can store
any object you like in a list, the root object of a tree can be a
reference to any object. For our early examples, we will store the name
of the node as the root value. Using nodes and references to represent
the tree in Figure {fig:treerec}, we would create six instances of the
BinaryTree class.

Next let’s look at the functions we need to build the tree beyond the
root node. To add a left child to the tree, we will create a new binary
tree object and set the ``left`` attribute of the root to refer to this
new object. The code for ``insertLeft`` is shown in
Listing {lst:inleft}.

::

    def insertLeft(self,newNode):
        if self.leftChild == None:
            self.leftChild = BinaryTree(newNode)
        else:  
            t = BinaryTree(newNode)
            t.leftChild = self.leftChild
            self.leftChild = t

We must consider two cases for insertion. The first case is
characterized by a node with no existing left child. When there is no
left child, simply add a node to the tree. The second case is
characterized by a node with an existing right child. In the second
case, we insert a node and push the existing child down one level in the
tree. The second case is handled by the ``else`` statement on line
{lst:inilinsrt} of Listing {lst:inleft}.

The code for ``insertRight`` must consider a symmetric set of cases.
There will either be no right child, or we must insert the node between
the root and an existing right child. The insertion code is shown in
Listing {lst:insrt}.

::

    def insertRight(self,newNode):
        if self.rightChild == None:
            self.rightChild = BinaryTree(newNode)
        else:
            t = BinaryTree(newNode)
            t.rightChild = self.rightChild
            self.rightChild = t

To round out the definition for a simple binary tree data structure, we
will write access functions for the left and right children, as well as
the root values.

::

    def getRightChild(self):
        return self.rightChild

    def getLeftChild(self):
        return self.leftChild

    def setRootVal(self,obj):
        self.key = obj

    def getRootVal(self):
        return self.key
        

Now that we have all the pieces to create and manipulate a binary tree,
let’s use them to check on the structure a bit more. Let’s make a simple
tree with node a as the root, and add nodes b and c as children. The
following Python session creates the tree and looks at the some of the
values stored in ``key``, ``left``, and ``right``. Notice that both the
left and right children of the root are themselves distinct instances of
the ``BinaryTree`` class. As we said in our original recursive
definition for a tree, this allows us to treat any child of a binary
tree as a binary tree itself. {

.. activecode:: bintree

    from pythonds.trees.binaryTree import BinaryTree
    r = BinaryTree('a')
    r.getRootVal()
    print(r.getLeftChild())
    r.insertLeft('b')
    print(r.getLeftChild())
    print(r.getLeftChild().getRootVal())
    r.insertRight('c')
    print(r.getRightChild())
    print(r.getRightChild().getRootVal())
    r.getRightChild().setRootVal('hello')
    print(r.getRightChild().getRootVal())


