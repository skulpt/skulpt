/*
 * @fileoverview
 * Defines a Colour class for PyAngelo using a unified CSS-style parser
 */

Sk.Colour = Sk.Colour || {};

Sk.Colour._cssCache = new Map();
Sk.Colour._cssCacheSize = 100;

// Named CSS colours
Sk.Colour.namedColours = {
    aliceblue: "#f0f8ff",
    antiquewhite: "#faebd7",
    aqua: "#00ffff",
    aquamarine: "#7fffd4",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    bisque: "#ffe4c4",
    black: "#000000",
    blanchedalmond: "#ffebcd",
    blue: "#0000ff",
    blueviolet: "#8a2be2",
    brown: "#a52a2a",
    burlywood: "#deb887",
    cadetblue: "#5f9ea0",
    chartreuse: "#7fff00",
    chocolate: "#d2691e",
    coral: "#ff7f50",
    cornflowerblue: "#6495ed",
    cornsilk: "#fff8dc",
    crimson: "#dc143c",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgoldenrod: "#b8860b",
    darkgray: "#a9a9a9",
    darkgreen: "#006400",
    darkgrey: "#a9a9a9",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b",
    darkslategray: "#2f4f4f",
    darkslategrey: "#2f4f4f",
    darkturquoise: "#00ced1",
    darkviolet: "#9400d3",
    deeppink: "#ff1493",
    deepskyblue: "#00bfff",
    dimgray: "#696969",
    dimgrey: "#696969",
    dodgerblue: "#1e90ff",
    firebrick: "#b22222",
    floralwhite: "#fffaf0",
    forestgreen: "#228b22",
    fuchsia: "#ff00ff",
    gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff",
    gold: "#ffd700",
    goldenrod: "#daa520",
    gray: "#808080",
    green: "#008000",
    greenyellow: "#adff2f",
    grey: "#808080",
    honeydew: "#f0fff0",
    hotpink: "#ff69b4",
    indianred: "#cd5c5c",
    indigo: "#4b0082",
    ivory: "#fffff0",
    khaki: "#f0e68c",
    lavender: "#e6e6fa",
    lavenderblush: "#fff0f5",
    lawngreen: "#7cfc00",
    lemonchiffon: "#fffacd",
    lightblue: "#add8e6",
    lightcoral: "#f08080",
    lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2",
    lightgray: "#d3d3d3",
    lightgreen: "#90ee90",
    lightgrey: "#d3d3d3",
    lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a",
    lightseagreen: "#20b2aa",
    lightskyblue: "#87cefa",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    lightsteelblue: "#b0c4de",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    limegreen: "#32cd32",
    linen: "#faf0e6",
    magenta: "#ff00ff",
    maroon: "#800000",
    mediumaquamarine: "#66cdaa",
    mediumblue: "#0000cd",
    mediumorchid: "#ba55d3",
    mediumpurple: "#9370db",
    mediumseagreen: "#3cb371",
    mediumslateblue: "#7b68ee",
    mediumspringgreen: "#00fa9a",
    mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585",
    midnightblue: "#191970",
    mintcream: "#f5fffa",
    mistyrose: "#ffe4e1",
    moccasin: "#ffe4b5",
    navajowhite: "#ffdead",
    navy: "#000080",
    oldlace: "#fdf5e6",
    olive: "#808000",
    olivedrab: "#6b8e23",
    orange: "#ffa500",
    orangered: "#ff4500",
    orchid: "#da70d6",
    palegoldenrod: "#eee8aa",
    palegreen: "#98fb98",
    paleturquoise: "#afeeee",
    palevioletred: "#db7093",
    papayawhip: "#ffefd5",
    peachpuff: "#ffdab9",
    peru: "#cd853f",
    pink: "#ffc0cb",
    plum: "#dda0dd",
    powderblue: "#b0e0e6",
    purple: "#800080",
    rebeccapurple: "#663399",
    red: "#ff0000",
    rosybrown: "#bc8f8f",
    royalblue: "#4169e1",
    saddlebrown: "#8b4513",
    salmon: "#fa8072",
    sandybrown: "#f4a460",
    seagreen: "#2e8b57",
    seashell: "#fff5ee",
    sienna: "#a0522d",
    silver: "#c0c0c0",
    skyblue: "#87ceeb",
    slateblue: "#6a5acd",
    slategray: "#708090",
    slategrey: "#708090",
    snow: "#fffafa",
    springgreen: "#00ff7f",
    steelblue: "#4682b4",
    tan: "#d2b48c",
    teal: "#008080",
    thistle: "#d8bfd8",
    tomato: "#ff6347",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    wheat: "#f5deb3",
    white: "#ffffff",
    whitesmoke: "#f5f5f5",
    yellow: "#ffff00",
    yellowgreen: "#9acd32"
};

