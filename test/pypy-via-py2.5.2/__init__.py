"""
This package only contains the tests that we have modified for PyPy.
It uses the 'official' hack to include the rest of the standard
'test' package from CPython.

This assumes that sys.path is configured to contain 
'lib-python/modified-2.5.2' before 'lib-python/2.5.2'.
"""

from pkgutil import extend_path
__path__ = extend_path(__path__, __name__)
