Sk.PyAngelo = {};
Sk.PyAngelo.images = {};
Sk.PyAngelo.keys = {};
Sk.PyAngelo.keyWasPressed = {};
Sk.PyAngelo.mouseWasPressed = false;
Sk.PyAngelo.sounds = {};
Sk.PyAngelo.fillStates = [];
Sk.PyAngelo.strokeStates = [];

function convertYToCartesian(y) {
    return Sk.PyAngelo.canvas.height - y - 1;
}

Sk.builtin.setCanvasSize = function setCanvasSize(w, h, yAxisMode) {
    Sk.builtin.pyCheckArgsLen("setCanvasSize", arguments.length, 2, 3);
    Sk.builtin.pyCheckType("w", "integer", Sk.builtin.checkInt(w));
    Sk.builtin.pyCheckType("h", "integer", Sk.builtin.checkInt(h));
    Sk.builtin.pyCheckType("yAxisMode", "integer", Sk.builtin.checkInt(yAxisMode));

    // Update the global variables
    Sk.builtins.width = Sk.ffi.remapToPy(w);
    Sk.builtins.height = Sk.ffi.remapToPy(h);

    // Change the actual canvas
    Sk.PyAngelo.canvas.style.display = "block";
    Sk.PyAngelo.canvas.width = Sk.ffi.remapToJs(w);
    Sk.PyAngelo.canvas.height = Sk.ffi.remapToJs(h);
    Sk.PyAngelo.canvas.focus();

    // Set up the y axis
    yAxisMode = Sk.ffi.remapToJs(yAxisMode);
    if (yAxisMode === Sk.builtins.CARTESIAN) {
        Sk.PyAngelo.ctx.transform(1, 0, 0, -1, 0, h);
        Sk.PyAngelo.yAxisMode = yAxisMode;
    } else {
        Sk.PyAngelo.ctx.transform(1, 0, 0, 1, 0, 0);
        Sk.PyAngelo.yAxisMode = Sk.builtins.JAVASCRIPT;
    }
};

Sk.builtins["setCanvasSize"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.setCanvasSize,
        $name: "setCanvasSize",
        $flags: {
            NamedArgs: [null, null, "yAxisMode"],
            Defaults: [1],
        },
        $textsig: "($module, w, h, yAxisMode /)",
        $doc:
            "Sets the size of the canvas that all drawings are written to. The first parameter specifies the width in pixels and the second the height. The thrid parameter specifies the direction of the y axis. The constant CARTESIAN can be used to specify the y axis acts like a regular cartesian plane in maths, and JAVASCRIPT can be used to specify a traditional javascript y-axis that moves down the screen. The default value for yAxisMode is CARTESIAN.",
    },
    null,
    "builtins"
);

Sk.builtin.setConsoleSize = function setConsoleSize(size) {
    Sk.builtin.pyCheckArgsLen("setConsoleSize", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("size", "integer", Sk.builtin.checkInt(size));
    size = Sk.ffi.remapToJs(size);
    if (size >= 100 && size <= 2000) {
        Sk.PyAngelo.console.style.height = size + "px";
    } else {
        throw new Sk.builtin.TypeError("Size must be between 100 and 2000");
    }
};

Sk.builtins["setConsoleSize"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.setConsoleSize,
        $name: "setConsoleSize",
        $flags: { MinArgs: 1, MaxArgs: 1 },
        $textsig: "($module, size /)",
        $doc:
            "Sets the size of the console.",
    },
    null,
    "builtins"
);

Sk.builtin.noCanvas = function noCanvas() {
    // Change the actual canvas
    Sk.PyAngelo.canvas.style.display = "none";
    Sk.PyAngelo.canvas.width = 0;
    Sk.PyAngelo.canvas.height = 0;

    // Update the global variables
    Sk.builtins.width = Sk.ffi.remapToPy(0);
    Sk.builtins.height = Sk.ffi.remapToPy(0);
};

Sk.builtins["noCanvas"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.noCanvas,
        $name: "noCanvas",
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Hides the canvas.",
    },
    null,
    "builtins"
);

Sk.builtin.focusCanvas = function focusCanvas() {
    Sk.PyAngelo.canvas.focus();
};

Sk.builtins["focusCanvas"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.focusCanvas,
        $name: "focusCanvas",
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Places focus back on the canvas so it can receive keyboar events.",
    },
    null,
    "builtins"
);

Sk.builtin.background = function background(r, g, b, a) {
    Sk.builtin.pyCheckArgsLen("background", arguments.length, 0, 4);
    Sk.builtin.pyCheckType("r", "integer", Sk.builtin.checkInt(r));
    Sk.builtin.pyCheckType("g", "integer", Sk.builtin.checkInt(g));
    Sk.builtin.pyCheckType("b", "integer", Sk.builtin.checkInt(b));
    Sk.builtin.pyCheckType("a", "number", Sk.builtin.checkNumber(a));
    r = Sk.ffi.remapToJs(r);
    g = Sk.ffi.remapToJs(g);
    b = Sk.ffi.remapToJs(b);
    a = Sk.ffi.remapToJs(a);
    const fs = Sk.PyAngelo.ctx.fillStyle;
    Sk.PyAngelo.ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    Sk.PyAngelo.ctx.fillRect(0, 0, Sk.PyAngelo.canvas.width, Sk.PyAngelo.canvas.height);
    Sk.PyAngelo.ctx.fillStyle = fs;
};

Sk.builtins["background"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.background,
        $name: "background",
        $flags: {
            NamedArgs: ["r", "g", "b", "a"],
            Defaults: [220, 220, 220, 1],
        },
        $textsig: "($module, r, g, b, a /)",
        $doc:
            "Draws a rectangle the size of the canvas. The colour of the rectangle is specifed by the first three parameters representing an RGB colour. If a fourth parameter is passed it specifies an alpha value ranging from 0 to 1 where 0 is fully transparent and 1 specifies no transparency.",
    },
    null,
    "builtins"
);

Sk.builtin.text = function text(text, x, y, fontSize, fontName) {
    Sk.builtin.pyCheckArgsLen("text", arguments.length, 3, 5);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
    Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
    Sk.builtin.pyCheckType("fontSize", "int", Sk.builtin.checkInt(fontSize));
    text = Sk.ffi.remapToJs(text);
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    fontSize = Sk.ffi.remapToJs(fontSize);
    fontName = Sk.ffi.remapToJs(fontName);
    let fs = Sk.PyAngelo.ctx.font;
    Sk.PyAngelo.ctx.font = fontSize.toString() + "px " + fontName;
    Sk.PyAngelo.ctx.textBaseline = "top";
    if (Sk.PyAngelo.yAxisMode === Sk.builtins.CARTESIAN) {
        let textMetrics = Sk.PyAngelo.ctx.measureText(text, fontSize, fontName);
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

Sk.builtins["text"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.text,
        $name: "text",
        $flags: {
            NamedArgs: [null, null, null, "fontSize", "fontName"],
            Defaults: [20, "Arial"],
        },
        $textsig: "($module, text, x, y, fontSize, fontName /)",
        $doc:
            "Draws the specified text on the canvas at the postition (x, y). The text will have a default size of 20 and default font of Arial.",
    },
    null,
    "builtins"
);

Sk.builtin.saveState = function saveState() {
    Sk.PyAngelo.ctx.save();
    Sk.PyAngelo.fillStates.push(Sk.PyAngelo.doFill);
    Sk.PyAngelo.strokeStates.push(Sk.PyAngelo.doStroke);
};

Sk.builtins["saveState"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.saveState,
        $name: "saveState",
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Saves the current drawing style settings and transformations.",
    },
    null,
    "builtins"
);

Sk.builtin.restoreState = function restoreState() {
    Sk.PyAngelo.ctx.restore();
    if (Sk.PyAngelo.fillStates.length > 0)  { Sk.PyAngelo.doFill = Sk.PyAngelo.fillStates.pop(); }
    if (Sk.PyAngelo.strokeStates.length > 0) { Sk.PyAngelo.doStroke = Sk.PyAngelo.strokeStates.pop(); }
};

Sk.builtins["restoreState"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.restoreState,
        $name: "restoreState",
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Restores the latest version of the drawing style settings and transformations.",
    },
    null,
    "builtins"
);

