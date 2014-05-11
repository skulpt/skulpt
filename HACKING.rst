Some things you need to know to hack on Skulpt
==============================================

Skulpt is a pretty complex system, and there is very little documentation about the core concepts in skulpt. This document is an attempt to create document answers to important questions developers might have who want to start hacking on skulpt.

I started this document in response to issue #182 (thanks @mseddon).  Please check that issue and feel free to contribute to the discussion there.

The Source
----------

The src directory contains the javascript that implements skulpt as well as parts of the standard library.  library modules are in src/lib.  The source files could roughly be divided into two pieces.  The compiler and the runtime.  The compiler files are:  ``ast.js, parser.js, symtable.js, compile.js, and tokenize.js``  The compiler part of skulpt reads python code and generates a Javascript program.  If you want to change the syntax of Python these are the files to look at.  The syntax used in skulpt is taken right from the Python 2.6.5 distribution.

When you run the program in the browser the javascript part is 'evaled' by javascript.  The runtime files roughly correspond to all of the major object types in Python plus builtins:

* abstract.js  -- contains lots of abstract function defs 
* biginteger.js  -- implements Python's long integer type
* bool.js
* skulpt-stdlib.js  -- builtin functions: range, min, max, etc. are defined here
* builtindict.js -- Provides a mapping from the standard Python name to the internal name in skulpt-stdlib.js
* dict.js
* enumerate.js
* env.js
* errors.js  -- Exceptions are defined here
* file.js
* float.js
* function.js
* generator.js
* import.js
* int.js
* list.js
* long.js
* mergesort.js  -- old version of mergesort.  Not used anymore -- see timsort  Should be removed
* method.js
* module.js
* native.js
* number.js
* object.js  -- most things "inherit" from object this contains source for GenericXxx functions
* set.js
* slice.js
* str.js
* timsort.js
* tuple.js
* type.js

Perhaps one of the trickiest things to remember about Skulpt is that we are always moving back and forth between Python objects and Javascript objects.  For example Python string objects have a ``v`` attribute that contains the Javascript string.  Numeric objects also contain a ``v`` object to represent the javascript number.   functions are similar, Python functions are not the same as Javascript functions, and so need to be handled differently.  You can't just call a user defined python function that has been compiled to javscript and expect it to behave.  Thats what ``Sk.misceval.callsim`` is for.  The two files below are here to make the transition back and forth from Javascript to Python more clear.  Although the code tends to be inconsistent about using some of the ffi functions and you will see ``blah.v`` used in many places where it would be better to use ``Sk.ffi.unwrapo(blah)``.

* ffi.js
* misceval.js


The Generated Code
------------------

Perhaps one of the most instructive things you can do to understand Skulpt and how the pieces begin to fit together is to look at a simple Python program, and its translation to Javscript.  So lets begin with Hello World.

Python Version
~~~~~~~~~~~~~~

.. code-block:: python

    print "hello world"

Javascript Translation
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: javascript

    /*     1 */ var $scope0 = (function($modname) {
    /*     2 */     var $blk = 0,
    /*     3 */         $exc = [],
    /*     4 */         $gbl = {},
    /*     5 */         $loc = $gbl,
    /*     6 */         $err = undefined;
    /*     7 */     $gbl.__name__ = $modname;
    /*     8 */     Sk.globals = $gbl;
    /*     9 */     try {
    /*    10 */         while (true) {
    /*    11 */             try {
    /*    12 */                 switch ($blk) {
    /*    13 */                 case 0:
    /*    14 */                     /* --- module entry --- */
    /*    15 */                     //
    /*    16 */                     // line 1:
    /*    17 */                     // print "hello world"
    /*    18 */                     // ^
    /*    19 */                     //
    /*    20 */                     Sk.currLineNo = 1;
    /*    21 */                     Sk.currColNo = 0
    /*    22 */
    /*    23 */
    /*    24 */                     Sk.currFilename = './simple.py';
    /*    25 */
    /*    26 */                     var $str1 = new Sk.builtins['str']('hello world');
    /*    27 */                     Sk.misceval.print_(new Sk.builtins['str']($str1).v);
    /*    28 */                     Sk.misceval.print_("\n");
    /*    29 */                     return $loc;
    /*    30 */                     throw new Sk.builtin.SystemError('internal error: unterminated block');
    /*    31 */                 }
    /*    32 */             } catch (err) {
    /*    33 */                 if ($exc.length > 0) {
    /*    34 */                     $err = err;
    /*    35 */                     $blk = $exc.pop();
    /*    36 */                     continue;
    /*    37 */                 } else {
    /*    38 */                     throw err;
    /*    39 */                 }
    /*    40 */             }
    /*    41 */         }
    /*    42 */     } catch (err) {
    /*    43 */         if (err instanceof Sk.builtin.SystemExit && !Sk.throwSystemExit) {
    /*    44 */             Sk.misceval.print_(err.toString() + '\n');
    /*    45 */             return $loc;
    /*    46 */         } else {
    /*    47 */             throw err;
    /*    48 */         }
    /*    49 */     }
    /*    50 */ });


