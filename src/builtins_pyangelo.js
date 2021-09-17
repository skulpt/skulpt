Sk.builtins["setCanvasSize"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.setCanvasSize,
        $flags: {
            NamedArgs: [null, null, "yAxisMode"],
            Defaults: [new Sk.builtin.int_(2)],
        },
        $textsig: "($module, w, h, yAxisMode /)",
        $doc:
            "Sets the size of the canvas that all drawings are written to. The first parameter specifies the width in pixels and the second the height. The thrid parameter specifies the direction of the y axis. The constant CARTESIAN can be used to specify the y axis acts like a regular cartesian plane in maths, and JAVASCRIPT can be used to specify a traditional javascript y-axis that moves down the screen.",
    },
    null,
    "builtins"
);

Sk.builtins["setConsoleSize"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.setConsoleSize,
        $flags: { MinArgs: 1, MaxArgs: 1 },
        $textsig: "($module, size /)",
        $doc:
            "Sets the size of the console.",
    },
    null,
    "builtins"
);

Sk.builtins["noCanvas"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.noCanvas,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Hides the canvas.",
    },
    null,
    "builtins"
);

Sk.builtins["focusCanvas"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.focusCanvas,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Places focus back on the canvas so it can receive keyboar events.",
    },
    null,
    "builtins"
);

Sk.builtins["background"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.background,
        $flags: {
            NamedArgs: ["r", "g", "b", "a"],
            Defaults: [new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(1)],
        },
        $textsig: "($module, r, g, b, a /)",
        $doc:
            "Draws a rectangle the size of the canvas. The colour of the rectangle is specifed by the first three parameters representing an RGB colour. If a fourth parameter is passed it specifies an alpha value ranging from 0 to 1 where 0 is fully transparent and 1 specifies no transparency.",
    },
    null,
    "builtins"
);

Sk.builtins["text"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.text,
        $flags: {
            NamedArgs: [null, null, null, "fontSize", "fontName"],
            Defaults: [new Sk.builtin.int_(20), new Sk.builtin.str("Arial")],
        },
        $textsig: "($module, text, x, y, fontSize, fontName /)",
        $doc:
            "Draws the specified text on the canvas at the postition (x, y). The text will have a default size of 20 and default font of Arial.",
    },
    null,
    "builtins"
);

Sk.builtins["saveState"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.saveState,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Saves the current drawing style settings and transformations.",
    },
    null,
    "builtins"
);

Sk.builtins["restoreState"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.restoreState,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Restores the latest version of the drawing style settings and transformations.",
    },
    null,
    "builtins"
);

Sk.builtins["translate"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.translate,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module, x, y /)",
        $doc:
            "Moves the position of the origin. The first parameter specifies the number of pixels along the x axis, and the second paramter specifies the number of pixels along the y axis. If tranlate is called twice, the effects are cumulative. So calling translate(10, 10) followed by translate(20, 20) is the same as calling translate(30, 30).",
    },
    null,
    "builtins"
);

Sk.builtins["angleMode"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.angleMode,
        $flags: { OneArg: true },
        $textsig: "($module, mode /)",
        $doc:
            "Specifies whether angles are supplied in radians or degrees.",
    },
    null,
    "builtins"
);

Sk.builtins["rectMode"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.rectMode,
        $flags: { OneArg: true },
        $textsig: "($module, mode /)",
        $doc:
            "Changes the way the rect() function uses the paramters passed to it.The default mode is CORNER, which indicates that the first two parameters are the coordinates of the top left corner, and the third and fourth parameters specify the width and the height. The mode CORNERS indicates the first two parameters are the coordinates of the top left corner, and the third and fourth specify the bottom right coordinates. The mode CENTER indicates the first two parameters are the coordinates of the center of the rectangle, and the third and fourth specify the width and height.",
    },
    null,
    "builtins"
);

Sk.builtins["circleMode"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.circleMode,
        $flags: { OneArg: true },
        $textsig: "($module, mode /)",
        $doc:
            "Changes the way the circle(), ellipse(), and arc() functions use the paramters passed to them. The default mode is CENTER, which indicates that the first two parameters are the coordinates of the center of the shape. The remaining parameters refer to the radius for the circle() function, and the X radius and Y radius for the ellipse() and arc() functions. The mode CORNER indicates the first two parameters are the coordinates of the top left corner of the shape. The meaning of any extra parameters remain unchanged.",
    },
    null,
    "builtins"
);

