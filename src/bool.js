Sk.builtin.bool = function(x)
{
    Sk.builtin.pyCheckArgs("bool", arguments, 1);
    if (Sk.misceval.isTrue(x))
    {
	return Sk.builtin.bool.true$;
    }
    else
    {
	return Sk.builtin.bool.false$;
    }
};

Sk.builtin.bool.prototype.tp$name = "bool";
Sk.builtin.bool.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('bool', Sk.builtin.bool);

Sk.builtin.bool.prototype['$r'] = function()
{
    if (this.v)
	return new Sk.builtin.str('True');
    return new Sk.builtin.str('False');
}

Sk.builtin.bool.true$ = Object.create(Sk.builtin.bool.prototype, {v: {value: true, enumerable: true}});
Sk.builtin.bool.false$ = Object.create(Sk.builtin.bool.prototype, {v: {value: false, enumerable: true}});

goog.exportSymbol("Sk.builtin.bool", Sk.builtin.bool);