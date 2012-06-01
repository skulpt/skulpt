Runestone Interactive Tools and Content
=======================================

Important Notice
----------------

This is the consolidated repository for all work related to our interactive textbook project.  If you were using the 
thinkcspy repository and the eBookExtensions repository you will find all of that work here.  Thanks.

Dependencies
------------

There are a couple of prerequisites you need to satisfy before you
can build and use this eBook.

First get Sphinx, Version 1.1.x is current as of this writing.

http://sphinx.pocoo.org

Follow the instructions there to download and install Sphinx.

If you want to run a full blown server -- so you can save activecode assignments etc. then you will need to download and install web2py.  http://web2py.com

After you install web2py go to the applications folder and check out this repository.  This will be installed as a web2py application automatically.

Building the Book
-----------------

Once you the above installed, you can type ``make html`` from the command
line and that will build a version of our eBook with every moddule.  You can find the build results in the static/devcourse directory.  At this point you can simply open index.html and go from there.  There are also two pre-configured textbooks that you can build.  The first, How to Think Like a Computer Scientist: Interactive Edition can be built by typing ``make thinkcspy``  The second:  Problem Solving with Algorithms and Data Structures can be built with the command ``make pythonds``


Running the Server
------------------

Once you've built the book using the steps above.  You can start the web2py development server by simply running  python web2py.py.  This will bring up a little gui where you can make up an admin password and click start server.  When the server is running your browswer will open to the welcome application.  To see this app simply use the url:  http://127.0.0.1/courselib    -- From there you can register yourself as a user for dev course, which will redirect you to the index for devcourse.  Or if you have built them, you can click on the link for How to think..., or Problem Solving...

Browser Notes
-------------
Note, because this interactive edition makes use of lots of HTML 5 and Javascript
I highly recommend either Chrome, or Safari.  Firefox 6+ works too, but has
proven to be less reliable than the first two.  I have no idea whether this works
at all under later versions of Internet Explorer.

