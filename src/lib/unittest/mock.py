__author__ = 'Duncan Richards'

'''
Creates a MagicMock class to make better mocked up unitests possible.

'''

class call:
    def __init__(self, *args, _name="", _include_name=False, **kwargs):
        self._name = _name
        self._include_name = _include_name

        self.args = args

        kwargs.pop("_name", None)
        kwargs.pop("_include_name", None)
        self.kwargs = kwargs

    def __call__(self, *args, **kwargs):
        return call(*args, **kwargs)

    def _stringify_kwargs(self, kwargs_dict):
        return ", ".join(
                [f"{key}={repr(value)}" for key, value in kwargs_dict.items()]
            )

    def __repr__(self):
        string_args = str(self.args).replace("(", "").replace(")", "")
        if self.kwargs:
            string_kwargs = self._stringify_kwargs(self.kwargs)
        else:
            string_kwargs = ""

        if string_kwargs and string_args:
            string_kwargs = " " + string_kwargs

        call_signature = (
            f"call{f'.{self._name}' if self._include_name else ''}".replace(".()", "()")
        )
        return f"{call_signature}({string_args}{string_kwargs})".replace(",)", ")")

    def __eq__(self, other):
        return all(
            [
                repr(self) == repr(other),
                self.args == other.args,
                self.kwargs == other.kwargs,
            ]
        )


