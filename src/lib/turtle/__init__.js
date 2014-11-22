var $builtinmodule = function (name) {
'use strict';

// See if the TurtleGraphics module has already been loaded
if (Sk.TurtleGraphics && Sk.TurtleGraphics.module) {
  Sk.TurtleGraphics.reset();
  return Sk.TurtleGraphics.module;
}

return (function() {
  var _module                = {}
      , _frameRequest        = undefined
      , _frameRequestTimeout = undefined
      , _screenInstance      = undefined
      , _config              = undefined
      , _target              = undefined
      , _anonymousTurtle     = undefined
      , _mouseHandler        = undefined
      , _durationSinceRedraw = 0
      , OPTIMAL_FRAME_RATE   = 1000/30
      , SHAPES               = {}
      , TURTLE_COUNT         = 0
      , Types                = {};

  Types.FLOAT = function(value) {
    return Sk.builtin.float_(value);
  };
  Types.COLOR = function(value) {
    if (typeof value === 'string') {
      return new Sk.builtin.str(value);
    }
    else {
      for(var i = 0; i < 3; i++) {
        value[i] = new Sk.builtin.nmber(value[i], undefined);
      }
      if (value.length === 4) {
        value[3] = Sk.builtin.float_(value[3]);
      }
      return new Sk.builtin.tuple(value);
    }
  };

  SHAPES.arrow    = [[-10,0],[10,0],[0,10]];
  SHAPES.square   = [[ 10,-10],[10,10],[-10,10],[-10, -10]];
  SHAPES.triangle = [[10,-5.77],[0,11.55],[-10,-5.77]];
  SHAPES.classic  = [[0,0],[-5,-9],[0,-7],[5,-9]];
  SHAPES.turtle   = [
    [0,16],[-2,14],[-1,10],[-4,7],[-7,9],[-9,8],[-6,5],[-7,1],[-5,-3],[-8,-6]
    ,[-6,-8],[-4,-5],[0,-7],[4,-5],[6,-8],[8,-6],[5,-3],[7,1],[6,5],[9,8],[7,9]
    ,[4,7],[1,10],[2,14]
  ];

  SHAPES.circle = [
    [10,0],[9.51,3.09],[8.09,5.88],[5.88,8.09],[3.09,9.51],[0,10],[-3.09,9.51]
    ,[-5.88,8.09],[-8.09,5.88],[-9.51,3.09],[-10,0],[-9.51,-3.09],[-8.09,-5.88]
    ,[-5.88,-8.09],[-3.09,-9.51],[-0,-10],[3.09,-9.51],[5.88,-8.09],[8.09,-5.88]
    ,[9.51,-3.09]
  ];

  _config = (function() {
    var defaultSetup = {
          target       : 'turtle' // DOM element or id of parent container
          , width      : 400 // if set to 0 it will use the target width
          , height     : 400 // if set to 0 it will use the target height
          , animate    : true // enabled/disable all animated rendering
          , bufferSize : 0 // default turtle buffer size
          , allowUndo  : true // enable ability to use the undo buffer
          , reset   : function() {
            cancelAnimationFrame();
            getScreen().reset();
            getFrameManager().reset();

            if (_target) {
              while (_target.firstChild) {
                _target.removeChild(_target.firstChild);
              }
            }

            if (_mouseHandler) {
              _mouseHandler.reset();
            }

            _durationSinceRedraw = 0;
            _screenInstance      = undefined;
            _target              = undefined;
            _anonymousTurtle     = undefined;
            _mouseHandler        = undefined;
            TURTLE_COUNT         = 0;
          }
        }
        , key;

    if (!Sk.TurtleGraphics) {
      Sk.TurtleGraphics = {};
    };

    for(key in defaultSetup) {
      if (!Sk.TurtleGraphics.hasOwnProperty(key)) {
        Sk.TurtleGraphics[key] = defaultSetup[key];
      }
    }

    return Sk.TurtleGraphics;
  })();

  function FrameManager() {
    this.reset();
  }

  var _frameManager;
  function getFrameManager() {
    if (!_frameManager) {
      _frameManager = new FrameManager();
    }
    return _frameManager;
  }

  (function(proto) {
    var browserFrame;
    (function(frame) {
      if (frame) {
        browserFrame = function(method) {
          return (_frameRequest = frame(method));
        }
      }
    })(window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame);

    function animationFrame(delay) {
      if (!_config.animate) {
        return function(method) {
          method();
        };
      }

      if (!delay && browserFrame) {
        return browserFrame;
      }

      return function(method) {
         return (_frameRequestTimeout = window.setTimeout(method, delay || OPTIMAL_FRAME_RATE));
      }
    }

    proto.turtles = function() {
      return this._turtles;
    };

    proto.addTurtle = function(turtle) {
      this._turtles.push(turtle);
    };

    proto.reset = function() {
      if (this._turtles) {
        for(var i = this._turtles.length; --i >= 0;) {
          this._turtles[i].reset();
        };
      }
      this._turtles        = [];
      this._frames         = [];
      this._frameCount     = 0;
      this._buffer         = 1;
      this._rate           = 0;
      this._animationFrame = animationFrame();
    };

    proto.addFrame = function(method, countAsFrame) {
      if (countAsFrame) {
        this._frameCount += 1;
      }

      this.frames().push(method);

      return (!_config.animate || (this._buffer && this._frameCount === this.frameBuffer()))
        ? this.update()
        : Promise.resolve();
    };

    proto.frames = function() {
      return this._frames;
    };

    proto.frameBuffer = function(buffer) {
      if (typeof buffer === 'number') {
        this._buffer = buffer | 0;
        if (buffer && buffer <= this._frameCount) {
          return this.update();
        }
      }
      return this._buffer;
    };

    proto.refreshInterval = function(rate) {
      if (typeof rate === 'number') {
        this._rate = rate | 0;
        this._animationFrame = animationFrame(rate);
      }
      return this._rate;
    };

    proto.update = function() {
      return (this._frames && this._frames.length)
        ? this.requestAnimationFrame()
        : Promise.resolve();
    };

    proto.requestAnimationFrame = function() {
      var frames           = this._frames
          , animationFrame = this._animationFrame
          , turtles        = this._turtles
          , sprites        = getScreen().spriteLayer()
          , turtle, i;

      this._frames     = [];
      this._frameCount = 0;

      return new Promise(function(resolve) {
        animationFrame(function paint() {
          for (i = 0; i < frames.length; i++) {
            if (frames[i]) {
              frames[i]();
            }
          }
          clearLayer(sprites);
          for (i = 0; i < turtles.length; i++) {
            turtle = turtles[i];
            if (turtle.getState().shown) {
              drawTurtle(turtle.getState(), sprites);
            }
          }
          resolve();
        });
      });
    };
  })(FrameManager.prototype);

  function MouseHandler() {
    var self = this;

    this._target   = getTarget();
    this._managers = {};
    this._handlers = {
      mousedown : function(e) {
        self.onEvent('mousedown', e);
      },
      mouseup : function(e) {
        self.onEvent('mouseup', e);
      },
      mousemove : function(e) {
        self.onEvent('mousemove', e);
      }
    };
  }

  (function(proto) {
    proto.onEvent = function(type, e) {
      var world      = getScreen()
          , rect     = world.spriteLayer().canvas.getBoundingClientRect()
          , x        = e.clientX - rect.left | 0
          , y        = e.clientY - rect.top  | 0
          , localX   = x * world.xScale + world.llx
          , localY   = y * world.yScale - world.lly
          , managers = this._managers[type]
          , i;

      if (managers && managers.length) {
        for(i = managers.length; --i >= 0;) {
          if (type === 'mousemove') {
            if (managers[i].canMove()) {
              managers[i].trigger([localX, localY]);
            }
            continue;
          }

          managers[i].canMove(false);

          if (managers[i].test(x, y, localX, localY)) {
            if (type === 'mousedown') {
              managers[i].canMove(true);
            }
            managers[i].trigger([localX, localY]);
          }
        }
      }
    };

    proto.reset = function() {
      if (this._target) {
        for(var key in this._handlers) {
          this._target.removeEventListener(key, this._handlers[key]);
        }
      }
      this._managers = {};
    };

    proto.addManager = function(type, manager) {
      if (!this._managers[type]) {
        this._managers[type] = [];
        this._target.addEventListener(type, this._handlers[type]);
      }

      this._managers[type].push(manager);
    };

  })(MouseHandler.prototype);

  function EventManager(type, target) {
    this._type     = type;
    this._target   = target;
    this._handlers = undefined;
    getMouseHandler().addManager(type, this);
  };

  (function(proto) {
    proto.reset = function() {
      if (this._target) {
        this._target
      }
      this._handlers = undefined;
    };

    proto.canMove = function(value) {
      if (!this._target || !this._target.hitTest) return false;

      if (value !== undefined) {
        this._target.hitTest.hit = value;
      }

      return this._target.hitTest.hit;
    }

    proto.test = function(x, y, localX, localY) {
      return (this._target && this._target.hitTest)
        ? this._target.hitTest(x, y, localX, localY)
        : !!this._target;
    };

    proto.trigger = function(args) {
      var handlers  = this._handlers
          , args, i;

      if (handlers && handlers.length) {
        for (i = 0; i < handlers.length; i++) {
          handlers[i].apply({}, args);
        }
      }
    };

    proto.addHandler = function(handler, add) {
      var handlers = this._handlers;

      if (!add && handlers && handlers.length) {
        // remove all existing handlers
        while (handlers.shift()) {/* noop */};
      }

      if (typeof handler !== 'function') {
        if (handlers && !handlers.length) {
          this.reset();
        }
        return;
      };

      if (!handlers) {
        handlers = this._handlers = [];
      }

      handlers.push(handler);
    };
  })(EventManager.prototype);

  function Turtle() {
    getFrameManager().addTurtle(this);
    this._screen = getScreen();
    this._managers = {};
    this.reset();
  }

  Turtle.RADIANS = 2 * Math.PI;

  (function(proto) {
    proto.hitTest = function(mouseX, mouseY, localX, localY) {
      var context = getScreen().hitTestLayer();
      clearLayer(context);
      drawTurtle(this.getState(), context);
      var pixel = context.getImageData(mouseX,mouseY,1,1).data;
      // check alpha first since it is most likely to have a value
      return pixel[3] ||pixel[0] || pixel[1] || pixel[2];
    };

    proto.addUpdate = function(method, countAsFrame, stateChanges) {
      var self    = this
          , state = this.getState()
          , args  = Array.prototype.slice.call(arguments, stateChanges ? 2 : 3);

      return getFrameManager().addFrame(function() {
        if (method) {
          method.apply(state, args);
        }
        if (stateChanges) {
          for(var key in stateChanges) {
            state[key] = stateChanges[key];
          }
        }
      }, countAsFrame);
    };

    proto.getState = function() {
      var self = this;

      if (!this._state) {
        this._state = {
          x         : this._x
          , y       : this._y
          , angle   : this._angle
          , radians : this._radians
          , shape   : this._shape
          , color   : this._color
          , fill    : this._fill
          , filling : this._filling
          , size    : this._size
          , speed   : this._computed_speed
          , down    : this._down
          , shown   : this._shown
          , context : function() {
            return self.getPaper()
          }
        };
      }
      return this._state;
    };

    proto.translate = function(startX, startY, dx, dy, beginPath, isCircle) {
      var self = this;
      return translate(this, startX, startY, dx, dy, beginPath, isCircle)
        .then(function(coords) {
          self._x = coords[0];
          self._y = coords[1];
        });
    };

    proto.rotate = function(startAngle, delta, isCircle) {
      var self = this;
      return rotate(this, startAngle, delta, isCircle)
        .then(function(heading) {
          self._angle   = heading.angle;
          self._radians = heading.radians;
        });
    };

    proto.queueMoveBy = function(startX, startY, theta, distance) {
      var dx   = Math.cos(theta) * distance
          , dy = Math.sin(theta) * distance;

      return this.translate(startX, startY, dx, dy, true);
    };

    proto.queueTurnTo = function(startAngle, endAngle) {
      endAngle = endAngle % this._fullCircle;
      if (endAngle < 0) {
        endAngle += this._fullCircle;
      }
      return this.rotate(startAngle, endAngle - startAngle);
    };

    proto.getManager = function(type) {
      if (!this._managers[type]) {
        this._managers[type] = new EventManager(type, this);
      }
      return this._managers[type];
    };

    proto.getPaper = function() {
      return this._paper || (this._paper = createLayer(2));
    };

    proto.reset = function() {
      this._x          = 0;
      this._y          = 0;
      this._radians    = 0;
      this._angle      = 0;
      this._shown      = true;
      this._down       = true;
      this._color      = "black";
      this._fill       = "black";
      this._shape      = "classic";
      this._size       = 1;
      this._filling    = false;
      this._undoBuffer = [];
      this._speed      = 3;
      this._computed_speed = 5;

      for(var key in this._managers) {
        this._managers[key].reset();
      }

      this._isRadians  = false;
      this._fullCircle = 360;
      this._bufferSize = typeof _config.bufferSize === 'number'
        ? _config.bufferSize
        : 0;
    };

    proto.$degrees = function(fullCircle) {
      fullCircle = (typeof fullCircle === 'number') ? Math.abs(fullCircle) : 360;

      this._isRadians  = false;
      if (!fullCircle || !this._fullCircle) {
        this._angle = this._radians = 0;
      }
      else {
        this._angle = this._angle / this._fullCircle * fullCircle;
      }
      this._fullCircle = fullCircle;
      return this.addUpdate(undefined, false, {angle:this._angle, radians: this._radians});
    };
    proto.$degrees.returnType = Types.FLOAT;

    proto.$radians = function() {
      if (!this._isRadians) {
        this._isRadians     = true;
        this._angle = this._radians;
        this._fullCircle = Turtle.RADIANS;
      }

      return this._angle;
    };
    proto.$radians.returnType = Types.FLOAT;

    proto.$position = proto.$pos = function() {
      return [this.$xcor(), this.$ycor()];
    };
    proto.$position.returnType = function(value) {
      return new Sk.builtin.tuple([
          Sk.builtin.float_(value[0])
          , Sk.builtin.float_(value[1])
      ]);
    };

    proto.$towards = function(x,y) {
      var coords    = getCoordinates(x,y)
          , radians = Math.PI + Math.atan2(this._y - coords.y, this._x - coords.x)
          , angle   = radians * (this._fullCircle / Turtle.RADIANS);

      return angle;
    };
    proto.$towards.minArgs    = 1;
    proto.$towards.returnType = Types.FLOAT;

    proto.$distance = function(x,y) {
      var coords = getCoordinates(x,y)
          , dx   = coords.x - this._x
          , dy   = coords.y - this._y

      return Math.sqrt(dx * dx + dy * dy);
    };
    proto.$distance.minArgs    = 1;
    proto.$distance.returnType = Types.FLOAT;

    proto.$heading = function() {
      return Math.abs(this._angle) < 1e-13 ? 0 : this._angle;
    };
    proto.$heading.returnType = Types.FLOAT;

    proto.$xcor = function() {
      return Math.abs(this._x) < 1e-13 ? 0 : this._x;
    };
    proto.$xcor.returnType = Types.FLOAT;

    proto.$ycor = function() {
      return Math.abs(this._y) < 1e-13 ? 0 : this._y;
    }
    proto.$ycor.returnType = Types.FLOAT;

    proto.$forward = proto.$fd = function(distance) {
      pushUndo(this);
      return this.queueMoveBy(this._x, this._y, this._radians, distance);
    };

    proto.$undo = function() {
      popUndo(this);
    };

    proto.$undobufferentries = function() {
      return this._undoBuffer.length;
    };

    proto.$setundobuffer = function(size) {
      this._bufferSize = typeof size === 'number' ? Math.min(Math.abs(size), 1000) : 0;
    };

    proto.$backward = proto.$back = proto.$bk = function(distance) {
      pushUndo(this);
      return this.queueMoveBy(this._x, this._y, this._radians, -distance);
    };

    proto.$goto_$rw$ = proto.$setpos = proto.$setposition = function(x,y) {
      var coords = getCoordinates(x,y);

      pushUndo(this);

      return this.translate(
        this._x, this._y
        , coords.x - this._x, coords.y - this._y
        , true
      );
    };
    proto.$goto_$rw$.displayName = 'goto';
    proto.$goto_$rw$.minArgs = 1;

    proto.$setx = function(x) {
      return this.translate(this._x, this._y, x - this._x, 0, true);
    };

    proto.$sety = function(y) {
      return this.translate(this._x, this._y, 0, y - this._y, true);
    };

    proto.$home = function() {
      var self = this
          , angle = this._angle;

      pushUndo(this);
      return self.translate(this._x, this._y, -this._x, -this._y, true)
        .then(function(position) {
          return self.queueTurnTo(angle, 0);
        })
        .then(function(heading) {
          return undefined;
        });
    };

    proto.$right = proto.$rt = function(angle) {
      pushUndo(this);
      return this.rotate(this._angle, -angle);
    };

    proto.$left = proto.$lt = function(angle) {
      pushUndo(this);
      return this.rotate(this._angle, angle);
    };

    proto.$setheading = proto.$seth = function(angle) {
      pushUndo(this);
      return this.queueTurnTo(this._angle, angle);
    };

    proto.$circle = function(radius, extent, steps) {
      var self      = this
          , x       = this._x
          , y       = this._y
          , angle   = this._angle
          , heading = {}
          , states  = []
          , speed   = this._computed_speed
          , scale   = 1/getScreen().lineScale
          , beginPath = true
          , frac, w, w2, l, i, dx, dy, promise;

      pushUndo(this);

      if (extent === undefined) {
        extent = self._fullCircle;
      }
      if (steps === undefined) {
        frac  = Math.abs(extent)/self._fullCircle;
        steps = 1 + ((Math.min(11+Math.abs(radius*scale)/6, 59)*frac) | 0)
      }
      w  = extent / steps;
      w2 = .5 * w;
      l  = radius * Math.sin(w/self._fullCircle*Turtle.RADIANS);
      if (radius < 0) {
        l = -l;
        w = -w;
        w2 = -w2;
      }

      promise = Promise.resolve();
      heading = calculateHeading(self, angle + w2);

      self._inCircle = true;

      for(i = 0; i < steps; i++) {
        dx = Math.cos(heading.radians) * l;
        dy = Math.sin(heading.radians) * l;
        (function(x, y, dx, dy, angle, delta, beginPath) {
          promise = promise.then(function() {
            self._computed_speed = 0;
            return self.rotate(angle, delta, true);
          }).then(function(result) {
            self._computed_speed = speed;
            return self.translate(x, y, dx, dy, beginPath, true);
          });
        })(x, y, dx, dy, angle, w, beginPath);
        angle   = heading.angle;
        heading = calculateHeading(self, angle + w);
        x += dx;
        y += dy;
        beginPath = false;
      }

      self._inCircle = false;

      promise = promise.then(function() {
        self._computed_speed = 0;
        self.rotate(angle, w2, true);
        self._computed_speed = speed;
      });

      return promise;
    }
    proto.$circle.keywordArgs = ["extent", "steps"];
    proto.$circle.minArgs     = 1;

    proto.$penup = proto.$up = proto.$pu = function() {
      this._down = false;
      return this.addUpdate(undefined, false, {down:false});
    };

    proto.$pendown = proto.$down = proto.$pd = function() {
      this._down = true;
      return this.addUpdate(undefined, false, {down:true});
    };

    proto.$isdown = function() {
      return this._down;
    };

    proto.$speed = function(speed) {
      if (arguments.length) {
        this._speed          = Math.max(0, Math.min(1000, speed));
        this._computed_speed = Math.max(0, speed * 2 - 1);
        return this.addUpdate(undefined, false, {speed:this._computed_speed});
      }

      return this._speed;
    };
    proto.$speed.minArgs = 0;

    proto.$pencolor = function(r,g,b,a) {
      var color;

      if (arguments.length) {
        this._color = createColor(r,g,b,a);
        return this.addUpdate(undefined, this._shown, {color : this._color});
      }

      return hexToRGB(this._color);
    };
    proto.$pencolor.minArgs = 0;
    proto.$pencolor.returnType = Types.COLOR;

    proto.$fillcolor = function(r,g,b,a) {
      var color;

      if (arguments.length) {
        this._fill = createColor(r,g,b,a);
        return this.addUpdate(undefined, this._shown, {fill : this._fill});
      }

      return hexToRGB(this._fill);
    }
    proto.$fillcolor.minArgs = 0;
    proto.$fillcolor.returnType = Types.COLOR;

    proto.$color = function(color, fill, b, a) {
      if (arguments.length) {
        if (arguments.length === 1 || arguments.length >= 3) {
          this._color = this._fill = createColor(color, fill, b, a);
        }
        else {
          this._color = createColor(color);
          this._fill  = createColor(fill);
        }
        return this.addUpdate(undefined, this._shown, {
          color  : this._color
          , fill : this._fill
        });
      }
      return [this.$pencolor(), this.$fillcolor()];
    };
    proto.$color.minArgs = 0;
    proto.$color.returnType = function(value) {
      return new Sk.builtin.tuple([
        Types.COLOR(value[0])
        , Types.COLOR(value[1])
      ]);
    };

    proto.$fill = function(flag) {
      var self = this;

      if (flag !== undefined) {
        flag = !!flag;
        if (flag === this._filling) return;
        this._filling = flag;
        if (flag) {
          pushUndo(this);
          return this.addUpdate(undefined, false, {
            filling      : true
            , fillBuffer : [{x : this._x, y : this._y}]
          });
        }
        else {
          pushUndo(this);
          return this.addUpdate(
            function() {
              this.fillBuffer.push(this);
              drawFill.call(this);
            }
            , true
            , {
              filling      : false
              , fillBuffer : undefined
            }
          );
        }
      }

      return this._filling;
    };
    proto.$fill.minArgs = 0;

    proto.$begin_fill = function() {
      return this.$fill(true);
    };

    proto.$end_fill = function() {
      return this.$fill(false);
    };

    proto.$stamp = function() {
      pushUndo(this);
      return this.addUpdate(function() {
        drawTurtle(this, this.context());
      }, true);
    };

    proto.$dot = function(size, color, g, b, a) {
      pushUndo(this);
      size = (typeof size === 'number')
        ? Math.max(1, Math.abs(size) | 0)
        : Math.max(this._size + 4, this._size * 2);

      color = (color !== undefined)
        ? createColor(color, g, b, a)
        : this._color;

      return this.addUpdate(drawDot, true, undefined, size, color);
    };

    proto.$write = function(message,move,align,font) {
      var self = this
          , promise, face, size, type, width;

      pushUndo(this);

      message = String(message);

      if (font && font.constructor === Array) {
        face = typeof font[0] === "string" ? font[0] : "Arial";
        size = String(font[1] || "12pt");
        type = typeof font[2] === "string" ? font[2] : "normal";
        if (/^\d+$/.test(size)) {
          size += "pt";
        }

        font = [type, size, face].join(" ");
      }

      var promise = this.addUpdate(drawText, true, undefined, message, align, font);

      if (move && (align === 'left' || align === 'center')) {
        width = measureText(message, font);
        if (align === 'center') {
          width = width/2;
        }
        return promise.then(function() {
          var state = self.getState();
          return self.translate(state.x, state.y, width * getScreen().xScale, 0, true);
        });
      }

      return promise;
    };
    proto.$write.keywordArgs = ['move','align','font'];
    proto.$write.minArgs     = 1;

    proto.$pensize = proto.$width = function(size) {
      if (arguments.length) {
        this._size = size;
        return this.addUpdate(undefined, this._shown, {size : size});
      }

      return this._size;
    };
    proto.$pensize.minArgs = proto.$width.minArgs = 0;

    proto.$showturtle = proto.$st = function() {
      this._shown = true;
      return this.addUpdate(undefined, true, {shown : true});
    };

    proto.$hideturtle = proto.$ht = function() {
      this._shown = false;
      return this.addUpdate(undefined, true, {shown : false});
    };

    proto.$isvisible = function() {
      return this._shown;
    };

    proto.$shape = function(shape) {
      if (shape && SHAPES[shape]) {
        this._shape = shape;
        return this.addUpdate(undefined, this._shown, {shape : shape});
      }

      return this._shape;
    };
    proto.$shape.minArgs = 0;

    proto.$window_width = function() {
      return this._screen.$window_width();
    };

    proto.$window_height = function() {
      return this._screen.$window_height();
    };

    proto.$tracer = function(n, delay) {
      return this._screen.$tracer(n, delay);
    };
    proto.$tracer.minArgs = 0;

    proto.$delay = function(delay) {
      return this._screen.$delay(delay);
    };
    proto.$delay.minArgs = 0;

    proto.$reset = function() {
      this.reset();
      return this.$clear();
    };

    proto.$clear = function() {
      return this.addUpdate(function() {
        clearLayer(this.context());
      }, true);
    };
    proto.$dot.minArgs = 0;

    proto.$onclick = function(method,btn,add) {
      this.getManager('mousedown').addHandler(method, add);
    }
    proto.$onclick.minArgs = 1;
    proto.$onclick.keywordArgs = ["btn","add"];

    proto.$onrelease = function(method,btn,add) {
      this.getManager('mouseup').addHandler(method, add);
    }
    proto.$onrelease.minArgs = 1;
    proto.$onrelease.keywordArgs = ["btn","add"];

    proto.$ondrag = function(method,btn,add) {
      this.getManager('mousemove').addHandler(method, add);
    }
    proto.$ondrag.minArgs = 1;
    proto.$ondrag.keywordArgs = ["btn","add"];

    proto.$getscreen = function() {
      return _module.Screen();
    }
    proto.$getscreen.isSk = true;
  })(Turtle.prototype);

  function Screen() {
    this._frames = 1;
    this._delay  = undefined;
    this._bgcolor = 'none';
    this._managers = {};
    this.setUpWorld(-200,-200,200,200);
  }

  (function(proto) {
    proto.spriteLayer = function() {
      return this._sprites || (this._sprites = createLayer(3));
    };

    proto.bgLayer = function() {
      return this._background || (this._background = createLayer(1));
    }

    proto.hitTestLayer = function() {
      return this._hitTest || (this._hitTest = createLayer(0,true));
    };

    proto.getManager = function(type) {
      if (!this._managers[type]) {
        this._managers[type] = new EventManager(type, this);
      }
      return this._managers[type];
    };

    proto.reset = function() {
      if (this._timer) {
        window.clearTimeout(this._timer);
        this._timer = undefined;
      }

      for(var key in this._managers) {
        this._managers[key].reset();
      }
    };

    proto.setUpWorld = function(llx, lly, urx, ury) {
      var world = this;

      world.llx       = llx;
      world.lly       = lly;
      world.urx       = urx;
      world.ury       = ury;
      world.xScale    = (urx - llx) / getWidth();
      world.yScale    = -1 * (ury - lly) / getHeight();
      world.lineScale = Math.min(Math.abs(world.xScale), Math.abs(world.yScale));
    };

    proto.$register_shape = function(name, points) {
      SHAPES[name] = points;
    };

    proto.$tracer = function(frames, delay) {
      if (frames !== undefined || delay !== undefined) {
        if (typeof delay === 'number') {
          this._delay = delay;
          getFrameManager().refreshInterval(delay);
        }
        if (typeof frames === 'number') {
          this._frames = frames;
          return getFrameManager().frameBuffer(frames);
        }

        return;
      }

      return this._frames;
    };
    proto.$tracer.minArgs = 0;

    proto.$delay = function(delay) {
      if (delay !== undefined) {
        return this.$tracer(undefined, delay);
      }

      return this._delay === undefined ? OPTIMAL_FRAME_RATE : this._delay;
    };

    proto.$setworldcoordinates = function(llx, lly, urx, ury) {
      var world     = this
          , turtles = getFrameManager().turtles();

      this.setUpWorld(llx, lly, urx, ury);

      return this.$clear();
    };

    proto.$clear = proto.$clearscreen = function() {
      var turtles = getFrameManager().turtles();
      this.reset();
      return this.$reset();
    };

    proto.$update = function() {
      return getFrameManager().update();
    };

    proto.$reset = proto.$resetscreen = function() {
      var self = this
          , turtles = getFrameManager().turtles();

      return getFrameManager().addFrame(function() {
        applyWorld(self, self._sprites);
        applyWorld(self, self._background);
        for(var i = 0; i < turtles.length; i++) {
          turtles[i].reset();
          applyWorld(self, turtles[i]._paper);
        }
      }, true);
    };

    proto.$window_width = function() {
      return getWidth();
    };

    proto.$window_height = function() {
      return getHeight();
    };
    proto.$delay.minArgs = 0;

    proto.$bgcolor = function(color, g, b, a) {
      if (arguments.length) {
        this._bgcolor = createColor(color, g, b, a);
        clearLayer(this.bgLayer(), this._bgcolor);
        return;
      }

      return hexToRGB(this._bgcolor);
    };
    proto.$bgcolor.minArgs = 0;
    proto.$bgcolor.returnType = Types.COLOR;

    proto.$onclick = function(method,btn,add) {
      this.getManager('mousedown').addHandler(method, add);
    };
    proto.$onclick.minArgs = 1;
    proto.$onclick.keywordArgs = ["btn","add"];

    proto.$onscreenclick = function(method,btn,add) {
      this.getManager('mousedown').addHandler(method, add);
    };
    proto.$onscreenclick.minArgs = 1;
    proto.$onscreenclick.keywordArgs = ["btn","add"];

    proto.$ontimer = function(method, interval) {
      if (this._timer) {
        window.clearTimeout(this._timer);
        this._timer = undefined;
      }

      if (method && typeof interval === "number") {
        this._timer = window.setTimeout(method, Math.max(0, interval|0));
      }
    };
    proto.$ontimer.minArgs = 0;

  })(Screen.prototype);

  function ensureAnonymous() {
    if (!_anonymousTurtle) {
      _anonymousTurtle = {};
      TurtleWrapper(Sk.globals, _anonymousTurtle);
      Sk.misceval.callsim(_anonymousTurtle.__init__, _anonymousTurtle);
    }

    return _anonymousTurtle;
  }

  function getTarget() {
    if (!_target) {
      _target = typeof _config.target === 'string'
        ? document.getElementById(_config.target)
        : _config.target;
    }
    return _target;
  };

  function getScreen() {
    if (!_screenInstance) {
      _screenInstance = new Screen();
    }
    return _screenInstance;
  }

  function getMouseHandler() {
    if (!_mouseHandler) {
      _mouseHandler = new MouseHandler();
    }
    return _mouseHandler;
  }

  function getWidth() {
    return (_config.width || getTarget().clientWidth) | 0;
  }

  function getHeight() {
    return (_config.height || getTarget().clientHeight) | 0;
  }

  function createLayer(zIndex, isHidden) {
    var canvas = document.createElement('canvas')
        , width  = getWidth()
        , height = getHeight()
        , offset = getTarget().firstChild ? (-height) + "px" : "0"
        , context;

    canvas.width          = width;
    canvas.height         = height;
    canvas.style.position = "relative";
    canvas.style.display  = "block";
    canvas.style.top      = offset;
    canvas.style.setProperty("margin-bottom",offset);
    canvas.style.setProperty("z-index", zIndex);
    if (isHidden) {
      canvas.style.display = "none";
    }

    getTarget().appendChild(canvas);

    context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";

    applyWorld(getScreen(), context);

    return context;
  }

  function cancelAnimationFrame() {
    if (_frameRequest) {
      (window.cancelAnimationFrame || window.mozCancelAnimationFrame)(_frameRequest);
      _frameRequest = undefined;
    }
    if (_frameRequestTimeout) {
      window.clearTimeout(_frameRequestTimeout);
      _frameRequestTimeout = undefined;
    }
  }

  function applyWorld(world, context) {
    var llx      = world.llx
        , lly    = world.lly
        , urx    = world.urx
        , ury    = world.ury
        , xScale = world.xScale
        , yScale = world.yScale

    if (!context) return;

    clearLayer(context);

    context.restore();
    context.save();
    context.scale(1 / xScale, 1 / yScale);
    if (lly === 0) {
      context.translate(-llx, lly - (ury - lly));
    } else if (lly > 0) {
      context.translate(-llx, -lly * 2);
    } else {
      context.translate(-llx, -ury);
    }
  }

  function pushUndo(turtle) {
    var properties, undoState, i;

    if (!_config.allowUndo || !turtle._bufferSize) {
      return;
    }

    if (!turtle._undoBuffer) {
      turtle._undoBuffer = [];
    }

    while(turtle._undoBuffer.length > turtle._bufferSize) {
      turtle._undoBuffer.shift();
    }

    undoState  = {};
    properties = "x y angle radians color fill down filling shown shape size".split(" ");
    for(i = 0; i < properties.length; i++) {
      undoState[properties[i]] = turtle['_' + properties[i]];
    }

    turtle._undoBuffer.push(undoState);

    return turtle.addUpdate(function() {
      undoState.fillBuffer = this.fillBuffer ? this.fillBuffer.slice() : undefined;
      if (turtle._paper && turtle._paper.canvas) {
        undoState.image = turtle._paper.canvas.toDataURL();
      }
    }, false);
  }

  var undoImage = new Image();
  function popUndo(turtle) {
    var undoState;

    if (!turtle._bufferSize || !turtle._undoBuffer) {
      return;
    }

    undoState = turtle._undoBuffer.pop();

    if (!undoState) {
      return;
    }

    for(var key in undoState) {
      if (key === 'image' || key === 'fillBuffer') continue;
      turtle['_' + key] = undoState[key];
    }

    return turtle.addUpdate(function() {
      var img;
      if (undoState.image) {
        undoImage.src = undoState.image;
        img = undoImage;
      }

      clearLayer(this.context(), false, undoImage);
      delete undoState.image;
    }, true, undoState);
  }

  function clearLayer(context, color, image) {
    if (!context) return;

    context.save();
    context.setTransform(1,0,0,1,0,0);
    if (color) {
      context.fillStyle = color;
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
    else {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }

    if (image) {
      context.drawImage(image, 0, 0);
    }

    context.restore();
  };

  function drawTurtle(state, context) {
    var shape  = SHAPES[state.shape]
        , world  = getScreen()
        , width  = getWidth()
        , height = getHeight()
        , xScale = world.xScale
        , yScale = world.yScale
        , x, y, bearing;

    if (!context) return;

    x       = Math.cos(state.radians) / xScale;
    y       = Math.sin(state.radians) / yScale;
    bearing = Math.atan2(y, x) - Math.PI/2;

    context.save();
    context.translate(state.x, state.y);
    context.scale(xScale,yScale);
    context.rotate(bearing);
    context.beginPath();
    context.lineWidth   = 1;
    context.strokeStyle = state.color;
    context.fillStyle   = state.fill;
    context.moveTo(shape[0][0], shape[0][1]);
    for(var i = 1; i < shape.length; i++) {
      context.lineTo(shape[i][0], shape[i][1]);
    }
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  function drawDot(size, color) {
    var context  = this.context()
        , screen = getScreen()
        , xScale = screen.xScale
        , yScale = screen.yScale;

    if (!context) return;

    context.beginPath();
    context.moveTo(this.x, this.y);
    context.arc(this.x, this.y, size, 0, Turtle.RADIANS);
    context.closePath();
    context.fillStyle = color || this.color;
    context.fill();
  }

  var textMeasuringContext = document.createElement('canvas').getContext('2d');
  function measureText(message, font) {
    if (font) {
      textMeasuringContext.font = font;
    }
    return textMeasuringContext.measureText(message).width;
  };

  function drawText(message, align, font) {
    var context  = this.context()
        , screen = getScreen()
        , xScale = screen.xScale
        , yScale = screen.yScale;

    if (!context) return;

    context.save();
    if (font) {
      context.font = font;
    }
    if (align && align.match(/^(left|right|center)$/)) {
      context.textAlign = align;
    }

    context.scale(xScale,yScale);
    context.fillStyle = this.color;
    context.fillText(message, this.x/xScale, this.y/yScale);
    context.restore();
  }

  function drawLine(loc, beginPath, endPath) {
    // TODO: make steps in path use square ends of lines
    // and open and close path at the right times.
    // See if we can minimize calls to stroke
    var context = this.context();

    if (!context) return;

    if (beginPath) {
      context.beginPath();
      context.moveTo(this.x, this.y);
    }

    context.lineWidth   = this.size * getScreen().lineScale;
    context.strokeStyle = this.color;
    context.lineTo(loc.x, loc.y);
    context.stroke();
  }

  function drawFill() {
    var context = this.context()
        , path  = this.fillBuffer
        , i;

    if (!context || !path || !path.length) return;

    context.save();
    context.beginPath();
    context.moveTo(path[0].x,path[0].y);
    for(i = 1; i < path.length; i++) {
      context.lineTo(path[i].x, path[i].y);
    }
    context.closePath();
    context.fillStyle = this.fill;
    context.fill();
    for(i = 1; i < path.length; i++) {
      if (!path[i].stroke) {
        continue;
      }

      context.beginPath();
      context.moveTo(path[i-1].x, path[i-1].y);
      context.lineWidth   = path[i].size * getScreen().lineScale;;
      context.strokeStyle = path[i].color;
      context.lineTo(path[i].x, path[i].y);
      context.stroke();
    }
    context.restore();
  }

  function translate(turtle, startX, startY, dx, dy, beginPath, isCircle) {
    // speed is in pixels per ms
    var speed     = turtle._computed_speed
        , screen  = getScreen()
        , xScale  = Math.abs(screen.xScale)
        , yScale  = Math.abs(screen.yScale)
        , x       = startX
        , y       = startY
        , pixels  = Math.sqrt(dx * dx * xScale + dy * dy * yScale)
        // TODO: allow fractional frame updates?
        , frames  = speed ? Math.round(Math.max(1, pixels / speed)) : 1
        , xStep   = dx / frames
        , yStep   = dy / frames
        , promise = Promise.resolve()
        , countAsFrame = (!speed && isCircle) ? false : true
        , i;

    turtle.addUpdate(function() {
      if (this.filling) {
        this.fillBuffer.push({
          x        : this.x
          , y      : this.y
          , stroke : this.down
          , color  : this.color
          , size   : this.size
        });
      }
    }, false);

    for(i = 0; i < frames; i++) {
      promise = (function(endX,endY,beginPath) {
        return promise.then(function() {
          return turtle.addUpdate(
            function(loc, beginPath) {
              if (this.down) {
                drawLine.call(this, loc, beginPath);
              }
            }
            , countAsFrame
            , {x : endX, y : endY}
            , beginPath
          );
        });
      })(x=startX + xStep * (i+1), y=startY + yStep * (i+1), beginPath);
      beginPath = false;
    }

    return promise.then(function() {
      return [startX + dx, startY + dy];
    });
  }

  function rotate(turtle, startAngle, delta, isCircle) {
    var speed        = turtle._computed_speed
        , degrees    = delta / turtle._fullCircle * 360
        , frames     = speed ? Math.round(Math.max(1, Math.abs(degrees) / speed)) : 1
        , dAngle     = delta / frames
        , heading    = {}
        , countAsFrame = (!speed && isCircle) ? false : true
        , promise    = Promise.resolve()
        , i;

    // TODO: request how many frames are remaining and only queue up
    // a single rotation per screen update

    for(i = 0; i < frames; i++) {
      calculateHeading(turtle, startAngle + dAngle * (i+1), heading);
      promise = (function(angle, radians) {
        return promise.then(function() {
          return turtle.addUpdate(undefined, countAsFrame, {angle : angle, radians : radians});
        });
      })(heading.angle, heading.radians);
    }

    return promise.then(function() {
      return calculateHeading(turtle, startAngle + delta);
    });
  }

  function getCoordinates(x, y) {
    if (y === undefined) {
      y = (x && (x.y || x._y || x[1])) || 0;
      x = (x && (x.x || x._x || x[0])) || 0;
    }
    return {x:x, y:y};
  }

  // Modified solution of Tim Down's version from stackoverflow
  // http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
  function hexToRGB(hex) {
    var rgbForm, hexForm, result;

    if (rgbForm = /^rgba?\((\d+),(\d+),(\d+)(?:,([.\d]+))?\)$/.exec(hex)) {
      result = [
        parseInt(rgbForm[1])
        , parseInt(rgbForm[2])
        , parseInt(rgbForm[3])
      ];
      if (rgbForm[4]) {
        result.push(parseFloat(rgbForm[4]));
      }
    }
    else if (/^#?[a-f\d]{3}|[a-f\d]{6}$/i.exec(hex)) {
      if (hex.length === 4) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });
      }

      hexForm = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      result = [
        parseInt(hexForm[1], 16)
        , parseInt(hexForm[2], 16)
        , parseInt(hexForm[3], 16)
      ];
    }
    else {
      result = hex;
    }

    return result;
  }

  function createColor(color, g, b, a) {
    var i;

    if (g !== undefined) {
      color = [color, g, b, a];
    }

    if (color.constructor === Array && color.length) {
      for(i = 0; i < 3; i++) {
        color[i] = (typeof color[i] === 'number')
          ? Math.max(0, Math.min(255, parseInt(color[i])))
          : 0;
      }
      if (typeof color[i] === 'number') {
        color[3] = Math.max(0, Math.min(1, color[i]));
        color = "rgba(" + color.join(",") + ")";
      }
      else {
        color = "rgb(" + color.slice(0,3).join(",") + ")";
      }
    }
    else if (typeof color === 'string' && !color.match(/\s*url\s*\(/i)) {
      color = color.replace(/\s+/g, "");
    }
    else {
      return "black";
    }

    return color;
  }

  function calculateHeading(turtle, value, heading) {
    var angle     = turtle._angle   || 0
        , radians = turtle._radians || 0;

    heading || (heading = {});

    if (typeof value === 'number') {
      if (turtle._isRadians) {
        angle = radians = value % Turtle.RADIANS;
      }
      else if (turtle._fullCircle) {
        angle   = (value % turtle._fullCircle);
        radians = angle / turtle._fullCircle * Turtle.RADIANS;
      }
      else {
        angle = radians = 0;
      }

      if (angle < 0) {
        angle   += turtle._fullCircle;
        radians += Turtle.RADIANS;
      }
    }

    heading.angle   = angle;
    heading.radians = radians;

    return heading;
  }

  function addModuleMethod(klass, module, method, classMethod) {
    var publicMethodName = method.substr(1)
        , displayName    = klass.prototype[method].displayName || publicMethodName
        , maxArgs        = klass.prototype[method].length
        , minArgs        = klass.prototype[method].minArgs
        , keywordArgs    = klass.prototype[method].keywordArgs
        , returnType     = klass.prototype[method].returnType
        , isSk           = klass.prototype[method].isSk
        , wrapperFn;

    if (minArgs === undefined) {
      minArgs = maxArgs;
    }

    wrapperFn = function() {
      var args       = Array.prototype.slice.call(arguments, 0)
          , self     = classMethod ? ensureAnonymous() : args.shift()
          , instance = self.instance
          , i, result, susp, resolution, lengthError;

      if (args < minArgs || args.length > maxArgs) {
        lengthError = minArgs === maxArgs
          ? "exactly " + maxArgs
          : "between " + minArgs + " and " + maxArgs;

        throw new Sk.builtin.TypeError(displayName + "() takes " + lengthError + " positional argument(s) (" + args.length + " given)");
      }

      for (i = args.length; --i >= 0;) {
        if (args[i] !== undefined) {
          if (args[i] instanceof Sk.builtin.func) {
            args[i] = (function(pyValue) {
              return function() {
                var argsJs = Array.prototype.slice.call(arguments);
                var argsPy = argsJs.map(function(argJs) {return Sk.ffi.remapToPy(argJs);});
                return Sk.misceval.applyAsync(undefined, pyValue, undefined, undefined, undefined, argsPy);
              };
            })(args[i]);
          }
          else if (args[i] && args[i].$d instanceof Sk.builtin.dict && args[i].instance) {
            args[i] = args[i].instance;
          }
          else {
            args[i] = Sk.ffi.remapToJs(args[i]);
          }
        }
      }

      try {
        result = instance[method].apply(instance, args);
      } catch(e) {
        if (window && window.console) {
          console.log('wrapped method failed');
          console.log(e.stack);
        }
        throw e;
      }

      if (result instanceof Promise) {
        result.catch(function(e) {
          if (window && window.console) {
            console.log('promise failed');
            console.log(e.stack);
          }
          throw e;
        });
        susp = new Sk.misceval.Suspension();

        susp.resume = function() {
          return (resolution === undefined)
            ? Sk.builtin.none.none$
            : Sk.ffi.remapToPy(resolution);
        };

        susp.data = {
          type: "Sk.promise",
          promise: result.then(function(value) {
            resolution = value;
            return value;
          })
        };

        return susp;
      }
      else {
        if (result === undefined) return Sk.builtin.none.none$;
        if (isSk) return result;
        if (typeof returnType === 'function') {
          return returnType(result);
        }
        return Sk.ffi.remapToPy(result);
      }
    };

    if (keywordArgs) {
      wrapperFn.co_varnames = keywordArgs.slice();
      // make room for required arguments
      for(var i = 0; i < minArgs; i++) {
        wrapperFn.co_varnames.unshift("");
      }
    }

    module[publicMethodName] = new Sk.builtin.func(wrapperFn);
  }

  function TurtleWrapper($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function (self) {
      self.instance = new Turtle();
    });

    for(var key in Turtle.prototype) {
      if (/^\$[a-z_]+/.test(key)) {
        addModuleMethod(Turtle, $loc, key);
      }
    }
  }

  function ScreenWrapper($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function (self) {
      self.instance = getScreen();
    });

    for(var key in Screen.prototype) {
      if (/^\$[a-z_]+/.test(key)) {
        addModuleMethod(Screen, $loc, key);
      }
    }
  }

  for(var key in Turtle.prototype) {
    if (/^\$[a-z_]+/.test(key)) {
      addModuleMethod(Turtle, _module, key, true);
    }
  }

  _module.Turtle = Sk.misceval.buildClass(_module, TurtleWrapper, "Turtle", []);
  _module.Screen = Sk.misceval.buildClass(_module, ScreenWrapper, "Screen", []);

  Sk.TurtleGraphics.raw = {
    Turtle   : Turtle
    , Screen : Screen
  };

  Sk.TurtleGraphics.module = _module;

  return _module;

})();
};