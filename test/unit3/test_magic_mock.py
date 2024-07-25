__author__ = 'Duncan Richards'
import unittest, math
from unittest.mock import MagicMock, call, _magics



class TestMockingMagicMethods(unittest.TestCase):
    def test_magicmock_del(self):
        mock = MagicMock()
        # before using getitem
        del mock.__getitem__
        self.assertRaises(TypeError, lambda: mock['foo'])

        mock = MagicMock()
        # this time use it first
        mock['foo']
        del mock.__getitem__
        self.assertRaises(TypeError, lambda: mock['foo'])

    def test_equality(self):
        mock = MagicMock()

        self.assertEqual(mock == mock, True)
        self.assertIsInstance(mock == mock, bool)
        self.assertEqual(mock != mock, False)
        self.assertIsInstance(mock != mock, bool)
        self.assertEqual(mock == object(), False)
        self.assertEqual(mock != object(), True)


    def test_magicmock(self):
        mock = MagicMock()

        mock.__iter__.return_value = iter([1, 2, 3])
        self.assertEqual(list(mock), [1, 2, 3])

        getattr(mock, '__bool__').return_value = False
        self.assertFalse(hasattr(mock, '__nonzero__'))
        self.assertFalse(bool(mock))

        for entry in _magics:
            self.assertTrue(hasattr(mock, entry))
        self.assertFalse(hasattr(mock, '__imaginary__'))


    def test_magic_mock_equality(self):
        mock = MagicMock()
        self.assertIsInstance(mock == object(), bool)
        self.assertIsInstance(mock != object(), bool)

        self.assertEqual(mock == object(), False)
        self.assertEqual(mock != object(), True)
        self.assertEqual(mock == mock, True)
        self.assertEqual(mock != mock, False)


    def test_magicmock_defaults(self):
        mock = MagicMock()
        self.assertEqual(int(mock), 1)
        self.assertEqual(complex(mock), 1j)
        self.assertEqual(float(mock), 1.0)
        self.assertNotIn(object(), mock)
        self.assertEqual(len(mock), 0)
        self.assertEqual(list(mock), [])
        self.assertEqual(hash(mock), object.__hash__(mock))
        self.assertEqual(str(mock), object.__str__(mock))
        self.assertTrue(bool(mock))
        self.assertEqual(round(mock), mock.__round__())
        self.assertEqual(math.trunc(mock), mock.__trunc__())
        self.assertEqual(math.floor(mock), mock.__floor__())
        self.assertEqual(math.ceil(mock), mock.__ceil__())

        # in Python 3 oct and hex use __index__
        # so these tests are for __index__ in py3k
        self.assertEqual(oct(mock), '0o1')
        self.assertEqual(hex(mock), '0x1')
        # how to test __sizeof__ ?


    def test_attributes_and_return_value(self):
        mock = MagicMock()
        attr = mock.foo
        self.assertEqual(type(attr), MagicMock)

        returned = mock()
        self.assertEqual(type(returned), MagicMock)


    def test_magic_methods_are_magic_mocks(self):
        mock = MagicMock()
        self.assertIsInstance(mock.__getitem__, MagicMock)

        mock[1][2].__getitem__.return_value = 3
        self.assertEqual(mock[1][2][3], 3)


    def test_magic_method_reset_mock(self):
        mock = MagicMock()
        str(mock)
        self.assertTrue(mock.__str__.called)
        mock.reset_mock()
        self.assertFalse(mock.__str__.called)


    def test_dir(self):
        # overriding the default implementation
        mock = MagicMock()
        def _dir():
            return ['foo']
        mock.__dir__ = _dir
        self.assertEqual(dir(mock), ['foo'])


    def test_iterable_as_iter_return_value(self):
        m = MagicMock()
        m.__iter__.return_value = [1, 2, 3]
        self.assertEqual(list(m), [1, 2, 3])
        self.assertEqual(list(m), [1, 2, 3])

        m.__iter__.return_value = iter([4, 5, 6])
        self.assertEqual(list(m), [4, 5, 6])
        self.assertEqual(list(m), [])


    def test_matmul(self):
        m = MagicMock()
        self.assertIsInstance(m @ 1, MagicMock)
        m.__matmul__.return_value = 42
        m.__rmatmul__.return_value = 666
        m.__imatmul__.return_value = 24
        self.assertEqual(m @ 1, 42)
        self.assertEqual(1 @ m, 666)
        m @= 24
        self.assertEqual(m, 24)

    def test_divmod_and_rdivmod(self):
        m = MagicMock()
        self.assertIsInstance(divmod(5, m), MagicMock)
        m.__divmod__.return_value = (2, 1)
        self.assertEqual(divmod(m, 2), (2, 1))
        m = MagicMock()
        foo = divmod(2, m)
        self.assertIsInstance(foo, MagicMock)
        foo_direct = m.__divmod__(2)
        self.assertIsInstance(foo_direct, MagicMock)
        bar = divmod(m, 2)
        self.assertIsInstance(bar, MagicMock)
        bar_direct = m.__rdivmod__(2)
        self.assertIsInstance(bar_direct, MagicMock)

    # http://bugs.python.org/issue23310
    # Check if you can change behaviour of magic methods in MagicMock init
    def test_magic_in_initialization(self):
        m = MagicMock(**{'__str__.return_value': "12"})
        self.assertEqual(str(m), "12")

    def test_changing_magic_set_in_initialization(self):
        m = MagicMock(**{'__str__.return_value': "12"})
        m.__str__.return_value = "13"
        self.assertEqual(str(m), "13")
        m = MagicMock(**{'__str__.return_value': "12"})
        m.configure_mock(**{'__str__.return_value': "14"})
        self.assertEqual(str(m), "14")

    def test_init(self):
        mock = MagicMock(name="test_mock")
        self.assertEqual(mock._mock_name, "test_mock")
        self.assertFalse(mock.called)
        self.assertEqual(mock.mock_calls, [])

    def test_call(self):
        mock = MagicMock()
        result = mock(1, 2, key='value')
        self.assertTrue(mock.called)
        self.assertEqual(mock.mock_calls, [call(1, 2, key='value')])
        self.assertEqual(result, mock.return_value)

    def test_callable_side_effect(self):
        mock = MagicMock(side_effect=lambda x: x + 1)
        result = mock(1)
        self.assertEqual(result, 2)

    def test_return_side_effect(self):
        mock = MagicMock(side_effect=[1, 2, 3])
        self.assertEqual(mock(), [1, 2, 3])

    def test_repr(self):
        mock = MagicMock(name="test_repr")
        self.assertIn("test_repr", repr(mock))

    def test_magic_methods(self):
        mock = MagicMock()
        abs(mock)
        mock + 1
        divmod(mock, 1)
        self.assertTrue(mock.__abs__.called)
        self.assertTrue(mock.__add__.called)
        self.assertTrue(mock.__divmod__.called)

    def test_default_return_magic_methods(self):
        mock = MagicMock()
        number_mock = int(mock)
        complex_mock = complex(mock)
        len_mock = len(mock)
        string_mock = str(mock)
        bool_mock = bool(mock)
        self.assertEqual(number_mock, 1)
        self.assertEqual(complex_mock, 1j)
        self.assertEqual(len_mock, 0)
        self.assertEqual(string_mock, repr(mock))
        self.assertEqual(bool_mock, True)

    def test_custom_return_value(self):
        mock = MagicMock(return_value=42)
        self.assertEqual(mock(), 42)

    def test_mock_calls_propagation(self):
        parent_mock = MagicMock(name="parent")
        parent_mock.a(1, 2, key="value")
        self.assertEqual(parent_mock.mock_calls, [call(1, 2, _mock_name="a", key='value')])

    def test_assert_any_call(self):
        mock = MagicMock()
        # Tests that it fails without calls
        with self.assertRaises(AssertionError):
            mock.assert_any_call()

        # Tests calling with args and kwargs
        mock(1, test=None)
        self.assertIsNone(mock.assert_any_call(1, test=None))
        with self.assertRaises(AssertionError):
            mock.assert_any_call()
        
        # Tests no args calling and that both pass still
        mock()
        self.assertIsNone(mock.assert_any_call(1, test=None))
        mock.assert_any_call()
    
    def test_assert_called(self):
        mock = MagicMock()
        # Tests it fails before being called
        with self.assertRaises(AssertionError):
            mock.assert_called()
        
        # Tests it passes after calling once
        mock()
        self.assertIsNone(mock.assert_called())
    
    def test_assert_called_once(self):
        mock = MagicMock()
        # Tests that it fails with no calls
        with self.assertRaises(AssertionError):
            mock.assert_called_once()
        
        # Tests that it stil fails after calling an attribute
        mock.a()
        with self.assertRaises(AssertionError):
            mock.assert_called_once()
        
        # Tests that it passes calling once
        mock()
        self.assertIsNone(mock.assert_called_once())

        # Tests it fails after calling again
        mock(1, b=2)
        with self.assertRaises(AssertionError):
            mock.assert_called_once()
    
    def test_assert_called_with(self):
        mock = MagicMock()
        # Test it fails if its never been called
        with self.assertRaises(AssertionError):
            mock.assert_called_with()
        
        # Tests it fails when called with the wrong args
        mock(test=[])
        with self.assertRaises(AssertionError):
            mock.assert_called_with()
        
        # Tests it passes with the right args
        self.assertIsNone(mock.assert_called_with(test=[]))

        # Tests it fails when its not the last call
        mock({1: "hello"})
        with self.assertRaises(AssertionError):
            mock.assert_called_with(test=[])
        
        # Tests that attribute calls don't cause errors
        self.assertIsNone(mock.assert_called_with({1: "hello"}))
    
    def test_assert_called_once_with(self):
        mock = MagicMock()
        # Tests it fails when nothing is called
        with self.assertRaises(AssertionError):
            mock.assert_called_once_with()
        
        # Tests it fails when called with the wrong args
        mock("anything else")
        with self.assertRaises(AssertionError):
            mock.assert_called_once_with("hello", 2)
        # Tests it passes with the right args
        self.assertIsNone(mock.assert_called_once_with("anything else"))

        # Tests it fails with multiple calls
        mock()
        with self.assertRaises(AssertionError):
            mock.assert_called_once_with()

    def test_assert_has_call(self):
        mock = MagicMock()
        # Tests an empty list passes
        self.assertIsNone(mock.assert_has_calls([]))

        # Tests a matching list matches entirely
        mock(3)
        mock("a", other=[])
        self.assertIsNone(mock.assert_has_calls([call(3), call("a", other=[])]))

        # Tests that a backwards list fails
        with self.assertRaises(AssertionError):
            mock.assert_has_calls([call("a", other=[]), call(3)])
        
        # Tests a too long list fails
        with self.assertRaises(AssertionError):
            mock.assert_has_calls([call(3), call("a", other=[]), call()])
        
        # Tests that a call list in the middle passes
        mock({1: 2})
        self.assertIsNone(mock.assert_has_calls([call(3), call("a", other=[])]))
    
    def test_assert_not_called(self):
        mock = MagicMock()
        # Tests it passes before being called
        self.assertIsNone(mock.assert_not_called())
        
        # Tests it fails after calling once
        mock()
        with self.assertRaises(AssertionError):
            mock.assert_not_called()
    
    def test_call_count(self):
        mock = MagicMock()
        # Call the mock 3 times and attributes on the mock -> count should be 3
        mock()
        mock(1)
        mock(test="another")
        mock.a()
        mock.b.c(23)
        self.assertEqual(mock.call_count, 3)

if __name__ == '__main__':
    unittest.main()
