/**
 * @constructor
 */
Sk.builtin.method = function(func, self)
{
    this.im_func = func;
    this.im_self = self;
    //print("constructing method", this.im_func.tp$name, this.im_self.tp$name);
};

Sk.builtin.method.prototype.tp$call = function()
{
    goog.asserts.assert(this.im_self, "should just be a function, not a method since there's no self?");
    var args = Array.prototype.slice.call(arguments, 0);
    goog.asserts.assert(this.im_func instanceof Sk.builtin.func);
    //print("calling method");
    args.unshift(this.im_self);
    // note: functions expect globals to be their 'this'. see compile.js and function.js also
    return this.im_func.func_code.apply(this.im_func.func_globals, args);
};
