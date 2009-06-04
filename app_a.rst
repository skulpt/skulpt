


Configuring Ubuntu for Python Development
=========================================

What follows are instructions for setting up an Ubuntu 8.10 ( Intrepid
) home environment for use with this book. I use Ubuntu GNU/Linux for
both development and testing of the book, so it is the only system
about which I can personally answer setup and configuration questions.

In the spirit of software freedom and open collaboration, please
contact me if you would like to maintain a similar appendix for your
own favorite system. I'd be more than happy to link to it or put it on
the Open Book Project site, provided you agree to answer user feedback
concerning it.

Thanks!

`Jeffrey Elkner <mailto:jeff@elkner.net>`__
Arlington Public Schools
Arlington, Virginia


Vim
---

`Vim <http://www.vim.org>`__ can be used very effectively for Python
development, but Ubuntu only comes with the `vim-tiny` package
installed by default, so it doesn't support color syntax highlighting
or auto-indenting.

To use Vim, do the following:


#. From the unix command prompt, run:

.. sourcecode:: python

    sudo apt-get install vim-gnome


#. Create a file in your home directory named `.vimrc` that contains
   the following:

.. sourcecode:: python

    
    syntax enable
    filetype indent on
    set et
    set sw=4
    set smarttab
    map  :w\|!python %




When you edit a file with a `.py` extension, you should now have color
systax highlighting and auto indenting. Pressing the key should run
your program, and bring you back to the editor when the program
completes.

To learn to use vim, run the following command at a unix command
prompt:

.. sourcecode:: python

    
    vimtutor



GASP
----

Several of the case studies use GASP (Graphics API for Students for
Python), which is the only additional library needed to use this book.

To install GASP, do the following:


#. Add Mathew Gallagher's personal package archive to your apt
   sources:

    + click `System -> Administration -> Software Sources`
    + select the `Third-Party Software` tab
    + click the `+ Add` button
    + paste the following into the `APT line:` text entry box:

.. sourcecode:: python

        
        deb http://ppa.launchpad.net/gasp-deb/ubuntu intrepid main


    + click the `Close` button
    + click the `Reload` button in `The information about available
      software is out-of-date` dialog box
    + click the `Close` button of the `Software Sources` window

#. Install GASP by typing the following at a command prompt:

.. sourcecode:: python

    
    sudo apt-get install python-gasp

   Or use the synaptic package manager.



`$HOME` environment
-------------------

The following creates a useful environment in your home directory for
adding your own Python libraries and executable scripts:


#. From the command prompt in your home directory, create `bin` and
   `lib/python` subdirectories by running the following commands:

.. sourcecode:: python

    
    mkdir bin lib
    mkdir lib/python


#. Add the following lines to the bottom of your `.bashrc` in your
   home directory:

.. sourcecode:: python

    
    PYTHONPATH=$HOME/lib/python
    EDITOR=vim
    
    export PYTHONPATH EDITOR

   This will set your prefered editor to Vim, add your own `lib/python`
   subdirectory for your Python libraries to your Python path, and add
   your own `bin` directory as a place to put executable scripts. You
   need to logout and log back in before your local `bin` directory will
   be in your `search path
   <http://en.wikipedia.org/wiki/Path_(variable)>`__.



Making a python script executable and runnable from anywhere
------------------------------------------------------------

On unix systems, Python scripts can be made *executable* using the
following process:


#. Add this line as the first line in the script:

.. sourcecode:: python

    
    #!/usr/bin/env python


#. At the unix command prompt, type the following to make
   `myscript.py` executable:

.. sourcecode:: python

    
    chmod +x myscript.py


#. Move `myscript.py` into your `bin` directory, and it will be
   runnable from anywhere.



