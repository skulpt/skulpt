# Test the module type
import unittest
# import weakref
# from test.support import gc_collect
# from test.support.script_helper import assert_python_ok

import sys
ModuleType = type(sys)

class FullLoader:
    @classmethod
    def module_repr(cls, m):
        return "<module '{}' (crafted)>".format(m.__name__)

class BareLoader:
    pass


class ModuleTests(unittest.TestCase):
    def test_uninitialized(self):
        # An uninitialized module has an empty dictionary and no __name__.
        foo = ModuleType.__new__(ModuleType)
        self.assertIsInstance(foo.__dict__, dict)
        self.assertFalse(foo.__dict__)
        # self.assertRaises(SystemError, dir, foo)
        try:
            s = foo.__name__
            self.fail("__name__ = %s" % repr(s))
        except AttributeError:
            pass
        self.assertEqual(foo.__doc__, ModuleType.__doc__)

    def test_uninitialized_missing_getattr(self):
        # Issue 8297
        # test the text in the AttributeError of an uninitialized module
        foo = ModuleType.__new__(ModuleType)
        with self.assertRaises(AttributeError) as c:
            getattr(foo, "not_here")
        self.assertIn("module has no attribute 'not_here'", c.exception.args[0])
        # self.assertIn("module 'object' has no attribute 'not_here'", c.exception.args[0])

    def test_missing_getattr(self):
        # Issue 8297
        # test the text in the AttributeError
        foo = ModuleType("foo")
        with self.assertRaises(AttributeError) as c:
            getattr(foo, "not_here")
        self.assertIn("module 'foo' has no attribute 'not_here'", c.exception.args[0])

    def test_no_docstring(self):
        # Regularly initialized module, no docstring
        foo = ModuleType("foo")
        self.assertEqual(foo.__name__, "foo")
        self.assertEqual(foo.__doc__, None)
        self.assertIs(foo.__loader__, None)
        self.assertIs(foo.__package__, None)
        self.assertIs(foo.__spec__, None)
        self.assertEqual(foo.__dict__, {"__name__": "foo", "__doc__": None,
                                        "__loader__": None, "__package__": None,
                                        "__spec__": None})

    def test_ascii_docstring(self):
        # ASCII docstring
        foo = ModuleType("foo", "foodoc")
        self.assertEqual(foo.__name__, "foo")
        self.assertEqual(foo.__doc__, "foodoc")
        self.assertEqual(foo.__dict__,
                         {"__name__": "foo", "__doc__": "foodoc",
                          "__package__": None,
                          "__loader__": None, "__spec__": None})

    def test_unicode_docstring(self):
        # Unicode docstring
        foo = ModuleType("foo", "foodoc\u1234")
        self.assertEqual(foo.__name__, "foo")
        self.assertEqual(foo.__doc__, "foodoc\u1234")
        self.assertEqual(foo.__dict__,
                         {"__name__": "foo", "__doc__": "foodoc\u1234",
                          "__loader__": None, "__package__": None,
                          "__spec__": None})

    def test_reinit(self):
        # Reinitialization should not replace the __dict__
        foo = ModuleType("foo", "foodoc\u1234")
        foo.bar = 42
        d = foo.__dict__
        foo.__init__("foo", "foodoc")
        self.assertEqual(foo.__name__, "foo")
        self.assertEqual(foo.__doc__, "foodoc")
        self.assertEqual(foo.bar, 42)
        self.assertEqual(foo.__dict__,
              {"__name__": "foo", "__doc__": "foodoc", "bar": 42,
               "__loader__": None, "__package__": None, "__spec__": None})
        self.assertIs(foo.__dict__, d)

    def test_dont_clear_dict(self):
        # See issue 7140.
        def f():
            foo = ModuleType("foo")
            foo.bar = 4
            return foo
        # gc_collect()
        self.assertEqual(f().__dict__["bar"], 4)

