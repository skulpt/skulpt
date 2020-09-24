**breaking changes**

**python 2 incorrectness:**
- `long`
  - when adding two long objects the result is likely to be an `int`
- `method`
  - unbound methods are no longer supported
- The `base` class for all type objects will be `object` even if the base class is not specified


**skulpt api**
- `Sk.builtin.object.prototype.genericGetAttr` -> `Sk.generic.getAttr`
- `Sk.builtin.object.prototype.genericSetAttr` -> `Sk.generic.setAttr`
- `Sk.builtin.typeLookup` removed
- `biginter.js` replaced by the [jsbi](https://github.com/GoogleChromeLabs/jsbi) library
- `Sk.abstr.inherits` removed - inheritance exclusively dealt with by `Sk.abstr.setUpInheritance`
- `Sk.misceval.objectRepr` returns a js string (previously `Sk.builtin.str`)
- `Sk.__future__.python3` becomes the default. Those wishing to use `python2` must define this in the `Sk.configure` object. 
- `Sk.abstr.binary_op_`, `Sk.abstr.binary_iop_`, `Sk.abstr.unary_op_` removed - use `Sk.abstr.numberBinOp`, `Sk.abstr.numberInplaceBinOp`, `Sk.abstr.numberUnaryOp` instead. 

**slot changes**
*only relevant for those developers and those writing slotfunctions directly - hopefully very few users*
- `mp$length` replaced by `sq$length` in the codebase
- `sq$ass_item`/`sq$ass_slice` replaced with `mp$ass_subscript`
- `nb$nonzero` replaced with `nb$bool` and switch version takes care of mapping the appropriate dunder method.
- `mp$del_subscript` replaced by `mp$ass_subscript` (as per Cpython)
  - deleting vs setting an item is based on the call signature
  - `mp$ass_subscript(key, value)` -> set item
  - `mp$ass_subscript(key)` -> delete item
- If a dunder func is defined on a user defined class then the slot function is guaranteed. 
  - e.g. `__len__` defined guarantees `sq$length`. 
  - A slot function defined by skulpt in this way throws the appropriate errors and converts the return value to the appropriate object. 
  - `sq$length`: `__len__` is called using `Sk.misceval.callsim(OrSuspend)Array`. 
  - The result is checked to be an `int` and then converted to `number` since `sq$length` expects a `number`.
- `tp$str` removed from some builtins as per Python 3.8 changes
- If `tp$richcompare` is defined - wrapper functions `ob$eq` etc are created during - this way `Sk.misceval.richCompareBool` need only check for the existance of an `ob$*` slot. 
  - in fact - the existance of these slots is guaranteed since they are inherited from `Sk.builtin.object`
- `tp$mro`/`tp$bases` are Js Arrays rather than `Sk.builtin.tuple`
- `tp$str` and `$r` for errors were changed as per Cpython.
- `nb$int_` -> `nb$int`
- `nb$lng` -> `nb$long`
- `nb$float_` -> `nb$float`
- return values for certain slot functions have changed
  - `tp$hash` - should return a javascript number less than `Number.MAX_SAFE_INTEGER` can be postive or negative
  - `nb$index` - should return a javascript number or BigInt (older browsers should be a JSBI BigInt)
  - `tp$richcompare`/`ob$*` - should return a javascript boolean
- `tp$name` was removed from instances of `Sk.builtin.func` and `Sk.buitin.method` in favour of `$name` since it's `tp$name` should be the `type name`


**flags**
- `sk$acceptable_as_base_class` used for some type objects
- `sk$object` every skulpt object will have this flag. An easy way to determine if you have a skulpt object or a javascript object
- `hp$type` all instance of `sk$klass` types
- `sk$prototypical` do we need to walk up the MRO or can we just check the `prototype`
- `sk$builtinBase` the most derived base which is a native skulpt class
- `sk$baseClass` builtin classes that are direct childs of `object`


**other internal changes**
- the use of `numPromoteFunc` was removed for performance improvements in the implementation of `Sk.asbtr.numberBinOp`
  - It was performance beneficial to leave the promoting to the respective `nb$` slots
  - `int` binop slots only deal with instance of `int`
  - `float` binop slots deal with instances of `float` and `int`
  - `complex` binop slots deal with instances of `complex`, `float` and `int`
- since `long` was effectively removed when a number is larger than `Number.MAX_SAFE_INTEGER` it's `.v` value is a `BigInt`. if `BigInt` is not available in the browser then the `JSBI` library is used to replicate `BigInt` functionality. 
- `set` and `frozenset` now share much of their implementation
- `collections` module rewritten using new api
- `itertools` module rewritten using new api - these are now type objects rather than instances of `generator`
- `operator` module rewritten using new api
- `math` module adapted to the new api
- `dict` and `set` throw errors if the objects change size during iteration as per Cpython.
  - fully tested
- `Sk.builtin.check*` moved to `src/check.js`
- `number.js` removed
- `numtype.js` removed
- `seqtype.js` removed
- `Sk.builtin.check*` moved to `src/check.js`
- `mp$subscript` should not be called by a js object (see changes in `random.js`)
- `quick$lookup` added to `dict.prototype` which is a fast way to lookup up `str` keys
- `dict.prototype.entries` rather than has values that are `arrays` of key value pairs
- `object.prototype.tp$hash` will no longer add `$savedHash_` to the object - instead it uses a javascript map and assigns objects to a random number less than `Number.MAX_SAFE_INTEGER` rather than incrementing the hash value each time. 
- `float.prototype.tp$hash` for integers this will be the same value as `Sk.builtin.int.prototype.tp$hash` for non integers this will be a random number less than `Number.MAX_SAFE_INTEGER`. Previously this was the number rounded down - but this creates a lot of collisions. 




**call signatures of builtins**
- `new` is required for (almost) all builtin types
  - 3 exceptions - `Sk.builtin.bool`, `Sk.builtin.none`, `Sk.builtin.NotImplemented`
  - These 3 will always return their respective constant(s) and are thus not required to be used as constructors. 
- Restricted parameters for directly accessing a constructor of an `Sk.builtin` type
- assertion failures raised in dev mode if `new` is not used



| type  | params   | notes |
|---|---|---|
| `Sk.builtin.int_`  | `{number| JSBI (bigint)| string| undefined}`  | can also be called with a python object that has `nb$int` defined |
| `Sk.builtin.float_`  | `{number | undefined}`  | can also be called with a python objet that has `nb$float` defined |
| `Sk.builtin.complex`  | `{number, number}`  | |
| `Sk.builtin.list`  | `{Array=}`  | Array of py objects or can be called with a python iterable|
| `Sk.builtin.tuple`  | `{Array=}`  | Array of py objects can be called with a python iterable|
| `Sk.builtin.set`  | `{Array=}`  | Array of py objects or can be called with a python iterable|
| `Sk.builtin.dict`  | `{Array=}`  | key/value pairs - only python objects |
| `Sk.builtin.str`  | `{*}`  | |
| `Sk.builtin.bool`  | `{*}`  | |




**Major changes**
- All type objects are now callable using their respective `tp$call` methods inherited from `Sk.builtin.type`
- All native type objects will require a `tp$new` and `tp$init` method (maybe inherited by `Sk.builtin.object`)
- All type objects are javascript instances of `Sk.builtin.type`
- All single inherited objects follow javascript inheritance
- All native type objects now have the following and replaces the use of `Sk.builtin.func` for all dunder function/methods.
  - `wrapper_descriptors` aka `slot_wrappers`
  - `method_descriptors` 
  - `classmethod_descriptors`
  - `getset_descriptors` aka `attributes`/`member_descriptors`
- `Sk.builtin.sk_method` is an alternative to `Sk.builtin.func` and is used by the above `descriptor` types
- mangled names are never passed to the user but instead are an attribute on `Sk.builtin.str` instances as `$mangled`
- `mappingproxy` added
- `$d` removed on all type objects.
- `attributes` of a type object now only appear on the `prototype`. Previously these appeared on both the `type` object and the `prototype`



**Additions**
- `dict`, `set`, `tuple` are suspendable
- `map`, `filter`, `zip`, `reversed`, `enumerate` are suspendable
- `classmethod`, `property`, `staticmethod` have native skulpt implementations
- `super` can now be unbound [see this explanation](https://stackoverflow.com/questions/30190185/how-can-i-use-super-with-one-argument-in-python/30190341#30190341)
- `Sk.builtin.func` objects gain a `qualname` in compile code
- API for building native types 
  - `Sk.abstr.buildNativeClass`
- `range_iterator` class added
- `reverse` iterators added for `list`, `dict_views`, `range`
- `|` operator valid for `dict`, `dict_keys`, `dict_items`
- `Couter` has number slots added


**`Sk.abstr.`**
- `objectHash`
- `buildNativeClass`
- `buildIteratorClass`
- `setUpBuiltinMro`
- `setUpMethods`
- `setUpGetSets`
- `setUpSlots`
- `setUpClassMethod`
- `setUpBaseInheritance`
- `setUpModuleMethod`
- `checkNoKwargs`
- `checkNoArgs`
- `checkOneArg`
- `checkArgsLen` 
- `copyKeywordsToNamedArgs`


**`Sk.generic.`**
- `getAttr`
- `setAttr`
- `selfIter`
- `new` 
- `newMethodDef`
- `iterNextWithArray`
- `iterNextWithArrayCheckSize`
- `iterLengthHintWithArrayMethodDef`
- `iterReverseLengthHintMethodDef`
- `getSetDict`

**`Sk.misceval.`**
- `asIndex` - will return the internal representation of the integer - or undefined if tho indexable - could be a number or a bigint (JSBI) only used 
- `asIndexOrThrow` - does `asIndex` but throws an error if the number is not indexable - with an optional message parameter.
- `asIndexSized` - throws an error if the object is not indexable, returns a Number always, Option to throw an error if the index is larger than `Number.MAX_SAFE_INTEGER`. This is the goto method for most buitins now. 
- `Iterator` - a python class that easily wraps an iterator
- `arrayFromIterable` - optional canSuspend implementation that returns an array from a python iterator

**`slotdefs.js`**
- contains all the information about mapping slots to dunders and vice versa.