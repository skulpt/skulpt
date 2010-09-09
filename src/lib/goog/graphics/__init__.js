var $builtinmodule = function(name)
{
    goog.require('goog.graphics');

    var mod = {};

    mod.createGraphics = new Sk.builtin.func(function(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper)
            {
                return new Sk.ffi.stdwrap(mod.AbstractGraphics, goog.graphics.createGraphics(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper));
            });

    mod.createSimpleGraphics = new Sk.builtin.func(function(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper)
            {
                return new Sk.ffi.stdwrap(mod.AbstractGraphics, goog.graphics.createSimpleGraphics(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper));
            });


    goog.require('goog.graphics.AbstractGraphics');

    // todo; shortcut for this
    var goog_ui_Component = Sk.importModule('goog.ui').tp$getattr('ui').tp$getattr('Component');
    mod.AbstractGraphics = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.getCanvasElement = new Sk.builtin.func(function(self)
                        {
                            // todo; wrap
                            return self.v.getCanvasElement();
                        });

                $loc.drawRect = new Sk.builtin.func(function(self, x, y, width, height, stroke, fill, opt_group)
                        {
                            // todo; wrap with RectElement
                            return self.v.drawRect(x, y, width, height, Sk.ffi.unwrapn(stroke), Sk.ffi.unwrapn(fill), Sk.ffi.unwrapo(opt_group));
                        });

                $loc.drawImage = new Sk.builtin.func(function(self, x, y, width, height, src, opt_group)
                        {
                            // todo; wrap with ImageElement
                            return self.v.drawImage(x, y, width, height, src.v, Sk.ffi.unwrapo(opt_group));
                        });

                $loc.drawCircle = new Sk.builtin.func(function(self, cx, cy, r, stroke, fill, opt_group)
                        {
                            // todo; wrap with EllipseElement
                            return self.v.drawCircle(cx, cy, r, Sk.ffi.unwrapn(stroke), Sk.ffi.unwrapn(fill), Sk.ffi.unwrapo(opt_group));
                        });

                $loc.drawEllipse = new Sk.builtin.func(function(self, cx, cy, rx, ry, stroke, fill, opt_group)
                        {
                            // todo; wrap with EllipseElement
                            return self.v.drawEllipse(cx, cy, rx, ry, Sk.ffi.unwrapn(stroke), Sk.ffi.unwrapn(fill), Sk.ffi.unwrapo(opt_group));
                        });

                $loc.drawPath = new Sk.builtin.func(function(self, path, stroke, fill, opt_group)
                        {
                            // todo; wrap with PathElement
                            return self.v.drawPath(path.v, Sk.ffi.unwrapn(stroke), Sk.ffi.unwrapn(fill), Sk.ffi.unwrapo(opt_group));
                        });

                $loc.__repr__ = new Sk.builtin.func(function(self)
                        {
                            return new Sk.builtin.str("<AbstractGraphics instance>");
                        });
            },
            'AbstractGraphics', [ goog_ui_Component ]);

    goog.require('goog.graphics.SolidFill');
    mod.SolidFill = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self, color, opt_opacity)
                    {
                        self.v = new goog.graphics.SolidFill(color.v, opt_opacity);
                    });

                $loc.getColor = new Sk.builtin.func(function(self)
                    {
                        return new Sk.builtin.str(self.v.getColor());
                    });

                $loc.getOpacity = new Sk.builtin.func(function(self)
                    {
                        return self.v.getOpacity();
                    });
            },
            'SolidFill', []);

    goog.require('goog.graphics.Stroke');
    mod.Stroke = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self, width, color)
                    {
                        self.v = new goog.graphics.Stroke(width, color.v);
                    });

                $loc.getWidth = new Sk.builtin.func(function(self)
                    {
                        return Sk.ffi.basicwrap(self.v.getWidth());
                    });

                $loc.getColor = new Sk.builtin.func(function(self)
                    {
                        return self.v.getColor();
                    });
            },
            'Stroke', []);

    goog.require('goog.graphics.Path');
    mod.Path = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self)
                    {
                        self.v = new goog.graphics.Path();
                    });

                $loc.moveTo = new Sk.builtin.func(function(self, x, y)
                    {
                        self.v.moveTo(x, y);
                        return self;
                    });

                $loc.lineTo = new Sk.builtin.func(function(self, x, y)
                    {
                        self.v.lineTo(x, y);
                        return self;
                    });

                $loc.close = new Sk.builtin.func(function(self)
                    {
                        self.v.close();
                        return self;
                    });
            },
            'Path', []);

    return mod;
};
