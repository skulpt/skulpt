var $builtinmodule = function (name) {

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

    mod.defaultdict.prototype['__missing__'] = function (key) {
        Sk.builtin.pyCheckArgs('__missing__', arguments, 0, 1);
        if (key) {
            throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(key));
        }
        else {
            return Sk.misceval.callsim(this.default_factory);
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
        Sk.builtin.pyCheckArgs('elements', arguments, 1, 1);
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
        Sk.builtin.pyCheckArgs('most_common', arguments, 1, 2);
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
        Sk.builtin.pyCheckArgs('update', arguments, 1, 2);

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
        Sk.builtin.pyCheckArgs('subtract', arguments, 1, 2);

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
        Sk.builtin.pyCheckArgs("__iter__", arguments, 0, 0, false, true);

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

        Sk.builtin.pyCheckArgs('pop', arguments, 2, 3);

        idx = self.orderedkeys.indexOf(key);
        if (idx != -1)
        {
            self.orderedkeys.splice(idx, 1);
        }

        return Sk.misceval.callsim(Sk.builtin.dict.prototype["pop"], self, key, d);
    });

    mod.OrderedDict.prototype["popitem"] = new Sk.builtin.func(function (self, last) {
        var key, val;
        var s;

        Sk.builtin.pyCheckArgs('popitem', arguments, 1, 2);

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

        val = Sk.misceval.callsim(self["pop"], self, key);
        return Sk.builtin.tuple([key, val]);
    });

    // deque
    mod.deque = function deque(iterable, maxlen) {
        throw new Sk.builtin.NotImplementedError("deque is not implemented")
    };

    // namedtuple
    mod.namedtuples = {};
    var keywds = Sk.importModule("keyword", false, false);
    // should cover most things.  Does not:
    // * keyword args
    // _make
    // _replace
    // _asdict
    // _fields


    var hasDupes = function(a) {
        var counts = [];
        for(var i = 0; i <= a.length; i++) {
            if(counts[a[i]] === undefined) {
                counts[a[i]] = 1;
            } else {
                return true;
            }
        }
        return false;
    }

    var Skinherits = function(childCtor, parentCtor) {
      /** @constructor */
      function tempCtor() {};
      tempCtor.prototype = parentCtor.prototype;
      childCtor.superClass_ = parentCtor.prototype;
      childCtor.prototype = new tempCtor();
      /** @override */
      childCtor.prototype.constructor = childCtor;
    };

    mod.namedtuple = function (name, fields) {
        if (Sk.ffi.remapToJs(Sk.misceval.callsim(keywds.$d['iskeyword'],name ))) {
            throw new Sk.builtin.ValueError("Type names and field names cannot be a keyword: " + name.v);
        }
        var nm = Sk.ffi.remapToJs(name);
        startsw = new RegExp(/^[0-9].*/);
        startsw2 = new RegExp(/^[0-9_].*/);
        alnum = new RegExp(/^\w*$/);
        if (startsw.test(nm) || (! alnum.test(nm))) {
            throw new Sk.builtin.ValueError(" Bad type name " + nm);
        }
        // fields could be a string or a tuple or list of strings
        var flds = Sk.ffi.remapToJs(fields);

        if (typeof(flds) === 'string') {
            flds = flds.split(/\s+/);
        }
        // import the keyword module here and use iskeyword
        for (i = 0; i < flds.length; i++) {
            if (Sk.ffi.remapToJs(Sk.misceval.callsim(keywds.$d['iskeyword'],Sk.ffi.remapToPy(flds[i]))) ||
                  startsw2.test(flds[i]) || (! alnum.test(flds[i]))
            ) {
                throw new Sk.builtin.ValueError("Type names and field names cannot be a keyword: " + flds[i]);
            }
        }
        if (hasDupes(flds)) {
            throw new Sk.builtin.ValueError("Field names must be unique.");
        }

        var cons = function nametuple_constructor() {
            var o;
            if (arguments.length !== flds.length ) {
                throw new Sk.builtin.TypeError("Number of arguments must match");
            }
            if (!(this instanceof mod.namedtuples[nm])) {
                o = Object.create(mod.namedtuples[nm].prototype);
                o.constructor.apply(o, arguments);
                return o;
            }
            this.__class__ = mod.namedtuples[nm];
            this.v = Array.prototype.slice.call(arguments);
        };
        mod.namedtuples[nm] = cons;

        Skinherits(cons, Sk.builtin.tuple);
        cons.prototype.tp$name = nm;
        cons.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj(nm, mod.namedtuples[nm]);
        cons.prototype["$r"] = function () {
            var ret;
            var i;
            var bits;
            if (this.v.length === 0) {
                return new Sk.builtin.str(nm + "()");
            }
            bits = [];
            for (i = 0; i < this.v.length; ++i) {
                bits[i] = flds[i] + "=" + Sk.misceval.objectRepr(this.v[i]).v;
            }
            ret = bits.join(", ");
            if (this.v.length === 1) {
                ret += ",";
            }
            return new Sk.builtin.str(nm + "(" + ret + ")");
        };

        cons.prototype.tp$getattr = function (name) {
            var i = flds.indexOf(name);
            if (i >= 0) {
                return this.v[i];
            }
            return undefined;
        };

        cons.prototype.tp$setattr = function (name, value) {
            throw new Sk.builtin.AttributeError("can't set attribute");
        };

        return cons;
    };

    return mod;
};
