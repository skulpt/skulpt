var ImageMod; // the single identifier needed in the global scope

if (! ImageMod) {
    ImageMod = { };
    ImageMod.canvasLib = [];
}


var $builtinmodule = function(name) {
    var mod = {};

    var image = function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self,imageId) {
            self.image = document.getElementById(imageId.v);
            self.width = self.image.width;
            self.height = self.image.height;
            self.canvas = document.createElement("canvas");
            self.canvas.height = self.height;
            self.canvas.width = self.width;
            self.ctx = self.canvas.getContext("2d");
            self.ctx.drawImage(self.image,0,0)
            self.imagedata = self.ctx.getImageData(0,0,self.width,self.height);
        });

        $loc.getPixel = new Sk.builtin.func(function(self,x,y) {
            var index = (y*4)*self.width+(x*4);
            var red = self.imagedata.data[index]
            var green = self.imagedata.data[index+1]
            var blue = self.imagedata.data[index+2]
            return Sk.misceval.callsim(mod.Pixel,red,green,blue);
        });

        $loc.setPixel = new Sk.builtin.func(function(self, x, y, pix) {
            var index = (y*4)*self.width+(x*4);
            self.imagedata.data[index] = Sk.misceval.callsim(pix.getRed,pix);
            self.imagedata.data[index+1] = Sk.misceval.callsim(pix.getGreen,pix);
            self.imagedata.data[index+2] = Sk.misceval.callsim(pix.getBlue,pix);
        });

        $loc.getHeight = new Sk.builtin.func(function(self) {
            return self.image.height;
        });

        $loc.getWidth = new Sk.builtin.func(function(self,titlestring) {
            return self.image.width;
        });

        $loc.draw = new Sk.builtin.func(function(self,win) {
            var can = Sk.misceval.callsim(win.getWin,win);
            var ctx = can.getContext("2d");
            ctx.putImageData(self.imagedata,0,0,0,0,self.imagedata.width,self.imagedata.height);
        });

    }

    mod.Image = Sk.misceval.buildClass(mod, image, 'Image', []);


    var pixel = function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self,r,g,b) {
            self.red = r;
            self.green = g;
            self.blue = b;
        });

        $loc.getRed = new Sk.builtin.func(function(self) {
           return self.red;
        });

        $loc.getGreen = new Sk.builtin.func(function(self) {
           return self.green;
        });

        $loc.getBlue = new Sk.builtin.func(function(self) {
           return self.blue;
        });

        $loc.setRed = new Sk.builtin.func(function(self,r) {
           self.red = r;
        });

        $loc.setGreen = new Sk.builtin.func(function(self,g) {
           self.green = g;
        });

        $loc.setBlue = new Sk.builtin.func(function(self,b) {
           self.blue = b;
        });


    }
    mod.Pixel = Sk.misceval.buildClass(mod, pixel, 'Pixel', []);



    var screen = function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function(self) {
            var currentCanvas = ImageMod.canvasLib[Sk.canvas];
            if (currentCanvas === undefined) {
                self.theScreen = document.getElementById(Sk.canvas);
                ImageMod.canvasLib[Sk.canvas] = self.theScreen;
            } else {
                self.theScreen = currentCanvas;
                self.theScreen.height = self.theScreen.height;
            }
        });

        $loc.getWin = new Sk.builtin.func(function(self) {
           return self.theScreen;
        });
    }

    mod.ImageWin = Sk.misceval.buildClass(mod, screen, 'ImageWin', []);

    return mod
}