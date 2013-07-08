Sk.builtin.bool = function(x)
{
    Sk.builtin.pyCheckArgs("bool", arguments, 1);
    return Sk.misceval.isTrue(x);    
}

Sk.builtin.bool.prototype.tp$name = "bool";
Sk.builtin.bool.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('bool', Sk.builtin.bool);