Sk.builtins["rotate"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.rotate,
        $flags: { OneArg: true },
        $textsig: "($module, angle /)",
        $doc:
            "Rotates the shape by the angle specified in the only parameter. By default, the angle is in degrees. This can be changed to radians by using the angleMode() function.",
    },
    null,
    "builtins"
);

Sk.builtins["applyMatrix"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.applyMatrix,
        $flags: { MinArgs: 6, MaxArgs: 6 },
        $textsig: "($module, a, b, c, d, e, f /)",
        $doc:
            "The applyMatrix() method lets you scale, rotate, move, and skew the current context.",
    },
    null,
    "builtins"
);

Sk.builtins["shearX"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.shearX,
        $flags: { OneArg: true },
        $textsig: "($module, angle /)",
        $doc:
            "Skews the shape around the x-axis by the angle specified in the only parameter. By default, the angle is in degrees. This can be changed to radians by using the angleMode() function. The skew is relative to the origin.",
    },
    null,
    "builtins"
);

Sk.builtins["shearY"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.shearY,
        $flags: { OneArg: true },
        $textsig: "($module, angle /)",
        $doc:
            "Skews the shape around the y-axis by the angle specified in the only parameter. By default, the angle is in degrees. This can be changed to radians by using the angleMode() function. The skew is relative to the origin.",
    },
    null,
    "builtins"
);

Sk.builtins["strokeWeight"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.strokeWeight,
        $flags: { OneArg: true },
        $textsig: "($module, weight /)",
        $doc:
            "Sets the width of any lines, points and the border around shapes. All widths are specified in pixels.",
    },
    null,
    "builtins"
);

Sk.builtins["fill"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.fill,
        $flags: {
            NamedArgs: ["r", "g", "b", "a"],
            Defaults: [new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(1)],
        },
        $textsig: "($module, r, g, b, a /)",
        $doc:
            "Sets the colour used to fill shapes. The colour is specified using the RGB colour scheme. The first parameter represents the amount of red, the second the amount of green, and the third the amount of blue in the colour. If a fourth parameter is passed it represents the alpha value ranging from 0 to 1.",
    },
    null,
    "builtins"
);

Sk.builtins["noFill"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.noFill,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Specifies that shapes should not be filled when drawn. If both noStroke() and noFill() are called then nothing will be drawn to the screen.",
    },
    null,
    "builtins"
);

Sk.builtins["stroke"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.stroke,
        $flags: {
            NamedArgs: ["r", "g", "b", "a"],
            Defaults: [new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(1)],
        },
        $textsig: "($module, r, g, b, a /)",
        $doc:
            "Sets the colour used to draw points, lines, and the border around shapes. The colour is specified using the RGB colour scheme. The first parameter represents the amount of red, the second the amount of green, and the third the amount of blue in the colour. If a fourth parameter is passed it represents the alpha value ranging from 0 to 1.",
    },
    null,
    "builtins"
);

Sk.builtins["noStroke"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.noStroke,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Specifies that no stroke should be drawn for points, lines, and borders. If both noStroke() and noFill() are called then nothing will be drawn to the screen.",
    },
    null,
    "builtins"
);

Sk.builtins["line"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.line,
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module x1, y1, x2, y2 /)",
        $doc:
            "Draws an line between two points to the screen. By default the line has a width of a single pixel. This can be modified by the strokeWeight() function. The colour of a line can be changed by calling the stroke() function.",
    },
    null,
    "builtins"
);

Sk.builtins["circle"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.circle,
        $flags: { MinArgs: 3, MaxArgs: 3 },
        $textsig: "($module x, y, radius /)",
        $doc:
            "Draws a circle on the canvas. By default, the first two parameters set the location of the center of the circle, and the third sets the radius. The way these parameters are interpreted, may be changed with the circleMode() function.",
    },
    null,
    "builtins"
);

