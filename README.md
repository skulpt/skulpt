# Welcome to Skulpt

Skulpt is a Javascript implementation of Python 2.x.  Python that runs in your browser!  Python that runs on your iPad!  Its being used several projects including, [Interactive Python Textbooks](http://interactivepython.org) -- You can see skulpt in action there.  Try out [some turtle graphics examples](http://interactivepython.org/courselib/static/thinkcspy/PythonTurtle/helloturtle.html) to see Skulpt in action.

[![Build Status](https://travis-ci.org/skulpt/skulpt.png)](https://travis-ci.org/skulpt/skulpt)

## Origins

Skulpt is the brainchild of Scott Graham.  See [Skulpt.org](http://skulpt.org) for some early demos of skulpt in action.

Brad Miller has been shepherding the development since sometime in 2010/2011.

## How can I help

Check out the ideas list below. And then some practical things for getting started after that.

### Ideas List

6. Expand the skulpt standard library to include more modules from the CPython standard library.  So far we have math, random, turtle, time (partial) random (partial) urllib (partial) unittest, image, DOM (partial) and re (partial).  Any of the partial modules could be completed, or many other CPython modules could be added.  Potential new modules from the standard library include:  functools, itertools, collections, datetime, operator, and string.  Many of these would be relatively easy projects for a less exeperienced student to take on.

7. Over time we have had numerous requests for more advanced Python modules to be included in Skulpt.  These include, portions of matplotlib, tkinter, and numpy.  These are much more challenging because they contain C code in their implementation, but if a reasonable subset could be implemented in Javascript this would make it much easier to directly add many more python modules that rely on these three.  In addition, it would allow for skulpt to potentially be used in teaching an even broader set of topics.

5. Expand and clean up the foreign function API.  This API is critical for implementing parts of the standard library.

3. Do a better job of supporting Python3 semantics, but make
Python2/Python3 behavior configurable with a single flag. Sk.python3 is
already there for this purpose.  Another positive step in this direction would be to update our grammar to Python2.7.  Updating the grammar would allow us to add set literals, dictionary comprehensions, and other features present in 2.7.x and Python 3.3.x.  This would be an excellent project for a student interested in language design, parsing, and the use of abstract syntax trees.

4. Make fully workable, and expand support for DOM access as
part of the standard library.

1. Currently builtin types (list, tuple, string, etc) are not subclassable.  Making the builtins subclassable would eliminate several known bugs in Skulpt.

1. Expand and improve overall language coverage.   Currently Skulpt does an excellent job of meeting the 80/20 rule.  We cover the vast majority of the language features used by the 80% (maybe even 90%) of the coede.  But there are builtins that are not implemented at all, and there are builtins with only partial implementations.  

1.  Change the execution model so that each line/step is interruptible.
Currently, skulplt runs an entire python program from beginning to end.  We have an interrupt timer in place to prevent programs from running more than 30 seconds, during that thirty seconds, the browser is locked up.  Over time we have had various suggestions on how to restructure the main interpreter so that the program could be interrupted after each line.  This is an advanced project, that would need a lot of testing and a lot of Javascript skill to make sure that we do not sacrifice too much performance for the gain of interruptability.

2.  Implement the hooks for a debugger. This may be a half step towards
1 or may be in a completely different direction, but allowing students
to debug line by line a program they have written would have some real
benefit.


### Practical Matters

There is plenty of work still to do in making improvements to Skulpt.  If you would like to contribute

1. Create a Github account if you don't already have one
2. Create a Fork of the Skulpt repository -- This will make a clone of the repository in your account.  **DO NOT** clone this one.  Once you've made the fork you will clone the forked version in your account to your local machine for development.
3. Check the issues list for something to do.
4. Fix or add your own features.  Commit and push to your forked version of the repository.  When everything is tested and ready to be incorporated into the master version...
5. Make a Pull Request to get your feature(s) added to the main repository.


## Community

Check out the mailing list:  https://groups.google.com/forum/?fromgroups#!forum/skulpt

## Acknowledgements

* First and foremost to Scott Graham for starting the original project.
* Bob Lacatena for lots of work on Python longs
* Charles Severence for bug fixes and the re module.

