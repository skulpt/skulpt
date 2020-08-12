Sk.builtin.str.$emptystr = new Sk.builtin.str("");

/* Constants used for kwargs */

// Sk.builtin.int_
Sk.builtin.int_.co_varnames = [ "number", "base" ];
Sk.builtin.int_.$defaults = [ 0, Sk.builtin.none.none$ ];

// Sk.builtin.lng
Sk.builtin.lng.co_varnames = [ "number", "base" ];
Sk.builtin.lng.$defaults = [ 0, Sk.builtin.none.none$ ];

// Sk.builtin.sorted
Sk.builtin.sorted.co_varnames = ["list", "cmp", "key", "reverse"];
Sk.builtin.sorted.$defaults = [Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.bool.false$];

// Sk.builtin.dict.fromkeys
Sk.builtin.dict.$fromkeys.co_name = new Sk.builtin.str("fromkeys");
Sk.builtin.dict.prototype["fromkeys"] = new Sk.builtin.func(Sk.builtin.dict.$fromkeys);

// String constants
Sk.builtin.str.$empty = new Sk.builtin.str("");

Sk.builtin.str.$utf8 = new Sk.builtin.str("utf-8");
Sk.builtin.str.$ascii = new Sk.builtin.str("ascii");

Sk.builtin.str.$default_factory = new Sk.builtin.str("default_factory");
Sk.builtin.str.$imag = new Sk.builtin.str("imag");
Sk.builtin.str.$real = new Sk.builtin.str("real");

Sk.builtin.str.$abs = new Sk.builtin.str("__abs__");
Sk.builtin.str.$bytes = new Sk.builtin.str("__bytes__");
Sk.builtin.str.$call = new Sk.builtin.str("__call__");
Sk.builtin.str.$cmp = new Sk.builtin.str("__cmp__");
Sk.builtin.str.$complex = new Sk.builtin.str("__complex__");
Sk.builtin.str.$contains = new Sk.builtin.str("__contains__");
Sk.builtin.str.$copy = new Sk.builtin.str("__copy__");
Sk.builtin.str.$dict = new Sk.builtin.str("__dict__");
Sk.builtin.str.$dir = new Sk.builtin.str("__dir__");
Sk.builtin.str.$enter = new Sk.builtin.str("__enter__");
Sk.builtin.str.$eq = new Sk.builtin.str("__eq__");
Sk.builtin.str.$exit = new Sk.builtin.str("__exit__");
Sk.builtin.str.$index = new Sk.builtin.str("__index__");
Sk.builtin.str.$init = new Sk.builtin.str("__init__");
Sk.builtin.str.$int_ = new Sk.builtin.str("__int__");
Sk.builtin.str.$iter = new Sk.builtin.str("__iter__");
Sk.builtin.str.$float_ = new Sk.builtin.str("__float__");
Sk.builtin.str.$format = new Sk.builtin.str("__format__");
Sk.builtin.str.$ge = new Sk.builtin.str("__ge__");
Sk.builtin.str.$getattr = new Sk.builtin.str("__getattr__");
Sk.builtin.str.$getattribute = new Sk.builtin.str("__getattribute__");
Sk.builtin.str.$getitem = new Sk.builtin.str("__getitem__");
Sk.builtin.str.$gt = new Sk.builtin.str("__gt__");
Sk.builtin.str.$le = new Sk.builtin.str("__le__");
Sk.builtin.str.$len = new Sk.builtin.str("__len__");
Sk.builtin.str.$lt = new Sk.builtin.str("__lt__");
Sk.builtin.str.$module = new Sk.builtin.str("__module__");
Sk.builtin.str.$name = new Sk.builtin.str("__name__");
Sk.builtin.str.$ne = new Sk.builtin.str("__ne__");
Sk.builtin.str.$new = new Sk.builtin.str("__new__");
Sk.builtin.str.$next = new Sk.builtin.str("__next__");
Sk.builtin.str.$path = new Sk.builtin.str("__path__");
Sk.builtin.str.$repr = new Sk.builtin.str("__repr__");
Sk.builtin.str.$reversed = new Sk.builtin.str("__reversed__");
Sk.builtin.str.$round = new Sk.builtin.str("__round__");
Sk.builtin.str.$setattr = new Sk.builtin.str("__setattr__");
Sk.builtin.str.$setitem = new Sk.builtin.str("__setitem__");
Sk.builtin.str.$str = new Sk.builtin.str("__str__");
Sk.builtin.str.$trunc = new Sk.builtin.str("__trunc__");
Sk.builtin.str.$write = new Sk.builtin.str("write");

Sk.misceval.op2method_ = {
    "Eq"   : Sk.builtin.str.$eq,
    "NotEq": Sk.builtin.str.$ne,
    "Gt"   : Sk.builtin.str.$gt,
    "GtE"  : Sk.builtin.str.$ge,
    "Lt"   : Sk.builtin.str.$lt,
    "LtE"  : Sk.builtin.str.$le
};

var builtinNames = [
    "int_",
    "lng",
    "sorted",
    "range",
    "round",
    "len",
    "min",
    "max",
    "sum",
    "zip",
    "abs",
    "fabs",
    "ord",
    "chr",
    "hex",
    "oct",
    "bin",
    "dir",
    "repr",
    "open",
    "isinstance",
    "hash",
    "getattr",
    "hasattr",
    "id",
    "map",
    "filter",
    "reduce",
    "sorted",
    "any",
    "all",
    "input",
    "raw_input",
    "setattr",
    "quit",
    "quit",
    "divmod",
    "format",
    "globals",
    "issubclass"
];

for (var i = 0; i < builtinNames.length; i++) {
    Sk.builtin[builtinNames[i]].co_name = new Sk.builtin.str(builtinNames[i]);
}
