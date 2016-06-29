/**
 * @constructor
 *
 * co_varnames and co_name come from generated code, must access as dict.
 */
Sk.builtin.method = function (func, self) {
    this.im_func = func;
    this.im_self = self;
    //print("constructing method", this.im_func.tp$name, this.im_self.tp$name);
};
goog.exportSymbol("Sk.builtin.method", Sk.builtin.method);

Sk.builtin.method.prototype.tp$call = function (args, kw) {
    goog.asserts.assert(this.im_self, "should just be a function, not a method since there's no self?");
    goog.asserts.assert(this.im_func instanceof Sk.builtin.func);

    // 'args' and 'kw' get mucked around with heavily in applyOrSuspend();
    // changing it here is OK.
    args.unshift(this.im_self);

    // A method call is just a call to this.im_func with 'self' on the beginning of the args.
    // Do the necessary.

    return this.im_func.tp$call(args, kw);
};

Sk.builtin.method.prototype.tp$name = "instancemethod";

Sk.builtin.method.prototype["$r"] = function () {
    var name = (this.im_func.func_code && this.im_func.func_code["co_name"] && this.im_func.func_code["co_name"].v) || "<native JS>";
    return new Sk.builtin.str("<bound method " + this.im_self.ob$type.tp$name + "." + name +
        " of " + this.im_self["$r"]().v + ">");
};
