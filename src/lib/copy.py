"""
This file was modified from CPython.
Copyright (c) 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
2011, 2012, 2013, 2014, 2015 Python Software Foundation; All Rights Reserved
"""
import types
class Error(Exception):
    pass
error = Error 
class _EmptyClass:
    pass

def copy(x):
    cls = type(x)
    if callable(x):
        return x
    copier = getattr(cls, "__copy__", None)
    if copier:
        return copier(x)
    if cls in (type(None), int, float, bool, long, str, tuple, type):
        return x
    if (cls == list) or (cls == dict) or (cls == set) or (cls == slice):
        return cls(x)
    try:
        getstate = getattr(x, "__getstate__", None)
        setstate = getattr(x, "__setstate__", None)
        initargs = getattr(x, "__getinitargs__", None)
    except:
        reductor = False
    if getstate or setstate or initargs:
        raise NotImplementedError("Skulpt does not yet support copying with user-defined __getstate__, __setstate__ or __getinitargs__()")
    reductor = getattr(x, "__reduce_ex__", None)
    if reductor:
        rv = reductor(4)
    else:
        reductor = getattr(x, "__reduce__", None)
        if reductor:
            rv = reductor()
        elif str(cls)[1:6] == "class":
            copier = _copy_inst
            return copier(x)
        else:
            raise Error("un(shallow)copyable object of type %s" % cls)
    if isinstance(rv, str):
        return x
    return _reconstruct(x, rv, 0)

def _copy_inst(x):
    if hasattr(x, '__copy__'):
        return x.__copy__()
    if hasattr(x, '__getinitargs__'):
        args = x.__getinitargs__()
        y = x.__class__(*args)
    else:
        y = _EmptyClass()
        y.__class__ = x.__class__
    if hasattr(x, '__getstate__'):
        state = x.__getstate__()
    else:
        state = x.__dict__
    if hasattr(y, '__setstate__'):
        y.__setstate__(state)
    else:
        y.__dict__.update(state)
    return y

d = _deepcopy_dispatch = {}

def deepcopy(x, memo=None, _nil=[]):
    """Deep copy operation on arbitrary Python objects.
    See the module's __doc__ string for more info.
    """
    if memo is None:
        memo = {}
    idx = id(x)
    y = memo.get(idx, _nil)
    if y is not _nil:
        return y
    cls = type(x)
    try:
        getstate = getattr(x, "__getstate__", None)
        setstate = getattr(x, "__setstate__", None)
        initargs = getattr(x, "__getinitargs__", None)
    except:
        reductor = False
    if getstate or setstate or initargs:
        raise NotImplementedError("Skulpt does not yet support copying with user-defined __getstate__, __setstate__ or __getinitargs__()")
    copier = _deepcopy_dispatch.get(cls)
    if copier:
        y = copier(x, memo)
    elif str(cls)[1:6] == "class":
        copier = _deepcopy_dispatch["InstanceType"]
        y = copier(x, memo)
    else:
        try:
            issc = issubclass(cls, type)
        except TypeError: # cls is not a class (old Boost; see SF #502085)
            issc = 0
        if issc:
            y = _deepcopy_atomic(x, memo)
        else:
            copier = getattr(x, "__deepcopy__", None)
            if copier:
                y = copier(memo)
            else:
                reductor = getattr(x, "__reduce_ex__", None)
                if reductor:
                    rv = reductor(2)
                else:
                    reductor = getattr(x, "__reduce__", None)
                    if reductor:
                        rv = reductor()
                    else:
                        raise Error(
                            "un(deep)copyable object of type %s" % cls)
                y = _reconstruct(x, rv, 1, memo)
    memo[idx] = y
    _keep_alive(x, memo) # Make sure x lives at least as long as d
    return y

def _deepcopy_atomic(x, memo):
    return x
d[type(None)] = _deepcopy_atomic
# d[type(Ellipsis)] = _deepcopy_atomic
d[type(NotImplemented)] = _deepcopy_atomic
d[int] = _deepcopy_atomic
d[float] = _deepcopy_atomic
d[bool] = _deepcopy_atomic
d[complex] = _deepcopy_atomic
# d[bytes] = _deepcopy_atomic
d[str] = _deepcopy_atomic
# try:
# d[types.CodeType] = _deepcopy_atomic
# except AttributeError:
#   pass
d[type] = _deepcopy_atomic
# d[types.BuiltinFunctionType] = _deepcopy_atomic
d[types.FunctionType] = _deepcopy_atomic
# d[weakref.ref] = _deepcopy_atomic

