var $builtinmodule = function(name)
{
    var mod = {};

    // todo; should probably put this in a math package
    mod.Mat44 = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self)
                    {
                        Sk.misceval.callsim($loc.loadIdentity, self);
                        self.stack = [];
                    });

                $loc.push = new Sk.builtin.func(function(self)
                    {
                        self.stack.push(self.elements.slice(0));
                    });

                $loc.pop = new Sk.builtin.func(function(self)
                    {
                        self.elements = self.stack.pop();
                    });

                $loc.loadIdentity = new Sk.builtin.func(function(self)
                    {
                        self.elements = [1.0, 0.0, 0.0, 0.0,
                                         0.0, 1.0, 0.0, 0.0,
                                         0.0, 0.0, 1.0, 0.0,
                                         0.0, 0.0, 0.0, 1.0];
                    });

                $loc.transform3 = new Sk.builtin.func(function(self, v)
                    {
                        var e = self.elements;
                        return Sk.misceval.callsim(mod.Vec3,
                            e[0] * v.x + e[4] * v.y + e[8] * v.z,
                            e[1] * v.x + e[5] * v.y + e[9] * v.z,
                            e[2] * v.x + e[6] * v.y + e[10] * v.z);
                    });

                $loc.scale = new Sk.builtin.func(function(self, sx, sy, sz)
                        {
                            self.elements[0*4+0] *= sx;
                            self.elements[0*4+1] *= sx;
                            self.elements[0*4+2] *= sx;
                            self.elements[0*4+3] *= sx;

                            self.elements[1*4+0] *= sy;
                            self.elements[1*4+1] *= sy;
                            self.elements[1*4+2] *= sy;
                            self.elements[1*4+3] *= sy;

                            self.elements[2*4+0] *= sz;
                            self.elements[2*4+1] *= sz;
                            self.elements[2*4+2] *= sz;
                            self.elements[2*4+3] *= sz;

                            return self;
                        });

                $loc.translate = new Sk.builtin.func(function(self, tx, ty, tz)
                        {
                            self.elements[3*4+0] += self.elements[0*4+0] * tx + self.elements[1*4+0] * ty + self.elements[2*4+0] * tz;
                            self.elements[3*4+1] += self.elements[0*4+1] * tx + self.elements[1*4+1] * ty + self.elements[2*4+1] * tz;
                            self.elements[3*4+2] += self.elements[0*4+2] * tx + self.elements[1*4+2] * ty + self.elements[2*4+2] * tz;
                            self.elements[3*4+3] += self.elements[0*4+3] * tx + self.elements[1*4+3] * ty + self.elements[2*4+3] * tz;
                            return self;
                        });

                $loc.rotate = new Sk.builtin.func(function(self, angle, x, y, z)
                        {
                            var mag = Math.sqrt(x*x + y*y + z*z);
                            var sinAngle = Math.sin(angle * Math.PI / 180.0);
                            var cosAngle = Math.cos(angle * Math.PI / 180.0);

                            if (mag > 0)
                            {
                                var xx, yy, zz, xy, yz, zx, xs, ys, zs;
                                var oneMinusCos;
                                var rotMat;

                                x /= mag;
                                y /= mag;
                                z /= mag;

                                xx = x * x;
                                yy = y * y;
                                zz = z * z;
                                xy = x * y;
                                yz = y * z;
                                zx = z * x;
                                xs = x * sinAngle;
                                ys = y * sinAngle;
                                zs = z * sinAngle;
                                oneMinusCos = 1.0 - cosAngle;

                                rotMat = Sk.misceval.callsim(mod.Mat44);

                                rotMat.elements[0*4+0] = (oneMinusCos * xx) + cosAngle;
                                rotMat.elements[0*4+1] = (oneMinusCos * xy) - zs;
                                rotMat.elements[0*4+2] = (oneMinusCos * zx) + ys;
                                rotMat.elements[0*4+3] = 0.0;

                                rotMat.elements[1*4+0] = (oneMinusCos * xy) + zs;
                                rotMat.elements[1*4+1] = (oneMinusCos * yy) + cosAngle;
                                rotMat.elements[1*4+2] = (oneMinusCos * yz) - xs;
                                rotMat.elements[1*4+3] = 0.0;

                                rotMat.elements[2*4+0] = (oneMinusCos * zx) - ys;
                                rotMat.elements[2*4+1] = (oneMinusCos * yz) + xs;
                                rotMat.elements[2*4+2] = (oneMinusCos * zz) + cosAngle;
                                rotMat.elements[2*4+3] = 0.0;

                                rotMat.elements[3*4+0] = 0.0;
                                rotMat.elements[3*4+1] = 0.0;
                                rotMat.elements[3*4+2] = 0.0;
                                rotMat.elements[3*4+3] = 1.0;

                                rotMat = rotMat.multiply(self);
                                self.elements = rotMat.elements;
                            }
                            return self;
                        });

                $loc.multiply = new Sk.builtin.func(function(self, right)
                        {
                            var tmp = Sk.misceval.callsim(mod.Mat44);

                            for (var i = 0; i < 4; i++)
                            {
                                tmp.elements[i*4+0] =
                                (self.elements[i*4+0] * right.elements[0*4+0]) +
                                (self.elements[i*4+1] * right.elements[1*4+0]) +
                                (self.elements[i*4+2] * right.elements[2*4+0]) +
                                (self.elements[i*4+3] * right.elements[3*4+0]) ;

                                tmp.elements[i*4+1] =
                                (self.elements[i*4+0] * right.elements[0*4+1]) +
                                (self.elements[i*4+1] * right.elements[1*4+1]) +
                                (self.elements[i*4+2] * right.elements[2*4+1]) +
                                (self.elements[i*4+3] * right.elements[3*4+1]) ;

                                tmp.elements[i*4+2] =
                                (self.elements[i*4+0] * right.elements[0*4+2]) +
                                (self.elements[i*4+1] * right.elements[1*4+2]) +
                                (self.elements[i*4+2] * right.elements[2*4+2]) +
                                (self.elements[i*4+3] * right.elements[3*4+2]) ;

                                tmp.elements[i*4+3] =
                                (self.elements[i*4+0] * right.elements[0*4+3]) +
                                (self.elements[i*4+1] * right.elements[1*4+3]) +
                                (self.elements[i*4+2] * right.elements[2*4+3]) +
                                (self.elements[i*4+3] * right.elements[3*4+3]) ;
                            }

                            self.elements = tmp.elements;
                            return self;
                        });

                /* Following gluLookAt implementation is adapted from
                 * the Mesa 3D Graphics library. http://www.mesa3d.org
                 */
                // todo; rewrite this with proper vec/mat ops
                $loc.lookAt = new Sk.builtin.func(function(self, eyeX, eyeY, eyeZ,
                                                                 centerX, centerY, centerZ,
                                                                 upX, upY, upZ)
                        {
                            /* Z vector */
                            var z = [
                                eyeX - centerX,
                                eyeY - centerY,
                                eyeZ - centerZ
                            ];
                            var mag = Math.sqrt(z[0] * z[0] + z[1] * z[1] + z[2] * z[2]);
                            if (mag)
                            {
                                z[0] /= mag;
                                z[1] /= mag;
                                z[2] /= mag;
                            }

                            /* Y vector */
                            var y = [ upX, upY, upZ ];

                            /* X vector = Y cross Z */
                            var x = [];
                            x[0] = y[1] * z[2] - y[2] * z[1];
                            x[1] = -y[0] * z[2] + y[2] * z[0];
                            x[2] = y[0] * z[1] - y[1] * z[0];

                            /* Recompute Y = Z cross X */
                            y[0] = z[1] * x[2] - z[2] * x[1];
                            y[1] = -z[0] * x[2] + z[2] * x[0];
                            y[2] = z[0] * x[1] - z[1] * x[0];

                            /* mpichler, 19950515 */
                            /* cross product gives area of parallelogram, which is < 1.0 for
                            * non-perpendicular unit-length vectors; so normalize x, y here
                            */

                            mag = Math.sqrt(x[0] * x[0] + x[1] * x[1] + x[2] * x[2]);
                            if (mag) {
                                x[0] /= mag;
                                x[1] /= mag;
                                x[2] /= mag;
                            }

                            mag = Math.sqrt(y[0] * y[0] + y[1] * y[1] + y[2] * y[2]);
                            if (mag) {
                                y[0] /= mag;
                                y[1] /= mag;
                                y[2] /= mag;
                            }

                            var lookAt = Sk.misceval.callsim(mod.Mat44);
                            lookAt.elements[0 * 4 + 0] = x[0];
                            lookAt.elements[1 * 4 + 0] = x[1];
                            lookAt.elements[2 * 4 + 0] = x[2];
                            lookAt.elements[3 * 4 + 0] = 0.;
                            lookAt.elements[0 * 4 + 1] = y[0];
                            lookAt.elements[1 * 4 + 1] = y[1];
                            lookAt.elements[2 * 4 + 1] = y[2];
                            lookAt.elements[3 * 4 + 1] = 0.;
                            lookAt.elements[0 * 4 + 2] = z[0];
                            lookAt.elements[1 * 4 + 2] = z[1];
                            lookAt.elements[2 * 4 + 2] = z[2];
                            lookAt.elements[3 * 4 + 2] = 0.;
                            lookAt.elements[0 * 4 + 3] = 0.;
                            lookAt.elements[1 * 4 + 3] = 0.;
                            lookAt.elements[2 * 4 + 3] = 0.;
                            lookAt.elements[3 * 4 + 3] = 1.;

                            // log(lookAt.elements);

                            lookAt = lookAt.multiply(self);
                            self.elements = lookAt.elements;
                            self.translate(-eyeX, -eyeY, -eyeZ);

                            // log(this.elements);

                            return self;
                        });
            },
            'Mat44', []);

    // todo; should probably put this in a math package
    mod.Mat33 = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self)
                    {
                        Sk.misceval.callsim($loc.loadIdentity, self);
                    });

                $loc.loadIdentity = new Sk.builtin.func(function(self)
                    {
                        self.elements = [1.0, 0.0, 0.0,
                                         0.0, 1.0, 0.0,
                                         0.0, 0.0, 1.0];
                    });
            },
            'Mat33', []);

    mod.Vec3 = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self, x, y, z)
                    {
                        self.x = x;
                        self.y = y;
                        self.z = z;
                    });
                $loc.__sub__ = new Sk.builtin.func(function(self, other)
                    {
                        return Sk.misceval.callsim(mod.Vec3, self.x - other.x, self.y - other.y, self.z - other.z);
                    });
            },
            'Vec3', []);
    
    mod.cross = new Sk.builtin.func(function(v1, v2)
            {
                goog.asserts.assert(v1 instanceof mod.Vec3 && v2 instanceof mod.Vec3);
                return Sk.misceval.callsim(mod.Vec3,
                    v1.y * v2.z - v1.z * v2.y,
                    v1.z * v2.x - v1.x * v2.z,
                    v1.x * v2.y - v1.y * v2.x);
            });

    return mod;
};
