// most of this file is from/based on 'tdl'

var $builtinmodule = function(name)
{
    var mod = {};

    var Buffer = function(array, opt_target) {
        var target = opt_target || gl.ARRAY_BUFFER;
        var buf = gl.createBuffer();
        this.target = target;
        this.buf = buf;
        this.set(array);
        this.numComponents_ = array.numComponents;
        this.numElements_ = array.numElements;
        this.totalComponents_ = this.numComponents_ * this.numElements_;
        if (array.buffer instanceof Float32Array) {
            this.type_ = gl.FLOAT;
        } else if (array.buffer instanceof Uint8Array) {
            this.type_ = gl.UNSIGNED_BYTE;
        } else if (array.buffer instanceof Int8Array) {
            this.type_ = gl._BYTE;
        } else if (array.buffer instanceof Uint16Array) {
            this.type_ = gl.UNSIGNED_SHORT;
        } else if (array.buffer instanceof Int16Array) {
            this.type_ = gl.SHORT;
        } else {
            throw("unhandled type:" + (typeof array.buffer));
        }
    };

    Buffer.prototype.set = function(array) {
        gl.bindBuffer(this.target, this.buf);
        gl.bufferData(this.target, array.buffer, gl.STATIC_DRAW);
    }

    Buffer.prototype.type = function() {
        return this.type_;
    };

    Buffer.prototype.numComponents = function() {
        return this.numComponents_;
    };

    Buffer.prototype.numElements = function() {
        return this.numElements_;
    };

    Buffer.prototype.totalComponents = function() {
        return this.totalComponents_;
    };

    Buffer.prototype.buffer = function() {
        return this.buf;
    };

    Buffer.prototype.stride = function() {
        return 0;
    };

    Buffer.prototype.offset = function() {
        return 0;
    };



    mod.Model = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self, shader, arrays, textures)
                    {
                        self.buffers = {};
                        var setBuffer = function(name, array)
                        {
                            var target = (name == 'indices') ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
                            b = self.buffers[name];
                            if (!b)
                                b = new Buffer(array, target);
                            else
                                b.set(array);
                            self.buffers[name] = b;
                        };
                        for (name in arrays)
                            setBuffer(name, arrays[name]);

                        var textureUnits = {};
                        var unit = 0;
                        for (var texture in textures)
                        {
                            textureUnits[texture] = unit++;
                        }

                        self.mode = gl.TRIANGLES;
                        self.textures = textures.v;
                        self.textureUnits = textureUnits;
                        self.shader = shader;
                    });

                /**
                * Sets up the shared parts of drawing this model. Uses the
                * program, binds the buffers, sets the textures.
                *
                * @param {!Object.<string, *>} uniforms An object of names to
                *     values to set on this models uniforms.
                */
                $loc.drawPrep = new Sk.builtin.func(function(self, uniforms)
                    {
                        var shader = self.shader;
                        var buffers = self.buffers;
                        var textures = self.textures;

                        uniforms = Sk.ffi.remapToJs(uniforms);

                        Sk.misceval.callsim(shader.use, shader);

                        for (var buffer in buffers) {
                            var b = buffers[buffer];
                            if (buffer == 'indices') {
                                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.buffer());
                            } else {
                                var attrib = shader.attrib[buffer];
                                if (attrib) {
                                    attrib(b);
                                }
                            }
                        }

                        for (var texture in textures) {
                            var unit = self.textureUnits[texture];
                            shader.setUniform$impl(shader, textuer, unit);
                            textures[texture].bindToUnit(unit);
                        }

                        for (var uniform in uniforms) {
                            shader.setUniform$impl(shader, uniform, uniforms[uniform]);
                        }
                    });

                /**
                * Draws this model.
                *
                * After calling tdl.models.Model.drawPrep you can call this
                * function multiple times to draw this model.
                *
                * @param {!Object.<string, *>} uniforms An object of names to
                *     values to set on this models uniforms.
                */
                $loc.draw = new Sk.builtin.func(function(self, uniforms, opt_textures)
                    {
                        var shader = self.shader;
                        uniforms = Sk.ffi.remapToJs(uniforms);
                        for (uniform in uniforms) {
                            shader.setUniform$impl(shader, uniform, uniforms[uniform]);
                        }

                        if (opt_textures) {
                            for (var texture in opt_textures) {
                                var unit = self.textureUnits[texture];
                                shader.setUniform$impl(shader, texture, unit);
                                opt_textures[texture].bindToUnit(unit);
                            }
                        }

                        var buffers = self.buffers;
                        gl.drawElements(self.mode, buffers.indices.totalComponents(), gl.UNSIGNED_SHORT, 0);
                    });
            },
            'Model', []);

    return mod;
};