def _deepcopy_list(x, memo):
    y = []
    memo[id(x)] = y
    for a in x:
        y.append(deepcopy(a, memo))
    return y
d[list] = _deepcopy_list

def _deepcopy_set(x, memo):
    result = set([])  # make empty set
    memo[id(x)] = result  # register this set in the memo for loop checking
    for a in x:   # go through elements of set
        result.add(deepcopy(a, memo))  # add the copied elements into the new set
    return result # return the new set
d[set] = _deepcopy_set

def _deepcopy_tuple(x, memo):
    y = [deepcopy(a, memo) for a in x]
    # We're not going to put the tuple in the memo, but it's still important we
    # check for it, in case the tuple contains recursive mutable structures.
    try:
        return memo[id(x)]
    except KeyError:
        pass
    for k, j in zip(x, y):
        if k is not j:
            y = tuple(y)
            break
    else:
        y = x
    return y
d[tuple] = _deepcopy_tuple

def _deepcopy_dict(x, memo):
    y = {}
    memo[id(x)] = y
    for key, value in x.items():
        y[deepcopy(key, memo)] = deepcopy(value, memo)
    return y
d[dict] = _deepcopy_dict

def _deepcopy_method(x, memo): # Copy instance methods
    y = type(x)(x.im_func, deepcopy(x.im_self, memo), x.im_class);
    return y
d[types.MethodType] = _deepcopy_method

def _deepcopy_inst(x, memo):
    if hasattr(x, '__deepcopy__'):
         return x.__deepcopy__(memo)
    if hasattr(x, '__getinitargs__'):
        args = x.__getinitargs__()
        args = deepcopy(args, memo)
        y = x.__class__(*args)
    else:
        y = _EmptyClass()
        y.__class__ = x.__class__
    memo[id(x)] = y
    if hasattr(x, '__getstate__'):
        state = x.__getstate__()
    else:
        state = x.__dict__
    state = deepcopy(state, memo)
    if hasattr(y, '__setstate__'):
        y.__setstate__(state)
    else:
        y.__dict__.update(state)
        return y
d["InstanceType"] = _deepcopy_inst

def _keep_alive(x, memo):
    """Keeps a reference to the object x in the memo.
    Because we remember objects by their id, we have
    to assure that possibly temporary objects are kept
    alive by referencing them.
    We store a reference at the id of the memo, which should
    normally not be used unless someone tries to deepcopy
    the memo itself...
    """
    try:
        memo[id(memo)].append(x)
    except KeyError:
        # aha, this is the first one :-)
        memo[id(memo)]=[x]

def _reconstruct(x, info, deep, memo=None):
    if isinstance(info, str):
        return x
    assert isinstance(info, tuple)
    if memo is None:
        memo = {}
    n = len(info)
    assert n in (2, 3, 4, 5)
    callable, args = info[:2]
    if n > 2:
        state = info[2]
    else:
        state = None
    if n > 3:
        listiter = info[3]
    else:
        listiter = None
    if n > 4:
        dictiter = info[4]
    else:
        dictiter = None
    if deep:
        args = deepcopy(args, memo)
    y = callable(*args)
    memo[id(x)] = y

    if state is not None:
        if deep:
            state = deepcopy(state, memo)
        if hasattr(y, '__setstate__'):
            y.__setstate__(state)
        else:
            if isinstance(state, tuple) and len(state) == 2:
                state, slotstate = state
            else:
                slotstate = None
            if state is not None:
                y.__dict__.update(state)
            if slotstate is not None:
                for key, value in slotstate.items():
                    setattr(y, key, value)

    if listiter is not None:
        for item in listiter:
            if deep:
                item = deepcopy(item, memo)
            y.append(item)
    if dictiter is not None:
        for key, value in dictiter:
            if deep:
                key = deepcopy(key, memo)
                value = deepcopy(value, memo)
            y[key] = value
    return y

del d

del types

# Helper for instance creation without calling __init__
class _EmptyClass:
    pass