#     def test_clear_dict_in_ref_cycle(self):
#         destroyed = []
#         m = ModuleType("foo")
#         m.destroyed = destroyed
#         s = """class A:
#     def __init__(self, l):
#         self.l = l
#     def __del__(self):
#         self.l.append(1)
# a = A(destroyed)"""
#         exec(s, m.__dict__)
#         del m
#         gc_collect()
#         self.assertEqual(destroyed, [1])

    # def test_weakref(self):
    #     m = ModuleType("foo")
    #     wr = weakref.ref(m)
    #     self.assertIs(wr(), m)
    #     del m
    #     gc_collect()
    #     self.assertIs(wr(), None)

    def test_module_getattr(self):
        import test.good_getattr as gga
        from test.good_getattr import test
        self.assertEqual(test, "There is test")
        self.assertEqual(gga.x, 1)
        self.assertEqual(gga.y, 2)
        with self.assertRaises(AttributeError) as c:
            gga.yolo
        # self.assertIn("Deprecated, use whatever instead", c.exception.args[0])
        self.assertEqual(gga.whatever, "There is whatever")
        del sys.modules['test.good_getattr']

    def test_module_getattr_errors(self):
        import test.bad_getattr as bga
        from test import bad_getattr2
        self.assertEqual(bga.x, 1)
        self.assertEqual(bad_getattr2.x, 1)
        with self.assertRaises(TypeError):
            bga.nope
        with self.assertRaises(TypeError):
            bad_getattr2.nope
        del sys.modules['test.bad_getattr']
        if 'test.bad_getattr2' in sys.modules:
            del sys.modules['test.bad_getattr2']

    def test_module_dir(self):
        import test.good_getattr as gga
        self.assertEqual(dir(gga), ['a', 'b', 'c'])
        del sys.modules['test.good_getattr']

    def test_module_dir_errors(self):
        import test.bad_getattr as bga
        from test import bad_getattr2
        with self.assertRaises(TypeError):
            dir(bga)
        with self.assertRaises(TypeError):
            dir(bad_getattr2)
        del sys.modules['test.bad_getattr']
        if 'test.bad_getattr2' in sys.modules:
            del sys.modules['test.bad_getattr2']

    def test_module_getattr_tricky(self):
        from test import bad_getattr3
        # these lookups should not crash
        with self.assertRaises(AttributeError):
            bad_getattr3.one
        with self.assertRaises(AttributeError):
            bad_getattr3.delgetattr
        if 'test.bad_getattr3' in sys.modules:
            del sys.modules['test.bad_getattr3']

    def test_module_repr_minimal(self):
        # reprs when modules have no __file__, __name__, or __loader__
        m = ModuleType('foo')
        del m.__name__
        self.assertEqual(repr(m), "<module '?'>")

    def test_module_repr_with_name(self):
        m = ModuleType('foo')
        self.assertEqual(repr(m), "<module 'foo'>")

    def test_module_repr_with_name_and_filename(self):
        m = ModuleType('foo')
        m.__file__ = '/tmp/foo.py'
        self.assertEqual(repr(m), "<module 'foo' from '/tmp/foo.py'>")

    def test_module_repr_with_filename_only(self):
        m = ModuleType('foo')
        del m.__name__
        m.__file__ = '/tmp/foo.py'
        self.assertEqual(repr(m), "<module '?' from '/tmp/foo.py'>")

    def test_module_repr_with_loader_as_None(self):
        m = ModuleType('foo')
        assert m.__loader__ is None
        self.assertEqual(repr(m), "<module 'foo'>")

    def test_module_repr_with_bare_loader_but_no_name(self):
        m = ModuleType('foo')
        del m.__name__
        # Yes, a class not an instance.
        m.__loader__ = BareLoader
        loader_repr = repr(BareLoader)
        self.assertEqual(
            repr(m), "<module '?' ({})>".format(loader_repr))

    def test_module_repr_with_full_loader_but_no_name(self):
        # m.__loader__.module_repr() will fail because the module has no
        # m.__name__.  This exception will get suppressed and instead the
        # loader's repr will be used.
        m = ModuleType('foo')
        del m.__name__
        # Yes, a class not an instance.
        m.__loader__ = FullLoader
        loader_repr = repr(FullLoader)
        self.assertEqual(
            repr(m), "<module '?' ({})>".format(loader_repr))

    def test_module_repr_with_bare_loader(self):
        m = ModuleType('foo')
        # Yes, a class not an instance.
        m.__loader__ = BareLoader
        module_repr = repr(BareLoader)
        self.assertEqual(
            repr(m), "<module 'foo' ({})>".format(module_repr))

    def test_module_repr_with_full_loader(self):
        m = ModuleType('foo')
        # Yes, a class not an instance.
        m.__loader__ = FullLoader
        self.assertEqual(
            repr(m), "<module 'foo' (crafted)>")

    def test_module_repr_with_bare_loader_and_filename(self):
        # Because the loader has no module_repr(), use the file name.
        m = ModuleType('foo')
        # Yes, a class not an instance.
        m.__loader__ = BareLoader
        m.__file__ = '/tmp/foo.py'
        self.assertEqual(repr(m), "<module 'foo' from '/tmp/foo.py'>")

    def test_module_repr_with_full_loader_and_filename(self):
        # Even though the module has an __file__, use __loader__.module_repr()
        m = ModuleType('foo')
        # Yes, a class not an instance.
        m.__loader__ = FullLoader
        m.__file__ = '/tmp/foo.py'
        self.assertEqual(repr(m), "<module 'foo' (crafted)>")

    def test_module_repr_builtin(self):
        self.assertEqual(repr(sys), "<module 'sys' (built-in)>")

    def test_module_repr_source(self):
        r = repr(unittest)
        starts_with = "<module 'unittest' from '"
        ends_with = "__init__.py'>"
        self.assertEqual(r[:len(starts_with)], starts_with,
                         '{!r} does not start with {!r}'.format(r, starts_with))
        self.assertEqual(r[-len(ends_with):], ends_with,
                         '{!r} does not end with {!r}'.format(r, ends_with))

    # def test_module_finalization_at_shutdown(self):
    #     # Module globals and builtins should still be available during shutdown
    #     rc, out, err = assert_python_ok("-c", "from test import final_a")
    #     self.assertFalse(err)
    #     lines = out.splitlines()
    #     self.assertEqual(set(lines), {
    #         b"x = a",
    #         b"x = b",
    #         b"final_a.x = a",
    #         b"final_b.x = b",
    #         b"len = len",
    #         b"shutil.rmtree = rmtree"})

    def test_descriptor_errors_propagate(self):
        class Descr:
            def __get__(self, o, t):
                raise RuntimeError
        class M(ModuleType):
            melon = Descr()
        self.assertRaises(RuntimeError, getattr, M("mymod"), "melon")

    # From CPython Lib/test/test_module/__init__.py.
    def test_repeated_attribute_pops(self):
        m = ModuleType("test")
        d = m.__dict__
        count = 0
        for _ in range(100):
            m.attr = 1
            count += m.attr
            d.pop("attr")
        self.assertEqual(count, 100)

    def test_live_dictionary_and_execution(self):
        # Skulpt regression for exec() using a live module namespace.
        module = ModuleType('example')
        namespace = module.__dict__
        self.assertIs(namespace, module.__dict__)
        module.value = 1
        self.assertEqual(namespace['value'], 1)
        namespace['value'] = 2
        self.assertEqual(module.value, 2)
        exec('def read_value(): return value', namespace)
        module.value = 3
        self.assertEqual(module.read_value(), 3)
        exec('del value', namespace)
        self.assertNotIn('value', namespace)
        namespace['__dict__'] = 'shadow'
        self.assertIs(module.__dict__, namespace)
        with self.assertRaises(AttributeError):
            module.__dict__ = {}

    def test_skulpt_eval_preserves_module_result_name(self):
        # Skulpt uses __final_res__ internally to return the result of eval().
        namespace = ModuleType('example').__dict__
        namespace['__final_res__'] = 19
        self.assertEqual(eval('__final_res__ + 23', namespace), 42)
        self.assertEqual(eval('__final_res__ + 23', {}, namespace), 42)
        self.assertEqual(namespace['__final_res__'], 19)

    def test_skulpt_module_dictionary_fromkeys(self):
        # The native namespace view must produce a regular dict.
        namespace = ModuleType('example').__dict__
        result = namespace.fromkeys([1, 'key'])
        self.assertIs(type(result), dict)
        self.assertEqual(result, {1: None, 'key': None})

    @unittest.skipUnless(sys.implementation.name == 'skulpt', 'Skulpt execution globals')
    def test_exec_restores_caller_globals_after_error(self):
        namespace = ModuleType('example').__dict__
        with self.assertRaises(RuntimeError):
            exec('module_only = 1\nraise RuntimeError()', namespace)
        self.assertEqual(namespace['module_only'], 1)
        self.assertNotIn('module_only', globals())

        with self.assertRaises(RuntimeError):
            exec('local_only = copied_global\nraise RuntimeError()', {'copied_global': 2}, namespace)
        self.assertEqual(namespace['local_only'], 2)
        self.assertNotIn('copied_global', globals())

    @unittest.skipUnless(sys.implementation.name == 'skulpt', 'Skulpt module namespace')
    def test_module_dictionary_requires_string_keys(self):
        namespace = ModuleType('example').__dict__
        namespace.clear()
        namespace['10'] = 'ten'
        with self.assertRaises(TypeError):
            namespace[10] = 'integer'
        self.assertNotIn(10, namespace)
        namespace['2'] = 'two'
        self.assertEqual(len(namespace), 2)
        self.assertEqual(namespace.copy(), {'10': 'ten', '2': 'two'})
        self.assertEqual(namespace, {'10': 'ten', '2': 'two'})
        self.assertEqual({'10': 'ten', '2': 'two'}, namespace)
        self.assertNotEqual({'10': 'ten'}, namespace)

    @unittest.skipUnless(sys.implementation.name == 'skulpt', 'Skulpt module namespace')
    def test_module_dictionary_rejects_internal_key_suffix(self):
        namespace = ModuleType('example').__dict__
        namespace['name'] = 'original'
        with self.assertRaises(ValueError):
            namespace['name_$rw$'] = 'alias'
        self.assertEqual(namespace['name'], 'original')
        self.assertNotIn('name_$rw$', namespace)

    @unittest.skipUnless(sys.implementation.name == 'skulpt', 'Skulpt module iterator snapshot')
    def test_module_dictionary_iterator_snapshots_entries(self):
        module = ModuleType('example')
        namespace = module.__dict__
        namespace.clear()
        module.first = 1
        module.second = 2
        items = namespace.items()
        iterator = iter(items)
        self.assertEqual(next(iterator), ('first', 1))
        module.second = 42
        module.extra = 3
        self.assertEqual(list(iterator), [('second', 2)])
        self.assertEqual(list(items), [('first', 1), ('second', 42), ('extra', 3)])

    @unittest.skipUnless(sys.implementation.name == 'skulpt', 'Skulpt host module')
    def test_native_namespace_is_shared(self):
        module = ModuleType('_module_dict_probe')
        sys.modules[module.__name__] = module
        try:
            # Like Anvil's loadModule(), replace $d with a native namespace.
            jseval("""
                (() => {
                    const module = Sk.sysmodules.mp$subscript(new Sk.builtin.str('_module_dict_probe'));
                    const shared = { fallback: new Sk.builtin.int_(1) };
                    const namespace = {
                        __name__: new Sk.builtin.str('_module_dict_probe'),
                        name: new Sk.builtin.str('unmangled'),
                    };
                    module.$testNamespace = namespace;
                    module.$d = new Proxy(namespace, {
                        get(target, name) {
                            return target[name] ?? shared[name];
                        },
                        set(target, name, value) {
                            (name in target ? target : shared)[name] = value;
                            return true;
                        },
                    });
                })()
            """)
            namespace = module.__dict__
            jseval("""
                (() => {
                    const module = Sk.sysmodules.mp$subscript(new Sk.builtin.str('_module_dict_probe'));
                    Object.defineProperty(module.$testNamespace, 'child', {
                        value: new Sk.builtin.int_(42), enumerable: true, writable: true, configurable: true,
                    });
                })()
            """)
            self.assertEqual(len(namespace), 2)
            self.assertEqual(namespace['child'], 42)
            self.assertEqual(module.child, 42)
            namespace['child'] = 43
            self.assertEqual(jseval("""
                Sk.sysmodules.mp$subscript(new Sk.builtin.str('_module_dict_probe')).$d.child.v
            """), 43)
            jseval("""
                delete Sk.sysmodules.mp$subscript(new Sk.builtin.str('_module_dict_probe')).$d.child
            """)
            self.assertNotIn('child', namespace)
            self.assertEqual(len(namespace), 1)
            self.assertEqual(module.fallback, 1)
            self.assertNotIn('fallback', namespace)
            namespace['fallback'] = 2
            self.assertEqual(module.fallback, 2)
            self.assertEqual(namespace.pop('fallback'), 2)
            self.assertEqual(module.fallback, 1)
            self.assertEqual(len(namespace), 1)
            self.assertNotIn('name', namespace)
            namespace['name'] = 'mangled'
            self.assertEqual(module.name, 'mangled')
            self.assertEqual(list(namespace.items()), [
                ('__name__', '_module_dict_probe'),
                ('name', 'mangled'),
            ])
            self.assertEqual(len(namespace), 2)
        finally:
            del sys.modules['_module_dict_probe']

    # frozen and namespace module reprs are tested in importlib.


if __name__ == '__main__':
    unittest.main()