So, one line of python becomes 50 lines of Javscript.  Luckily lots of this is boiler plate that is the same for every program.  One important convention is that variables that start with a $ are variables that are generated by the compiler.  So, in the above example $scope0, $blk, $str1, etc are all generated by the compiler not by the Python program.  Each line of the python program gets a corresponding entry in the Sk.currLineNo so that runtime error messages or exceptions can reference the line that caused them.

For now lets concentrate on the parts of the code that were generated specifically for our program.  That would be lines 26-29 above.

* 26: The compiler creates a variable to hold the string literal "hello world"  A Python version of the string literal is created by calling the constructor ``Sk.builtins['str']`` passing the javascript string literal.
* 27: The ``Sk.misceval.print_`` function is called.  Here is an interesting part of the runtime.  The code for Sk.misceval.print_ is below.  The key line is  ``Sk.output(s.v)``  ``Sk.output`` is configurable to be any function that the web developer might want to provide.  For example you might write a function that takes a javascript string as a parameter and updates a pre element.  Or you might simply write a function that calls alert.  Notice that ``print_`` simply expects to get an object.  It converts this object into a Python string object by once again calling the string constructor ``Sk.builtin.str``.  If you've been keeping close watch, this is actually the third time our string liter has undergone this transformation.  Luckily the string constructor is smart enough to simply return its parameter if the parameter is already a Python string.  You might logically ask why does the compiler emit a call on line 27 when the runtime function takes care of the same issue.  Not sure, maybe this is an optimization.

.. code-block:: javascript

   Sk.misceval.print_ = function(x)   // this was function print(x)   not sure why...
   {
       if (Sk.misceval.softspace_)
       {
           if (x !== "\n") Sk.output(' ');
           Sk.misceval.softspace_ = false;
       }
       var s = new Sk.builtin.str(x);
       Sk.output(s.v);
       var isspace = function(c)
       {
           return c === '\n' || c === '\t' || c === '\r';
       };
       if (s.v.length === 0 || !isspace(s.v[s.v.length - 1]) || s.v[s.v.length - 1] === ' ')
           Sk.misceval.softspace_ = true;
   };
   
   
* 28:  print always results in a newline.  So do it.
* 29:  done return.  This gets us out of the while(true) loop.   


Naming Conventions
------------------

* ``Sk``   The ``Sk`` object contains all of the core Skulpt objects and functions.  Its pretty easy to get from Sk.blah to its source.  Usually you will see something like ``Sk.builtin.foo``  which indicates that you should look in ``skulpt-stdlib.js`` to find the source for foo.  Similarly ``Sk.misceval.callsim`` tells you that you should look in ``misceval.js`` for the callsim function.
* $xxx  represents a compiler generated variable
* tp$xxx   These things represent the ``magic methods`` for an object that are defined by the Skulpt system itself.  So for example ``__str__`` is called ``tp$str``.  I always think of tp as a mnemonic for type.
* mp$xxx  similar to tp but for sequences.  As best as I know these are almost always related to subscripts.


Ok, lets look at a slightly more complex example:

Python
~~~~~~

.. code-block:: python

   x = 1
   y = 2
   z = x + y
   print z


Javascript
~~~~~~~~~~

