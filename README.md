# Welcome to Skulpt

[![Join the chat at https://gitter.im/skulpt/skulpt](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/skulpt/skulpt?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Skulpt is a Javascript implementation of Python 2.x.  Python that runs in your browser!  Python that runs on your iPad!  Its being used several projects including, [Interactive Python Textbooks](http://interactivepython.org) -- You can see skulpt in action there.  Try out [some turtle graphics examples](http://interactivepython.org/runestone/static/thinkcspy/PythonTurtle/InstancesAHerdofTurtles.html) to see Skulpt in action.

[![Build Status](https://travis-ci.org/skulpt/skulpt.png)](https://travis-ci.org/skulpt/skulpt)

## Origins

Skulpt is the brainchild of Scott Graham.  See [Skulpt.org](http://skulpt.org) for some early demos of skulpt in action.

Brad Miller has been shepherding the development since sometime in 2010/2011.

## How can I help?

Welcome to the Skulpt developer community! Check out the ideas list below. And then some practical things for getting started after that.

### Ideas List

We are coordinating sprints on some of the ideas below, builtins, stdlib, third party modules, and core performance [here](https://github.com/skulpt/skulpt/issues/400).  We always welcome interested developers becoming Primarily Repsonsible Persons (PRP) for features they're working on. 

6. Expand the skulpt standard library to include more modules from the CPython standard library.  So far we have math, random, turtle, time (partial) random (partial) urllib (partial) unittest, image, DOM (partial) and re (partial).  Any of the partial modules could be completed, or many other CPython modules could be added.  Potential new modules from the standard library include:  functools, itertools, collections, datetime, operator, and string.  Many of these would be relatively easy projects for a less exeperienced student to take on.

7. Over time we have had numerous requests for more advanced Python modules to be included in Skulpt.  These include, portions of matplotlib, tkinter, and numpy.  These are much more challenging because they contain C code in their implementation, but if a reasonable subset could be implemented in Javascript this would make it much easier to directly add many more python modules that rely on these three.  In addition, it would allow for skulpt to potentially be used in teaching an even broader set of topics.

5. Expand and clean up the foreign function API.  This API is critical for implementing parts of the standard library.


1. Currently builtin types (list, tuple, string, etc) are not subclassable.  Making the builtins subclassable would eliminate several known bugs in Skulpt.

1. Implement decorators.  This would enable a whole bunch of pure python modules to be added to skulpt, plus allow us to add things like properties in a nice way.

3. Do a better job of supporting Python3 semantics, but make
Python2/Python3 behavior configurable with a single flag. Sk.python3 is
already there for this purpose.  Another positive step in this direction would be to update our grammar to Python2.7.  Updating the grammar would allow us to add set literals, dictionary comprehensions, and other features present in 2.7.x and Python 3.3.x.  This would be an excellent project for a student interested in language design, parsing, and the use of abstract syntax trees.

4. Make fully workable, and expand support for DOM access as
part of the standard library.


1. Expand and improve overall language coverage.   Currently Skulpt does an excellent job of meeting the 80/20 rule.  We cover the vast majority of the language features used by the 80% (maybe even 90%) of the code.  But there are builtins that are not implemented at all, and there are builtins with only partial implementations.  

2.  Implement the hooks for a debugger. This may be a half step towards
1 or may be in a completely different direction, but allowing students
to debug line by line a program they have written would have some real
benefit.


### Building Skulpt

Building Skulpt is straightforward:

1. Clone the repository from GitHub, ideally using your own fork if you're planning on making any contributions
2. Install node.js
3. Install the jscs, jshint and jsdoc node modules using `npm install -g jscs jshint jsdoc` (you may need to use `sudo` to run this command)
4. Navigate to the repository and run `./skulpt.py dist`
5. The tests should run and you will find `skulpt.min.js` and `skulpt-stdlib.js` in the `dist`folder


### Contributing

There is plenty of work still to do in making improvements to Skulpt.  If you would like to contribute

1. Create a Github account if you don't already have one
2. Create a Fork of the Skulpt repository -- This will make a clone of the repository in your account.  **DO NOT** clone this one.  Once you've made the fork you will clone the forked version in your account to your local machine for development.
3. Read the HACKING.rst file to get the "lay of the land".  If you plan to work on creating  a module then you may also find this [blog post] (http://reputablejournal.com/posts/2011/03/adding-a-module-to-skulpt.html) helpful.
3. Check the issues list for something to do.
4. Follow the instructions above to get skulpt building
5. Fix or add your own features.  Commit and push to your forked version of the repository.  When everything is tested and ready to be incorporated into the master version...
6. Make a Pull Request to get your feature(s) added to the main repository.


## Community

Check out the mailing list:  https://groups.google.com/forum/?fromgroups#!forum/skulpt

## Acknowledgements

As time goes on its getting more dangerous to try to acknowledge everyone who has contributed to the project.  And, after all, this is git, so their names are all in the historical record.  But there are a few to call out.

* First and foremost to Scott Graham for starting the original project.
* Bob Lacatena for lots of work on Python longs
* Charles Severence for bug fixes and the re module.
* Leszek Swirski and Meredydd Luff for Suspensions
* Albert-Jan Nijburg for countless bug fixes and process improvements
* Ben Wheeler for the new and improved turtle module
* Scott Rixner and students for many bug fixes and improvements
* Of course, The complete list is here:  https://github.com/skulpt/skulpt/graphs/contributors


