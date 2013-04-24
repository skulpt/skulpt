var $builtinmodule = function(name)
{
  var mod = {};

  var makeFailHTML = function(msg) {
    return '' +
      '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
      '<td align="center">' +
      '<div style="display: table-cell; vertical-align: middle;">' +
      '<div style="">' + msg + '</div>' +
      '</div>' +
      '</td></tr></table>';
  };

  var GET_A_WEBGL_BROWSER = '' +
    'This page requires a browser that supports WebGL.<br/>' +
    '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

  var NEED_HARDWARE = '' +
    "It doesn't appear your computer can support WebGL.<br/>" +
    '<a href="http://get.webgl.org">Click here for more information.</a>';
  
  var create3DContext = function(canvas) {
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var gl = null;
    for (var ii = 0; ii < names.length; ++ii) {
      try {
        gl = canvas.getContext(names[ii]);
      }
      catch(e) {
      }
      if (gl) {
          break;
      }
    }
    if (gl) {
      // Disallow selection by default. This keeps the cursor from changing to an
      // I-beam when the user clicks and drags. It's easier on the eyes.
      function returnFalse() {
        return false;
      }

      canvas.onselectstart = returnFalse;
      canvas.onmousedown = returnFalse;
    }
    return gl;
  };

  var setupWebGL = function(canvasContainerId, opt_canvas) {
    var container = document.getElementById(canvasContainerId);
    var context;
    if (!opt_canvas) {
      opt_canvas = container.getElementsByTagName("canvas")[0];
    }
    if (!opt_canvas) {
        // this browser doesn't support the canvas tag at all. Not even 2d.
      container.innerHTML = makeFailHTML(GET_A_WEBGL_BROWSER);
      return;
    }

    var gl = create3DContext(opt_canvas);
    if (!gl) {
      // TODO(gman): fix to official way to detect that it's the user's machine, not the browser.
      var browserStrings = navigator.userAgent.match(/(\w+\/.*? )/g);
      var browsers = {};
      try {
        for (var b = 0; b < browserStrings.length; ++b) {
          var parts = browserStrings[b].match(/(\w+)/g);
          var bb = [];
          for (var ii = 1; ii < parts.length; ++ii) {
            bb.push(parseInt(parts[ii]));
          }
          browsers[parts[0]] = bb;
        }
      }
      catch (e) {
      }
      if (browsers.Chrome &&
           (browsers.Chrome[0] > 7 ||
                 (browsers.Chrome[0] == 7 && browsers.Chrome[1] > 0) ||
                 (browsers.Chrome[0] == 7 && browsers.Chrome[1] == 0 && browsers.Chrome[2] >= 521))) {
        container.innerHTML = makeFailHTML(NEED_HARDWARE);
      }
      else {
        container.innerHTML = makeFailHTML(GET_A_WEBGL_BROWSER);
      }
    }
    return gl;
  };

  /**
   * The Context encapsulates the underlying WebGL native JavaScript API.
   */
  mod.Context = Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(
      function(self, canvasid) {
        var canvas = document.getElementById(canvasid.v);
        var gl = setupWebGL(canvasid.v, canvas)
        if (!gl) {
          throw new Error("Your browser does not appear to support WebGL.");
        }

        self.gl = gl;

        // Copy symbolic constants and functions from native WebGL, encapsulating where necessary.       
        for (var k in gl.__proto__) {
          if (typeof gl.__proto__[k] === 'number') {
            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str(k), gl.__proto__[k]);
          }
          else if (typeof gl.__proto__[k] === "function") {
            switch(k) {
              case 'bufferData': {
              }
              break;
              case 'clearColor': {
              }
              break;
              case 'drawArrays': {
              }
              break;
              case 'getAttribLocation': {
              }
              break;
              case 'getUniformLocation': {
              }
              break;
              case 'shaderSource': {
              }
              break;
              case 'uniformMatrix4fv': {
              }
              break;
              case 'vertexAttribPointer': {
              }
              break;
              case 'viewport': {
              }
              break;
              default: {
                (function(key) {
                  Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str(k), new Sk.builtin.func(function() {
                    var f = gl.__proto__[key];
                    return f.apply(gl, arguments);
                  }));
                 }(k));
              }
            }
          }
        }

        gl.clearColor(100.0/255.0, 149.0/255.0, 237.0/255.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    );

    $loc.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

    $loc.bufferData = new Sk.builtin.func(
      function(self, target, data, usage) {
        self.gl.bufferData(target, data.v, usage);
      }
    );

    $loc.clearColor = new Sk.builtin.func(
      function(self, red, green, blue, alpha) {
        self.gl.clearColor(Sk.builtin.asnum$(red), Sk.builtin.asnum$(green), Sk.builtin.asnum$(blue), Sk.builtin.asnum$(alpha));
      }
    );

    $loc.getAttribLocation = new Sk.builtin.func(
      function(self, program, name) {
        return self.gl.getAttribLocation(program, name.v);
      }
    );

    $loc.getUniformLocation = new Sk.builtin.func(
      function(self, program, name) {
        return self.gl.getUniformLocation(program, name.v);
      }
    );

    $loc.shaderSource = new Sk.builtin.func(
      function(self, shader, src) {
        self.gl.shaderSource(shader, src.v);
      }
    );

    $loc.drawArrays = new Sk.builtin.func(
      function(self, mode, first, count) {
        self.gl.drawArrays(Sk.builtin.asnum$(mode), Sk.builtin.asnum$(first), Sk.builtin.asnum$(count));
      }
    );

    $loc.vertexAttribPointer = new Sk.builtin.func(
      function(self, index, size, type, normalized, stride, dunno) {
        self.gl.vertexAttribPointer(index, Sk.builtin.asnum$(size), Sk.builtin.asnum$(type), normalized, Sk.builtin.asnum$(stride), Sk.builtin.asnum$(dunno));
      }
    );

    $loc.viewport = new Sk.builtin.func(
      function(self, x, y, width, height) {
        self.gl.viewport(Sk.builtin.asnum$(x), Sk.builtin.asnum$(y), Sk.builtin.asnum$(width), Sk.builtin.asnum$(height));
      }
    );

    $loc.uniformMatrix4fv = new Sk.builtin.func(
      function(self, location, transpose, values) {
//        console.log("location  " + (typeof location));
//        console.log("transpose " + (typeof transpose));
//        console.log("values.v  " + (typeof values.v));
        self.gl.uniformMatrix4fv(Sk.builtin.asnum$(location), transpose, values.v);
      }
    );

    $loc.setDrawFunc = new Sk.builtin.func(function(self, func) {
      var startTime = (new Date()).getTime();
      var intervalId = setInterval(
        function() {
          Sk.misceval.callsim(func, self, (new Date()).getTime() - startTime);
        }, 1000.0 / 60.0); // 60 fps
    });

  }, 'Context', []);

  mod.Float32Array = Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self, data) {
      if (typeof data === "number") {
        self.v = new Float32Array(data);
      }
      else {
        self.v = new Float32Array(Sk.ffi.remapToJs(data));
      }
    });

    $loc.__repr__ = new Sk.builtin.func(function(self) {
      var copy = [];
      for (var i = 0; i < self.v.length; ++i) {
        copy.push(self.v[i]);
      }
      return new Sk.builtin.str("[" + copy.join(', ') + "]");
     });
  }, 'Float32Array', []);

  /**
   * A 4x4 (mutable) matrix suitable for OpenGL.
   *
   * Mutability is chosen for performance.
   * The inderlying implementation is Float32Array.
   * The indexing of the elements is
   * 0 4  8 12
   * 1 5  9 13
   * 2 6 10 14
   * 3 7 11 15
   */
  mod.Matrix4x4 = Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self, data) {
      self.v = new Float32Array(Sk.ffi.remapToJs(data));
    });

    $loc.identity = new Sk.builtin.func(
      function(self) {

        var m = self.v;

        m[0]  = 1;
        m[1]  = 0;
        m[2]  = 0;
        m[3]  = 0;

        m[4]  = 0;
        m[5]  = 1;
        m[6]  = 0;
        m[7]  = 0;

        m[8]  = 0;
        m[9]  = 0;
        m[10] = 1;
        m[11] = 0;

        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
      }
    );

    $loc.perspective = new Sk.builtin.func(
      function(self, fov, aspect, near, far) {
        
        var t = Math.tan(Math.PI * 0.5 - 0.5 * (Sk.builtin.asnum$(fov) * Math.PI / 180));
        var a = Sk.builtin.asnum$(aspect)
        var n = Sk.builtin.asnum$(near)
        var f = Sk.builtin.asnum$(far)
        var k = 1.0 / (n - f);

        var m = self.v;

        m[0]  = t / a;
        m[1]  = 0;
        m[2]  = 0;
        m[3]  = 0;

        m[4]  = 0;
        m[5]  = t;
        m[6]  = 0;
        m[7]  = 0;

        m[8]  = 0;
        m[9]  = 0;
        m[10] = (n + f) * k;
        m[11] = -1;

        m[12] = 0;
        m[13] = 0;
        m[14] = n * f * k * 2;
        m[15] = 0;
      }
    );

    $loc.translate = new Sk.builtin.func(
      function(self, translation) {

        var m = self.v;
        var t = Sk.ffi.remapToJs(translation);

        m[0]  = 1;
        m[1]  = 0;
        m[2]  = 0;
        m[3]  = 0;

        m[4]  = 0;
        m[5]  = 1;
        m[6]  = 0;
        m[7]  = 0;

        m[8]  = 0;
        m[9]  = 0;
        m[10] = 1;
        m[11] = 0;

        m[12] = t[0];
        m[13] = t[1];
        m[14] = t[2];
        m[15] = 1;
      }
    );

    $loc.__repr__ = new Sk.builtin.func(function(self) {
      var copy = [];
      for (var i = 0; i < self.v.length; ++i) {
        copy.push(self.v[i]);
      }
      return new Sk.builtin.str("[" + copy.join(', ') + "]");
     });
  }, 'Matrix4x4', []);

  return mod;
};