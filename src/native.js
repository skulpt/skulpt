/*jshint loopfunc: true */

/*
 * Object to facilitate building native Javascript functions that
 * behave similarly to Python functions.
 *
 * Use:
 * foo = Sk.nativejs.func(function foo(...) {...});
 */


Sk.nativejs = {
    FN_ARGS            : /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
    FN_ARG_SPLIT       : /,/,
    FN_ARG             : /^\s*(_?)(\S+?)\1\s*$/,
    STRIP_COMMENTS     : /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
    formalParameterList: function (fn) {
        var r;
        var a;
        var arg;
        var fnText, argDecl;
        var args = [];
        fnText = fn.toString().replace(this.STRIP_COMMENTS, "");
        argDecl = fnText.match(this.FN_ARGS);

        r = argDecl[1].split(this.FN_ARG_SPLIT);
        for (a in r) {
            arg = r[a];
            arg.replace(this.FN_ARG, function (all, underscore, name) {
                args.push(name);
            });
        }
        return args;
    },
    func               : function (code) {
        code["co_name"] = new Sk.builtin.str(code.name);
        code["co_varnames"] = Sk.nativejs.formalParameterList(code);
        return new Sk.builtin.func(code);
    },
    func_nokw          : function (code) {
        code["co_name"] = new Sk.builtin.str(code.name);
        code["co_varnames"] = Sk.nativejs.formalParameterList(code);
        code["no_kw"] = true;
        return new Sk.builtin.func(code);
    }
};
goog.exportSymbol("Sk.nativejs.func", Sk.nativejs.func);
goog.exportSymbol("Sk.nativejs.func_nokw", Sk.nativejs.func_nokw);
