# Used by test_import.py
version = "subpackage"

if __package__ != "subpackage":
    raise Exception("__package__ not set correctly (" + __package__ + ")")

if __name__ != "subpackage.importable_module":
    raise Exception("__name__ not set correctly (" + __name__ + ")")

from implicit_import import *
