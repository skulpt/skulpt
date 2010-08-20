/**
 * @constructor
 */
Sk.builtin.generator = function(code, globals, args, closure, closure2)
{
    if (code === undefined) return; // ctor hack
    this.func_code = code;
    this.func_globals = globals || null;
    this.gi$running = false;
    this.gi$resumeat = 0;
    this.gi$locals = {};
    if (args.length > 0)
    {
        // store arguments into locals because they have to be maintained
        // too. 'fast' var lookups are locals in generator functions.
        for (var i = 0; i < code.co_varnames.length; ++i)
            this.gi$locals[code.co_varnames[i]] = args[i];
    }
    if (closure2 !== undefined)
    {
        // todo; confirm that modification here can't cause problems
        for (var k in closure2)
            closure[k] = closure2[k];
    }
    //print(JSON.stringify(closure));
    this.func_closure = closure;
    return this;
};

Sk.builtin.generator.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

Sk.builtin.generator.prototype.tp$iter = function()
{
    return this;
};

Sk.builtin.generator.prototype.tp$iternext = function()
{
    this.gi$running = true;

    // note: functions expect 'this' to be globals to avoid having to
    // slice/unshift onto the main args
    var args = [ this ];
    if (this.func_closure)
        args.push(this.func_closure);
    var ret = this.func_code.apply(this.func_globals, args); 
    //print("ret", JSON.stringify(ret));
    this.gi$running = false;
    goog.asserts.assert(ret !== undefined);
    if (ret !== null)
    {
        // returns a pair: resume target and yielded value
        this.gi$resumeat = ret[0];
        ret = ret[1];
    }
    else
    {
        // todo; StopIteration
        return undefined;
    }
    //print("returning:", JSON.stringify(ret));
    return ret;
};

Sk.builtin.generator.prototype.next = new Sk.builtin.func(function(self)
{
    return self.tp$iternext();
});

Sk.builtin.generator.prototype.ob$type = Sk.builtin.type.makeTypeObj('generator', new Sk.builtin.generator());

Sk.builtin.generator.prototype.tp$repr = function()
{
    return new Sk.builtin.str("<generator object " + this.func_code.co_name.v + ">");
};