Sk.builtins["ellipse"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.ellipse,
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module x, y, radiusX, radiusY /)",
        $doc:
            "Draws an ellipse (oval) on the canvas. By default, the first two parameters set the location of the center of the circle, the third sets the X radius, and the fourth sets the Y radius. The way these parameters are interpreted, may be changed with the circleMode() function.",
    },
    null,
    "builtins"
);

Sk.builtins["arc"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.arc,
        $flags: { MinArgs: 6, MaxArgs: 6 },
        $textsig: "($module x, y, radiusX, radiusY, startAngle, endAngle /)",
        $doc:
            "Draws an arc (a portion of an ellipse) on the canvas. By default, the first two parameters set the location of the center of the circle, the third sets the X radius, and the fourth sets the Y radius. The fifth parameter is the start angle and the sixth is the end angle. The arc is always drawn clockwise from the start angle to the end angle. The way these parameters are interpreted, may be changed with the circleMode() function. By default the start and end angle are specified in degrees. This can be changed to radians with the angleMode() function.",
    },
    null,
    "builtins"
);

Sk.builtins["triangle"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.triangle,
        $flags: { MinArgs: 6, MaxArgs: 6 },
        $textsig: "($module x1, y2, x2, y2, x3, y3 /)",
        $doc:
            "Draws a triangle on the canvas specified by three points.",
    },
    null,
    "builtins"
);

Sk.builtins["quad"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.quad,
        $flags: { MinArgs: 8, MaxArgs: 8 },
        $textsig: "($module x1, y2, x2, y2, x3, y3, x4, y4 /)",
        $doc:
            "Draws a quadrilateral (a four sided polygon) on the canvas specified by four points.",
    },
    null,
    "builtins"
);

Sk.builtins["point"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.point,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module x, y /)",
        $doc:
            "Draws a pixel to the screen at the position given by the two parameters. The first parameter specifies the x position and the second parameter specifies the y position. By default the pixel has a size of a one pixel. This can be modified by the strokeWeight() function. The colour of a point can be changed by calling the stroke() function.",
    },
    null,
    "builtins"
);

Sk.builtins["rect"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.rect,
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module x, y, w, h /)",
        $doc:
            "Draws a rectangle on the canvas. By default, the first two parameters set the location of the upper-left corner, the third sets the width, and the fourth sets the height. The way these parameters are interpreted, may be changed with the rectMode() function.",
    },
    null,
    "builtins"
);

Sk.builtins["beginShape"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.beginShape,
        $flags: { NoArgs: true },
        $textsig: "($module x, y, w, h /)",
        $doc:
            "The beginShape(), vertex(), and endShape() functions allow you to create more complex shapes. The beginShape() function starts recording vertices that are added via the vertex() function.",
    },
    null,
    "builtins"
);

Sk.builtins["vertex"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.vertex,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module x, y /)",
        $doc:
            "The vertex() function adds a point to the list of vertices that will be connected when the endShape() function is called. It takes two parameters, the x and y coordinates of the vertex to add.",
    },
    null,
    "builtins"
);

Sk.builtins["endShape"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.endShape,
        $flags: {
            NamedArgs: ["mode"],
            Defaults: [new Sk.builtin.int_(1)],
        },
        $textsig: "($module mode /)",
        $doc:
            "Draws a shape specified by the list of vertices added by calling beginShape() followed by any number of vertex() function calls. By default the entire shape is closed by linking the last vertex back to the first. This can be changed by passing the constant OPEN as a parameter.",
    },
    null,
    "builtins"
);

Sk.builtins["loadImage"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.loadImage,
        $flags: { OneArg: true },
        $textsig: "($module file /)",
        $doc:
            "Returns an image loaded from a file.",
    },
    null,
    "builtins"
);

Sk.builtins["image"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.image,
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

Sk.builtins["_getImageHeight"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._getImageHeight,
        $flags: { OneArg: true },
        $textsig: "($module image /)",
        $doc:
            "Gets the natural height of an image.",
    },
    null,
    "builtins"
);

Sk.builtins["_getImageWidth"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._getImageWidth,
        $flags: { OneArg: true },
        $textsig: "($module image /)",
        $doc:
            "Gets the natural width of an image.",
    },
    null,
    "builtins"
);

