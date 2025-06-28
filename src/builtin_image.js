// __init__ implementation
const initMethod = function (self, file) {
    Sk.builtin.pyCheckArgsLen("__init__", arguments.length, 2, 2);
    const susp = new Sk.misceval.Suspension();
    susp.resume = function () {
        if (susp.data.error) {
            throw new Sk.builtin.IOError(susp.data.error.message);
        }
        return susp.data.result;
    };
    susp.data = {
        type: "Sk.promise",
        promise: new Promise(function (resolve, reject) {
            const img = new Image();
            img.onerror = () => { reject(new Error("Could not load image: " + img.file)); };
            img.onload = function () {
                // private storage
                self._image = this;
                self.width = this.naturalWidth;
                self.height = this.naturalHeight;
                self.file = this.file;
                // defaults
                self.opacity = 1.0;
                self._rotation = 0;
                self._scaleX = 1.0;
                self._scaleY = 1.0;
                // origin for transforms (0,0 = top-left)
                self._originX = 0;
                self._originY = 0;
                self._frameW = this.naturalWidth;
                self._frameH = this.naturalHeight;
                self._columns = 1;
                self._rows = 1;
                self._flipX = false;
                self._flipY = false;
                const ctx = Sk.PyAngelo.ctx;
                self._smoothing = ctx.imageSmoothingEnabled;
                Sk.PyAngelo.images[this.file] = this;
                resolve(Sk.builtin.none.none$);
            };
            file = Sk.ffi.remapToJs(file);
            img.src = file;
            img.file = file;
        })
    };
    return susp;
};
initMethod.co_varnames = ["self", "file"];
initMethod.co_argcount = 2;

