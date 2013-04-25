var $builtinmodule = function(name)
{
    var mod = {};

    // We need this to store a reference to the actual processing object which is not created
    // until the run function is called.  Even then the processing object is passed by the
    // processing-js sytem as a parameter to the sketchProc function.  Why not set it to None here
    //

    // See:  http://processingjs.org/reference/

    mod.processing = null

    mod.width = null
    mod.height = null
    mod.mouseX = null
    mod.mouseY = null
    mod.frameCount = null
    mod.p = null

    mod.CENTER = Sk.builtin.assk$(3, Sk.builtin.nmber.int$);
    mod.RADIUS = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.CORNERS = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.CORNER = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);
    mod.RGB = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.HSB = Sk.builtin.assk$(3, Sk.builtin.nmber.int$);
    mod.CMYK = Sk.builtin.assk$(5, Sk.builtin.nmber.int$);

// 2D - Primitives
    mod.line = new Sk.builtin.func(function(x1, y1, x2, y2) {
        mod.processing.line(x1.v, y1.v, x2.v, y2.v)
    });
    
    mod.ellipse = new Sk.builtin.func(function(x,y,r1,r2) {
        mod.processing.ellipse(x.v,y.v,r1.v,r2.v)
        
    });

    mod.point = new Sk.builtin.func(function(x1,y1) {
        mod.processing.point(x1.v,y1.v)
    });
        
    mod.arc = new Sk.builtin.func(function(x, y, width, height, start, stop) {
        mod.processing.arc(x.v, y.v, width.v, height.v, start.v, stop.v)
    });

    mod.quad = new Sk.builtin.func(function(x1, y1, x2, y2, x3, y3, x4, y4) {
        mod.processing.quad(x1.v, y1.v, x2.v, y2.v, x3.v, y3.v, x4.v, y4.v)
    });
            
    mod.rect = new Sk.builtin.func(function(x, y, width, height, radius) {
        if (typeof(radius) == 'undefined') {
            var rad = 0
        } else {
            var rad = radius.v
        }
        mod.processing.rect(x.v, y.v, width.v, height.v, rad)
    });
    
    mod.triangle = new Sk.builtin.func(function(x1, y1, x2, y2, x3, y3) {
            mod.processing.triangle(x1.v, y1.v, x2.v, y2.v, x3.v, y3.v)
        });
            

    // 3D Primitives

    // todo:  box, sphere, sphereDetail

    // Color
    mod.background = new Sk.builtin.func(function(r,g,b) {

        if (typeof(g) == 'undefined') {
            g = r.v
        } else 
            g = g.v
        if (typeof(b) == 'undefined') {
            b = r.v
        } else
            b = b.v

        mod.processing.background(r.v,g,b)
        
    });

    mod.fill = new Sk.builtin.func(function(r,g,b) {

        if (typeof(g) == 'undefined') {
            g = r.v
        } else 
            g = g.v
        if (typeof(b) == 'undefined') {
            b = r.v
        } else
            b = b.v
    
        mod.processing.fill(r.v,g,b)
        
    });


    mod.stroke = new Sk.builtin.func(function(r,g,b) {

        if (typeof(g) == 'undefined') {
            g = r.v
        } else 
            g = g.v
        if (typeof(b) == 'undefined') {
            b = r.v
        } else
            b = b.v

        mod.processing.stroke(r.v,g,b)
        
    });


    //todo:  colorMode, noFill, noStroke, 

    // Environment

    mod.loop = new Sk.builtin.func(function() {
            if (mod.processing === null) {
                throw new Sk.builtin.Exception("Loop should be called in setup")
            }
            mod.processing.loop()
        });
            
    mod.noLoop = new Sk.builtin.func(function() {
        if (mod.processing === null) {
            throw new Sk.builtin.Exception("noLoop should be called in setup")
        }
        mod.processing.noLoop()
    });
    
    mod.frameRate = new Sk.builtin.func(function(fr) {
        mod.processing.frameRate(fr.v)
        
    });

    mod.size = new Sk.builtin.func(function(h,w) {
        mod.processing.size(h.v,w.v)
        
    });

    mod.exitp = new Sk.builtin.func(function(h,w) {
        mod.processing.exit()
    });


    mod.mouseX = new Sk.builtin.func(function() {
        return Sk.builtin.assk$(mod.processing.mouseX, Sk.builtin.nmber.int$);
        
    });

    mod.mouseY = new Sk.builtin.func(function() {
        return Sk.builtin.assk$(mod.processing.mouseY, Sk.builtin.nmber.int$);
        
    });

    // Attributes
    mod.rectMode = new Sk.builtin.func(function(mode) {
        mod.processing.rectMode(mode.v)
    });

    mod.strokeWeight = new Sk.builtin.func(function(wt) {
        mod.processing.strokeWeight(wt.v)
        
    });

    // todo:  ellipseMode, noSmooth, smooth, strokeCap, strokeJoin, strokeWeight


    // Transforms

    mod.rotate = new Sk.builtin.func(function(rads) {
        // rotation in radians
        mod.processing.rotate(rads.v)
        
    });

    mod.scale = new Sk.builtin.func(function(sx, sy, sz) {
        if (typeof(sy) == 'undefined') {
            sy = 1.0
        } else 
            sy = sy.v
        if (typeof(sz) == 'undefined') {
            sz = 1.0
        } else
            sz = sz.v
        mod.processing.scale(sx.v, sy, sz)
    });

    mod.translate = new Sk.builtin.func(function(sx, sy, sz) {
        if (typeof(sy) == 'undefined') {
            sy = 1.0
        } else 
            sy = sy.v
        if (typeof(sz) == 'undefined') {
            sz = 1.0
        } else
            sz = sz.v
        mod.processing.translate(sx.v, sy, sz)
    });

    // todo:  applyMatrix, popMatrix, printMatrix??, pushMatrix, resetMatrix, rotate{X,Y,Z}
    
    mod.run = new Sk.builtin.func(function() {
        function sketchProc(processing) {
            mod.processing = processing

            mod.frameCount = processing.frameCount

            
            //Sk.globals['mouse'] = mod['mouse']

            processing.setup = function() {
                Sk.misceval.callsim(Sk.globals['setup'])
            }

            processing.mouseMoved = function() {
                Sk.misceval.callsim(mod.mouse['setMouse'],mod.mouse,processing.mouseX,processing.mouseY)
                Sk.misceval.callsim(Sk.globals['mouseMoved'])
            }
            
            processing.draw = function() {
                mod.frameCount = processing.frameCount  // does not work -- try the pyprocessing method
                Sk.misceval.callsim(Sk.globals['draw'])
            }
            
            //todo:  mouseClicked(), mouseDragged(), mouseMoved(), mouseOut(), mouseOver(), mousePressed(), mouseReleased()
            
            //todo:  keyPressed(), keyReleased(), keyTyped()
        }
        
        var canvas = document.getElementById(Sk.canvas)
        mod.p = new Processing(canvas, sketchProc)

        
    });

    var mouseClass = function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self) {
            self.x = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);
            self.y = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);

        });

        $loc.setMouse = new Sk.builtin.func(function(self,x,y) {
           self.x = Sk.builtin.assk$(x, Sk.builtin.nmber.int$);
           self.y = Sk.builtin.assk$(y, Sk.builtin.nmber.int$);
        });

        $loc.__getattr__ = new Sk.builtin.func(function(self,key) {
            if (key == 'x') 
                return self.x;
            else if (key == 'y') 
                return self.y
            else if (key == 'px')
                return mod.processing.pmouseX;
            else if (key == 'py')
                return mod.processing.pmouseY;
            else if (key == 'pressed')
                return mod.processing.mousePressed;
            else if (key == 'button')
                return mod.processing.mouseButton
        });


    }


    mod.Mouse = Sk.misceval.buildClass(mod, mouseClass, 'Mouse', []);

    mod.mouse = Sk.misceval.callsim(mod.Mouse)

    var keyboardClass = function($gbl, $loc) {

        $loc.__getattr__ = new Sk.builtin.func(function(self,key) {
            if (key == 'key') 
                return mod.processing.key
            else if (key == 'keyCode') 
                return mod.processing.keyCode
            else if (key == 'keyPressed')
                return mod.processing.keyPressed
        });


    }

// Create a class for mouse, frame, etc.. see globs.py in pyprocessing
// todo... find a way to stop this thing with a button.  the following
//         is proof of concept for how to do it.
//                if (processing.frameCount > 300) {
//                    console.log('time to stop')
//                    mod.p.exit();
//                }


    return mod;
}
