var $builtinmodule = function (name) {
    var imageClass;
    var colorClass;
    var screenClass;
    var environmentClass;
    var keyboardClass;
    var mouseClass;
    var mod = {};
    var imList = [];
    var looping = true;

    // We need this to store a reference to the actual processing object which is not created
    // until the run function is called.  Even then the processing object is passed by the
    // processing-js sytem as a parameter to the sketchProc function.  Why not set it to None here
    //

    // See:  http://processingjs.org/reference/

    mod.processing = null;
    mod.p = null;

    mod.CENTER = Sk.builtin.assk$(3, Sk.builtin.nmber.int$);
    mod.RADIUS = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.CORNERS = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.CORNER = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);
    mod.RGB = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.HSB = Sk.builtin.assk$(3, Sk.builtin.nmber.int$);
    mod.CMYK = Sk.builtin.assk$(5, Sk.builtin.nmber.int$);
    mod.MITER = new Sk.builtin.str("miter");
    mod.BEVEL = new Sk.builtin.str("bevel");
    mod.ROUND = new Sk.builtin.str("round");
    mod.SQUARE = new Sk.builtin.str("butt");
    mod.PROJECT = new Sk.builtin.str("square");

    // Renderers
    mod.P2D = 1;
    mod.JAVA2D = 1;
    mod.WEBGL = 2;
    mod.P3D = 2;
    mod.OPENGL = 2;

