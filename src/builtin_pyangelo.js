/* PyAngelo Functionality */
Sk.builtin.setCanvasSize = function setCanvasSize(w, h, yAxisMode) {
    Sk.builtin.pyCheckArgsLen("setCanvasSize", arguments.length, 2, 3);
    w = Sk.ffi.remapToJs(w);
    h = Sk.ffi.remapToJs(h);
    yAxisMode = Sk.ffi.remapToJs(yAxisMode);
    if (!Sk.builtin.checkInt(w)) {
        throw new Sk.builtin.TypeError("Width must be an integer");
    }
    if (!Sk.builtin.checkInt(h)) {
        throw new Sk.builtin.TypeError("Height must be an integer");
    }
    if (!Sk.builtin.checkInt(yAxisMode)) {
        throw new Sk.builtin.TypeError("yAxisMode must be an integer");
    }

    // Change the actual canvas
    Sk.PyAngelo.canvas.style.display = "block";
    Sk.PyAngelo.canvas.width = w;
    Sk.PyAngelo.canvas.height = h;
    Sk.PyAngelo.canvas.focus();

    // Update the global variables
    Sk.builtins.width = new Sk.builtin.int_(w);
    Sk.builtins.height = new Sk.builtin.int_(h);

    // Set up the y axis
    if (yAxisMode === 1) {
        Sk.PyAngelo.ctx.transform(1, 0, 0, -1, 0, h);
        Sk.builtins._yAxisMode = yAxisMode;
    } else {
        Sk.PyAngelo.ctx.transform(1, 0, 0, 1, 0, 0);
        Sk.builtins._yAxisMode = 2;
    }
};

Sk.builtin.setConsoleSize = function setConsoleSize(size) {
    Sk.builtin.pyCheckArgsLen("setConsoleSize", arguments.length, 1, 1);
    if (!Sk.builtin.checkInt(size)) {
        throw new Sk.builtin.TypeError("Size must be an integer");
    }
    size = Sk.ffi.remapToJs(size);
    if (size >= 100 && size <= 2000) {
        Sk.PyAngelo.console.style.height = size + "px";
    }
};

Sk.builtin.noCanvas = function noCanvas() {
    // Change the actual canvas
    Sk.PyAngelo.canvas.style.display = "none";
    Sk.PyAngelo.canvas.width = 0;
    Sk.PyAngelo.canvas.height = 0;

    // Update the global variables
    Sk.builtins.width = new Sk.builtin.int_(0);
    Sk.builtins.height = new Sk.builtin.int_(0);
};

Sk.builtin.focusCanvas = function focusCanvas() {
    Sk.PyAngelo.canvas.focus();
};

Sk.builtin.background = function background(r, g, b, a) {
    Sk.builtin.pyCheckArgsLen("background", arguments.length, 0, 4);
    const fs = Sk.PyAngelo.ctx.fillStyle;
    Sk.PyAngelo.ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    Sk.PyAngelo.ctx.fillRect(0, 0, Sk.PyAngelo.canvas.width, Sk.PyAngelo.canvas.height);
    Sk.PyAngelo.ctx.fillStyle = fs;
};

Sk.builtin.text = function text(text, x, y, fontSize, fontName) {
    Sk.builtin.pyCheckArgsLen("text", arguments.length, 3, 5);
    text = Sk.ffi.remapToJs(text);
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    let fs = Sk.PyAngelo.ctx.font;
    Sk.PyAngelo.ctx.font = Sk.ffi.remapToJs(fontSize).toString() + "px " + Sk.ffi.remapToJs(fontName);
    Sk.PyAngelo.ctx.textBaseline = "top";
    if (Sk.ffi.remapToJs(Sk.builtins._yAxisMode) === 1) {
        let textMetrics = Sk.PyAngelo.ctx.measureText(text);
        const height = Math.abs(textMetrics.actualBoundingBoxAscent) + Math.abs(textMetrics.actualBoundingBoxDescent);
        Sk.PyAngelo.ctx.save();
        Sk.PyAngelo.ctx.translate(x, y);
        Sk.PyAngelo.ctx.transform(1, 0, 0, -1, 0, height);
        Sk.PyAngelo.ctx.fillText(text, 0, 0);
        Sk.PyAngelo.ctx.restore();
    } else {
        Sk.PyAngelo.ctx.fillText(text, x, y);
    }
    Sk.PyAngelo.ctx.font = fs;
};

