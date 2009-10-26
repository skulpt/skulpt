..  Copyright (C)  Jeffrey Elkner, Allen B. Downey and Chris Meyers.
    Permission is granted to copy, distribute and/or modify this document
    under the terms of the GNU Free Documentation License, Version 1.3
    or any later version published by the Free Software Foundation;
    with Invariant Sections being Forward, Preface, and Contributor List, no
    Front-Cover Texts, and no Back-Cover Texts.  A copy of the license is
    included in the section entitled "GNU Free Documentation License".

Graphics API for Students of Python: GASP
=========================================

Introduction
------------

*Describe gasp here...*

Coordinates
-----------

(0, 0) is at the bottom left of the window. The window is 640 pixels by 480, by
default. (You can make it a different size if you want to.) Coordinates are
given in units of one pixel.

All functions that take coordinates take them as a tuple (x, y).

.. sourcecode:: python
    
    Circle((300, 200), 10)     # :) This is good
    Circle(300, 200, 10)       # :( This is bad


Colors
------

To access the color module GASP has to offer. Call ``color.*`` where ``*`` is
the color you wish to call. For example: ` color.BLACK ` This is the color
black. Check out the gasp color refrence chart to see all of the availble color
options.


The Essentials
--------------

.. sourcecode:: python
    
    from gasp import *
    
    begin_graphics()
    
    ... 			# all of your code
    
    end_graphics()

These are the essentials. ` from gasp import * ` imports the gasp module,
``begin_graphics()`` starts the graphics window, and ``end_graphics()`` quits
the graphics window and ends the program. It's dead simple, but also dead
necessary.


Graphics Functions
------------------


begin_graphics()
~~~~~~~~~~~~~~~~

.. sourcecode:: python
    
    begin_graphics(width=800, height=600, title="My Game", background=color.YELLOW)

This creates a graphics window with the dimensions 800x600, a title of My Game
, and a background color of yellow. With no arguments you get a white 640x480
graphics window titled Gasp .

width
    The width of the window in pixels.

height
    The windows height in pixels.

title
    A string that will be the title of the window.

background
    It is the background of the graphics window. It can either be a color or an
    image


end_graphics()
~~~~~~~~~~~~~~

.. sourcecode:: python
    
    endgraphics() 

Ends a graphics window.


clear_screen()
~~~~~~~~~~~~~~

.. sourcecode:: python
    
    clear_screen()

Clears everything off of the graphics window. It looks like a new graphcs
window as if you just called begin_graphics().


remove_from_screen()
~~~~~~~~~~~~~~~~~~~~

.. sourcecode:: python
    
    remove_from_screen(obj)

removes those objects from the screen

obj
    A screen object of a list of screen_objects you would like to remove from
    the screen


Screen Objects
--------------

The objects that you will be displayed in your graphics window. You can
manipulate these objects using the screen object methods


Plot
~~~~

.. sourcecode:: python
    
    Plot(pos, color=color.black, size=1)

It puts a dot on the screen.

pos
    The coordinate on the screen that you wish to plot.

color
    The color you wish the dot to be.

size
    An integer that determinse the size the of the dot


Line
~~~~

.. sourcecode:: python
    
    Line(start, end, color=color.black)

Creates a line on the screen.

start
    The starting coordinate of the line.

end
    The coordinate at which the line will end.

color
    The color of the line


Box
~~~

.. sourcecode:: python
    
    Box(center, width, height, filled=False, color=color.black, thickness=1)

This creates a Box on the screen

center
    A coorinate where the center of your box will be.

width
    The width in pixels of the box.

height
    The height of the box in pixels.

filled
    A boolean value that determines if your box will be filled

color
    The color of your box.

thickness
    The thickness in pixels of your box's lines.


Polygon
~~~~~~~

.. sourcecode:: python
    
    Polygon(points, filled=False, color=color.black, thickness=1) 


Creates a polygon on the screen

points
    A list of coorinates that is each point on the polygon. The must be more
    than two items in the list

filled
    A boolean value. If it is False the polygon will not be filled. Else, the
    polygon will not be filled

color
    The color of the polygon's lines

