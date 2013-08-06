/*
 * browser Python module
 *
 * Exposes the window and document variables.
 */
var $builtinmodule = function(name) {

  var mod = {};

  var EVENT = 'Event';
  var NODE  = 'Node';

  mod[EVENT] = Sk.builtin.buildEventClass(mod);

  mod[NODE]  = Sk.builtin.buildNodeClass(mod);

  mod['window'] = Sk.misceval.callsim(Sk.builtin.buildWindowClass(mod));

  mod['document'] = Sk.misceval.callsim(Sk.builtin.buildDocumentClass(mod));

  return mod;
}