.. code-block:: javascript

   /*     1 */ var $scope0 = (function($modname) {
   /*     2 */     var $blk = 0,
   /*     3 */         $exc = [],
   /*     4 */         $gbl = {},
   /*     5 */         $loc = $gbl,
   /*     6 */         $err = undefined;
   /*     7 */     $gbl.__name__ = $modname;
   /*     8 */     Sk.globals = $gbl;
   /*     9 */     try {
   /*    10 */         while (true) {
   /*    11 */             try {
   /*    12 */                 switch ($blk) {
   /*    13 */                 case 0:
   /*    14 */                     /* --- module entry --- */
   /*    15 */                     //
   /*    16 */                     // line 1:
   /*    17 */                     // x = 1
   /*    18 */                     // ^
   /*    19 */                     //
   /*    20 */                     Sk.currLineNo = 1;
   /*    21 */                     Sk.currColNo = 0
   /*    22 */
   /*    23 */
   /*    24 */                     Sk.currFilename = './simple.py';
   /*    25 */
   /*    26 */                     $loc.x = new Sk.builtin.nmber(1, 'int');
   /*    27 */                     //
   /*    28 */                     // line 2:
   /*    29 */                     // y = 2
   /*    30 */                     // ^
   /*    31 */                     //
   /*    32 */                     Sk.currLineNo = 2;
   /*    33 */                     Sk.currColNo = 0
   /*    34 */
   /*    35 */
   /*    36 */                     Sk.currFilename = './simple.py';
   /*    37 */
   /*    38 */                     $loc.y = new Sk.builtin.nmber(2, 'int');
   /*    39 */                     //
   /*    40 */                     // line 3:
   /*    41 */                     // z = x + y
   /*    42 */                     // ^
   /*    43 */                     //
   /*    44 */                     Sk.currLineNo = 3;
   /*    45 */                     Sk.currColNo = 0
   /*    46 */
   /*    47 */
   /*    48 */                     Sk.currFilename = './simple.py';
   /*    49 */
   /*    50 */                     var $loadname1 = $loc.x !== undefined ? $loc.x : Sk.misceval.loadname('x', $gbl);
   /*    51 */                     var $loadname2 = $loc.y !== undefined ? $loc.y : Sk.misceval.loadname('y', $gbl);
   /*    52 */                     var $binop3 = Sk.abstr.numberBinOp($loadname1, $loadname2, 'Add');
   /*    53 */                     $loc.z = $binop3;
   /*    54 */                     //
   /*    55 */                     // line 4:
   /*    56 */                     // print z
   /*    57 */                     // ^
   /*    58 */                     //
   /*    59 */                     Sk.currLineNo = 4;
   /*    60 */                     Sk.currColNo = 0
   /*    61 */
   /*    62 */
   /*    63 */                     Sk.currFilename = './simple.py';
   /*    64 */
   /*    65 */                     var $loadname4 = $loc.z !== undefined ? $loc.z : Sk.misceval.loadname('z', $gbl);
   /*    66 */                     Sk.misceval.print_(new Sk.builtins['str']($loadname4).v);
   /*    67 */                     Sk.misceval.print_("\n");
   /*    68 */                     return $loc;
   /*    69 */                     throw new Sk.builtin.SystemError('internal error: unterminated block');
   /*    70 */                 }
   /*    71 */             } catch (err) {
   /*    72 */                 if ($exc.length > 0) {
   /*    73 */                     $err = err;
   /*    74 */                     $blk = $exc.pop();
   /*    75 */                     continue;
   /*    76 */                 } else {
   /*    77 */                     throw err;
   /*    78 */                 }
   /*    79 */             }
   /*    80 */         }
   /*    81 */     } catch (err) {
   /*    82 */         if (err instanceof Sk.builtin.SystemExit && !Sk.throwSystemExit) {
   /*    83 */             Sk.misceval.print_(err.toString() + '\n');
   /*    84 */             return $loc;
   /*    85 */         } else {
   /*    86 */             throw err;
   /*    87 */         }
   /*    88 */     }
   /*    89 */ });
   
   
So, here we create some local variables.  x, y, do some math to create a third local variable z, and then print it.  Line 26 illustrates creating a local variable ``x`` (stored as an attribute of $loc)  ``new Sk.builtin.nmber(1, 'int');``  By now you can probably guess that ``Sk.builtin.nmber`` is a constructor that creates a Python number object that is of type int, and has the value of 1.  The same thing happens for ``y``.  