Sk.builtins["_getFont"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._getFont,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Gets the current font for the Canvas.",
    },
    null,
    "builtins"
);

Sk.builtins["_setFont"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._setFont,
        $flags: { OneArg: true },
        $textsig: "($module font /)",
        $doc:
            "Sets the font for the Canvas.",
    },
    null,
    "builtins"
);

Sk.builtins["_measureText"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._measureText,
        $flags: { OneArg: true },
        $textsig: "($module text /)",
        $doc:
            "Get the size of the text.",
    },
    null,
    "builtins"
);

Sk.builtins["_getFillStyle"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._getFillStyle,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Gets the current fillStyle for the Canvas.",
    },
    null,
    "builtins"
);

Sk.builtins["_setFillStyle"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._setFillStyle,
        $flags: { OneArg: true },
        $textsig: "($module style /)",
        $doc:
            "Sets the fillStyle for the Canvas.",
    },
    null,
    "builtins"
);

Sk.builtins["_getStrokeStyle"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._getStrokeStyle,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Gets the current strokeStyle for the Canvas.",
    },
    null,
    "builtins"
);

Sk.builtins["_setStrokeStyle"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._setStrokeStyle,
        $flags: { OneArg: true },
        $textsig: "($module style /)",
        $doc:
            "Sets the fillStyle for the Canvas.",
    },
    null,
    "builtins"
);

Sk.builtins["_getLineWidth"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._getLineWidth,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Gets the current lineWidth for the Canvas.",
    },
    null,
    "builtins"
);

Sk.builtins["_setLineWidth"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._setLineWidth,
        $flags: { OneArg: true },
        $textsig: "($module width /)",
        $doc:
            "Sets the lineWidth for the Canvas.",
    },
    null,
    "builtins"
);

Sk.builtins["_getDoStroke"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._getDoStroke,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Returns true if a stroke should be applied, otherwise false.",
    },
    null,
    "builtins"
);

Sk.builtins["_setDoStroke"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._setDoStroke,
        $flags: { OneArg: true },
        $textsig: "($module value /)",
        $doc:
            "Sets whether or not to apply a stroke.",
    },
    null,
    "builtins"
);

Sk.builtins["loadSound"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.loadSound,
        $flags: { OneArg: true },
        $textsig: "($module filename, loop /)",
        $doc:
            "Loads a sound into memory.",
    },
    null,
    "builtins"
);

Sk.builtins["playSound"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.playSound,
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

Sk.builtins["stopSound"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.stopSound,
        $flags: { OneArg: true },
        $textsig: "($module sound /)",
        $doc:
            "Stops the sound from playing.",
    },
    null,
    "builtins"
);

Sk.builtins["pauseSound"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.pauseSound,
        $flags: { OneArg: true },
        $textsig: "($module sound /)",
        $doc:
            "Pauses the sound from playing.",
    },
    null,
    "builtins"
);

Sk.builtins["stopAllSounds"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.stopAllSounds,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Stops all sounds from playing.",
    },
    null,
    "builtins"
);

Sk.builtins["_getPixelColour"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin._getPixelColour,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module x, y /)",
        $doc:
            "Returns the rgba value of the pixel at position (x, y).",
    },
    null,
    "builtins"
);

Sk.builtins["isKeyPressed"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.isKeyPressed,
        $flags: { OneArg: true },
        $textsig: "($module code /)",
        $doc:
            "Returns true or false depending if the key is currently pressed.",
    },
    null,
    "builtins"
);

Sk.builtins["wasKeyPressed"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.wasKeyPressed,
        $flags: { OneArg: true },
        $textsig: "($module code /)",
        $doc:
            "Returns true or false depending if the key was pressed. This only returns true once per key press as opposed to isKeyPressed which stays true until the key is released.",
    },
    null,
    "builtins"
);

Sk.builtins["dist"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.dist,
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module x1, y1, x2, y2 /)",
        $doc:
            "Returns the distance between two points.",
    },
    null,
    "builtins"
);

Sk.builtins["setTextSize"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.setTextSize,
        $flags: { OneArg: true },
        $textsig: "($module size /)",
        $doc:
            "Sets the text size used by print statements.",
    },
    null,
    "builtins"
);

