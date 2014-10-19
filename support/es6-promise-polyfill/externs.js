/** @constructor
 * @param{?function(?)=} resolve
 * @param{?function(?)=} reject
 */
var Promise=function(resolve, reject) { this.then=function(x,y) {}; };
var global={};
var process={nextTick: function(x){}};