Sk.builtin.saveState = function saveState() {
    Sk.PyAngelo.ctx.save();
};

Sk.builtin.restoreState = function restoreState() {
    Sk.PyAngelo.ctx.restore();
};

Sk.builtin.translate = function translate(x, y) {
    Sk.builtin.pyCheckArgsLen("translate", arguments.length, 2, 2);
    Sk.PyAngelo.ctx.translate(x, y);
};

Sk.builtin.angleMode = function angleMode(mode) {
    Sk.builtin.pyCheckArgsLen("angleMode", arguments.length, 1, 1);
    let m = Sk.ffi.remapToJs(mode);
    if (m === 1 || m === 2) {
        Sk.builtins._angleModeValue = new Sk.builtin.int_(m);
    }
};

Sk.builtin.rectMode = function rectMode(mode) {
    Sk.builtin.pyCheckArgsLen("rectMode", arguments.length, 1, 1);
    let m = Sk.ffi.remapToJs(mode);
    if (m === 1 || m === 2 || m === 3) {
        Sk.builtins._rectMode = new Sk.builtin.int_(m);
    }
};

Sk.builtin.circleMode = function circleMode(mode) {
    Sk.builtin.pyCheckArgsLen("circleMode", arguments.length, 1, 1);
    let m = Sk.ffi.remapToJs(mode);
    if (m === 1 || m === 3) {
        Sk.builtins._circleMode = new Sk.builtin.int_(m);
    }
};

Sk.builtin.rotate = function rotate(angle) {
    Sk.builtin.pyCheckArgsLen("rotate", arguments.length, 1, 1);
    let a = Sk.ffi.remapToJs(angle);
    // Convert to radians if in degrees
    if (Sk.ffi.remapToJs(Sk.builtins._angleModeValue) != 1) {
        a = Sk.ffi.remapToJs(Sk.builtins.PI)/180 * a;
    }
    Sk.PyAngelo.ctx.rotate(a);
};

Sk.builtin.applyMatrix = function applyMatrix(a, b, c, d, e, f) {
    Sk.PyAngelo.ctx.transform(Sk.ffi.remapToJs(a), Sk.ffi.remapToJs(b), Sk.ffi.remapToJs(c), Sk.ffi.remapToJs(d), Sk.ffi.remapToJs(e), Sk.ffi.remapToJs(f));
};

Sk.builtin.shearX = function shearX(angle) {
    let a = Sk.ffi.remapToJs(angle);
    // Convert to radians if in degrees
    if (Sk.ffi.remapToJs(Sk.builtins._angleModeValue) != 1) {
        a = Sk.ffi.remapToJs(Sk.builtins.PI)/180 * a;
    }
    Sk.PyAngelo.ctx.transform(1, 0, Math.tan(a), 1, 0, 0);
};

Sk.builtin.shearY = function shearY(angle) {
    let a = Sk.ffi.remapToJs(angle);
    // Convert to radians if in degrees
    if (Sk.ffi.remapToJs(Sk.builtins._angleModeValue) != 1) {
        a = Sk.ffi.remapToJs(Sk.builtins.PI)/180 * a;
    }
    Sk.PyAngelo.ctx.transform(1, Math.tan(a), 0, 1, 0, 0);
};

Sk.builtin.strokeWeight = function strokeWeight(weight) {
    Sk.builtin.pyCheckArgsLen("strokeWeight", arguments.length, 1, 1);
    Sk.PyAngelo.ctx.lineWidth = Sk.ffi.remapToJs(weight);
};

