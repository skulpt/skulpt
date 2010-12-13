var $builtinmodule = function(name)
{
    var mod = {};

    // todo; won't work compressed
    mod.tp$name = "webgl";

    //
    // Setup code taken from 'tdl'. I tried to use more of it, but it's a bit
    // broken.
    //
    var makeFailHTML = function(msg) {
        return '' +
            '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
            '<td align="center">' +
            '<div style="display: table-cell; vertical-align: middle;">' +
            '<div style="">' + msg + '</div>' +
            '</div>' +
            '</td></tr></table>';
    };

    var GET_A_WEBGL_BROWSER = '' +
        'This page requires a browser that supports WebGL.<br/>' +
        '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

    var NEED_HARDWARE = '' +
        "It doesn't appear your computer can support WebGL.<br/>" +
        '<a href="http://get.webgl.org">Click here for more information.</a>';
  
    var create3DContext = function(canvas) {
        var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
        var context = null;
        for (var ii = 0; ii < names.length; ++ii) {
            try {
                context = canvas.getContext(names[ii]);
            } catch(e) {}
            if (context) {
                break;
            }
        }
        if (context) {
            // Disallow selection by default. This keeps the cursor from changing to an
            // I-beam when the user clicks and drags.  It's easier on the eyes.
            function returnFalse() {
                return false;
            }

            canvas.onselectstart = returnFalse;
            canvas.onmousedown = returnFalse;
        }
        return context;
    };

    var setupWebGL = function(canvasContainerId, opt_canvas) {
        var container = document.getElementById(canvasContainerId);
        var context;
        if (!opt_canvas) {
            opt_canvas = container.getElementsByTagName("canvas")[0];
        }
        if (!opt_canvas) {
            // this browser doesn't support the canvas tag at all. Not even 2d.
            container.innerHTML = makeFailHTML(
                    GET_A_WEBGL_BROWSER);
            return;
        }

        var context = create3DContext(opt_canvas);
        if (!context) {
            // TODO(gman): fix to official way to detect that it's the user's machine, not the browser.
            var browserStrings = navigator.userAgent.match(/(\w+\/.*? )/g);
            var browsers = {};
            try {
                for (var b = 0; b < browserStrings.length; ++b) {
                    var parts = browserStrings[b].match(/(\w+)/g);
                    var bb = [];
                    for (var ii = 1; ii < parts.length; ++ii) {
                        bb.push(parseInt(parts[ii]));
                    }
                    browsers[parts[0]] = bb;
                }
            } catch (e) {
            }
            if (browsers.Chrome &&
                    (browsers.Chrome[0] > 7 ||
                     (browsers.Chrome[0] == 7 && browsers.Chrome[1] > 0) ||
                     (browsers.Chrome[0] == 7 && browsers.Chrome[1] == 0 && browsers.Chrome[2] >= 521))) {
                container.innerHTML = makeFailHTML(
                        NEED_HARDWARE);
            } else {
                container.innerHTML = makeFailHTML(
                        GET_A_WEBGL_BROWSER);
            }
        }
        return context;
    };

    mod.Context = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self, canvasid)
                    {
                        var canvas = document.getElementById(canvasid.v);
                        // NB: purposefully leak this to global because
                        // everything wants it (esp. for constants it's a pain
                        // to have to pass it to utility functions)
                        /*var*/ gl = setupWebGL(canvasid.v, canvas)
                        if (!gl)
                            throw "couldn't get webgl context, unsupported browser?";

                        self.gl = gl;
                        // all (?) browsers that have webgl support
                        // __proto__ too so we cheese out and just rip
                        // them out of there rather than manually
                        // enumerating the entire webgl api. it wouldn't
                        // be too difficult to do it "properly", just
                        // long.
                        for (var k in gl.__proto__)
                        {
                            if (typeof gl.__proto__[k] === "number")
                            {
                                Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str(k), gl.__proto__[k]);
                            }
                            else if (typeof gl.__proto__[k] === "function")
                            {
                                (function(key) {
                                Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str(k), new Sk.builtin.func(function()
                                    {
                                        var f = gl.__proto__[key];
                                        // todo; assuming only basic
                                        // type returns?
                                        return f.apply(gl, arguments);
                                    }));
                                }(k));
                            }
                        }

                        console.log("gl initialized", gl, canvas, canvas.width, canvas.height);

                        // set to cornflower so we know we're init'd at least
                        gl.clearColor(100/255.0,149/255.0,237/255.0,1);
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                        gl.viewport(0, 0, canvas.width, canvas.height);
                        gl.clear(gl.COLOR_BUFFER_BIT);
                        gl.flush();
                    });

                $loc.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

                $loc.setDrawFunc = new Sk.builtin.func(function(self, func)
                        {
                            var startTime = (new Date()).getTime();
                            var intervalId = setInterval(function() {
                                    Sk.misceval.callsim(func, self, (new Date()).getTime() - startTime);
                                    if (goog.global.shutdownGLContext)
                                    {
                                        clearInterval(intervalId);
                                        console.log("gl draw function shutting down");
                                        return;
                                    }
                                }, 1000.0 / 60.0);
                                
                        });
            },
            'Context', []);

    mod.Shader = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self, gl, vertex, fragment)
                        {
                            self.gl = gl.gl;
                            var gl = self.gl;
                            self.program = gl.createProgram();
                            var vs = gl.createShader(gl.VERTEX_SHADER);
                            gl.shaderSource(vs, vertex.v);
                            gl.compileShader(vs);
                            if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
                            {
                                console.log(gl.getShaderInfoLog(vs));
                                throw new Sk.builtin.SyntaxError("Error compiling vertex shader:" + gl.getShaderInfoLog(vs));
                            }
                            gl.attachShader(self.program, vs);
                            gl.deleteShader(vs);
                            
                            var fs = gl.createShader(gl.FRAGMENT_SHADER);
                            gl.shaderSource(fs, fragment.v);
                            gl.compileShader(fs);
                            if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
                            {
                                console.log(gl.getShaderInfoLog(fs));
                                throw new Sk.builtin.SyntaxError("Error compiling fragment shader:" + gl.getShaderInfoLog(fs));
                            }
                            gl.attachShader(self.program, fs);
                            gl.deleteShader(fs);

                            gl.linkProgram(self.program);
                            gl.useProgram(self.program);


                            //
                            //
                            // Some more init code from 'tdl' (slightly
                            // tweaked)
                            //
                            //

                            var endsWith = function(haystack, needle) {
                                return haystack.substr(haystack.length - needle.length) === needle;
                            };

                            // Look up attribs.
                            var attribs = {
                            };
                            // Also make a plain table of the locs.
                            var attribLocs = {
                            };

                            function createAttribSetter(info, index) {
                                if (info.size != 1) {
                                    throw("arrays of attribs not handled");
                                }
                                return function(b) {
                                    gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer());
                                    gl.enableVertexAttribArray(index);
                                    gl.vertexAttribPointer(
                                            index, b.numComponents(), b.type(), false, b.stride(), b.offset());
                                };
                            }

                            var numAttribs = gl.getProgramParameter(self.program, gl.ACTIVE_ATTRIBUTES);
                            for (var ii = 0; ii < numAttribs; ++ii) {
                                var info = gl.getActiveAttrib(self.program, ii);
                                name = info.name;
                                if (endsWith(name, "[0]")) {
                                    name = name.substr(0, name.length - 3);
                                }
                                var index = gl.getAttribLocation(self.program, info.name);
                                attribs[name] = createAttribSetter(info, index);
                                attribLocs[name] = index
                            }

                            // Look up uniforms
                            var numUniforms = gl.getProgramParameter(self.program, gl.ACTIVE_UNIFORMS);
                            var uniforms = {
                            };

                            function createUniformSetter(info) {
                                var loc = gl.getUniformLocation(self.program, info.name);
                                var type = info.type;
                                if (info.size > 1 && endsWith(info.name, "[0]")) {
                                    // It's an array.
                                    if (type == gl.FLOAT)
                                        return function(v) { gl.uniform1fv(loc, v); };
                                    if (type == gl.FLOAT_VEC2)
                                        return function(v) { gl.uniform2fv(loc, v); };
                                    if (type == gl.FLOAT_VEC3)
                                        return function(v) { gl.uniform3fv(loc, v); };
                                    if (type == gl.FLOAT_VEC4)
                                        return function(v) { gl.uniform4fv(loc, v); };
                                    if (type == gl.INT)
                                        return function(v) { gl.uniform1iv(loc, v); };
                                    if (type == gl.INT_VEC2)
                                        return function(v) { gl.uniform2iv(loc, v); };
                                    if (type == gl.INT_VEC3)
                                        return function(v) { gl.uniform3iv(loc, v); };
                                    if (type == gl.INT_VEC4)
                                        return function(v) { gl.uniform4iv(loc, v); };
                                    if (type == gl.BOOL)
                                        return function(v) { gl.uniform1iv(loc, v); };
                                    if (type == gl.BOOL_VEC2)
                                        return function(v) { gl.uniform2iv(loc, v); };
                                    if (type == gl.BOOL_VEC3)
                                        return function(v) { gl.uniform3iv(loc, v); };
                                    if (type == gl.BOOL_VEC4)
                                        return function(v) { gl.uniform4iv(loc, v); };
                                    if (type == gl.FLOAT_MAT2)
                                        return function(v) { gl.uniformMatrix2fv(loc, false, v); };
                                    if (type == gl.FLOAT_MAT3)
                                        return function(v) { gl.uniformMatrix3fv(loc, false, v); };
                                    if (type == gl.FLOAT_MAT4)
                                        return function(v) { gl.uniformMatrix4fv(loc, false, v); };
                                    if (type == gl.SAMPLER_2D)
                                        return function(v) { gl.uniform1iv(loc, v); };
                                    if (type == gl.SAMPLER_CUBE_MAP)
                                        return function(v) { gl.uniform1iv(loc, v); };
                                    throw ("unknown type: 0x" + type.toString(16));
                                } else {
                                    if (type == gl.FLOAT)
                                        return function(v) { gl.uniform1f(loc, v); };
                                    if (type == gl.FLOAT_VEC2)
                                        return function(v) { gl.uniform2fv(loc, v); };
                                    if (type == gl.FLOAT_VEC3)
                                        return function(v) { gl.uniform3fv(loc, v); };
                                    if (type == gl.FLOAT_VEC4)
                                        return function(v) { gl.uniform4fv(loc, v); };
                                    if (type == gl.INT)
                                        return function(v) { gl.uniform1i(loc, v); };
                                    if (type == gl.INT_VEC2)
                                        return function(v) { gl.uniform2iv(loc, v); };
                                    if (type == gl.INT_VEC3)
                                        return function(v) { gl.uniform3iv(loc, v); };
                                    if (type == gl.INT_VEC4)
                                        return function(v) { gl.uniform4iv(loc, v); };
                                    if (type == gl.BOOL)
                                        return function(v) { gl.uniform1i(loc, v); };
                                    if (type == gl.BOOL_VEC2)
                                        return function(v) { gl.uniform2iv(loc, v); };
                                    if (type == gl.BOOL_VEC3)
                                        return function(v) { gl.uniform3iv(loc, v); };
                                    if (type == gl.BOOL_VEC4)
                                        return function(v) { gl.uniform4iv(loc, v); };
                                    if (type == gl.FLOAT_MAT2)
                                        return function(v) { gl.uniformMatrix2fv(loc, false, v); };
                                    if (type == gl.FLOAT_MAT3)
                                        return function(v) { gl.uniformMatrix3fv(loc, false, v); };
                                    if (type == gl.FLOAT_MAT4)
                                        return function(v) { gl.uniformMatrix4fv(loc, false, v); };
                                    if (type == gl.SAMPLER_2D)
                                        return function(v) { gl.uniform1i(loc, v); };
                                    if (type == gl.SAMPLER_CUBE)
                                        return function(v) { gl.uniform1i(loc, v); };
                                    throw ("unknown type: 0x" + type.toString(16));
                                }
                            }

                            for (var ii = 0; ii < numUniforms; ++ii) {
                                var info = gl.getActiveUniform(self.program, ii);
                                name = info.name;
                                if (endsWith(name, "[0]")) {
                                    name = name.substr(0, name.length - 3);
                                }
                                uniforms[name] = createUniformSetter(info);
                            }

                            self.attrib = attribs;
                            self.attribLoc = attribLocs;
                            self.uniform = uniforms;
                        });

                $loc.setUniform = new Sk.builtin.func(function(self, uniform, value)
                        {
                            var func = self.uniform[uniform.v];
                            if (func)
                            {
                                //console.log("SET UNI:", uniform.v, value);
                                func(Sk.ffi.remapToJs(value));
                            }
                        });

                $loc.setUniform$impl = function(self, uniform, value)
                        {
                            var func = self.uniform[uniform];
                            if (func)
                            {
                                //console.log("SET UNI:", uniform, value);
                                func(value);
                            }
                        };

                $loc.use = new Sk.builtin.func(function(self)
                        {
                            self.gl.useProgram(self.program);
                        });
            },
            'Shader', []);


    mod.Float32Array = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self, data)
                        {
                            if (typeof data === "number")
                                self.v = new Float32Array(data);
                            else
                                self.v = new Float32Array(Sk.ffi.remapToJs(data));
                        });

                $loc.__repr__ = new Sk.builtin.func(function(self)
                    {
                        var copy = [];
                        for (var i = 0; i < self.v.length; ++i)
                            copy.push(self.v[i]);
                        return new Sk.builtin.str("["+copy.join(', ')+"]");
                    });

            },
            'Float32Array', []);


    return mod;
};