Next,  on lines 40 -- 53 we see what happens in an assignment statement. first we load the values of x and y into temporary variables $loadname1 and $loadname2.  Why not just use $loc.x ??  Well, we need to use Python's scoping rules.   If $loc.x is undefined then we should check the outer scope to see if it exists there.  ``Sk.misceval.loadname``  If loadname does not find a name ``x`` or ``y`` it throws a NameError, and execution would abort.    You can see where this works by changing the assignment statement to ``z = x + t`` to purposely cause the error.  The compiler blindly first tries $loc.t and then again calls loadname, which in this case does abort with an error!

On lines 52 and 53 we perform the addition using ``Sk.abstr.numberBinOp($loadname1, $loadname2, 'Add');``  Note the abstract (see abstract.js) nature of ``numberBinOp`` -- two parameters for the operands, and one parameter ``'Add'`` that indicates the operator.  Finally the temporary result returned by numberBinOp is stored in $loc.z.  Its important to note that $loc.z contains a Python number object.  Down in the bowels of numberBinOp, the javascript numeric values for x and y are retrieved and result of adding two javascript numbers is converted to the appropriate type of Python object. 


Function Calls, Conditionals, and Loops
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  

Oh my!  so what is the deal with this while(true)/try/switch thing?  To understand this we need a bit more complicated example, so lets look at a program that contains an if/else conditional. We'll see that we now have a much more interesting switch statement.

Without showing all of the generated code, lets consider a simple python program like the one below.  There will be two scope functions generated by the compiler for this example.  $scope0 is for the main program where foo is defined and there is an if statement.  The second $scope1 is for when the foo function is actually called.  The $scope1 while/switch combo contains four cases: 0, 1, 2, and 3.  You can imagine this python code consisting of four blocks.  The first block starts at the beginning and goes through the evaluation of the if condition.  The second block is the if true block of the if.  The third block is the else block of the if statement, and the final block is the rest of the program after the if/else is all done.  You can verify this for yourself by putting this program into a file ``simple.py`` and runing ``./skulpt.py run simple.py`` If you examine the output you will see that the ``$blk`` variable is manipulated to control which ``case`` is executed the next time through the while loop.  Very clever!  If Javascript had ``goto statements`` this would probably look a lot different.

.. code-block:: python

    # <--- $blk 0 starts
   def foo(bar):
       print bar

   x = 2

   if x % 2 == 0:         # <---- end of $blk 0
       foo("hello")        # <---- $blk 3
   else:
       foo("goodbye")  # <---- $blk 2
   # <--- $blk 1   end of if


   When foo is called, it has its own scope $scope1 created and called using Sk.misceval.callsim.

   
How do I add Feature X or Fix bug Y
-----------------------------------

Probably the biggest hurdle in working with skulpt is, "where do I start?"  So, let me take you through a recent scenario, that is pretty illustrative of how I go about doing development on Skulpt.

The question was "how do I add keyword parameters (cmp, key, and reverse)" to the builtin sorted function.  This is pretty tricky as Javascript does not support keyword parameters so there is no real straightforward path.  So start as follows:

::

   x = [1,2,3]
   print(sorted(x,reverse=True))
   
Now run this using ``skulpt.py run test.py`` and you will get a compiled program.  With a little bit of sleuthing you find:

::

    /*    35 */                     // line 2:
    /*    36 */                     // print(sorted(x,reverse=True))
    /*    37 */                     // ^
    /*    38 */                     //
    /*    39 */                     Sk.currLineNo = 2;
    /*    40 */                     Sk.currColNo = 0
    /*    41 */ 
    /*    42 */ 
    /*    43 */                     Sk.currFilename = './sd.py';
    /*    44 */ 
    /*    45 */                     var $loadname8 = $loc.sorted !== undefined ? $loc.sorted : Sk.misceval.loadname('sorted', $gbl);
    /*    46 */                     var $loadname9 = $loc.x !== undefined ? $loc.x : Sk.misceval.loadname('x', $gbl);
    /*    47 */                     var $call10 = Sk.misceval.call($loadname8, undefined, undefined, ['reverse', Sk.builtin.bool.true$], $loadname9);
    
Where the important thing is to notice how the call is formatted after it is compiled.  The fourth parameter to ``Sk.misceval.call`` is ``['reverse', Sk.builtin.bool.true$]``  Now if you check the source for misceval, you will see that these parameters are passed on to the apply function.  In the apply function you will see that there is an assertion that the fourth parameter should be empty.  Ok, here's our starting point to add in what's needed to actually process these key value parameters successfully.

