
/*
	Barebones implementation of the Python time package.

	For now, only the time() function is implemented.
*/
 
var $builtinmodule = function(name)
{
    var mod = {};

    mod.time = new Sk.builtin.func(function() {
	  return Sk.builtin.assk$(new Date().getTime() / 1000, undefined);
    });

    return mod;
}
