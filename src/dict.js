Dict$ = function(L)
{
    this.size = 0;

    for (var i = 0; i < L.length; i += 2)
    {
        this.__setitem__(L[i], L[i+1]);
    }

    return this;
};

Dict$.prototype.key$ = function(value)
{
    return hash(value);
};

Dict$.prototype.clear = function() { throw "todo; dict.clear"; };
Dict$.prototype.copy = function() { throw "todo; dict.copy"; };
Dict$.prototype.fromkeys = function() { throw "todo; dict.fromkeys"; };
Dict$.prototype.get = function() { throw "todo; dict.get"; };

Dict$.prototype.has_key = function(key)
{
	return this.hasOwnProperty(this.key$(key));
};

Dict$.prototype.items = function() { throw "todo; dict.items"; };
Dict$.prototype.iteritems = function() { throw "todo; dict.iteritems"; };
Dict$.prototype.iterkeys = function() { throw "todo; dict.iterkeys"; };
Dict$.prototype.itervalues = function() { throw "todo; dict.itervalues"; };
Dict$.prototype.keys = function() { throw "todo; dict.keys"; };
Dict$.prototype.pop = function() { throw "todo; dict.pop"; };
Dict$.prototype.popitem = function() { throw "todo; dict.popitem"; };
Dict$.prototype.setdefault = function() { throw "todo; dict.setdefault"; };
Dict$.prototype.update = function() { throw "todo; dict.update"; };
Dict$.prototype.values = function() { throw "todo; dict.values"; };

Dict$.prototype.__getitem__ = function(key)
{
	var entry = this[this.key$(key)];
	return typeof entry === 'undefined' ? undefined : entry.rhs;
};

Dict$.prototype.__setitem__ = function(key, value)
{
	var k = this.key$(key);

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

Dict$.prototype.__delitem__ = function(key)
{
	var k = this.key$(key);

	if (this.hasOwnProperty(k))
    {
        this.size -= 1;
		delete this[k];
	}

	return this;
};

Dict$.prototype.__repr__ = function()
{
    var ret = [];
    for (var iter = this.__iter__(), k = iter.next();
            k !== undefined;
            k = iter.next())
    {
        var v = this.__getitem__(k);
        ret.push(repr(k).v + ": " + repr(v).v);
    }
    return new Str$("{" + ret.join(", ") + "}");
};
Dict$.prototype.__class__ = new Type$('dict', [sk$TypeObject], {});

Dict$.prototype.__iter__ = function()
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
