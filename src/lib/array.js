$builtinmodule = function (name) {
    var mod = {};

    // Type code C Type         Python Type       Minimum size in bytes
    // 'c'       char           character         1
    // 'b'       signed char    int               1
    // 'B'       unsigned char  int               1
    // 'u'       Py_UNICODE     Unicode character 2 (see note)
    // 'h'       signed short   int               2
    // 'H'       unsigned short int               2
    // 'i'       signed int     int               2
    // 'I'       unsigned int   long              2
    // 'l'       signed long    int               4
    // 'L'       unsigned long  long              4
    // 'f'       float          float             4
    // 'd'       double         float             8

    var typecodes = ['c', 'b', 'B', 'u', 'h', 'H', 'i', 'I', 'l', 'L', 'f', 'd'];

    var functions = [
      '__add__',
      '__class__',
      '__contains__',
      '__copy__',
      '__deepcopy__',
      '__delattr__',
      '__delitem__',
      '__delslice__',
      '__doc__',
      '__eq__',
      '__format__',
      '__ge__',
      '__getattribute__',
      '__getitem__',
      '__getslice__',
      '__gt__',
      '__hash__',
      '__iadd__',
      '__imul__',
      '__init__',
      '__iter__',
      '__le__',
      '__len__',
      '__lt__',
      '__mul__',
      '__ne__',
      '__new__',
      '__reduce__',
      '__reduce_ex__',
      '__repr__',
      '__rmul__',
      '__setattr__',
      '__setitem__',
      '__setslice__',
      '__sizeof__',
      '__str__',
      '__subclasshook__',
      'append',
      'buffer_info',
      'byteswap',
      'count',
      'extend',
      'fromfile',
      'fromlist',
      'fromstring',
      'fromunicode',
      'index',
      'insert',
      'itemsize',
      'pop',
      'read',
      'remove',
      'reverse',
      'tofile',
      'tolist',
      'tostring',
      'tounicode',
      'typecode',
      'write'];

    var array = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, typecode, initialiser) {
            Sk.builtin.pyCheckArgsLen("__init__", arguments.length, 2, 3);

            if (typecodes.indexOf(Sk.ffi.remapToJs(typecode)) == -1) {
                throw new Sk.builtin.ValueError("bad typecode (must be c, b, B, u, h, H, i, I, l, L, f or d)")
            }

            if (initialiser && !Sk.builtin.checkIterable(initialiser)) {
                throw new Sk.builtin.TypeError("iteration over non-sequence");
            }

            self.$d.mp$ass_subscript(new Sk.builtin.str("typecode"), typecode);

            self.$d.mp$ass_subscript(new Sk.builtin.str("__module__"), new Sk.builtin.str("array"));

            self.typecode = typecode;

            if (initialiser === undefined) {
                self.internalIterable = new Sk.builtin.list();
            } else if (initialiser instanceof Sk.builtin.list) {
                self.internalIterable = initialiser;
            } else {
                self.internalIterable = new Sk.builtin.list();
                for (iter = Sk.abstr.iter(initialiser), item = iter.tp$iternext();
                     item !== undefined;
                     item = iter.tp$iternext()) {

                    Sk.misceval.callsimArray(self.internalIterable.append, [self.internalIterable, item]);
                }
            }
        });

        $loc.__repr__ = new Sk.builtin.func(function (self) {
            var typecodeJs = Sk.ffi.remapToJs(self.typecode);
            var iterableJs = "";
            if (Sk.ffi.remapToJs(self.internalIterable).length) {
                if (Sk.ffi.remapToJs(self.typecode) == "c") {
                    iterableJs = ", '" + Sk.ffi.remapToJs(self.internalIterable).join("") + "'";
                } else {
                    iterableJs = ", " + Sk.ffi.remapToJs(Sk.misceval.callsimArray(self.internalIterable.__repr__,  [self.internalIterable]));
                }
            }

            return new Sk.builtin.str("array('" + typecodeJs + "'" + iterableJs + ")");
        });

        $loc.__str__ = $loc.__repr__;

        $loc.__getattribute__ = new Sk.builtin.func(function (self, attr) {
            return self.tp$getattr(attr);
        });

        $loc.append = new Sk.builtin.func(function (self, item) {
            Sk.misceval.callsimArray(self.internalIterable.append, [self.internalIterable, item]);
            return Sk.builtin.none.none$;
        });

        $loc.extend = new Sk.builtin.func(function(self, iterable) {
            Sk.builtin.pyCheckArgsLen("__init__", arguments.length, 2, 2);

            if (!Sk.builtin.checkIterable(iterable)) {
                throw new Sk.builtin.TypeError("iteration over non-sequence");
            }

            for (iter = Sk.abstr.iter(iterable), item = iter.tp$iternext();
                 item !== undefined;
                 item = iter.tp$iternext()) {

                Sk.misceval.callsimArray(self.internalIterable.append, [self.internalIterable, item]);
            }
        });
    };

    mod.__name__ = new Sk.builtin.str('array');

    mod.array = Sk.misceval.buildClass(mod, array, "array", []);


    return mod;
};
