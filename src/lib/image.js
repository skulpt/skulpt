var ImageMod; // the single identifier needed in the global scope
var $builtinmodule;

if (!ImageMod) {
    ImageMod = {};
    ImageMod.canvasLib = [];
}

$builtinmodule = function (name) {
    var screen;
    var pixel;
    var eImage;
    var mod = {__name__: new Sk.builtin.str("image")};
    var updateCanvasAndSuspend;
    var initializeImage;
    var checkPixelRange;
    var remapImageIdToURL;

    var image = function ($gbl, $loc) {
        initializeImage = function (self) {
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
        };


        $loc.__init__ = new Sk.builtin.func(function (self, imageId) {
            var susp;
            Sk.builtin.pyCheckArgsLen("__init__", arguments.length, 2, 2);
            try {
                self.image = document.getElementById(Sk.ffi.remapToJs(imageId));
                initializeImage(self);
            } catch (e) {
                self.image = null;
            }
            if (self.image == null) {
                susp = new Sk.misceval.Suspension(new Promise(function (resolve, reject) {
                    var newImg = new Image();
                    newImg.crossOrigin = "";
                    newImg.onerror = function () {
                        reject(new Sk.builtin.IOError("Failed to load URL: " + newImg.src));
                    };
                    newImg.onload = function () {
                        self.image = this;
                        initializeImage(self);
                        resolve(Sk.builtin.none.none$);
                    };
                    // look for mapping from imagename to url and possible an image proxy server
                    newImg.src = remapImageIdToURL(imageId);
                }));
                susp.suspend();
            }
            return Sk.builtin.none.none$;

        });

        remapImageIdToURL = function (imageId) {
            // if imageId starts with http -- OK
            // if imageId is in Sk.imageMap -- look it up
            // if imageId is the name of an image file prepend http://host/app/book/_static/
            // if image proxy server is configured construct url for proxy
            // return the final URL

            var proxy = typeof(Sk.imageProxy) === "function"
                        ? Sk.imageProxy : function (str) {
                            url = document.createElement("a");
                            url.href = ret;
                            if (window.location.host !== url.host) {
                              return Sk.imageProxy + "/" + str;
                            }
                            return str;
                        };

            var url;
            var ret;
            ret = Sk.ffi.remapToJs(imageId);
            ret = proxy(ret);

            return ret;
        };

        checkPixelRange = function (self, x, y) {
            if (x < 0 || y < 0 || x >= self.width || y >= self.height) {
                throw new Sk.builtin.ValueError("Pixel index out of range.");
            }
        };

        var setdelay = function (self, delay, interval) {
            var i;
            Sk.builtin.pyCheckArgsLen("setdelay", arguments.length, 2, 3);
            self.delay = Sk.ffi.remapToJs(delay);
            i = Sk.builtin.asnum$(interval);
            if (!i) {
                self.updateInterval = 1;
            } else {
                self.updateInterval = i;
            }
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.set_delay = new Sk.builtin.func(setdelay);
        $loc.setDelay = new Sk.builtin.func(setdelay);


        //get a one-dimensional array of pixel objects - Zhu
        var getpixels = function (self) {
            var arr = [];//initial array
            var i;
            Sk.builtin.pyCheckArgsLen("getpixels", arguments.length, 1, 1);

            for (i = 0; i < self.image.height * self.image.width; i++) {
                arr[i] = Sk.misceval.callsimArray(self.getPixel, [self,
                    i % self.image.width, Math.floor(i / self.image.width)]);
            }
            return new Sk.builtin.tuple(arr);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.get_pixels = new Sk.builtin.func(getpixels);
        $loc.getPixels = new Sk.builtin.func(getpixels);

        $loc.getData = new Sk.builtin.func(function (self) {
            var arr = [];//initial array
            var i;
            var x;
            var y;
            var red;
            var green;
            var blue;
            var index;
            Sk.builtin.pyCheckArgsLen("getData", arguments.length, 1, 1);

            for (i = 0; i < self.image.height * self.image.width; i++) {
                x = i % self.image.width;
                y = Math.floor(i / self.image.width);
                checkPixelRange(self, x, y);
                index = (y * 4) * self.width + (x * 4);
                red = self.imagedata.data[index];
                green = self.imagedata.data[index + 1];
                blue = self.imagedata.data[index + 2];
                arr[i] = new Sk.builtin.tuple([new Sk.builtin.int_(red), new Sk.builtin.int_(green), new Sk.builtin.int_(blue)]);
            }

            return new Sk.builtin.list(arr);
        });

        var getpixel = function (self, x, y) {
            var red;
            var blue;
            var green;
            var index;
            Sk.builtin.pyCheckArgsLen("getpixel", arguments.length, 3, 3);
            x = Sk.builtin.asnum$(x);
            y = Sk.builtin.asnum$(y);
            checkPixelRange(self, x, y);
            index = (y * 4) * self.width + (x * 4);
            red = self.imagedata.data[index];
            green = self.imagedata.data[index + 1];
            blue = self.imagedata.data[index + 2];
            return Sk.misceval.callsimArray(mod.Pixel, [red, green, blue, x, y]);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.get_pixel = new Sk.builtin.func(getpixel);
        $loc.getPixel = new Sk.builtin.func(getpixel);


        updateCanvasAndSuspend = function (self, x, y) {
            var susp = new Sk.misceval.Suspension(new Promise(function (resolve, reject) {
                self.updateCount++;
                if ((self.updateCount % self.updateInterval) === 0) {
                    if (self.lastx + self.updateInterval >= self.width) {
                        self.lastCtx.putImageData(self.imagedata, self.lastUlx, self.lastUly,
                            0, self.lasty, self.width, 2);
                    } else if (self.lasty + self.updateInterval >= self.height) {
                        self.lastCtx.putImageData(self.imagedata, self.lastUlx, self.lastUly,
                            self.lastx, 0, 2, self.height);
                    } else {
                        self.lastCtx.putImageData(self.imagedata, self.lastUlx, self.lastUly,
                            Math.min(x, self.lastx),
                            Math.min(y, self.lasty),
                            Math.max(Math.abs(x - self.lastx), 1),
                            Math.max(Math.abs(y - self.lasty), 1));
                    }
                    self.lastx = x;
                    self.lasty = y;
                    if (self.delay > 0) {
                        window.setTimeout(() => resolve(Sk.builtin.none.none$), self.delay);
                    } else {
                        resolve(Sk.builtin.none.none$);
                    }
                } else {
                    resolve(Sk.builtin.none.none$);
                }
            }));
            susp.suspend();
        };

        var setpixel = function (self, x, y, pix) {
            var index;
            Sk.builtin.pyCheckArgsLen("setpixel", arguments.length, 4, 4);
            x = Sk.builtin.asnum$(x);
            y = Sk.builtin.asnum$(y);
            checkPixelRange(self, x, y);
            index = (y * 4) * self.width + (x * 4);
            self.imagedata.data[index] = Sk.builtin.asnum$(Sk.misceval.callsimArray(pix.getRed, [pix]));
            self.imagedata.data[index + 1] = Sk.builtin.asnum$(Sk.misceval.callsimArray(pix.getGreen, [pix]));
            self.imagedata.data[index + 2] = Sk.builtin.asnum$(Sk.misceval.callsimArray(pix.getBlue, [pix]));
            self.imagedata.data[index + 3] = 255;
            return updateCanvasAndSuspend(self, x, y);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.set_pixel = new Sk.builtin.func(setpixel);
        $loc.setPixel = new Sk.builtin.func(setpixel);


        // update the image with the pixel at the given count - Zhu
        var setpixelat = function (self, count, pixel) {
            var x;
            var y;
            var index;
            Sk.builtin.pyCheckArgsLen("setpixelat", arguments.length, 3, 3);
            count = Sk.builtin.asnum$(count);
            x = count % self.image.width;
            y = Math.floor(count / self.image.width);
            checkPixelRange(self, x, y);
            index = (y * 4) * self.width + (x * 4);
            self.imagedata.data[index] = Sk.builtin.asnum$(Sk.misceval.callsimArray(pixel.getRed, [pixel]));
            self.imagedata.data[index + 1] = Sk.builtin.asnum$(Sk.misceval.callsimArray(pixel.getGreen, [pixel]));
            self.imagedata.data[index + 2] = Sk.builtin.asnum$(Sk.misceval.callsimArray(pixel.getBlue, [pixel]));
            self.imagedata.data[index + 3] = 255;
            return updateCanvasAndSuspend(self, x, y);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.set_pixel_at = new Sk.builtin.func(setpixelat);
        $loc.setPixelAt = new Sk.builtin.func(setpixelat);


        // new updatePixel that uses the saved x and y location in the pixel - Barb Ericson
        var updatepixel = function (self, pixel) {
            var x;
            var y;
            var index;
            Sk.builtin.pyCheckArgsLen("updatepixel", arguments.length, 2, 2);
            x = Sk.builtin.asnum$(Sk.misceval.callsimArray(pixel.getX, [pixel]));
            y = Sk.builtin.asnum$(Sk.misceval.callsimArray(pixel.getY, [pixel]));
            checkPixelRange(self, x, y);
            index = (y * 4) * self.width + (x * 4);
            self.imagedata.data[index] = Sk.builtin.asnum$(Sk.misceval.callsimArray(pixel.getRed, [pixel]));
            self.imagedata.data[index + 1] = Sk.builtin.asnum$(Sk.misceval.callsimArray(pixel.getGreen, [pixel]));
            self.imagedata.data[index + 2] = Sk.builtin.asnum$(Sk.misceval.callsimArray(pixel.getBlue, [pixel]));
            self.imagedata.data[index + 3] = 255;
            return updateCanvasAndSuspend(self, x, y);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.update_pixel = new Sk.builtin.func(updatepixel);
        $loc.updatePixel = new Sk.builtin.func(updatepixel);


        var getheight = function (self) {
            Sk.builtin.pyCheckArgsLen("getheight", arguments.length, 1, 1);
            return new Sk.builtin.int_(self.height);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.get_height = new Sk.builtin.func(getheight);
        $loc.getHeight = new Sk.builtin.func(getheight);


        var getwidth = function (self, titlestring) {
            Sk.builtin.pyCheckArgsLen("getwidth", arguments.length, 1, 1);
            return new Sk.builtin.int_(self.width);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.get_width = new Sk.builtin.func(getwidth);
        $loc.getWidth = new Sk.builtin.func(getwidth);

        // allow direct access to height/width properties
        $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
            key = Sk.ffi.remapToJs(key);
                if (key === "height") {
                    return Sk.builtin.assk$(self.height);
                }
                else if (key === "width") {
                    return Sk.builtin.assk$(self.width);
                }
            });

        // height and width can only be set on creation
        $loc.__setattr__ = new Sk.builtin.func(function (self, key, value) {
            key = Sk.ffi.remapToJs(key);
            if (key === 'height' || key === 'width') {
                throw new Sk.builtin.Exception("Cannot change height or width they can only be set on creation")
            } else {
                throw new Sk.builtin.Exception("Unknown attribute: " + key)
            }
        });

        $loc.draw = new Sk.builtin.func(function (self, win, ulx, uly) {
            var susp;
            Sk.builtin.pyCheckArgsLen("draw", arguments.length, 2, 4);
            susp = new Sk.misceval.Suspension(new Promise(function (resolve, reject) {
                var can;
                var ctx;
                win = Sk.builtin.asnum$(win);
                ulx = Sk.builtin.asnum$(ulx);
                uly = Sk.builtin.asnum$(uly);
                can = Sk.misceval.callsimArray(win.getWin, [win]);
                ctx = can.getContext("2d");
                if (ulx === undefined) {
                    ulx = 0;
                    uly = 0;
                }
                self.lastUlx = ulx;
                self.lastUly = uly;
                self.lastCtx = ctx;  // save a reference to the context of the window the image was last drawn in
                //ctx.putImageData(self.imagedata,0,0,0,0,self.imagedata.width,self.imagedata.height);
                ctx.putImageData(self.imagedata, ulx, uly);

                if (self.delay > 0) {
                    window.setTimeout(() => resolve(Sk.builtin.none.none$), self.delay);
                } else {
                    window.setTimeout(() => resolve(Sk.builtin.none.none$), 200);
                }
            }));
            susp.suspend();

        });

        // toList

    };

    mod.Image = Sk.misceval.buildClass(mod, image, "Image", []);

    eImage = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, width, height) {
            Sk.builtin.pyCheckArgsLen("__init__", arguments.length, 3, 3);
            self.width = Sk.builtin.asnum$(width);
            self.height = Sk.builtin.asnum$(height);
            self.canvas = document.createElement("canvas");
            self.ctx = self.canvas.getContext("2d");
            self.canvas.height = self.height;
            self.canvas.width = self.width;
            self.imagedata = self.ctx.getImageData(0, 0, self.width, self.height);
        });

    };

    mod.EmptyImage = Sk.misceval.buildClass(mod, eImage, "EmptyImage", [mod.Image]);

    // create a ListImage object


    pixel = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, r, g, b, x, y) {
            Sk.builtin.pyCheckArgsLen("__init__", arguments.length, 4, 6);
            self.red = Sk.builtin.asnum$(r);
            self.green = Sk.builtin.asnum$(g);
            self.blue = Sk.builtin.asnum$(b);
            self.x = Sk.builtin.asnum$(x);
            self.y = Sk.builtin.asnum$(y);
        });

        var getred = function (self) {
            Sk.builtin.pyCheckArgsLen("getred", arguments.length, 1, 1);
            return Sk.builtin.assk$(self.red);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.get_red = new Sk.builtin.func(getred);
        $loc.getRed = new Sk.builtin.func(getred);

        var getgreen = function (self) {
            Sk.builtin.pyCheckArgsLen("getgreen", arguments.length, 1, 1);
            return Sk.builtin.assk$(self.green);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.get_green = new Sk.builtin.func(getgreen);
        $loc.getGreen = new Sk.builtin.func(getgreen);

        var getblue = function (self) {
            Sk.builtin.pyCheckArgsLen("getblue", arguments.length, 1, 1);
            return Sk.builtin.assk$(self.blue);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.get_blue = new Sk.builtin.func(getblue);
        $loc.getBlue = new Sk.builtin.func(getblue);

        var getx = function (self) {
            Sk.builtin.pyCheckArgsLen("getx", arguments.length, 1, 1);
            return Sk.builtin.assk$(self.x);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.get_x = new Sk.builtin.func(getx);
        $loc.getX = new Sk.builtin.func(getx);

        var gety = function (self) {
            Sk.builtin.pyCheckArgsLen("gety", arguments.length, 1, 1);
            return Sk.builtin.assk$(self.y);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.get_y = new Sk.builtin.func(gety);
        $loc.getY = new Sk.builtin.func(gety);

        var setred = function (self, r) {
            Sk.builtin.pyCheckArgsLen("setred", arguments.length, 2, 2);
            self.red = Sk.builtin.asnum$(r);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.set_red = new Sk.builtin.func(setred);
        $loc.setRed = new Sk.builtin.func(setred);

        var setgreen = function (self, g) {
            Sk.builtin.pyCheckArgsLen("setgreen", arguments.length, 2, 2);
            self.green = Sk.builtin.asnum$(g);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.set_green = new Sk.builtin.func(setgreen);
        $loc.setGreen = new Sk.builtin.func(setgreen);

        var setblue = function (self, b) {
            Sk.builtin.pyCheckArgsLen("setblue", arguments.length, 2, 2);
            self.blue = Sk.builtin.asnum$(b);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.set_blue = new Sk.builtin.func(setblue);
        $loc.setBlue = new Sk.builtin.func(setblue);

        $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
            key = Sk.ffi.remapToJs(key);
                if (key === "red") {
                    return Sk.builtin.assk$(self.red);
                }
                else if (key === "green") {
                    return Sk.builtin.assk$(self.green);
                }
                else if (key === "blue") {
                    return Sk.builtin.assk$(self.blue);
                }
            });


        $loc.__setattr__ = new Sk.builtin.func(function (self, key, value) {
            key = Sk.ffi.remapToJs(key);
            if (key === 'red' || key === 'green' || key === 'blue') {
                self[key] = Sk.builtin.asnum$(value)
            }
        });


        var setx = function (self, x) {
            Sk.builtin.pyCheckArgsLen("setx", arguments.length, 2, 2);
            self.x = Sk.builtin.asnum$(x);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.set_x = new Sk.builtin.func(setx);
        $loc.setX = new Sk.builtin.func(setx);

        var sety = function (self, y) {
            Sk.builtin.pyCheckArgsLen("sety", arguments.length, 2, 2);
            self.y = Sk.builtin.asnum$(y);
        };

        // alias the function with pep8 compliant snake_case and legacy camelCase
        $loc.set_y = new Sk.builtin.func(sety);
        $loc.setY = new Sk.builtin.func(sety);

        $loc.__getitem__ = new Sk.builtin.func(function (self, k) {
            k = Sk.builtin.asnum$(k);
            if (k === 0) {
                return self.red;
            } else if (k == 1) {
                return self.green;
            } else if (k == 2) {
                return self.blue;
            }
        });

        $loc.__str__ = new Sk.builtin.func(function (self) {
            return Sk.ffi.remapToPy("[" + self.red + "," + self.green + "," + self.blue + "]");
        });

        //getColorTuple
        $loc.getColorTuple = new Sk.builtin.func(function (self, x, y) {

        });

        //setRange -- change from 0..255 to 0.0 .. 1.0
        $loc.setRange = new Sk.builtin.func(function (self, mx) {
            self.max = Sk.builtin.asnum$(mx);
        });

    };
    mod.Pixel = Sk.misceval.buildClass(mod, pixel, "Pixel", []);


    screen = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, width, height) {
            var currentCanvas;
            var tmpCan, tmpDiv;
            Sk.builtin.pyCheckArgsLen("__init__", arguments.length, 1, 3);
            currentCanvas = ImageMod.canvasLib[Sk.canvas];
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
                document.getElementById(canvas_id).style.display = "none";
                document.getElementById(canvas_id).onclick = null;
                delete ImageMod.canvasLib[canvas_id];
            };

        });
        //getMouse
    };

    mod.ImageWin = Sk.misceval.buildClass(mod, screen, "ImageWin", []);

    return mod;
};
