Animation Test
==============


Here's a nice sorting algorithm visualization.  We can include all of javascript and source for this animation with one handy directive.

.. animation:: testanim1
   :modelfile: sortmodels.js
   :viewerfile: sortviewers.js
   :model: ShellSortModel
   :viewer: BarViewer


What if we want another animation on the same page??  This is easy too.

.. animation:: testanim2
   :modelfile: sortmodels.js
   :viewerfile: sortviewers.js
   :model: InsertionSortModel
   :viewer: BoxViewer

Lets try to add a ssearch animation

.. animation:: testanim3
   :modelfile: searchmodels.js
   :viewerfile: sortviewers.js
   :model: BinarySearchModel
   :viewer: BarViewer

Thats all there is to it.  Sphinx takes care of the rest.