// 2D - Primitives
    mod.line = new Sk.builtin.func(function (x1, y1, x2, y2) {
        mod.processing.line(x1.v, y1.v, x2.v, y2.v);
    });

    mod.ellipse = new Sk.builtin.func(function (x, y, r1, r2) {
        mod.processing.ellipse(x.v, y.v, r1.v, r2.v);

    });

    mod.text = new Sk.builtin.func(function (theText, x, y) {
        mod.processing.text(theText.v, x.v, y.v);
    });

    mod.point = new Sk.builtin.func(function (x1, y1) {
        mod.processing.point(x1.v, y1.v);
    });

    mod.arc = new Sk.builtin.func(function (x, y, width, height, start, stop) {
        mod.processing.arc(x.v, y.v, width.v, height.v, start.v, stop.v);
    });

    mod.quad = new Sk.builtin.func(function (x1, y1, x2, y2, x3, y3, x4, y4) {
        mod.processing.quad(x1.v, y1.v, x2.v, y2.v, x3.v, y3.v, x4.v, y4.v);
    });

    mod.rect = new Sk.builtin.func(function (x, y, width, height, radius) {
        var rad;
        if (typeof(radius) == "undefined") {
            rad = 0;
        } else {
            rad = radius.v;
        }
        mod.processing.rect(x.v, y.v, width.v, height.v, rad);
    });

    mod.triangle = new Sk.builtin.func(function (x1, y1, x2, y2, x3, y3) {
        mod.processing.triangle(x1.v, y1.v, x2.v, y2.v, x3.v, y3.v);
    });

    mod.bezier = new Sk.builtin.func(function (x1, y1, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
        if (typeof(a7) === "undefined") {
            // bezier(x1, y1, cx1, cy1, cx2, cy2,  x2,  y2);
            mod.processing.bezier(x1.v, y1.v, a1.v, a2.v, a3.v, a4.v, a5.v, a6.v);
        } else {
            // bezier(x1, y1,  z1, cx1, cy1, cz1, cx2, cy2, cz2, x2, y2, z2);
            mod.processing.bezier(x1.v, y1.v, a1.v, a2.v, a3.v, a4.v, a5.v, a6.v, a7.v, a8.v, a9.v, a10.v);
        }
    });

    // 3D Primitives

    mod.box = new Sk.builtin.func(function(size) {
        mod.processing.box(size.v);
    });

    mod.sphere = new Sk.builtin.func(function(radius) {
        mod.processing.sphere(radius.v);
    });

    mod.sphereDetail = new Sk.builtin.func(function(res,vres) {
        if (typeof(vres) === "undefined") {
            mod.processing.sphereDetail(res.v);
        }
        else {
            mod.processing.sphereDetail(res.v, vres.v);
        }
    });

    // Color
    mod.background = new Sk.builtin.func(function (r, g, b) {

        if (typeof(g) !== "undefined") {
            g = g.v;
        }
        if (typeof(b) !== "undefined") {
            b = b.v;
        }

        mod.processing.background(r.v, g, b);

    });

    mod.fill = new Sk.builtin.func(function (r, g, b) {
        // r will be either:
        //      a number in which case the fill will be grayscale
        //      a color object
        // g, and b may be undefined.  If they hold values it will
        // be assumed that we have an r,g,b color tuple
        if (typeof(g) !== "undefined") {
            g = g.v;
        }
        if (typeof(b) !== "undefined") {
            b = b.v;
        }

        mod.processing.fill(r.v, g, b);

    });


    mod.stroke = new Sk.builtin.func(function (r, g, b) {

        if (typeof(g) !== "undefined") {
            g = g.v;
        }
        if (typeof(b) !== "undefined") {
            b = b.v;
        }

        mod.processing.stroke(r.v, g, b);

    });

    mod.noStroke = new Sk.builtin.func(function () {
        mod.processing.noStroke();
    });


    mod.colorMode = new Sk.builtin.func(function (model, maxV) {
        if (typeof(maxV) === "undefined") {
            maxV = 255;
        }
        else {
            maxV = maxV.v;
        }
        mod.processing.colorMode(model.v, maxV);
    });

    mod.noFill = new Sk.builtin.func(function () {
        mod.processing.noFill();
    });


    // Environment

    mod.loop = new Sk.builtin.func(function () {
        if (mod.processing === null) {
            throw new Sk.builtin.Exception("Loop should be called in setup");
        }
        looping = true;
        mod.processing.loop();
    });

    mod.noLoop = new Sk.builtin.func(function () {
        if (mod.processing === null) {
            throw new Sk.builtin.Exception("noLoop should be called in setup");
        }
        looping = false;
        mod.processing.noLoop();
    });

    mod.frameRate = new Sk.builtin.func(function (fr) {
        mod.processing.frameRate(fr.v);

    });

    mod.size = new Sk.builtin.func(function (h, w, mode) {
        if (typeof(mode) === "undefined") {
            mode = mod.P2D;
        }

        mod.processing.size(h.v, w.v, mode);
    });

    mod.exitp = new Sk.builtin.func(function (h, w) {
        mod.processing.exit();
    });


    mod.mouseX = new Sk.builtin.func(function () {
        return Sk.builtin.assk$(mod.processing.mouseX, Sk.builtin.nmber.int$);

    });

    mod.mouseY = new Sk.builtin.func(function () {
        return Sk.builtin.assk$(mod.processing.mouseY, Sk.builtin.nmber.int$);

    });

    // Attributes
    mod.rectMode = new Sk.builtin.func(function (mode) {
        mod.processing.rectMode(mode.v);
    });

    mod.strokeWeight = new Sk.builtin.func(function (wt) {
        mod.processing.strokeWeight(wt.v);

    });

    mod.smooth = new Sk.builtin.func(function () {
        mod.processing.smooth();
    });

    mod.noSmooth = new Sk.builtin.func(function () {
        mod.processing.noSmooth();
    });

    mod.ellipseMode = new Sk.builtin.func(function (mode) {
        mod.processing.ellipseMode(mode.v);
    });

    mod.strokeCap = new Sk.builtin.func(function (mode) {
        mod.processing.strokeCap(mode.v);
    });

    mod.strokeJoin = new Sk.builtin.func(function (mode) {
        mod.processing.strokeJoin(mode.v);
    });


    // Transforms
    mod.rotate = new Sk.builtin.func(function (rads) {
        // rotation in radians
        mod.processing.rotate(rads.v);
    });

    mod.rotateX = new Sk.builtin.func(function(rads) {
        mod.processing.rotateX(rads.v);
    });

    mod.rotateY = new Sk.builtin.func(function(rads) {
        mod.processing.rotateY(rads.v);
    });

    mod.rotateZ = new Sk.builtin.func(function(rads) {
        mod.processing.rotateZ(rads.v);
    });

    mod.scale = new Sk.builtin.func(function (sx, sy, sz) {
        if (typeof(sy) == "undefined") {
            sy = 1.0;
        } else {
            sy = sy.v;
        }
        if (typeof(sz) == "undefined") {
            sz = 1.0;
        } else {
            sz = sz.v;
        }
        mod.processing.scale(sx.v, sy, sz);
    });

    mod.translate = new Sk.builtin.func(function (sx, sy, sz) {
        if (typeof(sy) == "undefined") {
            sy = 1.0;
        } else {
            sy = sy.v;
        }
        if (typeof(sz) == "undefined") {
            sz = 1.0;
        } else {
            sz = sz.v;
        }
        mod.processing.translate(sx.v, sy, sz);
    });

    mod.popMatrix = new Sk.builtin.func(function() {
        mod.processing.popMatrix();
    });

    mod.pushMatrix = new Sk.builtin.func(function() {
        mod.processing.pushMatrix();
    });

    mod.applyMatrix = new Sk.builtin.func(function() {
        var args = Array.prototype.slice.call(arguments, 0, 16),
            i;

        for (i = 0; i < args.length; i++) {
            args[i] = typeof(args[i]) === "undefined" ? 0.0 : args[i].v;
        }

        mod.processing.applyMatrix.apply(mod.processing, args);
    });

    mod.resetMatrix = new Sk.builtin.func(function() {
        mod.processing.resetMatrix();
    });

    mod.printMatrix = new Sk.builtin.func(function() {
        return Sk.ffi.remapToPy(mod.processing.printMatrix());
    });

    //  //////////////////////////////////////////////////////////////////////
    //  Run
    // 
    //  Create the processing context and setup of calls to setup, draw etc.
    //
    //
    //  //////////////////////////////////////////////////////////////////////    
    mod.run = new Sk.builtin.func(function () {
        function sketchProc (processing) {
            mod.processing = processing;

            // processing.setup = function() {
            //     if Sk.globals["setup"]
            //         Sk.misceval.callsim(Sk.globals["setup"])
            // }


            processing.draw = function () {
                // if there are pending image loads then just use the natural looping calls to 
                // retry until all the images are loaded.  If noLoop was called in setup then make
                // sure to revert to that after all the images in hand.
                var wait = false;
                for (var i in imList) {
                    if (imList[i].width === 0) {
                        wait = true;
                    }
                }
                if (wait === true) {
                    if (looping === true) {
                        return;
                    }
                    else {
                        processing.loop();
                        return;
                    }

                } else {
                    if (looping === false) {
                        processing.noLoop();
                    }
                }

                mod.frameCount = processing.frameCount;
                if (Sk.globals["draw"]) {
                    Sk.misceval.callsim(Sk.globals["draw"]);
                }
            };

            var callBacks = ["setup", "mouseMoved", "mouseClicked", "mouseDragged", "mouseMoved", "mouseOut",
                "mouseOver", "mousePressed", "mouseReleased", "keyPressed", "keyReleased", "keyTyped"
            ];

            for (var cb in callBacks) {
                if (Sk.globals[callBacks[cb]]) {
                    processing[callBacks[cb]] = new Function("Sk.misceval.callsim(Sk.globals['" + callBacks[cb] + "']);");
                }
            }
        }

        var canvas = document.getElementById(Sk.canvas);
        window.$(canvas).show();
        window.Processing.logger = { log : function(message) {
            Sk.misceval.print_(message);
        }};
        mod.p = new window.Processing(canvas, sketchProc);


    });

    getAttrWrapper = function(getter) {
        return new Sk.builtin.func(function(self, key) {
            if (key instanceof Sk.builtin.str) {
                key = key.v;
            }
            else if (typeof key !== "string") {
                throw new Sk.builtin.TypeError("__getattribute__ expects the key to be a string");
            }

            return getter(self, key);
        });
    };

    mouseClass = function ($gbl, $loc) {

        $loc.__getattr__ = getAttrWrapper(function (self, key) {
            if (key === "x") {
                return mod.processing.mouseX;
            }
            else if (key === "y") {
                return mod.processing.mouseY;
            }
            else if (key === "px") {
                return mod.processing.pmouseX;
            }
            else if (key === "py") {
                return mod.processing.pmouseY;
            }
            else if (key === "pressed") {
                return mod.processing.mousePressed;
            }
            else if (key === "button") {
                return mod.processing.mouseButton;
            }
        });

    };


    mod.Mouse = Sk.misceval.buildClass(mod, mouseClass, "Mouse", []);

    mod.mouse = Sk.misceval.callsim(mod.Mouse);

    keyboardClass = function ($gbl, $loc) {
        $loc.__getattr__ = getAttrWrapper(function (self, key) {
            if (key === "key") {
                return new Sk.builtin.str(mod.processing.key.toString());
            }
            else if (key === "keyCode") {
                return mod.processing.keyCode;
            }
            else if (key === "keyPressed") {
                return new Sk.builtin.str(mod.processing.keyPressed);
            } // todo bool
        });

    };

    mod.Keyboard = Sk.misceval.buildClass(mod, keyboardClass, "Keyboard", []);

    mod.keyboard = Sk.misceval.callsim(mod.Keyboard);


    environmentClass = function ($gbl, $loc) {

        $loc.__getattr__ = getAttrWrapper(function (self, key) {
            if (key === "frameCount") {
                return mod.processing.frameCount;
            }
            else if (key === "frameRate") {
                return mod.processing.frameRate;
            }
            else if (key === "height") {
                return mod.processing.height;
            }
            else if (key === "width") {
                return mod.processing.width;
            }
            else if (key === "online") {
                return mod.processing.online;
            }
            else if (key === "focused") {
                return mod.processing.focused;
            }
        });

    };

    mod.Environment = Sk.misceval.buildClass(mod, environmentClass, "Environment", []);

    mod.environment = Sk.misceval.callsim(mod.Environment);

    screenClass = function ($gbl, $loc) {

        $loc.__init__ = new Sk.builtin.func(function (self) {
            self.pixels = null;
        });

        $loc.__getattr__ = getAttrWrapper(function (self, key) {
            if (key === "height") {
                return mod.processing.height;
            }
            else if (key === "width") {
                return mod.processing.width;
            }
            else if (key === "pixels") {
                if (self.pixels == null) {
                    self.pixels = new Sk.builtin.list(mod.processing.pixels.toArray());
                }
            }
            return self.pixels;
        });

    };

    mod.Screen = Sk.misceval.buildClass(mod, screenClass, "Screen", []);

    mod.screen = Sk.misceval.callsim(mod.Screen);

    mod.loadPixels = new Sk.builtin.func(function () {
        mod.processing.loadPixels();
    });


    colorClass = function ($gbl, $loc) {
        /* images are loaded async.. so its best to preload them */
        $loc.__init__ = new Sk.builtin.func(function (self, val1, val2, val3, alpha) {
            if (typeof(val2) !== "undefined") {
                val2 = val2.v;
            }
            if (typeof(val3) !== "undefined") {
                val3 = val3.v;
            }
            if (typeof(alpha) !== "undefined") {
                alpha = alpha.v;
            }
            self.v = mod.processing.color(val1.v, val2, val3, alpha);
        });

    };

    mod.color = Sk.misceval.buildClass(mod, colorClass, "color", []);

    mod.red = new Sk.builtin.func(function (clr) {
        return Sk.builtin.assk$(mod.processing.red(clr.v), Sk.builtin.nmber.int$);
    });

    mod.green = new Sk.builtin.func(function (clr) {
        return Sk.builtin.assk$(mod.processing.green(clr.v), Sk.builtin.nmber.int$);
    });

    mod.blue = new Sk.builtin.func(function (clr) {
        return Sk.builtin.assk$(mod.processing.blue(clr.v), Sk.builtin.nmber.int$);
    });

    // Image class and functions
    //
    imageClass = function ($gbl, $loc) {
        /* images are loaded async.. so its best to preload them */
        $loc.__init__ = new Sk.builtin.func(function (self, im) {
            self.v = im;
            self.width = Sk.builtin.assk$(im.width, Sk.builtin.nmber.int$);
            self.height = Sk.builtin.assk$(im.height, Sk.builtin.nmber.int$);
        });

        $loc.__getattr__ = getAttrWrapper(function (self, key) {
            if (key === "width") {
                return self.v.width;
            }
            if (key === "height") {
                return self.v.height;
            }
        });

    };

    mod.PImage = Sk.misceval.buildClass(mod, imageClass, "PImage", []);

    mod.loadImage = new Sk.builtin.func(function (imfile) {
        var i = mod.processing.loadImage(imfile.v);
        imList.push(i);
        return Sk.misceval.callsim(mod.PImage, i);
    });


    mod.image = new Sk.builtin.func(function (im, x, y) {
        if (im.v.width > 0) {
            mod.processing.image(im.v, x.v, y.v, im.v.width, im.v.height);
        }
    });

    mod.get = new Sk.builtin.func(function (x, y) {
        var clr = mod.processing.get(x.v, y.v);
        return Sk.misceval.callsim(mod.color,
            Sk.builtin.assk$(mod.processing.red(clr), Sk.builtin.nmber.int$),
            Sk.builtin.assk$(mod.processing.green(clr), Sk.builtin.nmber.int$),
            Sk.builtin.assk$(mod.processing.blue(clr), Sk.builtin.nmber.int$));
    });

    mod.set = new Sk.builtin.func(function (x, y, color) {
        mod.processing.set(x.v, y.v, color.v);
    });

// todo  -- add a color class for creating color objects.


    return mod;
};