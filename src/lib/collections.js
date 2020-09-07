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
                if (!Sk.builtin.checkCallable(default_) && !(default_ === Sk.builtin.none.none$)) {
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
                if (this.default_factory === Sk.builtin.none.none$) {
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
            return new Sk.builtin.tuple([key, val]);
        });

        // deque - Special thanks to:https://github.com/blakeembrey/deque
        mod.deque = function(iterable, maxlen){
            if (!(this instanceof mod.deque)) {
                return new mod.deque(iterable, maxlen);
            }
            if (this['$d']) 
                this['$d']['maxlen'] = maxlen?maxlen:Sk.builtin.none.none$;
            else
                this['$d'] = {'maxlen': maxlen?maxlen:Sk.builtin.none.none$};

            this.head = 0;
            this.tail = 0;
            this.mask = 1;

            if(maxlen && !Sk.builtin.checkNone(maxlen)){
                maxlen = Sk.builtin.asnum$(maxlen);
                if(!Number.isInteger(maxlen)){
                    throw new Sk.builtin.TypeError("an integer is required");
                }else if (maxlen < 0){
                    throw new Sk.builtin.ValueError("maxlen must be non-negative");
                }else{
                    this.maxlen = maxlen;
                }
            }

            if(iterable === undefined){
                this.v = new Array(2);
            }else if (Sk.builtin.checkIterable(iterable)) {
                this.v = new Array(2);
                mod.deque.prototype['extend'].func_code(this, iterable);
            }else{
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
            }

            this.__class__ = mod.deque;

            return this;
        };
        mod.deque.minArgs = 1;
        mod.deque.maxArgs = 2;
        mod.deque.co_varnames = ["iterable", "maxlen"];
        mod.deque.co_name = new Sk.builtin.str("mod.deque");
        mod.deque.co_argcount = 2;
        mod.deque.$defaults = [new Sk.builtin.tuple([]), Sk.builtin.none.none$];

        Sk.abstr.setUpInheritance("collections.deque", mod.deque, Sk.builtin.seqtype);
        Sk.abstr.markUnhashable(mod.deque);

        mod.deque.prototype.$init$ = mod.deque;

        mod.deque.prototype.__init__ = new Sk.builtin.func(function(self, iterable, maxlen){
            self.$init$(iterable, maxlen);
        });

        mod.deque.prototype.$resize = function(size, length) {
            var head = this.head;
            var mask = this.mask;
            this.head = 0;
            this.tail = size;
            this.mask = length - 1;
            // Optimize resize when list is already sorted.
            if (head === 0) {
                this.v.length = length;
                return;
            }
            const sorted = new Array(length);
            for (let i = 0; i < size; i++)
                sorted[i] = this.v[(head + i) & mask];
            this.v = sorted;
        }
        mod.deque.prototype.$push = function (value) {
            this.v[this.tail] = value;
            this.tail = (this.tail + 1) & this.mask;
            if (this.head === this.tail)
                this.$resize(this.v.length, this.v.length << 1);

            var size = (this.tail - this.head) & this.mask;
            if(this.maxlen !== undefined && size > this.maxlen)
                 mod.deque.prototype['popleft'].func_code(this);
            return this;
        };
        mod.deque.prototype.$pushLeft = function(value) {
            this.head = (this.head - 1) & this.mask;
            this.v[this.head] = value;
            if (this.head === this.tail)
                this.$resize(this.v.length, this.v.length << 1);

            var size = (this.tail - this.head) & this.mask;
            if(this.maxlen !== undefined && size > this.maxlen)
                 mod.deque.prototype['pop'].func_code(this);
            return this;
        }
        
        mod.deque.prototype['append'] = new Sk.builtin.func(function (self, value) {
            Sk.builtin.pyCheckArgsLen("append", arguments.length, 1, 1, true, false);
            self.$push(value);
            return Sk.builtin.none.none$;
        });
        
        mod.deque.prototype['appendleft'] = new Sk.builtin.func(function (self, value) {
            Sk.builtin.pyCheckArgsLen("appendleft", arguments.length, 1, 1, true, false);
            self.$pushLeft(value);
            return Sk.builtin.none.none$;
        });

        
        mod.deque.prototype['extend'] = new Sk.builtin.func(function (self, iterable) {
            Sk.builtin.pyCheckArgsLen("extend", arguments.length, 1, 1, true, false);
            if(!Sk.builtin.checkIterable(iterable))
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");

            for (it = Sk.abstr.iter(iterable), i = it.tp$iternext(); 
                i !== undefined; i = it.tp$iternext()) {
                self.$push(i);
            }
            return Sk.builtin.none.none$;
        });
        
        mod.deque.prototype['extendleft'] = new Sk.builtin.func(function (self, iterable) {
            Sk.builtin.pyCheckArgsLen("extendleft", arguments.length, 1, 1, true, false);
            if(!Sk.builtin.checkIterable(iterable))
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
            
            for (it = Sk.abstr.iter(iterable), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                self.$pushLeft(i);
            }
            return Sk.builtin.none.none$;
        });
        
        mod.deque.prototype['clear'] = new Sk.builtin.func(function (self) { 
            Sk.builtin.pyCheckArgsLen("clear", arguments.length, 0, 0, true, false);
            self.head = 0;
            self.tail = 0;
            self.mask = 1;
            self.maxlen = undefined; 
            self.v = new Array(2);
        });
        
        mod.deque.prototype['insert'] = new Sk.builtin.func(function (self, idx, value) { 
            Sk.builtin.pyCheckArgsLen("insert", arguments.length, 2, 2, true, false);

            index = Sk.builtin.asnum$(idx);
            if(!Number.isInteger(index)){
                throw new Sk.builtin.TypeError("integer argument expected, got "+Sk.abstr.typeName(idx));
            }
            var size = (self.tail - self.head) & self.mask;
            if(self.maxlen !==undefined && size >= self.maxlen)
                throw new Sk.builtin.IndexError("deque already at its maximum size");
            if(index > size)
                index = size;
            if(index <= -size)
                index = 0;
            
            const pos = ((index >= 0 ? self.head : self.tail) + index) & self.mask;

            var cur = self.tail;

            self.tail = (self.tail + 1) & self.mask;

            while (cur !== pos) {
                const prev = (cur - 1) & self.mask;
                self.v[cur] = self.v[prev];
                cur = prev;
            }
            self.v[pos] = value;
            if (self.head === self.tail)
                self.$resize(self.v.length, self.v.length << 1);
            return Sk.builtin.none.none$;
        });
        
        mod.deque.prototype['index'] = new Sk.builtin.func(function (self, x, start, stop) { 
            Sk.builtin.pyCheckArgsLen("index", arguments.length, 1, 3, true, false);

            var size = (self.tail - self.head) & self.mask;
            if(start){
                start = Sk.builtin.asnum$(start);
                if(!Number.isInteger(start)){
                    throw new Sk.builtin.TypeError("slice indices must be integers or have an __index__ method");
                }
            }else{
                var start = 0;
            }
            if(stop){
                stop = Sk.builtin.asnum$(stop);
                if(!Number.isInteger(stop)){
                    throw new Sk.builtin.TypeError("slice indices must be integers or have an __index__ method");
                }
            }else{
                var stop = size;
            }

            var head = self.head;
            var mask = self.mask;
            var list = self.v;

            const offset = start >= 0 ? start : start < -size ? 0 : size + start;
            stop = stop >= 0 ? stop : stop < -size ? 0 : size + stop;
            for (var i = offset; i < stop; i++) {
                if (list[(head + i) & mask] === x)
                    return i;
            }
            throw new Sk.builtin.ValueError(Sk.ffi.remapToJs(x) + " is not in deque");
        });

        mod.deque.prototype['__delitem__'] = new Sk.builtin.func(function (self, idx) {
            var size = (self.tail - self.head) & self.mask;
            index = Sk.builtin.asnum$(idx);
            if(!Number.isInteger(index)){
                throw new Sk.builtin.TypeError("'"+Sk.abstr.typeName(idx)+"' object cannot be interpreted as an integer");
            }

            if ((index | 0) !== index || index >= size || index < -size) {
                throw new Sk.builtin.IndexError('deque index out of range');
            }

            const pos = ((index >= 0 ? self.head : self.tail) + index) & self.mask;
            var cur = pos;
            // Shift items backward 1 to erase position.
            while (cur !== self.tail) {
                const next = (cur + 1) & self.mask;
                self.v[cur] = self.v[next];
                cur = next;
            }
            // Decrease tail position by 1.
            self.tail = (self.tail - 1) & self.mask;
            if (size < self.mask >>> 1)
                self.$resize(size, self.v.length >>> 1);
            return Sk.builtin.none.none$;
        });    
        
        // del deque[index]
        mod.deque.prototype.mp$del_subscript = function(idx){
            mod.deque.prototype['__delitem__'].func_code(this, idx);
        }
        
        mod.deque.prototype['count'] = new Sk.builtin.func(function (self, x) { 
            Sk.builtin.pyCheckArgsLen("count", arguments.length, 1, 1, true, false);
            var head = self.head;
            var size = (self.tail - self.head) & self.mask;
            var mask = self.mask;
            var list = self.v;
            var count = 0;
            const offset = 0;
            for (var i = 0; i < size; i++) {
                if (list[(head + i) & mask] == x)
                    count++;
            }
            return new Sk.builtin.int_(count);
        });
        
        mod.deque.prototype['pop'] = new Sk.builtin.func(function (self) { 
            Sk.builtin.pyCheckArgsLen("pop", arguments.length, 0, 0, true, false);
            if (self.head === self.tail)
                throw new Sk.builtin.IndexError('pop from an empty deque');
            self.tail = (self.tail - 1) & self.mask;
            const value = self.v[self.tail];
            self.v[self.tail] = undefined;
            var size = (self.tail - self.head) & self.mask;
            if (size < self.mask >>> 1)
                self.$resize(size, self.v.length >>> 1);
            return value;
        });
        
        mod.deque.prototype['popleft'] = new Sk.builtin.func(function (self) { 
            Sk.builtin.pyCheckArgsLen("popleft", arguments.length, 0, 0, true, false);
            if (self.head === self.tail)
                throw new Sk.builtin.IndexError('pop from an empty deque');
            const value = self.v[self.head];
            self.v[self.head] = undefined;
            self.head = (self.head + 1) & self.mask;
            var size = (self.tail - self.head) & self.mask;
            if (size < self.mask >>> 1)
                self.$resize(size, self.v.length >>> 1);
            return value;
        });
        
        mod.deque.prototype.__iter__ = new Sk.builtin.func(function (self) {
            Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 0, 0, true, false);
            return new mod.deque.deque_iter_(self);
        });
         // get value via deque[index]
        mod.deque.prototype['mp$subscript'] = function (idx) { 
            index = Sk.builtin.asnum$(idx);
            if(!Number.isInteger(index)){
                throw new Sk.builtin.TypeError("sequence index must be integer, not '"+Sk.abstr.typeName(idx)+"'");
            }

            var size = (this.tail - this.head) & this.mask;
            if ((index | 0) !== index || index >= size || index < -size) {
                throw new Sk.builtin.IndexError('deque index out of range');
            }
            const pos = ((index >= 0 ? this.head : this.tail) + index) & this.mask;
            return this.v[pos];
        };
        
         // set value via deque[index] = val
        mod.deque.prototype['mp$ass_subscript'] = function (idx, val) {
            index = Sk.builtin.asnum$(idx);
            if(!Number.isInteger(index)){
                throw new Sk.builtin.TypeError("sequence index must be integer, not '"+Sk.abstr.typeName(idx)+"'");
            }

            var size = (this.tail - this.head) & this.mask;
            if ((index | 0) !== index || index >= size || index < -size) {
                throw new Sk.builtin.IndexError('deque index out of range');
            }
            const pos = ((index >= 0 ? this.head : this.tail) + index) & this.mask;
            this.v[pos] = val;
        };
        
        mod.deque.prototype['__reversed__'] = new Sk.builtin.func(function (self) { 
            var dq = new mod.deque(self);
            mod.deque.prototype['reverse'].func_code(dq);
            return new mod._deque_reverse_iterator(dq);
        });

        mod.deque.prototype.tp$setattr = function (pyName, value) {
            if(!(Sk.ffi.remapToJs(pyName) in this['$d'])){
                throw new Sk.builtin.AttributeError("'collections.deque' object has no attribute '"+Sk.ffi.remapToJs(pyName)+"'");
            }
            throw new Sk.builtin.AttributeError("attribute '"+Sk.ffi.remapToJs(pyName)+"' of 'collections.deque' objects is not writable");
        };

        mod.deque.__class__ = mod.deque;

        mod.deque.deque_iter_ = function (dq) {
            if (!(this instanceof mod.deque.deque_iter_)) {
                return new mod.deque.deque_iter_(dq);
            }
            this.$index = 0;
            this.dq = dq.v;
            this.sq$length = (dq.tail - dq.head) & dq.mask;
            this.tp$iter = () => this;

            this.$head = dq.head;
            this.$tail = dq.tail;
            this.$mask = dq.mask;

            var pos;
            this.tp$iternext = function () {
                if (this.$index >= this.sq$length) {
                    return undefined;
                }

                pos = ((this.$index >= 0 ? this.$head : this.$tail) + this.$index) & this.$mask;
                this.$index++;
                return this.dq[pos];
            };
            this.$r = function () {
                return new Sk.builtin.str("_collections._deque_iterator");
            };
            return this;
        };

        Sk.abstr.setUpInheritance("_collections._deque_iterator", mod.deque.deque_iter_, Sk.builtin.object);

        mod.deque.deque_iter_.prototype.__class__ = mod.deque.deque__iter_;

        mod.deque.deque_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
            return self;
        });

        mod.deque.deque_iter_.prototype.next$ = function (self) {
            var ret = self.tp$iternext();
            if (ret === undefined) {
                throw new Sk.builtin.StopIteration();
            }
            return ret;
        };

        mod.deque.prototype.tp$iter = function () {
            return new mod.deque.deque_iter_(this);
        };

        mod.deque.prototype['remove'] = new Sk.builtin.func(function (self, value) { 
            Sk.builtin.pyCheckArgsLen("remove", arguments.length, 1, 1, true, false);
            // Remove the first occurrence of value. If not found, raises a ValueError.
            var index = mod.deque.prototype['index'].func_code(self, value);
            const pos = (self.head + index) & self.mask;
            var cur = pos;

            while (cur !== self.tail) {
                const next = (cur + 1) & self.mask;
                self.v[cur] = self.v[next];
                cur = next;
            }

            self.tail = (self.tail - 1) & self.mask;
            var size = (self.tail - self.head) & self.mask;
            if (size < self.mask >>> 1)
                self.$resize(size, self.v.length >>> 1);
        });

        mod.deque.prototype['__add__'] = new Sk.builtin.func(function (self, dqe) { 
            // check type
            if(Sk.abstr.typeName(dqe) != 'collections.deque'){
                throw new Sk.builtin.TypeError('can only concatenate deque (not "'+Sk.abstr.typeName(dqe)+'") to deque');
            }
            var new_deque = mod.deque(self, self.maxlen);
            for (var iter = dqe.tp$iter(), k = iter.tp$iternext();
                k !== undefined;
                k = iter.tp$iternext()) {
                new_deque.$push(k);
            }
            return new_deque;
        });
        
        // deque += iterable
        mod.deque.prototype['__iadd__'] = new Sk.builtin.func(function (self, iterable) { 
            // check type
            if(!Sk.builtin.checkIterable(iterable)){
                throw new Sk.builtin.TypeError("'"+Sk.abstr.typeName(iterable)+"' object is not iterable");
            }
            for (it = Sk.abstr.iter(iterable), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                self.$push(i);
            }
            return self;
        });
        
        // n * deque and deque * n for seqtype object
        mod.deque.prototype['sq$repeat'] = function (num) { 
            var ret;
            n = Sk.builtin.asnum$(num);
            if(!Number.isInteger(n)){
                throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(num) + "'");
            }            
            if(n > Number.MAX_SAFE_INTEGER){
                throw new Sk.builtin.OverflowError("Python int too large to convert to ssize_t");
            }
            ret = [];
            var size = (this.tail - this.head) & this.mask;            

            var pos;
            for (i = 0; i < n; ++i) {
                for (j = 0; j < size; ++j) {
                    pos = (this.head + j) & this.mask;
                    ret.push(this.v[pos]);
                }
            }

            if(this.maxlen !==undefined)
                return new mod.deque(Sk.builtin.list(ret), Sk.builtin.int_(this.maxlen)); 

            return new mod.deque(Sk.builtin.list(ret));
        };

        
        mod.deque.prototype['reverse'] = new Sk.builtin.func(function (self) { 
            Sk.builtin.pyCheckArgsLen("reverse", arguments.length, 0, 0, true, false);
            var head = self.head,tail = self.tail,mask = self.mask;
            var size = (self.tail - self.head) & self.mask;
            for (var i = 0; i < ~~(size / 2); i++) {
                const a = (tail - i - 1) & mask;
                const b = (head + i) & mask;
                const temp = self.v[a];
                self.v[a] = self.v[b];
                self.v[b] = temp;
            }
            return Sk.builtin.none.none$;
        });
        
        mod.deque.prototype['rotate'] = new Sk.builtin.func(function (self, num=Sk.builtin.int_(1)) { 
            Sk.builtin.pyCheckArgsLen("rotate", arguments.length, 0, 1, true, false);
            n = Sk.builtin.asnum$(num);
            if(!Number.isInteger(n)){
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(num) + "' object cannot be interpreted as an integer");
            }
            if(n > Number.MAX_SAFE_INTEGER){
                throw new Sk.builtin.OverflowError("Python int too large to convert to ssize_t");
            }

            var head = self.head;
            var tail = self.tail;

            if (n === 0 || head === tail)
                return self;
            self.head = (head - n) & self.mask;
            self.tail = (tail - n) & self.mask;
            if (n > 0) {
                for (var i = 1; i <= n; i++) {
                    const a = (head - i) & self.mask;
                    const b = (tail - i) & self.mask;
                    self.v[a] = self.v[b];
                    self.v[b] = undefined;
                }
            }
            else {
                for (let i = 0; i > n; i--) {
                    const a = (tail - i) & self.mask;
                    const b = (head - i) & self.mask;
                    self.v[a] = self.v[b];
                    self.v[b] = undefined;
                }
            }
            return Sk.builtin.none.none$;
        });

        // for len(deque) function        
        mod.deque.prototype.sq$length = function () {
            return (this.tail - this.head) & this.mask;
        };
        
        mod.deque.prototype.sq$contains = function (item) {
            var it, i;

            for (it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                if (Sk.misceval.richCompareBool(i, item, "Eq")) {
                    return true;
                }
            }
            return false;
        };

        mod.deque.prototype.__contains__ = new Sk.builtin.func(function(self, item) {
            Sk.builtin.pyCheckArgsLen("__contains__", arguments.length-1, 1, 1);
            return new Sk.builtin.bool(self.sq$contains(item));
        });

        mod.deque.prototype["$r"] = function () {
            // represetation: deque(['a','b','c'][,maxlen=n])
            var ret = [];
            var size = (this.tail - this.head) & this.mask;
            for(var i = 0;i < size; i++){
                if(this.v[(this.head + i) & this.mask])
                    if(this.v[(this.head + i) & this.mask] == this)
                        ret.push('[...]');
                    else
                        ret.push(Sk.misceval.objectRepr(this.v[(this.head + i) & this.mask]).v)
            }
            if(this.maxlen !== undefined)
                return new Sk.builtin.str("deque([" + ret.filter(Boolean).join(", ") + "], maxlen="+this.maxlen+")");
            return new Sk.builtin.str("deque([" + ret.filter(Boolean).join(", ") + "])");
        };
        
        // for repr(deque)
        mod.deque.prototype.__repr__ = new Sk.builtin.func(function (self) {
            Sk.builtin.pyCheckArgsLen("__repr__", arguments.length, 0, 0, false, true);
            return mod.deque.prototype["$r"].call(self);
        });

        mod.deque.prototype.tp$richcompare = function (w, op) {
            var k;
            var i;
            var wl;
            var vl;
            var v;
            if (this === w && Sk.misceval.opAllowsEquality(op)) {
                return true;
            }

            // w not a deque
            if (!w.__class__ || w.__class__ != mod.deque) {
                // shortcuts for eq/not
                if (op === "Eq") {
                    return false;
                }
                if (op === "NotEq") {
                    return true;
                }

                return false;
            }
            var wd = w;
            v = this.v;
            w = w.v;
            vl = (this.tail - this.head) & this.mask;
            wl = (wd.tail - wd.head) & wd.mask;

            for (i = 0; i < vl && i < wl; ++i) {
                k = Sk.misceval.richCompareBool(v[(this.head + i) & this.mask], w[(wd.head + i) & wd.mask], "Eq");
                if (!k) {
                    break;
                }
            }

            if (i >= vl || i >= wl) {
                // no more items to compare, compare sizes
                switch (op) {
                    case "Lt":
                        return vl < wl;
                    case "LtE":
                        return vl <= wl;
                    case "Eq":
                        return vl === wl;
                    case "NotEq":
                        return vl !== wl;
                    case "Gt":
                        return vl > wl;
                    case "GtE":
                        return vl >= wl;
                    default:
                        Sk.asserts.fail();
                }
            }

            // we have an item that's different
            // shortcuts for eq/not
            if (op === "Eq") {
                return false;
            }
            if (op === "NotEq") {
                return true;
            }

            // or, compare the differing element using the proper operator
            return Sk.misceval.richCompareBool(v[(this.head + i) & this.mask], w[(wd.head + i) & wd.mask], op);
        };

        mod._deque_reverse_iterator = function(value){
            this.v = value;
        };

        Sk.abstr.setUpInheritance("_collections._deque_reverse_iterator", mod._deque_reverse_iterator, Sk.builtin.seqtype);

        mod._deque_reverse_iterator._deque_reverse_iterator_iter_ = function (dq) {
            if (!(this instanceof mod._deque_reverse_iterator._deque_reverse_iterator_iter_)) {
                return new mod._deque_reverse_iterator._deque_reverse_iterator_iter_(dq);
            }
            this.$index = 0;
            this.dq = dq.v.v;
            this.sq$length = this.dq.length;
            this.tp$iter = () => this;
            var pos;
            this.tp$iternext = function () {
                if (this.$index >= this.sq$length) {
                    return undefined;
                }
                pos = ((this.$index >= 0 ? dq.v.head : dq.v.tail) + this.$index) & dq.v.mask;
                this.$index++;
                return this.dq[pos];
            };
            this.$r = function () {
                return new Sk.builtin.str("_collections._deque_reverse_iterator_iter_");
            };
            return this;
        };
        
        mod._deque_reverse_iterator.prototype['tp$iter'] = function(){
            return new mod._deque_reverse_iterator._deque_reverse_iterator_iter_(this);
        }

        Sk.abstr.setUpInheritance("_deque_reverse_iterator_iterator", mod._deque_reverse_iterator._deque_reverse_iterator_iter_, Sk.builtin.object);

        mod._deque_reverse_iterator._deque_reverse_iterator_iter_.prototype.__class__ = mod._deque_reverse_iterator._deque_reverse_iterator_iter_;

        mod._deque_reverse_iterator._deque_reverse_iterator_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
            return self;
        });

        mod._deque_reverse_iterator._deque_reverse_iterator_iter_.prototype.next$ = function (self) {
            var ret = self.tp$iternext();
            if (ret === undefined) {
                throw new Sk.builtin.StopIteration();
            }
            return ret;
        };

        mod._deque_reverse_iterator.prototype['$r'] = function(){
            return Sk.builtin.str('<_collections._deque_reverse_iterator object>');
        }
        // deque end     

        // namedtuple
        mod.namedtuples = {};

        var Skinherits = function (childCtor, parentCtor) {
            /** @constructor */
            function tempCtor() {}
            tempCtor.prototype = parentCtor.prototype;
            childCtor.superClass_ = parentCtor.prototype;
            childCtor.prototype = new tempCtor();
            /** @override */
            childCtor.prototype.constructor = childCtor;
        };

        var _namedtuple = function (name, fields, rename, defaults, module) {
            if (Sk.ffi.remapToJs(Sk.misceval.callsimArray(keywds.$d["iskeyword"], [name]))) {
                throw new Sk.builtin.ValueError("Type names and field names cannot be a keyword: '" + name.v + "'");
            }

            const nm = name.$jsstr();
            // regex tests for name and fields
            const startsw = new RegExp(/^[0-9].*/);
            const startsw2 = new RegExp(/^[0-9_].*/);
            const alnum = new RegExp(/^\w*$/);
            if (startsw.test(nm) || !alnum.test(nm) || !nm) {
                throw new Sk.builtin.ValueError("Type names and field names must be valid identifiers: '" + nm + "'");
            }

            let flds;
            // fields could be a string or an iterable of strings
            if (!Sk.builtin.checkIterable(fields)) {
                throw new Sk.builtin.TypeError(
                    "'" + Sk.abstr.typeName(fields) + "' object is not iterable"
                );
            }
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
            rename = Sk.misceval.isTrue(Sk.builtin.bool(rename));
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
                if (!Sk.builtin.checkIterable(defaults)) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(defaults) + "' object is not iterable");
                }
                defaults = Sk.abstr.iter(defaults);
                for (let i = defaults.tp$iternext(); i !== undefined; i = defaults.tp$iternext()) {
                    dflts.push(i);
                }
            }
            if (dflts.length > flds.length) {
                throw new Sk.builtin.TypeError("Got more default values than field names");
            }

            // Constructor for namedtuple
            var cons = function nametuple_constructor(...args) {
                Sk.builtin.pyCheckArgsLen("__new__", arguments.length, flds.length, flds.length);
                if (!(this instanceof mod.namedtuples[nm])) {
                    return new mod.namedtuples[nm](...args);
                }
                this.__class__ = mod.namedtuples[nm];
                this.v = args;
                // return this;
            };
            cons.co_name = new Sk.builtin.str("__new__");
            cons.co_varnames = flds;
            cons.$defaults = dflts;

            // __new__
            const _new = function (cls, ...args) {
                Sk.builtin.pyCheckArgsLen("__new__", arguments.length, flds.length + 1, flds.length + 1);
                Sk.builtin.pyCheckType("___new___(X): X", "type object", Sk.builtin.checkClass(cls));
                
                if (Sk.builtin.issubclass(cls, Sk.builtin.tuple)) {
                    let o;
                    try {
                        o = new cls(...args);
                    } catch (e) {
                        if (e instanceof Sk.builtin.TypeError) {
                            o = new cls(args);
                        }
                    }
                    return o;
                } else {
                    throw new Sk.builtin.TypeError(cls.tp$name + " is not a subtype of tuple");
                }
            };
            _new.co_name = new Sk.builtin.str("__new__");
            _new.co_varnames = ["cls"].concat(flds);
            _new.$defaults = dflts;

            __new__ = function (func) {
                Sk.builtin.func.call(this, func);
                this["$d"].__defaults__ = Sk.builtin.checkNone(defaults) ? defaults : new Sk.builtin.tuple(dflts);
            };
            __new__.prototype = Object.create(Sk.builtin.func.prototype);
            cons.__new__ = new __new__(_new);

            // create the field properties
            for (let i = 0; i < flds.length; i++) {
                fld = Sk.fixReserved(flds[i]);
                cons[fld] = {};
                cons[fld].tp$descr_set = function () {
                    throw new Sk.builtin.AttributeError("can't set attribute");
                };
                cons[fld].tp$descr_get = function (self) {
                    return self.v[i];
                };
                cons[fld]["$r"] = function () {
                    return new Sk.builtin.str("<property object>");
                };
            }

            // make it a class
            mod.namedtuples[nm] = cons;
            cons.__class__ = cons;

            Skinherits(cons, Sk.builtin.tuple);
            cons.prototype.tp$name = nm;
            cons.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj(nm, mod.namedtuples[nm]);

            // repr
            cons.prototype["$r"] = function () {
                let ret;
                let i;
                let bits;
                if (this.v.length === 0) {
                    return new Sk.builtin.str(nm + "()");
                }
                bits = [];
                for (i = 0; i < this.v.length; ++i) {
                    bits[i] = flds[i] + "=" + Sk.misceval.objectRepr(this.v[i]).v;
                }
                ret = bits.join(", ");
                cls = Sk.abstr.typeName(this);
                return new Sk.builtin.str(cls + "(" + ret + ")");
            };

            // _fields
            cons.prototype._fields = cons._fields = new Sk.builtin.tuple(flds.map(x => Sk.builtin.str(x)));

            // _make
            const _make = function (iterable) {
                Sk.builtin.pyCheckArgsLen("_make", arguments.length, 1, 1);
                if (!Sk.builtin.checkIterable(iterable)) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
                }
                iterable = Sk.abstr.iter(iterable);
                values = [];
                for (let i = iterable.tp$iternext(); i !== undefined; i = iterable.tp$iternext()) {
                    values.push(i);
                }
                return cons(...values);
            };
            _make.co_name = new Sk.builtin.str("_make");

            cons._make = new Sk.builtin.func(_make);

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

            cons.prototype._asdict = new Sk.builtin.func(_asdict);

            // _flds_defaults
            const dflts_dict = [];
            for (let i = flds.length - dflts.length; i < flds.length; i++) {
                dflts_dict.push(Sk.builtin.str(flds[i]));
                dflts_dict.push(dflts[i - (flds.length - dflts.length)]);
            }
            cons.prototype._field_defaults = cons._field_defaults = new Sk.builtin.dict(dflts_dict);

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
                return cons(...args);
            };

            _replace.co_name = new Sk.builtin.str("replace");
            _replace.co_kwargs = 1;
            _replace.co_varnames = ["_self"];
            cons.prototype._replace = new Sk.builtin.func(_replace);

            if (Sk.builtin.checkNone(module)) {
                module = Sk.globals["__name__"];
            }

            cons.__module__ = module;
            cons.__doc__ = new Sk.builtin.str(nm + "(" + flds.join(", ") + ")");
            cons.__slots__ = new Sk.builtin.tuple([]);

            cons.prototype.__getnewargs__ = new Sk.builtin.func(function (self) {
                return new Sk.builtin.tuple(self.v);
            });

            const mro = new Sk.builtin.tuple([cons, Sk.builtin.tuple, Sk.builtin.object]);
            cons.tp$mro = mro;
            // expose methods in the class __dict__
            let attrs = [
                "_make", cons._make,
                "__bases__", new Sk.builtin.tuple([Sk.builtin.tuple]),
                "__mro__", new Sk.builtin.tuple([cons, Sk.builtin.tuple, Sk.builtin.object]),
                "__new__", cons.__new__,
                "__name__", name,
            ];

            attrs = attrs.map(x => typeof x === "string" ? Sk.builtin.str(x) : x);
            cons.$d = new Sk.builtin.dict(attrs);

            return cons;
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
