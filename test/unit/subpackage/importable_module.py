# Used by test_import.py
version = "subpackage"

if __package__ != "subpackage":
    raise Exception("__package__ not set correctly (" + __package__ + ")")

if __name__ != "subpackage.importable_module":
    raise Exception("__name__ not set correctly (" + __name__ + ")")

from implicit_import import *

_implicit_y # will fail if the import isn't right
if 'implicit_z' in globals() or '_implicit_y' not in globals():
    raise Exception("Wildcard import not successfully masked off by __all__")

from .explicit_relative_import import explicit_load_succeeded
if not explicit_load_succeeded:
	raise Exception("Load from explicit module failed")

from . import explicit_relative_import

if explicit_relative_import.__name__ != "subpackage.explicit_relative_import":
	raise Exception("__name__ not set correctly for explicit import (%s)" % explicit_import.__name__)
