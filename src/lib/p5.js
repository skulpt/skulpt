/**
 * Skulpt p5.js.
 */

 const $builtinmodule = function (name) {
  let colorClass;
  let screenClass;
  let environmentClass;
  let keyboardClass;
  let mouseClass;
  let vectorClass;

  const mod = {__name__: new Sk.builtin.str("p5")};

  // Helper function for extracting values from arguments
  const processArgs = function processArgumentValues(arguments_) {
    const argVals = [];
    for (a of arguments_) {
      if (typeof(a) !== 'undefined') {
        argVals.push(a.v);
      }
    }
    
    return argVals;
  };

  // We need this to store a reference to the actual p5 object which is not created
  // until the run function is called. Even then the p5 object is passed by the
  // p5.js sytem as a parameter to the sketchProc function.

  mod.pInst = null;
  mod.p = null;

  // Constants

  // Graphics Renderer
  mod.P2D = new Sk.builtin.str("p2d");
  mod.WEBGL = Sk.builtin.str("webgl");

  // Environment
  mod.ARROW = new Sk.builtin.str("default");
  mod.CROSS = new Sk.builtin.str("crosshair");
  mod.HAND = new Sk.builtin.str("pointer");
  mod.MOVE = new Sk.builtin.str("move");
  mod.TEXT = new Sk.builtin.str("text");
  mod.WAIT = new Sk.builtin.str("wait");

  // Trigonometry
  mod.HALF_PI = new Sk.builtin.float_(Math.PI / 2.0);
  mod.PI = new Sk.builtin.float_(Math.PI);
  mod.QUARTER_PI = new Sk.builtin.float_(Math.PI / 4.0);
  mod.TAU = new Sk.builtin.float_(Math.PI * 2.0);
  mod.TWO_PI = new Sk.builtin.float_(Math.PI * 2.0);

  mod.DEGREES = new Sk.builtin.str("degrees");
  mod.RADIANS = new Sk.builtin.str("radians");

  mod.DEG_TO_RAD = new Sk.builtin.float_( Math.PI / 180.0);
  mod.RAD_TO_DEG = new Sk.builtin.float_( 180.0 / Math.PI);

  // Shape
  mod.CORNER = new Sk.builtin.str("corner");
  mod.CORNERS = new Sk.builtin.str("corners");
  mod.RADIUS = new Sk.builtin.str("radius");
  mod.RIGHT = new Sk.builtin.str("right");
  mod.LEFT = new Sk.builtin.str("left");
  mod.CENTER = new Sk.builtin.str("center");
  mod.TOP = new Sk.builtin.str("top");
  mod.BOTTOM = new Sk.builtin.str("bottom");
  mod.BASELINE = new Sk.builtin.str("alphabetic");
  
  mod.POINTS = new Sk.builtin.int_(0x0000);
  mod.LINES = new Sk.builtin.int_(0x0001);
  mod.LINE_STRIP = new Sk.builtin.int_(0x0003);
  mod.LINE_LOOP = new Sk.builtin.int_(0x0002);
  mod.TRIANGLES = new Sk.builtin.int_(0x0004);
  mod.TRIANGLE_FAN = new Sk.builtin.int_(0x0006);
  mod.TRIANGLE_STRIP = new Sk.builtin.int_(0x0005);
  mod.QUADS = new Sk.builtin.str("quads");
  mod.QUAD_STRIP = new Sk.builtin.str("quad_strip");
  mod.TESS = new Sk.builtin.str("tess");
  mod.CLOSE = new Sk.builtin.str("close");
  mod.OPEN =  new Sk.builtin.str("open");
  mod.CHORD =  new Sk.builtin.str("chord");
  mod.PIE =  new Sk.builtin.str("pie");
  mod.PROJECT = new Sk.builtin.str("square");
  mod.SQUARE = new Sk.builtin.str("butt");
  mod.ROUND = new Sk.builtin.str("round");
  mod.BEVEL = new Sk.builtin.str("bevel");
  mod.MITER = new Sk.builtin.str("miter");
  
  // Color
  mod.RGB = new Sk.builtin.str("rgb");
  mod.HSB = new Sk.builtin.str("hsb");
  mod.HSL = new Sk.builtin.str("hsl");
  
  // DOM Extension
  mod.AUTO = new Sk.builtin.str("auto");
  mod.ALT = new Sk.builtin.int_(18);
  mod.BACKSPACE = new Sk.builtin.int_(8);
  mod.CONTROL = new Sk.builtin.int_(17);
  mod.DELETE = new Sk.builtin.int_(46);
  mod.DOWN_ARROW = new Sk.builtin.int_(40);
  mod.ENTER = new Sk.builtin.int_(13);
  mod.ESCAPE = new Sk.builtin.int_(27);
  mod.LEFT_ARROW = new Sk.builtin.int_(37);
  mod.OPTION = new Sk.builtin.int_(18);
  mod.RETURN = new Sk.builtin.int_(13);
  mod.RIGHT_ARROW = new Sk.builtin.int_(39);
  mod.SHIFT = new Sk.builtin.int_(16);
  mod.TAB = new Sk.builtin.int_(9);
  mod.UP_ARROW = new Sk.builtin.int_(38);

  // Rendering
  mod.BLEND = new Sk.builtin.str("source-over");
  mod.REMOVE = new Sk.builtin.str("destination-out");
  mod.ADD = new Sk.builtin.str("lighter");
  mod.DARKEST = new Sk.builtin.str("darken");
  mod.LIGHTEST = new Sk.builtin.str("lighten");
  mod.DIFFERENCE = new Sk.builtin.str("difference");
  mod.SUBTRACT = new Sk.builtin.str("subtract");
  mod.EXCLUSION = new Sk.builtin.str("exclusion");
  mod.MULTIPLY = new Sk.builtin.str("multiply");
  mod.SCREEN = new Sk.builtin.str("screen");
  mod.REPLACE = new Sk.builtin.str("copy");
  mod.OVERLAY = new Sk.builtin.str("overlay");
  mod.HARD_LIGHT = new Sk.builtin.str("hard-light");
  mod.SOFT_LIGHT = new Sk.builtin.str("soft-light");
  mod.DODGE = new Sk.builtin.str("dodge");
  mod.BURN = new Sk.builtin.str("color-burn");
  
  // Filters
  mod.THRESHOLD = new Sk.builtin.str("threshold");
  mod.GRAY = new Sk.builtin.str("gray");
  mod.OPAQUE = new Sk.builtin.str("opaque");
  mod.INVERT = new Sk.builtin.str("invert");
  mod.POSTERIZE = new Sk.builtin.str("posterize");
  mod.DILATE = new Sk.builtin.str("dilate");
  mod.ERODE = new Sk.builtin.str("erode");
  mod.BLUR = new Sk.builtin.str("blur");

  // Typography
  mod.NORMAL = new Sk.builtin.str("normal");
  mod.ITALIC = new Sk.builtin.str("italic");
  mod.BOLD = new Sk.builtin.str("bold");
  mod.BOLDITALIC = new Sk.builtin.str("bold italic");

  // Vertices
  mod.LINEAR = new Sk.builtin.str("linear");
  mod.QUADRATIC = new Sk.builtin.str("quadratic");
  mod.BEZIER = new Sk.builtin.str("bezier");
  mod.CURVE = new Sk.builtin.str("curve");

  // WebGL Draw Modes
  mod.STROKE = new Sk.builtin.str("stroke");
  mod.FILL = new Sk.builtin.str("fill");
  mod.TEXTURE = new Sk.builtin.str("texture");
  mod.IMMEDIATE = new Sk.builtin.str("immediate");
  mod.IMAGE = new Sk.builtin.str("image");
  mod.NEAREST = new Sk.builtin.str("nearest");
  mod.REPEAT = new Sk.builtin.str("repeat");
  mod.CLAMP = new Sk.builtin.str("clamp");
  mod.MIRROR = new Sk.builtin.str("mirror");
  
  // Device Orientation
  mod.LANDSCAPE = new Sk.builtin.str("landscape");
  mod.PORTRAIT = new Sk.builtin.str("portrait");

  // Defaults
  mod.GRID = new Sk.builtin.str("grid");
  mod.AXES = new Sk.builtin.str("axes");
  mod.LABEL = new Sk.builtin.str("label");
  mod.FALLBACK = new Sk.builtin.str("fallback");

  // 2D - Primitives
  mod.line = new Sk.builtin.func(function (x1, y1, x2, y2) {
    mod.pInst.line(x1.v, y1.v, x2.v, y2.v);
  });

  mod.ellipse = new Sk.builtin.func(function (x, y, r1, r2) {
    mod.pInst.ellipse(x.v, y.v, r1.v, r2.v);
  });

  mod.circle = new Sk.builtin.func(function (x, y, d) {
    mod.pInst.circle(x.v, y.v, d.v);
  });

  mod.text = new Sk.builtin.func(function (theText, x, y) {
    mod.pInst.text(theText.v, x.v, y.v);
  });

  mod.point = new Sk.builtin.func(function (x1, y1) {
    mod.pInst.point(x1.v, y1.v);
  });

  mod.arc = new Sk.builtin.func(function (x, y, width, height, start, stop) {
    mod.pInst.arc(x.v, y.v, width.v, height.v, start.v, stop.v);
  });

  mod.quad = new Sk.builtin.func(function (x1, y1, x2, y2, x3, y3, x4, y4) {
    mod.pInst.quad(x1.v, y1.v, x2.v, y2.v, x3.v, y3.v, x4.v, y4.v);
  });

  mod.rect = new Sk.builtin.func(function (x, y, width, height, radius) {
    if (typeof(radius) === "undefined") {
        mod.pInst.rect(x.v, y.v, width.v, height.v);
    } else {
        mod.pInst.rect(x.v, y.v, width.v, height.v, radius.v);
    }
  });

  mod.triangle = new Sk.builtin.func(function (x1, y1, x2, y2, x3, y3) {
    mod.pInst.triangle(x1.v, y1.v, x2.v, y2.v, x3.v, y3.v);
  });

  mod.bezier = new Sk.builtin.func(function (x1, y1, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    if (typeof(a7) === "undefined") {
      // bezier(x1, y1, cx1, cy1, cx2, cy2,  x2,  y2);
      mod.pInst.bezier(x1.v, y1.v, a1.v, a2.v, a3.v, a4.v, a5.v, a6.v);
    } else {
      // bezier(x1, y1,  z1, cx1, cy1, cz1, cx2, cy2, cz2, x2, y2, z2);
      mod.pInst.bezier(x1.v, y1.v, a1.v, a2.v, a3.v, a4.v, a5.v, a6.v, a7.v, a8.v, a9.v, a10.v);
    }
  });

  mod.alpha = new Sk.builtin.func(function (r, g, b) {
    // r will be either:
    //      a number in which case the fill will be grayscale
    //      a color object
    // g, and b may be undefined.  If they hold values it will
    // be assumed that we have an r,g,b color tuple
    if (typeof(g) === "undefined") {
      return new Sk.builtin.float_(mod.pInst.alpha(r.v));
    } else if (typeof(b) === "undefined") {
      return new Sk.builtin.float_(mod.pInst.alpha(r.v, g.v));
    } else {
      return new Sk.builtin.float_(mod.pInst.alpha(r.v, g.v, b.v));
    }
  });

  mod.ambient = new Sk.builtin.func(function (r, g, b) {
    // ambient(gray)
    // ambient(red, green blue)
    // r will be either:
    //      a number in which case the fill will be grayscale
    //      a color object
    // g, and b may be undefined.  If they hold values it will
    // be assumed that we have an r,g,b color tuple
    if (typeof(g) === "undefined") {
        mod.pInst.ambient(r.v);
    } else if (typeof(b) === "undefined") {
        mod.pInst.ambient(r.v, g.v);
    } else {
        mod.pInst.ambient(r.v, g.v, b.v);
    }
  });

  mod.ambientLight = new Sk.builtin.func(function (v1, v2, v3, x, y, z) {
    // ambientLight(v1,v2,v3)
    // ambientLight(v1,v2,v3,x,y,z)
    if (typeof(x) === "undefined") {
        mod.pInst.ambientLight(v1.v, v2.v, v3.v);
    } else if (typeof(y) === "undefined") {
        mod.pInst.ambientLight(v1.v, v2.v, v3.v, x.v);
    } else if (typeof(z) === "undefined") {
        mod.pInst.ambientLight(v1.v, v2.v, v3.v, x.v, y.v);
    } else {
        mod.pInst.ambientLight(v1.v, v2.v, v3.v, x.v, y.v, z.v);
    }
  });

  mod.beginCamera = new Sk.builtin.func(function () {
    mod.pInst.beginCamera();
  });

  mod.beginShape = new Sk.builtin.func(function () {
    const argVals = processArgs(arguments);
    mod.pInst.beginShape(...argVals);
  });

  mod.bezierDetail = new Sk.builtin.func(function (resolution) {
    // Sets the resolution at which Beziers display. The default
    // value is 20. This function is only useful when using the
    // P3D or OPENGL renderer as the default (JAVA2D) renderer
    // does not use this information.
    if (typeof(resolution) !== "undefined") {
      resolution = resolution.v;
    } else {
      resolution = 20;
    }
    mod.pInst.bezierDetail(resolution);
  });

  mod.bezierPoint = new Sk.builtin.func(function (a,b,c,d,t) {
    mod.pInst.bezierPoint(a.v,b.v,c.v,d.v,t.v);
  });

  mod.bezierTangent = new Sk.builtin.func(function (a,b,c,d,t) {
    mod.pInst.bezierTangent(a.v,b.v,c.v,d.v,t.v);
  });

  mod.bezierVertex = new Sk.builtin.func(function (v1, v2, v3, v4, v5, v6,
						    v7, v8, v9) {
    // bezierVertex(cx1, cy1, cx2, cy2,   x,   y)
    // bezierVertex(cx1, cy1, cz1, cx2, cy2, cz2, x, y, z)
    if (typeof(v7) === "undefined") {
	    mod.pInst.bezierVertex(v1.v, v2.v, v3.v, v4.v, v5.v, v6.v);
    } else if (typeof(v8) === "undefined") {
	    mod.pInst.bezierVertex(v1.v, v2.v, v3.v, v4.v, v5.v, v6.v,
					v7.v);
    } else if (typeof(v9) === "undefined") {
	    mod.pInst.bezierVertex(v1.v, v2.v, v3.v, v4.v, v5.v, v6.v,
					v7.v, v8.v);
    } else {
	    mod.pInst.bezierVertex(v1.v, v2.v, v3.v, v4.v, v5.v, v6.v,
					v7.v, v8.v, v9.v);
    }
  });

  mod.blend = new Sk.builtin.func(function (v1, v2, v3, v4, v5,
					      v6, v7, v8, v9, v10) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
	    // blend(x,     y,width,height,dx,    dy,dwidth,dheight,MODE)
	    mod.pInst.blend(v1.v, v2.v, v3.v, v4.v, v5.v,
				 v6.v, v7.v, v8.v, v9.v);
    } else {
	    // blend(srcImg,x,y,    width, height,dx,dy,    dwidth, dheight,MODE)
	    mod.pInst.blend(v1.v, v2.v, v3.v, v4.v, v5.v,
				 v6.v, v7.v, v8.v, v9.v, v10.v);
    }
  });

  mod.blendColor = new Sk.builtin.func(function (c1, c2, mode) {
    // blendColor(c1,c2,MODE)
    const c = Sk.misceval.callsimArray(mod.color, [
        new Sk.builtin.int_(0),
        new Sk.builtin.int_(0),
        new Sk.builtin.int_(0)]);
    c.v = mod.pInst.blendColor(c1.v, c2.v, mode.v);
    return c;
  });

  mod.brightness = new Sk.builtin.func(function (r, g, b) {
    if (typeof(g) === "undefined") {
	    return new Sk.builtin.float_(mod.pInst.brightness(r.v));
    } else if (typeof(b) === "undefined") {
	    return new Sk.builtin.float_(mod.pInst.brightness(r.v, g.v));
    } else {
	    return new Sk.builtin.float_(mod.pInst.brightness(r.v, g.v, b.v));
    }
  });

  mod.camera = new Sk.builtin.func(function (eyeX, eyeY, eyeZ,
					       centerX, centerY, centerZ,
					       upX, upY, upZ) {
    // camera()
    // camera(eyeX, eyeY, eyeZ,centerX, centerY, centerZ,upX, upY, upZ)
    if (typeof(eyeX) === "undefined") {
	    mod.pInst.camera();
    } else {
	    mod.pInst.camera(eyeX.v, eyeY.v, eyeZ.v,
				  centerX.v, centerY.v, centerZ.v,
				  upX.v, upY.v, upZ.v);
    }
  });

  mod.constrain = new Sk.builtin.func(function (value, min, max) {
    return new Sk.builtin.float_(mod.pInst.constrain(value.v, min.v, max.v));
  });

  mod.copy = new Sk.builtin.func(function (v1, v2, v3, v4, v5,
					      v6, v7, v8, v9) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
      // copy(x,     y,width,height,dx,    dy,dwidth,dheight)
      mod.pInst.copy(v1.v, v2.v, v3.v, v4.v, v5.v,
          v6.v, v7.v, v8.v);
    } else {
      // copy(srcImg,x,y,    width, height,dx,dy,    dwidth, dheight)
      mod.pInst.copy(v1.v, v2.v, v3.v, v4.v, v5.v,
          v6.v, v7.v, v8.v, v9.v);
    }
  });

  mod.createFont = new Sk.builtin.func(function (name, size, smooth, charset) {
    // createFont(name, size)
    // createFont(name, size, smooth)
    // createFont(name, size, smooth, charset)
    const font = Sk.misceval.callsimArray(mod.PFont);
    if (typeof(smooth) === "undefined") {
	    font.v = mod.pInst.createFont(name.v, size.v);
    } else if (typeof(charset) === "undefined") {
	    font.v = mod.pInst.createFont(name.v, size.v, smooth.v);
    } else {
	    font.v = mod.pInst.createFont(name.v, size.v, smooth.v, charset.v);
    }
    return font;
  });

  mod.createGraphics = new Sk.builtin.func(function (width, height, renderer, filename) {
    // createGraphics(width, height, renderer)
    // createGraphics(width, height, renderer, filename)
    const graphics = Sk.misceval.callsimArray(mod.PGraphics);
    if (typeof(filename) === "undefined") {
      graphics.v = mod.pInst.createGraphics(width.v, height.v, renderer.v);
    } else {
      graphics.v = mod.pInst.createGraphics(width.v, height.v, renderer.v, filename.v);
    }
    return graphics;
  });

  mod.createImage = new Sk.builtin.func(function (width, height, format) {
    const image = Sk.misceval.callsimArray(mod.PImage);
    image.v = mod.pInst.createImage(width.v, height.v, format.v);
    return image;
  });

  mod.cursor = new Sk.builtin.func(function (v, x, y) {
    // cursor()
    // cursor(MODE)
    // cursor(image,x,y)
    if (typeof(v) === "undefined") {
	    mod.pInst.cursor();
    } else if (typeof(x) === "undefined") {
	    mod.pInst.cursor(v.v);
    } else if (typeof(y) === "undefined") {
	    mod.pInst.cursor(v.v, x.v);
    } else {
	    mod.pInst.cursor(v.v, x.v, y.v);
    }
  });

  mod.curve = new Sk.builtin.func(function (v1, v2, v3, v4,
					      v5, v6, v7, v8,
					      v9, v10, v11, v12) {
    // curve(x1, y1, x2, y2, x3, y3, x4, y4);
    // curve(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4);
    if (typeof(v9) === "undefined") {
	    mod.pInst.curve(v1.v, v2.v, v3.v, v4.v,
				 v5.v, v6.v, v7.v, v8.v);
    } else if (typeof(v10) === "undefined") {
	    mod.pInst.curve(v1.v, v2.v, v3.v, v4.v,
				 v5.v, v6.v, v7.v, v8.v,
				 v9.v);
    } else if (typeof(v11) === "undefined") {
	    mod.pInst.curve(v1.v, v2.v, v3.v, v4.v,
				 v5.v, v6.v, v7.v, v8.v,
				 v9.v, v10.v);
    } else if (typeof(v12) === "undefined") {
	    mod.pInst.curve(v1.v, v2.v, v3.v, v4.v,
				 v5.v, v6.v, v7.v, v8.v,
				 v9.v, v10.v, v11.v);
    } else {
	    mod.pInst.curve(v1.v, v2.v, v3.v, v4.v,
				 v5.v, v6.v, v7.v, v8.v,
				 v9.v, v10.v, v11.v, v12.v);
    }
  });

  mod.curveDetail = new Sk.builtin.func(function (detail) {
    // curveDetail(detail)
    mod.pInst.curveDetail(detail.v);
  });

  mod.curvePoint = new Sk.builtin.func(function (a,b,c,d,t) {
    // curvePoint(a,b,c,d,t)
    mod.pInst.curvePoint(a.v,b.v,c.v,d.v,t.v);
  });

  mod.curveTangent = new Sk.builtin.func(function (a,b,c,d,t) {
    // curveTangent(a,b,c,d,t)
    mod.pInst.curveTangent(a.v,b.v,c.v,d.v,t.v);
  });

  mod.curveTightness = new Sk.builtin.func(function (squishy) {
    // curveTightness(squishy)
    mod.pInst.curveTightness(squishy.v);
  });

  mod.curveVertex = new Sk.builtin.func(function (x, y, z) {
    // curveVertex(x, y) 
    // curveVertex(x, y, z)
    if (typeof(z) === "undefined") {
	    mod.pInst.curveVertex(x.v, y.v);
    } else {
	    mod.pInst.curveVertex(x.v, y.v, z.v);
    }
  });

  mod.day = new Sk.builtin.func(function () {
    return new Sk.builtin.int_(mod.pInst.day());
  });

  mod.degrees = new Sk.builtin.func(function (angle) {
    // degrees(angle)
    return new Sk.builtin.float_(mod.pInst.degrees(angle.v));
  });

  mod.directionalLight = new Sk.builtin.func(function (v1,v2,v3,nx,ny,nz) {
    // directionalLight(v1,v2,v3,nx,ny,nz)
    mod.pInst.directionalLight(v1.v,v2.v,v3.v,nx.v,ny.v,nz.v);
  });

  mod.dist = new Sk.builtin.func(function (x1, y1, z1, x2, y2, z2) {
    // dist(x1, y1, x2, y2)
    // dist(x1, y1, z1, x2, y2, z2)
    if (typeof(y2) === "undefined") {
	    return new Sk.builtin.float_(mod.pInst.dist(x1.v, y1.v, z1.v, x2.v));
    } else if (typeof(z2) === "undefined") {
	    return new Sk.builtin.float_(mod.pInst.dist(x1.v, y1.v, z1.v, x2.v, y2.v));
    } else {
	    return new Sk.builtin.float_(mod.pInst.dist(x1.v, y1.v, z1.v, x2.v, y2.v, z2.v));
    }
  });

  mod.emissive = new Sk.builtin.func(function (v1, v2, v3) {
    // emissive(gray)
    // emissive(color)
    // emissive(v1,v2,v3)
    if (typeof(v2) === "undefined") {
	    mod.pInst.emissive(v1.v);
    } else if (typeof(v3) === "undefined") {
	    mod.pInst.emissive(v1.v, v2.v);
    } else {
	    mod.pInst.emissive(v1.v, v2.v, v3.v);
    }
  });

  mod.endCamera = new Sk.builtin.func(function () {
    // endCamera()
    mod.pInst.endCamera();
  });

  mod.endShape = new Sk.builtin.func(function () {
    const argVals = processArgs(arguments);
    mod.pInst.endShape(...argVals);
  });

  mod.filter = new Sk.builtin.func(function (mode, srcImg) {
    // filter(MODE)
    // filter(MODE, srcImg)
    if (typeof(srcImg) === "undefined") {
	    mod.pInst.filter(mode.v);
    } else {
	    mod.pInst.filter(mode.v, srcImg.v);
    }
  });

  mod.frustum = new Sk.builtin.func(function (left, right, bottom, top, near, far) {
    // frustum(left, right, bottom,top, near, far)
    mod.pInst.frustum(left, right, bottom, top, near, far);
  });

  mod.hint = new Sk.builtin.func(function (item) {
    // hint(item)
    mod.pInst.hint(item);
  });

  mod.hour = new Sk.builtin.func(function () {
    return new Sk.builtin.int_(mod.pInst.hour());
  });

  mod.hue = new Sk.builtin.func(function (color) {
    // hue(color)
    return new Sk.builtin.float_(mod.pInst.hue(color.v));
  });

  mod.imageMode = new Sk.builtin.func(function (mode) {
    mod.pInst.imageMode(mode.v);
  });

  mod.lerp = new Sk.builtin.func(function (value1, value2, amt) {
    // lerp(value1, value2, amt)
    // returns float
    return new Sk.builtin.float_(mod.pInst.lerp(value1.v, value2.v, amt.v));
  });

  mod.lerpColor = new Sk.builtin.func(function (c1, c2, amt) {
    // lerpColor(c1, c2, amt)
    // returns color
    const c = Sk.misceval.callsimArray(mod.color, [
        new Sk.builtin.int_(0),
        new Sk.builtin.int_(0),
        new Sk.builtin.int_(0)]);
    c.v = mod.pInst.lerpColor(c1.v, c2.v, amt.v);
    return c;
  });

  mod.lightFalloff = new Sk.builtin.func(function (constant, linear, quadratic) {
    // lightFalloff(constant,linear,quadratic)
    mod.pInst.lightFalloff(constant.v, linear.v, quadratic.v);
  });

  mod.lights = new Sk.builtin.func(function () {
    mod.pInst.lights();
  });

  mod.lightSpecular = new Sk.builtin.func(function (v1, v2, v3) {
    // lightSpecular(v1,v2,v3)
    mod.pInst.lightSpecular(v1.v, v2.v, v3.v);
  });

  mod.loadBytes = new Sk.builtin.func(function (filename) {
    // loadBytes(filename)
    // returns byte[]
    return new Sk.builtin.list(mod.pInst.loadBytes(filename.v));
  });

  mod.loadFont = new Sk.builtin.func(function (fontname) {
    // loadFont(fontname)
    // returns font
    const font = Sk.misceval.callsimArray(mod.PFont);
    font.v = mod.pInst.loadFont(fontname.v);
    return font;
  });

  mod.loadShape = new Sk.builtin.func(function (filename) {
    // loadShape(filename)
    // returns shape
    const shape = Sk.misceval.callsimArray(mod.PShapeSVG, [
					new Sk.builtin.str("string"),
					filename]);
    return shape;
  });

  mod.loadStrings = new Sk.builtin.func(function (filename) {
    // loadStrings(filename)
    // returns string []
    return new Sk.builtin.list(mod.pInst.loadStrings(filename.v));
  });

  mod.mag = new Sk.builtin.func(function (a, b, c) {
    // mag(a,b)
    // mag(a,b,c)
    // returns magnitude as float
    if (typeof(c) === "undefined") {
	    return new Sk.builtin.float_(mod.pInst.mag(a.v, b.v));
    } else {
	    return new Sk.builtin.float_(mod.pInst.mag(a.v, b.v, c.v));
    }
  });

  mod.map = new Sk.builtin.func(function (value,low1,high1,low2,high2) {
    // map(value,low1,high1,low2,high2)
    // returns float
    return new Sk.builtin.float_(mod.pInst.map(value.v,low1.v,high1.v,
						   low2.v,high2.v));
  });

  mod.millis = new Sk.builtin.func(function () {
    return new Sk.builtin.int_(mod.pInst.millis());
  });

  mod.minute = new Sk.builtin.func(function () {
    return new Sk.builtin.int_(mod.pInst.minute());
  });

  mod.modelX = new Sk.builtin.func(function (x, y, z) {
    // modelX(x,y,z)
    // returns float
    return new Sk.builtin.float_(mod.pInst.modelX(x.v, y.v, z.v));
  });

  mod.modelY = new Sk.builtin.func(function (x, y, z) {
    // modelY(x,y,z)
    // returns float
    return new Sk.builtin.float_(mod.pInst.modelY(x.v, y.v, z.v));
  });

  mod.modelZ = new Sk.builtin.func(function (x, y, z) {
    // modelZ(x,y,z)
    // returns float
    return new Sk.builtin.float_(mod.pInst.modelZ(x.v, y.v, z.v));
  });

  mod.month = new Sk.builtin.func(function () {
    return new Sk.builtin.int_(mod.pInst.month());
  });

  mod.noCursor = new Sk.builtin.func(function () {
    mod.pInst.noCursor();
  });

  mod.noise = new Sk.builtin.func(function (x, y, z) {
    // noise(x)
    // noise(x, y)
    // noise(x, y, z)
    // returns float
    if (typeof(y) === "undefined") {
	    return new Sk.builtin.float_(mod.pInst.noise(x.v));
    } else if (typeof(z) === "undefined") {
	    return new Sk.builtin.float_(mod.pInst.noise(x.v, y.v));
    } else {
	    return new Sk.builtin.float_(mod.pInst.noise(x.v, y.v, z.v));
    }
  });

  mod.noiseDetail = new Sk.builtin.func(function (octaves, falloff) {
    // noiseDetail(octaves);
    // noiseDetail(octaves,falloff);
    mod.pInst.noiseDetail(octaves.v, falloff.v);
  });

  mod.noiseSeed = new Sk.builtin.func(function (value) {
    // noiseSeed(value); int
    // returns float
    return new Sk.builtin.float_(mod.pInst.noiseSeed(value.v));
  });

  mod.noLights = new Sk.builtin.func(function () {
    mod.pInst.noLights();
  });

  mod.norm = new Sk.builtin.func(function (value, low, high) {
    // norm(value, low, high)
    // returns float
    return new Sk.builtin.float_(mod.pInst.norm(value.v, low.v, high.v));
  });

  mod.normal = new Sk.builtin.func(function (nx, ny, nz) {
    // normal(nx,ny,nz)
    // returns None
    mod.pInst.normal(nx.v, ny.v, nz.v);
  });

  mod.noTint = new Sk.builtin.func(function () {
    mod.pInst.noTint();
  });

  mod.ortho = new Sk.builtin.func(function (left, right, bottom, top, near, far) {
    // ortho(left, right, bottom,top, near,far)
    // returns None
    mod.pInst.ortho(left.v, right.v, bottom.v, top.v, near.v, far.v);
  });

  mod.perspective = new Sk.builtin.func(function (fov, aspect, zNear, zFar) {
    // perspective()
    // perspective(fov, aspect, zNear, zFar)
    // returns None
    if (typeof(fov) === "undefined") {
	    mod.pInst.perspective();
    } else if (typeof(aspect) === "undefined") {
	    mod.pInst.perspective(fov.v);
    } else if (typeof(zNear) === "undefined") {
	    mod.pInst.perspective(fov.v, aspect.v);
    } else if (typeof(zFar) === "undefined") {
	    mod.pInst.perspective(fov.v, aspect.v, zNear.v);
    } else {
	    mod.pInst.perspective(fov.v, aspect.v, zNear.v, zFar.v);
    }
  });

  mod.pointLight = new Sk.builtin.func(function (v1,v2,v3,nx,ny,nz) {
    // pointLight(v1,v2,v3,nx,ny,nz)
    // returns None
    mod.pInst.pointLight(v1.v,v2.v,v3.v,nx.v,ny.v,nz.v);
  });

  mod.printCamera = new Sk.builtin.func(function () {
    // printCamera()
    // returns None
    mod.pInst.printCamera();
  });

  mod.println = new Sk.builtin.func(function (data) {
    // println(data)
    mod.pInst.println(data.v);
  });

  mod.printProjection = new Sk.builtin.func(function () {
    // printProjection()
    // returns None
    mod.pInst.printProjection();
  });

  mod.radians = new Sk.builtin.func(function (angle) {
    // radians(angle)
    // returns int or float
    return new Sk.builtin.float_(mod.pInst.radians(angle.v));
  });

  mod.randomSeed = new Sk.builtin.func(function (value) {
    // noiseSeed(value);
    // returns float
    return new Sk.builtin.float_(mod.pInst.randomSeed(value.v));
  });

  mod.random = new Sk.builtin.func(function (v1, v2) {
    // random();
    // random(high);
    // random(low, high);
    // returns float
    if (typeof(v1) === "undefined") {
	    return new Sk.builtin.float_(mod.pInst.random());
    } else if (typeof(v2) === "undefined") {
	    return new Sk.builtin.float_(mod.pInst.random(v1.v));
    } else {
	    return new Sk.builtin.float_(mod.pInst.random(v1.v, v2.v));
    }
  });

  mod.requestImage = new Sk.builtin.func(function (filename, extension) {
    // requestImage(filename)
    // requestImage(filename, extension)
    const image = Sk.misceval.callsimArray(mod.PImage);
    if (typeof(extension) === "undefined") {
	    image.v = mod.pInst.requestImage(filename.v);
    } else {
	    image.v = mod.pInst.requestImage(filename.v, extension.v);
    }
    return image;
  });

  mod.saturation = new Sk.builtin.func(function (color) {
    // saturation(color)
    // returns float
    return new Sk.builtin.float_(mod.pInst.saturation(color.v));
  });

  mod.save = new Sk.builtin.func(function (filename) {
    // save(filename)
    // returns None
    mod.pInst.save(filename.v);
  });

  mod.saveFrame = new Sk.builtin.func(function (filename) {
    // saveFrame()
    // saveFrame(filename-####.ext)
    // returns None
    if (typeof(filename) === "undefined") {
	    mod.pInst.saveFrame();
    } else {
	    mod.pInst.saveFrame(filename.v);
    }
  });

  mod.saveStrings = new Sk.builtin.func(function (filename, strings) {
    // saveStrings(filename,strings)
    mod.pInst.saveStrings(filename.v, strings.v);
  });

  mod.screenX = new Sk.builtin.func(function (x, y, z) {
    // screenX(x,y,z)
    // returns float
    return new Sk.builtin.float_(mod.pInst.screenX(x.v, y.v, z.v));
  });

  mod.screenY = new Sk.builtin.func(function (x, y, z) {
    // screenY(x,y,z)
    // returns float
    return new Sk.builtin.float_(mod.pInst.screenY(x.v, y.v, z.v));
  });

  mod.screenZ = new Sk.builtin.func(function (x, y, z) {
    // screenZ(x,y,z)
    // returns float
    return new Sk.builtin.float_(mod.pInst.screenZ(x.v, y.v, z.v));
  });

  mod.second = new Sk.builtin.func(function () {
    return new Sk.builtin.int_(mod.pInst.second());
  });

  mod.shape = new Sk.builtin.func(function (sh, x, y, width, height) {
    // shape(sh)
    // shape(sh,x,y)
    // shape(sh,x,y,width,height)
    // returns?
    if (typeof(x) === "undefined") {
	    mod.pInst.shape(sh.v);
    } else if (typeof(y) === "undefined") {
	    mod.pInst.shape(sh.v,x.v);
    } else if (typeof(width) === "undefined") {
	    mod.pInst.shape(sh.v,x.v,y.v);
    } else if (typeof(height) === "undefined") {
	    mod.pInst.shape(sh.v,x.v,y.v,width.v);
    } else {
	    mod.pInst.shape(sh.v,x.v,y.v,width.v,height.v);
    }
  });

  mod.shapeMode = new Sk.builtin.func(function (mode) {
    // shapeMode(MODE)
    mod.pInst.shapeMode(mode.v);
  });

  mod.shininess = new Sk.builtin.func(function (shine) {
    // shininess(shine)
    // returns None
    mod.pInst.shininess(shine.v);
  });

  mod.specular = new Sk.builtin.func(function (v1,v2,v3) {
    // specular(gray)
    // specular(color)
    // specular(v1,v2,v3)
    if (typeof(v2) === "undefined") {
	    mod.pInst.specular(v1.v);
    } else if (typeof(v3) === "undefined") {
	    mod.pInst.specular(v1.v,v2.v);
    } else {
	    mod.pInst.specular(v1.v,v2.v,v3.v);
    }
  });

  mod.spotLight = new Sk.builtin.func(function (v1,v2,v3,nx,ny,nz,angle,concentration) {
    // spotLight(v1,v2,v3,nx,ny,nz,angle,concentration)
    // returns None
    mod.pInst.spotLight(v1.v,v2.v,v3.v,nx.v,ny.v,nz.v,angle.v,concentration.v);
  });

  mod.sq = new Sk.builtin.func(function (value) {
    // sq(value)
    // returns squared number
    return new Sk.builtin.float_(mod.pInst.sq(value));
  });

  mod.status = new Sk.builtin.func(function (text) {
    // status(text)
    mod.pInst.status(text.v);
  });

  mod.textAlign = new Sk.builtin.func(function (align, yalign) {
    // textAlign(ALIGN)
    // textAlign(ALIGN, YALIGN)
    // returns None
    if (typeof(yalign) === "undefined") {
	    mod.pInst.textAlign(align.v);
    } else {
	    mod.pInst.textAlign(align.v, yalign.v);
    }
  });

  mod.textAscent = new Sk.builtin.func(function () {
    // returns float
    return new Sk.builtin.float_(mod.pInst.textAscent());
  });

  mod.textDescent = new Sk.builtin.func(function () {
    // returns float
    return new Sk.builtin.float_(mod.pInst.textDescent());
  });

  mod.textFont = new Sk.builtin.func(function (font, size) {
    // textFont(font)
    // textFont(font, size)
    if (typeof(size) === "undefined") {
	    mod.pInst.textFont(font.v);
    } else {
	    mod.pInst.textFont(font.v, size.v);
    }
  });

  mod.textLeading = new Sk.builtin.func(function (dist) {
    // textLeading(dist)
    // returns None
    mod.pInst.textLeading(dist.v);
  });

  mod.textMode = new Sk.builtin.func(function (mode) {
    // textMode(MODE)
    // returns None
    mod.pInst.textMode(mode.v);
  });

  mod.textSize = new Sk.builtin.func(function (size) {
    // textSize(size)
    // returns None
    mod.pInst.textSize(size.v);
  });

  mod.texture = new Sk.builtin.func(function (img) {
    // texture(img)
    // returns None
    mod.pInst.texture(img.v);
  });

  mod.textureMode = new Sk.builtin.func(function (mode) {
    // textureMode(MODE)
    // returns None
    mod.pInst.textureMode(mode.v);
  });

  mod.textWidth = new Sk.builtin.func(function (data) {
    // textWidth(data)
    // returns float
    return new Sk.builtin.float_(mod.pInst.textWidth(data.v));
  });

  mod.tint = new Sk.builtin.func(function (v1, v2, v3, v4) {
    // tint(gray)
    // tint(gray, alpha)
    // tint(value1, value2, value3)
    // tint(value1, value2, value3, alpha)
    // tint(color)
    // tint(color, alpha)
    // tint(hex)
    // tint(hex, alpha)
    if (typeof(v2) === "undefined") {
	    mod.pInst.tint(v1.v);
    } else if (typeof(v3) === "undefined") {
	    mod.pInst.tint(v1.v, v2.v);
    } else if (typeof(v4) === "undefined") {
	    mod.pInst.tint(v1.v, v2.v, v3.v);
    } else {
	    mod.pInst.tint(v1.v, v2.v, v3.v, v4.v);
    }
  });

  mod.updatePixels = new Sk.builtin.func(function () {
    // updatePixels()
    mod.pInst.updatePixels();
  });

  mod.vertex = new Sk.builtin.func(function (x, y, z, u, v) {
    // vertex(x, y); 
    // vertex(x, y, z); 
    // vertex(x, y, u, v); 
    // vertex(x, y, z, u, v);
    if (typeof(z) === "undefined") {
	    mod.pInst.vertex(x.v, y.v);
    } else if (typeof(u) === "undefined") {
	    mod.pInst.vertex(x.v, y.v, z.v);
    } else if (typeof(v) === "undefined") {
	    mod.pInst.vertex(x.v, y.v, z.v, u.v);
    } else {
	    mod.pInst.vertex(x.v, y.v, z.v, u.v, v.v);
    }
  });

  mod.year = new Sk.builtin.func(function () {
    return new Sk.builtin.int_(mod.pInst.year());
  });

  // 3D Primitives
  mod.box = new Sk.builtin.func(function(size) {
      mod.pInst.box(size.v);
  });

  mod.sphere = new Sk.builtin.func(function(radius) {
      mod.pInst.sphere(radius.v);
  });

  mod.sphereDetail = new Sk.builtin.func(function(res,vres) {
    if (typeof(vres) === "undefined") {
      mod.pInst.sphereDetail(res.v);
    }
    else {
      mod.pInst.sphereDetail(res.v, vres.v);
    }
  });

  // Color
  mod.background = new Sk.builtin.func(function () {
    const argVals = processArgs(arguments);
    mod.pInst.background(...argVals);
  });

  mod.fill = new Sk.builtin.func(function () {
    const argVals = processArgs(arguments);
    mod.pInst.fill(...argVals);
  });

  mod.stroke = new Sk.builtin.func(function () {
    const argVals = processArgs(arguments);
    mod.pInst.stroke(...argVals);
  });

  mod.noStroke = new Sk.builtin.func(function () {
    mod.pInst.noStroke();
  });


  mod.colorMode = new Sk.builtin.func(function () {
    const argVals = processArgs(arguments);
    mod.pInst.colorMode(...argVals);
  });

  mod.noFill = new Sk.builtin.func(function () {
    mod.pInst.noFill();
  });


  // Environment

  mod.loop = new Sk.builtin.func(function () {
    if (mod.pInst === null) {
      throw new Sk.builtin.Exception("loop() should be called after run()");
    }
    looping = true;
    mod.pInst.loop();
  });

  mod.noLoop = new Sk.builtin.func(function () {
    if (mod.pInst === null) {
      throw new Sk.builtin.Exception("noLoop() should be called after run()");
    }
    looping = false;
    mod.pInst.noLoop();
  });

  // NOTE: difference with ProcessingJS
  // frameRate is only a function, not a variable: 
  // use environment.frameRate for value
  mod.frameRate = new Sk.builtin.func(function (fr) {
    mod.pInst.frameRate(fr.v);
  });

  // NOTE: difference with ProcessingJS
  // Use mouse.pressed rather than mousePressed

  // NOTE: difference with ProcessingJS
  // Use environment.keyPressed rather than keyPressed

  // NOTE: difference with ProcessingJS
  // Use environment.frameCount 

  // NOTE: difference with ProcessingJS
  // Use environment.frameCount
  
  // NOTE: difference with ProcessingJS
  // Use environment.online

  // NOTE: difference with ProcessingJS
  // Use environment.focused

  mod.width = new Sk.builtin.int_(0);
  mod.height = new Sk.builtin.int_(0);
  mod.renderMode = mod.P2D;

  mod.createCanvas = new Sk.builtin.func(function (w, h, mode) {
    if (typeof(mode) === "undefined") {
      mode = mod.P2D;
    }
    mod.pInst.createCanvas(w.v, h.v, mode.v);
    mod.width = new Sk.builtin.int_(mod.pInst.width);
    mod.height = new Sk.builtin.int_(mod.pInst.height);
    mod.renderMode = mode;
  });

  mod.exitp = new Sk.builtin.func(function () {
    mod.pInst.exit();
  });

  // NOTE: difference with ProcessingJS
  // Use mouseX() or mouse.x rather than mouseX
  mod.mouseX = new Sk.builtin.func(function () {
    return new Sk.builtin.float_(mod.pInst.mouseX);
  });

  // NOTE: difference with ProcessingJS
  // Use mouseY() or mouse.y rather than mouseY
  mod.mouseY = new Sk.builtin.func(function () {
    return new Sk.builtin.float_(mod.pInst.mouseY);
  });

  // NOTE: difference with ProcessingJS
  // Use pmouseX() or mouse.px rather than pmouseX
  mod.pmouseX = new Sk.builtin.func(function () {
    return new Sk.builtin.float_(mod.pInst.pmouseX);
  });

  // NOTE: difference with ProcessingJS
  // Use pmouseY() or mouse.py rather than pmouseY
  mod.pmouseY = new Sk.builtin.func(function () {
    return new Sk.builtin.float_(mod.pInst.pmouseY);
  });

  // Attributes
  mod.rectMode = new Sk.builtin.func(function (mode) {
    mod.pInst.rectMode(mode.v);
  });

  mod.strokeWeight = new Sk.builtin.func(function (wt) {
    mod.pInst.strokeWeight(wt.v);
  });

  mod.smooth = new Sk.builtin.func(function () {
    mod.pInst.smooth();
  });

  mod.noSmooth = new Sk.builtin.func(function () {
    mod.pInst.noSmooth();
  });

  mod.ellipseMode = new Sk.builtin.func(function (mode) {
    mod.pInst.ellipseMode(mode.v);
  });

  mod.strokeCap = new Sk.builtin.func(function (mode) {
    mod.pInst.strokeCap(mode.v);
  });

  mod.strokeJoin = new Sk.builtin.func(function (mode) {
    mod.pInst.strokeJoin(mode.v);
  });


  // Transforms
  mod.rotate = new Sk.builtin.func(function (rads) {
    // rotation in radians
    mod.pInst.rotate(rads.v);
  });

  mod.rotateX = new Sk.builtin.func(function(rads) {
    mod.pInst.rotateX(rads.v);
  });

  mod.rotateY = new Sk.builtin.func(function(rads) {
    mod.pInst.rotateY(rads.v);
  });

  mod.rotateZ = new Sk.builtin.func(function(rads) {
    mod.pInst.rotateZ(rads.v);
  });

  mod.scale = new Sk.builtin.func(function (sx, sy, sz) {
    if (typeof(sy) === "undefined") {
      sy = 1.0;
    } else {
      sy = sy.v;
    }
    if (typeof(sz) === "undefined") {
      sz = 1.0;
    } else {
      sz = sz.v;
    }
    mod.pInst.scale(sx.v, sy, sz);
  });

  mod.translate = new Sk.builtin.func(function (sx, sy, sz) {
    if (typeof(sy) === "undefined") {
      sy = 1.0;
    } else {
      sy = sy.v;
    }
    if (typeof(sz) === "undefined") {
      sz = 1.0;
    } else {
      sz = sz.v;
    }
    mod.pInst.translate(sx.v, sy, sz);
  });

  mod.pop = new Sk.builtin.func(function() {
    mod.pInst.pop();
  });

  mod.push = new Sk.builtin.func(function() {
    mod.pInst.push();
  });

  mod.applyMatrix = new Sk.builtin.func(function() {
    const args = Array.prototype.slice.call(arguments, 0, 16);

    for (let i = 0; i < args.length; i++) {
      args[i] = typeof(args[i]) === "undefined" ? 0.0 : args[i].v;
    }

    mod.pInst.applyMatrix.apply(mod.pInst, args);
  });

  mod.resetMatrix = new Sk.builtin.func(function() {
    mod.pInst.resetMatrix();
  });

  mod.printMatrix = new Sk.builtin.func(function() {
    return Sk.ffi.remapToPy(mod.pInst.printMatrix());
  });

  //  //////////////////////////////////////////////////////////////////////
  //  Run
  // 
  //  Create the p5 context and setup of calls to setup, draw etc.
  //
  //
  //  //////////////////////////////////////////////////////////////////////    
  mod.run = new Sk.builtin.func(function () {
    const sketchProc = (sketch) => {
      mod.pInst = sketch;

      sketch.setup = function () {
        if (Sk.globals["setup"]) {
          Sk.misceval.callsimArray(Sk.globals["setup"]);

          // Thanks pyp5.js!
          const callBacks = ["deviceMoved", "deviceTurned", "deviceShaken", "windowResized", "keyPressed", "keyReleased", "keyTyped",
              "mousePressed", "mouseReleased", "mouseClicked", "doubleClicked", "mouseMoved", "mouseDragged", "mouseWheel", "touchStarted",
              "touchMoved", "touchEnded"];

          for (const cb of callBacks) {
            if (Sk.globals[cb]) {
              sketch[cb] = new Function("try {Sk.misceval.callsimArray(Sk.globals['" + cb + "']);} catch(e) {Sk.uncaughtException(e);}");
            }
          }
        }
      };

      sketch.draw = function () {
        mod.frameCount = sketch.frameCount;
        if (Sk.globals["draw"]) {
          try {
            Sk.misceval.callsimArray(Sk.globals["draw"]);
          } catch(e) {
            Sk.uncaughtException(e);
          }
        }
      };
    }

    const p5Sketch = document.getElementById(Sk.p5Sketch);
    mod.p = new window.p5(sketchProc, p5Sketch);
  });

  mouseClass = function ($gbl, $loc) {
    $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
      key = Sk.ffi.remapToJs(key);
      if (key === "x") {
        return Sk.builtin.assk$(mod.pInst.mouseX);
      }
      else if (key === "y") {
        return Sk.builtin.assk$(mod.pInst.mouseY);
      }
      else if (key === "px") {
        return Sk.builtin.assk$(mod.pInst.pmouseX);
      }
      else if (key === "py") {
        return Sk.builtin.assk$(mod.pInst.pmouseY);
      }
      else if (key === "pressed") {
        return new Sk.builtin.bool(mod.pInst.mouseIsPressed);
      }
      else if (key === "button") {
        return Sk.builtin.assk$(mod.pInst.mouseButton);
      }
    });
  };


  mod.Mouse = Sk.misceval.buildClass(mod, mouseClass, "Mouse", []);

  mod.mouse = Sk.misceval.callsimArray(mod.Mouse);

  keyboardClass = function ($gbl, $loc) {
    $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
      key = Sk.ffi.remapToJs(key);
      if (key === "key") {
        return new Sk.builtin.str(mod.pInst.key.toString());
      }
      else if (key === "keyCode") {
        return Sk.builtin.assk$(mod.pInst.keyCode);
      }
      else if (key === "keyPressed") {
        return new Sk.builtin.str(mod.pInst.keyPressed);
      } // todo bool
    });
  };

  mod.Keyboard = Sk.misceval.buildClass(mod, keyboardClass, "Keyboard", []);

  mod.keyboard = Sk.misceval.callsimArray(mod.Keyboard);


  environmentClass = function ($gbl, $loc) {
    $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
      key = Sk.ffi.remapToJs(key);
      if (key === "frameCount") {
        return Sk.builtin.assk$(mod.pInst.frameCount);
      }
      else if (key === "frameRate") {
        return Sk.builtin.assk$(mod.pInst.frameRate);
      }
      else if (key === "height") {
        return Sk.builtin.assk$(mod.pInst.height);
      }
      else if (key === "width") {
        return Sk.builtin.assk$(mod.pInst.width);
      }
      else if (key === "online") {
        return new Sk.builtin.bool(mod.pInst.online);
      }
      else if (key === "focused") {
        return new Sk.builtin.bool(mod.pInst.focused);
      }
    });
  };

  mod.Environment = Sk.misceval.buildClass(mod, environmentClass, "Environment", []);

  mod.environment = Sk.misceval.callsimArray(mod.Environment);

  screenClass = function ($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function (self) {
      self.pixels = null;
    });

    $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
	    key = Sk.ffi.remapToJs(key);
      if (key === "height") {
        return Sk.builtin.assk$(mod.pInst.height);
      } else if (key === "width") {
        return Sk.builtin.assk$(mod.pInst.width);
      } else if (key === "pixels") {
        if (self.pixels == null) {
          self.pixels = new Sk.builtin.list(mod.pInst.pixels.toArray());
        }
      }
      return self.pixels;
    });
  };

  mod.Screen = Sk.misceval.buildClass(mod, screenClass, "Screen", []);

  mod.screen = Sk.misceval.callsimArray(mod.Screen);

  mod.loadPixels = new Sk.builtin.func(function () {
    mod.pInst.loadPixels();
  });


  colorClass = function ($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function () {
      const argVals = processArgs(arguments);
      self.v = mod.pInst.color(...argVals);
    });
  };

  mod.color = Sk.misceval.buildClass(mod, colorClass, "color", []);

  mod.red = new Sk.builtin.func(function (clr) {
    return new Sk.builtin.int_(mod.pInst.red(clr.v));
  });

  mod.green = new Sk.builtin.func(function (clr) {
    return new Sk.builtin.int_(mod.pInst.green(clr.v));
  });

  mod.blue = new Sk.builtin.func(function (clr) {
    return new Sk.builtin.int_(mod.pInst.blue(clr.v));
  });

  vectorClass = function ($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function (self, x, y, z) {
	    // PVector()
	    // PVector(x,y)
	    // PVector(x,y,z)
      if (typeof(x) === "undefined") {
        self.v = new mod.pInst.createVector();
      } else if (typeof(z) === "undefined") {
        self.v = new mod.pInst.createVector(x.v, y.v);
      } else {
        self.v = new mod.pInst.createVector(x.v, y.v, z.v);
      }
    });

    $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
	    key = Sk.ffi.remapToJs(key);
      if (key === "x") {
        return Sk.builtin.assk$(self.v.x);
      } else if (key === "y") {
        return Sk.builtin.assk$(self.v.y);
      } else if (key === "z") {
        return Sk.builtin.assk$(self.v.z);
      }
    });
	    
    $loc.get = new Sk.builtin.func(function (self) {
	    // get() Gets a copy of the vector
      const new_vec = Sk.misceval.callsimArray(mod.PVector);
	    new_vec.v = self.v.get();
	    return new_vec;
    });

    $loc.__setattr__ = new Sk.builtin.func(function (self, key, value) {
	    key = Sk.ffi.remapToJs(key);
      if (key === "x") {
        self.v.x = value.v;
      } else if (key === "y") {
        self.v.y = value.v;
      } else if (key === "z") {
        self.v.z = value.v;
      }
    });
	
    $loc.set = new Sk.builtin.func(function (self, x, y, z) {
	    // set() Sets the x, y, z component of the vector
      if (typeof(z) === "undefined") {
        self.v.set(x.v, y.v);
	    } else {
        self.v.set(x.v, y.v, z.v);
	    }
    });

    $loc.mag = new Sk.builtin.func(function (self) {
	    // mag() Calculates the magnitude (length) of the vector
	    // and returns the result as a float
	    return Sk.builtin.assk$(self.v.mag());
    });

    $loc.add = new Sk.builtin.func(function (self, vec) {
	    // add()	Adds one vector to another
      const new_vec = Sk.misceval.callsimArray(mod.PVector);
	    new_vec.v = self.v.add(vec.v);
	    return new_vec;
    });

    $loc.sub = new Sk.builtin.func(function (self, vec) {
	    // sub()	Subtracts one vector from another
      const new_vec = Sk.misceval.callsimArray(mod.PVector);
	    new_vec.v = self.v.sub(vec.v);
	    return new_vec;
    });

    $loc.mult = new Sk.builtin.func(function (self, vec) {
	    // mult()	Multiplies the vector by a scalar
      const new_vec = Sk.misceval.callsimArray(mod.PVector);
	    new_vec.v = self.v.mult(vec.v);
	    return new_vec;
    });

    $loc.div = new Sk.builtin.func(function (self, vec) {
	    // div()	Divides the vector by a scalar
      const new_vec = Sk.misceval.callsimArray(mod.PVector);
	    new_vec.v = self.v.div(vec.v);
	    return new_vec;
    });

    $loc.dist = new Sk.builtin.func(function (self, vec) {
	    // dist()	Calculate the Euclidean distance between two points
	    return Sk.builtin.assk$(self.v.dist(vec.v));
    });

    $loc.dot = new Sk.builtin.func(function (self, v1, v2, v3) {
	    // dot()	Calculates the dot product
	    // returns float
	    // vec.dot(x,y,z)
	    // vec.dot(v)	    
	    if (typeof(v2) === 'undefined') {
        return Sk.builtin.assk$(self.v.dot(v1.v));
	    } else {
        return Sk.builtin.assk$(self.v.dot(v1.v, v2.v, v3.v));
	    }
    });

    $loc.cross = new Sk.builtin.func(function (self, vec) {
	    // cross()	Calculates the cross product
      const new_vec = Sk.misceval.callsimArray(mod.PVector);
	    new_vec.v = self.v.cross(vec.v);
	    return new_vec;
    });

    $loc.normalize = new Sk.builtin.func(function (self) {
	    // normalize()	Normalizes the vector
	    self.v.normalize();
    });

    $loc.limit = new Sk.builtin.func(function (self, value) {
	    // limit()	Limits the magnitude of the vector
	    self.v.limit(value.v);
    });

    $loc.angleBetween = new Sk.builtin.func(function (self, vec) {
	    // angleBetween()	Calculates the angle between two vectors
	    return Sk.builtin.assk$(self.v.angleBetween(vec.v));
    });

    $loc.array = new Sk.builtin.func(function (self) {
	    // array()	
	    return new Sk.builtin.list(self.v.array());
    });
  };

  mod.PVector = Sk.misceval.buildClass(mod, vectorClass, "PVector", []);

  return mod;
};
