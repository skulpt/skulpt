__author__ = 'Duncan Richards'

'''
Creates a MagicMock class to make better mocked up unitests possible.

'''
_magics = {
    "__imod__", "__round__", "__matmul__", "__rmod__", "__mod__", "__itruediv__",
    "__ne__", "__truediv__", "__rlshift__", "__iadd__", "__rtruediv__", "__add__",
    "__aiter__", "__getitem__", "__rfloordiv__", "__str__", "__le__", "__rmul__",
    "__lshift__", "__exit__", "__bool__", "__rsub__", "__enter__", "__ge__", "__invert__",
    "__ior__", "__xor__", "__isub__", "__ifloordiv__", "__and__", "__sub__",
    "__radd__", "__rxor__", "__hash__", "__fspath__", "__neg__", "__sizeof__", "__floor__",
    "__mul__", "__ilshift__", "__ipow__", "__int__", "__ror__", "__rshift__",
    "__iand__", "__complex__", "__floordiv__", "__rpow__", "__rrshift__",
    "__irshift__", "__float__", "__setitem__", "__pos__", "__or__", "__imul__", "__abs__",
    "__rdivmod__", "__rand__", "__ceil__", "__rmatmul__", "__lt__", "__contains__",
    "__trunc__", "__delitem__", "__pow__", "__eq__", "__iter__", "__ixor__", "__len__",
    "__divmod__", "__next__", "__index__", "__imatmul__", "__gt__"
}