Sk.builtin.fill = function fill(r, g, b, a) {
    Sk.builtin.pyCheckArgsLen("fill", arguments.length, 0, 4);
    Sk.PyAngelo.ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    Sk.builtins._doFill = Sk.builtin.bool.true$;
};

Sk.builtin.noFill = function noFill() {
    Sk.builtins._doFill = Sk.builtin.bool.false$;
};

Sk.builtin.stroke = function stroke(r, g, b, a) {
    Sk.builtin.pyCheckArgsLen("stroke", arguments.length, 0, 4);
    Sk.PyAngelo.ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    Sk.builtins._doStroke = Sk.builtin.bool.true$;
};

Sk.builtin.noStroke = function noStroke() {
    Sk.builtins._doStroke = Sk.builtin.bool.false$;
};

Sk.builtin.line = function line(x1, y1, x2, y2) {
    Sk.builtin.pyCheckArgsLen("line", arguments.length, 4, 4);
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.moveTo(x1, y1);
    Sk.PyAngelo.ctx.lineTo(x2, y2);
    if (Sk.ffi.remapToJs(Sk.builtins._doStroke) === true) {
        Sk.PyAngelo.ctx.stroke();
    }
};

Sk.builtin.circle = function circle(x, y, radius) {
    Sk.builtin.pyCheckArgsLen("circle", arguments.length, 3, 3);
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    radius = Sk.ffi.remapToJs(radius);
    if (Sk.ffi.remapToJs(Sk.builtins._circleMode) === 1) {
        x = x + radius;
        y = y + radius;
    }
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.arc(x, y, radius, 0, Sk.ffi.remapToJs(Sk.builtins.TWO_PI));
    if (Sk.ffi.remapToJs(Sk.builtins._doStroke) === true) {
        Sk.PyAngelo.ctx.stroke();
    }
    if (Sk.ffi.remapToJs(Sk.builtins._doFill) === true) {
        Sk.PyAngelo.ctx.fill();
    }
};

Sk.builtin.ellipse = function ellipse(x, y, radiusX, radiusY) {
    Sk.builtin.pyCheckArgsLen("ellipse", arguments.length, 4, 4);
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    radiusX = Sk.ffi.remapToJs(radiusX);
    radiusY = Sk.ffi.remapToJs(radiusY);
    if (Sk.ffi.remapToJs(Sk.builtins._circleMode) === 1) {
        x = x + radiusX;
        y = y + radiusY;
    }
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Sk.ffi.remapToJs(Sk.builtins.TWO_PI));
    if (Sk.ffi.remapToJs(Sk.builtins._doStroke) === true) {
        Sk.PyAngelo.ctx.stroke();
    }
    if (Sk.ffi.remapToJs(Sk.builtins._doFill) === true) {
        Sk.PyAngelo.ctx.fill();
    }
};

Sk.builtin.arc = function arc(x, y, radiusX, radiusY, startAngle, endAngle) {
    Sk.builtin.pyCheckArgsLen("arc", arguments.length, 6, 6);
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    radiusX = Sk.ffi.remapToJs(radiusX);
    radiusY = Sk.ffi.remapToJs(radiusY);
    startAngle = Sk.ffi.remapToJs(startAngle);
    endAngle = Sk.ffi.remapToJs(endAngle);
    if (Sk.ffi.remapToJs(Sk.builtins._circleMode) === 1) {
        x = x + radiusX;
        y = y + radiusY;
    }
    // Convert to radians if in degrees
    if (Sk.ffi.remapToJs(Sk.builtins._angleModeValue) != 1) {
        startAngle = Sk.ffi.remapToJs(Sk.builtins.PI)/180 * startAngle;
        endAngle = Sk.ffi.remapToJs(Sk.builtins.PI)/180 * endAngle;
    }
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.ellipse(x, y, radiusX, radiusY, 0, startAngle, endAngle);
    if (Sk.ffi.remapToJs(Sk.builtins._doStroke) === true) {
        Sk.PyAngelo.ctx.stroke();
    }
    if (Sk.ffi.remapToJs(Sk.builtins._doFill) === true) {
        Sk.PyAngelo.ctx.fill();
    }
};

