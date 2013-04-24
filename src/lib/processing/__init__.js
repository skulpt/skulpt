var $builtinmodule = function(name)
{
    var mod = {};

    // We need this to store a reference to the actual processing object which is not created
    // until the run function is called.  Even then the processing object is passed by the
    // processing-js sytem as a parameter to the sketchProc function.  Why not set it to None here
    //
    mod.processing = null

    mod.width = null
    mod.height = null
    mod.mouseX = null
    mod.mouseY = null
    mod.frameCount = null
    mod.p = null
    mod.mouse = Sk.builtin.assk$(12345, Sk.builtin.nmber.int$);
    mod.CENTER = Sk.builtin.assk$(3, Sk.builtin.nmber.int$);
    mod.RADIUS = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.CORNERS = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.CORNER = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);


    mod.strokeWeight = new Sk.builtin.func(function(wt) {
        mod.processing.strokeWeight(wt.v)
        
    });

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
            
    mod.background = new Sk.builtin.func(function(r,g,b) {
        mod.processing.background(r.v)
        
    });

    mod.stroke = new Sk.builtin.func(function(r,g,b) {
        mod.processing.stroke(r.v)
        
    });

    mod.fill = new Sk.builtin.func(function(r,g,b) {
    
        mod.processing.fill(r.v,g.v,b.v)
        
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

    mod.rectMode = new Sk.builtin.func(function(mode) {
            mod.processing.rectMode(mode.v)
        });
            
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
        });


    }


    mod.Mouse = Sk.misceval.buildClass(mod, mouseClass, 'Mouse', []);

    mod.mouse = Sk.misceval.callsim(mod.Mouse)

    console.log('mouse = ' + mod.mouse)

// Create a class for mouse, frame, etc.. see globs.py in pyprocessing
// todo... find a way to stop this thing with a button.  the following
//         is proof of concept for how to do it.
//                if (processing.frameCount > 300) {
//                    console.log('time to stop')
//                    mod.p.exit();
//                }


    return mod;
}
