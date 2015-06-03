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
    var j;
    var i;
    var numvarnames;
    var varnames;
    var kwlen;
    var kwargsarr;
    var expectskw;
    var name;

    goog.asserts.assert(this.im_self, "should just be a function, not a method since there's no self?");
    goog.asserts.assert(this.im_func instanceof Sk.builtin.func);

    // TODO: This function has an awful lot in common with Sk.builtin.func.prototype.tp$call.
    // Should we just unshift this.im_self onto the front of args and call that function
    // instead?

    //print("calling method");
    // todo; modification OK?
    args.unshift(this.im_self);

    expectskw = this.im_func.func_code["co_kwargs"];
    kwargsarr = [];

    if (this.im_func.func_code["no_kw"]) {
        name = (this.im_func.func_code["co_name"] && this.im_func.func_code["co_name"].v) || "<native JS>";
        throw new Sk.builtin.TypeError(name + "() takes no keyword arguments");
    }

    if (kw) {
        // bind the kw args
        kwlen = kw.length;
        varnames = this.im_func.func_code["co_varnames"];
        numvarnames = varnames && varnames.length;
        for (i = 0; i < kwlen; i += 2) {
            // todo; make this a dict mapping name to offset
            for (j = 0; j < numvarnames; ++j) {
                if (kw[i] === varnames[j]) {
                    break;
                }
            }
            if (varnames && j !== numvarnames) {
                args[j] = kw[i + 1];
            } else if (expectskw) {
                // build kwargs dict
                kwargsarr.push(new Sk.builtin.str(kw[i]));
                kwargsarr.push(kw[i + 1]);
            } else {
                name = (this.im_func.func_code && this.im_func.func_code["co_name"] && this.im_func.func_code["co_name"].v) || "<native JS>";
                throw new Sk.builtin.TypeError(name + "() got an unexpected keyword argument '" + kw[i] + "'");
            }
        }
    }
    if (expectskw) {
        args.unshift(kwargsarr);
    }

    // note: functions expect globals to be their "this". see compile.js and function.js also
    return this.im_func.func_code.apply(this.im_func.func_globals, args);
};

Sk.builtin.method.prototype["$r"] = function () {
    var name = (this.im_func.func_code && this.im_func.func_code["co_name"] && this.im_func.func_code["co_name"].v) || "<native JS>";
    return new Sk.builtin.str("<bound method " + this.im_self.ob$type.tp$name + "." + name +
        " of " + this.im_self["$r"]().v + ">");
};
