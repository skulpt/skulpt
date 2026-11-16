# From CPython's Lib/test/test_unittest/test_loader.py.
import types
import unittest


class Test_TestLoader(unittest.TestCase):
    def test_loadTestsFromTestCase(self):
        class Foo(unittest.TestCase):
            def test_1(self): pass
            def test_2(self): pass
            def foo_bar(self): pass

        tests = unittest.TestSuite([Foo('test_1'), Foo('test_2')])

        loader = unittest.TestLoader()
        self.assertEqual(loader.loadTestsFromTestCase(Foo), tests)

    def test_loadTestsFromTestCase__no_matches(self):
        class Foo(unittest.TestCase):
            def foo_bar(self): pass

        empty_suite = unittest.TestSuite()

        loader = unittest.TestLoader()
        self.assertEqual(loader.loadTestsFromTestCase(Foo), empty_suite)

    def test_loadTestsFromTestCase__default_method_name(self):
        class Foo(unittest.TestCase):
            def runTest(self):
                pass

        loader = unittest.TestLoader()
        # This has to be false for the test to succeed
        self.assertFalse('runTest'.startswith(loader.testMethodPrefix))

        suite = loader.loadTestsFromTestCase(Foo)
        self.assertIsInstance(suite, loader.suiteClass)
        self.assertEqual(list(suite), [Foo('runTest')])

    def test_loadTestsFromModule__no_TestCase_instances(self):
        m = types.ModuleType('m')

        loader = unittest.TestLoader()
        suite = loader.loadTestsFromModule(m)
        self.assertIsInstance(suite, loader.suiteClass)
        self.assertEqual(list(suite), [])

    def test_loadTestsFromModule__load_tests(self):
        m = types.ModuleType('m')
        class MyTestCase(unittest.TestCase):
            def test(self):
                pass
        m.testcase_1 = MyTestCase

        load_tests_args = []
        def load_tests(loader, tests, pattern):
            self.assertIsInstance(tests, unittest.TestSuite)
            load_tests_args.extend((loader, tests, pattern))
            return tests
        m.load_tests = load_tests

        loader = unittest.TestLoader()
        suite = loader.loadTestsFromModule(m)
        self.assertIsInstance(suite, unittest.TestSuite)
        self.assertEqual(load_tests_args, [loader, suite, None])

        # In Python 3.12, the undocumented and unofficial use_load_tests has
        # been removed.
        with self.assertRaises(TypeError):
            loader.loadTestsFromModule(m, False)
        with self.assertRaises(TypeError):
            loader.loadTestsFromModule(m, use_load_tests=False)

    def test_loadTestsFromModule__pattern(self):
        m = types.ModuleType('m')
        class MyTestCase(unittest.TestCase):
            def test(self):
                pass
        m.testcase_1 = MyTestCase

        load_tests_args = []
        def load_tests(loader, tests, pattern):
            self.assertIsInstance(tests, unittest.TestSuite)
            load_tests_args.extend((loader, tests, pattern))
            return tests
        m.load_tests = load_tests

        loader = unittest.TestLoader()
        suite = loader.loadTestsFromModule(m, pattern='testme.*')
        self.assertIsInstance(suite, unittest.TestSuite)
        self.assertEqual(load_tests_args, [loader, suite, 'testme.*'])

    def test_loadTestsFromModule__faulty_load_tests(self):
        m = types.ModuleType('m')

        def load_tests(loader, tests, pattern):
            raise TypeError('some failure')
        m.load_tests = load_tests

        loader = unittest.TestLoader()
        suite = loader.loadTestsFromModule(m)
        self.assertIsInstance(suite, unittest.TestSuite)
        self.assertEqual(suite.countTestCases(), 1)
        # Errors loading the suite are also captured for introspection.
        self.assertNotEqual([], loader.errors)
        self.assertEqual(1, len(loader.errors))
        error = loader.errors[0]
        self.assertTrue(
            'Failed to call load_tests:' in error,
            'missing error string in %r' % error)
        test = list(suite)[0]

        self.assertRaisesRegex(TypeError, "some failure", test.m)



if __name__ == "__main__":
    unittest.main()
