var $builtinmodule = function (name) {
    return Sk.misceval.chain(Sk.importModule("keyword", false, true), function(keywds) {
        var mod = {};

        // defaultdict object

        mod.defaultdict = function defaultdict(default_, args) {
            if (!(this instanceof mod.defaultdict)) {
                return new mod.defaultdict(default_, args);
            }

            Sk.abstr.superConstructor(mod.defaultdict, this, args);

            if (default_ === undefined) {
                this.default_factory = Sk.builtin.none.none$;
            }
            else {
                if (!Sk.builtin.checkCallable(default_) && !(default_ instanceof Sk.builtin.none)) {
                    throw new Sk.builtin.TypeError("first argument must be callable");
                }
                this.default_factory = default_;
            }

            if (this['$d']) {
                this['$d']['default_factory'] = this.default_factory;
            }
            else {
                this['$d'] = {'default_factory': this.default_factory};
            }

            return this;
        };

        Sk.abstr.setUpInheritance("defaultdict", mod.defaultdict, Sk.builtin.dict);

        mod.defaultdict.prototype['$r'] = function () {
            var def_str = Sk.misceval.objectRepr(this.default_factory).v;
            var dict_str = Sk.builtin.dict.prototype['$r'].call(this).v;
            return new Sk.builtin.str("defaultdict(" + def_str + ", " + dict_str + ")");
        };

        mod.defaultdict.prototype['__copy__'] = function (self) {
            var v;
            var iter, k;
            var ret = [];

            for (iter = Sk.abstr.iter(self), k = iter.tp$iternext();
                k !== undefined;
                k = iter.tp$iternext()) {
                v = self.mp$subscript(k);
                ret.push(k);
                ret.push(v);
            }
            return new mod.defaultdict(self['$d']['default_factory'], ret);
        };

        mod.defaultdict.prototype['__missing__'] = function (key) {
            Sk.builtin.pyCheckArgsLen('__missing__', arguments.length, 0, 1);
            if (key) {
                throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(key));
            }
            else {
                return Sk.misceval.callsimArray(this.default_factory);
            }
        };

        mod.defaultdict.prototype.mp$subscript = function (key) {
            try {
                return Sk.builtin.dict.prototype.mp$subscript.call(this, key);
            }
            catch (e) {
                if (this.default_factory instanceof Sk.builtin.none) {
                    return this.__missing__(key);
                }
                else {
                    ret = this.__missing__();
                    this.mp$ass_subscript(key, ret);
                    return ret;
                }
            }
        };

        // Counter object

        mod.Counter = function Counter(iter_or_map) {
            if (!(this instanceof mod.Counter)) {
                return new mod.Counter(iter_or_map);
            }


            if (iter_or_map instanceof Sk.builtin.dict || iter_or_map === undefined) {
                Sk.abstr.superConstructor(mod.Counter, this, iter_or_map);

            }
            else {
                if (!(Sk.builtin.checkIterable(iter_or_map))) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter_or_map) + "' object is not iterable");
                }

                Sk.abstr.superConstructor(mod.Counter, this);
                var one = new Sk.builtin.int_(1);

                for (var iter = iter_or_map.tp$iter(), k = iter.tp$iternext();
                    k !== undefined;
                    k = iter.tp$iternext()) {
                    var count = this.mp$subscript(k);
                    count = count.nb$add(one);
                    this.mp$ass_subscript(k, count);
                }
            }

            return this;
        };

        Sk.abstr.setUpInheritance("Counter", mod.Counter, Sk.builtin.dict);

        mod.Counter.prototype['$r'] = function () {
            var dict_str = this.size > 0 ? Sk.builtin.dict.prototype['$r'].call(this).v : '';
            return new Sk.builtin.str('Counter(' + dict_str + ')');
        };

        mod.Counter.prototype.mp$subscript = function (key) {
            try {
                return Sk.builtin.dict.prototype.mp$subscript.call(this, key);
            }
            catch (e) {
                return new Sk.builtin.int_(0);
            }
        };

        mod.Counter.prototype['elements'] = new Sk.builtin.func(function (self) {
            Sk.builtin.pyCheckArgsLen('elements', arguments.length, 1, 1);
            var all_elements = [];
            for (var iter = self.tp$iter(), k = iter.tp$iternext();
                k !== undefined;
                k = iter.tp$iternext()) {
                for (var i = 0; i < self.mp$subscript(k).v; i++) {
                    all_elements.push(k);
                }
            }

            var ret =
            {
                tp$iter: function () {
                    return ret;
                },
                $obj: this,
                $index: 0,
                $elem: all_elements,
                tp$iternext: function () {
                    if (ret.$index >= ret.$elem.length) {
                        return undefined;
                    }
                    return ret.$elem[ret.$index++];
                }
            };

            return ret;

        });

        mod.Counter.prototype['most_common'] = new Sk.builtin.func(function (self, n) {
            Sk.builtin.pyCheckArgsLen('most_common', arguments.length, 1, 2);
            var length = self.mp$length();

            if (n === undefined) {
                n = length;
            }
            else {
                if (!Sk.builtin.checkInt(n)) {
                    if (n instanceof Sk.builtin.float_) {
                        throw new Sk.builtin.TypeError("integer argument expected, got float");
                    }
                    else {
                        throw new Sk.builtin.TypeError("an integer is required");
                    }
                }

                n = Sk.builtin.asnum$(n);
                n = n <= length ? n : length;
                n = n >= 0 ? n : 0;
            }

            var most_common_elem = [];
            for (var iter = self.tp$iter(), k = iter.tp$iternext();
                k !== undefined;
                k = iter.tp$iternext()) {
                most_common_elem.push([k, self.mp$subscript(k)]);
            }

            var sort_func = function (a, b) {
                if (a[1].v < b[1].v) {
                    return 1;
                } else if (a[1].v > b[1].v) {
                    return -1;
                } else {
                    return 0;
                }
            };
            most_common_elem = most_common_elem.sort(sort_func);

            var ret = [];
            for (var i = 0; i < n; i++) {
                ret.push(new Sk.builtin.tuple(most_common_elem.shift()));
            }

            return new Sk.builtin.list(ret);
        });

        mod.Counter.prototype['update'] = new Sk.builtin.func(function (self, other) {
            Sk.builtin.pyCheckArgsLen('update', arguments.length, 1, 2);

            if (other instanceof Sk.builtin.dict) {
                for (var iter = other.tp$iter(), k = iter.tp$iternext();
                    k !== undefined;
                    k = iter.tp$iternext()) {
                    var count = self.mp$subscript(k);
                    self.mp$ass_subscript(k, count.nb$add(other.mp$subscript(k)));
                }
            }
            else if (other !== undefined) {
                if (!Sk.builtin.checkIterable(other)) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(other) + "' object is not iterable");
                }

                var one = new Sk.builtin.int_(1);
                for (var iter = other.tp$iter(), k = iter.tp$iternext();
                    k !== undefined;
                    k = iter.tp$iternext()) {
                    var count = self.mp$subscript(k);
                    self.mp$ass_subscript(k, count.nb$add(one));
                }
            }
        });

        mod.Counter.prototype['subtract'] = new Sk.builtin.func(function (self, other) {
            Sk.builtin.pyCheckArgsLen('subtract', arguments.length, 1, 2);

            if (other instanceof Sk.builtin.dict) {
                for (var iter = other.tp$iter(), k = iter.tp$iternext();
                    k !== undefined;
                    k = iter.tp$iternext()) {
                    var count = self.mp$subscript(k);
                    self.mp$ass_subscript(k, count.nb$subtract(other.mp$subscript(k)));
                }
            }
            else if (other !== undefined) {
                if (!Sk.builtin.checkIterable(other)) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(other) + "' object is not iterable");
                }

                var one = new Sk.builtin.int_(1);
                for (var iter = other.tp$iter(), k = iter.tp$iternext();
                    k !== undefined;
                    k = iter.tp$iternext()) {
                    var count = self.mp$subscript(k);
                    self.mp$ass_subscript(k, count.nb$subtract(one));
                }
            }
        });


        // OrderedDict
        mod.OrderedDict = function OrderedDict(items)
        {
            if (!(this instanceof mod.OrderedDict))
            {
                return new mod.OrderedDict(items);
            }

            this.orderedkeys = [];

            Sk.abstr.superConstructor(mod.OrderedDict, this, items);

            return this;
        }

        Sk.abstr.setUpInheritance("OrderedDict", mod.OrderedDict, Sk.builtin.dict);

        mod.OrderedDict.prototype['$r'] = function()
        {
            var v;
            var iter, k;
            var ret = [];
            var pairstr;
            for (iter = this.tp$iter(), k = iter.tp$iternext();
                k !== undefined;
                k = iter.tp$iternext()) {
                v = this.mp$subscript(k);
                if (v === undefined) {
                    //print(k, "had undefined v");
                    v = null;
                }
                ret.push("(" + Sk.misceval.objectRepr(k).v + ", " + Sk.misceval.objectRepr(v).v + ")");
            }
            pairstr = ret.join(", ");
            if (ret.length > 0)
            {
                pairstr = "[" + pairstr + "]";
            }
            return new Sk.builtin.str("OrderedDict(" + pairstr + ")");
        }

        mod.OrderedDict.prototype.mp$ass_subscript = function(key, w)
        {
            var idx = this.orderedkeys.indexOf(key);
            if (idx == -1)
            {
                this.orderedkeys.push(key);
            }

            return Sk.builtin.dict.prototype.mp$ass_subscript.call(this, key, w);
        }

        mod.OrderedDict.prototype.mp$del_subscript = function(key)
        {
            var idx = this.orderedkeys.indexOf(key);
            if (idx != -1)
            {
                this.orderedkeys.splice(idx, 1);
            }

            return Sk.builtin.dict.prototype.mp$del_subscript.call(this, key);
        }

        mod.OrderedDict.prototype.__iter__ = new Sk.builtin.func(function (self) {
            Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 0, 0, false, true);

            return mod.OrderedDict.prototype.tp$iter.call(self);
        });

        mod.OrderedDict.prototype.tp$iter = function()
        {
            var ret;
            ret =
            {
                tp$iter    : function () {
                    return ret;
                },
                $obj       : this,
                $index     : 0,
                $keys      : this.orderedkeys.slice(0),
                tp$iternext: function () {
                    // todo; StopIteration
                    if (ret.$index >= ret.$keys.length) {
                        return undefined;
                    }
                    return ret.$keys[ret.$index++];
                }
            };
            return ret;
        }

        mod.OrderedDict.prototype.ob$eq = function (other) {
            var l;
            var otherl;
            var iter;
            var k;
            var v;

            if (!(other instanceof mod.OrderedDict))
            {
                return Sk.builtin.dict.prototype.ob$eq.call(this, other);
            }

            l = this.mp$length();
            otherl = other.mp$length();

            if (l !== otherl) {
                return Sk.builtin.bool.false$;
            }

            for (iter = this.tp$iter(), otheriter = other.tp$iter(),
                k = iter.tp$iternext(), otherk = otheriter.tp$iternext();
                k !== undefined;
                k = iter.tp$iternext(), otherk = otheriter.tp$iternext())
            {
                if (!Sk.misceval.isTrue(Sk.misceval.richCompareBool(k, otherk, "Eq")))
                {
                    return Sk.builtin.bool.false$;
                }
                v = this.mp$subscript(k);
                otherv = other.mp$subscript(otherk);

                if (!Sk.misceval.isTrue(Sk.misceval.richCompareBool(v, otherv, "Eq"))) {
                    return Sk.builtin.bool.false$;
                }
            }

            return Sk.builtin.bool.true$;
        };

        mod.OrderedDict.prototype.ob$ne = function (other) {
            var l;
            var otherl;
            var iter;
            var k;
            var v;

            if (!(other instanceof mod.OrderedDict))
            {
                return Sk.builtin.dict.prototype.ob$ne.call(this, other);
            }

            l = this.size;
            otherl = other.size;

            if (l !== otherl) {
                return Sk.builtin.bool.true$;
            }

            for (iter = this.tp$iter(), otheriter = other.tp$iter(),
                k = iter.tp$iternext(), otherk = otheriter.tp$iternext();
                k !== undefined;
                k = iter.tp$iternext(), otherk = otheriter.tp$iternext())
            {
                if (!Sk.misceval.isTrue(Sk.misceval.richCompareBool(k, otherk, "Eq")))
                {
                    return Sk.builtin.bool.true$;
                }
                v = this.mp$subscript(k);
                otherv = other.mp$subscript(otherk);

                if (!Sk.misceval.isTrue(Sk.misceval.richCompareBool(v, otherv, "Eq"))) {
                    return Sk.builtin.bool.true$;
                }
            }

            return Sk.builtin.bool.false$;
        };

        mod.OrderedDict.prototype["pop"] = new Sk.builtin.func(function (self, key, d) {
            var s;
            var idx;

            Sk.builtin.pyCheckArgsLen('pop', arguments.length, 2, 3);

            idx = self.orderedkeys.indexOf(key);
            if (idx != -1)
            {
                self.orderedkeys.splice(idx, 1);
            }

            return Sk.misceval.callsimArray(Sk.builtin.dict.prototype["pop"], [self, key, d]);
        });

        mod.OrderedDict.prototype["popitem"] = new Sk.builtin.func(function (self, last) {
            var key, val;
            var s;

            Sk.builtin.pyCheckArgsLen('popitem', arguments.length, 1, 2);

            // Empty dictionary
            if (self.orderedkeys.length == 0)
            {
                s = new Sk.builtin.str('dictionary is empty');
                throw new Sk.builtin.KeyError(s.v);
            }

            key = self.orderedkeys[0];
            if (last === undefined || Sk.misceval.isTrue(last))
            {
                key = self.orderedkeys[self.orderedkeys.length - 1];
            }

            val = Sk.misceval.callsimArray(self["pop"], [self, key]);
            return Sk.builtin.tuple([key, val]);
        });

        // deque
        mod.deque = function deque(iterable, maxlen) {
            throw new Sk.builtin.NotImplementedError("deque is not implemented")
        };

        // namedtuple
        // namedtuple
        mod.namedtuples = {};

        var _namedtuple = function (name, fields, rename, defaults, module) {
            if (Sk.ffi.remapToJs(Sk.misceval.callsimArray(keywds.$d["iskeyword"], [name]))) {
                throw new Sk.builtin.ValueError("Type names and field names cannot be a keyword: '" + Sk.misceval.objectRepr(name) + "'");
            }

            const $name = name.$jsstr();
            // regex tests for name and fields
            const startsw = new RegExp(/^[0-9].*/);
            const startsw2 = new RegExp(/^[0-9_].*/);
            const alnum = new RegExp(/^\w*$/);
            if (startsw.test($name) || !alnum.test($name) || !$name) {
                throw new Sk.builtin.ValueError("Type names and field names must be valid identifiers: '" + $name + "'");
            }

            let flds;
            // fields could be a string or an iterable of strings
            if (Sk.builtin.checkString(fields)) {
                flds = fields.$jsstr();
                flds = flds.replace(/,/g, " ").split(/\s+/);
                if (flds.length == 1 && flds[0] === "") {
                    flds = [];
                }
            } else {
                flds = []
                iter = Sk.abstr.iter(fields);
                for (i = iter.tp$iternext(); i !== undefined; i = iter.tp$iternext()) {
                    flds.push(Sk.ffi.remapToJs(i));
                }
            }

            // rename fields
            rename = Sk.misceval.isTrue(rename);
            if (rename) {
                let seen = new Set();
                for (i = 0; i < flds.length; i++) {
                    if (Sk.ffi.remapToJs(Sk.misceval.callsimArray(keywds.$d["iskeyword"], [Sk.ffi.remapToPy(flds[i])])) ||
                        startsw2.test(flds[i]) ||
                        !alnum.test(flds[i]) ||
                        !flds[i] ||
                        seen.has(flds[i])
                    ) {
                        flds[i] = "_" + i;
                    }
                    seen.add(flds[i]);
                }
            }

            // check the field names
            for (i = 0; i < flds.length; i++) {
                if (Sk.ffi.remapToJs(Sk.misceval.callsimArray(keywds.$d["iskeyword"], [Sk.ffi.remapToPy(flds[i])]))) {
                    throw new Sk.builtin.ValueError("Type names and field names cannot be a keyword: '" + flds[i] + "'");
                } else if ((startsw2.test(flds[i]) || !flds[i]) && !rename) {
                    throw new Sk.builtin.ValueError("Field names cannot start with an underscore: '" + flds[i] + "'");
                } else if (!alnum.test(flds[i])) {
                    throw new Sk.builtin.ValueError("Type names and field names must be valid identifiers: '" + flds[i] + "'");
                }
            }

            // check duplicates
            let seen = new Set();
            for (i = 0; i < flds.length; i++) {
                if (seen.has(flds[i])) {
                    throw new Sk.builtin.ValueError("Encountered duplicate field name: '" + flds[i] + "'");
                }
                seen.add(flds[i]);
            }

            // create array of default values
            const dflts = [];
            if (!Sk.builtin.checkNone(defaults)) {
                defaults = Sk.abstr.iter(defaults);
                for (let i = defaults.tp$iternext(); i !== undefined; i = defaults.tp$iternext()) {
                    dflts.push(i);
                }
            }
            if (dflts.length > flds.length) {
                throw new Sk.builtin.TypeError("Got more default values than field names");
            }

            // Constructor for namedtuple
            var nt_cons = function () {};

            Sk.abstr.setUpInheritance($name, nt_cons, Sk.builtin.tuple);
            nt_cons.prototype.tp$mro = new Sk.builtin.tuple([nt_cons, Sk.builtin.tuple, Sk.builtin.object]);
            nt_cons.prototype.tp$bases = new Sk.builtin.tuple([Sk.builtin.tuple]);

            mod.namedtuples[$name] = nt_cons;
            
            nt_cons.prototype.tp$doc = $name + "(" + flds.join(", ") + ")";

            nt_cons.prototype.tp$new = function (args, kwargs) {
                debugger;
                args = Sk.abstr.copyKeywordsToNamedArgs("__new__", flds, args, kwargs, dflts);
                const named_tuple_instance = new this.constructor;
                Sk.builtin.tuple.call(named_tuple_instance, args);
                return named_tuple_instance;
            };

            nt_cons.prototype.$r = function () {
                let ret;
                let i;
                let bits;
                if (this.v.length === 0) {
                    return new Sk.builtin.str($name + "()");
                }
                bits = [];
                for (i = 0; i < this.v.length; ++i) {
                    bits[i] = flds[i] + "=" + Sk.misceval.objectRepr(this.v[i]).v;
                }
                ret = bits.join(", ");
                cls = Sk.abstr.typeName(this);
                return new Sk.builtin.str(cls + "(" + ret + ")");
            };

            // allocate slots here


            // allocate not slot attributes (functions, classmethods properties etc)
            if (Sk.builtin.checkNone(module)) {
                module = Sk.globals["__name__"];
            }
            nt_cons.prototype.__module__ = module;
            nt_cons.prototype.__doc__ = new Sk.builtin.str($name + "(" + flds.join(", ") + ")");
            nt_cons.prototype.__slots__ = new Sk.builtin.tuple([]);

            nt_cons.prototype.__getnewargs__ = new Sk.builtin.func(function (self) {
                return new Sk.builtin.tuple(self.v);
            });

            // create the field properties
            for (let i = 0; i < flds.length; i++) {
                const fget = function (self) {
                    return self.v[i];
                }
                fget.co_name = flds[i];
                fget.co_varnames = ["self"];
                const fld = Sk.fixReservedNames(flds[i]);
                nt_cons.prototype[fld] = new Sk.builtin.property(new Sk.builtin.func(fget), undefined, undefined, new Sk.builtin.str("Alias for field number "+ i));
            };

            // _fields
            nt_cons.prototype._fields = new Sk.builtin.tuple(flds.map(x => Sk.builtin.str(x)));

            // _make
            const _make = function (_cls, iterable) {
                iterable = Sk.abstr.iter(iterable);
                values = [];
                for (let i = iterable.tp$iternext(); i !== undefined; i = iterable.tp$iternext()) {
                    values.push(i);
                }
                return _cls.prototype.tp$new(values);
            };
            _make.co_name = new Sk.builtin.str("_make");
            _make.co_varnames = ["_cls", "iterable"];
            nt_cons.prototype._make = new Sk.builtin.classmethod(new Sk.builtin.func(_make));

            // _asdict
            const _asdict = function (self) {
                const asdict = [];
                for (let i = 0; i < self._fields.v.length; i++) {
                    asdict.push(self._fields.v[i]);
                    asdict.push(self.v[i]);
                }
                return new Sk.builtin.dict(asdict);
            };
            _asdict.co_name = new Sk.builtin.str("_asdict");
            _asdict.co_varnames = ["self"];
            nt_cons.prototype._asdict = new Sk.builtin.func(_asdict);

            // _flds_defaults
            const dflts_dict = [];
            for (let i = flds.length - dflts.length; i < flds.length; i++) {
                dflts_dict.push(new Sk.builtin.str(flds[i]));
                dflts_dict.push(dflts[i - (flds.length - dflts.length)]);
            }
            nt_cons.prototype._field_defaults = new Sk.builtin.dict(dflts_dict);

            // _replace
            const _replace = function (kwds, _self) {
                const kwd_dict = {};
                for (let i = 0; i < kwds.length; i = i + 2) {
                    kwd_dict[kwds[i].$jsstr()] = kwds[i + 1];
                }
                // get the arguments to pass to the contructor
                const args = [];
                for (let i = 0; i < flds.length; i++) {
                    const key = flds[i];
                    const v = key in kwd_dict ? kwd_dict[key] : _self.v[i];
                    args.push(v);
                    delete kwd_dict[key];
                }
                // check if kwd_dict is empty
                for (let _ in kwd_dict) {
                    // if we're here we got an enexpected kwarg
                    const key_list = Object.keys(kwd_dict).map(x => "'" + x + "'");
                    throw new Sk.builtin.ValueError("Got unexpectd field names: [" + key_list + "]");
                }
                return nt_cons.prototype.tp$new(args);
            };

            _replace.co_name = new Sk.builtin.str("replace");
            _replace.co_kwargs = 1;
            _replace.co_varnames = ["_self"];
            nt_cons.prototype._replace = new Sk.builtin.func(_replace);

            
            return nt_cons;
        };

        _namedtuple.co_name = new Sk.builtin.str("namedtuple");
        _namedtuple.co_argcount = 2;
        _namedtuple.co_kwonlyargcount = 3;
        _namedtuple.$kwdefs = [Sk.builtin.bool.false$, Sk.builtin.none.none$, Sk.builtin.none.none$];
        _namedtuple.co_varnames = ["typename", "field_names", "rename", "defaults", "module"];

        mod.namedtuple = new Sk.builtin.func(_namedtuple);
        
        return mod;
    });
};