Sk.builtin.translate = function translate(x, y) {
    Sk.builtin.pyCheckArgsLen("translate", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
    Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
    Sk.PyAngelo.ctx.translate(Sk.ffi.remapToJs(x), Sk.ffi.remapToJs(y));
};

Sk.builtins["translate"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.translate,
        $name: "translate",
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module, x, y /)",
        $doc:
            "Moves the position of the origin. The first parameter specifies the number of pixels along the x axis, and the second paramter specifies the number of pixels along the y axis. If tranlate is called twice, the effects are cumulative. So calling translate(10, 10) followed by translate(20, 20) is the same as calling translate(30, 30).",
    },
    null,
    "builtins"
);

Sk.builtin.angleMode = function angleMode(mode) {
    Sk.builtin.pyCheckArgsLen("angleMode", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("mode", "integer", Sk.builtin.checkInt(mode));
    let m = Sk.ffi.remapToJs(mode);
    if (m === Sk.builtins.RADIANS || m === Sk.builtins.DEGREES) {
        Sk.PyAngelo.angleModeValue = m;
    }
};

Sk.builtins["angleMode"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.angleMode,
        $name: "angleMode",
        $flags: { OneArg: true },
        $textsig: "($module, mode /)",
        $doc:
            "Specifies whether angles are supplied in radians or degrees.",
    },
    null,
    "builtins"
);

Sk.builtin.rectMode = function rectMode(mode) {
    Sk.builtin.pyCheckArgsLen("rectMode", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("mode", "integer", Sk.builtin.checkInt(mode));
    let m = Sk.ffi.remapToJs(mode);
    if (m === Sk.builtins.CORNER || m === Sk.builtins.CORNERS || m === Sk.builtins.CENTER) {
        Sk.PyAngelo.rectMode = m;
    }
};

Sk.builtins["rectMode"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.rectMode,
        $name: "rectMode",
        $flags: { OneArg: true },
        $textsig: "($module, mode /)",
        $doc:
            "Changes the way the rect() function uses the paramters passed to it.The default mode is CORNER, which indicates that the first two parameters are the coordinates of the top left corner, and the third and fourth parameters specify the width and the height. The mode CORNERS indicates the first two parameters are the coordinates of the top left corner, and the third and fourth specify the bottom right coordinates. The mode CENTER indicates the first two parameters are the coordinates of the center of the rectangle, and the third and fourth specify the width and height.",
    },
    null,
    "builtins"
);

Sk.builtin.circleMode = function circleMode(mode) {
    Sk.builtin.pyCheckArgsLen("circleMode", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("mode", "integer", Sk.builtin.checkInt(mode));
    let m = Sk.ffi.remapToJs(mode);
    if (m === Sk.builtins.CORNER || m === Sk.builtins.CENTER) {
        Sk.PyAngelo.circleMode = m;
    }
};

Sk.builtins["circleMode"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.circleMode,
        $name: "circleMode",
        $flags: { OneArg: true },
        $textsig: "($module, mode /)",
        $doc:
            "Changes the way the circle(), ellipse(), and arc() functions use the paramters passed to them. The default mode is CENTER, which indicates that the first two parameters are the coordinates of the center of the shape. The remaining parameters refer to the radius for the circle() function, and the X radius and Y radius for the ellipse() and arc() functions. The mode CORNER indicates the first two parameters are the coordinates of the top left corner of the shape. The meaning of any extra parameters remain unchanged.",
    },
    null,
    "builtins"
);

function convertDegreesToRadians(degrees) {
    return Sk.ffi.remapToJs(Sk.builtins.PI)/180 * degrees;
}

Sk.builtin.rotate = function rotate(angle) {
    Sk.builtin.pyCheckArgsLen("rotate", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("angle", "number", Sk.builtin.checkNumber(angle));
    let a = Sk.ffi.remapToJs(angle);
    if (Sk.PyAngelo.angleModeValue == Sk.builtins.DEGREES) {
        a = convertDegreesToRadians(a);
    }
    Sk.PyAngelo.ctx.rotate(a);
};


Sk.builtins["rotate"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.rotate,
        $name: "rotate",
        $flags: { OneArg: true },
        $textsig: "($module, angle /)",
        $doc:
            "Rotates the shape by the angle specified in the only parameter. By default, the angle is in degrees. This can be changed to radians by using the angleMode() function.",
    },
    null,
    "builtins"
);

Sk.builtin.applyMatrix = function applyMatrix(a, b, c, d, e, f) {
    Sk.PyAngelo.ctx.transform(Sk.ffi.remapToJs(a), Sk.ffi.remapToJs(b), Sk.ffi.remapToJs(c), Sk.ffi.remapToJs(d), Sk.ffi.remapToJs(e), Sk.ffi.remapToJs(f));
};

Sk.builtins["applyMatrix"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.applyMatrix,
        $name: "applyMatrix",
        $flags: { MinArgs: 6, MaxArgs: 6 },
        $textsig: "($module, a, b, c, d, e, f /)",
        $doc:
            "The applyMatrix() method lets you scale, rotate, move, and skew the current context.",
    },
    null,
    "builtins"
);

Sk.builtin.shearX = function shearX(angle) {
    Sk.builtin.pyCheckArgsLen("shearX", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("angle", "number", Sk.builtin.checkNumber(angle));
    let a = Sk.ffi.remapToJs(angle);
    if (Sk.PyAngelo.angleModeValue == Sk.builtins.DEGREES) {
        a = convertDegreesToRadians(a);
    }
    Sk.PyAngelo.ctx.transform(1, 0, Math.tan(a), 1, 0, 0);
};

Sk.builtins["shearX"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.shearX,
        $name: "shearX",
        $flags: { OneArg: true },
        $textsig: "($module, angle /)",
        $doc:
            "Skews the shape around the x-axis by the angle specified in the only parameter. By default, the angle is in degrees. This can be changed to radians by using the angleMode() function. The skew is relative to the origin.",
    },
    null,
    "builtins"
);

Sk.builtin.shearY = function shearY(angle) {
    Sk.builtin.pyCheckArgsLen("shearY", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("angle", "number", Sk.builtin.checkNumber(angle));
    let a = Sk.ffi.remapToJs(angle);
    if (Sk.PyAngelo.angleModeValue == Sk.builtins.DEGREES) {
        a = convertDegreesToRadians(a);
    }
    Sk.PyAngelo.ctx.transform(1, Math.tan(a), 0, 1, 0, 0);
};

Sk.builtins["shearY"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.shearY,
        $name: "shearY",
        $flags: { OneArg: true },
        $textsig: "($module, angle /)",
        $doc:
            "Skews the shape around the y-axis by the angle specified in the only parameter. By default, the angle is in degrees. This can be changed to radians by using the angleMode() function. The skew is relative to the origin.",
    },
    null,
    "builtins"
);

Sk.builtin.strokeWeight = function strokeWeight(weight) {
    Sk.builtin.pyCheckArgsLen("strokeWeight", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("weight", "number", Sk.builtin.checkNumber(weight));
    Sk.PyAngelo.ctx.lineWidth = Sk.ffi.remapToJs(weight);
};

Sk.builtins["strokeWeight"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.strokeWeight,
        $name: "strokeWeight",
        $flags: { OneArg: true },
        $textsig: "($module, weight /)",
        $doc:
            "Sets the width of any lines, points and the border around shapes. All widths are specified in pixels.",
    },
    null,
    "builtins"
);

Sk.builtin.fill = function fill(r, g, b, a) {
    Sk.builtin.pyCheckArgsLen("fill", arguments.length, 0, 4);
    Sk.builtin.pyCheckType("r", "integer", Sk.builtin.checkInt(r));
    Sk.builtin.pyCheckType("g", "integer", Sk.builtin.checkInt(g));
    Sk.builtin.pyCheckType("b", "integer", Sk.builtin.checkInt(b));
    Sk.builtin.pyCheckType("a", "number", Sk.builtin.checkNumber(a));
    Sk.PyAngelo.ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    Sk.PyAngelo.doFill = true;
};

Sk.builtins["fill"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.fill,
        $name: "fill",
        $flags: {
            NamedArgs: ["r", "g", "b", "a"],
            Defaults: [255, 255, 255, 1],
        },
        $textsig: "($module, r, g, b, a /)",
        $doc:
            "Sets the colour used to fill shapes. The colour is specified using the RGB colour scheme. The first parameter represents the amount of red, the second the amount of green, and the third the amount of blue in the colour. If a fourth parameter is passed it represents the alpha value ranging from 0 to 1.",
    },
    null,
    "builtins"
);

Sk.builtin.noFill = function noFill() {
    Sk.PyAngelo.doFill = false;
};

