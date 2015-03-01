var ImageMod; // the single identifier needed in the global scope

if (!ImageMod) {
    ImageMod = { };
    ImageMod.canvasLib = [];
}

//  todo create an empty image by reading image data from a blank canvas of the appropriate size

var $builtinmodule;
$builtinmodule = function (name) {
    var screen;
    var pixel;
    var eImage;
    var mod = {};
    var updateCanvasAndSuspend;
    var initializeImage;

    var image = function ($gbl, $loc) {
        initializeImage = function(self) {
            self.width = self.image.width;
            self.height = self.image.height;
            self.delay = 0;
            self.updateCount = 0;
            self.updateInterval = 1;
            self.lastx = 0;
            self.lasty = 0;
            self.canvas = document.createElement("canvas");
            self.canvas.height = self.height;
            self.canvas.width = self.width;
            self.ctx = self.canvas.getContext("2d");
            self.ctx.drawImage(self.image, 0, 0);
            self.imagedata = self.ctx.getImageData(0, 0, self.width, self.height);
        }


        $loc.__init__ = new Sk.builtin.func(function (self, imageId) {
            try {
                self.image = document.getElementById(Sk.ffi.remapToJs(imageId));
                initializeImage(self);
            } catch(e) {
                self.image = null;
            }
            if (self.image == null) {
                var susp = new Sk.misceval.Suspension();
                susp.resume = function() {
                    // Should the post image get stuff go here??
                    if (susp.data["error"]) {
                        throw new Sk.builtin.IOError(susp.data["error"].message);
                    }
                };
                susp.data = {
                    type    : 'Sk.promise',
                    promise : new Promise(function(resolve,reject) {
                            var newImg = new Image();
                            newImg.crossOrigin = '';
                            newImg.onerror = function() {
                                reject(Error("Failed to load URL: "+ newImg.src));
                            }
                            newImg.onload = function() {
                                self.image = this;
                                initializeImage(self);
                                resolve();
                            };
                            // look for mapping from imagename to url and possible an image proxy server
                            newImg.src = Sk.ffi.remapToJs(imageId);
                        }
                    )
                };
                return susp;
            }

        });

        var remapImageIdToURL = function(imageId) {
            // if imageId starts with http -- OK
            // if imageId is in Sk.imageMap -- look it up
            // if imageId is the name of an image file prepend http://host/app/book/_static/
            // if image proxy server is configured construct url for proxy
            // return the final URL
        }

        $loc.setDelay = new Sk.builtin.func(function(self,delay,interval) {
            var i;
            self.delay = Sk.ffi.remapToJs(delay);
            i = Sk.builtin.asnum$(interval);
            if (!i) {
                self.updateInterval = 1;
            } else {
                self.updateInterval = i;
            }
        });


	    //get a one-dimensional array of pixel objects - Zhu
	    $loc.getPixels = new Sk.builtin.func(function(self){
		    var arr = [];//initial array
		    var i;
		
		    for(i=0;i<self.image.height*self.image.width;i++){
		
			    arr[i] = Sk.misceval.callsim(self.getPixel,self,
			             i%self.image.width,Math.floor(i/self.image.width));
		    }
		    return new Sk.builtin.tuple(arr);
	    });
	
        $loc.getPixel = new Sk.builtin.func(function (self, x, y) {
            x = Sk.builtin.asnum$(x);
            y = Sk.builtin.asnum$(y);
            var index = (y * 4) * self.width + (x * 4);
            var red = self.imagedata.data[index];
            var green = self.imagedata.data[index + 1];
            var blue = self.imagedata.data[index + 2];
            return Sk.misceval.callsim(mod.Pixel, red, green, blue, x, y);
        });

        updateCanvasAndSuspend = function(self,x,y) {
            var susp = new Sk.misceval.Suspension();
            susp.resume = function() { return Sk.builtin.none.none$; }
            susp.data = {
                type : "Sk.promise",
                promise : new Promise(function(resolve, reject) {
                    self.updateCount++;
                    if ((self.updateCount % self.updateInterval) === 0) {
                        if (self.lastx + self.updateInterval >= self.width) {
                            self.lastCtx.putImageData(self.imagedata,self.lastUlx, self.lastUly,
                                0, self.lasty,self.width,2);
                        } else if (self.lasty+self.updateInterval >= self.height) {
                            self.lastCtx.putImageData(self.imagedata,self.lastUlx, self.lastUly,
                                self.lastx, 0,2,self.height);
                        } else {
                            self.lastCtx.putImageData(self.imagedata, self.lastUlx, self.lastUly,
                                Math.min(x, self.lastx),
                                Math.min(y, self.lasty),
                                Math.max(Math.abs(x - self.lastx),1),
                                Math.max(Math.abs(y - self.lasty),1));
                        }
                        self.lastx = x;
                        self.lasty = y;
                        if (self.delay > 0) {
                            window.setTimeout(resolve, self.delay);
                        } else {
                            resolve();
                        }
                    } else {
                        resolve();
                    }
                })
            }
            return susp;
        }

        $loc.setPixel = new Sk.builtin.func(function (self, x, y, pix) {
            x = Sk.builtin.asnum$(x);
            y = Sk.builtin.asnum$(y);
            var index = (y * 4) * self.width + (x * 4);
            self.imagedata.data[index] = Sk.builtin.asnum$(Sk.misceval.callsim(pix.getRed, pix));
            self.imagedata.data[index + 1] = Sk.builtin.asnum$(Sk.misceval.callsim(pix.getGreen, pix));
            self.imagedata.data[index + 2] = Sk.builtin.asnum$(Sk.misceval.callsim(pix.getBlue, pix));
            self.imagedata.data[index + 3] = 255;
            return updateCanvasAndSuspend(self,x,y);
        });
        
	    // update the image with the pixel at the given count - Zhu
	    $loc.setPixelAt = new Sk.builtin.func(function (self, count, pixel){
	        count = Sk.builtin.asnum$(count);
            var x = count%self.image.width;
	        var y = Math.floor(count/self.image.width);
            var index = (y * 4) * self.width + (x * 4);
            self.imagedata.data[index] = Sk.builtin.asnum$(Sk.misceval.callsim(pixel.getRed, pixel));
            self.imagedata.data[index + 1] = Sk.builtin.asnum$(Sk.misceval.callsim(pixel.getGreen, pixel));
            self.imagedata.data[index + 2] = Sk.builtin.asnum$(Sk.misceval.callsim(pixel.getBlue, pixel));
            self.imagedata.data[index + 3] = 255;
            return updateCanvasAndSuspend(self,x,y);
	    });
	    
	    // new updatePixel that uses the saved x and y location in the pixel - Barb Ericson
	    $loc.updatePixel = new Sk.builtin.func(function (self, pixel){
            var x = Sk.builtin.asnum$(Sk.misceval.callsim(pixel.getX, pixel));
            var y = Sk.builtin.asnum$(Sk.misceval.callsim(pixel.getY, pixel));
            var index = (y * 4) * self.width + (x * 4);
            self.imagedata.data[index] = Sk.builtin.asnum$(Sk.misceval.callsim(pixel.getRed, pixel));
            self.imagedata.data[index + 1] = Sk.builtin.asnum$(Sk.misceval.callsim(pixel.getGreen, pixel));
            self.imagedata.data[index + 2] = Sk.builtin.asnum$(Sk.misceval.callsim(pixel.getBlue, pixel));
            self.imagedata.data[index + 3] = 255;
            return updateCanvasAndSuspend(self,x,y);
	    });

        $loc.getHeight = new Sk.builtin.func(function (self) {
            return new Sk.builtin.nmber(self.image.height, Sk.builtin.nmber.int$);
        });

        $loc.getWidth = new Sk.builtin.func(function (self, titlestring) {
            return new Sk.builtin.nmber(self.image.width, Sk.builtin.nmber.int$);
        });

        $loc.draw = new Sk.builtin.func(function (self, win, ulx, uly) {
            var susp = new Sk.misceval.Suspension();
            susp.resume = function() { return Sk.builtin.none.none$; }
            susp.data = {
                type: "Sk.promise",
                promise : new Promise(function(resolve,reject) {
                    win = Sk.builtin.asnum$(win);
                    ulx = Sk.builtin.asnum$(ulx);
                    uly = Sk.builtin.asnum$(uly);
                    var can = Sk.misceval.callsim(win.getWin, win);
                    var ctx = can.getContext("2d");
                    if (!ulx) {
                        ulx = 0;
                        uly = 0;
                    }
                    self.lastUlx = ulx;
                    self.lastUly = uly;
                    self.lastCtx = ctx;  // save a reference to the context of the window the image was last drawn in
                    //ctx.putImageData(self.imagedata,0,0,0,0,self.imagedata.width,self.imagedata.height);
                    ctx.putImageData(self.imagedata, ulx, uly);

                    if (self.delay > 0) {
                        window.setTimeout(resolve, self.delay);
                    } else {
                        window.setTimeout(resolve, 200);
                    }
                })
            };
            return susp;

        });

        // toList

    }

    mod.Image = Sk.misceval.buildClass(mod, image, 'Image', []);

    eImage = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, width, height) {
            self.width = Sk.builtin.asnum$(width);
            self.height = Sk.builtin.asnum$(height);
            self.canvas = document.createElement("canvas");
            self.ctx = self.canvas.getContext('2d');
            self.canvas.height = self.height;
            self.canvas.width = self.width;
            self.imagedata = self.ctx.getImageData(0, 0, self.width, self.height);
        });

    }

    mod.EmptyImage = Sk.misceval.buildClass(mod, eImage, 'EmptyImage', [mod.Image]);

    // create a ListImage object


    pixel = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, r, g, b, x, y) {
            self.red = Sk.builtin.asnum$(r);
            self.green = Sk.builtin.asnum$(g);
            self.blue = Sk.builtin.asnum$(b);
            self.x = Sk.builtin.asnum$(x);
            self.y = Sk.builtin.asnum$(y);
        });

        $loc.getRed = new Sk.builtin.func(function (self) {
            return new Sk.builtin.nmber(self.red);
        });

        $loc.getGreen = new Sk.builtin.func(function (self) {
            return new Sk.builtin.nmber(self.green);
        });

        $loc.getBlue = new Sk.builtin.func(function (self) {
            return new Sk.builtin.nmber(self.blue);
        });
        
        $loc.getX = new Sk.builtin.func(function (self) {
            return new Sk.builtin.nmber(self.x);
        });
        
        $loc.getY = new Sk.builtin.func(function (self) {
            return new Sk.builtin.nmber(self.y);
        });

        $loc.setRed = new Sk.builtin.func(function (self, r) {
            self.red = Sk.builtin.asnum$(r);
        });

        $loc.setGreen = new Sk.builtin.func(function (self, g) {
            self.green = Sk.builtin.asnum$(g);
        });

        $loc.setBlue = new Sk.builtin.func(function (self, b) {
            self.blue = Sk.builtin.asnum$(b);
        });
        
        $loc.setX = new Sk.builtin.func(function (self, x) {
            self.x = Sk.builtin.asnum$(x);
        });
        
        $loc.setY = new Sk.builtin.func(function (self, y) {
            self.y = Sk.builtin.asnum$(y);
        });

        $loc.__getitem__ = new Sk.builtin.func(function (self, k) {
            k = Sk.builtin.asnum$(k);
            if (k == 0) {
                return self.red;
            } else if (k == 1) {
                return self.green;
            } else if (k == 2) {
                return self.blue;
            }
        });

        $loc.__str__ = new Sk.builtin.func(function (self) {
            return "[" + self.red + "," + self.green + "," + self.blue + "]"
        });

        //getColorTuple
        $loc.getColorTuple = new Sk.builtin.func(function (self, x, y) {

        });

        //setRange -- change from 0..255 to 0.0 .. 1.0
        $loc.setRange = new Sk.builtin.func(function (self, mx) {
            self.max = Sk.builtin.asnum$(mx);
        });

    }
    mod.Pixel = Sk.misceval.buildClass(mod, pixel, 'Pixel', []);


    screen = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, width, height) {
            var currentCanvas = ImageMod.canvasLib[Sk.canvas];
            var tmpCan;
            if (currentCanvas === undefined) {
                tmpCan = document.createElement("canvas");
                tmpDiv = document.getElementById(Sk.canvas);
                self.theScreen = tmpCan;
                tmpDiv.appendChild(tmpCan);
                ImageMod.canvasLib[Sk.canvas] = tmpCan;
                ImageMod.canvasLib[Sk.canvas] = self.theScreen;
            } else {
                self.theScreen = currentCanvas;
                self.theScreen.height = self.theScreen.height;
            }
            if (width !== undefined) {
                self.theScreen.height = height.v;
                self.theScreen.width = width.v;
            } else {
                if (Sk.availableHeight) {
                    self.theScreen.height = Sk.availableHeight;
                }
                if (Sk.availableWidth) {
                    self.theScreen.width = Sk.availableWidth;
                }
            }

            self.theScreen.style.display = "block";
        });

        $loc.getWin = new Sk.builtin.func(function (self) {
            return self.theScreen;
        });

        // exitonclick
        $loc.exitonclick = new Sk.builtin.func(function (self) {
            var canvas_id = self.theScreen.id;
            self.theScreen.onclick = function () {
                document.getElementById(canvas_id).style.display = 'none';
                document.getElementById(canvas_id).onclick = null;
                delete ImageMod.canvasLib[canvas_id];
            }

        });
        //getMouse
    }

    mod.ImageWin = Sk.misceval.buildClass(mod, screen, 'ImageWin', []);

    return mod
};
