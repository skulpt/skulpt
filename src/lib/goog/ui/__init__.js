var $builtinmodule = function(name)
{
    goog.require('goog.ui.Component');

    var mod = {};

    mod.Component = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self, opt_domHelper)
                    {
                        self.v = new goog.ui.Component(Sk.ffi.unwrapo(opt_domHelper));
                    });

                $loc.render = new Sk.builtin.func(function(self, opt_parentElement)
                    {
                        self.v.render(Sk.ffi.unwrapo(opt_parentElement));
                    });
            },
            'Component', []);
            // todo; derives from EventTarget

    return mod;
};
