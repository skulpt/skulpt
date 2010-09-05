var $builtinmodule = function(name)
{
    goog.require('goog.math');

    // todo; need to convert long -> number
    //       not super useful since it'll go double in JS and
    //       then lose precision and generally kind of suck.

    var mod = {};

    mod.randomInt = new Sk.builtin.func(function(a)
            {
                return goog.math.randomInt(a);
            });

    mod.uniformRandom = new Sk.builtin.func(function(a, b)
            {
                return goog.math.uniformRandom(a, b);
            });

    mod.clamp = new Sk.builtin.func(function(value, min, max)
            {
                return goog.math.clamp(value, min, max);
            });

    mod.modulo = new Sk.builtin.func(function(a, b)
            {
                return goog.math.modulo(a, b);
            });

    mod.lerp = new Sk.builtin.func(function(a, b, x)
            {
                return goog.math.lerp(a, b, x);
            });

    // todo; opt_ ?
    mod.nearlyEquals = new Sk.builtin.func(function(a, b, opt_tolerance)
            {
                return goog.math.nearlyEquals(a, b, opt_tolerance);
            });

    mod.standardAngle = new Sk.builtin.func(function(angleDegrees)
            {
                return goog.math.standardAngle(angleDegrees);
            });

    mod.toRadians = new Sk.builtin.func(function(angleDegrees)
            {
                return goog.math.toRadians(angleDegrees);
            });

    mod.toDegrees = new Sk.builtin.func(function(angleDegrees)
            {
                return goog.math.toDegrees(angleDegrees);
            });

    mod.angleDx = new Sk.builtin.func(function(degrees, radius)
            {
                return goog.math.angleDx(degrees, radius);
            });

    mod.angleDy = new Sk.builtin.func(function(degrees, radius)
            {
                return goog.math.angleDy(degrees, radius);
            });

    mod.angle = new Sk.builtin.func(function(x1, y1, x2, y2)
            {
                return goog.math.angle(x1, y1, x2, y2);
            });

    mod.angleDifference = new Sk.builtin.func(function(startAngle, endAngle)
            {
                return goog.math.angleDifference(startAngle, endAngle);
            });

    mod.sign = new Sk.builtin.func(function(x)
            {
                return goog.math.sign(x);
            });

    // todo; opt_ ?
    mod.longestCommonSubsequence = new Sk.builtin.func(function(array1, array2, opt_compareFn, opt_collectorFn)
            {
                return Sk.ffi.remapToPy(
                    goog.math.longestCommonSubsequence(
                        Sk.ffi.remapToJs(array1),
                        Sk.ffi.remapToJs(array2),
                        Sk.ffi.callback(opt_compareFn),
                        Sk.ffi.callback(opt_collectorFn)));
            });

    mod.sum = new Sk.builtin.func(function()
            {
                goog.asserts.fail("varargs");
            });

    mod.average = new Sk.builtin.func(function()
            {
                goog.asserts.fail("varargs");
            });

    mod.standardDeviation = new Sk.builtin.func(function()
            {
                goog.asserts.fail("varargs");
            });

    mod.isInt = new Sk.builtin.func(function(num)
            {
                return goog.math.isInt(num);
            });

    mod.isFiniteNumber = new Sk.builtin.func(function(num)
            {
                return goog.math.isFiniteNumber(num);
            });


    goog.require('goog.math.Coordinate');
    var coord = function($gbl, $loc)
    {
        $loc.__init__ = new Sk.builtin.func(function(self, opt_x, opt_y)
                {
                    self.v = new goog.math.Coordinate(opt_x, opt_y);
                });

        $loc.clone = new Sk.builtin.func(function(self)
                {
                    return Sk.ffi.stdwrap(mod.Coordinate, self.v.clone());
                });

        $loc.toString = new Sk.builtin.func(function(self)
                {
                    return new Sk.builtin.str(self.v.toString());
                });
        $loc.__repr__ = $loc.toString;

        $loc.equals = new Sk.builtin.func(function(a, b)
                {
                    return goog.math.Coordinate.equals(a.v, b.v);
                });

        $loc.distance = new Sk.builtin.func(function(a, b)
                {
                    return goog.math.Coordinate.distance(a.v, b.v);
                });

        $loc.squaredDistance = new Sk.builtin.func(function(a, b)
                {
                    return goog.math.Coordinate.squaredDistance(a.v, b.v);
                });

        $loc.difference = new Sk.builtin.func(function(a, b)
                {
                    return Sk.ffi.stdwrap(mod.Coordinate, goog.math.Coordinate.difference(a.v, b.v));
                });

        $loc.sum = new Sk.builtin.func(function(a, b)
                {
                    return Sk.ffi.stdwrap(mod.Coordinate, goog.math.Coordinate.sum(a.v, b.v));
                });


    };
    mod.Coordinate = Sk.misceval.buildClass(mod, coord, 'Coordinate', []);


    goog.require('goog.math.Vec2');
    var vec2 = function($gbl, $loc)
    {
        $loc.__init__ = new Sk.builtin.func(function(self, opt_x, opt_y)
                {
                    self.v = new goog.math.Vec2(opt_x, opt_y);
                });

        $loc.randomUnit = new Sk.builtin.func(function()
                {
                    return Sk.ffi.stdwrap(mod.Vec2, goog.math.Vec2.randomUnit());
                });

        $loc.random = new Sk.builtin.func(function()
                {
                    return Sk.ffi.stdwrap(mod.Vec2, goog.math.Vec2.random());
                });

        $loc.clone = new Sk.builtin.func(function(self)
                {
                    return new Sk.ffi.stdwrap(mod.Vec2, self.v.clone());
                });

        $loc.fromCoordinate = new Sk.builtin.func(function(a)
                {
                    return Sk.ffi.stdwrap(mod.Vec2, goog.math.Vec2.fromCoordinate(a.v));
                });

        $loc.magnitude = new Sk.builtin.func(function(self)
                {
                    return self.v.magnitude();
                });

        $loc.squaredMagnitude = new Sk.builtin.func(function(self)
                {
                    return self.v.squaredMagnitude();
                });

        $loc.scale = new Sk.builtin.func(function(self, s)
                {
                    self.v.scale(s);
                });

        $loc.invert = new Sk.builtin.func(function(self)
                {
                    self.v.invert();
                });

        $loc.normalize = new Sk.builtin.func(function(self)
                {
                    self.v.normalize();
                });

        $loc.add = new Sk.builtin.func(function(self, b)
                {
                    self.v.add(b.v);
                });

        $loc.subtract = new Sk.builtin.func(function(self, b)
                {
                    self.v.subtract(b.v);
                });

        $loc.equals = new Sk.builtin.func(function(self, b)
                {
                    return self.v.equals(b.v);
                });

        $loc.sum = new Sk.builtin.func(function(a, b)
                {
                    return Sk.ffi.stdwrap(mod.Vec2, goog.math.Vec2.sum(a.v, b.v));
                });

        $loc.difference = new Sk.builtin.func(function(a, b)
                {
                    return Sk.ffi.stdwrap(mod.Vec2, goog.math.Vec2.difference(a.v, b.v));
                });

        $loc.dot = new Sk.builtin.func(function(a, b)
                {
                    return goog.math.Vec2.dot(a.v, b.v);
                });

        $loc.lerp = new Sk.builtin.func(function(a, b, x)
                {
                    return Sk.ffi.stdwrap(mod.Vec2, goog.math.Vec2.lerp(a.v, b.v, x));
                });
    };
    mod.Vec2 = Sk.misceval.buildClass(mod, vec2, 'Vec2', [ mod.Coordinate ]);

    return mod;
};
