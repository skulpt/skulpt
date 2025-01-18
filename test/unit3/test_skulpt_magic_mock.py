
__author__ = 'Duncan Richards'
import unittest
from unittest.mock import MagicMock, call

class TestMagicMockBasics(unittest.TestCase):
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

if __name__ == "__main__":
    unittest.main()