// setOpacity implementation
const setOpacityMethod = function(self, opacity) {
    Sk.builtin.pyCheckArgsLen("setOpacity", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("opacity", "number", Sk.builtin.checkNumber(opacity));
    self.opacity = Math.max(0, Math.min(1, Sk.ffi.remapToJs(opacity)));
    return Sk.builtin.none.none$;
};
setOpacityMethod.co_varnames = ["self", "opacity"];
setOpacityMethod.co_argcount = 2;

// setRotation implementation
const setRotationMethod = function(self, angle) {
    Sk.builtin.pyCheckArgsLen("setRotation", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("angle", "number", Sk.builtin.checkNumber(angle));
    let a = Sk.ffi.remapToJs(angle);
    if (Sk.PyAngelo.angleModeValue === Sk.PyAngelo.DEGREES) {
        a = a * (Math.PI / 180);
    }
    self._rotation = a;
    return Sk.builtin.none.none$;
};
setRotationMethod.co_varnames = ["self", "angle"];
setRotationMethod.co_argcount = 2;

// setScale implementation
const setScaleMethod = function(self, scaleX, scaleY) {
    Sk.builtin.pyCheckArgsLen("setScale", arguments.length, 2, 3);
    Sk.builtin.pyCheckType("scaleX", "number", Sk.builtin.checkNumber(scaleX));
    if (scaleY !== Sk.builtin.none.none$) {
        Sk.builtin.pyCheckType("scaleY", "number", Sk.builtin.checkNumber(scaleY));
    }
    self._scaleX = Sk.ffi.remapToJs(scaleX);
    self._scaleY = (scaleY === Sk.builtin.none.none$) ? self._scaleX : Sk.ffi.remapToJs(scaleY);
    return Sk.builtin.none.none$;
};
setScaleMethod.co_varnames = ["self", "scaleX", "scaleY"];
setScaleMethod.$defaults = [Sk.builtin.none.none$];
setScaleMethod.co_argcount = 3;

// setSmoothing implementation
const setSmoothingMethod = function(self, flag) {
    Sk.builtin.pyCheckArgsLen("setSmoothing", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("flag", "number", Sk.builtin.checkNumber(flag));
    self._smoothing = !!Sk.ffi.remapToJs(flag);
    return Sk.builtin.none.none$;
};
setSmoothingMethod.co_varnames = ["self", "flag"];
setSmoothingMethod.co_argcount = 2;

// setFrameSize implementation
const setFrameSizeMethod = function(self, frameW, frameH) {
    Sk.builtin.pyCheckArgsLen("setFrameSize", arguments.length, 3, 3);
    Sk.builtin.pyCheckType("frameW", "number", Sk.builtin.checkNumber(frameW));
    Sk.builtin.pyCheckType("frameH", "number", Sk.builtin.checkNumber(frameH));
    self._frameW = Sk.ffi.remapToJs(frameW);
    self._frameH = Sk.ffi.remapToJs(frameH);
    if (self._frameW <= 0 || self._frameH <= 0) {
        throw new Sk.builtin.ValueError("Frame width and height must be positive.");
    }
    self._columns = Math.floor(self.width / self._frameW);
    self._rows = Math.floor(self.height / self._frameH);
    return Sk.builtin.none.none$;
};
setFrameSizeMethod.co_varnames = ["self", "frameW", "frameH"];
setFrameSizeMethod.co_argcount = 3;

// setFlipX implementation
const setFlipXMethod = function(self, flip) {
    Sk.builtin.pyCheckArgsLen("setFlipX", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("flip", "number", Sk.builtin.checkNumber(flip));
    self._flipX = !!Sk.ffi.remapToJs(flip);
    return Sk.builtin.none.none$;
};
setFlipXMethod.co_varnames = ["self", "flip"];
setFlipXMethod.co_argcount = 2;

// setFlipY implementation
const setFlipYMethod = function(self, flip) {
    Sk.builtin.pyCheckArgsLen("setFlipY", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("flip", "number", Sk.builtin.checkNumber(flip));
    self._flipY = !!Sk.ffi.remapToJs(flip);
    return Sk.builtin.none.none$;
};
setFlipYMethod.co_varnames = ["self", "flip"];
setFlipYMethod.co_argcount = 2;

// setPivot implementation
// === Pivot / Origin ===
const setPivotMethod = function(self, oxPy, oyPy) {
    // Allow either setPivot(ox) or setPivot(ox, oy)
    Sk.builtin.pyCheckArgsLen("setPivot", arguments.length, 2, 3);

    const oxVal = Sk.ffi.remapToJs(oxPy);
    // Remap the second argument if provided; otherwise default to oxVal
    const oyVal = (arguments.length === 2 || oyPy === Sk.builtin.none.none$) ? oxVal : Sk.ffi.remapToJs(oyPy);

    // Validate and set _originX
    if (oxVal === "center") {
        self._originX = self.width / 2;
    } else {
        Sk.builtin.pyCheckType("ox", "number", Sk.builtin.checkNumber(oxPy));
        self._originX = oxVal;
    }

    // Validate and set _originY
    if (oyVal === "center") {
        self._originY = self.height / 2;
    } else {
        Sk.builtin.pyCheckType("oy", "number", Sk.builtin.checkNumber(oyPy));
        self._originY = oyVal;
    }
    if (Sk.PyAngelo.yAxisMode === Sk.PyAngelo.CARTESIAN) {
        self._originY = self._frameH - self._originY;
    }

    return Sk.builtin.none.none$;
};
// Make the second parameter optional
setPivotMethod.$defaults = [ Sk.builtin.none.none$ ];
// Argument names for introspection
setPivotMethod.co_varnames = ["self", "ox", "oy"];



// Helpers
/**
 * Prepare the canvas context with smoothing settings.
 */
function prepareContext(ctx, smoothing) {
    ctx.imageSmoothingEnabled = smoothing;
}

/**
 * Apply flips, rotation, scaling, and origin adjustments.
 */
function applyTransforms(ctx, self, width, height) {
    // 1) move to the pivot point
    ctx.translate(self._originX, self._originY);

    // 2) flip if needed
    if (self._flipX) { ctx.scale(-1, 1); }
    if (self._flipY) { ctx.scale(1, -1); }

    // 3) rotate around that same pivot
    if (self._rotation !== 0) {
        ctx.rotate(self._rotation);
    }

    // 4) scale around the pivot
    if (self._scaleX !== 1.0 || self._scaleY !== 1.0) {
        ctx.scale(self._scaleX, self._scaleY);
    }

    // 5) move back
    ctx.translate(-self._originX, -self._originY);
}

// draw full image
const drawMethod = function(self, x, y, width, height) {
    Sk.builtin.pyCheckArgsLen("draw", arguments.length, 3, 5);
    [x, y, width, height].forEach(arg => {
        if ((arg !== undefined) && (arg !== Sk.builtin.none.none$)) {
            Sk.builtin.pyCheckType("number", "number", Sk.builtin.checkNumber(arg));
        }
    });
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    width = ((width === undefined) || (width === Sk.builtin.none.none$)) ? self.width : Sk.ffi.remapToJs(width);
    height = ((height === undefined) || (height === Sk.builtin.none.none$)) ? self.height : Sk.ffi.remapToJs(height);
    const img = self._image;
    if (!img) {
        throw new Sk.builtin.RuntimeError("Image not loaded yet.");
    }
    const ctx = Sk.PyAngelo.ctx;
    const prevAlpha = ctx.globalAlpha;
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.globalAlpha = self.opacity;
    ctx.save();
    prepareContext(ctx, self._smoothing);
    if (Sk.PyAngelo.yAxisMode === Sk.PyAngelo.CARTESIAN) {
        ctx.translate(x, y);
        ctx.transform(1, 0, 0, -1, 0, height);
        applyTransforms(ctx, self, width, height);
        ctx.drawImage(img, 0, 0, width, height);
    } else {
        ctx.translate(x, y);
        applyTransforms(ctx, self, width, height);
        ctx.drawImage(img, 0, 0, width, height);
    }
    ctx.restore();
    ctx.globalAlpha = prevAlpha;
    ctx.imageSmoothingEnabled = prevSmoothing;
    return Sk.builtin.none.none$;
};
drawMethod.co_varnames = ["self", "x", "y", "width", "height"];
drawMethod.$defaults = [Sk.builtin.none.none$, Sk.builtin.none.none$];
drawMethod.co_argcount = 5;

// draw sub-region
const drawRegionMethod = function(self, sx, sy, sw, sh, dx, dy, dw, dh) {
    Sk.builtin.pyCheckArgsLen("drawRegion", arguments.length, 8, 9);
    [sx, sy, sw, sh, dx, dy, dw, dh].forEach(arg => {
        if ((arg !== undefined) && (arg !== Sk.builtin.none.none$)) {
            Sk.builtin.pyCheckType("number", "number", Sk.builtin.checkNumber(arg));
        }
    });
    sx = Sk.ffi.remapToJs(sx);
    sy = Sk.ffi.remapToJs(sy);
    sw = Sk.ffi.remapToJs(sw);
    sh = Sk.ffi.remapToJs(sh);
    dx = Sk.ffi.remapToJs(dx);
    dy = Sk.ffi.remapToJs(dy);
    dw = ((dw === undefined) || (dw === Sk.builtin.none.none$)) ? sw : Sk.ffi.remapToJs(dw);
    dh = ((dh === undefined) || (dh === Sk.builtin.none.none$)) ? sh : Sk.ffi.remapToJs(dh);
    const img = self._image;
    if (!img) {
        throw new Sk.builtin.RuntimeError("Image not loaded yet.");
    }
    const ctx = Sk.PyAngelo.ctx;
    const prevAlpha = ctx.globalAlpha;
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.globalAlpha = self.opacity;
    ctx.save();
    prepareContext(ctx, self._smoothing);
    if (Sk.PyAngelo.yAxisMode === Sk.PyAngelo.CARTESIAN) {
        ctx.translate(dx, dy);
        ctx.transform(1, 0, 0, -1, 0, dh);
        applyTransforms(ctx, self, dw, dh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
    } else {
        ctx.translate(dx, dy);
        applyTransforms(ctx, self, dw, dh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
    }
    ctx.restore();
    ctx.globalAlpha = prevAlpha;
    ctx.imageSmoothingEnabled = prevSmoothing;
    return Sk.builtin.none.none$;
};

drawRegionMethod.co_varnames = ["self","sx","sy","sw","sh","dx","dy","dw","dh"];
drawRegionMethod.$defaults = [ Sk.builtin.none.none$, Sk.builtin.none.none$ ];
drawRegionMethod.co_argcount = 9;

// draw single frame from spritesheet
const drawFrameMethod = function(self, frameIndex, x, y, scaleW, scaleH) {
    Sk.builtin.pyCheckArgsLen("drawFrame", arguments.length, 4, 6);
    [frameIndex, x, y, scaleW, scaleH].forEach(arg => {
        if ((arg !== undefined) && (arg !== Sk.builtin.none.none$)) {
            Sk.builtin.pyCheckType("number", "number", Sk.builtin.checkNumber(arg));
        }
    });
    frameIndex = Sk.ffi.remapToJs(frameIndex);
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    const col = frameIndex % self._columns;
    const row = Math.floor(frameIndex / self._columns);
    const sx = col * self._frameW;
    const sy = row * self._frameH;
    const sw = self._frameW;
    const sh = self._frameH;
    const dw = ((scaleW === undefined) || (scaleW === Sk.builtin.none.none$)) ? sw : Sk.ffi.remapToJs(scaleW);
    const dh = ((scaleH === undefined) || (scaleH === Sk.builtin.none.none$)) ? sh : Sk.ffi.remapToJs(scaleH);
    return drawRegionMethod(self, sx, sy, sw, sh, x, y, dw, dh);
};

drawFrameMethod.co_varnames = ["self","frameIndex","x","y","scaleW","scaleH"];
drawFrameMethod.$defaults = [ Sk.builtin.none.none$, Sk.builtin.none.none$ ];
drawFrameMethod.co_argcount = 6;

const disposeMethod = function(self) {
    if (Sk.PyAngelo.images[self.file]) {
        delete Sk.PyAngelo.images[self.file];
    }
    self._image = null;
    return Sk.builtin.none.none$;
};
disposeMethod.co_name     = "dispose";
disposeMethod.co_argcount = 1;
disposeMethod.func_doc =
    "dispose() -> None\n\nUnload the image and free resources.";

// Class binding
const imageClass = function($gbl,$loc) {
    $loc.__init__      = new Sk.builtin.func(initMethod);
    $loc.setOpacity    = new Sk.builtin.func(setOpacityMethod);
    $loc.setRotation   = new Sk.builtin.func(setRotationMethod);
    $loc.setScale      = new Sk.builtin.func(setScaleMethod);
    $loc.setSmoothing  = new Sk.builtin.func(setSmoothingMethod);
    $loc.setFrameSize  = new Sk.builtin.func(setFrameSizeMethod);
    $loc.setFlipX      = new Sk.builtin.func(setFlipXMethod);
    $loc.setFlipY      = new Sk.builtin.func(setFlipYMethod);
    $loc.setPivot      = new Sk.builtin.func(setPivotMethod);
    $loc.draw          = new Sk.builtin.func(drawMethod);
    $loc.drawRegion    = new Sk.builtin.func(drawRegionMethod);
    $loc.drawFrame     = new Sk.builtin.func(drawFrameMethod);
    $loc.dispose       = new Sk.builtin.func(disposeMethod);
    
    $loc.__repr__     = new Sk.builtin.func(self => new Sk.builtin.str(`Image(${self.file})`));
    $loc.__str__      = new Sk.builtin.func(self => new Sk.builtin.str(
        `Image(${self.file}) size=${self.width}x${self.height} opacity=${self.opacity} rotation=${self._rotation} scale=${self._scaleX},${self._scaleY} smoothing=${self._smoothing} frame=${self._frameW}x${self._frameH} flip=${self._flipX},${self._flipY}`
    ));
    $loc.__getattr__  = new Sk.builtin.func((self,key) => {
        key = Sk.ffi.remapToJs(key);
        if (["width","height","file","opacity","rotation","scale","smoothing","frameW","frameH","columns","rows","flipX","flipY"].includes(key)) {
            switch(key) {
                case "rotation":  return Sk.ffi.remapToPy(self._rotation);
                case "scale":     return Sk.ffi.remapToPy([self._scaleX, self._scaleY]);
                case "smoothing": return Sk.ffi.remapToPy(self._smoothing);
                case "frameW":    return Sk.ffi.remapToPy(self._frameW);
                case "frameH":    return Sk.ffi.remapToPy(self._frameH);
                case "columns":   return Sk.ffi.remapToPy(self._columns);
                case "rows":      return Sk.ffi.remapToPy(self._rows);
                case "flipX":     return Sk.ffi.remapToPy(self._flipX);
                case "flipY":     return Sk.ffi.remapToPy(self._flipY);
                default:           return Sk.ffi.remapToPy(self[key]);
            }
        }
        throw new Sk.builtin.AttributeError(`Image has no attribute '${key}'`);
    });
    // intercept attribute assignments to call setters
    $loc.__setattr__ = new Sk.builtin.func(function(self, keyObj, value) {
        const key = Sk.ffi.remapToJs(keyObj);
        switch (key) {
            case "opacity":
                return setOpacityMethod(self, value);
            case "rotation":
                return setRotationMethod(self, value);
            case "scale": {
                // expect tuple or single number
                const pyVal = value;
                const seq = Sk.ffi.remapToJs(pyVal);
                if (Array.isArray(seq) && seq.length >= 1) {
                    const sx = Sk.ffi.remapToPy(seq[0]);
                    const sy = seq.length > 1 ? Sk.ffi.remapToPy(seq[1]) : sx;
                    return setScaleMethod(self, sx, sy);
                }
                return setScaleMethod(self, value);
            }
            case "smoothing":
                return setSmoothingMethod(self, value);
            case "frameW":
            case "frameH":
                // redirect to setFrameSize for simplicity
                const fw = Sk.ffi.remapToJs(self._frameW);
                const fh = Sk.ffi.remapToJs(self._frameH);
                if (key === "frameW") {
                    return setFrameSizeMethod(self, value, Sk.ffi.remapToPy(fh));
                } else {
                    return setFrameSizeMethod(self, Sk.ffi.remapToPy(fw), value);
                }
            case "flipX":
                return setFlipXMethod(self, value);
            case "flipY":
                return setFlipYMethod(self, value);
            default:
                // fallback: direct attribute
                self[key] = Sk.ffi.remapToJs(value);
                return Sk.builtin.none.none$;
        }
    });
};
Sk.builtin.Image = imageClass;
Sk.builtins["Image"] = Sk.misceval.buildClass(Sk.builtin,Sk.builtin.Image,"Image",[]);
Sk.builtins["loadImage"] = Sk.builtins["Image"];
Sk.builtins["Image"].prototype.$doc = `Represents an image or spritesheet.
Methods:
  setOpacity(alpha): set global opacity 0.0–1.0.
  setRotation(angle): set rotation in radians or degrees based on angleMode.
  setScale(sx[, sy]): set scale factors.
  setSmoothing(flag): enable/disable pixel-art smoothing.
  setFrameSize(frameW, frameH): define frame dimensions.
  setFlipX(flag): flip horizontally.
  setFlipY(flag): flip vertically.
  setPivot(ox, oy): set rotation/scale pivot point within image.
  draw(x,y[,w,h]): draw full image with transforms.
  drawRegion(sx,sy,sw,sh,dx,dy[,dw,dh]): draw sub-region.
  drawFrame(index,x,y[,scaleW,scaleH]): draw specific frame.
  dispose() – Release the image’s underlying resources and remove it from memory.`;