Sk.builtins["setTextColour"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.setTextColour,
        $flags: { OneArg: true },
        $textsig: "($module colour /)",
        $doc:
            "Sets the text colour used by print statements.",
    },
    null,
    "builtins"
);

Sk.builtins["setHighlightColour"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.setHighlightColour,
        $flags: { OneArg: true },
        $textsig: "($module colour /)",
        $doc:
            "Sets the background colour used by print statements.",
    },
    null,
    "builtins"
);

Sk.builtins["clear"] = new Sk.builtin.sk_method(
    {
        $meth: Sk.builtin.clear,
        $flags: {
            NamedArgs: ["colour"],
            // 10 is black as defined in pyangelo_globals.js
            Defaults: [new Sk.builtin.int_(10)],
        },
        $textsig: "($module colour /)",
        $doc:
            "Clears the screen with the specified colour.",
    },
    null,
    "builtins"
);

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

Sk.PyAngelo = {};
Sk.PyAngelo.images = {};
Sk.PyAngelo.keys = {};
Sk.PyAngelo.keyWasPressed = {};
Sk.PyAngelo.sounds = {};

// Setup global Python Variables
// Maths
Sk.builtins.QUARTER_PI = new Sk.builtin.float_(0.7853982);
Sk.builtins.HALF_PI = new Sk.builtin.float_(1.57079632679489661923);
Sk.builtins.PI = new Sk.builtin.float_(3.14159265358979323846);
Sk.builtins.TWO_PI = new Sk.builtin.float_(6.28318530717958647693);
Sk.builtins.TAU = new Sk.builtin.float_(6.28318530717958647693);
// Used to set y axis mode
Sk.builtins.CARTESIAN = new Sk.builtin.int_(1);
Sk.builtins.JAVASCRIPT = new Sk.builtin.int_(2);
// Used to set angle mode
Sk.builtins.RADIANS = new Sk.builtin.int_(1);
Sk.builtins.DEGREES = new Sk.builtin.int_(2);
// Used for rect mode and circle mode
Sk.builtins.CORNER = new Sk.builtin.int_(1);
Sk.builtins.CORNERS = new Sk.builtin.int_(2);
Sk.builtins.CENTER = new Sk.builtin.int_(3);
// Used for end shape
Sk.builtins.CLOSE = new Sk.builtin.int_(1);
Sk.builtins.OPEN = new Sk.builtin.int_(2);
// Used for console height
Sk.builtins.SMALL_SCREEN = new Sk.builtin.int_(300);
Sk.builtins.MEDIUM_SCREEN = new Sk.builtin.int_(500);
Sk.builtins.LARGE_SCREEN = new Sk.builtin.int_(1000);
// Used for text size
Sk.builtins.SMALL_FONT = new Sk.builtin.int_(8);
Sk.builtins.MEDIUM_FONT = new Sk.builtin.int_(16);
Sk.builtins.LARGE_FONT = new Sk.builtin.int_(24);

// Global Python Colours
Sk.PyAngelo.textSize = "16px";
Sk.PyAngelo.textColour = "rgba(147, 161, 161, 1)";
Sk.PyAngelo.highlightColour = "rgba(0, 0, 0, 1)";
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

// GLOBAL KEYS
Sk.builtins.KEY_A = "KeyA";
Sk.builtins.KEY_B = "KeyB";
Sk.builtins.KEY_C = "KeyC";
Sk.builtins.KEY_D = "KeyD";
Sk.builtins.KEY_E = "KeyE";
Sk.builtins.KEY_F = "KeyF";
Sk.builtins.KEY_G = "KeyG";
Sk.builtins.KEY_H = "KeyH";
Sk.builtins.KEY_I = "KeyI";
Sk.builtins.KEY_J = "KeyJ";
Sk.builtins.KEY_K = "KeyK";
Sk.builtins.KEY_L = "KeyL";
Sk.builtins.KEY_M = "KeyM";
Sk.builtins.KEY_N = "KeyN";
Sk.builtins.KEY_O = "KeyO";
Sk.builtins.KEY_P = "KeyP";
Sk.builtins.KEY_Q = "KeyQ";
Sk.builtins.KEY_R = "KeyR";
Sk.builtins.KEY_S = "KeyS";
Sk.builtins.KEY_T = "KeyT";
Sk.builtins.KEY_U = "KeyU";
Sk.builtins.KEY_V = "KeyV";
Sk.builtins.KEY_W = "KeyW";
Sk.builtins.KEY_X = "KeyX";
Sk.builtins.KEY_Y = "KeyY";
Sk.builtins.KEY_Z = "KeyZ";
Sk.builtins.KEY_SPACE = "Space";
Sk.builtins.KEY_ENTER = "Enter";
Sk.builtins.KEY_ESC = "Escape";
Sk.builtins.KEY_DEL = "Delete";
Sk.builtins.KEY_BACKSPACE = "Backspace";
Sk.builtins.KEY_TAB = "Tab";
Sk.builtins.KEY_LEFT = "ArrowLeft";
Sk.builtins.KEY_RIGHT = "ArrowRight";
Sk.builtins.KEY_UP = "ArrowUp";
Sk.builtins.KEY_DOWN = "ArrowDown";

