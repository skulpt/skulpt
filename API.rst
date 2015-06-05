The Skulpt Web Application API
==============================

This is a proposal for a new API to Skulpt, if adopted and implemented it will replace the current hodgepodge of functions currently used to embed Skulpt in an HTML web page.

A few key preliminary points
----------------------------

* A smallish but more nicely and consistently named set of functions could wrap the current stuff and make life easier for people trying to get started.
* The old functions would remain so as to provide backward compatibility, in fact I anticipate that this new api would largely be a thin wrapper over the old.  So keeping the old is important for backward compatibiliy and for advanced users who may want more fine grained control.

Objects and Methods
-------------------

* skulpt.exec(code) -- handles promises, exceptions, calls skulpt.error when an error occurs...
* skulpt.eval(code)  -- returns a javascript object resulting from evaling a Python expression
* skulpt.input  --  function -- called when ``input`` is called a default with a dialog provided
* skulpt.import -- function called for importing files the current builtinRead
* skulpt.output = function   -- A default would be provided that would append text to a configured html element
* skulpt.error = function  -- A default would be provided that would append text to a configured html element
* skulpt.config()  to configure things such as
* skulpt.global(name) -- returns a javascript object mapping names to javscript values based on the last exec or if name the value for that name

    * Suspensions
    * debug mode
    * timeLimits
    * python3 basics
    * default output element
    * default error element
    * turtle canvas?
    * retain globals


``skulpt.exec(codestring)``
^^^^^^^^^^^^^^^^^^^^^^^^^^^

Some use cases:

* To run example code from a simple (non)editable html element
* To run example code but highlight the line in an editor where an error occurred
* To run code that is totally unseen but creates and animation, demonstration or some other interactive feature on a web page

It may be useful to have the exec function return an object that can be tested for success or failure.  This would allow all information from an exception to be returned and used by an embedded IDE.



Lets look at a current example and then reimagine that example under a new API.

.. code-block:: javascript

   <script type="text/javascript">
   // output functions are configurable.  This one just appends some text
   // to a pre element.
   function outf(text) {
       var mypre = document.getElementById("output");
       mypre.innerHTML = mypre.innerHTML + text;
   }
   function builtinRead(x) {
       if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
               throw "File not found: '" + x + "'";
       return Sk.builtinFiles["files"][x];
   }

   // Here's everything you need to run a python program in skulpt
   // grab the code from your textarea
   // get a reference to your pre element for output
   // configure the output function
   // call Sk.importMainWithBody()
   function runit() {
      var prog = document.getElementById("yourcode").value;
      var mypre = document.getElementById("output");
      mypre.innerHTML = '';
      Sk.pre = "output";
      Sk.configure({output:outf, read:builtinRead});
      (Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = 'mycanvas';
      var myPromise = Sk.misceval.asyncToPromise(function() {
          return Sk.importMainWithBody("<stdin>", false, prog, true);
      });
      myPromise.then(function(mod) {
          console.log('success');
      },
          function(err) {
          console.log(err.toString());
      });
   }
   </script>

The new API could look like this

.. code-block:: javascript

   <script type="text/javascript">
   function runit() {
      var prog = document.getElementById("yourcode").value;
      var mypre = document.getElementById("output");
      skulpt.configure({outelem: mypre, turtleCanvas: 'mycanvas'})
      skulpt.exec(code)
   }
   </script>




