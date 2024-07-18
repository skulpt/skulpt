__author__ = 'Duncan Richards'
import unittest
from unittest.mock import MagicMock, call


class TestMagicMock(unittest.TestCase):

    def test_init(self):
        mock = MagicMock(name="test_mock")
        self.assertEqual(mock._name, "test_mock")
        self.assertFalse(mock.called)
        self.assertEqual(mock.mock_calls, [])

    def test_call(self):
        mock = MagicMock()
        result = mock(1, 2, key='value')
        self.assertTrue(mock.called)
        self.assertEqual(mock.mock_calls, [call(1, 2, _name="mock", key='value')])
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
        _ = abs(mock)
        _ = mock + 1
        _ = mock & 1
        _ = divmod(mock, 1)
        self.assertTrue(mock.__abs__.called)
        self.assertTrue(mock.__add__.called)
        self.assertTrue(mock.__and__.called)
        self.assertTrue(mock.__divmod__.called)

    def test_property_magic_methods(self):
        mock = MagicMock()
        _ = int(mock)
        self.assertTrue(mock.__int__.called)
        self.assertEqual(int(mock), 1)

    def test_custom_return_value(self):
        mock = MagicMock(return_value=42)
        self.assertEqual(mock(), 42)

    def test_mock_calls_propagation(self):
        parent_mock = MagicMock(name="parent")
        parent_mock.a(1, 2, key="value")
        self.assertEqual(parent_mock.mock_calls, [call(1, 2, _name="a", _include_name=True, key='value')])

if __name__ == '__main__':
    unittest.main()