Sk.PyAngelo.reset = function() {
    Sk.PyAngelo.console.innerHTML = "";
    Sk.PyAngelo.textColour = "rgba(147, 161, 161, 1)";
    Sk.PyAngelo.highlightColour = "rgba(0, 0, 0, 1)";
    Sk.PyAngelo.keys = {};
    Sk.PyAngelo.keyWasPressed = {};
    Sk.builtins._angleModeValue = new Sk.builtin.int_(2);
    Sk.builtins._doFill = Sk.builtin.bool.true$;
    Sk.builtins._doStroke = Sk.builtin.bool.true$;
    Sk.builtins._rectMode = new Sk.builtin.int_(1);
    Sk.builtins._circleMode = new Sk.builtin.int_(3);
    Sk.builtins.width = new Sk.builtin.int_(0);
    Sk.builtins.height = new Sk.builtin.int_(0);
    Sk.builtins.mouseX = new Sk.builtin.int_(0);
    Sk.builtins.mouseY = new Sk.builtin.int_(0);
    Sk.builtins.mouseIsPressed = Sk.builtin.bool.false$;
};

Sk.PyAngelo.preparePage = function() {
    Sk.PyAngelo.canvas = document.getElementById("canvas");
    Sk.PyAngelo.ctx = Sk.PyAngelo.canvas.getContext("2d");
    Sk.PyAngelo.console = document.getElementById("console");
    Sk.PyAngelo.debug = document.getElementById("debug");
    Sk.PyAngelo.canvas.addEventListener("keydown", _keydown);
    Sk.PyAngelo.canvas.addEventListener("keyup", _keyup);
    Sk.PyAngelo.canvas.addEventListener("mousemove", _canvasMouseMove);
    Sk.PyAngelo.canvas.addEventListener("mousedown", _canvasMouseDown);
    Sk.PyAngelo.canvas.addEventListener("mouseup", _canvasMouseUp);
    Sk.PyAngelo.console.addEventListener("mousedown", _focusInputElement);

    // Add mouse handlers
    function _setMousePosition(ev) {
        const boundingRect = Sk.PyAngelo.canvas.getBoundingClientRect();
        Sk.builtins.mouseX = Sk.ffi.remapToPy(Math.round(ev.clientX - boundingRect.left));
        if (Sk.builtins._yAxisMode == 1) {
            Sk.builtins.mouseY = Sk.ffi.remapToPy(Sk.PyAngelo.canvas.height - (Math.round(ev.clientY - boundingRect.top)));
        } else {
            Sk.builtins.mouseY = Sk.ffi.remapToPy(Math.round(ev.clientY - boundingRect.top));
        }
    }

    function _canvasMouseMove(ev) {
        ev.preventDefault();
        _setMousePosition(ev);
    }

    function _canvasMouseDown(ev) {
        ev.preventDefault();
        _setMousePosition(ev);
        Sk.builtins.mouseIsPressed = Sk.builtin.bool.true$;
        Sk.PyAngelo.canvas.focus();
    }

    function _canvasMouseUp(ev) {
        ev.preventDefault();
        _setMousePosition(ev);
        Sk.builtins.mouseIsPressed = Sk.builtin.bool.false$;
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
};