Sk.builtin.triangle = function triangle(x1, y1, x2, y2, x3, y3) {
    Sk.builtin.pyCheckArgsLen("triangle", arguments.length, 6, 6);
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.moveTo(x1, y1);
    Sk.PyAngelo.ctx.lineTo(x2, y2);
    Sk.PyAngelo.ctx.lineTo(x3, y3);
    Sk.PyAngelo.ctx.closePath();
    if (Sk.ffi.remapToJs(Sk.builtins._doStroke) === true) {
        Sk.PyAngelo.ctx.stroke();
    }
    if (Sk.ffi.remapToJs(Sk.builtins._doFill) === true) {
        Sk.PyAngelo.ctx.fill();
    }
};

Sk.builtin.quad = function quad(x1, y1, x2, y2, x3, y3, x4, y4) {
    Sk.builtin.pyCheckArgsLen("quad", arguments.length, 8, 8);
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.moveTo(x1, y1);
    Sk.PyAngelo.ctx.lineTo(x2, y2);
    Sk.PyAngelo.ctx.lineTo(x3, y3);
    Sk.PyAngelo.ctx.lineTo(x4, y4);
    Sk.PyAngelo.ctx.closePath();
    if (Sk.ffi.remapToJs(Sk.builtins._doStroke) === true) {
        Sk.PyAngelo.ctx.stroke();
    }
    if (Sk.ffi.remapToJs(Sk.builtins._doFill) === true) {
        Sk.PyAngelo.ctx.fill();
    }
};

Sk.builtin.point = function point(x, y) {
    Sk.builtin.pyCheckArgsLen("point", arguments.length, 2, 2);
    if (Sk.ffi.remapToJs(Sk.builtins._doStroke) === true) {
        const s = Sk.PyAngelo.ctx.strokeStyle;
        const f = Sk.PyAngelo.ctx.fillStyle;
        Sk.PyAngelo.ctx.fillStyle = s;
        Sk.PyAngelo.ctx.beginPath();
        if (Sk.PyAngelo.ctx.lineWidth > 1) {
            Sk.PyAngelo.ctx.arc(x, y, Sk.PyAngelo.ctx.lineWidth / 2, 0, Sk.ffi.remapToJs(Sk.builtins.TWO_PI));
        } else {
            Sk.builtin.rect(x, y, 1, 1);
        }
        if (Sk.ffi.remapToJs(Sk.builtins._doStroke) === true) {
            Sk.PyAngelo.ctx.stroke();
        }
    }
};

Sk.builtin.rect = function rect(x, y, w, h) {
    Sk.builtin.pyCheckArgsLen("rect", arguments.length, 4, 4);
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    w = Sk.ffi.remapToJs(w);
    h = Sk.ffi.remapToJs(h);

    if (Sk.ffi.remapToJs(Sk.builtins._rectMode) == 2) {
        w = w - x;
        h = h - y;
    } else if (Sk.ffi.remapToJs(Sk.builtins._rectMode) == 3) {
        x = x - w * 0.5;
        y = y - h * 0.5;
    }
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.rect(x, y, w, h);
    if (Sk.ffi.remapToJs(Sk.builtins._doStroke) === true) {
        Sk.PyAngelo.ctx.stroke();
    }
    if (Sk.ffi.remapToJs(Sk.builtins._doFill) === true) {
        Sk.PyAngelo.ctx.fill();
    }
};

Sk.builtin.beginShape = function beginShape() {
    Sk.builtins._vertex = [];
};

