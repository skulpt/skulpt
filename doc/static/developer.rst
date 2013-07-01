Getting Started with Development on Skulpt
==========================================

There's a python script named "m" in the root that performs common operations. 'm' is a python script, so you'll need python installed.  Here is the list of things that m can do::

    USAGE: m [command] [options] [.py file]
    Where command is one of:

            run   -- given a .py file run it using skulpt  ./m run myprog.py
            test  -- run all test cases in test/run
            dist  -- create skulpt.js and builtin.js  with -u also build
                     uncompressed skulpt for debugging
            docbi -- regenerate builtin.js only and copy to doc/static

            regenparser      -- regenerate parser tests
            regenasttests    -- regen abstract symbol table tests
            regenruntests    -- regenerate runtime unit tests
            regensymtabtests -- regenerate symbol table tests
            regentests       -- regenerate all of the above

            host    -- start a simple HTTP server for testing
            upload  -- run appcfg.py to upload doc to live GAE site
            doctest -- run the GAE development server for doc testing
            nrt     -- generate a file for a new test case
            runopt  -- run a .py file optimized
            browser -- run all tests in the browser
            shell   -- run a python program but keep a shell open (like python -i)
                       ./m shell myprog.py
            vfs -- Build a virtual file system to support skulpt read tests

            debugbrowser  -- debug in the browser -- open your javascript console


Development Workflow
--------------------

A typical development workflow might be as follows.  Suppose that you want to add one of the missing builtin functions to Skulpt.  Lets say its the abs function just for the sake of example.

0.  Make a fork of the repository on github.  **DO NOT** simply clone http://github.com/bnmnetp/runestone.   **Make a Fork.**  If you don't know how to make a fork consult the documentation here:  https://help.github.com/articles/fork-a-repo

1.  Make a simple myabs.py file that contains a few lines of python that exercise the abs function.  Say it looks like this:

::

    print abs(-1.0)
    print abs(24)

2. Now go edit the source.  To implement ``abs`` you would edit the builtin.js file.  Now abs is pretty easy to add, because you can just have our skulpt version of abs call ``Math.abs``  So here it is

.. sourcecode:: javascript

   Sk.builtin.abs = function abs(x)
   {
       return Math.abs(x);
   };

You are not done yet, because builtin functions also have to be declared in the builtindict.js object as follows::

    Sk.builtins = {
    'range': Sk.builtin.range,
    'len': Sk.builtin.len,
    'min': Sk.builtin.min,
    'max': Sk.builtin.max,
    'sum': Sk.builtin.sum,
    'abs': Sk.builtin.abs,
    ...
    }

Now you can test your modifications from the command line by running::

    ./m run myabs.py


    -----
    print abs(-1.0)
    print abs(24)
    -----
    /*     1 */ var $scope0 = (function($modname) {
    /*     2 */     var $blk = 0,
    /*     3 */         $exc = [],
    /*     4 */         $gbl = {},
    /*     5 */         $loc = $gbl;
    /*     6 */     $gbl.__name__ = $modname;
    /*     7 */     while (true) {
    /*     8 */         try {
    /*     9 */             switch ($blk) {
    /*    10 */             case 0:
    /*    11 */                 /* --- module entry --- */
    /*    12 */                 //
    /*    13 */                 // line 1:
    /*    14 */                 // print abs(-1.0)
    /*    15 */                 // ^
    /*    16 */                 //
    /*    17 */                 Sk.currLineNo = 1;
    /*    18 */                 Sk.currColNo = 0
    /*    19 */
    /*    20 */
    /*    21 */                 Sk.currFilename = './myabs.py';
    /*    22 */
    /*    23 */                 var $loadname1 = $loc.abs !== undefined ? $loc.abs : Sk.misceval.loadname('abs', $gbl);
    /*    24 */                 var $call2 = Sk.misceval.callsim($loadname1, Sk.numberFromStr('-1.0'));
    /*    25 */                 Sk.misceval.print_(new Sk.builtins['str']($call2).v);
    /*    26 */                 Sk.misceval.print_("\n");
    /*    27 */                 //
    /*    28 */                 // line 2:
    /*    29 */                 // print abs(24)
    /*    30 */                 // ^
    /*    31 */                 //
    /*    32 */                 Sk.currLineNo = 2;
    /*    33 */                 Sk.currColNo = 0
    /*    34 */
    /*    35 */
    /*    36 */                 Sk.currFilename = './myabs.py';
    /*    37 */
    /*    38 */                 var $loadname3 = $loc.abs !== undefined ? $loc.abs : Sk.misceval.loadname('abs', $gbl);
    /*    39 */                 var $call4 = Sk.misceval.callsim($loadname3, Sk.numberFromStr('24'));
    /*    40 */                 Sk.misceval.print_(new Sk.builtins['str']($call4).v);
    /*    41 */                 Sk.misceval.print_("\n");
    /*    42 */                 return $loc;
    /*    43 */                 goog.asserts.fail('unterminated block');
    /*    44 */             }
    /*    45 */         } catch (err) {
    /*    46 */             if ($exc.length > 0) {
    /*    47 */                 $blk = $exc.pop();
    /*    48 */                 continue;
    /*    49 */             } else {
    /*    50 */                 throw err;
    /*    51 */             }
    /*    52 */         }
    /*    53 */     }
    /*    54 */ });
    1
    24
    -----

