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

    def __repr__(self):
        string_args = str(self.args).replace("(", "").replace(")", "")
        if self.kwargs:
            string_kwargs = ", ".join(
                [f"{key}={value}" for key, value in self.kwargs.items()]
            )
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
        if key in self.__dict__ and key != "name":
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
    def __rdivmod__(self):
        return self.__getattr__("__rdivmod__")

    @__rdivmod__.setter
    def __rdivmod__(self, value):
        self.__dict__.update({"__rdivmod__": value})

    @property
    def __int__(self):
        magic_mock = self.__getattr__("__int__")
        magic_mock.return_value = 1
        return magic_mock

    @__int__.setter
    def __int__(self, value):
        self.__dict__.update({"__int__": value})
