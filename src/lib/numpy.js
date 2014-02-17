var $builtinmodule = function(name)
{
  var math = Sk.interop['mathjs']();
  var mod = {};
  
  function toNativeArray(value) {
    if(Object.prototype.toString.call(value.v) === '[object Array]') {
      var result = [];
      var idx;
        
      for(idx = 0; idx < value.v.length; ++idx) {
        result[idx] = toNativeArray(value.v[idx]);
      }
      
      return result;
    } else {
      return value.v;
    }
  };
  
  /**
   * ndarray class
   */
  var ndarray = function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self, shape, data) {
      Sk.builtin.pyCheckArgs('numpy.ndarray.__init__', arguments, 2, 3);
      
      if(shape !== undefined) {
        self.matrix = math.matrix(toNativeArray(data));
        // TODO: check shape
      } else {
        // TODO: better implementation of wrapping mathjs object in python ndarray
        self.matrix = data;
      }
    });
    
    $loc.__getattr__ = new Sk.builtin.func(function(self, attr) {
      if(attr == 'ndim') return Sk.builtin.nmber(self.matrix.size().length, Sk.builtin.nmber.int$)
      if(attr == 'shape') return Sk.builtin.tuple(self.matrix.size())
    });
    
    $loc.__add__ = new Sk.builtin.func(function(self, other) {
      return Sk.misceval.callsim(mod.add, self, other);
    });
    
    $loc.__str__ = new Sk.builtin.func(function(self) {
      return Sk.misceval.callsim(mod.array_str, self);
    });
  };
  
  mod.ndarray = Sk.misceval.buildClass(mod, ndarray, 'ndarray', []);
  
  /**
   * creation functions
   */
  mod.array = new Sk.builtin.func(function(data) {
    Sk.builtin.pyCheckArgs('array', arguments, 1);
    
    return Sk.misceval.callsim(mod.ndarray, Sk.builtin.tuple(), data);
  });
  
  /**
   * arithmetic functions
   */
  mod.add = new Sk.builtin.func(function(array1, array2) {
    Sk.builtin.pyCheckArgs('add', arguments, 2);
    
    return Sk.misceval.callsim(mod.ndarray, undefined, math.add(array1.matrix, array2.matrix));
  });
  
  /**
   * output functions
   */
  mod.array_str = new Sk.builtin.func(function(array) {
    Sk.builtin.pyCheckArgs('array_str', arguments, 1);
    
    return Sk.builtin.str(math.format(array.matrix));
  });
  
  return mod;
}
