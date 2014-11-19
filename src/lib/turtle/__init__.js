var $builtinmodule = function (name) {
'use strict';

// See if the TurtleGraphics module has already been loaded
if (Sk.TurtleGraphics && Sk.TurtleGraphics.module) {
  Sk.TurtleGraphics.reset();
  return Sk.TurtleGraphics.module;
}

return (function() {
  var _module                = {}
      , _turtles             = []
      , _renderTimeout       = false
      , _frameRequest        = undefined
      , _frameRequestTimeout = undefined
      , _screenInstance      = undefined
      , _config              = undefined
      , _target              = undefined
      , _anonymousTurtle     = undefined
      , _durationSinceRedraw = 0
      , OPTIMAL_FRAME_RATE   = 30
      , SHAPES               = {}
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
          , reset   : function() {
            if (_renderTimeout) {
              window.clearTimeout(_renderTimeout);
              _renderTimeout = false;
            };
            cancelAnimationFrame();

            for(var i = 0; i < _turtles.length; i++) {
              _turtles[i].reset();
            };

            if (_target) {
              while (_target.firstChild) {
                _target.removeChild(_target.firstChild);
              }
            }

            _turtles             = [];
            _durationSinceRedraw = 0;
            _screenInstance      = undefined;
            _target              = undefined;
            _anonymousTurtle     = undefined;
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

  function Turtle() {
    registerTurtle(this);
    this._renderCycleState = {};
    this.reset();
  }

  Turtle.RADIANS = 2 * Math.PI;

  (function(proto) {
    proto.render = function() {
      var updates         = this._updates
          , updatesLength = updates.length
          , last          = updatesLength - 1
          , state         = this._renderCycleState
          , i;

      this._updates = [];

      state.paperLayer || (state.paperLayer = createLayer());
      state.penLayer   || (state.penLayer = createLayer());

      if (updatesLength) {
        for(i = 0; i < updatesLength; i++) {
          updates[i].call(this, state, i === last);
        }

        drawTurtle(state);
      }
    };

    proto.addUpdate = function(method) {
      this._updates.push(method);
      renderLoop();
    };

    proto.translate = function(startX, startY, dx, dy) {
      var self      = this
          , promise = (dx === 0 && dy === 0)
              ? Promise.resolve([startX, startY])
              : translate(self, startX, startY, dx, dy);

      return promise.then(function(coords) {
          self._x = coords[0];
          self._y = coords[1];
        });
    };

    proto.rotate = function(startAngle, delta) {
      var self      = this
          , promise = (delta === 0)
              ? Promise.resolve(calculateHeading(self, startAngle))
              : rotate(self, startAngle, delta);

      return promise.then(function(heading) {
        self._angle   = heading.angle;
        self._radians = heading.radians;
      });
    };

    proto.queueMoveBy = function(startX, startY, theta, distance) {
      var dx   = Math.cos(theta) * distance
          , dy = Math.sin(theta) * distance;

      return this.translate(startX, startY, dx, dy);
    };

    proto.queueTurnTo = function(startAngle, endAngle) {
      endAngle = endAngle % this._fullCircle;
      if (endAngle < 0) {
        endAngle += this._fullCircle;
      }
      return this.rotate(startAngle, endAngle - startAngle);
    };

    proto.clear = function() {
      var state = this._renderCycleState;

      this._updates    = [];
      this._undoBuffer = [];

      if (state.paperLayer) {
        if (state.paperLayer.canvas.parentNode) {
          state.paperLayer.canvas.parentNode.removeChild(state.paperLayer.canvas);
        }
        delete state.paperLayer;
      }
      if (state.penLayer) {
        if (state.penLayer.canvas.parentNode) {
          state.penLayer.canvas.parentNode.removeChild(state.penLayer.canvas);
        }
        delete state.penLayer;
      }
    };

    proto.reset = function() {
      var state = {};

      this.clear();

      state.x       = this._x          = 0;
      state.y       = this._y          = 0;
      state.radians = this._radians    = 0;
      state.angle   = this._angle      = 0;
      state.shown   = this._shown      = true;
      state.down    = this._down       = true;
      state.color   = this._color      = "black";
      state.fill    = this._fill       = "black";
      state.shape   = this._shape      = "classic";
      state.size    = this._size       = 1;
      state.filling = this._filling    = false;

      this._isRadians  = false;
      this._fullCircle = 360;
      this._updates    = [];
      this._screen     = getScreen();
      this._bufferSize = typeof _config.bufferSize === 'number'
        ? _config.bufferSize
        : 0;
      this.$speed(3);
      this._renderCycleState = state;
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

      return this._angle;
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
      );
    };
    proto.$goto_$rw$.displayName = 'goto';
    proto.$goto_$rw$.minArgs = 1;

    proto.$setx = function(x) {
      return this.translate(this._x, this._y, x - this._x, 0);
    };

    proto.$sety = function(y) {
      return this.translate(this._x, this._y, 0, y - this._y);
    };

    proto.$home = function() {
      var self = this;
      pushUndo(this);
      return self.translate(this._x, this._y, -this._x, -this._y)
        .then(function(position) {
          return self.queueTurnTo(this._angle, 0);
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
          , speed   = self._speed
          , scale   = 1/getScreen().lineScale
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

      for(i = 0; i < steps; i++) {
        dx = Math.cos(heading.radians) * l;
        dy = Math.sin(heading.radians) * l;
        (function(x, y, dx, dy, angle, delta) {
          promise = promise.then(function() {
            self.$speed(0);
            return self.rotate(angle, delta);
          }).then(function(result) {
            self.$speed(speed);
            return self.translate(x, y, dx, dy);
          });
        })(x, y, dx, dy, angle, w);
        angle   = heading.angle;
        heading = calculateHeading(self, angle + w);
        x += dx;
        y += dy;
      }

      promise = promise.then(function() {
        self.$speed(0);
        self.rotate(angle, w2);
        self.$speed(speed);
      });

      return promise;
    }
    proto.$circle.keywordArgs = ["extent", "steps"];
    proto.$circle.minArgs     = 1;

    proto.$penup = proto.$up = proto.$pu = function() {
      this._down = false;
      this.addUpdate(function(state) {
        state.down = false;
      });
    };

    proto.$pendown = proto.$down = proto.$pd = function() {
      this._down = true;
      this.addUpdate(function(state) {
        state.down = true;
      });
    };

    proto.$isdown = function() {
      return this._down;
    };

    proto.$speed = function(speed) {
      if (arguments.length) {
        this._speed          = Math.max(0, Math.min(1000, speed));
        this._computed_speed = calculateSpeed(this);
        return undefined;
      }

      return this._speed;
    };
    proto.$speed.minArgs = 0;

    proto.$pencolor = function(r,g,b,a) {
      var color;

      if (arguments.length) {
        color = createColor(r,g,b,a);
        this._color = color;
        this.addUpdate(function(state) {
          state.color = color;
        });
        return undefined;
      }

      return hexToRGB(this._color);
    };
    proto.$pencolor.minArgs = 0;
    proto.$pencolor.returnType = Types.COLOR;

    proto.$fillcolor = function(r,g,b,a) {
      var color;

      if (arguments.length) {
        color = createColor(r,g,b,a);
        this._fill = color;
        this.addUpdate(function(state) {
          state.fill = color;
        });
        return undefined;
      }

      return hexToRGB(this._fill);
    }
    proto.$fillcolor.minArgs = 0;
    proto.$fillcolor.returnType = Types.COLOR;

    proto.$color = function(color, fill, b, a) {
      if (arguments.length) {
        if (arguments.length === 1 || arguments.length >= 3) {
          this.$pencolor(color, fill, b, a);
          this.$fillcolor(color, fill, b, a);
        }
        else {
          this.$pencolor(color);
          this.$fillcolor(fill);
        }
        return undefined;
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
        self._filling = flag;
        if (flag) {
          self.addUpdate(function(state) {
            self._fillBuffer = [{
              x   : state.x
              , y : state.y
            }];
          });
        }
        else {
          self.addUpdate(function(state) {
            drawFill(state, self._fillBuffer);
          });
        }
        return;
      }

      return this._filling;
    };
    proto.$fill.minArgs = 0;

    proto.$begin_fill = function() {
      this.$fill(true);
    };

    proto.$end_fill = function() {
      this.$fill(false);
    };

    proto.$stamp = function() {
      pushUndo(this);
      this.addUpdate(function(state) {
        drawTurtle(state, true);
      });
    };

    proto.$dot = function(size, color, g, b, a) {
      pushUndo(this);
      size = (typeof size === 'number')
        ? Math.max(1, Math.abs(size) | 0)
        : Math.max(this._size + 4, this._size * 2);

      color = (color !== undefined)
        ? this._color
        : createColor(color, g, b, a);

      this.addUpdate(function(state) {
        drawDot(state, size, color);
      });
    };

    proto.$write = function(message,move,align,font) {
      var face, size, type, width;

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

      this.addUpdate(function(state) {
        drawText(state, message, align, font);
      });

      if (move && (align === 'left' || align === 'center')) {
        width = measureText(message, font);
        if (align === 'center') {
          width = width/2;
        }
        return this.translate(this._x, this._y, width * getScreen().xScale, 0, true);
      }
    };
    proto.$write.keywordArgs = ['move','align','font'];
    proto.$write.minArgs     = 1;

    proto.$pensize = proto.$width = function(size) {
      if (arguments.length) {
        this._size = size;
        this.addUpdate(function(state) {
          state.size = size;
        });
        return undefined;
      }

      return this._size;
    };
    proto.$pensize.minArgs = proto.$width.minArgs = 0;

    proto.$showturtle = proto.$st = function() {
      this._shown = true;
      this.addUpdate(function(state) {
        state.shown = true;
      });
    };

    proto.$hideturtle = proto.$ht = function() {
      this._shown = false;
      this.addUpdate(function(state) {
        state.shown = false;
      });
    };

    proto.$isvisible = function() {
      return this._shown;
    };

    proto.$shape = function(shape) {
      if (shape && SHAPES[shape]) {
        this._shape = shape;
        this.addUpdate(function(state) {
          state.shape = shape;
        });
        return;
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
    };

    proto.$clear = function() {
      this.clear();
    };
    proto.$dot.minArgs = 0;
  })(Turtle.prototype);

  function Screen() {
    this._frames = 1;
    this._delay  = undefined;
    this.bgcolor = 'none';
    this.llx = this.lly = -200;
    this.urx = this.ury = 200;
    this.xScale    = 1;
    this.yScale    = -1;
    this.lineScale = 1;
    this.layer = createLayer(this);
  }

  (function(proto) {
    proto.$tracer = function(frames, delay) {
      if (frames !== undefined || delay !== undefined) {
        if (typeof frames === 'number') {
          this._frames = frames;
        }
        if (typeof delay === 'number') {
          this._delay = delay;
        }

        for(var i = 0; i < _turtles.length; i++) {
          _turtles[i]._computed_speed = calculateSpeed(_turtles[i]);
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
      var world = this;

      world.llx       = llx;
      world.lly       = lly;
      world.urx       = urx;
      world.ury       = ury;
      world.xScale    = (urx - llx) / getWidth();
      world.yScale    = -1 * (ury - lly) / getHeight();
      world.lineScale = Math.min(Math.abs(world.xScale), Math.abs(world.yScale));

      this.$clear();

      for(var i = 0; i < _turtles.length; i++) {
        _turtles[i].addUpdate(function(state) {
          applyWorld(world, state.paperLayer);
          applyWorld(world, state.penLayer);
        });
      }
    };

    proto.$clear = proto.$clearscreen = function() {
      getTarget().style.setProperty("background-color","none");
      for(var i = 0; i < _turtles.length; i++) {
        _turtles[i].$reset();
      }
    };

    proto.$reset = proto.$resetscreen = function() {
      for(var i = 0; i < _turtles.length; i++) {
        _turtles[i].$reset();
      }
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
        this.bgcolor = createColor(color);
        getTarget().style.setProperty("background-color", this.bgcolor);
        return;
      }

      return hexToRGB(this.bgcolor);
    };
    proto.$bgcolor.minArgs = 0;
    proto.$bgcolor.returnType = Types.COLOR;

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

  function registerTurtle(turtle) {
    _turtles.push(turtle);
  }

  function getScreen() {
    if (!_screenInstance) {
      _screenInstance = new Screen();
    }
    return _screenInstance;
  }

  function getWidth() {
    return (_config.width || getTarget().clientWidth) | 0;
  }

  function getHeight() {
    return (_config.height || getTarget().clientHeight) | 0;
  }

  function createLayer(screen) {
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

    getTarget().appendChild(canvas);

    context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";

    applyWorld(screen || getScreen(), context);

    return context;
  }

  function renderLoop() {
    if (_renderTimeout) return;
    _renderTimeout = window.setTimeout(function() {
      _renderTimeout = undefined;
      requestAnimationFrame(render);
    }, 0);
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

  function requestAnimationFrame(method) {
    var animationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
    if (animationFrame && !getScreen()._delay) {
      _frameRequest = animationFrame(function() {
        _frameRequest = undefined;
        method();
      });
    }
    else {
      _frameRequestTimeout = window.setTimeout(function() {
        _frameRequestTimeout = undefined;
        method();
      }, 1000 / getScreen().$delay());
    }
  };

  function render() {
    var turtleLength = _turtles.length
        , i;

    _durationSinceRedraw = 0;

    for(i = 0; i < turtleLength; i++) {
      _turtles[i] && _turtles[i].render();
    }
  }

  function applyWorld(world, context) {
    var llx      = world.llx
        , lly    = world.lly
        , urx    = world.urx
        , ury    = world.ury
        , xScale = world.xScale
        , yScale = world.yScale

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
    var undoState = {
      angle : turtle._angle
    };

    if (!turtle._bufferSize) {
      return;
    }

    while(turtle._undoBuffer.length > turtle._bufferSize) {
      turtle._undoBuffer.shift();
    }

    turtle.addUpdate(function(state) {
      for(var key in state) {
        undoState[key] = state[key];
      }
      if (state.paperLayer && state.paperLayer.canvas) {
        undoState.image = state.paperLayer.canvas.toDataURL();
        turtle._undoBuffer.push(undoState);
      }
    });
  }

  var undoImage = new Image();
  function popUndo(turtle) {
    var undoState = turtle._undoBuffer.pop();
    if (!undoState) {
      return;
    }

    turtle._x = undoState.x;
    turtle._y = undoState.y;
    turtle._radians = undoState.radians;
    turtle._angle   = undoState.angle;
    turtle.addUpdate(function(state) {
      var context = state.paperLayer;
      undoImage.src = undoState.image;

      if (!context) return;

      context.save();
      context.setTransform(1,0,0,1,0,0);
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.drawImage(undoImage, 0, 0);
      context.restore();
      delete undoState.image;
      for(var key in undoState) {
        state[key] = undoState[key];
      }
    });
  }

  function drawTurtle(state, stamp) {
    var context  = stamp ? state.paperLayer : state.penLayer
        , shape  = SHAPES[state.shape]
        , world  = getScreen()
        , width  = getWidth()
        , height = getHeight()
        , xScale = world.xScale
        , yScale = world.yScale
        , x, y, bearing;

    if (!context) return;

    if (!stamp) {
      context.save();
      context.setTransform(1,0,0,1,0,0);
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.restore();
      if (!state.shown) {
        return;
      }
    }

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

  function drawDot(state, size, color) {
    var context = state.paperLayer
        , screen = getScreen()
        , xScale = screen.xScale
        , yScale = screen.yScale;

    if (!context) return;

    context.save();
    context.beginPath();
    context.scale(xScale,yScale);
    context.moveTo(state.x, state.y);
    context.arc(state.x, state.y, size, 0, Turtle.RADIANS);
    context.closePath();
    context.fillStyle = color || state.color;
    context.fill();
    context.restore();
  }

  var textMeasuringContext = document.createElement('canvas').getContext('2d');
  function measureText(message, font) {
    if (font) {
      textMeasuringContext.font = font;
    }
    return textMeasuringContext.measureText(message).width;
  };

  function drawText(state, message, align, font) {
    var context  = state.paperLayer
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
    context.fillStyle = state.color;
    context.fillText(message, state.x, -state.y);
    context.restore();
  }

  function drawLine(state, endX, endY, beginPath) {
    var context = state.paperLayer;

    if (!context) return;

    if (beginPath) {
      context.beginPath();
      context.moveTo(state.x, state.y);
    }

    context.lineWidth   = state.size * getScreen().lineScale;
    context.strokeStyle = state.color;
    context.lineTo(endX, endY);
    context.stroke();
  }

  function drawFill(state, path) {
    var context = state.paperLayer
        , i;

    if (!context) return;

    context.save();
    context.beginPath();
    context.moveTo(path[0].x,path[0].y);
    for(i = 1; i < path.length; i++) {
      context.lineTo(path[i].x, path[i].y);
    }
    context.closePath();
    context.fillStyle = state.fill;
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

  function translate(turtle, startX, startY, dx, dy) {
    // speed is in pixels per ms
    var speed      = turtle._computed_speed
        , x        = startX + dx
        , y        = startY + dy
        , screen   = getScreen()
        , xScale   = Math.abs(screen.xScale)
        , yScale   = Math.abs(screen.yScale)
        , promise, distance, duration;

    if (turtle._filling) {
      turtle.addUpdate(function(state) {
        turtle._fillBuffer.push({
          x        : x
          , y      : y
          , stroke : state.down
          , color  : state.color
          , size   : state.size
        });
      });
    }

    if (!speed) {
      turtle.addUpdate(function(state) {
        if (state.down) {
          drawLine(state, x, y, true);
        }
        state.x = x;
        state.y = y;
      });
      promise = Promise.resolve([x,y]);
    }
    else {
      distance  = Math.sqrt(dx/xScale*dx/xScale + dy/yScale*dy/yScale);
      duration  = speed ? distance/speed : 0;

      (function() {
        var startTime   = Date.now()
            , beginPath = true
            , animation, elapsed, ratio, endX, endY;

        animation = function(state, last) {
          elapsed = Date.now() - startTime;
          // if this is not the last animation in the current cycle
          // then force this animation to completion
          ratio = last ? Math.min(1, elapsed/duration) : 1;
          endX  = startX + ratio * dx;
          endY  = startY + ratio * dy;

          if (state.down) {
            drawLine(state, endX, endY, beginPath);
          }

          state.x = endX;
          state.y = endY;
          beginPath = false;

          if (ratio < 1) {
            turtle.addUpdate(animation);
          }
        };

        turtle.addUpdate(animation);
      })();

      _durationSinceRedraw += duration;
      promise = _durationSinceRedraw < OPTIMAL_FRAME_RATE
        ? Promise.resolve([x,y])
        : new Promise(function(resolve) {
            window.setTimeout(function() {
              resolve([x,y]);
          }, duration);
      });
    }

    return promise;
  }

  function rotate(turtle, startAngle, delta) {
    var speed        = turtle._computed_speed
        , angle      = startAngle + delta
        , heading    = calculateHeading(turtle, angle)
        , startAngle = turtle._angle
        , duration, promise;

    if (!speed) {
      turtle.addUpdate(function(state) {
        state.radians = heading.radians;
        state.angle   = heading.angle;
      });
      promise = Promise.resolve(heading);
    }
    else {
      duration = speed ? Math.abs(360*delta/turtle._fullCircle)/speed : 0;

      (function() {
        var startTime   = Date.now()
            , animation, elapsed, ratio;

        animation = function(state, last) {
          elapsed    = Date.now() - startTime;
          ratio      = last ? Math.min(1, elapsed/duration) : 1;
          calculateHeading(turtle, startAngle + ratio * delta, state);
          if (ratio < 1) {
            turtle.addUpdate(animation);
          }
        }

        turtle.addUpdate(animation);
      })();

      _durationSinceRedraw += duration;
      promise = _durationSinceRedraw < OPTIMAL_FRAME_RATE
        ? Promise.resolve(heading)
        : new Promise(function(resolve) {
            window.setTimeout(function() {
              resolve(heading);
          }, duration);
      });
    }

    return promise;
  }

  function getCoordinates(x, y) {
    if (y === undefined) {
      y = x[1] || 0;
      x = x[0] || 0;
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

  function calculateSpeed(turtle) {
    var computed = 0;

    if (_config.animate && turtle._speed) {
      computed = (turtle._speed * 2 - 1) * turtle._screen._frames / 10;
      if (turtle._screen._delay) {
        computed *= OPTIMAL_FRAME_RATE / turtle._screen._delay;
      }
    }
    
    return computed;
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
          else {
            args[i] = Sk.ffi.remapToJs(args[i]);
          }
        }
      }

      result = instance[method].apply(instance, args);
      
      if (result instanceof Promise) {
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
      if (/^\$[a-z]+/.test(key)) {
        addModuleMethod(Turtle, $loc, key);
      }
    }
  }

  function ScreenWrapper($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function (self) {
      self.instance = getScreen();
    });

    for(var key in Screen.prototype) {
      if (/^\$[a-z]+/.test(key)) {
        addModuleMethod(Screen, $loc, key);
      }
    }
  }

  for(var key in Turtle.prototype) {
    if (/^\$[a-z]+/.test(key)) {
      addModuleMethod(Turtle, _module, key, true);
    }
  }

  _module.Turtle = Sk.misceval.buildClass(_module, TurtleWrapper, "Turtle", []);
  _module.Screen = Sk.misceval.buildClass(_module, ScreenWrapper, "Screen", []);

  Sk.TurtleGraphics.module = _module;

  return _module;

})();
};