Sk.builtins["noFill"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.noFill,
        $name: "noFill",
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Specifies that shapes should not be filled when drawn. If both noStroke() and noFill() are called then nothing will be drawn to the screen.",
    },
    null,
    "builtins"
);

Sk.builtin.stroke = function stroke(r, g, b, a) {
    Sk.builtin.pyCheckArgsLen("stroke", arguments.length, 0, 4);
    Sk.builtin.pyCheckType("r", "integer", Sk.builtin.checkInt(r));
    Sk.builtin.pyCheckType("g", "integer", Sk.builtin.checkInt(g));
    Sk.builtin.pyCheckType("b", "integer", Sk.builtin.checkInt(b));
    Sk.builtin.pyCheckType("a", "number", Sk.builtin.checkNumber(a));
    Sk.PyAngelo.ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    Sk.PyAngelo.doStroke = true;
};

Sk.builtins["stroke"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.stroke,
        $name: "stroke",
        $flags: {
            NamedArgs: ["r", "g", "b", "a"],
            Defaults: [0, 0, 0, 1],
        },
        $textsig: "($module, r, g, b, a /)",
        $doc:
            "Sets the colour used to draw points, lines, and the border around shapes. The colour is specified using the RGB colour scheme. The first parameter represents the amount of red, the second the amount of green, and the third the amount of blue in the colour. If a fourth parameter is passed it represents the alpha value ranging from 0 to 1.",
    },
    null,
    "builtins"
);

Sk.builtin.noStroke = function noStroke() {
    Sk.PyAngelo.doStroke = false;
};

Sk.builtins["noStroke"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.noStroke,
        $name: "noStroke",
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Specifies that no stroke should be drawn for points, lines, and borders. If both noStroke() and noFill() are called then nothing will be drawn to the screen.",
    },
    null,
    "builtins"
);

function applyFill() {
    if (Sk.PyAngelo.doFill === true) {
        Sk.PyAngelo.ctx.fill();
    }
}

function applyStroke() {
    if (Sk.PyAngelo.doStroke === true) {
        Sk.PyAngelo.ctx.stroke();
    }
}

function applyFillAndStroke() {
    applyFill();
    applyStroke();
}

Sk.builtin.line = function line(x1, y1, x2, y2) {
    Sk.builtin.pyCheckArgsLen("line", arguments.length, 4, 4);
    Sk.builtin.pyCheckType("x1", "number", Sk.builtin.checkNumber(x1));
    Sk.builtin.pyCheckType("y1", "number", Sk.builtin.checkNumber(y1));
    Sk.builtin.pyCheckType("x2", "number", Sk.builtin.checkNumber(x2));
    Sk.builtin.pyCheckType("y2", "number", Sk.builtin.checkNumber(y2));
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.moveTo(x1, y1);
    Sk.PyAngelo.ctx.lineTo(x2, y2);
    applyStroke();
};

Sk.builtins["line"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.line,
        $name: "line",
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module x1, y1, x2, y2 /)",
        $doc:
            "Draws an line between two points to the screen. By default the line has a width of a single pixel. This can be modified by the strokeWeight() function. The colour of a line can be changed by calling the stroke() function.",
    },
    null,
    "builtins"
);

Sk.builtin.circle = function circle(x, y, radius) {
    Sk.builtin.pyCheckArgsLen("circle", arguments.length, 3, 3);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
    Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
    Sk.builtin.pyCheckType("radius", "number", Sk.builtin.checkNumber(radius));
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    radius = Sk.ffi.remapToJs(radius);
    if (Sk.PyAngelo.circleMode === Sk.builtins.CORNER) {
        x = x + radius;
        y = y + radius;
    }
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.arc(x, y, radius, 0, Sk.ffi.remapToJs(Sk.builtins.TWO_PI));
    applyFillAndStroke();
};

Sk.builtins["circle"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.circle,
        $name: "circle",
        $flags: { MinArgs: 3, MaxArgs: 3 },
        $textsig: "($module x, y, radius /)",
        $doc:
            "Draws a circle on the canvas. By default, the first two parameters set the location of the center of the circle, and the third sets the radius. The way these parameters are interpreted, may be changed with the circleMode() function.",
    },
    null,
    "builtins"
);

Sk.builtin.ellipse = function ellipse(x, y, radiusX, radiusY) {
    Sk.builtin.pyCheckArgsLen("ellipse", arguments.length, 4, 4);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
    Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
    Sk.builtin.pyCheckType("radiusX", "number", Sk.builtin.checkNumber(radiusX));
    Sk.builtin.pyCheckType("radiusY", "number", Sk.builtin.checkNumber(radiusY));
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    radiusX = Sk.ffi.remapToJs(radiusX);
    radiusY = Sk.ffi.remapToJs(radiusY);
    if (Sk.PyAngelo.circleMode === Sk.builtins.CORNER) {
        x = x + radiusX;
        y = y + radiusY;
    }
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Sk.ffi.remapToJs(Sk.builtins.TWO_PI));
    applyFillAndStroke();
};

Sk.builtins["ellipse"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.ellipse,
        $name: "ellipse",
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module x, y, radiusX, radiusY /)",
        $doc:
            "Draws an ellipse (oval) on the canvas. By default, the first two parameters set the location of the center of the circle, the third sets the X radius, and the fourth sets the Y radius. The way these parameters are interpreted, may be changed with the circleMode() function.",
    },
    null,
    "builtins"
);

Sk.builtin.arc = function arc(x, y, radiusX, radiusY, startAngle, endAngle) {
    Sk.builtin.pyCheckArgsLen("arc", arguments.length, 6, 6);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
    Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
    Sk.builtin.pyCheckType("radiusX", "number", Sk.builtin.checkNumber(radiusX));
    Sk.builtin.pyCheckType("radiusY", "number", Sk.builtin.checkNumber(radiusY));
    Sk.builtin.pyCheckType("startAngle", "number", Sk.builtin.checkNumber(startAngle));
    Sk.builtin.pyCheckType("endAngle", "number", Sk.builtin.checkNumber(endAngle));
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    radiusX = Sk.ffi.remapToJs(radiusX);
    radiusY = Sk.ffi.remapToJs(radiusY);
    startAngle = Sk.ffi.remapToJs(startAngle);
    endAngle = Sk.ffi.remapToJs(endAngle);
    if (Sk.PyAngelo.circleMode === Sk.builtins.CORNER) {
        x = x + radiusX;
        y = y + radiusY;
    }
    if (Sk.PyAngelo.angleModeValue == Sk.builtins.DEGREES) {
        startAngle = convertDegreesToRadians(startAngle);
        endAngle = convertDegreesToRadians(endAngle);
    }
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.ellipse(x, y, radiusX, radiusY, 0, startAngle, endAngle);
    applyFillAndStroke();
};

Sk.builtins["arc"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.arc,
        $name: "arc",
        $flags: { MinArgs: 6, MaxArgs: 6 },
        $textsig: "($module x, y, radiusX, radiusY, startAngle, endAngle /)",
        $doc:
            "Draws an arc (a portion of an ellipse) on the canvas. By default, the first two parameters set the location of the center of the circle, the third sets the X radius, and the fourth sets the Y radius. The fifth parameter is the start angle and the sixth is the end angle. The arc is always drawn clockwise from the start angle to the end angle. The way these parameters are interpreted, may be changed with the circleMode() function. By default the start and end angle are specified in degrees. This can be changed to radians with the angleMode() function.",
    },
    null,
    "builtins"
);

Sk.builtin.triangle = function triangle(x1, y1, x2, y2, x3, y3) {
    Sk.builtin.pyCheckArgsLen("triangle", arguments.length, 6, 6);
    Sk.builtin.pyCheckType("x1", "number", Sk.builtin.checkNumber(x1));
    Sk.builtin.pyCheckType("y1", "number", Sk.builtin.checkNumber(y1));
    Sk.builtin.pyCheckType("x2", "number", Sk.builtin.checkNumber(x2));
    Sk.builtin.pyCheckType("y2", "number", Sk.builtin.checkNumber(y2));
    Sk.builtin.pyCheckType("x3", "number", Sk.builtin.checkNumber(x3));
    Sk.builtin.pyCheckType("y3", "number", Sk.builtin.checkNumber(y3));
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.moveTo(x1, y1);
    Sk.PyAngelo.ctx.lineTo(x2, y2);
    Sk.PyAngelo.ctx.lineTo(x3, y3);
    Sk.PyAngelo.ctx.closePath();
    applyFillAndStroke();
};

