import sys
import unittest


class CircularImportTests(unittest.TestCase):

    """See the docstrings of the modules being imported for the purpose of the
    test."""

    def tearDown(self):
        """Make sure no modules pre-exist in sys.modules which are being used to
        test."""
        for key in list(sys.modules.keys()):
            if '.data' in key:
                del sys.modules[key]

    def test_direct(self):
        try:
            from .data.circular_imports import basic
        except ImportError:
            self.fail('circular import through relative imports failed')

    def test_indirect(self):
        try:
            from .data.circular_imports import indirect
        except ImportError:
            self.fail('relative import in module contributing to circular '
                      'import failed')

    def test_subpackage(self):
        try:
            from .data.circular_imports import subpackage
        except ImportError:
            self.fail('circular import involving a subpackage failed')

    def test_rebinding(self):
        try:
            from .data.circular_imports import rebinding as rebinding
        except ImportError:
            self.fail('circular import with rebinding of module attribute failed')
        from .data.circular_imports.subpkg import util
        self.assertIs(util.util, rebinding.util)

    def test_binding(self):
        try:
            from .data.circular_imports import binding
        except ImportError:
            self.fail('circular import with binding a submodule to a name failed')

    def test_crossreference1(self):
        from .data.circular_imports import use
        from .data.circular_imports import source

    def test_crossreference2(self):
        with self.assertRaises(AttributeError) as cm:
            from .data.circular_imports import source
        errmsg = str(cm.exception)
        self.assertIn('.data.circular_imports.source', errmsg)
        self.assertIn('spam', errmsg)
        self.assertIn('partially initialized module', errmsg)
        self.assertIn('circular import', errmsg)

    def test_circular_from_import(self):
        # in python this is an import error
        # with self.assertRaises(ImportError) as cm:
        with self.assertRaises(AttributeError) as cm:
            from .data.circular_imports import from_cycle1
        self.assertIn(
            "partially initialized module ",
            str(cm.exception)
        )
        self.assertIn(".circular_imports.from_cycle1'", str(cm.exception))
        self.assertIn("(most likely due to a circular import)", str(cm.exception))

    # def test_unwritable_module(self):
    #     self.addCleanup(unload, "test.test_import.data.unwritable")
    #     self.addCleanup(unload, "test.test_import.data.unwritable.x")

    #     from .data.unwritable  import s unwritable
    #     with self.assertWarns(ImportWarning):
    #         from .data.unwritable import x

    #     self.assertNotEqual(type(unwritable), ModuleType)
    #     self.assertEqual(type(x), ModuleType)
    #     with self.assertRaises(AttributeError):
    #         unwritable.x = 42


if __name__ == '__main__':
    unittest.main()
