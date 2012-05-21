Runestone Interactive Tools and Content
=======================================


Dependencies
------------

There are a couple of prerequisites you need to satisfy before you
can build and use this eBook.

First get Sphinx, Version 1.1.x is current as of this writing.

http://sphinx.pocoo.org

Follow the instructions there to download and install Sphinx.

Next, get our eBook extensions You can check these out from our
mercurial repository at:

http://github.com/bnmnetp/eBookExtensions

Once you've got the repo just type ``python setup.py install`` and the
extensions to sphinx needed for this book will be installed in your
site-packages directory.

If you want to run a full blown server -- so you can save activecode assignments etc. then you will need to download and install web2py.  http://web2py.com

Building the Book
-----------------

Once you the above installed, you can type ``make html`` from the command
line and that will build the book.  You can find the build results in the
build directory.  At this point you can simply open index.html and go from there.  

Browser Notes
-------------
Note, because this interactive edition makes use of lots of html5 and javascript
I highly recommend either Chrome, or Safari.  Firefox 6+ works too, but has
proven to be less reliable than the first two.  I have no idea whether this works
at all under later versions of Internet Explorer.

