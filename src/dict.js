(function() {

/**
 * @constructor
 * @param {Array.<Object>} L
 */
var $ = Sk.builtin.dict = function dict(L)
{
    if (!(this instanceof $)) return new $(L);

    this.size = 0;

    for (var i = 0; i < L.length; i += 2)
    {
        this.__setitem__(L[i], L[i+1]);
    }

    this.__class__ = this.nativeclass$ = $;

    return this;
};

var kf = Sk.builtin.hash;

Sk.builtin.dict.dict_subscript_ = function(key)
{
    var entry = this[kf(key)];
    // todo; does this need to go through mp$ma_lookup
    return entry === undefined ? undefined : entry.rhs;
};


Sk.builtin.dict.prototype.mp$subscript = Sk.builtin.dict.dict_subscript_;

Sk.builtin.dict.prototype.tp$iter = function()
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

$.prototype.__setitem__ = function(key, value)
{
    //print("__setitem__", key.v, value);
    var k = kf(key);

    if (this.hasOwnProperty(k))
    {
        this[k].rhs = value;
    }
    else
    {
        var entry = { lhs : key, rhs : value };
        this[k] = entry;

        this.size += 1;
    }

    return this;
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

$.prototype.__repr__ = function()
{
    var ret = [];
    for (var iter = this.__iter__(), k = iter.next();
            k !== undefined;
            k = iter.next())
    {
        var v = this.__getitem__(k);
        if (v === undefined)
        {
            //print(k, "had undefined v");
            v = null;
        }
        ret.push(Sk.builtin.repr(k).v + ": " + Sk.builtin.repr(v).v);
    }
    return new Sk.builtin.str("{" + ret.join(", ") + "}");
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

}());
