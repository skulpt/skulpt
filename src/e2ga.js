/**
 * Convenience function for incorporating a Euclidean2 class into a module.
 *
 * Usage:
 *
 * Sk.builtin.defineEuclidean2(mod);
 */
Sk.builtin.defineEuclidean2 = function(mod) {

  var EUCLIDEAN_2    = "Euclidean2";
  var SCALAR_2       = "Scalar2";
  var VECTOR_2       = "Vector2";
  var PSEUDOSCALAR_2 = "Pseudoscalar2";

  var PROP_W         = "w";
  var PROP_X         = "x";
  var PROP_Y         = "y";
  var PROP_XY        = "xy";
  var METHOD_CLONE   = "clone";
  var METHOD_LENGTH  = "length";

  function isNumber(x)    { return typeof x === 'number'; }

  function remapE2ToPy(x00, x01, x10, x11) {
    return Sk.misceval.callsim(mod[EUCLIDEAN_2],
      Sk.builtin.assk$(x00, Sk.builtin.nmber.float$),
      Sk.builtin.assk$(x01, Sk.builtin.nmber.float$),
      Sk.builtin.assk$(x10, Sk.builtin.nmber.float$),
      Sk.builtin.assk$(x11, Sk.builtin.nmber.float$));
  }

  function stringFromCoordinates(coordinates, labels, multiplier) {
    var append, i, sb, str, _i, _ref;
    sb = [];
    append = function(number, label) {
      var n;
      if (number !== 0) {
        if (number >= 0) {
          if (sb.length > 0) {
            sb.push("+");
          }
        } else {
          sb.push("-");
        }
        n = Math.abs(number);
        if (n === 1) {
          return sb.push(label);
        } else {
          sb.push(n.toString());
          if (label !== "1") {
            sb.push(multiplier);
            return sb.push(label);
          }
        }
      }
    };
    for (i = _i = 0, _ref = coordinates.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      append(coordinates[i], labels[i]);
    }
    if (sb.length > 0) {
      str = sb.join("");
    } else {
      str = "0";
    }
    return str;
  }

  function divide(a00, a01, a10, a11, b00, b01, b10, b11, x) {
    // r = ~b
    var r00 = +b00;
    var r01 = +b01;
    var r10 = +b10;
    var r11 = -b11;
    // m = b * r
    var m00 = b00 * r00 + b01 * r01 + b10 * r10 - b11 * r11;
    var m01 = 0;
    var m10 = 0;
    var m11 = 0;
    // c = cliffordConjugate(m)
    var c00 = +m00;
    var c01 = -m01;
    var c10 = -m10;
    var c11 = -m11;
    // s = r * c
    var s00 = r00 * c00 + r01 * c01 + r10 * c10 - r11 * c11;
    var s01 = r00 * c01 + r01 * c00 - r10 * c11 + r11 * c10;
    var s10 = r00 * c10 + r01 * c11 + r10 * c00 - r11 * c01;
    var s11 = r00 * c11 + r01 * c10 - r10 * c01 + r11 * c00;
    // k = b * s
    var k00 = b00 * s00 + b01 * s01 + b10 * s10 - b11 * s11;
    // i = inverse(b)
    var i00 = s00/k00;
    var i01 = s01/k00;
    var i10 = s10/k00;
    var i11 = s11/k00;
    // x = a * inverse(b)
    var x00 = a00 * i00 + a01 * i01 + a10 * i10 - a11 * i11;
    var x01 = a00 * i01 + a01 * i00 - a10 * i11 + a11 * i10;
    var x10 = a00 * i10 + a01 * i11 + a10 * i00 - a11 * i01;
    var x11 = a00 * i11 + a01 * i10 - a10 * i01 + a11 * i00;
    if (typeof x !== 'undefined') {
      x[0] = x00;
      x[1] = x01;
      x[2] = x10;
      x[3] = x11;
    }
    else {
      return remapE2ToPy(x00, x01, x10, x11);
    }
  }

  mod[SCALAR_2] = new Sk.builtin.func(function(w) {
    w = Sk.ffi.remapToJs(w);
    return remapE2ToPy(w, 0, 0, 0);
  });

  mod[VECTOR_2] = new Sk.builtin.func(function(x, y) {
    x = Sk.ffi.remapToJs(x);
    y = Sk.ffi.remapToJs(y);
    return remapE2ToPy(0, x, y, 0);
  });

  mod[PSEUDOSCALAR_2] = new Sk.builtin.func(function(xy) {
    xy = Sk.ffi.remapToJs(xy);
    return remapE2ToPy(0, 0, 0, xy);
  });

  mod[EUCLIDEAN_2] = Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self, x00, x01, x10, x11) {
      x00 = Sk.ffi.remapToJs(x00);
      x01 = Sk.ffi.remapToJs(x01);
      x10 = Sk.ffi.remapToJs(x10);
      x11 = Sk.ffi.remapToJs(x11);
      self.tp$name = EUCLIDEAN_2;
      self.v = [x00, x01, x10, x11];
    });
    $loc.__add__ = new Sk.builtin.func(function(lhs, rhs) {
      lhs = Sk.ffi.remapToJs(lhs);
      rhs = Sk.ffi.remapToJs(rhs);
      if (isNumber(rhs)) {
        return remapE2ToPy(lhs[0] + rhs, lhs[1], lhs[2], lhs[3]);
      }
      else {
        return remapE2ToPy(lhs[0] + rhs[0], lhs[1] + rhs[1], lhs[2] + rhs[2], lhs[3] + rhs[3]);
      }
    });
    $loc.__radd__ = new Sk.builtin.func(function(rhs, lhs) {
      lhs = Sk.ffi.remapToJs(lhs);
      rhs = Sk.ffi.remapToJs(rhs);
      if (isNumber(lhs)) {
        return remapE2ToPy(lhs + rhs[0], rhs[1], rhs[2], rhs[3]);
      }
      else {
        throw new Sk.builtin.AssertionError("" + JSON.stringify(lhs, null, 2) + " + " + JSON.stringify(rhs, null, 2));
      }
    });
    $loc.__iadd__ = new Sk.builtin.func(function(selfPy, otherPy) {
      var self = Sk.ffi.remapToJs(selfPy);
      var other = Sk.ffi.remapToJs(otherPy);
      if (isNumber(other)) {
        self[0] += other;
        return selfPy;
      }
      else {
        self[0] += other[0];
        self[1] += other[1];
        self[2] += other[2];
        self[3] += other[3];
        return selfPy;
      }
    });
    $loc.__sub__ = new Sk.builtin.func(function(lhs, rhs) {
      lhs = Sk.ffi.remapToJs(lhs);
      rhs = Sk.ffi.remapToJs(rhs);
      if (isNumber(rhs)) {
        return remapE2ToPy(lhs[0] - rhs, lhs[1], lhs[2], lhs[3]);
      }
      else {
        return remapE2ToPy(lhs[0] - rhs[0], lhs[1] - rhs[1], lhs[2] - rhs[2], lhs[3] - rhs[3]);
      }
    });
    $loc.__rsub__ = new Sk.builtin.func(function(rhs, lhs) {
      lhs = Sk.ffi.remapToJs(lhs);
      rhs = Sk.ffi.remapToJs(rhs);
      if (isNumber(lhs)) {
        return remapE2ToPy(lhs - rhs[0], -rhs[1], -rhs[2], -rhs[3]);
      }
      else {
        throw new Sk.builtin.AssertionError("" + JSON.stringify(lhs, null, 2) + " - " + JSON.stringify(rhs, null, 2));
      }
    });
    $loc.__isub__ = new Sk.builtin.func(function(selfPy, otherPy) {
      var self = Sk.ffi.remapToJs(selfPy);
      var other = Sk.ffi.remapToJs(otherPy);
      if (isNumber(other)) {
        self[0] -= other;
        return selfPy;
      }
      else {
        self[0] -= other[0];
        self[1] -= other[1];
        self[2] -= other[2];
        self[3] -= other[3];
        return selfPy;
      }
    });
    $loc.__mul__ = new Sk.builtin.func(function(a, b) {
      a = Sk.ffi.remapToJs(a);
      b = Sk.ffi.remapToJs(b);
      if (isNumber(b)) {
        return remapE2ToPy(a[0] * b, a[1] * b, a[2] * b, a[3] * b);
      }
      else {
        var a00 = a[0];
        var a01 = a[1];
        var a10 = a[2];
        var a11 = a[3];
        var b00 = b[0];
        var b01 = b[1];
        var b10 = b[2];
        var b11 = b[3];
        var x00 = a00 * b00 + a01 * b01 + a10 * b10 - a11 * b11;
        var x01 = a00 * b01 + a01 * b00 - a10 * b11 + a11 * b10;
        var x10 = a00 * b10 + a01 * b11 + a10 * b00 - a11 * b01;
        var x11 = a00 * b11 + a01 * b10 - a10 * b01 + a11 * b00;
        return remapE2ToPy(x00, x01, x10, x11);
      }
    });
    $loc.__rmul__ = new Sk.builtin.func(function(rhs, lhs) {
      lhs = Sk.ffi.remapToJs(lhs);
      rhs = Sk.ffi.remapToJs(rhs);
      if (isNumber(lhs)) {
        return remapE2ToPy(lhs * rhs[0], lhs * rhs[1], lhs * rhs[2], lhs * rhs[3]);
      }
      else {
        throw new Sk.builtin.AssertionError("" + JSON.stringify(lhs, null, 2) + " * " + JSON.stringify(rhs, null, 2));
      }
    });
    $loc.__imul__ = new Sk.builtin.func(function(selfPy, otherPy) {
      var self = Sk.ffi.remapToJs(selfPy);
      var other = Sk.ffi.remapToJs(otherPy);
      if (isNumber(other)) {
        self[0] *= other;
        self[1] *= other;
        self[2] *= other;
        self[3] *= other;
        return selfPy;
      }
      else {
        var a00 = self[0];
        var a01 = self[1];
        var a10 = self[2];
        var a11 = self[3];
        var b00 = other[0];
        var b01 = other[1];
        var b10 = other[2];
        var b11 = other[3];
        self[0] = a00 * b00 + a01 * b01 + a10 * b10 - a11 * b11;
        self[1] = a00 * b01 + a01 * b00 - a10 * b11 + a11 * b10;
        self[2] = a00 * b10 + a01 * b11 + a10 * b00 - a11 * b01;
        self[3] = a00 * b11 + a01 * b10 - a10 * b01 + a11 * b00;
        return selfPy;
      }
    });
    $loc.__div__ = new Sk.builtin.func(function(a, b) {
      a = Sk.ffi.remapToJs(a);
      b = Sk.ffi.remapToJs(b);
      if (isNumber(b)) {
        return divide(a[0], a[1], a[2], a[3], b, 0, 0, 0, undefined);
      }
      else {
        return divide(a[0], a[1], a[2], a[3], b[0], b[1], b[2], b[3], undefined);
      }
    });
    $loc.__rdiv__ = new Sk.builtin.func(function(rhs, lhs) {
      lhs = Sk.ffi.remapToJs(lhs);
      rhs = Sk.ffi.remapToJs(rhs);
      if (isNumber(lhs)) {
        return divide(lhs, 0, 0, 0, rhs[0], rhs[1], rhs[2], rhs[3], undefined);
      }
      else {
        throw new Sk.builtin.AssertionError("" + JSON.stringify(lhs, null, 2) + " / " + JSON.stringify(rhs, null, 2));
      }
    });
    $loc.__idiv__ = new Sk.builtin.func(function(selfPy, otherPy) {
      var self = Sk.ffi.remapToJs(selfPy);
      var other = Sk.ffi.remapToJs(otherPy);
      if (isNumber(other)) {
        divide(self[0], self[1], self[2], self[3], other, 0, 0, 0, self);
        return selfPy;
      }
      else {
        divide(self[0], self[1], self[2], self[3], other[0], other[1], other[2], other[3], self);
        return selfPy;
      }
    });
    $loc.__xor__ = new Sk.builtin.func(function(a, b) {
      a = Sk.ffi.remapToJs(a);
      b = Sk.ffi.remapToJs(b);
      if (isNumber(b)) {
        return remapE2ToPy(a[0] * b, a[1] * b, a[2] * b, a[3] * b);
      }
      else {
        var a00 = a[0];
        var a01 = a[1];
        var a10 = a[2];
        var a11 = a[3];
        var b00 = b[0];
        var b01 = b[1];
        var b10 = b[2];
        var b11 = b[3];
        var x00 = a00 * b00;
        var x01 = a00 * b01 + a01 * b00;
        var x10 = a00 * b10             + a10 * b00;
        var x11 = a00 * b11 + a01 * b10 - a10 * b01 + a11 * b00;
        return remapE2ToPy(x00, x01, x10, x11);
      }
    });
    $loc.__rxor__ = new Sk.builtin.func(function(rhs, lhs) {
      lhs = Sk.ffi.remapToJs(lhs);
      rhs = Sk.ffi.remapToJs(rhs);
      if (isNumber(lhs)) {
        return remapE2ToPy(lhs * rhs[0], lhs * rhs[1], lhs * rhs[2], lhs * rhs[3]);
      }
      else {
        throw new Sk.builtin.AssertionError("" + JSON.stringify(lhs, null, 2) + " ^ " + JSON.stringify(rhs, null, 2));
      }
    });
    $loc.__ixor__ = new Sk.builtin.func(function(selfPy, otherPy) {
      var self = Sk.ffi.remapToJs(selfPy);
      var other = Sk.ffi.remapToJs(otherPy);
      if (isNumber(other)) {
        self[0] *= other;
        self[1] *= other;
        self[2] *= other;
        self[3] *= other;
        return selfPy;
      }
      else {
        var a00 = self[0];
        var a01 = self[1];
        var a10 = self[2];
        var a11 = self[3];
        var b00 = other[0];
        var b01 = other[1];
        var b10 = other[2];
        var b11 = other[3];
        self[0] = a00 * b00;
        self[1] = a00 * b01 + a01 * b00;
        self[2] = a00 * b10             + a10 * b00;
        self[3] = a00 * b11 + a01 * b10 - a10 * b01 + a11 * b00;
        return selfPy;
      }
    });
    $loc.__lshift__ = new Sk.builtin.func(function(a, b) {
      a = Sk.ffi.remapToJs(a);
      b = Sk.ffi.remapToJs(b);
      if (isNumber(b)) {
        return remapE2ToPy(a[0] * b, 0, 0, 0);
      }
      else {
        var a00 = a[0];
        var a01 = a[1];
        var a10 = a[2];
        var a11 = a[3];
        var b00 = b[0];
        var b01 = b[1];
        var b10 = b[2];
        var b11 = b[3];
        var x00 = a00 * b00 + a01 * b01 + a10 * b10 - a11 * b11;
        var x01 = a00 * b01             - a10 * b11;
        var x10 = a00 * b10 + a01 * b11;
        var x11 = a00 * b11;
        return remapE2ToPy(x00, x01, x10, x11);
      }
    });
    $loc.__rlshift__ = new Sk.builtin.func(function(rhs, lhs) {
      lhs = Sk.ffi.remapToJs(lhs);
      rhs = Sk.ffi.remapToJs(rhs);
      if (isNumber(lhs)) {
        return remapE2ToPy(lhs * rhs[0], lhs * rhs[1], lhs * rhs[2], lhs * rhs[3]);
      }
      else {
        throw new Sk.builtin.AssertionError("" + JSON.stringify(lhs, null, 2) + " << " + JSON.stringify(rhs, null, 2));
      }
    });
    $loc.__ilshift__ = new Sk.builtin.func(function(selfPy, otherPy) {
      var self = Sk.ffi.remapToJs(selfPy);
      var other = Sk.ffi.remapToJs(otherPy);
      if (isNumber(other)) {
        self[0] *= other;
        self[1] = 0;
        self[2] = 0;
        self[3] = 0;
        return selfPy;
      }
      else {
        var a00 = self[0];
        var a01 = self[1];
        var a10 = self[2];
        var a11 = self[3];
        var b00 = other[0];
        var b01 = other[1];
        var b10 = other[2];
        var b11 = other[3];
        self[0] = a00 * b00 + a01 * b01 + a10 * b10 - a11 * b11;
        self[1] = a00 * b01             - a10 * b11;
        self[2] = a00 * b10 + a01 * b11;
        self[3] = a00 * b11;
        return selfPy;
      }
    });
    $loc.__rshift__ = new Sk.builtin.func(function(a, b) {
      a = Sk.ffi.remapToJs(a);
      b = Sk.ffi.remapToJs(b);
      if (isNumber(b)) {
        return remapE2ToPy(a[0] * b, -a[1] * b, -a[2] * b, a[3] * b);
      }
      else {
        var a00 = a[0];
        var a01 = a[1];
        var a10 = a[2];
        var a11 = a[3];
        var b00 = b[0];
        var b01 = b[1];
        var b10 = b[2];
        var b11 = b[3];
        var x00 = a00 * b00 + a01 * b01 + a10 * b10 - a11 * b11;
        var x01 =           + a01 * b00             + a11 * b10;
        var x10 =                       + a10 * b00 - a11 * b01;
        var x11 =                                     a11 * b00;
        return remapE2ToPy(x00, x01, x10, x11);
      }
    });
    $loc.__rrshift__ = new Sk.builtin.func(function(rhs, lhs) {
      lhs = Sk.ffi.remapToJs(lhs);
      rhs = Sk.ffi.remapToJs(rhs);
      if (isNumber(lhs)) {
        return remapE2ToPy(lhs * rhs[0], 0, 0, 0);
      }
      else {
        throw new Sk.builtin.AssertionError("" + JSON.stringify(lhs, null, 2) + " >> " + JSON.stringify(rhs, null, 2));
      }
    });
    $loc.__irshift__ = new Sk.builtin.func(function(selfPy, otherPy) {
      var self = Sk.ffi.remapToJs(selfPy);
      var other = Sk.ffi.remapToJs(otherPy);
      if (isNumber(other)) {
        var a00 = self[0];
        var a01 = self[1];
        var a10 = self[2];
        var a11 = self[3];
        var b00 = other;
        var b01 = 0;
        var b10 = 0;
        var b11 = 0;
        self[0] *=  other;
        self[1] *= -other;
        self[2] *= -other;
        self[3] *=  other;
        return selfPy;
      }
      else {
        var a00 = self[0];
        var a01 = self[1];
        var a10 = self[2];
        var a11 = self[3];
        var b00 = other[0];
        var b01 = other[1];
        var b10 = other[2];
        var b11 = other[3];
        self[0] = a00 * b00 + a01 * b01 + a10 * b10 - a11 * b11;
        self[1] =           + a01 * b00             + a11 * b10;
        self[2] =                       + a10 * b00 - a11 * b01;
        self[3] =                                     a11 * b00;
        return selfPy;
      }
    });
    $loc.nb$negative = function() {
      var self = Sk.ffi.remapToJs(this);
      return remapE2ToPy(-self[0], -self[1], -self[2], -self[3]);
    };
    $loc.nb$positive = function() {
      return this;
    };
    $loc.nb$invert = function() {
      var self = Sk.ffi.remapToJs(this);
      return remapE2ToPy(self[0], self[1], self[2], -self[3]);
    };
    $loc.__getitem__ = new Sk.builtin.func(function(mv, index) {
      mv = Sk.ffi.remapToJs(mv);
      index = Sk.builtin.asnum$(index);
      switch(index) {
        case 0: {
          return remapE2ToPy(mv[0], 0, 0, 0);
        }
        case 1: {
          return remapE2ToPy(0, mv[1], mv[2], 0);
        }
        case 2: {
          return remapE2ToPy(0, 0, 0, mv[3]);
        }
      }
    });
    $loc.__repr__ = new Sk.builtin.func(function(mv) {
      mv = Sk.ffi.remapToJs(mv);
      return new Sk.builtin.str(EUCLIDEAN_2 + "(" + mv.join(", ") + ")");
    });
    $loc.__str__ = new Sk.builtin.func(function(mv) {
      mv = Sk.ffi.remapToJs(mv);
      if (typeof mv !== 'undefined') {
        return new Sk.builtin.str(stringFromCoordinates([mv[0], mv[1], mv[2], mv[3]], ["1", "i", "j", "I"], "*"));
      }
      else {
        return new Sk.builtin.str("<type '" + EUCLIDEAN_2 + "'>");
      }
    });
    $loc.__eq__ = new Sk.builtin.func(function(a, b) {
      a = Sk.ffi.remapToJs(a);
      b = Sk.ffi.remapToJs(b);
      return (a[0] === b[0]) && (a[1] === b[1]) && (a[2] === b[2]) && (a[3] === b[3]);
    });
    $loc.__ne__ = new Sk.builtin.func(function(a, b) {
      a = Sk.ffi.remapToJs(a);
      b = Sk.ffi.remapToJs(b);
      return (a[0] !== b[0]) || (a[1] !== b[1]) || (a[2] !== b[2]) || (a[3] !== b[3]);
    });
    $loc.__getattr__ = new Sk.builtin.func(function(mvPy, name) {
      var mv = Sk.ffi.remapToJs(mvPy);
      switch(name) {
        case PROP_W: {
          return Sk.builtin.assk$(mv[0], Sk.builtin.nmber.float$);
        }
        break;
        case PROP_X: {
          return Sk.builtin.assk$(mv[1], Sk.builtin.nmber.float$);
        }
        break;
        case PROP_Y: {
          return Sk.builtin.assk$(mv[2], Sk.builtin.nmber.float$);
        }
        break;
        case PROP_XY: {
          return Sk.builtin.assk$(mv[3], Sk.builtin.nmber.float$);
        }
        break;
        case METHOD_CLONE: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(methodPy) {
              methodPy.tp$name = METHOD_CLONE;
            });
            $loc.__call__ = new Sk.builtin.func(function(methodPy) {
              return remapE2ToPy(mv[0], mv[1], mv[2], mv[3]);
            });
            $loc.__str__ = new Sk.builtin.func(function(methodPy) {
              return new Sk.builtin.str(METHOD_CLONE);
            });
            $loc.__repr__ = new Sk.builtin.func(function(methodPy) {
              return new Sk.builtin.str(METHOD_CLONE);
            });
          }, METHOD_CLONE, []));
        }
        case METHOD_LENGTH: {
          return Sk.misceval.callsim(Sk.misceval.buildClass(mod, function($gbl, $loc) {
            $loc.__init__ = new Sk.builtin.func(function(self) {
              self.tp$name = METHOD_LENGTH;
            });
            $loc.__call__ = new Sk.builtin.func(function(self) {
              return Sk.builtin.assk$(4, Sk.builtin.nmber.int$);
            });
            $loc.__str__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_LENGTH);
            });
            $loc.__repr__ = new Sk.builtin.func(function(self) {
              return new Sk.builtin.str(METHOD_LENGTH);
            });
          }, METHOD_LENGTH, []));
        }
        default: {
          throw new Sk.builtin.AttributeError(name + " is not a readable attribute of " + EUCLIDEAN_2);
        }
      }
    });
    $loc.__setattr__ = new Sk.builtin.func(function(selfPy, name, valuePy) {
      var self = Sk.ffi.remapToJs(selfPy);
      var value = Sk.ffi.remapToJs(valuePy);
      switch(name) {
        case PROP_W: {
          self[0] = value;
        }
        break;
        case PROP_X: {
          self[1] = value;
        }
        break;
        case PROP_Y: {
          self[2] = value;
        }
        break;
        case PROP_XY: {
          self[3] = value;
        }
        break;
        default: {
          throw new Sk.builtin.AttributeError(name + " is not a writeable attribute of " + EUCLIDEAN_2);
        }
      }
    });
  }, EUCLIDEAN_2, []);
};