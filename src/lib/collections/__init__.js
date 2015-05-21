var $builtinmodule = function(name)
{

    var mod = {};

    // defaultdict object

    mod.defaultdict = function defaultdict(default_, args)
    {
        if (!(this instanceof mod.defaultdict))
        {
            return new mod.defaultdict(default_, args);
        }

        Sk.builtin.dict.call(this, args);

        if (default_ === undefined)
        {
            this.default_factory = Sk.builtin.none.none$;
        }
        else
        {
            if (!Sk.builtin.checkCallable(default_) && !(default_ instanceof Sk.builtin.none))
            {
                throw new Sk.builtin.TypeError("first argument must be callable");
            }
            this.default_factory = default_;
        }

        if (this['$d'])
        {
            this['$d']['default_factory'] = this.default_factory;
        }
        else
        {
            this['$d'] = {'default_factory': this.default_factory};
        }

        return this;
    }

    mod.defaultdict.prototype = Object.create(Sk.builtin.dict.prototype);

    mod.defaultdict.prototype.tp$name = 'defaultdict'

    mod.defaultdict.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('defaultdict', mod.defaultdict);

    mod.defaultdict.prototype['$r'] = function()
    {
        var def_str = Sk.misceval.objectRepr(this.default_factory).v;
        var dict_str = Sk.builtin.dict.prototype['$r'].call(this).v;
        return new Sk.builtin.str("defaultdict(" + def_str + ", " + dict_str + ")");
    }

    mod.defaultdict.prototype['__missing__'] = function(key)
    {
        Sk.builtin.pyCheckArgs('__missing__', arguments, 0, 1);
        if (key)
        {
            throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(key));
        }
        else
        {
            return Sk.misceval.callsim(this.default_factory);
        }
    }

    mod.defaultdict.prototype.mp$subscript = function(key)
    {
        try
        {
            return Sk.builtin.dict.prototype.mp$subscript.call(this, key);
        }
        catch (e)
        {
            if (this.default_factory instanceof Sk.builtin.none)
            {
                return this.__missing__(key);
            }
            else
            {
                ret = this.__missing__();
                this.mp$ass_subscript(key, ret);
                return ret;
            }
        }
    }

    // Counter object

    mod.Counter = function Counter(iter_or_map)
    {
        if (!(this instanceof mod.Counter))
        {
            return new mod.Counter(iter_or_map);
        }

        if (iter_or_map instanceof Sk.builtin.dict || iter_or_map === undefined)
        {
            Sk.builtin.dict.call(this, iter_or_map);
        }
        else
        {
            if (!(Sk.builtin.checkIterable(iter_or_map)))
            {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iter_or_map) + "' object is not iterable");
            }

            Sk.builtin.dict.call(this);
            var one = Sk.builtin.nmber(1, Sk.builtin.nmber.int$);

            for (var iter = iter_or_map.tp$iter(), k = iter.tp$iternext();
                 k !== undefined;
                 k = iter.tp$iternext())
            {
                var count = this.mp$subscript(k);
                count = count.nb$add(one);
                this.mp$ass_subscript(k, count);
            }
        }

        return this;
    }

    mod.Counter.prototype = Object.create(Sk.builtin.dict.prototype);

    mod.Counter.prototype.tp$name = 'Counter'

    mod.Counter.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('Counter', mod.Counter);

    mod.Counter.prototype['$r'] = function()
    {
        var dict_str = this.size > 0 ? Sk.builtin.dict.prototype['$r'].call(this).v : '';
        return new Sk.builtin.str('Counter(' + dict_str + ')');
    }

    mod.Counter.prototype.mp$subscript = function(key)
    {
        try
        {
            return Sk.builtin.dict.prototype.mp$subscript.call(this, key);
        }
        catch (e)
        {
            return new Sk.builtin.nmber(0, Sk.builtin.nmber.int$);
        }
    }

    mod.Counter.prototype['elements'] = new Sk.builtin.func(function(self)
    {
        Sk.builtin.pyCheckArgs('elements', arguments, 1, 1);
        var all_elements = [];
        for (var iter = self.tp$iter(), k = iter.tp$iternext();
             k !== undefined;
             k = iter.tp$iternext())
        {
            for (var i = 0; i < self.mp$subscript(k).v; i++)
            {
                all_elements.push(k);
            }
        }

        var ret =
        {
            tp$iter: function() { return ret; },
            $obj: this,
            $index: 0,
            $elem: all_elements,
            tp$iternext: function()
            {
                if (ret.$index >= ret.$elem.length)
                    return undefined;
                return ret.$elem[ret.$index++];
            }
        }

        return ret;

    });

    mod.Counter.prototype['most_common'] = new Sk.builtin.func(function(self, n)
    {
        Sk.builtin.pyCheckArgs('most_common', arguments, 1, 2);
        var length = self.mp$length();

        if (n === undefined)
        {
            n = length;
        }
        else
        {
            if (!Sk.builtin.checkInt(n))
            {
                if (n.skType === Sk.builtin.nmber.float$)
                {
                    throw new Sk.builtin.TypeError("integer argument expected, got float");
                }
                else
                {
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
             k = iter.tp$iternext())
        {
            most_common_elem.push([k, self.mp$subscript(k)]);
        }

        var sort_func = function(a, b)
        {
            if (a[1].v < b[1].v) {
                return 1;
            } else if (a[1].v > b[1].v) {
                return -1;
            } else {
                return 0;
            }
        }
        most_common_elem = most_common_elem.sort(sort_func);

        var ret = [];
        for (var i = 0; i < n; i++)
        {
            ret.push(new Sk.builtin.tuple(most_common_elem.shift()));
        }

        return new Sk.builtin.list(ret);
    });

    mod.Counter.prototype['update'] = new Sk.builtin.func(function(self, other)
    {
        Sk.builtin.pyCheckArgs('update', arguments, 1, 2);

        if (other instanceof Sk.builtin.dict)
        {
            for (var iter = other.tp$iter(), k = iter.tp$iternext();
                 k !== undefined;
                 k = iter.tp$iternext())
            {
                var count = self.mp$subscript(k);
                self.mp$ass_subscript(k, count.nb$add(other.mp$subscript(k)));
            }
        }
        else if (other !== undefined)
        {
            if (!Sk.builtin.checkIterable(other))
            {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(other) + "' object is not iterable");
            }

            var one = new Sk.builtin.nmber(1, Sk.builtin.nmber.int$);
            for (var iter = other.tp$iter(), k = iter.tp$iternext();
                 k !== undefined;
                 k = iter.tp$iternext())
            {
                var count = self.mp$subscript(k);
                self.mp$ass_subscript(k, count.nb$add(one));
            }
        }
    });

    mod.Counter.prototype['subtract'] = new Sk.builtin.func(function(self, other)
    {
        Sk.builtin.pyCheckArgs('subtract', arguments, 1, 2);

        if (other instanceof Sk.builtin.dict)
        {
            for (var iter = other.tp$iter(), k = iter.tp$iternext();
                 k !== undefined;
                 k = iter.tp$iternext())
            {
                var count = self.mp$subscript(k);
                self.mp$ass_subscript(k, count.nb$subtract(other.mp$subscript(k)));
            }
        }
        else if (other !== undefined)
        {
            if (!Sk.builtin.checkIterable(other))
            {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(other) + "' object is not iterable");
            }

            var one = new Sk.builtin.nmber(1, Sk.builtin.nmber.int$);
            for (var iter = other.tp$iter(), k = iter.tp$iternext();
                 k !== undefined;
                 k = iter.tp$iternext())
            {
                var count = self.mp$subscript(k);
                self.mp$ass_subscript(k, count.nb$subtract(one));
            }
        }
    });

    return mod;
}