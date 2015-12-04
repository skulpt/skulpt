The Skulpt Reference Manual
---------------------------

It would take a bit of research and work but I also wonder if there is not a subset of other skulpt functions that could be collected together more nicely as the skulpt internal api.

This could or should probably more closely follow the C API defined by CPython.  https://docs.python.org/2/c-api/index.html

Although the more I think about it the more I think we just need to do a better job of providing some organized documentation.  I've started an outline, and I think if we can get a decent outline and agree on some general principles for development we could actually document Skulpt and make it much more accessible for people to help.

- Terminology
  - "Python objects" versus "Javascript objects"
  - Sk.builtin
  - Sk.misceval
  - Sk.ffi
  - Sk.abstr
  - slot functions
  - builtin functions
  - magic methods

- Standard Data Type Interfaces
    - Checking types
        - Checking argument types  Sk.builtin.pyCheckType -- weird function that takes one of the below as an argument
        - Sk.builtin.checkNumber
        - Sk.builtin.checkComplex
        - Sk.builtin.checkInt
        - Sk.builtin.checkString
        - Sk.builtin.checkClass
        - Sk.builtin.checkBool
        - Sk.builtin.checkNone
        - Sk.builtin.checkFunction
        - Sk.builtin.checkIterable
        - Sk.builtin.checkCallable
        - Sk.builtin.checkSequence
    - Common
        - Determining if an object is iterable
        - General Sequence and slicing operators  (many Sk.abstr functions)
    - lists
    - dictionaries
    - sets
    - integers/longs
    - floats
    - complex
    - boolean
    - Exceptions
    - None
- Operators
    - binary operators
    - unary
- Dunder methods
    - the builtin names  tp$xxx, nb$xxx, sq$xxxx
    - mapping to the __ names
- creating a class
    - building a class   Sk.misceval.buildClass
- Iteration
    - Getting an interator
    - iterating with an iterator
- Comparing
    - richCompareBool
    - isTrue
- functions — callable from Python
    - The function wrapper  Sk.builtin.func  -- meant to be called ``new Sk.builtin.func(javascriptfunc)``
    - calling a Python function from Javascript
    - named arguments
    - *args
    - **kwargs
- creating a module
    - module template
    - exposing functions from the module
    - exposing constants
    - creating classes in a module
- To Javascript and Back to Python
    -  The Sk.ffi interface
- Utility functions
    - Checking argument counts  Sk.builtin.pyCheckArgs
- Importing and Running code
    - Running source from a string
    - importing a module/package
    -
- Functions for working with Python Objects
    The abstr namespace defines a bunch of functions that you should use when working with Python objects.
    - Sk.abstr.typeName = function (v)
    - Sk.abstr.binop_type_error = function (v, w, name)
    - Sk.abstr.unop_type_error = function (v, name)
    - Sk.abstr.boNameToSlotFuncLhs_ = function (obj, name)
    - Sk.abstr.boNameToSlotFuncRhs_ = function (obj, name)
    - Sk.abstr.iboNameToSlotFunc_ = function (obj, name)
    - Sk.abstr.uoNameToSlotFunc_ = function (obj, name)
    - Sk.abstr.binary_op_ = function (v, w, opname)
    - Sk.abstr.binary_iop_ = function (v, w, opname)
    - Sk.abstr.unary_op_ = function (v, opname)
    - Sk.abstr.numOpAndPromote = function (a, b, opfn)
    - Sk.abstr.boNumPromote_ =
    - Sk.abstr.numberBinOp = function (v, w, op)
    - Sk.abstr.numberInplaceBinOp = function (v, w, op)
    - Sk.abstr.numberUnaryOp = function (v, op)
    - Sk.abstr.fixSeqIndex_ = function (seq, i)
    - Sk.abstr.sequenceContains = function (seq, ob)
    - Sk.abstr.sequenceConcat = function (seq1, seq2)
    - Sk.abstr.sequenceGetIndexOf = function (seq, ob)
    - Sk.abstr.sequenceGetCountOf = function (seq, ob)
    - Sk.abstr.sequenceGetItem = function (seq, i, canSuspend)
    - Sk.abstr.sequenceSetItem = function (seq, i, x, canSuspend)
    - Sk.abstr.sequenceDelItem = function (seq, i)
    - Sk.abstr.sequenceRepeat = function (f, seq, n)
    - Sk.abstr.sequenceGetSlice = function (seq, i1, i2)
    - Sk.abstr.sequenceDelSlice = function (seq, i1, i2)
    - Sk.abstr.sequenceSetSlice = function (seq, i1, i2, x)
    - Sk.abstr.sequenceUnpack = function (seq, n)
    - Sk.abstr.objectFormat = function (obj, format_spec)
    - Sk.abstr.objectAdd = function (a, b)
    - Sk.abstr.objectNegative = function (obj)
    - Sk.abstr.objectPositive = function (obj)
    - Sk.abstr.objectDelItem = function (o, key)
    - Sk.abstr.objectGetItem = function (o, key, canSuspend)
    - Sk.abstr.objectSetItem = function (o, key, v, canSuspend)
    - Sk.abstr.gattr = function (obj, nameJS, canSuspend)
    - Sk.abstr.sattr = function (obj, nameJS, data, canSuspend)
    - Sk.abstr.iter = function (obj)
    - Sk.abstr.iternext = function (it, canSuspend)