In the case of a bug fix, you would do a similar thing, except that the line where your get an exception is likely to be closer to helping you figure out your next steps.

HOW TO
======

This section is for providing specific examples, or documentation on how to do a specific task.  Suggestions for additional tasks are welcome!

Default Parameters
------------------

How do I add a function with named parameters with default values?

The key to this is that as the author of either a builtin function, or a method in a module, you need to add some meta data to the function definition.  Here's an example of how we added the named parameters to the ``sorted`` function.

.. code-block:: javascript

   Sk.builtin.sorted = function sorted(iterable, cmp, key, reverse) {
   
   /* body of sorted here */
   }
   Sk.builtin.sorted.co_varnames = ['cmp', 'key', 'reverse'];
   Sk.builtin.sorted.$defaults = [Sk.builtin.none, Sk.builtin.none, false];
   Sk.builtin.sorted.co_numargs = 4;
   

kwargs
------

How do I add a function with ``**kwargs``?

Again the idea comes down to adding some meta-data after the function is defined.  Here is an example of adding ``**kwargs`` to a method in a module:

.. code-block:: javascript

    var plotk_f = function(kwa)
        {
            Sk.builtin.pyCheckArgs("plotk", arguments, 0, Infinity, true, false)
            args = new Sk.builtins['tuple'](Array.prototype.slice.call(arguments, 1)); /*vararg*/
            kwargs = new Sk.builtins['dict'](kwa);

            return new Sk.builtins['tuple']([args, kwargs]);
        };
        plotk_f['co_kwargs'] = true;
        mod.plotk = new Sk.builtin.func(plotk_f);



Adding a Module
---------------

This section is from a blog post I made in 2011, slightly updated.

So, here's the deal.  skulpt relies on two javascript files the first is skulpt.min.js  and skulpt-stdlib.js  A very minimal installation only uses skulpt.min.js, whereas if you want to use any modules they are in skulpt-stdlib.js.  Looking around the distribution you will not immediately find skulpt.min.js because you need to build it. You get a sculpt.js file by using the m script that comes with the distribution.  running m --help will give you the full list of commands, but the two that you probably most care about are m dist and m docbi The dist command builds both skulpt.min.js and skulpt-stdlib.js  docbi builds skulpt-stdlib.js and puts a new copy of it in the doc/static directory.
Lets begin with a quick tour of the source tree:

* src - contains the implementation of the Python interpreter

* src/lib - has the module implementations of webgl and goog.  This is where turtle will live and any other modules I implement along the way.

* doc - This directory contains a google app engine application and is what you see on skulpt.org There are a couple of important files to check out in here.  One of them is doc/static/env/editor.js  This is the code that ties together the interactive editor on the home page with the skulpt interpreter and the codemirror editor.  If you know how to build a google app engine app then this directory makes sense.  One thing about the home page is that it is not set up to use any of the modules.  The modules are used in the more advanced ide, which you can find in doc/ide/static.  I'm going to tell you how to add modules to the simpler editor later in this article.

* test - this directory contains a bunch of files for testing the implementation in a batch mode.  These tests are run whenever you run m dist, or m test.

* dist - This directory gets created and populated when you run the m dist command.  It contains the built and compressed versions of skulpt.min.js and skulpt-stdlib.js


To illustrate how to make use of modules, here's an extended version of my earlier hello world style example.

.. code-block:: html

    <html>
    <head>
    <script src="skulpt.min.js" type="text/javascript"></script>
    <script src="skulpt-stdlib.js" type="text/javascript"></script>

    </head>

    <body>
    <script type="text/javascript">
    function outf(text) {
       var mypre = document.getElementById("output");
       mypre.innerHTML = mypre.innerHTML + text;
    }

    function builtinRead(x)
    {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
            throw "File not found: '" + x + "'";
        return Sk.builtinFiles["files"][x];
    }

    function runit() {
       var prog = document.getElementById("yourcode").value;
       var mypre = document.getElementById("output");
       mypre.innerHTML = '';
       Sk.configure({output:outf,
               read: builtinRead
                  });
       try {
          Sk.importMainWithBody("<stdin>",false,prog);
       } catch (e) {
          alert(e);
       }
    }
    </script>
    <h3>Try This</h3>
    <form>
    <textarea edit_id="eta_5" id="yourcode">
    print "Hello World"
    </textarea>
    <button onclick="runit()" type="button">Run</button>
    </form>

    <pre id="output"></pre>

    </body>
    </html>