thickness
    An integer that determines the thickness of the lines.


Circle
~~~~~~

.. sourcecode:: python
    
    Circle(center, radius, filled=False, color=color.black, thickness=1)

Draws a circle, its ``center`` is a set of coordinates, and the ``radius``
is in pixels. It defaults to not being filled and the color black.

center
    The circle's center coordinate.

width
    An integer that is the radius of the circle

filled
    A boolean value that determines if your circle will be filled

color
    The color of your circle.

thickness
    The thickness in pixels of the circles lines.


Arc
~~~

.. sourcecode:: python
    
    Arc(center, radius, start_angle, end_angle, filled=False, color=color.black, thickness=1)

Creates an arc on the screen.

center
    A coordinate that is the center of the arc.

radius
    An integer that is the distance between the center and the outer edge of
    the arc.

start_angle
    The start angle in degrees of the arc

end_angle
    The end angle in degrees of your arc
    
filled
    A boolean value that if True it fills the arc

color
    The color the arc

thickness
    The thickness in pixels of the arc


Oval
~~~~

.. sourcecode:: python
    
    Oval(center, width, height, filled=False, color=color.black, thickness=1)

Puts an oval on the screen wherever you want.

center
    The center coordinate of the Oval

width
    The width in pixels of the oval

height
    The height of the oval in pixels

filled
    A boolean value determining if the oval will be filles or not.
    
color
    The oval's color
    
thickness
    The thickness of the ovals lines


Image
~~~~~

.. sourcecode:: python
    
    Image(file_path, center, width=None, height=None):

Loads an image onto the screen. If you only pass a width and not a height it
automatically scales the height to fit the width you passed it. It behaves
likewise when you pass just a height.

file_path
    The path to the image

center
    The center coordinates of the image

width
    The width of the image in pixels. If width equals None then it defaults to
    the image file's width

height
    The height of the image in pixels. If no height is passed it defaults to
    the image file's height


Screen Object Methods
---------------------

The methods that manipulates screen objects


move_to()
~~~~~~~~~

.. sourcecode:: python
    
    move_to(obj, pos)

Move a screen object to a pos

obj
    A screen object you wish to move.

pos
    The coordinate on the screen that the object will move to


move_by()
~~~~~~~~~

.. sourcecode:: python
    
    move_by(obj, dx, dy)

Move a screen object relative to it's position

obj
    The screen object you wish to move

dx
    How much the object will move in the 'x' direction. Positive or negative.

dy
    How much the object will move in the 'y' direction. A pixel value.


rotate_to()
~~~~~~~~~~~

.. sourcecode:: python
    
    rotate_to(obj, angle)

Rotate an object to an angle

obj
    The screen object that will be rotated

angle
    The angle in degrees that the object will be rotated to


rotate_by()
~~~~~~~~~~~

.. sourcecode:: python
    
    rotate_by(obj, angle)

Rotate an object a certain degree.

obj
    The screen object you wish to rotate
    
angle
    The degree that the object will be rotate. Can be positive or negative.


Text
----


Text()
~~~~~~

.. sourcecode:: python
    
    Text(text, pos, color=color.black, size=12)

Puts text on the screen

text
    A string of the text that will be displayed
    
pos
    The center coordinate of the text

color
    The color of the text

size
    The font size


Mouse
-----


mouse_position()
~~~~~~~~~~~~~~~~

.. sourcecode:: python

    
    mouse_position()

Returns the current mouse coordinate


mouse_buttons()
~~~~~~~~~~~~~~~

.. sourcecode:: python
    
    mouse_buttons()

returns a dictionary of the buttons state. There is a 'left', 'middle', and
'right' key.

Keyboard
--------


keys_pressed()
~~~~~~~~~~~~~~

.. sourcecode:: python
    
    keys_pressed()

returns a list of all of the keys pressed at that moment.


Gasp Tools
----------


screen_shot
~~~~~~~~~~~

.. sourcecode:: python
    
    screen_shot(filename)

Saves a screenshot of the current graphics screen to a png file.

filename
    The file path relative to the current directory that the image will be
    written to.
