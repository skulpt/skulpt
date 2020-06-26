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

**slot changes**
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

**flags**
- `sk$acceptable_as_base_class` used for some type objects
- `sk$object` every skulpt object inherits this flag from `Sk.builtin.object`
- `hp$type` all instance of `sk$klass` klasses
- `sk$basetype` all native classes that inherit from `object`
- `sk$prototypical` do we need to walk up the MRO or can we just check the `prototype`

**other internal changes**
- the use of `numPromoteFunc` was removed for performance improvements in the implementation of `Sk.asbtr.numberBinOp`
  - It was performance beneficial to leave the promoting to the respective `nb$` slots
  - `int` binop slots only deal with instance of `int`
  - `float` binop slots deal with instances of `float` and `int`
  - `complex` binop slots deal with instances of `complex`, `float` and `int`
- `set` and `frozenset` now share much of their implementation
- `collections` module rewritten using new api
- `itertools` module rewritten using new api - these are now type objects rather than instances of `generator`
- `dict` and `set` throw errors if the objects change size during iteration as per Cpython.
- `Sk.builtin.check*` moved to `src/check.js`
- `enumerate`/`filter_`/`reversed`/`zip_`/`map_` combined into one file `src/iteratorobjects.js`
- `tuple_iter_`/`str_iter_` etc combined into `src/simple_iterators.js`
- `dictviews` like `dict_items` etc moved to `src/dictviews.js`
- `number.js` removed
- `numtype.js` removed
- `seqtype.js` removed
- `Sk.builtin.check*` moved to `src/check.js`
- `mp$subscript` should not be called by a js object (see changes in `random.js`)


**call signatures of builtins**
- `new` is required for (almost) all builtin types
  - 3 exceptions - `Sk.builtin.bool`, `Sk.builtin.none`, `Sk.builtin.NotImplemented`
  - These 3 will always return their respective constant(s) and are thus not required to be used as constructors. 
- Restricted parameters for directly accessing a constructor of an `Sk.builtin` type



| type  | params   | notes |
|---|---|---|
| `Sk.builtin.int_`  | `{number| JSBI (bigint)| string| undefined}`  | |
| `Sk.builtin.float_`  | `{number}`  | |
| `Sk.builtin.complex`  | `{number, number}`  | |
| `Sk.builtin.list`  | `{Array=}`  | |
| `Sk.builtin.tuple`  | `{Array=}`  | |
| `Sk.builtin.set`  | `{Array=}`  | |
| `Sk.builtin.dict`  | `{Array=}`  | key/value pairs - only PyObjects |
| `Sk.builtin.str`  | `{*}`  | can be used to convert a PyObject|
| `Sk.builtin.bool`  | `{*}`  | can be used to convert a PyObject|


**Major changes**
- All type objects are now callable using their respective `tp$call` methods inherited from `Sk.builtin.type`
- All native type objects will require a `tp$new` and `tp$init` method (maybe inherited by `Sk.builtin.object`)
- All type objects are javascript instances of `Sk.builtin.type`
- All single inherited objects follow javascript inheritance
- All native type objects now have the following and replaces the use of `Sk.builtin.function` for all dunder function/methods.
  - `wrapper_descriptors` aka `slot_wrappers`
  - `method_descriptors` 
  - `classmethod_descriptors`
  - `getset_descriptors` aka `attributes`/`member_descriptors`
- `Sk.builtin.sk_method` is an alternative to `Sk.builtin.function` and is used by the above `descriptor` types
- mangled names are never passed to the user but instead are an attribute on `Sk.builtin.str` instances as `$mangled`
- `mappingproxy` added
- `$d` removed on all type objects.
- `attributes` of a type object now only appear on the `prototype`. Previously these appeared on both the `type` object and the `prototype`



**Additions**
- `dict`, `tuple` are suspendable
- `classmethod`, `property`, `staticmethod` have native skulpt implementations
- `super` can now be unbound
- `Sk.builtin.func` objects gain a `qualname` in compile code
- API for building native types 
  - `Sk.abstr.buildNativeClass`
- `range_iterator` class added
- `reverse` iterators added for `list`, `dict_views`, `range`
- `sk$asarray` used by types to convert to a javascript array. 


**`Sk.abstr.`**
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
- `iterator`
- `new` 
- `newMethodDef`
- `iterNextWithArray`
- `iterNextWithArrayCheckSize`
- `iterLengthHintWithArrayMethodDef`
- `iterReverseLengthHintMethodDef`
- `getSetDict`

**`Sk.misceval.`**
- `asIndexOrThrow`
- `arrayFromIterable` - optional canSuspend implementation that returns an array from a python iterator

**`slotdefs.js`**
- contains all the information about mapping slots to dunders and vice versa.