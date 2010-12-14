/**
 * @constructor
 *
 * @param {Function} code the javascript implementation of this function
 * @param {Object=} globals the globals where this function was defined.
 * Can be undefined (which will be stored as null) for builtins. (is
 * that ok?)
 * @param {Object=} closure dict of free variables
 * @param {Object=} closure2 another dict of free variables that will be
 * merged into 'closure'. there's 2 to simplify generated code (one is $free,
 * the other is $cell)
 *
 * closure is the cell variables from the parent scope that we need to close
 * over. closure2 is the free variables in the parent scope that we also might
 * need to access.
 *
 * NOTE: co_varnames and co_name are defined by compiled code only, so we have
 * to access them via dict-style lookup for closure.
 *
 */
Sk.builtin.func = function(code, globals, closure, closure2)
{
    this.func_code = code;
    this.func_globals = globals || null;
    if (closure2 !== undefined)
    {
        // todo; confirm that modification here can't cause problems
        for (var k in closure2)
            closure[k] = closure2[k];
    }
    this.func_closure = closure;
    return this;
};
goog.exportSymbol("Sk.builtin.func", Sk.builtin.func);


Sk.builtin.func.prototype.tp$name = "function";
Sk.builtin.func.prototype.tp$descr_get = function(obj, objtype)
{
    goog.asserts.assert(obj !== undefined && objtype !== undefined)
    if (obj == null) return this;
    return new Sk.builtin.method(this, obj);
};
Sk.builtin.func.prototype.tp$call = function(args, kw)
{
    // note: functions expect 'this' to be globals to avoid having to
    // slice/unshift onto the main args
    if (this.func_closure)
    {
        // todo; OK to modify?
        args.push(this.func_closure);
    }

    var expectskw = this.func_code['co_kwargs'];
    var kwargsarr = [];

    if (kw)
    {
        // bind the kw args
        var kwlen = kw.length;
        var varnames = this.func_code['co_varnames'];
        var numvarnames = varnames && varnames.length;
        for (var i = 0; i < kwlen; i += 2)
        {
            // todo; make this a dict mapping name to offset
            for (var j = 0; j < numvarnames; ++j)
            {
                if (kw[i] === varnames[j])
                    break;
            }
            if (varnames && j !== numvarnames)
            {
                args[j] = kw[i+1];
            }
            else if (this.func_code['co_kwargs'])
            {
                // build kwargs dict
                kwargsarr.push(new Sk.builtin.str(kw[i]));
                kwargsarr.push(kw[i + 1]);
            }
        }
    }
    if (expectskw)
    {
        args.unshift(kwargsarr);
    }

    //print(JSON.stringify(args, null, 2));

    return this.func_code.apply(this.func_globals, args);
};

//todo; investigate why the other doesn't work
//Sk.builtin.type.makeIntoTypeObj('function', Sk.builtin.func);
Sk.builtin.func.prototype.ob$type = Sk.builtin.type.makeTypeObj('function', new Sk.builtin.func(null, null));

Sk.builtin.func.prototype['$r'] = function()
{
    var name = (this.func_code && this.func_code['co_name'] && this.func_code['co_name'].v) || '<native JS>';
    return new Sk.builtin.str("<function " + name + ">");
};