Sk.builtins["triangle"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.triangle,
        $name: "triangle",
        $flags: { MinArgs: 6, MaxArgs: 6 },
        $textsig: "($module x1, y2, x2, y2, x3, y3 /)",
        $doc:
            "Draws a triangle on the canvas specified by three points.",
    },
    null,
    "builtins"
);

Sk.builtin.quad = function quad(x1, y1, x2, y2, x3, y3, x4, y4) {
    Sk.builtin.pyCheckArgsLen("quad", arguments.length, 8, 8);
    Sk.builtin.pyCheckType("x1", "number", Sk.builtin.checkNumber(x1));
    Sk.builtin.pyCheckType("y1", "number", Sk.builtin.checkNumber(y1));
    Sk.builtin.pyCheckType("x2", "number", Sk.builtin.checkNumber(x2));
    Sk.builtin.pyCheckType("y2", "number", Sk.builtin.checkNumber(y2));
    Sk.builtin.pyCheckType("x3", "number", Sk.builtin.checkNumber(x3));
    Sk.builtin.pyCheckType("y3", "number", Sk.builtin.checkNumber(y3));
    Sk.builtin.pyCheckType("x4", "number", Sk.builtin.checkNumber(x4));
    Sk.builtin.pyCheckType("y4", "number", Sk.builtin.checkNumber(y4));
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.moveTo(x1, y1);
    Sk.PyAngelo.ctx.lineTo(x2, y2);
    Sk.PyAngelo.ctx.lineTo(x3, y3);
    Sk.PyAngelo.ctx.lineTo(x4, y4);
    Sk.PyAngelo.ctx.closePath();
    applyFillAndStroke();
};

Sk.builtins["quad"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.quad,
        $name: "quad",
        $flags: { MinArgs: 8, MaxArgs: 8 },
        $textsig: "($module x1, y2, x2, y2, x3, y3, x4, y4 /)",
        $doc:
            "Draws a quadrilateral (a four sided polygon) on the canvas specified by four points.",
    },
    null,
    "builtins"
);

Sk.builtin.point = function point(x, y) {
    Sk.builtin.pyCheckArgsLen("point", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
    Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
    if (Sk.PyAngelo.doStroke === true) {
        const s = Sk.PyAngelo.ctx.strokeStyle;
        const f = Sk.PyAngelo.ctx.fillStyle;
        Sk.PyAngelo.ctx.fillStyle = s;
        Sk.PyAngelo.ctx.beginPath();
        if (Sk.PyAngelo.ctx.lineWidth > 1) {
            Sk.PyAngelo.ctx.arc(x, y, Sk.PyAngelo.ctx.lineWidth / 2, 0, Sk.ffi.remapToJs(Sk.builtins.TWO_PI));
        } else {
            Sk.builtin.rect(x, y, 1, 1);
        }
        applyFillAndStroke();
        Sk.PyAngelo.ctx.fillStyle = f;
    }
};

Sk.builtins["point"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.point,
        $name: "point",
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module x, y /)",
        $doc:
            "Draws a pixel to the screen at the position given by the two parameters. The first parameter specifies the x position and the second parameter specifies the y position. By default the pixel has a size of a one pixel. This can be modified by the strokeWeight() function. The colour of a point can be changed by calling the stroke() function.",
    },
    null,
    "builtins"
);

Sk.builtin.rect = function rect(x, y, w, h) {
    Sk.builtin.pyCheckArgsLen("rect", arguments.length, 4, 4);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
    Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
    Sk.builtin.pyCheckType("w", "number", Sk.builtin.checkNumber(w));
    Sk.builtin.pyCheckType("h", "number", Sk.builtin.checkNumber(h));
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    w = Sk.ffi.remapToJs(w);
    h = Sk.ffi.remapToJs(h);

    if (Sk.PyAngelo.rectMode === Sk.builtins.CORNERS) {
        w = w - x;
        h = h - y;
    } else if (Sk.PyAngelo.rectMode === Sk.builtins.CENTER) {
        x = x - w * 0.5;
        y = y - h * 0.5;
    }
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.rect(x, y, w, h);
    applyFillAndStroke();
};

Sk.builtins["rect"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.rect,
        $name: "rect",
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module x, y, w, h /)",
        $doc:
            "Draws a rectangle on the canvas. By default, the first two parameters set the location of the upper-left corner, the third sets the width, and the fourth sets the height. The way these parameters are interpreted, may be changed with the rectMode() function.",
    },
    null,
    "builtins"
);

Sk.builtin.beginShape = function beginShape() {
    Sk.PyAngelo.vertex = [];
};

Sk.builtins["beginShape"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.beginShape,
        $name: "beginShape",
        $flags: { NoArgs: true },
        $textsig: "($module x, y, w, h /)",
        $doc:
            "The beginShape(), vertex(), and endShape() functions allow you to create more complex shapes. The beginShape() function starts recording vertices that are added via the vertex() function.",
    },
    null,
    "builtins"
);

Sk.builtin.vertex = function vertex(x, y) {
    Sk.builtin.pyCheckArgsLen("vertex", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
    Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
    Sk.PyAngelo.vertex.push([x, y]);
};

Sk.builtins["vertex"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.vertex,
        $name: "vertex",
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module x, y /)",
        $doc:
            "The vertex() function adds a point to the list of vertices that will be connected when the endShape() function is called. It takes two parameters, the x and y coordinates of the vertex to add.",
    },
    null,
    "builtins"
);

Sk.builtin.endShape = function endShape(mode) {
    Sk.builtin.pyCheckArgsLen("endShape", arguments.length, 0, 1);
    Sk.builtin.pyCheckType("mode", "integer", Sk.builtin.checkInt(mode));
    if (Sk.PyAngelo.vertex.length == 0) {
        return;
    } else if (Sk.PyAngelo.vertex.length == 1) {
        Sk.builtin.point(Sk.PyAngelo.vertex[0][0], Sk.PyAngelo.vertex[0][1]);
        return;
    }
    Sk.PyAngelo.ctx.beginPath();
    Sk.PyAngelo.ctx.moveTo(Sk.PyAngelo.vertex[0][0], Sk.PyAngelo.vertex[0][1]);
    let vLen = Sk.PyAngelo.vertex.length;
    for (let i = 1; i < vLen; i++) {
        Sk.PyAngelo.ctx.lineTo(Sk.PyAngelo.vertex[i][0], Sk.PyAngelo.vertex[i][1]);
    }
    if (Sk.ffi.remapToJs(mode) === Sk.builtins.CLOSE) {
        Sk.PyAngelo.ctx.closePath();
    }
    applyFillAndStroke();
    Sk.PyAngelo.vertex = [];
};

Sk.builtins["endShape"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.endShape,
        $name: "endShape",
        $flags: {
            NamedArgs: ["mode"],
            Defaults: [1],
        },
        $textsig: "($module mode /)",
        $doc:
            "Draws a shape specified by the list of vertices added by calling beginShape() followed by any number of vertex() function calls. By default the entire shape is closed by linking the last vertex back to the first. This can be changed by passing the constant OPEN as a parameter.",
    },
    null,
    "builtins"
);

Sk.builtin.drawImage = function drawImage(image, x, y, width, height, opacity) {
    Sk.builtin.pyCheckArgsLen("image", arguments.length, 3, 6);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
    Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    width = Sk.ffi.remapToJs(width);
    height = Sk.ffi.remapToJs(height);
    opacity = Sk.ffi.remapToJs(opacity);
    const file = image["file"];

    if (!Sk.PyAngelo.images.hasOwnProperty(image["file"])) {
        throw new Sk.builtin.IOError("Image " + file + " has not been loaded");
    }

    if (width === null) {
        width = image["width"];
    }
    if (height === null) {
        height = image["height"];
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
    if (Sk.PyAngelo.yAxisMode === Sk.builtins.CARTESIAN) {
        Sk.PyAngelo.ctx.save();
        Sk.PyAngelo.ctx.translate(x, y);
        Sk.PyAngelo.ctx.transform(1, 0, 0, -1, 0, height);
        Sk.PyAngelo.ctx.drawImage(Sk.PyAngelo.images[file], 0, 0, width, height);
        Sk.PyAngelo.ctx.restore();
    } else {
        Sk.PyAngelo.ctx.drawImage(Sk.PyAngelo.images[file], x, y, width, height);
    }
    Sk.PyAngelo.ctx.globalAlpha = ga;
};

Sk.builtins["drawImage"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.drawImage,
        $name: "drawImage",
        $flags: {
            NamedArgs: [null, null, null, "width", "height", "opacity"],
            Defaults: [Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.none.none$],
        },
        $textsig: "($module image, x, y, width, height, opacity /)",
        $doc:
            "Draws an image on the canvas.",
    },
    null,
    "builtins"
);

