# Selected CPython linecache tests and Skulpt virtual-source regressions.
import linecache
import unittest

NONEXISTENT_FILENAME = 'loader-only-source.py'

try:
    jseval
except NameError:
    jseval = None


if jseval is not None:
    class TestSkulptHostSource(unittest.TestCase):
        def setUp(self):
            linecache.clearcache()
            jseval('''
                globalThis.linecacheTestState = { read: Sk.read, source: "first\\r\\nsecond" };
                Sk.read = function (filename) {
                    if (filename === "virtual-source.py") {
                        return globalThis.linecacheTestState.source;
                    }
                    return globalThis.linecacheTestState.read(filename);
                };
            ''')

        def tearDown(self):
            jseval('''
                Sk.read = globalThis.linecacheTestState.read;
                delete globalThis.linecacheTestState;
            ''')
            linecache.clearcache()

        def test_lines_cache_and_explicit_refresh(self):
            self.assertEqual(linecache.getlines('virtual-source.py'), ['first\n', 'second\n'])
            self.assertEqual(linecache.getline('virtual-source.py', 2), 'second\n')
            self.assertEqual(linecache.getline('virtual-source.py', 0), '')
            self.assertEqual(linecache.getline('virtual-source.py', 3), '')
            jseval('globalThis.linecacheTestState.source = "changed"')
            self.assertEqual(linecache.getline('virtual-source.py', 1), 'first\n')
            linecache.checkcache('virtual-source.py')
            self.assertEqual(linecache.getline('virtual-source.py', 1), 'first\n')
            self.assertEqual(linecache.updatecache('virtual-source.py'), ['changed\n'])
            linecache.clearcache()
            self.assertEqual(linecache.getline('virtual-source.py', 1), 'changed\n')

        def test_suspending_source_reader(self):
            jseval('''Sk.read = function () {
                return Sk.misceval.promiseToSuspension(Promise.resolve("delayed source"));
            };''')
            self.assertEqual(linecache.getline('delayed.py', 1), 'delayed source\n')


class TestSkulptSourceFallback(unittest.TestCase):
    def tearDown(self):
        linecache.clearcache()

    def test_unavailable_and_registered_source(self):
        self.assertEqual(linecache.getlines('missing-source-for-linecache.py'), [])
        self.assertEqual(linecache.getline('<unknown>', 1), '')
        lines = ['registered source\n']
        linecache.cache['<generated>'] = (18, None, lines, '<generated>')
        self.assertEqual(linecache.getline('<generated>', 1), lines[0])

    def test_loader_lookup_errors(self):
        class Loader:
            def get_source(self, name):
                raise failure

        namespace = {'__name__': 'test_module', '__loader__': Loader()}
        for failure in (ImportError('unavailable'), IOError('unavailable')):
            linecache.clearcache()
            self.assertEqual(linecache.getlines(NONEXISTENT_FILENAME, namespace), [])

        linecache.clearcache()
        failure = ValueError('broken loader')
        with self.assertRaises(ValueError):
            linecache.getlines(NONEXISTENT_FILENAME, namespace)


class LineCacheTests(unittest.TestCase):
    # CPython v3.7.9 Lib/test/test_linecache.py, using an explicit virtual loader
    # because Skulpt does not populate module __loader__ attributes.
    def setUp(self):
        linecache.clearcache()
        class Loader:
            def get_source(self, name):
                return 'loaded source'
        self.module_globals = {'__name__': 'test_module', '__loader__': Loader()}

    def tearDown(self):
        linecache.clearcache()

    def test_lazycache_smoke(self):
        linecache.clearcache()
        self.assertEqual(
            True, linecache.lazycache(NONEXISTENT_FILENAME, self.module_globals))
        self.assertEqual(1, len(linecache.cache[NONEXISTENT_FILENAME]))
        # Note here that we're looking up a nonexistent filename with no
        # globals: this would error if the lazy value wasn't resolved.
        self.assertEqual(['loaded source\n'], linecache.getlines(NONEXISTENT_FILENAME))

    def test_lazycache_check(self):
        self.assertTrue(linecache.lazycache(NONEXISTENT_FILENAME, self.module_globals))
        linecache.checkcache()
        self.assertEqual(['loaded source\n'], linecache.getlines(NONEXISTENT_FILENAME))

    def test_lazycache_provide_after_failed_lookup(self):
        linecache.clearcache()
        lines = linecache.getlines(NONEXISTENT_FILENAME, self.module_globals)
        linecache.clearcache()
        linecache.getlines(NONEXISTENT_FILENAME)
        linecache.lazycache(NONEXISTENT_FILENAME, self.module_globals)
        self.assertEqual(lines, linecache.updatecache(NONEXISTENT_FILENAME))

    def test_lazycache_bad_filename(self):
        linecache.clearcache()
        self.assertEqual(False, linecache.lazycache('', self.module_globals))
        self.assertEqual(False, linecache.lazycache('<foo>', self.module_globals))

    def test_lazycache_already_cached(self):
        linecache.clearcache()
        lines = linecache.getlines(NONEXISTENT_FILENAME, self.module_globals)
        self.assertEqual(
            False,
            linecache.lazycache(NONEXISTENT_FILENAME, self.module_globals))
        self.assertEqual(4, len(linecache.cache[NONEXISTENT_FILENAME]))


if __name__ == '__main__':
    unittest.main()