// Regex fragments for CSS parsing
const INTEGER       = /(\d{1,3})/;
const DECIMAL       = /((?:\d+(?:\.\d+)?)|(?:\.\d+))/;
const PERCENT       = new RegExp(`${DECIMAL.source}%`);
const WS            = /\s*/;

// CSS colour patterns using literal regexes
Sk.Colour.colorPatterns = {
    HEX3:         /^#([a-f0-9])([a-f0-9])([a-f0-9])$/i,
    HEX4:         /^#([a-f0-9])([a-f0-9])([a-f0-9])([a-f0-9])$/i,
    HEX6:         /^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i,
    HEX8:         /^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i,
    RGB:          /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,
    RGB_PERCENT:  /^rgb\(\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i,
    RGBA:         /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)$/i,
    RGBA_PERCENT: /^rgba\(\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i
    // HSL/HSLA/HSB/HSBA can be added if needed
};

// Unified parser
Sk.Colour._parseCss = function(str) {
    // Normalize and key the cache
    const key = str.trim().toLowerCase();
    const cache = Sk.Colour._cssCache;

    // 1) Cache hit → bump to most-recent and return
    if (cache.has(key)) {
        const cached = cache.get(key);
        cache.delete(key);
        cache.set(key, cached);
        return cached;
    }

    // 2) Not cached → parse
    let m, result;

    // Named CSS colour?
    if (Sk.Colour.namedColours[key]) {
        result = Sk.Colour._parseCss(Sk.Colour.namedColours[key]);
    } else if ((m = Sk.Colour.colorPatterns.HEX3.exec(key))) {
        // HEX
        result = {
            r: parseInt(m[1] + m[1], 16),
            g: parseInt(m[2] + m[2], 16),
            b: parseInt(m[3] + m[3], 16),
            a: 255
        };
    } else if ((m = Sk.Colour.colorPatterns.HEX4.exec(key))) {
        result = {
            r: parseInt(m[1] + m[1], 16),
            g: parseInt(m[2] + m[2], 16),
            b: parseInt(m[3] + m[3], 16),
            a: parseInt(m[4] + m[4], 16)
        };
    } else if ((m = Sk.Colour.colorPatterns.HEX6.exec(key))) {
        result = {
            r: parseInt(m[1], 16),
            g: parseInt(m[2], 16),
            b: parseInt(m[3], 16),
            a: 255
        };
    } else if ((m = Sk.Colour.colorPatterns.HEX8.exec(key))) {
        result = {
            r: parseInt(m[1], 16),
            g: parseInt(m[2], 16),
            b: parseInt(m[3], 16),
            a: parseInt(m[4], 16)
        };
    } else if ((m = Sk.Colour.colorPatterns.RGB.exec(key))) {
        // rgb()
        result = {
            r: Number(m[1]),
            g: Number(m[2]),
            b: Number(m[3]),
            a: 255
        };
    } else if ((m = Sk.Colour.colorPatterns.RGB_PERCENT.exec(key))) {
        // rgb(%)
        result = {
            r: Math.round(parseFloat(m[1]) * 255 / 100),
            g: Math.round(parseFloat(m[2]) * 255 / 100),
            b: Math.round(parseFloat(m[3]) * 255 / 100),
            a: 255
        };
    } else if ((m = Sk.Colour.colorPatterns.RGBA.exec(key))) {
        // rgba()
        result = {
            r: Number(m[1]),
            g: Number(m[2]),
            b: Number(m[3]),
            a: parseFloat(m[4]) * 255
        };
    } else if ((m = Sk.Colour.colorPatterns.RGBA_PERCENT.exec(key))) {
        // rgba(%)
        result = {
            r: Math.round(parseFloat(m[1]) * 255 / 100),
            g: Math.round(parseFloat(m[2]) * 255 / 100),
            b: Math.round(parseFloat(m[3]) * 255 / 100),
            a: parseFloat(m[4]) * 255 / 100
        };
    } else {
        throw new Sk.builtin.ValueError(`Invalid CSS colour string: '${str}'`);
    }

    // 3) Store in cache (evict if full)
    if (cache.size >= Sk.Colour._cssCacheSize) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
    }
    cache.set(key, result);

    return result;
};


