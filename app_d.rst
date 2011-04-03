..  Copyright (C)  Jeffrey Elkner, Peter Wentworth, Allen B. Downey, Chris
    Meyers, and Dario Mitchell.  Permission is granted to copy, distribute
    and/or modify this document under the terms of the GNU Free Documentation
    License, Version 1.3 or any later version published by the Free Software
    Foundation; with Invariant Sections being Forward, Prefaces, and
    Contributor List, no Front-Cover Texts, and no Back-Cover Texts.  A copy of
    the license is included in the section entitled "GNU Free Documentation
    License".

Customizing and Contributing to the Book
========================================

    *Note:* the following instructions assume that you are connected to
    the Internet and that you have both the ``main`` and ``universe``
    package repositories enabled.  All unix shell commands are assumed to
    be running from your home directory ($HOME).  Finally, any command that
    begins with ``sudo`` assums that you have administrative rights on your
    machine.  If you do not --- please ask your system administrator about
    installing the software you need.

This book is free as in freedom, which means you have the right to modify it
to suite your needs, and to redistribute your modifications so that our whole
community can benefit.

That freedom lacks meaning, however, if you the tools needed to make a
custom version or to contribute corrections and additions are not within your
reach.  This appendix attempts to put those tools in your hands.

Thanks!

| `Jeffrey Elkner <mailto:jeff@elkner.net>`__
| Governor's Career and Technical Academy in Arlington 
| Arlington, Virginia


Getting the Source
------------------

This book is `marked up <http://en.wikipedia.org/wiki/Markup_language>`__ in
`ReStructuredText <http://en.wikipedia.org/wiki/ReStructuredText>`__ using
a document generation system called
`Sphinx <http://en.wikipedia.org/wiki/Sphinx_%28documentation_generator%29>`__.

The source code is located on the `Launchpad website <http://en.wikipedia.org/wiki/Launchpad_%28website%29>`__ at http://bazaar.launchpad.net/~thinkcspy/thinkcspy/english2e/files.

The easiest way to get the source code on an Ubuntu 9.10 computer is: 

#. run ``sudo apt-get install bzr`` on your system to install
   `bzr <http://en.wikipedia.org/wiki/Bazaar_%28software%29>`__.
#. run ``bzr branch lp:thinkcspy``.

The last command above will download the book source from Launchpad into a
directory named ``thinkcspy`` which contains the Sphinx source and
configuration information needed to build the book.


Making the HTML Version
-----------------------

To generate the html version of the book:

#. run ``sudo apt-get install python-sphinx`` to install the Sphinx
   documentation system.
#. ``cd thinkcspy`` - change into the ``thinkcspy`` directory containing the
   book source.
#. ``make html``.

The last command will run sphinx and create a directory named ``build``
containing the html verion of the text.

    *Note*: Sphinx supports building other output types as well, such as
    `PDF <http://en.wikipedia.org/wiki/PDF>`__.  This requires that
    `LaTeX <http://en.wikipedia.org/wiki/LaTeX>`__ be present on your
    system.  Since I only personally use the html version, I will not
    attempt to document that process here.
