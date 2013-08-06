/**
 * Geometric Algebra (e2ga) module.
 *
 * David Holmes (david.geo.holmes@gmail.com)
 */
var $builtinmodule = function(name) {

  var mod = {};

  Sk.builtin.defineEuclidean2(mod);

  return mod;
}
