import sys
import webgl
import webgl.primitives
import webgl.models
import webgl.matrix4 as m4

def main():
    print "Starting up..."
    gl = webgl.Context("canvas")
    sh = webgl.Shader(gl, VertexShader, FragmentShader)
    sh.use()
    
    m = webgl.models.Model(sh, webgl.primitives.createCube(1), [])

    eyePos = webgl.Float32Array([0, 0, 3])
    target = webgl.Float32Array([0, 0, 0])
    up = webgl.Float32Array([0, 1, 0])

    view = webgl.Float32Array(16)
    world = webgl.Float32Array(16)
    view = webgl.Float32Array(16)
    viewproj = webgl.Float32Array(16)
    worldview = webgl.Float32Array(16)
    worldviewproj = webgl.Float32Array(16)
    proj = webgl.Float32Array(16)
    normalmat = webgl.Float32Array(16)
    tmp = webgl.Float32Array(16)

    gl.cullFace(gl.BACK)
    gl.depthFunc(gl.LEQUAL)

    m4.lookAt(view, eyePos, target, up)

    def draw(gl, time):
        gl.clearColor(0.1, 0.1, 0.2, 1)
        gl.clearDepth(1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        m4.perspective(proj, 60, 16.0/9.0, 0.1, 500);
        m4.rotationY(world, time * 0.05)
        m4.mul(viewproj, view, proj)
        m4.mul(worldview, world, view)
        m4.mul(worldviewproj, world, viewproj)

        m4.invert(normalmat, world)

        uniforms = {
            'u_worldviewproj': worldviewproj,
            'u_normalmat': normalmat,
        }
        m.drawPrep(uniforms)
        m.draw({})

    gl.setDrawFunc(draw)

VertexShader = """
uniform mat4 u_worldviewproj;
uniform mat4 u_normalmat;

attribute vec3 position;
attribute vec3 normal;

varying float v_dot;

void main()
{
    gl_Position = u_worldviewproj * vec4(position, 1);
    vec4 transNormal = u_normalmat * vec4(normal, 1);
    v_dot = max(dot(transNormal.xyz, normalize(vec3(0, 0, 1))), 0.0);
}
"""
 
FragmentShader = """
#ifdef GL_ES
    precision mediump float;
#endif

varying float v_dot;
 
void main()
{
    gl_FragColor = vec4(vec3(.8, 0, 0) * v_dot, 1);
}
"""
main()