There are some important differences between this version, and the version and the non-module version.  First off, the call to Sk.configure contains another key value pair which sets up a specialized read function.  This is the function that is responsible for returning your module out of the large array of files that are contained in the skulpt-stdlib.js file.  You will see that all of the modules are contained in this one file, stored in a big JSON structure.  The extra key value pair is:
read: builtinRead

The read function is just for loading modules and is called when you do an import statement of some kind.  In this case the function accesses the variable builtinFiles which is created from the skulpt-stdlib.js file.  The other difference, of course, is that you have to include skulpt-stdlib.js in your html file.  Note that skulpt-stdlib.js must be included after skulpt.min.js

Now as far as the module itself goes, the easiest thing to do is to start your module in the src/lib directory.  This way it will automatically get built and included in skulpt-stdlib.js.  If you don't put it there then you are going to have to modify the m script, specifically the docbi function in the m script to include your module.  Suppose that you want to have a module called bnm.test  Here's what you have to do.  First, you need to make a bnm directory under lib.  In this directory you will need to have either __init__.py or __init__.js or bnm.js to stand in for the bnm module.  There doesn't need to be anything in the file as long as it exists.  This is just like CPython by the way.  Then to make a test module you can either make a test directory and put all your javascript code in __init__.js or you can simply create a test.js file in the bnm directory.  Lets look at the test module.

.. code-block:: javascript

    var $builtinmodule = function(name)
    {
        var mod = {};
        var myfact = function(n) {
     if(n < 1) {
         return 1;
     } else {
         return n * myfact(n-1);
     }
        }
        mod.fact = new Sk.builtin.func(function(a) {
     return myfact(a);
        });
        mod.Stack = Sk.misceval.buildClass(mod, function($gbl, $loc) {
     $loc.__init__ = new Sk.builtin.func(function(self) {
         self.stack = [];
     });
 
     $loc.push = new Sk.builtin.func(function(self,x) {
         self.stack.push(x);
     });
     $loc.pop = new Sk.builtin.func(function(self) {
         return self.stack.pop();
     });
        },
        'Stack', []);


        return mod;
    }

All modules start out with the $var builtinmodule = statement.
This test module exposes a single method to the outside world, called fact, There are a couple of key functions for building up a module.  The Sk.builtin.func   call for adding functions to your module, and the Sk.misceval.buildClass method.  This test module defines a simple factorial function called fact, and a class called stack.  Here's a simple Python program that exercises the module:

.. code-block:: python

    import bnm.test
    print 'starting'
    print bnm.test.fact(10)
    x = bnm.test.Stack()
    x.push(1)
    x.push(2)
    print x.pop()
    print 'done'

Its not obvious, but the buildClass method takes four parameters:  globals, func, name, bases
It seems that you always pass the mod object itself as the globals parameter, the func parameter is a function that represents the class object, the Name is the external name of the class, and bases presumably would be if the class is inheriting from another class.

The Sk.builtin.func method creates a function.  For module creation we typically only have to worry about the one parameter, func, which is the javascript implementation of our Python function.  The method can also take a globals object and two closure objects.  Look at the comments in function.js if you want more explanation of how the builtin.func method works.

Well, I think this should be enough to get you going.  Its worth repeating, if you made it this far, don't forget to call m docbi or m dist after you make changes in your module, its easy to get into the mode of thinking that the new javascript is automatically loaded.  But skulpt-stdlib.js is not automatically rebuilt!


Debugging
---------

How do I use the debugger in the browser to help me debug my code?

Easy, just add the statement:  ``debugger;`` to your code.  Now if you have the javscript deveoper tools open in the browser you will have it.

If you want to start the debugger from a python function that you have written you can also add a debugger statement

If you want to enable debugging generally for use with ``debugbrowser`` follow these handy instructions:

* I make a new test using ./m nrt
* then add a debugger; to the start of the statement at https://github.com/skulpt/skulpt/blob/master/src/import.js#L179 the line would like this: ``finalcode += "\ndebugger;" + co.funcname + "(" + namestr + ");";``
* run ``./skulpt.py debugbrowser`` wait until all tests have run
* startup the developer tools cmd+alt+i on a mac or F12 on a PC in chrome that is
* run the test I added before and it stops right before you enter the compiled code!



