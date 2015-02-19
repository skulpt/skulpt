var $builtinmodule = function (name) {
    var mod = {};
    var CLASS__FEATURE = "_Feature";
    var flags = {
        nested_scopes: 0x0010,
        generators: 0,
        division: 0x2000,
        absolute_import: 0x4000,
        with_statement: 0x8000,
        print_function: 0x10000,
        unicode_literals: 0x20000
    };

    mod.CO_NESTED                   = new Sk.builtin.str("nested_scopes");    // 0x0010;   nested_scopes
    mod.CO_GENERATOR_ALLOWED        = new Sk.builtin.str("generators");       // 0;        generators (obsolete, was 0x1000)
    mod.CO_FUTURE_DIVISION          = new Sk.builtin.str("division");         // 0x2000;   division
    mod.CO_FUTURE_ABSOLUTE_IMPORT   = new Sk.builtin.str("absolute_import");  // 0x4000;   perform absolute imports by default
    mod.CO_FUTURE_WITH_STATEMENT    = new Sk.builtin.str("with_statement");   // 0x8000;   with statement
    mod.CO_FUTURE_PRINT_FUNCTION    = new Sk.builtin.str("print_function");   // 0x10000;  print function
    mod.CO_FUTURE_UNICODE_LITERALS  = new Sk.builtin.str("unicode_literals"); // 0x20000;  unicode string literals

    var _feature_f = function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, optionalRelease, mandatoryRelease, compiler_flag) {
            Sk.builtin.pyCheckArgs("__init__", arguments, 3, 3, false, true);
            self.tp$name = CLASS__FEATURE; // set class name
            self.v = {};
            self.v["optional"] = optionalRelease;
            self.v["mandatory"] = mandatoryRelease;
            self.v["compiler_flag"] = compiler_flag;

            // this sets the internal
            //var cf_js = Sk.ffi.remapToJs(compiler_flag);
            //Sk[cf_js] = true;
            // disabled, we need to set the flags before each individual compile!
        });

        $loc.getOptionalRelease = new Sk.builtin.func(function(self){
            return self.v["optional"];
        });

        $loc.getMandatoryRelease = new Sk.builtin.func(function(self){
            return self.v["mandatory"];
        });

        $loc.__repr__ = new Sk.builtin.func(function(self){
          return new Sk.builtin.str(CLASS__FEATURE + Sk.ffi.remapToJs(Sk.builtin.repr(new Sk.builtin.tuple([self.v["optional"], self.v["mandatory"], new Sk.builtin.int_(flags[self.v["compiler_flag"].v])]))));
        });
    };

    mod[CLASS__FEATURE] = Sk.misceval.buildClass(mod, _feature_f, CLASS__FEATURE, []);

    mod.print_function = Sk.misceval.callsim(mod[CLASS__FEATURE], new Sk.builtin.tuple([new Sk.builtin.int_(2),new Sk.builtin.int_(6),new Sk.builtin.int_(0),new Sk.builtin.str("alpha"), new Sk.builtin.int_(2)]),  new Sk.builtin.tuple([new Sk.builtin.int_(3),new Sk.builtin.int_(0),new Sk.builtin.int_(0),new Sk.builtin.str("alpha"), new Sk.builtin.int_(0)]), mod.CO_FUTURE_PRINT_FUNCTION);

    return mod;
};