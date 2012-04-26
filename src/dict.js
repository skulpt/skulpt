/**
 * @constructor
 * @param {Array.<Object>} L
 */
Sk.builtin.dict = function dict(L)
{
    if (!(this instanceof Sk.builtin.dict)) return new Sk.builtin.dict(L);

    this.size = 0;

    for (var i = 0; i < L.length; i += 2)
    {
        this.mp$ass_subscript(L[i], L[i+1]);
    }

    this.__class__ = Sk.builtin.dict;

    return this;
};

Sk.builtin.dict.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('dict', Sk.builtin.dict);

var kf = Sk.builtin.hash;

Sk.builtin.dict.prototype.mp$subscript = function(key)
{
    var entry = this[kf(key)];
    // todo; does this need to go through mp$ma_lookup
    return entry === undefined ? undefined : entry.rhs;
};
Sk.builtin.dict.prototype.mp$ass_subscript = function(key, w)
{
    var k = kf(key);
    // if (this[k] !== undefined)
    // {
    //     this.size -=1;
    //     delete this[k];
    //     return;
    // }
    // only increment if it's not already used as a key
    if ( !(k in this) ) {
        this.size += 1;
    }
    this[k] = { lhs: key, rhs: w };
};

Sk.builtin.dict.prototype.tp$iter = function()
{
    var allkeys = [];
    for (var k in this)
    {
        if (this.hasOwnProperty(k))
        {
            var i = this[k];
            if (i && i.lhs !== undefined) // skip internal stuff. todo; merge pyobj and this
            {
                allkeys.push(k);
            }
        }
    }
    //print(allkeys);

    var ret =
    {
        tp$iter: function() { return ret; },
        $obj: this,
        $index: 0,
        $keys: allkeys,
        tp$iternext: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$keys.length) return undefined;
            return ret.$obj[ret.$keys[ret.$index++]].lhs;
        }
    };
    return ret;
};

Sk.builtin.dict.prototype['$r'] = function()
{
    var ret = [];
    for (var iter = this.tp$iter(), k = iter.tp$iternext();
            k !== undefined;
            k = iter.tp$iternext())
    {
        var v = this.mp$subscript(k);
        if (v === undefined)
        {
            //print(k, "had undefined v");
            v = null;
        }
        ret.push(Sk.misceval.objectRepr(k).v + ": " + Sk.misceval.objectRepr(v).v);
    }
    return new Sk.builtin.str("{" + ret.join(", ") + "}");
};

Sk.builtin.dict.prototype.mp$length = function() { return this.size; };

Sk.builtin.dict.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

Sk.builtin.dict.prototype['get'] = new Sk.builtin.func(function(self, k, d)
{
    if (d === undefined) {
        //d = new Sk.builtin.NoneObj();
        d = null;
    }
    var ret = self.mp$subscript(k);
    if (ret !== undefined) return ret;
    return d;
});

Sk.builtin.dict.prototype['items'] = new Sk.builtin.func(function(self)
{
    var ret = [];

    for (var iter = self.tp$iter(), k = iter.tp$iternext();
            k !== undefined;
            k = iter.tp$iternext())
    {
        var v = self.mp$subscript(k);
        if (v === undefined)
        {
            //print(k, "had undefined v");
            v = null;
        }
        ret.push(new Sk.builtin.tuple([k, v]));
    }
    return new Sk.builtin.list(ret);
});

Sk.builtin.dict.prototype['keys'] = new Sk.builtin.func(function(self)
{
    var ret = [];

    for (var iter = self.tp$iter(), k = iter.tp$iternext();
            k !== undefined;
            k = iter.tp$iternext())
    {
        ret.push(k);
    }
    return new Sk.builtin.list(ret);
});

Sk.builtin.dict.prototype['values'] = new Sk.builtin.func(function(self)
{
    var ret = [];

    for (var iter = self.tp$iter(), k = iter.tp$iternext();
            k !== undefined;
            k = iter.tp$iternext())
    {
        var v = self.mp$subscript(k);
        if (v === undefined)
        {
            v = null;
        }
        ret.push(v);
    }
    return new Sk.builtin.list(ret);
});


goog.exportSymbol("Sk.builtin.dict", Sk.builtin.dict);

/*

$.prototype.clear = function() { throw "todo; dict.clear"; };
$.prototype.copy = function() { throw "todo; dict.copy"; };
$.prototype.fromkeys = function() { throw "todo; dict.fromkeys"; };
$.prototype.get = function() { throw "todo; dict.get"; };

$.prototype.has_key = function(key)
{
	return this.hasOwnProperty(kf(key));
};

$.prototype.items = function() { throw "todo; dict.items"; };
$.prototype.iteritems = function() { throw "todo; dict.iteritems"; };
$.prototype.iterkeys = function() { throw "todo; dict.iterkeys"; };
$.prototype.itervalues = function() { throw "todo; dict.itervalues"; };
$.prototype.keys = function() { throw "todo; dict.keys"; };
$.prototype.pop = function() { throw "todo; dict.pop"; };
$.prototype.popitem = function() { throw "todo; dict.popitem"; };
$.prototype.setdefault = function() { throw "todo; dict.setdefault"; };
$.prototype.update = function() { throw "todo; dict.update"; };
$.prototype.values = function() { throw "todo; dict.values"; };

$.prototype.__getitem__ = function(key)
{
    var entry = this[kf(key)];
    return typeof entry === 'undefined' ? undefined : entry.rhs;
};

$.prototype.__delitem__ = function(key)
{
    var k = kf(key);

    if (this.hasOwnProperty(k))
    {
        this.size -= 1;
        delete this[k];
    }

    return this;
};

$.prototype.__class__ = new Sk.builtin.type('dict', [Sk.types.object], {});

$.prototype.__iter__ = function()
{
    var allkeys = [];
    for (var k in this)
    {
        if (this.hasOwnProperty(k))
        {
            var i = this[k];
            if (i && i.hasOwnProperty('lhs')) // skip internal stuff. todo; merge pyobj and this
            {
                allkeys.push(k);
            }
        }
    }
    //print(allkeys);

    var ret =
    {
        __iter__: function() { return ret; },
        $obj: this,
        $index: 0,
        $keys: allkeys,
        next: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$keys.length) return undefined;
            return ret.$obj[ret.$keys[ret.$index++]].lhs;
        }
    };
    return ret;
};
*/