class call:
    _mock_name = None
    def __init__(self, *args, _mock_name="()", _is_called=True, **kwargs):
        self._mock_name = _mock_name.replace(".(", "(")
        self._is_called = _is_called

        self.args = args

        kwargs.pop("_mock_name", None)
        self.kwargs = kwargs

    def __getattr__(self, key):
        return call(_mock_name=f"{self._mock_name}.{key}", _is_called=False)

    def __call__(self, *args, **kwargs):
        return call(_mock_name=f"{self._mock_name}.{kwargs.pop('_mock_name', '()')}", *args, **kwargs)

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
        
        repr_mock_name = self._mock_name
        if repr_mock_name[-2:] == "()":
            repr_mock_name = self._mock_name[:-2]

        call_signature = (
            f"call{f'.{repr_mock_name}'}"
        )
        
        if self._is_called:
            call_signature = f"{call_signature}({string_args}{string_kwargs})".replace(",)", ")")
        
        call_signature = call_signature.replace(".(", "(")

        return call_signature

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
        self._mock_name = name.replace(".(", "(")
        self._internal_side_effect = None

        self.mock_calls = []
        self.method_calls = []
        self.called = False
        self._del_attrs = []

        self.side_effect = side_effect
        self.configure_mock(**kwargs)
        self._directory = [
            "assert_any_call", "assert_called", "assert_called_once", "assert_called_once_with",
            "assert_called_with", "assert_has_calls", "assert_not_called", "attach_mock", "call_args",
            "call_args_list", "call_count", "called", "configure_mock", "method_calls",
            "mock_calls", "reset_mock", "return_value", "side_effect"
        ]

    def _magic_method_mocker(self, key, *args, **kwargs):
        new_val = MagicMock(name=f"{self._mock_name}.{key}", _parent=self)
        return new_val

    def _non_eq_comparison_side_effect(self, other, operator):
        raise TypeError(f"{operator} not supported between instances of 'MagicMock' and '{str(type(other)).split('.')[-1].replace('>', '')}'")

    def __getattr__(self, key):
        if len(key) >= 4 and key[0:2] == "__" and key[-2:] == "__" and key not in _magics | {"__dir__"}:
            raise AttributeError(key)

        if key in self.__dict__:
            return self.__dict__[key]

        if key == "return_value":
            new_val = self._magic_method_mocker("()")
        else:
            new_val = self._magic_method_mocker(key)

        self.__dict__.update({key: new_val})
        return new_val

    def __call__(self, *args, **kwargs):
        self.__dict__["called"] = True
        self._create_mock_calls(*args, **kwargs)

        if self.side_effect is None and self._internal_side_effect is None:
            return self.return_value

        if self.side_effect is None:
            return self._internal_side_effect(*args, **kwargs)

        if callable(self.side_effect):
            return self.side_effect(*args, **kwargs)

        return self.side_effect
    

    def _create_mock_calls(self, *args, _call_name=None, **kwargs):
        _call_signature = _call_name or ""
        current_call = call(*args, _mock_name=_call_signature, **kwargs)
        self.mock_calls.append(current_call)

        if current_call._mock_name:
            self.method_calls.append(current_call)

        if self._parent:
            new_call_name = (
                self._mock_name.replace(f"{self._parent._mock_name}.", "") + "." + _call_signature
            ).replace(f"{self._mock_name}", "()")

            if new_call_name[-1] == ".":
                new_call_name = new_call_name[:-1].strip()
            self._parent._create_mock_calls(
                *args,
                _call_name=new_call_name,
                **kwargs,
            )


    @property
    def __eq__(self):
        magic_mock = self.__getattr__("__eq__")
        magic_mock._internal_side_effect = lambda other: other is self
        return magic_mock

    @__eq__.setter
    def __eq__(self, value):
        self.__dict__.update({"__eq__": value})


    def __repr__(self):
        current_name = f"'{self._mock_name}'"
        return f"<MagicMock{f' name={current_name}' if self._mock_name != 'mock' else ''} id='{id(self)}'>"

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
    def __next__(self):
        return self.__getattr__("__next__")

    @__next__.setter
    def __next__(self, value):
        self.__dict__.update({"__next__": value})

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

    def __delattr__(self, key):
        if key not in self._del_attrs:
            setattr(self, key, None)
            return self._del_attrs.append(key)
        
        raise AttributeError(key)

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
    def __floor__(self):
        return self.__getattr__("__floor__")

    @__floor__.setter
    def __floor__(self, value):
        self.__dict__.update({"__floor__": value})

    @property
    def __trunc__(self):
        return self.__getattr__("__trunc__")

    @__trunc__.setter
    def __trunc__(self, value):
        self.__dict__.update({"__trunc__": value})

    @property
    def __ceil__(self):
        return self.__getattr__("__ceil__")

    @__ceil__.setter
    def __ceil__(self, value):
        self.__dict__.update({"__ceil__": value})

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
        magic_mock = self.__getattr__("__ne__")
        magic_mock._internal_side_effect = lambda other: not self.__eq__(other)
        return magic_mock

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
        self._set_default_prop_return_value(magic_method_mock, 1)

        return magic_method_mock

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
        if isinstance(mock.return_value, MagicMock) and mock.return_value._mock_name == f"{mock._mock_name}()":
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
    def __hash__(self):
        magic_mock = self.__getattr__("__hash__")
        self._set_default_prop_return_value(magic_mock, object.__hash__(self))
        return magic_mock

    @__hash__.setter
    def __hash__(self, value):
        self.__dict__.update({"__hash__": value})

    @property
    def __float__(self):
        magic_mock = self.__getattr__("__float__")
        self._set_default_prop_return_value(magic_mock, 1.0)
        return magic_mock

    @__float__.setter
    def __float__(self, value):
        self.__dict__.update({"__int__": value})

    @property
    def __iter__(self):
        magic_mock = self.__getattr__("__iter__")

        def internal_iter():
            if isinstance(magic_mock.return_value, MagicMock):
                return iter([])
            return iter(magic_mock.return_value)
            

        magic_mock._internal_side_effect = internal_iter

        return magic_mock

    @__iter__.setter
    def __iter__(self, value):
        self.__dict__.update({"__iter__": value})

    @property
    def __dir__(self, *args, **kwargs):
        private_attrs = [
            "_parent", "_mock_name", "_internal_side_effect", "mock_calls",
            "method_calls", "called", "_del_attrs", "side_effect", "_directory"
        ]

        return self.__dict__.get("__dir__", lambda: self._directory + [attr for attr in self.__dict__ if attr not in private_attrs])

    @__dir__.setter
    def __dir__(self, value):
        self.__dict__.update({"__dir__": value})

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
        magic_mock = self.__getattr__("__len__")
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
        magic_mock = self.__getattr__("__str__")
        self._set_default_prop_return_value(magic_mock, repr(self))
        return magic_mock

    @__str__.setter
    def __str__(self, value):
        self.__dict__.update({"__str__": value})

    @property
    def __le__(self):
        magic_mock = self.__getattr__("__le__")
        magic_mock._internal_side_effect = lambda other: self._non_eq_comparison_side_effect(other, "<=")
        return magic_mock

    @__le__.setter
    def __le__(self, value):
        self.__dict__.update({"__le__": value})

    @property
    def __lt__(self):
        magic_mock = self.__getattr__("__lt__")
        magic_mock._internal_side_effect = lambda other: self._non_eq_comparison_side_effect(other, "<")
        return magic_mock

    @__lt__.setter
    def __lt__(self, value):
        self.__dict__.update({"__lt__": value})

    @property
    def __ge__(self):
        magic_mock = self.__getattr__("__ge__")
        magic_mock._internal_side_effect = lambda other: self._non_eq_comparison_side_effect(other, ">=")
        return magic_mock

    @__ge__.setter
    def __ge__(self, value):
        self.__dict__.update({"__ge__": value})

    @property
    def __gt__(self):
        magic_mock = self.__getattr__("__gt__")
        magic_mock._internal_side_effect = lambda other: self._non_eq_comparison_side_effect(other, ">")
        return magic_mock

    @__gt__.setter
    def __gt__(self, value):
        self.__dict__.update({"__gt__": value})

    def reset_mock(self):
        def _property_resetting(mock):
            mock.mock_calls = []
            mock.method_calls = []
            mock.called = False

        _property_resetting(self)

        for mock in self.__dict__.values():
            if isinstance(mock, MagicMock):
                _property_resetting(mock)
        
        for mock in _magics:
            _property_resetting(getattr(self, mock))

    def configure_mock(self, **kwargs):
        for key, value in kwargs.items():
            current_object = self
            key_parts_list = list(enumerate(key.split(".")))
            key_parts_list_final_index = len(key_parts_list) - 1
            for index, part in key_parts_list:
                if index == key_parts_list_final_index:
                    setattr(current_object, part, value)
                else:
                    current_object = getattr(current_object, part)

    @property
    def call_count(self):
        return len(self.call_args_list)
    
    @property
    def call_args_list(self):
        return [mock_call for mock_call in self.mock_calls if not mock_call._mock_name]
    
    @property
    def call_args(self):
        if self.call_args_list:
            return self.call_args_list[-1]
        return None
    
    def assert_any_call(self, *args, **kwargs):
        asserted_call = call(*args, **kwargs)
        if asserted_call not in self.mock_calls:
            mock_string = repr(asserted_call).replace("call", self._mock_name, 1)
            raise AssertionError(f"{mock_string} call not found")
    
    def assert_called(self):
        if not self.called:
            raise AssertionError(f"Expected '{self._mock_name}' to have been called.")
    
    def assert_called_once(self):
        direct_mock_len = self.call_count
        if direct_mock_len != 1:
            raise AssertionError(f"Expected '{self._mock_name}' to have been called once. Called {direct_mock_len} times.\nCalls: {self.mock_calls}")
    
    def assert_called_with(self, *args, **kwargs):
        direct_mock_calls = self.call_args_list
        expected_call = call(*args, **kwargs)
        if direct_mock_calls and expected_call != self.call_args:
            raise AssertionError(f"expected call not found\nExpected: {repr(expected_call).replace('call', self._mock_name, 1)}\nActual: {repr(self.call_args).replace('call', self._mock_name, 1)}")
        if not direct_mock_calls:
            raise AssertionError(f"expected call not found\nExpected: {repr(expected_call).replace('call', self._mock_name, 1)}\nActual: not called")

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
            raise AssertionError(f"Expected '{self._mock_name}' to have not been called. Called {direct_mock_len} times.\nCalls: {self.mock_calls}")