Sk.builtin.vertex = function vertex(x, y) {
    Sk.builtin.pyCheckArgsLen("vertex", arguments.length, 2, 2);
    Sk.builtins._vertex.push([x, y]);
};

Sk.builtin.endShape = function endShape(mode) {
    Sk.builtin.pyCheckArgsLen("endShape", arguments.length, 0, 1);
    if (Sk.builtins._vertex.length == 0) {
        return;
    } else if (Sk.builtins._vertex.length == 1) {
        Sk.builtin.point(Sk.builtins._vertex[0][0], Sk.builtins._vertex[0][1]);
        return;
    }
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.moveTo(Sk.builtins._vertex[0][0], Sk.builtins._vertex[0][1]);
    let vLen = Sk.builtins._vertex.length;
    for (let i = 1; i < vLen; i++) {
        Sk.PyAngelo.ctx.lineTo(Sk.builtins._vertex[i][0], Sk.builtins._vertex[i][1]);
    }
    if (Sk.ffi.remapToJs(mode) === 1) {
        Sk.PyAngelo.ctx.closePath();
    }
    if (Sk.ffi.remapToJs(Sk.builtins._doStroke) === true) {
        Sk.PyAngelo.ctx.stroke();
    }
    if (Sk.ffi.remapToJs(Sk.builtins._doFill) === true) {
        Sk.PyAngelo.ctx.fill();
    }
    Sk.builtins._vertex = [];
};

Sk.builtin.loadImage = function loadImage(file) {
    Sk.builtin.pyCheckArgsLen("loadImage", arguments.length, 1, 1);
    let prom = new Promise(function (resolve, reject) {
        let img = new Image();
        img.onload = function(e) {
            Sk.PyAngelo.images[e.target.file] = e.target;
            resolve(e.target.file);
        };
        img.onerror = function(e) {
            reject(Error("Check your have uploaded the file " + e.target.file + " to your sketch. The line number error that follows is not accurate"));
        };
        img.file = file;
        img.src = file;
    });
    let susp = new Sk.misceval.Suspension();

    susp.resume = function() {
        if (susp.data.error) {
            throw new Sk.builtin.IOError(susp.data["error"].message);
            // throw susp.data.error;
        }

        return susp.data.result;
    };

    susp.data = {
        type: "Sk.promise",
        promise: prom
    };

    return susp;
};

Sk.builtin.image = function image(image, x, y, width, height, opacity) {
    Sk.builtin.pyCheckArgsLen("image", arguments.length, 3, 6);
    image = Sk.ffi.remapToJs(image);
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    width = Sk.ffi.remapToJs(width);
    height = Sk.ffi.remapToJs(height);
    opacity = Sk.ffi.remapToJs(opacity);

    if (Sk.PyAngelo.images[image] === undefined) {
        throw new Sk.builtin.IOError("Image " + image + " has not been loaded");
    }

    if (width === null) {
        width = Sk.PyAngelo.images[image].naturalWidth;
    }
    if (height === null) {
        height = Sk.PyAngelo.images[image].naturalHeight;
    }

    let ga = Sk.PyAngelo.ctx.globalAlpha;
    if (opacity !== null) {
        if (opacity > 1.0) {
            opacity = 1.0;
        } else if (opacity < 0.0) {
            opacity = 0.0;
        }
        Sk.PyAngelo.ctx.globalAlpha = opacity;
    }
    if (Sk.ffi.remapToJs(Sk.builtins._yAxisMode) === 1) {
        Sk.PyAngelo.ctx.save();
        Sk.PyAngelo.ctx.translate(x, y);
        Sk.PyAngelo.ctx.transform(1, 0, 0, -1, 0, height);
        Sk.PyAngelo.ctx.drawImage(Sk.PyAngelo.images[image], 0, 0, width, height);
        Sk.PyAngelo.ctx.restore();
    } else {
        Sk.PyAngelo.ctx.drawImage(Sk.PyAngelo.images[image], x, y, width, height);
    }
    Sk.PyAngelo.ctx.globalAlpha = ga;
};