Sk.builtin.measureText = function measureText(text, fontSize, fontName) {
    Sk.builtin.pyCheckArgsLen("measureText", arguments.length, 3, 3);
    Sk.builtin.pyCheckType("fontSize", "integer", Sk.builtin.checkInt(fontSize));
    Sk.builtin.pyCheckType("fontName", "string", Sk.builtin.checkString(fontName));
    text = Sk.ffi.remapToJs(text);
    fontSize = Sk.ffi.remapToJs(fontSize);
    fontName = Sk.ffi.remapToJs(fontName);
    Sk.PyAngelo.ctx.save();
    Sk.PyAngelo.ctx.font = fontSize.toString() + "px " + fontName;
    Sk.PyAngelo.ctx.textBaseline = "top";
    let textMetrics = Sk.PyAngelo.ctx.measureText(text);
    Sk.PyAngelo.ctx.restore();
    return Sk.ffi.remapToPy(textMetrics);
};

Sk.builtins["measureText"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.measureText,
        $name: "measureText",
        $flags: { MinArgs: 3, MaxArgs: 3 },
        $textsig: "($module text fontSize fontName /)",
        $doc:
            "Get the size of the text.",
    },
    null,
    "builtins"
);

Sk.builtin.loadSound = function loadSound(filename) {
    let susp;
    Sk.builtin.pyCheckArgsLen("loadSound", arguments.length, 1, 1);
    filename = Sk.ffi.remapToJs(filename);

    susp = new Sk.misceval.Suspension();
    susp.resume = function () {
        if (susp.data["error"]) {
            throw new Sk.builtin.IOError(susp.data["error"].message);
        }
        return susp.data.result;
    };
    susp.data = {
        type: "Sk.promise",
        promise: new Promise(function (resolve, reject) {
            let sound;
            sound = new Howl({
                "src": [filename],
                onloaderror: function () {
                    reject(Error("The sound could not be loaded. Check your have uploaded the sound " + filename + " to your sketch"));
                },
                onload: function () {
                    Sk.PyAngelo.sounds[filename] = sound;
                    resolve(Sk.ffi.remapToPy(filename));
                }
            });
        })
    };
    return susp;
};

Sk.builtins["loadSound"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.loadSound,
        $name: "loadSound",
        $flags: { OneArg: true },
        $textsig: "($module filename /)",
        $doc:
            "Loads a sound into memory.",
    },
    null,
    "builtins"
);

Sk.builtin.playSound = function playSound(sound, loop, volume) {
    Sk.builtin.pyCheckArgsLen("playSound", arguments.length, 1, 3);
    Sk.builtin.pyCheckType("sound", "string", Sk.builtin.checkString(sound));
    Sk.builtin.pyCheckType("loop", "bool", Sk.builtin.checkBool(loop));
    Sk.builtin.pyCheckType("volume", "number", Sk.builtin.checkNumber(volume));
    sound = Sk.ffi.remapToJs(sound);
    loop = Sk.ffi.remapToJs(loop);
    volume = Sk.ffi.remapToJs(volume);
    if (!Sk.PyAngelo.sounds.hasOwnProperty(sound)) {
        throw new Sk.builtin.IOError("Cannot play Sound " + sound + " as it has not been loaded");
    }
    Sk.PyAngelo.sounds[sound].loop(loop);
    Sk.PyAngelo.sounds[sound].volume(volume);
    Sk.PyAngelo.sounds[sound].play();
};

Sk.builtins["playSound"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.playSound,
        $name: "playSound",
        $flags: {
            NamedArgs: [null, "loop", "volume"],
            Defaults: [Sk.builtin.bool.false$, new Sk.builtin.float_(1.0)],
        },
        $textsig: "($module filename, loop, volume /)",
        $doc:
            "Plays a sound.",
    },
    null,
    "builtins"
);

Sk.builtin.stopSound = function stopSound(sound) {
    Sk.builtin.pyCheckArgsLen("stopSound", arguments.length, 1, 1);
    sound = Sk.ffi.remapToJs(sound);
    if (!Sk.PyAngelo.sounds.hasOwnProperty(sound)) {
        throw new Sk.builtin.IOError("Cannot stop Sound " + sound + " as it has not been loaded");
    }
    Sk.PyAngelo.sounds[sound].stop();
};

Sk.builtins["stopSound"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.stopSound,
        $name: "stopSound",
        $flags: { OneArg: true },
        $textsig: "($module sound /)",
        $doc:
            "Stops the sound from playing.",
    },
    null,
    "builtins"
);

Sk.builtin.pauseSound = function pauseSound(sound) {
    Sk.builtin.pyCheckArgsLen("pauseSound", arguments.length, 1, 1);
    sound = Sk.ffi.remapToJs(sound);
    if (!Sk.PyAngelo.sounds.hasOwnProperty(sound)) {
        throw new Sk.builtin.IOError("Cannot pause Sound " + sound + " as it has not been loaded");
    }
    Sk.PyAngelo.sounds[sound].pause();
};

Sk.builtins["pauseSound"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.pauseSound,
        $name: "pauseSound",
        $flags: { OneArg: true },
        $textsig: "($module sound /)",
        $doc:
            "Pauses the sound from playing.",
    },
    null,
    "builtins"
);

Sk.builtin.stopAllSounds = function stopAllSounds() {
    for (const sound in Sk.PyAngelo.sounds) {
        Sk.PyAngelo.sounds[sound].stop();
    }
};

Sk.builtins["stopAllSounds"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.stopAllSounds,
        $name: "stopAllSounds",
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Stops all sounds from playing.",
    },
    null,
    "builtins"
);

Sk.builtin.getPixelColour = function getPixelColour(x, y) {
    Sk.builtin.pyCheckArgsLen("getPixelColour", arguments.length, 2, 2);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
    Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    if (Sk.PyAngelo.yAxisMode == Sk.builtins.CARTESIAN) {
        y = convertYToCartesian(y);
    }
    const pixel = Sk.PyAngelo.ctx.getImageData(x, y, 1, 1);
    return Sk.misceval.callsimArray(
        Sk.builtins.Colour, [
            Sk.ffi.remapToPy(pixel.data["0"]),
            Sk.ffi.remapToPy(pixel.data["1"]),
            Sk.ffi.remapToPy(pixel.data["2"]),
            Sk.ffi.remapToPy(pixel.data["3"])
        ]
    );
};

Sk.builtins["getPixelColour"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.getPixelColour,
        $name: "getPixelColour",
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module x y /)",
        $doc:
            "Gets the pixel colour located at (x, y).",
    },
    null,
    "builtins"
);

Sk.builtin.isKeyPressed = function isKeyPressed(code) {
    Sk.builtin.pyCheckArgsLen("isKeyPressed", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("code", "string", Sk.builtin.checkString(code));
    code = Sk.ffi.remapToJs(code);
    if (!Sk.PyAngelo.keys.hasOwnProperty(code)) {
        return Sk.builtin.bool.false$;
    }
    return Sk.ffi.remapToPy(Sk.PyAngelo.keys[code]);
};

Sk.builtins["isKeyPressed"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.isKeyPressed,
        $name: "isKeyPressed",
        $flags: { OneArg: true },
        $textsig: "($module code /)",
        $doc:
            "Returns true or false depending if the key is currently pressed. The paramter should be the event.code value.",
    },
    null,
    "builtins"
);

Sk.builtin.wasKeyPressed = function wasKeyPressed(code) {
    Sk.builtin.pyCheckArgsLen("wasKeyPressed", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("code", "string", Sk.builtin.checkString(code));
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

Sk.builtins["wasKeyPressed"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.wasKeyPressed,
        $name: "wasKeyPressed",
        $flags: { OneArg: true },
        $textsig: "($module code /)",
        $doc:
            "Returns true or false depending if the key was pressed. This only returns true once per key press as opposed to isKeyPressed which stays true until the key is released.",
    },
    null,
    "builtins"
);

Sk.builtin.wasMousePressed = function wasMousePressed() {
    if (Sk.PyAngelo.mouseWasPressed) {
        Sk.PyAngelo.mouseWasPressed = false;
        return Sk.builtin.bool.true$;
    }
    return Sk.builtin.bool.false$;
};

Sk.builtins["wasMousePressed"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.wasMousePressed,
        $name: "wasMousePressed",
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Returns true or false depending if the mouse was pressed. This only returns true once per mouse press as opposed to the built-in variable mouseIsPressed which stays true until the mouse is released.",
    },
    null,
    "builtins"
);