// Constructor using unified parser or numeric args
const initColour = function(self, input, g, b, a) {
    const argc = arguments.length;
    // list or tuple: one Python list/tuple of length 3 or 4
    if (argc === 2 &&
        (input instanceof Sk.builtin.list || input instanceof Sk.builtin.tuple)
    ) {
        const arr = Sk.ffi.remapToJs(input);
        if (arr.length === 3) {
            self._r = arr[0]; self._g = arr[1]; self._b = arr[2]; self._a = 1.0;
            return Sk.builtin.none.none$;
        }
        if (arr.length === 4) {
            self._r = arr[0]; self._g = arr[1]; self._b = arr[2]; self._a = arr[3];
            return Sk.builtin.none.none$;
        }
        throw new Sk.builtin.ValueError(
            "Colour(list) or Colour(tuple) must have length 3 or 4"
        );
    } else if (argc === 2 && Sk.builtin.checkNumber(input)) {
    // greyscale
        const v = Sk.ffi.remapToJs(input);
        if (v < 0 || v > 255) {
            throw new Sk.builtin.ValueError(`Greyscale value must be in 0–255, got ${v}`);
        }
        self._r = v;
        self._g = v;
        self._b = v;
        self._a = 1.0;
        return Sk.builtin.none.none$;
    } else if (argc === 2 && Sk.builtin.checkString(input)) {
        const parsed = Sk.Colour._parseCss(Sk.ffi.remapToJs(input));
        self._r = parsed.r;
        self._g = parsed.g;
        self._b = parsed.b;
        self._a = parsed.a / 255.0;
        return Sk.builtin.none.none$;
    } else if (argc === 3
        // Two numeric args → greyscale + alpha
        && Sk.builtin.checkNumber(input)
        && Sk.builtin.checkNumber(g)
    ) {
        const v     = Sk.ffi.remapToJs(input);
        const alpha = Sk.ffi.remapToJs(g);
        if (v < 0 || v > 255) {
            throw new Sk.builtin.ValueError(`Greyscale must be 0–255, got ${v}`);
        }
        if (alpha < 0 || alpha > 1) {
            throw new Sk.builtin.ValueError(`Alpha must be 0.0–1.0, got ${alpha}`);
        }
        self._r = v; self._g = v; self._b = v; self._a = alpha;
        return Sk.builtin.none.none$;
    } else if ((argc === 4 || argc === 5) && Sk.builtin.checkNumber(input)) {
        Sk.builtin.pyCheckType("g", "number", Sk.builtin.checkNumber(g));
        Sk.builtin.pyCheckType("b", "number", Sk.builtin.checkNumber(b));
        self._r = Sk.ffi.remapToJs(input);
        self._g = Sk.ffi.remapToJs(g);
        self._b = Sk.ffi.remapToJs(b);
        self._a = (argc === 5 && a !== Sk.builtin.none.none$) ? Sk.ffi.remapToJs(a) : 1.0;
        Sk.builtin.pyCheckType("a", "number", Sk.builtin.checkNumber(self._a));
        if (self._a < 0 || self._a > 1) {
            throw new Sk.builtin.ValueError(`Alpha must be 0.0–1.0, got ${self._a}`);
        }
        return Sk.builtin.none.none$;
    }
    throw new Sk.builtin.TypeError(
        "__init__() accepts a named colour, (CSS string) or (r, g, b[, a]) formats."
    );
};
initColour.co_name = "__init__";
initColour.func_doc =
    "__init__(value: int) -> None\n" +
    "__init__(value: int, alpha: float) -> None\n" +
    "__init__(r: int, g: int, b: int) -> None\n" +
    "__init__(r: int, g: int, b: int, a: float) -> None\n" +
    "__init__(css: str) -> None\n\n" +
    "Create a Colour instance. Supported forms:\n" +
    "  - Single integer: greyscale (0–255), alpha defaults to 1.0\n" +
    "  - Two numbers: greyscale + alpha (0.0–1.0)\n" +
    "  - Three integers: red, green, blue (0–255)\n" +
    "  - Four args: red, green, blue, alpha\n" +
    "  - CSS string: hex (\"#RGB\", \"#RRGGBB\", with optional alpha),\n" +
    "    rgb()/rgba() functions, named colours\n" +
    "  - Python list/tuple of 3 or 4 numbers (unpacked as RGB(A))\n\n" +
    "Properties:\n" +
    "    red, green, blue  — get/set each channel (0–255)\n" +
    "    alpha             — get/set alpha (0.0–1.0)\n\n" +
    "Methods:\n" +
    "    css()             — return a CSS-style \"rgba(r, g, b, a)\" string\n\n" +
    "Examples:\n" +
    "    Colour(128)                  # greyscale\n" +
    "    Colour(128, 0.5)             # greyscale with alpha\n" +
    "    Colour(255, 0, 128)          # RGB\n" +
    "    Colour(255, 0, 128, 0.2)     # RGBA\n" +
    "    Colour('#abc')               # hex\n" +
    "    Colour('rgba(10,20,30,0.5)') # CSS string\n" +
    "    Colour([10,20,30])           # list unpack\n" +
    "    c = Colour(10,20,30)\n" +
    "    c.red = 200\n" +
    "    print(c.css())               # \"rgba(200, 20, 30, 1.00)\"";