Sk.misceval

Misc
* Sk.misceval.Suspension = function Suspension(resume, child, data)
* Sk.misceval.retryOptionalSuspensionOrThrow = function (susp, message)
* Sk.misceval.isIndex = function (o)
* Sk.misceval.asIndex = function (o)
* Sk.misceval.applySlice = function (u, v, w, canSuspend)
* Sk.misceval.assignSlice = function (u, v, w, x, canSuspend)
* Sk.misceval.arrayFromArguments = function (args)
* Sk.misceval.swappedOp_ =
* Sk.misceval.richCompareBool = function (v, w, op)
* Sk.misceval.objectRepr = function (v)
* Sk.misceval.opAllowsEquality = function (op)
* Sk.misceval.isTrue = function (x)
* Sk.misceval.softspace_ = fals
* Sk.misceval.print_ = function (x)
* Sk.misceval.loadname = function (name, other)
* Sk.misceval.call = function (func, kwdict, varargseq, kws, args)
* Sk.misceval.callAsync = function (suspensionHandlers, func, kwdict, varargseq, kws, args)
* Sk.misceval.callOrSuspend = function (func, kwdict, varargseq, kws, args)
* Sk.misceval.callsim = function (func, args)
* Sk.misceval.callsimAsync = function (suspensionHandlers, func, args)
* Sk.misceval.callsimOrSuspend = function (func, args)
* Sk.misceval.apply = function (func, kwdict, varargseq, kws, args)
* Sk.misceval.asyncToPromise = function(suspendablefn, suspHandlers)
* Sk.misceval.applyAsync = function (suspHandlers, func, kwdict, varargseq, kws, args)
* Sk.misceval.chain = function (initialValue, chainedFns)
* Sk.misceval.applyOrSuspend = function (func, kwdict, varargseq, kws, args)
* Sk.misceval.buildClass = function (globals, func, name, bases)



- Understanding the mapping from Skupt api functions to dunder methods