This is all incredibly useful information.

  * First it demonstrates that your addition actually worked.  You can see the output at the bottom.

  * Second, you can see how skulpt 'compiled' your python program into its intermediate Javascript form.  While this may not be all that helpful in this particular case it can be very very helpful in figuring out what skulpt is actually doing.

3. Now you should run all of the unit tests to make sure you have broken anything else accidentally.  This is really easy::

    ./m test

If any tests fail it will be obvious that they did, and you'll have to do some investigation to figure out why.  At the time of this writing you should see::

    run: 343/343 (+1 disabled)
    closure: skipped

4. Once you are satisfied that your extension is working fine.  You should add a test case to ``test/run``  see: `New Tests`_ for instructions. This way we will have a permanent test in the bank of test cases in order to check for any future regressions.

5. Finally make a pull request on github to have your new feature integrated into the master copy.  I probably will not accept your pull request if you haven't done step 4.

Ok, This is a pretty quick and dirty overview.  I'll try to add some more documentation over time to give you a better idea of how to do some other more difficult tasks such as:

* Modifying a builtin class
* extending the standard library
* adding more magic methods
* adding ``super()`` once *I* figure out how.


Running unit tests
------------------

The most important one: run unit tests. This runs the tests on V8 (the d8 shell), but it's included as a binary in the source tree so you shouldn't need to bother building it (if you're on Ubuntu anyway). Simply:

$ ./m

There's different categories of tests for tokenize, parse, run, and interactive, which are under the same name in the test directory. Most new tests end up in run now: run tests are simply a chunk of python code which is run on real Python and compared to the Skulpt output. When you add a new file to the test/run subdirectory, you'll need to do $ ./m regenruntests. This reruns python on the test input and caches the output to make running the Skulpt tests faster.

More tests and making the distribution
--------------------------------------

More thorough tests and build the combined one-file version of Skulpt. This combines all the source files into one, runs the tests on the combined version, runs jslint on the combined version, compresses it using YUI, runs the tests on the compressed version, and if all goes well, copies the final versions into 'dist' and 'doc':

$ ./m dist

Debugging
---------

Generally, I don't debug in the browser because it's too cumbersome. A couple tricks for debugging (though it depends on where things are going wrong of course):

print(JSON2.stringify(object, null, 2)) is the first stop to see what's going on.
print(astDump(ast)) if you're dealing with an AST tree.
$ ./m debug test/run/t123.py pretty-prints the compiled version of test/run/t123.py (i.e. the JS code), and starts a d8 shell so you can interactively call functions, or inspect values using the debug functionality of d8.

New tests
---------

In order to fabricate a test case for something new to work on, just generally write a "blah.py" that does something you're interested in, and then do:

::

    $ python blah.py

    <... output ...>

    $ ./m run blah.py

    <... output ...>

If the outputs don't match, then there's something to be fixed. Try to narrow it down to something minimal that just has one specific bug, and then add it to the test suite as test/run/tXXX.py.

There's a helper script that just looks for the next available XXX and opens vim to let you paste the test case: ./m nrt (standing for New Run Test).  nrt will automatically add the expected output and other files so that your new test will be a part of ``./m test`` for all time.

If you have done something really invasive you will want to regenerate all the tests, you can run  ``./m regenruntests``  to do this. That runs python on all the .py files and saves the output to the same name with the extension .py.real, which is what the test suite uses to compare against when running in Skulpt.   **Unless it doesn't**  In some cases we just can't make skulpt match the Python output exactly.  In this case you can create a tXXX.py.real.force file which contains the desired test output to compare against the actual output in Skulpt  For example::

    >>> print t
    <turtle.Turtle object at 0x1009a6590>

It would be impossible to arrange for you to have a turtle at exactly that address, and in any case skulpt doesn't worry about that information and would simply print out <turtle.Turtle Object>  This is a perfect example of when to use a force file.  Simply edit the real file and remove the hex address.  There are other cases where you may run into this as well.