Sk.builtin._getImageHeight = function _getImageHeight(image) {
    Sk.builtin.pyCheckArgsLen("_getImageHeight", arguments.length, 1, 1);
    return Sk.ffi.remapToPy(Sk.PyAngelo.images[image].naturalHeight);
};

Sk.builtin._getImageWidth = function _getImageWidth(image) {
    Sk.builtin.pyCheckArgsLen("_getImageWidth", arguments.length, 1, 1);
    return Sk.ffi.remapToPy(Sk.PyAngelo.images[image].naturalWidth);
};

Sk.builtin._getFont = function _getFont() {
    return Sk.ffi.remapToPy(Sk.PyAngelo.ctx.font);
};

Sk.builtin._setFont = function _setFont(font) {
    Sk.builtin.pyCheckArgsLen("_setFont", arguments.length, 1, 1);
    font = Sk.ffi.remapToJs(font);
    Sk.PyAngelo.ctx.font = font;
};

Sk.builtin._measureText = function _measureText(text) {
    Sk.builtin.pyCheckArgsLen("_measureText", arguments.length, 1, 1);
    Sk.PyAngelo.ctx.textBaseline = "top";
    let textMetrics = Sk.PyAngelo.ctx.measureText(Sk.ffi.remapToJs(text));
    return Sk.ffi.remapToPy(textMetrics);
};

Sk.builtin._getFillStyle = function _getFillStyle() {
    return Sk.ffi.remapToPy(Sk.PyAngelo.ctx.fillStyle);
};

Sk.builtin._setFillStyle = function _setFillStyle(style) {
    Sk.builtin.pyCheckArgsLen("_setFillStyle", arguments.length, 1, 1);
    style = Sk.ffi.remapToJs(style);
    Sk.PyAngelo.ctx.fillStyle = style;
};

Sk.builtin._getStrokeStyle = function _getStrokeStyle() {
    return Sk.ffi.remapToPy(Sk.PyAngelo.ctx.strokeStyle);
};

Sk.builtin._setStrokeStyle = function _setStrokeStyle(style) {
    Sk.builtin.pyCheckArgsLen("_setStrokeStyle", arguments.length, 1, 1);
    style = Sk.ffi.remapToJs(style);
    Sk.PyAngelo.ctx.strokeStyle = style;
};

Sk.builtin._getLineWidth = function _getLineWidth() {
    return Sk.ffi.remapToPy(Sk.PyAngelo.ctx.lineWidth);
};

Sk.builtin._setLineWidth = function _setLineWidth(width) {
    Sk.builtin.pyCheckArgsLen("_setLineWidth", arguments.length, 1, 1);
    width = Sk.ffi.remapToJs(width);
    Sk.PyAngelo.ctx.lineWidth = width;
};

Sk.builtin._getDoStroke = function _getDoStroke() {
    return Sk.ffi.remapToPy(Sk.builtins._doStroke);
};

Sk.builtin._setDoStroke = function _setDoStroke(value) {
    Sk.builtin.pyCheckArgsLen("_setDoStroke", arguments.length, 1, 1);
    value = Sk.ffi.remapToJs(value);
    if (value) {
        Sk.builtins._doStroke = Sk.builtin.bool.true$;
    } else {
        Sk.builtins._doStroke = Sk.builtin.bool.false$;
    }
};

Sk.builtin.loadSound = function loadSound(filename) {
    Sk.builtin.pyCheckArgsLen("loadSound", arguments.length, 1, 1);
    filename = Sk.ffi.remapToJs(filename);
    let sound = new Howl({"src": [filename]});
    Sk.PyAngelo.sounds[filename] = sound;

    return Sk.ffi.remapToPy(filename);
};