.. code-block:: python

   SLOTS = [
    # typeobject
    Slot("__new__", "tp$new", "new"),
    Slot("__init__", "tp$init", "init"),
    Slot("__str__", "tp$print", "print"),
    Slot("__repr__", "tp$repr", "repr",
         opcode="UNARY_CONVERT"),

    Slot("__hash__", "tp$hash", "hash"),
    Slot("__call__", "tp$call", "call"),

    # Note: In CPython, if tp$getattro exists, tp$getattr is never called.
    Slot("__getattribute__", "tp$getattro", "getattro"),
    Slot("__getattr__", "tp$getattro", "getattro"),
    Slot("__setattr__", "tp$setattro", "setattro"),
    Slot("__delattr__", "tp$setattro", "setattro"),

    # for Py_TPFLAGS_HAVE_ITER:
    Slot("__iter__", "tp$iter", "unary"),
    Slot("next", "tp$iternext", "next", python_version="2"),
    Slot("__next__", "tp$iternext", "next", python_version="3"),

    # for Py_TPFLAGS_HAVE_CLASS:
    Slot("__get__", "tp$descr_get", "descr_get"),
    Slot("__set__", "tp$descr_set", "descr_set"),
    Slot("__delete__", "tp$descr_set", "descr_delete"),
    Slot("__del__", "tp$del", "destructor"),

    # all typically done by __richcompare__
    Slot("__cmp$_", "tp$compare", "cmp",
         python_version="2"),  # "tp$reserved" in Python 3
    Slot("__lt__", "tp$richcompare", "richcmpfunc"),
    Slot("__le__", "tp$richcompare", "richcmpfunc"),
    Slot("__eq__", "tp$richcompare", "richcmpfunc"),
    Slot("__ne__", "tp$richcompare", "richcmpfunc"),
    Slot("__gt__", "tp$richcompare", "richcmpfunc"),
    Slot("__ge__", "tp$richcompare", "richcmpfunc"),

    Slot("__richcompare__", "tp$richcompare", "richcmpfunc"),

    # number methods:
    Slot("__add__", "nb$add", "binary_nb", index=0,
         opcode="BINARY_ADD"),
    Slot("__radd__", "nb$add", "binary_nb", index=1),
    Slot("__sub__", "nb$subtract", "binary_nb", index=0,
         opcode="BINARY_SUBTRACT"),
    Slot("__rsub__", "nb$subtract", "binary_nb", index=1),
    Slot("__mul__", "nb$multiply", "binary_nb", index=0),
    Slot("__rmul__", "nb$multiply", "binary_nb", index=1),
    Slot("__div__", "nb$divide", "binary_nb", index=0,
         opcode="BINARY_DIVIDE"),
    Slot("__rdiv__", "nb$divide", "binary_nb", index=1),
    Slot("__mod__", "nb$remainder", "binary_nb", index=0,
         opcode="BINARY_MODULO"),
    Slot("__rmod__", "nb$remainder", "binary_nb", index=1),
    Slot("__divmod__", "nb$divmod", "binary_nb", index=0),
    Slot("__rdivmod__", "nb$divmod", "binary_nb", index=1),
    Slot("__lshift__", "nb$lshift", "binary_nb", index=0,
         opcode="BINARY_LSHIFT"),
    Slot("__rlshift__", "nb$lshift", "binary_nb", index=1),
    Slot("__rshift__", "nb$rshift", "binary_nb", index=0,
         opcode="BINARY_RSHIFT"),
    Slot("__rrshift__", "nb$rshift", "binary_nb", index=1),
    Slot("__and__", "nb$and", "binary_nb", index=0,
         opcode="BINARY_AND"),
    Slot("__rand__", "nb$and", "binary_nb", index=1),
    Slot("__xor__", "nb$xor", "binary_nb", index=0,
         opcode="BINARY_XOR"),
    Slot("__rxor__", "nb$xor", "binary_nb", index=1),
    Slot("__or__", "nb$or", "binary_nb", index=0,
         opcode="BINARY_OR"),
    Slot("__ror__", "nb$or", "binary_nb", index=1),
    # needs Py_TPFLAGS_HAVE_CLASS:
    Slot("__floordiv__", "nb$floor_divide", "binary_nb", index=0,
         opcode="BINARY_FLOOR_DIVIDE"),
    Slot("__rfloordiv__", "nb$floor_divide", "binary_nb", index=1),
    Slot("__truediv__", "nb$true_divide", "binary_nb", index=0,
         opcode="BINARY_TRUE_DIVIDE"),
    Slot("__rtruediv__", "nb$true_divide", "binary_nb", index=1),

    Slot("__pow__", "nb$power", "ternary",
         opcode="BINARY_POWER"),
    Slot("__rpow__", "nb$power", "ternary"),  # needs wrap_tenary_nb

    Slot("__neg__", "nb$negative", "unary",
         opcode="UNARY_NEGATIVE"),
    Slot("__pos__", "nb$positive", "unary",
         opcode="UNARY_POSITIVE"),
    Slot("__abs__", "nb$absolute", "unary"),
    Slot("__nonzero__", "nb$nonzero", "inquiry"),  # inverse of UNARY_NOT opcode
    Slot("__invert__", "nb$invert", "unary",
         opcode="UNARY_INVERT"),
    Slot("__coerce__", "nb$coerce", "coercion"),  # not needed
    Slot("__int__", "nb$int", "unary"),  # expects exact int as return
    Slot("__long__", "nb$long", "unary"),  # expects exact long as return
    Slot("__float__", "nb$float", "unary"),  # expects exact float as return
    Slot("__oct__", "nb$oct", "unary"),
    Slot("__hex__", "nb$hex", "unary"),

    # Added in 2.0.  These are probably largely useless.
    # (For list concatenation, use sl_inplace_concat)
    Slot("__iadd__", "nb$inplace_add", "binary",
         opcode="INPLACE_ADD"),
    Slot("__isub__", "nb$inplace_subtract", "binary",
         opcode="INPLACE_SUBTRACT"),
    Slot("__imul__", "nb$inplace_multiply", "binary",
         opcode="INPLACE_MULTIPLY"),
    Slot("__idiv__", "nb$inplace_divide", "binary",
         opcode="INPLACE_DIVIDE"),
    Slot("__imod__", "nb$inplace_remainder", "binary",
         opcode="INPLACE_MODULO"),
    Slot("__ipow__", "nb$inplace_power", "ternary",
         opcode="INPLACE_POWER"),
    Slot("__ilshift__", "nb$inplace_lshift", "binary",
         opcode="INPLACE_LSHIFT"),
    Slot("__irshift__", "nb$inplace_rshift", "binary",
         opcode="INPLACE_RSHIFT"),
    Slot("__iand__", "nb$inplace_and", "binary",
         opcode="INPLACE_AND"),
    Slot("__ixor__", "nb$inplace_xor", "binary",
         opcode="INPLACE_XOR"),
    Slot("__ior__", "nb$inplace_or", "binary",
         opcode="INPLACE_OR"),
    Slot("__ifloordiv__", "nb$inplace_floor_divide", "binary",
         opcode="INPLACE_FLOOR_DIVIDE"),
    Slot("__itruediv__", "nb$inplace_true_divide", "binary",
         opcode="INPLACE_TRUE_DIVIDE"),

    # Added in 2.5. Used whenever i acts as a sequence index (a[i])
    Slot("__index__", "nb$index", "unary"),  # needs int/long return

    # mapping
    # __getitem__: Python first tries mp$subscript, then sq$item
    # __len__: Python first tries sq$length, then mp$length
    # __delitem__: Reuses __setitem__ slot.
    Slot("__getitem__", "mp$subscript", "binary",
         opcode="BINARY_SUBSCR"),
    Slot("__delitem__", "mp$ass_subscript", "objobjargproc", index=0),
    Slot("__setitem__", "mp$ass_subscript", "objobjargproc", index=1),
    Slot("__len__", "mp$length", "len"),

    # sequence
    Slot("__contains__", "sq$contains", "objobjproc"),

    # These sequence methods are duplicates of number or mapping methods.
    # For example, in the C API, "add" can be implemented either by sq$concat,
    # or by np_add.  Python will try both. The opcode mapping is identical
    # between the two. So e.g. the implementation of the BINARY_SUBSCR opcode in
    # Python/ceval.c will try both sq$item and mp$subscript, which is why this
    # opcode appears twice in our list.
    Slot("__add__", "sq$concat", "binary",
         opcode="BINARY_ADD"),
    Slot("__mul__", "sq$repeat", "indexargfunc",
         opcode="BINARY_MULTIPLY"),
    Slot("__iadd__", "sq$inplace_concat", "binary",
         opcode="INPLACE_ADD"),
    Slot("__imul__", "sq$inplace_repeat", "indexargfunc",
         opcode="INPLACE_MUL"),
    Slot("__getitem__", "sq$item", "sq$item",
         opcode="BINARY_SUBSCR"),
    Slot("__setitem__", "sq$ass_slice", "sq$ass_item"),
    Slot("__delitem__", "sq$ass_item", "sq$delitem"),

    # slices are passed as explicit slice objects to mp$subscript.
    Slot("__getslice__", "sq$slice", "sq$slice"),
    Slot("__setslice__", "sq$ass_slice", "ssizessizeobjarg"),
    Slot("__delslice__", "sq$ass_slice", "delslice"),
    ]

This list may or may not be complete it comes from:  https://github.com/google/pytypedecl/blob/master/slots.py