// Build class
const colourClass = function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(initColour);
    $loc.__repr__ = new Sk.builtin.func(function(self) {
        return new Sk.builtin.str(
            `Colour(${self._r}, ${self._g}, ${self._b}, ${self._a})`
        );
    });
    $loc.__str__ = new Sk.builtin.func(function(self) {
        const a = +self._a.toFixed(2);
        return new Sk.builtin.str(
            `rgba(${self._r}, ${self._g}, ${self._b}, ${a})`
        );
    });

    // Pythonic properties
    const getRed = new Sk.builtin.func(function(self) {
        return new Sk.builtin.int_(self._r);
    });
    const setRed = new Sk.builtin.func(function(self, value) {
        Sk.builtin.pyCheckType("value", "number", Sk.builtin.checkNumber(value));
        const v = Sk.ffi.remapToJs(value);
        if (v < 0 || v > 255) {
            throw new Sk.builtin.ValueError("Red channel must be between 0 and 255");
        }
        self._r = v;
        return Sk.builtin.none.none$;
    });
    $loc.getRed = getRed;
    $loc.setRed = setRed;
    $loc.red = new Sk.builtin.property(getRed, setRed, null, new Sk.builtin.str("Red channel (0-255)"));

    const getGreen = new Sk.builtin.func(function(self) {
        return new Sk.builtin.int_(self._g);
    });
    const setGreen = new Sk.builtin.func(function(self, value) {
        Sk.builtin.pyCheckType("value", "number", Sk.builtin.checkNumber(value));
        const v = Sk.ffi.remapToJs(value);
        if (v < 0 || v > 255) {
            throw new Sk.builtin.ValueError("Green channel must be between 0 and 255");
        }
        self._g = v;
        return Sk.builtin.none.none$;
    });
    $loc.getGreen = getGreen;
    $loc.setGreen = setGreen;
    $loc.green = new Sk.builtin.property(getGreen, setGreen, null, new Sk.builtin.str("Green channel (0-255)"));

    const getBlue = new Sk.builtin.func(function(self) {
        return new Sk.builtin.int_(self._b);
    });
    const setBlue = new Sk.builtin.func(function(self, value) {
        Sk.builtin.pyCheckType("value", "number", Sk.builtin.checkNumber(value));
        const v = Sk.ffi.remapToJs(value);
        if (v < 0 || v > 255) {
            throw new Sk.builtin.ValueError("Blue channel must be between 0 and 255");
        }
        self._b = v;
        return Sk.builtin.none.none$;
    });
    $loc.getBlue = getBlue;
    $loc.setBlue = setBlue;
    $loc.blue = new Sk.builtin.property(getBlue, setBlue, null, new Sk.builtin.str("Blue channel (0-255)"));

    const getAlpha = new Sk.builtin.func(function(self) {
        return new Sk.builtin.float_(self._a);
    });
    const setAlpha = new Sk.builtin.func(function(self, value) {
        Sk.builtin.pyCheckType("value", "number", Sk.builtin.checkNumber(value));
        const v = Sk.ffi.remapToJs(value);
        if (v < 0 || v > 1) {
            throw new Sk.builtin.ValueError("Alpha channel must be between 0.0 and 1.0");
        }
        self._a = v;
        return Sk.builtin.none.none$;
    });
    $loc.getAlpha = getAlpha;
    $loc.setAlpha = setAlpha;
    $loc.alpha = new Sk.builtin.property(getAlpha, setAlpha, null, new Sk.builtin.str("Alpha channel (0.0-1.0)"));

    // CSS output method
    $loc.css = new Sk.builtin.func(function(self) {
        const a = +self._a.toFixed(2);
        return new Sk.builtin.str(`rgba(${self._r}, ${self._g}, ${self._b}, ${a})`);
    });
    $loc.css.func_doc =
        "css(self) -> str\n\n" +
        "Return the CSS string representation: \"rgba(r, g, b, a)\".";
};

Sk.builtin.Colour = colourClass;
Sk.builtins["Colour"] = Sk.misceval.buildClass(
    Sk.builtin, Sk.builtin.Colour, "Colour", []
);
Sk.builtins["Colour"].prototype.$doc =
  "Represents an RGBA colour.  Supports numeric overloads, CSS strings, and list/tuple inputs.";