class MagicMock:
    def __init__(self, name="mock", _parent=None, side_effect=None, **kwargs):
        self._parent = _parent
        self._name = name.replace(".()", "()")

        self.mock_calls = []
        self.called = False

        self.side_effect = side_effect
        if "return_value" in kwargs:
            self.return_value = kwargs.pop("return_value")

    def _magic_method_mocker(self, key, *args, **kwargs):
        new_val = MagicMock(name=f"{self._name}.{key}", _parent=self)
        return new_val

    def __getattr__(self, key):
        if key in self.__dict__:
            return self.__dict__[key]
        if key == "return_value":
            new_val = self._magic_method_mocker("()")
        elif key in {"__str__", "__len__"}:
            new_val = self._magic_method_mocker(key, _parent=None)
        else:
            new_val = self._magic_method_mocker(key)

        self.__dict__.update({key: new_val})
        return new_val

    def __call__(self, *args, **kwargs):
        self.__dict__["called"] = True
        self._create_mock_calls(*args, **kwargs)

        if self.side_effect is None:
            return self.return_value

        if callable(self.side_effect):
            return self.side_effect(*args, **kwargs)

        return self.side_effect

    def _create_mock_calls(self, *args, _call_name=None, _include_name=False, **kwargs):
        _call_signature = _call_name or ""
        self.mock_calls.append(
            call(*args, _name=_call_signature, _include_name=_include_name, **kwargs)
        )

        if self._parent:
            new_call_name = (
                self._name.replace(f"{self._parent._name}.", "") + "." + _call_signature
            ).replace(f"{self._name}", "()")

            if new_call_name[-1] == ".":
                new_call_name = new_call_name[:-1].strip()
            self._parent._create_mock_calls(
                *args,
                _call_name=new_call_name,
                _include_name=True,
                **kwargs,
            )

    def __repr__(self):
        current_name = f"'{self._name}'"
        return f"<MagicMock{f' name={current_name}' if self._name != 'mock' else ''} id='{id(self)}'>"

    @property
    def __abs__(self):
        return self.__getattr__("__abs__")

    @__abs__.setter
    def __abs__(self, value):
        self.__dict__.update({"__abs__": value})

    @property
    def __add__(self):
        return self.__getattr__("__add__")

    @__add__.setter
    def __add__(self, value):
        self.__dict__.update({"__add__": value})

    @property
    def __and__(self):
        return self.__getattr__("__and__")

    @__and__.setter
    def __and__(self, value):
        self.__dict__.update({"__and__": value})

    @property
    def __deepcopy__(self):
        return self.__getattr__("__deepcopy__")

    @__deepcopy__.setter
    def __deepcopy__(self, value):
        self.__dict__.update({"__deepcopy__": value})

    @property
    def __delattr__(self):
        return self.__getattr__("__delattr__")

    @__delattr__.setter
    def __delattr__(self, value):
        self.__dict__.update({"__delattr__": value})

    @property
    def __delitem__(self):
        return self.__getattr__("__delitem__")

    @__delitem__.setter
    def __delitem__(self, value):
        self.__dict__.update({"__delitem__": value})

    @property
    def __divmod__(self):
        return self.__getattr__("__divmod__")

    @__divmod__.setter
    def __divmod__(self, value):
        self.__dict__.update({"__divmod__": value})

    @property
    def __float__(self):
        return self.__getattr__("__float__")

    @__float__.setter
    def __float__(self, value):
        self.__dict__.update({"__float__": value})

    @property
    def __floor__(self):
        return self.__getattr__("__floor__")

    @__floor__.setter
    def __floor__(self, value):
        self.__dict__.update({"__floor__": value})

    @property
    def __floordiv__(self):
        return self.__getattr__("__floordiv__")

    @__floordiv__.setter
    def __floordiv__(self, value):
        self.__dict__.update({"__floordiv__": value})

    @property
    def __lshift__(self):
        return self.__getattr__("__lshift__")

    @__lshift__.setter
    def __lshift__(self, value):
        self.__dict__.update({"__lshift__": value})

    @property
    def __matmul__(self):
        return self.__getattr__("__matmul__")

    @__matmul__.setter
    def __matmul__(self, value):
        self.__dict__.update({"__matmul__": value})

    @property
    def __mod__(self):
        return self.__getattr__("__mod__")

    @__mod__.setter
    def __mod__(self, value):
        self.__dict__.update({"__mod__": value})

    @property
    def __mul__(self):
        return self.__getattr__("__mul__")

    @__mul__.setter
    def __mul__(self, value):
        self.__dict__.update({"__mul__": value})

    @property
    def __ne__(self):
        return self.__getattr__("__ne__")

    @__ne__.setter
    def __ne__(self, value):
        self.__dict__.update({"__ne__": value})

    @property
    def __neg__(self):
        return self.__getattr__("__neg__")

    @__neg__.setter
    def __neg__(self, value):
        self.__dict__.update({"__neg__": value})

    @property
    def __or__(self):
        return self.__getattr__("__or__")

    @__or__.setter
    def __or__(self, value):
        self.__dict__.update({"__or__": value})

    @property
    def __pos__(self):
        return self.__getattr__("__pos__")

    @__pos__.setter
    def __pos__(self, value):
        self.__dict__.update({"__pos__": value})

    @property
    def __pow__(self):
        return self.__getattr__("__pow__")

    @__pow__.setter
    def __pow__(self, value):
        self.__dict__.update({"__pow__": value})

    @property
    def __radd__(self):
        return self.__getattr__("__radd__")

    @__radd__.setter
    def __radd__(self, value):
        self.__dict__.update({"__radd__": value})

    @property
    def __exit__(self):
        return self.__getattr__("__exit__")

    @__exit__.setter
    def __exit__(self, value):
        self.__dict__.update({"__exit__": value})

    @property
    def __enter__(self):
        return self.__getattr__("__enter__")

    @__enter__.setter
    def __enter__(self, value):
        self.__dict__.update({"__enter__": value})

    @property
    def __rand__(self):
        return self.__getattr__("__rand__")

    @__rand__.setter
    def __rand__(self, value):
        self.__dict__.update({"__rand__": value})

    @property
    def __rdivmod__(self, *args, **kwargs):
        return self.__getattr__("__rdivmod__")

    @__rdivmod__.setter
    def __rdivmod__(self, value):
        self.__dict__.update({"__rdivmod__": value})

    @property
    def __rfloordiv__(self, *args, **kwargs):
        return self.__getattr__("__rfloordiv__")

    @__rfloordiv__.setter
    def __rfloordiv__(self, value):
        self.__dict__.update({"__rfloordiv__": value})

    @property
    def __rlshift__(self, *args, **kwargs):
        return self.__getattr__("__rlshift__")

    @__rlshift__.setter
    def __rlshift__(self, value):
        self.__dict__.update({"__rlshift__": value})

    @property
    def __rmatmul__(self, *args, **kwargs):
        return self.__getattr__("__rmatmul__")

    @__rmatmul__.setter
    def __rmatmul__(self, value):
        self.__dict__.update({"__rmatmul__": value})

    @property
    def __rmod__(self, *args, **kwargs):
        return self.__getattr__("__rmod__")

    @__rmod__.setter
    def __rmod__(self, value):
        self.__dict__.update({"__rmod__": value})

    @property
    def __rmul__(self, *args, **kwargs):
        return self.__getattr__("__rmul__")

    @__rmul__.setter
    def __rmul__(self, value):
        self.__dict__.update({"__rmul__": value})

    @property
    def __ror__(self, *args, **kwargs):
        return self.__getattr__("__ror__")

    @__ror__.setter
    def __ror__(self, value):
        self.__dict__.update({"__ror__": value})

    @property
    def __round__(self, *args, **kwargs):
        return self.__getattr__("__round__")

    @__round__.setter
    def __round__(self, value):
        self.__dict__.update({"__round__": value})

    @property
    def __rpow__(self, *args, **kwargs):
        return self.__getattr__("__rpow__")

    @__rpow__.setter
    def __rpow__(self, value):
        self.__dict__.update({"__rpow__": value})

    @property
    def __rrshift__(self, *args, **kwargs):
        return self.__getattr__("__rrshift__")

    @__rrshift__.setter
    def __rrshift__(self, value):
        self.__dict__.update({"__rrshift__": value})

    @property
    def __rshift__(self, *args, **kwargs):
        return self.__getattr__("__rshift__")

    @__rshift__.setter
    def __rshift__(self, value):
        self.__dict__.update({"__rshift__": value})

    @property
    def __rsub__(self, *args, **kwargs):
        return self.__getattr__("__rsub__")

    @__rsub__.setter
    def __rsub__(self, value):
        self.__dict__.update({"__rsub__": value})

    @property
    def __rtruediv__(self, *args, **kwargs):
        return self.__getattr__("__rtruediv__")

    @__rtruediv__.setter
    def __rtruediv__(self, value):
        self.__dict__.update({"__rtruediv__": value})

    @property
    def __rxor__(self, *args, **kwargs):
        return self.__getattr__("__rxor__")

    @__rxor__.setter
    def __rxor__(self, value):
        self.__dict__.update({"__rxor__": value})

    @property
    def __sizeof__(self, *args, **kwargs):
        return self.__getattr__("__sizeof__")

    @__sizeof__.setter
    def __sizeof__(self, value):
        self.__dict__.update({"__sizeof__": value})

    @property
    def __sub__(self, *args, **kwargs):
        return self.__getattr__("__sub__")

    @__sub__.setter
    def __sub__(self, value):
        self.__dict__.update({"__sub__": value})

    @property
    def __truediv__(self, *args, **kwargs):
        return self.__getattr__("__truediv__")

    @__truediv__.setter
    def __truediv__(self, value):
        self.__dict__.update({"__truediv__": value})

    @property
    def __xor__(self, *args, **kwargs):
        return self.__getattr__("__xor__")

    @__xor__.setter
    def __xor__(self, value):
        self.__dict__.update({"__xor__": value})

    @property
    def __setitem__(self, *args, **kwargs):
        return self.__getattr__("__setitem__")

    @__setitem__.setter
    def __setitem__(self, value):
        self.__dict__.update({"__setitem__": value})

    @property
    def __iter__(self, *args, **kwargs):
        return self.__getattr__("__iter__")

    @__iter__.setter
    def __iter__(self, value):
        self.__dict__.update({"__iter__": value})

    @property
    def __getitem__(self, *args, **kwargs):
        return self.__getattr__("__getitem__")

    @__getitem__.setter
    def __getitem__(self, value):
        self.__dict__.update({"__getitem__": value})

    @property
    def __iadd__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__iadd__")

        self = magic_method_mock

        return self

    @__iadd__.setter
    def __iadd__(self, value):
        self.__dict__.update({"__iadd__": value})

    @property
    def __iand__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__iand__")

        self = magic_method_mock

        return self

    @__iand__.setter
    def __iand__(self, value):
        self.__dict__.update({"__iand__": value})

    @property
    def __ifloordiv__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__ifloordiv__")

        self = magic_method_mock

        return self

    @__ifloordiv__.setter
    def __ifloordiv__(self, value):
        self.__dict__.update({"__ifloordiv__": value})

    @property
    def __ilshift__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__ilshift__")

        self = magic_method_mock

        return self

    @__ilshift__.setter
    def __ilshift__(self, value):
        self.__dict__.update({"__ilshift__": value})

    @property
    def __imatmul__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__imatmul__")

        self = magic_method_mock

        return self

    @__imatmul__.setter
    def __imatmul__(self, value):
        self.__dict__.update({"__imatmul__": value})

    @property
    def __imod__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__imod__")

        self = magic_method_mock

        return self

    @__imod__.setter
    def __imod__(self, value):
        self.__dict__.update({"__imod__": value})

    @property
    def __imul__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__imul__")

        self = magic_method_mock

        return self

    @__imul__.setter
    def __imul__(self, value):
        self.__dict__.update({"__imul__": value})

    @property
    def __index__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__index__")

        self = magic_method_mock

        return self

    @__index__.setter
    def __index__(self, value):
        self.__dict__.update({"__index__": value})

    @property
    def __invert__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__invert__")

        self = magic_method_mock

        return self

    @__invert__.setter
    def __invert__(self, value):
        self.__dict__.update({"__invert__": value})

    @property
    def __ior__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__ior__")

        self = magic_method_mock

        return self

    @__ior__.setter
    def __ior__(self, value):
        self.__dict__.update({"__ior__": value})

    @property
    def __ipow__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__ipow__")

        self = magic_method_mock

        return self

    @__ipow__.setter
    def __ipow__(self, value):
        self.__dict__.update({"__ipow__": value})

    @property
    def __irshift__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__irshift__")

        self = magic_method_mock

        return self

    @__irshift__.setter
    def __irshift__(self, value):
        self.__dict__.update({"__irshift__": value})

    @property
    def __isub__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__isub__")

        self = magic_method_mock

        return self

    @__isub__.setter
    def __isub__(self, value):
        self.__dict__.update({"__isub__": value})

    @property
    def __itruediv__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__itruediv__")

        self = magic_method_mock

        return self

    @__itruediv__.setter
    def __itruediv__(self, value):
        self.__dict__.update({"__itruediv__": value})

    @property
    def __ixor__(self, *args, **kwargs):
        magic_method_mock = self.__getattr__("__ixor__")

        self = magic_method_mock

        return self

    def _set_default_prop_return_value(self, mock, value):
        if isinstance(mock.return_value, MagicMock) and mock.return_value._name == f"{mock._name}()":
            mock.return_value = value

    @property
    def __int__(self):
        magic_mock = self.__getattr__("__int__")
        self._set_default_prop_return_value(magic_mock, 1)
        return magic_mock

    @__int__.setter
    def __int__(self, value):
        self.__dict__.update({"__int__": value})

    @property
    def __complex__(self):
        magic_mock = self.__getattr__("__complex__")
        self._set_default_prop_return_value(magic_mock, 1j)
        return magic_mock

    @__complex__.setter
    def __complex__(self, value):
        self.__dict__.update({"__complex__": value})
    
    @property
    def __len__(self):
        magic_mock = self.__dict__.get("__len__", MagicMock("__len__", _parent=None))
        self.__dict__.update({"__len__": magic_mock})
        self._set_default_prop_return_value(magic_mock, 0)
        return magic_mock

    @__len__.setter
    def __len__(self, value):
        self.__dict__.update({"__len__": value})

    @property
    def __bool__(self):
        magic_mock = self.__dict__.get("__bool__", MagicMock("__bool__", _parent=None))
        self.__dict__.update({"__bool__": magic_mock})
        self._set_default_prop_return_value(magic_mock, True)
        return magic_mock

    @__bool__.setter
    def __bool__(self, value):
        self.__dict__.update({"__bool__": value})

    @property
    def __str__(self):
        magic_mock = self.__dict__.get("__str__", MagicMock("__str__", _parent=None))
        self.__dict__.update({"__str__": magic_mock})
        self._set_default_prop_return_value(magic_mock, repr(self))
        return magic_mock

    @__str__.setter
    def __str__(self, value):
        self.__dict__.update({"__str__": value})

    @property
    def call_count(self):
        return len(self.call_args_list)
    
    @property
    def call_args_list(self):
        return [mock_call for mock_call in self.mock_calls if not mock_call._name]
    
    @property
    def call_args(self):
        if self.call_args_list:
            return self.call_args_list[-1]
        return None
    
    def assert_any_call(self, *args, **kwargs):
        asserted_call = call(*args, **kwargs)
        if asserted_call not in self.mock_calls:
            mock_string = repr(asserted_call).replace("call", self._name, 1)
            raise AssertionError(f"{mock_string} call not found")
    
    def assert_called(self):
        if not self.called:
            raise AssertionError(f"Expected '{self._name}' to have been called.")
    
    def assert_called_once(self):
        direct_mock_len = self.call_count
        if direct_mock_len != 1:
            raise AssertionError(f"Expected '{self._name}' to have been called once. Called {direct_mock_len} times.\nCalls: {self.mock_calls}")
    
    def assert_called_with(self, *args, **kwargs):
        direct_mock_calls = self.call_args_list
        expected_call = call(*args, **kwargs)
        if direct_mock_calls and expected_call != self.call_args:
            raise AssertionError(f"expected call not found\nExpected: {repr(expected_call).replace('call', self._name, 1)}\nActual: {repr(self.call_args).replace('call', self._name, 1)}")
        if not direct_mock_calls:
            raise AssertionError(f"expected call not found\nExpected: {repr(expected_call).replace('call', self._name, 1)}\nActual: not called")

    def assert_called_once_with(self, *args, **kwargs):
        self.assert_called_once()
        self.assert_called_with(*args, **kwargs)
    
    def assert_has_calls(self, call_list):
        if not call_list:
            return
        if call_list[0] in self.mock_calls:
            direct_mocks = self.call_args_list
            first_call_index = direct_mocks.index(call_list[0])
            all_calls = direct_mocks[first_call_index: first_call_index + len(call_list)]
            if call_list != all_calls:
                raise AssertionError(f"Calls not found.\nExpected: {call_list}\nActual: {self.mock_calls}")
        else:
            raise AssertionError(f"Calls not found.\nExpected: {call_list}\nActual: {self.mock_calls}")

    def assert_not_called(self):
        direct_mock_len = self.call_count
        if direct_mock_len:
            raise AssertionError(f"Expected '{self._name}' to have not been called. Called {direct_mock_len} times.\nCalls: {self.mock_calls}")
