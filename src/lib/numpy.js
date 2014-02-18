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
  
  // transform tuple/slices to index arrays
  function toNativeIndex(idx) {
    if(idx.tp$name === 'tuple') {
      var result = [];
      var i, submatrix = false, indices = [];
      
      for(i = 0; i < idx.v.length; ++i) {
        var tmp = toNativeIndex(idx.v[i]);
        
	    submatrix = submatrix || tmp.submatrix;
	    indices = indices.concat(tmp.indices);
      }
      
      return { 'submatrix': submatrix, 'indices': indices };
    } else {
      if(idx.tp$name === 'number') {
        return { submatrix: false, indices: [idx.v]};
      }
      
      if(idx.tp$name === 'slice') {
        return { submatrix: true, indices: [new math.type.Range(idx.start.v, idx.stop.v, idx.step.v !== null ? idx.step.v : 1)] };
      }
    }
  }
  
  // translate negative indices/add missing dimensions
  function normalizeNativeIndex(size, idx) {
    if(size.length < idx.indices.length) {
      throw new Sk.builtin.IndexError('invalid index (number of indices is larger than ndarray.ndims)');
    }
    
    var i;
    for(i = 0; i < idx.indices.length; ++i) {
      if(math.type.Range.isRange(idx.indices[i])) {
        // clamp range
        if(idx.indices[i].end > size[i]) {
          idx.indices[i].end = size[i];
        }
      } else {
        // translate negative indices
        if(idx.indices[i] < 0) {
          idx.indices[i] = size[i] + idx.indices[i];
        }
      }
    }
    
    // add missing dimensions
    if(size.length > idx.indices.length) {
      idx.submatrix = true;
      var i;
      for(i = idx.indices.length; i < size.length; ++i) {
        idx.indices[i] = new math.type.Range(0, size[i]);
      }
    }
    
    return idx;
  }
  
  /**
   * ndarray class
   */
  var ndarray = function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self, shape, data) {
      Sk.builtin.pyCheckArgs('numpy.ndarray.__init__', arguments, 2, 3);
      
      if(shape !== undefined) {
      
        try {
          self.matrix = math.matrix(toNativeArray(data));
        } catch(e) {
          throw new Sk.builtin.Exception(e.message);
        }
        
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
    
    $loc.__getitem__ = new Sk.builtin.func(function(self, key) {
      var idx = normalizeNativeIndex(self.matrix.size(), toNativeIndex(key));
    
      try {
        if(idx.submatrix) {
          return Sk.misceval.callsim(mod.ndarray, undefined, self.matrix.subset(math.type.Index.create(idx.indices)));
        } else {
          return Sk.builtin.nmber(self.matrix.get(idx.indices), Sk.builtin.nmber.float$);
        }
      } catch(e) {
        throw new Sk.builtin.Exception(e.message);
      }
    });
    
    $loc.__setitem__ = new Sk.builtin.func(function(self, key, value) { 
      var idx = normalizeNativeIndex(self.matrix.size(), toNativeIndex(key));
    
      if(idx.submatrix) {
        // TODO: implement submatrix assignment      
      } else {
        try {   
          self.matrix.set(idx.indices, value.v);
        } catch(e) {
          throw new Sk.builtin.Exception(e.message);
        }
      }
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
    
    var result;
    try {
      result = math.add(array1.matrix, array2.matrix);
    } catch(e) {
      throw new Sk.builtin.Exception(e.message);
    }
    return Sk.misceval.callsim(mod.ndarray, undefined, result);
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
