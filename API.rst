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
* skulpt.eval(code)  -- returns a javascript object
* skulpt.input = function
* skulpt.output = function
* skulpt.error = function
* skulpt.config()  to configure things like Suspensions, timeLimits, python3, etc.




A Programmers API
-----------------

It would take a bit of research and work but I also wonder if there is not a subset of other skulpt functions that could be collected together more nicely as the skulpt internal api.

This could or should probably more closely follow the C API defined by CPython.  https://docs.python.org/2/c-api/index.html

* some of the Sk.ffi functions
* buildClass
* func
* an appropriate getattr type function
* etc.
