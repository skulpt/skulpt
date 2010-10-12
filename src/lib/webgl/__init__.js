var $builtinmodule = function(name)
{
    var mod = {};

    // todo; won't work compressed
    mod.tp$name = "webgl";

    mod.Context = Sk.misceval.buildClass(mod, function($gbl, $loc)
            {
                $loc.__init__ = new Sk.builtin.func(function(self, canvasid)
                    {
                        var canvas = document.getElementById(canvasid.v);
                        var gl = canvas.getContext("experimental-webgl");
                        if (!gl)
                            gl = canvas.getContext("webgl");
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

                        // set to cornflower so we know we're init'd at least
                        gl.clearColor(100/255.0,149/255.0,237/255.0,1)
                        gl.viewport(0, 0, canvas.width, canvas.height);
                        gl.clear(gl.COLOR_BUFFER_BIT);
                        gl.flush();
                    });

                $loc.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

                $loc.setDrawFunc = new Sk.builtin.func(function(self, func)
                        {
                            var startTime = (new Date()).getTime();
                            setTimeout(function() {
                                    Sk.misceval.call(func, undefined, self, (new Date()).getTime() - startTime);
                                    if (goog.global.shutdownGLContext)
                                    {
                                        console.log("Shutting down..");
                                        return;
                                    }
                                    setTimeout(arguments.callee, 1);
                                }, 1);
                                
                        });

                $loc.perspective = new Sk.builtin.func(function(self, fov, aspect, near, far)
                        {
                            
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
                                throw new Sk.builtin.SyntaxError("Error compiling vertex shader:" + gl.getShaderInfoLog(vs));
                            gl.attachShader(self.program, vs);
                            gl.deleteShader(vs);
                            
                            var fs = gl.createShader(gl.FRAGMENT_SHADER);
                            gl.shaderSource(fs, fragment.v);
                            gl.compileShader(fs);
                            if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
                                throw new Sk.builtin.SyntaxError("Error compiling fragment shader:" + gl.getShaderInfoLog(fs));
                            gl.attachShader(self.program, fs);
                            gl.deleteShader(fs);

                            gl.linkProgram(self.program);
                            gl.useProgram(self.program);

                            var re = /(uniform|attribute)\s+\S+\s+(\S+)\s*;/g;
                            var match = null;
                            while ((match = re.exec(vertex.v + "\n" + fragment.v)) != null)
                            {
                                var name = match[2];
                                var into = new Sk.builtin.str(name + "Loc");
                                var loc = null;
                                if (match[1] === "uniform")
                                    loc = gl.getUniformLocation(self.program, name);
                                else if (match[1] === "attribute")
                                    loc = gl.getAttribLocation(self.program, name);
                                self['$d'].mp$ass_subscript(into, loc);
                            }
                        });

                $loc.use = new Sk.builtin.func(function(self)
                        {
                            self.gl.useProgram(self.program);
                            /*
"""
function computeNormalMatrix(matrix, normal) {
    var e = matrix.elements;

    var det = (e[0 * 4 + 0] * (e[1 * 4 + 1] * e[2 * 4 + 2] -
                               e[2 * 4 + 1] * e[1 * 4 + 2]) -
               e[0 * 4 + 1] * (e[1 * 4 + 0] * e[2 * 4 + 2] -
                               e[1 * 4 + 2] * e[2 * 4 + 0]) +
               e[0 * 4 + 2] * (e[1 * 4 + 0] * e[2 * 4 + 1] -
                               e[1 * 4 + 1] * e[2 * 4 + 0]));
    var invDet = 1. / det;

    normal[0 * 3 + 0] = invDet * (e[1 * 4 + 1] * e[2 * 4 + 2] -
                                  e[2 * 4 + 1] * e[1 * 4 + 2]);
    normal[1 * 3 + 0] = invDet * -(e[0 * 4 + 1] * e[2 * 4 + 2] -
                                   e[0 * 4 + 2] * e[2 * 4 + 1]);
    normal[2 * 3 + 0] = invDet * (e[0 * 4 + 1] * e[1 * 4 + 2] -
                                  e[0 * 4 + 2] * e[1 * 4 + 1]);
    normal[0 * 3 + 1] = invDet * -(e[1 * 4 + 0] * e[2 * 4 + 2] -
                                   e[1 * 4 + 2] * e[2 * 4 + 0]);
    normal[1 * 3 + 1] = invDet * (e[0 * 4 + 0] * e[2 * 4 + 2] -
                                  e[0 * 4 + 2] * e[2 * 4 + 0]);
    normal[2 * 3 + 1] = invDet * -(e[0 * 4 + 0] * e[1 * 4 + 2] -
                                   e[1 * 4 + 0] * e[0 * 4 + 2]);
    normal[0 * 3 + 2] = invDet * (e[1 * 4 + 0] * e[2 * 4 + 1] -
                                  e[2 * 4 + 0] * e[1 * 4 + 1]);
    normal[1 * 3 + 2] = invDet * -(e[0 * 4 + 0] * e[2 * 4 + 1] -
                                   e[2 * 4 + 0] * e[0 * 4 + 1]);
    normal[2 * 3 + 2] = invDet * (e[0 * 4 + 0] * e[1 * 4 + 1] -
                                  e[1 * 4 + 0] * e[0 * 4 + 1]);

    return normal;
}
"""


if (this.mvpLoc != undefined) {
    // TODO(kwaters): hack
    mvp.loadIdentity();
    mvp.multiply(modelview);
    mvp.multiply(projection);
    gl.uniformMatrix4fv(this.mvpLoc, gl.FALSE, mvp.elements);
}

if (this.normalMatrixLoc !== undefined) {
    gl.uniformMatrix3fv(this.normalMatrixLoc, gl.FALSE, computeNormalMatrix(modelview, normalMatrix));
}
*/

                        });
            },
            'Shader', []);


    return mod;
};