Sk.builtin.setTextSize = function setTextSize(size) {
    Sk.builtin.pyCheckArgsLen("setTextSize", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("size", "integer", Sk.builtin.checkInt(size));
    size = Sk.ffi.remapToJs(size);
    if (size >= 8 && size <= 128) {
        Sk.PyAngelo.textSize = size + "px";
    } else {
        throw new Sk.builtin.TypeError("Size must be between 8 and 128");
    }
};

Sk.builtins["setTextSize"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.setTextSize,
        $name: "setTextSize",
        $flags: { OneArg: true },
        $textsig: "($module size /)",
        $doc:
            "Sets the text size used by print statements.",
    },
    null,
    "builtins"
);

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
    Sk.builtin.pyCheckType("colour", "integer", Sk.builtin.checkInt(colour));
    colour = Sk.ffi.remapToJs(colour);
    const rgb = getRGB(colour);
    Sk.PyAngelo.textColour = rgb;
};

Sk.builtins["setTextColour"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.setTextColour,
        $name: "setTextColour",
        $flags: { OneArg: true },
        $textsig: "($module colour /)",
        $doc:
            "Sets the text colour used by print statements.",
    },
    null,
    "builtins"
);

Sk.builtin.setHighlightColour = function setHighlightColour(colour) {
    Sk.builtin.pyCheckArgsLen("setHighlightColour", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("colour", "integer", Sk.builtin.checkInt(colour));
    colour = Sk.ffi.remapToJs(colour);
    const rgb = getRGB(colour);
    Sk.PyAngelo.highlightColour = rgb;
};

Sk.builtins["setHighlightColour"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.setHighlightColour,
        $name: "setHighlightColour",
        $flags: { OneArg: true },
        $textsig: "($module colour /)",
        $doc:
            "Sets the background colour used by print statements.",
    },
    null,
    "builtins"
);

Sk.builtin.clear = function clear(colour) {
    Sk.builtin.pyCheckArgsLen("clear", arguments.length, 0, 1);
    Sk.builtin.pyCheckType("colour", "integer", Sk.builtin.checkInt(colour));
    Sk.PyAngelo.console.innerHTML = "";
    colour = Sk.ffi.remapToJs(colour);
    const rgb = getRGB(colour);
    Sk.PyAngelo.console.style.backgroundColor = rgb;
    Sk.PyAngelo.highlightColour = rgb;
};

Sk.builtins["clear"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.clear,
        $name: "clear",
        $flags: {
            NamedArgs: ["colour"],
            Defaults: [11],
        },
        $textsig: "($module colour /)",
        $doc:
            "Clears the screen with the specified colour.",
    },
    null,
    "builtins"
);

Sk.builtin.sleep = function sleep(delay) {
    Sk.builtin.pyCheckArgsLen("sleep", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("delay", "float", Sk.builtin.checkNumber(delay));

    return new Sk.misceval.promiseToSuspension(new Promise(function(resolve) {
        Sk.setTimeout(function() {
            resolve(Sk.builtin.none.none$);
        }, Sk.ffi.remapToJs(delay)*1000);
    }));
};

Sk.builtins["sleep"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.sleep,
        $flags: { OneArg: true },
        $textsig: "($module delay /)",
        $doc:
            "Sleeps for the specified delay in seconds.",
    },
    null,
    "builtins"
);

Sk.builtin.constrain = function constrain(n, low, high) {
    Sk.builtin.pyCheckArgsLen("constrain", arguments.length, 3, 3);
    Sk.builtin.pyCheckType("n", "number", Sk.builtin.checkNumber(n));
    Sk.builtin.pyCheckType("low", "number", Sk.builtin.checkNumber(low));
    Sk.builtin.pyCheckType("high", "number", Sk.builtin.checkNumber(high));
    n = Sk.ffi.remapToJs(n);
    low = Sk.ffi.remapToJs(low);
    high = Sk.ffi.remapToJs(high);
    return Sk.ffi.remapToPy(Math.max(Math.min(n, high), low));
};

Sk.builtins["constrain"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.constrain,
        $flags: { MinArgs: 3, MaxArgs: 3 },
        $textsig: "($module, n, low, high /)",
        $doc:
            "Constrains a value between a minimum and maximum value.",
    },
    null,
    "builtins"
);

Sk.builtin.mapToRange = function mapToRange(n, start1, stop1, start2, stop2, withinBounds=false) {
    Sk.builtin.pyCheckArgsLen("mapToRange", arguments.length, 5, 6);
    Sk.builtin.pyCheckType("n", "number", Sk.builtin.checkNumber(n));
    Sk.builtin.pyCheckType("start1", "number", Sk.builtin.checkNumber(start1));
    Sk.builtin.pyCheckType("stop1", "number", Sk.builtin.checkNumber(stop1));
    Sk.builtin.pyCheckType("start2", "number", Sk.builtin.checkNumber(start2));
    Sk.builtin.pyCheckType("stop2", "number", Sk.builtin.checkNumber(stop2));
    Sk.builtin.pyCheckType("withinBounds", "bool", Sk.builtin.checkBool(withinBounds));
    n = Sk.ffi.remapToJs(n);
    start1 = Sk.ffi.remapToJs(start1);
    stop1 = Sk.ffi.remapToJs(stop1);
    start2 = Sk.ffi.remapToJs(start2);
    stop2 = Sk.ffi.remapToJs(stop2);
    withinBounds = Sk.ffi.remapToJs(withinBounds);

    const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    if (!withinBounds) {
        return Sk.ffi.remapToPy(newval);
    }
    if (start2 < stop2) {
        return Sk.ffi.remapToPy(Sk.builtin.constrain(newval, start2, stop2));
    } else {
        return Sk.ffi.remapToPy(Sk.builtin.constrain(newval, stop2, start2));
    }
};

Sk.builtins["mapToRange"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.mapToRange,
        $flags: {
            NamedArgs: [null, null, null, null, null, "withinBounds"],
            Defaults: [Sk.builtin.bool.false$],
        },
        $textsig: "($module, n, start1, stop1, start2, stop2, withinBounds /)",
        $doc:
            "Re-maps a number from one range to another.",
    },
    null,
    "builtins"
);

Sk.builtin.dist = function dist(x1, y1, x2, y2) {
    Sk.builtin.pyCheckArgsLen("dist", arguments.length, 4, 4);
    Sk.builtin.pyCheckType("x1", "number", Sk.builtin.checkNumber(x1));
    Sk.builtin.pyCheckType("y1", "number", Sk.builtin.checkNumber(y1));
    Sk.builtin.pyCheckType("x2", "number", Sk.builtin.checkNumber(x2));
    Sk.builtin.pyCheckType("y2", "number", Sk.builtin.checkNumber(y2));
    x1 = Sk.ffi.remapToJs(x1);
    y1 = Sk.ffi.remapToJs(y1);
    x2 = Sk.ffi.remapToJs(x2);
    y2 = Sk.ffi.remapToJs(y2);
    return Sk.ffi.remapToPy(Math.hypot(x2 - x1, y2 - y1));
};

Sk.builtins["dist"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.dist,
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module, x1, y1, x2, y2 /)",
        $doc:
            "Returns the distance between two points.",
    },
    null,
    "builtins"
);

Sk.builtin.say = function say(words) {
    Sk.builtin.pyCheckArgsLen("say", arguments.length, 1, 1);
    Sk.builtin.pyCheckType("words", "string", Sk.builtin.checkString(words));
    words = Sk.ffi.remapToJs(words);
    speechSynthesis.speak(new SpeechSynthesisUtterance(words));
};

Sk.builtins["say"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.say,
        $flags: { OneArg: true },
        $textsig: "($module, words /)",
        $doc:
            "Says the words using text to speech technology.",
    },
    null,
    "builtins"
);

// PyAngelo Classes
const initPoint = function (self, x, y) {
    Sk.builtin.pyCheckArgsLen("__init__", arguments.length, 1, 3);
    Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
    Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
    self.x = Sk.ffi.remapToJs(x);
    self.y = Sk.ffi.remapToJs(y);
};

