/**
 * @constructor
 *
 * co_varnames and co_name come from generated code, must access as dict.
 */
Sk.builtin.method = function(func, self)
{
    this.im_func = func;
    this.im_self = self;
    //print("constructing method", this.im_func.tp$name, this.im_self.tp$name);
};
goog.exportSymbol("Sk.builtin.method", Sk.builtin.method);

Sk.builtin.method.prototype.tp$call = function(args, kw)
{
    goog.asserts.assert(this.im_self, "should just be a function, not a method since there's no self?");
    goog.asserts.assert(this.im_func instanceof Sk.builtin.func);

    //print("calling method");
    // todo; modification OK?
    args.unshift(this.im_self);

    if (kw)
    {
        // bind the kw args
        var kwlen = kw.length;
        for (var i = 0; i < kwlen; i += 2)
        {
            // todo; make this a dict mapping name to offset
            var varnames = this.im_func.func_code['co_varnames'];
            var numvarnames = varnames &&  varnames.length;
            for (var j = 0; j < numvarnames; ++j)
            {
                if (kw[i] === varnames[j])
                    break;
            }
            args[j] = kw[i+1];
        }
    }

    // note: functions expect globals to be their 'this'. see compile.js and function.js also
    return this.im_func.func_code.apply(this.im_func.func_globals, args);
};

Sk.builtin.method.prototype['$r'] = function()
{
    var name = (this.im_func.func_code && this.im_func.func_code['co_name'] && this.im_func.func_code['co_name'].v) || '<native JS>';
    return new Sk.builtin.str("<bound method " + this.im_self.ob$type.tp$name + "." + name
            + " of " + this.im_self['$r']().v + ">");
};
