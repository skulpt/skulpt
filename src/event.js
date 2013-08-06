/**
 * Convenience function for incorporating an Event class into a module.
 *
 * Usage:
 *
 * mod['Event'] = Sk.builtin.buildEventClass(mod);
 */
Sk.builtin.buildEventClass = function(mod) {

  var EVENT                                 = "Event";
  var PROP_ALT_KEY                          = "altKey";
  var PROP_BUBBLES                          = "bubbles";
  var PROP_BUTTON                           = "button";
  var PROP_CANCELABLE                       = "cancelable";
  var PROP_CLIENT_X                         = "clientX";
  var PROP_CLIENT_Y                         = "clientY";
  var PROP_CTRL_KEY                         = "ctrlKey";
  var PROP_DEFAULT_PREVENTED                = "defaultPrevented";
  var PROP_KEY_CODE                         = "keyCode";
  var PROP_SCREEN_X                         = "screenX";
  var PROP_SCREEN_Y                         = "screenY";
  var PROP_SHIFT_KEY                        = "shiftKey";
  var PROP_TARGET                           = "target";
  var PROP_TYPE                             = "type";
  var METHOD_ADD_EVENT_LISTENER             = "addEventListener";
  var METHOD_PREVENT_DEFAULT                = "preventDefault";
  var METHOD_STOP_IMMEDIATE_PROPAGATION     = "stopImmediatePropagation";
  var METHOD_STOP_PROPAGATION               = "stopPropagation";

  return Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(eventPy, argPy) {
      eventPy.tp$name = EVENT;
      eventPy.v = Sk.ffi.remapToJs(argPy);
    });
    $loc.__getattr__ = new Sk.builtin.func(function(eventPy, name) {
      var event = Sk.ffi.remapToJs(eventPy);
      switch(name) {
        case PROP_ALT_KEY: {
          return event[PROP_ALT_KEY];
        }
        case PROP_BUBBLES: {
          return event[PROP_BUBBLES];
        }
        case PROP_BUTTON: {
          return Sk.builtin.assk$(event[PROP_BUTTON], Sk.builtin.nmber.int$);
        }
        case PROP_CANCELABLE: {
          return event[PROP_CANCELABLE];
        }
        case PROP_CLIENT_X: {
          return Sk.builtin.assk$(event[PROP_CLIENT_X], Sk.builtin.nmber.int$);
        }
        case PROP_CLIENT_Y: {
          return Sk.builtin.assk$(event[PROP_CLIENT_Y], Sk.builtin.nmber.int$);
        }
        case PROP_CTRL_KEY: {
          return event[PROP_CTRL_KEY];
        }
        case PROP_DEFAULT_PREVENTED: {
          return event[PROP_DEFAULT_PREVENTED];
        }
        case PROP_KEY_CODE: {
          return Sk.builtin.assk$(event[PROP_KEY_CODE], Sk.builtin.nmber.int$);
        }
        case PROP_SCREEN_X: {
          return Sk.builtin.assk$(event[PROP_SCREEN_X], Sk.builtin.nmber.int$);
        }
        case PROP_SCREEN_Y: {
          return Sk.builtin.assk$(event[PROP_SCREEN_Y], Sk.builtin.nmber.int$);
        }
        case PROP_SHIFT_KEY: {
          return event[PROP_SHIFT_KEY];
        }
        case PROP_TARGET: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(targetPy) {
              targetPy.tp$name = PROP_TARGET;
              targetPy.v = event.target;
            });
            $loc.__getattr__ = new Sk.builtin.func(function(targetPy, name) {
              return Sk.ffi.remapToPy(event.target[name])
            })
            $loc.__setattr__ = new Sk.builtin.func(function(targetPy, name, valuePy) {
              event.target[name] = Sk.ffi.remapToJs(valuePy);
            })
            $loc.__str__ = new Sk.builtin.func(function(targetPy) {
              var target = Sk.ffi.remapToJs(targetPy);
              return new Sk.builtin.str("" + target)
            })
            $loc.__repr__ = new Sk.builtin.func(function(targetPy) {
              var target = Sk.ffi.remapToJs(targetPy);
              return new Sk.builtin.str("" + target)
            })
          }, PROP_TARGET, []));
        }
        case PROP_TYPE: {
          return new Sk.builtin.str(event[PROP_TYPE]);
        }
        case METHOD_ADD_EVENT_LISTENER: {
          return Sk.builtin.addEventListener(mod, event);
        }
        case METHOD_PREVENT_DEFAULT: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_PREVENT_DEFAULT;
            });
            $loc.__call__ = new Sk.builtin.func(function(self) {
              event[METHOD_PREVENT_DEFAULT]();
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_PREVENT_DEFAULT)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_PREVENT_DEFAULT)
            })
          }, METHOD_PREVENT_DEFAULT, []));
        }
        case METHOD_STOP_IMMEDIATE_PROPAGATION: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_STOP_IMMEDIATE_PROPAGATION;
            });
            $loc.__call__ = new Sk.builtin.func(function(self) {
              event[METHOD_STOP_IMMEDIATE_PROPAGATION]();
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_STOP_IMMEDIATE_PROPAGATION)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_STOP_IMMEDIATE_PROPAGATION)
            })
          }, METHOD_STOP_IMMEDIATE_PROPAGATION, []));
        }
        case METHOD_STOP_PROPAGATION: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_STOP_PROPAGATION;
            });
            $loc.__call__ = new Sk.builtin.func(function(self) {
              event[METHOD_STOP_PROPAGATION]();
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_STOP_PROPAGATION)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_STOP_PROPAGATION)
            })
          }, METHOD_STOP_PROPAGATION, []));
        }
        default: {
          return Sk.ffi.remapToPy(event[name]);
        }
      }
    });
    $loc.__str__ = new Sk.builtin.func(function(eventPy) {
      var event = Sk.ffi.remapToJs(eventPy);
      return new Sk.builtin.str("" + event)
    })
    $loc.__repr__ = new Sk.builtin.func(function(eventPy) {
      var event = Sk.ffi.remapToJs(eventPy);
      return new Sk.builtin.str("" + event)
    })
  }, EVENT, []);
};

Sk.builtin.addEventListener = function (mod, eventTarget) {
  var EVENT                                 = "Event";
  var METHOD_ADD_EVENT_LISTENER             = "addEventListener";
  return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self) {
      self.tp$name = METHOD_ADD_EVENT_LISTENER;
      self.v = eventTarget[METHOD_ADD_EVENT_LISTENER];
    });
    $loc.__call__ = new Sk.builtin.func(function(self, typePy, listenerPy, useCapturePy) {
      var type = Sk.ffi.remapToJs(typePy);
      var listenerJs = function(event) {
        var eventPy = Sk.misceval.callsim(mod[EVENT], Sk.ffi.referenceToPy(event, EVENT));
        Sk.misceval.callsim(listenerPy, eventPy);
      };
      var useCapture = Sk.ffi.remapToJs(useCapturePy);
      eventTarget[METHOD_ADD_EVENT_LISTENER](type, listenerJs, useCapture);
    });
  }, METHOD_ADD_EVENT_LISTENER, []));
};