initPoint.co_name = "initPoint";
initPoint.co_varnames = ["self", "x", "y"];
initPoint.$defaults = [null, new Sk.builtin.int_(0), new Sk.builtin.int_(0)];
initPoint.co_argcount = 3;

const pointClass = function ($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(initPoint);
    $loc.__repr__ = new Sk.builtin.func(function (self) {
        return new Sk.builtin.str("Point(" + self.x + ", " + self.y + ")");
    });
    $loc.__str__ = $loc.__repr__;

    // allow direct access to x/y properties
    $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
        key = Sk.ffi.remapToJs(key);
        if (key === "x") {
            return Sk.ffi.remapToPy(self.x);
        } else if (key === "y") {
            return Sk.ffi.remapToPy(self.y);
        }
    });
};
Sk.builtin.Point = pointClass;
Sk.builtins["Point"] = Sk.misceval.buildClass(Sk.builtin, Sk.builtin.Point, "Point", []);

const initColour = function (self, r, g, b, a) {
    Sk.builtin.pyCheckArgsLen("__init__", arguments.length, 1, 5);
    Sk.builtin.pyCheckType("r", "number", Sk.builtin.checkNumber(r));
    Sk.builtin.pyCheckType("g", "number", Sk.builtin.checkNumber(g));
    Sk.builtin.pyCheckType("b", "number", Sk.builtin.checkNumber(b));
    Sk.builtin.pyCheckType("a", "number", Sk.builtin.checkNumber(a));
    self.r = Sk.ffi.remapToJs(r);
    self.g = Sk.ffi.remapToJs(g);
    self.b = Sk.ffi.remapToJs(b);
    self.a = Sk.ffi.remapToJs(a);
};
initColour.co_name = "initColour";
initColour.co_varnames = ["self", "r", "g", "b", "a"];
initColour.$defaults = [
    null,
    new Sk.builtin.int_(255),
    new Sk.builtin.int_(255),
    new Sk.builtin.int_(255),
    new Sk.builtin.float_(1.0)
];
initColour.co_argcount = 5;

const colourClass = function ($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(initColour);
    $loc.__repr__ = new Sk.builtin.func(function (self) {
        return new Sk.builtin.str("Colour(" + self.r + ", " + self.g + ", " + self.b + ", " + self.a + ")");
    });
    $loc.__str__ = $loc.__repr__;

    // allow direct access to r, g, b, a properties
    $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
        key = Sk.ffi.remapToJs(key);
        if (key === "r") {
            return Sk.ffi.remapToPy(self.r);
        } else if (key === "g") {
            return Sk.ffi.remapToPy(self.g);
        } else if (key === "b") {
            return Sk.ffi.remapToPy(self.b);
        } else if (key === "a") {
            return Sk.ffi.remapToPy(self.a);
        }
    });
};
Sk.builtin.Colour = colourClass;
Sk.builtins["Colour"] = Sk.misceval.buildClass(Sk.builtin, Sk.builtin.Colour, "Colour", []);

const imageClass = function ($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function (self, file) {
        let susp;
        Sk.builtin.pyCheckArgsLen("__init__", arguments.length, 2, 2);

        susp = new Sk.misceval.Suspension();
        susp.resume = function () {
            if (susp.data["error"]) {
                throw new Sk.builtin.IOError(susp.data["error"].message);
            }
            return susp.data.result;
        };
        susp.data = {
            type: "Sk.promise",
            promise: new Promise(function (resolve, reject) {
                let newImg = new Image();
                newImg.onerror = function () {
                    reject(Error("Could not load the image. Check your have uploaded the file " + newImg.file + " to your sketch"));
                };
                newImg.onload = function () {
                    self.image = this;
                    self.width = this.naturalWidth;
                    self.height = this.naturalHeight;
                    self.file = this.file;
                    Sk.PyAngelo.images[this.file] = this;
                    resolve(Sk.builtin.none.none$);
                };
                file = Sk.ffi.remapToJs(file);
                newImg.src = file;
                newImg.file = file;
            })
        };
        return susp;
    });
    $loc.__repr__ = new Sk.builtin.func(function (self) {
        return new Sk.builtin.str("Image(" + self.file + ")");
    });
    $loc.__str__ = new Sk.builtin.func(function (self) {
        return new Sk.builtin.str("Image Object - file: " + self.file + ", width: " + self.width + ", height: " + self.height);
    });

    // allow direct access to height/width properties
    $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
        key = Sk.ffi.remapToJs(key);
        if (key === "height") {
            return Sk.ffi.remapToPy(self.height);
        } else if (key === "width") {
            return Sk.ffi.remapToPy(self.width);
        } else if (key === "file") {
            return Sk.ffi.remapToPy(self.file);
        }
    });

    // Add a draw(x, y) method
    $loc.draw = new Sk.builtin.func(function (self, x, y, width, height, opacity) {
        Sk.builtin.pyCheckArgsLen("draw", arguments.length, 3, 6);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
        x = Sk.ffi.remapToJs(x);
        y = Sk.ffi.remapToJs(y);
        width = (width === undefined || width === Sk.builtin.none.none$) ? self.width : Sk.ffi.remapToJs(width);
        height = (height === undefined || height === Sk.builtin.none.none$) ? self.height : Sk.ffi.remapToJs(height);
        opacity = (opacity === undefined || opacity === Sk.builtin.none.none$) ? 1.0 : Sk.ffi.remapToJs(opacity);

        const img = self.image;
        if (!img) {
            throw new Sk.builtin.RuntimeError("Image not loaded yet.");
        }

        if (width === null) {
            width = self.width;
        }
        if (height === null) {
            height = self.height;
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

        if (Sk.PyAngelo.yAxisMode === Sk.builtins.CARTESIAN) {
            Sk.PyAngelo.ctx.save();
            Sk.PyAngelo.ctx.translate(x, y);
            Sk.PyAngelo.ctx.transform(1, 0, 0, -1, 0, height);
            Sk.PyAngelo.ctx.drawImage(img, 0, 0, width, height);
            Sk.PyAngelo.ctx.restore();
        } else {
            Sk.PyAngelo.ctx.drawImage(img, x, y, width, height);
        }

        Sk.PyAngelo.ctx.globalAlpha = ga;

        return Sk.builtin.none.none$;
    });
};

Sk.builtin.Image = imageClass;
Sk.builtins["Image"] = Sk.misceval.buildClass(Sk.builtin, Sk.builtin.Image, "Image", []);
// Keep loadImage for backwards compatibility
Sk.builtins["loadImage"] = Sk.builtins["Image"];

