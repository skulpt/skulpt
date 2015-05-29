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

    // We need this to store a reference to the actual processing object which is not created
    // until the run function is called.  Even then the processing object is passed by the
    // processing-js sytem as a parameter to the sketchProc function.  Why not set it to None here
    //

    // See:  http://processingjs.org/reference/

    mod.processing = null;
    mod.p = null;

    mod.X = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);
    mod.Y = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.Z = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);

    mod.R = Sk.builtin.assk$( 3, Sk.builtin.nmber.int$);
    mod.G = Sk.builtin.assk$( 4, Sk.builtin.nmber.int$);
    mod.B = Sk.builtin.assk$( 5, Sk.builtin.nmber.int$);
    mod.A = Sk.builtin.assk$( 6, Sk.builtin.nmber.int$);
    
    mod.U = Sk.builtin.assk$( 7, Sk.builtin.nmber.int$);
    mod.V = Sk.builtin.assk$( 8, Sk.builtin.nmber.int$);
    
    mod.NX = Sk.builtin.assk$( 9, Sk.builtin.nmber.int$);
    mod.NY = Sk.builtin.assk$( 10, Sk.builtin.nmber.int$);
    mod.NZ = Sk.builtin.assk$( 11, Sk.builtin.nmber.int$);
    
    mod.EDGE = Sk.builtin.assk$( 12, Sk.builtin.nmber.int$);
    
    // Stroke
    mod.SR = Sk.builtin.assk$( 13, Sk.builtin.nmber.int$);
    mod.SG = Sk.builtin.assk$( 14, Sk.builtin.nmber.int$);
    mod.SB = Sk.builtin.assk$( 15, Sk.builtin.nmber.int$);
    mod.SA = Sk.builtin.assk$( 16, Sk.builtin.nmber.int$);
    
    mod.SW = Sk.builtin.assk$( 17, Sk.builtin.nmber.int$);
    
    // Transformations (2D and 3D)
    mod.TX = Sk.builtin.assk$( 18, Sk.builtin.nmber.int$);
    mod.TY = Sk.builtin.assk$( 19, Sk.builtin.nmber.int$);
    mod.TZ = Sk.builtin.assk$( 20, Sk.builtin.nmber.int$);
    
    mod.VX = Sk.builtin.assk$( 21, Sk.builtin.nmber.int$);
    mod.VY = Sk.builtin.assk$( 22, Sk.builtin.nmber.int$);
    mod.VZ = Sk.builtin.assk$( 23, Sk.builtin.nmber.int$);
    mod.VW = Sk.builtin.assk$( 24, Sk.builtin.nmber.int$);
    
    // Material properties
    mod.AR = Sk.builtin.assk$( 25, Sk.builtin.nmber.int$);
    mod.AG = Sk.builtin.assk$( 26, Sk.builtin.nmber.int$);
    mod.AB = Sk.builtin.assk$( 27, Sk.builtin.nmber.int$);
    
    mod.DR = Sk.builtin.assk$( 3, Sk.builtin.nmber.int$);
    mod.DG = Sk.builtin.assk$( 4, Sk.builtin.nmber.int$);
    mod.DB = Sk.builtin.assk$( 5, Sk.builtin.nmber.int$);
    mod.DA = Sk.builtin.assk$( 6, Sk.builtin.nmber.int$);
    
    mod.SPR = Sk.builtin.assk$( 28, Sk.builtin.nmber.int$);
    mod.SPG = Sk.builtin.assk$( 29, Sk.builtin.nmber.int$);
    mod.SPB = Sk.builtin.assk$( 30, Sk.builtin.nmber.int$);
    
    mod.SHINE = Sk.builtin.assk$( 31, Sk.builtin.nmber.int$);
    
    mod.ER = Sk.builtin.assk$( 32, Sk.builtin.nmber.int$);
    mod.EG = Sk.builtin.assk$( 33, Sk.builtin.nmber.int$);
    mod.EB = Sk.builtin.assk$( 34, Sk.builtin.nmber.int$);
    
    mod.BEEN_LIT = Sk.builtin.assk$( 35, Sk.builtin.nmber.int$);
    
    mod.VERTEX_FIELD_COUNT = Sk.builtin.assk$( 36, Sk.builtin.nmber.int$);
    
    // Shape drawing modes
    mod.CENTER = Sk.builtin.assk$(3, Sk.builtin.nmber.int$);
    mod.RADIUS = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.CORNERS = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.CORNER = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);
    mod.DIAMETER = Sk.builtin.assk$(3, Sk.builtin.nmber.int$);
    
    // Text vertical alignment modes
    // Default vertical alignment for text placement
    mod.BASELINE = Sk.builtin.assk$( 0,    Sk.builtin.nmber.int$);
    // Align text to the top
    mod.TOP = Sk.builtin.assk$(      101,  Sk.builtin.nmber.int$);
    // Align text from the bottom, using the baseline
    mod.BOTTOM = Sk.builtin.assk$(   102,  Sk.builtin.nmber.int$);
    
    // UV Texture coordinate modes
    mod.NORMAL = Sk.builtin.assk$(     1, Sk.builtin.nmber.int$);
    mod.NORMALIZED = Sk.builtin.assk$( 1, Sk.builtin.nmber.int$);
    mod.IMAGE = Sk.builtin.assk$(      2, Sk.builtin.nmber.int$);
    
    // Text placement modes
    mod.MODEL = Sk.builtin.assk$( 4, Sk.builtin.nmber.int$);
    mod.SHAPE = Sk.builtin.assk$( 5, Sk.builtin.nmber.int$);
    
    // Stroke modes
    mod.SQUARE = Sk.builtin.assk$(  'butt', Sk.builtin.nmber.str);
    mod.ROUND = Sk.builtin.assk$(   'round', Sk.builtin.nmber.str);
    mod.PROJECT = Sk.builtin.assk$( 'square', Sk.builtin.nmber.str);
    mod.MITER = Sk.builtin.assk$(   'miter', Sk.builtin.nmber.str);
    mod.BEVEL = Sk.builtin.assk$(   'bevel', Sk.builtin.nmber.str);
    
    // Lighting modes
    mod.AMBIENT = Sk.builtin.assk$(     0, Sk.builtin.nmber.int$);
    mod.DIRECTIONAL = Sk.builtin.assk$( 1, Sk.builtin.nmber.int$);
    //POINT:     2, Shared with Shape constant
    mod.SPOT = Sk.builtin.assk$(        3, Sk.builtin.nmber.int$);

    // Color modes
    mod.RGB = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.ARGB = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.HSB = Sk.builtin.assk$(3, Sk.builtin.nmber.int$);
    mod.ALPHA = Sk.builtin.assk$(4, Sk.builtin.nmber.int$);
    mod.CMYK = Sk.builtin.assk$(5, Sk.builtin.nmber.int$);
    
    // Image file types
    mod.TIFF = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);
    mod.TARGA = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.JPEG = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.GIF = Sk.builtin.assk$(3, Sk.builtin.nmber.int$);

    // Stroke modes
    mod.MITER = new Sk.builtin.str("miter");
    mod.BEVEL = new Sk.builtin.str("bevel");
    mod.ROUND = new Sk.builtin.str("round");
    mod.SQUARE = new Sk.builtin.str("butt");
    mod.PROJECT = new Sk.builtin.str("square");

    // Renderer modes
    mod.P2D = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.JAVA2D = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.WEBGL = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.P3D = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.OPENGL = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.PDF = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);
    mod.DXF  = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);

    // Platform IDs
    mod.OTHER = Sk.builtin.assk$(   0, Sk.builtin.nmber.int$);
    mod.WINDOWS = Sk.builtin.assk$( 1, Sk.builtin.nmber.int$);
    mod.MAXOSX = Sk.builtin.assk$(  2, Sk.builtin.nmber.int$);
    mod.LINUX = Sk.builtin.assk$(   3, Sk.builtin.nmber.int$);
    
    mod.EPSILON = Sk.builtin.assk$( 0.0001, Sk.builtin.nmber.float$);

    mod.MAX_FLOAT = Sk.builtin.assk$(  3.4028235e+38, Sk.builtin.nmber.float$);
    mod.MIN_FLOAT = Sk.builtin.assk$( -3.4028235e+38, Sk.builtin.nmber.float$);
    mod.MAX_INT = Sk.builtin.assk$(    2147483647, Sk.builtin.nmber.int$);
    mod.MIN_INT = Sk.builtin.assk$(   -2147483648, Sk.builtin.nmber.int$);
    
    // Constants
    mod.HALF_PI = Sk.builtin.assk$(Math.PI / 2.0, Sk.builtin.nmber.float$);
    mod.THIRD_PI = Sk.builtin.assk$(Math.PI / 3.0, Sk.builtin.nmber.float$);
    mod.PI = Sk.builtin.assk$(Math.PI, Sk.builtin.nmber.float$);
    mod.TWO_PI = Sk.builtin.assk$(Math.PI * 2.0, Sk.builtin.nmber.float$);
    mod.TAU = Sk.builtin.assk$(Math.PI * 2.0, Sk.builtin.nmber.float$);
    mod.QUARTER_PI = Sk.builtin.assk$(Math.PI / 4.0, Sk.builtin.nmber.float$);

    mod.DEG_TO_RAD = Sk.builtin.assk$( Math.PI / 180, Sk.builtin.nmber.float$);
    mod.RAD_TO_DEG = Sk.builtin.assk$( 180 / Math.PI, Sk.builtin.nmber.float$);
    
    mod.WHITESPACE = Sk.builtin.assk$(" \t\n\r\f\u00A0", Sk.builtin.nmber.str);
    
    // Shape modes
    mod.POINT = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.POINTS = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.LINE = Sk.builtin.assk$(4, Sk.builtin.nmber.int$);
    mod.LINES = Sk.builtin.assk$(4, Sk.builtin.nmber.int$);
    mod.TRIANGLE = Sk.builtin.assk$(8, Sk.builtin.nmber.int$);
    mod.TRIANGLES = Sk.builtin.assk$(9, Sk.builtin.nmber.int$);
    mod.TRIANGLE_FAN = Sk.builtin.assk$(11, Sk.builtin.nmber.int$);
    mod.TRIANGLE_STRIP = Sk.builtin.assk$(10, Sk.builtin.nmber.int$);
    mod.QUAD = Sk.builtin.assk$(16, Sk.builtin.nmber.int$);
    mod.QUADS = Sk.builtin.assk$(16, Sk.builtin.nmber.int$);
    mod.QUAD_STRIP = Sk.builtin.assk$(17, Sk.builtin.nmber.int$);
    mod.POLYGON = Sk.builtin.assk$(20, Sk.builtin.nmber.int$);

    mod.PATH = Sk.builtin.assk$(21, Sk.builtin.nmber.int$);
    mod.RECT = Sk.builtin.assk$(30, Sk.builtin.nmber.int$);
    mod.ELLIPSE = Sk.builtin.assk$(31, Sk.builtin.nmber.int$);
    mod.ARC = Sk.builtin.assk$(32, Sk.builtin.nmber.int$);
    mod.SPHERE = Sk.builtin.assk$(40, Sk.builtin.nmber.int$);
    mod.BOX = Sk.builtin.assk$(41, Sk.builtin.nmber.int$);

    mod.GROUP = Sk.builtin.assk$(          0, Sk.builtin.nmber.int$);
    mod.PRIMITIVE = Sk.builtin.assk$(      1, Sk.builtin.nmber.int$);
    //PATH:         21, // shared with Shape PATH
    mod.GEOMETRY = Sk.builtin.assk$(       3, Sk.builtin.nmber.int$);
    
    // Shape Vertex
    mod.VERTEX = Sk.builtin.assk$(        0, Sk.builtin.nmber.int$);
    mod.BEZIER_VERTEX = Sk.builtin.assk$( 1, Sk.builtin.nmber.int$);
    mod.CURVE_VERTEX = Sk.builtin.assk$(  2, Sk.builtin.nmber.int$);
    mod.BREAK = Sk.builtin.assk$(         3, Sk.builtin.nmber.int$);
    mod.CLOSESHAPE = Sk.builtin.assk$(    4, Sk.builtin.nmber.int$);
    
    // Blend modes
    mod.REPLACE    = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);
    mod.BLEND      = Sk.builtin.assk$(1 << 0, Sk.builtin.nmber.int$);
    mod.ADD        = Sk.builtin.assk$(1 << 1, Sk.builtin.nmber.int$);
    mod.SUBTRACT   = Sk.builtin.assk$(1 << 2, Sk.builtin.nmber.int$);
    mod.LIGHTEST   = Sk.builtin.assk$(1 << 3, Sk.builtin.nmber.int$);
    mod.DARKEST    = Sk.builtin.assk$(1 << 4, Sk.builtin.nmber.int$);
    mod.DIFFERENCE = Sk.builtin.assk$(1 << 5, Sk.builtin.nmber.int$);
    mod.EXCLUSION  = Sk.builtin.assk$(1 << 6, Sk.builtin.nmber.int$);
    mod.MULTIPLY   = Sk.builtin.assk$(1 << 7, Sk.builtin.nmber.int$);
    mod.SCREEN     = Sk.builtin.assk$(1 << 8, Sk.builtin.nmber.int$);
    mod.OVERLAY    = Sk.builtin.assk$(1 << 9, Sk.builtin.nmber.int$);
    mod.HARD_LIGHT = Sk.builtin.assk$(1 << 10, Sk.builtin.nmber.int$);
    mod.SOFT_LIGHT = Sk.builtin.assk$(1 << 11, Sk.builtin.nmber.int$);
    mod.DODGE      = Sk.builtin.assk$(1 << 12, Sk.builtin.nmber.int$);
    mod.BURN       = Sk.builtin.assk$(1 << 13, Sk.builtin.nmber.int$);

    // Color component bit masks
    mod.ALPHA_MASK = Sk.builtin.assk$( 0xff000000, Sk.builtin.nmber.int$);
    mod.RED_MASK = Sk.builtin.assk$(   0x00ff0000, Sk.builtin.nmber.int$);
    mod.GREEN_MASK = Sk.builtin.assk$( 0x0000ff00, Sk.builtin.nmber.int$);
    mod.BLUE_MASK = Sk.builtin.assk$(  0x000000ff, Sk.builtin.nmber.int$);
    
    // Projection matrices
    mod.CUSTOM = Sk.builtin.assk$(       0, Sk.builtin.nmber.int$);
    mod.ORTHOGRAPHIC = Sk.builtin.assk$( 2, Sk.builtin.nmber.int$);
    mod.PERSPECTIVE = Sk.builtin.assk$(  3, Sk.builtin.nmber.int$);
    
    // Cursors
    mod.ARROW = Sk.builtin.assk$('default', Sk.builtin.str);
    mod.CROSS = Sk.builtin.assk$('crosshair', Sk.builtin.str);
    mod.HAND = Sk.builtin.assk$('pointer', Sk.builtin.str);
    mod.MOVE = Sk.builtin.assk$('move', Sk.builtin.str);
    mod.TEXT = Sk.builtin.assk$('text', Sk.builtin.str);
    mod.WAIT = Sk.builtin.assk$('wait', Sk.builtin.str);
    mod.NOCURSOR = Sk.builtin.assk$("url('data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='), auto", Sk.builtin.nmber.str);

    // Hints
    mod.DISABLE_OPENGL_2X_SMOOTH = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.ENABLE_OPENGL_2X_SMOOTH = Sk.builtin.assk$(-1, Sk.builtin.nmber.int$);
    mod.ENABLE_OPENGL_4X_SMOOTH = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.ENABLE_NATIVE_FONTS = Sk.builtin.assk$(3, Sk.builtin.nmber.int$);
    mod.DISABLE_DEPTH_TEST = Sk.builtin.assk$(4, Sk.builtin.nmber.int$);
    mod.ENABLE_DEPTH_TEST = Sk.builtin.assk$(-4, Sk.builtin.nmber.int$);
    mod.ENABLE_DEPTH_SORT = Sk.builtin.assk$(5, Sk.builtin.nmber.int$);
    mod.DISABLE_DEPTH_SORT = Sk.builtin.assk$(-5, Sk.builtin.nmber.int$);
    mod.DISABLE_OPENGL_ERROR_REPORT = Sk.builtin.assk$(6, Sk.builtin.nmber.int$);
    mod.ENABLE_OPENGL_ERROR_REPORT = Sk.builtin.assk$(-6, Sk.builtin.nmber.int$);
    mod.ENABLE_ACCURATE_TEXTURES = Sk.builtin.assk$(7, Sk.builtin.nmber.int$);
    mod.DISABLE_ACCURATE_TEXTURES = Sk.builtin.assk$(-7, Sk.builtin.nmber.int$);
    mod.HINT_COUNT = Sk.builtin.assk$(10, Sk.builtin.nmber.int$);

    // Shape closing modes
    mod.OPEN =  Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.CLOSE = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);

    // Filter/convert types
    mod.BLUR = Sk.builtin.assk$(11, Sk.builtin.nmber.int$);
    mod.GRAY = Sk.builtin.assk$(12, Sk.builtin.nmber.int$);
    mod.INVERT = Sk.builtin.assk$(13, Sk.builtin.nmber.int$);
    mod.OPAQUE = Sk.builtin.assk$(14, Sk.builtin.nmber.int$);
    mod.POSTERIZE = Sk.builtin.assk$(15, Sk.builtin.nmber.int$);
    mod.THRESHOLD = Sk.builtin.assk$(16, Sk.builtin.nmber.int$);
    mod.ERODE = Sk.builtin.assk$(17, Sk.builtin.nmber.int$);
    mod.DILATE = Sk.builtin.assk$(18, Sk.builtin.nmber.int$);

    // Both key and keyCode will be equal to these values
    mod.BACKSPACE = Sk.builtin.assk$( 8, Sk.builtin.nmber.int$);
    mod.TAB = Sk.builtin.assk$(9, Sk.builtin.nmber.int$);
    mod.ENTER = Sk.builtin.assk$(10, Sk.builtin.nmber.int$);
    mod.RETURN = Sk.builtin.assk$(13, Sk.builtin.nmber.int$);
    mod.ESC = Sk.builtin.assk$(27, Sk.builtin.nmber.int$);
    mod.DELETE = Sk.builtin.assk$(127, Sk.builtin.nmber.int$);
    mod.CODED = Sk.builtin.assk$(0xffff, Sk.builtin.nmber.int$);

    // p.key will be CODED and p.keyCode will be this value
    mod.SHIFT = Sk.builtin.assk$(16, Sk.builtin.nmber.int$);
    mod.CONTROL = Sk.builtin.assk$(17, Sk.builtin.nmber.int$);
    mod.ALT = Sk.builtin.assk$(18, Sk.builtin.nmber.int$);
    mod.CAPSLK = Sk.builtin.assk$(20, Sk.builtin.nmber.int$);
    mod.PGUP = Sk.builtin.assk$(33, Sk.builtin.nmber.int$);
    mod.PGDN = Sk.builtin.assk$(34, Sk.builtin.nmber.int$);
    mod.END = Sk.builtin.assk$(35, Sk.builtin.nmber.int$);
    mod.HOME = Sk.builtin.assk$(36, Sk.builtin.nmber.int$);
    mod.LEFT = Sk.builtin.assk$(37, Sk.builtin.nmber.int$);
    mod.UP = Sk.builtin.assk$(38, Sk.builtin.nmber.int$);
    mod.RIGHT = Sk.builtin.assk$(39, Sk.builtin.nmber.int$);
    mod.DOWN = Sk.builtin.assk$(40, Sk.builtin.nmber.int$);
    mod.F1 = Sk.builtin.assk$(112, Sk.builtin.nmber.int$);
    mod.F2 = Sk.builtin.assk$(113, Sk.builtin.nmber.int$);
    mod.F3 = Sk.builtin.assk$(114, Sk.builtin.nmber.int$);
    mod.F4 = Sk.builtin.assk$(115, Sk.builtin.nmber.int$);
    mod.F5 = Sk.builtin.assk$(116, Sk.builtin.nmber.int$);
    mod.F6 = Sk.builtin.assk$(117, Sk.builtin.nmber.int$);
    mod.F7 = Sk.builtin.assk$(118, Sk.builtin.nmber.int$);
    mod.F8 = Sk.builtin.assk$(119, Sk.builtin.nmber.int$);
    mod.F9 = Sk.builtin.assk$(120, Sk.builtin.nmber.int$);
    mod.F10 = Sk.builtin.assk$(121, Sk.builtin.nmber.int$);
    mod.F11 = Sk.builtin.assk$(122, Sk.builtin.nmber.int$);
    mod.F12 = Sk.builtin.assk$(123, Sk.builtin.nmber.int$);
    mod.NUMLK = Sk.builtin.assk$(144, Sk.builtin.nmber.int$);
    mod.META = Sk.builtin.assk$(157, Sk.builtin.nmber.int$);
    mod.INSERT = Sk.builtin.assk$(155, Sk.builtin.nmber.int$);

    // PJS defined constants
    mod.SINCOS_LENGTH = Sk.builtin.assk$(720, Sk.builtin.nmber.int$);
    mod.PRECISIONB = Sk.builtin.assk$(15, Sk.builtin.nmber.int$);
    mod.PRECISIONF = Sk.builtin.assk$(1 << 15, Sk.builtin.nmber.int$);
    mod.PREC_MAXVAL = Sk.builtin.assk$((1 << 15) - 1, Sk.builtin.nmber.int$);
    mod.PREC_ALPHA_SHIFT = Sk.builtin.assk$(24 - 15, Sk.builtin.nmber.int$);
    mod.PREC_RED_SHIFT = Sk.builtin.assk$(16 - 15, Sk.builtin.nmber.int$);
    mod.NORMAL_MODE_AUTO = Sk.builtin.assk$(0, Sk.builtin.nmber.int$);
    mod.NORMAL_MODE_SHAPE = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);
    mod.NORMAL_MODE_VERTEX = Sk.builtin.assk$(2, Sk.builtin.nmber.int$);
    mod.MAX_LIGHTS = Sk.builtin.assk$(8, Sk.builtin.nmber.int$);

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
            return Sk.builtin.assk$(mod.processing.alpha(r.v), Sk.builtin.nmber.float$);
        } else if (typeof(b) === "undefined") {
            return Sk.builtin.assk$(mod.processing.alpha(r.v, g.v), Sk.builtin.nmber.float$);
        } else {
            return Sk.builtin.assk$(mod.processing.alpha(r.v, g.v, b.v), Sk.builtin.nmber.float$);
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
	if (other instanceof Sk.builtin.nmber) {
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
				    Sk.builtin.assk$(0, Sk.builtin.nmber.int$),
				    Sk.builtin.assk$(0, Sk.builtin.nmber.int$),
				    Sk.builtin.assk$(0, Sk.builtin.nmber.int$));
	c.v = mod.processing.blendColor(c1.v, c2.v, mode.v);
	return c;
    });

    mod.brightness = new Sk.builtin.func(function (r, g, b) {
        if (typeof(g) === "undefined") {
	    return Sk.builtin.assk$(mod.processing.brightness(r.v),
				    Sk.builtin.nmber.float$);
        } else if (typeof(b) === "undefined") {
	    return Sk.builtin.assk$(mod.processing.brightness(r.v, g.v),
				    Sk.builtin.nmber.float$);
        } else {
	    return Sk.builtin.assk$(mod.processing.brightness(r.v, g.v, b.v),
				    Sk.builtin.nmber.float$);
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
	return Sk.builtin.assk$(mod.processing.constrain(value.v, min.v, max.v),
				Sk.builtin.nmber.float$);
    });

    mod.copy = new Sk.builtin.func(function (v1, v2, v3, v4, v5,
					      v6, v7, v8, v9) {
	if (other instanceof Sk.builtin.nmber) {
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
	return Sk.builtin.assk$(mod.processing.day(), Sk.builtin.nmber.int$);
    });

    mod.degrees = new Sk.builtin.func(function (angle) {
	// degrees(angle)
	return Sk.builtin.assk$(mod.processing.degrees(angle.v), 
				Sk.builtin.nmber.float$);
    });

    mod.directionalLight = new Sk.builtin.func(function (v1,v2,v3,nx,ny,nz) {
	// directionalLight(v1,v2,v3,nx,ny,nz)
	mod.processing.directionalLight(v1.v,v2.v,v3.v,nx.v,ny.v,nz.v);
    });

    mod.dist = new Sk.builtin.func(function (x1, y1, z1, x2, y2, z2) {
	// dist(x1, y1, x2, y2)
	// dist(x1, y1, z1, x2, y2, z2)
        if (typeof(y2) === "undefined") {
	    return Sk.builtin.assk$(mod.processing.dist(x1.v, y1.v, z1.v, x2.v),
				    Sk.builtin.nmber.float$);
	} else if (typeof(z2) === "undefined") {
	    return Sk.builtin.assk$(mod.processing.dist(x1.v, y1.v, z1.v, x2.v, y2.v),
				    Sk.builtin.nmber.float$);
	} else {
	    return Sk.builtin.assk$(mod.processing.dist(x1.v, y1.v, z1.v, x2.v, y2.v, z2.v),
				    Sk.builtin.nmber.float$);
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
	return Sk.builtin.assk$(mod.processing.hour(), Sk.builtin.nmber.int$);
    });

    mod.hue = new Sk.builtin.func(function (color) {
	// hue(color)
	return Sk.builtin.assk$(mod.processing.hue(color.v),
				Sk.builtin.nmber.float$);
    });

    mod.imageMode = new Sk.builtin.func(function (mode) {
	mod.processing.imageMode(mode.v);
    });

    mod.lerp = new Sk.builtin.func(function (value1, value2, amt) {
	// lerp(value1, value2, amt)
	// returns float
	return Sk.builtin.assk$(mod.processing.lerp(value1.v, value2.v, amt.v),
				Sk.builtin.nmber.float$);
    });

    mod.lerpColor = new Sk.builtin.func(function (c1, c2, amt) {
	// lerpColor(c1, c2, amt)
	// returns color
        var c = Sk.misceval.callsim(mod.color,
				    Sk.builtin.assk$(0, Sk.builtin.nmber.int$),
				    Sk.builtin.assk$(0, Sk.builtin.nmber.int$),
				    Sk.builtin.assk$(0, Sk.builtin.nmber.int$));
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
	    return Sk.builtin.assk$(mod.processing.mag(a.v, b.v),
				    Sk.builtin.nmber.float$);
        } else {
	    return Sk.builtin.assk$(mod.processing.mag(a.v, b.v, c.v),
				    Sk.builtin.nmber.float$);
	}
    });

    mod.map = new Sk.builtin.func(function (value,low1,high1,low2,high2) {
	// map(value,low1,high1,low2,high2)
	// returns float
	return Sk.builtin.assk$(mod.processing.map(value.v,low1.v,high1.v,
						   low2.v,high2.v),
				Sk.builtin.nmber.float$);
    });

    mod.millis = new Sk.builtin.func(function () {
	return Sk.builtin.assk$(mod.processing.millis(), Sk.builtin.nmber.int$);
    });

    mod.minute = new Sk.builtin.func(function () {
	return Sk.builtin.assk$(mod.processing.minute(), Sk.builtin.nmber.int$);
    });

    mod.modelX = new Sk.builtin.func(function (x, y, z) {
	// modelX(x,y,z)
	// returns float
	return Sk.builtin.assk$(mod.processing.modelX(x.v, y.v, z.v),
				Sk.builtin.nmber.float$);
    });

    mod.modelY = new Sk.builtin.func(function (x, y, z) {
	// modelY(x,y,z)
	// returns float
	return Sk.builtin.assk$(mod.processing.modelY(x.v, y.v, z.v),
				Sk.builtin.nmber.float$);
    });

    mod.modelZ = new Sk.builtin.func(function (x, y, z) {
	// modelZ(x,y,z)
	// returns float
	return Sk.builtin.assk$(mod.processing.modelZ(x.v, y.v, z.v),
				Sk.builtin.nmber.float$);
    });

    mod.month = new Sk.builtin.func(function () {
	return Sk.builtin.assk$(mod.processing.month(), Sk.builtin.nmber.int$);
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
	    return Sk.builtin.assk$(mod.processing.noise(x.v),
				    Sk.builtin.nmber.float$);
        } else if (typeof(z) === "undefined") {
	    return Sk.builtin.assk$(mod.processing.noise(x.v, y.v),
				    Sk.builtin.nmber.float$);
        } else {
	    return Sk.builtin.assk$(mod.processing.noise(x.v, y.v, z.v),
				    Sk.builtin.nmber.float$);
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
	return Sk.builtin.assk$(mod.processing.noiseSeed(value.v),
				Sk.builtin.nmber.float$);
    });

    mod.noLights = new Sk.builtin.func(function () {
	mod.processing.noLights();
    });

    mod.norm = new Sk.builtin.func(function (value, low, high) {
	// norm(value, low, high)
	// returns float
	return Sk.builtin.assk$(mod.processing.norm(value.v, low.v, high.v),
				Sk.builtin.nmber.float$);
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
	return Sk.builtin.assk$(mod.processing.radians(angle.v),
				Sk.builtin.nmber.float$);
    });

    mod.randomSeed = new Sk.builtin.func(function (value) {
	// noiseSeed(value);
	// returns float
	return Sk.builtin.assk$(mod.processing.randomSeed(value.v),
				Sk.builtin.nmber.float$);
    });

    mod.random = new Sk.builtin.func(function (v1, v2) {
	// random();
	// random(high);
	// random(low, high);
	// returns float
        if (typeof(v1) === "undefined") {
	    return Sk.builtin.assk$(mod.processing.random(),
				    Sk.builtin.nmber.float$);
        } else if (typeof(v2) === "undefined") {
	    return Sk.builtin.assk$(mod.processing.random(v1.v),
				    Sk.builtin.nmber.float$);
        } else {
	    return Sk.builtin.assk$(mod.processing.random(v1.v, v2.v),
				    Sk.builtin.nmber.float$);
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
	return Sk.builtin.assk$(mod.processing.saturation(color.v),
				Sk.builtin.nmber.float$);
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
	return Sk.builtin.assk$(mod.processing.screenX(x.v, y.v, z.v),
				Sk.builtin.nmber.float$);
    });

    mod.screenY = new Sk.builtin.func(function (x, y, z) {
	// screenY(x,y,z)
	// returns float
	return Sk.builtin.assk$(mod.processing.screenY(x.v, y.v, z.v),
				Sk.builtin.nmber.float$);
    });

    mod.screenZ = new Sk.builtin.func(function (x, y, z) {
	// screenZ(x,y,z)
	// returns float
	return Sk.builtin.assk$(mod.processing.screenZ(x.v, y.v, z.v),
				Sk.builtin.nmber.float$);
    });

    mod.second = new Sk.builtin.func(function () {
	return Sk.builtin.assk$(mod.processing.second(), Sk.builtin.nmber.int$);
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
	return Sk.builtin.assk$(mod.processing.sq(value),
				Sk.builtin.nmber.float$);
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
	return Sk.builtin.assk$(mod.processing.textAscent(),
				Sk.builtin.nmber.float$);
    });

    mod.textDescent = new Sk.builtin.func(function () {
	// returns float
	return Sk.builtin.assk$(mod.processing.textDescent(),
				Sk.builtin.nmber.float$);
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
	return Sk.builtin.assk$(mod.processing.textWidth(data.v),
				Sk.builtin.nmber.float$);
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
	return Sk.builtin.assk$(mod.processing.year(), Sk.builtin.nmber.int$);
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

    mod.fill = new Sk.builtin.func(function (r, g, b) {
        // r will be either:
        //      a number in which case the fill will be grayscale
        //      a color object
        // g, and b may be undefined.  If they hold values it will
        // be assumed that we have an r,g,b color tuple
        if (typeof(g) !== "undefined") {
            g = g.v;
        }
        if (typeof(b) !== "undefined") {
            b = b.v;
        }

        mod.processing.fill(r.v, g, b);

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


    mod.colorMode = new Sk.builtin.func(function (model, maxV) {
        if (typeof(maxV) === "undefined") {
            maxV = 255;
        }
        else {
            maxV = maxV.v;
        }
        mod.processing.colorMode(model.v, maxV);
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

    mod.width = Sk.builtin.assk$(100, Sk.builtin.nmber.int$);
    mod.height = Sk.builtin.assk$(100, Sk.builtin.nmber.int$);

    mod.size = new Sk.builtin.func(function (w, h, mode) {
        if (typeof(mode) === "undefined") {
            mode = mod.P2D;
        }
        mod.processing.size(w.v, h.v, mode.v);
	mod.width = Sk.builtin.assk$(mod.processing.width, Sk.builtin.nmber.int$);
	mod.height = Sk.builtin.assk$(mod.processing.height, Sk.builtin.nmber.int$);
    });

    mod.exitp = new Sk.builtin.func(function (h, w) {
        mod.processing.exit();
    });

    // NOTE: difference with ProcessingJS
    // Use mouseX() or mouse.x rather than mouseX
    mod.mouseX = new Sk.builtin.func(function () {
        return Sk.builtin.assk$(mod.processing.mouseX, Sk.builtin.nmber.int$);
    });

    // NOTE: difference with ProcessingJS
    // Use mouseY() or mouse.y rather than mouseY
    mod.mouseY = new Sk.builtin.func(function () {
        return Sk.builtin.assk$(mod.processing.mouseY, Sk.builtin.nmber.int$);
    });

    // NOTE: difference with ProcessingJS
    // Use pmouseX() or mouse.px rather than pmouseX
    mod.pmouseX = new Sk.builtin.func(function () {
        return Sk.builtin.assk$(mod.processing.pmouseX, Sk.builtin.nmber.int$);
    });

    // NOTE: difference with ProcessingJS
    // Use pmouseY() or mouse.py rather than pmouseY
    mod.pmouseY = new Sk.builtin.func(function () {
        return Sk.builtin.assk$(mod.processing.pmouseY, Sk.builtin.nmber.int$);
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
                    Sk.misceval.callsim(Sk.globals["draw"]);
		}
            };

            var callBacks = ["setup", "mouseMoved", "mouseClicked", "mouseDragged", "mouseMoved", "mouseOut",
                "mouseOver", "mousePressed", "mouseReleased", "keyPressed", "keyReleased", "keyTyped"
            ];
            for (var cb in callBacks) {
                if (Sk.globals[callBacks[cb]]) {
                    processing[callBacks[cb]] = new Function("Sk.misceval.callsim(Sk.globals['" + callBacks[cb] + "']);");
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
        mod.p = new window.Processing(canvas, sketchProc);


    });

    mouseClass = function ($gbl, $loc) {

        $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
	    key = Sk.ffi.remapToJs(key);
            if (key === "x") {
                return new Sk.builtin.nmber(mod.processing.mouseX);
            }
            else if (key === "y") {
                return new Sk.builtin.nmber(mod.processing.mouseY);
            }
            else if (key === "px") {
                return new Sk.builtin.nmber(mod.processing.pmouseX);
            }
            else if (key === "py") {
                return new Sk.builtin.nmber(mod.processing.pmouseY);
            }
            else if (key === "pressed") {
                    return new Sk.builtin.bool(mod.processing.__mousePressed);
            }
            else if (key === "button") {
                return new Sk.builtin.nmber(mod.processing.mouseButton);
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
                return new Sk.builtin.nmber(mod.processing.keyCode);
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
                return new Sk.builtin.nmber(mod.processing.frameCount);
            }
            else if (key === "frameRate") {
                return new Sk.builtin.nmber(mod.processing.frameRate);
            }
            else if (key === "height") {
                return new Sk.builtin.nmber(mod.processing.height);
            }
            else if (key === "width") {
                return new Sk.builtin.nmber(mod.processing.width);
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
                return new Sk.builtin.nmber(mod.processing.height);
            }
            else if (key === "width") {
                return new Sk.builtin.nmber(mod.processing.width);
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
        return Sk.builtin.assk$(mod.processing.red(clr.v), Sk.builtin.nmber.int$);
    });

    mod.green = new Sk.builtin.func(function (clr) {
        return Sk.builtin.assk$(mod.processing.green(clr.v), Sk.builtin.nmber.int$);
    });

    mod.blue = new Sk.builtin.func(function (clr) {
        return Sk.builtin.assk$(mod.processing.blue(clr.v), Sk.builtin.nmber.int$);
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
                return new Sk.builtin.nmber(self.v.width);
            }
            if (key === "height") {
                return new Sk.builtin.nmber(self.v.height);
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
            Sk.builtin.assk$(mod.processing.red(clr), Sk.builtin.nmber.int$),
            Sk.builtin.assk$(mod.processing.green(clr), Sk.builtin.nmber.int$),
            Sk.builtin.assk$(mod.processing.blue(clr), Sk.builtin.nmber.int$));
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
                return new Sk.builtin.nmber(self.v.x);
            } else if (key === "y") {
                return new Sk.builtin.nmber(self.v.y);
            } else if (key === "z") {
                return new Sk.builtin.nmber(self.v.z);
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
	    return new Sk.builtin.nmber(self.v.mag());
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
	    return new Sk.builtin.nmber(self.v.dist(vec.v));
	});

	$loc.dot = new Sk.builtin.func(function (self, v1, v2, v3) {
	    // dot()	Calculates the dot product
	    // returns float
	    // vec.dot(x,y,z)
	    // vec.dot(v)	    
	    if (typeof(v2) === 'undefined') {
		return new Sk.builtin.nmber(self.v.dot(v1.v));
	    } else {
		return new Sk.builtin.nmber(self.v.dot(v1.v, v2.v, v3.v));
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
	    self.v.normalize(vec.v);
	});

	$loc.limit = new Sk.builtin.func(function (self, value) {
	    // limit()	Limits the magnitude of the vector
	    self.v.limit(value.v);
	});

	$loc.angleBetween = new Sk.builtin.func(function (self, vec) {
	    // angleBetween()	Calculates the angle between two vectors
	    return new Sk.builtin.nmber(self.v.angleBetween(vec.v));
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
                return new Sk.builtin.nmber(self.v.width);
            } else if (key === "height") {
                return new Sk.builtin.nmber(self.v.height);
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
