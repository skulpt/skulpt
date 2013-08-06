/**
 * Convenience function for incorporating a Window class into a module.
 *
 * Usage:
 *
 * 1) mod['window'] = Sk.misceval.callsim(Sk.builtin.buildWindowClass(mod));
 * 2) mod['Window'] = Sk.builtin.buildWindowClass(mod);
 *
 * Dependencies:
 *
 * mod['Event']
 */
Sk.builtin.buildWindowClass = function(mod) {

  var EVENT                                 = "Event";
  var WINDOW_CLASS                          = "Window";

  var PROP_ANIMATION_TIME                   = "animationTime";
  var PROP_DOCUMENT                         = "document";
  var PROP_DEVICE_PIXEL_RATIO               = "devicePixelRatio";

  var METHOD_ADD_EVENT_LISTENER             = "addEventListener";
  var METHOD_CANCEL_ANIMATION_FRAME         = "cancelAnimationFrame";
  var METHOD_REMOVE_EVENT_LISTENER          = "removeEventListener";
  var METHOD_REQUEST_ANIMATION_FRAME        = "requestAnimationFrame";
  var METHOD_SET_TIMEOUT                    = "setTimeout";

  var wrapNumber = function(n) {
    if (typeof n === 'number') {
      return Sk.builtin.assk$(n, Sk.builtin.nmber.float$);
    }
    else {
      return Sk.builtin.none.none$;
    }
  }

  var numberFromArg = function(arg) {
    if (arg) {
      return arg.v;
    }
    else {
      return null;
    }
  }

  // We must be able to track the JavaScript listener functions.
  // TODO: This should include both the type and the useCapture flag.
  var winListeners = {};

  return Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(windowPy) {
      windowPy.tp$name = WINDOW_CLASS;
      windowPy.v = window;
    });
    $loc.__getattr__ = new Sk.builtin.func(function(self, name) {
      switch(name) {
        case PROP_ANIMATION_TIME: {
          return wrapNumber(window[PROP_ANIMATION_TIME]);
        }
        case PROP_DOCUMENT: {
          return mod[PROP_DOCUMENT];
        }
        case "innerHeight": {
          return wrapNumber(window[name]);
        }
        case "innerWidth": {
          return wrapNumber(window[name]);
        }
        case PROP_DEVICE_PIXEL_RATIO: {
          return Sk.builtin.assk$(window[PROP_DEVICE_PIXEL_RATIO], Sk.builtin.nmber.int$);
        }
        case METHOD_ADD_EVENT_LISTENER: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_ADD_EVENT_LISTENER;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, typePy, listenerPy, useCapture) {
              var type = Sk.ffi.remapToJs(typePy);
              var listener = function(event) {
                var eventPy = Sk.misceval.callsim(mod[EVENT], Sk.ffi.referenceToPy(event, EVENT));
                Sk.misceval.callsim(listenerPy, eventPy);
              };
              winListeners[type] = listener;
              window[METHOD_ADD_EVENT_LISTENER](type, listener, useCapture);
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_ADD_EVENT_LISTENER)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_ADD_EVENT_LISTENER)
            })
          }, METHOD_ADD_EVENT_LISTENER, []));
        }
        case METHOD_REMOVE_EVENT_LISTENER: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_REMOVE_EVENT_LISTENER;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, typePy, listener, useCapture) {
              var type = Sk.ffi.remapToJs(typePy);
              var listener = winListeners[type];
              delete winListeners[type];
              window[METHOD_REMOVE_EVENT_LISTENER](type, listener, useCapture);
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_REMOVE_EVENT_LISTENER)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_REMOVE_EVENT_LISTENER)
            })
          }, METHOD_REMOVE_EVENT_LISTENER, []));
        }
        case METHOD_CANCEL_ANIMATION_FRAME: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_CANCEL_ANIMATION_FRAME;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, requestID) {
              if (requestID) {
                window[METHOD_CANCEL_ANIMATION_FRAME](numberFromArg(requestID));
              }
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_CANCEL_ANIMATION_FRAME)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_CANCEL_ANIMATION_FRAME)
            })
          }, METHOD_CANCEL_ANIMATION_FRAME, []));
        }
        case METHOD_REQUEST_ANIMATION_FRAME: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_REQUEST_ANIMATION_FRAME;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, callback) {
              var requestID = window[METHOD_REQUEST_ANIMATION_FRAME](function(timestamp) {
                Sk.misceval.callsim(callback, wrapNumber(timestamp));
              });
              return wrapNumber(requestID);
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_REQUEST_ANIMATION_FRAME)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_REQUEST_ANIMATION_FRAME)
            })
          }, METHOD_REQUEST_ANIMATION_FRAME, []));
        }
        case METHOD_SET_TIMEOUT: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_SET_TIMEOUT;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, funcPy, delayPy, paramsPy) {
              var delay = Sk.ffi.remapToJs(delayPy);
              var params = Sk.ffi.remapToJs(paramsPy);
              var timeoutID = window[METHOD_SET_TIMEOUT](function() {
                Sk.misceval.callsim(funcPy);
              }, delay, params);
              return wrapNumber(timeoutID);
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_SET_TIMEOUT)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_SET_TIMEOUT)
            })
          }, METHOD_SET_TIMEOUT, []));
        }
      }
    });
    $loc.__str__ = new Sk.builtin.func(function(self) {
      return new Sk.builtin.str(WINDOW_CLASS)
    })
    $loc.__repr__ = new Sk.builtin.func(function(self, arg) {
      return new Sk.builtin.str(WINDOW_CLASS)
    })
  }, WINDOW_CLASS, []);
};
