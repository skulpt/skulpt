/**
 * Convenience function for incorporating a Node class into a module.
 *
 * Usage:
 *
 * mod['Node'] = Sk.builtin.buildNodeClass(mod);
 */
Sk.builtin.buildNodeClass = function(mod) {

  var NODE                                  = "Node";
  var CANVAS_GRADIENT_CLASS                 = "CanvasGradient";
  var CANVAS_RENDERING_CONTEXT_2D           = "CanvasRenderingContext2D";

  var PROP_CLIENT_HEIGHT                    = "clientHeight";
  var PROP_CLIENT_WIDTH                     = "clientWidth";
  var PROP_DIR                              = "dir";
  var PROP_FILL_STYLE                       = "fillStyle";
  var PROP_FIRST_CHILD                      = "firstChild";
  var PROP_FONT                             = "font";
  var PROP_HEIGHT                           = "height";
  var PROP_LAST_CHILD                       = "lastChild";
  var PROP_LEFT                             = "left";
  var PROP_LINE_CAP                         = "lineCap";
  var PROP_LINE_JOIN                        = "lineJoin";
  var PROP_LINE_WIDTH                       = "lineWidth";
  var PROP_NEXT_SIBLING                     = "nextSibling";
  var PROP_PARENT_NODE                      = "parentNode";
  var PROP_POSITION                         = "position";
  var PROP_PREVIOUS_SIBLING                 = "previousSibling";
  var PROP_SHADOW_BLUR                      = "shadowBlur";
  var PROP_SHADOW_COLOR                     = "shadowColor";
  var PROP_SHADOW_OFFSET_X                  = "shadowOffsetX";
  var PROP_SHADOW_OFFSET_Y                  = "shadowOffsetY";
  var PROP_STYLE                            = "style";
  var PROP_STROKE_STYLE                     = "strokeStyle";
  var PROP_TEXT_ALIGN                       = "textAlign";
  var PROP_TEXT_BASELINE                    = "textBaseline";
  var PROP_TOP                              = "top";
  var PROP_WEBKIT_BACKING_STORE_PIXEL_RATIO = "webkitBackingStorePixelRatio";
  var PROP_WIDTH                            = "width";

  var METHOD_ADD_COLOR_STOP                 = "addColorStop";
  var METHOD_APPEND_CHILD                   = "appendChild";
  var METHOD_ARC                            = "arc";
  var METHOD_ARC_TO                         = "arcTo";
  var METHOD_BEGIN_PATH                     = "beginPath";
  var METHOD_BEZIER_CURVE_TO                = "bezierCurveTo";
  var METHOD_CLEAR_RECT                     = "clearRect";
  var METHOD_CLIP                           = "clip";
  var METHOD_CLOSE_PATH                     = "closePath";
  var METHOD_CREATE_LINEAR_GRADIENT         = "createLinearGradient";
  var METHOD_FILL                           = "fill";
  var METHOD_FILL_RECT                      = "fillRect";
  var METHOD_FILL_TEXT                      = "fillText";
  var METHOD_GET_CONTEXT                    = "getContext";
  var METHOD_INSERT_BEFORE                  = "insertBefore";
  var METHOD_LINE_TO                        = "lineTo";
  var METHOD_MOVE_TO                        = "moveTo";
  var METHOD_QUADRATIC_CURVE_TO             = "quadraticCurveTo";
  var METHOD_RECT                           = "rect";
  var METHOD_REMOVE_CHILD                   = "removeChild";
  var METHOD_RESTORE                        = "restore";
  var METHOD_ROTATE                         = "rotate";
  var METHOD_SAVE                           = "save";
  var METHOD_SCALE                          = "scale";
  var METHOD_SET_ATTRIBUTE                  = "setAttribute";
  var METHOD_SET_TRANSFORM                  = "setTransform";
  var METHOD_STROKE                         = "stroke";
  var METHOD_STROKE_RECT                    = "strokeRect";
  var METHOD_STROKE_TEXT                    = "strokeText";
  var METHOD_TRANSFORM                      = "transform";
  var METHOD_TRANSLATE                      = "translate";

  var wrapNode = function(node) {
    if (node) {
      return Sk.misceval.callsim(mod[NODE], node);
    }
    else {
      return Sk.builtin.none.none$;
    }
  }

  var wrapNumber = function(n) {
    if (typeof n === 'number') {
      return Sk.builtin.assk$(n, Sk.builtin.nmber.float$);
    }
    else {
      return Sk.builtin.none.none$;
    }
  }

  var wrapString = function(s) {
    if (typeof s === 'string') {
      return new Sk.builtin.str(s)
    }
    else {
      return Sk.builtin.none.none$;
    }
  }

  var nodeFromArg = function(arg) {
    if (arg) {
      return arg.v;
    }
    else {
      return null;
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

  var stringFromArg = function(arg) {
    if (arg) {
      return arg.v;
    }
    else {
      return null;
    }
  }

  return Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self, node) {
      self.tp$name = NODE;
      self.v = node;
    });
    $loc.__getattr__ = new Sk.builtin.func(function(nodePy, name) {
      var node = Sk.ffi.remapToJs(nodePy);
      switch(name) {
        case PROP_CLIENT_HEIGHT: {
          return wrapNumber(node[PROP_CLIENT_HEIGHT]);
        }
        case PROP_CLIENT_WIDTH: {
          return wrapNumber(node[PROP_CLIENT_WIDTH]);
        }
        case PROP_DIR: {
          return new Sk.builtin.str(node[PROP_DIR]);
        }
        case PROP_FIRST_CHILD: {
          return wrapNode(node[PROP_FIRST_CHILD]);
        }
        case PROP_LAST_CHILD: {
          return wrapNode(node[PROP_LAST_CHILD]);
        }
        case PROP_NEXT_SIBLING: {
          return wrapNode(node[PROP_NEXT_SIBLING]);
        }
        case PROP_PARENT_NODE: {
          return wrapNode(node[PROP_PARENT_NODE]);
        }
        case PROP_PREVIOUS_SIBLING: {
          return wrapNode(node[PROP_PREVIOUS_SIBLING]);
        }
        case PROP_HEIGHT: {
          return Sk.builtin.assk$(node[PROP_HEIGHT], Sk.builtin.nmber.int$);
        }
        case PROP_WIDTH: {
          return Sk.builtin.assk$(node[PROP_WIDTH], Sk.builtin.nmber.int$);
        }
        case PROP_STYLE: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = PROP_STYLE;
              self.v = node.style;
            });
            $loc.__getattr__ = new Sk.builtin.func(function(stylePy, name) {
              var style = Sk.ffi.remapToJs(stylePy);
              switch(name) {
                case PROP_HEIGHT: {
                  return new Sk.builtin.str(style[PROP_HEIGHT]);
                }
                case PROP_LEFT: {
                  return new Sk.builtin.str(style[PROP_LEFT]);
                }
                case PROP_POSITION: {
                  return new Sk.builtin.str(style[PROP_POSITION]);
                }
                case PROP_TOP: {
                  return new Sk.builtin.str(style[PROP_TOP]);
                }
                case PROP_WIDTH: {
                  return new Sk.builtin.str(style[PROP_WIDTH]);
                }
              }
            })
            $loc.__setattr__ = new Sk.builtin.func(function(stylePy, name, valuePy) {
              var style = Sk.ffi.remapToJs(stylePy);
              var value = Sk.ffi.remapToJs(valuePy);
              switch(name) {
                case PROP_HEIGHT: {
                  style[PROP_HEIGHT] = value;
                }
                break;
                case PROP_LEFT: {
                  style[PROP_LEFT] = value;
                }
                break;
                case PROP_POSITION: {
                  style[PROP_POSITION] = value;
                }
                break;
                case PROP_TOP: {
                  style[PROP_TOP] = value;
                }
                break;
                case PROP_WIDTH: {
                  style[PROP_WIDTH] = value;
                }
                break;
                default: {
                  throw new Sk.builtin.AssertionError(name + " is not a writeable attribute of " + PROP_STYLE);
                }
              }
            })
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(PROP_STYLE);
            });
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(PROP_STYLE);
            });
          }, PROP_STYLE, []));
        }
        case METHOD_APPEND_CHILD: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_APPEND_CHILD;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, childNode) {
              return wrapNode(node.appendChild(nodeFromArg(childNode)));
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_APPEND_CHILD);
            });
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_APPEND_CHILD);
            });
          }, METHOD_APPEND_CHILD, []));
        }
        case METHOD_GET_CONTEXT: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_GET_CONTEXT;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, contextIdPy, contextAttributePy) {
              var contextId = Sk.ffi.remapToJs(contextIdPy);
              var contextAttribute = Sk.ffi.remapToJs(contextAttributePy);
              var context = node.getContext(contextId, contextAttribute);
              return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                $loc.__init__ = new Sk.builtin.func(function(self) {
                  self.tp$name = CANVAS_RENDERING_CONTEXT_2D;
                  self.v = context;
                });
                $loc.__getattr__ = new Sk.builtin.func(function(contextPy, name) {
                  switch(name) {
                    case PROP_FILL_STYLE: {
                      return new Sk.builtin.str(context[PROP_FILL_STYLE]);
                    }
                    case PROP_FONT: {
                      return new Sk.builtin.str(context[PROP_FONT]);
                    }
                    case PROP_LINE_CAP: {
                      return new Sk.builtin.str(context[PROP_LINE_CAP]);
                    }
                    case PROP_LINE_JOIN: {
                      return new Sk.builtin.str(context[PROP_LINE_JOIN]);
                    }
                    case PROP_LINE_WIDTH: {
                      return Sk.builtin.assk$(context[PROP_LINE_WIDTH], Sk.builtin.nmber.int$);
                    }
                    case PROP_SHADOW_BLUR: {
                      return Sk.builtin.assk$(context[PROP_SHADOW_BLUR], Sk.builtin.nmber.int$);
                    }
                    case PROP_SHADOW_COLOR: {
                      return new Sk.builtin.str(context[PROP_SHADOW_COLOR]);
                    }
                    case PROP_SHADOW_OFFSET_X: {
                      return Sk.builtin.assk$(context[PROP_SHADOW_OFFSET_X], Sk.builtin.nmber.int$);
                    }
                    case PROP_SHADOW_OFFSET_Y: {
                      return Sk.builtin.assk$(context[PROP_SHADOW_OFFSET_Y], Sk.builtin.nmber.int$);
                    }
                    case PROP_STROKE_STYLE: {
                      return new Sk.builtin.str(context[PROP_STROKE_STYLE]);
                    }
                    case PROP_TEXT_ALIGN: {
                      return new Sk.builtin.str(context[PROP_TEXT_ALIGN]);
                    }
                    case PROP_TEXT_BASELINE: {
                      return new Sk.builtin.str(context[PROP_TEXT_BASELINE]);
                    }
                    case PROP_WEBKIT_BACKING_STORE_PIXEL_RATIO: {
                      return Sk.builtin.assk$(context[PROP_WEBKIT_BACKING_STORE_PIXEL_RATIO], Sk.builtin.nmber.int$);
                    }
                    case METHOD_ARC: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_ARC;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, x, y, radius, startAngle, endAngle, anticlockwise) {
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          radius = Sk.ffi.remapToJs(radius);
                          startAngle = Sk.ffi.remapToJs(startAngle);
                          endAngle = Sk.ffi.remapToJs(endAngle);
                          anticlockwise = Sk.ffi.remapToJs(anticlockwise);
                          context[METHOD_ARC](x, y, radius, startAngle, endAngle, anticlockwise);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_ARC);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_ARC);
                        });
                      }, METHOD_ARC, []));
                    }
                    case METHOD_ARC_TO: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_ARC_TO;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, x1, y1, x2, y2, radiusX, radiusY, rotation) {
                          x1 = Sk.ffi.remapToJs(x1);
                          y1 = Sk.ffi.remapToJs(y1);
                          x2 = Sk.ffi.remapToJs(x2);
                          y2 = Sk.ffi.remapToJs(y2);
                          radiusX = Sk.ffi.remapToJs(radiusX);
                          radiusY = Sk.ffi.remapToJs(radiusY);
                          rotation = Sk.ffi.remapToJs(rotation);
                          context[METHOD_ARC_TO](x1, y1, x2, y2, radiusX, radiusY, rotation);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_ARC_TO);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_ARC_TO);
                        });
                      }, METHOD_ARC_TO, []));
                    }
                    case METHOD_BEGIN_PATH: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_BEGIN_PATH;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self) {
                          context[METHOD_BEGIN_PATH]();
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_BEGIN_PATH);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_BEGIN_PATH);
                        });
                      }, METHOD_BEGIN_PATH, []));
                    }
                    case METHOD_BEZIER_CURVE_TO: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_BEZIER_CURVE_TO;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, cp1x, cp1y, cp2x, cp2y, x, y) {
                          cp1x = Sk.ffi.remapToJs(cp1x);
                          cp1y = Sk.ffi.remapToJs(cp1y);
                          cp2x = Sk.ffi.remapToJs(cp2x);
                          cp2y = Sk.ffi.remapToJs(cp2y);
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          context[METHOD_BEZIER_CURVE_TO](cp1x, cp1y, cp2x, cp2y, x, y);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_BEZIER_CURVE_TO);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_BEZIER_CURVE_TO);
                        });
                      }, METHOD_BEZIER_CURVE_TO, []));
                    }
                    case METHOD_CLEAR_RECT: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_CLEAR_RECT;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, x, y, w, h) {
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          w = Sk.ffi.remapToJs(w);
                          h = Sk.ffi.remapToJs(h);
                          context[METHOD_CLEAR_RECT](x, y, w, h);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_CLEAR_RECT);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_CLEAR_RECT);
                        });
                      }, METHOD_CLEAR_RECT, []));
                    }
                    case METHOD_CLIP: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_CLIP;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self) {
                          context[METHOD_CLIP]();
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_CLIP);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_CLIP);
                        });
                      }, METHOD_CLIP, []));
                    }
                    case METHOD_CLOSE_PATH: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_CLOSE_PATH;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self) {
                          context[METHOD_CLOSE_PATH]();
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_CLOSE_PATH);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_CLOSE_PATH);
                        });
                      }, METHOD_CLOSE_PATH, []));
                    }
                    case METHOD_CREATE_LINEAR_GRADIENT: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_CREATE_LINEAR_GRADIENT;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, x0, y0, x1, y1) {
                          x0 = Sk.ffi.remapToJs(x0);
                          y0 = Sk.ffi.remapToJs(y0);
                          x1 = Sk.ffi.remapToJs(x1);
                          y1 = Sk.ffi.remapToJs(y1);
                          var gradient = context[METHOD_CREATE_LINEAR_GRADIENT](x0, y0, x1, y1);
                          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                            $loc.__init__ = new Sk.builtin.func(function(self) {
                              self.tp$name = CANVAS_GRADIENT_CLASS;
                              self.v = gradient;
                            });
                            $loc.__getattr__ = new Sk.builtin.func(function(gradientPy, name) {
                              switch(name) {
                                case METHOD_ADD_COLOR_STOP: {
                                  return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                                    $loc.__init__ = new Sk.builtin.func(function(self) {
                                      self.tp$name = METHOD_ADD_COLOR_STOP;
                                    });
                                    $loc.__call__ = new Sk.builtin.func(function(self, offset, color) {
                                      offset = Sk.ffi.remapToJs(offset);
                                      color = Sk.ffi.remapToJs(color);
                                      gradient[METHOD_ADD_COLOR_STOP](offset, color);
                                    });
                                    $loc.__str__ = new Sk.builtin.func(function(self) {
                                      return new Sk.builtin.str(METHOD_ADD_COLOR_STOP);
                                    });
                                    $loc.__repr__ = new Sk.builtin.func(function(self) {
                                      return new Sk.builtin.str(METHOD_ADD_COLOR_STOP);
                                    });
                                  }, METHOD_ADD_COLOR_STOP, []));
                                }
                              }
                            })
                            $loc.__setattr__ = new Sk.builtin.func(function(gradientPy, name, valuePy) {
                              var value = Sk.ffi.remapToJs(valuePy);
                              switch(name) {
                                default: {
                                  throw new Sk.builtin.AssertionError(name + " is not a writeable attribute of " + CANVAS_GRADIENT_CLASS);
                                }
                              }
                            })
                            $loc.__str__ = new Sk.builtin.func(function(self) {
                              return new Sk.builtin.str(CANVAS_GRADIENT_CLASS);
                            });
                            $loc.__repr__ = new Sk.builtin.func(function(self) {
                              return new Sk.builtin.str(CANVAS_GRADIENT_CLASS);
                            });
                          }, CANVAS_GRADIENT_CLASS, []));
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_CREATE_LINEAR_GRADIENT);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_CREATE_LINEAR_GRADIENT);
                        });
                      }, METHOD_CREATE_LINEAR_GRADIENT, []));
                    }
                    case METHOD_FILL: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_FILL;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self) {
                          context[METHOD_FILL]();
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_FILL);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_FILL);
                        });
                      }, METHOD_FILL, []));
                    }
                    case METHOD_FILL_RECT: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_FILL_RECT;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, x, y, w, h) {
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          w = Sk.ffi.remapToJs(w);
                          h = Sk.ffi.remapToJs(h);
                          context[METHOD_FILL_RECT](x, y, w, h);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_FILL_RECT);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_FILL_RECT);
                        });
                      }, METHOD_FILL_RECT, []));
                    }
                    case METHOD_FILL_TEXT: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_FILL_TEXT;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, text, x, y, maxWidthPy) {
                          text = Sk.ffi.remapToJs(text);
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          var maxWidth = Sk.ffi.remapToJs(maxWidthPy);
                          if (typeof maxWidth === 'undefined') {
                            context[METHOD_FILL_TEXT](text, x, y);
                          }
                          else if (typeof maxWidth === 'number') {
                            context[METHOD_FILL_TEXT](text, x, y, maxWidth);
                          }
                          else {
                            throw new Sk.builtin.TypeError("maxWidth");
                          }
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_FILL_TEXT);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_FILL_TEXT);
                        });
                      }, METHOD_FILL_TEXT, []));
                    }
                    case METHOD_LINE_TO: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_LINE_TO;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, x, y) {
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          context[METHOD_LINE_TO](x, y);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_LINE_TO);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_LINE_TO);
                        });
                      }, METHOD_LINE_TO, []));
                    }
                    case METHOD_MOVE_TO: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_MOVE_TO;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, x, y) {
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          context[METHOD_MOVE_TO](x, y);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_MOVE_TO);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_MOVE_TO);
                        });
                      }, METHOD_MOVE_TO, []));
                    }
                    case METHOD_QUADRATIC_CURVE_TO: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_QUADRATIC_CURVE_TO;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, cpx, cpy, x, y) {
                          cpx = Sk.ffi.remapToJs(cpx);
                          cpy = Sk.ffi.remapToJs(cpy);
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          context[METHOD_QUADRATIC_CURVE_TO](cpx, cpy, x, y);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_QUADRATIC_CURVE_TO);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_QUADRATIC_CURVE_TO);
                        });
                      }, METHOD_QUADRATIC_CURVE_TO, []));
                    }
                    case METHOD_RECT: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_RECT;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, x, y, w, h) {
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          w = Sk.ffi.remapToJs(w);
                          h = Sk.ffi.remapToJs(h);
                          context[METHOD_RECT](x, y, w, h);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_RECT);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_RECT);
                        });
                      }, METHOD_RECT, []));
                    }
                    case METHOD_RESTORE: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_RESTORE;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self) {
                          context[METHOD_RESTORE]();
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_RESTORE);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_RESTORE);
                        });
                      }, METHOD_RESTORE, []));
                    }
                    case METHOD_ROTATE: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_ROTATE;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, angle) {
                          angle = Sk.ffi.remapToJs(angle);
                          context[METHOD_ROTATE](angle);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_ROTATE);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_ROTATE);
                        });
                      }, METHOD_ROTATE, []));
                    }
                    case METHOD_SAVE: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_SAVE;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self) {
                          context[METHOD_SAVE]();
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_SAVE);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_SAVE);
                        });
                      }, METHOD_SAVE, []));
                    }
                    case METHOD_SCALE: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_SCALE;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, x, y) {
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          context[METHOD_SCALE](x, y);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_SCALE);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_SCALE);
                        });
                      }, METHOD_SCALE, []));
                    }
                    case METHOD_SET_TRANSFORM: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_SET_TRANSFORM;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, a, b, c, d, e, f) {
                          a = Sk.ffi.remapToJs(a);
                          b = Sk.ffi.remapToJs(b);
                          c = Sk.ffi.remapToJs(c);
                          d = Sk.ffi.remapToJs(d);
                          e = Sk.ffi.remapToJs(e);
                          f = Sk.ffi.remapToJs(f);
                          context[METHOD_SET_TRANSFORM](a, b, c, d, e, f);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_SET_TRANSFORM);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_SET_TRANSFORM);
                        });
                      }, METHOD_SET_TRANSFORM, []));
                    }
                    case METHOD_STROKE: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_STROKE;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self) {
                          context[METHOD_STROKE]();
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_STROKE);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_STROKE);
                        });
                      }, METHOD_STROKE, []));
                    }
                    case METHOD_STROKE_RECT: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_STROKE_RECT;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, x, y, w, h) {
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          w = Sk.ffi.remapToJs(w);
                          h = Sk.ffi.remapToJs(h);
                          context[METHOD_STROKE_RECT](x, y, w, h);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_STROKE_RECT);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_STROKE_RECT);
                        });
                      }, METHOD_STROKE_RECT, []));
                    }
                    case METHOD_STROKE_TEXT: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_STROKE_TEXT;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, text, x, y, maxWidthPy) {
                          text = Sk.ffi.remapToJs(text);
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          var maxWidth = Sk.ffi.remapToJs(maxWidthPy);
                          if (typeof maxWidth === 'undefined') {
                            context[METHOD_STROKE_TEXT](text, x, y);
                          }
                          else if (typeof maxWidth === 'number') {
                            context[METHOD_STROKE_TEXT](text, x, y, maxWidth);
                          }
                          else {
                            throw new Sk.builtin.TypeError("maxWidth");
                          }
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_STROKE_TEXT);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_STROKE_TEXT);
                        });
                      }, METHOD_STROKE_TEXT, []));
                    }
                    case METHOD_TRANSFORM: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_TRANSFORM;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, a, b, c, d, e, f) {
                          a = Sk.ffi.remapToJs(a);
                          b = Sk.ffi.remapToJs(b);
                          c = Sk.ffi.remapToJs(c);
                          d = Sk.ffi.remapToJs(d);
                          e = Sk.ffi.remapToJs(e);
                          f = Sk.ffi.remapToJs(f);
                          context[METHOD_TRANSFORM](a, b, c, d, e, f);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_TRANSFORM);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_TRANSFORM);
                        });
                      }, METHOD_TRANSFORM, []));
                    }
                    case METHOD_TRANSLATE: {
                      return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
                        $loc.__init__ = new Sk.builtin.func(function(self) {
                          self.tp$name = METHOD_TRANSLATE;
                        });
                        $loc.__call__ = new Sk.builtin.func(function(self, x, y) {
                          x = Sk.ffi.remapToJs(x);
                          y = Sk.ffi.remapToJs(y);
                          context[METHOD_TRANSLATE](x, y);
                        });
                        $loc.__str__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_TRANSLATE);
                        });
                        $loc.__repr__ = new Sk.builtin.func(function(self) {
                          return new Sk.builtin.str(METHOD_TRANSLATE);
                        });
                      }, METHOD_TRANSLATE, []));
                    }
                  }
                })
                $loc.__setattr__ = new Sk.builtin.func(function(contextPy, name, valuePy) {
                  var context = Sk.ffi.remapToJs(contextPy);
                  var value = Sk.ffi.remapToJs(valuePy);
                  switch(name) {
                    case PROP_FILL_STYLE: {
                      context[PROP_FILL_STYLE] = value;
                    }
                    break;
                    case PROP_FONT: {
                      context[PROP_FONT] = value;
                    }
                    break;
                    case PROP_LINE_CAP: {
                      context[PROP_LINE_CAP] = value;
                    }
                    break;
                    case PROP_LINE_JOIN: {
                      context[PROP_LINE_JOIN] = value;
                    }
                    break;
                    case PROP_LINE_WIDTH: {
                      context[PROP_LINE_WIDTH] = value;
                    }
                    break;
                    case PROP_SHADOW_BLUR: {
                      context[PROP_SHADOW_BLUR] = value;
                    }
                    break;
                    case PROP_SHADOW_COLOR: {
                      context[PROP_SHADOW_COLOR] = value;
                    }
                    break;
                    case PROP_SHADOW_OFFSET_X: {
                      context[PROP_SHADOW_OFFSET_X] = value;
                    }
                    break;
                    case PROP_SHADOW_OFFSET_Y: {
                      context[PROP_SHADOW_OFFSET_Y] = value;
                    }
                    break;
                    case PROP_STROKE_STYLE: {
                      context[PROP_STROKE_STYLE] = value;
                    }
                    break;
                    case PROP_TEXT_ALIGN: {
                      context[PROP_TEXT_ALIGN] = value;
                    }
                    break;
                    case PROP_TEXT_BASELINE: {
                      context[PROP_TEXT_BASELINE] = value;
                    }
                    break;
                    default: {
                      throw new Sk.builtin.AssertionError(name + " is not a writeable attribute of " + CANVAS_RENDERING_CONTEXT_2D);
                    }
                  }
                })
                $loc.__str__ = new Sk.builtin.func(function(self) {
                  return new Sk.builtin.str(CANVAS_RENDERING_CONTEXT_2D);
                });
                $loc.__repr__ = new Sk.builtin.func(function(self) {
                  return new Sk.builtin.str(CANVAS_RENDERING_CONTEXT_2D);
                });
              }, CANVAS_RENDERING_CONTEXT_2D, []));
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_GET_CONTEXT);
            });
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_GET_CONTEXT);
            });
          }, METHOD_GET_CONTEXT, []));
        }
        case METHOD_INSERT_BEFORE: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_INSERT_BEFORE;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, newNode, refNode) {
              return wrapNode(node.insertBefore(nodeFromArg(newNode), nodeFromArg(refNode)));
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_INSERT_BEFORE)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_INSERT_BEFORE)
            })
          }, METHOD_INSERT_BEFORE, []));
        }
        case METHOD_REMOVE_CHILD: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_REMOVE_CHILD;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, childNode) {
              return wrapNode(node.removeChild(nodeFromArg(childNode)));
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_REMOVE_CHILD);
            });
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_REMOVE_CHILD);
            });
          }, METHOD_REMOVE_CHILD, []));
        }
        case METHOD_SET_ATTRIBUTE: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_SET_ATTRIBUTE;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, name, value) {
              node.setAttribute(stringFromArg(name), stringFromArg(value));
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_SET_ATTRIBUTE)
            });
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_SET_ATTRIBUTE);
            });
          }, METHOD_SET_ATTRIBUTE, []));
        }
      }
    });
    $loc.__setattr__ = new Sk.builtin.func(function(nodePy, name, valuePy) {
      var node = Sk.ffi.remapToJs(nodePy);
      var value = Sk.ffi.remapToJs(valuePy);
      switch(name) {
        case PROP_DIR: {
          node[PROP_DIR] = value;
        }
        break;
        case 'id': {
          node.setAttribute(name, value);
        }
        break;
        case PROP_HEIGHT: {
          node[PROP_HEIGHT] = value;
        }
        break;
        case PROP_WIDTH: {
          node[PROP_WIDTH] = value;
        }
        break;
        default: {
          node.setAttribute(name, stringFromArg(value));
        }
      }
    });
    $loc.getCSS = new Sk.builtin.func(function(self,key) {
      return new Sk.builtin.str(self.v.style[key.v]);
    });
    $loc.setCSS = new Sk.builtin.func(function(self, attr, value) {
      self.v.style[attr.v] = value.v
    });
    $loc.getAttribute = new Sk.builtin.func(function(self, key) {
      var res = self.v.getAttribute(key.v)
      if (res) {
        return new Sk.builtin.str(res)
      }
      else {
        return null;
      }
    });
    $loc.setAttribute = new Sk.builtin.func(function(self, attr, value) {
      self.v.setAttribute(attr.v,value.v)
    });
    $loc.__str__ = new Sk.builtin.func(function(self) {
      return new Sk.builtin.str(self.v.tagName)
    })
    $loc.__repr__ = new Sk.builtin.func(function(self) {
      return new Sk.builtin.str(NODE)
    })
  }, NODE, []);
};