// Functions for PyAngelo website
Sk.PyAngelo.reset = function() {
    // Maths
    Sk.builtins.QUARTER_PI = new Sk.builtin.float_(0.7853982);
    Sk.builtins.HALF_PI = new Sk.builtin.float_(1.57079632679489661923);
    Sk.builtins.PI = new Sk.builtin.float_(3.14159265358979323846);
    Sk.builtins.TWO_PI = new Sk.builtin.float_(6.28318530717958647693);
    Sk.builtins.TAU = new Sk.builtin.float_(6.28318530717958647693);

    // GLOBAL KEYS
    Sk.builtins.KEY_A = new Sk.builtin.str("KeyA");
    Sk.builtins.KEY_B = new Sk.builtin.str("KeyB");
    Sk.builtins.KEY_C = new Sk.builtin.str("KeyC");
    Sk.builtins.KEY_D = new Sk.builtin.str("KeyD");
    Sk.builtins.KEY_E = new Sk.builtin.str("KeyE");
    Sk.builtins.KEY_F = new Sk.builtin.str("KeyF");
    Sk.builtins.KEY_G = new Sk.builtin.str("KeyG");
    Sk.builtins.KEY_H = new Sk.builtin.str("KeyH");
    Sk.builtins.KEY_I = new Sk.builtin.str("KeyI");
    Sk.builtins.KEY_J = new Sk.builtin.str("KeyJ");
    Sk.builtins.KEY_K = new Sk.builtin.str("KeyK");
    Sk.builtins.KEY_L = new Sk.builtin.str("KeyL");
    Sk.builtins.KEY_M = new Sk.builtin.str("KeyM");
    Sk.builtins.KEY_N = new Sk.builtin.str("KeyN");
    Sk.builtins.KEY_O = new Sk.builtin.str("KeyO");
    Sk.builtins.KEY_P = new Sk.builtin.str("KeyP");
    Sk.builtins.KEY_Q = new Sk.builtin.str("KeyQ");
    Sk.builtins.KEY_R = new Sk.builtin.str("KeyR");
    Sk.builtins.KEY_S = new Sk.builtin.str("KeyS");
    Sk.builtins.KEY_T = new Sk.builtin.str("KeyT");
    Sk.builtins.KEY_U = new Sk.builtin.str("KeyU");
    Sk.builtins.KEY_V = new Sk.builtin.str("KeyV");
    Sk.builtins.KEY_W = new Sk.builtin.str("KeyW");
    Sk.builtins.KEY_X = new Sk.builtin.str("KeyX");
    Sk.builtins.KEY_Y = new Sk.builtin.str("KeyY");
    Sk.builtins.KEY_Z = new Sk.builtin.str("KeyZ");
    Sk.builtins.KEY_SPACE = new Sk.builtin.str("Space");
    Sk.builtins.KEY_ENTER = new Sk.builtin.str("Enter");
    Sk.builtins.KEY_ESC = new Sk.builtin.str("Escape");
    Sk.builtins.KEY_DEL = new Sk.builtin.str("Delete");
    Sk.builtins.KEY_BACKSPACE = new Sk.builtin.str("Backspace");
    Sk.builtins.KEY_TAB = new Sk.builtin.str("Tab");
    Sk.builtins.KEY_LEFT = new Sk.builtin.str("ArrowLeft");
    Sk.builtins.KEY_RIGHT = new Sk.builtin.str("ArrowRight");
    Sk.builtins.KEY_UP = new Sk.builtin.str("ArrowUp");
    Sk.builtins.KEY_DOWN = new Sk.builtin.str("ArrowDown");

    // Global Python Colours
    Sk.builtins.YELLOW = 0;
    Sk.builtins.ORANGE = 1;
    Sk.builtins.RED = 2;
    Sk.builtins.MAGENTA = 3;
    Sk.builtins.VIOLET = 4;
    Sk.builtins.BLUE = 5;
    Sk.builtins.CYAN = 6;
    Sk.builtins.GREEN = 7;
    Sk.builtins.WHITE = 8;
    Sk.builtins.GRAY = 9;
    Sk.builtins.GREY = 9;
    Sk.builtins.DEFAULT = 9;
    Sk.builtins.BLACK = 10;
    Sk.builtins.DRACULA_BACKGROUND = 11;
    Sk.builtins.DRACULA_CURRENT_LINE = 12;
    Sk.builtins.DRACULA_SELECTION = 13;
    Sk.builtins.DRACULA_FOREGROUND = 14;
    Sk.builtins.DRACULA_COMMENT = 15;
    Sk.builtins.DRACULA_CYAN = 16;
    Sk.builtins.DRACULA_GREEN = 17;
    Sk.builtins.DRACULA_ORANGE = 18;
    Sk.builtins.DRACULA_PINK = 19;
    Sk.builtins.DRACULA_PURPLE = 20;
    Sk.builtins.DRACULA_RED = 21;
    Sk.builtins.DRACULA_YELLOW = 22;

    // Used to set y axis mode
    Sk.builtins.CARTESIAN = 1;
    Sk.builtins.JAVASCRIPT = 2;
    // Used to set angle mode
    Sk.builtins.RADIANS = 1;
    Sk.builtins.DEGREES = 2;
    // Used for rect mode and circle mode
    Sk.builtins.CORNER = 1;
    Sk.builtins.CORNERS = 2;
    Sk.builtins.CENTER = 3;
    // Used for end shape
    Sk.builtins.CLOSE = 1;
    Sk.builtins.OPEN = 2;
    // Used for console height
    Sk.builtins.SMALL_SCREEN = new Sk.builtin.int_(300);
    Sk.builtins.MEDIUM_SCREEN = new Sk.builtin.int_(500);
    Sk.builtins.LARGE_SCREEN = new Sk.builtin.int_(1000);
    // Used for text size
    Sk.builtins.SMALL_FONT = new Sk.builtin.int_(8);
    Sk.builtins.MEDIUM_FONT = new Sk.builtin.int_(16);
    Sk.builtins.LARGE_FONT = new Sk.builtin.int_(24);

    // Default values for every call to runSkulpt
    Sk.PyAngelo.console.innerHTML = "";
    Sk.PyAngelo.console.style.backgroundColor = "rgba(40, 42, 54, 1)";
    Sk.PyAngelo.textSize = "16px";
    Sk.PyAngelo.textColour = "rgba(248, 248, 242, 1)";
    Sk.PyAngelo.highlightColour = "rgba(40, 42, 54, 1)";
    Sk.PyAngelo.keys = {};
    Sk.PyAngelo.keyWasPressed = {};
    Sk.PyAngelo.yAxisMode = Sk.builtins.JAVASCRIPT;
    Sk.PyAngelo.angleModeValue = Sk.builtins.DEGREES;
    Sk.PyAngelo.doFill = true;
    Sk.PyAngelo.doStroke = true;
    Sk.PyAngelo.rectMode = Sk.builtins.CORNER;
    Sk.PyAngelo.circleMode = Sk.builtins.CENTER;
    Sk.builtins.windowWidth = window.innerWidth - 15;
    Sk.builtins.windowHeight = window.innerHeight - 15;
    Sk.builtins.width = new Sk.builtin.int_(0);
    Sk.builtins.height = new Sk.builtin.int_(0);
    Sk.builtins.mouseX = new Sk.builtin.int_(0);
    Sk.builtins.mouseY = new Sk.builtin.int_(0);
    Sk.builtins.mouseIsPressed = Sk.builtin.bool.false$;
    Sk.PyAngelo.mouseWasPressed = false;
};

Sk.PyAngelo.preparePage = function() {
    Sk.PyAngelo.canvas = document.getElementById("canvas");
    Sk.PyAngelo.ctx = Sk.PyAngelo.canvas.getContext("2d");
    Sk.PyAngelo.console = document.getElementById("console");
    Sk.PyAngelo.canvas.addEventListener("keydown", _keydown);
    Sk.PyAngelo.canvas.addEventListener("keyup", _keyup);
    Sk.PyAngelo.canvas.addEventListener("mousemove", _canvasMouseMove);
    Sk.PyAngelo.canvas.addEventListener("mousedown", _canvasMouseDown);
    Sk.PyAngelo.canvas.addEventListener("mouseup", _canvasMouseUp);
    Sk.PyAngelo.console.addEventListener("mousedown", _focusInputElement);
    window.addEventListener("resize", _resizeWindowVars);

    // Add mouse handlers
    function _setMousePosition(ev) {
        const boundingRect = Sk.PyAngelo.canvas.getBoundingClientRect();
        Sk.builtins.mouseX = Sk.ffi.remapToPy(Math.round(ev.clientX - boundingRect.left));
        let y = Math.round(ev.clientY - boundingRect.top);
        if (Sk.PyAngelo.yAxisMode == Sk.builtins.CARTESIAN) {
            y = convertYToCartesian(y);
        }
        Sk.builtins.mouseY = Sk.ffi.remapToPy(y) ;
    }

    function _canvasMouseMove(ev) {
        ev.preventDefault();
        _setMousePosition(ev);
    }

    function _canvasMouseDown(ev) {
        ev.preventDefault();
        _setMousePosition(ev);
        Sk.builtins.mouseIsPressed = Sk.builtin.bool.true$;
        Sk.PyAngelo.mouseWasPressed = true;
        Sk.PyAngelo.canvas.focus();
    }

    function _canvasMouseUp(ev) {
        ev.preventDefault();
        _setMousePosition(ev);
        Sk.builtins.mouseIsPressed = Sk.builtin.bool.false$;
        Sk.PyAngelo.mouseWasPressed = false;
    }

    function _focusInputElement(ev) {
        let inputElement;
        if (inputElement = document.getElementById("inputElement")) {
            inputElement.focus();
            ev.preventDefault();
        }
    }

    function _keydown(ev) {
        ev.preventDefault();
        Sk.PyAngelo.keys[ev.code] = true;
        Sk.PyAngelo.keyWasPressed[ev.code] = true;
    }

    function _keyup(ev) {
        ev.preventDefault();
        Sk.PyAngelo.keys[ev.code] = false;
        Sk.PyAngelo.keyWasPressed[ev.code] = false;
    }

    function _resizeWindowVars(ev) {
        Sk.builtins.windowWidth = window.innerWidth - 15;
        Sk.builtins.windowHeight = window.innerHeight - 15;
    }

    Sk.PyAngelo.reset();
};
