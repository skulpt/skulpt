var $builtinmodule = function(name)
{
    goog.require('goog.dom');

    var mod = {};

    mod.getElement = new Sk.builtin.func(function(element)
            {
                // todo; need to wrap this with something. Element is a
                // browser builtin type though, not a Closure one.
            
                // todo; assuming str right now (rather than
                // string|Element)
                return goog.dom.getElement(element.v);
            });


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

    return mod;
};