Development Workflow
--------------------


1. Make a fork of the repository on github. DO NOT simply clone http://github.com/bnmnetp/runestone. Make a Fork. If you don't know how to make a fork consult the documentation here: https://help.github.com/articles/fork-a-repo

2.  Make a simple myabs.py file that contains a few lines of python that exercise the abs function. Say it looks like this:

.. code-block:: python

    print abs(-1.0)
    print abs(24)

3. Now go edit the source. To implement abs you would edit the builtin.js file. Now abs is pretty easy to add, because you can just have our skulpt version of abs call Math.abs So here it is

.. code-block:: javascript

    Sk.builtin.abs = function abs(x)
    {
        return Math.abs(x);
    };

You are not done yet, because builtin functions also have to be declared in the builtindict.js object as follows:

.. code-block:: javascript

    Sk.builtins = {
    'range': Sk.builtin.range,
    'len': Sk.builtin.len,
    'min': Sk.builtin.min,
    'max': Sk.builtin.max,
    'sum': Sk.builtin.sum,
    'abs': Sk.builtin.abs,
    ...
    }

Now you can test your modifications from the command line by running:

:: 

    ./skulpt.py run myabs.py


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


This is all incredibly useful information.

First it demonstrates that your addition actually worked. You can see the output at the bottom.
Second, you can see how skulpt 'compiled' your python program into its intermediate Javascript form. While this may not be all that helpful in this particular case it can be very very helpful in figuring out what skulpt is actually doing.
Now you should run all of the unit tests to make sure you have broken anything else accidentally. This is really easy:

::

    ./skulpt.py test

If any tests fail it will be obvious that they did, and you'll have to do some investigation to figure out why. At the time of this writing you should see:

::

    run: 343/343 (+1 disabled)
    closure: skipped

Once you are satisfied that your extension is working fine. You should add a test case to test/run see: New Tests for instructions. This way we will have a permanent test in the bank of test cases in order to check for any future regressions.

Finally make a pull request on github to have your new feature integrated into the master copy. I probably will not accept your pull request if you haven't done step 4.


Outside of your editor, your browser, and your wits, the main development tool for skulpt is the skulpt.py command (also linked to m for historical compatibility).  

::

     ./skulpt.py --help
    Usage:

        skulpt.py <command> [<options>] [script.py]

    Commands:

        run              Run a Python file using Skulpt
        test             Run all test cases
        dist             Build core and library distribution files
        docbi            Build library distribution file only and copy to doc/static

        regenparser      Regenerate parser tests
        regenasttests    Regen abstract symbol table tests
        regenruntests    Regenerate runtime unit tests
        regensymtabtests Regenerate symbol table tests
        regentests       Regenerate all of the above

        help             Display help information about Skulpt
        host             Start a simple HTTP server for testing
        upload           Run appcfg.py to upload doc to live GAE site
        doctest          Run the GAE development server for doc testing
        nrt              Generate a file for a new test case
        runopt           Run a Python file optimized
        browser          Run all tests in the browser
        shell            Run a Python program but keep a shell open (like python -i)
        vfs              Build a virtual file system to support Skulpt read tests

        debugbrowser     Debug in the browser -- open your javascript console

    Options:

        -q, --quiet        Only output important information
        -s, --silent       Do not output anything, besides errors
        -u, --uncompressed Makes uncompressed core distribution file for debugging
        -v, --verbose      Make output more verbose [default]
        --version          Returns the version string in Bower configuration file.


    Options:
      --version           show program's version number and exit
      -h, --help          show this help message and exit
      -q, --quiet
      -s, --silent
      -u, --uncompressed
      -v, --verbose       Make output more verbose [default]
      

run
~~~

The command ``./skulpt.py run foo.py`` compiles and runs a Python program generating output similar to the examples shown in the previous section.  This is very common for development.  For example if you find a bug, that you can express in a small Python program you can start by running the program from the command line and inspecting the generated code.  Usually this will give you a pretty good idea where the bug might be.


test
~~~~

Run all the unit tests.

dist
~~~~

Build the distribution files for skulpt:

* skulpt.min.js  -- This is a minified version of the core interpreter files.
* skulpt-stdlib.js  -- This is an unminified version of library functions.  This file may contain javascript that implements a module, such as turtle or math, or it may contain pure python.