Sk.builtin.playSound = function playSound(sound, loop, volume) {
    Sk.builtin.pyCheckArgsLen("playSound", arguments.length, 1, 3);
    sound = Sk.ffi.remapToJs(sound);
    loop = Sk.ffi.remapToJs(loop);
    volume = Sk.ffi.remapToJs(volume);
    if (!Sk.PyAngelo.sounds.hasOwnProperty(sound)) {
        sound = Sk.ffi.remapToJs(Sk.misceval.callsim(Sk.builtin.loadSound, sound));
    }
    Sk.PyAngelo.sounds[sound].loop(loop);
    Sk.PyAngelo.sounds[sound].volume(volume);
    Sk.PyAngelo.sounds[sound].play();
};

Sk.builtin.stopSound = function stopSound(sound) {
    Sk.builtin.pyCheckArgsLen("stopSound", arguments.length, 1, 1);
    sound = Sk.ffi.remapToJs(sound);
    if (Sk.PyAngelo.sounds.hasOwnProperty(sound)) {
        Sk.PyAngelo.sounds[sound].stop();
    }
};

Sk.builtin.pauseSound = function pauseSound(sound) {
    Sk.builtin.pyCheckArgsLen("pauseSound", arguments.length, 1, 1);
    sound = Sk.ffi.remapToJs(sound);
    if (Sk.PyAngelo.sounds.hasOwnProperty(sound)) {
        Sk.PyAngelo.sounds[sound].pause();
    }
};

Sk.builtin.stopAllSounds = function stopAllSounds() {
    for (const sound in Sk.PyAngelo.sounds) {
        Sk.PyAngelo.sounds[sound].stop();
    }
};

Sk.builtin._getPixelColour = function _getPixelColour(x, y) {
    Sk.builtin.pyCheckArgsLen("_getPixelColour", arguments.length, 2, 2);
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    const pixel = Sk.PyAngelo.ctx.getImageData(x, y, 1, 1);
    return Sk.ffi.remapToPy(pixel.data);
};

Sk.builtin.isKeyPressed = function isKeyPressed(code) {
    Sk.builtin.pyCheckArgsLen("isKeyPressed", arguments.length, 1, 1);
    code = Sk.ffi.remapToJs(code);
    if (!Sk.PyAngelo.keys.hasOwnProperty(code)) {
        return Sk.builtin.bool.false$;
    }
    return Sk.ffi.remapToPy(Sk.PyAngelo.keys[code]);
};

Sk.builtin.wasKeyPressed = function wasKeyPressed(code) {
    Sk.builtin.pyCheckArgsLen("wasKeyPressed", arguments.length, 1, 1);
    code = Sk.ffi.remapToJs(code);
    if (!Sk.PyAngelo.keyWasPressed.hasOwnProperty(code)) {
        return Sk.builtin.bool.false$;
    } else if (Sk.PyAngelo.keyWasPressed[code]) {
        Sk.PyAngelo.keyWasPressed[code] = false;
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.bool.false$;
    }
};

Sk.builtin.dist = function dist(x1, y1, x2, y2) {
    Sk.builtin.pyCheckArgsLen("dist", arguments.length, 4, 4);
    x1 = Sk.ffi.remapToJs(x1);
    y1 = Sk.ffi.remapToJs(y1);
    x2 = Sk.ffi.remapToJs(x2);
    y2 = Sk.ffi.remapToJs(y2);
    return Sk.ffi.remapToPy(Math.sqrt((x2 - x1)**2 + (y2 - y1)**2));
};

Sk.builtin.setTextSize = function setTextSize(size) {
    Sk.builtin.pyCheckArgsLen("setTextSize", arguments.length, 1, 1);
    if (!Sk.builtin.checkInt(size)) {
        throw new Sk.builtin.TypeError("Size must be an integer");
    }
    size = Sk.ffi.remapToJs(size);
    if (size >= 8 && size <= 128) {
        Sk.PyAngelo.textSize = size + "px";
    }
};

