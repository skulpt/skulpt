/*
  Skulpt Processing

  Testing/debugging:

  ProcessingJS from Skulpt:
  Sk.misceval.callsim(Sk.globals.processing.$d.PShapeSVG, 
      new Sk.builtin.str("string"), 
      new Sk.builtin.str("bot1.svg"))

  ProcessingJS direct:
  p = Processing.instances[0]
  p.PShapeSVG("string", "bot1.svg")
*/

var $builtinmodule = function (name) {
    var imageClass;
    var colorClass;
    var screenClass;
    var environmentClass;
    var keyboardClass;
    var mouseClass;
    var vectorClass

    var mod = {};
    var imList = [];
    var looping = true;
    var instance = null;

    // We need this to store a reference to the actual processing object which is not created
    // until the run function is called.  Even then the processing object is passed by the
    // processing-js sytem as a parameter to the sketchProc function.  Why not set it to None here
    //

    // See:  http://processingjs.org/reference/

    mod.processing = null;
    mod.p = null;

    mod.X = new Sk.builtin.int_(0);
    mod.Y = new Sk.builtin.int_(1);
    mod.Z = new Sk.builtin.int_(2);

    mod.R = new Sk.builtin.int_( 3);
    mod.G = new Sk.builtin.int_( 4);
    mod.B = new Sk.builtin.int_( 5);
    mod.A = new Sk.builtin.int_( 6);
    
    mod.U = new Sk.builtin.int_( 7);
    mod.V = new Sk.builtin.int_( 8);
    
    mod.NX = new Sk.builtin.int_( 9);
    mod.NY = new Sk.builtin.int_( 10);
    mod.NZ = new Sk.builtin.int_( 11);
    
    mod.EDGE = new Sk.builtin.int_( 12);
    
    // Stroke
    mod.SR = new Sk.builtin.int_( 13);
    mod.SG = new Sk.builtin.int_( 14);
    mod.SB = new Sk.builtin.int_( 15);
    mod.SA = new Sk.builtin.int_( 16);
    
    mod.SW = new Sk.builtin.int_( 17);
    
    // Transformations (2D and 3D)
    mod.TX = new Sk.builtin.int_( 18);
    mod.TY = new Sk.builtin.int_( 19);
    mod.TZ = new Sk.builtin.int_( 20);
    
    mod.VX = new Sk.builtin.int_( 21);
    mod.VY = new Sk.builtin.int_( 22);
    mod.VZ = new Sk.builtin.int_( 23);
    mod.VW = new Sk.builtin.int_( 24);
    
    // Material properties
    mod.AR = new Sk.builtin.int_( 25);
    mod.AG = new Sk.builtin.int_( 26);
    mod.AB = new Sk.builtin.int_( 27);
    
    mod.DR = new Sk.builtin.int_( 3);
    mod.DG = new Sk.builtin.int_( 4);
    mod.DB = new Sk.builtin.int_( 5);
    mod.DA = new Sk.builtin.int_( 6);
    
    mod.SPR = new Sk.builtin.int_( 28);
    mod.SPG = new Sk.builtin.int_( 29);
    mod.SPB = new Sk.builtin.int_( 30);
    
    mod.SHINE = new Sk.builtin.int_( 31);
    
    mod.ER = new Sk.builtin.int_( 32);
    mod.EG = new Sk.builtin.int_( 33);
    mod.EB = new Sk.builtin.int_( 34);
    
    mod.BEEN_LIT = new Sk.builtin.int_( 35);
    
    mod.VERTEX_FIELD_COUNT = new Sk.builtin.int_( 36);
    
    // Shape drawing modes
    mod.CENTER = new Sk.builtin.int_(3);
    mod.RADIUS = new Sk.builtin.int_(2);
    mod.CORNERS = new Sk.builtin.int_(1);
    mod.CORNER = new Sk.builtin.int_(0);
    mod.DIAMETER = new Sk.builtin.int_(3);
    
    // Text vertical alignment modes
    // Default vertical alignment for text placement
    mod.BASELINE = new Sk.builtin.int_( 0);
    // Align text to the top
    mod.TOP = new Sk.builtin.int_(      101);
    // Align text from the bottom, using the baseline
    mod.BOTTOM = new Sk.builtin.int_(   102);
    
    // UV Texture coordinate modes
    mod.NORMAL = new Sk.builtin.int_(     1);
    mod.NORMALIZED = new Sk.builtin.int_( 1);
    mod.IMAGE = new Sk.builtin.int_(      2);
    
    // Text placement modes
    mod.MODEL = new Sk.builtin.int_( 4);
    mod.SHAPE = new Sk.builtin.int_( 5);
    
    // Lighting modes
    mod.AMBIENT = new Sk.builtin.int_(     0);
    mod.DIRECTIONAL = new Sk.builtin.int_( 1);
    //POINT:     2, Shared with Shape constant
    mod.SPOT = new Sk.builtin.int_(        3);

    // Color modes
    mod.RGB = new Sk.builtin.int_(1);
    mod.ARGB = new Sk.builtin.int_(2);
    mod.HSB = new Sk.builtin.int_(3);
    mod.ALPHA = new Sk.builtin.int_(4);
    mod.CMYK = new Sk.builtin.int_(5);
    
    // Image file types
    mod.TIFF = new Sk.builtin.int_(0);
    mod.TARGA = new Sk.builtin.int_(1);
    mod.JPEG = new Sk.builtin.int_(2);
    mod.GIF = new Sk.builtin.int_(3);

    // Stroke modes
    mod.MITER = new Sk.builtin.str("miter");
    mod.BEVEL = new Sk.builtin.str("bevel");
    mod.ROUND = new Sk.builtin.str("round");
    mod.SQUARE = new Sk.builtin.str("butt");
    mod.PROJECT = new Sk.builtin.str("square");

    // Renderer modes
    mod.P2D = new Sk.builtin.int_(1);
    mod.JAVA2D = new Sk.builtin.int_(1);
    mod.WEBGL = new Sk.builtin.int_(2);
    mod.P3D = new Sk.builtin.int_(2);
    mod.OPENGL = new Sk.builtin.int_(2);
    mod.PDF = new Sk.builtin.int_(0);
    mod.DXF  = new Sk.builtin.int_(0);

    // Platform IDs
    mod.OTHER = new Sk.builtin.int_(   0);
    mod.WINDOWS = new Sk.builtin.int_( 1);
    mod.MAXOSX = new Sk.builtin.int_(  2);
    mod.LINUX = new Sk.builtin.int_(   3);
    
    mod.EPSILON = new Sk.builtin.float_( 0.0001);

    mod.MAX_FLOAT = new Sk.builtin.float_(  3.4028235e+38);
    mod.MIN_FLOAT = new Sk.builtin.float_( -3.4028235e+38);
    mod.MAX_INT = new Sk.builtin.int_(    2147483647);
    mod.MIN_INT = new Sk.builtin.int_(   -2147483648);
    
    // Constants
    mod.HALF_PI = new Sk.builtin.float_(Math.PI / 2.0);
    mod.THIRD_PI = new Sk.builtin.float_(Math.PI / 3.0);
    mod.PI = new Sk.builtin.float_(Math.PI);
    mod.TWO_PI = new Sk.builtin.float_(Math.PI * 2.0);
    mod.TAU = new Sk.builtin.float_(Math.PI * 2.0);
    mod.QUARTER_PI = new Sk.builtin.float_(Math.PI / 4.0);

    mod.DEG_TO_RAD = new Sk.builtin.float_( Math.PI / 180);
    mod.RAD_TO_DEG = new Sk.builtin.float_( 180 / Math.PI);

    mod.WHITESPACE = Sk.builtin.str(" \t\n\r\f\u00A0");
    // Shape modes
    mod.POINT = new Sk.builtin.int_(2);
    mod.POINTS = new Sk.builtin.int_(2);
    mod.LINE = new Sk.builtin.int_(4);
    mod.LINES = new Sk.builtin.int_(4);
    mod.TRIANGLE = new Sk.builtin.int_(8);
    mod.TRIANGLES = new Sk.builtin.int_(9);
    mod.TRIANGLE_FAN = new Sk.builtin.int_(11);
    mod.TRIANGLE_STRIP = new Sk.builtin.int_(10);
    mod.QUAD = new Sk.builtin.int_(16);
    mod.QUADS = new Sk.builtin.int_(16);
    mod.QUAD_STRIP = new Sk.builtin.int_(17);
    mod.POLYGON = new Sk.builtin.int_(20);

    mod.PATH = new Sk.builtin.int_(21);
    mod.RECT = new Sk.builtin.int_(30);
    mod.ELLIPSE = new Sk.builtin.int_(31);
    mod.ARC = new Sk.builtin.int_(32);
    mod.SPHERE = new Sk.builtin.int_(40);
    mod.BOX = new Sk.builtin.int_(41);

    mod.GROUP = new Sk.builtin.int_(          0);
    mod.PRIMITIVE = new Sk.builtin.int_(      1);
    //PATH:         21, // shared with Shape PATH
    mod.GEOMETRY = new Sk.builtin.int_(       3);
    
    // Shape Vertex
    mod.VERTEX = new Sk.builtin.int_(        0);
    mod.BEZIER_VERTEX = new Sk.builtin.int_( 1);
    mod.CURVE_VERTEX = new Sk.builtin.int_(  2);
    mod.BREAK = new Sk.builtin.int_(         3);
    mod.CLOSESHAPE = new Sk.builtin.int_(    4);
    
    // Blend modes
    mod.REPLACE    = new Sk.builtin.int_(0);
    mod.BLEND      = new Sk.builtin.int_(1 << 0);
    mod.ADD        = new Sk.builtin.int_(1 << 1);
    mod.SUBTRACT   = new Sk.builtin.int_(1 << 2);
    mod.LIGHTEST   = new Sk.builtin.int_(1 << 3);
    mod.DARKEST    = new Sk.builtin.int_(1 << 4);
    mod.DIFFERENCE = new Sk.builtin.int_(1 << 5);
    mod.EXCLUSION  = new Sk.builtin.int_(1 << 6);
    mod.MULTIPLY   = new Sk.builtin.int_(1 << 7);
    mod.SCREEN     = new Sk.builtin.int_(1 << 8);
    mod.OVERLAY    = new Sk.builtin.int_(1 << 9);
    mod.HARD_LIGHT = new Sk.builtin.int_(1 << 10);
    mod.SOFT_LIGHT = new Sk.builtin.int_(1 << 11);
    mod.DODGE      = new Sk.builtin.int_(1 << 12);
    mod.BURN       = new Sk.builtin.int_(1 << 13);

    // Color component bit masks
    mod.ALPHA_MASK = new Sk.builtin.int_( 0xff000000);
    mod.RED_MASK = new Sk.builtin.int_(   0x00ff0000);
    mod.GREEN_MASK = new Sk.builtin.int_( 0x0000ff00);
    mod.BLUE_MASK = new Sk.builtin.int_(  0x000000ff);
    
    // Projection matrices
    mod.CUSTOM = new Sk.builtin.int_(       0);
    mod.ORTHOGRAPHIC = new Sk.builtin.int_( 2);
    mod.PERSPECTIVE = new Sk.builtin.int_(  3);
    
    // Cursors
    mod.ARROW = new Sk.builtin.str("default");
    mod.CROSS = new Sk.builtin.str("crosshair");
    mod.HAND = new Sk.builtin.str("pointer");
    mod.MOVE = new Sk.builtin.str("move");
    mod.TEXT = new Sk.builtin.str("text");
    mod.WAIT = new Sk.builtin.str("wait");
    mod.NOCURSOR = Sk.builtin.assk$("url('data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='), auto", Sk.builtin.nmber.str);

    // Hints
    mod.DISABLE_OPENGL_2X_SMOOTH = new Sk.builtin.int_(1);
    mod.ENABLE_OPENGL_2X_SMOOTH = new Sk.builtin.int_(-1);
    mod.ENABLE_OPENGL_4X_SMOOTH = new Sk.builtin.int_(2);
    mod.ENABLE_NATIVE_FONTS = new Sk.builtin.int_(3);
    mod.DISABLE_DEPTH_TEST = new Sk.builtin.int_(4);
    mod.ENABLE_DEPTH_TEST = new Sk.builtin.int_(-4);
    mod.ENABLE_DEPTH_SORT = new Sk.builtin.int_(5);
    mod.DISABLE_DEPTH_SORT = new Sk.builtin.int_(-5);
    mod.DISABLE_OPENGL_ERROR_REPORT = new Sk.builtin.int_(6);
    mod.ENABLE_OPENGL_ERROR_REPORT = new Sk.builtin.int_(-6);
    mod.ENABLE_ACCURATE_TEXTURES = new Sk.builtin.int_(7);
    mod.DISABLE_ACCURATE_TEXTURES = new Sk.builtin.int_(-7);
    mod.HINT_COUNT = new Sk.builtin.int_(10);

    // Shape closing modes
    mod.OPEN =  new Sk.builtin.int_(1);
    mod.CLOSE = new Sk.builtin.int_(2);

    // Filter/convert types
    mod.BLUR = new Sk.builtin.int_(11);
    mod.GRAY = new Sk.builtin.int_(12);
    mod.INVERT = new Sk.builtin.int_(13);
    mod.OPAQUE = new Sk.builtin.int_(14);
    mod.POSTERIZE = new Sk.builtin.int_(15);
    mod.THRESHOLD = new Sk.builtin.int_(16);
    mod.ERODE = new Sk.builtin.int_(17);
    mod.DILATE = new Sk.builtin.int_(18);

    // Both key and keyCode will be equal to these values
    mod.BACKSPACE = new Sk.builtin.int_( 8);
    mod.TAB = new Sk.builtin.int_(9);
    mod.ENTER = new Sk.builtin.int_(10);
    mod.RETURN = new Sk.builtin.int_(13);
    mod.ESC = new Sk.builtin.int_(27);
    mod.DELETE = new Sk.builtin.int_(127);
    mod.CODED = new Sk.builtin.int_(0xffff);

    // p.key will be CODED and p.keyCode will be this value
    mod.SHIFT = new Sk.builtin.int_(16);
    mod.CONTROL = new Sk.builtin.int_(17);
    mod.ALT = new Sk.builtin.int_(18);
    mod.CAPSLK = new Sk.builtin.int_(20);
    mod.PGUP = new Sk.builtin.int_(33);
    mod.PGDN = new Sk.builtin.int_(34);
    mod.END = new Sk.builtin.int_(35);
    mod.HOME = new Sk.builtin.int_(36);
    mod.LEFT = new Sk.builtin.int_(37);
    mod.UP = new Sk.builtin.int_(38);
    mod.RIGHT = new Sk.builtin.int_(39);
    mod.DOWN = new Sk.builtin.int_(40);
    mod.F1 = new Sk.builtin.int_(112);
    mod.F2 = new Sk.builtin.int_(113);
    mod.F3 = new Sk.builtin.int_(114);
    mod.F4 = new Sk.builtin.int_(115);
    mod.F5 = new Sk.builtin.int_(116);
    mod.F6 = new Sk.builtin.int_(117);
    mod.F7 = new Sk.builtin.int_(118);
    mod.F8 = new Sk.builtin.int_(119);
    mod.F9 = new Sk.builtin.int_(120);
    mod.F10 = new Sk.builtin.int_(121);
    mod.F11 = new Sk.builtin.int_(122);
    mod.F12 = new Sk.builtin.int_(123);
    mod.NUMLK = new Sk.builtin.int_(144);
    mod.META = new Sk.builtin.int_(157);
    mod.INSERT = new Sk.builtin.int_(155);

    // PJS defined constants
    mod.SINCOS_LENGTH = new Sk.builtin.int_(720);
    mod.PRECISIONB = new Sk.builtin.int_(15);
    mod.PRECISIONF = new Sk.builtin.int_(1 << 15);
    mod.PREC_MAXVAL = new Sk.builtin.int_((1 << 15) - 1);
    mod.PREC_ALPHA_SHIFT = new Sk.builtin.int_(24 - 15);
    mod.PREC_RED_SHIFT = new Sk.builtin.int_(16 - 15);
    mod.NORMAL_MODE_AUTO = new Sk.builtin.int_(0);
    mod.NORMAL_MODE_SHAPE = new Sk.builtin.int_(1);
    mod.NORMAL_MODE_VERTEX = new Sk.builtin.int_(2);
    mod.MAX_LIGHTS = new Sk.builtin.int_(8);

    // 2D - Primitives
    mod.line = new Sk.builtin.func(function (x1, y1, x2, y2) {
        mod.processing.line(x1.v, y1.v, x2.v, y2.v);
    });

    mod.ellipse = new Sk.builtin.func(function (x, y, r1, r2) {
        mod.processing.ellipse(x.v, y.v, r1.v, r2.v);

    });

    mod.text = new Sk.builtin.func(function (theText, x, y) {
        mod.processing.text(theText.v, x.v, y.v);
    });

    mod.point = new Sk.builtin.func(function (x1, y1) {
        mod.processing.point(x1.v, y1.v);
    });

    mod.arc = new Sk.builtin.func(function (x, y, width, height, start, stop) {
        mod.processing.arc(x.v, y.v, width.v, height.v, start.v, stop.v);
    });

    mod.quad = new Sk.builtin.func(function (x1, y1, x2, y2, x3, y3, x4, y4) {
        mod.processing.quad(x1.v, y1.v, x2.v, y2.v, x3.v, y3.v, x4.v, y4.v);
    });

    mod.rect = new Sk.builtin.func(function (x, y, width, height, radius) {
        var rad;
        if (typeof(radius) === "undefined") {
            mod.processing.rect(x.v, y.v, width.v, height.v);
        } else {
            mod.processing.rect(x.v, y.v, width.v, height.v, radius.v);
        }
    });

    mod.triangle = new Sk.builtin.func(function (x1, y1, x2, y2, x3, y3) {
        mod.processing.triangle(x1.v, y1.v, x2.v, y2.v, x3.v, y3.v);
    });

    mod.bezier = new Sk.builtin.func(function (x1, y1, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
        if (typeof(a7) === "undefined") {
	    // bezier(x1, y1, cx1, cy1, cx2, cy2,  x2,  y2);
            mod.processing.bezier(x1.v, y1.v, a1.v, a2.v, a3.v, a4.v, a5.v, a6.v);
	} else {
	    // bezier(x1, y1,  z1, cx1, cy1, cz1, cx2, cy2, cz2, x2, y2, z2);
            mod.processing.bezier(x1.v, y1.v, a1.v, a2.v, a3.v, a4.v, a5.v, a6.v, a7.v, a8.v, a9.v, a10.v);
	}
    });

    mod.alpha = new Sk.builtin.func(function (r, g, b) {
        // r will be either:
        //      a number in which case the fill will be grayscale
        //      a color object
        // g, and b may be undefined.  If they hold values it will
        // be assumed that we have an r,g,b color tuple
        if (typeof(g) === "undefined") {
            return new Sk.builtin.float_(mod.processing.alpha(r.v));
        } else if (typeof(b) === "undefined") {
            return new Sk.builtin.float_(mod.processing.alpha(r.v, g.v));
        } else {
            return new Sk.builtin.float_(mod.processing.alpha(r.v, g.v, b.v));
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
            mod.processing.ambient(r.v);
        } else if (typeof(b) === "undefined") {
            mod.processing.ambient(r.v, g.v);
        } else {
            mod.processing.ambient(r.v, g.v, b.v);
	}
    });

    mod.ambientLight = new Sk.builtin.func(function (v1, v2, v3, x, y, z) {
	// ambientLight(v1,v2,v3)
	// ambientLight(v1,v2,v3,x,y,z)
        if (typeof(x) === "undefined") {
            mod.processing.ambientLight(v1.v, v2.v, v3.v);
        } else if (typeof(y) === "undefined") {
            mod.processing.ambientLight(v1.v, v2.v, v3.v, x.v);
        } else if (typeof(z) === "undefined") {
            mod.processing.ambientLight(v1.v, v2.v, v3.v, x.v, y.v);
        } else {
            mod.processing.ambientLight(v1.v, v2.v, v3.v, x.v, y.v, z.v);
	}
    });

    mod.beginCamera = new Sk.builtin.func(function () {
	mod.processing.beginCamera();
    });

    mod.beginShape = new Sk.builtin.func(function (mode) {
        if (typeof(mode) === "undefined") {
            mode = mod.POLYGON;
        }
        mod.processing.beginShape(mode.v);
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
        mod.processing.bezierDetail(resolution);
    });

    mod.bezierPoint = new Sk.builtin.func(function (a,b,c,d,t) {
        mod.processing.bezierPoint(a.v,b.v,c.v,d.v,t.v);
    });

    mod.bezierTangent = new Sk.builtin.func(function (a,b,c,d,t) {
	mod.processing.bezierTangent(a.v,b.v,c.v,d.v,t.v);
    });

    mod.bezierVertex = new Sk.builtin.func(function (v1, v2, v3, v4, v5, v6,
						    v7, v8, v9) {
	// bezierVertex(cx1, cy1, cx2, cy2,   x,   y)
	// bezierVertex(cx1, cy1, cz1, cx2, cy2, cz2, x, y, z)
        if (typeof(v7) === "undefined") {
	    mod.processing.bezierVertex(v1.v, v2.v, v3.v, v4.v, v5.v, v6.v);
	} else if (typeof(v8) === "undefined") {
	    mod.processing.bezierVertex(v1.v, v2.v, v3.v, v4.v, v5.v, v6.v,
					v7.v);
	} else if (typeof(v9) === "undefined") {
	    mod.processing.bezierVertex(v1.v, v2.v, v3.v, v4.v, v5.v, v6.v,
					v7.v, v8.v);
	} else {
	    mod.processing.bezierVertex(v1.v, v2.v, v3.v, v4.v, v5.v, v6.v,
					v7.v, v8.v, v9.v);
	}
    });

    mod.blend = new Sk.builtin.func(function (v1, v2, v3, v4, v5,
					      v6, v7, v8, v9, v10) {
	if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
	    // blend(x,     y,width,height,dx,    dy,dwidth,dheight,MODE)
	    mod.processing.blend(v1.v, v2.v, v3.v, v4.v, v5.v,
				 v6.v, v7.v, v8.v, v9.v);
	} else {
	    // blend(srcImg,x,y,    width, height,dx,dy,    dwidth, dheight,MODE)
	    mod.processing.blend(v1.v, v2.v, v3.v, v4.v, v5.v,
				 v6.v, v7.v, v8.v, v9.v, v10.v);
	}
    });

    mod.blendColor = new Sk.builtin.func(function (c1, c2, mode) {
	// blendColor(c1,c2,MODE)
        var c = Sk.misceval.callsim(mod.color,
				    new Sk.builtin.int_(0),
				    new Sk.builtin.int_(0),
				    new Sk.builtin.int_(0));
	c.v = mod.processing.blendColor(c1.v, c2.v, mode.v);
	return c;
    });

    mod.brightness = new Sk.builtin.func(function (r, g, b) {
        if (typeof(g) === "undefined") {
	    return new Sk.builtin.float_(mod.processing.brightness(r.v));
        } else if (typeof(b) === "undefined") {
	    return new Sk.builtin.float_(mod.processing.brightness(r.v, g.v));
        } else {
	    return new Sk.builtin.float_(mod.processing.brightness(r.v, g.v, b.v));
	}
    });

    mod.camera = new Sk.builtin.func(function (eyeX, eyeY, eyeZ,
					       centerX, centerY, centerZ,
					       upX, upY, upZ) {
	// camera()
	// camera(eyeX, eyeY, eyeZ,centerX, centerY, centerZ,upX, upY, upZ)
        if (typeof(eyeX) === "undefined") {
	    mod.processing.camera();
	} else {
	    mod.processing.camera(eyeX.v, eyeY.v, eyeZ.v,
				  centerX.v, centerY.v, centerZ.v,
				  upX.v, upY.v, upZ.v);
	}
    });

    mod.constrain = new Sk.builtin.func(function (value, min, max) {
	return new Sk.builtin.float_(mod.processing.constrain(value.v, min.v, max.v));
    });

    mod.copy = new Sk.builtin.func(function (v1, v2, v3, v4, v5,
					      v6, v7, v8, v9) {
	if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
	    // copy(x,     y,width,height,dx,    dy,dwidth,dheight)
	    mod.processing.copy(v1.v, v2.v, v3.v, v4.v, v5.v,
				v6.v, v7.v, v8.v);
	} else {
	    // copy(srcImg,x,y,    width, height,dx,dy,    dwidth, dheight)
	    mod.processing.copy(v1.v, v2.v, v3.v, v4.v, v5.v,
				v6.v, v7.v, v8.v, v9.v);
	}
    });

    mod.createFont = new Sk.builtin.func(function (name, size, smooth, charset) {
	// createFont(name, size)
	// createFont(name, size, smooth)
	// createFont(name, size, smooth, charset)
	var font = Sk.misceval.callsim(mod.PFont);
        if (typeof(smooth) === "undefined") {
	    font.v = mod.processing.createFont(name.v, size.v);
	} else if (typeof(charset) === "undefined") {
	    font.v = mod.processing.createFont(name.v, size.v, smooth.v);
	} else {
	    font.v = mod.processing.createFont(name.v, size.v, smooth.v, charset.v);
	}
	return font;
    });

    mod.createGraphics = new Sk.builtin.func(function (width, height, renderer, filename) {
	// createGraphics(width, height, renderer)
	// createGraphics(width, height, renderer, filename)
	var graphics = Sk.misceval.callsim(mod.PGraphics);
        if (typeof(filename) === "undefined") {
	    graphics.v = mod.processing.createGraphics(width.v, height.v, renderer.v);
	} else {
	    graphics.v = mod.processing.createGraphics(width.v, height.v, renderer.v, filename.v);
	}
	return graphics;
    });

    mod.createImage = new Sk.builtin.func(function (width, height, format) {
	var image = Sk.misceval.callsim(mod.PImage);
	image.v = mod.processing.createImage(width.v, height.v, format.v);
	return image;
    });

    mod.cursor = new Sk.builtin.func(function (v, x, y) {
	// cursor()
	// cursor(MODE)
	// cursor(image,x,y)
        if (typeof(v) === "undefined") {
	    mod.processing.cursor();
	} else if (typeof(x) === "undefined") {
	    mod.processing.cursor(v.v);
	} else if (typeof(y) === "undefined") {
	    mod.processing.cursor(v.v, x.v);
	} else {
	    mod.processing.cursor(v.v, x.v, y.v);
	}
    });

    mod.curve = new Sk.builtin.func(function (v1, v2, v3, v4,
					      v5, v6, v7, v8,
					      v9, v10, v11, v12) {
	// curve(x1, y1, x2, y2, x3, y3, x4, y4);
	// curve(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4);
        if (typeof(v9) === "undefined") {
	    mod.processing.curve(v1.v, v2.v, v3.v, v4.v,
				 v5.v, v6.v, v7.v, v8.v);
	} else if (typeof(v10) === "undefined") {
	    mod.processing.curve(v1.v, v2.v, v3.v, v4.v,
				 v5.v, v6.v, v7.v, v8.v,
				 v9.v);
	} else if (typeof(v11) === "undefined") {
	    mod.processing.curve(v1.v, v2.v, v3.v, v4.v,
				 v5.v, v6.v, v7.v, v8.v,
				 v9.v, v10.v);
	} else if (typeof(v12) === "undefined") {
	    mod.processing.curve(v1.v, v2.v, v3.v, v4.v,
				 v5.v, v6.v, v7.v, v8.v,
				 v9.v, v10.v, v11.v);
	} else {
	    mod.processing.curve(v1.v, v2.v, v3.v, v4.v,
				 v5.v, v6.v, v7.v, v8.v,
				 v9.v, v10.v, v11.v, v12.v);
	}
    });

    mod.curveDetail = new Sk.builtin.func(function (detail) {
	// curveDetail(detail)
	mod.processing.curveDetail(detail.v);
    });

    mod.curvePoint = new Sk.builtin.func(function (a,b,c,d,t) {
	// curvePoint(a,b,c,d,t)
	mod.processing.curvePoint(a.v,b.v,c.v,d.v,t.v);
    });

    mod.curveTangent = new Sk.builtin.func(function (a,b,c,d,t) {
	// curveTangent(a,b,c,d,t)
	mod.processing.curveTangent(a.v,b.v,c.v,d.v,t.v);
    });

    mod.curveTightness = new Sk.builtin.func(function (squishy) {
	// curveTightness(squishy)
	mod.processing.curveTightness(squishy.v);
    });

    mod.curveVertex = new Sk.builtin.func(function (x, y, z) {
	// curveVertex(x, y) 
	// curveVertex(x, y, z)
        if (typeof(z) === "undefined") {
	    mod.processing.curveVertex(x.v, y.v);
	} else {
	    mod.processing.curveVertex(x.v, y.v, z.v);
	}
    });

    mod.day = new Sk.builtin.func(function () {
	return new Sk.builtin.int_(mod.processing.day());
    });

    mod.degrees = new Sk.builtin.func(function (angle) {
	// degrees(angle)
	return new Sk.builtin.float_(mod.processing.degrees(angle.v));
    });

    mod.directionalLight = new Sk.builtin.func(function (v1,v2,v3,nx,ny,nz) {
	// directionalLight(v1,v2,v3,nx,ny,nz)
	mod.processing.directionalLight(v1.v,v2.v,v3.v,nx.v,ny.v,nz.v);
    });

    mod.dist = new Sk.builtin.func(function (x1, y1, z1, x2, y2, z2) {
	// dist(x1, y1, x2, y2)
	// dist(x1, y1, z1, x2, y2, z2)
        if (typeof(y2) === "undefined") {
	    return new Sk.builtin.float_(mod.processing.dist(x1.v, y1.v, z1.v, x2.v));
	} else if (typeof(z2) === "undefined") {
	    return new Sk.builtin.float_(mod.processing.dist(x1.v, y1.v, z1.v, x2.v, y2.v));
	} else {
	    return new Sk.builtin.float_(mod.processing.dist(x1.v, y1.v, z1.v, x2.v, y2.v, z2.v));
	}
    });

    mod.emissive = new Sk.builtin.func(function (v1, v2, v3) {
	// emissive(gray)
	// emissive(color)
	// emissive(v1,v2,v3)
        if (typeof(v2) === "undefined") {
	    mod.processing.emissive(v1.v);
	} else if (typeof(v3) === "undefined") {
	    mod.processing.emissive(v1.v, v2.v);
	} else {
	    mod.processing.emissive(v1.v, v2.v, v3.v);
	}
    });

    mod.endCamera = new Sk.builtin.func(function () {
	// endCamera()
	mod.processing.endCamera();
    });

    mod.endShape = new Sk.builtin.func(function (mode) {
	// endShape()
	// endShape(MODE)
        if (typeof(mode) === "undefined") {
	    mod.processing.endShape();
	} else {
	    mod.processing.endShape(mode.v);
	}
    });

    mod.filter = new Sk.builtin.func(function (mode, srcImg) {
	// filter(MODE)
	// filter(MODE, srcImg)
        if (typeof(srcImg) === "undefined") {
	    mod.processing.filter(mode.v);
	} else {
	    mod.processing.filter(mode.v, srcImg.v);
	}
    });

    mod.frustum = new Sk.builtin.func(function (left, right, bottom, top, near, far) {
	// frustum(left, right, bottom,top, near, far)
	mod.processing.frustum(left, right, bottom, top, near, far);
    });

    mod.hint = new Sk.builtin.func(function (item) {
	// hint(item)
	mod.processing.hint(item);
    });

    mod.hour = new Sk.builtin.func(function () {
	return new Sk.builtin.int_(mod.processing.hour());
    });

    mod.hue = new Sk.builtin.func(function (color) {
	// hue(color)
	return new Sk.builtin.float_(mod.processing.hue(color.v));
    });

    mod.imageMode = new Sk.builtin.func(function (mode) {
	mod.processing.imageMode(mode.v);
    });

    mod.lerp = new Sk.builtin.func(function (value1, value2, amt) {
	// lerp(value1, value2, amt)
	// returns float
	return new Sk.builtin.float_(mod.processing.lerp(value1.v, value2.v, amt.v));
    });

    mod.lerpColor = new Sk.builtin.func(function (c1, c2, amt) {
	// lerpColor(c1, c2, amt)
	// returns color
        var c = Sk.misceval.callsim(mod.color,
				    new Sk.builtin.int_(0),
				    new Sk.builtin.int_(0),
				    new Sk.builtin.int_(0));
	c.v = mod.processing.lerpColor(c1.v, c2.v, amt.v);
	return c;
    });

    mod.lightFalloff = new Sk.builtin.func(function (constant, linear, quadratic) {
	// lightFalloff(constant,linear,quadratic)
	mod.processing.lightFalloff(constant.v, linear.v, quadratic.v);
    });

    mod.lights = new Sk.builtin.func(function () {
	mod.processing.lights();
    });

    mod.lightSpecular = new Sk.builtin.func(function (v1, v2, v3) {
	// lightSpecular(v1,v2,v3)
	mod.processing.lightSpecular(v1.v, v2.v, v3.v);
    });

    mod.loadBytes = new Sk.builtin.func(function (filename) {
	// loadBytes(filename)
	// returns byte[]
	return new Sk.builtin.list(mod.processing.loadBytes(filename.v));
    });

    mod.loadFont = new Sk.builtin.func(function (fontname) {
	// loadFont(fontname)
	// returns font
	var font = Sk.misceval.callsim(mod.PFont);
	font.v = mod.processing.loadFont(fontname.v);
	return font;
    });

    mod.loadShape = new Sk.builtin.func(function (filename) {
	// loadShape(filename)
	// returns shape
	var shape = Sk.misceval.callsim(mod.PShapeSVG, 
					new Sk.builtin.str("string"),
					filename);
	return shape;
    });

    mod.loadStrings = new Sk.builtin.func(function (filename) {
	// loadStrings(filename)
	// returns string []
	return new Sk.builtin.list(mod.processing.loadStrings(filename.v));
    });

    mod.mag = new Sk.builtin.func(function (a, b, c) {
	// mag(a,b)
	// mag(a,b,c)
	// returns magnitude as float
        if (typeof(c) === "undefined") {
	    return new Sk.builtin.float_(mod.processing.mag(a.v, b.v));
        } else {
	    return new Sk.builtin.float_(mod.processing.mag(a.v, b.v, c.v));
	}
    });

    mod.map = new Sk.builtin.func(function (value,low1,high1,low2,high2) {
	// map(value,low1,high1,low2,high2)
	// returns float
	return new Sk.builtin.float_(mod.processing.map(value.v,low1.v,high1.v,
						   low2.v,high2.v));
    });

    mod.millis = new Sk.builtin.func(function () {
	return new Sk.builtin.int_(mod.processing.millis());
    });

    mod.minute = new Sk.builtin.func(function () {
	return new Sk.builtin.int_(mod.processing.minute());
    });

    mod.modelX = new Sk.builtin.func(function (x, y, z) {
	// modelX(x,y,z)
	// returns float
	return new Sk.builtin.float_(mod.processing.modelX(x.v, y.v, z.v));
    });

    mod.modelY = new Sk.builtin.func(function (x, y, z) {
	// modelY(x,y,z)
	// returns float
	return new Sk.builtin.float_(mod.processing.modelY(x.v, y.v, z.v));
    });

    mod.modelZ = new Sk.builtin.func(function (x, y, z) {
	// modelZ(x,y,z)
	// returns float
	return new Sk.builtin.float_(mod.processing.modelZ(x.v, y.v, z.v));
    });

    mod.month = new Sk.builtin.func(function () {
	return new Sk.builtin.int_(mod.processing.month());
    });

    mod.noCursor = new Sk.builtin.func(function () {
	mod.processing.noCursor();
    });

    mod.noise = new Sk.builtin.func(function (x, y, z) {
	// noise(x)
	// noise(x, y)
	// noise(x, y, z)
	// returns float
        if (typeof(y) === "undefined") {
	    return new Sk.builtin.float_(mod.processing.noise(x.v));
        } else if (typeof(z) === "undefined") {
	    return new Sk.builtin.float_(mod.processing.noise(x.v, y.v));
        } else {
	    return new Sk.builtin.float_(mod.processing.noise(x.v, y.v, z.v));
	}
    });

    mod.noiseDetail = new Sk.builtin.func(function (octaves, falloff) {
	// noiseDetail(octaves);
	// noiseDetail(octaves,falloff);
	mod.processing.noiseDetail(octaves.v, falloff.v);
    });

    mod.noiseSeed = new Sk.builtin.func(function (value) {
	// noiseSeed(value); int
	// returns float
	return new Sk.builtin.float_(mod.processing.noiseSeed(value.v));
    });

    mod.noLights = new Sk.builtin.func(function () {
	mod.processing.noLights();
    });

    mod.norm = new Sk.builtin.func(function (value, low, high) {
	// norm(value, low, high)
	// returns float
	return new Sk.builtin.float_(mod.processing.norm(value.v, low.v, high.v));
    });

    mod.normal = new Sk.builtin.func(function (nx, ny, nz) {
	// normal(nx,ny,nz)
	// returns None
	mod.processing.normal(nx.v, ny.v, nz.v);
    });

    mod.noTint = new Sk.builtin.func(function () {
	mod.processing.noTint();
    });

    mod.ortho = new Sk.builtin.func(function (left, right, bottom, top, near, far) {
	// ortho(left, right, bottom,top, near,far)
	// returns None
	mod.processing.ortho(left.v, right.v, bottom.v, top.v, near.v, far.v);
    });

    mod.perspective = new Sk.builtin.func(function (fov, aspect, zNear, zFar) {
	// perspective()
	// perspective(fov, aspect, zNear, zFar)
	// returns None
        if (typeof(fov) === "undefined") {
	    mod.processing.perspective();
        } else if (typeof(aspect) === "undefined") {
	    mod.processing.perspective(fov.v);
        } else if (typeof(zNear) === "undefined") {
	    mod.processing.perspective(fov.v, aspect.v);
        } else if (typeof(zFar) === "undefined") {
	    mod.processing.perspective(fov.v, aspect.v, zNear.v);
        } else {
	    mod.processing.perspective(fov.v, aspect.v, zNear.v, zFar.v);
	}
    });

    mod.pointLight = new Sk.builtin.func(function (v1,v2,v3,nx,ny,nz) {
	// pointLight(v1,v2,v3,nx,ny,nz)
	// returns None
	mod.processing.pointLight(v1.v,v2.v,v3.v,nx.v,ny.v,nz.v);
    });

    mod.printCamera = new Sk.builtin.func(function () {
	// printCamera()
	// returns None
	mod.processing.printCamera();
    });

    mod.println = new Sk.builtin.func(function (data) {
	// println(data)
	mod.processing.println(data.v);
    });

    mod.printProjection = new Sk.builtin.func(function () {
	// printProjection()
	// returns None
	mod.processing.printProjection();
    });

    mod.radians = new Sk.builtin.func(function (angle) {
	// radians(angle)
	// returns int or float
	return new Sk.builtin.float_(mod.processing.radians(angle.v));
    });

    mod.randomSeed = new Sk.builtin.func(function (value) {
	// noiseSeed(value);
	// returns float
	return new Sk.builtin.float_(mod.processing.randomSeed(value.v));
    });

    mod.random = new Sk.builtin.func(function (v1, v2) {
	// random();
	// random(high);
	// random(low, high);
	// returns float
        if (typeof(v1) === "undefined") {
	    return new Sk.builtin.float_(mod.processing.random());
        } else if (typeof(v2) === "undefined") {
	    return new Sk.builtin.float_(mod.processing.random(v1.v));
        } else {
	    return new Sk.builtin.float_(mod.processing.random(v1.v, v2.v));
	}
    });

    mod.requestImage = new Sk.builtin.func(function (filename, extension) {
	// requestImage(filename)
	// requestImage(filename, extension)
	var image = Sk.misceval.callsim(mod.PImage);
        if (typeof(extension) === "undefined") {
	    image.v = mod.processing.requestImage(filename.v);
        } else {
	    image.v = mod.processing.requestImage(filename.v, extension.v);
	}
	return image;
    });

    mod.saturation = new Sk.builtin.func(function (color) {
	// saturation(color)
	// returns float
	return new Sk.builtin.float_(mod.processing.saturation(color.v));
    });

    mod.save = new Sk.builtin.func(function (filename) {
	// save(filename)
	// returns None
	mod.processing.save(filename.v);
    });

    mod.saveFrame = new Sk.builtin.func(function (filename) {
	// saveFrame()
	// saveFrame(filename-####.ext)
	// returns None
        if (typeof(filename) === "undefined") {
	    mod.processing.saveFrame();
        } else {
	    mod.processing.saveFrame(filename.v);
	}
    });

    mod.saveStrings = new Sk.builtin.func(function (filename, strings) {
	// saveStrings(filename,strings)
	mod.processing.saveStrings(filename.v, strings.v);
    });

    mod.screenX = new Sk.builtin.func(function (x, y, z) {
	// screenX(x,y,z)
	// returns float
	return new Sk.builtin.float_(mod.processing.screenX(x.v, y.v, z.v));
    });

    mod.screenY = new Sk.builtin.func(function (x, y, z) {
	// screenY(x,y,z)
	// returns float
	return new Sk.builtin.float_(mod.processing.screenY(x.v, y.v, z.v));
    });

    mod.screenZ = new Sk.builtin.func(function (x, y, z) {
	// screenZ(x,y,z)
	// returns float
	return new Sk.builtin.float_(mod.processing.screenZ(x.v, y.v, z.v));
    });

    mod.second = new Sk.builtin.func(function () {
	return new Sk.builtin.int_(mod.processing.second());
    });

    mod.shape = new Sk.builtin.func(function (sh, x, y, width, height) {
	// shape(sh)
	// shape(sh,x,y)
	// shape(sh,x,y,width,height)
	// returns?
        if (typeof(x) === "undefined") {
	    mod.processing.shape(sh.v);
        } else if (typeof(y) === "undefined") {
	    mod.processing.shape(sh.v,x.v);
        } else if (typeof(width) === "undefined") {
	    mod.processing.shape(sh.v,x.v,y.v);
        } else if (typeof(height) === "undefined") {
	    mod.processing.shape(sh.v,x.v,y.v,width.v);
        } else {
	    mod.processing.shape(sh.v,x.v,y.v,width.v,height.v);
	}
    });

    mod.shapeMode = new Sk.builtin.func(function (mode) {
	// shapeMode(MODE)
	mod.processing.shapeMode(mode.v);
    });

    mod.shininess = new Sk.builtin.func(function (shine) {
	// shininess(shine)
	// returns None
	mod.processing.shininess(shine.v);
    });

    mod.specular = new Sk.builtin.func(function (v1,v2,v3) {
	// specular(gray)
	// specular(color)
	// specular(v1,v2,v3)
        if (typeof(v2) === "undefined") {
	    mod.processing.specular(v1.v);
        } else if (typeof(v3) === "undefined") {
	    mod.processing.specular(v1.v,v2.v);
        } else {
	    mod.processing.specular(v1.v,v2.v,v3.v);
	}
    });

    mod.spotLight = new Sk.builtin.func(function (v1,v2,v3,nx,ny,nz,angle,concentration) {
	// spotLight(v1,v2,v3,nx,ny,nz,angle,concentration)
	// returns None
	mod.processing.spotLight(v1.v,v2.v,v3.v,nx.v,ny.v,nz.v,angle.v,concentration.v);
    });

    mod.sq = new Sk.builtin.func(function (value) {
	// sq(value)
	// returns squared number
	return new Sk.builtin.float_(mod.processing.sq(value));
    });

    mod.status = new Sk.builtin.func(function (text) {
	// status(text)
	mod.processing.status(text.v);
    });

    mod.textAlign = new Sk.builtin.func(function (align, yalign) {
	// textAlign(ALIGN)
	// textAlign(ALIGN, YALIGN)
	// returns None
        if (typeof(yalign) === "undefined") {
	    mod.processing.textAlign(align.v);
        } else {
	    mod.processing.textAlign(align.v, yalign.v);
	}
    });

    mod.textAscent = new Sk.builtin.func(function () {
	// returns float
	return new Sk.builtin.float_(mod.processing.textAscent());
    });

    mod.textDescent = new Sk.builtin.func(function () {
	// returns float
	return new Sk.builtin.float_(mod.processing.textDescent());
    });

    mod.textFont = new Sk.builtin.func(function (font, size) {
	// textFont(font)
	// textFont(font, size)
        if (typeof(size) === "undefined") {
	    mod.processing.textFont(font.v);
        } else {
	    mod.processing.textFont(font.v, size.v);
	}
    });

    mod.textLeading = new Sk.builtin.func(function (dist) {
	// textLeading(dist)
	// returns None
	mod.processing.textLeading(dist.v);
    });

    mod.textMode = new Sk.builtin.func(function (mode) {
	// textMode(MODE)
	// returns None
	mod.processing.textMode(mode.v);
    });

    mod.textSize = new Sk.builtin.func(function (size) {
	// textSize(size)
	// returns None
	mod.processing.textSize(size.v);
    });

    mod.texture = new Sk.builtin.func(function (img) {
	// texture(img)
	// returns None
	mod.processing.texture(img.v);
    });

    mod.textureMode = new Sk.builtin.func(function (mode) {
	// textureMode(MODE)
	// returns None
	mod.processing.textureMode(mode.v);
    });

    mod.textWidth = new Sk.builtin.func(function (data) {
	// textWidth(data)
	// returns float
	return new Sk.builtin.float_(mod.processing.textWidth(data.v));
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
	    mod.processing.tint(v1.v);
        } else if (typeof(v3) === "undefined") {
	    mod.processing.tint(v1.v, v2.v);
        } else if (typeof(v4) === "undefined") {
	    mod.processing.tint(v1.v, v2.v, v3.v);
        } else {
	    mod.processing.tint(v1.v, v2.v, v3.v, v4.v);
	}
    });

    mod.updatePixels = new Sk.builtin.func(function () {
	// updatePixels()
	mod.processing.updatePixels();
    });

    mod.vertex = new Sk.builtin.func(function (x, y, z, u, v) {
	// vertex(x, y); 
	// vertex(x, y, z); 
	// vertex(x, y, u, v); 
	// vertex(x, y, z, u, v);
        if (typeof(z) === "undefined") {
	    mod.processing.vertex(x.v, y.v);
        } else if (typeof(u) === "undefined") {
	    mod.processing.vertex(x.v, y.v, z.v);
        } else if (typeof(v) === "undefined") {
	    mod.processing.vertex(x.v, y.v, z.v, u.v);
        } else {
	    mod.processing.vertex(x.v, y.v, z.v, u.v, v.v);
	}
    });

    mod.year = new Sk.builtin.func(function () {
	return new Sk.builtin.int_(mod.processing.year());
    });

    // 3D Primitives

    mod.box = new Sk.builtin.func(function(size) {
        mod.processing.box(size.v);
    });

    mod.sphere = new Sk.builtin.func(function(radius) {
        mod.processing.sphere(radius.v);
    });

    mod.sphereDetail = new Sk.builtin.func(function(res,vres) {
        if (typeof(vres) === "undefined") {
            mod.processing.sphereDetail(res.v);
        }
        else {
            mod.processing.sphereDetail(res.v, vres.v);
        }
    });

    // Color
    mod.background = new Sk.builtin.func(function (r, g, b) {

        if (typeof(g) !== "undefined") {
            g = g.v;
        }
        if (typeof(b) !== "undefined") {
            b = b.v;
        }

        mod.processing.background(r.v, g, b);

    });

    mod.fill = new Sk.builtin.func(function (r, g, b, alpha) {
        // r will be either:
        //      a number in which case the fill will be grayscale
        //      a color object
        // g, and b may be undefined.  If they hold values it will
        // be assumed that we have an r,g,b color tuple
        // alpha may also be undefined - if defined, it is the opacity of the fill
        if (typeof(g) !== "undefined") {
            g = g.v;
        }
        if (typeof(b) !== "undefined") {
            b = b.v;
        }
        if (typeof(alpha) !== "undefined") {
            alpha = alpha.v;
        }

        mod.processing.fill(r.v, g, b, alpha);

    });


    mod.stroke = new Sk.builtin.func(function (r, g, b) {

        if (typeof(g) !== "undefined") {
            g = g.v;
        }
        if (typeof(b) !== "undefined") {
            b = b.v;
        }

        mod.processing.stroke(r.v, g, b);

    });

    mod.noStroke = new Sk.builtin.func(function () {
        mod.processing.noStroke();
    });


    mod.colorMode = new Sk.builtin.func(function (mode, maxV, maxG, maxB, maxAlpha) {
        // mode is one of RGB or HSB
        // maxV is either the max value for all color elements
        // or the range for Red/Hue (depending on mode) if maxG and maxB are defined
        if (typeof(maxV) === "undefined") {
            maxV = 255;
        }
        else {
            maxV = maxV.v;
        }
        if (typeof(maxG) !== "undefined") {
            maxG = maxG.v;
        }
        if (typeof(maxB) !== "undefined") {
            maxB = maxB.v;
        }
        if (typeof(maxAlpha) !== "undefined") {
            maxAlpha = maxAlpha.v;
        }

        mod.processing.colorMode(mode.v, maxV, maxG, maxB, maxAlpha);
    });

    mod.noFill = new Sk.builtin.func(function () {
        mod.processing.noFill();
    });


    // Environment

    mod.loop = new Sk.builtin.func(function () {
        if (mod.processing === null) {
            throw new Sk.builtin.Exception("loop() should be called after run()");
        }
        looping = true;
        mod.processing.loop();
    });

    mod.noLoop = new Sk.builtin.func(function () {
        if (mod.processing === null) {
            throw new Sk.builtin.Exception("noLoop() should be called after run()");
        }
        looping = false;
        mod.processing.noLoop();
    });

    // NOTE: difference with ProcessingJS
    // frameRate is only a function, not a variable: 
    // use environment.frameRate for value
    mod.frameRate = new Sk.builtin.func(function (fr) {
        mod.processing.frameRate(fr.v);
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

    mod.width = new Sk.builtin.int_(100);
    mod.height = new Sk.builtin.int_(100);

    mod.size = new Sk.builtin.func(function (w, h, mode) {
        if (typeof(mode) === "undefined") {
            mode = mod.P2D;
        }
        mod.processing.size(w.v, h.v, mode.v);
	mod.width = new Sk.builtin.int_(mod.processing.width);
	mod.height = new Sk.builtin.int_(mod.processing.height);
    });

    mod.exitp = new Sk.builtin.func(function (h, w) {
        mod.processing.exit();
    });

    // NOTE: difference with ProcessingJS
    // Use mouseX() or mouse.x rather than mouseX
    mod.mouseX = new Sk.builtin.func(function () {
        return new Sk.builtin.int_(mod.processing.mouseX);
    });

    // NOTE: difference with ProcessingJS
    // Use mouseY() or mouse.y rather than mouseY
    mod.mouseY = new Sk.builtin.func(function () {
        return new Sk.builtin.int_(mod.processing.mouseY);
    });

    // NOTE: difference with ProcessingJS
    // Use pmouseX() or mouse.px rather than pmouseX
    mod.pmouseX = new Sk.builtin.func(function () {
        return new Sk.builtin.int_(mod.processing.pmouseX);
    });

    // NOTE: difference with ProcessingJS
    // Use pmouseY() or mouse.py rather than pmouseY
    mod.pmouseY = new Sk.builtin.func(function () {
        return new Sk.builtin.int_(mod.processing.pmouseY);
    });

    // Attributes
    mod.rectMode = new Sk.builtin.func(function (mode) {
        mod.processing.rectMode(mode.v);
    });

    mod.strokeWeight = new Sk.builtin.func(function (wt) {
        mod.processing.strokeWeight(wt.v);

    });

    mod.smooth = new Sk.builtin.func(function () {
        mod.processing.smooth();
    });

    mod.noSmooth = new Sk.builtin.func(function () {
        mod.processing.noSmooth();
    });

    mod.ellipseMode = new Sk.builtin.func(function (mode) {
        mod.processing.ellipseMode(mode.v);
    });

    mod.strokeCap = new Sk.builtin.func(function (mode) {
        mod.processing.strokeCap(mode.v);
    });

    mod.strokeJoin = new Sk.builtin.func(function (mode) {
        mod.processing.strokeJoin(mode.v);
    });


    // Transforms
    mod.rotate = new Sk.builtin.func(function (rads) {
        // rotation in radians
        mod.processing.rotate(rads.v);
    });

    mod.rotateX = new Sk.builtin.func(function(rads) {
        mod.processing.rotateX(rads.v);
    });

    mod.rotateY = new Sk.builtin.func(function(rads) {
        mod.processing.rotateY(rads.v);
    });

    mod.rotateZ = new Sk.builtin.func(function(rads) {
        mod.processing.rotateZ(rads.v);
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
        mod.processing.scale(sx.v, sy, sz);
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
        mod.processing.translate(sx.v, sy, sz);
    });

    mod.popMatrix = new Sk.builtin.func(function() {
        mod.processing.popMatrix();
    });

    mod.pushMatrix = new Sk.builtin.func(function() {
        mod.processing.pushMatrix();
    });

    mod.applyMatrix = new Sk.builtin.func(function() {
        var args = Array.prototype.slice.call(arguments, 0, 16),
            i;

        for (i = 0; i < args.length; i++) {
            args[i] = typeof(args[i]) === "undefined" ? 0.0 : args[i].v;
        }

        mod.processing.applyMatrix.apply(mod.processing, args);
    });

    mod.resetMatrix = new Sk.builtin.func(function() {
        mod.processing.resetMatrix();
    });

    mod.printMatrix = new Sk.builtin.func(function() {
        return Sk.ffi.remapToPy(mod.processing.printMatrix());
    });

    //  //////////////////////////////////////////////////////////////////////
    //  Run
    // 
    //  Create the processing context and setup of calls to setup, draw etc.
    //
    //
    //  //////////////////////////////////////////////////////////////////////    
    mod.run = new Sk.builtin.func(function () {
        function sketchProc (processing) {
            mod.processing = processing;

            // processing.setup = function() {
            //     if Sk.globals["setup"]
            //         Sk.misceval.callsim(Sk.globals["setup"])
            // }


            // FIXME if no Sk.globals["draw"], then no need for this
            processing.draw = function () {
                // if there are pending image loads then just use the natural looping calls to 
                // retry until all the images are loaded.  If noLoop was called in setup then make
                // sure to revert to that after all the images in hand.
                var wait = false;
                for (var i in imList) {
                    if (imList[i].width === 0) {
                        wait = true;
                    }
                }
                if (wait === true) {
                    if (looping === true) {
                        return;
                    }
                    else {
                        processing.loop();
                        return;
                    }

                } else {
                    if (looping === false) {
                        processing.noLoop();
                    }
                }

                mod.frameCount = processing.frameCount;
                if (Sk.globals["draw"]) {
                	try {
                   	    Sk.misceval.callsim(Sk.globals["draw"]);
                    }
                    catch(e) {
                        Sk.uncaughtException(e);
                    }
				}
            };

            var callBacks = ["setup", "mouseMoved", "mouseClicked", "mouseDragged", "mouseMoved", "mouseOut",
                "mouseOver", "mousePressed", "mouseReleased", "keyPressed", "keyReleased", "keyTyped"
            ];
            for (var cb in callBacks) {
                if (Sk.globals[callBacks[cb]]) {
                    processing[callBacks[cb]] = new Function("try {Sk.misceval.callsim(Sk.globals['" + callBacks[cb] + "']);} catch(e) {Sk.uncaughtException(e);}");
                }
            }
        }

        var canvas = document.getElementById(Sk.canvas);
        if (canvas.tagName !== "CANVAS") {
            var mydiv = canvas;
            canvas = document.createElement('canvas');
            while (mydiv.firstChild) {
                mydiv.removeChild(mydiv.firstChild);
            }
            mydiv.appendChild(canvas);
        }
        window.$(canvas).show();
        window.Processing.logger = { log : function(message) {
            Sk.misceval.print_(message);
        }};
        // if a Processing instance already exists it's likely still running, stop it by exiting
        instance = window.Processing.getInstanceById(Sk.canvas);
        if (instance) {
            instance.exit();
        }
        mod.p = new window.Processing(canvas, sketchProc);


    });

    mouseClass = function ($gbl, $loc) {

        $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
	    key = Sk.ffi.remapToJs(key);
            if (key === "x") {
                return Sk.builtin.assk$(mod.processing.mouseX);
            }
            else if (key === "y") {
                return Sk.builtin.assk$(mod.processing.mouseY);
            }
            else if (key === "px") {
                return Sk.builtin.assk$(mod.processing.pmouseX);
            }
            else if (key === "py") {
                return Sk.builtin.assk$(mod.processing.pmouseY);
            }
            else if (key === "pressed") {
                    return new Sk.builtin.bool(mod.processing.__mousePressed);
            }
            else if (key === "button") {
                return Sk.builtin.assk$(mod.processing.mouseButton);
            }
        });

    };


    mod.Mouse = Sk.misceval.buildClass(mod, mouseClass, "Mouse", []);

    mod.mouse = Sk.misceval.callsim(mod.Mouse);

    keyboardClass = function ($gbl, $loc) {

        $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
	    key = Sk.ffi.remapToJs(key);
            if (key === "key") {
                return new Sk.builtin.str(mod.processing.key.toString());
            }
            else if (key === "keyCode") {
                return Sk.builtin.assk$(mod.processing.keyCode);
            }
            else if (key === "keyPressed") {
                return new Sk.builtin.str(mod.processing.keyPressed);
            } // todo bool
        });

    };

    mod.Keyboard = Sk.misceval.buildClass(mod, keyboardClass, "Keyboard", []);

    mod.keyboard = Sk.misceval.callsim(mod.Keyboard);


    environmentClass = function ($gbl, $loc) {

        $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
	    key = Sk.ffi.remapToJs(key);
            if (key === "frameCount") {
                return Sk.builtin.assk$(mod.processing.frameCount);
            }
            else if (key === "frameRate") {
                return Sk.builtin.assk$(mod.processing.frameRate);
            }
            else if (key === "height") {
                return Sk.builtin.assk$(mod.processing.height);
            }
            else if (key === "width") {
                return Sk.builtin.assk$(mod.processing.width);
            }
            else if (key === "online") {
                return new Sk.builtin.bool(mod.processing.online);
            }
            else if (key === "focused") {
                return new Sk.builtin.bool(mod.processing.focused);
            }
        });

    };

    mod.Environment = Sk.misceval.buildClass(mod, environmentClass, "Environment", []);

    mod.environment = Sk.misceval.callsim(mod.Environment);

    screenClass = function ($gbl, $loc) {

        $loc.__init__ = new Sk.builtin.func(function (self) {
            self.pixels = null;
        });

        $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
	    key = Sk.ffi.remapToJs(key);
            if (key === "height") {
                return Sk.builtin.assk$(mod.processing.height);
            }
            else if (key === "width") {
                return Sk.builtin.assk$(mod.processing.width);
            }
            else if (key === "pixels") {
                if (self.pixels == null) {
                    self.pixels = new Sk.builtin.list(mod.processing.pixels.toArray());
                }
            }
            return self.pixels;
        });

    };

    mod.Screen = Sk.misceval.buildClass(mod, screenClass, "Screen", []);

    mod.screen = Sk.misceval.callsim(mod.Screen);

    mod.loadPixels = new Sk.builtin.func(function () {
        mod.processing.loadPixels();
    });


    colorClass = function ($gbl, $loc) {
        /* images are loaded async.. so its best to preload them */
        $loc.__init__ = new Sk.builtin.func(function (self, val1, val2, val3, alpha) {
            if (typeof(val2) !== "undefined") {
                val2 = val2.v;
            }
            if (typeof(val3) !== "undefined") {
                val3 = val3.v;
            }
            if (typeof(alpha) !== "undefined") {
                alpha = alpha.v;
            }
            self.v = mod.processing.color(val1.v, val2, val3, alpha);
        });

    };

    mod.color = Sk.misceval.buildClass(mod, colorClass, "color", []);

    mod.red = new Sk.builtin.func(function (clr) {
        return new Sk.builtin.int_(mod.processing.red(clr.v));
    });

    mod.green = new Sk.builtin.func(function (clr) {
        return new Sk.builtin.int_(mod.processing.green(clr.v));
    });

    mod.blue = new Sk.builtin.func(function (clr) {
        return new Sk.builtin.int_(mod.processing.blue(clr.v));
    });

    // Image class and functions
    //
    imageClass = function ($gbl, $loc) {
        /* images are loaded async.. so its best to preload them */
        $loc.__init__ = new Sk.builtin.func(function (self, arg1, arg2, arg3) {
	    // PImage()
	    // PImage(img)
	    // PImage(width,height)
	    // PImage(width,height,format)
	    if (typeof(arg1) === "undefined") {
		self.v = new mod.processing.PImage();
	    } else if (typeof(arg2) === "undefined") {
		self.v = new mod.processing.PImage(arg1.v);
	    } else if (typeof(arg3) === "undefined") {
		self.v = new mod.processing.PImage(arg1.v, arg2.v);
	    } else {
		self.v = new mod.processing.PImage(arg1.v, arg2.v, arg3.v);
	    }
        });

        $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
	    key = Sk.ffi.remapToJs(key);
            if (key === "width") {
                return Sk.builtin.assk$(self.v.width);
            }
            if (key === "height") {
                return Sk.builtin.assk$(self.v.height);
            }
        });

    };

    mod.loadImage = new Sk.builtin.func(function (imfile) {
        var i = mod.processing.loadImage(imfile.v);
        imList.push(i);
	var image = Sk.misceval.callsim(mod.PImage);
	image.v = i;
        return image;
    });

    mod.image = new Sk.builtin.func(function (im, x, y, w, h) {
	// image(img, x, y)
	// image(img, x, y, width, height)
	if (typeof(w) === "undefined") {
            mod.processing.image(im.v, x.v, y.v);
	} else {
            mod.processing.image(im.v, x.v, y.v, w.v, h.v);
        }
    });

    mod.get = new Sk.builtin.func(function (x, y) {
        var clr = mod.processing.get(x.v, y.v);
        return Sk.misceval.callsim(mod.color,
            new Sk.builtin.int_(mod.processing.red(clr)),
            new Sk.builtin.int_(mod.processing.green(clr)),
            new Sk.builtin.int_(mod.processing.blue(clr)));
    });

    mod.set = new Sk.builtin.func(function (x, y, color) {
        mod.processing.set(x.v, y.v, color.v);
    });

    // --- classes

    vectorClass = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, x, y, z) {
	    // PVector()
	    // PVector(x,y)
	    // PVector(x,y,z)
            if (typeof(x) === "undefined") {
		self.v = new mod.processing.PVector();
            } else if (typeof(z) === "undefined") {
		self.v = new mod.processing.PVector(x.v, y.v);
            } else {
		self.v = new mod.processing.PVector(x.v, y.v, z.v);
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
            var new_vec = Sk.misceval.callsim(mod.PVector);
	    new_vec.v = self.v.get();
	    return new_vec;
	});
	
	$loc.set = new Sk.builtin.func(function (self, x, y, x) {
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
            var new_vec = Sk.misceval.callsim(mod.PVector);
	    new_vec.v = self.v.add(vec.v);
	    return new_vec;
	});

	$loc.sub = new Sk.builtin.func(function (self, vec) {
	    // sub()	Subtracts one vector from another
            var new_vec = Sk.misceval.callsim(mod.PVector);
	    new_vec.v = self.v.sub(vec.v);
	    return new_vec;
	});

	$loc.mult = new Sk.builtin.func(function (self, vec) {
	    // mult()	Multiplies the vector by a scalar
            var new_vec = Sk.misceval.callsim(mod.PVector);
	    new_vec.v = self.v.mult(vec.v);
	    return new_vec;
	});

	$loc.div = new Sk.builtin.func(function (self, vec) {
	    // div()	Divides the vector by a scalar
            var new_vec = Sk.misceval.callsim(mod.PVector);
	    new_vec.v = self.v.dic(vec.v);
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
            var new_vec = Sk.misceval.callsim(mod.PVector);
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

    fontClass = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, input) {
	    // PFont()
	    // PFont(input)
            if (typeof(input) === "undefined") {
		self.v = new mod.processing.PFont();
            } else {
		self.v = new mod.processing.PVector(input.v);
	    }
        });

        $loc.list = new Sk.builtin.func(function (self) {
	    // font.list()
	    return new Sk.builtin.list(self.v.list());
	});
    };

    graphicsClass = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, x, y, z) {
	    // PGraphics()
	    // PGraphics(width,height)
	    // PGraphics(width,height,applet)
            if (typeof(x) === "undefined") {
		self.v = new mod.processing.PVector();
            } else if (typeof(z) === "undefined") {
		self.v = new mod.processing.PVector(x.v, y.v);
            } else {
		self.v = new mod.processing.PVector(x.v, y.v, z.v);
	    }
        });

        $loc.beginDraw = new Sk.builtin.func(function (self) {
	    self.v.beginDraw();
	});

        $loc.endDraw = new Sk.builtin.func(function (self) {
	    self.v.endDraw();
	});
    };
    
    shapeClass = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, arg1, arg2, arg3) {
	    if (typeof(arg1) === "undefined") {
		// special version for Skulpt
		self.v = null;
		// Will fill in manually in getChild()
	    } else if (typeof(arg2) === "undefined") {
		self.v = new mod.processing.PShapeSVG(arg1.v);
	    } else if (typeof(arg3) === "undefined") {
		self.v = new mod.processing.PShapeSVG(arg1.v, arg2.v);
	    } else {
		self.v = new mod.processing.PShapeSVG(arg1.v, arg2.v, arg3.v);
	    }
        });

        $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
	    key = Sk.ffi.remapToJs(key);
            if (key === "width") {
                return Sk.builtin.assk$(self.v.width);
            } else if (key === "height") {
                return Sk.builtin.assk$(self.v.height);
	    }
	});

        $loc.isVisible = new Sk.builtin.func(function (self) {
	    // isVisible() Returns a boolean value "true" if the image is set to be visible, "false" if not
	    return new Sk.builtin.bool(self.v.isVisible());
	});

        $loc.setVisible = new Sk.builtin.func(function (self, value) {
	    // setVisible() Sets the shape to be visible or invisible
	    self.v.setVisible(value.v);
	});

        $loc.disableStyle = new Sk.builtin.func(function (self) {
	    // disableStyle() Disables the shape's style data and uses Processing styles
	    self.v.disableStyle();
	});

        $loc.enableStyle = new Sk.builtin.func(function (self) {
	    // enableStyle() Enables the shape's style data and ignores the Processing styles
	    self.v.enableStyle();
	});

        $loc.getChild = new Sk.builtin.func(function (self, shape) {
	    // getChild() Returns a child element of a shape as a PShapeSVG object
	    var child = self.v.getChild(shape.v);
	    if (child != null) {
		// special method for Skulpt:
		var new_shape = Sk.misceval.callsim(mod.PShapeSVG);
		// Now fill in value:
		new_shape.v = child;
		return new_shape;
	    } else {
		return null;
	    }
	});

        $loc.translate = new Sk.builtin.func(function (self, x, y, z) {
	    // translate() Displaces the shape
	    // sh.translate(x,y)
	    // sh.translate(x,y,z)
            if (typeof(z) === "undefined") {
		self.v.translate(x.v, y.v);
	    } else {
		self.v.translate(x.v, y.v, z.v);
	    }
	});

        $loc.rotate = new Sk.builtin.func(function (self, angle) {
	    // rotate() Rotates the shape
	    self.v.rotate(angle.v);
	});

        $loc.rotateX = new Sk.builtin.func(function (self, angle) {
	    // rotateX() Rotates the shape around the x-axis
	    self.v.rotateX(angle.v);
	});

        $loc.rotateY = new Sk.builtin.func(function (self) {
	    // rotateY() Rotates the shape around the y-axis
	    self.v.rotateY(angle.v);
	});

        $loc.rotateZ = new Sk.builtin.func(function (self) {
	    // rotateZ() Rotates the shape around the z-axis
	    self.v.rotateZ(angle.v);
	});

        $loc.scale = new Sk.builtin.func(function (self, x, y, z) {
	    // scale() Increases and decreases the size of a shape
	    // sh.scale(size)
	    // sh.scale(x,y)
	    // sh.scale(x,y,z)
            if (typeof(y) === "undefined") {
		self.v.scale(x.v);
	    } else if (typeof(z) === "undefined") {
		self.v.scale(x.v, y.v);
	    } else {
		self.v.scale(x.v, y.v, z.v);
	    }
	});
    };

    mod.PFont = Sk.misceval.buildClass(mod, fontClass, "PFont", []);
    mod.PGraphics = Sk.misceval.buildClass(mod, graphicsClass, "PGraphics", []);
    mod.PShapeSVG = Sk.misceval.buildClass(mod, shapeClass, "PShapeSVG", []);
    mod.PVector = Sk.misceval.buildClass(mod, vectorClass, "PVector", []);
    mod.PImage = Sk.misceval.buildClass(mod, imageClass, "PImage", []);

    return mod;
};
