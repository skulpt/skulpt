/**
 * @constructor
 * @param {Function} code javascript code object for the function
 * @param {Object} globals where this function was defined
 * @param {Object} args arguments to the original call (stored into locals for
 * the generator to reenter)
 * @param {Object=} closure dict of free variables
 * @param {Object=} closure2 another dict of free variables that will be
 * merged into 'closure'. there's 2 to simplify generated code (one is $free,
 * the other is $cell)
 *
 * co_varnames and co_name come from generated code, must access as dict.
 */
Sk.builtin.generator = function (code, globals, args, closure, closure2) {
    var k;
    var i;
    if (!code) {
        return;
    } // ctor hack

    if (!(this instanceof Sk.builtin.generator)) {
        return new Sk.builtin.generator(code, globals, args, closure, closure2);
    }


    this.func_code = code;
    this.func_globals = globals || null;
    this["gi$running"] = false;
    this["gi$resumeat"] = 0;
    this["gi$sentvalue"] = undefined;
    this["gi$locals"] = {};
    this["gi$cells"] = {};
    if (args.length > 0) {
        // store arguments into locals because they have to be maintained
        // too. 'fast' var lookups are locals in generator functions.
        for (i = 0; i < code["co_varnames"].length; ++i) {
            this["gi$locals"][code["co_varnames"][i]] = args[i];
        }
    }
    if (closure2 !== undefined) {
        // todo; confirm that modification here can't cause problems
        for (k in closure2) {
            closure[k] = closure2[k];
        }
    }
    //print(JSON.stringify(closure));
    this.func_closure = closure;
    return this;
};
goog.exportSymbol("Sk.builtin.generator", Sk.builtin.generator);

Sk.abstr.setUpInheritance("generator", Sk.builtin.generator, Sk.builtin.object);


Sk.builtin.generator.prototype.tp$iter = function () {
    return this;
};

Sk.builtin.generator.prototype.tp$iternext = function (canSuspend, yielded) {
    var ret;
    var args;
    var self = this;
    this["gi$running"] = true;
    if (yielded === undefined) {
        yielded = null;
    }
    this["gi$sentvalue"] = yielded;

    // note: functions expect 'this' to be globals to avoid having to
    // slice/unshift onto the main args
    args = [ this ];
    if (this.func_closure) {
        args.push(this.func_closure);
    }
    ret = this.func_code.apply(this.func_globals, args);
    return (function finishIteration(ret) {
        if (ret instanceof Sk.misceval.Suspension) {
            if (canSuspend) {
                return new Sk.misceval.Suspension(finishIteration, ret);
            } else {
                ret = Sk.misceval.retryOptionalSuspensionOrThrow(ret);
            }
        }
        //print("ret", JSON.stringify(ret));
        self["gi$running"] = false;
        goog.asserts.assert(ret !== undefined);
        if (ret !== Sk.builtin.none.none$) {
            // returns a pair: resume target and yielded value
            self["gi$resumeat"] = ret[0];
            ret = ret[1];
        } else {
            // todo; StopIteration
            return undefined;
        }
        //print("returning:", JSON.stringify(ret));
        return ret;
    })(ret);
};

Sk.builtin.generator.prototype["next"] = new Sk.builtin.func(function (self) {
    return self.tp$iternext(true);
});

Sk.builtin.generator.prototype["$r"] = function () {
    return new Sk.builtin.str("<generator object " + this.func_code["co_name"].v + ">");
};

Sk.builtin.generator.prototype["send"] = new Sk.builtin.func(function (self, value) {
    return self.tp$iternext(true, value);
});

/**
 * Creates a generator with the specified next function and additional
 * instance data. Useful in Javascript-implemented modules to implement
 * the __iter__ method.
 */
Sk.builtin.makeGenerator = function (next, data) {
    var key;
    var gen = new Sk.builtin.generator(null, null, null);
    gen.tp$iternext = next;

    for (key in data) {
        if (data.hasOwnProperty(key)) {
            gen[key] = data[key];
        }
    }

    return gen;
};
goog.exportSymbol("Sk.builtin.makeGenerator", Sk.builtin.makeGenerator);
