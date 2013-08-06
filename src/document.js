/**
 * Convenience function for incorporating a Window class into a module.
 *
 * Usage:
 *
 * 1) mod['document'] = Sk.misceval.callsim(Sk.builtin.buildDocumentClass(mod));
 * 2) mod['Document'] = Sk.builtin.buildDocumentClass(mod);
 *
 * Dependencies:
 *
 * mod['Event']
 * mod['Node']
 *
 */
Sk.builtin.buildDocumentClass = function(mod) {

  var DOCUMENT_CLASS                        = "Document";
  var EVENT                                 = "Event";
  var NODE                                  = "Node";

  var PROP_BODY                             = "body";
  var PROP_WEBKIT_HIDDEN                    = "webkitHidden";

  var METHOD_ADD_EVENT_LISTENER             = "addEventListener";
  var METHOD_CREATE_ELEMENT                 = "createElement";
  var METHOD_GET_ELEMENT_BY_ID              = "getElementById";
  var METHOD_GET_ELEMENTS_BY_TAG_NAME       = "getElementsByTagName";
  var METHOD_REMOVE_EVENT_LISTENER          = "removeEventListener";

  var wrapNode = function(node) {
    if (node) {
      return Sk.misceval.callsim(mod[NODE], node);
    }
    else {
      return Sk.builtin.none.none$;
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

  // We must be able to track the JavaScript listener functions.
  // TODO: This should include both the type and the useCapture flag.
  var docListeners = {};

  return Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(documentPy) {
      documentPy.tp$name = DOCUMENT_CLASS;
      documentPy.v = document;
    });
    $loc.__getattr__ = new Sk.builtin.func(function(self, name) {
      switch(name) {
        case PROP_BODY: {
          return Sk.misceval.callsim(mod[NODE], document[PROP_BODY]);
        }
        case PROP_WEBKIT_HIDDEN: {
          return document[PROP_WEBKIT_HIDDEN];
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
              docListeners[type] = listener;
              document[METHOD_ADD_EVENT_LISTENER](type, listener, useCapture);
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
              var listener = docListeners[type];
              delete docListeners[type];
              document[METHOD_REMOVE_EVENT_LISTENER](type, listener, useCapture);
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_REMOVE_EVENT_LISTENER)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_REMOVE_EVENT_LISTENER)
            })
          }, METHOD_REMOVE_EVENT_LISTENER, []));
        }
        case METHOD_CREATE_ELEMENT: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_CREATE_ELEMENT;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, tagName, attributes) {
              var element = document.createElement(stringFromArg(tagName));
              if (attributes instanceof Sk.builtin.dict) {
                for (var iter = attributes.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                  var v = attributes.mp$subscript(k);
                  if (v === undefined) {
                    v = null;
                  }
                  var kAsJs = Sk.ffi.remapToJs(k);
                  var vAsJs = Sk.ffi.remapToJs(v);
                  element.setAttribute(kAsJs, vAsJs);
                }
              }
              return wrapNode(element);
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_CREATE_ELEMENT)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_CREATE_ELEMENT)
            })
          }, METHOD_CREATE_ELEMENT, []));
        }
        case METHOD_GET_ELEMENT_BY_ID: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_GET_ELEMENT_BY_ID;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, id) {
              return wrapNode(document.getElementById(stringFromArg(id)));
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_GET_ELEMENT_BY_ID)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_GET_ELEMENT_BY_ID)
            })
          }, METHOD_GET_ELEMENT_BY_ID, []));
        }
        case METHOD_GET_ELEMENTS_BY_TAG_NAME: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_GET_ELEMENTS_BY_TAG_NAME;
            });
            $loc.__call__ = new Sk.builtin.func(function(self, tagName) {
              var elements = document.getElementsByTagName(stringFromArg(tagName))
              var xs = [];
              for (var i = elements.length - 1; i >= 0; i--) {
                xs.push(wrapNode(elements[i]));
              }
              return new Sk.builtin.list(xs);
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_GET_ELEMENTS_BY_TAG_NAME)
            })
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_GET_ELEMENTS_BY_TAG_NAME)
            })
          }, METHOD_GET_ELEMENTS_BY_TAG_NAME, []));
        }
      }
    });
    $loc.__str__ = new Sk.builtin.func(function(self) {
      return new Sk.builtin.str(DOCUMENT_CLASS)
    })
    $loc.__repr__ = new Sk.builtin.func(function(self) {
      return new Sk.builtin.str(DOCUMENT_CLASS)
    })
  }, DOCUMENT_CLASS, []);
};