function getRGB(colour) {
    switch(colour) {
        case Sk.builtins.YELLOW:
            return "rgba(181, 137, 0, 1)";
        case Sk.builtins.ORANGE:
            return "rgba(203, 75, 22, 1)";
        case Sk.builtins.RED:
            return "rgba(220, 50, 47, 1)";
        case Sk.builtins.MAGENTA:
            return "rgba(211, 54, 130, 1)";
        case Sk.builtins.VIOLET:
            return "rgba(108, 113, 196, 1)";
        case Sk.builtins.BLUE:
            return "rgba(38, 139, 210, 1)";
        case Sk.builtins.CYAN:
            return "rgba(42, 161, 152, 1)";
        case Sk.builtins.GREEN:
            return "rgba(133, 153, 0, 1)";
        case Sk.builtins.WHITE:
            return "rgba(253, 246, 227, 1)";
        // GREY and GRAY are equal to DEFAULT
        // and if an unknown value is passed
        // we will use the default gray
        default:
            return "rgba(147, 161, 161, 1)";
        case Sk.builtins.BLACK:
            return "rgba(0, 0, 0, 1)";
        case Sk.builtins.DRACULA_BACKGROUND:
            return "rgba(40, 42, 54, 1)";
        case Sk.builtins.DRACULA_CURRENT_LINE:
            return "rgba(68, 71, 90, 1)";
        case Sk.builtins.DRACULA_SELECTION:
            return "rgba(68, 71, 90, 1)";
        case Sk.builtins.DRACULA_FOREGROUND:
            return "rgba(248, 248, 242, 1)";
        case Sk.builtins.DRACULA_COMMENT:
            return "rgba(98, 114, 164, 1)";
        case Sk.builtins.DRACULA_CYAN:
            return "rgba(139, 233, 253, 1)";
        case Sk.builtins.DRACULA_GREEN:
            return "rgba(80, 250, 123, 1)";
        case Sk.builtins.DRACULA_ORANGE:
            return "rgba(255, 184, 108, 1)";
        case Sk.builtins.DRACULA_PINK:
            return "rgba(255, 121, 198, 1)";
        case Sk.builtins.DRACULA_PURPLE:
            return "rgba(189, 147, 249, 1)";
        case Sk.builtins.DRACULA_RED:
            return "rgba(255, 85, 85, 1)";
        case Sk.builtins.DRACULA_YELLOW:
            return "rgba(241, 250, 140, 1)";
    }
}

Sk.builtin.setTextColour = function setTextColour(colour) {
    Sk.builtin.pyCheckArgsLen("setTextColour", arguments.length, 1, 1);
    colour = Sk.ffi.remapToJs(colour);
    const rgb = getRGB(colour);
    Sk.PyAngelo.textColour = rgb;
};

Sk.builtin.setHighlightColour = function setHighlightColour(colour) {
    Sk.builtin.pyCheckArgsLen("setHighlightColour", arguments.length, 1, 1);
    colour = Sk.ffi.remapToJs(colour);
    const rgb = getRGB(colour);
    Sk.PyAngelo.highlightColour = rgb;
};

Sk.builtin.clear = function clear(colour) {
    Sk.builtin.pyCheckArgsLen("clear", arguments.length, 0, 1);
    Sk.PyAngelo.console.innerHTML = "";
    colour = Sk.ffi.remapToJs(colour);
    const rgb = getRGB(colour);
    Sk.PyAngelo.console.style.backgroundColor = rgb;
    Sk.PyAngelo.highlightColour = rgb;
};

Sk.builtin.sleep = function sleep(delay) {
    Sk.builtin.pyCheckArgsLen("sleep", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("delay", "float", Sk.builtin.checkNumber(delay));

    return new Sk.misceval.promiseToSuspension(new Promise(function(resolve) {
        Sk.setTimeout(function() {
            resolve(Sk.builtin.none.none$);
        }, Sk.ffi.remapToJs(delay)*1000);
    }));
};
