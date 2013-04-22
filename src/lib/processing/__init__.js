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
    
    mod.strokeWeight = new Sk.builtin.func(function(wt) {
        mod.processing.strokeWeight(wt.v)
        
    });

    mod.ellipse = new Sk.builtin.func(function(x,y,r1,r2) {
        mod.processing.ellipse(x.v,y.v,r1.v,r2.v)
        
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

    mod.mouseX = new Sk.builtin.func(function() {
        return Sk.builtin.assk$(mod.processing.mouseX, Sk.builtin.nmber.int$);
        
    });

    mod.mouseY = new Sk.builtin.func(function() {
        return Sk.builtin.assk$(mod.processing.mouseY, Sk.builtin.nmber.int$);
        
    });

    
    mod.run = new Sk.builtin.func(function() {
        function sketchProc(processing) {
            mod.processing = processing

            mod.frameCount = processing.frameCount
                        
            processing.setup = function() {
                Sk.misceval.callsim(Sk.globals['setup'])
            }

            processing.mouseMoved = function() {
                mod.mouseX = processing.mouseX
                mod.mouseY = processing.mouseY
                
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


// Create a class for mouse, frame, etc.. see globs.py in pyprocessing
// todo... find a way to stop this thing with a button.  the following
//         is proof of concept for how to do it.
//                if (processing.frameCount > 300) {
//                    console.log('time to stop')
//                    mod.p.exit();
//                }


    return mod;
}
